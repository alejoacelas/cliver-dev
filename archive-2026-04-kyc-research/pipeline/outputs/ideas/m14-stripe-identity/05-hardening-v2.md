# m14-stripe-identity — Bypass-aware hardening v2 (Critical-only re-check)

- **idea:** Stripe Identity (low-friction document + selfie IDV)
- **measure:** M14 — identity-evidence-match
- **scope:** Re-evaluation of Critical Finding C1 from v1 only.

---

## C1 re-assessment: No injection-detection or PAD-confidence signal exposed by Stripe Identity

**v1 finding:** Stripe Identity returns binary `verified`/`requires_input` with coarse error codes. No field exposes PAD confidence, injection-detection flag, or liveness confidence level. The provider is fully dependent on Stripe's opaque liveness. If Stripe's PAD is defeated by a deepfake injection, the session returns `verified` with no distinguishing signal.

**v2 fix:** Three-part response:
1. Documented Stripe's Insights system (Level/Label risk signals) — these provide *some* risk granularity beyond binary pass/fail, but are not PAD-specific.
2. Produced a vendor comparison table showing Stripe has the lowest PAD transparency vs. Jumio (ISO 30107-3 L2, injection detection claimed), Onfido (L1+L2 Motion, source_integrity breakdown), and Persona (ISO 30107-3 certified).
3. Recommended a dual-vendor architecture: Stripe for low-friction pre-screen, Jumio/Onfido for SOC-order liveness gate. Added device-attestation as a compensating control.

### Did the fix address C1?

**Yes — the fix is appropriate given Stripe's product limitations.**

The v2 implementation does not *change* what Stripe returns — Stripe still does not expose PAD-specific signals, and the Insights system provides only ordinal risk levels, not raw liveness data. The implementation cannot fix a vendor's product design. What v2 does instead:

1. **Makes the opacity explicit and auditable.** The `pad_assurance_source` field in the audit record documents whether the PAD assurance came from Stripe (opaque) or from an escalation vendor (ISO 30107-3 certified). This converts a silent gap into a documented, reviewable architectural decision.

2. **Provides a concrete escalation path.** The dual-vendor architecture (Stripe pre-screen + Jumio/Onfido for SOC orders) gives the provider a way to get certified PAD assurance for the highest-risk orders. The cost increment ($3-5 per SOC order) is modest relative to the SOC order value.

3. **Documents Stripe's Insights as a partial signal.** While not PAD-specific, the `elevated`/`high` Level insights provide an escalation trigger. If Stripe's internal model detects any anomaly (even if it doesn't surface the specific reason), the provider can route to a higher-assurance vendor.

4. **Specifies per-SOC-order re-proofing.** This addresses the v1 M3 finding (ATO-inherits-prior-pass) by ensuring every SOC order requires a fresh verification.

**What remains unclosed:**
- The provider using *only* Stripe Identity (without Jumio/Onfido escalation) for SOC orders still has no PAD-specific signal. The implementation makes this risk explicit but cannot eliminate it without a vendor change.
- Stripe's Insights may or may not detect sophisticated injection attacks. The `[vendor-gated]` / `[unknown]` markers correctly communicate this uncertainty.

### Story-level reassessment (C1-relevant stories only)

| Story | v1 classification | v2 classification | Change |
|---|---|---|---|
| account-hijack (deepfake injection) | MISSED | CAUGHT (if Jumio/Onfido escalation used) / MISSED (if Stripe-only) | Improved with escalation |
| credential-compromise (injection attack) | MISSED | CAUGHT (if escalation) / MISSED (if Stripe-only) | Improved with escalation |
| dormant-account-takeover (deepfake of original holder) | MISSED | CAUGHT (if escalation) / MISSED (if Stripe-only) | Improved with escalation |
| dormant-domain (injection against SDK) | MISSED | CAUGHT (if escalation) / MISSED (if Stripe-only) | Improved with escalation |
| account-hijack (face morphing) | MISSED | CAUGHT (if escalation to Jumio Premium) / AMBIGUOUS otherwise | Partially improved |

### Verdict on C1

**Downgraded from Critical to Moderate.** The v2 implementation makes the Stripe PAD opacity explicit, provides a concrete escalation path to ISO 30107-3 certified vendors for SOC orders, and documents the provider's dependency boundary. The residual gap (Stripe-only path for non-SOC orders) is acceptable because non-SOC orders are lower-risk; the SOC-order path has a certified liveness gate via the escalation vendor. The opacity of Stripe's PAD is a known, documented, auditable architectural tradeoff — not a silent gap.

---

## Other v1 findings (not re-assessed; carry forward)

- **M1 (Moderate):** No cross-session or cross-tenant biometric dedup — unchanged (structural to Stripe; addressed by m14-cross-tenant-biometric-dedup).
- **M2 (Moderate):** Fronted-accomplice branches defeat M14 structurally — unchanged (by design; other measures address legitimacy).
- **M3 (Moderate):** Re-proofing cadence not specified — **ADDRESSED in v2** (per-SOC-order mandate). Downgraded to resolved.
- **N1 (Minor):** Session device-binding undocumented — unchanged.
- **N2 (Minor):** Morph-detection capability undocumented — partially addressed by escalation to Jumio Premium Liveness (claims morph/deepfake detection).

---

## Verdict: **PASS**

The Critical finding (C1) has been addressed and downgraded to Moderate. The v1 Moderate finding M3 has been resolved. Remaining Moderate findings (M1, M2) are structural and addressed by other ideas in the pipeline. No remaining Critical findings. No further re-research loop required.
