# m19-orcid-employments — Implementation v1

- **measure:** M19
- **name:** ORCID employment + education record lookup
- **modes:** D, A
- **summary:** Resolve the customer to an ORCID iD (collected at order time, or matched by name + institution via the ORCID search API), fetch their `/employments` and `/educations` records, and verify that the customer's claimed current employer appears as a current employment. Distinguish institution-verified affiliations (strong positive signal) from self-asserted ones (weak signal).

## external_dependencies

- **ORCID Public API v3.0** (orcid.org, US 501(c)(3)). Free for any use including commercial. [source](https://info.orcid.org/documentation/api-tutorials/api-tutorial-read-data-on-a-record/)
- **Optional: ORCID Member API** for organizations that want to *write* affiliation assertions back to records (out of scope for read-only KYC, but relevant if the provider also wants to assert "verified DNA-synthesis-customer" affiliations).

## endpoint_details

- **Base URL (Public API):** `https://pub.orcid.org/v3.0/` [source](https://github.com/ORCID/ORCID-Source/blob/main/orcid-api-web/README.md)
- **Read employments:** `GET https://pub.orcid.org/v3.0/{ORCID-iD}/employments`
- **Read educations:** `GET https://pub.orcid.org/v3.0/{ORCID-iD}/educations`
- **Read full record:** `GET https://pub.orcid.org/v3.0/{ORCID-iD}/record`
- **Search by name + affiliation:** `GET https://pub.orcid.org/v3.0/expanded-search/?q=given-names:Jane+AND+family-name:Doe+AND+affiliation-org-name:%22Stanford+University%22`
- **Auth model:** anonymous queries are allowed but rate-limited; production usage requires a free Public API client credential (register an ORCID account → developer tools → get OAuth client ID + secret → request a `/read-public` token via client_credentials grant). [source](https://info.orcid.org/documentation/api-tutorials/api-tutorial-read-data-on-a-record/) [source](https://orcid.github.io/orcid-api-tutorial/get/)
- **Rate limits:** ORCID enforces requests-per-second + burst limits, with 503 on burst overflow and quota blocks on sustained excess. [vendor-gated — exact numeric thresholds for the public read tier are documented at https://info.orcid.org/ufaqs/what-are-the-api-limits/ but specific RPS numbers were not extracted; client-credential tier is higher than anonymous](https://info.orcid.org/ufaqs/what-are-the-api-limits/)
- **Pricing:** Public API is free. [source](https://info.orcid.org/membership/) [best guess: KYC use is well within "fair use" and ORCID has not historically blocked legitimate read-only research/integration use]
- **ToS constraints:** ORCID public data is CC0; researcher records may include privacy-restricted fields (only "public" visibility records are returned by the public API). Use of personal data is subject to ORCID's privacy policy and the researcher's chosen visibility settings. [source](https://info.orcid.org/the-orcid-public-data-file/)

## fields_returned

For `/employments` (each `affiliation-group/summaries/employment-summary`) [source](https://github.com/ORCID/ORCID-Source/blob/main/orcid-api-web/tutorial/affiliations.md):

- `organization.name`, `organization.address.city/region/country`
- `organization.disambiguated-organization`: contains `disambiguated-organization-identifier` and `disambiguation-source` (RINGGOLD, ROR, GRID, FUNDREF, LEI) — this is the key field distinguishing institution-verified from self-asserted, when source is the institution itself
- `department-name`, `role-title`
- `start-date`, `end-date` (end-date null = current)
- `source.source-name` and `source.source-client-id` — if `source-client-id` is the institution's own ORCID member client, the affiliation is institution-asserted; if it's the user, it's self-asserted
- `put-code`, `created-date`, `last-modified-date`, `visibility`
- `url` (institution profile link), `external-ids` (e.g., HR ID)

Same structure for `/educations`.

## marginal_cost_per_check

- **Direct API cost:** $0. ORCID Public API is free for read-public access. [source](https://info.orcid.org/membership/)
- **Per-customer call count:** 1 search call (if no ORCID iD on file) + 1 record fetch = 2 calls.
- **setup_cost:** OAuth client registration is free; ~1 engineer-day to wire up the client_credentials flow and parse the affiliation XML/JSON. [best guess: ~$2k–$5k of engineering for production integration including the source-client-id parsing logic that distinguishes self-asserted from institution-verified]

## manual_review_handoff

When a flag fires, the reviewer packet contains:
1. The customer's claimed name, ORCID iD (if collected), and claimed institution.
2. The full ORCID record fetch (employments + educations).
3. For each employment: `source` (self vs institution), `start/end-date`, `organization.disambiguated-organization-identifier` (with disambiguation source).
4. The match logic output: claim-vs-record diff and confidence score.

**Reviewer playbook:**
1. **Strong positive:** an institution-asserted current employment at the claimed institution with `source-client-id` belonging to that institution → mark `orcid-institution-verified`, proceed.
2. **Weak positive:** a self-asserted current employment at the claimed institution → not sufficient alone; require corroboration from `m19-openalex-author`, `m02-ror-domain-match`, or institutional email.
3. **No record / no current employment / mismatch:** route to enrichment (`m02`, `m18`) and follow up with the customer for documentation (institutional email confirmation, supervisor letter).
4. **Recently-created ORCID with no other signals (`orcid_recent`):** treat as suspicious — record created within the last 60 days with only the claimed employer asserted by the user themselves is consistent with the `it-persona-manufacturing` attacker pattern. Escalate.
5. Persist the selected ORCID iD in the customer record.

## flags_thrown

- `orcid_no_record` — no ORCID matched by name + institution → enrichment, not denial.
- `orcid_employer_mismatch` — record exists but no current employment at the claimed institution.
- `orcid_self_asserted_only` — claimed institution present but only as a self-asserted employment (i.e., `source-client-id` is the user, not the institution) → weak signal, require corroboration.
- `orcid_recent` — record `created-date` within the last 60 days, claimed employment is the only entry, no publications linked → high suspicion of manufactured persona.

## failure_modes_requiring_review

- ORCID record exists but is sparse (very common — only ~2% of records have institution-verified affiliations as of August 2023). [source](https://info.orcid.org/a-closer-look-at-orcids-affinity-for-affiliations/)
- Researcher has multiple ORCID iDs (rare but happens; ORCID flags duplicates).
- Name disambiguation: search by name returns multiple candidates → reviewer picks.
- Privacy-restricted records: ORCID record exists but visibility is "trusted parties" or "private" → public API returns nothing; cannot distinguish from "no record."
- API errors / 503 burst overflow → retry with exponential backoff.

## false_positive_qualitative

- **The 98% of ORCID record holders without institution-verified affiliations.** Per ORCID's own August 2023 statement, only ~2% of records have an affiliation added by an organization. [source](https://info.orcid.org/a-closer-look-at-orcids-affinity-for-affiliations/) The strict "institution-verified-only" check would false-positive on the vast majority of legitimate researchers.
- **Researchers without an ORCID at all.** ORCID adoption varies wildly by field, country, and career stage. [best guess: in the US life-sciences PI population, ORCID coverage is high (60–80%); among lab staff, technicians, BSOs, and industry scientists it is much lower (20–40%); in regions with low institutional ORCID-integration push, 10–30%]
- **Researchers who recently moved jobs** and haven't updated ORCID (purely self-managed; no automatic update from HR).
- **Researchers in industry / clinical / non-publishing roles** with empty or minimal ORCID records.
- **Privacy-conscious researchers** who set affiliations to "trusted parties only."

## record_left

For each check, persist:
- The full ORCID JSON (or XML) record fetched.
- The query used (name + institution search, or direct iD lookup).
- The selected `put-code`(s) for the matched employment.
- For each employment: `source-client-id` and `disambiguation-source` (the auditable distinction between self-asserted and institution-verified).
- Timestamp of the fetch.

The ORCID iD itself is a stable, citable, public identifier — strong audit value.

## attacker_stories_addressed (refined)

- `it-persona-manufacturing` — partial: catches the persona only if the attacker hasn't yet had the host institution assert the employment in ORCID. Most institutions don't do this, so an attacker who self-asserts a real-but-recently-acquired affiliation will pass the weak check; the strong check (`orcid-institution-verified`) catches them only at the ~2% of institutions that push HR data into ORCID.
- `gradual-legitimacy-accumulation` — partial: a long-cultivated ORCID with multiple self-asserted affiliations and a thin publication trail will pass `orcid_no_record` and `orcid_employer_mismatch` but should still trip `orcid_self_asserted_only`.
- `ghost-author` — minimal: ORCID does not bind to a publication footprint; the attacker can have a populated ORCID with no works.

[best guess: this check is best used as a gate that *upgrades* a customer's confidence level when an institution-verified affiliation is present, rather than as a *denial* gate when one is absent — the 2% coverage statistic makes denial-on-absence untenable]
