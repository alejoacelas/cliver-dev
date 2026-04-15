# Form check: m15-llm-extraction / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap | Category precision | Size estimate | Citation quality | Behavior label | Verdict |
|---|---|---|---|---|---|---|
| 1 | Non-English submissions | Precise (low-resource language customers) | [best guess: 10-20%] with regional revenue cite as anchor | OK -- two multilingual NER studies cited for accuracy degradation | weak-signal | PASS |
| 2 | Terse/formulaic submissions | Precise (minimal free text) | [best guess: 15-30%] -- no citation | Thin -- this is a load-bearing estimate (determines how often the check provides value) and has no sourcing | weak-signal / no-signal | FLAG: search list only 2 queries. Consider searching for synthesis order form field analysis, customer screening data, or provider UX studies. |
| 3 | Multi-category projects | Precise | [best guess: 10-20%] -- no citation | Thin | false-positive | FLAG: minor -- the range is plausible but unsupported. |
| 4 | Non-standard nomenclature | Precise (lab shorthand) | [best guess: 5-10%] with NCBI taxonomy cite for context | Acceptable | false-positive | PASS |
| 5 | Grant-abstract prose | Precise | [best guess: 5-15%] -- no citation | Acceptable for a secondary gap | false-positive | PASS |

## Schema field: `false_positive_qualitative`

Refined list present with 5 categories cross-referenced to gaps. Correctly distinguishes false-positive from weak-signal/no-signal. PASS.

## Schema field: `notes for stage 7 synthesis`

Present and actionable (mitigation suggestions for multi-category, non-English, and pairing with m15-screening-reconciliation). PASS.

## Overall form verdict

**2 FLAGs:**
1. Gap 2 (terse submissions) size estimate is load-bearing and unsourced -- needs a stronger search or explicit [unknown] upgrade.
2. Gap 3 (multi-category) size estimate is minor but unsupported.

The gap list is appropriate for this data source (LLM extraction quality depends on input text quality, so text-quality-related gaps dominate).
