# Form check: 06-coverage-v1.md — m12-procurement-network

## Schema field: `coverage_gaps`

**Status: POPULATED**

Six gaps identified, each with category, estimated size, behavior, and reasoning. All required subfields present.

## Citation / sourcing audit

| Gap | Cited? | Notes |
|-----|--------|-------|
| Gap 1 (non-US) | Yes — gene synthesis market regional share from gminsights.com and marketdataforecast.com | Adequate. The 60% figure is derived from cited inputs. |
| Gap 2 (US non-PaymentWorks/Jaggaer) | Yes — Carnegie classification R1/R2 count from Wikipedia | The ~150+ PaymentWorks figure comes from the 04-implementation-v1.md. The 200–300 combined coverage estimate is marked [best guess] appropriately. |
| Gap 3 (commercial customers) | Yes — Grand View Research US market report for 42%/50% figures | Adequate. |
| Gap 4 (personal payment) | Marked [unknown] with search terms | Acceptable — this is inherently hard to quantify. |
| Gap 5 (government labs) | Marked [best guess] | Thin but acceptable for a niche category. No obvious public proxy exists for "fraction of national lab orders routed outside SAM.gov." |
| Gap 6 (registration lag) | Marked [best guess] | Acceptable — transient state, hard to quantify externally. |

## Completeness check

- All gaps have a behavior classification (no-signal / false-positive / weak-signal): **PASS**
- `false_positive_qualitative` section updated with cross-references to gaps: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

- **FLAG (minor):** Gap 1 estimates "55–65% of all institutional orders come from outside the US" but this is derived from revenue share, not order count. Revenue share and order-count share may diverge significantly if non-US orders are smaller. The note acknowledges this ("likely a higher share by order count") but does not attempt to bound the divergence.
- **FLAG (minor):** Gap 3 uses "42–50% of customers by revenue" but the underlying question is what fraction of *orders* or *customers* are commercial, not what fraction of *revenue* they generate. Revenue-weighted figures overcount large pharma and undercount small biotech startups.

## Verdict: PASS with minor flags
