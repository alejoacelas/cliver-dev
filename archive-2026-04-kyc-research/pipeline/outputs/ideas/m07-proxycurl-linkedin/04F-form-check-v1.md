# 04F Form check — m07-proxycurl-linkedin v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS |
| endpoint_details | PASS — endpoint URL + auth + 1-credit pricing cited; exact tier table flagged `[vendor-gated]`; rate limit flagged `[unknown]` with two-query search list. |
| fields_returned | PASS — concrete attribute list. |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS |
| flags_thrown | PASS |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |

## For 4C to verify
- Endpoint URL `https://nubela.co/proxycurl/api/v2/linkedin`
- 1-credit per Person Profile lookup
- LinkedIn ToS / hiQ litigation context

## Verdict
**PASS**
