# m06-bis-entity-list — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | BIS Entity List + DPL + UVL + MEU consignee screen |
| **measure** | M06 — shipping-export-country (consignee leg) |
| **attacker_stories_addressed** | foreign-institution (re-export consignee), any attacker routing through a known restricted party |
| **summary** | Screen the consignee organization, end-user, and any named principals on the shipping address against four BIS restricted-party lists (Entity List, Denied Persons List, Unverified List, Military End-User List) via the ITA Consolidated Screening List API. Hard-block on Entity List or DPL hit; soft-block on UVL hit pending statement collection; escalate MEU hit for item-level determination. Free federal API with fuzzy-name matching. |
| **external_dependencies** | ITA Consolidated Screening List API (developer.trade.gov); BIS source CSVs as fallback (Entity List .csv, DPL .txt, UVL .csv, MEU .csv from bis.gov); ITA developer key (free). |
| **endpoint_details** | **Base URL:** `https://api.trade.gov/consolidated_screening_list/search`. **Auth:** API key (free, from ITA developer portal). **Method:** GET. **Key params:** `q=<name>`, `sources=EL,DPL,UVL,MEU`, `fuzzy_name=true`, `countries=<ISO-2>`, `address=`, `type=Entity|Individual`. **Update frequency:** hourly import from upstream lists. **Rate limits:** [unknown — searched for: "trade.gov API rate limit", "consolidated screening list API requests per second", "ITA developer portal rate limit"]. Used in production by major compliance vendors without published per-second caps. **Pricing:** $0, no contract. **ToS:** Public-domain federal data, no commercial-use restriction. **Source CSV fallback:** direct download from bis.gov if API unreachable. |
| **fields_returned** | Per CSL result object: `name`, `alt_names` (array), `addresses` (array: address, city, state, postal_code, country), `country`, `type` (Entity/Individual/Vessel/Aircraft), `source`, `source_list_url`, `source_information_url`, `federal_register_notice`, `start_date`, `end_date`, `standard_order`, `license_requirement`, `license_policy`, `remarks`, `score` (fuzzy only), `id`. |
| **marginal_cost_per_check** | $0.00 (federal API). ~1 GET per consignee, milliseconds. **Setup cost:** ~$3K–$10K to integrate, build hit-disposition workflow, tune fuzzy-match threshold [best guess]. Vendor alternative (Descartes, E2open, etc.): $5K–$50K/yr `[vendor-gated]`. |
| **manual_review_handoff** | **Entity List hit:** auto-block; reviewer documents match record + Federal Register cite + footnote designation (fn-3 = Huawei policy-of-denial, fn-4 = military-intelligence). **DPL hit:** auto-block; no license can be issued. **UVL hit:** soft-block; collect UVL statement per Supplement No. 7 to Part 744, then re-screen. **MEU hit:** escalate to compliance for item-level determination against Supplement No. 2 to Part 744. **Fuzzy match in review band (0.75–0.92 [best guess]):** reviewer compares addresses, alt_names, country; clears or escalates. |
| **flags_thrown** | `bis_entity_list_hit` (auto-block); `dpl_hit` (auto-block); `uvl_hit` (soft-block + UVL statement workflow); `mil_end_user_hit` (escalate); `fuzzy_match_review` (score in review band). |
| **failure_modes_requiring_review** | API unreachable (fall back to CSV ingest); non-Latin script consignee names (transliteration needed, CSL alt_names coverage incomplete); address-only match on parent corp vs. unlisted subsidiary; recently added entity (within-hour lag); common-name false positives; aliases/DBA names not on file. |
| **false_positive_qualitative** | (1) Common personal names (Arabic, Chinese, Russian) produce frequent fuzzy hits — dominant operational burden; financial-sector benchmarks show 90–95% FP rates in sanctions screening [source: facctum.com]. (2) Universities sharing names with listed entities (e.g., NUDT, Harbin Engineering); 50% Affiliates Rule worsens this for university-owned spin-offs. (3) Address collisions in dense commercial districts. (4) Corporate suffix/translation variants causing fuzzy mismatches. (5) Subsidiaries believed unaffiliated by customer but flagged via parent match. |
| **coverage_gaps** | (1) >99% of customers are unlisted — check produces no signal for the vast majority (by design; denylist, not positive-verification). (2) Subsidiaries/affiliates of listed entities: 50% Affiliates Rule (Sept 2025) expands nominal coverage but CSL API may not enumerate affiliates [unknown — searched for API affiliate data post-rule]. (3) Non-Latin script transliteration mismatches: APAC ~23% of synthesis market; multiple Romanization systems produce false negatives. (4) Common-name false positives: 90–95% FP rate benchmark from financial sector. (5) Newly formed shell companies created to evade listing [unknown size; BIS enforcement actions confirm pattern but base rate unquantified]. |
| **record_left** | Per screen: query string (raw consignee name, address), full API response JSON with scores, disposition + reviewer signoff, CSL data version timestamp. Retention: 5 years per 15 CFR § 762.6. |
| **bypass_methods_known** | foreign-institution Method 1 (freight forwarder) — AMBIGUOUS (depends on whether forwarder is listed + whether forwarder name is parsed from address); Method 2 (accomplice at real institution) — MISSED; Methods 4/5 (residential/virtual office) — MISSED; Method 6 (customs broker) — AMBIGUOUS. |
| **bypass_methods_uncovered** | Accomplice at real institution address: consignee is a legitimate university, no list hit. Residential/virtual office with unlisted attacker name: no list hit. Forwarder/intermediary name parsing from address lines: implementation does not specify whether intermediaries embedded in "c/o" or "ship to" fields are separately screened. |

