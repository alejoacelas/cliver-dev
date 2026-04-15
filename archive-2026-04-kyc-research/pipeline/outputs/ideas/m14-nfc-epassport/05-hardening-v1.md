# m14-nfc-epassport — Bypass-aware hardening v1

- **measure:** M14 — identity-evidence-match
- **idea:** ICAO 9303 ePassport NFC chip read with PKD validation

---

## Attacker story walk

### Group A: Identity-theft branches with active IDV-pipeline bypasses

**Stories 1–4: account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A)**

**Bypass methods and classification:**

- **Deepfake injection against IDV liveness flow** (stories 1, 2, 3, 4)
  - **AMBIGUOUS** — NFC chip read is a document-authenticity check, not a liveness check. It does not defend against deepfakes targeting the selfie/liveness component. The chip provides the ground-truth facial portrait (DG2), which the IDV vendor matches against the live selfie. If the deepfake injection produces a face that matches the chip portrait, the NFC check does not add detection value (the chip portrait IS the target the deepfake is designed to match). If the injected face does NOT match the chip portrait, the `nfc_chip_face_mismatch` flag fires — but this is the biometric-match component, not NFC-specific.
  - Net: NFC provides the trusted ground-truth portrait against which deepfakes are evaluated, but does not independently detect deepfakes.

- **Face morphing on forged/altered government document** (stories 1, 2, 3)
  - **CAUGHT** — This is the core value of NFC chip read. The chip portrait (DG2) is cryptographically signed by the issuing state's CSCA. A forged or altered visual page can have a morphed portrait, but the chip still contains the original unaltered portrait. If the visual portrait has been replaced with a morph but the chip portrait is the original, the `nfc_dg2_viz_mismatch` flag fires. If the entire document is forged (no valid chip), PA fails.

- **IDV-session handoff exploit** (story 1)
  - **MISSED** — NFC verifies the document, not the session. Session handoff means a different person completes liveness on a different device; the NFC chip read on the document still passes because the document is genuine.

- **ATO inherits prior IAL2 pass** (story 2)
  - **MISSED** — No new NFC read is triggered if no re-proofing occurs. Same as all M14 checks.

- **Social-engineer support** (stories 2, 3)
  - **MISSED** — Bypasses the automated pipeline entirely.

- **Injection against weak vendor SDK** (story 4)
  - **AMBIGUOUS** — Same as deepfake injection. NFC provides the trusted portrait; injection targets the selfie/liveness layer.

- **Fraudulent govt ID** (story 2)
  - **CAUGHT** — A forged government ID without a valid CSCA-signed chip fails Passive Authentication. This is the primary use case of NFC: proving the document is genuine and unaltered.

- **Presentation attack** (story 2)
  - **MISSED** — NFC verifies the document, not the selfie. Presentation attacks (masks, printouts) target the liveness component.

**Net assessment for stories 1-4:** NFC chip read's unique contribution is defeating document fraud and face morphing on documents. It does not defend against liveness/injection attacks (those target the selfie, not the document). It provides the cryptographic ground-truth portrait, which strengthens the biometric-match component by ensuring the reference face is authentic. Strong complementary value alongside a liveness check.

---

### Story 5: cro-identity-rotation (Branch B)

- **Fresh real accomplice with real ePassport**
  - **MISSED** — Real passport, real chip, PA passes. NFC confirms the document is genuine — which it is.

### Story 6: shell-nonprofit (Branch E)

- **Accomplice with real identity and real ePassport**
  - **MISSED** — Same.

### Story 7: biotech-incubator-tenant (Branch D)

- **Real ID throughout**
  - **MISSED** — Same.

### Story 8: bulk-order-noise-cover (Branch E)

- **Shared-account predecessor**
  - **CAUGHT (partially)** — If the current orderer presents their own ePassport at order-time re-proofing, the chip portrait (DG2) will not match the predecessor's biometric record. This is the biometric-match component using the chip portrait as ground truth. **MISSED** if no re-proofing.

### Story 9: it-persona-manufacturing (Branch B)

- **Same person, multiple personas**
  - **MISSED** — Each NFC read passes because the passport is genuine. NFC does not cross-reference across applicants.

### Story 10: inbox-compromise (Branch B)

- **Email-only ordering**
  - **CAUGHT** — If NFC-based IDV is required for SOC orders, email-only ordering is blocked. **MISSED** if email orders are accepted.

### Stories 11-19: Real-identity branches

