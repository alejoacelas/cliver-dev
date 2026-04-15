# m16-no-sms-no-email-reset — Bypass-Aware Hardening v1

- **measure:** M16 (mfa-stepup)
- **idea:** No-SMS, no-email-reset SOP

---

## Attacker Story Walk

### 1. account-hijack

**Summary:** Attacker compromises a PI's email, takes over the PI's pre-existing verified synthesis provider account.

**Bypass methods relevant to this measure:**

- **Method 1: MFA reset via email recovery.**
  - **Classification: CAUGHT** — this is the primary target of the idea. Email alone cannot complete a factor reset; the SOP requires either a hardware-token re-enrollment witnessed by a human reviewer on a video call, or a fresh m14 IDV step. The institutional security contact notification (step 5 of the SOP) provides an out-of-band alert the attacker cannot suppress unless they also control the security contact alias.

- **Method 2: Session hijack via stolen cookies + anti-detect browser.**
  - **Classification: MISSED** — session hijack does not involve a password or factor reset. The attacker rides an existing session. This idea addresses *recovery workflows*, not *session management*. Cross-references m16-order-time-stepup for the session-level control.

- **Method 3: Infostealer-exfiltrated TOTP seed.**
  - **Classification: MISSED** — the attacker already has the TOTP seed; they never need to reset anything. This idea blocks *reset channels*, not *possession of a valid factor*. Cross-references m16-webauthn-yubikey for the factor-type control.

- **Method 4: Real-time AitM phishing relay.**
  - **Classification: MISSED** — same reasoning as Method 3. The attacker relays the legitimate TOTP code in real time; no reset occurs. Cross-references m16-webauthn-yubikey.

- **Method 5: FIDO2 downgrade attack.**
  - **Classification: MISSED** — downgrade forces fallback to TOTP or SMS. Since this idea disables SMS, the fallback is TOTP only. If the attacker can relay the TOTP (AitM), the downgrade still works. However, the idea does *partially* address this by removing SMS as a fallback target. Net: partially mitigated for the SMS component, missed for the TOTP relay component.

- **Method 6: SIM-jacking / SS7 interception.**
  - **Classification: CAUGHT** — SMS is not a factor. SIM-jacking yields nothing because no SMS OTP is ever sent or accepted for authentication or recovery.

- **Method 7: Social engineering provider support.**
  - **Classification: CAUGHT (partial)** — the SOP routes all factor-reset requests to a video call with IDV. However, the attacker mapping notes "a sufficiently skilled attacker who also controls the institutional security contact alias survives." The implementation acknowledges this in its cross-ref. The weekly audit-log review (checking for `recovery_completed_with_idv` events) is a detective control but does not prevent a well-executed social-engineering attack on the help-desk agent.

- **Method 8: Compromise cloud account to inject a passkey.**
  - **Classification: MISSED** — this method does not involve a reset. The attacker adds a device to the passkey sync group via the cloud account. No interaction with the recovery workflow. Cross-references m16-webauthn-yubikey (AAGUID allowlist blocks synced passkeys).

- **Method 9: Timing — exploit grace period.**
  - **Classification: MISSED** — grace-period exploitation does not involve a reset. Cross-references m16-order-time-stepup.

**Net assessment:** The idea substantially raises the cost and difficulty of email-based account recovery attacks and eliminates SMS as an attack surface. It does not address attacks that bypass the recovery workflow entirely (session hijack, TOTP seed possession, AitM relay, cloud passkey injection, grace-period exploit). These are addressed by sibling ideas.

---

### 2. credential-compromise

**Summary:** Attacker compromises faculty/staff credentials via breach databases or AitM phishing.

**Bypass methods relevant to this measure:**

- **Attacker enrolls own TOTP (new or reset account).**
  - **Classification: CAUGHT** — if the attacker resets the password and attempts to enroll a new TOTP, the no-email-reset SOP intervenes. Password reset requires a second factor challenge; if the attacker doesn't have the existing second factor, they're routed to the video-call SOP. The legitimate user is notified via the institutional security contact.

- **Infostealer-sourced TOTP seed.**
  - **Classification: MISSED** — the attacker already has the seed. No reset needed. Cross-references m16-webauthn-yubikey.

- **Account takeover via password reset + email-only.**
  - **Classification: CAUGHT** — the core design. Password reset requires the second factor; email alone is insufficient.

- **Uncertainty branch — passkeys/FIDO2 requirement.**
  - **Classification: N/A** — the idea is compatible with and complementary to a FIDO2 requirement (cross-references m16-webauthn-yubikey).

**Net assessment:** Strong closure of the email-channel password-reset path. The branch's cheapest path ($5 infostealer log → password reset → MFA re-enrollment) is blocked at the MFA re-enrollment step. The branch must fall back to either (a) an infostealer log that also contains the TOTP seed (low probability, ~1-5%) or (b) AitM phishing (higher cost, $120-350).

---

### 3. dormant-account-takeover

**Summary:** IT admin takes over a dormant synthesis-provider account via legitimate mailbox control.

**Bypass methods relevant to this measure:**

