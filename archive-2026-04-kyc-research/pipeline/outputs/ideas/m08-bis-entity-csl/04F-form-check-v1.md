# 04F Form check — m08-bis-entity-csl v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS — 13 underlying lists enumerated. |
| endpoint_details | PASS — endpoint URL, auth, daily-refresh cadence, free pricing all cited. Rate-limit gap explicit. |
| fields_returned | PASS — concrete schema. |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — 6-step SOP. |
| flags_thrown | PASS |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |

## For 4C to verify
- CSL search endpoint URL on data.trade.gov / developer.trade.gov
- 11-list aggregation membership (DPL, EL, MEU, UVL, ISN, DTC, CAP, CMIC, FSE, MBS, PLC, SSI, SDN — note v1 lists 13; this is because CSL has expanded; verify)
- Daily 5:00 EST refresh
- Free pricing
- fuzzy_name=true mechanics

## Verdict
**PASS** — note that v1 lists 13 underlying lists; the developer portal historically named 11. v2 should reconcile.
