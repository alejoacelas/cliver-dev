# Coverage research: Mercury / Brex / Wise consumer-fintech denylist

## Coverage gaps

### Gap 1: Legitimate small biotechs that bank with Mercury/Brex
- **Category:** Real small biotech startups (1–50 employees) that use Mercury, Brex, Relay, or other neobanks as their primary business banking and pay for synthesis orders with neobank-issued cards. These are indistinguishable from shell companies at the BIN layer.
- **Estimated size:** Mercury has over 300,000 customers as of 2026, growing 50% YoY [source](https://sacra.com/c/mercury/). 40% of new startups have a Mercury account; over 25% have Brex [source](https://www.prnewswire.com/news-releases/new-data-from-kruze-consulting-reveals-significant-changes-in-startup-banking-market-one-year-since-svb-collapse-302101801.html). Among DNA synthesis customers, commercial customers are ~46% of the market [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799). A meaningful fraction of small/startup biotech customers likely use neobank billing. [best guess: 10–25% of commercial DNA synthesis customers at a US provider may pay through a fintech/neobank card, based on the penetration of Mercury/Brex in the startup ecosystem and the high representation of small biotechs among synthesis buyers.]
- **Behavior of the check on this category:** false-positive (soft flag; reviewer asks for procurement-office confirmation)
- **Reasoning:** This is the dominant false-positive class and is explicitly acknowledged in the implementation doc. The check cannot distinguish a real 5-person biotech from a shell company — it can only add friction. The manual-review playbook mitigates this by checking whether the company name on the fintech account matches the claimed institution, but for shell companies the name *will* match (the shell's LLC bank account name matches the LLC name).

### Gap 2: BIN sponsor churn causing denylist staleness
- **Category:** Fintech customers whose cards are issued by a BIN sponsor that recently changed. The denylist maps BIN ranges to fintech brands; when a neobank changes sponsors, the old BINs may be retired and new BINs issued, leaving the denylist stale.
- **Estimated size:** Mercury moved from Evolve Bank & Trust to Choice Financial Group and Column N.A. in 2025 [source](https://www.bankingdive.com/news/mercury-pivot-partner-bank-evolve/742704/). [best guess: major neobanks change BIN sponsors every 1–3 years; the denylist could have a stale-window of weeks to months after each sponsor change. During this window, new cards from the neobank pass undetected.] The implementation doc identifies this as a primary failure mode.
- **Behavior of the check on this category:** no-signal (new BINs not on the denylist pass undetected)
- **Reasoning:** The mitigation is quarterly denylist refresh and monitoring of fintech press releases. But the window of vulnerability is real and recurrent.

### Gap 3: International fintechs with non-US BIN sponsors
- **Category:** Non-US neobank customers (Wise, Revolut, N26 Business) whose cards are issued by non-US BIN sponsors (e.g., Wise uses Community Federal Savings Bank for US cards but different sponsors for EU/UK cards). The denylist, if US-centric, may miss non-US BIN ranges from the same neobank.
- **Estimated size:** ~45% of DNA synthesis revenue is non-US [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799). International fintechs (Wise, Revolut) are popular with non-US startups and individuals. [best guess: 5–10% of non-US commercial customers may use an international fintech card. If the denylist only covers US-issued BINs, these pass undetected.] [unknown — searched for: "Wise Revolut non-US BIN sponsor names" — not searched in this round; the implementation doc flags this as a gap].
- **Behavior of the check on this category:** no-signal (international BINs not on the denylist)
- **Reasoning:** Extending the denylist to cover international BIN sponsors is feasible but increases curation burden. The implementation doc notes that international fintechs use non-US sponsors "whose names may not be in US-centric BIN databases."

### Gap 4: Virtual card numbers (VCNs) from different BIN ranges
- **Category:** Fintech customers using virtual card numbers issued by neobanks from BIN ranges different from the neobank's physical card BINs. Some fintechs issue VCNs from a separate BIN pool.
- **Estimated size:** [unknown — searched for: "neobank virtual card BIN ranges different from physical card"]. [best guess: a minority of fintech card transactions use VCNs with distinct BINs, but the fraction is growing as virtual cards become more common in B2B payments.]
- **Behavior of the check on this category:** no-signal (VCN BINs not on the denylist)
- **Reasoning:** The denylist must cover both physical and virtual BIN ranges for each neobank. This increases curation complexity.

### Gap 5: Corporate P-cards issued by fintech-adjacent sponsor banks
- **Category:** Legitimate institutional customers whose P-card happens to be issued by a bank that also sponsors a neobank (e.g., Evolve Bank & Trust issues cards for both Mercury and legitimate corporate programs; Pathward issues both crypto-debit and institutional prepaid cards). BIN-level matching may produce false positives at the sponsor-bank level if the denylist uses bank-name matching rather than precise BIN-range matching.
- **Estimated size:** [best guess: a small number of institutional P-cards — perhaps 1–3% of P-card transactions — are issued by banks that also sponsor neobanks. The risk depends on whether the denylist matches at the BIN-range level (precise) or the bank-name level (over-broad).]
- **Behavior of the check on this category:** false-positive (institutional P-card flagged because the issuer bank name matches a neobank sponsor)
- **Reasoning:** The implementation doc identifies this. The mitigation is BIN-range-level matching rather than bank-name-level matching, which requires more precise curation.

## Refined false-positive qualitative

1. **Legitimate small biotechs using Mercury/Brex** (Gap 1) — the dominant false-positive class. [best guess: 10–25% of commercial customers.] The check adds friction but cannot distinguish real from shell.
2. **Institutional P-cards from fintech-adjacent sponsors** (Gap 5) — low volume but confusing for reviewers.
3. **International customers whose home-country bank shares a BIN range** — mentioned in the implementation doc; unlikely with 8-digit matching.

## Notes for stage 7 synthesis

- The fundamental tension in this idea: the attacker stories (shell-company, CRO-framing) use the *exact same banking rails* (Mercury, Brex) that legitimate small biotechs use. The check cannot resolve this tension — it can only add friction. Its value is as a soft signal in a composite scoring system, not as a standalone control.
- Denylist staleness (Gap 2) and international coverage (Gap 3) are operational gaps that require ongoing labor. The implementation doc estimates ~$500–$2,000/year in analyst time for curation.
- The false-positive rate on commercial customers (Gap 1) is potentially high (10–25%). This makes the check unsuitable as a hard block; the soft-flag + reviewer model is the right architecture but imposes reviewer cost.
