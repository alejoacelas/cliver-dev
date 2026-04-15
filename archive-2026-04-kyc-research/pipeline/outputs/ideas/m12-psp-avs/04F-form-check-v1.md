# 04F form check — m12-psp-avs v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Refined; covers 5 stories. |
| summary | PASS | |
| external_dependencies | PASS | Stripe, Adyen, Braintree, Plaid Identity. Braintree marked best-guess. |
| endpoint_details | PASS | All three PSPs + Plaid have URL/auth/pricing/limits info or explicit unknown markers. |
| fields_returned | PASS | Stripe field names, Adyen letter codes, Plaid score fields. |
| marginal_cost_per_check | PASS | $0 for AVS, best-guess for Plaid; setup cost called out. |
| manual_review_handoff | PASS | Two parallel SOPs (card / ACH), each with concrete decision branches. |
| flags_thrown | PASS | Seven named flags. |
| failure_modes_requiring_review | PASS | Non-US, typos, Plaid Link abandonment, small-bank coverage, stale issuer data. |
| false_positive_qualitative | PASS | Movers, international students, corporate-card HQ-vs-lab, expense-later, intl orders. |
| record_left | PASS | Concrete schema. |

## For 4C to verify

- "Stripe AVS check fields are address_line1_check, address_postal_code_check, cvc_check" — verify on Stripe docs page.
- "Adyen AVS effective only for US, CA, UK, Visa-EU" — verify on docs.adyen.com page.
- "Plaid Identity Match is per-request flat fee" — verify on plaid.com/docs/account/billing.
- "Stripe processing fee 2.9% + $0.30 for US cards" — bundled-claim, verify on stripe.com.

## Verdict

PASS
