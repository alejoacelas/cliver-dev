# m14-fido2-stepup — Implementation research v1

- **measure:** M14 — identity-evidence-match
- **name:** FIDO2 / WebAuthn order-time step-up + device binding
- **modes:** D, A

## summary

At order time, the synthesis provider's customer portal demands a fresh WebAuthn assertion (`navigator.credentials.get`) from a FIDO2 authenticator that was bound to the customer's account during onboarding. The assertion is `userVerification: required` so the authenticator (a YubiKey, an in-device passkey, or a platform authenticator) compels biometric or PIN-based user verification on every order. This re-binds the human at the keyboard to the order itself. It does NOT prove identity to a documentary standard (that's M14's job via Jumio/Onfido/Persona/etc.), but it does prove that *the same human who completed onboarding IDV is the one placing this specific order*. Pairs with `max_age=0` SOP from M16. Phishing-resistant per NIST SP 800-63B-4 [source](https://www.yubico.com/blog/nist-sp-800-63-4-what-the-new-phishing-resistant-definition-means-for-federal-agencies/).

## attacker_stories_addressed

- credential-compromise (Branch A) — defeats password-only ATO, defeats SIM-swap (no SMS in the loop), defeats most session-hijack patterns since the assertion is bound to a fresh challenge per order
- account-hijack (Branch C) — phishing-resistant; the attacker cannot proxy the WebAuthn handshake through a phishing site (assertion includes the RP origin)
- dormant-account-takeover (Branch D) — IT admin reactivating an old account does not have the original holder's authenticator; would need to enroll a new one, which can be gated on a fresh IAL2 re-proof
- bulk-order-noise-cover (Branch E) — locks the assertion to a specific human-bound credential, not the institutional account

Does NOT address: fronted-accomplice branches (the accomplice's authenticator is genuinely theirs and they really are present at order time); inbox-compromise (bypasses the portal entirely); social-engineering of customer support to re-enroll an authenticator under attacker control.

## external_dependencies

- WebAuthn-capable browser (all major browsers since 2019)
- A FIDO2 authenticator: hardware security key (YubiKey, Token2, Feitian, SoloKey) OR platform authenticator (Touch ID, Windows Hello, Android biometric) OR cross-device passkey
- Open-source server library: `@simplewebauthn/server` (TypeScript), `webauthn4j` (Java), `py_webauthn` (Python), `go-webauthn` (Go) — all free, MIT-licensed [source](https://simplewebauthn.dev/docs)
- (Optional) FIDO Metadata Service (MDS) for attestation validation against trusted authenticator AAGUIDs

## endpoint_details

- **Standards:** W3C WebAuthn Level 3 + FIDO2 CTAP2.1. Web-platform API in browsers, no remote endpoint to call. The synthesis provider implements the relying party (RP) server side using one of the open-source libraries.
- **RP server library options:** SimpleWebAuthn (TypeScript / Node), webauthn4j (Java), py_webauthn (Python), go-webauthn (Go), Yubico java-webauthn-server. All free and open source [source](https://github.com/MasterKale/SimpleWebAuthn).
- **Auth model:** WebAuthn registration/assertion ceremonies. RP holds: user handle, credential ID, public key, signature counter. No third-party API key.
- **Step-up flow:** at order submission, the RP server generates a fresh `challenge`, calls `navigator.credentials.get({ publicKey: { challenge, rpId, allowCredentials: [user's credentials], userVerification: 'required' } })`, then verifies the returned assertion server-side: signature against the stored public key, challenge match, RP ID hash match, signature counter monotonic, `flags.UV = 1` (user verification performed), `flags.UP = 1` (user presence) [source](https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/User_Presence_vs_User_Verification.html).
- **NIST AAL alignment:** WebAuthn with hardware security key + UV achieves AAL3 per NIST SP 800-63B-4; with platform authenticator + UV achieves AAL2; both are explicitly categorized as phishing-resistant in 800-63B-4 [source](https://www.yubico.com/blog/nist-sp-800-63-4-what-the-new-phishing-resistant-definition-means-for-federal-agencies/) [source](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/).
- **Rate limits:** none — entirely in-house.
- **Pricing:** library cost = $0. Hardware key cost ranges from ~$14 (Identiv uTrust FIDO2 NFC) to ~$80 (YubiKey 5C NFC ~$55, Yubico Security Key C NFC ~$30, biometric keys $40–$95) [source](https://www.corbado.com/blog/best-fido2-hardware-security-keys). Per-customer one-time hardware cost; no per-check fee.
- **ToS:** WebAuthn is an open W3C standard with no ToS attached.

## fields_returned

From a WebAuthn assertion (`PublicKeyCredential` returned by the browser):

- `id` — credential ID (base64url)
- `rawId` — raw bytes of credential ID
- `type` — `public-key`
- `response.clientDataJSON` — `{type, challenge, origin, crossOrigin}` JSON
- `response.authenticatorData` — RP ID hash, flags byte (UP, UV, BE, BS, AT, ED), signature counter, optional attested credential data
- `response.signature` — over `authenticatorData || hash(clientDataJSON)`
- `response.userHandle` — bound user handle
- After server verification: `verified: true|false`, `authenticationInfo: { newCounter, credentialID, userVerified, credentialDeviceType, credentialBackedUp, origin, rpID }` [source](https://simplewebauthn.dev/docs)

For the synthesis-provider audit trail: store the credential ID, the RP ID, the timestamp, the challenge, the assertion bytes, the new counter, and the bound user handle (i.e., which human the credential represents).

## marginal_cost_per_check

- **Per-assertion verification:** ~$0 (in-house computation, microseconds of CPU).
- **Hardware key issuance:** $14–$80 one-time per customer if the provider ships physical keys. If the provider relies on platform authenticators (Touch ID / Windows Hello / Android biometric / cross-device passkey), the marginal hardware cost is $0.
- **setup_cost:** Engineering integration ~1–2 sprint-weeks for a backend RP implementation against an open-source library. If the provider buys keys in bulk for shipping to high-risk customers: ~$15k–$50k per 1000 customers (Yubico bulk discounts available).

## manual_review_handoff

When step-up fails:

1. **`webauthn_no_credentials`** — user has no enrolled FIDO2 credential on the account. Block the SOC order; require enrollment via the standard onboarding ceremony (which itself requires fresh IAL2 to bind the new credential).
2. **`webauthn_assertion_failed`** — signature mismatch, RP ID mismatch, counter regression, or `UV = 0` when `userVerification: required`. Block the order. Investigate: counter regression suggests credential cloning (rare for hardware keys); RP ID mismatch suggests phishing; UV failure suggests authenticator misconfiguration. Compliance review.
3. **`webauthn_user_canceled`** — user dismissed the prompt. Soft-fail; allow retry up to N times; persistent cancellation may be a phishing intermediary failing to relay.
4. **`webauthn_credential_revoked`** — admin previously marked the credential lost/stolen. Block; require re-enrollment with fresh IAL2.
5. **`webauthn_attestation_unknown`** (if attestation is checked at registration time) — credential came from an unknown AAGUID not in the FIDO MDS allowlist. Compliance review.
6. **Lost token recovery:** customer lost their hardware key. Standard SOP: do NOT allow "self-service" recovery via email/SMS — that creates a phishable backdoor that defeats the entire control. Recovery must require fresh IAL2 re-proofing (Jumio/Onfido/Persona) and human approval before binding a new authenticator.

## flags_thrown

- `webauthn_no_credentials` — no enrolled credential. Action: block + enroll via fresh IAL2.
- `webauthn_assertion_failed` — signature/RP/counter/UV failure. Action: block + compliance review.
- `webauthn_user_canceled` — user dismiss. Action: soft retry; investigate persistent cancellation.
- `webauthn_credential_revoked` — admin-revoked credential. Action: block + re-enroll with IAL2.
- `webauthn_attestation_unknown` — non-allowlisted authenticator AAGUID. Action: compliance review.
- `webauthn_counter_regression` — signature counter went backward. Action: cloning suspicion; block + investigate.

## failure_modes_requiring_review

- Customer lost / damaged hardware key → recovery SOP (above).
- Browser does not support WebAuthn (rare in 2025/2026; mostly old in-house enterprise browsers).
- Cross-device passkey UX failures (QR-code handoff fails on some networks).
- Synced passkey across multiple devices: `credentialBackedUp = true` indicates a syncable passkey (Apple iCloud Keychain, Google Password Manager, 1Password, etc.). For SOC orders, the provider may want to require `credentialBackedUp = false` to compel device-bound credentials, since synced passkeys can leak via cloud account compromise.
- Authenticator firmware bugs (rare, but Yubico has issued firmware advisories).
- Social-engineering of the support desk to re-enroll an authenticator without IAL2 — this is the highest-leverage attack and the SOP must hard-block it.

## false_positive_qualitative

- New researchers who have not yet enrolled an authenticator (onboarding-in-progress).
- Customers using browsers in private/incognito mode that block credential storage (rare).
- Researchers in shared-lab contexts where the lab's machine doesn't have a platform authenticator and they don't carry a personal hardware key.
- Customers in countries where YubiKey shipping is restricted (a few sanctioned jurisdictions).
- Disability accessibility: users who cannot biometrically verify (some assistive setups) — must support PIN-based UV as an alternative path.

## record_left

For each step-up: a stored row with `{customer_id, order_id, credential_id, rp_id, challenge, client_data_json, authenticator_data, signature, new_signature_counter, timestamp, verification_result}`. Crucially, the credential ID is durable across orders, so a longitudinal audit can show that the SAME authenticator was used for the SAME human across the SOC orders that customer placed — a strong "no swap of person" guarantee. Auditable artifact suitable for regulator review.

## bypass_methods_known / uncovered

(Stage 5. WebAuthn is the strongest available phishing-resistant authentication; the unaddressed bypasses are all out-of-protocol: support-desk social engineering for re-enrollment, fronted-accomplice with their own authenticator, theft+coercion of the legitimate user with their key.)

---

## Sources

- https://www.w3.org/TR/webauthn-3/
- https://fidoalliance.org/fido2-2/fido2-web-authentication-webauthn/
- https://pages.nist.gov/800-63-4/sp800-63b/authenticators/
- https://www.yubico.com/blog/nist-sp-800-63-4-what-the-new-phishing-resistant-definition-means-for-federal-agencies/
- https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/User_Presence_vs_User_Verification.html
- https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/Integration_Review_Standard_FIDO.html
- https://github.com/MasterKale/SimpleWebAuthn
- https://simplewebauthn.dev/docs
- https://www.corbado.com/blog/best-fido2-hardware-security-keys
- https://www.corbado.com/blog/webauthn-server-implementation
- https://blog.hypr.com/nist-sp-800-63-3-digital-identity-guidelines-review
- https://en.wikipedia.org/wiki/WebAuthn
