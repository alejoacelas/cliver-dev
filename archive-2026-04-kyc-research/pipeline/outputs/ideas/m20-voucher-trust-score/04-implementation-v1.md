# m20-voucher-trust-score — implementation v1

- **measure:** M20 (voucher-legitimacy-soc)
- **name:** Composite voucher trust score with hard institutional gate
- **modes:** D (deterministic threshold) + A (adjudication band)
- **summary:** A weighted score combining the per-signal outputs of m20-voucher-idv, m20-orcid-oauth, m20-dkim-institutional-email, m19 seniority signals (years-since-PhD, h-index proxy), and m18 institutional legitimacy. The score is bounded `[0, 100]`. Two thresholds: a hard PASS at ≥80 (auto-approve), a hard FAIL at <40 (auto-decline), and an adjudication band 40–79 routed to a reviewer with the per-signal contribution breakdown. The institutional gate is a separate non-bypassable rule: voucher's institutional ROR must satisfy m18 legitimacy regardless of total score.

## external_dependencies

- **Internal scoring module** (build) — no external vendor required for the score itself; all inputs come from sibling checks within the M14/M18/M19/M20 stack.
- **Optional pre-built fraud-graph signal vendors** (buy path):
  - **Persona Graph** — link-analysis across verification data, surfaces multi-hop connections among ostensibly unrelated identities. Bundles SentiLink (synthetic-identity composite) and Prove (phone trust). [source: [Persona Graph](https://withpersona.com/product/graph), [Persona SentiLink integration](https://help.withpersona.com/articles/2aYEhpHKbRvd2GWieHIbkv/), [Persona Prove integration](https://help.withpersona.com/articles/rzENHOKhBM9MGjCAYdMqe/)]
  - **Flagright / Alessa / Azakaw** — AML risk-scoring engines that can host custom weighted scoring rules with versioning. [source: [Flagright real-time risk scoring](https://www.flagright.com/post/real-time-risk-scoring-in-aml-compliance-flagrights-approach), [Alessa AML risk scoring](https://alessa.com/software-solutions/aml-compliance/risk-scoring/)]
- **Reviewer headcount** for the adjudication band.
- **Model-governance documentation** — required for explainability and audit (CFPB-style adverse-action reasoning analog). [source: [Pace Analytics on ECOA + AI explainability](https://www.paceanalyticsllc.com/post/ecoa-adverse-actions-and-explainable-ai)]

## endpoint_details

- **Build path:** No external endpoint. Score module is internal; inputs are JSON results from sibling checks. Versioned in source control with a model card.
- **Buy path (Persona Graph + risk engine):** REST API + webhook, vendor-issued API key. [source: [Persona Graph](https://withpersona.com/product/graph)]
  - Pricing: vendor-quoted; Persona Graph is sold as add-on to base IDV. [vendor-gated — exact rate requires sales contact]
- **Build-path "endpoint":** internal `POST /voucher/score` returning `{score, contributions[], decision, model_version, ts}`.
- **Auth model:** internal service auth (mTLS or signed JWT).
- **Rate limits:** N/A (internal).
- **ToS:** N/A internal; for Persona Graph, standard KYC vendor DPA.

## fields_returned

Internal score module result:

```json
{
  "voucher_id": "...",
  "score": 76,
  "decision": "REVIEW",  // PASS | REVIEW | FAIL
  "model_version": "v1.3.0",
  "computed_at": "2026-04-06T12:34:56Z",
  "institutional_gate_passed": true,
  "contributions": [
    {"signal": "voucher_idv", "weight": 0.25, "raw": 1.0, "contribution": 25.0, "source_check_id": "..."},
    {"signal": "orcid_oauth", "weight": 0.20, "raw": 1.0, "contribution": 20.0, "source_check_id": "..."},
    {"signal": "dkim_institutional_email", "weight": 0.15, "raw": 1.0, "contribution": 15.0, "source_check_id": "..."},
    {"signal": "m19_seniority", "weight": 0.20, "raw": 0.6, "contribution": 12.0, "source_check_id": "..."},
    {"signal": "m18_institution_legitimacy", "weight": 0.20, "raw": 0.2, "contribution": 4.0, "source_check_id": "..."}
  ],
  "missing_signals": []
}
```

The `contributions[]` block is the explainability trail for adjudicators and auditors.

## marginal_cost_per_check

- **Compute:** negligible (<$0.001 per voucher) — pure deterministic combination of pre-computed signals.
- **Per-check vendor cost:** $0 in build path; $0–$5 in buy path depending on which Persona/Flagright add-ons are wired in. [vendor-gated]
- **Reviewer cost:** This is the dominant cost. At a review rate of ~25% (ideas in the 40–79 band) and 10 minutes/review at $60/hr, that's ~$2.50 amortized per voucher. [best guess: review rates of 15–35% are typical for KYC composite-score systems; refining requires production data]
- **Setup cost:**
  - Score-module engineering: ~2 engineering weeks.
  - Model-governance documentation (model card, calibration curve, bias review): ~2 weeks of compliance/eng time.
  - Threshold calibration: requires labeled historical data (or judicious initial defaults + a feedback loop).
- **Aggregate setup:** ~$30–60k one-time. [best guess]

## manual_review_handoff

Standard SOP:

1. After all sibling checks return, score module computes the composite.
2. **Institutional gate:** if m18 institution-legitimacy fails, hard-decline regardless of total score.
3. **Decision band:**
   - `score >= 80` → auto-approve voucher; record `voucher_trust_passed`.
   - `score < 40` → auto-decline; record `voucher_trust_below_threshold`. Send templated rejection (no specifics, to avoid bypass coaching).
   - `40 ≤ score < 80` → route to reviewer.
4. Reviewer sees the `contributions[]` panel: which signals are missing or low. Reviewer asks the voucher for the missing evidence (e.g. "your ORCID failed to OAuth — please retry, or provide a faculty page URL").
5. Reviewer manual decision is recorded with their note and the contributions snapshot.
6. **Drift monitoring:** weekly, compute the score distribution and the auto-approve / auto-decline rates. Alert if either moves >2σ from baseline.
7. **Model card update on every weight change.**

## flags_thrown

- `voucher_trust_below_threshold` — score <40, auto-decline.
- `voucher_trust_review_band` — score 40–79, manual review.
- `voucher_trust_institutional_gate_fail` — m18 fail, hard-decline irrespective of score.
- `voucher_trust_missing_signal` — one or more inputs unavailable (sibling check error). Cannot score; routed to reviewer.
- `voucher_trust_drift_alert` — operational, not per-voucher.
- `voucher_trust_passed` — score ≥80, recorded as positive evidence.

## failure_modes_requiring_review

- One sibling check is down (ORCID API outage, IDV vendor outage). Reviewer manually fills the missing slot or extends a temporary acceptance with recorded justification.
- Voucher legitimately scores in the band consistently (e.g. industry voucher with no ORCID and no .edu email — strong on m18 + m19 but weak on the digital-trust signals).
- Score weights need re-calibration after a labeled-incident-driven review.
- An adversarial input (e.g. forged DKIM headers) inflates one signal — drift detector should catch this systemically; per-voucher escape hatch is reviewer override.
- Adverse-action explainability requirement: the rejected voucher (or their PI) requests reasoning. The `contributions[]` snapshot is the canonical answer.

## false_positive_qualitative

- **Industry vouchers** systematically lack ORCID + DKIM-institutional-email signals, capping their max score at ~60 even when fully legitimate. Without an industry-specific weighting, this check biases against industry biotech.
- **Senior PIs at non-Anglophone institutions** with weak m18 ROR coverage and no .edu domain analog. Same effect.
- **Vouchers at brand-new institutes** (recently established RORs, no published-works track record yet for the m19 seniority signal).
- **Vouchers who refuse digital identity steps on principle** (privacy-strict vouchers). They will fall in the FAIL band without manual override.
- **Intersectional combinations:** an industry voucher at a foreign institution who refuses ORCID is the maximum-friction legitimate case.
- **Demographic/regional bias inherited from underlying signals** (FRVT bias from IDV, ORCID adoption skew, etc.) is amplified by the weighted sum. Drift monitoring may not catch slow bias creep.

## record_left

- The full score JSON (decision, score, contributions, model_version, computed_at) stored alongside the order audit log.
- Reviewer note + decision when the voucher was in the review band.
- The model card version that produced the score (so re-running the same input later reproduces the same output, even if weights have since changed).
- A SHA-256 hash of the snapshot for tamper evidence.
- Drift-monitoring time-series, retained for the auditable period (matches order retention).

## Sources

- [Persona Graph product page](https://withpersona.com/product/graph)
- [Persona SentiLink integration](https://help.withpersona.com/articles/2aYEhpHKbRvd2GWieHIbkv/)
- [Persona Prove integration](https://help.withpersona.com/articles/rzENHOKhBM9MGjCAYdMqe/)
- [Flagright real-time risk scoring](https://www.flagright.com/post/real-time-risk-scoring-in-aml-compliance-flagrights-approach)
- [Alessa AML risk scoring](https://alessa.com/software-solutions/aml-compliance/risk-scoring/)
- [Pace Analytics: ECOA Adverse Action + Explainable AI](https://www.paceanalyticsllc.com/post/ecoa-adverse-actions-and-explainable-ai)
- [iDenfy KYC risk assessment overview](https://idenfy.com/blog/kyc-risk-assessment/)
- [Azakaw customer risk rating guide](https://www.azakaw.com/blog/customer-risk-rating)