- **Bypass A — Email-channel MFA recovery.**
  - **Classification: CAUGHT** — the primary target. After password reset, the attacker tries MFA recovery through email; this path is blocked. The attacker is routed to the video-call SOP, where (a) the help-desk agent checks the selfie or runs IDV (catching the impostor — different person), and (b) the institutional security contact is notified (alerting the institution that someone is accessing a departed researcher's account).

- **Bypass B — Social-engineer provider support.**
  - **Classification: CAUGHT (partial)** — the SOP mandates a video call with IDV. The IT admin cannot claim to be the departed researcher convincingly if IDV checks are performed. However, if the help-desk agent is socially engineered into bypassing the SOP, this fails. The implementation notes weekly audit-log reviews as a detective control.

- **Bypass C — IdP impersonation (federated login).**
  - **Classification: MISSED** — IdP impersonation bypasses the provider's recovery workflow entirely. The admin logs in via federation without triggering any reset flow. This idea's SOP governs recovery events, not login events. Cross-references m16-dormancy-reidv (dormancy timer) and m16-order-time-stepup (order-time re-auth).

- **Bypass D — IdP MFA policy relaxation.**
  - **Classification: MISSED** — same reasoning as Bypass C. The admin relaxes MFA at the IdP level and logs in normally. No provider-side recovery flow is triggered.

**Net assessment:** Strong on email-channel recovery (the branch's baseline assumption). Weak on federated-login and IdP-level bypasses, which are higher-expertise paths but carry zero provider-side trace.

---

## Findings

### Finding 1 — Moderate: Help-desk social engineering remains a viable path despite the SOP

- **Source:** account-hijack Method 7; dormant-account-takeover Bypass B.
- **Why missed:** The SOP says all factor resets go through a video call with IDV. But help-desk agents can be social-engineered. The implementation's detective control (weekly audit-log review checking for `recovery_completed_with_idv` events on all recovery tickets) catches *after the fact*, not in real time. The 0ktapus campaign demonstrated that credential + MFA theft via social engineering can work at scale even against organizations with SOPs.
- **Suggestion:** Add a mandatory dual-authorization requirement for any factor reset that does not produce a passing IDV inquiry — i.e., no single help-desk agent can complete a recovery without a second agent or a supervisor signing off. This is a process control, not a technology control, but it directly addresses the single-agent social-engineering path.

### Finding 2 — Minor: Cooling-off period duration not specified for all cases

- **Source:** General.
- **Why missed:** The SOP specifies a 24-hour cooling-off for SOC orders after a factor reset (cross-referencing m16-order-time-stepup). But the implementation does not specify what happens during those 24 hours — can the attacker place non-SOC orders? Can they change account settings (shipping address, payment methods)? If so, the attacker could use the 24-hour window to stage address changes before the SOC block lifts.
- **Suggestion:** Block all account modifications (address, payment, contact info) during the cooling-off period, not just SOC orders.

### Finding 3 — Minor: Institutional security contact as a single point of failure

- **Source:** account-hijack Method 7; dormant-account-takeover Bypass A.
- **Why missed:** The implementation sends a notification to the institutional security contact, but if that contact is a distribution list controlled by the same IT department (dormant-account-takeover scenario), the attacker can suppress the notification. The implementation notes `recovery_notification_bounced` as a flag but does not address the suppression scenario.
- **Suggestion:** Send notifications to multiple channels: (a) the institutional security contact, (b) the PI's supervisor or department chair (if known), and (c) a delay-email to the account holder's personal email if one is on file.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| MFA reset via email recovery | account-hijack, dormant-account-takeover | CAUGHT |
| Session hijack via stolen cookies | account-hijack | MISSED (not a recovery event) |
| Infostealer-exfiltrated TOTP seed | account-hijack, credential-compromise | MISSED (no reset needed) |
| AitM phishing relay | account-hijack | MISSED (no reset needed) |
| FIDO2 downgrade (SMS component) | account-hijack | CAUGHT (SMS disabled) |
| FIDO2 downgrade (TOTP relay component) | account-hijack | MISSED |
| SIM-jacking / SS7 | account-hijack | CAUGHT (SMS not a factor) |
| Social engineering provider support | account-hijack, dormant-account-takeover | CAUGHT (partial — SOP-dependent) |
| Cloud passkey injection | account-hijack | MISSED (not a recovery event) |
| Grace-period exploit | account-hijack | MISSED (not a recovery event) |
| Attacker enrolls own TOTP after reset | credential-compromise | CAUGHT |
| Password reset via email-only | credential-compromise | CAUGHT |
| IdP impersonation | dormant-account-takeover | MISSED (bypasses provider recovery) |
| IdP MFA policy relaxation | dormant-account-takeover | MISSED (bypasses provider recovery) |

## bypass_methods_uncovered

- Session hijack via stolen cookies: not in scope (addressed by m16-order-time-stepup).
- Infostealer-exfiltrated TOTP seed: not in scope (addressed by m16-webauthn-yubikey).
- AitM phishing relay: not in scope (addressed by m16-webauthn-yubikey).
- Cloud passkey injection: not in scope (addressed by m16-webauthn-yubikey AAGUID allowlist).
- Grace-period exploit: not in scope (addressed by m16-order-time-stepup).
- IdP impersonation / policy relaxation: structural gap — provider cannot control upstream IdP behavior.
- Help-desk social engineering: partially addressed by SOP + audit, but no preventive dual-authorization control.

---

## Verdict

**PASS** — no Critical findings. The Moderate finding (help-desk social engineering) is a process control gap that is expensive for attackers and caught by detective controls. The Minor findings are refinements. Pipeline continues to stage 6.
