# m14-fido2-stepup — Bypass-aware hardening v1

- **measure:** M14 — identity-evidence-match
- **idea:** FIDO2 / WebAuthn order-time step-up + device binding

---

## Attacker story walk

### Group A: Identity-theft branches with active IDV-pipeline bypasses

**Stories 1–4: account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A)**

**Bypass methods and classification:**

- **Deepfake injection against IDV vendor liveness flow** (stories 1, 2, 3, 4)
  - **AMBIGUOUS** — FIDO2 step-up is orthogonal to IDV liveness. It does not defend against deepfakes in the IDV pipeline; it defends against unauthorized humans placing orders on an account. If the attacker has already passed IDV (via deepfake) and enrolled a FIDO2 credential during onboarding, the step-up passes natively. If order-time step-up requires both FIDO2 assertion AND fresh IDV, deepfake injection targets the IDV component, not the FIDO2 component. Detail not pinned down: whether the implementation requires a fresh IDV re-proof alongside the FIDO2 assertion at order time, or FIDO2 alone.

- **Face morphing on forged document** (stories 1, 2, 3)
  - **MISSED** — Same as above; FIDO2 does not validate documents or biometrics. The morph targets the IDV layer.

- **IDV-session handoff exploit** (story 1)
  - **CAUGHT** — The FIDO2 credential is bound to a specific authenticator registered during onboarding. Even if the IDV session is handed off, the order-time step-up requires the authenticator that was registered by the legitimate account holder. The attacker completing liveness on a different device cannot produce a FIDO2 assertion from the original holder's authenticator.

- **ATO inherits prior IAL2 pass** (story 2)
  - **CAUGHT** — This is the core value proposition. Even if the attacker has the victim's password, they cannot produce a FIDO2 assertion without the physical authenticator (or biometric bound to the platform authenticator). The step-up breaks ATO-inherits-prior-pass.

- **"Fraudulent govt ID + selfie" / "breached PII + SIM swap"** (story 2, IAL1 path)
  - **CAUGHT** — SIM swap is irrelevant; FIDO2 has no SMS component. Fraudulent ID targets IDV, not FIDO2. The step-up requires the registered authenticator regardless.

- **Social-engineer support for manual override** (stories 2, 3)
  - **MISSED** — If the attacker social-engineers the support desk to re-enroll a new FIDO2 credential on the account without requiring fresh IAL2, the step-up is defeated. The implementation doc explicitly warns against this and mandates IAL2 re-proof for recovery, but the bypass is the social-engineering of the support desk to skip that SOP.

- **Route to manual review fallback** (story 3, bypass C)
  - **MISSED** — If the provider has a manual-review fallback path that waives the FIDO2 requirement (e.g., "customer lost their key, we'll accept email confirmation"), the step-up is bypassed.

- **Abandon SOC orders if step-up enforced** (story 3, bypass D)
  - **CAUGHT** — This is a deterrence success: the attacker gives up.

- **Injection attack against weak vendor SDK** (story 4)
  - **AMBIGUOUS** — Same logic as deepfake injection; targets the IDV layer, not FIDO2.

**Net assessment for stories 1-4:** FIDO2 step-up is highly effective against ATO and session-hijack patterns. It does NOT defend against deepfake/morph attacks that target the IDV pipeline — those are orthogonal. The critical weakness is social-engineering of support to re-enroll an authenticator.

---

### Story 5: cro-identity-rotation (Branch B)

**Bypass methods:**

- **IDV-vendor-aware provider selection**
  - **MISSED** — Irrelevant to FIDO2; this targets biometric dedup, not authenticator binding.

- **Fresh real accomplice per provider persona**
  - **MISSED** — The accomplice genuinely enrolls their own FIDO2 credential and genuinely asserts at order time. The step-up passes natively because the accomplice really is the registered identity.

**Net assessment:** FIDO2 cannot detect fronted-accomplice identity rotation. The accomplice's authenticator is genuinely theirs.

---

### Story 6: shell-nonprofit (Branch E)

- **Accomplice completes IAL2 and enrolls FIDO2 with real identity**
  - **MISSED** — Accomplice genuinely holds the authenticator and genuinely asserts. FIDO2 passes natively.

**Net assessment:** Zero detection value against committed accomplice.

---

### Story 7: biotech-incubator-tenant (Branch D)

- **1a/1b: attacker or accomplice uses own real ID + enrolls own FIDO2 credential**
  - **MISSED** — Same as shell-nonprofit.

**Net assessment:** Zero detection.

---

### Story 8: bulk-order-noise-cover (Branch E)

- **Shared-account IAL2 belongs to predecessor; current orderer different person**
  - **CAUGHT** — The current orderer does not have the predecessor's FIDO2 authenticator. The step-up blocks the order. This is a direct hit: the human at the keyboard is not the human who enrolled the credential.

**Net assessment:** Strong catch. This is the textbook case FIDO2 step-up was designed for.

---

### Story 9: it-persona-manufacturing (Branch B)

