# Form check: m06-bis-entity-list / 06-coverage-v1.md

## Schema field: `coverage_gaps`

- [PASS] Five gaps identified, each with category, estimated size, behavior classification, and reasoning.
- [FLAG] Gap 1 total Entity List size is marked `[best guess: 1,500–2,500]` with only one anchor (715 Chinese entities). The total CSL size estimate (10,000–15,000) is also a best guess. Consider searching for the actual CSL record count or downloading the CSV to count.
- [FLAG] Gap 2 post-rule coverage: the `[unknown]` admission about whether the CSL API has been updated to flag affiliates is important and well-stated. Search list is reasonable.
- [FLAG] Gap 5 is `[unknown]` — search list is thin (2 queries). Consider adding searches for BIS enforcement action statistics or DOJ prosecution counts for Entity List evasion.

## Schema field: `false_positive_qualitative`

- [PASS] Three categories cross-referenced with gaps. Good integration.
- [PASS] Financial-sector FP rate (90–95%) is cited with source.

## Sourcing conventions

- [PASS] Market share citations present. Wikipedia citation for Entity List count is acceptable as a secondary source but could be strengthened with a primary BIS source.
- [FLAG] The 50% Affiliates Rule section cites multiple law firm alerts — these are reliable secondary sources but could benefit from the primary Federal Register citation.

## Structure

- [PASS] All required sections present.
- [PASS] Each gap has required sub-fields.

## Summary

4 flags, 0 blockers. Main issues: Entity List size estimates rely on best guesses; one unknown with thin search list; primary-source citations could supplement law-firm alerts.
