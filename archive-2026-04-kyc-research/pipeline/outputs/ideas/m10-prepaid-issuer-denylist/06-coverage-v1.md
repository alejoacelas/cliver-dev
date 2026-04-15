# Coverage research: Prepaid issuer / virtual single-use BIN denylist

## Coverage gaps

### Gap 1: Legitimate corporate prepaid programs (government and institutional procurement cards)

- **Category:** US federal and state government agencies, universities, and research institutions that issue prepaid procurement cards on BIN ranges from Bancorp, Pathward, or other denylisted sponsor banks. The Government Purchase Card (GPC) program alone has ~3 million active cards across >350 agencies, spending ~$30 billion annually ([source](https://www.acquisition.gov/afars/chapter-1-government-purchase-card-program)).
- **Estimated size:** [best guess: among synthesis customers from government and academic institutions, 5–15% may pay with a procurement card issued on a BIN range from a denylisted sponsor bank. Government purchase cards are widely used for micro-purchases (< $10,000) at federal labs and universities, and some are issued through Bancorp or Pathward-sponsored programs]. The total government card user base of ~3 million cards includes many that could be used for synthesis purchases.
- **Behavior of the check on this category:** false-positive (`prepaid_issuer_denylist_hit` fires; hard block on a legitimate institutional payment)
- **Reasoning:** The denylist targets consumer prepaid programs but the same sponsor banks (Bancorp, Pathward) also issue institutional procurement cards. If the denylist is scoped at the issuer level rather than the BIN-range level, it will catch institutional cardholders.

### Gap 2: Sponsor-bank ambiguity (Sutton Bank's 140+ programs)

- **Category:** Cardholders on legitimate non-prepaid fintech programs that share a BIN sponsor bank with denylisted programs. Sutton Bank alone operates >140 active card programs ([source](https://www.suttonpayments.com/)) including Cash App debit, Robinhood debit, Ramp corporate, and Monzo.
- **Estimated size:** Sutton Bank's programs include Cash App (over 50 million monthly active users) and Ramp (used by thousands of companies). [best guess: if the denylist is scoped to "Sutton Bank" rather than specific BIN ranges, it would block all Cash App debit card users and Ramp corporate card users — a massive false-positive population]. The implementation acknowledges this: "the denylist must be at the program/BIN-range level, not the issuer level."
- **Behavior of the check on this category:** false-positive (hard block on legitimate consumer and corporate cards)
- **Reasoning:** BIN sponsorship means a single bank issues BINs for both prepaid and non-prepaid programs. The implementation correctly flags this but the mitigation (BIN-range-level scoping) requires obtaining the exact BIN-to-program mapping, which is [unknown — searched for: "Sutton Bank BIN range mapping by program", "BIN to fintech program mapping database"]. Without this mapping, the denylist is either too broad (issuer-level, catches everything) or too narrow (only explicitly known prepaid BINs, misses new programs).

### Gap 3: International prepaid / fintech cards (Revolut, Wise, N26)

- **Category:** International researchers and customers using Revolut, Wise, N26, or other fintech-issued cards that are classified as prepaid by the card networks. These cards are increasingly the default banking product for internationally mobile researchers, graduate students, and early-career scientists.
- **Estimated size:** Revolut has 70+ million global customers ([source](https://erikblair.medium.com/the-only-two-cards-you-need-to-bank-globally-how-wise-and-revolut-became-my-financial-lifelines-b1b4f77cdede)). Wise is used by 16+ million people. [best guess: among international synthesis customers (30–50% of the market), 10–20% may use a Revolut, Wise, or similar fintech card as their primary payment method. If these BINs are on the denylist, the false-positive impact on international customers is severe].
- **Behavior of the check on this category:** false-positive (`prepaid_issuer_denylist_hit` if the fintech BIN is denylisted)
- **Reasoning:** The implementation notes this overlap with sibling idea m12-fintech-denylist. If Revolut and Wise BINs are added to the prepaid denylist, a large swath of legitimate international customers is hard-blocked. If they are excluded, the denylist has a coverage gap for attackers using these cards.

### Gap 4: New prepaid programs not yet on the denylist (curation lag)

- **Category:** Newly launched prepaid card programs, new fintech issuers, or existing issuers that obtain new BIN ranges that are not yet reflected in the denylist.
- **Estimated size:** [best guess: BIN issuance is accelerating due to fintech growth. The 8-digit BIN expansion means new ranges are assigned continuously. A quarterly refresh cycle (per the implementation) means up to 3 months of lag for new programs. During this window, an attacker could use a newly issued prepaid BIN that the denylist does not yet cover].
- **Behavior of the check on this category:** false-negative (attacker slips through)
- **Reasoning:** The denylist is a curated static list. It is structurally behind the curve of BIN issuance. The PSP's own `card.funding` field (sibling idea m10-stripe-funding) may catch some of these because the PSP's classification is real-time, but the denylist itself is stale.

### Gap 5: Non-card payment methods bypass the check entirely

- **Category:** Customers who pay via ACH, wire transfer, institutional purchase order, or cryptocurrency — none of which have a BIN.
- **Estimated size:** [best guess: 20–40% of institutional synthesis orders are paid via purchase order or wire, not card. The check is N/A for these orders. Attacker implication: an attacker who can obtain access to a wire transfer or ACH mechanism bypasses this check entirely].
- **Behavior of the check on this category:** no-signal (check is not triggered)
- **Reasoning:** The check only operates on card payments. This is a structural scope limitation, not a flaw — but it means the check covers only the card-payment surface.

## Refined false-positive qualitative

1. **Sponsor-bank ambiguity** (Gap 2) — This is the single most dangerous implementation risk. If the denylist is not precisely scoped to BIN-range (not issuer), it blocks Cash App debit (50M+ users), Ramp corporate cards (biotech procurement), and other legitimate Sutton Bank programs. The implementation warns about this but the BIN-to-program mapping required for proper scoping is not publicly available.
2. **Government procurement cards** (Gap 1) — Hard-blocking a federal lab's purchase card is a severe customer-experience failure and potentially a regulatory/contractual issue.
3. **International fintech cards** (Gap 3) — Hard-blocking Revolut/Wise users alienates a large international customer segment. The tension between fraud prevention and customer access is acute here.
4. **The hard-block design amplifies all FPs** — Unlike the BIN-stack idea (which sends prepaid to reviewer adjudication), this idea hard-blocks at the PSP level before authorization. Every false positive is a rejected payment, not a review queue item. The customer experience impact is much higher.

## Notes for stage 7 synthesis

- **The hard-block design is the key risk.** The binlist-stack idea (m10-binlist-stack) sends prepaid flags to reviewer adjudication. This idea hard-blocks at the PSP. The FP cost of a hard block is much higher than a review queue flag. Stage 7 should assess whether hard-blocking (vs. reviewer adjudication) is justified given the near-zero true-positive rate noted in the binlist-stack coverage research.
- **Sponsor-bank ambiguity is the implementation's Achilles heel.** Without a precise, maintained BIN-to-program mapping (which is vendor-gated and not publicly available), the denylist is either over-broad or under-inclusive. This is not a solvable problem with public data alone.
- **The check overlaps heavily with m10-binlist-stack and m10-stripe-funding.** If those checks already flag prepaid cards for reviewer adjudication, the marginal value of this hard-block denylist is questionable. The denylist's unique contribution is hard-blocking virtual single-use cards (Privacy.com type), but the Privacy.com issuing bank mapping is itself unknown.
- **International customer impact should be a design input.** If the synthesis provider serves a global market, hard-blocking Revolut/Wise BINs is a market-access decision, not just a fraud decision.
