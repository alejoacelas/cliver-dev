# 4F form check — m06-bis-country-groups v1

## Field verdicts

- `external_dependencies` — **PASS.** Names BIS Country Groups, Country Chart, BioExport guidance, and the cross-dependencies on m06-hs-eccn-classification and m06-iso-country-normalize.
- `endpoint_details` — **PASS.** Explicit that there is no JSON API; ingest-once pattern documented; vendor-gated alternative noted; search list provided for the no-API claim.
- `fields_returned` — **PASS.** Concrete schema for the post-ingest lookup.
- `marginal_cost_per_check` — **PASS.** Zero marginal + setup cost reasoning + vendor alt.
- `manual_review_handoff` — **PASS.** Distinct paths for E, D, borderline, and re-export.
- `flags_thrown` — **PASS.** Five distinct flags including MEU.
- `failure_modes_requiring_review` — **PASS.** Country normalization, ECCN ambiguity, sub-region, table staleness, license exceptions.
- `false_positive_qualitative` — **PASS.** Five concrete legitimate-customer populations including the China dual-listing case.
- `record_left` — **PASS.** Concrete schema and 15 CFR 762.6 retention.

## For 4C to verify

- Confirm BIS publishes no JSON API for the Country Chart (the v1 search list is plausible but worth a fetch-confirm).
- Confirm Federal Register cadence claim and the May 2024 Nixon Peabody alert URL.
- Confirm 15 CFR 762.6 retention period.
- Confirm North Korea/Cuba/Iran/Syria are E:1/E:2 listings (current as of 2025–2026).

## Verdict

PASS.
