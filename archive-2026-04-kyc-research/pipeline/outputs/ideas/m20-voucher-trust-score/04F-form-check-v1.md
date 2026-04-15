# 4F form check — m20-voucher-trust-score v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | Cleanly distinguishes weighted score from the non-bypassable institutional gate. |
| external_dependencies | PASS | Internal-build path explicit; Persona Graph and AML scoring engines with citations as buy-path options. |
| endpoint_details | PASS | Correctly notes the build-path "endpoint" is internal; vendor-gated for buy path. |
| fields_returned | PASS | Concrete JSON example with `contributions[]` for explainability. |
| marginal_cost_per_check | PASS | Reviewer cost dominates and is best-guess; setup cost noted. |
| manual_review_handoff | PASS | Seven-step SOP including drift monitoring and model-card update discipline. |
| flags_thrown | PASS | Six flags including a positive case and an operational drift flag. |
| failure_modes_requiring_review | PASS | Six failure modes including the explainability ask. |
| false_positive_qualitative | PASS | Six categories explicitly naming structural bias against industry / foreign / privacy-strict legitimate vouchers. |
| record_left | PASS | Score JSON + reviewer note + model card version + drift time-series + hash. |

## Borderline observations

- The 25%-review-rate / 10-min/review labor estimate is best-guess without a citation. Acceptable per pipeline conventions but a real production deployment would refine this from labeled data.
- The threshold values (80 / 40) are stated without calibration evidence; that's appropriate for v1 since calibration is a setup-time activity, not a research-time one.

## For 4C to verify

- Persona Graph's actual signal coverage and that SentiLink/Prove are integrations (not first-party Persona signals).
- The general claim that AML risk-scoring engines (Flagright, Alessa) support custom weighted rules.
- The Pace Analytics CFPB Circular 2022-03 framing of AI-explainability for adverse action.

**Verdict:** PASS
