# Form check: 06-coverage-v1.md — m13-rebind-cadence

## Schema field: `coverage_gaps`

**Status: POPULATED**

Six gaps identified with all required subfields.

## Citation / sourcing audit

| Gap | Cited? | Notes |
|-----|--------|-------|
| Gap 1 (MVNO/prepaid) | Yes — Telesign blog for coverage stats; tridenstechnology.com for prepaid churn | Adequate. The 10–20% MVNO estimate is [best guess] but reasonable. |
| Gap 2 (international carriers) | Yes — Telesign for 16-country coverage; gminsights.com for market share | Adequate. |
| Gap 3 (legitimate SIM change) | Yes — CustomerGauge for 15–25% telecom churn | Adequate. The 10–15% per-cadence estimate is derived from the annual churn figure. |
| Gap 4 (eSIM) | Marked [best guess] | The 15–25% new activation figure is plausible given Apple's eSIM-only US iPhones but unsourced. |
| Gap 5 (abandoned number) | Marked [best guess] | Acceptable — inherently hard to quantify. |
| Gap 6 (roaming) | Marked [best guess] | Acceptable — the 3–8% traveling figure is plausible for academia. |

## Completeness check

- All gaps have behavior classification: **PASS**
- `false_positive_qualitative` updated: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

- **FLAG (minor):** Gap 4 (eSIM) cites no source for the 15–25% eSIM activation share claim. A citation to an eSIM adoption report would strengthen this.
- **FLAG (minor):** Gap 3 and Gap 4 overlap significantly — both produce the same `sim_swap_recent` flag via the same mechanism. Consider whether they should be merged or explicitly distinguished by the carrier-side signal path.

## Verdict: PASS with minor flags
