# m03-usps-rdi-cmra — 04F form check v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS — explicitly notes the Web Tools shutdown and the v3 REST migration, which is critical context |
| external_dependencies | PASS |
| endpoint_details | PASS — base URL, OAuth, pricing, retirement dates, rate-limit + ToS as `[unknown]` with plausible queries |
| fields_returned | PASS |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS |
| flags_thrown | PASS |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |
| Open structural concerns (extra) | PASS — appropriately flags that Enhanced Address API is not yet GA |

## For 4C to verify

- Web Tools v1/v2 retirement on 25 Jan 2026.
- Label API retirement 14 Jul 2024.
- USPS v3 OAuth client-credentials auth.
- DPV footnote R7 = CMRA (legacy code).

**Verdict: PASS**
