# 04F Form check — m14-stripe-identity v2

| Field | Verdict |
|---|---|
| name / measure / summary | PASS — updated to reflect Insights documentation and vendor comparison |
| external_dependencies | PASS — adds optional device-attestation and escalation vendor dependencies |
| endpoint_details | PASS — Insights access path documented; `[vendor-gated]` on specific insight names is honest |
| fields_returned | PASS — adds Insights Level/Label fields with appropriate `[vendor-gated]` caveat |
| marginal_cost_per_check | PASS — base $1.50 unchanged; dual-vendor SOC path priced at $4.50-$6.50 with `[best guess]`/`[vendor-gated]` |
| manual_review_handoff | PASS — updated with Insights-driven escalation and explicit per-SOC-order re-proofing mandate (addresses M3) |
| flags_thrown | PASS — 6 flags; new `stripe_identity_elevated_risk` and `stripe_identity_pad_opacity_note` |
| failure_modes_requiring_review | PASS — adds Insights-unavailable and escalation-vendor-unavailable cases |
| false_positive_qualitative | PASS — unchanged from v1 (appropriate) |
| record_left | PASS — adds Insights values, escalation vendor data, and `pad_assurance_source` field |
| Vendor comparison table | PASS — structured comparison of 4 vendors on PAD certification, liveness transparency, and injection detection |

## Observations

- The key structural decision (Stripe as pre-screen, Jumio/Onfido as SOC-order liveness gate) is well-reasoned and directly addresses C1.
- The `[vendor-gated]` marker on Stripe Insights field names is honest — the public docs describe the framework but not the full field list.
- The `[unknown]` markers on Stripe's ISO 30107-3 certification are appropriate with adequate search lists.
- The re-proofing cadence (per-SOC-order) explicitly addresses v1 hardening finding M3.
- Device-attestation recommendation is a reasonable compensating control, properly scoped as optional.

**Verdict:** PASS
