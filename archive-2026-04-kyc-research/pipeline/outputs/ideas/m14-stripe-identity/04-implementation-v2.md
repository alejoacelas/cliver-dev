# m14-stripe-identity — Implementation v2

- **measure:** M14 — identity-evidence-match
- **name:** Stripe Identity (low-friction document + selfie IDV) — with explicit liveness-opacity documentation and vendor comparison
- **modes:** D
- **summary:** Stripe Identity is a hosted IDV product that performs document scan + selfie biometric match with PAD/liveness, returning a structured verified-identity record. Used at the lower-friction tier of an M14 implementation. v2 addresses the Critical finding that Stripe exposes no PAD/injection-detection signal by (1) documenting what Stripe Identity *does* return for liveness-related risk analysis, (2) explicitly specifying the provider's dependency boundary, and (3) comparing to Jumio/Onfido/Persona liveness transparency so the provider can make an informed vendor choice.

## Changes from v1 addressing Critical Finding C1 (no PAD/injection-detection signal)

**C1 said:** Stripe Identity returns binary `verified`/`requires_input` status and coarse error codes. No field exposes a PAD confidence score, injection-detection flag, or liveness confidence level. The provider is fully dependent on Stripe's opaque liveness.

**v2 response:**

### What Stripe Identity actually returns for liveness/risk analysis

