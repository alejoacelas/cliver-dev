# Coverage research: Order-time max_age=0 step-up authentication

## Coverage gaps

### Gap 1: Programmatic / API-submitted orders (LIMS-to-provider integrations)
- **Category:** Customers whose orders are submitted programmatically via a LIMS-to-provider API integration or automated pipeline, with no interactive browser session at order time.
- **Estimated size:** [unknown — searched for: "synthesis order API automated LIMS integration programmatic ordering percentage lab automation", "gene synthesis programmatic ordering percentage"]. No published figure on what fraction of synthesis orders are API-submitted. [best guess: growing segment — major providers (Twist, IDT, GenScript) all offer ordering APIs and LIMS integrations; large pharma and CRO customers are likely heavy API users. Possibly 10–30% of orders by volume at scale providers, concentrated in large commercial accounts.]
- **Behavior of the check on this category:** no-signal — an API call has no browser to redirect through an IdP. `max_age=0` requires an interactive OIDC redirect; a machine-to-machine OAuth2 `client_credentials` flow does not produce `auth_time` or `amr` claims tied to a human user.
- **Reasoning:** The implementation explicitly assumes a human-in-the-browser flow. API orders bypass the redirect entirely. An attacker with a stolen API key or compromised service account can submit SOC orders without ever triggering the step-up.

