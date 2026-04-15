# m14-login-gov-id-me — Implementation research v1

- **measure:** M14 — identity-evidence-match
- **name:** Federated IAL2 via Login.gov / ID.me / GOV.UK One Login
- **modes:** D

## summary

Federated identity-proofing: instead of re-implementing IAL2 evidence collection in-house, the synthesis provider redirects the customer to a federated IDP (Login.gov for US-government users, ID.me for cross-sector US, or GOV.UK One Login for UK), and consumes the resulting OIDC `id_token` plus userinfo claims as the M14 evidence-match artifact. The IDP holds the documentary evidence and biometric record; the synthesis provider holds only the verified claims and the assertion. This dramatically reduces vendor exposure and produces an audit trail at the federation layer, but is structurally limited to user populations that already have (or are willing to create) a federated identity.

## attacker_stories_addressed

- credential-compromise (Branch A) — federated MFA + IDP-side re-proofing closes some ATO paths
- account-hijack (Branch C) — IDP biometric stack absorbs the deepfake/morph attack surface
- dormant-account-takeover (Branch D) — IDP can detect re-binding events
- bulk-order-noise-cover (Branch E) — federated assertion uniquely identifies the human, not the institutional account

Federated IDPs do NOT address fronted-accomplice branches (shell-nonprofit, biotech-incubator-tenant, cro-identity-rotation), nor inbox-compromise branches that bypass the customer portal entirely.

## external_dependencies

