# 04F form check — m11-msa-prohibition v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Honest about no in-corpus stress |
| summary | PASS | Two-leg structure clear |
| external_dependencies | PASS | |
| endpoint_details | PASS | Both legs concrete; regex patterns inline with citations |
| fields_returned | PASS | |
| marginal_cost_per_check | PASS | Per-leg costs estimated with reasoning |
| manual_review_handoff | PASS | 4-class triage |
| flags_thrown | PASS | Two flags |
| failure_modes_requiring_review | PASS | Both FP and FN modes |
| false_positive_qualitative | PASS | |
| record_left | PASS | |

## For 4C to verify

- The Bitcoin and Ethereum regex patterns are correct (P2PKH, Bech32, EVM 0x40-hex).
- Cited regex sources resolve.
- Outside counsel rate band ($300–$500/hr) for the legal-review cost — best-guess only, no citation.

## Verdict

PASS. Document is appropriately framed as a defense-in-depth + paper-trail control rather than a primary block.
