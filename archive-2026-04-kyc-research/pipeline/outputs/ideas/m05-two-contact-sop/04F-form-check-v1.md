# 4F form check — m05-two-contact-sop v1

## Field verdicts

- `external_dependencies` — **PASS.** Names HHS guidance + IGSC protocol as the regulatory anchors and is explicit that there is no vendor.
- `endpoint_details` — **PASS.** SOP-shaped: trigger, 5 steps, independence rule, throughput estimate. Throughput is best-guess but the reasoning is spelled out.
- `fields_returned` — **PASS.** Concrete record schema; explicit best-guess marker on form-field provenance.
- `marginal_cost_per_check` — **PASS.** Cost reasoning is best-guess but spelled out, anchored to a CSR characterization. Setup cost is named.
- `manual_review_handoff` — **PASS.** Explicit escalation paths for each flag.
- `flags_thrown` — **PASS.** Four flags + actions.
- `failure_modes_requiring_review` — **PASS.** Concrete list including independence-failure case.
- `false_positive_qualitative` — **PASS.** Seven concrete legitimate-customer populations.
- `record_left` — **PASS.** Names the screenshot, phone log, email thread, retention period.

## For 4C to verify

- HHS SynNA Guidance 2023 URL — does it actually contain the "biosafety officer / supervisor" callback recommendation?
- IGSC v3.0 PDF URL — does it contain the "verify independently" language quoted?
- BIS 15 CFR 762 retention period — does the cited URL describe the 5-year retention claim?

## Verdict

PASS.
