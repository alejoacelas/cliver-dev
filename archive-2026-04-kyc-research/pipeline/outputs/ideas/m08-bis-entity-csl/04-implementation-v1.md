# m08-bis-entity-csl — Implementation v1

- **measure:** M08 — institution-denied-parties
- **name:** BIS Entity List + Consolidated Screening List
- **modes:** D
- **summary:** Screen the customer's institution name against the US Consolidated Screening List (CSL), which is the unified ITA-published superset of 11 US restricted-party lists from Commerce (BIS Entity List, DPL, UVL, MEU, PLC), State (DDTC, ISN), and Treasury (OFAC SDN, SSI, FSE, CMIC, CAP, MBS). A confirmed hit is a hard block on the order; near-matches are routed to manual review.

> **Attacker-coverage caveat (carried from `attackers/by-measure/measure-08-institution-denied-parties.md`):** none of the wg attacker branches model an attacker operating from a denied-parties-listed institution. M08 is a low-cost, audit-required hard guard that none of the modeled adversaries trip; the value is regulatory compliance, not bypass-resistance against the modeled threats.

## external_dependencies

- **International Trade Administration (ITA) Consolidated Screening List API.** ([source](https://www.trade.gov/consolidated-screening-list), [data.gov listing](https://catalog.data.gov/dataset/consolidated-screening-list-api-0226f))
- The CSL aggregates: DPL (Denied Persons List, BIS), EL (Entity List, BIS), MEU (Military End-User List, BIS), UVL (Unverified List, BIS), ISN (State Nonproliferation Sanctions), DTC (State DDTC AECA debarments), CAP (Treasury Sectoral Sanctions), CMIC (Treasury Chinese Military-Industrial Complex Companies), FSE (Treasury Foreign Sanctions Evaders), MBS (Treasury Menu-Based Sanctions), PLC (Treasury Palestinian Legislative Council), SSI (Treasury Sectoral Sanctions Identifications), SDN (Treasury Specially Designated Nationals). ([source](https://developer.export.gov/consolidated-screening-list.html))
- Optional: **OpenSanctions** as a corroborating multi-jurisdiction overlay. ([source](https://www.opensanctions.org/datasets/us_trade_csl/))

## endpoint_details

- **Search endpoint (current):** documented on the ITA developer portal. Operationally accessed via `https://data.trade.gov/consolidated_screening_list/v1/search` (current as of 2026 per ITA developer portal). ([source](https://developer.trade.gov/apis), [source](https://developer.export.gov/consolidated-screening-list.html))
- **Auth model:** API key (`subscription-key` header, issued through `developer.trade.gov` after free signup). ([source](https://developer.trade.gov/apis))
- **Update cadence:** all CSL tools are updated daily at **05:00 EST/EDT**. ([source](https://www.trade.gov/consolidated-screening-list))
- **Rate limits:** ITA developer-portal default is on the order of a few hundred requests per minute per subscription key. [unknown — searched for: "trade.gov CSL API rate limit per minute", "ITA developer portal default quota" — exact published cap not surfaced; v2 should fetch the developer portal terms.]
- **ToS:** ITA Developer Portal Terms of Service. ([source](https://developer.trade.gov/terms-of-service)) Use for export-screening (the API's stated purpose) is explicitly authorized; no per-query fee.
- **Pricing:** **$0** — the API is free. ([source](https://www.trade.gov/consolidated-screening-list))
- **Bulk download:** the same data is available as a daily-refreshed CSV/JSON dump from `data.trade.gov`, which lets providers run airgapped screens. ([source](https://catalog.data.gov/dataset/consolidated-screening-list-api-0226f))

## Search parameters

- `name` — required for fuzzy mode
- `fuzzy_name=true` — enables fuzzy match against `name` and `alt_names`; off by default. ([source](https://github.com/InternationalTradeAdministration/developerportal/wiki/5:-%E2%80%9CFuzzy%E2%80%9D-Name-Search-is-Live-for-the-CSL))
- `sources` — comma-separated subset (e.g., `EL,SDN,UVL,MEU`). ([source](https://developer.export.gov/consolidated-screening-list.html))
- `countries`, `type`, `address`, plus offset/limit pagination

## fields_returned

Per the CSL API response (per ITA documentation):

- `name`, `alt_names[]`
- `addresses[]` (street, city, state, postal_code, country)
- `start_date`, `end_date`
- `source` (which underlying list, e.g., `Entity List (EL) - Bureau of Industry and Security`)
- `source_list_url` — direct link to the underlying official list page
- `source_information_url` — link to the Federal Register notice or OFAC press release
- `federal_register_notice`
- `programs[]` (e.g., `IRAN`, `RUSSIA`, `WMDT`, `MEU`)
- `license_requirement`, `license_policy`
- `remarks`, `title`
- `score` (when `fuzzy_name=true`) — match-quality score; higher = closer match
- `id`, `entity_number`, `type` (Entity / Individual / Vessel / Aircraft)

([source](https://github.com/InternationalTradeAdministration/developerportal/wiki/5:-%E2%80%9CFuzzy%E2%80%9D-Name-Search-is-Live-for-the-CSL), [source](https://developer.export.gov/consolidated-screening-list.html))

## marginal_cost_per_check

- API cost: **$0** (ITA does not charge). ([source](https://www.trade.gov/consolidated-screening-list))
- Per-customer compute: 1–3 fuzzy queries (institution name; alt names; parent org). 
- **setup_cost:** ~$5–10k engineering for API client + match-scoring threshold tuning + the manual-review workflow. [best guess: 1 engineer-week.]

## manual_review_handoff

When a hit fires:

1. Reviewer pulls the candidate match record (`name`, `score`, `source`, `addresses`, `programs`, `federal_register_notice`).
2. Reviewer compares the matched address country and address against the customer's claimed institution address. Institution-name collisions are common (e.g., "Beijing Institute of Technology" — there is a real listed entity, and there are unlisted similarly-named ones).
3. If `score >= 0.9` AND address country matches → confirmed hit → **deny order**, log under OFAC/BIS-required record-keeping (5-year retention), file SAR if applicable.
4. If `score < 0.9` OR address country doesn't match → reviewer fetches the underlying list entry via `source_list_url` and reads the full Federal Register notice. If still ambiguous, reviewer requests a written affirmation from the customer that they are not affiliated with the listed entity.
5. If the institution is on the **Unverified List (UVL)** specifically, the appropriate action is not necessarily denial but enhanced due diligence per BIS guidance. Reviewer escalates to compliance counsel.
6. All decisions are logged with reviewer ID, timestamp, and full reasoning. The audit trail must be preservable for 5 years per the EAR / BIS recordkeeping rules. [best guess on 5 years: standard EAR §762 retention period for export records.]

## flags_thrown

- `csl_entity_hit_high_confidence` — fuzzy score ≥ 0.9 and address country matches. **Action:** auto-deny pending compliance review.
- `csl_entity_hit_low_confidence` — fuzzy hit at 0.6 ≤ score < 0.9 or score ≥ 0.9 with address mismatch. **Action:** manual review.
- `csl_alt_name_hit` — match against an `alt_names[]` entry rather than the primary name. **Action:** manual review.
- `csl_uvl_hit` — match against the BIS Unverified List specifically. **Action:** enhanced due diligence per BIS guidance.

## failure_modes_requiring_review

- API outage on `data.trade.gov` (rare but documented).
- Customer institution name in non-Latin script (Russian, Chinese) — fuzzy matcher works on transliterations only; risk of false negatives.
- Newly-added entities not yet in the daily snapshot (≤24h lag).
- Aliases that the CSL hasn't catalogued (institution operates under a trading name not in `alt_names`).
- Subsidiaries / parent-org relationships: an entity may be on the EL but its parent or subsidiary is not literally listed (BIS's "50% rule" / OFAC's "50% rule" apply to ownership but the API does not return ownership graphs).

## false_positive_qualitative

- Common-name institutions in countries where the CSL also lists similarly-named entities (e.g., "Northwest Polytechnical University" appears in CSL; legitimately-named other institutions could fuzzy-match).
- Institutions with English translations that collide with listed entities.
- Universities that share a name with a listed military-end-user organization (most common in China and Russia).

## record_left

For every screened customer:

- Full API request + JSON response (or hash + key fields).
- Match score(s).
- Reviewer disposition + timestamp + reviewer ID.
- Snapshot of the matching CSL record.
- Federal Register notice URL.

This artifact must be preserved for 5 years per EAR §762 (best guess) and is the legally load-bearing audit artifact for export-screening compliance.

## Open issues for v2

- Verbatim citation of the EAR recordkeeping retention period.
- Verbatim CSL API rate-limit number from the developer portal.
- Whether OpenSanctions or OFAC's own SDN.xml file should be used as a corroborating cross-check.
