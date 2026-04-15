# m14-cross-tenant-biometric-dedup — Implementation v1

- **measure:** M14 (identity-evidence-match)
- **name:** Cross-tenant biometric dedup
- **modes:** A
- **summary:** Perform 1:N face-template matching across all customers within the provider's identity-verification database. When the same biometric template (face embedding) appears bound to multiple distinct identities, flag as a potential synthetic-identity factory or identity-rotation scheme. When one identity has multiple distinct templates across sessions, flag as a potential account-sharing or deepfake-substitution pattern. The check runs at enrollment time (onboarding IAL2) and optionally at each SOC-order step-up re-verification.

## external_dependencies

- **Identity verification vendor with 1:N face search** — the provider must use an IDV vendor that supports cross-customer biometric deduplication within the provider's tenant. Key vendors with documented 1:N capabilities:
  - **Jumio** — offers "Face Lookup" and biometric deduplication across all prior transactions within a customer's Jumio tenant. Checks whether a submitted face has been seen in previous identity transactions; if data in the current transaction doesn't match data from the previous transaction (same face, different name/DOB), the transaction is rejected or flagged. Part of the Jumio Identity Graph. [source](https://www.biometricupdate.com/202006/jumio-launches-biometric-deduplication-service-with-u-s-dmv-group-as-part-of-fraud-prevention-suite)
  - **MetaMap** — "Duplicate Detection via Facematch" feature detects whether a user has already been seen in the same MetaMap account through matching facial biometrics. [source](https://docs.metamap.com/docs/biometrics)
  - **Didit** — offers free 1:N face search and duplicate/blocklist detection in workflows. Extracts a biometric representation using AI facial recognition, compares against all known faces in the application. [source](https://didit.me/products/face-search-1ton/)
  - **Regula Face SDK** — on-premise or cloud 1:N facial identification with customizable similarity threshold. [source](https://regulaforensics.com/products/face-recognition-sdk/)
- **In-house face-embedding store** (alternative to vendor) — provider stores face embeddings from all IDV sessions in a vector database (Pinecone, Milvus, pgvector) and runs 1:N similarity search at enrollment. Requires the provider to retain biometric templates, which has significant privacy/consent implications.
- **Privacy and consent framework** — biometric data is regulated under BIPA (Illinois), CCPA/CPRA (California), GDPR (EU), and equivalent state/national laws. The provider must obtain explicit informed consent for biometric template storage and cross-customer comparison. [best guess: legal review and consent-flow engineering cost $20K–$50K initial.]

## endpoint_details

### Jumio (vendor-hosted)
- **Product:** Jumio Identity Verification + Jumio KYX (Know Your Everything) platform.
- **API:** RESTful; documented at [Jumio developer portal](https://www.jumio.com/). The 1:N Face Lookup is part of the KYX / fraud-prevention module.
- **Auth:** API key + secret.
- **Rate limit:** [vendor-gated — rate limits depend on contract tier; Jumio supports "millions of identities" in their graph per their marketing materials.]
- **Pricing:** [vendor-gated — Jumio does not publish per-transaction pricing; industry estimates for IDV transactions range from $1–$5 per verification, with deduplication as an add-on module. Per HyperVerge's competitive analysis, Jumio pricing is "customized based on each business's unique and specific needs." [source](https://hyperverge.co/blog/jumio-pricing/) Would require sales contact for exact 1:N dedup pricing.]
- **Coverage:** Jumio claims to process transactions across 200+ countries with "billions of data points" in the Identity Graph. [source](https://www.jumio.com/technology/)
- **ToS:** Standard enterprise SaaS; biometric data retention policies vary by contract.

### MetaMap (vendor-hosted)
- **Product:** MetaMap Identity Verification with Duplicate Detection via Facematch.
- **API:** RESTful; [docs](https://docs.metamap.com/docs/biometrics).
- **Auth:** API key.
- **Pricing:** [vendor-gated — MetaMap offers tiered pricing; per-verification cost and dedup add-on cost not publicly listed.]

### Didit (vendor-hosted, free tier)
- **Product:** Didit Face Search 1:N.
- **URL:** [https://didit.me/products/face-search-1ton/](https://didit.me/products/face-search-1ton/)
- **Pricing:** Free duplicate and blocklist detection is offered as part of Didit's identity verification workflows. [source](https://didit.me/products/face-search-1ton/) [vendor-gated — throughput limits and enterprise pricing not publicly documented.]

### In-house (self-hosted)
- **Stack:** Face embedding model (ArcFace / FaceNet / vendor SDK) + vector database (Pinecone, Milvus, pgvector).
- **Auth:** Internal.
- **Pricing:** Compute cost; [best guess: $0.001–$0.01 per 1:N query at moderate scale (<100K templates) with a cloud vector DB; dominated by embedding model inference cost at ~$0.01–$0.05 per image.]
- **Setup cost:** [best guess: $100K–$300K for model integration, vector DB setup, bias testing, privacy review, consent UX, and regulatory compliance. Ongoing: $30K–$80K/year for model updates, bias monitoring, and legal compliance.]

## fields_returned

Per biometric dedup check (from vendor or in-house):
- `face_template_id` — unique identifier for the enrolled face template
- `duplicate_found` — boolean
- `duplicate_matches` — list of prior template IDs with similarity scores
  - `matched_template_id`
  - `matched_identity_name` (or hash, depending on privacy policy)
  - `matched_identity_created_at`
  - `similarity_score` — 0.0 to 1.0
  - `matched_identity_status` — active / suspended / denied
- `multi_template_for_same_identity` — boolean (same identity, different face templates across sessions)
- `liveness_result` — pass/fail (from the IDV session that generated the template)
- `document_match_result` — whether the face matches the submitted ID document

## marginal_cost_per_check

- **Jumio:** [vendor-gated — $1–$5 per IDV transaction is the industry range; 1:N dedup add-on cost unknown. [best guess: $2–$8 per check inclusive of IDV + dedup, based on Jumio's enterprise positioning and competitor pricing.]]
- **MetaMap:** [vendor-gated — similar range expected.]
- **Didit:** $0 for free tier; enterprise pricing unknown.
- **In-house:** [best guess: $0.01–$0.10 per 1:N query at scale; dominated by embedding inference. But setup cost is $100K–$300K.]
- **Composite:** [best guess: $2–$8 per check if using a vendor (IDV + dedup bundled); $0.01–$0.10 per check if in-house (but with large setup cost).]

## manual_review_handoff

When `biometric_template_collision` fires:

1. **Reviewer sees:** the new customer's submitted selfie and ID document (redacted as required by policy), the matched prior customer's record (template ID, name, DOB, institution, enrollment date, account status), and the similarity score.
2. **Decision tree:**
   - **Same face, different identity (different name/DOB/institution):**
     - Similarity > 0.95 and prior identity was denied/suspended: **reject** — likely the same person re-enrolling under a new identity after a prior denial.
     - Similarity > 0.95 and prior identity is active: **escalate** — possible synthetic-identity factory, or a legitimate case (name change, institution change). Reviewer contacts both account holders.
     - Similarity 0.85–0.95: **investigate** — could be a close resemblance, a twin, or a deepfake artifact. Reviewer examines liveness scores and document quality.
     - Similarity < 0.85: **dismiss** — below dedup threshold; likely coincidental resemblance.
   - **Same identity, different face templates:**
     - Templates diverge significantly across sessions: flag as possible account sharing or deepfake substitution. Reviewer requests a live video call.
     - Templates show normal drift (aging, lighting variation): **clear**.
3. **Privacy constraint:** reviewer may only see biometric data with appropriate access controls and audit logging. Biometric images should be displayed in the review UI but never exported or downloaded.

## flags_thrown

- `biometric_template_collision` — one face template matches a different identity's template above the dedup threshold. **Action:** manual review.
- `biometric_template_collision_prior_denied` — collision with a prior-denied identity. **Action:** reject pending review; escalate to biosecurity.
- `biometric_multi_template` — same identity has significantly divergent face templates across IDV sessions. **Action:** investigate.
- `biometric_liveness_fail` — the IDV session that generated the template failed liveness detection. **Action:** reject; request re-verification.

## failure_modes_requiring_review

- **Privacy / consent constraints.** BIPA (Illinois) requires written consent before collecting biometric identifiers; GDPR requires a lawful basis (likely legitimate interest or explicit consent). If the provider cannot obtain consent from all customers for cross-customer biometric comparison, the check cannot run. This is a structural constraint, not a technical one.
- **Vendor lock-in.** If the provider uses a vendor's 1:N dedup, the biometric templates are typically stored in the vendor's cloud. Switching vendors means losing the historical template database and starting cold.
- **Cross-vendor dedup gap.** The cro-identity-rotation attacker story explicitly selects "at most one provider per IDV vendor to avoid same-vendor cross-tenant biometric matching." Cross-tenant (cross-provider) dedup is not available from any vendor today — each provider can only dedup within its own tenant. [searched for: "cross-tenant biometric deduplication across IDV vendors", "industry biometric blocklist shared across providers" — no production system found. The concept exists in government systems (India's UIDAI Aadhaar) but not in commercial IDV.]
- **Deepfake / injection attacks.** The attacker stories (account-hijack, credential-compromise) describe deepfake injection and face morphing that can defeat liveness detection. If the IDV session is spoofed, the resulting template is the attacker's synthetic face, which may or may not collide with prior templates depending on the attack sophistication.
- **Racial and demographic bias.** Face recognition systems have documented accuracy disparities across demographic groups. The similarity threshold must be tested for bias; a threshold that works well for one demographic may produce excess false positives or false negatives for another. [best guess: requires dedicated bias audit; $10K–$30K if done by an external testing firm.]
- **Cold-start problem.** The dedup database starts empty. The check provides no value until the provider has processed enough IDV sessions to build a meaningful template database. [best guess: need ~1,000+ templates before collision probability becomes meaningful for detecting rotation schemes.]

## false_positive_qualitative

- **Identical twins** at different institutions — biologically identical face templates, legitimately different identities.
- **Researchers who change institutions** — same person, same face, different affiliation. The enrollment at the new institution will collide with the old one. This is a true positive in a narrow sense (same biometric, different identity record) but a false alarm for the intended use case.
- **Common-face-feature bias** — demographic groups with lower inter-person facial distinctiveness (as measured by the embedding model) will produce more false collisions. This is a known bias vector.
- **Low-quality IDV sessions** — poor lighting, low-resolution cameras, or unusual angles can produce noisy embeddings that cluster artificially.

## record_left

- **Template ID** and **similarity scores** for all matches above the dedup threshold.
- **Liveness detection result** from the IDV session.
- **Document verification result** (ID document matched the face).
- **Reviewer's adjudication memo** — which matches were investigated and what was concluded.
- **Consent record** — evidence that the customer consented to biometric template storage and cross-customer comparison.
- **Audit log** of all biometric data access events (who viewed, when, from where).
- Note: the face template itself is stored by the IDV vendor or in-house vector DB, not in the order record. The order record references the template ID.

## attacker_stories_addressed (refined)

- **cro-identity-rotation:** directly targeted — this is the primary use case. The branch "picks at most one provider per IDV vendor to avoid same-vendor cross-tenant biometric matching." Within a single provider's tenant, the check catches the same person enrolling with different identities. But the cross-vendor gap is structural: the check does NOT catch rotation across providers that use different IDV vendors.
- **synthetic-identity:** directly targeted — a factory producing multiple fake identities all using one person's real face will collide on the face template.
- **identity-rotation (generic):** directly targeted — any scheme where one person enrolls under multiple names at the same provider.
- **account-hijack (deepfake):** partially addressed — if the deepfake injection produces a face template that collides with the real PI's prior enrollment, the check catches it. If the deepfake is of a novel synthetic face, no collision occurs. If the injected face is the attacker's real face (not the PI's), it may collide with the attacker's other accounts (if any).
- **dormant-account-takeover (deepfake):** same as account-hijack.
- **credential-compromise:** NOT addressed — if the attacker uses the real victim's face (via deepfake injection), the template matches the prior enrollment perfectly, which is a 1:1 verification pass, not a 1:N dedup hit.
- **shell-nonprofit, shell-company, biotech-incubator-tenant, cro-framing:** partially addressed — these branches use real accomplices with real faces. The check catches the accomplice only if the same person acts as the principal for multiple shell entities at the same provider.
- **fronted-accomplice patterns (generic):** weakly addressed — if each shell has a unique fronted person, no collision occurs. The check catches only accomplice reuse.
