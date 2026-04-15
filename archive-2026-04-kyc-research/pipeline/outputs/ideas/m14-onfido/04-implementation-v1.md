# m14-onfido — Implementation research v1

- **measure:** M14 — identity-evidence-match
- **name:** Onfido (Entrust Identity Verification) Studio workflow — document + biometric (Motion liveness)
- **modes:** D

## summary

Onfido (acquired by Entrust April 2024 and now branded as Entrust Identity Verification) provides a Studio workflow that orchestrates Document, Facial Similarity, Watchlist, and Known Faces reports against captured ID documents and selfies/Motion video. Entrust/Onfido publicly states that the platform is NIST 800-63 IAL2 certified and listed on the Kantara Trusted Registry [source](https://www.entrust.com/blog/2025/02/unlocking-trust-in-digital-identity-nist-800-63-ial2-and-identity-verification). For DNA synthesis providers, the relevant integration is the Document report paired with a Facial Similarity (Standard) or Motion report, optionally augmented with NFC-based ePassport reading and the Watchlist Standard report; the per-applicant verdict is the M14 evidence-match artifact.

## attacker_stories_addressed

- account-hijack (Branch C) — Motion + Standard liveness vs deepfake/morph
- credential-compromise (Branch A) — fraudulent-doc + injection paths if Motion enabled
- dormant-account-takeover (Branch D) — order-time re-trigger
- dormant-domain (Branch A) — injection-against-weak-SDK fallback
- bulk-order-noise-cover (Branch E) — current-orderer mismatch when re-proofing enforced

Onfido does NOT address fronted-accomplice branches (shell-nonprofit, biotech-incubator-tenant, cro-identity-rotation).

## external_dependencies

- Onfido / Entrust Identity Verification platform (commercial vendor; Entrust subsidiary since April 2024) [source](https://www.entrust.com/company/newsroom/onfido-acquires-airside)
- Onfido SDKs (Web JS, iOS, Android, React Native) for capture
- Onfido REST API v3.6 for Applicants, Documents, Checks, Reports, SDK tokens
- Onfido Studio (no-code workflow builder) optional but recommended for branching logic
- ICAO PKD via Onfido NFC SDK for chip read on supported devices
- Watchlist sub-providers (sanctions, PEP, adverse media — Dow Jones / Refinitiv-tier; vendor-managed)

## endpoint_details

- **Product page:** https://www.entrust.com/products/identity-verification (Entrust brand). Legacy onfido.com still resolves [source](https://onfido.com/blog/unlocking-trust-in-digital-identity-what-nist-800-63-ial2-certification-means-for-identity-verification/).
- **Documentation hub:** https://documentation.onfido.com (Entrust IDV Developer Portal); current API version v3.6 [source](https://documentation.identity.entrust.com/api/latest/).
- **API base URL:** Region-specific: `https://api.eu.onfido.com/v3.6/` (EU), `https://api.us.onfido.com/v3.6/` (US), `https://api.ca.onfido.com/v3.6/` (Canada). REST/JSON.
- **Auth model:** Bearer "Token token=YOUR_API_TOKEN" header for backend calls. SDK calls use short-lived SDK tokens scoped to a single applicant, expiring after 90 minutes [source](https://documentation.identity.entrust.com/api/latest/).
- **Webhooks:** Vendor pushes report.completed / check.completed events to a customer-hosted HTTPS URL with HMAC-SHA256 signature header.
- **Rate limits:** [unknown — searched for: "Onfido API rate limit", "Onfido API throttle requests per second", "Entrust IDV API quota", "documentation.onfido.com rate limit"]
- **Pricing:** [vendor-gated — no list price; per-verification volume tiered. TrustRadius and Capterra reviewers cite "custom pricing" only. Public RFP responses sometimes disclose figures; not searched in this round. Would require sales contact for tier specifics.] [source](https://www.trustradius.com/products/onfido/pricing)
- **ToS / compliance posture:** ISO 27001, SOC 2 Type II, GDPR, NIST 800-63 IAL2 (Kantara-listed via Entrust) [source](https://www.entrust.com/blog/2025/02/unlocking-trust-in-digital-identity-nist-800-63-ial2-and-identity-verification). Biometric data processed under explicit consent; cross-tenant matching not exposed by default.

## fields_returned

From the Document report and Facial Similarity / Motion report (publicly documented v3.6 schema [source](https://documentation.onfido.com/guide/document-report/)):

**Document report (`/checks` → `documents`):**
- `result` — clear / consider / unidentified
- `sub_result` — clear / rejected / suspected / caution
- `properties` — extracted MRZ + visual data: `first_name`, `last_name`, `date_of_birth`, `date_of_expiry`, `document_type`, `document_numbers`, `issuing_country`, `gender`, `nationality`, `address_lines`, `mrz_line1`, `mrz_line2`
- `breakdown` — sub-checks: `data_validation`, `data_consistency`, `data_comparison` (against applicant record), `image_integrity`, `visual_authenticity`, `compromised_document` (matched against Onfido's known-fraud DB), `police_record`, `age_validation`
- For each breakdown: `result` and per-property breakdown reasons

**Facial Similarity Standard / Motion report:**
- `result` — clear / consider
- `breakdown.face_comparison.result` — match / no_match against the document portrait
- `breakdown.image_integrity.result` — face detected, source integrity (camera vs upload)
- `breakdown.visual_authenticity.result` — liveness sub-checks (spoofing_detection, image_quality)
- For Motion: `breakdown.image_integrity.breakdown.source_integrity` flags injection attacks (fake webcam, emulator, network-injected video) [source](https://onfido.com/blog/motion-advanced-biometrics-deepfakes/)

**Check object:**
- `id`, `applicant_id`, `report_ids[]`, `status` (in_progress / awaiting_applicant / complete / withdrawn), `result` (clear / consider), `created_at`, `tags[]`

[source](https://documentation.onfido.com/api/3.0.0)

## marginal_cost_per_check

[best guess: $1.20–$3.00 per Document+Facial Similarity Standard pair in mid-volume contracts (10k–100k/month). Reasoning: comparable enterprise IDV vendors (Jumio, Veriff, Persona) cluster in this band per public RFP records and vendor-comparison blogs; Motion adds approximately $0.30–$0.80 per check on top per the same comparables.] [source](https://hyperverge.co/blog/onfido-pricing/) [source](https://blog.finexer.com/onfido-pricing/)

- **setup_cost:** [best guess: $0–$15k integration + monthly minimum commitment $1.5k–$8k. Reasoning: typical for the Entrust IDV tier per public reseller summaries.]

## manual_review_handoff

When the Check returns `result = consider` or any sub-report returns `consider`/`rejected`:

1. Reviewer opens the Onfido Dashboard (`dashboard.onfido.com`) and pulls the Applicant + Check + Reports.
2. Reviewer reviews the Document report `breakdown` to identify which sub-check tripped (e.g., `visual_authenticity.fonts`, `data_consistency.date_of_birth`, `compromised_document.repeat_attempts`).
3. Reviewer reviews the captured document image, the selfie/Motion video, and the Facial Similarity score detail.
4. **For `image_integrity.source_integrity = consider` (injection attack signal):** hard-deny the SOC order, freeze the customer account, escalate to compliance for HHS reporting per the screening framework guidance.
5. **For `visual_authenticity = consider` with no injection signal:** request a re-capture under better lighting / a different document.
6. **For `face_comparison = no_match`:** request a fresh selfie via re-invitation; on second failure escalate to compliance.
7. **For `data_comparison` mismatch (name / DOB on document vs synthesis-provider account record):** route to compliance for clarification (could be name change, transliteration, or impersonation).
8. Reviewer documents the decision and reviewer ID in the synthesis provider's case-management system.

## flags_thrown

- `onfido_doc_failed` — Document report `result = consider` or `rejected`. Action: deny SOC order pending review.
- `onfido_face_no_match` — `face_comparison = no_match`. Action: hold + re-invite + escalate.
- `onfido_liveness_failed` — `visual_authenticity = consider` on Facial Similarity or Motion. Action: re-invite once; on second failure escalate to compliance.
- `onfido_injection_detected` — Motion `source_integrity = consider`. Action: hard-deny + escalate.
- `onfido_compromised_document` — `compromised_document = consider` (matches Onfido's known-fraud DB / repeat-attempts). Action: hard-deny + freeze account + report.
- `onfido_data_mismatch` — `data_comparison` flag against applicant record. Action: clarification + compliance review.

## failure_modes_requiring_review

- Webhook delivery failure → fall back to `GET /checks/{id}` polling.
- Applicant cancels mid-flow → check stays `awaiting_applicant`; cleanup job after timeout.
- Document type unsupported in customer's region → `unidentified` result; request alternative document.
- NFC unavailable on customer device → silently degrades to OCR-only; reviewer must know.
- Motion not enabled on the workflow (using Standard Facial Similarity only) → injection attacks more likely to slip through; deepfakes now reported every five minutes per Entrust threat data [source](https://www.biometricupdate.com/202411/deepfake-attacks-now-occur-every-five-minutes-entrust-report-warns).
- Watchlist sub-provider stale → false negatives on sanctions matches.

## false_positive_qualitative

- Researchers from countries whose national IDs are outside Onfido's supported subtype list.
- Customers whose legal name is in non-Latin script and the synthesis-provider account record uses a romanized form (`data_comparison` mismatch).
- Recent name changes (marriage, gender marker update) where the ID lags the account record.
- Customers with significant age gap between the ID portrait and current face, head coverings worn for medical/religious reasons (face-comparison similarity depression).
- Low-bandwidth or older mobile devices triggering capture-quality / Motion failures.

## record_left

For each invocation: Onfido Applicant ID, Check ID, Report IDs, the structured JSON report payloads, the captured document image and selfie/Motion video URLs (retention window per Onfido contract; default 30 days), webhook event log, and the human reviewer's decision in the synthesis provider's case-management system. Auditable artifact suitable for regulator review under M14 SOP.

## bypass_methods_known / uncovered

(Stage 5 will populate. Onfido Motion is iBeta Level 2 compliant and explicitly defends against camera + network injection. Vendor cannot resist fronted-accomplice (real ID, real face) or ATO that inherits prior IAL2 if the integrator does not re-trigger at order time.)

---

## Sources

- https://documentation.identity.entrust.com/api/latest/
- https://documentation.onfido.com/api/3.0.0
- https://documentation.onfido.com/guide/document-report/
- https://documentation.onfido.com/v3
- https://www.entrust.com/blog/2025/02/unlocking-trust-in-digital-identity-nist-800-63-ial2-and-identity-verification
- https://www.entrust.com/company/newsroom/onfido-acquires-airside
- https://onfido.com/blog/motion-advanced-biometrics-deepfakes/
- https://onfido.com/press-release/onfido-launches-motion-the-next-generation-of-facial-biometric-technology/
- https://www.biometricupdate.com/202411/deepfake-attacks-now-occur-every-five-minutes-entrust-report-warns
- https://hyperverge.co/blog/onfido-pricing/
- https://blog.finexer.com/onfido-pricing/
- https://www.trustradius.com/products/onfido/pricing
