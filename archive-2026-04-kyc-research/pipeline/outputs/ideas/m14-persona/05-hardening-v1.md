# m14-persona — Bypass-aware hardening v1

- **measure:** M14 — identity-evidence-match
- **idea:** Persona Inquiry workflow (government ID + selfie + database, configurable IAL2)

---

## Attacker story walk

### Group A: Identity-theft branches with active IDV-pipeline bypasses

**Stories 1–4: account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A)**

**Bypass methods and classification:**

- **Deepfake injection against liveness flow** (stories 1, 2, 3, 4)
  - **CAUGHT** — Persona's selfie verification includes `selfie_liveness` check aligned with ISO/IEC 30107-3 PAD and CEN/TS 18099:2024 for injection-attack detection. Implementation doc references iBeta testing and 2025 Forrester IDV Wave recognition. The `behaviors` signals (devtools_open, user_agent_suspicious, request_spoof_attempts) provide additional injection-detection layers.

- **Face morphing on forged/altered government document** (stories 1, 2, 3)
  - **CAUGHT (partially)** — Government ID verification includes `id_visible_photo_features`, `id_face_detection`, and `entity_confidence_score` checks. `id_compromised_or_repeated` matches against Persona's known-fraud DB. However, same as Jumio/Onfido, a high-quality morph on genuine substrate may pass visual checks. Persona does not publicly document MAD as a discrete capability.
  - **AMBIGUOUS** on sophisticated morphs.

- **IDV-session handoff exploit** (story 1)
  - **CAUGHT (partially)** — Persona captures `behaviors` signals including device-level data. If handoff involves a different device, `capture_method` and `device_type` may differ between document capture and selfie, potentially flagging inconsistency. However, this is not explicitly designed as a session-handoff detector.
  - **AMBIGUOUS** — depends on whether Persona's behaviors engine flags cross-device inconsistency.

- **ATO inherits prior IAL2 pass** (story 2)
  - **MISSED** — Same as all vendor-IDV ideas: only effective if order-time re-proofing is enforced.

- **Social-engineer support** (stories 2, 3)
  - **MISSED** — Bypasses automated pipeline.

- **Injection against weak vendor SDK** (story 4)
  - **CAUGHT** — Same as deepfake injection. Persona's PAD + injection detection.

- **Fraudulent govt ID** (story 2)
  - **CAUGHT** — Government ID checks: `id_visible_photo_features`, `id_mrz_inspection`, `id_real_id_compliance`, plus document database matching.

- **Presentation attack** (story 2)
  - **CAUGHT** — `selfie_liveness` check.

**Net assessment for stories 1-4:** Similar to Jumio/Onfido. Strong on injection/presentation attack detection. Residual: morphs (MAD unconfirmed), ATO-inherits-prior-pass, social-engineering the reviewer.

---

### Story 5: cro-identity-rotation (Branch B)

- **Fresh real accomplice per persona**
  - **MISSED** — Passes natively.

### Story 6: shell-nonprofit (Branch E)

- **Real accomplice, real ID**
  - **MISSED**

### Story 7: biotech-incubator-tenant (Branch D)

- **Real ID**
  - **MISSED**

### Story 8: bulk-order-noise-cover (Branch E)

- **Shared-account predecessor**
  - **CAUGHT** — `id_face_match` fails if current orderer's face does not match prior record. Also, `selfie_unique` may flag if the predecessor's selfie is on file from a different inquiry.

### Story 9: it-persona-manufacturing (Branch B)

- **Same person, multiple personas**
  - **CAUGHT (partially)** — Persona's `selfie_unique` check explicitly detects "uniqueness across customer's tenant." If the same face appears in two inquiries under different applicant IDs, this fires. This is a tenant-level biometric dedup built into Persona's selfie verification.
  - **MISSED** if the attacker uses different providers or different Persona tenants.

**Net assessment:** `selfie_unique` gives Persona a built-in within-tenant biometric dedup that Jumio/Onfido do not include as a standard selfie check. This catches same-person multi-persona within a single provider's Persona tenant.

