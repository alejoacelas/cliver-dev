# Per-idea synthesis: m14-login-gov-id-me

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Federated IAL2 via Login.gov / ID.me / GOV.UK One Login |
| **measure** | M14 — identity-evidence-match |
| **attacker_stories_addressed** | credential-compromise (Branch A — federated MFA blocks some ATO paths), account-hijack (Branch C — IDP biometric stack absorbs deepfake/morph surface), dormant-account-takeover (Branch D — IDP detects re-binding), bulk-order-noise-cover (Branch E — federated assertion uniquely identifies the human). Does NOT address fronted-accomplice branches or inbox-compromise. |
| **summary** | Instead of implementing IAL2 evidence collection in-house, the synthesis provider redirects the customer to a federated IDP (Login.gov for US government users, ID.me for cross-sector US, GOV.UK One Login for UK) and consumes the resulting OIDC `id_token` plus userinfo claims as the M14 evidence-match artifact. The IDP holds the documentary evidence and biometric record; the provider holds only verified claims and the signed assertion. This reduces vendor exposure but is structurally limited to populations with (or willing to create) a federated identity. |
| **external_dependencies** | Login.gov (GSA-operated; OIDC + SAML; US federal use cases — likely structurally unavailable to private-sector providers); ID.me (private CSP; OIDC/OAuth2; commercial + government; Kantara-listed IAL2/AAL2); GOV.UK One Login (UK Cabinet Office; out of US scope); OIDC client libraries on the provider side. |
| **endpoint_details** | **Login.gov:** OIDC authorization at `secure.login.gov/openid_connect/authorize`; token endpoint via `private_key_jwt` only (no `client_secret_basic`); IAL2 ACR: `urn:acr.login.gov:verified-facial-match-required`. Partner onboarding requires IAA with GSA. Pricing: [vendor-gated — revised July 2024 with claimed 70% IDV cost reduction; per-transaction figures unknown]. Private-sector availability: [vendor-gated and likely structurally unavailable]. **ID.me:** OAuth 2.0 Authorization Code with PKCE at `api.id.me/oauth/`; attributes at `api.id.me/api/public/v3/attributes.json`; access tokens expire 5 min. IAL2/AAL2, Kantara-listed. Pricing: [vendor-gated; best guess $2–$5 per IAL2 verification on small commercial contracts]. Rate limits: [unknown — searched for: "ID.me API rate limit", "developers.id.me throttling"]. |
| **fields_returned** | **Login.gov:** `sub` (UUID stable per RP), `email`, `email_verified`, `given_name`, `family_name`, `birthdate`, `address`, `phone`, `phone_verified`, `social_security_number` (if scoped), `verified_at`, `ial`, `acr`. **ID.me:** `sub`, `email`, `verified`, `verified_first_name`, `verified_last_name`, `verified_birth_date`, `verified_phone`, `verified_address`, `groups[]` (military, medical, government, student, teacher, etc.), `affiliation_status`, `verification_level`. |
| **marginal_cost_per_check** | **Login.gov:** [vendor-gated — structural availability gate more relevant than cost]. **ID.me:** [best guess: $2–$5 per IAL2 verification on small commercial contracts; premium over Jumio/Onfido/Persona due to CSP role and government certifications]. Setup: [vendor-gated — likely six-figure annual commitment for commercial integrators at IAL2 tier]. |
| **manual_review_handoff** | Structurally a black box — provider sees only boolean outcome, not document images or selfie. Five-step playbook: (1) `verified = false` — ask customer to retry federated flow; if refused, fall back to vendor IDV. (2) Verified claim mismatch with account record — clarification + compliance review. (3) `verified_at` stale — force re-auth with IAL2 ACR. (4) Group-affiliation inconsistency (ID.me) — verify against institutional account. (5) Disputed identity — refer customer to IDP dispute process, hold SOC order. No equivalent of Jumio/Onfido/Persona dashboard for document inspection. |
| **flags_thrown** | `federated_unverified` (deny SOC pending retry), `federated_claim_mismatch` (clarification + compliance review), `federated_stale_proof` (force re-auth), `federated_acr_downgrade` (deny + re-prompt), `federated_consent_denied` (deny + offer vendor-IDV fallback). |
| **failure_modes_requiring_review** | IDP outage / 5xx (fail-closed, retry with backoff); JWKS rotation not picked up (assertion validation failure); customer cannot create federated identity (no qualifying docs / group); Login.gov private-sector eligibility denied; ID.me trusted-referee video chat queue overflow (provider sees only failure); ACR coercion edge cases (IDP downgrades silently). |
| **false_positive_qualitative** | (1) International researchers — 40–60% of global customers have zero coverage (hard exclusion, not FP). (2) Login.gov structurally unavailable to private sector — collapses to ID.me only. (3) US researchers without existing account — 20–40% face enrollment friction (10–30 min IAL2 enrollment). (4) Privacy-conscious researchers refusing ID.me — 5–15% of eligible US customers (FTC consent action headwinds). (5) Black-box adjudication — 10–15% of IDP-rejected customers cannot be investigated by the provider. (6) Expired ID / name changes — IDP-side issue, provider cannot intervene. |
| **coverage_gaps** | (1) International researchers (non-US/UK): 40–60% of global customers — zero coverage, complete structural exclusion. (2) US researchers without existing federated account: 20–40% face enrollment friction. (3) Login.gov structural unavailability to private-sector providers: collapses to ID.me only. (4) Privacy refusals for ID.me: 5–15% of eligible US customers. (5) Black-box verification: provider cannot diagnose or override IDP false rejections. |
| **record_left** | Per invocation: OIDC `id_token` JWT (signed by IDP), userinfo response payload, `acr` and `verified_at` claims, timestamp of validation. Provider does NOT hold underlying document images. Audit trail is the signed assertion + IDP's own retention. Suitable for regulator review IF the regulator accepts federation assertion as M14 evidence-match. |
| **bypass_methods_known** | ATO of synthesis-provider account (CAUGHT — IDP MFA blocks if attacker lacks IDP credential); shared-account predecessor mismatch (CAUGHT — `sub` uniquely identifies human); same-person multi-persona with same IDP account (CAUGHT — shared `sub` detectable); email-only ordering (CAUGHT — OIDC flow required). All IDP-layer bypasses (deepfake, morph, injection, session handoff) are AMBIGUOUS — opaque to the provider. |
| **bypass_methods_uncovered** | All IDP-layer bypasses (deepfake, morph, injection, session handoff) — opaque to provider; ATO at the IDP layer; ID.me trusted-referee social engineering; social-engineer synthesis-provider support to bypass federated requirement; fresh real accomplice (structural); real ID throughout (structural). |

