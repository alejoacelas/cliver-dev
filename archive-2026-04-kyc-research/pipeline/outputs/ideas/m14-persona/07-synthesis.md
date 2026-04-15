# Per-idea synthesis: m14-persona

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Persona Inquiry workflow (government ID + selfie + database, configurable IAL2) |
| **measure** | M14 — identity-evidence-match |
| **attacker_stories_addressed** | account-hijack (Branch C), credential-compromise (Branch A), dormant-account-takeover (Branch D), dormant-domain (Branch A), bulk-order-noise-cover (Branch E). Does NOT address fronted-accomplice branches. |
| **summary** | Persona offers a configurable Inquiry that chains Government ID, Selfie (with liveness), Database, and AML/Watchlist verifications into a single workflow. For the synthesis use case, the relevant configuration is Government ID + Selfie + Database returning IAL2-equivalent evidence. Persona's selfie liveness is iBeta-tested for ISO/IEC 30107-3 PAD compliance and aligned with CEN/TS 18099:2024 for injection-attack detection. Recognized in the 2025 Forrester IDV Wave. Persona does NOT hold Kantara-listed IAL2 certification — it is configurable to meet IAL2 evidence requirements but is not a certified trust framework provider. |
| **external_dependencies** | Persona platform (commercial vendor; withpersona.com); Persona SDKs (Web JS, iOS, Android, React Native, Flutter); Persona REST API v1; Database verification sub-providers (LexisNexis-tier, vendor-managed); Document/issuer database sub-providers. |
| **endpoint_details** | Single global API: `api.withpersona.com/api/v1/`. Auth: Bearer token; production keys `persona_production_*`, sandbox `persona_sandbox_*`. Core: `POST /api/v1/inquiries`, `GET /api/v1/inquiries/{id}`, per-verification endpoints. Webhooks: HMAC-SHA256 signed push. Rate limits: [unknown — searched for: "Persona API rate limit", "withpersona API throttle", etc.]. Pricing: Startup Program 500 free/month for one year, then ~$1/completed verification; mid-volume [best guess: $1.50–$3.00 per inquiry]; enterprise [vendor-gated]. Vendr reports 2x pricing increase in 2024. ToS: SOC 2 Type II, GDPR, HIPAA-eligible. NOT Kantara-listed IAL2. |
| **fields_returned** | **Inquiry:** `id`, `status` (created/pending/completed/failed/approved/declined/needs_review/expired), `reference_id`, `behaviors` (request_spoof_attempts, user_agent_suspicious, devtools_open), `tags[]`, relationships to verifications/reports/account. **Government ID:** `status`, `country_code`, `entity_confidence_score`, `entity_confidence_reasons[]`, `name_first/last`, `birthdate`, `address_*`, `identification_number`, `id_class`, `issue_date`, `expiration_date`, photo URLs, `checks[]` (id_face_match, id_mrz_inspection, id_visible_photo_features, id_compromised_or_repeated, id_disallowed_country, etc.). **Selfie:** `status`, photo URLs (center/left/right), `checks[]` (selfie_liveness, selfie_pose, selfie_unique, selfie_glare, selfie_blur). **Database:** `status`, matched/missing fields structure. |
| **marginal_cost_per_check** | Low-volume (<500/month Startup Program): $0 first year, then ~$1/completed inquiry. Mid-volume (1k–10k/month): [best guess: $1.50–$3.00 per Government ID + Selfie + Database inquiry]. Enterprise: [vendor-gated]. **setup_cost:** No documented implementation fee; Startup Program is self-serve. Enterprise [vendor-gated]. |
| **manual_review_handoff** | Nine-step playbook: (1) Open Persona Dashboard, navigate to Inquiry. (2) Review timeline, behaviors signals, each verification's checks[]. (3) Review captured photos. (4) `id_compromised_or_repeated` / `id_no_data_extracted`: request re-capture. (5) `id_face_match` failure: re-invite selfie, escalate on second failure. (6) `selfie_liveness` failure + automation signals: hard-deny, freeze, escalate. (7) `selfie_unique` flag (selfie matches another tenant identity): hard-deny + investigate multi-persona attack. (8) `id_disallowed_country` / `id_unknown_country`: route to compliance. (9) Document decision in case-management system or Persona Cases. |
| **flags_thrown** | `persona_inquiry_failed` (top-level failure — deny pending review), `persona_id_check_failed` (any Government ID check failed — re-capture or escalate), `persona_face_no_match` (id_face_match failure — re-invite + escalate), `persona_liveness_failed` (re-invite once, then escalate), `persona_selfie_collision` (selfie_unique flag — hard-deny + investigate), `persona_behaviors_suspicious` (devtools_open / user_agent_suspicious — combine with other flags), `persona_disallowed_country` (route to compliance). |
| **failure_modes_requiring_review** | Webhook delivery failure (fall back to polling); inquiry expires before completion; Government ID type unsupported; database returns null for international addresses; selfie liveness failures from low-end devices; behaviors signal noise from privacy-conscious researchers; Persona Cases queue overflow during ramp. |
| **false_positive_qualitative** | (1) Non-Latin-script name mismatch — ~8–15% of global customers. (2) Database thin coverage outside OECD — ~15–30% of international customers lack database cross-reference. (3) Age-gap face mismatch — ~20–40% of passport holders with >5yr photos. (4) Behavioral signal false triggers — ~5–10% of technically sophisticated customers. (5) Unsupported document types — ~2–5%. (6) `selfie_unique` multi-account collisions — ~1–3% of legitimate multi-institutional researchers. (7) Name changes — ~1–3%/year. |
| **coverage_gaps** | (1) Unsupported document types: ~2–5%. (2) Non-Latin-script names: ~8–15% chronic FP. (3) Database thin coverage: Persona covers 40+ countries; ~15–30% of international customers lack database cross-reference, degrading three-factor evidence to two-factor. (4) Facial bias — age gap (20–40%), head coverings (3–8%), skin tone (<0.5% incremental). (5) `selfie_unique` FP for multi-account users: ~1–3%. (6) Behavioral signal FP for power users: ~5–10%. (7) No Kantara IAL2 certification: regulatory/compliance gap affecting posture for all customers. |
| **record_left** | Per invocation: Persona Inquiry ID, structured JSON inquiry + verifications + reports payloads, captured photo URLs (retention per contract; redactable via API), reviewer decision in provider case-management system or Persona Cases. Auditable for regulator review. |
| **bypass_methods_known** | Deepfake injection (CAUGHT — PAD + injection detection + behaviors signals), fraudulent govt ID (CAUGHT), presentation attack (CAUGHT), shared-account predecessor mismatch with re-proofing (CAUGHT — id_face_match), same-person multi-persona within tenant (CAUGHT — selfie_unique), email-only ordering (CAUGHT if required). Face morphing on genuine document (AMBIGUOUS — MAD not confirmed), IDV-session handoff (AMBIGUOUS — behaviors may flag cross-device inconsistency). |
| **bypass_methods_uncovered** | ATO inherits prior IAL2 without re-proofing; face morphing on genuine document substrate (MAD not confirmed); social-engineer support/reviewer; fresh real accomplice (structural); same-person multi-persona across tenants/providers; real ID throughout (structural). |

