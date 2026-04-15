# m02-wayback — 04F form check v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS |
| endpoint_details | PASS — URL patterns concrete, auth, rate-limit + ToS as `[unknown]` with plausible search lists |
| fields_returned | PASS — CDX fields enumerated |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — 4-step SOP |
| flags_thrown | PASS — 4 flags |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS — explicit "soft signal" framing |
| record_left | PASS |

## For 4C to verify

- CDX endpoint URL pattern `https://web.archive.org/cdx/search/cdx?url=...&output=json`.
- The `id_` modifier returns original HTML.

**Verdict: PASS**
