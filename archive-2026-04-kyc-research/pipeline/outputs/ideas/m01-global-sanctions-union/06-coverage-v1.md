# Coverage research: UN/EU/UK/CA/AU sanctions union

## Coverage gaps

### Gap 1: Customers in countries with no independent sanctions program and minimal UN/EU listing activity
- **Category:** Legitimate customers based in developing countries — particularly in sub-Saharan Africa, Southeast Asia, and Latin America — where few individuals or entities are designated on UN/EU/UK/CA/AU lists. For these customers, the union screen almost always returns no match, which is the correct result but provides zero distinguishing signal between a legitimate buyer and a malicious one operating from the same region.
- **Estimated size:** The Asia-Pacific region is the fastest-growing gene synthesis market segment (CAGR >14%), driven by China and India [source](https://www.towardshealthcare.com/insights/gene-synthesis-market-sizing). Most developing countries lack independent sanctions programs and rely on UN/EU supranational lists [source](https://www.castellum.ai/global-sanctions-index/mena-africa). The UN Security Council sanctions programs cover only ~15 countries [source](https://main.un.org/securitycouncil/en/sanctions/information). [best guess: customers in non-sanctioned developing countries — probably 20-30% of the global synthesis customer base by volume — get no signal from this check beyond "not on any list," which is the same outcome a novel bad actor would get].
- **Behavior of the check on this category:** no-signal
- **Reasoning:** Sanctions lists are concentrated on geopolitically prominent threat states (Russia, Iran, DPRK, Syria). A biosecurity threat emerging from a country not subject to comprehensive sanctions would not be caught by this check.

### Gap 2: Actors operating through jurisdictions not covered by the five-list union
- **Category:** Customers or intermediaries based in countries that maintain their own sanctions lists not included in the UN/EU/UK/CA/AU union — e.g., Japan, South Korea, India, Israel, Switzerland (partially), or ECOWAS member states. A customer designated on Japan's sanctions list but not on any of the five union lists would pass this screen.
- **Estimated size:** OpenSanctions aggregates 328 sources [source](https://www.opensanctions.org/datasets/sources/), which covers many of these national lists. If using OpenSanctions as the backend, this gap is largely mitigated. If using direct feeds from only the five named lists, the gap is real. [best guess: the five named lists cover >90% of sanctions designations relevant to biosecurity, since most proliferation-related designations originate from the US/UN/EU. But Japan and South Korea maintain lists specifically targeting DPRK proliferation networks that may contain unique entries].
- **Behavior of the check on this category:** weak-signal (if using only 5 direct feeds) / mitigated (if using OpenSanctions aggregation)
- **Reasoning:** The implementation describes OpenSanctions as the primary backend, which includes far more than 5 lists. The gap is implementation-choice dependent.

### Gap 3: Transliteration and script-variant misses for non-Latin names
- **Category:** Customers whose names, when transliterated from Cyrillic, Arabic, Chinese, or Korean scripts, do not match the specific transliteration variant stored on EU/UK/UN lists. Different lists use different romanization standards (e.g., the UN list may transliterate an Arabic name differently from the UK OFSI list), and the customer's own transliteration may match neither.
- **Estimated size:** [best guess: Russia-related designations alone account for 1,706 of 3,135 OFAC SDN additions in 2024 [source](https://www.cnas.org/publications/reports/sanctions-by-the-numbers-2024-year-in-review); EU/UK lists carry analogous volumes of Cyrillic-origin names. Chinese and Iranian names add further transliteration complexity. The fuzzy matching mitigates this, but each additional transliteration variant increases both the false-negative risk (missed true hit) and the false-positive rate (spurious match on a different person with similar transliteration)].
- **Behavior of the check on this category:** weak-signal (may miss true positives) and false-positive (may flag wrong people)
- **Reasoning:** This is a structural limitation of name-based screening across multiple scripts. The union of five lists actually helps (more transliteration variants increase match surface) but also increases false positives. The implementation's FtM normalization layer attempts to address this but cannot fully resolve it.

### Gap 4: Entity-name collisions for generic commercial customers
- **Category:** Commercial gene synthesis customers — biotech startups, CROs, industrial enzyme companies — whose corporate names are generic enough to collide with sanctioned entities. Common patterns: "[Country] Trading Co.", "[Name] Shipping Ltd.", "[Name] Technologies."
- **Estimated size:** [best guess: a small but non-trivial fraction of commercial customers. Commercial entities account for ~70% of gene synthesis market revenue [source](https://www.futuremarketinsights.com/reports/dna-synthesis-market). Among these, companies with generic names in regions with many sanctioned entities (Russia, Iran, China) are most at risk. Entity screening typically has lower false-positive rates than individual screening because more disambiguating identifiers (registration numbers, addresses) are available].
- **Behavior of the check on this category:** false-positive
- **Reasoning:** Entity screening is harder than individual screening because sanctioned entities often have minimal identifying information beyond a name. A biotech company with a name fragment matching a sanctioned trading company will trigger review.

## Refined false-positive qualitative

1. **Transliteration-variant false positives** (Gap 3): The union of 5+ lists means more alias variants per sanctioned person, increasing the fuzzy-match surface. Customers with Cyrillic, Arabic, or Chinese names face the highest collision rates. This is worse than OFAC-only screening because the union list is larger.
2. **Generic entity-name collisions** (Gap 4): Commercial customers with common corporate name patterns in sanctioned-jurisdiction languages.
3. **Country-of-origin bias**: Customers from Iran, Russia, China, and DPRK — including entirely legitimate researchers — face systematically higher false-positive rates because those countries dominate the sanctions lists. This creates a de facto discriminatory screening burden even when the underlying check is jurisdiction-neutral.
4. **Multi-list pileup**: A customer who fuzzy-matches entries on multiple lists may be treated as higher-confidence when the matches are actually independent false positives on the same common name across different lists.

## Notes for stage 7 synthesis

- This check is largely redundant with m01-ofac-sdn if the provider is US-domiciled and ships primarily to US customers. Its marginal value is for non-US shipments where EU/UK/CA/AU sanctions are the binding legal regime.
- If implemented via OpenSanctions, this check and m01-ofac-sdn can share the same backend (OpenSanctions default collection includes OFAC). The two ideas could merge into a single "comprehensive sanctions screening" implementation with minimal additional cost.
- The IGSC (International Gene Synthesis Consortium) member companies represent ~80% of global synthesis market share [source](https://genesynthesisconsortium.org/). Non-IGSC providers — potentially operating in jurisdictions with weaker sanctions compliance — are outside the scope of this check entirely.
- The no-signal gap for novel actors (Gap 1) is shared with all list-based approaches. This check's unique value is legal compliance for international shipments, not biosecurity threat detection.
