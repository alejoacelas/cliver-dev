# Per-idea synthesis: m10-binlist-stack

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | BIN classification stack (binlist.net + BinDB + NeutrinoAPI) |
| **measure** | M10 — payment-bin-giftcard |
| **attacker_stories_addressed** | None in the current attacker corpus. No attacker story routes synthesis-provider payment through a gift card. The closest instruments are prepaid virtual cards (inbox-compromise Method 5.2, foreign-institution Method 3), which are non-gift-card prepaid products and tertiary sub-options, not load-bearing paths. |
| **summary** | Classify the BIN (first 6–8 digits) of the customer's payment card via three independent BIN-data sources to identify card brand, issuer, country, and the `prepaid` and `gift` flags. Multiple sources stacked because BIN tables vary in coverage and freshness; any one source flagging the card is sufficient for the gift flag. Used at payment intake for SOC orders. |
| **external_dependencies** | binlist.net (free, legacy/stale post-Aug 2023); BinDB (paid license, vendor-gated pricing); NeutrinoAPI BIN Lookup (paid, low per-call cost); payment processor's own BIN metadata (Stripe Radar, Adyen RevenueProtect) as implicit fallback. |
| **endpoint_details** | **binlist.net:** `https://lookup.binlist.net/{bin}` — REST+JSON, no auth, free. Rate limit conflicting reports: 5/hour with burst of 5 (official docs) vs. 10/minute (other sources). Stale post-Aug 2023 (transition to paid IIN List service). Tertiary cross-check only. **BinDB:** REST or PCI Data File license. [vendor-gated — pricing page at bindb.com/pricing, per-tier numbers require sales contact]. Identifies 12,000+ prepaid/virtual/gift cards with reloadable distinction. Monthly data updates. **NeutrinoAPI:** `https://neutrinoapi.net/bin-lookup` — REST+JSON, API key auth. Returns `is-prepaid` boolean. Pricing: [unknown — searched for: "neutrinoapi bin lookup price per call"]; est. $0.0008–$0.005/call. Free trial tier. **ToS:** All three permit production KYC/fraud use. |
| **fields_returned** | **binlist.net:** scheme, type (debit/credit/charge), brand, prepaid (boolean), country, bank (name/url/phone/city). **BinDB:** issuer, scheme, card type, prepaid flag, gift flag, virtual-card flag, reloadable flag, card brand sub-product. Only source with separate gift classification. **NeutrinoAPI:** card-brand, card-type, country, issuer, is-commercial (boolean), is-prepaid (boolean). |
| **marginal_cost_per_check** | binlist.net: $0 (stale). NeutrinoAPI: ~$0.001–$0.005/call [best guess]. BinDB: annual license amortized [vendor-gated]. Combined: ~$0.005–$0.05 per check [best guess, dominated by BinDB]. Setup cost: ~2 engineering days. |
| **manual_review_handoff** | Reviewer receives: BIN (first 8 digits only, never full PAN), card brand, issuer, country, prepaid/gift flags from each source, consensus. Four-case playbook: (1) any source flags gift=true → `bin_gift`, deny payment, request alternative method; (2) prepaid=true but no gift → `bin_prepaid`, reviewer asks if corporate virtual card, allow if identity otherwise solid; (3) all sources return unknown → `bin_unknown`, manual escalation; (4) non-prepaid, non-gift, valid issuer → pass. |
| **flags_thrown** | `bin_gift` — at least one source identifies BIN as gift card. Auto-deny for SOC orders. `bin_prepaid` — prepaid but not gift. Reviewer adjudication. `bin_unknown` — no source has the BIN. Reviewer escalates. |
| **failure_modes_requiring_review** | BIN-table lag (binlist.net stale post-2023; NeutrinoAPI refresh cadence [unknown]). 6-digit vs 8-digit BIN granularity mismatch (Visa/Mastercard moved to 8-digit in April 2022; legacy 6-digit lookups may misclassify). binlist.net rate limits/429s. Conflicting sources (stacking convention: any-flag-wins for gift, majority-wins for prepaid). Gift vs prepaid distinction available only from BinDB — single-vendor dependency. |
| **false_positive_qualitative** | (1) Corporate virtual cards (Brex, Ramp, Airbase, Stripe Issuing, Mercury) — BIN tables classify as prepaid; est. 20–40% of biotech startups use these for procurement. Highest-volume FP. (2) Virtual single-use cards from academic procurement/corporate T&E systems. (3) Foreign-issued debit cards sometimes mis-flagged due to thin non-US issuer data. (4) Non-US BIN coverage is sparser, raising `bin_unknown` rates for legitimate international customers. The implementation itself notes the FP-to-TP picture is "dominated by the FP side." |
| **coverage_gaps** | **Gap 1: Corporate virtual cards** — est. 10–20% of payment methods from small-mid biotech trip `bin_prepaid`. 70% of US corporations adopted virtual cards by 2024. **Gap 2: Non-US BIN coverage** — est. 5–15% `bin_unknown` rate for international customers vs ~1–2% for US. Domestic networks (RuPay, Elo, UnionPay) sparser. **Gap 3: 8-digit BIN transition** — est. 5–10% misclassified now from 6-digit lookups, worsening over time. **Gap 4: Gift classification single-vendor dependency** — only BinDB separates gift from prepaid; without BinDB, check degrades to generic prepaid blocking. Est. 10–30% of prepaid BINs may lack granular gift classification. **Gap 5: Non-prepaid payment methods** — check is structurally blind to attackers using standard credit/debit cards; no attacker story uses gift cards, so sophisticated attackers simply avoid the payment methods this check screens for. |
| **record_left** | BIN (first 8 digits only), responses from each source, consensus classification, action taken, timestamp. Never store full PAN. |
| **bypass_methods_known** | None — no attacker stories mapped to this measure in the current corpus. |
| **bypass_methods_uncovered** | None in the formal sense — but the structural bypass is trivial: any attacker who uses a standard credit/debit card (not prepaid, not gift) bypasses this check entirely. The attacker corpus confirms no branch routes payment through a gift card. |