- Login.gov (GSA-operated; OIDC + SAML; US federal-government use cases) [source](https://developers.login.gov/overview/)
- ID.me (private CSP; OIDC/OAuth2; commercial + government) [source](https://developers.id.me/documentation)
- GOV.UK One Login (UK Cabinet Office / GDS; OIDC; UK service use cases) — out of US/private-sector scope but listed for completeness
- OIDC client libraries on the synthesis provider side

## endpoint_details

### Login.gov

- **Developer hub:** https://developers.login.gov/ [source](https://developers.login.gov/overview/)
- **OIDC authorization endpoint:** `https://secure.login.gov/openid_connect/authorize` (production); `https://idp.int.identitysandbox.gov/openid_connect/authorize` (sandbox) [source](https://developers.login.gov/oidc/authorization/)
- **Token endpoint, userinfo, JWKS, discovery:** `https://secure.login.gov/.well-known/openid-configuration`
- **Auth model:** OIDC (OAuth 2.0). Confidential clients only. Authentication to the token endpoint is via `private_key_jwt` (client must register a public key during partner onboarding) — Login.gov does NOT support `client_secret_basic`. Conformant with the [iGov OIDC profile].
- **IAL2 ACR:** request `acr_values=urn:acr.login.gov:verified-facial-match-required` (or `…verified-facial-match-preferred`) to force the IDP to perform IAL2 with facial match per NIST 800-63-3 [source](https://developers.login.gov/oidc/authorization/) [source](https://login.gov/partners/program-updates/login-gov-now-offers-an-ial2-compliant-identity-verification-service/).
- **Partner onboarding:** Partner Portal account → sandbox → IAA (Interagency Agreement) → production. Login.gov is GSA-operated and historically restricted to federal agencies; state/local and private sector access is constrained and subject to GSA policy [source](https://www.govtech.com/gov-experience/can-the-federal-login-gov-find-more-state-and-city-users).
- **Pricing:** Authentication billed per monthly active user; identity proofing billed on a multi-year credential lifecycle. GSA introduced a revised pricing structure July 2024 claimed to reduce IDV costs by up to 70% [source](https://fedscoop.com/login-gov-facing-technical-difficulties-cost-uncertainty/). Specific per-transaction figures `[unknown — searched for: "Login.gov pricing per transaction", "Login.gov IAL2 cost agency", "GSA Login.gov fee schedule 2025"]`.
- **Private-sector availability for a DNA synthesis provider:** [vendor-gated and likely structurally unavailable — Login.gov is currently scoped to federal/state/local government use cases. A private-sector DNA synthesis company would not normally be eligible. Would require GSA policy exception or routing through a federal partner agency.]

### ID.me

- **Developer hub:** https://developers.id.me/documentation [source](https://developers.id.me/documentation)
- **OIDC/OAuth base:** `https://api.id.me/oauth/` (authorization), `https://api.id.me/oauth/token` (token), `https://api.id.me/api/public/v3/attributes.json` (attributes endpoint).
- **Auth model:** OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636) required [source](https://docs.id.me/guides/o-auth-2-0/overview). Access tokens expire 5 minutes after issuance.
- **Compliance posture:** ID.me's Identity Gateway includes a CSP certified at NIST 800-63-2 LOA3 and NIST 800-63-3 IAL2/AAL2; Kantara-listed [source](https://developers.id.me/documentation/identity-gateway/credential-broker/identity-verification).
- **IAL2 trigger:** request the appropriate scope/policy for the partner's group + verification level; partner onboarding configures whether the user must complete document + selfie + database + (optional) video chat trusted-referee fallback.
- **Verified attributes (scopes):** standard OIDC `openid`, `profile`, `email`; ID.me-specific scopes for `verified_first_name`, `verified_last_name`, `verified_birth_date`, `verified_phone`, `verified_email`, `verified_address`, plus group affiliation scopes (military, medical, government, student, teacher, first responder).
- **Pricing:** Commercial = tiered subscription or pay-per-verification; government = per successful verification under multi-year contracts [source](https://sacra.com/c/id-me/). Specific per-verification commercial rate `[unknown — searched for: "ID.me commercial pricing per verification", "ID.me cost per IAL2 transaction", "ID.me Sacra pricing 2024", "ID.me enterprise IDV cost"]`. List rate `[vendor-gated]`.
- **Rate limits:** [unknown — searched for: "ID.me API rate limit", "developers.id.me throttling", "ID.me access token quota"]
- **ToS constraints:** ID.me has been the subject of FTC consent action (2024) over deceptive claims about face matching being optional; integrators should ensure user-facing copy is accurate. Not directly disqualifying but adds reputational/legal review burden.

### GOV.UK One Login

- **Developer hub:** https://www.sign-in.service.gov.uk/ (UK Cabinet Office / GDS).
- Out of practical scope for a US DNA synthesis provider unless serving UK government researchers; included only for completeness. Same OIDC pattern, IAL2-equivalent under UK GPG 45.

## fields_returned

**Login.gov OIDC userinfo (IAL2 with facial match) — typical claims:**
- `sub` (UUID stable per RP), `iss`, `email`, `email_verified`
- `given_name`, `family_name`, `birthdate`, `address` (formatted, street, locality, region, postal_code, country)
- `phone`, `phone_verified`
- `social_security_number` (only if scoped + permitted)
- `verified_at` (timestamp of most recent IAL2 verification), `ial` (assurance level)
- `acr` reflecting requested ACR

**ID.me userinfo / attributes:**
- `sub`, `email`, `verified` (boolean), `verified_first_name`, `verified_last_name`, `verified_birth_date`, `verified_phone`, `verified_address`
- `groups[]` (military, medical, government, student, teacher, first responder, nurse, etc.)
- `affiliation_status`, `verification_level` (LOA1/LOA3/IAL2/AAL2)

[source](https://developers.login.gov/oidc/authorization/) [source](https://developers.id.me/documentation)

## marginal_cost_per_check

- **Login.gov:** [vendor-gated — GSA pricing schedule not public. Revised structure July 2024 claims up to 70% reduction. Per-transaction figure unknown. The relevant gate is structural availability, not cost.]
- **ID.me commercial:** [best guess: $2.00–$5.00 per IAL2 verification on a small commercial contract. Reasoning: ID.me commands a price premium over Onfido/Jumio/Persona due to its CSP role, government certifications, and inability to be self-served at low volume; comparable enterprise IDV vendors at this assurance level cluster $1.50–$3.50 and ID.me sits at the upper end per industry comparisons.] Setup: [vendor-gated — likely six-figure annual commitment for commercial integrators at the IAL2 tier].

## manual_review_handoff

Federated IDV is structurally a black-box from the synthesis provider's perspective: the provider sees only the boolean outcome of the IDP's flow, not the document images or selfie. Manual review on the synthesis-provider side is therefore limited to:

1. **`verified = false` or absence of expected verified claims:** the customer either canceled, failed at the IDP, or did not consent to share scopes. Reviewer asks the customer to retry the federated flow with clearer instructions; if they refuse the federated flow entirely, fall back to a vendor IDV (Jumio/Onfido/Persona) per provider policy.
2. **Verified claim inconsistency with synthesis-provider account record:** the federated `given_name`/`family_name`/`birthdate` does not match the customer's stored profile. Reviewer asks the customer to update one or the other and re-attest; persistent mismatch escalates to compliance.
3. **`verified_at` stale beyond the provider's policy window:** trigger a re-authentication with `prompt=login` and the IAL2 ACR.
4. **Group-affiliation claim relied upon (ID.me only):** verify the affiliation is consistent with the customer's institutional account.
5. **Disputed identity:** the synthesis provider cannot adjudicate IDP-side fraud directly. Refer the customer to the IDP's own dispute process and place the SOC order on hold pending resolution.

There is no equivalent of the Jumio/Onfido/Persona dashboard for inspecting captured documents.

## flags_thrown

- `federated_unverified` — userinfo lacks `verified=true` or the IAL2 verified-* claims. Action: deny SOC order pending retry.
- `federated_claim_mismatch` — federated claim differs from account record. Action: clarification + compliance review.
- `federated_stale_proof` — `verified_at` older than provider policy window. Action: force re-auth.
- `federated_acr_downgrade` — IDP returned an ACR weaker than requested. Action: deny + re-prompt with `acr_values` strict.
- `federated_consent_denied` — customer refused to share required scopes. Action: deny + offer vendor-IDV fallback.

## failure_modes_requiring_review

- IDP outage / token endpoint 5xx → fail-closed for SOC orders, retry with backoff.
- JWKS rotation not picked up by RP cache → assertion validation failure → cache refresh.
- Customer cannot create a federated identity (no qualifying documents for Login.gov; no qualifying group for ID.me) → no federated path; fall back to vendor IDV.
- Login.gov private-sector eligibility denied → use ID.me only.
- ID.me trusted-referee video chat queue overflow → user blocked at IDP layer; provider sees only failure, not cause.
- ACR coercion edge cases (IDP downgrades silently) → audit ACR on every assertion.

## false_positive_qualitative

- US researchers without a Login.gov / ID.me account: most academic researchers have neither unless they have already used IRS / VA / SBA / state UI services that gate on these IDPs. Coverage gap is severe outside the federal-services population.
- International researchers (the majority of academic biology) — neither Login.gov nor ID.me will verify them. GOV.UK One Login covers UK only. Effectively zero coverage for non-US/UK researchers.
- US researchers whose ID is recently expired or whose name has changed since their last IDP verification.
- Privacy-conscious researchers who refuse to enroll with ID.me (FTC consent action created reputational headwinds).
- Organizational accounts where the orderer is a lab manager, not the PI — federated IDV is per-human, not per-role.

## record_left

For each invocation: the OIDC `id_token` JWT (signed by the IDP), the userinfo response payload, the `acr` and `verified_at` claims, and the timestamp of validation. The synthesis provider does NOT hold the underlying document images; the audit trail is the signed assertion + the IDP's own retention. Auditable artifact suitable for regulator review IF the regulator accepts that the federation assertion meets M14's evidence-match requirement.

## bypass_methods_known / uncovered

(Stage 5. Federated IDV pushes the bypass surface to the IDP — the synthesis provider inherits whatever attacks are viable against Login.gov / ID.me's own document + selfie pipeline. Cannot resist fronted-accomplice, ATO if the IDP session is reused, or social-engineer-the-trusted-referee on ID.me's video chat fallback.)

---

## Sources

- https://developers.login.gov/overview/
- https://developers.login.gov/oidc/authorization/
- https://login.gov/partners/program-updates/login-gov-now-offers-an-ial2-compliant-identity-verification-service/
- https://www.login.gov/partners/our-services/
- https://www.login.gov/partners/program-updates/is-ial2-right-for-you/
- https://developers.id.me/documentation
- https://developers.id.me/documentation/identity-gateway/credential-broker/identity-verification
- https://docs.id.me/guides/o-auth-2-0/overview
- https://sacra.com/c/id-me/
- https://fedscoop.com/login-gov-facing-technical-difficulties-cost-uncertainty/
- https://www.biometricupdate.com/202506/login-gov-stumbles-in-federal-effort-to-modernize-digital-identity
- https://www.govtech.com/gov-experience/can-the-federal-login-gov-find-more-state-and-city-users
