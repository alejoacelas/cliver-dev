# Form check: m03-usps-rdi-cmra 06-coverage-v1

## Schema field check

| Field | Status | Notes |
|---|---|---|
| `coverage_gaps` | PASS | 5 gaps identified, each with category, estimated size, behavior, reasoning |
| `false_positive_qualitative` | PASS | Refined with 3 items cross-referenced to gaps |

## Per-gap citation audit

| Gap | Has citation or [best guess] or [unknown]? | Issue? |
|---|---|---|
| Gap 1 (international addresses) | PASS — marks international customer percentage as [unknown] with search terms; 30-50% is [best guess] | Acceptable |
| Gap 2 (non-US providers) | PASS — cites USPS developer portal. 30-40% provider estimate is [best guess] | Acceptable |
| Gap 3 (Enhanced Address API gap) | PASS — cites USPS Web Tools Tech Docs, RevAddress | Strong sourcing on the timeline |
| Gap 4 (legitimate CMRA users) | PASS — cites USPS OIG (15k CMRAs, 1.6M customers) | Cross-references m03-smarty-melissa |
| Gap 5 (newly registered CMRAs) | PASS — cites USPS PostalPro for monthly DPV cycle. <100 is [best guess] | Acceptable |

## Substantive flags

1. **MINOR — Significant overlap with m03-smarty-melissa coverage analysis:** Gaps 4 and 5 are near-duplicates of m03-smarty-melissa gaps. This is expected (both ideas use the same underlying USPS DPV data) but the stage 7 synthesis should note the redundancy.
2. **MINOR — Gap 2 conflates provider-side implementation barrier with customer coverage:** The prompt asks about customer categories, but Gap 2 is about which providers can implement the check. Valid context for synthesis but technically a different dimension.

## Verdict

**PASS** — all fields populated with citations or explicit markers. Two minor flags on overlap and scope.
