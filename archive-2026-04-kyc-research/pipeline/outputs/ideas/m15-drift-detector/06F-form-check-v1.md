# 06F form-check v1 — m15-drift-detector

| Field | Verdict | Note |
|---|---|---|
| Gap 1 (cold-start) | PASS | `[best guess]` with reasoning about order frequency distribution. Correctly identified as the most significant gap. |
| Gap 2 (sparse customers) | PASS | Distinct from cold-start; temporal resolution issue well-articulated. |
| Gap 3 (core-facility accounts) | PASS | Cites Ithaka S+R and IMARC. |
| Gap 4 (CRO accounts) | PASS | Cites Prophecy Market Insights for commercial share. |
| Gap 5 (legitimate pivots) | PASS | Strong sourcing: 2025 Nature paper and Science Policy paper on research pivots. |
| Gap 6 (free-text fields) | PASS-with-caveat | Size is `[unknown ...]` with search list. The 10–25% best-guess uses generic form-design heuristics. |
| Gap 7 (consistent attacker) | PASS | Structural blind spot correctly identified; acknowledged by 04-implementation itself. |
| false_positive_qualitative | PASS | Rank-ordered; dominated by legitimate pivots. |
| Notes for stage 7 | PASS | Cold-start and high FP rate correctly flagged as critical limitations. |

## Issues

1. **Gap 1 order-frequency estimate:** "30–50% of accounts have <10 orders" is plausible but lacks a direct synthesis-industry citation. The DNA Scanner paper cited discusses vendor comparison, not customer order frequency. Minor — the reasoning is sound even without a direct source.

## Verdict

PASS — proceed to 6C.
