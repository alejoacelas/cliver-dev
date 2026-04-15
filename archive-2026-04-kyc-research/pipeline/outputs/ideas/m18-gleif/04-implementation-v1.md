# m18-gleif — Implementation v1

- **measure:** M18 (institution-legitimacy-soc)
- **name:** GLEIF LEI lookup + Level-2 relationships
- **modes:** D, A
- **summary:** Resolve the customer's claimed institution to a Legal Entity Identifier (LEI) via the GLEIF API. Retrieve Level-2 parent/ultimate-parent relationship records to map the institution's ownership chain. Flag institutions with no LEI, lapsed LEIs, or parent entities in concern jurisdictions. The check provides a structured, globally standardized institutional-legitimacy signal for any entity that participates in the financial system, and exposes ownership chains that shell-company and beneficial-owner-laundering branches try to obscure.

## external_dependencies

- **GLEIF API** — free, anonymous, RESTful API providing access to the full LEI database (~2.8 million active LEIs as of Q2 2025). Supports full-text search, entity name search, fuzzy matching, and Level-2 relationship traversal. [source](https://www.gleif.org/en/lei-data/gleif-api)
- **GLEIF Level-2 Relationship Record (RR-CDF)** — specifies direct and ultimate parent relationships between legal entities. Available via API and as bulk download (XML, Golden Copy / Concatenated File). [source](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-who-owns-whom)
- **GLEIF Concatenated File (bulk download)** — daily snapshot of all LEI records + Level-2 relationship records. Free download. Useful for offline matching and pre-computation. [source](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file)
- **Institution name normalization** — customer-provided institution names must be normalized before matching against GLEIF. ROR (Research Organization Registry) provides canonical names for research institutions; the provider should also use fuzzy matching against GLEIF's own name index.
- **Concern-jurisdiction list** — internal list of jurisdictions that trigger elevated review when they appear in an LEI's parent chain. [best guess: derived from OFAC sanctions lists, FATF high-risk jurisdiction lists, and BIS Entity List country concentrations; maintained internally.]

## endpoint_details

### GLEIF API
- **Base URL:** `https://api.gleif.org/api/v1/` [source](https://www.gleif.org/en/lei-data/gleif-api)
- **Key endpoints:**
  - `GET /lei-records?filter[entity.legalName]=<name>` — search by entity legal name (supports fuzzy matching). [source](https://documenter.getpostman.com/view/7679680/SVYrrxuU)
  - `GET /lei-records/{lei}` — retrieve a specific LEI record by LEI code.
  - `GET /lei-records/{lei}/direct-parent` — retrieve the direct parent relationship.
  - `GET /lei-records/{lei}/ultimate-parent` — retrieve the ultimate parent relationship.
  - Level-2 relationship data is linked from each LEI record via `relationships` links in the JSON:API response.
- **Auth:** Anonymous — no API key required. [source](https://www.gleif.org/en/lei-data/gleif-api)
- **Rate limit:** 60 requests per minute per user. [source](https://www.gleif.org/en/lei-data/gleif-api)
- **Pricing:** Free — "There is no charge for the use of GLEIF's LEI data." [source](https://www.gleif.org/en/lei-data/access-and-use-lei-data)
- **Data freshness:** LEI records are updated by LEI issuers (LOUs); GLEIF aggregates daily. The bulk concatenated file is regenerated daily. [source](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file)
- **ToS:** GLEIF data is open and free under the GLEIF Data License. Commercial and non-commercial use permitted. [source](https://www.gleif.org/en/lei-data/access-and-use-lei-data)

### GLEIF Bulk Download (for pre-computation / offline matching)
- **URL:** [https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file)
- **Format:** XML (LEI-CDF v3.1 for Level 1; RR-CDF v2.1 for Level 2). Also available in CSV.
- **Size:** [best guess: Level-1 file is ~2–3 GB uncompressed for ~2.8M records; Level-2 file is smaller.]

## fields_returned

### Level 1 (per LEI record)
- `lei` — the 20-character LEI code
- `entity.legalName` — registered legal name
- `entity.otherNames[]` — trade names, previous names
- `entity.legalAddress` — full registered address (street, city, region, country, postal code)
- `entity.headquartersAddress` — headquarters address (may differ from legal address)
- `entity.registeredAt.id` — business registry identifier (e.g., Companies House number)
- `entity.registeredAs` — registration number at the business registry
- `entity.jurisdiction` — country of legal formation
- `entity.category` — entity category (e.g., FUND, BRANCH, SOLE_PROPRIETOR, GENERAL)
- `entity.legalForm.id` — legal form code (e.g., LLC, PLC, GmbH)
- `entity.status` — ACTIVE, INACTIVE, or NULL
- `entity.expiration.date` — LEI expiration/lapse date
- `entity.expiration.reason` — reason for expiration (DISSOLVED, CORPORATE_ACTION, OTHER)
- `registration.status` — ISSUED, LAPSED, RETIRED, ANNULLED, CANCELLED, TRANSFERRED, PENDING_TRANSFER, PENDING_ARCHIVAL, DUPLICATE, MERGED
- `registration.initialRegistrationDate`
- `registration.lastUpdateDate`
- `registration.nextRenewalDate`
- `registration.managingLou` — the LEI issuer that manages this record

### Level 2 (relationship records)
- `relationship.startNode.id` — LEI of the child entity
- `relationship.endNode.id` — LEI of the parent entity
- `relationship.type` — `IS_DIRECTLY_CONSOLIDATED_BY` or `IS_ULTIMATELY_CONSOLIDATED_BY`
- `relationship.status` — ACTIVE, INACTIVE
- `relationship.qualifiers[]` — accounting standard used (IFRS, US_GAAP, etc.)
- `relationship.periods[]` — validity period

### Reporting exceptions (when Level 2 is not reported)
- `exception.category` — why the entity did not report parents: `NATURAL_PERSONS`, `NON_CONSOLIDATING`, `NO_KNOWN_PERSON`, `NO_LEI`, `NON_PUBLIC`, `BINDING_LEGAL_OBSTACLES`
- This field is important: a `NON_PUBLIC` or `BINDING_LEGAL_OBSTACLES` exception on a small commercial entity is itself a signal worth flagging.

## marginal_cost_per_check

- **API lookup:** $0 (free, anonymous API).
- **Bulk download + offline matching:** $0 for the data; compute/storage cost is negligible. [best guess: <$100/month for a daily ETL pipeline ingesting the concatenated file into a search index.]
- **Name-matching overhead:** [best guess: the main cost is engineering the fuzzy match between customer-provided institution names and GLEIF's `legalName` / `otherNames` fields. Initial build: ~2 engineer-weeks. Ongoing: near-zero marginal cost per query.]
- **Composite per check:** $0 marginal. The only costs are engineering setup and maintenance.
- **setup_cost:** [best guess: ~$10K–$20K for initial integration (API client, name-matching pipeline, concern-jurisdiction configuration, reviewer UI). Ongoing: ~$2K–$5K/year for maintaining the concern-jurisdiction list and name-matching tuning.]

## manual_review_handoff

When any GLEIF-related flag fires:

1. **Reviewer sees:** the customer's claimed institution name, the best-matching LEI record (if any), the LEI status, the parent chain (direct + ultimate parent LEIs with their names, jurisdictions, and statuses), and any reporting exceptions.
2. **Decision tree:**
   - **`no_lei`:** institution has no LEI. This is common and not dispositive — most universities and research institutions do not have LEIs. LEI coverage skews heavily to financial-sector entities. The reviewer routes to alternative legitimacy checks (m18 measures: ROR, Companies House, etc.). No denial from this flag alone.
   - **`lei_lapsed`:** institution had an LEI but it has lapsed (status = LAPSED). Lapsed LEIs may indicate administrative neglect or entity dissolution. Reviewer checks `expiration.reason`: DISSOLVED → escalate; OTHER → contact customer for explanation.
   - **`lei_parent_in_concern_jurisdiction`:** the direct or ultimate parent entity's jurisdiction is on the concern list. Reviewer examines the full parent chain. If the concern-jurisdiction parent is a holding company in a known secrecy jurisdiction (BVI, Cayman, Seychelles) and the customer entity is a small biotech, escalate. If the parent is a large multinational with legitimate operations in a concern jurisdiction, clear with note.
   - **`lei_reporting_exception_suspicious`:** the entity has an LEI but reports Level-2 relationships with a `NON_PUBLIC` or `BINDING_LEGAL_OBSTACLES` exception. For a small commercial entity, this is unusual and warrants investigation. For a government entity or bank, it may be expected.
3. **Integration with other m18 ideas:** the GLEIF check is most useful in combination with ROR (for research institutions), Companies House / OpenCorporates (for corporate entities), and NIH RePORTER (for grant-funded institutions). GLEIF provides the strongest signal for entities in the financial ecosystem; it provides weak signal for purely academic institutions.

## flags_thrown

- `no_lei` — customer's institution has no matching LEI in GLEIF. **Action:** not a stand-alone flag; route to alternative legitimacy checks. Informational.
- `lei_lapsed` — the matched LEI has status LAPSED or RETIRED. **Action:** manual review; check expiration reason.
- `lei_parent_in_concern_jurisdiction` — direct or ultimate parent entity is in a concern jurisdiction. **Action:** manual review; examine parent chain.
- `lei_reporting_exception_suspicious` — Level-2 relationship reported as `NON_PUBLIC` or `BINDING_LEGAL_OBSTACLES` for a non-financial entity. **Action:** manual review.
- `lei_entity_inactive` — the matched LEI record has entity status INACTIVE. **Action:** manual review; possible dissolved entity.
- `lei_name_fuzzy_match_low_confidence` — the best GLEIF name match has a low confidence score, suggesting the customer's institution name does not closely match any registered legal entity. **Action:** informational; weight downstream review.

## failure_modes_requiring_review

- **LEI coverage gap for research institutions.** The LEI system was designed for financial-system entities. As of Q2 2025, ~2.8 million active LEIs exist globally ([source](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)), but coverage is concentrated in financial services, insurance, and large corporations. Most universities, research institutes, government labs, and small biotechs do NOT have LEIs. [best guess: fewer than 5% of US R1 universities have LEIs; the percentage is higher for university-affiliated hospital systems and endowment entities.] This means `no_lei` will fire for the majority of legitimate research customers, making it an informational signal rather than a decisive one.
- **Name matching ambiguity.** GLEIF's `legalName` is the entity's registered legal name, which may differ substantially from the customer-provided institution name (e.g., "MIT" vs. "Massachusetts Institute of Technology" vs. "MIT Lincoln Laboratory"). Fuzzy matching is required and will produce false matches and missed matches.
- **Level-2 coverage.** Not all entities with LEIs report parent relationships. GLEIF requires reporting, but entities can file "reporting exceptions" (e.g., `NO_KNOWN_PERSON`, `NON_CONSOLIDATING`). A shell company can file `NON_CONSOLIDATING` to avoid disclosing its parent. [source](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-reporting-exceptions-2-1-format)
- **Rate limit constraint.** 60 requests/minute may be insufficient for batch onboarding. The bulk download pipeline addresses this but adds engineering complexity.
- **Jurisdictional bias.** LEI adoption varies dramatically by country. EU/UK entities are well-represented (driven by regulatory mandates like MiFID II and DORA); US entities are moderately represented; entities in many developing countries have minimal LEI coverage. [source](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)

## false_positive_qualitative

- **Legitimate entities in concern jurisdictions.** A multinational pharma company with a Cayman Islands holding entity is legitimate but will trigger `lei_parent_in_concern_jurisdiction`.
- **Entities with lapsed LEIs due to administrative neglect.** Small companies that forget to renew their LEI are flagged as `lei_lapsed` even though they are legitimate and active.
- **Entities with `NON_PUBLIC` reporting exceptions.** Some legitimate entities (especially government-linked or defense-adjacent) have legitimate reasons not to disclose parent relationships.
- **No-LEI research institutions.** The vast majority of legitimate research customers will have no LEI, making the `no_lei` flag meaningless as a discriminator on its own.

## record_left

- **GLEIF API response** stored at the time of the check: the full LEI record (Level 1) and all Level-2 relationship records for the matched entity.
- **Parent-chain snapshot:** LEIs and jurisdictions of all entities in the direct-parent and ultimate-parent chain, with their statuses.
- **Name-match details:** the customer-provided institution name, the matched GLEIF `legalName`, and the match confidence score.
- **Concern-jurisdiction match details:** which jurisdiction triggered the flag and which parent entity is in that jurisdiction.
- **Version of the concern-jurisdiction list** at the time of the check.
- **Reviewer's adjudication memo** (if manual review was triggered).

## attacker_stories_addressed (refined)

- **shell-company:** directly targeted — the branch builds a real Delaware LLC. If the LLC obtains an LEI (which is unlikely for a small shell but possible), the Level-2 parent check may expose the operator's real holding structure or a `NON_CONSOLIDATING` exception. If the LLC does NOT have an LEI, the `no_lei` flag fires — but this is also true for most legitimate small biotechs, so the signal is weak for this specific branch.
- **shell-nonprofit:** directly targeted — same logic. Nonprofits are even less likely to have LEIs than LLCs.
- **beneficial-owner-laundering:** directly targeted — the Level-2 parent chain is the primary defense. If the entity has an LEI and reports its parents honestly, the concern-jurisdiction parent flag catches laundering through secrecy-jurisdiction holding companies. If the entity files a reporting exception, the `lei_reporting_exception_suspicious` flag fires. However, a sophisticated actor can structure the parent chain to avoid concern jurisdictions.
- **gradual-legitimacy-accumulation:** partially addressed — the branch builds a legitimate-looking entity over 12–24 months. If the entity obtains an LEI (which a committed actor might do for credibility), the LEI record is clean; the check provides no signal against a well-constructed entity.
- **cro-framing, cro-identity-rotation:** partially addressed — CRO shells are unlikely to obtain LEIs; the `no_lei` flag fires but is weak.
- **dormant-domain:** partially addressed — a defunct institution's LEI will be LAPSED or RETIRED; if the attacker reanimates the domain, the GLEIF check catches the entity-level dissolution. But only if the original institution had an LEI.
- **foreign-institution:** directly targeted for entities in the financial system — GLEIF provides a globally standardized legitimacy signal that bypasses the language/jurisdiction barrier. But coverage is jurisdiction-dependent; entities in countries with low LEI adoption provide no signal.
- **biotech-incubator-tenant, community-bio-lab-network:** NOT addressed — incubator tenants and community labs do not have LEIs.
- **account-hijack, credential-compromise, dormant-account-takeover, inbox-compromise:** NOT addressed — these are identity-theft branches; institutional legitimacy is inherited from the real victim's institution.
