# 04F form-check v1 — m14-nfc-epassport

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Carefully limited; no overstatement. |
| summary | PASS | |
| external_dependencies | PASS | |
| endpoint_details | PASS | PKD download URL + membership fee + count concrete. Jumio and Veriff specific NFC docs `[unknown ...]` with 3-query plausible lists. Inverid `[vendor-gated]`. |
| fields_returned | PASS | LDS data group list + auth result fields concrete. |
| marginal_cost_per_check | PASS | PKD = $0; vendor SDK delta `[best guess]` with reasoning; Inverid `[vendor-gated]`. |
| manual_review_handoff | PASS | 7-step playbook with each chip-read failure mode. |
| flags_thrown | PASS | |
| failure_modes_requiring_review | PASS | Calls out PA-only cloning weakness. |
| false_positive_qualitative | PASS | |
| record_left | PASS | |
| bypass_methods | DEFERRED | Stage 5; Calderoni 2014 cited. |

## For 4C to verify

- ICAO PKD registration fee: $56,000 → $15,900 in March 2015 — verify ICAO PKD Regulations PDF.
- 104 participants as of April 2025 — verify Wikipedia or ICAO source.
- Onfido iOS NFC default-enabled from v29.1.0; Android v18.1.0 — verify Entrust NFC doc page.
- "Calderoni 2014 active-authentication bypass" — verify the citation; the search excerpt referenced this paper.
- "Passive Auth proves data signed by issuer, not that chip is original" — verify Inverid blog.

## Verdict

PASS.
