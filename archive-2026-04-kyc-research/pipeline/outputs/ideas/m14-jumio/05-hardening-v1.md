# m14-jumio — Bypass-aware hardening v1

- **measure:** M14 — identity-evidence-match
- **idea:** Jumio Identity Verification (document + selfie liveness, IAL2-equivalent)

---

## Attacker story walk

### Group A: Identity-theft branches with active IDV-pipeline bypasses

**Stories 1–4: account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A)**

**Bypass methods and classification:**

- **Deepfake injection against liveness flow** (stories 1, 2, 3, 4)
  - **CAUGHT (with caveat)** — Jumio Liveness Premium is specifically designed to detect injection attacks (camera emulators, deepfake video feeds). Jumio reported 88% YoY rise in injection attempts and a 9x surge in 2024, indicating active arms race. Implementation doc references Liveness Premium as the relevant defense. **AMBIGUOUS** if the integrator has only standard liveness enabled (not Liveness Premium); the doc notes "Liveness Premium not enabled → injection attacks more likely to slip through."

- **Face morphing on forged/altered government document** (stories 1, 2, 3)
  - **CAUGHT (partially)** — Jumio's document authenticity checks (`rejectReason: MANIPULATED_DOCUMENT, FAKE`) and MRZ/visual consistency checks can detect overt document tampering. However, a high-quality morph on a genuine document substrate may pass document checks while the morphed face still passes the biometric similarity threshold against the live selfie. Jumio does not publicly document morph-attack detection (MAD) as a specific capability.
  - **AMBIGUOUS** — depends on whether Jumio's internal ML pipeline includes MAD classifiers, which is not publicly documented.

- **IDV-session handoff exploit** (story 1)
  - **CAUGHT (partially)** — The implementation doc does not specifically address session-handoff. Jumio's SDK captures the selfie on the same device/session as the document. If the SDK enforces same-session binding (device fingerprint, session token), handoff is difficult. But the attacker story describes initiating on one device and completing from another — if Jumio's SDK allows cross-device flows, this could succeed.
  - **AMBIGUOUS** — depends on Jumio SDK's session-binding enforcement, not documented in the implementation.

- **ATO inherits prior IAL2 pass** (story 2)
  - **MISSED** — If the provider does not re-trigger Jumio at order time, the prior IAL2 record is treated as binding. The implementation doc acknowledges this: "Jumio addresses these only insofar as the integrating provider re-triggers Jumio at order time for SOC orders."

- **Social-engineer support for manual override** (stories 2, 3)
  - **MISSED** — Bypasses the automated Jumio pipeline. The implementation doc's manual-review SOP is the target: if the reviewer can be social-engineered, the check is defeated.

- **Injection against weak vendor SDK ($5-30K rig)** (story 4)
  - **CAUGHT (with caveat)** — Same as deepfake injection above. Depends on Liveness Premium vs. standard liveness.

- **"Fraudulent govt ID + selfie" / IAL1 path** (story 2)
  - **CAUGHT** — Jumio's document authenticity checks are designed to catch fraudulent documents (FAKE, MANIPULATED_DOCUMENT, DIGITAL_COPY, BLACK_WHITE_PHOTOCOPY). A forged document with an inconsistent MRZ, missing security features, or known-fraud-DB match will be rejected.

- **Presentation attack (physical mask/printout)** (story 2)
  - **CAUGHT** — Liveness detection (passive + active) is designed to defeat presentation attacks (photos, masks, printouts).

**Net assessment for stories 1-4:** Jumio is the primary defense layer these stories target. It catches most presentation attacks and overt document fraud. The residual risks are: (a) sophisticated morphs that pass both document and biometric checks, (b) injection attacks if Liveness Premium is not enabled, (c) ATO-inherits-prior-pass if order-time re-proofing is not enforced, (d) social-engineering the reviewer.

---

### Story 5: cro-identity-rotation (Branch B)

- **Fresh real accomplice per provider persona**
  - **MISSED** — Real accomplice with real documents passes Jumio natively. No fraud signal.

- **IDV-vendor-aware provider selection**
  - **MISSED** — Irrelevant to single-transaction IDV; targets cross-tenant dedup.

**Net assessment:** Jumio passes natively for fronted-accomplice rotation.

---

### Story 6: shell-nonprofit (Branch E)

- **Accomplice completes IAL2 with real face and real ID**
  - **MISSED** — Same as cro-identity-rotation.

### Story 7: biotech-incubator-tenant (Branch D)

- **1a/1b: real ID throughout**
  - **MISSED** — Same.

### Story 8: bulk-order-noise-cover (Branch E)

- **Shared-account IAL2 belongs to predecessor**
  - **CAUGHT** — If order-time re-proofing is enforced, the current orderer's face will not match the predecessor's IAL2 record. Jumio `identityVerification.similarity = NO_MATCH` fires. **MISSED** if no order-time re-proofing.

