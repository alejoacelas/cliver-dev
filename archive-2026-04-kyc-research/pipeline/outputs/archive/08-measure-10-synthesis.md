# Measure 10 — payment-bin-giftcard: Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (which) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| **m10-binlist-stack** | binlist.net (stale), BinDB (commercial), NeutrinoAPI | $0.005–$0.05/check | ~5 min for `bin_prepaid` adjudication (corporate virtual card cases); near-zero for `bin_gift` (auto-deny) | 0 in current corpus | Corporate virtual cards (Brex/Ramp/Airbase) classified as prepaid — est. 20–40% of biotech startups; non-US BIN coverage 5–15% `bin_unknown` rate | Trivial: any attacker using a standard credit/debit card bypasses entirely; no attacker story uses gift cards |
| **m10-stripe-funding** | Stripe `card.funding` / Adyen `fundingSource` (PSP-native) | $0.02–$0.07/tx (Stripe Radar) | ~5 min for `psp_funding_prepaid` corporate-prepaid exceptions; near-zero for `psp_funding_unknown` triage | 0 primary; 2 secondary (inbox-compromise prepaid virtual card, foreign-institution prepaid debit — both tertiary sub-options) | International cards returning `unknown` — est. 4.5–13.5% of transactions; issuer misreporting (prepaid as credit/debit) — low single-digit % | Same structural bypass: standard credit/debit card avoids the check |
| **m10-prepaid-issuer-denylist** | Internal BIN denylist curated from BinDB/NeutrinoAPI; PSP enforcement | ~$0/check runtime; $1K–$10K/yr subscription | ~10 min for hard-block exception adjudication; near-zero volume expected | 0 in current corpus | Sponsor-bank ambiguity (Sutton Bank has 140+ programs); government procurement cards; international fintech cards (Revolut/Wise); non-card payments (20–40% of institutional orders) | Same structural bypass; additionally, hard-block design amplifies every false positive into a rejected payment |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

One coverage gap is shared across all three ideas and is inherent to the measure itself:

1. **No attacker story uses gift-card or prepaid payment at the synthesis provider.** The attacker corpus confirms that every modeled branch pays with a standard credit/debit card, LLC business bank account, or inherited institutional PO/P-card. The measure screens for a payment method that sophisticated attackers do not use. This is not a gap that bundling can close — it is a finding about the measure's relevance to the current threat model.

2. **Corporate virtual cards / fintech prepaid.** All three ideas flag or block corporate virtual cards (Brex, Ramp, Airbase, Stripe Issuing) that are classified as `prepaid` in BIN tables and PSP metadata. An estimated 20–40% of biotech startups use these for procurement. This is a structural false-positive source affecting the entire measure.

3. **Non-US BIN coverage.** All three ideas have degraded signal for non-US-issued cards: binlist-stack has sparser data, stripe-funding returns `unknown` more frequently, and the prepaid-issuer-denylist is US-centric. International customers (est. 30–50% of market) receive weaker protection across the board.

### Complementary gaps

| Gap | Ideas where it is a gap | Ideas that close it |
|---|---|---|
| Gift-card-specific classification | binlist-stack (only BinDB has separate gift flag), stripe-funding (no gift/prepaid distinction) | prepaid-issuer-denylist (catches specific known gift-card BINs if curated) |
| PSP `unknown` funding type for non-US cards | stripe-funding (4.5–13.5% unknown rate) | binlist-stack (BIN lookup may return classification even when PSP returns unknown) |
| Issuer misreporting (prepaid as credit/debit) | stripe-funding (depends on issuer accuracy) | binlist-stack and prepaid-issuer-denylist (BIN-table classification independent of issuer reporting) |

### Net coverage estimate

If a provider implemented all three ideas, the customer categories still in a coverage gap would be: (a) the entire attacker population, since no modeled attacker uses gift/prepaid payment; (b) corporate virtual-card users who face false-positive friction; (c) non-US cardholders with thin BIN data. The measure's net effect against the current threat model is **near-zero** true positive detection. Against a hypothetical low-sophistication opportunistic attacker using retail gift cards, the combined coverage would be strong (multiple independent detection layers). Qualitative band: **few** real attackers caught; **some** legitimate customers experience friction.

## 3. Bypass cross-cut

### Universally uncovered bypasses

One bypass method is universal and trivial:

1. **Use a standard credit or debit card.** Every idea in the M10 suite screens for prepaid/gift-card BINs or funding types. Any attacker who pays with a standard consumer or commercial card bypasses all three checks. The attacker corpus confirms this is the universal payment method across all 19 branches.

### Bypass methods caught by at least one idea

| Bypass | Caught by | Not caught by |
|---|---|---|
| Gift-card BIN | binlist-stack (`bin_gift` via BinDB), prepaid-issuer-denylist (if BIN curated) | stripe-funding (no gift-specific flag) |
| Generic prepaid BIN | All three (via different mechanisms) | — |
| Prepaid card with issuer mis-reporting as credit | binlist-stack, prepaid-issuer-denylist (BIN-table-based, independent of issuer) | stripe-funding (relies on issuer-reported `funding` field) |

### Attacker stories where every idea fails

All 19 attacker stories in the corpus bypass M10 trivially because none uses gift-card or prepaid payment at the synthesis provider. There are no branch slugs to list — the entire corpus is outside this measure's detection surface.

## 4. Bundling recommendations

### Recommended minimal implementation: stripe-funding only

The PSP-native `card.funding` field (Stripe or Adyen) provides the highest signal-to-effort ratio:
- **$0 incremental cost** beyond existing PSP fees (or $0.02–$0.07/tx with Radar for Fraud Teams).
- **30-minute setup** (one Radar rule).
- **Zero data-curation burden** — the funding type comes from the card network via the PSP.
- Catches the same prepaid population as the other two ideas but with no denylist maintenance.

This is the only M10 idea whose cost-benefit holds given the near-zero true-positive rate. It provides a structural floor: if a customer does attempt to pay with a prepaid card, the PSP catches it automatically.

### Not recommended: binlist-stack as an independent implementation

If the provider already uses Stripe, the binlist-stack's incremental value over `card.funding` is limited to BinDB's gift-card-specific classification — a single-vendor-dependent distinction. The binlist.net component is stale (post-August 2023) and should be retired. NeutrinoAPI adds a `is-prepaid` boolean that Stripe already provides natively. Unless the provider does not use Stripe/Adyen, the three-API stack is redundant.

### Not recommended: prepaid-issuer-denylist as a hard block

The hard-block design amplifies every false positive into a rejected payment. Given:
- Near-zero true-positive rate (no attacker uses prepaid/gift-card payment);
- Severe false-positive risk (government procurement cards, Cash App debit, Ramp corporate, Revolut/Wise international);
- Sponsor-bank ambiguity (Sutton Bank: 140+ programs, BIN-to-program mapping not publicly available);

...the hard-block denylist introduces more customer-experience damage than security value. If deployed at all, it should use reviewer adjudication (matching the binlist-stack approach), not hard blocking.

### Residual uncovered risk

The measure's fundamental limitation is that it screens for a payment method no modeled attacker uses. The residual risk is not "gift-card payments slipping through" — it is that the measure provides no friction against the actual attacker population. This is a finding for policymakers: M10 is a defense-in-depth control against unsophisticated, unmodeled attackers, not a primary barrier against the threat model.
