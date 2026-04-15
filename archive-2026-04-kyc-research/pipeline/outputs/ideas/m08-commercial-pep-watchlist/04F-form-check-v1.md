# 04F Form check — m08-commercial-pep-watchlist v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS |
| endpoint_details | PASS — ComplyAdvantage fully populated; others correctly marked `[vendor-gated]`. |
| fields_returned | PASS — concrete for ComplyAdvantage; vendor-gated for others. |
| marginal_cost_per_check | PASS — pricing structurally vendor-gated; best-guess ranges grounded in industry reviews. |
| manual_review_handoff | PASS — 7-step SOP. |
| flags_thrown | PASS |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |

## For 4C to verify
- ComplyAdvantage `https://api.complyadvantage.com/searches` endpoint
- Token auth header
- Entity types list
- World-Check LSEG ownership

## Verdict
**PASS** — vendor-gated areas are appropriately marked.