---

## Section 2: Narrative

### What this check is and how it works

This check screens the consignee organization, end-user, and any named principals on a shipping address against four BIS restricted-party lists — the Entity List (entities subject to specific license requirements or policies of denial), the Denied Persons List (individuals/entities whose export privileges have been revoked), the Unverified List (parties whose bona fides could not be verified), and the Military End-User List. The implementation queries the ITA Consolidated Screening List API, a free federal API that aggregates 11 source lists with hourly updates. The API supports fuzzy-name matching (returning a confidence score) and can be filtered to BIS-specific sources. A match on the Entity List or DPL triggers an automatic block; UVL matches trigger a soft-block pending collection of a formal UVL statement from the listed party; MEU matches are escalated for item-level determination. Source CSVs from bis.gov serve as fallback if the API is unreachable.

### What it catches

The check catches any order where the consignee or end-user is a known restricted party — entities or individuals already identified by BIS as posing diversion, proliferation, or military end-use risk. It directly addresses the denied-end-user attacker story: an entity already on the Entity List or DPL attempting to order synthesis directly would be caught. The fuzzy-match capability extends coverage to alias variants and minor transliteration differences. The September 2025 "50% Affiliates Rule" significantly expanded the nominal reach of Entity List restrictions to majority-owned subsidiaries, though this expansion creates a compliance obligation on the exporter rather than a new API data field.

### What it misses

The fundamental limitation is structural: this is a denylist, and it produces zero signal for the >99% of customers who are not listed. The foreign-institution attacker branch deliberately uses legitimate, non-listed institutions — the check has near-zero leverage against this branch. Stage 5 classified most foreign-institution bypass methods as MISSED because the branch's core strategy is to use identities that would never appear on a restricted-party list. Additional gaps include: newly formed shell companies with no ownership link to listed entities (invisible by definition), non-Latin script transliteration mismatches (APAC customers represent ~23% of the synthesis market), and the open question of whether the CSL API has been updated post-50% Affiliates Rule to automatically flag unlisted affiliates.

### What it costs

Marginal cost per check is zero — the federal API is free with no contract. Setup cost is estimated at $3K–$10K for integration, hit-disposition workflow, and fuzzy-match threshold tuning. The dominant ongoing cost is false-positive review. Financial-sector sanctions screening benchmarks show 90–95% false-positive rates, driven by common-name hits and transliteration variants. Synthesis screening volumes are much lower (thousands vs. millions of checks), so absolute false-positive counts are manageable, but the per-false-positive review cost (~$15–$45 in reviewer time) is meaningful at scale.

### Operational realism

Entity List and DPL hits are straightforward: auto-block, document the match, and report. UVL hits introduce a multi-step workflow: the provider must request a UVL statement from the listed party before proceeding, adding days to order fulfillment. MEU hits require item-level evaluation against Supplement No. 2 to Part 744. The most labor-intensive category is fuzzy matches in the review band (score ~0.75–0.92): each requires a reviewer to compare addresses, alt-names, and country before clearing or escalating. Every screen produces an auditable artifact (full API response JSON with match scores), retained for 5 years per 15 CFR § 762.6. The API's hourly update cycle introduces a maximum 1-hour lag from BIS publication — recently added entities could be missed within this window.

### Open questions

Stage 5 raised a Moderate finding that the implementation does not specify whether freight forwarder or customs broker names embedded in "c/o" or "ship to" address fields are separately parsed and screened against the CSL. This is an implementation specification gap, not a fundamental design flaw, but it matters: if only the primary consignee name is queried, intermediaries in the shipping chain could bypass the screen. Additionally, the non-Latin script transliteration challenge (Moderate finding) requires a specified transliteration step before querying — the implementation notes the failure mode but does not prescribe the mitigation.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** The Entity List check is correctly scoped as a denylist; the foreign-institution branch's ability to evade it is by design of the attacker strategy, not a gap in this implementation.
- **`[unknown]` fields affecting policy implications:**
  - API rate limits: no published hard limit found despite three targeted searches. Production use by major compliance vendors suggests limits are generous, but no guarantee.
  - Post-50% Affiliates Rule CSL API coverage: unknown whether the API has been updated to flag unlisted affiliates automatically. If not, the compliance burden falls on the exporter's own due diligence.
  - Newly formed shell company evasion rate: no quantitative data [searched for BIS Entity List evasion rate, shell company export control evasion frequency].
- **`[vendor-gated]` fields:**
  - Vendor-managed screening service pricing ($5K–$50K/yr) requires sales contact with Descartes, E2open, or similar.
- **06F flags not fully resolved:**
  - Entity List total size estimate (1,500–2,500) and CSL total (10,000–15,000) are best guesses from a single anchor; downloading the CSV to count would resolve.
  - 50% Affiliates Rule citations are law-firm alerts; primary Federal Register citation would strengthen.
  - Gap 5 search list for shell company evasion is thin (2 queries).
- **Stage 5 Moderate findings:**
  - Intermediary name parsing from shipping address fields: implementation should specify whether "c/o", "ship to", and forwarder names are separately screened.
  - Non-Latin script transliteration: implementation should prescribe a transliteration step (and ideally dual-query: original script + transliterated) before CSL lookup.
- **Structural pairing needed:** This check produces no signal for >99% of customers. Its value is highest when paired with positive-verification checks (m07 ideas) that provide signal for unlisted entities.
