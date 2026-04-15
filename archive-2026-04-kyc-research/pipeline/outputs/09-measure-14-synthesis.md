# Stage 9 — Measure 14 (Identity Evidence Match): Per-measure Synthesis

## 1. Side-by-side comparison of selected ideas

| Field | m14-jumio | m14-nfc-epassport | m14-fido2-stepup |
|---|---|---|---|
| **Role in stack** | Primary vendor IDV (document + selfie + liveness) | Hardening layer within Jumio flow (document authenticity) | Order-time re-authentication binding |
| **Attacker stories addressed** | account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A), bulk-order-noise-cover (E), inbox-compromise (B) | credential-compromise (A), account-hijack (C), dormant-account-takeover (D), dormant-domain (A) | credential-compromise (A), account-hijack (C), dormant-account-takeover (D), bulk-order-noise-cover (E), inbox-compromise (B) |
| **Marginal cost/check** | $1.50--$3.50 [best guess] | $0--$0.50 incremental [best guess] | ~$0 (in-house computation) |
| **Setup cost** | $0--$25k integration + $2k--$10k/mo minimum | Minimal (enable NFC in vendor SDK) | 1--2 sprint-weeks engineering; $15k--$50k if shipping hardware keys |
| **External dependencies** | Jumio KYX Platform, REST API, SDKs, ICAO PKD (Jumio-managed) | ICAO PKD (free), vendor SDK with NFC, customer NFC device + ePassport | WebAuthn-capable browser, FIDO2 authenticator (platform or hardware), open-source RP library |
| **Key flags** | `jumio_doc_failed`, `jumio_liveness_failed`, `jumio_face_no_match`, `jumio_nfc_chip_invalid`, `jumio_pending_timeout` | `nfc_unavailable`, `nfc_pa_failed`, `nfc_aa_failed`, `nfc_ca_failed`, `nfc_dsc_revoked`, `nfc_chip_face_mismatch`, `nfc_dg2_viz_mismatch` | `webauthn_no_credentials`, `webauthn_assertion_failed`, `webauthn_user_canceled`, `webauthn_credential_revoked`, `webauthn_counter_regression` |
| **FP drivers** | Non-Latin-script names (8--15%), aged passport photos (20--40%), unsupported doc types (2--5%) | PA failure from stale PKD, aged chip portrait vs. selfie, damaged chip reads | Unenrolled users at rollout (20--40%), shared-lab accounts (10--25%), CRO turnover (5--15%/yr) |
| **Coverage gaps** | Unsupported docs (2--5%), non-Latin scripts (8--15%), no photo ID (<1%), low-bandwidth devices (3--7%) | No ePassport (10--20%), no NFC device (5--10%), non-PKD countries (5--15%), PA-only chips (30--50%) | No authenticator at rollout (20--40%), shared-lab accounts (10--25%), synced passkey policy tension |
| **Audit record** | Jumio scanReference, structured JSON, captured images (30-day retention), reviewer decision | LDS data groups, SOD, CSCA chain validation, PA/AA/CA results | Per-assertion row: credential_id, order_id, challenge, signature, counter, timestamp |

## 2. Coverage gap cross-cut

### Structural gaps (inherent to the measure's design scope)

These gaps cannot be closed by any combination of M14 ideas. They require cross-measure mitigation.

| Gap | Nature | Affected branches |
|---|---|---|
| **Fronted-accomplice with real ID** | A willing accomplice passes all three layers natively -- real document, real face, real authenticator. M14 has nothing to detect because the evidence genuinely matches the registered identity. | shell-nonprofit (E), biotech-incubator-tenant (D), cro-identity-rotation (B), cro-framing (A) |
| **Real-ID-throughout attacker** | Attacker uses their own genuine identity end-to-end. M14 provides deterrence/audit trail but no detection. | shell-company (D), foreign-institution (C), gradual-legitimacy-accumulation (E), insider-recruitment (B), visiting-researcher (D), community-bio-lab-network, and others |
| **Same-person multi-persona** | Per-transaction IDV + per-account FIDO2 cannot detect the same person enrolling across multiple accounts. No cross-applicant biometric dedup in the selected stack. | it-persona-manufacturing (B), cro-identity-rotation (B) |