---

## Section 2: Narrative

### What this check is and how it works

Federated IAL2 identity proofing offloads the document capture, liveness detection, and biometric matching to a government-operated or government-certified identity provider. The synthesis provider integrates via standard OIDC: it redirects the customer to Login.gov, ID.me, or GOV.UK One Login, the customer completes the IDP's IAL2 flow (document + selfie + liveness), and the provider receives a signed assertion containing verified identity claims (name, date of birth, address, verification timestamp). The provider never sees the customer's document images or selfie — it sees only the boolean outcome and extracted fields. Login.gov is GSA-operated and meets NIST SP 800-63-3 IAL2; ID.me is a commercial credential service provider (CSP) that is Kantara-listed at IAL2/AAL2. Integration uses standard OIDC libraries. The provider stores the signed `id_token` and verified claims as the M14 evidence-match artifact.

### What it catches

The federated model is effective against credential-compromise and account-hijack attacks when the attacker has compromised the synthesis-provider account but not the victim's IDP account — the federated step-up blocks them because they cannot complete the IDP's own MFA and IAL2 flow. It catches shared-account predecessor mismatches via the `sub` claim, which uniquely identifies the human regardless of institutional account ownership. It can detect same-person multi-persona operations if the attacker uses the same IDP account for multiple synthesis-provider personas (the `sub` is shared). It blocks email-only ordering that bypasses the portal, since the OIDC flow requires interactive browser authentication.

### What it misses

