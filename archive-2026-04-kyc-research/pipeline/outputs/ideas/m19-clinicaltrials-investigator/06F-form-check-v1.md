# 06F form check v1 — m19-clinicaltrials-investigator

| Field | Verdict | Note |
|---|---|---|
| Gap identification | PASS | Six gaps, all specific to the ClinicalTrials.gov + BMIS data sources. |
| Category precision | PASS | Each gap precisely describes the customer population (e.g., "bench scientists at sponsor companies not listed on Form 1572"). |
| Estimated size — citations | BORDERLINE | Gap 1 cites BMIS investigator count (~172k) and life-sciences workforce growth. Gap 2 cites ClinicalTrials.gov 500k studies. Gaps 3–6 are [best guess] with reasoning but limited external citations. |
| Estimated size — [unknown] admissions | PASS | All estimates marked [best guess] where no direct source exists. No bare numbers. |
| Behavior classification | PASS | All six gaps classified as no-signal with clear reasoning. |
| False-positive qualitative | PASS | Correctly identifies the check as positive-evidence-shaped; separates coverage gaps from accuracy issues. |
| Notes for stage 7 | PASS | Clear recommendation against standalone use; signal-fusion guidance. |

## For 6C to verify

- Claim: "172,453 unique investigators submitted Form FDA 1572 during 1999–2015" — cited to PMC6536616.
- Claim: "ClinicalTrials.gov has >500,000 registered studies" — cited to NLM blog post April 2025.
- Claim: "US life-sciences researcher workforce grew 87% between 2002–2022" — cited to CBRE report.
- Claim: "~40,000+ biological/biomedical PhDs per year" — cited to PMC4503365.
- Claim: "1 tenure-track position per ~6.3 PhD graduates" — cited to PMC4503365.

## Verdict

PASS — comprehensive gap analysis with appropriate positive-evidence framing. Size estimates for Gaps 3–6 could use stronger external citations but reasoning is sound and [best guess] markers are present.
