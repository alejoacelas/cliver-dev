# Coverage research: Hosted IdP MFA + step-up (Auth0 / Okta / Cognito)

## Coverage gaps

### Gap 1: Customers who have not enrolled a phishing-resistant factor (passkey)
- **Category:** Existing customers on the provider's platform who have not yet enrolled a FIDO2/WebAuthn passkey. They may have TOTP or SMS as their second factor (or no second factor at all). When an SOC order triggers step-up, these customers cannot complete the passkey challenge.
- **Estimated size:** Consumer passkey adoption is ~69% awareness and ~55-60% mobile enrollment as of 2025 ([FIDO Alliance 2025 report](https://fidoalliance.org/fido-alliance-champions-widespread-passkey-adoption-and-a-passwordless-future-on-world-passkey-day-2025/)). However, desktop adoption is ~20% ([Authsignal](https://www.authsignal.com/blog/articles/passwordless-authentication-in-2025-the-year-passkeys-went-mainstream)). For a synthesis provider whose customer base skews toward researchers using desktop lab computers, actual passkey enrollment could be substantially lower. [best guess: at the time of initial rollout, 30-60% of existing customers would lack a passkey, depending on whether the provider mandates enrollment before the first SOC order.]
- **Behavior of the check on this category:** false-positive (`mfa_not_enrolled` fires; the order is blocked until the customer enrolls a passkey, which requires a separate enrollment ceremony). The customer is legitimate but cannot complete the purchase.
- **Reasoning:** The implementation routes `mfa_not_enrolled` to a reviewer who initiates enrollment. The friction is bounded (one-time passkey enrollment, ~2-5 minutes) but creates a significant adoption barrier at rollout. The `mfa_recent_enroll` flag (passkey enrolled <48h before SOC order) adds further friction.

### Gap 2: Customers in shared-device laboratory environments
- **Category:** Researchers in shared lab spaces who use communal computers and do not have personal devices available for passkey enrollment. The registered passkey belongs to a colleague or to the lab's shared device, not to the specific customer.
- **Estimated size:** [best guess: 5-15% of academic customers work primarily on shared lab computers. No published data on shared-device prevalence in synthesis-ordering contexts. Searched for: "shared computer laboratory research percentage", "academic lab shared workstation prevalence" -- no quantitative data found.]
- **Behavior of the check on this category:** false-positive (`mfa_failed` or the customer cannot complete enrollment; the passkey is bound to a device they don't personally control).
- **Reasoning:** FIDO2 passkeys are device-bound (non-syncable hardware keys) or account-bound (syncable passkeys via Apple/Google). In shared-device environments, a hardware key is personal but requires the customer to carry it; a syncable passkey requires a personal cloud account. Neither maps cleanly to a shared-lab-computer workflow.

### Gap 3: Customers whose institutional security policy prohibits third-party identity enrollment
- **Category:** Researchers at institutions (government labs, defense contractors, some pharmaceutical companies) whose IT security policies prohibit enrolling personal devices in third-party identity systems. The provider's IdP is a third party from the institution's perspective.
- **Estimated size:** [best guess: 3-8% of customers. Government and defense-adjacent customers are a small but meaningful segment. Searched for: "enterprise BYOD prohibition rate government laboratories", "institutional policy third-party identity enrollment restriction" -- no specific data found.]
- **Behavior of the check on this category:** false-positive (`mfa_not_enrolled`; the customer is structurally unable to comply). The customer may require a federated identity flow through their institution's IdP, which may not enforce phishing-resistant MFA at the level the provider requires.
- **Reasoning:** The implementation identifies the federated-IdP problem: "if the customer's SSO provider relaxes MFA at the IdP layer, the synthesis provider's IdP only sees the federated assertion." The mitigation (require a passkey at the synthesis provider's IdP in addition to federation) conflicts with the institution's policy.

### Gap 4: Customers traveling internationally (adaptive risk false-positives)
- **Category:** Researchers attending conferences, on sabbatical, or conducting fieldwork abroad. Adaptive MFA risk engines flag geo-velocity changes, new devices, and unfamiliar networks.
- **Estimated size:** [best guess: at any given time, 3-5% of active academic customers are traveling internationally. Academic conference travel is seasonal (heavy in June-September). Searched for: "academic researcher international travel frequency percentage", "conference travel rate biology researchers" -- no synthesis-specific data.]
- **Behavior of the check on this category:** false-positive (`mfa_high_risk_signal` fires on geo-velocity or new-device signals; the customer is forced through additional challenges or blocked).
- **Reasoning:** The implementation acknowledges this. The false-positive is bounded (the customer can complete the challenge from abroad) but adds friction at a time when the customer may be trying to place an urgent order.

### Gap 5: Customers using outdated browsers without WebAuthn support
- **Category:** Customers on older browsers (notably Internet Explorer, pre-Chromium Edge, older Firefox ESR) or on operating systems that do not support WebAuthn.
- **Estimated size:** WebAuthn is supported on ~95% of global browsers ([Can I Use](https://caniuse.com/#search=webauthn)). The remaining ~5% are on legacy browsers. For a synthesis provider's customer base (likely skewing toward institutional IT environments that may lag on browser updates), the percentage could be slightly higher. [best guess: 2-5% of customers on browsers without WebAuthn support.]
- **Behavior of the check on this category:** false-positive (passkey enrollment fails; the customer cannot complete the step-up). The implementation notes "Customers using older browsers without WebAuthn support."
- **Reasoning:** This gap is shrinking as evergreen browsers dominate, but institutional IT environments can lag. The mitigation is to require a minimum browser version in the provider portal.

## Refined false-positive qualitative

1. **Unenrolled customers at rollout** (Gap 1): largest initial friction -- 30-60% of customers may lack passkeys at launch. One-time enrollment required.
2. **Shared-device lab environments** (Gap 2): ongoing friction for a subset of academic customers.
3. **Institutional policy conflicts** (Gap 3): structural inability to comply for government/defense-adjacent customers.
4. **International travel** (Gap 4): seasonal spikes in adaptive-risk false-positives.
5. **Legacy browsers** (Gap 5): shrinking but nonzero.

## Notes for stage 7 synthesis

- The dominant coverage limitation is adoption, not technology. WebAuthn itself is broadly supported (~95% of browsers), but customer enrollment is the bottleneck. The provider's rollout strategy (mandatory enrollment for all SOC-ordering accounts, grace period, TOTP fallback during transition) determines how many customers are affected by Gap 1.
- The shared-device problem (Gap 2) argues for allowing syncable passkeys (Apple/Google account-bound) rather than requiring hardware security keys. But syncable passkeys introduce the `passkey injection via cloud account compromise` attack vector (noted in the implementation).
- The federated-IdP gap (Gap 3) is the hardest to close. For institutions that federate identity, the provider cannot enforce phishing-resistant MFA at the federated IdP. The mitigation (require a provider-side passkey in addition to federation) is the only technical option but creates double-authentication friction.
- This idea's leverage is entirely policy-dependent. The IdP is the delivery mechanism; the coverage depends on what the provider mandates (passkey-only vs. TOTP fallback, tight auth_time windows, recovery-via-IDV).
