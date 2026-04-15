# Coverage research: OFAC SDN + Consolidated screen

## Coverage gaps

### Gap 1: Non-US persons never designated by OFAC
- **Category:** The vast majority of legitimate (and malicious) customers will not appear on the OFAC SDN or Consolidated lists. OFAC designations are concentrated on specific sanctioned regimes (Russia, Iran, DPRK, Syria, Venezuela, etc.) and individuals linked to those regimes. A novel biosecurity threat actor with no prior connection to a sanctioned program will never appear on OFAC's lists.
- **Estimated size:** The SDN list contains roughly 12,000-15,000 entries [best guess: based on the ~75,000 total OpenSanctions entities across 328 sources, with OFAC being a major but not majority contributor [source](https://www.opensanctions.org/datasets/default/)]. OFAC added ~3,135 persons in 2024 [source](https://www.cnas.org/publications/reports/sanctions-by-the-numbers-2024-year-in-review). Against a global pool of potential synthesis customers numbering in the tens of thousands, the overlap between "people on OFAC lists" and "people ordering DNA synthesis" is extremely small. The check provides no signal for the overwhelming majority of customers.
- **Behavior of the check on this category:** no-signal
- **Reasoning:** OFAC screens are legally required for US persons/companies but have near-zero predictive power for biosecurity-specific threats. Their value is compliance, not security.

### Gap 2: Customers from heavily-sanctioned countries with common names
- **Category:** Legitimate researchers from Iran, Russia, China, or other countries with large numbers of OFAC designations, whose names produce fuzzy-match hits against unrelated SDN entries. These customers face disproportionately high false-positive rates simply because the SDN list contains many entries with names from their linguistic/cultural pool.
- **Estimated size:** In 2024, Russia-related designations accounted for 1,706 of 3,135 new SDN additions; China had 276; Iran had 130 [source](https://www.cnas.org/publications/reports/sanctions-by-the-numbers-2024-year-in-review). Researchers from these countries represent a significant share of synthesis customers — China alone accounts for ~30% of top global academic talent and 61% of most-cited synthetic biology papers [source](https://merics.org/en/report/lab-leader-market-ascender-chinas-rise-biotechnology). [best guess: Chinese, Iranian, and Russian researchers may constitute 25-35% of academic synthesis customers globally, and face false-positive rates perhaps 5-10x higher than researchers from countries with few SDN entries].
- **Behavior of the check on this category:** false-positive
- **Reasoning:** Name-space collisions scale with the number of list entries sharing a cultural name pool. With 1,700+ Russia-related and 276+ China-related SDN entries, the false-positive surface is large for customers from those countries.

### Gap 3: Customers with insufficient identifying information for disambiguation
- **Category:** Customers who provide only a name (no DOB, no nationality, no address) — common for small or first-time gene synthesis orders, especially through online portals. When a fuzzy match fires, the reviewer has no secondary identifiers to confirm or reject the match, forcing a callback that delays the order.
- **Estimated size:** [best guess: many online gene synthesis ordering platforms collect shipping address and institutional affiliation but may not collect DOB or nationality upfront. For individual customers (as opposed to institutional accounts), identifying information may be limited to name + email + shipping address. The fraction of orders with insufficient identifiers for disambiguation is implementation-dependent but likely non-trivial for first-time / small-volume customers].
- **Behavior of the check on this category:** weak-signal (hit fires but cannot be resolved without additional data collection)
- **Reasoning:** OFAC screening works best when the screened record contains DOB, nationality, and address to disambiguate against SDN entries. When these are missing, every fuzzy-match hit becomes an unresolvable alert requiring customer outreach.

### Gap 4: Non-US regulatory exposure for non-US shipments
- **Category:** Customers ordering synthesis from non-US providers or for delivery to non-US destinations. OFAC sanctions are US-specific; a customer designated on EU, UK, or UN lists but not on OFAC would pass this screen. This is a jurisdictional coverage gap, not a data-quality gap.
- **Estimated size:** North America accounts for ~37% of gene synthesis market revenue, meaning ~63% of the market is outside the US [source](https://www.towardshealthcare.com/insights/gene-synthesis-market-sizing). For US-domiciled providers, OFAC compliance is mandatory regardless of destination. But for non-US providers or US providers shipping internationally, OFAC alone is insufficient — pairing with m01-global-sanctions-union is needed.
- **Behavior of the check on this category:** no-signal (for non-OFAC-designated entities in non-US jurisdictions)
- **Reasoning:** OFAC SDN is a US-jurisdictional tool. Its coverage is dictated by US foreign policy priorities, which overlap with but do not fully cover global biosecurity concerns.

## Refined false-positive qualitative

1. **Common-name collisions with SDN entries** (Gap 2): The dominant false-positive source. Disproportionately affects Chinese, Iranian, Russian, and Arabic-name customers. Each hit requires manual review with secondary-identifier comparison.
2. **Weak-alias matches**: OFAC itself flags certain aliases as low-quality ("weak AKAs"). Matches on these should be lower-priority but still generate alerts.
3. **Generic entity names** (from implementation doc): "Global Trading Co." style names colliding with shell-company designations.
4. **Transliteration variants**: Cyrillic-to-Latin and Arabic-to-Latin transliterations produce borderline fuzzy scores that are neither clear hits nor clear misses.
5. **Missing-identifier ambiguity** (Gap 3): When the customer record lacks DOB/nationality, even low-confidence matches cannot be cleared without callback, converting a possible false positive into an operational delay.

The false-positive burden is structurally concentrated on customers from sanctioned-regime countries. This creates a discriminatory screening experience that may deter legitimate researchers from those countries from using providers with rigorous screening.

## Notes for stage 7 synthesis

- OFAC screening is a legal compliance requirement for US entities, not a biosecurity tool. Its inclusion in a biosecurity screening pipeline is table-stakes, not a differentiating signal.
- The marginal biosecurity value beyond legal compliance is near-zero: OFAC catches people the US government has already identified, not novel threats.
- The $0 marginal cost (self-hosted) or ~$0.11/call (OpenSanctions) makes this cheap to implement. The real cost is reviewer time on false positives.
- Pairing OFAC-only screening with m01-global-sanctions-union (via OpenSanctions) is nearly free if both use the same backend. A provider should default to the full OpenSanctions sanctions collection rather than OFAC-only.
- The implementation quality matters more than the data source: fuzzy-match threshold tuning, secondary-identifier collection at onboarding, and reviewer SOP are the levers that determine whether this check is a net positive or a false-positive factory.
