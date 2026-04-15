# m16-order-time-stepup — Bypass-Aware Hardening v1

- **measure:** M16 (mfa-stepup)
- **idea:** Order-time `max_age=0` step-up authentication

---

## Attacker Story Walk

### 1. account-hijack

**Summary:** Attacker compromises a PI's email, takes over the PI's verified synthesis provider account.

**Bypass methods relevant to this measure:**

- **Method 1: MFA reset via email recovery.**
  - **Classification: CAUGHT (partial)** — the attacker can reset MFA and enroll their own factor, but when they try to submit a SOC order, `max_age=0` forces a fresh authentication. If the attacker has successfully enrolled their own TOTP, they *can* complete the fresh auth. So this idea alone does not block Method 1 — it blocks the *session* from being reused, but the attacker who already re-enrolled can still authenticate freshly. The real closure comes from m16-no-sms-no-email-reset blocking the re-enrollment. **Net: MISSED** when considered in isolation.

- **Method 2: Session hijack via stolen cookies + anti-detect browser.**
  - **Classification: CAUGHT** — this is the primary target. Cookie replay yields an existing session, but `max_age=0` at order submission forces a fresh credential+MFA presentation. The stolen cookie is insufficient; the attacker needs the actual credentials and MFA factor. Even with an anti-detect browser matching the PI's fingerprint, the IdP demands real credentials at order time.

- **Method 3: Infostealer-exfiltrated TOTP seed.**
  - **Classification: MISSED** — the attacker has the password and the TOTP seed. `max_age=0` forces a fresh auth, and the attacker completes it using the stolen credentials + TOTP. The implementation explicitly acknowledges this: "NOT closed by this idea alone — the attacker can complete the fresh auth using the stolen seed."

- **Method 4: Real-time AitM phishing relay.**
  - **Classification: MISSED** — the AitM relay can capture the fresh auth in real time. The attacker phishes the PI at order time, relays the fresh credentials and MFA code to the provider, and the order goes through. `max_age=0` does not help because the relay happens in real time.

- **Method 5: FIDO2 downgrade attack.**
  - **Classification: AMBIGUOUS** — the `stepup_factor_downgraded` flag fires when the user authenticates with a lower `acr` than required. If the IdP policy requires phishing-resistant (`acr=phr`) and the downgrade forces TOTP fallback, the flag fires and the order is held. But the implementation says the flag triggers a reviewer decision, not an automatic block. If the reviewer approves the downgrade as "legitimate" (which a well-crafted downgrade might look like), the bypass succeeds.

- **Method 6: SIM-jacking / SS7 interception.**
  - **Classification: MISSED** — if SMS is still a valid factor (cross-references m16-no-sms-no-email-reset for disabling it), the attacker SIM-jacks and completes the fresh auth with the intercepted SMS code. `max_age=0` demands a fresh auth; the attacker provides one.

- **Method 7: Social engineering provider support.**
  - **Classification: MISSED** — social engineering bypasses the technical control entirely. The support agent could enroll a new factor for the attacker; once enrolled, the attacker passes the fresh auth.

- **Method 8: Compromise cloud account to inject a passkey.**
  - **Classification: MISSED** — the injected passkey is a valid factor. `max_age=0` demands a fresh auth; the attacker provides one using the injected passkey. Cross-references m16-webauthn-yubikey (AAGUID allowlist) for the actual closure.

- **Method 9: Timing — exploit grace period.**
  - **Classification: CAUGHT** — this is the second primary target. `max_age=0` explicitly removes the grace period at order time. Even if the attacker has a session from 5 minutes ago, they must re-authenticate. The implementation correctly notes this.

**Net assessment:** The idea effectively closes session-hijack and grace-period attacks. It does *not* close attacks where the attacker possesses valid credentials + a valid factor, because the fresh auth succeeds with stolen material. This is by design — the idea gates on *freshness*, not *factor strength*.

---

### 2. credential-compromise

**Summary:** Attacker compromises faculty/staff credentials via breach databases or AitM phishing.

**Bypass methods relevant to this measure:**

- **Attacker enrolls own TOTP (after password reset).**
  - **Classification: MISSED** — same as account-hijack Method 1. The attacker has a valid TOTP and can complete the fresh auth. The implementation acknowledges this: "NOT closed by this idea alone; cross-references m16-no-sms-no-email-reset."

- **Infostealer-sourced TOTP seed.**
  - **Classification: MISSED** — the attacker has the seed and can complete the fresh auth.

- **Account takeover via password reset + email.**
  - **Classification: MISSED in isolation** — the attacker resets the password, re-enrolls TOTP, and completes the fresh auth at order time. The closure comes from m16-no-sms-no-email-reset blocking the email-only reset.

**Net assessment:** Low standalone value against this branch. The idea's contribution is forcing the attacker to *actually authenticate* at order time rather than riding a session, but since the branch's attacker already possesses valid credentials, the fresh auth is not a barrier.

---

### 3. dormant-account-takeover

**Summary:** IT admin takes over a dormant provider account belonging to a departed researcher.

