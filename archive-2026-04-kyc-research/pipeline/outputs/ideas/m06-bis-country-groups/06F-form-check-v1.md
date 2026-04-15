# Form check: m06-bis-country-groups / 06-coverage-v1.md

## Schema field: `coverage_gaps`

- [PASS] Six gaps identified, each with category, estimated size, behavior classification, and reasoning.
- [FLAG] Gap 2 estimated size is `[unknown]` — the search list ("fraction of DNA synthesis orders requiring ECCN classification review", "percentage gene synthesis orders classified 1C353") is reasonable but thin. Consider searching for provider-reported SOC hit rates or IGSC screening statistics in v2.
- [FLAG] Gap 3 estimated size is `[unknown]` — the search list is reasonable. This is a structurally hard-to-quantify gap; the `[unknown]` admission is appropriate.
- [FLAG] Gap 6 estimated size is `[unknown]` with a best-guess bound of <0.5%. The best guess is plausible but unsourced.

## Schema field: `false_positive_qualitative`

- [PASS] Refined with cross-references to gaps. Three categories identified.
- [FLAG] The statement "most synthesis orders are EAR99" and "1C353 classification rate is likely <5%" appears in both the gaps section and the false-positive section without a source or `[best guess]` tag in the false-positive section. Should be marked `[best guess: ...]` consistently.

## Sourcing conventions

- [PASS] Citations present for market size figures (Asia-Pacific 23%, China 8%, ~50 D-group countries).
- [FLAG] The 25–35% estimate for Group D countries' share of international orders is marked `[best guess]` — derivation is stated but could be tighter (it sums APAC + MEA but doesn't subtract non-D-group APAC countries like Japan, South Korea, Australia, New Zealand, Singapore).

## Structure

- [PASS] All required sections present (Coverage gaps, Refined false-positive qualitative, Notes for stage 7 synthesis).
- [PASS] Each gap has the four required sub-fields.

## Summary

4 flags, 0 blockers. Main issues: two `[unknown]` gaps with thin search lists, one unsourced best-guess repeated without tag, one derivation that could be more precise.
