# m14-onfido — Bypass-aware hardening v1

- **measure:** M14 — identity-evidence-match
- **idea:** Onfido (Entrust Identity Verification) Studio workflow — document + biometric (Motion liveness)

---

## Attacker story walk

### Group A: Identity-theft branches with active IDV-pipeline bypasses

**Stories 1–4: account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A)**

**Bypass methods and classification:**

- **Deepfake injection against liveness flow** (stories 1, 2, 3, 4)
  - **CAUGHT (with caveat)** — Onfido Motion is explicitly designed to detect injection attacks. The implementation doc cites iBeta Level 2 compliance and CEN/TS 18099:2024 alignment for injection detection. The `source_integrity` sub-check in Motion specifically flags "fake webcam, emulator, network-injected video." **AMBIGUOUS** if the integrator uses Facial Similarity Standard instead of Motion — standard does not include injection detection. Implementation doc notes: "Motion not enabled → injection attacks more likely to slip through; deepfakes now reported every five minutes."

- **Face morphing on forged/altered government document** (stories 1, 2, 3)
  - **CAUGHT (partially)** — Onfido Document report includes `visual_authenticity` checks (fonts, photo features, visual tampering). The `compromised_document` check matches against Onfido's known-fraud DB. However, a high-quality morph on genuine document substrate that passes visual authenticity checks may also pass the face comparison (the morph is designed to match both the document portrait and the attacker's live face). Onfido does not publicly document morph-attack detection (MAD) as a discrete capability.
  - **AMBIGUOUS** on sophisticated morphs.

- **IDV-session handoff exploit** (story 1)
  - **AMBIGUOUS** — Depends on Onfido SDK session-binding. The SDK captures document + selfie/Motion on the customer's device. If the SDK enforces that document capture and selfie must occur on the same device in the same session, handoff is difficult. Not explicitly documented in the implementation.

- **ATO inherits prior IAL2 pass** (story 2)
  - **MISSED** — Same as Jumio: only effective if the provider re-triggers Onfido at order time.

- **Social-engineer support** (stories 2, 3)
  - **MISSED** — Bypasses the automated pipeline.

- **Injection against weak vendor SDK ($5-30K rig)** (story 4)
  - **CAUGHT** (Motion enabled) / **AMBIGUOUS** (Standard only) — Same as deepfake injection.

- **Fraudulent govt ID + selfie** (story 2)
  - **CAUGHT** — Document report `visual_authenticity`, `image_integrity`, `compromised_document` checks designed for this.

- **Presentation attack** (story 2)
  - **CAUGHT** — Motion liveness detects physical spoofs (photos, masks).

**Net assessment for stories 1-4:** Very similar profile to Jumio. Onfido Motion provides strong injection detection. Residual risks: morphs (MAD not confirmed), ATO-inherits-prior-pass, social-engineering the reviewer. Motion vs. Standard distinction is the key configuration lever.

---

### Story 5: cro-identity-rotation (Branch B)

- **Fresh real accomplice per persona**
  - **MISSED** — Passes natively.

### Story 6: shell-nonprofit (Branch E)

- **Real accomplice, real ID**
  - **MISSED** — Passes natively.

### Story 7: biotech-incubator-tenant (Branch D)

- **Real ID throughout**
  - **MISSED** — Same.

### Story 8: bulk-order-noise-cover (Branch E)

- **Shared-account predecessor**
  - **CAUGHT** — If re-proofing enforced, face comparison detects mismatch. `face_comparison = no_match` fires.

### Story 9: it-persona-manufacturing (Branch B)

- **Same person, multiple personas**
  - **MISSED** — Per-transaction IDV; no cross-applicant check. However, Onfido's `compromised_document.repeat_attempts` check may flag if the same document image is submitted for multiple applicants within the tenant. **CAUGHT** only for document-image reuse, not face reuse.

### Story 10: inbox-compromise (Branch B)

- **Email-only ordering**
  - **CAUGHT** — If Onfido IDV required for SOC orders, email-only is blocked.

### Stories 11-19: Real-identity branches

- **Real ID throughout**
  - **MISSED** — Passes natively.

---

## Findings

### Moderate

**M1: Motion vs. Standard Facial Similarity not mandated.**
- **Source:** Stories 1-4 deepfake/injection bypasses.
- **Why missed:** The implementation doc describes Motion as the defense against injection and deepfakes but lists "Motion not enabled on the workflow" as a failure mode rather than a hard requirement.
- **Suggestion:** Stage 4 should mandate Motion (or equivalent injection-resistant liveness) for the SOC-order workflow.

**M2: ATO-inherits-prior-IAL2 gap.**
- **Source:** Story 2.
- **Why missed:** Same as Jumio. No explicit re-proofing trigger policy.
- **Suggestion:** Same as Jumio: stage 4 should add an explicit re-proofing trigger policy.

**M3: Morph attack detection not confirmed.**
- **Source:** Stories 1, 2, 3.
- **Why missed:** `visual_authenticity` catches overt tampering; `compromised_document` catches known-fraud matches. Sophisticated morphs on genuine substrate may pass both.
- **Suggestion:** Flag as residual risk. NFC chip read mitigates.

**M4: Fronted-accomplice branches structurally unaddressed.**
- **Source:** Stories 5, 6, 7, 11-19.

### Minor

**m1: `compromised_document.repeat_attempts` may partially catch multi-persona document reuse but is not documented as a cross-applicant check.**
- **Source:** Story 9.
- **Suggestion:** Clarify whether this check is within-applicant or across all applicants in the tenant.

**m2: Watchlist sub-provider staleness noted as failure mode but not tied to specific bypass stories.**
- **Suggestion:** Minor; sanctions matching is a different measure.

---

## bypass_methods_known

| Bypass method | Classification | Source stories |
|---|---|---|
| Deepfake injection (Motion enabled) | CAUGHT | 1, 2, 3, 4 |
| Deepfake injection (Standard only) | AMBIGUOUS | 1, 2, 3, 4 |
| Face morphing on genuine document | AMBIGUOUS | 1, 2, 3 |
| IDV-session handoff | AMBIGUOUS | 1 |
| ATO inherits prior IAL2 | MISSED | 2 |
| Fraudulent govt ID | CAUGHT | 2 |
| Presentation attack | CAUGHT | 2 |
| Social-engineer support/reviewer | MISSED | 2, 3 |
| Injection against weak SDK | CAUGHT (Motion) / AMBIGUOUS (Standard) | 4 |
| Fresh real accomplice | MISSED | 5, 6, 7 |
| Shared-account predecessor (with re-proof) | CAUGHT | 8 |
| Same-person multi-persona | MISSED | 9 |
| Email-only ordering | CAUGHT (if required) | 10 |
| Real ID throughout | MISSED | 11-19 |

## bypass_methods_uncovered

- ATO inherits prior IAL2 without re-proofing
- Face morphing on genuine document substrate (MAD not confirmed)
- Social-engineer support/reviewer
- Fresh real accomplice (structural)
- Same-person multi-persona (per-transaction, no cross-applicant face check)
- Real ID throughout (structural)

---

## Verdict: **PASS**

No Critical findings. Profile is nearly identical to Jumio. Motion provides strong injection defense; residual gaps (ATO, morph, accomplice) are the same structural and operational risks. Moderate findings on Motion mandate and re-proofing trigger policy are concrete improvements. Pipeline continues to stage 6.
