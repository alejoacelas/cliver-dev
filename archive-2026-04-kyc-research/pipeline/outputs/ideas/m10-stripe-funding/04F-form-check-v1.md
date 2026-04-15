# 04F form check — m10-stripe-funding v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | |
| summary | PASS | Names exact field on each PSP |
| external_dependencies | PASS | Stripe + Adyen; explicitly notes no third-party data subscription |
| endpoint_details | PASS | URLs, auth, rate limits, ToS for both PSPs. Adyen rule syntax marked best-guess |
| fields_returned | PASS | Concrete field lists for both PSPs |
| marginal_cost_per_check | PASS | Exact Stripe figures cited; Adyen vendor-gated |
| manual_review_handoff | PASS | Two flag paths with separate SOPs |
| flags_thrown | PASS | |
| failure_modes_requiring_review | PASS | 5 modes |
| false_positive_qualitative | PASS | 4 categories named, including unknown-class |
| record_left | PASS | |

## For 4C to verify

- "Radar for Fraud Teams costs 7¢ per transaction or 2¢ per transaction with standard payments processing" — exact pricing.
- "Radar (ML only, no custom rules) is 5¢/tx, waived on standard pricing" — verify the "waived" claim and that custom rules require Fraud Teams.
- Stripe `card.funding` enum (`credit/debit/prepaid/unknown`) on the PaymentMethod object page.
- Adyen `fundingSource` field exists and includes `prepaid` value.
- `:card_funding:` is the literal Radar attribute name.

## Verdict

PASS
