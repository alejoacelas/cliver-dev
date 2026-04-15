# Measure 16 — mfa-stepup: Per-Measure Synthesis

## 1. Side-by-side comparison of selected ideas

| Field | m16-auth0-okta | m16-order-time-stepup | m16-no-sms-no-email-reset | m16-dormancy-reidv |
|---|---|---|---|---|
| **Name** | Hosted IdP MFA + step-up | Order-time `max_age=0` step-up | No-SMS, no-email-reset SOP | Dormancy re-IDV trigger |
| **Layer** | Infrastructure (auth engine) | Order-time (per-SOC gate) | Recovery (factor lifecycle) | Account lifecycle (dormant accounts) |
| **Attacker branches** | account-hijack, credential-compromise, dormant-account-takeover | account-hijack (session hijack, grace period) | account-hijack (email reset, SIM-jack, support SE), credential-compromise (email reset), dormant-account-takeover (email recovery, support SE) | dormant-account-takeover (all sub-methods on dormant accounts) |
| **Marginal cost/check** | ~$0 (passkey/TOTP) | $0 | $0 config; $5-15/recovery event | ~$1.50-3.00/re-IDV event |
| **Setup cost** | 4-8 engineer-weeks | 1-2 engineer-weeks | 2-6 engineer-weeks + PM/support | 1-3 engineer-weeks |
| **Bypass methods caught** | 8 of 12 (passkey-only + IDV recovery) | 2 of 12 (session hijack, grace period) | 6 of 14 (email reset, SIM-jack, SMS downgrade, TOTP re-enrollment, password reset, support SE partial) | All MFA bypasses on dormant accounts (factor-agnostic); 0 on active accounts |
| **Key coverage gaps** | Unenrolled passkey customers (30-60% at rollout); shared-device labs (5-15%); synced passkey injection | Programmatic/API orders (10-30%); federated SSO `max_age` non-compliance (15-25%) | Lost-device recovery friction (5-10%/yr); help-desk SE (2-5% success rate) | Active accounts (by design); selfie aging (5+ years); session-restoration ambiguity |
| **Primary residual risk** | Cloud passkey injection; support SE | All factor-legitimacy attacks | Help-desk SE bypassing SOP | Active-account compromise |
| **Flags thrown** | `mfa_not_enrolled`, `mfa_failed`, `mfa_factor_too_weak`, `mfa_recent_enroll`, `mfa_high_risk_signal` | `stepup_failed`, `stepup_factor_downgraded`, `stepup_geolocation_anomaly`, `stepup_session_age_violation` | `policy_sms_used`, `reset_email_only_used`, `recovery_video_call_required`, `recovery_completed_with_idv` | `dormancy_reidv_required`, `dormancy_reidv_selfie_mismatch`, `dormancy_reidv_document_fail`, `dormancy_reidv_name_change` |

---

## 2. Coverage gap cross-cut

### Structural gaps (inherent to the design; cannot be closed by configuration)

| Gap | Source idea(s) | Nature | Size estimate |
|---|---|---|---|
| **Programmatic/API orders bypass browser redirect** | m16-order-time-stepup | Orders submitted via LIMS integrations never hit the OIDC redirect. No signal produced. | 10-30% of order volume at scale providers `[best guess]` |
| **Federated SSO `max_age=0` non-compliance** | m16-order-time-stepup, m16-auth0-okta | Upstream institutional IdPs (eduGAIN, InCommon) may ignore `max_age=0` or not forward it. Provider cannot enforce per-order re-auth for federated users without provider-side passkey. | 15-25% of customers `[best guess]` |
| **Active accounts invisible to dormancy check** | m16-dormancy-reidv | By design, the dormancy timer only fires at >180 days idle. All active-account attacks route through other ideas. | 95%+ of accounts are active |
| **Cloud account compromise enables synced passkey injection** | m16-auth0-okta | Attacker who compromises iCloud/Google account can inject a passkey into the sync group. Provider sees a valid WebAuthn assertion with no distinguishing signal. No idea in the stack addresses this. | Unknown prevalence; Moderate severity |
| **Shared/group accounts** | m16-order-time-stepup | Core facilities with single procurement account; the authenticated person may not be the order requester. | 5-15% of accounts `[best guess]` |

### Complementary gaps (addressable by tuning, policy, or cross-idea composition)