Stripe Identity now exposes an **Insights** system that provides more nuanced signals beyond the binary verification status [source](https://docs.stripe.com/identity/insights):

- **Level insights** provide a computed score translating to `low`, `elevated`, or `high` risk. These evaluate potential risk to the verification.
- **Label insights** provide a binary `present`/`absent` value for specific risk indicators.

The Insights page describes that "Stripe Identity's AI model considers a variety of signals when verifying a user's identity and examines factors to produce insights that can give further clarity into Stripe's decision. These insights are more nuanced than the top-level verification decisions, and can be used to assist with manual reviews or customer support processes." [source](https://docs.stripe.com/identity/insights)

The specific insights available include signals related to document risk and face analysis, but the full enumerated list of insight names is not published in the public documentation [unknown — searched for: "Stripe Identity insights full list", "Stripe Identity insights API reference field names", "Stripe Identity document_risk face_risk injection"]. The documentation describes the *types* of insights (Level vs Label) and their *purpose* but defers the specific insight names and definitions to the API reference, which requires a Stripe account to access fully. [vendor-gated — public docs describe the Insights framework and show example usage; the complete list of available insight names and their definitions requires Stripe Dashboard or API key access]

**What this means for the provider:** Stripe's Insights system provides *some* risk signals beyond the binary pass/fail — specifically, Level insights that translate to risk tiers. A provider can use elevated/high-level insights as triggers for escalation to manual review or to a higher-assurance IDV vendor. However:

1. **The insights are Stripe's interpretation, not raw liveness/PAD data.** The provider still cannot independently assess PAD strength — they see Stripe's risk assessment, not the underlying biometric confidence scores.
2. **There is no documented `injection_attack_detected` or `liveness_confidence_score` field.** The insights are described generically as examining "a variety of signals" without committing to specific deepfake/injection detection capabilities.
3. **The insight levels (`low`/`elevated`/`high`) are ordinal, not quantitative.** A `high`-risk insight triggers human review but does not tell the reviewer *why* (e.g., was it a suspected injection, a photo of a photo, or a low-quality image?).

### Selfie check details

Stripe's selfie verification checks "look for distinguishing biological traits, such as face geometry, from a government-issued photo ID and a picture of the user's face" and uses "advanced machine learning algorithms to ensure the face pictures belong to the same person" [source](https://docs.stripe.com/identity/verification-checks?type=selfie). The selfie check includes:
- Face-to-document photo matching
- Liveness assessment (passive; the user takes a selfie, Stripe's ML assesses whether it's a live capture)

The `selfie` sub-check in the `VerificationReport` returns `status` (`verified` / `unverified`) and, on failure, an `error.code`. The error codes include scenarios like `selfie_document_missing_photo`, `selfie_face_mismatch`, and `selfie_manipulated`. [source](https://docs.stripe.com/identity/verification-checks?type=selfie)

**Key gap:** There is no `selfie_injection_detected` or `selfie_liveness_failed` error code documented in the public API reference. The liveness assessment appears to be folded into the overall selfie status — if liveness fails, the selfie check fails, but the failure reason may be reported as a generic face mismatch rather than an explicit injection/PAD failure. [unknown — searched for: "Stripe Identity selfie error codes complete list", "Stripe Identity liveness error code injection", "Stripe Identity selfie_injection selfie_replay"]

### Explicit provider dependency boundary

The provider's dependency on Stripe's opaque liveness has the following operational implications:

1. **If Stripe's PAD is defeated by a deepfake injection, the session returns `verified` with no distinguishing signal.** The Insights system *may* surface an elevated risk level if Stripe's internal model detects anomalies, but this is not guaranteed and is not documented as a specific injection-detection capability.
2. **The provider cannot independently verify Stripe's PAD level.** Stripe markets iBeta-tested PAD but publishes no ISO 30107-3 conformance level. [unknown — searched for: "Stripe Identity iBeta PAD level 2025", "Stripe Identity ISO 30107-3 certification", "Stripe Identity PAD conformance level"]
3. **Recommended compensating control:** For SOC orders specifically (high-risk), the provider should layer a device-integrity attestation (e.g., Apple App Attest, Google Play Integrity) on the client before initiating the Stripe Identity session. This raises the bar against camera-injection attacks (the attacker cannot use a virtual camera if the app enforces device attestation). This is outside Stripe Identity's scope but within the provider's implementation control.
4. **Recommended escalation policy:** Any SOC order where Stripe Identity Insights return an `elevated` or `high` Level insight should be escalated to a higher-assurance IDV vendor (Jumio or Onfido) that publishes PAD conformance levels.

### Vendor comparison: liveness/PAD transparency

| Vendor | ISO 30107-3 published? | PAD level | Liveness confidence exposed in API? | Injection-detection signal? |
|---|---|---|---|---|
| **Stripe Identity** | No — claims iBeta-tested but no published level [unknown] | Unknown | No — Insights provide risk levels but not PAD-specific scores | Not documented |
| **Jumio** | Yes — ISO/IEC 30107-3 Level 2 [source](https://www.jumio.com/about/press-releases/iso-iec-level-2-compliance/) | Level 2 | Premium Liveness includes deepfake detection with "active illumination" [source](https://www.jumio.com/products/liveness-detection/); API exposes detailed liveness results [vendor-gated — full API field list requires integration docs] | Yes — Jumio Premium Liveness explicitly claims injection-attack and deepfake detection |
| **Onfido (Entrust)** | Yes — iBeta tested to L1 and L2 (Motion) [source](https://documentation.onfido.com/v2) | Level 1 + Level 2 (Motion) | Yes — returns `score` (0-1 face similarity) and `source_integrity` breakdown with reasons including digital tampering, emulator usage [source](https://documentation.onfido.com/v2) | Yes — `source_integrity` breakdown includes injection and tampering indicators |
| **Persona** | Yes — iBeta ISO/IEC 30107-3 PAD certified [source](https://withpersona.com/product/verifications/selfie) | Published (level unspecified in public docs) | [vendor-gated — API field details require integration docs] | [vendor-gated] |

**Key takeaway for the provider:** Stripe Identity offers the lowest-friction, lowest-cost IDV option ($1.50/check) but the least transparency on PAD/liveness. For SOC orders, where the threat model includes sophisticated injection attacks, the provider should either (a) use Stripe Identity as a pre-screen and escalate all SOC orders to Jumio/Onfido for the liveness gate, or (b) accept the opacity and layer compensating controls (device attestation, per-order re-proofing).

## external_dependencies

Same as v1, plus:
- (Optional) Device-integrity attestation service (Apple App Attest, Google Play Integrity) — recommended compensating control.
- (Optional) Escalation path to Jumio or Onfido for SOC-order liveness gate.

## endpoint_details

Same as v1. No changes to the Stripe Identity API endpoints.

- **New — Insights access:** Available via the VerificationSession or VerificationReport object. Requires a Stripe secret key. Insights are populated after the session completes. Access via `GET /v1/identity/verification_sessions/{id}` with `expand[]=last_verification_report` [source](https://docs.stripe.com/identity/insights).

## fields_returned

Same as v1, plus:

**Stripe Identity Insights (new in v2):**
- Level insights: risk level (`low` / `elevated` / `high`) for categories evaluated by Stripe's AI model.
- Label insights: binary `present` / `absent` for specific risk indicators.
- Accessed via `last_verification_report.insights` or via the Stripe Dashboard review UI [source](https://docs.stripe.com/identity/insights).

[vendor-gated — the specific insight names and definitions are not fully enumerated in public docs; require Stripe Dashboard access to inspect]

## marginal_cost_per_check

Same as v1: $1.50 per document+selfie verification.

If escalation to Jumio/Onfido is implemented for SOC orders:
- Jumio: $2-$5 per verification [vendor-gated — custom pricing] [best guess: based on public pricing comparisons]
- Onfido: $2-$4 per verification [vendor-gated — custom pricing]
- Combined cost for SOC orders: $1.50 (Stripe pre-screen) + $3-5 (escalation) = **$4.50-$6.50 per SOC order** if dual-vendor path is used.

## manual_review_handoff

Updated from v1:

When a verification reaches `requires_input` or an Insights Level insight returns `elevated` or `high`:

1. Same as v1 steps 1-4.
2. **New (v2):** If the order is a SOC order AND any Insights Level insight is `elevated` or `high`, escalate to Jumio/Onfido re-verification before proceeding. Do not approve based on Stripe alone.
3. **New (v2):** If the order is a SOC order AND Stripe verification passed with all `low` Level insights, proceed but log the insight values for audit purposes. Note in the record that the liveness assessment is Stripe-opaque.

**Re-proofing cadence (addressing M3 from v1 hardening):** A new `VerificationSession` MUST be created for each SOC order. Cached prior verifications are not sufficient. Non-SOC orders may cache for up to 90 days.

## flags_thrown

Same as v1, plus:
- `stripe_identity_elevated_risk` — one or more Insights Level insights returned `elevated` or `high`. Action: escalate to Jumio/Onfido for SOC orders; manual review for non-SOC.
- `stripe_identity_pad_opacity_note` — informational flag logged on every SOC order verified via Stripe Identity only (without Jumio/Onfido escalation), noting that PAD assurance is opaque. Action: no hold; logged for audit trail.

## failure_modes_requiring_review

Same as v1, plus:
- **Insights unavailable:** If Stripe does not populate insights for a session (e.g., session completed before Insights feature was enabled), treat as elevated risk for SOC orders.
- **Escalation vendor unavailable:** If Jumio/Onfido escalation path is configured but the vendor returns an error, fall back to Stripe-only with `stripe_identity_pad_opacity_note` flag and senior reviewer approval required.

## false_positive_qualitative

Same as v1. No change.

## record_left

Same as v1, plus:
- Stripe Insights Level and Label values for each insight (logged even when all are `low`).
- If escalation to Jumio/Onfido occurred: the escalation vendor's session ID, liveness score, and PAD-specific results.
- `pad_assurance_source`: `stripe_opaque` | `jumio_iso30107_l2` | `onfido_iso30107_l2_motion` — documents which vendor provided the PAD assurance for this order.

## Notes on assurance level — updated

Same as v1, with added context: The vendor comparison table above makes explicit that Stripe Identity's PAD assurance is lower than Jumio (ISO 30107-3 Level 2) and Onfido (Level 1 + Level 2 Motion). For a DNA SOC screening context, where the threat model includes state-level or well-resourced adversaries with injection capabilities, the provider should not rely on Stripe Identity as the sole liveness gate. The recommended architecture is Stripe Identity for low-friction pre-screen + Jumio/Onfido for the SOC-order liveness gate.

Sources:
- [Stripe Identity product page](https://stripe.com/identity)
- [Stripe Identity docs](https://docs.stripe.com/identity)
- [Stripe Identity Insights](https://docs.stripe.com/identity/insights)
- [Stripe Identity verification checks — selfie](https://docs.stripe.com/identity/verification-checks?type=selfie)
- [Stripe Identity review tools](https://docs.stripe.com/identity/review-tools)
- [Stripe Identity access verification results](https://docs.stripe.com/identity/access-verification-results)
- [Stripe Identity billing](https://support.stripe.com/questions/billing-for-stripe-identity)
- [Jumio ISO/IEC 30107-3 Level 2 compliance](https://www.jumio.com/about/press-releases/iso-iec-level-2-compliance/)
- [Jumio Premium Liveness](https://www.jumio.com/products/liveness-detection/)
- [Onfido API v2 reference](https://documentation.onfido.com/v2)
- [Persona selfie verification](https://withpersona.com/product/verifications/selfie)
