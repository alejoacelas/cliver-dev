# 04F form-check v1 — m14-onfido

| Field | Verdict | Note |
|---|---|---|
| name | PASS | Includes Entrust rebrand. |
| measure | PASS | |
| attacker_stories_addressed | PASS | Refined; calls out structural non-coverage. |
| summary | PASS | |
| external_dependencies | PASS | |
| endpoint_details | PASS | Auth model + region URLs concrete; rate limits `[unknown ...]` with 4-query plausible list; pricing `[vendor-gated]`. |
| fields_returned | PASS | Concrete v3.6 Document + Facial Similarity / Motion field list. |
| marginal_cost_per_check | PASS | `[best guess]` with reasoning across comparables; cited blogs. |
| manual_review_handoff | PASS | 8-step playbook tied to specific report fields. |
| flags_thrown | PASS | Each flag bound to a specific Onfido response field + action. |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | |
| record_left | PASS | |
| bypass_methods | DEFERRED | Stage 5. |

## For 4C to verify

- Entrust acquired Onfido April 2024 — verify the press release date.
- "Motion is iBeta Level 2 compliant" — verify against Onfido / iBeta listing.
- "API v3.6 is current" — verify documentation portal.
- "SDK tokens expire after 90 minutes" — verify in API docs.
- "Deepfake attacks every five minutes" stat — verify it comes from Entrust's own 2024 report.

## Verdict

PASS.