## Section 2: Narrative

### What this check is and how it works

This check examines the Bank Identification Number (BIN) — the first 6–8 digits of a payment card — to determine whether the card is a gift card or prepaid instrument. When a customer submits payment for a sequence-of-concern (SOC) order, the system queries three BIN-data sources: binlist.net (free but stale post-August 2023), BinDB (commercial license with 12,000+ prepaid/virtual/gift card identifications), and NeutrinoAPI (low-cost per-call API with a `is-prepaid` boolean). The system stacks results: any source flagging "gift" triggers auto-deny; for "prepaid," majority wins. Three flags are produced: `bin_gift` (auto-deny, request alternative payment), `bin_prepaid` (reviewer adjudicates whether it is a corporate virtual card), and `bin_unknown` (BIN not in any table, manual escalation). Only BinDB provides a separate gift-card classification distinct from generic prepaid — making it the load-bearing source for the measure's core function.

### What it catches

In the current attacker corpus, this check catches nothing. The stage 5 hardening walk-through found that no attacker story routes synthesis-provider payment through a gift card. The closest instruments are prepaid virtual cards appearing as tertiary sub-options in two branches, not load-bearing paths. The check's value proposition rests on the assumption that gift-card payment is a plausible attack vector for low-sophistication opportunistic attackers not represented in the current threat model. If the threat model were expanded to include such attackers, the check would block gift-card payments at the BIN level — a technically sound gate.

### What it misses

The structural bypass is trivial: any attacker who uses a standard credit or debit card avoids this check entirely. Since the attacker corpus confirms that no branch uses gift-card payment, the check screens for a payment method that sophisticated attackers do not use. Additionally, the gift-card classification depends on a single vendor (BinDB); without BinDB, the check degrades to generic prepaid detection, which is much broader and captures corporate virtual cards from Brex, Ramp, Airbase, and Stripe Issuing — an estimated 20–40% of biotech startups' payment methods. The 8-digit BIN transition (Visa/Mastercard, April 2022) introduces a worsening misclassification rate for legacy 6-digit lookups, and non-US BIN coverage is sparser (est. 5–15% `bin_unknown` rate for international customers versus ~1–2% for US).

