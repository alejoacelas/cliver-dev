# 04F form check — m12-billing-shipping-consistency v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | All 5 in-corpus branches enumerated with mechanism |
| summary | PASS | Triple-consistency framing concrete |
| external_dependencies | PASS | libpostal / Smarty / Google compared; institution canonical store dependency noted |
| endpoint_details | PASS | URLs, auth, rate limits, ToS, USPS retirement noted |
| fields_returned | PASS | Triple_consistency_record schema + Smarty per-address fields |
| marginal_cost_per_check | PASS | $0.003–$0.009 calculation shown |
| manual_review_handoff | PASS | Decision tree with time target |
| flags_thrown | PASS | 6 distinct subflags + umbrella |
| failure_modes_requiring_review | PASS | 6 modes including the structural inbox-compromise driving-distance bypass |
| false_positive_qualitative | PASS | 5 categories named |
| record_left | PASS | |

## For 4C to verify

- Smarty pricing: $20/month for 500 lookups; $0.60–$1.50 / 1,000.
- USPS Web Tools retired Jan 25, 2026 (load-bearing for "no longer viable").
- Smarty international pricing $1.50–$3.00 / 1,000.
- libpostal weakness on US secondary units.
- Stripe `payment_method.billing_details.address` field path.

## Verdict

PASS
