# m20-voucher-idv — implementation v1

- **measure:** M20 (voucher-legitimacy-soc)
- **name:** Voucher IAL2 IDV (re-use of m14 vendor stack)
- **modes:** D (deterministic — vendor returns PASS/REFER/FAIL)
- **summary:** The voucher is required to complete an IAL2-equivalent identity-proofing flow using one of the M14 IDV vendors (Jumio, Onfido/Entrust, Persona, Stripe Identity, Login.gov, ID.me). Vendor verifies a government ID document, performs face-match-to-selfie with passive liveness, and returns a structured result. Voucher's identity is bound to a real person before any vouching authority is granted.

## external_dependencies

- One M14 IDV vendor:
  - **Jumio** — IAL2-certified by Kantara. [source: [Onfido/Entrust blog on IAL2 certification](https://onfido.com/blog/unlocking-trust-in-digital-identity-what-nist-800-63-ial2-certification-means-for-identity-verification/), [Jumio Security & Trust Center](https://www.jumio.com/privacy-center/security/)]
  - **Onfido (now part of Entrust)** — IAL2-certified. [source: [Entrust IDV page](https://onfido.com/), [IAL2 blog](https://onfido.com/blog/unlocking-trust-in-digital-identity-what-nist-800-63-ial2-certification-means-for-identity-verification/)]
  - **Persona** — IAL2 status [unknown — searched for: "Persona withpersona NIST 800-63 IAL2 certification Kantara", "Persona identity verification IAL2 conformance"]; vendor offers IAL2-aligned workflows but Kantara certification is not visible.
  - **Stripe Identity** — Document + selfie + ID-number verification, billed per session; not IAL2-certified per public sources. [source: [Stripe Identity Verification Sessions API](https://docs.stripe.com/identity/verification-sessions)]
  - **Login.gov** — IAL2 certified by Kantara as of October 2024; available to federal partners. [source: [GSA Login.gov IAL2 announcement](https://www.gsa.gov/about-us/newsroom/news-releases/gsas-logingov-announces-certification-of-ial2-10092024)]
  - **ID.me** — IAL2/AAL2 certified by Kantara. [source: [ID.me on NIST IAL2](https://network.id.me/article/what-is-nist-ial2-identity-verification/)]
- A vendor account, API credentials, and webhook endpoint.
- A reviewer for `REFER` outcomes.

## endpoint_details

- **Stripe Identity (canonical worked example):**
  - `POST https://api.stripe.com/v1/identity/verification_sessions` — create session, returns a hosted-flow URL. [source: [Stripe API: Create a VerificationSession](https://docs.stripe.com/api/identity/verification_sessions/create)]
  - `GET https://api.stripe.com/v1/identity/verification_sessions/{id}` — retrieve session result. [source: [VerificationSession object](https://docs.stripe.com/api/identity/verification_sessions/object)]
  - Webhook event: `identity.verification_session.verified` / `.requires_input`.
  - Auth: Stripe secret key.
  - Pricing: **First 50 verifications/month free**; published per-verification rate beyond that requires consulting the Stripe pricing page (commonly cited at ~$1.50 per document verification, but the doc page is the canonical source). [source: [Stripe Identity billing FAQ](https://support.stripe.com/questions/billing-for-stripe-identity)] [vendor-gated — exact post-50 rate on the live pricing page]
- **Jumio / Onfido / Persona:**
  - REST APIs with vendor-issued API key, hosted-flow + webhook architectures, similar shape to Stripe.
  - Pricing: all custom-quote. Public proxy: Onfido median customer annual spend ≈ $60k (Vendr-style data); per-check pricing falls roughly in the **$1.50–$5** range at moderate volume. [source: [Hyperverge on Onfido pricing](https://hyperverge.co/blog/onfido-pricing/), [Finexer Onfido 2026 pricing guide](https://blog.finexer.com/onfido-pricing/)] [vendor-gated]
- **Login.gov / ID.me:** Federal-partner only (Login.gov) or B2B/B2G (ID.me). Login.gov has no per-call charge for federal agencies; ID.me uses contract pricing. [source: [Login.gov our services](https://www.login.gov/partners/our-services/)]
- **Auth model:** All vendors use API-key + webhook-secret pattern.
- **Rate limits:** Not the binding constraint at SOC volumes (most vendors well above 100 requests/sec). [unknown — searched for: "Stripe Identity rate limit", "Jumio rate limit per second"]
- **ToS:** All vendors require KYC ToS acceptance; recordings/photos retained per regulatory regime (typically 5–7 years).

## fields_returned

Stripe Identity (concrete and well-documented):

- `id`, `created`, `status` ∈ {`requires_input`, `processing`, `verified`, `canceled`}
- `type` ∈ {`document`, `id_number`}
- `verified_outputs.first_name`, `.last_name`, `.dob`, `.address`, `.id_number`
- `last_verification_report.document` — extracted MRZ + face image, document type, issuing country, expiry
- `last_verification_report.selfie` — selfie analysis, liveness signal
- `last_error.code`, `.reason`

[source: [Stripe VerificationSession object](https://docs.stripe.com/api/identity/verification_sessions/object)]

Jumio / Onfido return analogous structured payloads: extracted document fields, face-match score (0–100), liveness verdict, document-authenticity verdict, watchlist hit flag (when bundled).

## marginal_cost_per_check

- **Stripe Identity:** **$0** for first 50/month, then ~**$1.50/check** (best public estimate). [vendor-gated for current rate]
- **Jumio / Onfido / Persona:** **$1.50–$5/check** at moderate volume. [vendor-gated]
- **Login.gov:** $0 for federal partners; not available to commercial DNA providers. **Not applicable** for most use cases here.
- **Reviewer time:** 0 minutes for clean PASS; ~10 minutes for REFER cases. [best guess: typical IDV REFER rate is 5–15%]
- **Setup cost:** ~1 engineering week for Stripe Identity (well-documented). 2–4 weeks for Jumio/Onfido (more elaborate API surface, contract negotiation). KYC ToS / DPA review: 1–2 legal weeks.

## manual_review_handoff

Standard SOP:

1. After voucher submits the form, send them a hosted IDV link (vendor-generated).
2. Voucher uploads a document and takes a selfie. Vendor returns webhook within 30s–10min.
3. On `verified` (Stripe) / `clear` (Onfido) / `passed` (Jumio): assert that `verified_outputs.first_name + last_name` matches the voucher's form-asserted legal name, modulo standard normalization (case, punctuation, accents). If mismatch, FLAG `voucher_idv_name_mismatch`.
4. On `requires_input` / `consider`: route to reviewer with the document image and the failure reason.
5. Reviewer decisions:
   - **Allow:** clear retry conditions (blurry photo, glare). Send voucher a re-attempt link.
   - **Refer up:** liveness fail or document-authenticity fail. Senior reviewer adjudicates with second-doc requirement.
   - **Decline:** repeated failure or document-tamper signal.
6. On `canceled`: voucher abandoned. Two reminder emails, then mark voucher invalid.

## flags_thrown

- `voucher_idv_failed` — vendor returned a hard fail.
- `voucher_idv_name_mismatch` — verified name does not match form-asserted name.
- `voucher_idv_doc_expired` — extracted expiry is in the past.
- `voucher_idv_country_high_risk` — issuing country in BIS/OFAC concern set (handed off to m06/m08).
- `voucher_idv_liveness_fail` — passive liveness score below vendor threshold.
- `voucher_idv_abandoned` — session not completed within 7 days.
- `voucher_idv_passed` — recorded as positive evidence.

## failure_modes_requiring_review

- Vendor 5xx or webhook delivery failure → retry; if persistent, switch to backup vendor.
- Document type the vendor doesn't support (some non-OECD passports / national IDs).
- Voucher is in a jurisdiction where IDV recordings are restricted (Germany BDSG, Quebec Law 25); use a regionally-compliant vendor.
- Voucher does not have access to a smartphone with a working camera (rare but exists).
- False-reject on legitimate document due to ML drift; reviewer overrides with second doc.
- Vendor's facial-recognition model bias against certain demographics (well-documented for some vendors); reviewer overrides require explicit policy.

## false_positive_qualitative

- **Vouchers from countries with under-represented document templates** in vendor training data — higher false-reject rates.
- **Vouchers with legitimate name mismatches** between form and document (married names, transliteration, hyphenated names, single-name customs) — needs reviewer.
- **Vouchers with old/damaged passports** that scan poorly.
- **Vouchers in privacy-strict jurisdictions** who refuse selfie capture as a matter of principle.
- **Senior PIs who feel insulted** by being asked to do a consumer-grade IDV flow ("I have an h-index of 80, why are you asking me to take a selfie") — high refusal rate among the most legitimate vouchers, mirroring m20-live-video-attestation.
- **Demographic facial-recognition bias** (NIST FRVT studies show non-trivial differential error rates across demographics; vendor performance varies). [unknown — searched for: "NIST FRVT vendor demographic differential 2024 report"]

## record_left

- The vendor session ID and the full structured verification result, stored as JSON in the order audit log.
- Document image and selfie are typically retained on the vendor side for the contractual retention period (5–7 years); the provider keeps URLs/IDs and the vendor's audit attestation.
- For Stripe Identity, the `last_verification_report` artifact is replayable via the API for auditors.
- A SHA-256 hash of the snapshot for tamper evidence.

## Sources

- [Stripe Identity Verification Sessions API guide](https://docs.stripe.com/identity/verification-sessions)
- [Stripe VerificationSession API reference](https://docs.stripe.com/api/identity/verification_sessions)
- [Stripe Identity billing FAQ](https://support.stripe.com/questions/billing-for-stripe-identity)
- [Jumio Privacy & Security Center](https://www.jumio.com/privacy-center/security/)
- [Onfido/Entrust IAL2 blog](https://onfido.com/blog/unlocking-trust-in-digital-identity-what-nist-800-63-ial2-certification-means-for-identity-verification/)
- [Hyperverge: Onfido pricing](https://hyperverge.co/blog/onfido-pricing/)
- [Finexer: Onfido 2026 pricing](https://blog.finexer.com/onfido-pricing/)
- [GSA: Login.gov IAL2 certification announcement](https://www.gsa.gov/about-us/newsroom/news-releases/gsas-logingov-announces-certification-of-ial2-10092024)
- [Login.gov our services](https://www.login.gov/partners/our-services/)
- [ID.me on NIST IAL2](https://network.id.me/article/what-is-nist-ial2-identity-verification/)
- [NIST SP 800-63A IAL2 remote proofing](https://pages.nist.gov/800-63-3-Implementation-Resources/63A/ial2remote/)