- **Same-domain two-persona self-vouching**
  - **CAUGHT (partially)** — Each persona must have its own FIDO2 credential. If one person operates both personas, they need two credentials on two accounts. FIDO2 does not detect this (each assertion is per-credential, per-account). But combined with biometric dedup, the same person enrolling two credentials could be flagged if the onboarding IDV captures their face twice.
  - **MISSED** as a standalone check; does not detect multi-persona operation by one human.

**Net assessment:** FIDO2 alone does not address multi-persona. It ensures each persona's orders are placed by the credential holder, which is trivially true if the attacker holds all credentials.

---

### Story 10: inbox-compromise (Branch B)

- **Branch sidesteps IAL2 by acting through email**
  - **CAUGHT** — If the provider requires FIDO2 step-up for all SOC orders (not just portal-originated ones), email-only ordering is blocked. The attacker cannot produce a FIDO2 assertion via email.

**Net assessment:** Strong catch IF the provider enforces that all SOC orders must pass through the authenticated portal with FIDO2. The implementation doc does assume portal-based ordering.

---

### Stories 11-19: Real-identity branches

- **All use own real ID**
  - **MISSED** — These attackers enroll their own FIDO2 credential with their own real identity. The step-up passes natively.

**Net assessment:** FIDO2 imposes an audit trail (which human placed which order) but does not detect real-identity-throughout attackers. Deterrence value only.

---

## Findings

### Moderate

**M1: Social-engineering of support desk to re-enroll authenticator is the highest-leverage attack.**
- **Source:** credential-compromise (story 2), dormant-account-takeover (story 3).
- **Why missed:** The implementation doc correctly identifies this risk and mandates IAL2 re-proof for recovery. But the bypass is social-engineering the support desk to skip the SOP. The implementation doc cannot enforce human behavior.
- **Suggestion:** Stage 4 could add a specific "support-desk hardening SOP" section: dual-approval for credential re-enrollment, mandatory ticket with fresh IAL2 screenshot, automated audit of all re-enrollment events. But this is an operational hardening, not a technical one.

**M2: Synced passkeys weaken device-binding guarantee.**
- **Source:** Implementation doc notes `credentialBackedUp = true` for syncable passkeys.
- **Why missed:** The doc suggests the provider "may want to require `credentialBackedUp = false`" but does not mandate it. If synced passkeys are permitted, cloud-account compromise (iCloud, Google) could expose the passkey to the attacker.
- **Suggestion:** Stage 4 should explicitly specify policy: for SOC orders, require `credentialBackedUp = false` (device-bound only) to maintain the security guarantee.

**M3: Fronted-accomplice branches structurally unaddressed.**
- **Source:** Stories 5, 6, 7, 11-19.
- **Why missed:** Structural; FIDO2 proves "same human as enrolled," not "human is not a willing accomplice."
- **Suggestion:** None within FIDO2's scope. Cross-measure mitigation needed.

### Minor

**m1: Implementation does not specify whether FIDO2 is required alongside fresh IDV at order time, or as a standalone.**
- **Source:** Stories 1-4 deepfake/morph bypasses.
- **Why it matters:** If FIDO2 is the sole order-time gate (no fresh IDV), it does not defend against an attacker who enrolled legitimately via deepfake at onboarding. If paired with fresh IDV, it adds a second factor but the IDV pipeline is still the deepfake target.
- **Suggestion:** Clarify in stage 4 that FIDO2 step-up complements but does not replace order-time IDV re-proofing for high-risk orders.

---

## bypass_methods_known

| Bypass method | Classification | Source stories |
|---|---|---|
| Deepfake injection against IDV liveness | AMBIGUOUS | 1, 2, 3, 4 |
| Face morphing on forged document | MISSED (orthogonal) | 1, 2, 3 |
| IDV-session handoff | CAUGHT | 1 |
| ATO inherits prior IAL2 | CAUGHT | 2 |
| SIM swap / breached PII | CAUGHT | 2 |
| Social-engineer support for re-enrollment | MISSED | 2, 3 |
| Manual-review fallback waives FIDO2 | MISSED | 3 |
| Attacker abandons SOC orders | CAUGHT (deterrence) | 3 |
| Injection against weak vendor SDK | AMBIGUOUS (orthogonal) | 4 |
| Fresh real accomplice per persona | MISSED | 5, 6, 7 |
| Shared-account predecessor mismatch | CAUGHT | 8 |
| Same-person multi-persona | MISSED | 9 |
| Email-only ordering bypasses portal | CAUGHT | 10 |
| Real ID throughout | MISSED | 11-19 |

## bypass_methods_uncovered

- Social-engineer support for authenticator re-enrollment
- Manual-review fallback that waives FIDO2 requirement
- Fresh real accomplice per entity (structural)
- Real ID throughout (structural)
- Same-person multi-persona (FIDO2 alone cannot detect)

---

## Verdict: **PASS**

No Critical findings. The implementation correctly identifies its primary value (ATO/session-hijack defense) and its limitations (no defense against fronted-accomplice). Moderate findings on support-desk social engineering and synced-passkey policy are operational refinements, not gaps in the check's design. Pipeline continues to stage 6.
