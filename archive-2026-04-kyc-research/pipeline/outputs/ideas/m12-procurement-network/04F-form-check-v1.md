# 04F form check — m12-procurement-network v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Refined; covers dormant-account-takeover, LLC cluster, credential-compromise. |
| summary | PASS | |
| external_dependencies | PASS | Names PaymentWorks, JAGGAER, SAM.gov, plus internal CRM and AR analyst role. |
| endpoint_details | PASS | SAM.gov populated with URL, auth, rate limit, pricing, ToS. PaymentWorks + JAGGAER marked vendor-gated with what is publicly visible and explicit unknown-search lists. |
| fields_returned | PASS | SAM.gov field list concrete; PaymentWorks/JAGGAER marked vendor-described. |
| marginal_cost_per_check | PASS | SAM.gov $0; CRM lookup best-guess; setup cost called out separately. |
| manual_review_handoff | PASS | 5-step concrete SOP. |
| flags_thrown | PASS | Five named flags with actions. |
| failure_modes_requiring_review | PASS | Rate limit, non-PW/JAGGAER procurement, foreign, mid-registration, ID changes. |
| false_positive_qualitative | PASS | Three FP classes. |
| record_left | PASS | Concrete schema. |

## For 4C to verify

- "SAM.gov public tier 10 requests/day" — verify on open.gsa.gov entity API page.
- "JAGGAER advertises 13M+ pre-validated suppliers" — verify on solution page.
- "PaymentWorks suppliers maintain one account across all PaymentWorks customers" — verify on paymentworks.com or university FAQ.
- "Jaggaer registration takes ~20 minutes per institution" — verify against IU SDM page.
- "UEI replaced DUNS in 2022" — common-knowledge, but cite if needed.

## Verdict

PASS
