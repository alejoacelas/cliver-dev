# Form check: m20-coauthor-graph / 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Size estimated? | Citation/marker? | Behavior classified? | Issues |
|-----|-------------------|----------------|-------------------|---------------------|--------|
| Gap 1 (industry non-publishers) | Yes — precise | Yes — 30-50% of industry | Cited (Grand View, LinkedIn) + [best guess] | no-signal | OK |
| Gap 2 (non-US grants) | Yes — precise | Yes — ~30-40% customers | [best guess] cross-ref to m19 | weak-signal | Could use a direct citation for non-US grant agency coverage |
| Gap 3 (pre-publication collaborators) | Yes — precise | Marked [unknown] | [unknown] properly marked | no-signal | OK |
| Gap 4 (small subfields) | Yes — precise | Qualitative [best guess] | [best guess] | false-positive | No numerical estimate of how many subfields or customers affected |
| Gap 5 (disambiguation failures) | Yes — precise | Marked [unknown] | Cited (OpenAlex stats) + [unknown] for error rate | weak-signal | OK |

## Schema field: `false_positive_qualitative`

Populated: yes. Cross-references gaps. Adds disambiguation collisions and industry no-signal category.

## Completeness check

- All gaps have category, estimated size, behavior, and reasoning: **PASS**
- All estimates have either a citation or a `[best guess]`/`[unknown]` marker: **PASS**
- No bare numbers: **PASS**
- `false_positive_qualitative` refined: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

1. **Gap 4 lacks a numerical size estimate** — even a rough proxy (e.g., number of rare-disease research communities or select-agent-relevant subfields) would strengthen the analysis.
2. **Gap 2 could cite a specific non-US funder** (e.g., ERC grant count vs. NIH grant count) to make the coverage gap more concrete.

## Verdict: PASS with minor flags
