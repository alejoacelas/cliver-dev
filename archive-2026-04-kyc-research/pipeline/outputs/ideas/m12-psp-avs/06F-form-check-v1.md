# Form check: 06-coverage-v1.md — m12-psp-avs

## Schema field: `coverage_gaps`

**Status: POPULATED**

Six gaps identified with category, estimated size, behavior, and reasoning for each.

## Citation / sourcing audit

| Gap | Cited? | Notes |
|-----|--------|-------|
| Gap 1 (international cards) | Yes — gminsights.com for market share; Adyen docs and Wikipedia for AVS geographic limits | Adequate. |
| Gap 2 (address errors) | Yes — Signifyd blog for 3.6% and 6.7% figures | Adequate. |
| Gap 3 (P-card HQ address) | Marked [unknown] with search terms | Acceptable — no public proxy for P-card billing-address mismatch rates exists. |
| Gap 4 (Plaid Link abandonment) | Yes — Plaid docs for 95% bank coverage; [unknown] for completion rate | Acceptable. |
| Gap 5 (personal ACH) | Marked [unknown] with search terms | Acceptable — same inherent difficulty as m12-procurement-network Gap 4. |
| Gap 6 (invoice/PO/wire) | Marked [unknown] with search terms | The [best guess: 30–50%] for invoice/PO share is plausible for B2B but unsourced. |

## Completeness check

- All gaps have behavior classification: **PASS**
- `false_positive_qualitative` updated with cross-references: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

- **FLAG (minor):** Gap 6's 30–50% estimate for invoice/PO share is a significant claim (it means the check has no signal for the largest payment path) but rests entirely on a [best guess]. A citation to any B2B payment-method survey would strengthen this.
- **FLAG (minor):** Gap 1's "30–50% of total card-paid orders" estimate conflates the provider's card-paid order mix with the global market share. A US-based provider may have a more US-heavy customer mix than the global revenue split suggests.

## Verdict: PASS with minor flags
