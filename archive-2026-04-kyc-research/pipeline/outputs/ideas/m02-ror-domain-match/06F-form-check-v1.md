# Form check: m02-ror-domain-match 06-coverage-v1

## Schema field check

| Field | Status | Notes |
|---|---|---|
| `coverage_gaps` | PASS | 5 gaps identified, each with category, estimated size, behavior, reasoning |
| `false_positive_qualitative` | PASS | Refined with 3 items cross-referenced to gaps |

## Per-gap citation audit

| Gap | Has citation or [best guess] or [unknown]? | Issue? |
|---|---|---|
| Gap 1 (institutions not in ROR) | PASS — cites ROR year-in-review (120k orgs), Scimago, AfricArXiv. 40-50% coverage of synthesis buyers is [best guess] | Acceptable |
| Gap 2 (domains[] sparse) | PASS — cites Zenodo data dump v1.54 with precise 2,366/111,068 ratio | Strong sourcing |
| Gap 3 (commercial customers) | PASS — cites Fortune BI for 46% commercial. <5% in ROR is [best guess] | Acceptable |
| Gap 4 (personal email) | PASS — explicitly [unknown] with search terms | Acceptable |
| Gap 5 (multi-domain institutions) | PASS — cites NSF NCSES for R1 count. 10-20% operating 3+ domains is [best guess] | Acceptable |

## Substantive flags

1. **MINOR — Gap 2 is a critical finding that should be more prominent:** The ~2% `domains[]` population rate substantially undermines the check's design. The 04-implementation discusses `domains[]` as a primary matching path, but 98% of records lack it. This gap should be flagged for stage 7 as a potential design revision (always fall back to website-apex, treat `domains[]` as bonus when available).

## Verdict

**PASS** — thorough coverage analysis with 5 well-defined gaps. Strong citation on the most important finding (Gap 2). One minor suggestion for emphasis.
