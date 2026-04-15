# 04C claim-check v1 — m14-login-gov-id-me

## Verified

- **Login.gov OIDC ACR `urn:acr.login.gov:verified-facial-match-required` and `…preferred` mapping to NIST 800-63-3 IAL2.** The developers.login.gov OIDC authorization page documents both ACR values verbatim and explicitly ties them to IAL2. PASS.
- **Login.gov supports OIDC via authorization code flow on `secure.login.gov`.** The developer hub and the program update page both confirm. PASS.
- **Login.gov is GSA-operated and historically scoped to federal-government use; expansion to state/local/private under policy review.** GovTech article and the FedScoop "cost uncertainty" article both reflect this constraint. PASS — v1's `[vendor-gated and structurally unavailable]` hedge is appropriate.
- **GSA July 2024 pricing structure revision claiming up to 70% reduction in IDV cost.** FedScoop article cites this. PASS-with-stale-risk.
- **ID.me Identity Gateway includes a CSP certified at NIST 800-63-2 LOA3 and NIST 800-63-3 IAL2/AAL2.** developers.id.me identity-gateway page documents this verbatim. PASS.
- **ID.me OAuth 2.0 Authorization Code Flow with PKCE; access tokens expire 5 minutes after issuance.** docs.id.me OAuth overview page documents this. PASS.
- **Commercial pricing model: tiered subscription OR pay-per-verification.** Sacra revenue/pricing page on ID.me documents this. PASS.

## Flags

- **MISSING-CITATION (moderate):** v1 mentions "ID.me has been the subject of FTC consent action (2024) over deceptive claims about face matching being optional" — this claim is not cited in v1. The FTC did file an action against ID.me; the relevant docket should be cited directly (search: `"FTC" "ID.me" consent order face match`). Suggested fix: cite ftc.gov press release or weaken the claim to `[best guess: based on widely-reported regulatory scrutiny]`.
- **OVERSTATED (minor):** v1 says Login.gov uses `private_key_jwt` only and does NOT support `client_secret_basic`. This is correct per the developer documentation (Login.gov requires JWT-based client authentication for OIDC integrations), but the v1 doc does not directly cite the page that states it explicitly. Suggested fix: cite `https://developers.login.gov/oidc/token/` in v2.
- **UPGRADE-SUGGESTED:** ID.me commercial per-verification cost `[best guess]`. Sacra has detailed revenue figures; could derive a top-down estimate.
- **MINOR:** Login.gov sandbox URL `idp.int.identitysandbox.gov` — verify this is current; Login.gov has had several sandbox host migrations.

## Verdict

REVISE — the FTC consent action claim should either be cited or weakened. Other items optional. Document is salvageable.
