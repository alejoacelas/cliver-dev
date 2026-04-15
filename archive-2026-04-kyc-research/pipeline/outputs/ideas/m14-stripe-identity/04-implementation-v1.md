# m14-stripe-identity — Implementation v1

- **measure:** M14 — identity-evidence-match
- **name:** Stripe Identity (low-friction document + selfie IDV)
- **modes:** D
- **summary:** Stripe Identity is a hosted IDV product that performs document scan + selfie biometric match with PAD/liveness, returning a structured verified-identity record. Used at the lower-friction tier of an M14 implementation: cheaper than Jumio/Onfido and integrated with the same merchant account used for payment, but assurance level is closer to NIST IAL1.5 than full IAL2.

## external_dependencies

- Stripe account (existing PSP relationship typical) [(Stripe Identity product page)](https://stripe.com/identity).
- Stripe Identity API ([docs](https://docs.stripe.com/identity)).
- Internal handler to receive `identity.verification_session.verified` / `requires_input` webhooks.

## endpoint_details

- **Product page:** https://stripe.com/identity
- **API base:** `https://api.stripe.com/v1/identity/verification_sessions` ([reference](https://docs.stripe.com/api/identity/verification_sessions)).
- **Auth model:** Stripe restricted/secret API key (Bearer); same key infrastructure as Stripe payments. Frontend uses Stripe.js + a client secret to render the hosted verification UI.
- **Session types:** `document` (gov ID + optional selfie + optional ID-number), `id_number` (name + DOB + national ID number, no document) ([Verification Sessions API](https://docs.stripe.com/identity/verification-sessions)).
- **Rate limits:** Standard Stripe API limits — 100 read/sec and 100 write/sec in live mode `[unknown — searched for: "Stripe Identity rate limit verification_sessions per second", "Stripe API rate limit live mode 2026"]` for Identity-specific ceilings; the global Stripe ceiling is documented but Identity-specific throttling is not surfaced publicly.
- **Pricing:** $1.50 per verification for the document-only check; $1.50 per verification for document+selfie; $0.50 per ID-number lookup (US) [(Stripe Identity pricing, see "Billing for Stripe Identity")](https://support.stripe.com/questions/billing-for-stripe-identity). [vendor-gated — volume discounts for >10k/month require sales contact].
- **ToS constraints relevant to DNA-screening KYC:** Stripe Identity ToS limits use to verifying end users of the Stripe customer's own service; using it as a third-party screening bureau (selling results, sharing across providers) is restricted `[best guess: based on standard Stripe Services Agreement section on Identity Verification — would require legal review against the current MSA]`.

## fields_returned

`verified_outputs` (expandable; secret-key only) populates after a successful session ([Access verification results](https://docs.stripe.com/identity/access-verification-results)):

- `first_name`, `last_name`
- `dob.{year, month, day}`
- `address.{line1, line2, city, state, postal_code, country}`
- `id_number` (when collected; SSN US, etc.) and `id_number_type`
- Document object: `type` (driving_license / passport / id_card), `number`, `expiration_date`, `issued_date`, `issuing_country`, front/back image file IDs
- Selfie object: file IDs for the captured selfie + the document portrait crop, plus a match result
- `last_verification_report` with sub-checks: `document.status`, `document.error.code`, `selfie.status`, `id_number.status` ([VerificationSession object reference](https://docs.stripe.com/api/identity/verification_sessions/object)).

## marginal_cost_per_check

- $1.50 per document+selfie verification [(Stripe support: Billing for Stripe Identity)](https://support.stripe.com/questions/billing-for-stripe-identity).
- **setup_cost:** ~1–2 engineer-weeks to integrate the hosted modal, webhook handler, and reviewer queue. `[best guess: typical hosted-IDV integration scope based on Stripe quickstart docs]`

## manual_review_handoff

When a verification reaches `requires_input` (failed) or scores below provider risk threshold:

1. Reviewer opens the order in the internal queue and the linked Stripe Dashboard verification page (image of doc front/back, selfie, sub-check results).
2. Compare `verified_outputs.first_name`/`last_name`/`dob` against the SOC order's named orderer and the account-holder record.
3. If document is flagged for tampering or selfie/document mismatch by Stripe, treat as denial unless customer can present a higher-assurance alternative (escalate to Jumio/Onfido or in-person).
4. If document is genuine but a name/DOB mismatch with the account holder, contact customer via the registered email; require explanation + corroborating evidence.
5. Document the decision in the order audit record with the Stripe `verification_session` ID and the reviewer's call. Per NIST 800-63A IAL2, biometric+document is the binding mechanism ([NIST SP 800-63A IAL2](https://pages.nist.gov/800-63-3-Implementation-Resources/63A/ial2remote/)).

## flags_thrown

- `stripe_identity_failed` — Stripe returns `requires_input` with `last_error` (document tampered, expired, selfie mismatch, etc.).
- `stripe_identity_name_mismatch` — verified `first_name`+`last_name` differ from account-holder record (deterministic check post-success).
- `stripe_identity_country_unsupported` — document country not in supported list.
- `stripe_identity_low_assurance` — Stripe completed but only `id_number` (no document+selfie) — not sufficient for SOC orders.

Standard human action: hold the order, route to reviewer queue, contact customer.

## failure_modes_requiring_review

- Stripe API errors (5xx, timeouts) — retry once, then queue for manual review with deny-default.
- `requires_input` outcomes where the underlying error is ambiguous (image blurry, glare).
- Document countries not supported by Stripe Identity (limited country list — primarily US, EU, UK, AU, CA, plus expansions) `[unknown — searched for: "Stripe Identity supported countries list 2026", "Stripe Identity document verification country coverage"]`.
- Customer is a legal person (org), not a natural person — Stripe Identity verifies humans only.

## false_positive_qualitative

- Researchers with non-Latin-script names whose passport MRZ transliteration mismatches the account-holder record exactly.
- Researchers in countries where Stripe Identity does not support the local national ID document — they get an inconclusive result rather than a fail.
- Recently-married researchers whose document still shows a maiden/birth name vs. the institutional account name.
- Older researchers using documents close to expiration may trigger expiration warnings.

## record_left

- Stripe `verification_session` ID (immutable).
- `last_verification_report` JSON (sub-checks and error codes).
- Document image file IDs (Stripe retains the images per its Identity retention policy `[unknown — searched for: "Stripe Identity image retention period", "Stripe Identity GDPR data retention"]`).
- Internal: log of the reviewer decision tied to order + verification session ID.

## bypass methods (carry-over from spec; stage 5 owns this)

- Document fraud + AI-generated face passing PAD — Stripe's PAD strength is `[vendor-described, not technically documented]`; Stripe markets it as iBeta-tested but does not publish a level `[unknown — searched for: "Stripe Identity iBeta PAD level", "Stripe Identity presentation attack detection certification"]`.
- Account-holder reuse: Stripe Identity binds an identity to a session, not to an account holder. The provider must do the post-hoc name/DOB equality check itself.

## Notes on assurance level

Stripe positions Identity as suitable for KYC and onboarding but does not claim NIST 800-63 IAL2 conformance ([NIST IAL2 requirements](https://pages.nist.gov/800-63-4/sp800-63a/ial/) — IAL2 requires SUPERIOR or STRONG evidence + biometric binding + PAD; Stripe meets the document+biometric pieces but the absence of a published PAD level and audit-trust-mark means a strict IAL2 implementer would treat Stripe as IAL1+ rather than IAL2).
