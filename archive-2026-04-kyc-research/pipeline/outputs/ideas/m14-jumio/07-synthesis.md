# Per-idea synthesis: m14-jumio

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Jumio Identity Verification (document + selfie liveness, IAL2-equivalent) |
| **measure** | M14 — identity-evidence-match |
| **attacker_stories_addressed** | account-hijack (Branch C), credential-compromise (Branch A), dormant-account-takeover (Branch D), dormant-domain (Branch A), bulk-order-noise-cover (Branch E), inbox-compromise (Branch B — if portal-gated). Only effective when the integrating provider re-triggers Jumio at order time for SOC orders. |
| **summary** | Jumio's KYX/Identity Verification platform performs ID document capture and authentication, optional NFC chip read on ePassports, biometric face match against the document portrait, and active+passive liveness detection. Covers 5,000+ document subtypes across 200+ countries/territories (vendor-described). Certified at IAL2 under NIST SP 800-63-3 (vendor-described; Kantara listing not independently verified). Output is a per-transaction verification record usable as the IAL2 evidence-match artifact required by M14. |
| **external_dependencies** | Jumio KYX Platform / Identity Verification product (commercial vendor); Jumio web/mobile SDKs (iOS, Android, JS) for capture; Jumio REST API for backend integration and result retrieval; ICAO PKD (Jumio-managed) for ePassport NFC chip verification; customer portal at customer-portal.netverify.com for manual review console. |
| **endpoint_details** | REST endpoints under `*.netverify.com` and `*.jumio.ai`. Auth: OAuth2 bearer on Platform (preferred), HTTP Basic Auth on legacy NetVerify (deprecated but supported). Result delivery via Netverify Retrieval API (pull) and Callback URL (push). Rate limits: [unknown — searched for: "Jumio API rate limit", "Jumio Netverify requests per second", "Jumio KYX throttling docs"]. Pricing: [vendor-gated — no list price published; public reviews indicate volume-based per-verification pricing]. ToS: gated MSA; ISO 27001, SOC 2 Type II; biometric data under explicit consent; cross-tenant biometric matching requires contract opt-in. |
| **fields_returned** | `transactionStatus` (DONE/FAILED/PENDING), `verificationStatus` (APPROVED_VERIFIED / DENIED_FRAUD / DENIED_UNSUPPORTED_ID_TYPE / ERROR_NOT_READABLE_ID / NO_ID_UPLOADED), `idType`, `idCountry`, `idNumber`, `idExpiry`, `idFirstName`, `idLastName`, `idDob`, `idAddress`, `identityVerification` (similarity: MATCH/NO_MATCH/NOT_POSSIBLE), `livenessDetection` (PASSED/FAILED), `rejectReason` (MANIPULATED_DOCUMENT, FAKE, BLACK_WHITE_PHOTOCOPY, DIGITAL_COPY), `additionalChecks` (NFC chip read), `clientIp`, `customerId`, image URLs (retention-window gated). |
| **marginal_cost_per_check** | [best guess: $1.50–$3.50 per completed verification at mid-volume (10k–100k/month). Reasoning: G2/SaaSWorthy reviews cite $1–$5 for Jumio-tier vendors; Jumio positioned at higher end due to document coverage and IAL2 certification.] **setup_cost:** [best guess: $0–$25k integration fee plus minimum monthly commitment $2k–$10k.] |
| **manual_review_handoff** | Six-step playbook: (1) Open Jumio Customer Portal, pull transaction by ID. (2) Inspect ID image, selfie, rejection code, confidence sub-scores. (3) For ERROR_NOT_READABLE_ID/NO_ID_UPLOADED: contact customer, request re-capture, re-run Jumio. (4) For DENIED_FRAUD (MANIPULATED_DOCUMENT, FAKE, DIGITAL_COPY): hard-deny SOC order, freeze account, file internal SAR-style note, refer to compliance officer. (5) For face NO_MATCH: re-invite fresh liveness selfie; second failure escalates to compliance. (6) Document decision and reviewer ID in case-management system. |
| **flags_thrown** | `jumio_doc_failed` (verificationStatus in DENIED_FRAUD/DENIED_UNSUPPORTED_ID_TYPE/ERROR_NOT_READABLE_ID — deny SOC pending review), `jumio_liveness_failed` (re-invite once, then escalate), `jumio_face_no_match` (hold order, manual re-review), `jumio_nfc_chip_invalid` (elevated suspicion, deny + escalate), `jumio_pending_timeout` (poll Retrieval API, treat as unverified if past SLA). |
| **failure_modes_requiring_review** | API 5xx errors (retry with backoff; fail-closed for SOC); unsupported document subtype; damaged MRZ / glare / low-light capture; NFC unavailable on device (degrades to OCR-only); Liveness Premium not enabled (injection attacks more likely — vendor reported 88% YoY rise in injection attempts, 9x surge in 2024); webhook callback delivery failure; customer cancels mid-flow. |
| **false_positive_qualitative** | (1) Non-Latin-script name mismatch between ID and account record — ~8–15% of global customers without transliteration layer (highest-impact gap). (2) Age-gap face mismatch (passport photo >5 years old) — affects ~20–40% of passport holders; most resolved by re-capture. (3) Unsupported document types — ~2–5% of customers; fallback to passport. (4) Head coverings / skin-tone bias — smaller incremental effect with modern algorithms but reputationally sensitive. (5) Low-bandwidth capture failures — ~3–7%; retriable. (6) Recent name changes — ~1–3%/year; resolvable. (7) No government photo ID at all — <1%; hard exclusion. |
| **coverage_gaps** | (1) Unsupported document types: ~2–5% of synthesis customers hold an ID Jumio does not support or handles with degraded accuracy; fallback to passport. (2) Non-Latin-script names: ~8–15% of global customers face chronic FP without provider-side transliteration. (3) Facial similarity bias — age gap (20–40% of passport holders with >5yr photos), head coverings (3–8%), skin tone (<0.5% incremental per NIST FRVT 2024). (4) Low-bandwidth / low-end device: ~3–7% experience capture failures. (5) Name changes: ~1–3%/year. (6) No government photo ID: <1%, hard exclusion. |
| **record_left** | Per invocation: Jumio `scanReference` / transaction ID, structured JSON callback payload, captured document image and selfie URLs (vendor default ~30 day retention), human reviewer decision and notes in provider's case-management system, final SOC-order disposition. Auditable for regulator review. |
| **bypass_methods_known** | Deepfake injection (CAUGHT with Liveness Premium; AMBIGUOUS with standard liveness), face morphing on genuine document (AMBIGUOUS — MAD not confirmed as Jumio capability), IDV-session handoff (AMBIGUOUS — depends on SDK session-binding enforcement), fraudulent govt ID + selfie (CAUGHT), presentation attack / mask / printout (CAUGHT), injection against weak SDK (CAUGHT with Liveness Premium), shared-account predecessor mismatch (CAUGHT with order-time re-proofing), email-only ordering (CAUGHT if portal-gated). |
| **bypass_methods_uncovered** | ATO inherits prior IAL2 without order-time re-proofing; face morphing on genuine document substrate (MAD not confirmed); social-engineer support/reviewer for manual override; fresh real accomplice per entity (structural); same-person multi-persona (per-transaction IDV, no cross-applicant dedup); real ID throughout (structural). |

