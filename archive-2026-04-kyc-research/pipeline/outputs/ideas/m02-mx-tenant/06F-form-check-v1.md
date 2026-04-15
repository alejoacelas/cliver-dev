# Form check: m02-mx-tenant 06-coverage-v1

## Schema field check

| Field | Status | Notes |
|---|---|---|
| `coverage_gaps` | PASS | 4 gaps identified, each with category, estimated size, behavior, reasoning |
| `false_positive_qualitative` | PASS | Refined with 4 items cross-referenced to gaps |

## Per-gap citation audit

| Gap | Has citation or [best guess] or [unknown]? | Issue? |
|---|---|---|
| Gap 1 (self-hosted academic) | PASS — cites Valimail, DMARC Report, dmarcian for DMARC adoption rates | Size estimate of 15-25% self-hosting is marked [best guess] with reasoning — acceptable |
| Gap 2 (small commercial biotech) | PASS — cites Fortune Business Insights for 46/54 split, DataStudios for Workspace/M365 share | The 30-50% "small companies" sub-estimate is [best guess] without a direct citation — borderline but flagged |
| Gap 3 (free-mail customers) | PASS — explicitly marks [unknown] with search terms | Acceptable |
| Gap 4 (security gateways) | PASS — cites Proofpoint corporate claim for Fortune 100 | University-specific penetration is [best guess] — acceptable |

## Substantive flags

1. **MINOR — Gap 2 size estimate loosely bounded:** The "30-50% of commercial segment are small companies" range is wide and not directly cited. A tighter proxy (e.g., SBA data on firm size distribution in NAICS 5417) would strengthen this.
2. **MINOR — Gap 3 free-mail prevalence entirely [unknown]:** The 5-15% figure has no source at all beyond "general B2B e-commerce patterns." Acceptable as [unknown] but the stage 7 synthesis should note this is unsupported.

## Verdict

**PASS** — all required fields populated, all estimates either cited or explicitly marked. Two minor flags for tightening in a future iteration.
