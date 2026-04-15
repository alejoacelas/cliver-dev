# 04C claim check — m17-predecessor-reidv v1

## Claims spot-checked

- **Stripe Identity $1.50/verification, no minimums** — appears in [Index.dev IDV comparison](https://www.index.dev/skill-vs-skill/authentication-stripe-identity-vs-onfido-vs-persona) per search summary; consistent with the [Stripe Identity product page](https://stripe.com/identity). PASS.
- **Persona starts at $250/month** — sourced from Index.dev. PASS.
- **ID.me is IAL2/AAL2 compliant** — per Best AI Agents pricing comparison; ID.me also documents this on its own site, this claim is well-established. PASS.
- **Onfido enterprise contracts $50K–$200K/year** — from [Switch Labs 2025 market guide](https://www.switchlabs.dev/post/fraud-prevention-identity-verification-software-complete-market-guide-2025). PASS.
- **NIST 800-63A binding language** — supported by [NIST SP 800-63A IAL pages](https://pages.nist.gov/800-63-4/sp800-63a/ial/). PASS.
- **Step-up authentication is appropriate for high-risk transactions** — supported by [Auth0](https://auth0.com/blog/what-is-step-up-authentication-when-to-use-it/) and [Ping Identity](https://www.pingidentity.com/en/resources/blog/post/step-up-authentication.html). PASS.

## Flags

- **UPGRADE-SUGGESTED:** Friction drop-rate of "5–20%" is presented as a best-guess without a citation. If this becomes load-bearing for the synthesis stage, search for "identity verification drop-off rate", "IDV abandonment rate" in v2.
- **OVERSTATED (minor):** the document treats Stripe Identity / Persona / Onfido as IAL2-conformant by implication. Stripe Identity in particular is **not** formally certified to NIST 800-63A IAL2 (no published Kantara or NIST SP 800-63A conformance assessment exists for it as of writing). The document should explicitly note this — "vendor advertises IAL2-equivalent flow; ID.me is the only major vendor with documented IAL2 compliance language." Recommend tightening in v2.

**Verdict:** REVISE (one OVERSTATED flag worth tightening; everything else PASS)
