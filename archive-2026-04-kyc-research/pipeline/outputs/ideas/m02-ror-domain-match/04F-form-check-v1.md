# m02-ror-domain-match — 04F form check v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS |
| endpoint_details | PASS — base URL, query/affiliation/single endpoints, auth, rate limit (2k/5min), ToS (CC0) all populated |
| fields_returned | PASS — schema v2 fields enumerated; the limitation that `domains[]` is partly empty is called out |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — 6-step SOP |
| flags_thrown | PASS — 4 flags incl. positive |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS — explicitly notes the multi-author-preprint attack against ROR self-curation |
| record_left | PASS |

## For 4C to verify

- ROR v2 rate limit of 2,000 req / 5 min.
- `domains[]` field exists in v2 schema and is partially populated.
- ROR data is CC0.
- Affiliation matcher returns `score` and `chosen`.

**Verdict: PASS**
