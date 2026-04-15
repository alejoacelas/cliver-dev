# m16-dormancy-reidv — Bypass-Aware Hardening v1

- **measure:** M16 (mfa-stepup)
- **idea:** Dormancy re-IDV trigger

---

## Attacker Story Walk

### 1. account-hijack

**Summary:** Attacker compromises a PI's email, takes over the PI's pre-existing verified synthesis provider account.

**Bypass methods relevant to this measure:**

- **Method 1: MFA reset via email recovery.**
  - **Classification: CAUGHT** — but only if the account was dormant. The dormancy re-IDV fires on accounts idle >180 days; on next login the attacker must pass selfie+ID matching the *stored original holder*. An attacker who resets MFA via email and then logs in faces the selfie comparison barrier. However, if the hijacked account was recently active (not dormant), this check does not fire at all.

- **Method 2: Session hijack via stolen cookies + anti-detect browser.**
  - **Classification: MISSED** — session hijack does not trigger a new login event. If the PI's last login was recent (account not dormant), the attacker rides the existing session. Even if the account *were* dormant, a session cookie replay might not trigger the dormancy check depending on whether the IdP treats a cookie-based session restoration as a "login." The implementation document does not specify how dormancy interacts with session restoration vs. fresh credential-based login.

- **Method 3: Infostealer-exfiltrated TOTP seed.**
  - **Classification: CAUGHT (conditional)** — only if the account is dormant. A dormant account forces re-IDV regardless of how the attacker authenticates. If the account is active, this check is irrelevant.

- **Method 4: Real-time AitM phishing relay.**
  - **Classification: CAUGHT (conditional)** — same as Method 3. Only fires for dormant accounts. Active accounts are unprotected by this idea.

- **Methods 5–9 (FIDO downgrade, SIM-jacking, social engineering support, cloud passkey injection, grace-period exploit):**
  - **Classification: CAUGHT (conditional)** — all caught only when the account is dormant, because the re-IDV selfie match against the stored portrait is factor-agnostic. For active accounts, none are addressed.

**Net assessment:** The check is highly effective against the dormant-account-takeover branch specifically. For the account-hijack branch, it helps only when the targeted PI account happens to be dormant — which is a minority of cases, since this branch specifically targets active PIs with verified accounts. The implementation document correctly notes this in its cross-ref section.

---

### 2. credential-compromise

**Summary:** Attacker compromises faculty/staff credentials via breach databases or AitM phishing, takes over an existing verified account.

**Bypass methods relevant to this measure:**

- **Attacker enrolls own TOTP (new or reset account).**
  - **Classification: CAUGHT (conditional)** — only if the target account was dormant. The re-IDV selfie match catches the impostor.

- **Infostealer-sourced TOTP seed.**
  - **Classification: CAUGHT (conditional)** — same dormancy condition.

- **Account takeover via password reset + email.**
  - **Classification: CAUGHT (conditional)** — same. The implementation correctly identifies this as a partial address for credential-compromise.

**Net assessment:** Minimal reduction for this branch's primary targets (small-college faculty who are active customers). The branch explicitly targets "a target who is already an active customer" — dormant accounts are a secondary target pool.

---

### 3. dormant-account-takeover

**Summary:** IT admin at a target institution takes over a dormant synthesis-provider account belonging to a departed researcher.

**Bypass methods relevant to this measure:**

- **Bypass A — Email-channel MFA recovery.**
  - **Classification: CAUGHT** — the account is dormant by definition. The attacker triggers MFA recovery via email, logs in, and immediately hits the re-IDV wall. The selfie match against the original holder's stored selfie catches the IT admin (a different person). The authenticator re-bind (step 6 in the SOP) revokes old factors.

- **Bypass B — Social-engineer provider support.**
  - **Classification: CAUGHT** — even if the attacker bypasses MFA via social engineering, the dormancy flag persists. The implementation blocks SOC orders until re-IDV completes, and the manual review SOP includes an institutional directory check ("is this researcher still here?").

- **Bypass C — IdP impersonation (federated login).**
  - **Classification: AMBIGUOUS** — the implementation describes the dormancy timer as checking `last_successful_login_at` against the IdP. If the attacker logs in via federated SSO using IdP impersonation, does the IdP report a new `last_successful_login_at`? If yes, the dormancy check fires. If the IdP passes a cached assertion, the check might not fire. The implementation does not specify how federated-login sessions interact with the dormancy timer.

