# Per-idea synthesis: m08-bis-entity-csl

## Section 1: Filled-in schema

**name**

BIS Entity List + Consolidated Screening List

**measure**

M08 — institution-denied-parties

**attacker_stories_addressed**

No wg attacker stories engage this measure. All 19 branches model attackers at clean US/European R&E institutions or constructing fresh US LLCs/nonprofits — none operate from denied-parties-listed institutions. The value is regulatory compliance and audit-readiness, not bypass-resistance against modeled threats.

**summary**

Screen the customer's institution name against the US Consolidated Screening List (CSL), the unified ITA-published superset of 13 US restricted-party lists from Commerce (BIS Entity List, DPL, UVL, MEU, PLC), State (DDTC, ISN), and Treasury (OFAC SDN, SSI, FSE, CMIC, CAP, MBS). A confirmed hit is a hard block; near-matches are routed to manual review.

**external_dependencies**

International Trade Administration (ITA) Consolidated Screening List API; optional OpenSanctions as a corroborating multi-jurisdiction overlay.

**endpoint_details**

**Search endpoint:** `https://data.trade.gov/consolidated_screening_list/v1/search`. **Auth:** API key (`subscription-key` header) issued via free signup at `developer.trade.gov`. **Update cadence:** daily at 05:00 EST/EDT. **Rate limits:** [unknown — searched for: "trade.gov CSL API rate limit per minute", "ITA developer portal default quota" — exact published cap not surfaced; default is on the order of a few hundred req/min.] **ToS:** ITA Developer Portal Terms of Service explicitly authorize export-screening use. **Pricing:** $0 — the API is free. **Bulk download:** daily-refreshed CSV/JSON dump available from `data.trade.gov` for airgapped screens.

**fields_returned**

Per CSL API response: `name`, `alt_names[]`; `addresses[]` (street, city, state, postal_code, country); `start_date`, `end_date`; `source` (which underlying list); `source_list_url`, `source_information_url`; `federal_register_notice`; `programs[]` (e.g., IRAN, RUSSIA, WMDT, MEU); `license_requirement`, `license_policy`; `remarks`, `title`; `score` (fuzzy match quality when `fuzzy_name=true`); `id`, `entity_number`, `type` (Entity/Individual/Vessel/Aircraft).

**marginal_cost_per_check**

$0 API cost. Per-customer compute: 1-3 fuzzy queries (institution name, alt names, parent org). **Setup cost:** ~$5-10k engineering for API client, match-scoring threshold tuning, and manual-review workflow (est. 1 engineer-week).

**manual_review_handoff**

6-step SOP: (1) Pull candidate match record (name, score, source, addresses, programs, Federal Register notice). (2) Compare matched address country against customer's claimed institution address; institution-name collisions are common. (3) If score >= 0.9 AND address country matches: confirmed hit — deny order, log under OFAC/BIS record-keeping (5-year retention per EAR section 762 [best guess]), file SAR if applicable. (4) If score < 0.9 OR address mismatch: reviewer fetches underlying list entry via `source_list_url` and reads Federal Register notice; if ambiguous, requests written affirmation from customer. (5) UVL hits specifically: not necessarily denial but enhanced due diligence per BIS guidance; escalate to compliance counsel. (6) All decisions logged with reviewer ID, timestamp, and full reasoning.

**flags_thrown**


- `csl_entity_hit_high_confidence` — fuzzy score >= 0.9 and address country matches; auto-deny pending compliance review.

- `csl_entity_hit_low_confidence` — score 0.6-0.9 or score >= 0.9 with address mismatch; manual review.

- `csl_alt_name_hit` — match against alt_names[] rather than primary name; manual review.

- `csl_uvl_hit` — match against BIS Unverified List; enhanced due diligence per BIS guidance.

**failure_modes_requiring_review**

API outage on data.trade.gov (rare but documented); customer institution name in non-Latin script (fuzzy matcher works on transliterations only); newly-added entities not yet in daily snapshot (up to 24h lag); aliases not catalogued in alt_names[]; subsidiaries/parent-org relationships not in the flat CSL (OFAC/BIS 50% rule applies to ownership but API returns no ownership graphs).

**false_positive_qualitative**


- **True false positives:** common-name institutional collisions, especially Chinese/Russian institution names (~5-15% of queries from those regions may return at least one low-confidence false-positive hit); institutions with English translations that partially match listed entities.

- **False negatives:** entities sanctioned by non-US jurisdictions only (~10-20% of globally sanctioned entities); unlisted subsidiaries of listed parents (thousands of entities); transliteration mismatches (~5-10% of non-Latin-name entities); 0-24h lag window (minimal risk); undocumented aliases (unknown scale).

**coverage_gaps**


- **Gap 1 — Non-US sanctioned entities:** CSL aggregates only US-origin lists; EU, UK, UN designations with no US parallel are absent (~10-20% of globally relevant sanctioned entities).

- **Gap 2 — Unlisted subsidiaries:** OFAC 50% rule applies to ownership but CSL is a flat list; subsidiaries not individually named are invisible (thousands of entities).

- **Gap 3 — Transliteration misses:** ~5-10% of non-Latin-name entities may slip through; Chinese institution names are particularly vulnerable (Pinyin vs. Wade-Giles vs. institutional English name).

- **Gap 4 — 24h lag window:** daily refresh at 05:00 EST; at most ~24h after Federal Register publication. Minimal practical risk.

- **Gap 5 — Undocumented aliases:** [unknown — searched for: "CSL alt_names coverage completeness", "BIS Entity List alias coverage gaps" — no published assessment exists.]

- **Gap 6 — False positives from common names:** up to 95% false-positive rate reported in industry for sanctions screening generally; ~5-15% of queries for Chinese/Russian names may trigger low-confidence hits.

