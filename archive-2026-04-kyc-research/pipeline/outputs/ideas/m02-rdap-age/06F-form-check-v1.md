# Form check: m02-rdap-age 06-coverage-v1

## Schema field check

| Field | Status | Notes |
|---|---|---|
| `coverage_gaps` | PASS | 4 gaps identified, each with category, estimated size, behavior, reasoning |
| `false_positive_qualitative` | PASS | Refined with 3 items cross-referenced to gaps |

## Per-gap citation audit

| Gap | Has citation or [best guess] or [unknown]? | Issue? |
|---|---|---|
| Gap 1 (new biotech startups) | PASS — cites Specter Insights for 3,740 firms / 8.9% growth, Fortune BI for customer split | The 5-10% active-customer estimate is [best guess] with derivation — acceptable |
| Gap 2 (GDPR-redacted registrant) | PASS — cites Interisle/DNIB with specific 58.2%/31.0%/10.8% breakdown | Strong sourcing |
| Gap 3 (ccTLD without RDAP) | PASS — cites RDAP.org deployment dashboard; 30-40% is [best guess] acknowledged | Acceptable |
| Gap 4 (aged-domain attackers) | PASS — marks auction market size as [unknown] with search terms | Acceptable |

## Substantive flags

1. **MINOR — Gap 4 is an attacker bypass, not a customer coverage gap:** The stage 6 prompt asks specifically about "categories of legitimate customers." Gap 4 describes an attacker category. It is useful context for stage 7, but strictly out of scope for coverage research. Consider relabeling or moving to notes.

## Verdict

**PASS** — all fields populated with citations or explicit markers. One minor scope flag.
