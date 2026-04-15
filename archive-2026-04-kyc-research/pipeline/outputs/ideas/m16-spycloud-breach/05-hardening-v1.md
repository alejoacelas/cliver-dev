# m16-spycloud-breach — Bypass-Aware Hardening v1

- **measure:** M16 (mfa-stepup)
- **idea:** SpyCloud / Constella breach-credential check + HIBP Pwned Passwords

---

## Attacker Story Walk

### 1. account-hijack

**Summary:** Attacker compromises a PI's email, takes over the PI's verified synthesis provider account.

**Bypass methods relevant to this measure:**

- **Method 1: MFA reset via email recovery.**
  - **Classification: CAUGHT (conditional)** — if the PI's credentials were in a breach/infostealer corpus that SpyCloud or Constella ingested, the at-login check (or weekly sweep) would have already forced a password reset before the attacker acts. However, if the email was compromised through a *new* phishing attack or a breach not yet in any vendor's corpus, the check provides no signal. The implementation correctly notes that AitM-phished credentials used immediately are not in any breach dataset.

- **Method 2: Session hijack via stolen cookies + anti-detect browser.**
  - **Classification: MISSED** — session hijack does not involve presenting credentials to the provider. The breach check fires at login; a cookie replay bypasses login entirely. No credential is submitted, so no breach check occurs.

- **Method 3: Infostealer-exfiltrated TOTP seed.**
  - **Classification: CAUGHT (partial)** — SpyCloud specifically tracks infostealer families and often captures TOTP seeds alongside credentials. If the target's infostealer log is in SpyCloud's corpus, the `infostealer_machine_hit` flag fires, which escalates to institutional IT. However, coverage is probabilistic: SpyCloud claims to ingest logs within 48 hours of marketplace posting, but not all marketplace logs are captured. The implementation acknowledges SpyCloud "often" captures TOTP seeds alongside credentials but does not quantify coverage.

- **Method 4: Real-time AitM phishing relay.**
  - **Classification: MISSED** — the implementation explicitly states: "NOT addressed — credentials harvested by Tycoon 2FA and used immediately are not yet in any breach dataset." The credential is fresh; no breach corpus contains it.

- **Methods 5-9 (FIDO downgrade, SIM-jacking, social engineering, cloud passkey injection, grace period):**
  - **Classification: MISSED** — none of these methods involve breached credentials. They attack the authentication mechanism itself, not the credential.

**Net assessment:** The check is *pre-emptive*: it identifies compromised credentials *before* the attacker uses them, but only when the credentials are in a breach/infostealer corpus the vendor has already ingested. For the account-hijack branch, this means the check helps when the PI's credentials were in an older breach or an infostealer log sold on a marketplace SpyCloud monitors. It does not help for fresh AitM attacks, session hijack, or MFA-level attacks.

---

### 2. credential-compromise

**Summary:** Attacker compromises faculty/staff credentials via breach databases or AitM phishing.

**Bypass methods relevant to this measure:**

