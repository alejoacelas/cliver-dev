# Stage 1 Ideation — Measure 16 (mfa-stepup) — v1

Measure: When sequence screening identifies a SOC, confirm MFA is enabled on that account and force step-up re-authentication. Flag triggers: MFA not enabled; repeated MFA failures. Threats mitigated: credential theft. Three attacker stories: `account-hijack`, `credential-compromise`, `dormant-account-takeover` — all converging on takeover of a pre-existing verified provider account, with bypass methods spanning email-channel MFA reset, infostealer-exfiltrated TOTP seeds, AitM phishing relays (Tycoon 2FA / EvilProxy / Evilginx), session-cookie hijack with anti-detect browsers, FIDO2 downgrade, SIM swap, support-line social engineering, IdP impersonation/policy relaxation, and passkey-sync injection.

Modes per idea: D = Direct, A = Attacker-driven.

---

## 1. Auth0 (Okta CIC) Adaptive MFA + Step-up via `acr_values` on SOC orders

- **Modes:** D, A (account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** Use Auth0 as the customer-portal IdP. On SOC-flagged orders, the synthesis backend issues a fresh OIDC authentication request with `acr_values=http://schemas.openid.net/pape/policies/2007/06/multi-factor` (or `acr_values=urn:mace:incommon:iap:silver`) and `prompt=login max_age=0`, forcing a re-authentication that re-asserts MFA in the same session. Pair with Auth0 Adaptive MFA risk signals (impossible travel, new device, IP reputation) so that even when the user's session token is hijacked, the order-time step-up triggers a second factor. Configure the rule library so that SOC orders require enrollment in a phishing-resistant factor (Auth0 supports WebAuthn / FIDO2) before order release.
- **attacker_stories_addressed:** account-hijack (forces step-up that defeats the M9 grace-period bypass and the M2 session-hijack-only path), credential-compromise, dormant-account-takeover
- **external_dependencies:** Auth0 tenant, Auth0 Actions/Rules engine, OIDC integration in synthesis portal, WebAuthn-capable browsers/devices on customer side.
- **manual_review_handoff:** If user has no phishing-resistant factor enrolled and SOC is hit, hold order, send the measure-16 outreach ("order cannot be processed until MFA is enabled") and require a security-key enrollment session with reviewer-monitored support channel (not self-service email reset) before release.
- **flags_thrown:** `mfa_not_enrolled_on_soc_order` → block + outreach. `step_up_failed_x3` → block + fraud-team review. `step_up_satisfied_by_sms_only` → soft flag (downgrade-resistant factor not present). `risk_score_high_at_stepup` (Auth0 Adaptive MFA) → review.
- **failure_modes_requiring_review:** Auth0 outage; user device lost during step-up; legitimate user without WebAuthn-capable hardware; rule misfire on impossible-travel for traveling academics.
- **record_left:** Auth0 tenant logs (`success` / `f` event types, `connection`, `client_id`, `user_agent`, MFA factor used, risk assessment) — auditable per Auth0 log retention; provider stores the `acr` claim returned in the ID token alongside the order record.
- Other fields: # stage 4

---

## 2. Okta Workforce/Customer Identity — Authentication Policies with "Phishing-resistant + re-authenticate every transaction" rule on SOC group

- **Modes:** D, A (account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** Customers authenticate via Okta. The synthesis app is registered as an Okta OIDC client. An Okta Authentication Policy rule scoped to a dynamic group ("user is placing an order tagged SOC") requires `Possession factor: Hardware-protected, Phishing-resistant` AND `Re-authenticate frequency: Every sign-in`. On SOC events the app calls Okta `/api/v1/users/{id}/factors` to verify enrolled factors, then triggers an `acr_values=phr` step-up. Okta's FastPass / WebAuthn enforcement blocks SMS, push-fatigue, and downgrade attempts. ThreatInsight feeds add IP-reputation and behavior signals.
- **attacker_stories_addressed:** account-hijack (M2 session hijack, M4 Tycoon 2FA AitM, M5 FIDO2 downgrade — Okta phishing-resistant policy refuses fallback), credential-compromise (M-uncertainty branch — passkey-bound), dormant-account-takeover (Bypass C/D — Okta IdP audit trail surfaces relax/restore policy edits)
- **external_dependencies:** Okta tenant, Okta Identity Engine (not Classic), WebAuthn factor enrollment, Okta System Log API for the auditable record.
- **manual_review_handoff:** If `enrolled_factors` lacks a phishing-resistant factor for the user attempting an SOC order, hold order; outreach script directs user to enroll a security key with a video-verified support call.
- **flags_thrown:** `no_phishing_resistant_factor` → block. `factor_enrollment_changed_within_24h_of_soc_order` → review (catches the M1 reset-then-order pattern). `okta_threatinsight_high` → review. `policy_changed_then_login_pattern` (from System Log) → review (catches dormant-account Bypass D).
- **failure_modes_requiring_review:** Okta API rate limit; Okta tenant outage; legitimate user without WebAuthn; new-device legitimate enrollment immediately before a SOC order.
- **record_left:** Okta System Log entries (`user.authentication.auth_via_mfa`, `user.mfa.factor.update`, `policy.evaluate_sign_on`) keyed to the SOC order id, retained per Okta log policy; provider stores the `amr`/`acr` claims.

---

## 3. AWS Cognito User Pools — `AdminInitiateAuth` with `CHALLENGE_NAME=SOFTWARE_TOKEN_MFA` step-up + WebAuthn (passkey) for SOC orders

- **Modes:** D, A (account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** Provider runs Cognito User Pools as the customer IdP. On SOC trigger, backend invokes `AdminInitiateAuth` with `AuthFlow=USER_AUTH` and forces the WebAuthn challenge (Cognito added passkey support in 2024). For accounts without a passkey enrolled, the backend forces a `SELECT_MFA_TYPE` challenge that excludes SMS (SMS fallback risk: SIM-swap path from account-hijack M6 — explicitly excluded). The Cognito Pre-Token-Generation Lambda inserts an `acr=phr` claim only after a passkey assertion succeeds; the order service refuses release without that claim.
- **attacker_stories_addressed:** account-hijack (M6 SIM swap blocked by SMS exclusion; M5 FIDO2 downgrade resisted because SMS path is removed; M3 infostealer TOTP seed blocked because TOTP isn't accepted for SOC), credential-compromise, dormant-account-takeover
- **external_dependencies:** AWS Cognito User Pool, Lambda triggers (Pre-Token-Generation, Pre-Authentication), CloudTrail for audit, customer browser with WebAuthn.
- **manual_review_handoff:** If account predates passkey support and SOC is hit, hold order; require enrollment via reviewer-supervised flow (not email reset).
- **flags_thrown:** `cognito_mfa_disabled` on SOC → block + outreach (literal measure-16 follow-up wording). `repeated_challenge_failure_3x` → fraud review. `passkey_enrolled_within_24h_of_soc_order` → review (dormant-account Bypass A pattern).
- **failure_modes_requiring_review:** Cognito service event; Lambda timeouts; legitimate user with only TOTP and no security key; international users on browsers lacking WebAuthn.
- **record_left:** CloudTrail `cognito-idp:AdminInitiateAuth` / `RespondToAuthChallenge` events with `eventSource`, `userIdentity`, `requestParameters` (challenge name), tied to the order id.

---

## 4. Firebase Authentication multi-factor (TOTP + Phone) with App Check + reauthentication-window enforcement

- **Modes:** D, A (account-hijack, credential-compromise)
- **Summary:** For providers using Firebase Auth as the customer IdP, enable Firebase Multi-Factor Authentication (`MultiFactorUser.enroll`), require a TOTP factor (Firebase added TOTP MFA GA 2023; Phone factor is the older option but vulnerable to SIM swap so is disabled). On SOC orders, the client SDK calls `User.reauthenticateWithPopup`/`reauthenticateWithCredential` to refresh the auth token within a 5-minute window before the order is submitted; backend rejects orders whose ID-token `auth_time` claim is older than 5 minutes. Firebase App Check (with Play Integrity / DeviceCheck / reCAPTCHA Enterprise) validates the request originates from an unmodified app, blocking session-replay from anti-detect browsers.
- **attacker_stories_addressed:** account-hijack (M9 grace-period blocked by 5-minute auth_time window; M2 session hijack blocked by App Check device attestation), credential-compromise
- **external_dependencies:** Firebase project, Identity Platform (multi-tenant Firebase Auth), App Check with Play Integrity / DeviceCheck attestation provider, reCAPTCHA Enterprise.
- **manual_review_handoff:** If `auth_time` stale or App Check token missing, hold order; outreach instructs customer to re-login from their registered device.
- **flags_thrown:** `auth_time_older_than_300s_on_soc_order` → block until reauth. `app_check_token_missing_or_invalid` → fraud review. `phone_factor_only` → block + require TOTP/passkey enrollment.
- **failure_modes_requiring_review:** App Check false negatives on jailbroken-but-legitimate dev devices; reCAPTCHA Enterprise scoring legit users low; TOTP drift.
- **record_left:** Firebase Auth audit logs (Cloud Logging `identitytoolkit.googleapis.com`); ID token `auth_time` and `firebase.sign_in_provider` claims persisted with the order.

---

## 5. Clerk — Step-up `__session` reverification with `verification.strategy = passkey` for SOC orders

- **Modes:** D, A (account-hijack, dormant-account-takeover)
- **Summary:** Clerk's `<SignedIn>` + `auth().has({permission: 'org:soc:order'})` model supports forced reverification: the backend calls `auth().reverify({level: 'second_factor'})` to demand a fresh authentication assertion at order time. Configure Clerk to require passkey (WebAuthn) as the second factor for the SOC permission scope; disable SMS fallback in the Clerk dashboard. Clerk records device fingerprint and IP per session; the SOC order webhook checks the most recent reverification timestamp.
- **attacker_stories_addressed:** account-hijack (M9 grace-period; M5 downgrade — passkey is the only accepted factor), dormant-account-takeover (Bypass A — fresh TOTP enrollment is rejected because TOTP isn't a permitted factor for the scope)
- **external_dependencies:** Clerk SaaS account, Clerk Backend SDK, Next.js / React app for portal.
- **manual_review_handoff:** If reverification strategy doesn't match policy (e.g., user only has email-magic-link), hold and require passkey enrollment.
- **flags_thrown:** `reverification_failed` → review. `factor_enrolled_within_24h_pre_order` → review.
- **failure_modes_requiring_review:** Clerk webhook delivery failure; user lost device.
- **record_left:** Clerk session JWT with `fva` (factor verification age) claim, Clerk audit logs via dashboard export.

---

## 6. WorkOS AuthKit + Radar — risk-scored step-up at order time, with phishing-resistant MFA enforcement

- **Modes:** D, A (account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** WorkOS AuthKit handles customer auth; WorkOS Radar (their bot/fraud detection product) feeds device fingerprint, residential-proxy detection, and impossible-travel signals into a per-session risk score. On SOC trigger the synthesis backend calls WorkOS `/user_management/authenticate` with `client_id` + `pending_authentication_token` to force re-authentication, requiring a WebAuthn factor. Radar's residential-proxy detection is the specific lever that catches the account-hijack M2 anti-detect-browser path: even with a fingerprint-matched profile, the proxy ASN is flagged.
- **attacker_stories_addressed:** account-hijack (M2 anti-detect+residential proxy — Radar specifically targets this pattern; M4 AitM via proxy IP detection), credential-compromise, dormant-account-takeover
- **external_dependencies:** WorkOS organization account, Radar add-on, AuthKit hosted UI or SDK, WebAuthn-capable customer device.
- **manual_review_handoff:** If Radar score >threshold or no phishing-resistant factor, hold order and route to fraud reviewer with the Radar signal bundle attached.
- **flags_thrown:** `radar_residential_proxy_detected` → block. `radar_impossible_travel` → review. `no_webauthn_factor` → outreach.
- **failure_modes_requiring_review:** Radar false positive on legitimate VPN users; AuthKit downtime.
- **record_left:** WorkOS Events API stream (`authentication.email_verification_succeeded`, `user.updated`, `session.created` with risk signals), retained per WorkOS audit log policy.

---

## 7. Cisco Duo — push-with-Verified-Push (number matching) + Duo Risk-Based Auth + Duo Trusted Endpoints for SOC step-up

- **Modes:** D, A (account-hijack, credential-compromise)
- **Summary:** Provider integrates Duo as the second-factor on the synthesis portal (Duo Web SDK / Duo Universal Prompt). On a SOC trigger the backend calls Duo's `/auth/v2/auth` API with `factor=push`, requiring number-matching (Verified Push, GA 2023, defends against push-fatigue). Duo Risk-Based Auth elevates the assurance level when the device fingerprint or geovelocity is anomalous, automatically refusing the push or requiring a hardware token. Duo Trusted Endpoints requires the order to come from a managed device with a Duo-issued client certificate — this catches the entire anti-detect-browser class because attacker browsers don't carry the cert.
- **attacker_stories_addressed:** account-hijack (M2 session hijack — Trusted Endpoints cert is missing; M4 AitM — Verified Push number-matching defeats push-fatigue and the relay can't satisfy the visual code; M9 grace-period — Duo step-up re-runs at order time), credential-compromise
- **external_dependencies:** Duo tenant, Duo Universal Prompt integrated to synthesis portal, Duo Trusted Endpoints + Duo Device Health Application installed on PI's lab device (a hard requirement that may itself be a barrier).
- **manual_review_handoff:** Failed Verified Push or missing Trusted Endpoint → hold order, outreach asks customer to install Duo Mobile + register device, with a video onboarding session.
- **flags_thrown:** `duo_push_denied` → block. `duo_trusted_endpoint_missing` → block. `duo_risk_high` → review.
- **failure_modes_requiring_review:** Duo outage; legitimate customer hasn't installed the Health App; international networks blocked from Duo cloud.
- **record_left:** Duo Admin API auth logs with `result`, `factor`, `device`, `reason`, `txid` retained per Duo retention policy.

---

## 8. Yubico YubiKey / WebAuthn (FIDO2) hardware-bound passkey requirement for SOC accounts

- **Modes:** D, A (account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** SOP-level policy: any account that has ever placed an SOC order, or that is flagged for screening, must enroll a YubiKey (or other FIDO2 hardware authenticator — Feitian, Google Titan, Windows Hello with TPM bound) as a non-removable factor. Synthesis portal verifies on each SOC order that the WebAuthn assertion's `attStmt` chain corresponds to a hardware authenticator (not a software passkey synced via iCloud Keychain or Google Password Manager) by checking the AAGUID against the FIDO Metadata Service (MDS3) and the `backupEligible`/`backupState` flags in the authenticator data (RFC 9052). Hardware-only enforcement blocks the account-hijack M8 passkey-injection-via-cloud-account bypass.
- **attacker_stories_addressed:** account-hijack (M3 infostealer — TOTP seed irrelevant; M5 downgrade — no fallback; M8 cloud passkey injection — attestation chain reveals software passkey and rejects), credential-compromise (uncertainty branch resolved against the attacker), dormant-account-takeover (factor is bound to the original holder's hardware, the explicit catch case the branch describes)
- **external_dependencies:** WebAuthn library (e.g., SimpleWebAuthn, py_webauthn), FIDO Metadata Service (MDS3 from `mds.fidoalliance.org`), customer-owned hardware key.
- **manual_review_handoff:** Account placing first SOC order without an enrolled hardware key → hold; outreach with a shipped YubiKey or instructions to purchase, then a supervised enrollment call.
- **flags_thrown:** `webauthn_assertion_software_authenticator` (BE/BS bits set) → block on SOC orders. `aaguid_not_in_mds` → review. `attestation_none` → review (preference for `direct` attestation on enrollment).
- **failure_modes_requiring_review:** Customer doesn't own a key; key lost (recovery requires identity re-verification, not email reset); MDS3 lookup failure.
- **record_left:** Stored credential id, AAGUID, attestation statement at enrollment; per-order assertion (`signCount`, `userVerified`, `backupEligible`) bound to order id.

---

## 9. FingerprintJS Pro / Fingerprint device-fingerprint binding to user account, mismatch on SOC order forces step-up

- **Modes:** D, A (account-hijack)
- **Summary:** Embed FingerprintJS Pro (visitor identifier API) on the customer portal. On account creation and on each successful login, store the `visitorId` and the device-intelligence signals (`incognito`, `tor`, `vpn`, `proxy`, `tampering`, `bot`, `clonedApp`, `factoryReset`, `cookieClonning`, `highActivity`) in the user profile. On SOC order, compare the current `visitorId` plus signals against the stored set; on mismatch (or any of the suspicious signals firing), require step-up MFA before order release. FingerprintJS specifically detects the GoLogin/Multilogin/anti-detect browsers used in account-hijack M2 (their `tampering` and `incognito` heuristics catch fingerprint-spoofing browsers).
- **attacker_stories_addressed:** account-hijack (M2 specifically — anti-detect browsers leave detectable artifacts), credential-compromise
- **external_dependencies:** FingerprintJS Pro account, JS SDK on portal frontend, server-side webhook to verify visitorId is from FPJS (not spoofed by client).
- **manual_review_handoff:** Fingerprint mismatch on SOC order → hold; reviewer compares the new visitor's signals against historical and contacts customer through registered phone (not email).
- **flags_thrown:** `visitor_id_mismatch_on_soc_order` → step-up. `fpjs_tampering_signal` → block + review. `fpjs_residential_proxy` → review.
- **failure_modes_requiring_review:** Legitimate device upgrade; user travels and changes browser; FPJS API outage.
- **record_left:** FPJS visitorId + signals JSON per session, stored against order id.

---

## 10. Stytch Device Fingerprinting + Strong CAPTCHA + Step-up Auth API

- **Modes:** D, A (account-hijack)
- **Summary:** Stytch's Device Fingerprinting product produces a `visitor_fingerprint`, `browser_fingerprint`, and `network_fingerprint` plus a verdict (`ALLOW`/`CHALLENGE`/`BLOCK`) tied to anti-detect-browser detection. Synthesis backend calls `stytch.fingerprint.lookup` on every order; SOC orders with verdict ≠ ALLOW are routed to Stytch's step-up `/sessions/authenticate` with `session_duration_minutes=5` and `required_authentication_factors=[webauthn]`. Stytch's specific selling point is detecting anti-detect-browser fingerprint spoofing (they publish a customer case study against Multilogin).
- **attacker_stories_addressed:** account-hijack (M2 — explicit defense), credential-compromise
- **external_dependencies:** Stytch project, Stytch SDK + backend API, WebAuthn-capable device.
- **manual_review_handoff:** Verdict CHALLENGE/BLOCK on SOC → hold, fraud reviewer inspects fingerprint history.
- **flags_thrown:** `stytch_verdict_block` → block. `stytch_verdict_challenge` → step-up. `network_fingerprint_residential_proxy` → review.
- **failure_modes_requiring_review:** Stytch outage; legitimate user on a Tor-routed academic network.
- **record_left:** Stytch fingerprint API response stored per order with verdict + reasons.

---

## 11. PingOne DaVinci / PingOne Protect — risk-scored step-up orchestration tied to SOC order webhook

- **Modes:** D, A (account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** Use PingOne Protect (formerly Ping Risk) as the risk engine and PingOne DaVinci as the orchestration layer. The synthesis backend posts an `evaluation` request to PingOne Protect at SOC trigger; the engine returns a risk score combining device, IP, behavior, bot, anomaly, and impossible-travel signals. DaVinci flow then routes high-risk evaluations to a hardware-key challenge before completing the order. PingOne also supports passkeys with hardware attestation. Catches dormant-account Bypass D (IdP policy relax/restore) by surfacing the `policy.evaluate` audit anomaly to the risk model.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-account-takeover (specifically Bypass C/D federated/IdP attacks via PingOne audit log feed into risk scoring)
- **external_dependencies:** PingOne tenant, PingOne Protect license, DaVinci flow runtime, OIDC/SAML integration.
- **manual_review_handoff:** Risk score above threshold → hold, fraud team reviews PingOne risk explanation.
- **flags_thrown:** `pingone_risk_high` → review. `pingone_anomaly_idp_policy_change` → review.
- **failure_modes_requiring_review:** PingOne outage; risk model false positives.
- **record_left:** PingOne Protect evaluation record + DaVinci flow execution log, retained per Ping retention policy.

---

## 12. SOP: Disable email-channel MFA self-service reset; force support-channel reset with video IDV (Persona / Onfido / Veriff)

- **Modes:** A (account-hijack M1, credential-compromise account-takeover, dormant-account-takeover Bypass A)
- **Summary:** Standing SOP: customer-portal account self-service "lost authenticator" / "MFA reset" links go through email only for non-SOC accounts. For any account that has ever placed a SOC order, or any account whose last 90 days of orders touched a sequence on the screening watchlist, the self-service reset link is disabled by a feature flag in the Auth0/Okta/Cognito tenant. Reset requires a support ticket, a live video IDV session against a known-good document (Persona Inquiry / Onfido Studio / Veriff session), and re-binding the new factor must be a hardware key. This is the explicit SOP-level countermeasure to the email-channel MFA-reset bypass that all three attacker stories describe as the cheapest path.
- **attacker_stories_addressed:** account-hijack (M1 explicitly), credential-compromise (cheapest path explicitly), dormant-account-takeover (Bypass A explicitly)
- **external_dependencies:** Persona / Onfido / Veriff account; ticketing system (Zendesk / Linear); SOP doc; feature flag in IdP.
- **manual_review_handoff:** Reset request on SOC-tagged account → ticket auto-routes to fraud reviewer; reviewer runs Persona session; on pass, escorts customer through hardware-key enrollment on a video call.
- **flags_thrown:** `mfa_reset_request_on_soc_account` → manual queue. `persona_idv_failed` → escalate. `customer_refuses_video_idv` → block.
- **failure_modes_requiring_review:** Customer in a region without video bandwidth; document expired; reviewer unavailable in time zone.
- **record_left:** Persona inquiry id + decision; ticket transcript; new credential id stored against the user.

---

## 13. SOP: Block support-channel MFA reset without callback to phone of record + voice-liveness check (Pindrop)

- **Modes:** A (account-hijack M7, dormant-account-takeover Bypass B)
- **Summary:** Standing SOP for the support team: any phone-in MFA reset request from an SOC-tagged account triggers (a) a callback to the phone-of-record stored at last verified order (not the inbound caller's claimed number), (b) a Pindrop Protect voice-authentication call analysis that screens for synthetic voice, replay, and known-fraud-actor vocal fingerprints (Pindrop publishes specific anti-deepfake detection for ElevenLabs-class voice clones), and (c) refusal to complete reset on the call — reset is queued for a video IDV session per idea 12. Directly addresses the voice-cloning vishing path that account-hijack M7 enumerates.
- **attacker_stories_addressed:** account-hijack (M7 explicitly), dormant-account-takeover (Bypass B — 0ktapus-style support social engineering)
- **external_dependencies:** Pindrop Protect; phone system that supports outbound callback (not inbound only); SOP doc; support-team training program.
- **manual_review_handoff:** Pindrop fraud verdict → escalate to fraud team; legitimate caller gets queued into video IDV path.
- **flags_thrown:** `pindrop_synthetic_voice_detected` → block + escalate. `caller_number_mismatch_phone_of_record` → callback required. `support_agent_overrode_callback_sop` → audit alert.
- **failure_modes_requiring_review:** Pindrop false positives on poor lines; phone-of-record stale because user changed legitimately.
- **record_left:** Call recording, Pindrop verdict JSON, ticket entries.

---

## 14. SOP: Disable SMS fallback entirely for SOC accounts at IdP layer (no SMS factor enrollment permitted)

- **Modes:** A (account-hijack M5 downgrade, M6 SIM swap)
- **Summary:** Standing IdP-tenant configuration: SMS as a second factor is removed from the menu of permitted factors for any SOC-tagged account in Auth0/Okta/Cognito/Clerk/WorkOS. This is a one-line tenant policy change in each of those vendors. Removes the entire downgrade-to-SMS path that account-hijack M5 (Proofpoint Evilginx phishlet, IOActive OOTB2025) and M6 (SIM-swap, SS7) depend on. Pairs with idea 8 (hardware-key requirement) to provide both the affirmative requirement and the negative removal.
- **attacker_stories_addressed:** account-hijack (M5, M6 explicitly)
- **external_dependencies:** IdP tenant admin config; SOP doc.
- **manual_review_handoff:** User who has only SMS enrolled and places SOC order → outreach asking to enroll TOTP/passkey, hold order in interim.
- **flags_thrown:** `sms_only_factor_on_soc_account` → outreach + block.
- **failure_modes_requiring_review:** Legitimate user with no smartphone (rare among PIs).
- **record_left:** IdP factor-enrollment log; tenant config diff in version control.

---

## 15. Have I Been Pwned (HIBP) Pwned Passwords + breach-feed cross-check on SOC account credentials

- **Modes:** A (credential-compromise, account-hijack)
- **Summary:** On every login (and proactively as a daily batch) submit the SHA-1 prefix of the user's password to the HIBP Pwned Passwords API (`api.pwnedpasswords.com/range/{prefix}`, k-anonymity model). Cross-reference the user's email against HIBP's `breachedaccount` API (subscription) to detect when the email appears in a fresh breach. On any positive hit for an SOC-tagged account, force immediate password rotation + step-up MFA re-enrollment via the supervised flow (idea 12). Catches the credential-compromise branch's central premise — that the cheapest path is buying breached credentials.
- **attacker_stories_addressed:** credential-compromise (the entire branch's enabling step), account-hijack (M3 infostealer logs often include reused passwords)
- **external_dependencies:** HIBP Pwned Passwords API (free); HIBP breach API (paid Enterprise tier for `breachedaccount` and `stealerlogs`); cron job.
- **manual_review_handoff:** Hit → forced password rotation; if SOC order pending, hold and route to fraud reviewer.
- **flags_thrown:** `password_in_hibp` → forced rotation. `email_in_recent_breach` → step-up. `email_in_hibp_stealerlog` → block + supervised reset.
- **failure_modes_requiring_review:** API outage; legitimate password coincidence with a leaked one.
- **record_left:** HIBP query timestamp + match outcome (no plaintext); breach name + date for breach hits.

---

## 16. SpyCloud / Constella Identity Breach Intelligence — infostealer-log monitoring for SOC-tagged users

- **Modes:** A (account-hijack M3, credential-compromise)
- **Summary:** Subscribe to SpyCloud's Consumer ATO Prevention API or Constella's infostealer feed. Submit the email addresses of all SOC-tagged users on a daily basis; the API returns whether the user's credentials, session cookies, or TOTP seeds appear in a recent infostealer log (Russian Market, Genesis, etc.). On a positive hit, automatically (a) invalidate all sessions, (b) require supervised hardware-key re-enrollment, (c) hold any in-flight SOC orders. SpyCloud and Constella are the two named industry vendors for this exact data; the account-hijack and credential-compromise branches both cite Constella's 2026 Identity Breach Report as their motivating data source.
- **attacker_stories_addressed:** account-hijack (M3 zero-trace TOTP-seed exfiltration — caught at the source data), credential-compromise (the branch explicitly buys these logs)
- **external_dependencies:** SpyCloud or Constella enterprise contract; daily batch job; integration with IdP session-revocation API.
- **manual_review_handoff:** Hit → fraud reviewer notifies user via phone-of-record, runs supervised reset.
- **flags_thrown:** `spycloud_credential_exposure` → block + reset. `spycloud_session_cookie_exposure` → block + invalidate sessions. `spycloud_totp_seed_exposure` → block + force hardware-key migration.
- **failure_modes_requiring_review:** False match (rare with email-keyed lookups); vendor data lag.
- **record_left:** Vendor exposure record id, exposure date, source breach.

---

## 17. Session-token binding to TLS channel via DBSC (Device Bound Session Credentials) / token binding

- **Modes:** A (account-hijack M2, M9)
- **Summary:** Adopt Google's Device Bound Session Credentials (DBSC, in Chrome origin trial) on the customer portal. Session cookies are cryptographically bound to a TPM/secure-enclave key on the user's device; a stolen cookie cannot be replayed from a different device because the device-bound proof can't be reproduced. Forces step-up to a fresh DBSC challenge at SOC order time. This addresses the account-hijack M2 session-replay path at the protocol level rather than via fingerprint heuristics.
- **attacker_stories_addressed:** account-hijack (M2 session hijack at root; M9 grace-period because the order-time DBSC challenge re-runs the device proof)
- **external_dependencies:** Chrome / Edge with DBSC support; backend DBSC implementation; TPM on customer device; SOP for non-Chrome users.
- **manual_review_handoff:** User on a non-DBSC browser placing SOC order → fall back to WebAuthn step-up; escalate if WebAuthn also unavailable.
- **flags_thrown:** `dbsc_proof_invalid_for_session` → block + invalidate session. `dbsc_unsupported_browser_on_soc` → require WebAuthn step-up.
- **failure_modes_requiring_review:** Browser support gaps; legitimate device replacement.
- **record_left:** DBSC session id + binding-key fingerprint (not the key itself).

---

## 18. SOP: Re-authenticate at SOC order placement with `max_age=0` and require new-device cooling-off period

- **Modes:** A (account-hijack M1, M9, dormant-account-takeover Bypass A)
- **Summary:** Standing SOP regardless of IdP vendor: the SOC-order submission endpoint requires the OIDC ID token's `auth_time` to be within the last 60 seconds AND the credential id used in the WebAuthn assertion to have been enrolled at least 14 days ago. The 14-day cooling-off period directly catches the email-channel-reset path where the attacker enrolls a new factor and immediately places an order. Combined with idea 12 (no self-service reset), the cooling-off period is the residual catch on any reset that does slip through.
- **attacker_stories_addressed:** account-hijack (M1 reset-then-order; M9 grace-period), credential-compromise (account takeover then immediate order), dormant-account-takeover (Bypass A enroll-and-order)
- **external_dependencies:** Internal user/credential database with enrollment timestamps; OIDC ID token consumption; SOP doc.
- **manual_review_handoff:** Order submitted with credential <14 days old → hold; review reset history; require supervised re-verification before release.
- **flags_thrown:** `auth_time_stale_on_soc_order` → block. `credential_too_young_on_soc_order` → review.
- **failure_modes_requiring_review:** Legitimate new-device migration immediately before a needed order.
- **record_left:** Order record carries `auth_time`, credential id, credential enrollment timestamp.

---

## 19. SOP: SAML/OIDC federation hardening — refuse federated assertions for SOC orders unless `amr` includes `hwk`/`mfa` and IdP signing-key change is recent-flagged

- **Modes:** A (dormant-account-takeover Bypass C, Bypass D)
- **Summary:** When the customer authenticates via institutional SSO (SAML/OIDC federation), the synthesis portal validates that the assertion's `amr` (or `AuthnContextClassRef`) claim includes a phishing-resistant factor name (`hwk`, `swk`, `phr`, or `urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract` and similar). On SOC orders, refuse assertions that lack this. Additionally, monitor the upstream IdP's metadata feed: if the IdP's signing certificate or MFA policy changed in the 24 hours before an SOC order, flag for review (catches dormant-account-takeover Bypass D — the policy relax/restore audit pattern). Use the institutional IdP's published metadata URL for the version check.
- **attacker_stories_addressed:** dormant-account-takeover (Bypass C IdP impersonation, Bypass D IdP MFA policy relaxation)
- **external_dependencies:** SAML/OIDC libraries; institutional IdP metadata URL; metadata-change watcher.
- **manual_review_handoff:** Federated assertion missing `hwk`/`phr` on SOC order → outreach to institutional IT contact + hold order. IdP metadata changed in last 24h → fraud review.
- **flags_thrown:** `federated_amr_lacks_phishing_resistant` → block. `idp_metadata_changed_within_24h_of_soc_order` → review.
- **failure_modes_requiring_review:** Legitimate IdP cert rotation; institutional IdP doesn't surface `amr`.
- **record_left:** Stored SAML assertion (or OIDC ID token) with `amr` and IdP entity id; metadata change-log entry.

---

## 20. Account-dormancy detection + forced re-IDV before re-enabling MFA on SOC orders

- **Modes:** A (dormant-account-takeover entire branch)
- **Summary:** Track `last_login_at` and `last_order_at` per account. If an account has been dormant >180 days and a SOC order arrives, freeze the account in the "needs full re-IDV" state regardless of MFA status: require a supervised Persona / Onfido / Veriff video session against the original IDV document on file before any MFA re-enrollment or order release is permitted. Catches the dormant-account-takeover branch's central premise that the IT admin is reactivating an inherited persona — they cannot satisfy the live video re-IDV against the departed researcher's face.
- **attacker_stories_addressed:** dormant-account-takeover (entire branch)
- **external_dependencies:** Persona / Onfido / Veriff; the original enrolled IDV document (i.e., this measure depends on measure 14 having already been done); user database `last_active` field.
- **manual_review_handoff:** Dormant account + SOC order → freeze; reviewer schedules video IDV; on pass, supervised hardware-key enrollment.
- **flags_thrown:** `account_dormant_180d_with_soc_order` → freeze. `video_idv_face_mismatch_with_enrollment` → block + escalate.
- **failure_modes_requiring_review:** Researcher legitimately on long sabbatical; original IDV document expired (passport renewal); face has aged significantly.
- **record_left:** Dormancy timestamps + video IDV inquiry id + face-match score.

---

## Coverage notes

- Account-hijack methods M1–M9 are addressed as follows: M1 (email-recovery reset) → 12, 18; M2 (session hijack + anti-detect browser) → 9, 10, 17, 6; M3 (infostealer TOTP) → 8, 16; M4 (Tycoon 2FA AitM) → 1, 2, 7, 8 (FIDO2 phishing-resistant); M5 (FIDO2 downgrade) → 8, 14; M6 (SIM swap / SS7) → 14, 8; M7 (vishing support) → 13; M8 (cloud passkey injection) → 8 (hardware-binding via BE/BS bits + AAGUID attestation); M9 (grace period) → 1, 18, 4, 5.
- Credential-compromise: 12, 15, 16 hit the breach-credential supply chain at source; 1–8 enforce phishing-resistant step-up.
- Dormant-account-takeover: Bypass A → 12, 18, 20; Bypass B → 13; Bypass C → 19; Bypass D → 11, 19; full chain → 20.
- No idea is duplicated across vendors purely for breadth — Auth0 / Okta / Cognito / Firebase / Clerk / WorkOS / Duo / Yubico/WebAuthn are listed as alternatives because providers will already be on one stack, and the implementation specifics differ. Stage 3 should consolidate these into one "phishing-resistant step-up at IdP layer (specific vendors X/Y/Z)" idea if duplication is the criterion.
