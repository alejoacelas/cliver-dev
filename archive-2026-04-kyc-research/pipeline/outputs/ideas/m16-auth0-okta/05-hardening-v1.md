# m16-auth0-okta — Bypass-aware hardening v1

- **idea:** Hosted IdP MFA + step-up (Auth0 / Okta CIC / AWS Cognito)
- **measure:** M16 — mfa-stepup
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walkthrough

### 1. account-hijack — impersonate-employee

**Summary:** Attacker compromises a PI's institutional email, takes over their pre-existing, fully verified synthesis provider account. MFA is named as "the primary technical barrier."

**Bypass methods relevant to M16:**

1. **Method 1: MFA reset via email recovery.**
   - **CAUGHT.** The implementation specifies that recovery flows must require IDV re-verification (m14-stripe-identity), not just an email link. Specifically: "recovery flow itself must require IDV (m14) re-verification, not just an email link." This blocks the $0, minimal-expertise email-channel reset.

2. **Method 2: Session hijack via stolen cookies + anti-detect browser.**
   - **CAUGHT** (partially). The `auth_time` check at SOC order time means a stale session is insufficient — the attacker must complete a fresh step-up within the last N minutes (e.g., 5). However, if the attacker has an active session *and* the cookies include the step-up token within the window, the bypass works. `mfa_high_risk_signal` from adaptive MFA (impossible-travel, new device) may catch the anti-detect browser if the fingerprint doesn't perfectly match.
   - **AMBIGUOUS** on whether adaptive MFA detects GoLogin/Multilogin fingerprint-matched profiles with residential proxies. The implementation mentions adaptive risk but does not specify which signals are checked.

3. **Method 3: Infostealer-exfiltrated TOTP seed.**
   - **CAUGHT.** The implementation specifies `mfa_factor_too_weak` flag — SOC orders require passkey/WebAuthn, not TOTP. If passkey-only policy is enforced for SOC step-up, TOTP seeds are worthless. The attacker cannot use the TOTP seed to satisfy a passkey challenge.

4. **Method 4: Real-time AitM phishing relay (Tycoon 2FA / EvilProxy).**
   - **CAUGHT.** FIDO2/WebAuthn passkeys are phishing-resistant by design — the challenge is bound to the relying party origin. An AitM relay to a different origin will fail the WebAuthn signature verification. This is the core value proposition of passkeys for SOC step-up.

5. **Method 5: FIDO2 downgrade attack (spoof browser UA to force SMS/TOTP fallback).**
   - **CAUGHT.** The implementation specifies passkey-only enforcement for SOC orders: `mfa_factor_too_weak` fires if only SMS/TOTP is used. If the policy blocks the fallback entirely (no alternative factor accepted for SOC orders), the downgrade attack produces a `mfa_failed` flag rather than falling back.

6. **Method 6: SIM-jacking / SS7 interception.**
   - **CAUGHT.** Passkey-only policy means SMS is not accepted for SOC step-up. SIM-jacking/SS7 interception is irrelevant when the factor is FIDO2.

7. **Method 7: Social engineering provider support.**
   - **AMBIGUOUS.** The implementation routes lockouts to support with a playbook requiring IDV re-verification before reset. But the quality of this defense depends on the support team's adherence to the playbook. Voice cloning and PII from the compromised inbox could fool a support agent who deviates from procedure. The implementation notes the playbook but does not specify anti-social-engineering controls (e.g., mandatory delay, dual-agent approval for MFA resets).

8. **Method 8: Compromise cloud account to inject a passkey.**
   - **MISSED.** If the PI uses synced passkeys (Apple iCloud Keychain, Google Password Manager), an attacker who compromises the PI's cloud account can add a new device to the sync group and receive the passkey. The provider sees a legitimate passkey authentication — `amr` includes `webauthn`, `auth_time` is fresh. No signal distinguishes this from a normal login. The implementation does not address synced-vs-hardware passkey policy.
   - `mfa_recent_enroll` might catch this if the passkey shows as newly synced to a new device, but passkey sync typically doesn't create a new enrollment event visible to the relying party — the existing credential is simply available on an additional device.

9. **Method 9: Timing — exploit grace period.**
   - **CAUGHT.** The `auth_time` check requires fresh step-up within N minutes (5). The implementation specifies per-SOC-order step-up, not per-session. A hijacked session must still complete the step-up challenge.