---

## Section 2: Narrative

### What this check is and how it works

Persona provides a configurable identity verification workflow (called an "Inquiry") that chains together Government ID verification, selfie with liveness detection, database cross-referencing, and optional AML/watchlist screening. The customer captures their government ID and completes a selfie check with multiple poses (center, left, right). The Government ID verification extracts identity fields, validates the MRZ, checks visual photo features, and matches against a known-fraud database. The selfie verification performs liveness detection aligned with ISO/IEC 30107-3 PAD and CEN/TS 18099:2024 for injection-attack defense. The database verification cross-references extracted identity fields against commercial databases (LexisNexis-tier) in 40+ countries. Additionally, Persona captures behavioral signals (developer tools open, suspicious user agents, spoof attempts) that flag automation. A unique differentiator is the `selfie_unique` check, which detects if the same face has appeared in another inquiry within the synthesis provider's Persona tenant — a built-in within-tenant biometric dedup capability. The synthesis provider receives structured results via webhook or API polling, with a dashboard and built-in Cases workflow for manual review.

### What it catches

Persona catches the same core attack patterns as Jumio and Onfido — deepfake injection, presentation attacks, overt document fraud, and forged government IDs — with injection-detection capabilities aligned to current standards (iBeta PAD, CEN/TS 18099:2024). It catches shared-account predecessor mismatches via face-comparison failure when order-time re-proofing is enforced. Distinctively, Persona's `selfie_unique` check partially addresses the same-person multi-persona attack (story 9): if one person attempts to verify as two different applicants within the same Persona tenant, the duplicate face is flagged. This is a capability that Jumio and Onfido do not expose as a standard selfie check. Behavioral signals (devtools_open, user_agent_suspicious) provide an additional injection/automation detection layer.

