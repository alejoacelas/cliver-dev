# 4F Form check — m16-webauthn-yubikey v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / modes / summary | PASS | concrete; emphasizes the no-fallback requirement |
| attacker_stories_addressed | PASS | maps to 5 specific account-hijack methods, clearly notes which are addressable and which need sibling ideas |
| external_dependencies | PASS | YubiKey, IdP, distribution program, YubiEnterprise all named |
| endpoint_details | PASS | Okta config path with attestation/AAGUID enforcement cited; pricing real numbers |
| fields_returned | PASS | WebAuthn registration + assertion fields concretely listed; AAGUID flagged load-bearing |
| marginal_cost_per_check | PASS | $0/auth, ~$50–$100 hardware/customer with Yubico cite, setup-cost best guess |
| manual_review_handoff | PASS | 6-step SOP from enrollment to firmware EOL |
| flags_thrown | PASS | 4 distinct flags including downgrade attempt |
| failure_modes_requiring_review | PASS | 5 modes incl. supply chain (EUCLEAK marked unknown for AAGUID list) and federated SSO upstream |
| false_positive_qualitative | PASS | 4 categories incl. accessibility |
| record_left | PASS | attestation chain flagged as load-bearing audit |

## For 4C to verify

- Okta supports certificate-based attestation validation and AAGUID allowlist — verify [Okta Configure Passkeys docs](https://help.okta.com/oie/en-us/content/topics/identity-engine/authenticators/configure-passkeys.htm).
- Okta has a "Create phishing-resistant app sign-in policies" doc — verify [the URL](https://help.okta.com/oie/en-us/content/topics/identity-engine/authenticators/pr-set-up-policies.htm).
- YubiKey 5 NFC retail price $50 / FIPS series ~$95 — verify [Keytos blog on YubiKey cost](https://www.keytos.io/blog/passwordless/how-much-does-a-yubikey-cost.html).
- YubiEnterprise Subscription includes 25% replacement allowance and second-key discount — verify [YubiEnterprise Delivery Pricing PDF](https://console.yubico.com/help/_static/YubiEnterprise-Delivery-Pricing-EXTERNAL.pdf).
- Petri / BleepingComputer FIDO downgrade attack stories — verify both URLs resolve and describe the attack as claimed.
- Proofpoint blog "Don't Phish-let Me Down" exists — verify URL.
- WorkOS blog "Passkeys stop phishing. Your MFA fallbacks undo it." — verify URL.

## Verdict

**PASS**
