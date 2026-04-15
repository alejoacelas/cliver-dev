# 06F Form check: m09-irs-990 — coverage v1

## Field-by-field verdicts

### coverage_gaps
**PASS** — Five gaps identified. The most important finding — that the check is N/A for ~80% of synthesis customers — is well-supported with market share data. Each gap has a precise category, estimated size with citations or explicit `[best guess]`/`[unknown]` markers, behavior classification, and reasoning.

### false_positive_qualitative (refined)
**PASS** — Correctly distinguishes between true false positives (small biolabs tripping `990_revenue_implausible`) and uninformative no-signal cases (for-profits, foreign institutions). Good specificity.

### Notes for stage 7 synthesis
**PASS** — Key recommendation that the check should be scoped to customers claiming 501(c)(3) status is well-founded and actionable.

## Flags

### CITATION-MISSING: Gap 4 new 501(c)(3) determinations per year
The claim "~80,000–100,000 new 501(c)(3) determinations per year" cites the IRS SOI statistics page but does not specify which table or publication contains this number. The IRS page is a portal, not a direct citation.

## For 4C to verify

1. The NCCS/Urban Institute finding that ~65% of nonprofits file 990-N or are exempt from full reporting — verify the year and whether this figure is still current.
2. The claim about >714,000 organizations covered by the 2006 990-N mandate — verify this specific number from the Urban Institute source.
3. The IRS SOI statistics page — check whether it actually provides annual 501(c)(3) determination counts.

## Verdict: PASS

One minor CITATION-MISSING flag. The coverage analysis correctly identifies the fundamental limitation of this check (applicable to a small minority of synthesis customers) and is well-structured. No revision needed.
