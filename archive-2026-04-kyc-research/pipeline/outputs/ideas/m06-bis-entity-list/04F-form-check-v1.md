# 4F form check — m06-bis-entity-list v1

## Field verdicts

- `external_dependencies` — **PASS.** ITA CSL API + BIS source CSVs.
- `endpoint_details` — **PASS** with caveat: rate limit explicitly marked `[unknown — searched for: ...]` with three queries; auth, base URL, params, ToS all populated. The fuzzy-name and source-filter behavior is documented.
- `fields_returned` — **PASS.** Concrete CSL response schema.
- `marginal_cost_per_check` — **PASS.** $0 + engineering setup + vendor alt.
- `manual_review_handoff` — **PASS.** Distinct paths for Entity, DPL, UVL, MEU including the UVL statement workflow.
- `flags_thrown` — **PASS.** Five flags including the fuzzy-review band.
- `failure_modes_requiring_review` — **PASS.** API down, transliteration, common-name FPs, recent additions.
- `false_positive_qualitative` — **PASS.** Five concrete categories.
- `record_left` — **PASS.** Query, response, version proxy, 762.6 retention.

## For 4C to verify

- CSL API base URL `https://api.trade.gov/consolidated_screening_list/search` — current?
- 1-hour ingest cadence claim
- Entity List CSV / DPL TXT / UVL CSV / MEU CSV file format claim
- UVL statement procedure under Supplement No. 7 Part 744

## Verdict

PASS.
