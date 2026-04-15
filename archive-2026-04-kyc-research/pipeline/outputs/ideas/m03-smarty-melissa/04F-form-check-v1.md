# m03-smarty-melissa — 04F form check v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS |
| endpoint_details | PASS — Smarty URL + auth + pricing + rate-limit `[unknown]`; Melissa URL + auth + pricing (best-guess via G2 tiers) + rate-limit `[unknown]`; Melissa ToS marked `[vendor-gated]` |
| fields_returned | PASS — Smarty fields enumerated from official doc; Melissa partly `[vendor-described]` |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — 5 steps |
| flags_thrown | PASS — 5 flags |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |

## For 4C to verify

- That `analysis.dpv_cmra` is the documented field on Smarty's US Street API.
- That Smarty pricing starts at ~$0.60 / 1,000 (cited to vendor pricing page).
- That Melissa GAV CMRA detection is part of the standard product (not a paid add-on).

**Verdict: PASS**