### Gap 2: Customers on IdPs that do not fully honor max_age=0
- **Category:** Customers whose institution uses a non-major or self-hosted IdP (e.g., older Keycloak, Ory Hydra, custom SAML-to-OIDC bridges) that either ignores `max_age=0`, does not return `auth_time`, or returns a cached `auth_time` from a prior session.
- **Estimated size:** [best guess: small fraction of customers. The major commercial IdPs (Okta, Auth0, Azure AD, Ping) support `max_age` correctly per OIDC Core. Keycloak issue #33641 and Ory Hydra issue #3034 document real bugs. Self-hosted open-source IdPs serve perhaps 5–15% of enterprise customers in the broader market; the fraction that misbehave on `max_age` is a subset of that. Derivation: [Okta 2024 Businesses at Work](https://www.okta.com/resources/businesses-at-work/) shows ~80%+ of enterprise IdP usage is Okta/Azure AD/Google Workspace; the remaining ~20% includes Ping, Keycloak, and others.]
- **Behavior of the check on this category:** weak-signal — the check either silently passes (if `auth_time` is returned but stale) or fails hard (if `auth_time` is missing, the implementation rejects). The former is a security gap; the latter is a false positive that blocks legitimate customers.
- **Reasoning:** The implementation notes Keycloak and Hydra quirks. Federated logins that re-pass through an upstream IdP add another layer of potential `max_age` non-compliance.

### Gap 3: Customers using shared / group accounts
- **Category:** Lab groups or core facilities where multiple researchers share a single provider account (one set of credentials, one MFA enrollment). The person completing the step-up may not be the person who decided to place the order.
- **Estimated size:** [unknown — searched for: "shared lab accounts group ordering science procurement multiple users single account"]. No published figure for synthesis providers specifically. [best guess: common in academic core facilities and small labs. Core facilities at R1 universities often operate a single procurement account per facility; there are ~130 R1 universities in the US ([Carnegie Classification](https://carnegieclassifications.acenet.edu/)), each potentially with 1–5 core facilities placing synthesis orders. The total shared-account fraction is likely 5–15% of customer accounts but a higher fraction of order volume, since core facilities aggregate orders.]
- **Behavior of the check on this category:** weak-signal — the step-up authenticates *someone* with valid credentials, but provides no assurance that the authenticated individual is the one who initiated the order. The `auth_time` + `amr` audit trail binds to the credential holder, not the order requester.
- **Reasoning:** The implementation acknowledges group accounts "violate the entire model." In practice, they are common in academic procurement. The check technically passes but provides weaker security guarantees than intended.

### Gap 4: International customers on federated SSO with upstream IdP caching
- **Category:** Customers at international institutions whose SSO federates through a national research-and-education federation (e.g., eduGAIN, InCommon) before reaching the provider's IdP. The upstream institutional IdP may cache the session and not honor `max_age=0` passed by the downstream relying party.
- **Estimated size:** North America accounts for ~55% of the DNA synthesis market; the remaining ~45% is international ([Grand View Research, 2025](https://www.grandviewresearch.com/industry-analysis/us-gene-synthesis-market-report); [GM Insights, 2025](https://www.gminsights.com/industry-analysis/gene-synthesis-market)). Of those international customers, a significant fraction at academic institutions authenticate via national federations. [best guess: 15–25% of all customers are international academics whose login traverses a federation layer.] The subset whose upstream IdP ignores `max_age` is [unknown — searched for: "eduGAIN max_age OIDC compliance", "SAML force authn federation"]. [best guess: SAML's `ForceAuthn=true` is the equivalent and is widely supported, but compliance is institution-by-institution; some IdPs honor it only as advisory.]
- **Behavior of the check on this category:** weak-signal to no-signal — if the upstream IdP returns a cached session, the downstream IdP may accept it and issue a fresh-looking `auth_time` that actually reflects the upstream cache, not a true re-authentication.
- **Reasoning:** The implementation flags "federated logins where the upstream IdP re-uses cached session" as a failure mode. For international academic customers going through federation, this is structural, not an edge case.

### Gap 5: Mobile app / embedded-WebView orders
- **Category:** Customers placing orders through a provider's mobile app or an embedded WebView (e.g., a procurement portal wrapping the provider's site) where the OIDC redirect loop is technically supported but UX friction causes abandonment.
- **Estimated size:** [unknown — searched for: "gene synthesis mobile ordering percentage", "lab procurement mobile app usage"]. [best guess: small — most synthesis ordering is desktop-based. But mobile ordering is growing in pharma/biotech field settings. Probably <5% of orders today.]
- **Behavior of the check on this category:** false-positive — the check fires correctly but the UX friction of re-authenticating in a mobile WebView (especially with a hardware token requiring NFC/USB) causes legitimate customers to abandon orders or call support.
- **Reasoning:** The implementation notes "order submitted from a long-running mobile app session where re-auth is jarring" as a known friction point. Safari's ITP policies add further complexity to OIDC flows on iOS ([Auth0 — Browser Behavior Changes](https://auth0.com/blog/browser-behavior-changes-what-developers-need-to-know/)).

## Refined false-positive qualitative

Cross-referencing the gaps above with the existing false-positive list from stage 4:

1. **Bench scientists in lab gloves** (stage 4) — remains. Maps to Gap 5 (mobile/embedded) and the hardware-token friction axis from m16-webauthn-yubikey.
2. **Customers placing many small SOC-adjacent orders** (stage 4) — remains. The 5-minute batching window mitigates but does not eliminate.
3. **Group accounts** (stage 4 + Gap 3) — upgraded to a coverage gap. The step-up authenticates the wrong person.
4. **Programmatic / API orders** (Gap 1) — new. Not a false positive per se (no signal at all), but a structural bypass path.
5. **Federated SSO with upstream caching** (Gap 4) — new. Produces a false sense of coverage: the check appears to pass but the re-auth may not have happened at the upstream IdP.

## Notes for stage 7 synthesis

- Gap 1 (API orders) is the most operationally significant: it is a complete bypass for machine-to-machine flows. The implementation must define a separate authentication model for API-submitted SOC orders (e.g., short-lived signed tokens with per-order scope, requiring a human step-up to mint the token).
- Gap 4 (federation caching) interacts with the provider's IdP architecture; providers using a hub-and-spoke federation model (common in academic markets) should validate `max_age` forwarding end-to-end during integration testing.
- The check's value is highest for direct browser-based orders from customers on major commercial IdPs — this is probably the majority of orders but not all.
