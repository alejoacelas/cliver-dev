# 04F form check — m11-psp-config-audit v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | |
| summary | PASS | Code-as-config drift detection |
| external_dependencies | PASS | Stripe, Adyen, Braintree, CI runner, alerting |
| endpoint_details | PASS | Three PSPs each with endpoint URL, auth, rate limits, ToS |
| fields_returned | PASS | Per-PSP field lists |
| marginal_cost_per_check | PASS | $0 + best-guess setup hours |
| manual_review_handoff | PASS | 5-step incident SOP with time target |
| flags_thrown | PASS | |
| failure_modes_requiring_review | PASS | 5 modes including Connect platform and test/live mismatch |
| false_positive_qualitative | PASS | |
| record_left | PASS | |

## For 4C to verify

- Stripe `crypto_payments` capability exists on the Account object.
- Stripe stablecoin payment method type was added 2025-06-30 (changelog URL).
- Adyen Management API `paymentMethodSettings` endpoint URL.
- Braintree-Adyen default payment methods are Visa/Mastercard/Amex.
- Stripe's standard read rate limit (100 req/sec) — referenced as "well above audit needs."

## Verdict

PASS