| Gap | Source idea(s) | Mitigation path | Status |
|---|---|---|---|
| **Unenrolled passkey customers at rollout** | m16-auth0-okta | Phased enforcement: TOTP grace period with enrollment nudges before passkey-only cutover. | Noted in composition; needs rollout plan |
| **Lost-device recovery friction** | m16-no-sms-no-email-reset | Video-call recovery SOP; IDV-mediated re-enrollment. 5-10x slower than email reset. | SOP specified; cost accepted |
| **Help-desk social engineering** | m16-no-sms-no-email-reset, m16-auth0-okta | Dual-agent sign-off for non-IDV recoveries; weekly audit-log review. | Recommended but not yet mandated |
| **`stepup_factor_downgraded` routes to reviewer judgment** | m16-order-time-stepup | Change to automatic rejection for SOC orders with escalation path. | Moderate finding; recommended |
| **Cooling-off scope too narrow** | m16-no-sms-no-email-reset | Extend 24h block to all account modifications (address, payment, contact), not just SOC orders. | Minor finding; recommended |
| **Institutional security contact as single point of failure** | m16-no-sms-no-email-reset | Multi-channel notification (security contact + department chair + personal email). | Minor finding; recommended |
| **Selfie aging for long-dormant accounts** | m16-dormancy-reidv | Periodic re-IDV for active accounts on 2-3 year cycle to keep stored selfie fresh. | Open question |
| **Batching window re-opens mini grace period** | m16-order-time-stepup | Tune 5-min window; accept as bounded risk. | Open question |

---

## 3. Bypass methods uncovered: which attacker stories survive the full stack

The attacker mapping enumerates bypass methods across three branches (account-hijack, credential-compromise, dormant-account-takeover). Below is the status of each after all four selected ideas are applied.

### Account-hijack branch (9 methods)

| # | Bypass method | Stack verdict | Surviving? | Notes |
|---|---|---|---|---|
| 1 | MFA reset via email recovery | **CAUGHT** | No | m16-no-sms-no-email-reset blocks email-only reset; m16-auth0-okta requires IDV for recovery |
| 2 | Session hijack via stolen cookies + anti-detect browser | **CAUGHT** | No | m16-order-time-stepup forces fresh auth (`max_age=0`); m16-auth0-okta adaptive risk provides partial detection |
| 3 | Infostealer-exfiltrated TOTP seed | **CAUGHT** | No | m16-auth0-okta passkey-only policy makes TOTP seeds useless for SOC step-up |
| 4 | Real-time AitM phishing relay | **CAUGHT** | No | m16-auth0-okta FIDO2 origin-binding defeats relay |
| 5 | FIDO2 downgrade attack | **CAUGHT** | No | m16-auth0-okta passkey-only enforcement blocks fallback; m16-no-sms-no-email-reset removes SMS target |
| 6 | SIM-jacking / SS7 interception | **CAUGHT** | No | m16-no-sms-no-email-reset disables SMS as a factor; m16-auth0-okta passkey-only policy |
| 7 | Social engineering provider support | **PARTIALLY CAUGHT** | **Yes (residual)** | m16-no-sms-no-email-reset SOP mandates video call + IDV; m16-auth0-okta IDV playbook. But: no preventive dual-authorization; voice cloning + institutional authority can fool a single agent. Weekly audit catches violations retrospectively. |
| 8 | Cloud account compromise + synced passkey injection | **MISSED** | **Yes** | No idea in the stack distinguishes synced from hardware-bound passkeys. Attacker with iCloud/Google access injects a valid passkey. Provider sees a legitimate WebAuthn assertion. |
| 9 | Grace-period exploit | **CAUGHT** | No | m16-order-time-stepup eliminates grace period at order time |

### Credential-compromise branch (3 methods)

| # | Bypass method | Stack verdict | Surviving? | Notes |
|---|---|---|---|---|
| 1 | Attacker enrolls own TOTP after reset | **CAUGHT** | No | m16-no-sms-no-email-reset blocks email-only reset; reset requires IDV |
| 2 | Infostealer-sourced TOTP seed | **CAUGHT** | No | m16-auth0-okta passkey-only policy |
| 3 | Passkey/FIDO2 enforcement (uncertainty branch) | **CAUGHT** | No | m16-auth0-okta enforces passkey; this branch notes it would not be feasible |

### Dormant-account-takeover branch (4 methods)

| # | Bypass method | Stack verdict | Surviving? | Notes |
|---|---|---|---|---|
| A | Email-channel MFA recovery | **CAUGHT** | No | m16-dormancy-reidv selfie mismatch catches different person; m16-no-sms-no-email-reset blocks email-only recovery |
| B | Social engineering provider support | **PARTIALLY CAUGHT** | **Yes (residual)** | m16-dormancy-reidv flag persists + institutional directory check. But same single-agent SE vulnerability as account-hijack Method 7. |
| C | IdP impersonation (federated login) | **CAUGHT** | No | m16-auth0-okta requires provider-side passkey; m16-dormancy-reidv fires regardless of upstream auth |
| D | IdP MFA policy relaxation | **CAUGHT** | No | m16-auth0-okta provider-side passkey independent of upstream policy; m16-dormancy-reidv is factor-agnostic |

