# m16-webauthn-yubikey — Implementation v1

- **measure:** M16 (mfa-stepup)
- **name:** WebAuthn / YubiKey hardware token enforcement
- **modes:** D
- **summary:** Require enrollment of a phishing-resistant WebAuthn (FIDO2) hardware authenticator — typically a YubiKey 5 series — for any customer placing SOC orders. The IdP is configured to **require** the WebAuthn factor (no fallback to SMS, TOTP, or email magic link), with attestation validation against an enterprise AAGUID allowlist so customers cannot enroll arbitrary phishable software passkeys. Eliminates AitM phishing relay (Tycoon 2FA / EvilProxy), SMS bypass, infostealer-TOTP-seed bypass, and FIDO downgrade.

## external_dependencies

- **YubiKey hardware** (or another FIDO2 hardware authenticator allowlisted by attestation).
- **WebAuthn-capable IdP** (Okta, Auth0, Azure AD, Google Workspace, Ping, Keycloak — all support FIDO2 / WebAuthn). Okta has explicit AAGUID allowlist support per [Okta — Configure Passkeys (FIDO2 WebAuthn)](https://help.okta.com/oie/en-us/content/topics/identity-engine/authenticators/configure-passkeys.htm).
- **Token distribution and replacement workflow** (cross-references the help-desk SOP from m16-no-sms-no-email-reset for lost tokens).
- **YubiEnterprise Delivery service** (optional) for shipping pre-registered tokens directly to customers ([YubiEnterprise Console](https://console.yubico.com/help/Modes_of_Purchase.html)).

## endpoint_details

- **WebAuthn standard:** W3C Web Authentication Level 2/3, registered on the IdP. Browser-native; no SaaS endpoint per check.
- **Okta config:** Authenticators → Passkeys (FIDO2 WebAuthn). Toggle "Require certificate-based attestation validation," upload an AAGUID list of approved authenticators (e.g., the Yubico AAGUIDs from the FIDO Metadata Service), and set Authentication Policies → "Phishing-resistant" sign-in requirement on the SOC ordering app ([Okta — Create phishing-resistant app sign-in policies](https://help.okta.com/oie/en-us/content/topics/identity-engine/authenticators/pr-set-up-policies.htm)). Okta exposes the FIDO MDS AAGUID list for browsing in the admin console.
- **Auth model:** WebAuthn ceremonies use cryptographic challenge-response; no API key per request.
- **Pricing — YubiKey hardware:** YubiKey 5 NFC retail $50; Security Key Series (FIDO2-only) starts at $25; FIPS series ~$95 ([Keytos — How much does a YubiKey cost](https://www.keytos.io/blog/passwordless/how-much-does-a-yubikey-cost.html)). Bulk trays of 50 are sold via Yubico.com ([USB-A YubiKey 5 NFC tray of 50](https://www.yubico.com/de/product/yubikey-5-nfc-tray-of-50-rd/)). YubiEnterprise Subscription is available for organizations with 500+ users with services charged per license per end user, replacement allowance, and second-key discount ([YubiEnterprise Delivery Pricing PDF](https://console.yubico.com/help/_static/YubiEnterprise-Delivery-Pricing-EXTERNAL.pdf), [YubiEnterprise Modes of Purchase](https://console.yubico.com/help/Modes_of_Purchase.html)).
- **Pricing — IdP:** WebAuthn is included in basically every modern IdP's MFA tier; no per-authentication cost.
- **Rate limits:** None on the WebAuthn ceremony itself; bound by the IdP's login rate limits.

## fields_returned

WebAuthn registration ceremony returns:

- `credentialId` (the public credential identifier)
- `publicKey`
- `attestationStatement` (with AAGUID, FIPS status, hardware-protection bit)
- `authenticatorAttachment` (`platform` vs `cross-platform`)
- `transports` (`usb`, `nfc`, `ble`, `internal`)
- `aaguid` (load-bearing — this is what the enterprise allowlist is keyed on)

WebAuthn assertion (per login) returns:
- `credentialId`, `signature`, `userHandle`, `authenticatorData`, `clientDataJSON`
- The IdP can derive `acr=phr` (phishing-resistant) and `amr=["hwk","fido"]` for the OIDC token sent to the relying party.

## marginal_cost_per_check

- **Per authentication:** $0 incremental.
- **Per customer (one-time hardware):** **~$50** for a YubiKey 5 NFC at retail; bulk trays of 50 reduce per-unit price somewhat. Recommended to issue **two keys per user** (primary + spare) per Yubico best practice, so **~$100 per customer**.
- **Setup cost:** Engineering time for IdP configuration (1–2 weeks), customer-communication and training (PM time), and procurement / shipping logistics. [best guess: 2–4 engineer-weeks plus a meaningful operations program for 100s–1000s of customers.]
- **Replacement / lost token allowance:** YubiEnterprise Subscription includes a 25% replacement allowance per the Yubico pricing PDF.

## manual_review_handoff

SOP for enrollment and ongoing operations:

1. **Initial enrollment:** when a customer first becomes eligible for SOC orders, they receive (or already have) a YubiKey. The WebAuthn registration ceremony is performed in-app; the IdP records the AAGUID and validates it against the allowlist.
2. **Allowlist enforcement:** if the AAGUID is not on the allowlist (e.g., the customer tried to enroll a software passkey synced via Apple iCloud — which is exactly Method 8 in the account-hijack attacker mapping), enrollment fails with a message: "Please enroll a hardware security key issued by your institution or purchased from an approved vendor."
3. **Login:** every login on a SOC-ordering session uses the WebAuthn factor. No fallback (cross-references m16-no-sms-no-email-reset).
4. **Lost token:** customer reports loss → help-desk video-call SOP from m16-no-sms-no-email-reset, plus shipping a replacement key.
5. **Token expiry / firmware EOL:** when Yubico publishes a firmware advisory affecting an AAGUID on our allowlist, security removes that AAGUID and customers using affected keys are forced to re-enroll on a newer key.
6. **Reviewer is involved** when (a) attestation validation fails on a key the customer claims is genuine, (b) the customer cannot complete the enrollment ceremony in-product, (c) downgrade-attempt telemetry fires.

## flags_thrown

- `no_webauthn_enrolled` — customer has SOC eligibility but has not enrolled a hardware token. **Action:** block SOC ordering until enrolled.
- `webauthn_attestation_failed` — attempted enrollment with a non-allowlisted AAGUID. **Action:** explain, point to approved-vendor list.
- `webauthn_downgrade_attempt` — IdP detects a login attempt that would have been a downgrade (e.g., user-agent claims no FIDO support but the user has a passkey enrolled). **Action:** block, alert, contact user OOB. ([Petri — New Downgrade Attack Targeting FIDO Passkeys](https://petri.com/downgrade-attack-fido-passkey-security/), [BleepingComputer — New downgrade attack can bypass FIDO auth in Microsoft Entra ID](https://www.bleepingcomputer.com/news/security/new-downgrade-attack-can-bypass-fido-auth-in-microsoft-entra-id/))
- `webauthn_credential_revoked` — credential was revoked due to a firmware advisory. **Action:** force re-enroll on next login.

## failure_modes_requiring_review

- **Customer cannot use a hardware key** (no USB ports, browser doesn't support WebAuthn — increasingly rare, but Safari + iOS combinations still have edge cases). Reviewer-approved alternative: a managed mobile passkey on a registered device with attestation. Adds attack surface; reviewer must explicitly approve.
- **Customer in a country where importing security tokens is restricted** (e.g., some encryption-control regimes). Hard structural problem — note in the customer record.
- **Lost both primary and backup keys.** Help-desk SOP plus IDV plus institutional security contact notification.
- **Yubico supply chain issue** — the [Infineon EUCLEAK side-channel disclosure](https://www.bleepingcomputer.com/news/security/infineon-bug-in-billions-of-tpms-allows-cloning-of-cryptographic-keys/) [unknown — searched for: "Infineon EUCLEAK Yubico advisory affected AAGUIDs"] required Yubico to revoke certain firmware AAGUIDs. Process must handle this kind of recall.
- **Enterprise SSO upstream** that doesn't honor the WebAuthn requirement when the customer logs in via federation. Must require WebAuthn at the upstream IdP too, or pin federation off for SOC accounts.

## false_positive_qualitative

- **Field researchers** (cruise ships, remote field stations) where shipping a token replacement is impractical. Friction-cost.
- **New employees** in the gap between hire date and token arrival. Predictable, requires onboarding workflow.
- **Customers in countries with limited Yubico distribution.** Operationally hard.
- **Customers with disabilities** that make hardware tokens infeasible. Reviewer-approved alternative path required.

## record_left

- **WebAuthn credential record** in the IdP: `credentialId`, `aaguid`, `enrollment_timestamp`, `attestation_chain`. The attestation chain is the load-bearing audit artifact: an investigator can prove the key was genuine YubiCo hardware at the moment of enrollment, not a software passkey.
- **Per-login authenticator-data** with the signature counter (catches cloned credentials — if the counter ever decreases, the IdP rejects).
- **Procurement record:** which YubiKey serial number was shipped to which customer, for the YubiEnterprise pre-registration path.

## attacker stories addressed (cross-ref)

- **account-hijack Method 4 (AitM phishing relay / Tycoon 2FA / EvilProxy):** directly closed — WebAuthn binds to the relying-party origin, so a relay phishing site cannot collect a usable signature.
- **account-hijack Method 5 (FIDO downgrade):** mitigated only if the IdP enforces "phishing-resistant only" with no fallback. With Okta's "Create phishing-resistant app sign-in policies" + downgrade telemetry, addressable; without it, the bypass survives. The 2025 [Proofpoint demonstration](https://www.proofpoint.com/us/blog/threat-insight/dont-phish-let-me-down-fido-authentication-downgrade) and [BleepingComputer report](https://www.bleepingcomputer.com/news/security/new-downgrade-attack-can-bypass-fido-auth-in-microsoft-entra-id/) confirm the attack works against IdPs with fallback enabled.
- **account-hijack Method 8 (compromise cloud account to inject a passkey):** addressable IF the AAGUID allowlist excludes synced passkey AAGUIDs (Apple iCloud, Google Password Manager). ([WorkOS — Passkeys stop phishing. Your MFA fallbacks undo it.](https://workos.com/blog/passkeys-stop-ai-phishing-mfa-fallbacks))
- **account-hijack Methods 1, 6 (MFA reset via email recovery, SIM-jacking):** not addressed by hardware tokens alone — those bypass the factor entirely. Cross-references m16-no-sms-no-email-reset.
- **credential-compromise (TOTP re-enrollment after password reset):** addressed if the IdP also blocks TOTP enrollment. Cross-references m16-no-sms-no-email-reset.
