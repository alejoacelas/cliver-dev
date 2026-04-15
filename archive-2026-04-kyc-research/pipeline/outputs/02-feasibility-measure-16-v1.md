# Stage 2 Feasibility Check — Measure 16 (mfa-stepup) — v1

Reviewing `01-ideation-measure-16-v1.md`. Two gates: concreteness (specific named source/vendor/SOP), relevance (engages a real attacker story bypass).

---

## 1. Auth0 Adaptive MFA + step-up via `acr_values`
- **Concreteness:** PASS — Auth0 named, specific OIDC mechanism (`acr_values`, `prompt=login`, `max_age=0`), Adaptive MFA product named, WebAuthn factor type named.
- **Relevance:** PASS — `acr_values` step-up at order time directly defeats account-hijack M9 (grace period) and credential-compromise/dormant-account TOTP-only baselines. Adaptive MFA's impossible-travel/IP reputation engages M2.
- **Verdict:** PASS

## 2. Okta Authentication Policies — phishing-resistant + reauth-every-sign-in for SOC group
- **Concreteness:** PASS — Okta product, Identity Engine, FastPass, ThreatInsight, specific API path (`/api/v1/users/{id}/factors`), System Log event names.
- **Relevance:** PASS — Phishing-resistant policy refusal explicitly defeats account-hijack M4 (Tycoon 2FA AitM) and M5 (FIDO2 downgrade); System Log policy-change detection catches dormant-account Bypass D.
- **Verdict:** PASS

## 3. AWS Cognito step-up + WebAuthn passkey
- **Concreteness:** PASS — Cognito named, specific API (`AdminInitiateAuth`), challenge names, Lambda trigger names, CloudTrail event types.
- **Relevance:** PASS — SMS exclusion specifically blocks M5/M6; passkey-only on SOC blocks M3; supervised re-enrollment blocks M1.
- **Verdict:** PASS

## 4. Firebase Auth + App Check + 5-minute reauth window
- **Concreteness:** PASS — Firebase Auth + Identity Platform named; App Check + Play Integrity / DeviceCheck / reCAPTCHA Enterprise named; specific SDK methods (`reauthenticateWithCredential`); `auth_time` ID token claim is real.
- **Relevance:** PASS — `auth_time` window defeats M9; App Check device attestation engages M2 (anti-detect browsers fail device attestation).
- **Verdict:** PASS

## 5. Clerk reverification with passkey
- **Concreteness:** PASS — Clerk named; `auth().reverify()` and `fva` claim are real Clerk APIs.
- **Relevance:** PASS — Reverification engages M9; passkey-only scope rejects M5 fallback and dormant-account Bypass A's TOTP re-enrollment.
- **Verdict:** PASS

## 6. WorkOS AuthKit + Radar
- **Concreteness:** PASS — WorkOS named; AuthKit + Radar are real products; `pending_authentication_token` is a real WorkOS concept.
- **Relevance:** PASS — Radar's residential-proxy detection is the explicit countermeasure to account-hijack M2 (anti-detect browser + residential proxy); also engages M4 proxy-IP detection.
- **Verdict:** PASS

## 7. Cisco Duo Verified Push + Trusted Endpoints
- **Concreteness:** PASS — Duo named, specific products (Universal Prompt, Verified Push, Trusted Endpoints, Risk-Based Auth, Device Health Application), specific API path.
- **Relevance:** PASS — Number-matching defeats M4 push relay; Trusted Endpoints cert blocks M2 anti-detect browser; step-up re-runs at order time defeats M9.
- **Verdict:** PASS

## 8. YubiKey / FIDO2 hardware-bound passkey requirement, AAGUID + BE/BS check against MDS3
- **Concreteness:** PASS — YubiKey, FIDO MDS3 (`mds.fidoalliance.org`), SimpleWebAuthn / py_webauthn libraries, specific WebAuthn fields (`backupEligible`, `backupState`, `aaguid`, `attStmt`).
- **Relevance:** PASS — BE/BS check is the precise mechanism that distinguishes hardware-bound from cloud-synced passkeys, directly addressing account-hijack M8 (compromise iCloud → inject passkey). Also addresses M3, M5, M6, dormant-account branch's "phishing-resistant MFA bound to original holder's device."
- **Verdict:** PASS

