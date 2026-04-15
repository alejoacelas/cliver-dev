# m17-predecessor-reidv — implementation v1

- **measure:** M17 (pre-approval-list)
- **name:** Predecessor pre-approval re-IAL2 + re-bind
- **modes:** A
- **summary:** When a SOC order arrives from a pre-approved entity, the *submitting individual* must complete a fresh NIST 800-63A IAL2 identity-proofing event and bind that proofing artifact to the specific order, rather than inheriting the predecessor account holder's prior IAL2. Closes "predecessor inheritance" attacks where a new individual rides on a previously-IAL2'd account opened by someone who has since departed (account-hijack, dormant-account-takeover, credential-compromise from the m17 attacker mapping).

## external_dependencies

- **NIST 800-63-4 / 800-63A** as the standard for what counts as IAL2 and what binding means ([NIST SP 800-63A IAL pages](https://pages.nist.gov/800-63-4/sp800-63a/ial/); [NIST SP 800-63A verification page](https://pages.nist.gov/800-63-3-Implementation-Resources/63A/verification/)).
- **Third-party identity verification vendor** offering IAL2-conformant (or IAL2-equivalent) remote identity proofing. Note: of the named vendors, only **ID.me** publicly advertises documented NIST 800-63 IAL2/AAL2 conformance; Stripe Identity, Persona, Onfido, and Veriff offer technically equivalent document+selfie+liveness flows but do not publish NIST IAL2 conformance attestations as of this writing (document + selfie biometric comparison). Concrete options: ID.me (advertised as IAL2/AAL2 conformant), Persona, Onfido, Stripe Identity, Jumio, Veriff. Per [Switch Labs 2025 market guide](https://www.switchlabs.dev/post/fraud-prevention-identity-verification-software-complete-market-guide-2025) and [TrustSwiftly 2026 pricing comparison](https://trustswiftly.com/blog/identity-verification-pricing-comparison-and-alternatives/).
- **Internal order-management system** capable of attaching an identity-proofing artifact (verification ID, hash, timestamp) to a specific order record so the bind is per-order, not per-account.
- **Workflow / customer portal** to deliver the verification flow to the submitting user before order release.

## endpoint_details

- **Stripe Identity:** `https://stripe.com/identity`. REST API. Auth via Stripe API key. Pricing: **$1.50 per verification, no minimums** ([Stripe Identity pricing page summary via Index.dev comparison](https://www.index.dev/skill-vs-skill/authentication-stripe-identity-vs-onfido-vs-persona); same price referenced by [Switch Labs 2025](https://www.switchlabs.dev/post/fraud-prevention-identity-verification-software-complete-market-guide-2025)).
- **Persona:** `https://withpersona.com`. Plans start at $250/month base + per-verification fees ([Index.dev](https://www.index.dev/skill-vs-skill/authentication-stripe-identity-vs-onfido-vs-persona)). Per-verification price: `[unknown — searched for: "Persona identity verification per check pricing", "Persona pricing 2025", "Persona Inquiry pricing"]`. `[best guess: $1–$3 per verification at non-enterprise volume.]`
- **Onfido:** vendor-gated pricing; volume-tiered. Enterprise contracts $50K–$200K/year per [Switch Labs 2025](https://www.switchlabs.dev/post/fraud-prevention-identity-verification-software-complete-market-guide-2025). `[vendor-gated — public docs cover the API surface and document/biometric coverage countries; per-check pricing requires sales contact.]`
- **ID.me:** advertised IAL2 + AAL2 compliant per [Best AI Agents pricing comparison](https://bestaiagents.org/blog/id-verification-api-pricing-models-compared/). `[vendor-gated — pricing is enterprise/government contract.]`
- **Auth model:** all of the above use API-key auth and a hosted verification flow embedded via redirect or modal SDK.
- **Rate limits:** vendor-specific, generally not a constraint at gene-synthesis order volumes.
- **ToS constraints:** all of these vendors restrict re-use of biometric / document data for purposes outside the verification; storage and retention rules under state biometric laws (BIPA, etc.) and GDPR apply.

## fields_returned

For each per-order IAL2 event, typical IDV vendors return:

- `verification_id` / `inquiry_id` — opaque vendor identifier
- `status` — verified | declined | requires_input
- `document_type` (passport, driver's license, national ID), `document_country`, `document_expiry`, redacted document number
- `extracted_name`, `extracted_dob`, `extracted_address`
- `selfie_match_score` / biometric comparison verdict
- `liveness_check_result`
- `verification_timestamp`
- vendor risk signals (device fingerprint, IP geolocation, document tampering scores)
- audit-grade snapshot URL or downloadable report

`[best guess based on Stripe Identity, Persona, and Onfido API references generally: this field set is the common denominator across major IDV vendors; specific names vary.]`

## marginal_cost_per_check

- **Stripe Identity:** $1.50 per verification ([Index.dev comparison](https://www.index.dev/skill-vs-skill/authentication-stripe-identity-vs-onfido-vs-persona)).
- **Persona / Onfido / Jumio / ID.me:** $1–$5 per check at moderate volume `[best guess from Switch Labs 2025 market guide and TrustSwiftly 2026 pricing comparison; exact tier requires sales contact for the enterprise vendors]`.
- **Friction cost (the dominant cost):** users dropping out of a re-IAL2 flow at order time. `[best guess: 5–20% drop rate per friction event based on retail-banking onboarding-friction industry literature; not researched for this idea specifically.]`
- **Setup cost:** vendor integration: 1–3 engineering weeks; SOP update; legal review for biometric storage. `[best guess: $20K–$80K one-time depending on vendor and existing IDV pipeline.]`

## manual_review_handoff

When `predecessor_rebind_failed` or related flag fires:

1. Reviewer pulls the IDV vendor verification report and the customer's account history.
2. Compare the IAL2-verified name on the new event against the predecessor account holder's name on file.
3. **Same individual, just re-verifying:** verify the IAL2 vendor signals are clean (selfie match high, no document tampering, no impossible-travel red flags); release.
4. **Different individual, claimed legitimate handoff** (e.g., new lab manager taking over a PI's account after retirement): verify out-of-band with the institution that the handoff is real (call the institution's biosafety officer or department head — leverages the m17-positive-verification-sop SOP); require an institutional letter on letterhead; re-screen the new individual through m18/m19/m20 fully before reinstating pre-approval. Treat the re-bind as the *creation of a new pre-approval record*, not a transfer.
5. **Different individual, no plausible handoff narrative:** suspend the account; escalate to biosecurity officer and consider law-enforcement reporting per the IGSC harmonized protocol guidance for unresolved red flags.
6. **Vendor declines verification (document fraud, liveness fail):** standard IDV-failure handling; suspend; require in-person proofing or alternative IAL2 path.

## flags_thrown

- `predecessor_rebind_failed` — IDV vendor returned declined or required-input.
- `predecessor_rebind_name_mismatch` — verification succeeded but the verified individual's name does not match the predecessor account holder.
- `predecessor_rebind_document_tampering` — vendor's document-tampering signal raised.
- `predecessor_rebind_impossible_travel` — IP geolocation inconsistent with the institution's location and prior session geography.
- `predecessor_rebind_low_selfie_match` — biometric similarity below threshold against the document photo.

## failure_modes_requiring_review

- **Friction.** Users at non-account-creation moments are not psychologically prepared to do IAL2; legitimate users will drop, complain, or escalate to support.
- **Vendor outage / degraded mode.** Stripe Identity, Persona, and Onfido all have occasional outages; need a fallback path that doesn't silently downgrade.
- **Documents the vendor doesn't support** (rare passports, expired-but-valid academic IDs, foreign national IDs in the long tail). Coverage is good for OECD passports/DLs, weaker for the long tail.
- **Re-binding for legitimate handoffs** (postdoc → faculty, staff turnover) — frequent in academia and exactly the population pre-approval lists target. False-positive load can be high.
- **Privacy / biometric law constraints** (BIPA in Illinois, similar in TX/WA; GDPR in EU). Storage and retention rules can complicate the audit trail.
- **Rebind by a sophisticated attacker who actually controls the predecessor's documents** (e.g., dormant-account-takeover where the IT admin has access to scanned ID copies in HR). NIST IAL2's biometric requirement defeats this only if liveness is enforced strictly.

## false_positive_qualitative

- Legitimate handoffs (PI retirement, lab manager change, postdoc graduation to faculty role) — common in academic and research-org settings.
- Researchers whose legal name does not match their published / institutional name (married names, romanization variants, name-changes-in-progress).
- Foreign researchers using non-OECD national IDs in the long tail of vendor support.
- Users on slow or unstable connections that fail liveness checks for technical rather than identity reasons.
- Researchers in shared core-facility accounts where multiple legitimate operators share login (this is a structural mismatch — re-IAL2 surfaces the underlying account-sharing problem, which may be a true positive even though the operators are legitimate).

## record_left

- IDV vendor verification ID, status, timestamp, and downloadable audit report (per vendor docs above).
- Hash linking the verification artifact to the specific order ID (the rebind anchor — this is the load-bearing innovation vs. plain IAL2 at onboarding).
- Reviewer's adjudication memo for any flagged rebind.
- Customer-record audit trail showing who held the account before/after this rebind event, with the institutional confirmation letter (if a legitimate-handoff path was used).
- Per [NIST SP 800-63A](https://pages.nist.gov/800-63-4/sp800-63a/ial/), the binding artifact is the load-bearing element; the audit trail must demonstrate it for IAL2 conformance claims.

## Sourcing notes

- The "rebind to order, not to account" framing is grounded in [NIST SP 800-63A](https://pages.nist.gov/800-63-4/sp800-63a/ial/) language about binding identity proofing to a specific subscriber-account session, plus standard step-up authentication patterns ([Auth0 step-up](https://auth0.com/blog/what-is-step-up-authentication-when-to-use-it/); [Ping Identity step-up](https://www.pingidentity.com/en/resources/blog/post/step-up-authentication.html)). Step-up auth as a category is well-established for "high-risk transactions in already-authenticated sessions" — the SOC order is the high-risk transaction here.
- Vendor cost benchmarks: [Index.dev IDV vendor comparison](https://www.index.dev/skill-vs-skill/authentication-stripe-identity-vs-onfido-vs-persona), [Switch Labs 2025 market guide](https://www.switchlabs.dev/post/fraud-prevention-identity-verification-software-complete-market-guide-2025), [TrustSwiftly 2026 pricing](https://trustswiftly.com/blog/identity-verification-pricing-comparison-and-alternatives/).