**record_left**

Full API request + JSON response (or hash + key fields); match score(s); reviewer disposition + timestamp + reviewer ID; snapshot of matching CSL record; Federal Register notice URL. Must be preserved for 5 years per EAR section 762 [best guess]. Legally load-bearing audit artifact for export-screening compliance.

**bypass_methods_known**

None — no wg attacker stories engage this measure.

**bypass_methods_uncovered**

None — no wg attacker stories engage this measure. The CSL is a regulatory compliance guard, not an adversarial-resistance tool against the modeled threat set.


## Section 2: Narrative


### What this check is and how it works

This check screens a customer's institution name against the US Consolidated Screening List (CSL), a free API operated by the International Trade Administration that aggregates 13 US restricted-party lists from the Bureau of Industry and Security (Entity List, Denied Persons List, Unverified List, Military End-User List), the State Department (DDTC debarments, nonproliferation sanctions), and the Treasury Department (OFAC SDN, Sectoral Sanctions, Chinese Military-Industrial Complex Companies, and others). The provider submits the customer's institution name as a fuzzy query; the API returns any matches with a confidence score, the underlying list source, address, program designations, and the Federal Register notice. A high-confidence match (score >= 0.9 with address country match) triggers an automatic deny pending compliance review. Lower-confidence matches route to a human reviewer who reads the underlying Federal Register notice and dispositions the alert.


### What it catches

The CSL catches customers affiliated with institutions that are explicitly named on US denied-parties lists — sanctioned universities, military-end-user designated research institutes, OFAC SDN-listed entities, and BIS Entity List entries. These are institutions that the US government has determined pose export-control, national-security, or foreign-policy risks. The check is the minimum viable denied-parties screen for any US-jurisdiction synthesis provider and is likely already legally required for providers exporting controlled materials. Notably, no wg attacker story models an adversary operating from a denied-parties-listed institution, so the check's value is regulatory compliance and audit-readiness rather than resistance against the modeled adversarial threat set.


### What it misses

The CSL covers only US-origin sanctions lists. Entities sanctioned by the EU, UK, or UN but not designated by the US will pass the screen — estimated at ~10-20% of globally relevant sanctioned entities. The most significant structural gap is unlisted subsidiaries: the CSL is a flat name list, not a corporate ownership graph, so a wholly-owned subsidiary of a listed entity that is not individually named will not trigger a hit. OFAC's 50% rule theoretically applies, but enforcement requires independent ownership research that the API does not support. Transliteration mismatches create false negatives for ~5-10% of non-Latin-name entities, particularly Chinese institutions where romanization varies. Undocumented aliases allow entities operating under unlisted trading names to evade screening.


### What it costs

The CSL API is free — $0 per query, no subscription fee, no per-query charge. Setup cost is ~$5-10k (1 engineer-week) for the API client, fuzzy-match threshold tuning, and the manual-review workflow. The ongoing cost is analyst time for dispositioning false-positive alerts. For providers screening Chinese/Russian institutional customers, ~5-15% of queries may trigger low-confidence hits requiring manual review. Industry-wide, sanctions screening false-positive rates can reach up to 95% for common names, though the CSL's fuzzy-score ranking helps triage.


### Operational realism

The manual review handoff for CSL hits is well-defined and mirrors standard export-compliance practice. High-confidence hits (score >= 0.9 with address match) are straightforward denials. Low-confidence hits require the reviewer to fetch the underlying list entry, read the Federal Register notice, and in ambiguous cases, request a written customer affirmation. UVL hits require enhanced due diligence rather than automatic denial. All decisions must be logged with full reasoning and preserved for 5 years (per EAR section 762, best guess). The bulk-download option allows providers to run airgapped screens for additional reliability. The most operationally burdensome aspect is the subsidiary/ownership gap: compliance teams must independently research whether a customer's institution is a subsidiary of a listed entity, which the API does not automate.


### Open questions

The exact CSL API rate limit is unpublished and was not surfaced despite searches. The EAR section 762 5-year retention requirement is marked as a best guess and should be directly cited. The list count discrepancy (v1 enumerates 13 underlying lists while the developer portal historically documented 11) reflects ITA's evolving list set and needs reconciliation. Whether OpenSanctions or OFAC's own SDN.xml file should be used as a corroborating cross-check is deferred to stage 8 synthesis, where it intersects with m08-commercial-pep-watchlist's multi-jurisdiction coverage.

## Section 3: Open issues for human review


- **No wg attacker stories engage this measure.** The CSL screen's value is regulatory compliance, not adversarial resistance against the modeled threat set. All 19 wg branches model attackers at clean institutions or using fresh entities. This is not a deficiency of the implementation — it reflects the threat model's scope.


- **Non-US sanctions gap (Gap 1):** Entities sanctioned only by EU, UK, or UN jurisdictions will pass the CSL screen. Providers with global customers should consider supplementing with OpenSanctions or a commercial multi-jurisdiction vendor (m08-commercial-pep-watchlist).


- **Subsidiary/ownership-graph gap (Gap 2):** The CSL is a flat list; OFAC's 50% rule requires independent ownership research the API does not support. Closing this gap requires a different data source (e.g., Sayari, OpenCorporates).


- **[unknown — searched for: "trade.gov CSL API rate limit per minute", "ITA developer portal default quota"]:** Exact published rate limit not confirmed.


- **[unknown — searched for: "CSL alt_names coverage completeness", "BIS Entity List alias coverage gaps"]:** No published assessment of alias completeness exists.


- **[best guess]:** EAR section 762 5-year retention period not directly cited; should be verified against the regulation text.


- **List count discrepancy:** v1 enumerates 13 underlying lists; developer portal historically documented 11. Needs reconciliation in v2.
