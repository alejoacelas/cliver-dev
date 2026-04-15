# m14-persona — Implementation research v1

- **measure:** M14 — identity-evidence-match
- **name:** Persona Inquiry workflow (government ID + selfie + database, configurable IAL2)
- **modes:** D

## summary

Persona (withpersona.com) offers a configurable Inquiry that strings together verification primitives — Government ID, Selfie (with liveness), Database, Document, and AML/Watchlist — into a single workflow keyed to a unique `inquiry_id`. For the DNA synthesis use case, the relevant configuration is a Government ID + Selfie + Database inquiry that returns IAL2-equivalent evidence. Persona has been recognized in the 2025 Forrester IDV Wave and reports iBeta-tested ISO/IEC 30107-3 PAD compliance for selfie liveness plus alignment with CEN/TS 18099:2024 for injection-attack detection [source](https://www.biometricupdate.com/202506/persona-powers-up-its-idv-solution-as-deepfake-workplace-fraud-surges).

## attacker_stories_addressed

Same cluster as Jumio/Onfido: account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A), bulk-order-noise-cover (E). Does NOT address fronted-accomplice branches.

## external_dependencies

- Persona platform (commercial vendor; persona.com / withpersona.com)
- Persona SDKs (Web JS, iOS, Android, React Native, Flutter)
- Persona REST API v1 for Inquiries, Verifications, Reports, Cases
- Database verification sub-providers (vendor-managed; LexisNexis-tier per vendor docs)
- Document/issuer database sub-providers for government ID validation

## endpoint_details

