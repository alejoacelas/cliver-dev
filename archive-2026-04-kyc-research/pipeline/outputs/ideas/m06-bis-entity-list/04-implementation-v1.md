# m06-bis-entity-list — implementation research v1

- **measure:** M06 — shipping-export-country (consignee leg)
- **name:** BIS Entity List + DPL + UVL + MEU consignee screen
- **modes:** D (deterministic name match against published lists)
- **summary:** Screen the consignee organization, end-user, and any named principals on the shipping address against the four BIS restricted-party lists (Entity List, Denied Persons List, Unverified List, Military End-User List). Implementation: query the [ITA Consolidated Screening List API](https://developer.export.gov/consolidated-screening-list.html) with `sources=EL,DPL,UVL,MEU` filter and `fuzzy_name=true`. Hard-block on Entity List or DPL hit; escalate UVL hits for additional due diligence (UVL is a "verify before shipping" status, not a deny); escalate MEU hits if the synthesis item is on the MEU-controlled item list.

- **attacker_stories_addressed:** foreign-institution (re-export consignee), and any attacker who routes through a known restricted party

## external_dependencies

- [ITA Consolidated Screening List API](https://developer.export.gov/consolidated-screening-list.html) — federal API hosted by the International Trade Administration, aggregating 11 lists (BIS Entity List, BIS Denied Persons, BIS Unverified List, BIS Military End-User, Treasury OFAC SDN + non-SDN consolidated lists, State ITAR debarments, etc.).
- [BIS Entity List source CSV](https://www.bis.gov/regulations/ear/part-744/supplement-no-4-part-744) and the Federal Register publication stream — fallback if the API is down.
- [Consolidated Screening List landing page](https://www.trade.gov/consolidated-screening-list).
- ITA developer key (free).

## endpoint_details

- **Base URL:** `https://api.trade.gov/consolidated_screening_list/search`
- **Auth:** API key (`api_key=` query param). Free; obtain from [ITA developer portal](https://developer.trade.gov).
- **Method:** GET.
- **Key params:**
  - `q=<name>` — search term
  - `sources=EL,DPL,UVL,MEU` — restrict to the four BIS lists (alternatively `SDN`, `ISN`, etc. for OFAC; this idea is BIS-scoped, sister idea m08-bis-entity-csl handles OFAC)
  - `fuzzy_name=true` — enables fuzzy matching with score
  - `countries=<ISO-2>` — filter by listed country
  - `address=`, `type=Entity|Individual`
- **Update frequency:** ITA imports each source list once per hour; lag up to 1 hour from upstream publication. [source](https://www.trade.gov/consolidated-screening-list).
- **Rate limits:** Not publicly documented as a hard limit. ITA enforces standard fair-use throttling [unknown — searched for: "trade.gov API rate limit", "consolidated screening list API requests per second", "ITA developer portal rate limit"]. The API has historically been used in production by major freight/compliance vendors without published per-second caps.
- **Pricing:** $0. Free, no contract required.
- **ToS:** Public-domain federal data. No restriction on commercial use.
- **Source CSV fallback:** Entity List as `.csv`, DPL as `.txt`, UVL as `.csv`, MEU as `.csv` — pull directly from [bis.gov](https://www.bis.gov/) if the API is unreachable.

## fields_returned

Per CSL API result object (verified from the developer portal docs):

- `name` (string)
- `alt_names` (array)
- `addresses` (array of objects: address, city, state, postal_code, country)
- `country`
- `type` ("Entity" | "Individual" | "Vessel" | "Aircraft")
- `source` (e.g., "Entity List (EL) - Bureau of Industry and Security")
- `source_list_url`
- `source_information_url`
- `federal_register_notice`
- `start_date`
- `end_date`
- `standard_order` (license requirement / policy of denial flag)
- `license_requirement`
- `license_policy`
- `remarks`
- `score` (only present when `fuzzy_name=true`)
- `id` (BIS-assigned ID where applicable)

## marginal_cost_per_check

- $0.00 — federal API is free.
- Engineering: ~1 GET per consignee = milliseconds; effectively zero compute.
- **setup_cost:** ~$3K–$10K to integrate, build a hit-disposition workflow, and tune the fuzzy-match score threshold `[best guess: routine REST integration]`.
- Optional vendor alternative if the customer wants SLAs and managed disposition: Descartes Visual Compliance, Amber Road / E2open, OFAC Tracker, etc. Vendor pricing typically $5K–$50K/yr `[vendor-gated; requires sales contact]`.

## manual_review_handoff

- **Entity List hit:** auto-block. Reviewer documents the match (full record + Federal Register cite + match score) and confirms whether the listed entity has a footnote-1, -2, -3, -4 designation that affects license policy. Footnote-3 (Huawei et al.) and footnote-4 (military intelligence end-users) are policy-of-denial.
- **DPL hit:** auto-block. DPL listees have lost export privileges entirely; no license can be issued.
- **UVL hit:** soft-block until the consignee provides a [UVL statement](https://www.bis.gov/regulations/ear/part-744/supplement-no-7-part-744) signed by the listed party. Reviewer collects the statement and re-screens.
- **MEU hit:** escalate to compliance to determine whether the synthesis item is among the [Supplement No. 2 to Part 744 controlled items](https://www.bis.gov/regulations/ear/part-744/supplement-no-2-part-744-list-items-subject-military-end). If yes, license required; if no, MEU listing alone is informational.
- **Fuzzy match below auto-block threshold but above review threshold:** reviewer compares addresses, country, alt_names; clears or escalates.

## flags_thrown

- `bis_entity_list_hit` — exact or high-fuzzy match against Entity List → auto-block
- `dpl_hit` — match against Denied Persons List → auto-block
- `uvl_hit` → soft-block + UVL statement workflow
- `mil_end_user_hit` → escalate to compliance for item-level determination
- `fuzzy_match_review` — score above review threshold but below auto-block (e.g., score in 0.75–0.92 range, threshold values [best guess; vendor-tunable])

## failure_modes_requiring_review

- API unreachable → fall back to source CSV ingest and re-screen on next batch.
- Consignee name in non-Latin script (Cyrillic, Han, Arabic) — must be transliterated before query, and CSL alt_names coverage is incomplete in non-Latin scripts.
- Address-only match: listed entity is a parent corp but the order is to a subsidiary not yet listed (Entity List footnotes for affiliates are partially covered).
- Recently-added entity (within the past hour) not yet ingested by CSL.
- Common-name false positives (e.g., a real customer named "Ali Hassan" hits multiple individual listings).
- Aliases / DBA names not on file with the customer.

## false_positive_qualitative

- **Common personal names** matched against individual listings (DPL has individuals; common Arabic, Russian, or Chinese names produce frequent fuzzy hits).
- **Universities and research institutes that share names with listed entities** — e.g., several Chinese universities are on the Entity List; legitimate research collaborations with non-listed campuses still trip the org-name match.
- **Subsidiaries of listed parents** that the customer believes are unaffiliated.
- **Address collisions** in dense business districts where a listed entity and an unrelated tenant share a street.
- **Ambiguous corporate suffixes** (Co., Ltd., LLC) and translation variants causing fuzzy mismatches.

[best guess: these are well-known restricted-party screening false-positive categories; quantitative coverage handled by stage 6.]

## record_left

For each screen:
- Query string (raw consignee name, address)
- API response JSON (full match list with scores)
- Disposition decision + reviewer signoff if escalated
- CSL data version timestamp (max `start_date` of returned records as a proxy, since CSL doesn't expose a global version)

Retention: 5 years per [15 CFR § 762.6](https://www.bis.gov/regulations/ear/part-762-recordkeeping). The CSL API response is the audit-grade artifact regulators expect.

## bypass_methods_known

(Stage 5 fills.)

## bypass_methods_uncovered

(Stage 5 fills.)
