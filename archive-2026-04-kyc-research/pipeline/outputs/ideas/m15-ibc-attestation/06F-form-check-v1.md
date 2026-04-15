# Form check: m15-ibc-attestation / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap | Category precision | Size estimate | Citation quality | Behavior label | Verdict |
|---|---|---|---|---|---|---|
| 1 | Foreign academic customers | Precise (non-US institutions, no IBC-RMS equivalent) | Cited (GM Insights regional revenue split) | OK -- revenue-as-proxy acknowledged as approximation | no-signal | PASS |
| 2 | Private-sector / externally-administered IBC | Precise (small biotech using WCG/Advarra) | Partially cited (Fortune BI market share + Undark external IBC count) | Size range is [best guess] -- reasonable given inputs | false-positive / no-signal | PASS |
| 3 | Section III-F exempt researchers | Precise (exempt under NIH Guidelines) | [best guess: 30-60%] -- no citation for the proportion | Thin -- the 30-60% range is plausible but unsourced. Searched query list is present. | false-positive | FLAG: the size estimate is load-bearing (potentially the largest gap) and has no citation. Search list is thin -- only 3 queries. Consider searching for institutional IBC workload data (fraction of protocols exempt vs reviewed). |
| 4 | Recently-rotated IBC chairs | Precise | [best guess: 5-10%] -- no citation | Thin -- committee turnover is guesswork. | false-positive | FLAG: minor -- low-stakes estimate, but the [best guess] reasoning could cite academic committee term lengths. |
| 5 | Independent / DIY biology | Precise | [best guess: <2%] -- no citation, DIYbio.org reference is directional only | Acceptable for a small category. | no-signal | PASS |

## Schema field: `false_positive_qualitative`

Refined list present with cross-references to gaps. Covers 5 categories. Correctly distinguishes false-positive (flag fires on legitimate customer) from no-signal (check returns nothing). PASS.

## Schema field: `notes for stage 7 synthesis`

Present. Notes are actionable (geographic limitation, III-F exemption mitigation, external-IBC mapping). PASS.

## Overall form verdict

**2 FLAGs:**
1. Gap 3 (Section III-F exempt) size estimate needs stronger sourcing or a more explicit [unknown] admission.
2. Gap 4 (IBC chair rotation) size estimate is a bare guess -- minor.

No missing gaps that are obviously required by the implementation. The gap list is case-appropriate for the data source (IBC-RMS).
