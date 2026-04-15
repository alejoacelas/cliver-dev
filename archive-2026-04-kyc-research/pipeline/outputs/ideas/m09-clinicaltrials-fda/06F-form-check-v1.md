# 06F Form check — m09-clinicaltrials-fda v1

| Field | Verdict |
|---|---|
| coverage_gaps | PASS — 5 gaps identified with precise categories and behavioral classifications. |
| Gap 1 estimated size | PASS — ClinicalTrials.gov ~12,000-15,000 unique sponsors cited; NCES institution count cited; 644 biological research centers cited. Academic false-negative rate marked [best guess]. |
| Gap 2 estimated size | PASS — biotech company count cited; comparison to CT.gov sponsor count. |
| Gap 3 estimated size | PASS — [best guess] with reasoning about US-centric data sources. |
| Gap 4 estimated size | PASS — [best guess] with reasoning about community bio labs. |
| Gap 5 estimated size | PASS — [best guess] with name-normalization examples. |
| false_positive_qualitative (refined) | PASS — correctly confirms that FP are overwhelmingly false negatives; reaffirms implementation's own assessment. |
| Notes for stage 7 | PASS — actionable framing as low-cost positive signal with narrow coverage. |

## For 6C to verify
- ClinicalTrials.gov 500,000+ studies and 12,823 unique drug-trial sponsors — verify PMC source and NLM blog
- 644 biological research centers in the US — verify Causeiq source
- ~2,800+ biotech companies in the US — verify Statista source
- ClinicalTrials.gov reached 500K+ milestone in April 2025 — verify NLM Director blog post

## Verdict
**PASS**
