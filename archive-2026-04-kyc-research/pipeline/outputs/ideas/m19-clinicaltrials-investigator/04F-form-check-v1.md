# 04F form check v1 — m19-clinicaltrials-investigator

| Field | Verdict | Note |
|---|---|---|
| external_dependencies | PASS | API + BMIS bulk + BIMO inspection list + reviewer. |
| endpoint_details | PASS | Per-source URLs, auth, rate limit, format. One `[unknown]` on BMIS file format with reasonable search list. |
| fields_returned | PASS | Concrete schemas for all three sources. |
| marginal_cost_per_check | PASS | $0 + setup. |
| manual_review_handoff | PASS | Two playbooks (null result, OAI flag) with population-aware logic. |
| flags_thrown | PASS | Seven flags w/ actions. |
| failure_modes_requiring_review | PASS | Six failure modes incl. transliteration + sub-2008 coverage gap. |
| false_positive_qualitative | PASS | Six false-negative populations + one false-positive class. |
| record_left | PASS | Concrete record incl. release date. |

## For 4C to verify

- ClinicalTrials.gov API v2 base path `/api/v2/studies` and 10 r/s rate limit.
- `overallOfficials` field with `role` enum including `PRINCIPAL_INVESTIGATOR`.
- BMIS coverage from Oct 1, 2008 onward.
- BIMO inspection classification codes (NAI / VAI / OAI).

## Verdict

PASS.
