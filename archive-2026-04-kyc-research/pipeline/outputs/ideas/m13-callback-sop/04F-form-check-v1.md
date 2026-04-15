# 04F form check — m13-callback-sop v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | Notes that this extends M13 beyond passive VoIP detection. |
| attacker_stories_addressed | PASS | Refined; covers inbox-compromise, account-hijack, credential-compromise, it-persona-manufacturing, shell-* cluster. |
| summary | PASS | |
| external_dependencies | PASS | Reviewer + lookup sources + outbound call infrastructure. |
| endpoint_details | PASS | This is a manual SOP — explicit. Cites BEC industry guidance. |
| fields_returned | PASS | Concrete call-log schema. |
| marginal_cost_per_check | PASS | Reviewer time + telephony, both as best-guess. |
| manual_review_handoff | PASS | Five-step SOP with 5 explicit outcomes. |
| flags_thrown | PASS | Five flags. |
| failure_modes_requiring_review | PASS | Six failure modes named. |
| false_positive_qualitative | PASS | Five FP categories. |
| record_left | PASS | Structured log + optional recording. |

## For 4C to verify

- "JPM, FBI, and Nacha all recommend out-of-band verification" — verify each cited URL.
- University directory URLs — verify they actually load and host directory search.

## Verdict

PASS
