# Coverage research: BIN classification stack (binlist.net + BinDB + NeutrinoAPI)

## Coverage gaps

### Gap 1: Corporate virtual cards flagged as prepaid (Brex, Ramp, Airbase, Stripe Issuing)

- **Category:** Legitimate biotech companies and research institutions using corporate virtual cards from fintech providers (Brex, Ramp, Airbase, Mercury, Stripe Issuing) that BIN tables classify as "prepaid" because they are funded from a balance rather than a revolving credit line.
- **Estimated size:** By 2024, 70% of US corporations had adopted virtual cards, up from 55% in 2022 ([source](https://coinlaw.io/virtual-credit-card-statistics/)). The virtual cards market was ~$39.6 billion in 2025, growing at 18% CAGR ([source](https://www.grandviewresearch.com/industry-analysis/virtual-cards-market-report)). [best guess: 20–40% of biotech startups (particularly venture-backed companies on Brex or Ramp) use corporate virtual cards for procurement. Among synthesis orders from small-to-mid biotech, this may represent 10–20% of payment methods. All of these trip `bin_prepaid`].
- **Behavior of the check on this category:** false-positive (`bin_prepaid` flag fires on legitimate corporate payment instruments)
- **Reasoning:** Corporate virtual card programs are increasingly standard for biotech procurement. Brex, Ramp, and Stripe Issuing cards are issued on BIN ranges that BIN tables flag as prepaid/virtual. The implementation's reviewer playbook (step 2) correctly notes this but it generates significant reviewer workload.

### Gap 2: Non-US BIN coverage gaps

- **Category:** Payment cards issued by non-US banks, particularly in emerging markets (India, Brazil, Southeast Asia, Africa), where BIN tables have sparser coverage and higher `bin_unknown` rates.
- **Estimated size:** BinDB advertises global coverage but acknowledges the data is "very accurate" but "shouldn't be expected to be perfect" ([source](https://www.bindb.com/)). [best guess: non-US BIN coverage is 10–30% thinner than US coverage, particularly for domestic-network cards (RuPay in India, Elo in Brazil, UnionPay in China). For international synthesis customers paying with locally issued cards, the `bin_unknown` rate may be 5–15% vs. ~1–2% for US cards].
- **Behavior of the check on this category:** no-signal (`bin_unknown` flag triggers manual review for cards the BIN table simply doesn't know)
- **Reasoning:** International customers paying with domestic-network or regional-bank cards are more likely to hit BIN table gaps. The manual escalation path exists but adds friction for legitimate international customers.

### Gap 3: 6-digit vs 8-digit BIN granularity mismatch

- **Category:** Cards issued after the April 2022 Visa/Mastercard 8-digit BIN expansion where legacy 6-digit lookups may misclassify within an issuer's product mix (e.g., an issuer's 8-digit BIN range 12345600–12345650 is credit, 12345651–12345699 is prepaid, but a 6-digit lookup on 123456 returns "prepaid" for all).
- **Estimated size:** Since April 2022, Visa and Mastercard only assign 8-digit BINs for new requests ([source](https://www.threedsecurempi.com/blog/visa-mastercard-mandate-impacts-of-the-8-digit-bins-extension/)). [best guess: the affected population grows each year as new BIN ranges are issued in 8-digit format only. Currently a small fraction (~5–10%) of lookups may be misclassified due to 6-digit granularity, but this will worsen over time if the BIN lookup infrastructure is not upgraded to 8-digit].
- **Behavior of the check on this category:** false-positive or false-negative (misclassification in either direction)
- **Reasoning:** The implementation mentions this but does not specify whether BinDB and NeutrinoAPI support 8-digit lookups. binlist.net is stale post-2023 and almost certainly does not. If the stack is queried with only 6 digits, the expanding pool of 8-digit-only BIN ranges will produce increasing misclassification over time.

### Gap 4: Gift card classification available only from BinDB

- **Category:** The measure specifically targets gift cards, but the `gift` flag (distinct from `prepaid`) is available only from BinDB. NeutrinoAPI returns only `is-prepaid`, and binlist.net returns only `prepaid` (boolean). If BinDB is unavailable or the BIN is not in BinDB's database, the check cannot distinguish gift cards from other prepaid types.
- **Estimated size:** [best guess: BinDB claims to identify 12,000+ prepaid/virtual/gift card products ([source](https://www.bindb.com/identify-prepaid-cards)). The total number of issued prepaid BIN ranges globally is not publicly available. If BinDB covers 80–90% of prepaid BINs but only 60–70% have granular gift/reloadable/virtual classification, then 10–30% of prepaid cards that are actually gift cards may not be specifically classified as such].
- **Behavior of the check on this category:** weak-signal (check falls back to the broader `bin_prepaid` flag, which is over-inclusive and captures corporate prepaid programs)
- **Reasoning:** The implementation correctly identifies BinDB as the "load-bearing source" for gift card detection. This single-vendor dependency means the measure's core function (gift card blocking) degrades to generic prepaid blocking if BinDB is down, unsubscribed, or has a coverage gap for a specific BIN.

### Gap 5: Attacker use of non-prepaid payment methods to bypass the check entirely

- **Category:** This is a structural coverage gap: the check only examines the BIN. An attacker who uses a standard credit card (not prepaid, not gift) bypasses this check entirely. The measure targets gift/prepaid cards, but the attacker stories note that some synthesis purchases are funded via standard bank accounts or credit cards obtained through identity fraud or straw purchasers.
- **Estimated size:** [best guess: per the implementation's own note, "no attacker story in the corpus actually uses a gift card BIN against the synthesis provider." The check's true-positive rate may be very low because sophisticated attackers avoid the payment methods this check screens for].
- **Behavior of the check on this category:** no-signal (standard credit/debit cards pass the check regardless of the cardholder's intent)
- **Reasoning:** The BIN check is a narrow gate that blocks one specific payment method. Its coverage is limited to the subset of attackers who choose to use prepaid/gift cards — which, based on the attacker corpus, may be none.

## Refined false-positive qualitative

1. **Corporate virtual cards** (Gap 1) — `bin_prepaid` fires on Brex/Ramp/Airbase/Stripe Issuing cards used by 20–40% of biotech startups. This is the highest-volume false positive and generates the most reviewer workload.
2. **Non-US domestic cards** (Gap 2) — `bin_unknown` fires more frequently for international customers, adding friction to a legitimate customer segment.
3. **BIN granularity drift** (Gap 3) — Misclassification from 6-digit lookups on 8-digit-only BIN ranges will worsen over time without infrastructure upgrades.
4. **The implementation's own note** that "the false-positive vs true-positive picture is dominated by the FP side" is the most important finding: this check has very few true positives (no attacker stories use gift cards against synthesis providers) and many false positives (corporate virtual cards).

## Notes for stage 7 synthesis

- **The cost-benefit of this check is poor.** The implementation itself notes that no attacker story uses a gift card BIN, making the true-positive rate near zero while the false-positive rate (corporate virtual cards) is significant.
- If BinDB is not subscribed, the check degrades from "gift card detection" to "generic prepaid detection," which is much broader and much noisier.
- The 8-digit BIN transition is a ticking clock: accuracy will degrade unless the stack is upgraded. This is a maintenance cost that should be surfaced.
- Stage 7 should consider whether this idea provides sufficient marginal value over the PSP's built-in `card.funding` field (see sibling idea m10-stripe-funding), which already returns `prepaid` vs `credit` vs `debit` at no additional cost.