---

### Story 10: inbox-compromise (Branch B)

- **Email-only ordering**
  - **CAUGHT** — If Persona IDV required for SOC orders.

### Stories 11-19: Real-identity branches

- **Real ID throughout**
  - **MISSED** — Passes natively. Deterrence/audit only.

---

## Findings

### Moderate

**M1: ATO-inherits-prior-IAL2 gap.**
- **Source:** Story 2.
- **Why missed:** Same as Jumio/Onfido. No explicit re-proofing trigger policy in the implementation doc.
- **Suggestion:** Stage 4 should add explicit re-proofing trigger policy.

**M2: Morph attack detection not confirmed as discrete capability.**
- **Source:** Stories 1, 2, 3.
- **Why missed:** Government ID checks catch overt fraud. Sophisticated morphs on genuine substrate may pass.
- **Suggestion:** Residual risk. NFC mitigates.

**M3: Persona lacks Kantara-listed IAL2 certification.**
- **Source:** Implementation doc: "Persona is configurable to meet IAL2 evidence requirements but is not a certified trust framework provider."
- **Why this matters:** Unlike Jumio and Onfido/Entrust, Persona is not Kantara-listed at IAL2. The integrator must explicitly configure the inquiry to meet IAL2 requirements. Misconfiguration risk.
- **Suggestion:** Stage 4 should specify the minimum inquiry configuration that meets IAL2 (Government ID + Selfie with liveness + Database) and recommend a compliance review to confirm alignment.

**M4: Fronted-accomplice branches structurally unaddressed.**
- **Source:** Stories 5, 6, 7, 11-19.

### Minor

**m1: `behaviors.devtools_open` generates false positives for privacy-conscious researchers.**
- **Source:** Implementation doc false-positive section.
- **Suggestion:** The implementation already notes this. Review-SOP should not auto-deny on `devtools_open` alone.

**m2: `selfie_unique` cross-tenant limitation mirrors biometric-dedup cross-vendor gap.**
- **Source:** Story 5 (cro-identity-rotation).
- **Suggestion:** Already captured under structural limitations.

---

## bypass_methods_known

| Bypass method | Classification | Source stories |
|---|---|---|
| Deepfake injection | CAUGHT (PAD + injection detection) | 1, 2, 3, 4 |
| Face morphing on genuine document | AMBIGUOUS (MAD not confirmed) | 1, 2, 3 |
| IDV-session handoff | AMBIGUOUS (behaviors may flag) | 1 |
| ATO inherits prior IAL2 | MISSED | 2 |
| Fraudulent govt ID | CAUGHT | 2 |
| Presentation attack | CAUGHT | 2 |
| Social-engineer support/reviewer | MISSED | 2, 3 |
| Injection against weak SDK | CAUGHT | 4 |
| Fresh real accomplice | MISSED | 5, 6, 7 |
| Shared-account predecessor (with re-proof) | CAUGHT | 8 |
| Same-person multi-persona (within tenant) | CAUGHT (selfie_unique) | 9 |
| Same-person multi-persona (cross-tenant) | MISSED | 9 |
| Email-only ordering | CAUGHT (if required) | 10 |
| Real ID throughout | MISSED | 11-19 |

## bypass_methods_uncovered

- ATO inherits prior IAL2 without re-proofing
- Face morphing on genuine document substrate (MAD not confirmed)
- Social-engineer support/reviewer
- Fresh real accomplice (structural)
- Same-person multi-persona across different tenants/providers
- Real ID throughout (structural)

---

## Verdict: **PASS**

No Critical findings. Persona's profile is similar to Jumio/Onfido with two distinguishing features: (1) `selfie_unique` provides built-in within-tenant biometric dedup, partially addressing story 9 that other vendors miss, and (2) lack of Kantara IAL2 certification creates a misconfiguration risk. Moderate findings on re-proofing policy, MAD, and IAL2 configuration are concrete improvements. Pipeline continues to stage 6.
