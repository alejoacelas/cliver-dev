# Form check: m04-usps-rdi — 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Estimated size cited? | Behavior labeled? | Issues |
|-----|--------------------|-----------------------|-------------------|--------|
| Gap 1: International | Yes | Yes — cites Precedence Research revenue splits; order-count is [best guess] | no-signal | Cross-references m04-county-assessor derivation. Acceptable. |
| Gap 2: DIY-bio residential | Yes | Yes — cross-references m04-county-assessor Gap 2 with same citations | false-positive | Acceptable. |
| Gap 3: Sole-proprietor founders | Yes | Yes — cross-references m04-county-assessor Gap 3 with IRS citation | false-positive | Acceptable. |
| Gap 4: Mixed-use buildings | Yes | Partially — cites live-work apartment count (43K); unit-level RDI accuracy is [unknown] with search terms + [best guess: 85–95%] | weak-signal | The 85–95% figure lacks derivation inputs. Flag: **best-guess without cited inputs**. |
| Gap 5: New construction | Yes | [unknown] properly admitted | no-signal | Acceptable. |

## Schema field: `false_positive_qualitative`

Populated with four categories. Insightful observation that RDI's FP population is a strict subset of county assessor's. Adequate.

## Overall

- **PASS with minor flag.** One flag:
  1. Gap 4's unit-level RDI accuracy estimate (85–95%) has no external source.
- The analysis correctly identifies redundancy with m04-county-assessor, which is valuable for stage 7 synthesis.
