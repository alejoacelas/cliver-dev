# Coverage research: IGSC shared customer list + member CRM rollup

## Coverage gaps

### Gap 1: Net-new customers with no prior history (dominant case)
- **Category:** First-time customers who have never placed an order with this provider or been flagged by any IGSC member. The check returns null — no IGSC alert, no internal CRM history.
- **Estimated size:** [best guess: this is the majority case. For any given provider, a new customer has no internal history by definition. The IGSC sharing channel is described as "rarely used" by multiple secondary sources ([Crawford/RAND, 2024](https://www.rand.org/content/dam/rand/pubs/research_reports/RRA3300/RRA3329-1/RAND_RRA3329-1.pdf); [PMC Screening State of Play, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319849/)). Given that ~5% of orders are flagged in sequence screening ([PMC Practical Questions, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11447131/)) and only a fraction of those result in customer-level alerts shared with other IGSC members, the probability that a new customer has an active IGSC alert is very low — likely <0.1% of new customers. Thus, >99% of new customers receive no signal from this check.]
- **Behavior of the check on this category:** no-signal — check returns null.
- **Reasoning:** The implementation explicitly notes: "new customer, no IGSC alert, no internal history → check returns null and provides no signal at all (this is the dominant case for net-new customers)."

### Gap 2: Customers ordering from non-IGSC-member providers
- **Category:** Customers whose prior flagged orders were with synthesis providers that are not IGSC members. IGSC represents ~80% of gene synthesis capacity worldwide ([IGSC website](https://genesynthesisconsortium.org/); [Bulletin of the Atomic Scientists](https://thebulletin.org/biography/international-gene-synthesis-consortium-igsc/)), leaving ~20% of capacity outside the consortium. Flags raised at non-member providers never enter the IGSC sharing channel.
- **Estimated size:** ~20% of global gene synthesis capacity is outside IGSC membership. The fraction of *flagged* customers who have ordered exclusively from non-IGSC providers is [unknown — searched for: "non-IGSC gene synthesis providers market share", "gene synthesis providers not members IGSC"]. [best guess: 10–20% of synthesis customers may have ordered from at least one non-IGSC provider at some point; those orders' screening outcomes are invisible to the IGSC channel.]
- **Behavior of the check on this category:** no-signal — any flags from non-IGSC providers are not shared.
- **Reasoning:** The IGSC channel only covers IGSC-member-to-IGSC-member sharing. Non-member providers (smaller companies, newer entrants, some international providers) are outside the network.

### Gap 3: Channel under-utilization (alerts not filed even when warranted)
- **Category:** Customers who were flagged by another IGSC member but the flag was never shared through the IGSC channel due to operational friction, legal caution (antitrust/GDPR), or lack of a structured mechanism.
- **Estimated size:** The channel is "rarely used" ([RAND 2024](https://www.rand.org/content/dam/rand/pubs/research_reports/RRA3300/RRA3329-1/RAND_RRA3329-1.pdf); [PMC Screening State of Play, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319849/)). [best guess: the implementation describes the mechanism as likely "an ad-hoc channel — email list, IGSC officer relay, or member-to-member phone calls." Given antitrust concerns about sharing customer PII between competitors, and the absence of a structured API or database, it is plausible that the majority of warranted alerts are never filed. If 5% of orders are flagged and some fraction of those should result in cross-member alerts, but the channel is rarely used, the loss rate could be >80% of warranted alerts.]
- **Behavior of the check on this category:** no-signal — flag exists at the originating member but is never transmitted.
- **Reasoning:** This is the central limitation of the idea. The implementation and multiple secondary sources confirm that the channel's value is constrained by its operational reality, not its design intent.

### Gap 4: Identity drift defeating cross-member matching
- **Category:** Customers who were flagged under one identity (name, email, organization) at one IGSC member and order from another member under a different identity. Fuzzy matching may not catch the connection.
- **Estimated size:** [unknown — searched for: "identity drift evasion screening gene synthesis", "customer name change cross-provider matching"]. [best guess: an attacker deliberately using different identities across providers is the exact evasion the check is designed to catch but most vulnerable to. The matching depends on whatever fields the originating member shared — if only narrative facts and a name, a different LLC or email defeats the match. Perhaps 30–50% of deliberate cross-vendor-shopping attackers would use different surface identities.]
- **Behavior of the check on this category:** no-signal — the match fails because the identity fields do not align.
- **Reasoning:** The implementation identifies fuzzy-match failure as a known limitation.

### Gap 5: Antitrust and GDPR constraints limiting shared data
- **Category:** All customers covered by jurisdictions with strong data-protection or competition laws (EU/EEA under GDPR, US states with consumer-privacy laws). The originating IGSC member may share only narrative facts and no PII, making the alert insufficient for a receiving member to identify a match.
- **Estimated size:** EU customers represent a significant share of the synthesis market (Europe is a major region per [GM Insights, 2025](https://www.gminsights.com/industry-analysis/gene-synthesis-market)). US customers are also affected by state biometric/privacy laws. [best guess: 40–60% of global synthesis customers are in jurisdictions where data-sharing between competitors faces legal friction.]
- **Behavior of the check on this category:** weak-signal — alerts may be filed but with redacted PII, reducing matchability.
- **Reasoning:** The implementation cites antitrust and GDPR as "the central reason the channel is 'rarely used'" per RAND 2024. This is both a cause of Gap 3 (channel under-utilization) and a separate gap affecting the quality of alerts that are shared.

### Gap 6: Internal CRM staleness and fragmentation
- **Category:** Returning customers whose internal CRM record is tied to a stale email, organization name, or contact that no longer matches the new order's surface fields. Also, customers at providers with fragmented CRM systems (e.g., separate systems for gene synthesis vs. oligo synthesis).
- **Estimated size:** [unknown — searched for: "CRM data staleness rate enterprise"]. [best guess: 10–20% of customer records in any CRM become stale within 2 years due to personnel turnover, email changes, and organizational restructuring. For academic customers specifically, turnover (postdocs leaving, PIs moving institutions) is even higher.]
- **Behavior of the check on this category:** weak-signal — the CRM lookup fails to match the returning customer to their prior record, so the prior-history check returns null even though a relevant history exists.
- **Reasoning:** The implementation identifies CRM staleness as a failure mode but does not size it.

## Refined false-positive qualitative

1. **Common-name collisions** (stage 4) — remains. Researchers whose name matches a flagged customer at another institution.
2. **Shared institutions** (stage 4) — remains. A customer at the same university as a previously-flagged researcher.
3. **Name romanization variants** (stage 4) — remains. Foreign-name variants matching across distinct individuals.
4. **Stale yellow flags from prior organizational context** (stage 4) — remains. Researchers who legitimately changed employers.
5. **Fuzzy-match false positives from IGSC alerts** — new. If the IGSC alert contains imprecise data, fuzzy matching at the receiving end may flag the wrong person.

## Notes for stage 7 synthesis

- The dominant characteristic of this check is that it provides **almost no signal for most customers most of the time** (Gap 1 + Gap 3). It is a weak supplementary signal, not a load-bearing check.
- The check's value is concentrated in a tiny population: customers who have been flagged by another IGSC member AND whose flag was actually shared AND whose identity matches. This is a very small intersection.
- The internal CRM rollup (the second half of the idea) is more reliable than the IGSC channel because it depends on the provider's own data, not on inter-competitor sharing. The CRM component should be evaluated independently from the IGSC component.
- For stage 8 synthesis: this idea is best understood as a "last resort" supplementary signal, not a primary screening mechanism. Its value increases if the IGSC channel is operationalized more effectively (structured database, legal safe harbor for sharing, standard data format).
