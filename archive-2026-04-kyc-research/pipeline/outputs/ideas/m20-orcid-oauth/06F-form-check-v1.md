# Form check: m20-orcid-oauth / 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Size estimated? | Citation/marker? | Behavior classified? | Issues |
|-----|-------------------|----------------|-------------------|---------------------|--------|
| Gap 1 (no ORCID — industry/clinical) | Yes — precise | Yes — 20-40% overall | Cited (Wikipedia, Springer, Toulouse) + [best guess] | no-signal | OK |
| Gap 2 (empty/private profiles) | Yes — precise | Yes — 20-30% | Cited (ResearchGate/Spanish study) + [best guess] | weak-signal | OK |
| Gap 3 (low-adoption regions) | Yes — precise | Yes — 20-40% regional | Cited (Frontiers) + [best guess] | no-signal | OK |
| Gap 4 (stale employment) | Yes — precise | Marked [unknown] + [best guess] | [unknown] properly marked | weak-signal / false-positive | OK |
| Gap 5 (fabricated profiles) | Yes — precise | Marked [unknown] | [unknown] properly marked | no-signal | OK |

## Schema field: `false_positive_qualitative`

Populated: yes. Cross-references all 5 gaps. Provides cumulative estimate segmented by population.

## Completeness check

- All gaps have category, estimated size, behavior, and reasoning: **PASS**
- All estimates have either a citation or a `[best guess]`/`[unknown]` marker: **PASS**
- No bare numbers: **PASS**
- `false_positive_qualitative` refined: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

1. **Gap 1 ORCID total registration count** is dated (14.7M from Aug 2022). A more current figure would strengthen the estimate. The 2024/2025 total was not found in web search.
2. **Gap 2 Spanish study** may not generalize to the global voucher population. Acknowledged implicitly but could be flagged more explicitly.

## Verdict: PASS with minor flags