## 9. FingerprintJS Pro device fingerprint binding
- **Concreteness:** PASS — FingerprintJS Pro named with specific signals (`tampering`, `incognito`, `cookieClonning`, etc.).
- **Relevance:** PASS — Direct counter to account-hijack M2 (GoLogin/Multilogin detection is FPJS's stated capability).
- **Verdict:** PASS

## 10. Stytch Device Fingerprinting + step-up
- **Concreteness:** PASS — Stytch named; fingerprint API verdicts (`ALLOW`/`CHALLENGE`/`BLOCK`) and step-up session API are real.
- **Relevance:** PASS — M2 explicit. Some duplication with idea 9 (both fingerprint vendors), but they are alternatives a provider would pick between, not the same source — keep both for stage 3 to consolidate.
- **Verdict:** PASS

## 11. PingOne Protect + DaVinci risk-scored step-up
- **Concreteness:** PASS — PingOne Protect, PingOne DaVinci named (real Ping Identity products).
- **Relevance:** PASS — Risk engine catches M2/M4 anomalies; DaVinci flow can route to hardware key. Claim that audit-log feeds catch dormant-account Bypass D is plausible.
- **Verdict:** PASS

## 12. SOP: Disable email-channel self-service MFA reset; force video IDV
- **Concreteness:** PASS — Persona / Onfido / Veriff named as IDV vendors; clear SOP (feature flag at IdP, ticket queue, video IDV, hardware-key re-binding).
- **Relevance:** PASS — Directly named as the explicit catch for account-hijack M1, credential-compromise account-takeover, dormant-account Bypass A. This is the single most important SOP idea against the branches.
- **Verdict:** PASS

## 13. SOP: Pindrop voice-liveness + callback-to-phone-of-record on support resets
- **Concreteness:** PASS — Pindrop Protect named; specific SOP (callback to phone-of-record, not inbound).
- **Relevance:** PASS — Account-hijack M7 (voice-cloning vishing) and dormant-account Bypass B (0ktapus support social engineering) are exactly this attack class.
- **Verdict:** PASS

## 14. SOP: Disable SMS factor entirely for SOC accounts
- **Concreteness:** PASS — Specific tenant config; named at the IdP level.
- **Relevance:** PASS — M5 (downgrade to SMS) and M6 (SIM swap / SS7) both depend on SMS being a permitted factor; removal eliminates them at the policy layer.
- **Verdict:** PASS

## 15. HIBP Pwned Passwords + breach-feed cross-check
- **Concreteness:** PASS — HIBP named; specific endpoint (`api.pwnedpasswords.com/range/{prefix}`), specific tier names.
- **Relevance:** PASS — Credential-compromise branch's enabling step is buying breached credentials; HIBP catches reuse. Also catches infostealer-included reused passwords (M3 sibling).
- **Verdict:** PASS

## 16. SpyCloud / Constella infostealer monitoring
- **Concreteness:** PASS — SpyCloud Consumer ATO Prevention API and Constella named as the two industry vendors. The attacker stories themselves cite Constella.
- **Relevance:** PASS — Direct hit on account-hijack M3 (infostealer TOTP seed exfiltration) and credential-compromise (the branch buys these logs explicitly).
- **Verdict:** PASS

## 17. DBSC (Device Bound Session Credentials) for session-token binding
- **Concreteness:** PASS — DBSC named (real Chrome origin trial spec); TPM/secure-enclave binding mechanism is concrete.
- **Relevance:** PASS — Addresses account-hijack M2 at the protocol level; M9 because order-time DBSC challenge re-runs device proof. Adoption is currently limited but stage 4 will surface that — concreteness is fine.
- **Verdict:** PASS

## 18. SOP: `max_age=0` reauth + 14-day credential cooling-off
- **Concreteness:** PASS — Specific OIDC mechanism (`max_age`, `auth_time` claim) + specific SOP (14-day cooling-off on credential id age).
- **Relevance:** PASS — Cooling-off catches the M1/Bypass A enroll-then-immediately-order pattern; `max_age=0` catches M9.
- **Verdict:** PASS

## 19. SAML/OIDC federation hardening — `amr` check + IdP metadata change watcher
- **Concreteness:** PASS — Specific SAML `AuthnContextClassRef` URIs and OIDC `amr` values named; metadata-change-watcher SOP is concrete.
- **Relevance:** PASS — Dormant-account Bypass C (IdP impersonation) and Bypass D (IdP MFA policy relax/restore) are the explicit targets; the metadata-change watcher catches the "very distinctive pattern" the branch's bypass excerpt names.
- **Verdict:** PASS

## 20. Account-dormancy detection + forced re-IDV before MFA re-enable
- **Concreteness:** PASS — Persona / Onfido / Veriff named; specific dormancy threshold; specific SOP.
- **Relevance:** PASS — Targets dormant-account-takeover entire branch; the live face-match against original enrollment is the only check that defeats an IT admin who controls all the digital channels.
- **Verdict:** PASS

---

## Gaps / classes not covered

None identified. The mapping file's three branches and their named bypass methods (M1–M9 in account-hijack, the credential-compromise excerpts, and dormant-account Bypasses A–D) all map to at least one idea above, and the coverage table at the end of v1 spells out the per-method assignment.

---

## Duplication note (for stage 3, not blocking here)

Ideas 1, 2, 3, 4, 5, 6 are six different IdP vendors implementing fundamentally the same control (force `acr_values`/reverification step-up + require phishing-resistant factor). They are kept separate because the implementation, audit log shape, and vendor-specific risk-engine signals differ enough that stage 4 research will produce meaningfully different specs. Ideas 9 and 10 (FingerprintJS vs Stytch) are similar alternatives. Stage 3 should decide whether to consolidate or keep parallel; not a stage-2 problem.

---

STOP: yes
