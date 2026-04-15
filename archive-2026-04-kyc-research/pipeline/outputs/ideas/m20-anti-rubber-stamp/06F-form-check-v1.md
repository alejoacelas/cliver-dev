# Form check: m20-anti-rubber-stamp / 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Size estimated? | Citation/marker? | Behavior classified? | Issues |
|-----|-------------------|----------------|-------------------|---------------------|--------|
| Gap 1 (single-shot rubber-stamp) | Yes — precise | Yes — 9,000-12,000 PIs | [best guess] + Nature cite | no-signal | Size estimate is for all PIs, not confirmed rubber-stampers; acknowledged |
| Gap 2 (cross-provider rotation) | Yes — precise | Yes — 65+ providers | Cited (Roots Analysis) + [unknown] | no-signal | OK |
| Gap 3 (legitimate high-volume BSOs) | Yes — precise | Yes — ~500-1,000 BSOs | [best guess] + NIEHS cite | false-positive | BSO count is a rough estimate; no direct survey cited |
| Gap 4 (ring-vouching > 4) | Yes — precise | Marked [unknown] | [unknown] properly marked | no-signal | OK |
| Gap 5 (low-volume providers) | Yes — precise | Yes — ~50% of 65+ | Cited (Roots Analysis) + [best guess] | weak-signal | OK |

## Schema field: `false_positive_qualitative`

Populated: yes. Cross-references gaps. Adds BSOs at large institutions as new item.

## Completeness check

- All gaps have category, estimated size, behavior, and reasoning: **PASS**
- All estimates have either a citation or a `[best guess]`/`[unknown]` marker: **PASS**
- No bare numbers: **PASS**
- `false_positive_qualitative` refined: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

1. **Gap 1 reasoning could be stronger** — the claim that "30% of PIs rubber-stamp" is itself a best guess within a best guess. Consider marking the 30% figure more explicitly as assumed.
2. **Gap 3 BSO count** (~500-1,000) has no direct citation. A search for NIH registered IBCs might yield a harder number.

## Verdict: PASS with minor flags