This idea has the highest ratio of AMBIGUOUS classifications among the M14 options, reflecting the fundamental trade-off of federated IDV: the provider delegates all IDV-pipeline security to the IDP and has no ability to independently assess, harden, or audit the pipeline. Whether deepfake injection, face morphing, or session-handoff attacks succeed depends entirely on the IDP's internal defenses — and the provider cannot observe which verification method was used (automated vs. ID.me's trusted-referee video chat fallback, which is itself vulnerable to social engineering). ATO at the IDP layer is also missed. The standard structural gaps apply: fronted-accomplice with real identity passes natively, real-ID-throughout passes natively, same-person multi-persona with separate IDP accounts is undetectable. Social-engineering of either the IDP's support desk or the synthesis provider's support desk to bypass the federated requirement defeats the control.

### What it costs

Login.gov pricing is vendor-gated and, more critically, Login.gov is likely structurally unavailable to private-sector DNA synthesis providers. This collapses the federated option to ID.me only. ID.me commercial pricing is estimated at $2–$5 per IAL2 verification on small contracts, at the higher end of the vendor IDV pricing spectrum due to its CSP role and government certifications. Setup costs are vendor-gated but likely involve a six-figure annual commitment for commercial integrators at the IAL2 tier. The integration itself is standard OIDC and relatively lightweight on the engineering side.

### Operational realism

The manual review handoff is inherently limited by the black-box nature of federated IDV. When a customer fails at the IDP, the synthesis provider sees only a boolean failure — not the rejection reason, document images, or selfie. The provider cannot build institutional expertise in document fraud detection; it is entirely dependent on the IDP's accuracy. For customers who fail the federated flow, the SOP is to offer a vendor-IDV fallback (Jumio/Onfido/Persona), which means the provider must maintain two parallel IDV paths anyway. The record left is a signed JWT assertion with verified claims — a strong audit artifact if the regulator accepts federation as satisfying M14, but one that cannot be independently re-evaluated by the provider. The FTC consent action against ID.me (2024) over deceptive claims about facial recognition creates reputational and legal review overhead for providers integrating ID.me.

### Open questions

The most consequential open question is whether this check is viable at all as a standalone M14 implementation, given that 40–60% of global synthesis customers are non-US/UK and have zero coverage. The coverage research recommends it only as an optional convenience path for US customers who already have an ID.me account, paired with a vendor IDV as the primary path. Login.gov's structural unavailability to private-sector providers has not been tested — whether a GSA policy exception or routing through a federal partner agency could work is unknown. The FTC consent action claim against ID.me is mentioned in the implementation but not directly cited (flagged by 04C). Whether ID.me can provide an attribute indicating the verification method (automated vs. trusted-referee) to enable differential scrutiny is unknown.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 passed with no Critical flags.
- **Moderate finding M1 (opaque IDP pipeline):** The provider cannot independently assess whether the IDP's liveness, document, or morph detection is adequate for the SOC-order threat model. Suggested mitigation: require IDPs to publish iBeta PAD compliance results, or accept only Kantara-listed IDPs.
- **Moderate finding M2 (Login.gov structural unavailability):** Login.gov is almost certainly unavailable to private-sector synthesis providers. This collapses the federated option to ID.me only. Whether a GSA policy exception is obtainable is unknown and would need direct engagement.
- **Moderate finding M3 (ID.me trusted-referee social engineering):** ID.me's video-chat fallback is a human-judgment gate that can be socially engineered. The provider has no visibility into which verification method was used. Suggested: request verification-method attribute from ID.me.
- **Moderate finding M5 (international coverage gap):** 40–60% of global customers have zero coverage. Disqualifying as a standalone M14 implementation. Can only function as one path in a multi-path strategy.
- **[unknown] fields:**
  - Login.gov per-transaction pricing (3-query search returned no public figures).
  - ID.me API rate limits.
  - ID.me first-attempt IAL2 pass rate (asserted as ~85–90% from "industry norms" without specific source).
  - ID.me refusal rate among eligible users (3-query search).
- **[vendor-gated] fields:**
  - Login.gov structural availability to private-sector providers (requires GSA engagement).
  - ID.me per-verification commercial pricing and setup cost.
  - ID.me verification-method attribute (automated vs. trusted-referee) availability.
- **[best guess] fields requiring validation:**
  - 40–60% international customer exclusion (depends on provider's customer mix).
  - 20–40% of US customers needing new federated account.
  - 5–15% privacy refusal rate.
  - $2–$5 per ID.me IAL2 verification.
- **Uncited claim (flagged by 04C):** FTC consent action against ID.me (2024) — mentioned without direct citation to FTC docket. Should be cited or weakened.