### Complementary gaps (addressable by tuning or combining the selected ideas)

| Gap | Which idea(s) affected | Mitigation within stack |
|---|---|---|
| **ATO inherits prior IAL2** | Jumio (if not re-triggered at order time) | FIDO2 step-up closes this directly -- even if ATO succeeds, attacker cannot assert without the authenticator. |
| **Face morphing on genuine document** | Jumio (MAD not confirmed) | NFC chip read closes this -- chip portrait is CSCA-signed and cannot be morphed without invalidating PA. |
| **IDV-session handoff** | Jumio (SDK session binding unclear) | FIDO2 step-up closes this -- assertion is bound to the enrolled authenticator, not the IDV session. |
| **Injection attacks (deepfake video, camera emulator)** | Jumio (only with Liveness Premium enabled) | Closed by policy: mandate Liveness Premium for all SOC-order IDV sessions. |
| **Email-only ordering** | All three (if portal not enforced) | Closed by policy: SOC orders require portal submission with FIDO2 assertion. |
| **NFC unavailable (no ePassport, no NFC device)** | NFC (10--20% of customers) | Accept OCR-only with downgraded-assurance flag + compensating controls. FIDO2 still provides order-time binding regardless of NFC availability. |
| **Non-Latin-script name mismatch** | Jumio (8--15% chronic FP) | Closed by implementation: provider builds transliteration-aware name-matching layer. |
| **Unenrolled FIDO2 users** | FIDO2 (20--40% at rollout) | Closed by enrollment campaign + accepting platform authenticators (synced passkeys) for coverage. |

## 3. Bypass methods uncovered: attacker stories surviving the full selected stack

The following attacker stories survive all three layers of the selected stack (Jumio + NFC + FIDO2). Each entry explains why the stack fails to catch the attack.

### 3.1 Structural bypasses (M14 cannot address by design)

| # | Attacker story | Branch | Why it survives |
|---|---|---|---|
| 1 | **cro-identity-rotation** | purpose-built (B) | Fresh real accomplice per provider. Each accomplice passes Jumio with their own real ID, reads their own real ePassport chip, and enrolls their own FIDO2 credential. All three layers pass natively. Cross-provider biometric dedup is explicitly defeated by vendor-aware routing. |
| 2 | **shell-nonprofit** | purpose-built (E) | Accomplice commits to all four roles. Real ID, real face, real ePassport, real authenticator. M14 passes because the evidence genuinely matches the account holder. |
| 3 | **biotech-incubator-tenant** | purpose-built (D) | Attacker or accomplice uses real identity throughout. All layers pass natively. |
| 4 | **Real-ID-throughout branches** | multiple | shell-company (D), foreign-institution (C), gradual-legitimacy-accumulation (E), insider-recruitment (B), lab-manager-voucher (C), unrelated-dept-student (A), visiting-researcher (D), community-bio-lab-network, cro-framing (A). Named orderer matches account holder in every case. |
| 5 | **it-persona-manufacturing** | exploit-affiliation (B) | Same attacker enrolls multiple accounts with their own face. Per-transaction IDV + per-account FIDO2 cannot cross-correlate. Second persona requires accomplice or biometric collision, but first persona passes natively. |

### 3.2 Operational bypasses (addressable by hardening, not yet specified)

