# m16-auth0-okta — Implementation v1

- **measure:** M16 — mfa-stepup
- **name:** Hosted IdP MFA + step-up (Auth0 / Okta CIC / AWS Cognito)
- **modes:** D
- **summary:** Outsource MFA enrollment, factor lifecycle, adaptive risk, and step-up authentication to a hosted Customer Identity Cloud. The synthesis provider's order pipeline calls a step-up endpoint when sequence screening flags an SOC; the IdP forces a fresh authentication with a phishing-resistant factor (FIDO2/WebAuthn passkey) before the order proceeds. Centralizes MFA policy and audit logs across the provider's customer base.

## external_dependencies

- One of:
  - [Auth0 / Okta Customer Identity Cloud](https://auth0.com/) — formerly Auth0, now part of Okta.
  - [Okta Workforce Identity Cloud](https://www.okta.com/pricing/) — primarily for employee identity but used by some B2B providers.
  - [AWS Cognito](https://aws.amazon.com/cognito/) — managed user directory inside AWS.
- Provider's customer portal (web/mobile app) that integrates the IdP via OIDC.
- Order-pipeline hook that triggers the step-up flow on SOC detection.
- Reviewer queue for lockout / failure cases.

## endpoint_details

### Auth0 / Okta Customer Identity Cloud

- **API base:** `https://{tenant}.auth0.com/` (Authentication API + Management API).
- **Auth model:** OIDC for end users; Management API uses M2M client credentials.
- **Step-up:** Auth0 Actions framework can require a fresh MFA challenge when a transaction is flagged ([Adaptive MFA docs](https://auth0.com/docs/secure/multi-factor-authentication/adaptive-mfa)). FIDO2/WebAuthn (passkeys) is a supported factor; Auth0 Actions can require it specifically.
- **Rate limits:** Tenant-tier dependent; Authentication API limits start at 50 req/sec on production tenants `[best guess based on Auth0 published rate-limit policy — varies by plan]`.
- **Pricing:** Auth0 B2C plans start at ~$35/month essentials, ~$240/month professional; B2B plans ~$150/month essentials, ~$800/month professional ([Auth0 pricing changes](https://auth0.com/blog/upcoming-pricing-changes-for-the-customer-identity-cloud/)). Adaptive MFA and FIDO2/WebAuthn typically require Professional or Enterprise tier `[vendor-gated — exact tier for FIDO2 enforcement requires checking the current pricing matrix; sales contact for enterprise discounts at scale]`.
- **ToS:** Standard SaaS DPA; customer PII processed under Auth0/Okta privacy terms.

### Okta Workforce Identity Cloud

- **API base:** `https://{org}.okta.com/api/v1/`.
- **Auth model:** OAuth + admin API token.
- **Step-up:** Okta Verify and FIDO2/WebAuthn factors via authentication policies that key off transaction risk.
- **Pricing:** `[vendor-gated — Okta lists "starting from $2/user/month" for SSO; MFA add-on is separate; full pricing requires sales contact](https://www.okta.com/pricing/)`.

### AWS Cognito

- **API base:** AWS region endpoint.
- **Auth model:** AWS SigV4 + OIDC for end users.
- **Step-up:** Native passkey/FIDO2 support added Nov 2024 ([aws-samples/amazon-cognito-passwordless-auth](https://github.com/aws-samples/amazon-cognito-passwordless-auth)). Step-up via custom auth challenge flows.
- **Pricing:** Three-tier model effective Dec 2024 (Lite / Essentials / Plus). TOTP MFA free; SMS via SNS at $0.00645–$0.039/message ([cost guide](https://costgoat.com/pricing/amazon-cognito)). Passkey MFA: no per-auth charge.
- **ToS:** AWS standard.

## fields_returned

From the IdP after a successful step-up:

- `sub` (user id)
- `auth_time` (timestamp of the most recent strong factor verification)
- `acr` / `amr` (authentication context class / methods — e.g. `urn:okta:loa:2fa:any` or `mfa`, `webauthn`)
- `mfa_factor_used` (passkey, totp, sms, push)
- `device_id` / `device_fingerprint` (where adaptive risk supplies it)
- `risk_score` (when adaptive MFA is enabled)
- `session_id`

The provider's order pipeline checks `auth_time` is within the last N minutes (e.g. 5) AND `mfa_factor_used` is in the allowed set (e.g. webauthn only for SOC orders).

## marginal_cost_per_check

- Per SOC order step-up: ~$0 marginal on Auth0/Okta/Cognito if using passkey/TOTP. SMS-based step-up adds $0.01–$0.04 per attempt (Cognito via SNS).
- Per-user platform fee: depends on MAU.
- **setup_cost:** 4–8 engineer-weeks for OIDC integration, Auth0 Actions / Cognito custom auth challenge wiring, FIDO2 enrollment UX, and the order-pipeline step-up hook.

## manual_review_handoff

1. Sequence screening flags an SOC on an order in flight.
2. Order pipeline calls IdP step-up: returns customer to the IdP-hosted login with `acr_values=urn:okta:loa:2fa:any` (Auth0) or equivalent.
3. Customer must complete a phishing-resistant factor (passkey) within N minutes.
4. On success → continue order processing with `auth_time` and `amr` recorded.
5. On failure (3 attempts) or no passkey enrolled → flag `mfa_failed` or `mfa_not_enrolled`, route to reviewer.
6. Reviewer determines whether to:
   - Initiate IdP-side passkey enrollment with the customer (out-of-band — e.g. video call confirming identity, then sending an enrollment link).
   - Hold the order pending re-enrollment.
   - Deny if the customer cannot complete enrollment.
7. Lockouts after repeated failures route to support, who follow a documented playbook (verify identity via the existing IDV vendor — see m14-stripe-identity — before any reset).

## flags_thrown

- `mfa_not_enrolled` — account has no FIDO2/WebAuthn factor on file at the time of an SOC order.
- `mfa_failed` — repeated failures during step-up.
- `mfa_factor_too_weak` — step-up succeeded but with SMS/TOTP only, not passkey, on a high-risk SOC.
- `mfa_recent_enroll` — passkey was enrolled <48h before the SOC order (catches the 0ktapus-style "social-engineer reset then immediately order" pattern) `[best guess: 48h is a reasonable cooling period; needs tuning]`.
- `mfa_high_risk_signal` — adaptive MFA risk score above threshold (impossible-travel, new device, infostealer-listed device).

## failure_modes_requiring_review

- IdP outage → must fail closed for SOC orders (block the order, queue for retry). Need a documented incident-response playbook.
- Customer's primary passkey device lost → recovery flow is the highest-risk surface (Bypass A in the dormant-account-takeover branch). The recovery flow itself must require IDV (m14) re-verification, not just an email link.
- Federated IdP (institution SSO) — if the customer's SSO provider relaxes MFA at the IdP layer, the synthesis provider's IdP only sees the federated assertion. This is the dormant-account-takeover Bypass D pattern. Mitigation: require a passkey factor *at the synthesis provider's IdP* in addition to federation.
- TOTP time-sync errors (~2–5% per attempt according to attacker-mapping research) — false rejection of legitimate customers.

## false_positive_qualitative

- Customers using older browsers without WebAuthn support.
- Customers in shared lab environments where the only registered device belongs to a colleague.
- Customers traveling internationally — adaptive risk fires on geo-velocity.
- Customers whose institutional security policy prohibits enrolling personal devices in third-party identity systems.
- Researchers using corporate VPNs that aggregate traffic — adaptive MFA may flag these as bot-like.

## record_left

- IdP audit log: enrollment events, factor changes, authentication events with `amr`, risk score, device fingerprint.
- Provider-side log: which order triggered which step-up, whether it succeeded, and the resulting `auth_time` / `amr` snapshot.
- For lockouts and recoveries: support ticket linked to the IDV re-verification artifact.

## Notes on attacker coverage

- Catches: Method 1 (email-channel MFA reset) — IF the recovery flow requires IDV re-proofing instead of email link. Catches Method 5 (FIDO2 downgrade) — IF the policy enforces passkey-only on SOC orders, removing the TOTP/SMS fallback. Catches Method 9 (timing/grace window) — IF `auth_time` is checked tightly per SOC order.
- Does NOT catch: Method 3 (infostealer-exfiltrated TOTP seed) — defeats TOTP entirely; the only mitigation is policy-enforced passkey-only. Does NOT catch Method 8 (passkey injection via cloud account compromise) — passkeys synced via Apple/Google can be added to a new device by an attacker who controls the cloud account; FIDO2 hardware keys (non-syncable) defeat this but at high friction.
- This idea's leverage depends entirely on **policy choices** (passkey-required, recovery-via-IDV, tight `auth_time` window). The IdP itself is just the delivery mechanism.
