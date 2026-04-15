# Form check: m16-dormancy-reidv / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap | Category precision | Size estimate | Citation quality | Behavior label | Verdict |
|---|---|---|---|---|---|---|
| 1 | Sabbatical/leave returnees | Precise (6-12 month leave, faculty) | [best guess: 3-7%] anchored by Twist academic segment data | Twist JPM25 cited for academic share; sabbatical rate is common knowledge but uncited | false-positive | PASS |
| 2 | Seasonal teaching labs | Precise | [best guess: 2-5%] -- no citation | Thin | false-positive | PASS -- minor gap, low stakes |
| 3 | Appearance change | Precise | [best guess: 1-3%] anchored by MSU aging study | ScienceDaily aging study cited; NIST reference | false-positive | PASS |
| 4 | Active account compromise | Precise (structural boundary) | N/A -- design scope, not population estimate | Correctly scoped | no-signal | PASS |
| 5 | Informal account transfers | Precise | [best guess: 1-3%] -- no citation | Thin | true-positive / policy tension | PASS -- correctly identified as a design choice, not a bug |

## Schema field: `false_positive_qualitative`

Refined list with 4 categories, cross-referenced. Correctly excludes Gap 4 (by design). PASS.

## Schema field: `notes for stage 7 synthesis`

Present and actionable (threshold tuning, periodic re-IDV for active accounts, pairing with m16-no-sms-no-email-reset). PASS.

## Overall form verdict

**0 FLAGs.**

Well-structured and appropriately scoped to the dormancy trigger's narrow purpose. Size estimates are modest but reasonable for a narrowly-targeted check. All gaps have either citations or reasonable [best guess] derivations.
