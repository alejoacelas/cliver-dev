# Per-idea synthesis: m14-onfido

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Onfido (Entrust Identity Verification) Studio workflow — document + biometric (Motion liveness) |
| **measure** | M14 — identity-evidence-match |
| **attacker_stories_addressed** | account-hijack (Branch C — Motion + Standard liveness vs deepfake/morph), credential-compromise (Branch A — fraudulent-doc + injection paths with Motion enabled), dormant-account-takeover (Branch D — order-time re-trigger), dormant-domain (Branch A — injection-against-weak-SDK fallback), bulk-order-noise-cover (Branch E — current-orderer mismatch with re-proofing). Does NOT address fronted-accomplice branches. |
| **summary** | Onfido (acquired by Entrust April 2024, now branded Entrust Identity Verification) provides a Studio workflow orchestrating Document, Facial Similarity, Watchlist, and Known Faces reports against captured ID documents and selfies/Motion video. The platform is NIST 800-63 IAL2 certified and Kantara-listed (vendor assertion). Covers 2,500+ document types across 195 countries. Motion liveness explicitly defends against camera emulators, fake webcams, and network-injected deepfakes. The per-applicant verdict is the M14 evidence-match artifact. |
| **external_dependencies** | Onfido / Entrust Identity Verification platform (commercial vendor, Entrust subsidiary since April 2024); Onfido SDKs (Web JS, iOS, Android, React Native) for capture; Onfido REST API v3.6 for backend integration; Onfido Studio (no-code workflow builder); ICAO PKD via Onfido NFC SDK; Watchlist sub-providers (Dow Jones / Refinitiv-tier, vendor-managed). |
| **endpoint_details** | Region-specific REST API: `api.eu.onfido.com/v3.6/` (EU), `api.us.onfido.com/v3.6/` (US), `api.ca.onfido.com/v3.6/` (Canada). Auth: Bearer "Token token=YOUR_API_TOKEN" for backend; SDK tokens scoped per applicant, 90-min expiry. Webhooks: HMAC-SHA256 signed push to customer HTTPS URL. Rate limits: [unknown — searched for: "Onfido API rate limit", "Entrust IDV API quota", etc.]. Pricing: [vendor-gated — per-verification volume tiered; no list price]. ToS: ISO 27001, SOC 2 Type II, GDPR, NIST 800-63 IAL2 (Kantara-listed via Entrust). |
| **fields_returned** | **Document report:** `result` (clear/consider/unidentified), `sub_result`, `properties` (first_name, last_name, date_of_birth, date_of_expiry, document_type, document_numbers, issuing_country, gender, nationality, address_lines, mrz_line1, mrz_line2), `breakdown` (data_validation, data_consistency, data_comparison, image_integrity, visual_authenticity, compromised_document, police_record, age_validation). **Facial Similarity / Motion report:** `result`, `face_comparison` (match/no_match), `image_integrity` (source_integrity for injection detection in Motion), `visual_authenticity` (spoofing_detection). **Check object:** `id`, `applicant_id`, `report_ids[]`, `status`, `result`, `created_at`. |
| **marginal_cost_per_check** | [best guess: $1.20–$3.00 per Document+Facial Similarity Standard pair at mid-volume (10k–100k/month); Motion adds ~$0.30–$0.80 per check.] **setup_cost:** [best guess: $0–$15k integration + monthly minimum $1.5k–$8k.] |
| **manual_review_handoff** | Eight-step playbook: (1) Open Onfido Dashboard, pull Applicant + Check + Reports. (2) Review Document breakdown to identify tripped sub-check. (3) Review captured document image and selfie/Motion video. (4) `source_integrity = consider` (injection signal): hard-deny, freeze, escalate for HHS reporting. (5) `visual_authenticity = consider` without injection: request re-capture. (6) `face_comparison = no_match`: re-invite selfie, escalate on second failure. (7) `data_comparison` mismatch: route to compliance for clarification. (8) Document decision and reviewer ID in case-management system. |
| **flags_thrown** | `onfido_doc_failed` (Document result = consider/rejected — deny pending review), `onfido_face_no_match` (hold + re-invite + escalate), `onfido_liveness_failed` (re-invite once, then escalate), `onfido_injection_detected` (Motion source_integrity = consider — hard-deny + escalate), `onfido_compromised_document` (known-fraud DB match — hard-deny + freeze + report), `onfido_data_mismatch` (data_comparison flag — clarification + compliance review). |
| **failure_modes_requiring_review** | Webhook delivery failure (fall back to polling); applicant cancels mid-flow; document type unsupported in region; NFC unavailable (silent degrade to OCR); Motion not enabled (injection attacks more likely — deepfakes reported every five minutes per Entrust 2024 data); watchlist sub-provider staleness. |
| **false_positive_qualitative** | (1) Non-Latin-script name mismatch — ~8–15% of global customers without transliteration layer. (2) Age-gap face mismatch — ~20–40% of passport holders with >5yr photos; most resolved by re-capture. (3) Motion capture failures on low-end devices — ~5–10%; retriable. (4) Unsupported document types — ~3–7%; fallback to passport. (5) Head coverings / skin-tone bias — small incremental effect. (6) Name changes — ~1–3%/year. |
| **coverage_gaps** | (1) Unsupported document types: ~3–7% (slightly higher than Jumio due to 2,500 vs 5,000 subtypes). (2) Non-Latin-script names: ~8–15% chronic FP without transliteration. (3) Facial bias — age gap (20–40% of passport holders), head coverings (3–8%), skin tone (<0.5% incremental per NIST FRVT 2024). (4) Motion not enabled: configuration gap affecting check reliability for entire customer base. (5) Low-bandwidth / low-end devices: ~5–10% with Motion's higher video requirements. (6) Name changes: ~1–3%/year. |
| **record_left** | Per invocation: Onfido Applicant ID, Check ID, Report IDs, structured JSON report payloads, captured document image and selfie/Motion video URLs (retention per contract, default 30 days), webhook event log, reviewer decision in provider case-management system. Auditable for regulator review. |
| **bypass_methods_known** | Deepfake injection with Motion enabled (CAUGHT), fraudulent govt ID (CAUGHT — visual_authenticity + compromised_document), presentation attack (CAUGHT — Motion liveness), shared-account predecessor mismatch with re-proofing (CAUGHT — face_comparison = no_match), email-only ordering (CAUGHT if IDV required), document-image reuse across personas (partially CAUGHT via compromised_document.repeat_attempts). Deepfake injection with Standard only (AMBIGUOUS), face morphing on genuine document (AMBIGUOUS — MAD not confirmed), IDV-session handoff (AMBIGUOUS — depends on SDK session binding). |
| **bypass_methods_uncovered** | ATO inherits prior IAL2 without re-proofing; face morphing on genuine document substrate (MAD not confirmed); social-engineer support/reviewer; fresh real accomplice (structural); same-person multi-persona via separate faces (per-transaction, no cross-applicant face check); real ID throughout (structural). |

