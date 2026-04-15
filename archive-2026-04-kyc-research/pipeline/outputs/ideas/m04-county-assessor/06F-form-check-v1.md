# Form check: m04-county-assessor — 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Estimated size cited? | Behavior labeled? | Issues |
|-----|--------------------|-----------------------|-------------------|--------|
| Gap 1: International | Yes | Yes — cites revenue splits from Fortune BI and Precedence Research; order-count fraction is [best guess] | no-signal | The order-count estimate (40–55%) is a best guess with stated reasoning. Acceptable. |
| Gap 2: DIY-bio residential | Yes | Partially — cites PMC article on ~15 community labs; individual practitioners are [best guess] | false-positive | The per-individual count (500–3,000) is weakly grounded. The share-of-orders estimate (<1%) is plausible but not cited. Flag: **thin proxy**. |
| Gap 3: Sole-proprietor founders | Yes | Partially — cites IRS sole-proprietorship data (40% home office); biotech-specific fraction is [best guess] | false-positive | No biotech-specific proxy found. Acceptable given the [best guess] admission. |
| Gap 4: Live-work / mixed-use | Yes | Partially — cites CoworkingCafe (43K live-work apartments); stale-code fraction is [unknown] | false-positive / weak-signal | The [unknown] for stale-code mismatch rate is properly admitted with search terms. |
| Gap 5: Attribute completeness | Yes | Partially — cites Regrid 100% county coverage and 92% annual refresh; use-code completeness is [best guess: 85–95%] | no-signal | The 85–95% figure has no external citation. Flag: **best-guess without derivation inputs**. |

## Schema field: `false_positive_qualitative`

Populated and cross-referenced to gaps. Adequate.

## Overall

- **PASS with minor flags.** Two flags:
  1. Gap 2 proxy for individual home-lab practitioners is thin (no direct count exists).
  2. Gap 5 use-code completeness estimate (85–95%) lacks derivation inputs.
- Neither flag is blocking — both are honestly admitted as best guesses.
