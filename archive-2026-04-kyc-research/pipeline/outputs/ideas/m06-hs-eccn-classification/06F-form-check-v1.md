# Form check: m06-hs-eccn-classification / 06-coverage-v1.md

## Schema field: `coverage_gaps`

- [PASS] Five gaps identified, each with category, estimated size, behavior classification, and reasoning.
- [FLAG] Gap 1 estimated 1C353 classification rate (<1% of total orders) is marked `[best guess]` but relies on a chain of reasoning from the 5% screening hit rate. The derivation is plausible but should note that the 5% figure comes from a 2022 EBRC policy paper and may not reflect current screening tool sensitivity.
- [FLAG] Gap 2 (novel sequences) and Gap 3 (vectors) are both `[unknown]` — the search lists are reasonable and reflect genuinely unavailable data.
- [FLAG] Gap 4 (modified bases) is `[unknown]` — the search for modified-nucleotide market share found nothing. Consider searching for IDT or Eurofins product catalogs as a proxy for the modified-base share.

## Schema field: `false_positive_qualitative`

- [PASS] Four categories identified, all cross-referenced with Gap 1. The 5% screening hit rate is cited.
- [PASS] Distinction between "classification review burden" and "actual 1C353 licensing burden" is clearly stated.

## Sourcing conventions

- [PASS] EBRC/PMC citation for the 5% screening hit rate.
- [PASS] Market share figures for non-US providers cited.
- [FLAG] The December 2023 EAR amendment is referenced but without a Federal Register citation (stage 4 notes the source as `https://www.federalregister.gov/` without a specific document number). Should be strengthened in v2.

## Structure

- [PASS] All required sections present.
- [PASS] Each gap has required sub-fields.

## Summary

4 flags, 0 blockers. Main issues: three `[unknown]` gaps with reasonable search lists; one best-guess derivation that could be tightened; one missing Federal Register citation.
