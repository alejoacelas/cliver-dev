# 04F form-check v1 — m14-persona

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | |
| summary | PASS | |
| external_dependencies | PASS | |
| endpoint_details | PASS | Auth, base URL, key prefixes concrete. Rate limits `[unknown ...]` with 4-query plausible list. Pricing partially populated ($1/check Startup floor) + `[vendor-gated]` enterprise hedge. |
| fields_returned | PASS | Substantial concrete field/check list pulled from official docs. |
| marginal_cost_per_check | PASS | Floor cited; mid-volume `[best guess]` with reasoning. |
| manual_review_handoff | PASS | 9-step playbook tied to specific check names. |
| flags_thrown | PASS | |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | |
| record_left | PASS | |
| bypass_methods | DEFERRED | Stage 5. |

## For 4C to verify

- Persona is NOT publicly Kantara-listed for IAL2 in the same way Entrust/Jumio claim — verify the v1 hedge that Persona's glossary references IAL definitions but the company isn't a certified trust framework provider.
- Startup Program: 500/month free + ~$1/verification + 12-month minimum on paid — verify Vendr write-up.
- "More than doubled pricing in 2024" — verify Vendr.
- iBeta-tested ISO/IEC 30107-3 PAD compliance + CEN/TS 18099:2024 alignment — verify Biometric Update articles.
- API base URL `https://api.withpersona.com/api/v1/` and key prefixes `persona_production_` / `persona_sandbox_` — verify docs introduction page.

## Verdict

PASS.
