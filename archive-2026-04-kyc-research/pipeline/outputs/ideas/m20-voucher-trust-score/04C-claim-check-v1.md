# 4C claim check — m20-voucher-trust-score v1

## Per-claim findings

- **Persona Graph product page** — resolves; supports the link-analysis claim and the multi-hop signal description. **No flag.**
- **Persona SentiLink integration** — resolves; supports that SentiLink is an integration partner exposing a synthetic-identity composite via Persona. **No flag.** (Confirms that the doc is right to describe SentiLink as an integration, not native Persona.)
- **Persona Prove integration** — resolves; supports the phone Trust Score claim. **No flag.**
- **Flagright real-time risk scoring blog** — resolves; supports the weighted-rule scoring claim. Third-party (vendor blog) but consistent. **No flag.**
- **Alessa AML risk scoring** — resolves; supports vendor existence and weighted-scoring product. **No flag.**
- **Pace Analytics on ECOA + Explainable AI** — resolves; supports the framing that CFPB Circular 2022-03 challenged AI-generated adverse-action reasons. The doc's invocation as an *analog* (not a direct compliance requirement for DNA synthesis screening) is appropriate. **No flag.**
- **iDenfy KYC risk assessment** — resolves; supports the standard practice of weighted scoring + low/med/high banding. **No flag.**
- **Azakaw customer risk rating guide** — resolves; supports weighted multi-signal scoring practice. **No flag.**

## Other observations

- The doc does not cite specific weight values from any source — that's correct; weights are an internal calibration choice and should not be borrowed from a credit-scoring blog.
- The "review rates of 15–35% are typical" range is unsourced. Could be tightened by citing a public KYC-vendor benchmark (e.g. Onfido / Persona report decks). `UPGRADE-SUGGESTED` (low priority).
- Drift monitoring claim ("alert if either rate moves >2σ from baseline") is operational guidance, not an empirical claim — no citation needed.

**Verdict:** PASS
