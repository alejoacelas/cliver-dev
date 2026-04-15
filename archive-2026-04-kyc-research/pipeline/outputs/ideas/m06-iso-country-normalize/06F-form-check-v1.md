# Form check: m06-iso-country-normalize / 06-coverage-v1.md

## Schema field: `coverage_gaps`

- [PASS] Five gaps identified, each with category, estimated size, behavior classification, and reasoning.
- [PASS] Gap 1 cites Libpostal accuracy benchmark and address normalization accuracy figures.
- [FLAG] Gap 2 population estimates for occupied vs. unoccupied portions are marked `[best guess]` from front-line maps — reasonable given the dynamic situation, but could be strengthened with UNHCR or UN OCHA displacement figures.
- [FLAG] Gap 4 is `[unknown]` with a reasonable search list. The admission that normalization is a data-quality tool, not a fraud-detection tool, is well-stated.
- [FLAG] Gap 5 mentions Russian-administered postal code ranges but does not cite a specific source for the postal codes. Consider referencing the Russian postal service (Pochta Rossii) or a comparative analysis.

## Schema field: `false_positive_qualitative`

- [PASS] Four categories cross-referenced with gaps. Good specificity (displaced Ukrainian institutions, diaspora addresses).

## Sourcing conventions

- [PASS] ISO 3166 Wikipedia citation for country count. Libpostal/AddressHub accuracy citations present.
- [PASS] Kelley Drye blog post cited for Crimea/DNR/LNR compliance approach.

## Structure

- [PASS] All required sections present.
- [PASS] Each gap has required sub-fields.

## Summary

3 flags, 0 blockers. Main issues: one `[unknown]` gap; two best-guess estimates that could use stronger anchors; one missing postal-code source.