- **Infostealer-sourced credentials (marketplace purchase).**
  - **Classification: CAUGHT** — this is the primary target. The branch's cost floor is "$5 for an infostealer log" from a marketplace. SpyCloud's entire value proposition is ingesting these same marketplace logs and surfacing them to defenders. If the log is in SpyCloud's corpus, the breach check fires before the attacker can use the credential. The implementation correctly identifies this as the direct-address case.
  - **Uncertainty:** timing. SpyCloud reports credentials within [48 hours of marketplace posting](https://securityboulevard.com/2026/04/48-hours-the-window-between-infostealer-infection-and-dark-web-sale/). If the attacker buys and uses the log within this window, the check may not yet have the data.

- **Credential stuffing.**
  - **Classification: CAUGHT** — credentials reused across services that appeared in prior breaches are the classic HIBP/SpyCloud use case.

- **AitM phishing (Tycoon 2FA / EvilProxy).**
  - **Classification: MISSED** — same reasoning as account-hijack Method 4. Freshly phished credentials are not in any corpus.

- **Account takeover via password reset + email.**
  - **Classification: MISSED** — the attacker resets the password to a new value not in any breach corpus. The old credential may have triggered a breach hit, but if the attacker has already reset the password, the old credential is no longer the one in use. The implementation does not address the race condition: attacker resets password *after* the breach check fires but *before* the forced reset takes effect.

**Net assessment:** Strong against the branch's cheapest path (marketplace infostealer logs) subject to a timing window. Weak against AitM phishing and post-reset scenarios.

---

### 3. dormant-account-takeover

**Summary:** IT admin takes over a dormant provider account.

**Bypass methods relevant to this measure:**

- **Bypass A — Email-channel MFA recovery.**
  - **Classification: CAUGHT (weak)** — only if the dormant account's original password is in a breach corpus. The IT admin does not need the original password (they control the mailbox and can reset it), but the breach check's weekly sweep might flag the account's *email* as appearing in a breach, triggering an `breach_email_hit` soft warning. This is a weak signal — email-only hits produce warnings, not blocks.

- **Bypass B-D (social engineering, IdP impersonation, MFA policy relaxation).**
  - **Classification: MISSED** — none involve breached credentials at the provider. The IT admin uses legitimate institutional tooling.

**Net assessment:** Minimal value against this branch. The implementation correctly notes "weakly addressed — only catches if the dormant account's password is in a breach corpus."

---

## Findings

### Finding 1 — Moderate: 48-hour ingest window creates a race condition

- **Source:** credential-compromise (infostealer-sourced credentials).
- **Why missed:** The implementation notes that SpyCloud ingests logs within 48 hours of marketplace posting. The credential-compromise branch notes that "48 hours is the window between infostealer infection and dark-web sale." This means there's a potential window of 48-96 hours between infection and the breach check surfacing the credential. An attacker who moves quickly (same-day purchase and use) may act before the check fires.
- **Suggestion:** Complement the breach-credential check with at-login behavioral signals (new device fingerprint, geographic anomaly, unusual login time) that don't depend on breach corpus freshness. These are not this idea's scope but the timing gap is worth flagging for the idea family.

### Finding 2 — Moderate: Password reset after breach detection creates a gap

- **Source:** credential-compromise (account takeover via password reset + email).
- **Why missed:** Consider the sequence: (1) SpyCloud flags the credential; (2) provider queues a forced reset for next login; (3) attacker beats the user to the next login, resets the password via email, enrolls a new TOTP. The forced reset was for the *old* password, which is no longer in use. The new password is clean. The implementation's SOP checks at-login and via weekly sweeps but does not address this race.
- **Suggestion:** When a breach hit is detected (especially an infostealer-machine hit), force an *immediate* session revocation and account lock rather than waiting for the next login. This is mentioned in the SOP for email+password hits ("block the session immediately") but the weekly-sweep path only forces reset "on next login," creating the window.

### Finding 3 — Minor: Privacy/legal risk of sending password hashes to SpyCloud/Constella

- **Source:** General.
- **Why missed:** The implementation notes this under failure_modes_requiring_review ("sending plaintext or hashed customer passwords to a third party may be restricted"). The HIBP k-anonymity model is privacy-preserving; the SpyCloud/Constella comparison is not. For a synthesis provider handling credentials of university researchers — some of whom may be subject to GDPR or institutional data-sharing policies — this could create legal friction.
- **Suggestion:** Clarify the data-flow architecture: does the provider send the password hash to SpyCloud, or does SpyCloud push breach records to the provider for local comparison? The latter is more privacy-preserving. SpyCloud's "Automated Remediation" product suggests the latter model but the implementation doesn't specify which.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| MFA reset via email recovery (pre-existing breach) | account-hijack | CAUGHT (conditional on corpus coverage) |
| Session hijack via stolen cookies | account-hijack | MISSED (no login event) |
| Infostealer-exfiltrated TOTP seed | account-hijack | CAUGHT (partial — corpus coverage) |
| AitM phishing relay | account-hijack | MISSED (fresh credentials) |
| FIDO downgrade, SIM-jacking, social engineering, cloud passkey, grace period | account-hijack | MISSED (not credential-based) |
| Infostealer-sourced credentials (marketplace) | credential-compromise | CAUGHT (subject to timing window) |
| Credential stuffing | credential-compromise | CAUGHT |
| AitM phishing | credential-compromise | MISSED (fresh credentials) |
| Account takeover via password reset | credential-compromise | MISSED (race condition) |
| Email-channel MFA recovery | dormant-account-takeover | CAUGHT (weak — email-only hit) |
| Social engineering, IdP impersonation, MFA relaxation | dormant-account-takeover | MISSED |

## bypass_methods_uncovered

- AitM phishing relay: structurally missed — fresh credentials are never in a breach corpus at time of use.
- Session hijack: missed — no login event triggers the check.
- Post-reset race condition: attacker can beat the forced-reset queue.
- All non-credential MFA bypasses: out of scope for a credential-check idea.

---

## Verdict

**PASS** — no Critical findings. The two Moderate findings (timing window, password-reset race) are real gaps but narrow and partially addressed by complementary controls (at-login checks, session revocation for email+password hits). The idea's value proposition — pre-emptively flagging compromised credentials from marketplace infostealer logs — is sound within its scope. Pipeline continues to stage 6.
