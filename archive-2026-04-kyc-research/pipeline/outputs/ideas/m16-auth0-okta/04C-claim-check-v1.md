# 4C claim check — m16-auth0-okta v1

## Verified claims

- **Auth0 Adaptive MFA exists with risk-based step-up** — https://auth0.com/docs/secure/multi-factor-authentication/adaptive-mfa. Documents adaptive MFA, risk assessment, and supported factors. **PASS.**
- **Auth0 = Okta Customer Identity Cloud (rebranded)** — confirmed via Okta blog and pricing pages. **PASS.**
- **Auth0 pricing: B2C from $35/mo essentials, $240/mo professional; B2B from $150/$800** — https://auth0.com/blog/upcoming-pricing-changes-for-the-customer-identity-cloud/. Substantively confirms tier structure. **PASS.**
- **Cognito launched native passkey/FIDO2 support Nov 2024** — confirmed via AWS partner blogs and aws-samples repo. **PASS.**
- **Cognito SMS via SNS at $0.00645/message US** — https://costgoat.com/pricing/amazon-cognito. Third-party cost guide; numbers consistent with current AWS SNS pricing. **PASS.**
- **TOTP time-sync errors ~2-5%** — sourced from the attacker-mapping document, which itself cites a Lideroo blog. **OVERSTATED if presented as authoritative**; weaken to "MFA practitioners report TOTP failures from time-sync as a common false-rejection cause." Already framed as a range.

## Flags

- **MISSING-CITATION:** "Auth0 production tenant rate limit ~50 req/sec" — best-guess in-doc. Suggested fix: cite https://auth0.com/docs/troubleshoot/customer-support/operational-policies/rate-limit-policy for the current numbers.
- **VENDOR-GATED (legitimate):** Okta detailed MFA pricing, Auth0 Enterprise FIDO2 tier specifics.

## Verdict

`REVISE-minor` — add the Auth0 rate-limit citation; otherwise claims hold.
