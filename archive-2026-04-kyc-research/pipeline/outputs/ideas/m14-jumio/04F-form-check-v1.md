# 04F form-check v1 — m14-jumio

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Refined from spec; correctly notes structural non-coverage of fronted accomplices. |
| summary | PASS | Specific vendor + IAL2 claim cited. |
| external_dependencies | PASS | |
| endpoint_details | PASS-with-caveat | Auth model populated; rate limits explicitly `[unknown ...]` with plausible 3-query list; pricing `[vendor-gated]`. |
| fields_returned | PASS | Concrete field list pulled from mirrored docs and marked as such. |
| marginal_cost_per_check | PASS | `[best guess]` with explicit reasoning across comparables. |
| manual_review_handoff | PASS | Step-by-step playbook concrete enough to be an SOP. |
| flags_thrown | PASS | Each flag bound to a specific Jumio response field + action. |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | |
| record_left | PASS | |
| bypass_methods_known/uncovered | DEFERRED | Stage 5 — explicitly noted. |

## For 4C to verify

- Vendor claim: "Jumio is IAL2-certified under NIST SP 800-63-3" — check Jumio security page actually says this; Kantara listing not verified.
- "5,000+ document subtypes / 200+ countries" — check Jumio product page actually claims this number (v1 hedged to "vendor advertises").
- Injection-attack stat: "88% YoY rise in injection attempts" and "9x surge in 2024" — verify these come from cited Jumio press release / Help Net Security article.
- Auth-model claim: "legacy NetVerify uses HTTP Basic Auth with token+secret; new Platform uses OAuth2 bearer" — verify against the linked GitHub fastfill-api.md and upgrade doc.

## Verdict

PASS — proceed to 4C and stage 5.