---

## Section 2: Narrative

### What this check is and how it works

Onfido, now branded Entrust Identity Verification following Entrust's April 2024 acquisition, provides a configurable Studio workflow that orchestrates document verification, facial biometric matching, and liveness detection. The customer captures their government ID and completes either a single selfie (Facial Similarity Standard) or a short video with head movements (Motion). The Document report extracts identity fields, validates MRZ data, checks visual authenticity (fonts, security features, photo manipulation), and matches against a known-fraud database. The Facial Similarity or Motion report compares the live capture against the document portrait, checks liveness, and — in the case of Motion — specifically detects injection attacks from camera emulators, fake webcams, and network-injected deepfake video. The platform covers 2,500+ document types across 195 countries and is IAL2-certified on the Kantara registry (vendor assertion). Results are delivered via webhook or API polling as structured JSON, with a dashboard for manual review of flagged cases.

### What it catches

With Motion enabled, Onfido provides strong defense against the deepfake injection and presentation attacks documented in the credential-compromise, account-hijack, dormant-account-takeover, and dormant-domain attacker branches. The `source_integrity` sub-check explicitly flags fake webcams, emulators, and network injection. The Document report catches overt document fraud (forged documents, photocopies, digital copies, visual tampering) and matches documents against a known-fraud database — a differentiator that Jumio and Persona may not offer at the same depth via the `compromised_document` check. With order-time re-proofing enforced, it catches shared-account predecessor mismatches via face-comparison failure. It blocks email-only ordering when IDV is required for SOC orders.