### Story 9: it-persona-manufacturing (Branch B)

- **Same person completes IAL2 for multiple personas**
  - **MISSED** — Each individual Jumio transaction passes because the face matches the document. Jumio per-transaction IDV does not cross-reference across applicants (that's biometric dedup, a separate product).

### Story 10: inbox-compromise (Branch B)

- **Email-only ordering bypasses portal**
  - **CAUGHT** — If the provider requires Jumio IDV for all SOC orders, email-only ordering without completing IDV is blocked. **MISSED** if the provider accepts email orders without portal authentication.

### Stories 11-19: Real-identity branches

- **All use own real ID**
  - **MISSED** — Jumio passes natively. Deterrence/audit value only.

---

## Findings

### Moderate

**M1: ATO-inherits-prior-IAL2 is the highest-leverage gap for identity-theft stories.**
- **Source:** credential-compromise (story 2).
- **Why missed:** The implementation doc correctly states that Jumio only works "insofar as the integrating provider re-triggers at order time." But the implementation doc does not specify a concrete SOP for when re-triggering is mandatory vs. optional.
- **Suggestion:** Stage 4 should add an explicit "re-proofing trigger policy" section: SOC orders always require fresh Jumio, non-SOC orders require Jumio if last IAL2 > N days.

**M2: Liveness Premium vs. standard liveness not explicitly mandated.**
- **Source:** stories 1-4 deepfake/injection bypasses.
- **Why missed:** The doc references Liveness Premium as the defense against injection but notes it as a failure mode ("Liveness Premium not enabled on the account → injection attacks more likely"). It does not mandate Liveness Premium as a requirement.
- **Suggestion:** Stage 4 should specify Liveness Premium (or equivalent injection-resistant liveness) as mandatory for the SOC-order use case.

**M3: Morph attack detection not confirmed as a Jumio capability.**
- **Source:** stories 1, 2, 3.
- **Why missed:** Document authenticity checks catch overt forgery; biometric match catches mismatched faces. But morphs are designed to pass both. Jumio does not publicly document MAD.
- **Suggestion:** Flag as a known residual risk. NFC chip read (m14-nfc-epassport) partially mitigates morphs because the chip portrait is signed and cannot be morphed.

**M4: Fronted-accomplice branches structurally unaddressed.**
- **Source:** Stories 5, 6, 7, 11-19.
- **Why missed:** Structural; document-IDV proves "this document belongs to this face," not "this person is not a willing accomplice."

### Minor

**m1: Session-handoff enforcement not specified.**
- **Source:** story 1.
- **Suggestion:** Clarify whether Jumio SDK enforces same-device/same-session binding.

**m2: Social-engineering of reviewer is an operational risk not addressable by Jumio.**
- **Source:** stories 2, 3.
- **Suggestion:** Addressed by support-desk SOPs outside Jumio scope.

---

## bypass_methods_known

| Bypass method | Classification | Source stories |
|---|---|---|
| Deepfake injection (Liveness Premium enabled) | CAUGHT | 1, 2, 3, 4 |
| Deepfake injection (standard liveness only) | AMBIGUOUS | 1, 2, 3, 4 |
| Face morphing on genuine document | AMBIGUOUS | 1, 2, 3 |
| IDV-session handoff | AMBIGUOUS | 1 |
| ATO inherits prior IAL2 (no re-proof) | MISSED | 2 |
| Fraudulent govt ID + selfie | CAUGHT | 2 |
| Presentation attack (mask/printout) | CAUGHT | 2 |
| Social-engineer support/reviewer | MISSED | 2, 3 |
| Injection against weak SDK | CAUGHT (Liveness Premium) / AMBIGUOUS (standard) | 4 |
| Fresh real accomplice | MISSED | 5, 6, 7 |
| Shared-account predecessor (with re-proof) | CAUGHT | 8 |
| Same-person multi-persona | MISSED | 9 |
| Email-only ordering | CAUGHT (if portal-gated) | 10 |
| Real ID throughout | MISSED | 11-19 |

## bypass_methods_uncovered

- ATO inherits prior IAL2 without re-proofing
- Face morphing on genuine document substrate (MAD not confirmed)
- Social-engineer support/reviewer for manual override
- Fresh real accomplice per entity (structural)
- Same-person multi-persona (per-transaction IDV, no cross-applicant check)
- Real ID throughout (structural)

---

## Verdict: **PASS**

No Critical findings. The residual gaps (ATO-inherits-prior-pass, morph detection, accomplice) are either addressable by complementary checks (FIDO2, NFC, biometric dedup) or structural. Moderate findings on Liveness Premium mandate and re-proofing trigger policy are concrete improvements for stage 4 but do not rise to Critical because the doc already identifies both risks. Pipeline continues to stage 6.