**Net assessment:** Very strong. 6 of 9 methods are caught by the passkey-only + IDV-recovery policy. Method 8 (cloud account compromise for passkey sync) is the primary remaining attack, and Method 7 (social engineering support) depends on procedural discipline. Method 2 (session hijack) is partially mitigated by `auth_time` + adaptive risk but not fully addressed.

---

### 2. credential-compromise

**Summary:** Faculty/staff credential theft via infostealer or AitM; account takeover of existing verified customer.

**Bypass methods relevant to M16:**

1. **Attacker enrolls own TOTP after password reset.**
   - **CAUGHT.** Passkey-only policy for SOC orders makes TOTP enrollment irrelevant — the attacker's TOTP won't satisfy the step-up. Additionally, the recovery flow requires IDV (m14) re-verification, so the password reset itself is gated.

2. **Infostealer-sourced TOTP seed.**
   - **CAUGHT.** Same as account-hijack Method 3 — passkey-only policy blocks TOTP.

3. **Passkey/FIDO2 uncertainty — hardware authenticator required.**
   - **CAUGHT** (if hardware key policy). The implementation allows passkeys but does not distinguish synced from hardware-bound. If synced passkeys are accepted, cloud account compromise (Method 8 from account-hijack) is a path. If hardware-only, the barrier is very high.
   - **AMBIGUOUS** on hardware-only vs. synced passkey policy.

4. **Account takeover inheriting prior IAL1 pass (password reset via compromised email).**
   - **CAUGHT.** Step-up at SOC order time requires a fresh passkey challenge regardless of prior IAL status. The attacker cannot inherit a prior session.

**Net assessment:** Strong. Passkey-only policy defeats the dominant cheap paths (TOTP re-enrollment, infostealer seeds). The synced-vs-hardware passkey question is the remaining ambiguity.

---

### 3. dormant-account-takeover — exploit-affiliation

**Summary:** IT admin reactivates dormant synthesis-provider account by controlling the former researcher's email.

**Bypass methods relevant to M16:**

1. **Bypass A — Email-channel MFA recovery.**
   - **CAUGHT.** IDV-gated recovery flow means the IT admin must pass identity proofing as the original account holder. The admin is not the original holder — `stripe_identity_name_mismatch` (from m14) blocks the recovery unless the admin can deepfake/morph past IDV (which is expensive and risky).

2. **Bypass B — Social-engineer provider support.**
   - **AMBIGUOUS.** Same as account-hijack Method 7. The IT admin has institutional PII and authority. The playbook requires IDV re-verification, but procedural compliance is not guaranteed. The admin may claim "I'm the new designated account holder for this lab" — the support process must explicitly reject role-based claims.

3. **Bypass C — IdP impersonation (federated login, re-enroll MFA at IdP level).**
   - **CAUGHT.** The implementation specifies: "require a passkey factor *at the synthesis provider's IdP* in addition to federation." Even if the IT admin re-enrolls MFA at the institutional IdP, the provider's own passkey enrollment is bound to the original holder's device. The admin cannot complete the provider-side passkey challenge without the original holder's device or a cloud-account-sync attack.

4. **Bypass D — IdP MFA policy relaxation.**
   - **CAUGHT.** Same as Bypass C: provider-side passkey requirement is independent of the institutional IdP policy. Relaxing the institutional policy doesn't bypass the provider's own passkey gate.

**Net assessment:** Strong. The dual-layer approach (provider-side passkey + IDV-gated recovery) defeats 3 of 4 methods. Social-engineering support is the remaining procedural risk.

---

## Findings

### Critical

None.

### Moderate

**M1 — Synced passkeys (iCloud Keychain, Google Password Manager) are vulnerable to cloud account compromise.**

- **Stories affected:** account-hijack (Method 8), credential-compromise (if cloud credentials are in the same infostealer haul).
- **Why missed:** The implementation requires FIDO2/WebAuthn passkeys but does not distinguish synced (multi-device) passkeys from hardware-bound (single-device) passkeys. An attacker who compromises the PI's Apple or Google account can inject a new device into the passkey sync group and authenticate at the provider with a legitimate passkey. The provider sees a valid WebAuthn assertion with no distinguishing signal.
- **Suggestion for re-research:** Stage 4 should specify a policy on synced vs. hardware-bound passkeys. Options: (a) require hardware security keys (FIDO2 roaming authenticators) for SOC-order step-up — highest security, highest friction; (b) accept synced passkeys but add `mfa_recent_enroll` detection for newly-synced devices — requires relying-party visibility into passkey device count, which is not standard in FIDO2; (c) document the cloud-account-sync risk as accepted and rely on m14-stripe-identity's IDV re-proofing as a compensating control.