### What it misses

The bypass profile is nearly identical to Jumio's. ATO that inherits a prior IAL2 pass is missed without an explicit re-proofing trigger policy. Face morphing on genuine document substrates remains AMBIGUOUS — Onfido does not publicly document morph-attack detection as a discrete capability, and a high-quality morph designed to pass both document and biometric checks may succeed. Social-engineering of the reviewer to override a denial bypasses the automated pipeline. The standard structural gaps apply: fronted-accomplice with real ID, same-person multi-persona (per-transaction IDV without cross-applicant face matching), and real-ID-throughout all pass natively. If Motion is not enabled (Standard only), injection attacks are significantly more likely to succeed — this is a critical configuration requirement, not a population coverage gap.

### What it costs

Marginal cost is estimated at $1.20–$3.00 per Document + Facial Similarity Standard check at mid-volume, with Motion adding approximately $0.30–$0.80. Setup cost is estimated at $0–$15k integration fee plus a monthly minimum commitment of $1.5k–$8k. Exact pricing is vendor-gated. Onfido is positioned in the same price tier as Jumio, with Motion's video-based liveness carrying a small premium over single-selfie alternatives.

### Operational realism

The manual review handoff is well-specified with an eight-step playbook tied to specific report fields, using the Onfido Dashboard for document and biometric inspection. The largest operational false-positive driver is non-Latin-script name mismatches (~8–15% of global customers), requiring the same transliteration layer as Jumio. Motion's video requirement is more demanding than a single selfie, causing ~5–10% of customers to experience capture failures on low-end devices — retriable but friction-generating. The provider may need to offer a Standard-liveness fallback for these users, accepting lower assurance. Onfido's 2,500 document subtypes across 195 countries is narrower than Jumio's 5,000+ subtypes, potentially creating a slightly higher unsupported-document rate (~3–7% vs ~2–5%). Each check produces an auditable record with document images, selfie/Motion video, and structured report payloads, with a default 30-day retention window.

### Open questions

The implementation does not specify a re-proofing trigger policy — when Onfido must be re-triggered at order time versus relying on onboarding IDV. Motion is described as a defense but not mandated as a requirement for SOC orders; it should be a hard requirement. Whether Onfido's `compromised_document.repeat_attempts` check is cross-applicant (across all applicants in the tenant) or within-applicant is not documented — this matters for detecting same-person multi-persona operations. SDK session-binding enforcement (whether document and selfie must be captured on the same device in the same session) is not documented. The iBeta Level 2 compliance claim for Motion appears in the 04F form check but is not present in the v1 narrative itself.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 passed with no Critical flags.
- **Moderate finding M1 (Motion not mandated):** Motion vs. Standard Facial Similarity is a critical configuration lever. Standard liveness is inadequate for the SOC-order threat model. Motion should be a hard requirement in the integration spec.
- **Moderate finding M2 (ATO-inherits-prior-IAL2):** Same gap as Jumio — no explicit re-proofing trigger policy. Needs specification.
- **Moderate finding M3 (morph attack detection):** MAD not confirmed as an Onfido capability. High-quality morphs on genuine substrates remain AMBIGUOUS. NFC chip read partially mitigates.
- **Moderate finding M4 (fronted-accomplice structural gap):** Structural; same as all M14 vendor-IDV ideas.
- **Minor finding m1 (compromised_document.repeat_attempts scope):** Unclear whether cross-applicant within tenant or within-applicant only. Affects multi-persona detection.
- **[unknown] fields:**
  - API rate limits (4-query search returned no public documentation).
- **[vendor-gated] fields:**
  - Per-verification pricing and setup cost.
  - Kantara listing (vendor assertion; direct registry lookup not performed).
  - NFC incremental pricing.
  - `compromised_document` cross-applicant scope.
- **[best guess] fields requiring validation:**
  - $1.20–$3.00 per Document+Standard check; $0.30–$0.80 Motion premium.
  - 3–7% of customers with unsupported document types.
  - 8–15% non-Latin-script name mismatch.
  - 5–10% Motion capture failures on low-end devices.
