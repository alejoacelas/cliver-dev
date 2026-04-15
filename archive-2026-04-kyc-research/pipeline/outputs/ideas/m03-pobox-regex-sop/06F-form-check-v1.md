# Form check: m03-pobox-regex-sop 06-coverage-v1

## Schema field check

| Field | Status | Notes |
|---|---|---|
| `coverage_gaps` | PASS | 3 gaps identified, each with category, estimated size, behavior, reasoning |
| `false_positive_qualitative` | PASS | Refined with 3 items cross-referenced to gaps |

## Per-gap citation audit

| Gap | Has citation or [best guess] or [unknown]? | Issue? |
|---|---|---|
| Gap 1 (non-covered languages) | PASS — marks international customer percentage as [unknown] with search terms; CJK estimate is [best guess] | Acceptable |
| Gap 2 (obfuscation) | PASS — <1% is [best guess]; notes this is more bypass than coverage gap | Acceptable |
| Gap 3 (legitimate PO Box institutions) | PASS — cites USPS Postal Facts (21M boxes, 168.6M delivery points) and Save the Post Office (14.4M occupied) | Strong sourcing |

## Substantive flags

1. **MINOR — Gap 2 is an attacker bypass, not a customer coverage gap:** Similar to the attacker-bypass notes in m02-rdap-age and m02-wayback. The coverage-research prompt asks about legitimate customers specifically.

## Verdict

**PASS** — clean and focused analysis. Appropriate for a simple deterministic check. One minor scope flag.
