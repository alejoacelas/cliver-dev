# Coverage research: Smarty / Melissa address verification

## Coverage gaps

### Gap 1: International addresses in countries with shallow postal data
- **Category:** Customers in countries where Smarty and Melissa claim coverage but verification depth is limited to city-level or country-level only — predominantly in sub-Saharan Africa, Central Asia, parts of Southeast Asia, and some Pacific island nations. Addresses in these countries return a "verified" result at too coarse a granularity to detect PO boxes or CMRAs.
- **Estimated size:** Both Smarty (~250 countries/territories, [Smarty International](https://www.smarty.com/products/international-address-verification)) and Melissa (~240+ countries, [Melissa GAV on G2](https://www.g2.com/products/melissa-global-address-verification/reviews)) claim near-universal country coverage. However, verification quality varies dramatically. [best guess: full street-level + PO box/CMRA detection is available for ~30-40 countries (OECD + major Asian economies). The remaining ~200 countries/territories have city-level or weaker verification, which cannot distinguish a PO box from a street address.] [unknown — searched for: "Smarty international address verification countries with full DPV", "Melissa GAV street level verification country list"]
- **Behavior of the check on this category:** no-signal (for PO box / CMRA detection)
- **Reasoning:** The check returns a "verified" result but the `dpv_cmra` and PO-box type fields are either absent or always N for these countries. A customer using a PO box in Lagos or Phnom Penh would pass uncaught. The 04-implementation acknowledges: "data depth varies; some African and Central Asian countries return only city-level matches."

### Gap 2: Legitimate small biotech and solo researchers using CMRA addresses
- **Category:** Legitimate early-stage biotech companies and independent researchers who use a UPS Store, Mailboxes Etc., or other CMRA as their official business address because they lack dedicated office space.
- **Estimated size:** There are ~15,000 CMRAs in the US with ~1.6 million registered customers as of 2025 ([USPS OIG: Management of CMRAs](https://www.uspsoig.gov/reports/audit-reports/management-commercial-mail-receiving-agencies)). [unknown — searched for: "percentage of small businesses using CMRA UPS store as business address", "virtual mailbox adoption rate small biotech"]. [best guess: 2-5% of legitimate commercial synthesis customers (early-stage companies operating from incubators or home offices) use a CMRA address. This is the population the measure is specifically designed to flag, creating an inherent tension between the measure's intent and the reality that some legitimate customers use CMRAs.]
- **Behavior of the check on this category:** false-positive (by design)
- **Reasoning:** `smarty_cmra` or `melissa_cmra` fires correctly. This is an intentional flag — the measure treats CMRAs as suspicious. But the FP cost falls on legitimate small biotechs who must provide additional institutional context. The SOP handles this via manual review, but creates friction.

### Gap 3: Recently built addresses not yet in DPV database
- **Category:** US customers at addresses constructed or subdivided within the past ~6 weeks (the USPS DPV update cycle). Both Smarty and Melissa draw on the same underlying USPS DPV data for US addresses.
- **Estimated size:** [best guess: <0.5% of synthesis orders ship to addresses newer than the latest DPV cycle. New construction is concentrated in residential development, not in biotech office/lab space.] This is a small but non-zero population.
- **Behavior of the check on this category:** weak-signal (`dpv_unmatched`)
- **Reasoning:** `dpv_match_code != Y` triggers manual review. The address is legitimate but unverifiable. The SOP routes to human research, which adds delay.

### Gap 4: Cross-border forwarding hubs and freight forwarders
- **Category:** Customers who ship to a freight-forwarding address (e.g., a Miami-based forwarding hub for Latin American customers, or a Hong Kong hub for mainland China). These addresses are real commercial addresses, not CMRAs, and pass DPV/CMRA checks cleanly.
- **Estimated size:** [unknown — searched for: "freight forwarder address percentage of ecommerce orders", "DNA synthesis shipping to freight forwarder"]. [best guess: 1-5% of international synthesis orders may route through a forwarding hub, based on general cross-border ecommerce patterns.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The forwarding hub is a real commercial address. Neither Smarty nor Melissa flags it as a CMRA (it is technically not one — it is a licensed freight forwarder). The check passes the address cleanly, but the actual end recipient and end-use location are obscured. This is a coverage gap shared with m03-usps-rdi-cmra and partially addressed by M06 (export control) ideas.

## Refined false-positive qualitative

1. **Legitimate CMRA users (Gap 2):** `smarty_cmra` / `melissa_cmra` fires by design. Estimated 2-5% of commercial customers. The SOP asks for institutional context; denial is appropriate only when no context is provided. But the FP burden is non-trivial for the fastest-growing customer segment.
2. **New-construction addresses (Gap 3):** `dpv_unmatched` fires. Small population (<0.5%) but causes shipping delays.
3. **International customers in shallow-coverage countries (Gap 1):** No FP — the check simply produces no useful signal. The absence of a flag is misleading (it suggests the address is clean when it is merely unverifiable).

## Notes for stage 7 synthesis

- Smarty/Melissa's primary value is US CMRA detection (high confidence, well-documented). International coverage is nominally broad but practically shallow outside OECD.
- The CMRA flag is by-design a FP generator for legitimate small biotechs. The measure's policy intent (flag CMRAs) creates an inherent tension with the customer experience for the ~2-5% of commercial customers using them. This is a policy tradeoff, not a technical flaw.
- Pair with m03-pobox-regex-sop for defense-in-depth on PO Box formatting. Pair with M06 ideas (freight forwarder detection) to address Gap 4.
- The ~$0.001-0.005/check cost is negligible relative to synthesis order value.
