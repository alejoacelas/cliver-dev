# 04C claim-check v1 — m14-persona

## Verified

- **Bearer auth, key prefixes `persona_production_` / `persona_sandbox_`.** The docs.withpersona.com API introduction page is the canonical reference and the search excerpt confirms both the bearer convention and the prefix discipline. PASS.
- **Inquiry endpoint `POST /api/v1/inquiries` and verification retrieval endpoints.** Confirmed against the docs.withpersona.com Inquiries reference and the Government ID verification retrieval page. PASS.
- **Government ID verification minimum fields (id_front_photo, id_class, address_country_code, transaction_type)** — confirmed by the Persona Government ID Integration Guide. PASS.
- **Database verification fields list** — confirmed by the Database Verification Integration Guide. PASS.
- **Startup Program: 500 free verifications/month for one year; ~$1/check after; charges only after pass/fail; 12-month minimum on paid plans.** Vendr's marketplace page documents this. PASS.
- **"Pricing more than doubled for many contracts in 2024."** Vendr write-up references this trend. PASS — note `STALE-RISK` since vendor pricing changes annually.
- **Persona iBeta-tested ISO/IEC 30107-3 PAD + CEN/TS 18099:2024 alignment.** Both Biometric Update articles (Jan 2025 + June 2025) reference these standards in the context of Persona releases. PASS.
- **Persona is NOT publicly Kantara-listed at IAL2.** v1 says Persona's glossary references IAL definitions but the company is not a certified trust framework provider in the same way Entrust/Jumio are. The Persona glossary page is descriptive, not a certification claim. The Kantara Trusted Registry listing was not directly fetched in this round. PASS-with-hedge — v1 hedge is appropriate.

## Flags

- **MISSING-CITATION (minor):** v1 lists `selfie_unique` as a uniqueness check across the customer's tenant. The exact name `selfie_unique` and its tenant-scoping is documented in Persona's verification check reference (which v1 does not directly cite). Suggested fix: cite `https://docs.withpersona.com/api-reference/verifications` or the Selfie verification reference page directly.
- **UPGRADE-SUGGESTED:** Mid-volume marginal cost `[best guess]`. Vendr does publish enterprise pricing ranges; explicit search: `"Persona" identity verification enterprise pricing per check site:vendr.com`.
- **MINOR:** v1 says "single global endpoint, no regional split documented." This may have changed; suggest verifying against the API introduction in v2.

## Verdict

REVISE-OPTIONAL — all critical claims hold. Salvageable as v1.
