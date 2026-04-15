# 4F form check — m20-live-video-attestation v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | Names 5 video-KYC vendors and 3 deepfake-detector vendors with citations. |
| endpoint_details | PASS | Build vs buy split is concrete; pricing/rate-limit gaps marked vendor-gated/unknown with valid admissions. |
| fields_returned | PASS | Concrete field list, [vendor-described] marker is appropriate. |
| marginal_cost_per_check | PASS | Two paths costed; setup cost called out; vendor cost honestly marked best-guess + vendor-gated. |
| manual_review_handoff | PASS | Five-step SOP, specific rubric, escalation path. |
| flags_thrown | PASS | Six flags, each tied to a human action via the SOP. |
| failure_modes_requiring_review | PASS | Five concrete failure modes. |
| false_positive_qualitative | PASS | Five distinct legitimate-customer cases. |
| record_left | PASS | MP4 + hash + retention model + vendor audit-log XML noted. |

## Borderline observations

- Reviewer-labor cost ($25) is best-guess based on a 25-min session — defensible but not cited. Acceptable as `[best guess: ...]`.
- Vendor per-call price band ($2–$8) is best-guess from public IDV ranges; could be tightened by a sales contact. Acceptable as vendor-gated.
- Rate-limits unknown admission has only 2 queries listed — meets the floor but is on the thin side. Not blocking; rate limits aren't binding here per the doc's own logic.

## For 4C to verify

- Facia.ai claim of >90% deepfake detection accuracy on live-video calls.
- Shufti Pro claim of 5–10 year audit-log XML retention.
- Sensity AI claim of real-time face/voice/media authenticity validation.
- Generic claim that Jumio / Onfido / Persona use custom (non-public) pricing.

**Verdict:** PASS
