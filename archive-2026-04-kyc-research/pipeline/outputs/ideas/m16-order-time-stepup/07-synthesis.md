# m16-order-time-stepup — Per-Idea Synthesis

## Section 1: Filled-in Schema

| Field | Value |
|---|---|
| **name** | Order-time `max_age=0` step-up authentication |
| **measure** | M16 (mfa-stepup) |
| **modes** | D, A |
| **attacker_stories_addressed** | session-hijack (account-hijack Method 2), grace-period exploit (account-hijack Method 9). Partial contribution to credential-compromise and dormant-account-takeover branches when combined with sibling ideas (m16-webauthn-yubikey, m16-no-sms-no-email-reset). |
| **summary** | At SOC order submission, the application redirects the user through the IdP with `max_age=0` (or `prompt=login`) and a high `acr_values` requirement, forcing a fresh credential + MFA presentation. The order is bound to the returned `auth_time` claim. An existing session — however recent — is insufficient. This closes session-hijack and grace-period bypasses but does not prevent attacks where the adversary possesses valid credentials and a valid factor. |
| **external_dependencies** | OIDC-compliant IdP (Okta, Auth0, Azure AD, Keycloak, Ping); application code to intercept SOC orders and trigger re-auth redirect; existing MFA factor (see m16-webauthn-yubikey). |
| **endpoint_details** | **OIDC parameter:** `max_age=0` on the authorize request forces fresh login (Auth0 docs, OIDC Core §3.1.2.1). **Step-up via ACR:** Okta supports `acr_values=urn:okta:loa:2fa:any` and phishing-resistant values; Auth0 exposes `event.transaction.acr_values` in Actions. **Auth model / pricing:** included in standard IdP MFA-tier pricing; no incremental per-call cost. **Rate limits:** [unknown — searched for: "Okta /oauth2/authorize rate limit", "Auth0 authorization endpoint rate limit max_age".] |
| **fields_returned** | `sub` (user ID), `auth_time` (timestamp of most recent auth event — load-bearing), `acr` (assurance level achieved), `amr` (methods used, e.g. `["pwd","hwk"]`), `nonce` (replay protection), `iat`, `exp`. |
| **marginal_cost_per_check** | $0 incremental per SOC order (IdP charges per MAU, not per re-auth). **Setup cost:** [best guess: 1–2 engineer-weeks for a team already running OIDC.] |
| **manual_review_handoff** | 6-step SOP: (1) user submits SOC order; (2) app redirects to IdP with `max_age=0` + required `acr_values`; (3) IdP prompts full auth; (4) on success, order proceeds with `auth_time`/`acr`/`amr` recorded; (5) on failure after 3 attempts, account locked and `stepup_failed` flag sent to review queue; (6) reviewer checks IdP audit log — confused-user pattern triggers call, attacker pattern triggers evidence preservation and OOB notification to legitimate account holder. |
| **flags_thrown** | `stepup_failed` (3+ failed re-auths → lock + review); `stepup_factor_downgraded` (lower `acr` than required → order held, reviewer decides); `stepup_geolocation_anomaly` (IP anomaly on fresh auth → soft hold); `stepup_session_age_violation` (`auth_time` older than expected → reject, page security). |
| **failure_modes_requiring_review** | IdP returns token without `auth_time` (reject + alert engineering); `max_age=0` honored as `prompt=login` by some IdPs (Keycloak #33641, Hydra #3034 — validate per IdP at integration); mobile-app sessions where re-auth is jarring; federated logins where upstream IdP ignores `max_age=0`; hardware token not present when roaming. |
| **false_positive_qualitative** | (1) Bench scientists in lab gloves who cannot insert hardware token at order time (UX friction); (2) customers placing many small SOC-adjacent orders in one session (re-auth fatigue; mitigated by 5-min batching window); (3) group/shared accounts where the authenticated person is not the order requester (coverage gap, not classic false positive); (4) programmatic/API orders that bypass the redirect entirely (structural no-signal); (5) federated SSO with upstream caching producing false sense of coverage. |
| **coverage_gaps** | (1) **Programmatic/API orders** — LIMS-to-provider integrations bypass the browser redirect; [best guess: 10–30% of order volume at scale providers]; no-signal. (2) **IdPs not honoring max_age=0** — self-hosted/older IdPs (Keycloak, Hydra bugs); [best guess: 5–15% of enterprise customers on non-major IdPs, subset misbehaves]; weak-signal. (3) **Shared/group accounts** — core facilities with single procurement account; [best guess: 5–15% of accounts, higher share of volume]; weak-signal. (4) **International federated SSO** — ~45% of market is international; national federations (eduGAIN, InCommon) may not forward `max_age`; [best guess: 15–25% of customers are international academics on federation]; weak to no-signal. (5) **Mobile/embedded WebView orders** — [best guess: <5% of orders]; false-positive via UX friction. |
| **record_left** | Per-order record with `auth_time`, `acr`, `amr`, IdP session ID, JWT digest. IdP audit log entry for the re-auth event. Cross-link: order ID ↔ IdP authentication event ID, queryable both directions. Demonstrates per-order (not per-session) MFA to a regulator. |
| **bypass_methods_known** | Session hijack via stolen cookies (CAUGHT); grace-period exploit (CAUGHT). |
| **bypass_methods_uncovered** | MFA reset via email recovery (attacker re-enrolls, passes fresh auth); infostealer-exfiltrated TOTP seed (valid seed passes fresh auth); AitM phishing relay (real-time relay completes fresh auth); FIDO2 downgrade attack (reviewer judgment, not auto-block — Moderate finding); SIM-jacking/SS7 (if SMS still a factor); social engineering provider support; cloud passkey injection (injected passkey passes fresh auth); attacker-enrolled TOTP after password reset; email-channel MFA recovery on dormant accounts; IdP impersonation (ambiguous); IdP MFA policy relaxation (ambiguous). |

---

## Section 2: Narrative

### What this check is and how it works

Order-time step-up authentication uses the OIDC `max_age=0` parameter to force a fresh login whenever a customer submits a sequence-of-concern (SOC) order. Rather than trusting the customer's existing session — which may be minutes or hours old — the provider's order endpoint redirects the user back through the identity provider (Okta, Auth0, Azure AD, etc.) with `max_age=0` and a required authentication assurance level (`acr_values`). The IdP prompts for full credentials and MFA. On success, the returned ID token carries an `auth_time` claim that the application validates against the order submission timestamp. The order record permanently stores this binding. The mechanism is a standard OIDC feature supported by all major commercial IdPs at no incremental per-call cost.

### What it catches

This check directly addresses two bypass methods from the account-hijack attacker story. First, session hijack via stolen cookies (Method 2): an attacker who replays a stolen session cookie to an anti-detect browser cannot submit a SOC order because `max_age=0` demands a fresh credential + MFA presentation the cookie alone cannot satisfy. Second, grace-period exploitation (Method 9): even if the attacker has a very recent session, the grace period is eliminated at order time — every SOC order requires its own fresh authentication event. The check also produces a strong audit trail: each order is bound to a specific, timestamped authentication event with recorded assurance level and methods, which is demonstrable to regulators on a per-order basis.

### What it misses

The check's fundamental limitation is that it verifies authentication *freshness*, not factor *legitimacy*. Any attacker who possesses valid credentials and a valid MFA factor can pass the fresh authentication. This means infostealer-exfiltrated TOTP seeds, attacker-enrolled TOTP after email-channel password reset, SIM-jacked SMS codes, injected cloud passkeys, and real-time AitM phishing relays all defeat the step-up. The implementation explicitly defers factor-strength questions to sibling ideas (m16-webauthn-yubikey for hardware-only factors, m16-no-sms-no-email-reset for blocking weak recovery channels). Stage 5 also identified a Moderate process gap: the `stepup_factor_downgraded` flag routes to reviewer judgment rather than automatic rejection, meaning a well-crafted FIDO downgrade attack could be approved by an inattentive reviewer. Stage 6 found five coverage gaps, the most operationally significant being programmatic/API-submitted orders (estimated 10–30% of volume at scale providers), which bypass the browser redirect entirely and produce no signal.

### What it costs

Marginal cost per SOC order is $0 — IdPs charge per monthly active user, not per re-authentication call. The cost is in user friction (a full re-auth flow at order time) and in engineering setup, estimated at 1–2 engineer-weeks for a team already running OIDC. The batching-window mitigation (a single re-auth covers a 5-minute ordering window) reduces friction for customers placing multiple orders but introduces a mini grace period.

### Operational realism

When a step-up fails, the system locks the account after three attempts and routes a `stepup_failed` flag to the review queue. The reviewer's playbook is to check the IdP audit log: a pattern of correct-username-wrong-code suggests a confused customer (call them); a pattern of geographic anomaly, new device fingerprint, or multiple usernames suggests an attacker (preserve evidence, notify the legitimate account owner out-of-band). For `stepup_factor_downgraded` flags, the reviewer currently decides whether the downgrade is legitimate — stage 5 recommends changing this to automatic rejection for SOC orders. The audit artifact is the per-order auth binding (auth_time + acr + amr + IdP session ID + JWT digest), cross-linked to the IdP audit log by authentication event ID. This is queryable in both directions and constitutes the paper trail for regulatory compliance.

### Open questions

The `auth_time` validation window (how many seconds between fresh auth and order submission are acceptable) is not specified; tighter is more secure but worse for UX. The batching window creates a mini grace period that partially re-opens the Method 9 bypass. Federation-layer compliance with `max_age=0` is institution-by-institution and cannot be validated without end-to-end integration testing per customer IdP. No published data exists on what fraction of synthesis orders are API-submitted, making the size of the largest coverage gap uncertain.

---

## Section 3: Open Issues for Human Review

- **Moderate finding (stage 5):** `stepup_factor_downgraded` routes to reviewer judgment rather than automatic block for SOC orders. A well-crafted FIDO downgrade could be approved. Recommend changing to automatic rejection with escalation path for overrides.
- **[unknown — searched for: "Okta /oauth2/authorize rate limit", "Auth0 authorization endpoint rate limit max_age"]:** IdP rate limits on the authorize endpoint are not documented. Unlikely to be an issue for human-paced re-auth but relevant if the batching window drives burst traffic.
- **[unknown — searched for: "synthesis order API automated LIMS integration programmatic ordering percentage"]:** Fraction of orders submitted via API/LIMS integration is unknown. This is the largest coverage gap and its size directly affects the check's overall value.
- **[unknown — searched for: "eduGAIN max_age OIDC compliance", "SAML force authn federation"]:** Upstream IdP compliance with `max_age=0` in federated SSO environments is unknown and institution-dependent.
- **[unknown — searched for: "shared lab accounts group ordering science procurement"]:** Prevalence of shared/group accounts at synthesis providers is unknown.
- **[best guess] setup cost (1–2 engineer-weeks):** Not validated against actual provider engineering teams.
- **Stage 6 form-check flag:** Coverage gap 1 search effort characterized as thin (only 2 queries, neither targeting synthesis-provider API ordering specifically). The [unknown] is honest but the gap size estimate (10–30%) rests on general impressions, not data.
- **Stage 6 form-check flag:** Gap 4 market-share citations point to report landing pages, not specific data points. The 55% North America figure should be attributed to a specific report edition/year.