### What it misses

The bypass profile is similar to Jumio and Onfido with a few distinctions. ATO that inherits a prior IAL2 pass is missed without an explicit re-proofing trigger. Face morphing on genuine substrates remains AMBIGUOUS (MAD not confirmed). Social-engineering the reviewer bypasses the automated pipeline. Fronted-accomplice with real ID, real-ID-throughout, and same-person multi-persona across different Persona tenants or providers all pass natively. The `selfie_unique` dedup is tenant-scoped only — an attacker using different synthesis providers (each with their own Persona tenant) would not be caught. The database verification's 40-country coverage means the three-factor evidence model (document + selfie + database) degrades to two-factor (document + selfie) for most non-OECD customers.

### What it costs

Persona is the most accessible entry point for small synthesis providers: the Startup Program provides 500 free verifications per month for one year, then ~$1 per completed inquiry. Mid-volume pricing is estimated at $1.50–$3.00 per Government ID + Selfie + Database inquiry, in the same band as Jumio and Onfido. However, Vendr reports that Persona more than doubled pricing for many contracts in 2024, so the initial cost advantage may not persist. Enterprise pricing is vendor-gated. There is no documented setup or integration fee for self-serve integrations.

### Operational realism

The manual review handoff is well-specified with a nine-step playbook using Persona's Dashboard and built-in Cases workflow. The `entity_confidence_score` and `entity_confidence_reasons` provide more granular reviewer guidance than some competitors. However, the behavioral signals (devtools_open, user_agent_suspicious) generate false positives for an estimated 5–10% of technically sophisticated synthesis customers (computational biologists, bioinformaticians) — the SOP must explicitly state that behavioral signals should not be standalone denial reasons. The `selfie_unique` check, while valuable for detecting multi-persona attacks, produces false positives for an estimated 1–3% of legitimate multi-institutional researchers. Each inquiry produces an auditable record with structured JSON, captured photos (redactable via API), and reviewer decisions. Photo retention is configurable per contract.

### Open questions

The most significant open question is regulatory: Persona is NOT Kantara-listed at IAL2, unlike Jumio and Entrust/Onfido. If M14 mandates IAL2 certification (not just IAL2-equivalent configuration), Persona would not qualify without explicit regulatory guidance or self-attestation by the synthesis provider. The implementation does not specify the minimum inquiry configuration that meets IAL2 evidence requirements or include a recommendation for compliance review. The re-proofing trigger policy is unspecified (same as all vendor-IDV ideas). The exact document subtype count is unknown (coverage map gated behind dashboard login). Whether the `selfie_unique` check operates within-tenant only or has any cross-tenant capability is not documented. The single global API endpoint (`api.withpersona.com`) without regional split may raise data residency concerns for EU/UK customers.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 passed with no Critical flags.
- **Moderate finding M1 (ATO-inherits-prior-IAL2):** Same gap as Jumio/Onfido — no explicit re-proofing trigger policy.
- **Moderate finding M2 (morph attack detection):** MAD not confirmed as a discrete Persona capability. Same residual risk as all vendor-IDV ideas.
- **Moderate finding M3 (no Kantara IAL2 certification):** Persona is configurable to meet IAL2 but is not a certified trust framework provider. If M14 requires certification, Persona would not qualify. The integrator must explicitly configure the inquiry to IAL2 requirements and may need to self-attest. Misconfiguration risk is higher than with Jumio or Entrust.
- **Moderate finding M4 (fronted-accomplice structural gap):** Structural; same as all M14 ideas.
- **[unknown] fields:**
  - API rate limits (4-query search).
  - Exact document subtype count (gated behind dashboard login).
  - `selfie_unique` cross-tenant vs. within-tenant scope.
  - Data residency implications of single global endpoint.
- **[vendor-gated] fields:**
  - Enterprise pricing.
  - Setup/integration fees at enterprise tier.
  - NFC incremental capability (Persona's NFC documentation not fully explored).
- **[best guess] fields requiring validation:**
  - $1.50–$3.00 per inquiry at mid-volume.
  - 2–5% unsupported document types.
  - 15–30% of international customers outside database coverage.
  - 5–10% behavioral signal false triggers.
  - 1–3% `selfie_unique` false positives for multi-account users.
- **Missing citation (flagged by 04C):** `selfie_unique` tenant-scoping documentation — v1 references this check but does not directly cite the Persona Selfie verification reference page.
