# 04F form check — m11-crypto-onramp-denylist v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Honest about no in-corpus stress |
| summary | PASS | Two legs clearly described |
| external_dependencies | PASS | |
| endpoint_details | PASS | Both legs concretely specified; referrer-leg limitations honestly noted |
| fields_returned | PASS | Per-leg field lists |
| marginal_cost_per_check | PASS | Best-guess setup cost; runtime $0 |
| manual_review_handoff | PASS | Two flag paths; referrer SOP honestly notes near-zero volume |
| flags_thrown | PASS | |
| failure_modes_requiring_review | PASS | List staleness, funding-type mis-report, referrer suppression, sponsor ambiguity, wallet tokens |
| false_positive_qualitative | PASS | Honestly small |
| record_left | PASS | |

## For 4C to verify

- Coinbase Card is issued by Pathward, N.A. (current) and was previously issued by MetaBank. The cardholder agreement PDF URLs should resolve.
- Crypto.com Visa Card issuer attribution.
- Stripe Radar `:card_bin:` predicate exists (the document uses this syntax).
- BlockFi Card was shut down in 2023 (claim used to justify list-staleness mode).
- Marqeta powers Coinbase Card (background claim).

## Verdict

PASS. The document is openly honest about the referrer leg's near-zero adversarial value, which is the right framing for a defense-in-depth check that the attacker corpus does not stress.
