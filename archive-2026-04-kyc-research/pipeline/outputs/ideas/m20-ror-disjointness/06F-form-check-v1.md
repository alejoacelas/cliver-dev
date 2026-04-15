# Form check: m20-ror-disjointness / 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Size estimated? | Citation/marker? | Behavior classified? | Issues |
|-----|-------------------|----------------|-------------------|---------------------|--------|
| Gap 1 (not in ROR) | Yes — precise | Yes — 15-25% | Cited (ROR FAQs, year-in-review, STI 2022) + [best guess] | no-signal | OK |
| Gap 2 (complex hierarchies) | Yes — precise | Qualitative + [best guess] | [best guess] | false-positive | No citation for number of university systems or medical centers; general knowledge |
| Gap 3 (single-institution) | Yes — precise | Qualitative + [best guess] | [best guess] | false-positive | No citation for number of small colleges with DNA synthesis customers |
| Gap 4 (shell orgs in ROR) | Yes — precise | Marked [unknown] | [unknown] properly marked | no-signal | OK |
| Gap 5 (sparse country coverage) | Yes — precise | Yes — ~20% | Cited (STI 2022) + [best guess] | no-signal | OK |

## Schema field: `false_positive_qualitative`

Populated: yes. Cross-references all gaps. Provides cumulative estimate.

## Completeness check

- All gaps have category, estimated size, behavior, and reasoning: **PASS**
- All estimates have either a citation or a `[best guess]`/`[unknown]` marker: **PASS**
- No bare numbers: **PASS**
- `false_positive_qualitative` refined: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

1. **Gap 2 and Gap 3 lack numerical citations** — the counts of university systems (~20) and small colleges (~2,000) are stated as general knowledge without sources. A Carnegie Classification or IPEDS reference would strengthen these.
2. **Gap 1 estimate of 40,000-50,000 biotech companies** is not cited and may be high. A more conservative estimate with a source would be preferable.

## Verdict: PASS with minor flags