---

## Section 2: Narrative

### What this check is and how it works

Jumio Identity Verification is a commercial vendor IDV service that captures a government-issued photo ID document (via camera or NFC chip read on supported ePassports), extracts identity fields through OCR and template matching, authenticates the document against known security features, captures a live selfie, and performs biometric face matching between the selfie and the document portrait with active and passive liveness detection. The service covers over 5,000 document subtypes across 200+ countries (vendor-described). The synthesis provider integrates Jumio via its web/mobile SDK for capture and REST API for result retrieval. Each verification produces a structured response with a pass/fail verdict, extracted identity fields, liveness result, face-match similarity, and coded rejection reasons. The provider stores this as the IAL2 evidence-match artifact for M14 compliance. Jumio claims IAL2 certification under NIST SP 800-63-3, though the Kantara listing was not independently verified in this research.

### What it catches

Jumio is the primary defense layer against identity-theft attack patterns that target the IDV pipeline. It catches presentation attacks (masks, printouts, photos) via liveness detection, overt document fraud (forged documents, photocopies, digital copies, manipulated MRZ) via document authenticity checks, and injection attacks (camera emulators, deepfake video feeds) when Liveness Premium is enabled. It catches fraudulent government IDs with inconsistent security features. When the provider enforces order-time re-proofing, Jumio catches the "shared-account predecessor mismatch" scenario (current orderer's face does not match the IAL2 record) and blocks email-only ordering that bypasses the portal. These capabilities address the credential-compromise, account-hijack, dormant-account-takeover, and bulk-order-noise-cover attacker branches.

### What it misses

Jumio has several structural and operational blind spots. It cannot detect fronted-accomplice attacks — a willing accomplice with their own real ID and real face passes Jumio natively, covering the shell-nonprofit, CRO-identity-rotation, and biotech-incubator-tenant branches. Same-person multi-persona operation is invisible because Jumio performs per-transaction IDV without cross-applicant biometric dedup (that is a separate product). Real-ID-throughout attackers pass natively. ATO that inherits a prior IAL2 pass is missed unless the provider re-triggers Jumio at order time. Face morphing on genuine document substrates is an AMBIGUOUS threat — Jumio does not publicly document morph-attack detection as a specific capability. Social-engineering of the manual reviewer to override a denial bypasses the automated pipeline entirely. Injection attacks remain a risk if the integrator has only standard liveness enabled rather than Liveness Premium.

### What it costs

Marginal cost is estimated at $1.50–$3.50 per completed verification at mid-volume contracts (10k–100k verifications/month), based on public comparable pricing from G2, SaaSWorthy, and HyperVerge reviews. Exact pricing is vendor-gated and requires a sales conversation. Setup cost is estimated at $0–$25k integration fee plus a minimum monthly commitment of $2k–$10k. These are standard for enterprise IDV vendors at this tier. The provider also bears the cost of manual review for flagged transactions — the implementation specifies a six-step review playbook using Jumio's Customer Portal.

### Operational realism

The manual review handoff is well-specified: reviewers open the Jumio Customer Portal, inspect the captured ID image, selfie, rejection code, and confidence sub-scores, then follow prescribed actions per flag type (re-invite for quality failures, hard-deny + freeze for fraud, escalate for persistent face mismatches). The largest operational false-positive driver in a synthesis context is non-Latin-script name mismatches between Jumio's extracted name and the provider's account record — affecting an estimated 8–15% of global customers. The provider must implement a transliteration-aware name-matching layer to avoid chronic false positives on East Asian, Middle Eastern, and South Asian researchers. Age-gap face mismatches (passport photo >5 years old) are the second-largest FP driver but are largely resolved by re-capture. Each verification produces an auditable record: Jumio scan reference, structured JSON payload, captured images (30-day default retention), and the reviewer's documented decision.

### Open questions

The implementation does not specify a concrete re-proofing trigger policy — when order-time re-triggering of Jumio is mandatory versus optional. Without this, the ATO-inherits-prior-IAL2 bypass is unaddressed. Liveness Premium versus standard liveness is identified as a failure mode but not mandated as a requirement for SOC orders. Morph-attack detection is not confirmed as a Jumio capability, leaving a residual risk for high-quality morphed documents. The Jumio SDK's session-binding enforcement (whether it prevents cross-device IDV-session handoff) is not documented in the implementation. The exact document-subtype count is inconsistent between 00-spec.md ("3000+") and vendor marketing ("5,000+"); the 4C claim check recommended harmonizing to the vendor's current published figure.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 passed with no Critical flags.
- **Moderate finding M1 (ATO-inherits-prior-IAL2):** Without an explicit re-proofing trigger policy (SOC orders always require fresh Jumio; non-SOC orders require Jumio if last IAL2 > N days), the check fails to catch account takeover. Needs policy specification.
- **Moderate finding M2 (Liveness Premium not mandated):** The implementation identifies injection attacks as a risk if Liveness Premium is not enabled but does not mandate it. For SOC orders, Liveness Premium (or equivalent injection-resistant liveness) should be required.
- **Moderate finding M3 (morph attack detection):** Jumio does not publicly document MAD capability. High-quality morphs on genuine document substrates remain an AMBIGUOUS threat. NFC chip read (m14-nfc-epassport) partially mitigates.
- **Moderate finding M4 (fronted-accomplice structural gap):** Jumio cannot detect willing accomplices with real IDs. Cross-measure mitigation needed.
- **Minor finding m1 (session-handoff enforcement):** Unclear whether Jumio SDK enforces same-device/same-session binding.
- **[unknown] fields:**
  - API rate limits (3-query search returned no public documentation).
- **[vendor-gated] fields:**
  - Per-verification pricing (volume-based, requires sales contact).
  - Setup/integration fee and minimum monthly commitment.
  - Exact MSA terms relevant to cross-tenant biometric matching.
  - Kantara Trust Framework Provider listing for IAL2 (vendor claims but not independently verified).
- **[best guess] fields requiring validation:**
  - $1.50–$3.50 per check (sourced from comparable vendor reviews, not direct Jumio data).
  - 8–15% of global customers affected by non-Latin-script name mismatches.
  - 2–5% of customers with unsupported document types.
- **Document-subtype count inconsistency:** 00-spec.md says "3000+"; v1 implementation says "5,000+". Needs harmonization to vendor's current published figure.
