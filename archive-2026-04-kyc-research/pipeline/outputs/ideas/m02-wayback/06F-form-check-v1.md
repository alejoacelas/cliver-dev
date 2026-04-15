# Form check: m02-wayback 06-coverage-v1

## Schema field check

| Field | Status | Notes |
|---|---|---|
| `coverage_gaps` | PASS | 4 gaps identified, each with category, estimated size, behavior, reasoning |
| `false_positive_qualitative` | PASS | Refined with 3 items cross-referenced to gaps |

## Per-gap citation audit

| Gap | Has citation or [best guess] or [unknown]? | Issue? |
|---|---|---|
| Gap 1 (no Wayback history) | PASS — cites Wikipedia (350M sites), Openprovider (368M domains). 30-50% of young domains is [best guess] | Acceptable |
| Gap 2 (robots.txt exclusion) | PASS — cites IA blog post on robots.txt policy change. Size is [unknown] with search terms | Acceptable |
| Gap 3 (SPA/JS-rendered) | PASS — 20-30% is [best guess], with [unknown] marker for biotech-specific stat | Acceptable |
| Gap 4 (attacker bypass) | PASS — noted as attacker bypass, not customer gap | Same scope note as m02-rdap-age Gap 4 |

## Substantive flags

1. **MINOR — Gap 4 is an attacker bypass, not a customer coverage gap:** Same issue as m02-rdap-age. Useful context but technically out of scope for stage 6.
2. **MINOR — Gap 3 SPA estimate lacks any source:** The 20-30% figure for biotech SPA websites is entirely unsourced. Even a proxy (e.g., BuiltWith data on SPA framework adoption across all websites) would strengthen this.

## Verdict

**PASS** — all fields populated. Two minor flags.
