# Coverage research: STR / Wayback co-location SOP

## Coverage gaps

### Gap 1: International addresses (STR data sources are US/EU-centric)
- **Category:** Customers shipping to addresses outside the US, Western Europe, and major tourist markets. Inside Airbnb covers ~165 cities/regions across 12 countries [source](https://insideairbnb.com/). Airbnb manual search works internationally but listing density drops sharply outside tourist destinations. AirDNA covers ~10M listings primarily in US/EU/Australia.
- **Estimated size:** ~45–55% of synthesis orders by count originate outside the US [best guess: derived from gene synthesis market revenue splits — see m04-county-assessor Gap 1]. Of those, perhaps half ship to areas with meaningful Airbnb/VRBO coverage (Western Europe, major Asian cities). The remainder (~20–30% of total orders) ships to addresses where STR data is sparse to nonexistent. [best guess]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The SOP relies on searching Airbnb/VRBO listings and Inside Airbnb CSV data. For addresses in countries with low STR penetration (much of Africa, Central Asia, parts of South America, China), there are essentially no listings to find, making the check vacuous. The Wayback component is URL-based and has no geographic limitation, but without a known listing URL, it provides nothing.

### Gap 2: STR platforms not covered (Booking.com, direct-rental, regional platforms)
- **Category:** Addresses that are active short-term rentals listed on platforms other than Airbnb and VRBO — including Booking.com, Agoda, regional platforms (Ctrip/Trip.com in China, OYO in India), and direct-rental sites with no aggregated search.
- **Estimated size:** Airbnb holds roughly 50–60% of the global STR market; Booking.com, VRBO, and others collectively hold the rest [best guess: based on general short-term rental market share discussions]. In the US, ~1.8 million STR properties exist [source](https://www.rubyhome.com/blog/vacation-rental-stats/); Airbnb has ~1.1–1.3M US listings [best guess from multiple sources estimating 8M globally with ~15% in US]. The gap between total US STRs and Airbnb-only listings is ~0.5–0.7M properties.
- **Behavior of the check on this category:** no-signal (false negative — address is an STR but the SOP doesn't find it)
- **Reasoning:** The SOP only searches Airbnb and VRBO. A malicious actor who uses a Booking.com-only rental as a drop address would evade this check entirely.

### Gap 3: Inside Airbnb geographic coverage (only ~165 cities)
- **Category:** US addresses in cities or rural areas not covered by Inside Airbnb's quarterly scrapes. Inside Airbnb focuses on major cities; most US suburbs, exurbs, and rural areas are not covered.
- **Estimated size:** Inside Airbnb covers ~165 cities/regions globally [source](https://insideairbnb.com/). In the US, it covers major metros (NYC, LA, SF, Boston, Seattle, etc.) but not the ~19,000+ incorporated places in the US. [best guess: Inside Airbnb covers cities representing perhaps 40–50% of US STR listings by count, missing the long tail of suburban and rural STRs entirely.]
- **Behavior of the check on this category:** weak-signal (manual Airbnb.com search still works, but the rigorous CSV cross-check is unavailable)
- **Reasoning:** For cities not in Inside Airbnb, the reviewer falls back to manual Airbnb.com search, which is less systematic and misses delisted properties. The SOP's rigor degrades outside the ~165 covered cities.

### Gap 4: Airbnb lat/lng obfuscation (~150m)
- **Category:** Addresses in dense urban areas where multiple buildings fall within the ~150m obfuscation radius used by both Airbnb's public map pins and Inside Airbnb's CSV data.
- **Estimated size:** In dense neighborhoods (Manhattan, SF, central Boston), a 150m radius can contain 5–20+ residential buildings with hundreds of units. [best guess: this affects perhaps 10–20% of urban STR checks, producing ambiguous results where the reviewer cannot confidently match a listing to the exact address.]
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** The reviewer sees a listing "near" the address but cannot confirm it's at the exact building/unit. This weakens the evidentiary value of a match and creates both false positives (flagging an address because a neighbor has a listing) and false negatives (missing a listing because the obfuscated pin lands on a different block).

### Gap 5: Recently delisted STRs and rapid listing cycling
- **Category:** Addresses where the STR listing was active at the time of the malicious booking/drop but was delisted by the time the screening SOP runs. Includes intentional delisting by a sophisticated attacker.
- **Estimated size:** [unknown — searched for: "Airbnb listing delisting rate per month", "short-term rental listing churn rate"]. [best guess: Airbnb listing churn is substantial — perhaps 10–20% of listings are deactivated in any given quarter. An attacker aware of this SOP could delist the property after the drop.]
- **Behavior of the check on this category:** no-signal (false negative)
- **Reasoning:** The manual search will not find a delisted listing. The Wayback Machine component theoretically catches historical listings, but only if the Wayback Machine happened to archive the specific listing page — which is not guaranteed for low-traffic listings.

## Refined false-positive qualitative

Updated from stage 4:

1. **Long-term Airbnb tenants** (legitimate researchers in relocation): false-positive from `address_wayback_str_history`. Small population but high friction — these are often visiting researchers or founders relocating to a biotech hub.
2. **Multi-unit building neighbors**: false-positive from obfuscation (Gap 4). The listing belongs to a different unit in the same building. Reviewer must disambiguate.
3. **Co-living spaces**: genuinely hybrid STR/long-term housing. Ambiguous by nature.

These false-positive populations are small in absolute terms — the SOP only fires on addresses already flagged by upstream M04 checks, so the denominator is already filtered.

## Notes for stage 7 synthesis

- This SOP is a **second-line check** triggered by upstream flags, not a bulk screening tool. Its coverage gaps matter less than those of the upstream checks (RDI, parcel, Places) because it only processes the flagged subset.
- The dominant gap is platform coverage (Gap 2): checking only Airbnb + VRBO misses ~40–50% of the global STR market. A sophisticated attacker using Booking.com evades entirely.
- The manual nature of the SOP means it cannot scale — it's designed for maybe 5–15 cases/day per reviewer. This is a feature (deep investigation) and a limitation (not economical for high-volume screening).
- Inside Airbnb's geographic limitation (Gap 3) could be partially mitigated by subscribing to AirDNA's commercial API, but at vendor-gated pricing.
