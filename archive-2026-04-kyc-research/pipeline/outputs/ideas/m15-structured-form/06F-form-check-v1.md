# Form check: m15-structured-form / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap | Category precision | Size estimate | Citation quality | Behavior label | Verdict |
|---|---|---|---|---|---|---|
| 1 | "Other/unknown" escape hatch | Precise | [best guess: 10-25% with at least one; 3-8% excessive] | Thin -- generic survey-design analogy, no synthesis-specific data | weak-signal | FLAG: load-bearing estimate with no citation. The escape-hatch usage rate determines whether the form works at all. |
| 2 | Novel organisms not in NCBI | Precise | [best guess: <2%] with NCBI coverage cite | Adequate -- the 460k / 25% figure is well-cited; the <2% synthesis-specific estimate is reasonable | false-positive | PASS |
| 3 | Multi-category projects | Precise | [best guess: 10-20%] -- no citation | Thin | false-positive / weak-signal | PASS -- minor, same gap noted in m15-llm-extraction |
| 4 | Non-US biosafety frameworks | Precise | ~45% non-NA market (cited) → [best guess: 20-30%] | Adequate derivation from market data | false-positive | PASS |
| 5 | Codon-optimized source ambiguity | Precise | [best guess: 15-25%] -- no citation | Thin but directional (providers universally offer codon optimization) | weak-signal | FLAG: minor -- consider citing Twist or GenScript product pages showing codon optimization as a standard service. |

## Schema field: `false_positive_qualitative`

Refined list with 5 categories, cross-referenced. Correctly identifies "other/unknown" as the primary degradation mode. PASS.

## Schema field: `notes for stage 7 synthesis`

Present and actionable (precondition role, escape-hatch mitigation, international vocabulary extension, multi-select). PASS.

## Overall form verdict

**2 FLAGs:**
1. Gap 1 (escape-hatch usage) is the load-bearing estimate and lacks citation. Needs a more explicit [unknown] or a proxy from adjacent domains.
2. Gap 5 (codon optimization prevalence) minor, could use a citation.

Gap list is well-tailored to a structured-form data source.