**M2 — Social engineering of provider support bypasses procedural controls.**

- **Stories affected:** account-hijack (Method 7), dormant-account-takeover (Bypass B).
- **Why missed:** The implementation documents an IDV-required playbook for support-initiated MFA resets, but social engineering targets human compliance. Voice cloning ($22/month), PII from the compromised inbox, and institutional authority (IT admin) create a plausible impersonation. The implementation does not specify anti-SE controls (mandatory delay, dual-agent approval, callback verification).
- **Suggestion for re-research:** Stage 4 should specify: (a) mandatory 48–72h delay on any support-initiated MFA reset; (b) dual-agent approval (two support agents must sign off); (c) out-of-band callback to the phone number on file (not the one the caller provides); (d) all support-initiated resets generate a notification to the customer's registered backup email/phone.

**M3 — Adaptive MFA risk-signal specificity not defined.**

- **Stories affected:** account-hijack (Method 2 — session hijack with anti-detect browser).
- **Why missed:** The implementation mentions `mfa_high_risk_signal` and adaptive risk scoring but does not specify which signals are checked (geo-velocity, device fingerprint, IP reputation, etc.) or what score threshold triggers the flag. Anti-detect browsers with residential proxies are specifically designed to defeat adaptive risk signals.
- **Suggestion for re-research:** Stage 4 should enumerate the specific risk signals and document whether Auth0/Okta/Cognito's adaptive risk can detect fingerprint-matched anti-detect browsers.

### Minor

**N1 — `mfa_recent_enroll` 48h cooling period is a heuristic.**

- **Stories affected:** account-hijack (Method 1), credential-compromise.
- **Why ambiguous:** The 48h cooling period is marked `[best guess]`. If the cooling period is too short, the attacker waits. If too long, legitimate new customers are delayed.
- **Suggestion:** Specify the reasoning behind the 48h figure and whether it should be configurable.

**N2 — Federated IdP MFA strength is opaque to the provider.**

- **Stories affected:** dormant-account-takeover (Bypass C/D).
- **Why ambiguous:** The implementation mitigates this by requiring a provider-side passkey, but for non-SOC interactions the provider may still rely on the federated assertion. The scope of provider-side passkey enforcement (SOC-only or all orders) is not fully specified.
- **Suggestion:** Clarify whether the provider-side passkey is required for all account access or only SOC orders.

---

## bypass_methods_known

| # | Bypass method | Classification | Stories |
|---|---|---|---|
| 1 | Email-channel MFA reset | CAUGHT | account-hijack, credential-compromise, dormant-account-takeover |
| 2 | Session hijack + anti-detect browser | AMBIGUOUS | account-hijack |
| 3 | Infostealer TOTP seed | CAUGHT | account-hijack, credential-compromise |
| 4 | AitM phishing relay (Tycoon 2FA) | CAUGHT | account-hijack |
| 5 | FIDO2 downgrade to SMS/TOTP fallback | CAUGHT | account-hijack |
| 6 | SIM-jacking / SS7 | CAUGHT | account-hijack |
| 7 | Social engineering provider support | AMBIGUOUS | account-hijack, dormant-account-takeover |
| 8 | Cloud account compromise → synced passkey injection | MISSED | account-hijack, credential-compromise |
| 9 | Timing / grace period exploitation | CAUGHT | account-hijack |
| 10 | Attacker enrolls own TOTP after reset | CAUGHT | credential-compromise |
| 11 | IdP impersonation (federated re-enrollment) | CAUGHT | dormant-account-takeover |
| 12 | IdP MFA policy relaxation | CAUGHT | dormant-account-takeover |

## bypass_methods_uncovered

| # | Bypass method | Severity | Notes |
|---|---|---|---|
| 1 | Cloud account compromise → synced passkey sync | Moderate | Requires synced-vs-hardware policy decision |
| 2 | Social engineering support | Moderate | Procedural control, needs anti-SE hardening |
| 3 | Anti-detect browser evading adaptive risk | Moderate | Risk-signal specificity not defined |

---

## Verdict: **PASS**

No Critical findings. The implementation catches 8 of 12 mapped bypass methods through its passkey-only + IDV-gated recovery design. The three Moderate findings (synced passkey risk, social engineering, adaptive risk specificity) are addressable through policy clarification and procedural hardening, not fundamental redesign. Pipeline continues to stage 6.
