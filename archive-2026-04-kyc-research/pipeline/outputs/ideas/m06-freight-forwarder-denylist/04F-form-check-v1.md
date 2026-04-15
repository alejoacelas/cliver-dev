# 4F form check — m06-freight-forwarder-denylist v1

## Field verdicts

- `external_dependencies` — **PASS.** Names BIS Entity List, OFAC SDN, TIP, DLTHTY, CHPL, Tri-Seal note, and internal incident history. Strong source diversity for a curated list.
- `endpoint_details` — **PASS.** Honest about the multi-source build pipeline; explicit `[unknown]` admission on TIP API with three queries; vendor-gated alternatives (Kharon, Descartes) named.
- `fields_returned` — **PASS.** Concrete internal schema.
- `marginal_cost_per_check` — **PASS.** Best-guess setup with reasoning + vendor alt.
- `manual_review_handoff` — **PASS.** Distinct paths for hard / review / advisory / address-only patterns.
- `flags_thrown` — **PASS.** Five flags including the shell-at-known-address and CHPL+diversion-country patterns.
- `failure_modes_requiring_review` — **PASS.** List staleness, missing forwarder name, shell rotation, common-name FPs.
- `false_positive_qualitative` — **PASS.** Major-global-forwarder allowlist need, legitimate distributors in diversion-risk countries, common-name fuzzy hits.
- `record_left` — **PASS.** Includes the version-stamp argument.

## For 4C to verify

- TIP exists at `tradeintegrityproject.com` and is associated with Yermak-McFaul / KSE
- BIS July 2024 diversion-risks guidance press release URL
- Joint Tri-Seal Compliance Note March 2024 URL
- "Don't Let This Happen To You" 2024 update
- BIS CHPL exists and is published

## Verdict

PASS.