### Summary: surviving bypass methods

Two distinct bypass paths survive the entire selected stack:

1. **Cloud account compromise + synced passkey injection** (account-hijack Method 8). Severity: Moderate. The attacker compromises the customer's Apple iCloud or Google account, adds a device to the passkey sync group, and receives the passkey. The provider sees a valid WebAuthn assertion indistinguishable from the legitimate user. No idea in the stack addresses this. Mitigation requires a policy decision: mandate hardware-bound passkeys (high friction) or accept the risk with compensating controls (e.g., IDV on new-device passkey use).

2. **Social engineering provider support** (account-hijack Method 7, dormant-account-takeover Bypass B). Severity: Moderate. The SOP mandates video call + IDV and the dormancy flag persists, but the detective control (weekly audit) is retrospective. A sufficiently skilled attacker with voice cloning and institutional authority can potentially fool a single help-desk agent. Mitigation: mandatory dual-agent sign-off for any recovery not producing a `recovery_completed_with_idv` event.

---

## 4. Structural gaps flagged as open issues

### Open issue 1: Programmatic/API ordering gap
- **Source:** m16-order-time-stepup coverage gap 1
- **Problem:** Orders submitted via LIMS-to-provider API integrations bypass the browser-based OIDC redirect entirely. The `max_age=0` step-up produces no signal for these orders. Estimated at 10-30% of volume at scale providers, but the actual fraction is unknown.
- **Downstream requirement:** The product spec must define a parallel authentication mechanism for API-submitted SOC orders, likely OAuth client-credentials with per-request signing or mutual TLS with certificate-bound access tokens.

### Open issue 2: Cloud passkey injection via compromised sync account
- **Source:** m16-auth0-okta bypass method 8
- **Problem:** Synced passkeys (iCloud Keychain, Google Password Manager) can be injected by an attacker who compromises the customer's cloud account. The provider cannot distinguish a synced passkey from a hardware-bound one. No idea in the stack addresses this.
- **Downstream requirement:** Policy decision needed. Options: (a) mandate hardware-bound passkeys via AAGUID allowlist (highest security, highest friction — was the rationale for m16-webauthn-yubikey, which was dropped); (b) accept synced passkeys with compensating IDV control on new-device passkey use; (c) document as accepted risk.

### Open issue 3: Federated SSO compliance with provider-side controls
- **Source:** m16-order-time-stepup coverage gap 4, m16-auth0-okta failure mode
- **Problem:** 15-25% of customers (international academics on institutional SSO) authenticate through upstream IdPs that may not honor `max_age=0` or forward `amr` claims. Provider-side passkey enforcement on top of federation creates double-authentication friction.
- **Downstream requirement:** The product spec must specify whether federated customers get a provider-side passkey requirement independent of their institutional IdP, and how `max_age=0` is validated end-to-end for each federation partner.

### Open issue 4: Help-desk social engineering — no preventive control
- **Source:** m16-no-sms-no-email-reset Moderate finding, m16-auth0-okta Moderate finding M2
- **Problem:** The recovery SOP mandates video call + IDV, but the only control against agent deviation is a weekly retrospective audit-log review. Voice cloning ($22/month) and institutional authority create plausible impersonation scenarios.
- **Downstream requirement:** Dual-agent sign-off for any factor reset that does not produce a passing IDV inquiry. Callback verification to institutional security contact before completing recovery.

### Open issue 5: Passkey enrollment ramp at rollout
- **Source:** m16-auth0-okta coverage gap 1
- **Problem:** 30-60% of customers may lack passkeys at rollout (FIDO Alliance 2025: ~55-60% mobile enrollment, ~20% desktop). Hard passkey-only enforcement at launch would lock out a significant fraction of the customer base.
- **Downstream requirement:** Phased enforcement plan with TOTP grace period, enrollment nudges, and hard cutover date. The grace period temporarily re-opens TOTP-based bypass methods (infostealer seeds, AitM relay of TOTP).

### Open issue 6: Shared/group procurement accounts
- **Source:** m16-order-time-stepup coverage gap 3
- **Problem:** Core facilities with a single procurement account authenticate one person, but the actual order requester may be someone else. MFA step-up verifies the authenticated user, not the end requester.
- **Downstream requirement:** Policy decision on whether shared accounts are permitted for SOC orders. If yes, define a per-order requester attestation mechanism. If no, define the account migration path for core facilities.

### Open issue 7: Dormancy timer interaction with federated SSO and session restoration
- **Source:** m16-dormancy-reidv Minor findings
- **Problem:** Whether a federated SSO assertion or a restored session cookie counts as a "login" that resets or triggers the dormancy check is unspecified.
- **Downstream requirement:** Specify that dormancy is measured against authentication events at the provider's relying-party layer, not session continuity or upstream IdP timestamps.
