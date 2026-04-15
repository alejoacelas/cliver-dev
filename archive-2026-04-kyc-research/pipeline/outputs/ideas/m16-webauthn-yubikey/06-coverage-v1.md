# Coverage research: WebAuthn / YubiKey hardware token enforcement

## Coverage gaps

### Gap 1: Customers in countries with encryption-import restrictions or limited Yubico distribution
- **Category:** Customers at institutions in countries where importing cryptographic hardware tokens is restricted by law (encryption-control regimes) or where Yubico distribution is not available / logistically impractical.
- **Estimated size:** Yubico expanded YubiEnterprise Delivery to 175 countries and 24 territories as of May 2025 ([Biometric Update](https://www.biometricupdate.com/202505/yubico-simplifies-passwordless-yubikeys-for-enterprises-now-available-in-175-countries-and-24-territories)). There are ~195 UN member states, so ~20 countries lack direct Yubico distribution. The gene synthesis international market is ~45% of global revenue ([GM Insights, 2025](https://www.gminsights.com/industry-analysis/gene-synthesis-market)). [best guess: the countries without Yubico distribution are mostly small or conflict-affected states with minimal biotech activity; probably <2% of synthesis customers are affected by distribution gaps. Encryption-import restrictions (e.g., China, Russia, parts of the Middle East) are more significant — China alone represents a non-trivial share of the Asia-Pacific synthesis market. Perhaps 3–8% of global synthesis customers face either a distribution or import-restriction barrier.]
- **Behavior of the check on this category:** no-signal — customers cannot enroll a hardware token and are blocked from SOC ordering entirely, unless an alternative path is approved.
- **Reasoning:** The implementation flags this as a structural problem. For providers with significant Chinese or Middle Eastern customer bases, this is operationally significant.

### Gap 2: Customers with disabilities that make hardware tokens infeasible
- **Category:** Customers with visual, motor, or dexterity disabilities that prevent reliable use of USB insertion, NFC tap, or the physical-presence touch on a YubiKey.
- **Estimated size:** The FIDO Alliance's Passkey Accessibility resources note that people with physical disabilities face barriers with "touching a security key for user presence check, inserting a security key into a USB port, and scanning security keys via NFC" ([Passkey Central — Accessibility](https://www.passkeycentral.org/resources-and-tools/passkey-accessibility)). Approximately 16% of the global population lives with a significant disability ([WHO 2024](https://www.who.int/news-room/fact-sheets/detail/disability-and-health)). The fraction of synthesis-ordering scientists with disabilities that specifically prevent hardware-token use is much smaller. [best guess: <1% of synthesis customers, but with strong legal and ethical obligations to accommodate.]
- **Behavior of the check on this category:** no-signal — these customers cannot complete enrollment and are blocked from SOC ordering unless a reviewer-approved alternative path (e.g., managed mobile passkey on a registered device) is provided.
- **Reasoning:** The implementation flags this and proposes a reviewer-approved alternative. The alternative (managed mobile passkey) reintroduces attack surface, diluting the phishing-resistance guarantee.

### Gap 3: New customers in the gap between onboarding and token arrival
- **Category:** Newly onboarded customers who have been approved for SOC ordering but have not yet received their hardware token (shipping delay, procurement lag).
- **Estimated size:** [best guess: depends on the provider's logistics. YubiEnterprise Delivery ships to 175 countries but delivery times vary. For domestic US customers: 3–7 business days. International: 1–3 weeks. If a new customer submits their first SOC order within the first week of onboarding, they may not yet have a token. The fraction of new-customer orders placed before token arrival is perhaps 10–20% of first-time SOC orders, but this is a transient gap per customer, not a permanent exclusion.]
- **Behavior of the check on this category:** false-positive — the customer is legitimate and approved, but the check blocks them until the token arrives and is enrolled.
- **Reasoning:** The implementation mentions this as "predictable, requires onboarding workflow." The operational impact depends on how time-sensitive the customer's first order is.

### Gap 4: Customers whose institution uses enterprise SSO that does not propagate WebAuthn requirements
- **Category:** Customers at institutions with enterprise SSO (SAML/OIDC federation) where the upstream IdP does not enforce phishing-resistant factors, even though the provider's downstream IdP requires them. The federation trust passes through a non-phishing-resistant authentication event.
- **Estimated size:** [best guess: this depends on the provider's federation architecture. If the provider requires all federated customers to authenticate via its own IdP (with WebAuthn enforcement), this gap closes. If the provider accepts federated assertions from upstream IdPs without verifying the upstream `acr`/`amr`, the gap is open. In practice, many academic institutions federate via InCommon/eduGAIN, and their IdPs may not support or enforce phishing-resistant factors. Perhaps 15–25% of academic customers authenticate via a federation path. The fraction whose upstream IdP does not enforce WebAuthn is [unknown — searched for: "InCommon eduGAIN phishing-resistant MFA adoption rate universities 2025"]. [best guess: >50% of federated academic IdPs do not yet enforce phishing-resistant MFA as of 2025, based on the general sluggish MFA upgrade pace in higher education.]
- **Behavior of the check on this category:** weak-signal — the customer appears to have authenticated with WebAuthn at the provider's IdP, but the upstream authentication that established the federation session may have been password-only or TOTP.
- **Reasoning:** The implementation flags "Enterprise SSO upstream that doesn't honor the WebAuthn requirement when the customer logs in via federation" as a failure mode. For providers that serve academic markets via federation, this is a significant structural gap.

### Gap 5: Cost barrier for small labs / independent researchers
- **Category:** Small academic labs, independent researchers, and early-stage startups for whom the $100 per-customer hardware cost (two YubiKeys at ~$50 each) is a meaningful friction, especially if the provider does not subsidize or provide tokens.
- **Estimated size:** [best guess: the cost is modest for well-funded institutions but non-trivial for PIs on limited budgets, researchers in low-income countries, or small startups. The ~45% international market includes many customers in developing economies. At $100/customer, a provider with 5,000 SOC-eligible customers faces $500K in hardware costs (or passes this to customers). The fraction who would be deterred by cost alone is [unknown — searched for: "lab equipment spending small academic lab budget", "security hardware cost barrier adoption research"]. [best guess: 5–10% of customers might delay or decline enrollment due to cost friction if the provider requires self-purchase.]
- **Behavior of the check on this category:** no-signal — customers who decline to purchase a token are blocked from SOC ordering.
- **Reasoning:** The implementation provides pricing ($25–$50 per key, $100 recommended for two). Whether this is provider-subsidized or customer-purchased matters enormously for adoption.

### Gap 6: Field researchers and remote-station scientists
- **Category:** Researchers working at remote field stations, on research vessels, or in cleanroom/BSL environments where carrying and using a USB/NFC hardware token is impractical or impossible.
- **Estimated size:** [unknown — searched for: "field research scientists remote station percentage biology"]. [best guess: a small fraction of synthesis customers — most ordering happens from offices or labs, not field stations. Perhaps 1–3% of customers at any given time are in a situation where hardware-token use is physically impractical.]
- **Behavior of the check on this category:** false-positive — the customer is legitimate but cannot authenticate. They must wait until they return to a normal environment or use a backup key.
- **Reasoning:** The implementation flags "field researchers (cruise ships, remote field stations) where shipping a token replacement is impractical." The backup-key recommendation partially mitigates but does not solve the problem for researchers who lose or forget both keys in the field.

## Refined false-positive qualitative

1. **Field researchers** (stage 4 + Gap 6) — remains. Friction cost; mitigated by backup key but not eliminated.
2. **New employees in onboarding gap** (stage 4 + Gap 3) — remains. Transient but creates customer-service load.
3. **Customers in countries with limited distribution** (stage 4 + Gap 1) — upgraded to coverage gap. Not just friction — complete block for some customers.
4. **Customers with disabilities** (stage 4 + Gap 2) — upgraded to coverage gap. Requires alternative path that dilutes security.
5. **Cost-sensitive small labs** (Gap 5) — new. If provider does not subsidize tokens, this becomes a barrier to SOC-order access.
6. **Federated SSO customers** (Gap 4) — new. The check appears to pass but upstream authentication may not be phishing-resistant.

## Notes for stage 7 synthesis

- Gap 4 (federation) is the most security-significant gap: it allows the check to appear to work while the upstream authentication is weak. Providers must either (a) reject federated assertions that don't carry `acr=phr`, or (b) require WebAuthn enrollment and ceremony at their own IdP, independent of federation.
- Gap 1 (distribution/import) and Gap 5 (cost) interact: international customers in developing economies face both barriers simultaneously.
- Browser support for WebAuthn is now ~95% globally ([WebAuthn.wtf](https://webauthn.wtf/how-it-works/support)), so browser incompatibility is essentially a non-gap for modern devices.
- The hardware-token model is the strongest phishing-resistant option but its coverage is bounded by logistics (shipping, cost, physical access). Providers must budget for both the tokens and the customer-support load of the alternative paths.