- **Real passports throughout**
  - **MISSED** — NFC passes natively.

---

## Findings

### Moderate

**M1: NFC unavailability degrades silently to OCR-only with no enforcement mechanism.**
- **Source:** Implementation doc: "Devices without NFC → silent degrade to OCR."
- **Why this matters:** The implementation doc describes NFC as the highest-assurance check, but if the customer's device lacks NFC, the vendor SDK silently falls back to OCR-only document verification. The implementation does not specify whether the provider should hard-require NFC for SOC orders (rejecting non-NFC attempts) or accept the OCR fallback.
- **Suggestion:** Stage 4 should add an explicit NFC-enforcement policy for SOC orders: either require NFC (customer must use an NFC-capable device) or accept OCR with downgraded assurance and additional compensating controls.

**M2: PA-only chips (no AA/CA) are vulnerable to cloning.**
- **Source:** Implementation doc: "ePassport cloning is mathematically possible against chips that implement only PA."
- **Why this matters:** PA proves the data was signed by the issuer; it does not prove the chip is the original. An attacker who obtains a stolen passport can clone the chip data to another NFC device and present it alongside a different physical document. Pre-2007 US passports and many non-OECD-country passports lack AA/CA.
- **Suggestion:** Flag as a residual risk. The implementation doc already notes this. Stage 4 could add: if AA/CA is `not_supported`, apply additional compensating controls (e.g., document age check, visual inspection of physical security features).

**M3: Fronted-accomplice branches structurally unaddressed.**
- **Source:** Stories 5, 6, 7, 11-19.
- **Suggestion:** Structural; NFC proves "this document is genuine," not "this person is not an accomplice."

**M4: Customers without ePassports are excluded.**
- **Source:** False-positive section.
- **Why this matters:** Non-electronic passports, national IDs, driver's licenses, and refugee travel documents do not have NFC chips. Coverage gap, not a bypass — but limits applicability.
- **Suggestion:** Stage 6 coverage quantification.

### Minor

**m1: DG3/DG4 (fingerprints/iris) noted as typically unavailable to commercial IDV.**
- **Source:** Implementation doc: "only if EAC enforced and inspection system has Document Verifier rights."
- **Suggestion:** Already correctly noted. No action.

**m2: ICAO PKD daily refresh cadence could cause brief windows of stale CRLs.**
- **Source:** Implementation doc.
- **Suggestion:** Minor operational concern.

---

## bypass_methods_known

| Bypass method | Classification | Source stories |
|---|---|---|
| Deepfake injection (targets selfie, not chip) | AMBIGUOUS (orthogonal) | 1, 2, 3, 4 |
| Face morphing on document visual page | CAUGHT (chip portrait is ground truth) | 1, 2, 3 |
| IDV-session handoff | MISSED | 1 |
| ATO inherits prior IAL2 | MISSED | 2 |
| Fraudulent govt ID (forged document) | CAUGHT (PA fails) | 2 |
| Presentation attack (mask/printout) | MISSED (orthogonal) | 2 |
| Social-engineer support | MISSED | 2, 3 |
| Injection against SDK | AMBIGUOUS (orthogonal) | 4 |
| Chip cloning (PA-only, no AA/CA) | AMBIGUOUS | 1, 2, 3 |
| Fresh real accomplice with real ePassport | MISSED | 5, 6, 7 |
| Shared-account predecessor (with re-proof) | CAUGHT | 8 |
| Same-person multi-persona | MISSED | 9 |
| Email-only ordering | CAUGHT (if required) | 10 |
| Real passport throughout | MISSED | 11-19 |

## bypass_methods_uncovered

- All liveness/injection/presentation attacks (orthogonal to NFC; NFC is document-authenticity layer)
- IDV-session handoff
- ATO inherits prior IAL2
- Social-engineer support
- Chip cloning on PA-only passports
- Fresh real accomplice with real ePassport (structural)
- Same-person multi-persona
- Real passport throughout (structural)

---

## Verdict: **PASS**

No Critical findings. NFC chip read occupies a specific and well-defined niche: highest-assurance document authenticity. It does not claim to defend against liveness/injection attacks or fronted-accomplice patterns. The AMBIGUOUS items (deepfake injection, chip cloning) are correctly scoped as orthogonal or already-acknowledged residual risks. Moderate findings on NFC-enforcement policy and PA-only cloning are concrete refinements. Pipeline continues to stage 6.