| # | Bypass method | Which layer targeted | Residual risk |
|---|---|---|---|
| 6 | **Social-engineer support/reviewer** | FIDO2 (re-enrollment), Jumio (manual override) | Attacker convinces support to re-enroll a FIDO2 credential without IAL2 re-proofing, or convinces reviewer to override a Jumio denial. Targets human process, not protocol. Mitigated by SOPs (dual-approval, mandatory IAL2 for re-enrollment, audit trail) but not eliminated. |
| 7 | **Manual-review fallback waives FIDO2** | FIDO2 | If the review process allows order approval without a successful FIDO2 assertion (e.g., "customer unable to complete step-up, approved by reviewer"), the control is nullified. Must be policy-prohibited. |
| 8 | **Chip cloning on PA-only ePassports** | NFC | ~30--50% of ePassports lack AA/CA, making them theoretically clonable. Practical risk is low (requires physical chip access and specialized equipment) but the cryptographic guarantee is weaker. |

## 4. Structural gaps flagged as open issues

### Issue 1: Fronted-accomplice gap is M14-structural

**Status:** Open -- requires cross-measure mitigation.

All three selected ideas pass natively when a willing accomplice with a real identity acts as the account holder. This affects at least four attacker branches (cro-identity-rotation, shell-nonprofit, biotech-incubator-tenant, cro-framing). No M14 idea in the full candidate set addresses this, including the dropped ideas. The dropped cross-tenant biometric dedup idea explicitly fails against cro-identity-rotation (the branch routes across providers to defeat it). Mitigation must come from other measures: institutional verification (M18), end-use screening (M6/M15), voucher verification (M20), or cross-provider information sharing (M17).

### Issue 2: Same-person multi-persona has no detection mechanism in the selected stack

**Status:** Open -- partially addressable within M14.

The selected stack performs per-transaction IDV and per-account FIDO2 binding. It cannot detect the same biometric appearing across multiple accounts at the same provider. The dropped cross-tenant biometric dedup idea would partially address within-provider dedup but was rejected for cost ($2--$8/check or $100K--$300K in-house) and its failure against the cross-provider rotation pattern. Persona's `selfie_unique` within-tenant dedup offers a lighter-weight partial substitute but was not selected. If same-person multi-persona risk materializes, consider adding Persona as a secondary IDV for dedup-only or enabling Jumio's cross-applicant matching (contract opt-in required).

### Issue 3: NFC enforcement policy undefined

**Status:** Open -- requires provider policy decision.

The stack composition note specifies NFC should be hard-required when the customer presents an ePassport on an NFC-capable device. However, the operational definition of "ePassport available" and "NFC-capable device" detection is not specified. The provider must define: (a) how the SDK determines ePassport availability before the NFC attempt, (b) whether customers who claim to have an ePassport but fail NFC are blocked or degraded, and (c) what compensating controls apply to the OCR-only path for SOC orders.

### Issue 4: Synced passkey vs. device-bound credential policy unresolved

**Status:** Open -- requires provider policy decision.

The FIDO2 synthesis recommends accepting synced passkeys for coverage while tracking the `credentialBackedUp` flag, but the security implications are significant: synced passkeys degrade the guarantee from "same physical device" to "same cloud account." If the attacker compromises the customer's iCloud/Google account, synced passkeys are extractable. The composition note does not resolve whether SOC orders specifically should require device-bound credentials (hardware keys) while allowing synced passkeys for non-SOC orders.

### Issue 5: Support-desk hardening SOP not specified

**Status:** Open -- requires operational specification.

Social-engineering of support is the highest-leverage operational bypass across both Jumio (reviewer override) and FIDO2 (credential re-enrollment). The synthesis documents recommend dual-approval, mandatory IAL2 re-proofing, and automated audit for all re-enrollment and override events, but no concrete SOP is specified. This is an operational gap, not a technical one, but its exploitation would nullify both the Jumio and FIDO2 layers.

### Issue 6: Liveness Premium mandatory status requires contractual confirmation

**Status:** Open -- requires vendor engagement.

The stack requires Liveness Premium (injection-resistant liveness) for all SOC-order IDV sessions. This must be confirmed as contractually available and priced into the Jumio MSA. If Liveness Premium is a separate SKU with additional per-check cost, the $1.50--$3.50 estimate may understate the actual per-verification price.
