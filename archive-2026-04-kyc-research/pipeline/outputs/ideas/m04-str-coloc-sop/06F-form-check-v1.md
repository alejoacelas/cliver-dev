# Form check: m04-str-coloc-sop — 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Estimated size cited? | Behavior labeled? | Issues |
|-----|--------------------|-----------------------|-------------------|--------|
| Gap 1: International addresses | Yes | Partially — references m04-county-assessor Gap 1 derivation; Inside Airbnb coverage cited (165 cities) | no-signal | Acceptable — cross-references prior coverage work. |
| Gap 2: Non-Airbnb/VRBO platforms | Yes | Partially — cites US STR total (1.8M properties from RubyHome); Airbnb US share is [best guess] | no-signal | The 50–60% Airbnb market share figure is [best guess] without a direct citation. Flag: **thin proxy**. |
| Gap 3: Inside Airbnb geographic limits | Yes | Yes — cites 165 cities from insideairbnb.com; US coverage fraction is [best guess: 40–50%] | weak-signal | The 40–50% figure is a best guess with reasoning. Acceptable. |
| Gap 4: Lat/lng obfuscation | Yes | Partially — describes the mechanism; 10–20% ambiguity rate is [best guess] | weak-signal | No citation for obfuscation radius affecting 10–20% of checks. Acceptable as best guess. |
| Gap 5: Delisted STRs | Yes | [unknown] properly admitted with search terms | no-signal | Acceptable. |

## Schema field: `false_positive_qualitative`

Populated with three categories, cross-referenced. Adequate.

## Overall

- **PASS with minor flag.** One flag:
  1. Gap 2's Airbnb market share (50–60%) lacks a direct citation.
- The analysis correctly frames this as a second-line check with a filtered denominator, which appropriately contextualizes the gaps.