### What it costs

The marginal cost is low: binlist.net is free, NeutrinoAPI is ~$0.001–$0.005/call, and BinDB is an annual license amortized across usage (pricing vendor-gated). Combined per-check cost is estimated at $0.005–$0.05. Setup is approximately 2 engineering days. The more significant cost is the false-positive reviewer burden: corporate virtual cards from fintech providers trip `bin_prepaid` at a non-trivial rate, and each requires reviewer adjudication (asking the customer if the card is a corporate single-use virtual card). Given the near-zero true-positive rate in the current threat model, the cost-benefit ratio is poor.

### Operational realism

The `bin_gift` flag produces the cleanest operational path: auto-deny and request alternative payment. The `bin_prepaid` flag is operationally more complex because many legitimate biotech customers use Brex, Ramp, or Stripe Issuing virtual cards that BIN tables classify as prepaid. The reviewer must ask the customer whether the card is a corporate virtual card, creating friction for real customers. The `bin_unknown` flag requires manual BIN investigation, adding reviewer time for an uninformative signal. The implementation is PCI-aware: only the first 8 digits of the PAN are stored, never the full card number.

### Open questions

The coverage analysis raised the fundamental question of whether this check provides sufficient marginal value over the payment service provider's built-in `card.funding` field (e.g., Stripe's card object returns `funding: "prepaid"` at no additional cost). If the PSP already provides a prepaid flag, the only incremental value of this three-API stack is BinDB's gift-card-specific classification — a single-vendor-dependent distinction. The 8-digit BIN transition is a maintenance concern: accuracy will degrade unless the stack is upgraded. binlist.net is acknowledged as stale post-2023 and should be retired. NeutrinoAPI's data refresh cadence is unknown.

## Section 3: Open issues for human review

- **No hardening findings at all.** No attacker stories were mapped to this measure, so the hardening walk-through had nothing to evaluate.
- **Fundamental cost-benefit question:** The check has a near-zero true-positive rate (no attacker story uses gift-card payment) and a significant false-positive rate (corporate virtual cards from Brex/Ramp/Airbase). Human review should determine whether the check is worth implementing given this imbalance, or whether the PSP's built-in `card.funding` field provides sufficient signal at zero additional cost.
- **`[unknown]` fields:**
  - NeutrinoAPI per-call pricing — searched for 2 queries; est. $0.0008–$0.005/call.
  - NeutrinoAPI data refresh cadence — searched for 1 query, no published frequency.
  - Non-US BIN coverage degradation rate (10–30% thinner) — best guess with no derivation.
- **`[vendor-gated]` items:**
  - BinDB pricing (annual/monthly license) — public pricing page exists but per-tier numbers require sales contact.
- **`[best guess]` fields with weak derivation:**
  - binlist.net rate limit (conflicting reports: 5/hour vs 10/minute) — both are documented but no authoritative resolution.
  - 6-digit BIN misclassification rate (~5–10% currently) — derived from timing of BIN expansion, not empirical measurement.
  - Virtual card adoption among biotech startups (20–40%) — extrapolated from general corporate virtual card adoption (70% by 2024).
- **04C claim check unresolved flags:**
  - UPGRADE-SUGGESTED: Replace Scribd citation for binlist.net transition notice with canonical source.
  - UPGRADE-SUGGESTED: Cite Visa/Mastercard 8-digit BIN expansion to an official product bulletin.
- **Maintenance concern:** binlist.net is stale post-Aug 2023 and should be retired from the stack. The 8-digit BIN transition will degrade lookup accuracy unless the infrastructure is upgraded. Both are ongoing maintenance costs against a near-zero true-positive rate.
