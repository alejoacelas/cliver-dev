# Coverage research: Stripe / Adyen funding-source

## Coverage gaps

### Gap 1: International customers whose issuers return `unknown` funding type
- **Category:** Researchers (academic or commercial) paying with a card issued by a non-US bank that does not report funding type to the card network, resulting in `funding: unknown` from Stripe/Adyen.
- **Estimated size:** North America holds ~55% of the DNA synthesis market [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799), implying ~45% of revenue is non-US. Among non-US cards, the fraction returning `unknown` is not publicly documented by Stripe or Mastercard. [unknown — searched for: "Stripe card funding type unknown rate international cards percentage", "Visa Mastercard issuer funding type metadata coverage rate non-US issuers"]. Industry practitioners report that `unknown` is common for cards from smaller non-US issuers, particularly in Africa, Southeast Asia, and parts of Latin America. [best guess: 10–30% of non-US card transactions return `unknown`, based on Stripe's inclusion of `unknown` as a first-class enum value and the known thinness of card-scheme metadata outside major markets]. Combined: ~45% international × ~10–30% `unknown` rate ≈ **4.5–13.5% of all card transactions** may return `unknown`.
- **Behavior of the check on this category:** weak-signal (treated as soft flag per the SOP, not a hard block — but generates reviewer load and customer friction)
- **Reasoning:** The check's SOP routes `unknown` to manual review with a request for an alternate payment method. For a legitimate international researcher this is friction, not denial, but at scale this is a significant reviewer burden. The check provides no signal on these customers — it cannot distinguish a legitimate researcher with a non-reporting issuer from an attacker whose card happens to not report.

### Gap 2: Corporate prepaid procurement cardholders
- **Category:** Institutional employees paying with a corporate prepaid card (e.g., Pathward-issued institutional prepaid, some university procurement cards loaded as prepaid instruments, government purchase cards on prepaid rails).
- **Estimated size:** Over 70% of US organizations had a P-card program by 2008 [source](https://en.wikipedia.org/wiki/Purchasing_card). Some subset of institutional procurement cards are technically prepaid-funded (loaded from a line of credit or AP system). [best guess: 2–5% of institutional card transactions at synthesis providers are on cards that report as `prepaid` despite being legitimate procurement instruments — based on the existence of Pathward-issued institutional programs and similar products, but no public data quantifies their share of synthesis-provider payments]. [unknown — searched for: "corporate prepaid procurement cards market share institutional purchasing", "Pathward institutional prepaid card programs percentage"].
- **Behavior of the check on this category:** false-positive (hard block; reviewer must manually adjudicate each case)
- **Reasoning:** The check blocks on `prepaid` and routes to manual review. The reviewer can override after confirming institutional context, but every order from this category requires human intervention. The SOP acknowledges this as the primary false-positive class.

### Gap 3: Underbanked legitimate customers using consumer prepaid cards
- **Category:** Graduate students, early-career researchers, or individual customers without a credit history who use consumer reloadable prepaid cards (Netspend, Green Dot, Bluebird) for personal purchases including out-of-pocket research supplies.
- **Estimated size:** 5.9% of all US households used prepaid cards in 2023 [source](https://www.fdic.gov/household-survey). The overlap with DNA-synthesis-purchasing individuals is very small — most synthesis customers are institutional. [best guess: <0.5% of synthesis orders are paid with consumer prepaid cards, based on the niche customer base and the dominance of institutional procurement. But the absolute number could be a few dozen orders per year at a mid-size provider.]
- **Behavior of the check on this category:** false-positive (hard block on `prepaid`)
- **Reasoning:** These customers are rare but legitimate. The hard block denies their order; the SOP asks them to switch to a non-prepaid card, which they may not have. This is a financial-access equity concern, though the affected population is tiny in the synthesis context.

### Gap 4: Non-US payroll-on-prepaid cardholders
- **Category:** Researchers (especially postdocs and students) in countries where payroll is commonly disbursed via prepaid cards — parts of India, Philippines, some African and Latin American countries.
- **Estimated size:** Prepaid card usage for payroll is significant in some developing economies (28% of all prepaid transactions in 2025 were payroll-related globally) [source](https://coinlaw.io/prepaid-card-statistics/). The overlap with DNA synthesis customers is small because most synthesis orders from these regions go through institutional procurement, not personal cards. [best guess: <1% of synthesis orders, but this is the population where prepaid-as-payroll is least distinguishable from prepaid-as-anonymous.]
- **Behavior of the check on this category:** false-positive (hard block on `prepaid`)
- **Reasoning:** A postdoc in India paying from a payroll-loaded prepaid card is indistinguishable from an anonymous prepaid purchase at the funding-type level. The SOP routes to manual review, but the reviewer has no way to confirm the payroll nature of the card without asking the customer.

### Gap 5: Issuer misreporting — prepaid cards reported as `credit` or `debit`
- **Category:** Any customer whose card is substantively prepaid (anonymous, gift, or reloadable) but whose issuer reports it to the network as `credit` or `debit`.
- **Estimated size:** [unknown — searched for: "Stripe card funding type unknown rate international cards percentage", "issuer misreporting card funding type prepaid as credit"]. The implementation doc acknowledges this as a known industry issue but no quantitative data exists. [best guess: a low-single-digit percentage of prepaid cards in circulation are misreported, based on Stripe's own implicit acknowledgement via the `unknown` enum and on anecdotal industry discussion.]
- **Behavior of the check on this category:** no-signal (the check passes the card as legitimate)
- **Reasoning:** This is a coverage gap in the detection direction — the check fails to catch a truly prepaid card. It is the mirror of the false-positive gaps above. Mitigation: pairing with m10-prepaid-issuer-denylist (BIN-list approach) for defense in depth.

## Refined false-positive qualitative

1. **Corporate prepaid procurement cardholders** (Gap 2) — the dominant false-positive class. Every order from this category triggers a hard block and manual review. Mitigation: exception list keyed on (customer, card BIN) after first successful review.
2. **Non-US researchers with `unknown` funding type** (Gap 1) — soft flag, not hard block, but generates friction and reviewer load proportional to the international customer base.
3. **Underbanked consumer-prepaid users** (Gap 3) — rare but hard block; financial-access equity concern.
4. **Non-US payroll-on-prepaid cardholders** (Gap 4) — rare; hard block; geographically concentrated in developing economies.

## Notes for stage 7 synthesis

- The largest coverage gap by volume is Gap 1 (`unknown` funding type on international cards). If the synthesis provider has a significant international customer base (~45% of the market), the reviewer load from `unknown` soft flags could be substantial. The SOP's decision to treat `unknown` as soft (not hard) is load-bearing — switching to hard block would be unworkable.
- Gap 5 (issuer misreporting) is the primary detection gap: truly prepaid cards that evade the check. The implementation doc correctly identifies pairing with m10-prepaid-issuer-denylist as mitigation.
- The false-positive surface is narrow for US institutional customers (mostly Gap 2, manageable with an exception list) but broad for international customers (Gap 1).
