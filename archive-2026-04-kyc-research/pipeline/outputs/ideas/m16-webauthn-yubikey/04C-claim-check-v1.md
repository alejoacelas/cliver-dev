# 4C Claim check — m16-webauthn-yubikey v1

| Claim | URL | Verdict | Notes |
|---|---|---|---|
| Okta supports attestation validation against FIDO MDS or custom AAGUID list | https://help.okta.com/oie/en-us/content/topics/identity-engine/authenticators/configure-passkeys.htm | PASS | Okta passkeys configuration page describes attestation validation, AAGUID allowlist, and hardware-protection / FIPS bits. |
| Okta has phishing-resistant app sign-in policy guide | https://help.okta.com/oie/en-us/content/topics/identity-engine/authenticators/pr-set-up-policies.htm | PASS | Okta page on phishing-resistant authentication policies exists. |
| YubiKey costs $25 (Security Series) to ~$95 (FIPS) | https://www.keytos.io/blog/passwordless/how-much-does-a-yubikey-cost.html | PASS | Keytos blog cites these price points; consistent with Yubico's public store. |
| Yubico sells trays of 50 YubiKey 5 NFC | https://www.yubico.com/de/product/yubikey-5-nfc-tray-of-50-rd/ | PASS | Yubico product page exists for the tray. |
| YubiEnterprise Subscription pricing PDF | https://console.yubico.com/help/_static/YubiEnterprise-Delivery-Pricing-EXTERNAL.pdf | PASS | Yubico's enterprise pricing PDF is published; contains the 25% replacement and second-key discount terms. |
| Proofpoint demonstrated FIDO downgrade attack | https://www.proofpoint.com/us/blog/threat-insight/dont-phish-let-me-down-fido-authentication-downgrade | PASS | Proofpoint blog post on FIDO downgrade attack exists. |
| BleepingComputer FIDO downgrade in Microsoft Entra ID | https://www.bleepingcomputer.com/news/security/new-downgrade-attack-can-bypass-fido-auth-in-microsoft-entra-id/ | PASS | Story is real and describes the user-agent-spoofing downgrade. |
| Petri article on FIDO passkey downgrade | https://petri.com/downgrade-attack-fido-passkey-security/ | PASS | Article exists. |
| WorkOS blog on passkey fallback elimination | https://workos.com/blog/passkeys-stop-ai-phishing-mfa-fallbacks | PASS | Blog post exists; quotes match reporting. |
| Google deployed security keys, zero successful phishing across 85k employees | (referenced via WorkOS blog) | OVERSTATED-OK | This claim is widely sourced (Krebs 2018) and the document attributes it via WorkOS, not as a primary claim. Acceptable. |
| Infineon EUCLEAK Yubico advisory | (marked unknown) | PASS-as-unknown | Document explicitly leaves the affected-AAGUIDs question unresolved. |

No `BROKEN-URL`, `MIS-CITED`, or hard `OVERSTATED` flags.

## Verdict

**PASS**
