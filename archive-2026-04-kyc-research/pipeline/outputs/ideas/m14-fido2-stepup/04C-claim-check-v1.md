# 04C claim-check v1 — m14-fido2-stepup

## Verified

- **WebAuthn UV options DISCOURAGED / PREFERRED / REQUIRED, semantics as documented.** Yubico developer guide page on User Presence vs. User Verification documents these verbatim. PASS.
- **NIST SP 800-63B-4 explicitly categorizes FIDO2/WebAuthn as phishing-resistant; AAL2 with platform authenticator + UV; AAL3 with hardware key + UV.** Yubico blog post on 800-63-4 and NIST 800-63B-4 authenticators page both confirm. PASS.
- **SimpleWebAuthn is MIT-licensed open source, with `@simplewebauthn/server` for assertion verification on Node.** GitHub repo and simplewebauthn.dev documentation confirm. PASS.
- **Hardware key prices:** Identiv uTrust FIDO2 NFC ~$14, Yubico Security Key C NFC ~$30, YubiKey 5C NFC ~$55, biometric keys $40–$95. Corbado blog "Best FIDO2 Hardware Security Keys" enumerates these. PASS — STALE-RISK low (prices stable).
- **WebAuthn assertion verification: signature over `authenticatorData || hash(clientDataJSON)`, RP ID hash check, counter monotonicity, UV/UP flag check.** Standard W3C WebAuthn Level 3 spec; widely documented. PASS.
- **`credentialBackedUp` flag indicates syncable passkey** (Apple iCloud Keychain etc.). This is documented in the W3C WebAuthn Level 3 spec under the BS (backup state) flag. PASS.

## Flags

- **MISSING-CITATION (very minor):** v1's claim that "WebAuthn assertion includes the RP origin" is correct (the `clientDataJSON` field carries the origin and the assertion signature covers its hash) but the v1 doc cites only the Yubico developer guide. Suggested fix: cite the W3C WebAuthn Level 3 spec or webauthn.guide directly.
- **OVERSTATED (minor):** v1 says synced passkeys "can leak via cloud account compromise." This is true but worth tightening — the leak vector is the cloud sync provider, not the WebAuthn protocol. The recommendation to require `credentialBackedUp = false` is sound for high-assurance use cases. NO-FIX-NEEDED; v1 phrasing is accurate.
- **UPGRADE-SUGGESTED:** Bulk-pricing for YubiKey enterprise deployment ($15k–$50k per 1000 customers). Yubico publishes enterprise volume tiers; suggested search: `Yubico enterprise volume pricing key program`.

## Verdict

PASS — no critical issues. Document is solid as v1.
