# Coverage research: Daily delta re-screening

## Coverage gaps

### Gap 1: Customers who were never on any sanctions list and become threats without being designated
- **Category:** A customer onboarded as legitimate who later decides to pursue malicious synthesis but is never designated on any sanctions or enforcement list. Delta re-screening only catches customers who appear on updated lists — it has zero signal for actors who are not (yet) known to any government or enforcement body.
- **Estimated size:** This is the fundamental limitation. OFAC SDN added ~3,135 persons in 2024 and ~2,502 in 2023 [source](https://www.cnas.org/publications/reports/sanctions-by-the-numbers-2024-year-in-review). OpenSanctions aggregates ~75,000+ entities across 328 sources [source](https://www.opensanctions.org/datasets/default/). Against a customer base of potentially thousands of synthesis buyers, the chance that a specific malicious actor happens to get sanctioned between onboarding and ordering is low. The check is valuable only for the intersection of "existing customer" and "newly designated."
- **Behavior of the check on this category:** no-signal
- **Reasoning:** Delta re-screening is purely retrospective — it detects changes in external lists, not changes in customer intent. A lone-actor or small-group threat that never appears in government intelligence will never trigger this check.

### Gap 2: Customers whose identifying information has drifted since onboarding
- **Category:** Repeat customers who changed names (marriage, legal name change), addresses, or institutional affiliations since their initial screening. If the customer record is not updated, the delta match against new list entries may fail because the fuzzy matcher is comparing stale data.
- **Estimated size:** [best guess: name changes affect ~1-2% of any customer population per year based on general demographic rates; address changes are more frequent (~10-15% per year for US adults per Census Bureau data). For a synthesis provider with a multi-year customer relationship, cumulative drift is non-trivial]. The implementation acknowledges this ("keep historical fingerprints") but it remains a coverage gap if the provider's customer DB is not disciplined about retaining historical identifiers.
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** The match quality degrades as customer records age. Historical fingerprinting mitigates but does not eliminate — a completely new alias or transliteration not in the customer file won't match.

### Gap 3: Entities on non-aggregated lists or lists with slow feed integration
- **Category:** Customers designated on sanctions lists or enforcement databases not yet integrated into OpenSanctions or the OFAC SLS feed. Examples: some national police watchlists, export-control denial lists from non-US/EU countries, or newly created sanctions programs that take time to be ingested.
- **Estimated size:** OpenSanctions integrates 328 sources [source](https://www.opensanctions.org/datasets/default/), which is broad but not exhaustive. OFAC SLS covers only US lists. [best guess: most biosecurity-relevant designations would eventually appear on major lists (OFAC, EU, UN), but delays of days to weeks are plausible for non-tier-1 sources. The BIS Entity List, for example, is a key export-control tool that OpenSanctions does integrate, but smaller national lists may lag].
- **Behavior of the check on this category:** weak-signal (delayed detection, not absent)
- **Reasoning:** The delta approach is only as comprehensive as the feed it monitors. Gaps in source coverage create windows where a designated entity is not yet flagged.

### Gap 4: False-positive surge on high-volume designation days
- **Category:** Legitimate customers who share names with entities designated in bulk actions (e.g., Russia-related EOs adding hundreds of entries at once). On high-volume days, the reviewer queue may be overwhelmed, leading to either delayed processing or lowered review quality.
- **Estimated size:** In 2024, there were 8 separate announcements of 100+ SDN additions each, with 1,706 Russia-related designations alone [source](https://www.millerchevalier.com/publication/ofac-year-review-2024). Each bulk designation day could generate dozens of false-positive hits against a customer base with common Russian, Chinese, or Iranian names. [best guess: for a provider with ~1,000 active customers, a bulk designation of 500 entries could produce 5-20 false-positive alerts requiring triage, based on typical ~1-5% fuzzy-match alert rates].
- **Behavior of the check on this category:** false-positive (with operational degradation risk)
- **Reasoning:** The delta re-screen converts a batch problem into an acute workload spike. If the reviewer queue is not staffed for surges, legitimate customers may have orders frozen for days pending review.

## Refined false-positive qualitative

1. **Common-name collisions on delta entries** (same as onboarding screening): every new SDN entry with a common name generates false-positive alerts across all matching customers. The delta framing makes these bursty rather than steady-state.
2. **Identifier drift producing spurious new matches** (Gap 2 inverse): a customer whose data drifted now coincidentally matches a new entry they wouldn't have matched at onboarding.
3. **Surge-day false positives** (Gap 4): bulk designation days create reviewer overload, potentially causing legitimate customers to experience account freezes lasting days.
4. **FtM entity ID instability**: the implementation notes that entity ID changes between OpenSanctions versions can create spurious added/deleted pairs, generating phantom alerts.

Overall false-positive burden is moderate on normal days but spiky on bulk-designation days. The base rate of false positives per delta cycle is much lower than onboarding screening (small M per cycle), but cumulative over a year it can be significant.

## Notes for stage 7 synthesis

- Delta re-screening is a necessary complement to onboarding screening (m01-ofac-sdn, m01-commercial-watchlist) — it closes the "designated after onboarding" gap. But it shares the fundamental limitation of all list-based approaches: zero signal on unknown threats.
- The operational design matters more than the data source: the key differentiator is how the provider handles surges, identifier drift, and feed gaps. These are implementation-quality issues, not data-source issues.
- Marginal cost is near-zero (free data, trivial compute), making this a high-value addition despite limited coverage. The cost is in reviewer time during surges.
- Pairing with m01-commercial-watchlist's ongoing monitoring feature may be partially redundant — World-Check One offers continuous monitoring as a product feature. A provider should choose one approach (vendor monitoring vs. self-built delta re-screen), not both.
