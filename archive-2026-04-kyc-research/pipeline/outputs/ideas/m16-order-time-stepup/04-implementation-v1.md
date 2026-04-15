# m16-order-time-stepup — Implementation v1

- **measure:** M16 (mfa-stepup)
- **name:** Order-time `max_age=0` step-up authentication
- **modes:** D, A
- **summary:** Whenever a customer submits a sequence-of-concern (SOC) order, the order endpoint forces a fresh authentication event by sending the user back through the IdP with `max_age=0` (or `prompt=login`) and a high `acr_values` requirement. The order is bound to the new `auth_time` claim on the returning ID token; an existing session, however recent, is insufficient. Closes session-hijack and grace-period bypasses on otherwise-valid hijacked sessions.

## external_dependencies

- **OIDC-compliant IdP** (Okta, Auth0, Azure AD, Keycloak, Ping). All major IdPs implement the `max_age` request parameter from OIDC Core 1.0 §3.1.2.1 and the `auth_time` ID-Token claim per §2.
- **Application code path** that intercepts SOC orders and triggers the re-auth redirect.
- **Existing MFA factor** (covered by sibling ideas m16-webauthn-yubikey, m16-no-sms-no-email-reset).

## endpoint_details

- **OIDC parameter:** `max_age=0` on the authorize request forces a fresh login. Auth0 documents this explicitly: "If you want to ignore the existing session and reauthenticate the user each time, pass `max_age=0` in the request" ([Auth0 — Force Reauthentication in OIDC](https://auth0.com/docs/authenticate/login/max-age-reauthentication)). The returned ID token must include an `auth_time` claim the application validates ([Josh Cain — When You OIDC, use max_age=0](https://joshcain.dev/posts/2019-05-15-max_age/)).
- **Step-up via ACR:** Okta supports `acr_values=urn:okta:loa:2fa:any` (or stronger `phr` / `phrh` values for phishing-resistant) to demand a specific assurance level on this transaction; if the existing session is below the requested level, the IdP prompts for the missing factor ([Okta — Step-up authentication using ACR values](https://developer.okta.com/docs/guides/step-up-authentication/main/), [Okta blog — Step-Up Authentication Examples](https://developer.okta.com/blog/2023/10/24/stepup-okta)). Auth0 exposes the same via `event.transaction.acr_values` in Actions ([Auth0 — Configure Step-up Authentication for Web Apps](https://auth0.com/docs/secure/multi-factor-authentication/step-up-authentication/configure-step-up-authentication-for-web-apps)).
- **Auth model / pricing:** included in any IdP that supports OIDC. No incremental SaaS cost beyond MFA-tier pricing.
- **Rate limits:** governed by the underlying IdP login endpoint rate limits — typically generous for human-paced reauthentication. [unknown — searched for: "Okta /oauth2/authorize rate limit", "Auth0 authorization endpoint rate limit max_age".]

## fields_returned

After the redirect round-trip the application receives an ID token with at minimum:

- `sub` — user ID
- `auth_time` — the **load-bearing field**: the unix timestamp of the most recent authentication event. Must be > the timestamp the application sends with the order. ([OIDC Core §2: ID Token claims](https://openid.net/specs/openid-connect-core-1_0.html))
- `acr` — actual assurance level achieved
- `amr` — authentication methods used (e.g., `["pwd","hwk"]`)
- `nonce` — replay protection
- `iat`, `exp` — token issued and expiry

## marginal_cost_per_check

- **Per SOC order:** $0 incremental — the IdP charges per monthly active user, not per re-auth call. The cost is in user friction.
- **Setup cost:** Engineering work to wrap SOC order submission in the OIDC re-auth round trip and to validate `auth_time` server-side. [best guess: 1–2 engineer-weeks for a team that already runs OIDC.]

## manual_review_handoff

SOP for failed step-ups at order time:

1. **User clicks "Submit SOC order".**
2. **App redirects to IdP** with `max_age=0` and the required `acr_values`.
3. **IdP prompts for full authentication** (password + hardware token / passkey).
4. **On success:** order continues; the order record stores `auth_time`, `acr`, `amr`, IdP session ID.
5. **On failure** (wrong factor, repeated MFA failures): the order is held, customer sees "Your authentication has expired. Please log out and back in to continue." After 3 failed step-up attempts, account is locked and a `stepup_failed` flag is sent to the review queue.
6. **Reviewer playbook:** check the IdP audit log for the failure pattern. If failures look like a confused user (correct username, wrong codes), call the customer. If they look like an attacker (geographic anomaly, new device fingerprint, multiple usernames), preserve evidence and notify the legitimate account owner via the institutional security contact.

## flags_thrown

- `stepup_failed` — 3+ failed re-auth attempts at SOC order time. **Action:** lock account, route to reviewer, contact legitimate user OOB.
- `stepup_factor_downgraded` — user authenticated but with a lower `acr` than required (e.g., fell back from passkey to TOTP). **Action:** order held; reviewer determines whether the downgrade is legitimate (lost token) or suspicious.
- `stepup_geolocation_anomaly` — fresh auth succeeded but from an IP very different from prior order pattern. **Action:** soft hold, contact user.
- `stepup_session_age_violation` — `auth_time` returned by IdP is older than expected (indicates IdP misconfiguration or token tampering). **Action:** reject the order, page security.

## failure_modes_requiring_review

- **IdP returns a token without `auth_time`** — SDK or library bug; reject and alert engineering.
- **`max_age=0` honored as `prompt=login` by some IdPs** — known Keycloak / Hydra quirks ([Keycloak issue 33641](https://github.com/keycloak/keycloak/issues/33641), [Ory Hydra issue 3034](https://github.com/ory/hydra/issues/3034)). Engineering must validate behavior per IdP at integration time.
- **Order submitted from a long-running mobile app session** where re-auth is jarring — predictable friction, requires UX work.
- **Federated logins** where the upstream IdP re-uses cached session and ignores `max_age=0` — needs `prompt=login` re-passed to the upstream IdP via a custom Action / Inline Hook.
- **Hardware token plugged in but not present** when the user is roaming — friction failure, customer-support route.

## false_positive_qualitative

- **Bench scientists in lab gloves** who can't easily insert a hardware token at order time. Workflow friction; not a security false positive but a UX one.
- **Customers placing many small SOC-adjacent orders in one session** who get re-auth fatigue. Mitigate by batching: a single re-auth can authorize one explicit ordering window (e.g., 5 minutes).
- **Group accounts** where the person logged in is not the person ordering. Caught — but legitimately, since group accounts violate the entire model.

## record_left

- **Order record** with embedded `auth_time`, `acr`, `amr`, IdP session ID, and the JWT digest (not the full token). This is the load-bearing audit artifact: an investigator can prove the order was bound to a fresh, in-scope authentication event.
- **IdP audit log** entry for the re-auth event itself.
- **Cross-link:** order ID ↔ IdP authentication event ID, queryable both directions. This is what makes the check defensible to a regulator: you can demonstrate per-order MFA, not per-session MFA.

## attacker stories addressed (cross-ref)

- **account-hijack Method 2 (session hijack via stolen cookies):** directly closed — cookie replay yields a session, but not a fresh `auth_time`.
- **account-hijack Method 9 (timing — exploit grace period):** directly closed — `max_age=0` removes the grace period at order time entirely.
- **account-hijack Method 3 (infostealer-exfiltrated TOTP seed):** NOT closed by this idea alone — the attacker can complete the fresh auth using the stolen seed. Cross-references m16-webauthn-yubikey for the hardware-token requirement.
- **credential-compromise (TOTP re-enrollment after email-channel reset):** NOT closed by this idea alone; cross-references m16-no-sms-no-email-reset.