- **Bypass D — IdP MFA policy relaxation.**
  - **Classification: CAUGHT** — the dormancy timer is orthogonal to MFA policy. Even if the attacker relaxes MFA requirements, the dormancy flag triggers re-IDV on next login. The selfie match is the catching mechanism, not the MFA itself.

**Net assessment:** This is the central target for this idea, and the coverage is strong. The selfie-match-against-stored-portrait design is well-suited: the IT admin is a *different person* than the original holder, so biometric mismatch is reliable. The only gap is the federated-login ambiguity.

---

## Findings

### Finding 1 — Minor: Federated login interaction with dormancy timer unspecified

- **Source:** dormant-account-takeover, Bypass C (IdP impersonation).
- **Why missed:** The implementation describes dormancy as keyed on `last_successful_login_at` but does not specify whether a federated SSO assertion that bypasses the local IdP login ceremony updates this timestamp. An IT admin with IdP-level impersonation could potentially present a valid SAML assertion to the provider without triggering the dormancy check.
- **Suggestion:** Stage 4 should specify that the dormancy timer must be evaluated at the provider's relying-party layer (i.e., the provider checks when it last saw a successful session for this user, regardless of how that session was established), not delegated to the upstream IdP's last-login timestamp.

### Finding 2 — Minor: Session restoration vs. fresh login ambiguity

- **Source:** account-hijack, Method 2 (session hijack via stolen cookies).
- **Why missed:** The implementation says "no successful login" for >180 days triggers the check, but does not define whether restoring a session via a stolen cookie constitutes a "login." If the IdP or the application treats a valid session cookie as an ongoing session (no new auth event), the dormancy check never fires even if the account had been idle.
- **Suggestion:** Clarify that dormancy is measured against *authentication events* (new credential presentations), not session continuity. A session restored from a cookie should not reset the dormancy clock.

### Finding 3 — Moderate: Active accounts are entirely unprotected

- **Source:** account-hijack (all methods), credential-compromise (all methods).
- **Why moderate, not critical:** The implementation document explicitly acknowledges this ("not addressed for active accounts — m16-order-time-stepup and m16-webauthn-yubikey are the controls there"). This is by design, not an oversight. The idea targets dormant-account-takeover specifically. However, the by-design gap means this idea provides essentially zero value against the two most dangerous account-hijack attacker branches unless they happen to target a dormant account.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| MFA reset via email recovery (dormant account) | account-hijack, dormant-account-takeover | CAUGHT |
| Session hijack via stolen cookies | account-hijack | MISSED (ambiguous session-restoration behavior) |
| Infostealer-exfiltrated TOTP seed (dormant) | account-hijack, credential-compromise | CAUGHT |
| AitM phishing relay (dormant) | account-hijack | CAUGHT |
| FIDO downgrade (dormant) | account-hijack | CAUGHT |
| SIM-jacking (dormant) | account-hijack | CAUGHT |
| Social-engineer provider support | account-hijack, dormant-account-takeover | CAUGHT |
| Cloud passkey injection (dormant) | account-hijack | CAUGHT |
| Grace-period exploit (dormant) | account-hijack | CAUGHT |
| Email-channel MFA recovery | dormant-account-takeover | CAUGHT |
| IdP impersonation (federated) | dormant-account-takeover | AMBIGUOUS |
| IdP MFA policy relaxation | dormant-account-takeover | CAUGHT |
| Attacker enrolls own TOTP (dormant) | credential-compromise | CAUGHT |
| Account takeover via password reset (active) | credential-compromise | MISSED (active account) |
| All methods on active accounts | account-hijack, credential-compromise | MISSED (by design) |

## bypass_methods_uncovered

- Session hijack via stolen cookies: ambiguous whether dormancy check fires on session restoration.
- Federated login IdP impersonation: ambiguous whether dormancy timer catches assertions from compromised upstream IdPs.
- All bypasses on active accounts: by design, not addressed by this idea.

---

## Verdict

**PASS** — no Critical findings. The two Minor findings are clarification gaps that do not undermine the core mechanism. The Moderate finding is a by-design limitation explicitly documented in the implementation. Pipeline continues to stage 6.