- **Product page:** https://withpersona.com/product/verifications [source](https://withpersona.com/product/verifications/selfie)
- **Documentation hub:** https://docs.withpersona.com [source](https://docs.withpersona.com/api-introduction)
- **API base URL:** `https://api.withpersona.com/api/v1/` (single global endpoint, no regional split documented).
- **Auth model:** Bearer token in the `Authorization` header. Production keys prefixed `persona_production_*`; sandbox keys `persona_sandbox_*` [source](https://docs.withpersona.com/api-introduction).
- **Core endpoint:** `POST /api/v1/inquiries` to create an inquiry; `GET /api/v1/inquiries/{id}` to retrieve [source](https://docs.withpersona.com/api-reference/inquiries). Specific verification endpoints (e.g., `POST /api/v1/verifications/government-id`) for direct API-only flows [source](https://docs.withpersona.com/integration-guide-gov-id-via-api).
- **Webhooks:** Push to a customer-hosted HTTPS URL with HMAC-SHA256 signature header. Events include `inquiry.created`, `inquiry.completed`, `inquiry.declined`, `verification.passed`, `verification.failed`.
- **Rate limits:** [unknown — searched for: "Persona API rate limit", "withpersona API throttle", "Persona requests per second quota", "docs.withpersona.com rate limiting"]
- **Pricing:** Public Startup Program: 500 verifications/month free for one year; subsequent verifications ~$1 each; charges apply only after pass/fail (not abandoned), 12-month minimum contract on paid plans [source](https://www.vendr.com/marketplace/persona). Enterprise tier custom; Vendr reports "more than doubled pricing for many contracts" in 2024 [source](https://www.vendr.com/marketplace/persona). Treat the $1/check figure as floor for low-volume; mid/large-enterprise tier is [vendor-gated].
- **ToS / compliance posture:** SOC 2 Type II, GDPR, HIPAA-eligible. Persona's glossary references NIST 800-63 IAL definitions but the company does NOT publicly claim Kantara-listed IAL2 certification at the same level Jumio/Entrust do; Persona is configurable to *meet* IAL2 evidence requirements but is not a certified trust framework provider per public sources [source](https://withpersona.com/identity-glossary/identity-assurance-levels-ial). For DNA-synthesis SOC orders the integrator must explicitly configure the inquiry to require IAL2-acceptable evidence (one strong + two fair, or equivalent).

## fields_returned

From the Inquiry retrieval response (publicly documented [source](https://docs.withpersona.com/api-reference/inquiries) [source](https://docs.withpersona.com/api-reference/verifications/government-id-verifications/retrieve-a-government-id-verification)):

**Inquiry object:**
- `id`, `status` — created / pending / completed / failed / approved / declined / needs_review / expired
- `reference_id` (customer-provided), `note`
- `created_at`, `started_at`, `completed_at`, `decisioned_at`, `expired_at`
- `behaviors` — bot/automation signals (request_spoof_attempts, user_agent_suspicious, devtools_open)
- `tags[]`
- `relationships.verifications[]`, `relationships.reports[]`, `relationships.account`, `relationships.inquiry_template`

**Government ID verification:**
- `status` — passed / failed / requires_retry
- `country_code`, `entity_confidence_score`, `entity_confidence_reasons[]`
- `name_first`, `name_middle`, `name_last`, `birthdate`, `address_street_1/2`, `address_city`, `address_subdivision`, `address_postal_code`, `address_country_code`
- `identification_number`, `id_class` (driver_license / passport / national_id / residence_permit / etc.), `id_number`, `issue_date`, `expiration_date`
- `front_photo_url`, `back_photo_url`, `selfie_photo_url`
- `capture_method`, `device_type`, `id_class_description`
- `checks[]` — list of sub-checks with `name`, `status`, `reasons[]`: e.g., `id_double_side_required`, `id_extracted_properties_compared`, `id_no_data_extracted`, `id_unknown_country`, `id_compromised_or_repeated`, `id_disallowed_country`, `id_age_inconsistency`, `id_expired`, `id_face_detection`, `id_face_match` (between selfie and document portrait), `id_mrz_inspection`, `id_visible_photo_features`, `id_real_id_compliance`

**Selfie verification:**
- `status`, `selfie_photo_url`, `center_photo_url`, `left_photo_url`, `right_photo_url`
- `checks[]` — `selfie_face_detection`, `selfie_pose`, `selfie_liveness`, `selfie_glare`, `selfie_blur`, `selfie_orientation_change`, `selfie_unique` (uniqueness across customer's tenant)

**Database verification:**
- `status`, `name_first`, `name_last`, `address_*`, `phone_number`, `email_address`, fields-matched/fields-missing structure
- Sub-checks vary by database vendor

[source](https://docs.withpersona.com/integration-guide-database-verification-via-api)

## marginal_cost_per_check

For low-volume DNA-synthesis use (<500/month under Startup Program): effectively $0 marginal during the first year, then ~$1.00 per completed inquiry [source](https://www.vendr.com/marketplace/persona).

For mid-volume (1k–10k/month): [best guess: $1.50–$3.00 per Government ID + Selfie + Database inquiry. Reasoning: Vendr reports 2x pricing increase in 2024 from a baseline near $1; comparable Jumio/Onfido/Veriff cluster $1.20–$3.50 per check at this volume tier.]

- **setup_cost:** No publicly documented implementation fee; Startup Program is self-serve. Enterprise tier [vendor-gated].

## manual_review_handoff

When inquiry status is `needs_review`, `failed`, or `declined`, OR any individual verification check returns `failed`/`requires_retry`:

1. Reviewer opens the Persona Dashboard, navigates to the Inquiry by `id` or `reference_id`.
2. Reviewer reviews the Inquiry timeline, behaviors signals (devtools_open, user_agent_suspicious), and each verification's `checks[]` array.
3. Reviewer reviews the captured `front_photo_url`, `back_photo_url`, and `selfie_photo_url`.
4. **For `id_compromised_or_repeated`, `id_double_side_required`, `id_no_data_extracted`:** request a re-capture with re-invitation link.
5. **For `id_face_match` failure:** request fresh selfie via re-invitation; on second failure escalate to compliance.
6. **For `selfie_liveness` failure:** treat as elevated suspicion. If the inquiry also shows `behaviors.devtools_open` or other automation signals, hard-deny the SOC order, freeze the customer account, and escalate to compliance.
7. **For `selfie_unique` flag (selfie clusters with another tenant identity):** hard-deny + investigate as synthetic-identity / multi-persona attack.
8. **For `id_disallowed_country` or `id_unknown_country`:** check sanctions/jurisdiction policy; route to compliance.
9. Reviewer documents the decision and reviewer ID in the synthesis provider's case-management system; can also use Persona Cases for built-in workflow.

## flags_thrown

- `persona_inquiry_failed` — top-level Inquiry `status = failed/declined`. Action: deny SOC order pending review.
- `persona_id_check_failed` — any Government ID `checks[].status = failed`. Action: re-capture or escalate per check name (steps 4–8).
- `persona_face_no_match` — `id_face_match` failure. Action: re-invite + escalate on second failure.
- `persona_liveness_failed` — `selfie_liveness` failure. Action: re-invite once; escalate.
- `persona_selfie_collision` — `selfie_unique` flag. Action: hard-deny + investigate.
- `persona_behaviors_suspicious` — devtools_open / user_agent_suspicious. Action: combine with other flags; if inquiry also has check failures, hard-deny.
- `persona_disallowed_country` — `id_disallowed_country`. Action: route to compliance for jurisdictional review.

## failure_modes_requiring_review

- Webhook delivery failure → fall back to `GET /api/v1/inquiries/{id}` polling.
- Inquiry expires before customer completes (expired_at populated).
- Government ID type / sub-type unsupported in customer's region → `id_unknown_country` or no extraction.
- Sub-database returns null (`fields_missing`) for the customer's address/phone — common for international addresses.
- Selfie liveness failures from low-end devices, glare, masks.
- Behaviors signal noise (e.g., a privacy-conscious researcher using devtools triggers `devtools_open` benignly).
- Persona Cases queue overflow during ramp.

## false_positive_qualitative

- International researchers in countries on Persona's `id_disallowed_country` list (configured per workflow) — false-positive only if the country is policy-permitted but not vendor-supported.
- Non-Latin-script names romanized in the synthesis-provider account → `entity_confidence_reasons` mismatch.
- Recent name changes (marriage, gender marker) where ID lags account record.
- `selfie_unique` collisions for legitimate users who use multiple research-team accounts at different institutions.
- Privacy-conscious users who trigger `behaviors.devtools_open` benignly.
- Customers from countries where Persona's database sub-providers have thin coverage (most non-OECD jurisdictions).

## record_left

For each invocation: Persona Inquiry ID, the structured JSON inquiry+verifications+reports payloads, captured front/back/selfie photo URLs (retention per Persona contract; redactable via `POST /api/v1/verifications/{id}/redact`), the human reviewer's decision in the synthesis provider's case-management system or Persona Cases. Auditable artifact suitable for regulator review under M14 SOP.

## bypass_methods_known / uncovered

(Stage 5. Persona's PAD aligns with ISO/IEC 30107-3 + CEN/TS 18099:2024 for injection detection. Cannot resist fronted-accomplice or ATO-with-no-reproof.)

---

## Sources

- https://docs.withpersona.com/api-introduction
- https://docs.withpersona.com/api-reference/inquiries
- https://docs.withpersona.com/api-reference/verifications/government-id-verifications/retrieve-a-government-id-verification
- https://docs.withpersona.com/integration-guide-gov-id-via-api
- https://docs.withpersona.com/integration-guide-database-verification-via-api
- https://docs.withpersona.com/api-reference/verifications
- https://withpersona.com/product/verifications/selfie
- https://withpersona.com/identity-glossary/identity-assurance-levels-ial
- https://www.biometricupdate.com/202506/persona-powers-up-its-idv-solution-as-deepfake-workplace-fraud-surges
- https://www.biometricupdate.com/202501/new-persona-release-helps-businesses-detect-ai-based-face-spoofs
- https://www.vendr.com/marketplace/persona
- https://www.prnewswire.com/news-releases/persona-named-a-leader-in-the-2025-identity-verification-solutions-report-302570782.html
