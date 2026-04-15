# 4F form check — m07-directory-scrape v1

## Field verdicts

- `external_dependencies` — **PASS.** Names eduPerson schema, InCommon (and refers to sister idea), GDPR/FERPA constraints, scraping tooling, and the legal landscape paper.
- `endpoint_details` — **PASS.** Honest about there being no single endpoint; per-adapter pattern documented; ToS / GDPR posture explicit.
- `fields_returned` — **PASS.** Concrete normalized record schema with best-guess marker.
- `marginal_cost_per_check` — **PASS.** Two-path cost reasoning + per-adapter engineering estimate + vendor alternatives.
- `manual_review_handoff` — **PASS.** Eight distinct paths including the high-signal role-mismatch case.
- `flags_thrown` — **PASS.** Seven flags including the recent-entry and visiting-only signals.
- `failure_modes_requiring_review` — **PASS.** Eight concrete failure modes including JS SPA, GDPR suppression, common-name overload.
- `false_positive_qualitative` — **PASS.** Eight categories; explicitly notes structural high-FP load and the M07 "low-scrutiny" framing.
- `record_left` — **PASS.** Cached HTML rationale + best-guess on retention.

## For 4C to verify

- Brown et al. 2025 SAGE paper URL — does it cover the legal/ethical landscape claim?
- California Law Review "Great Scrape" URL
- eduPerson schema URL on REFEDS
- Proxycurl pricing range (sister idea will deep-dive)

## Verdict

PASS.
