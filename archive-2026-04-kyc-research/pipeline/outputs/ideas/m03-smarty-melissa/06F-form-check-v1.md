# Form check: m03-smarty-melissa 06-coverage-v1

## Schema field check

| Field | Status | Notes |
|---|---|---|
| `coverage_gaps` | PASS | 4 gaps identified, each with category, estimated size, behavior, reasoning |
| `false_positive_qualitative` | PASS | Refined with 3 items cross-referenced to gaps |

## Per-gap citation audit

| Gap | Has citation or [best guess] or [unknown]? | Issue? |
|---|---|---|
| Gap 1 (shallow international coverage) | PASS — cites Smarty (250 countries) and Melissa G2 (240+). Depth estimate is [best guess] with [unknown] for specific country lists | Acceptable |
| Gap 2 (legitimate CMRA users) | PASS — cites USPS OIG (15k CMRAs, 1.6M customers). Usage by synthesis customers is [unknown] | Acceptable |
| Gap 3 (new-construction addresses) | PASS — <0.5% is [best guess] with reasoning | Acceptable |
| Gap 4 (freight forwarders) | PASS — 1-5% is [best guess] with [unknown] markers | Acceptable |

## Substantive flags

1. **MINOR — Gap 1 "30-40 countries" with full street-level coverage is a significant claim with no direct citation.** Neither Smarty nor Melissa publishes a per-country depth matrix publicly. The estimate is reasonable but should be marked more explicitly as [best guess].

## Verdict

**PASS** — all fields populated with citations or explicit markers. One minor flag on Gap 1 specificity.
