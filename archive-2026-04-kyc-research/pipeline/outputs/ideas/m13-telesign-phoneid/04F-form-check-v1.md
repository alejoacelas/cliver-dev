# 04F form check — m13-telesign-phoneid v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Refined; covers inbox-compromise, credential-compromise, account-hijack. |
| summary | PASS | |
| external_dependencies | PASS | PhoneID, Score, Porting/Sim-swap add-ons. |
| endpoint_details | PASS | URLs, auth, rate-limit unknown with explicit search list, pricing best-guess + vendor-gated marker. |
| fields_returned | PASS | Detailed field list including line-type enum and risk.* triple. |
| marginal_cost_per_check | PASS | Per-call estimates with sources. |
| manual_review_handoff | PASS | Seven-branch SOP. |
| flags_thrown | PASS | Six flags. |
| failure_modes_requiring_review | PASS | Score opacity, MVNO gaps, ported numbers, API outage. |
| false_positive_qualitative | PASS | Four FP categories. |
| record_left | PASS | Concrete schema. |

## For 4C to verify

- "PhoneID phone_type values include MOBILE, LANDLINE, FIXED VOIP, NON-FIXED VOIP" — verify on developer.telesign.com.
- "Score API risk.score 0–1000 scale" — verify on developer.telesign.com.
- PhoneID pricing $0.005–$0.011 — third-party blog; mark as such.

## Verdict

PASS
