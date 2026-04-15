# Form check: m07-directory-scrape / 06-coverage-v1.md

## Schema field: `coverage_gaps`

- [PASS] Six gaps identified, each with category, estimated size, behavior classification, and reasoning.
- [FLAG] Gap 2 US postdoc count (~40,000–60,000) is marked `[best guess]` and attributed to NSF survey estimates, but no direct citation is provided. Consider citing the NSF NCSES "Survey of Graduate Students and Postdoctorates in Science and Engineering" directly.
- [FLAG] Gap 2 estimate that ~5–10% of active researchers are not in the central directory is `[best guess]` with a thin derivation ("postdoc-to-faculty ratios"). This could be strengthened with a concrete example (e.g., checking a specific R1 directory for postdoc coverage).
- [FLAG] Gap 4 is `[unknown]` — search list is reasonable but thin (2 queries). Consider searching for name-mismatch studies in library science or identity verification literature.
- [FLAG] Gap 6 Europe market share (~20–25%) is a `[best guess]` derived by subtraction. Stage 4 and earlier coverage research for other ideas cite APAC and NA percentages but not Europe directly. Consider searching for European DNA synthesis market share.

## Schema field: `false_positive_qualitative`

- [PASS] Five categories cross-referenced with gaps. Good specificity.
- [PASS] The EU GDPR suppression is correctly identified as systematic, not per-customer.

## Sourcing conventions

- [PASS] Carnegie Classification and worldwide university count cited.
- [PASS] Synthetic biology market breakdown cited.
- [FLAG] The Inside Higher Ed article on GDPR is from 2018 — it's still relevant but may not reflect current EU institutional practices. Consider a more recent source.

## Structure

- [PASS] All required sections present.
- [PASS] Each gap has required sub-fields.

## Summary

5 flags, 0 blockers. Main issues: two best-guess estimates with thin derivations; one `[unknown]` with thin search list; one dated GDPR source; one market-share figure derived by subtraction.