**Bypass methods relevant to this measure:**

- **Bypass A — Email-channel MFA recovery.**
  - **Classification: MISSED in isolation** — the attacker re-enrolls a factor via email, then passes the fresh auth at order time. Cross-references m16-no-sms-no-email-reset and m16-dormancy-reidv.

- **Bypass B — Social-engineer provider support.**
  - **Classification: MISSED** — social engineering bypasses the technical control.

- **Bypass C — IdP impersonation.**
  - **Classification: AMBIGUOUS** — if the IdP impersonation produces a valid OIDC token with `auth_time` and `acr` meeting the requirements, the fresh auth is satisfied. The implementation notes federated-login issues but focuses on `max_age=0` not being honored upstream, not on IdP impersonation.

- **Bypass D — IdP MFA policy relaxation.**
  - **Classification: AMBIGUOUS** — if the admin relaxes MFA at the IdP and authenticates, the returned `acr` should be lower than required, triggering `stepup_factor_downgraded`. But this depends on the IdP actually downgrading `acr` rather than returning a stale value.

**Net assessment:** The idea provides a useful audit trail (every SOC order is bound to a timestamped auth event), but does not independently prevent any of this branch's bypasses.

---

## Findings

### Finding 1 — Moderate: `stepup_factor_downgraded` is a reviewer decision, not an automatic block

- **Source:** account-hijack Method 5 (FIDO downgrade).
- **Why missed:** The implementation says a downgraded `acr` triggers a flag and "order held; reviewer determines whether the downgrade is legitimate." A well-crafted downgrade (plausible user-agent claiming old browser) could be approved by a reviewer, allowing the bypass. For SOC orders — which are by definition high-risk — a downgraded authentication should be an automatic block, not a reviewer judgment call.
- **Suggestion:** Change the `stepup_factor_downgraded` handling to an automatic rejection for SOC orders: "Your order requires phishing-resistant authentication. Please use your hardware security key." Reviewer involvement only for non-SOC orders or for override requests that go through an escalation path.

### Finding 2 — Minor: `auth_time` validation window not specified

- **Source:** General.
- **Why missed:** The implementation says the order is "bound to the new `auth_time` claim" but does not specify the acceptable time window between `auth_time` and order submission. If the window is generous (e.g., 5 minutes), an attacker with a relayed session could submit the order within the window. If the window is tight (e.g., 30 seconds), it mitigates some relay attacks by requiring the attacker to act very quickly.
- **Suggestion:** Specify a maximum acceptable `auth_time` skew (e.g., `order_submission_time - auth_time < 120 seconds`). Tighter is better for security but worse for UX.

### Finding 3 — Minor: Batching window creates a mini grace period

- **Source:** account-hijack Method 9 (grace-period exploit).
- **Why missed:** The implementation suggests "a single re-auth can authorize one explicit ordering window (e.g., 5 minutes)" as a mitigation for re-auth fatigue. This 5-minute window is itself a mini grace period. An attacker who completes a fresh auth (via AitM or stolen TOTP) can submit multiple SOC orders within the window.
- **Suggestion:** Acknowledge this as a deliberate trade-off. Document that each order in the batch window is tied to the same auth event, and consider per-order re-auth for highest-risk SOC categories (select agents).

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| MFA reset via email recovery | account-hijack | MISSED (attacker re-enrolls, passes fresh auth) |
| Session hijack via stolen cookies | account-hijack | CAUGHT |
| Infostealer-exfiltrated TOTP seed | account-hijack, credential-compromise | MISSED (valid seed passes fresh auth) |
| AitM phishing relay | account-hijack | MISSED (real-time relay passes fresh auth) |
| FIDO2 downgrade | account-hijack | AMBIGUOUS (reviewer decision) |
| SIM-jacking / SS7 | account-hijack | MISSED (if SMS still a factor) |
| Social engineering support | account-hijack, dormant-account-takeover | MISSED |
| Cloud passkey injection | account-hijack | MISSED (injected passkey passes fresh auth) |
| Grace-period exploit | account-hijack | CAUGHT |
| Attacker enrolls own TOTP | credential-compromise | MISSED |
| Password reset + email | credential-compromise | MISSED in isolation |
| Email-channel MFA recovery | dormant-account-takeover | MISSED in isolation |
| IdP impersonation | dormant-account-takeover | AMBIGUOUS |
| IdP MFA policy relaxation | dormant-account-takeover | AMBIGUOUS |

## bypass_methods_uncovered

- All attacks where the attacker possesses valid credentials + a valid factor: by design, `max_age=0` verifies freshness, not factor legitimacy.
- AitM phishing relay: structurally missed — the relay completes the fresh auth in real time.
- FIDO downgrade to reviewer judgment: process gap, not automatically blocked.

---

## Verdict

**PASS** — no Critical findings. The idea does what it claims (binds orders to fresh auth events, closes session hijack and grace-period attacks) and explicitly defers factor-strength questions to sibling ideas. The Moderate finding on downgrade handling is a process refinement. Pipeline continues to stage 6.
