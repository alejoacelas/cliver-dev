# m16-webauthn-yubikey — Bypass-Aware Hardening v1

- **measure:** M16 (mfa-stepup)
- **idea:** WebAuthn / YubiKey hardware token enforcement

---

## Attacker Story Walk

### 1. account-hijack

**Summary:** Attacker compromises a PI's email, takes over the PI's verified synthesis provider account.

**Bypass methods relevant to this measure:**

- **Method 1: MFA reset via email recovery.**
  - **Classification: MISSED** — hardware token enforcement does not address the *recovery* channel. If the attacker resets MFA via email and the IdP allows re-enrollment of a new hardware token without additional safeguards, the attacker enrolls their own YubiKey. The token passes attestation (it's a real YubiKey with a valid AAGUID). Cross-references m16-no-sms-no-email-reset for closing the recovery channel.

- **Method 2: Session hijack via stolen cookies + anti-detect browser.**
  - **Classification: MISSED** — session hijack does not interact with the authenticator. Cross-references m16-order-time-stepup (`max_age=0`).

- **Method 3: Infostealer-exfiltrated TOTP seed.**
  - **Classification: CAUGHT** — if WebAuthn hardware tokens are the *only* allowed factor (no TOTP fallback), an exfiltrated TOTP seed is useless. The IdP rejects TOTP login attempts entirely. This is the primary value of the idea for this method.

- **Method 4: Real-time AitM phishing relay (Tycoon 2FA / EvilProxy).**
  - **Classification: CAUGHT** — WebAuthn binds the authentication assertion to the relying-party origin. A phishing site at a different origin cannot produce a valid WebAuthn signature. The relay receives the PI's password but cannot relay the WebAuthn challenge-response because the origin doesn't match. This is the primary value of the idea for this method.

- **Method 5: FIDO2 downgrade attack.**
  - **Classification: CAUGHT (conditional)** — the implementation specifies a `webauthn_downgrade_attempt` flag that fires when the IdP detects a login attempt that would have been a downgrade. With Okta's "phishing-resistant only" policy and no TOTP/SMS fallback, the downgrade has nowhere to go. However, the implementation notes a condition: the IdP must enforce "phishing-resistant only" with no fallback. If any fallback path exists (even for edge cases), the downgrade can exploit it. The implementation acknowledges the Proofpoint 2025 demonstration.

- **Method 6: SIM-jacking / SS7 interception.**
  - **Classification: CAUGHT** — SMS is not a factor (cross-references m16-no-sms-no-email-reset). Even without that sibling idea, if WebAuthn is the only enrolled factor, SIM-jacking yields nothing useful at the provider.

- **Method 7: Social engineering provider support.**
  - **Classification: MISSED** — social engineering bypasses the technical control. If the support agent ships a new YubiKey to the attacker or enrolls a new credential on the attacker's key, the attacker has a valid hardware token. Cross-references m16-no-sms-no-email-reset (help-desk SOP).

- **Method 8: Compromise cloud account to inject a passkey.**
  - **Classification: CAUGHT** — the AAGUID allowlist is the catching mechanism. Apple iCloud Keychain and Google Password Manager have known AAGUIDs that are *excluded* from the enterprise allowlist. An injected synced passkey fails enrollment/attestation validation. The implementation specifically describes this: "if the AAGUID is not on the allowlist (e.g., the customer tried to enroll a software passkey synced via Apple iCloud), enrollment fails."

- **Method 9: Timing — exploit grace period.**
  - **Classification: MISSED** — hardware token enforcement does not address grace periods. Cross-references m16-order-time-stepup.

**Net assessment:** The idea eliminates the two most dangerous technical bypasses: AitM phishing relay and infostealer TOTP seed. It also closes FIDO downgrade (when no fallback exists), SIM-jacking, and cloud passkey injection. It does not address operational bypasses (social engineering, session hijack, grace periods) or the recovery-channel problem.

---

### 2. credential-compromise

**Summary:** Attacker compromises faculty/staff credentials via breach databases or AitM phishing.

**Bypass methods relevant to this measure:**

- **Attacker enrolls own TOTP (after password reset).**
  - **Classification: CAUGHT** — TOTP enrollment is blocked; only WebAuthn hardware tokens are accepted. The attacker cannot enroll a TOTP even after a password reset. They would need to enroll a *hardware token*, which requires physical possession of an allowlisted key plus (per the sibling SOP) a video call.

- **Infostealer-sourced TOTP seed.**
  - **Classification: CAUGHT** — TOTP is not a valid factor; the seed is useless.

- **AitM phishing (Tycoon 2FA).**
  - **Classification: CAUGHT** — same origin-binding argument as account-hijack Method 4. The AitM relay cannot produce a valid WebAuthn signature.

- **Uncertainty branch — passkeys/FIDO2 requirement.**
  - **Classification: CAUGHT** — this idea *is* the FIDO2 requirement. The implementation resolves the uncertainty branch in favor of the defender.

**Net assessment:** Very strong against this branch. The branch's two primary paths — infostealer TOTP seed and AitM phishing — are both closed. The residual is the account-takeover path combined with social engineering of the help-desk to ship a new hardware key.

---

### 3. dormant-account-takeover

**Summary:** IT admin takes over a dormant provider account.

**Bypass methods relevant to this measure:**

- **Bypass A — Email-channel MFA recovery.**
  - **Classification: CAUGHT (partial)** — if WebAuthn is the only factor, the attacker must enroll a new *hardware token*. They cannot fall back to TOTP. The enrollment ceremony requires attestation validation against the AAGUID allowlist. However, the attacker can buy a real YubiKey (publicly available for $25-50), and it will pass attestation. The catch is operational: m16-no-sms-no-email-reset's SOP requires a video call for re-enrollment, and the dormancy-reidv check requires a selfie match. Without those sibling controls, hardware-token-only enforcement does not independently prevent a new enrollment by the attacker.

- **Bypass B — Social-engineer provider support.**
  - **Classification: MISSED** — same as account-hijack Method 7.

- **Bypass C — IdP impersonation.**
  - **Classification: AMBIGUOUS** — if the IT admin impersonates the original holder at the IdP level and the federation passes through a valid WebAuthn credential (the original holder's, still registered), the provider sees a valid hardware-token auth. But this requires the original holder's *physical* hardware token, which the departed researcher likely took with them. If the original token is still in a lab drawer, the admin could use it. If not, this path fails.

- **Bypass D — IdP MFA policy relaxation.**
  - **Classification: CAUGHT (conditional)** — if the admin relaxes the IdP's MFA policy to remove the WebAuthn requirement, and the provider's `acr_values` check (`acr=phr`) fires, the login is blocked or flagged. This depends on the provider validating `acr` on the returned token, which the m16-order-time-stepup implementation specifies.

**Net assessment:** Hardware token enforcement adds meaningful friction for this branch: the attacker needs a physical token and the enrollment process (constrained by sibling SOPs). But it is not independently sufficient — the real catch comes from the selfie-match (m16-dormancy-reidv) and the no-email-reset SOP.

---

## Findings

### Finding 1 — Moderate: Attacker can purchase a legitimate YubiKey and enroll it

- **Source:** dormant-account-takeover Bypass A; account-hijack Method 1.
- **Why missed:** YubiKeys are commercially available for $25-50. The AAGUID allowlist validates that the key is genuine Yubico hardware, but it cannot validate *who owns* the key. An attacker who successfully navigates the recovery workflow (bypassing sibling SOP controls) can enroll their own genuine YubiKey. The hardware-token requirement raises the bar only in combination with recovery controls that verify the *person*, not just the *token*.
- **Suggestion:** This is a by-design limitation of hardware-token enforcement — the token attests to its own provenance, not the holder's identity. The mitigation is layered with m16-no-sms-no-email-reset (video-call SOP) and m16-dormancy-reidv (selfie match). No change to this idea is needed, but stage 7 synthesis should note that hardware-token enforcement is necessary but not sufficient in isolation.

### Finding 2 — Moderate: Enterprise SSO federation may not enforce WebAuthn

- **Source:** dormant-account-takeover Bypass C; general.
- **Why missed:** The implementation notes: "Enterprise SSO upstream that doesn't honor the WebAuthn requirement when the customer logs in via federation. Must require WebAuthn at the upstream IdP too, or pin federation off for SOC accounts." This is flagged as a failure mode, but the implementation does not specify the enforcement mechanism. If the provider accepts federated logins, it must validate the returned `amr` claim for `hwk` or `fido` — and reject logins that authenticated with only password+TOTP at the upstream IdP.
- **Suggestion:** Specify that the provider must validate `amr` on every federated login and reject sessions where `amr` does not include a phishing-resistant authenticator type. If the upstream IdP does not support `amr` claims, federation should be disabled for SOC-eligible accounts.

### Finding 3 — Minor: YubiKey supply-chain recall procedure

- **Source:** General.
- **Why missed:** The implementation mentions the Infineon EUCLEAK side-channel disclosure as a failure mode but marks the affected AAGUID list as `[unknown]`. In a real deployment, a firmware recall that requires revoking a large number of enrolled credentials simultaneously would create a wave of users unable to authenticate. The implementation does not describe a mass-rollover procedure.
- **Suggestion:** Document a mass-credential-rollover playbook: staged rollover by customer tier, temporary backup authentication path (video-call IDV only — no TOTP fallback), and proactive customer communication timeline.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| MFA reset via email recovery | account-hijack, dormant-account-takeover | MISSED (recovery channel, not factor type) |
| Session hijack via stolen cookies | account-hijack | MISSED (no authenticator interaction) |
| Infostealer-exfiltrated TOTP seed | account-hijack, credential-compromise | CAUGHT (TOTP not accepted) |
| AitM phishing relay | account-hijack, credential-compromise | CAUGHT (origin-binding) |
| FIDO2 downgrade | account-hijack | CAUGHT (no fallback, downgrade detected) |
| SIM-jacking / SS7 | account-hijack | CAUGHT (SMS not a factor) |
| Social engineering support | account-hijack, dormant-account-takeover | MISSED (operational bypass) |
| Cloud passkey injection | account-hijack | CAUGHT (AAGUID allowlist) |
| Grace-period exploit | account-hijack | MISSED (session-level, not factor-level) |
| Attacker enrolls own TOTP | credential-compromise | CAUGHT (TOTP blocked) |
| AitM phishing (Tycoon 2FA) | credential-compromise | CAUGHT (origin-binding) |
| IdP impersonation with original token | dormant-account-takeover | AMBIGUOUS (depends on token physical custody) |
| IdP MFA policy relaxation | dormant-account-takeover | CAUGHT (conditional on acr validation) |

## bypass_methods_uncovered

- Recovery-channel attacks (email-based MFA reset, social engineering): out of scope for factor-type enforcement; addressed by m16-no-sms-no-email-reset.
- Session hijack and grace-period exploit: addressed by m16-order-time-stepup.
- Attacker purchasing and enrolling a legitimate hardware token: structural — hardware attestation proves token provenance, not holder identity.
- Federated logins that bypass WebAuthn requirement: implementation gap in `amr` validation.

---

## Verdict

**PASS** — no Critical findings. The idea's core value (eliminating AitM phishing relay, infostealer TOTP bypass, FIDO downgrade, SIM-jacking, and cloud passkey injection) is intact. The Moderate findings are layering gaps addressed by sibling ideas and a federation enforcement detail. Pipeline continues to stage 6.
