# 04F form check — m12-pcard-bin v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Refined from spec; names 4 stories. |
| summary | PASS | |
| external_dependencies | PASS | Names VBASS, MC API, BinDB, aggregators, PSP passthrough. |
| endpoint_details | PASS | Covers VBASS (vendor-gated), MC (auth + pricing unknown), BinDB (best-guess pricing), binlist.net (rate-limited). Auth model and rate limits each addressed. |
| fields_returned | PASS | Concrete: product platform, funding source, issuer name/country, product name. |
| marginal_cost_per_check | PASS | Each candidate has cost or vendor-gated/unknown marker. |
| manual_review_handoff | PASS | 5-step concrete SOP. |
| flags_thrown | PASS | Three named flags with actions. |
| failure_modes_requiring_review | PASS | API outage, missing product, BIN sponsor white-label, VCN, non-US. |
| false_positive_qualitative | PASS | Three FP classes named. |
| record_left | PASS | Concrete record schema. |

## For 4C to verify

- The claim that VBASS exposes "Product Platform (consumer vs commercial)" — verify the Visa product page actually lists this attribute.
- The claim that binlist.net rate-limits to "5 req/sec" — verify on the site.
- The claim that Pagos BIN Product Code Guide enumerates Visa product names like "Visa Purchasing".
- The claim that JPM PaymentNet is bundled with their commercial card programs.

## Verdict

PASS
