# 04F Form check — m04-usps-rdi v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS — names USPS AIS direct path AND CASS vendor reality. Critical correction noted: original spec said "USPS Web Tools" but Web Tools retired Jan 2026. |
| endpoint_details | PASS — Smarty endpoint URL, auth model, pricing best-guess, USPS direct path documented; rate-limit and ToS each have 2-query `[unknown]` markers (borderline). |
| fields_returned | PASS — full Smarty metadata fields list with specific decisive field |
| marginal_cost_per_check | PASS — best-guess derivation + reuse note with m03 |
| manual_review_handoff | PASS — 5-step playbook with institution-class branching |
| flags_thrown | PASS |
| failure_modes_requiring_review | PASS — explicitly notes US-only |
| false_positive_qualitative | PASS |
| record_left | PASS |

## For 4C to verify
- "USPS Web Tools retired January 25, 2026" — verify exact date
- "Smarty per-call ~$0.001–$0.005" — best-guess, no source — UPGRADE-SUGGESTED
- "USPS direct RDI requires CASS certification" — verify

**Verdict:** PASS (well-formed; key correction is the original spec's outdated Web Tools reference is now flagged)
