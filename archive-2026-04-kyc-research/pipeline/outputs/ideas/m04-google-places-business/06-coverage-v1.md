# Coverage research: Google Places business presence

## Coverage gaps

### Gap 1: International customers in regions with sparse Google Places coverage
- **Category:** Customers at addresses in countries or rural areas where Google Places has few or no business listings. This particularly affects non-OECD countries, rural areas in developing nations, and countries where Google services are restricted (China, parts of Central Asia).
- **Estimated size:** Google Maps covers 220+ countries and territories with 2B+ monthly users [source](https://wiserreview.com/blog/google-maps-statistics/). However, business listing density varies enormously. In the US/EU/Japan/Australia, urban business listing coverage is near-complete; in rural sub-Saharan Africa, South Asia, or Central Asia, listings are sparse to nonexistent. Asia-Pacific represents ~17% and "rest of world" (Middle East, Africa, Latin America) represents ~5–10% of gene synthesis revenue [source](https://www.precedenceresearch.com/gene-synthesis-market). [best guess: ~10–20% of international synthesis orders ship to addresses where Google Places coverage is too thin to produce a meaningful signal — predominantly orders from rural or semi-urban areas in non-OECD countries, plus orders from China where Google services are blocked.]
- **Behavior of the check on this category:** no-signal (zero results returned is ambiguous — could mean residential OR could mean sparse coverage)
- **Reasoning:** The `no_places_business_at_address` flag fires on both genuinely residential addresses and addresses in low-coverage areas. The check cannot distinguish the two, making the flag unreliable for these regions. For Chinese addresses specifically, Places returns nothing by design.

### Gap 2: New / stealth-mode labs not yet on Google Places
- **Category:** Newly established laboratories, stealth-mode biotech startups, and recently relocated labs that have not yet created or been assigned a Google Business Profile listing.
- **Estimated size:** Google Business Profile listings typically appear within 1–2 weeks of creation by the business owner [source](https://brandonleuangpaseuth.com/blog/how-long-does-it-take-for-a-google-business-profile-to-show-up/). However, many labs never create a listing at all — they have no customer-facing need for one. [best guess: among biotech startups less than 12 months old, perhaps 30–50% have no Google Places listing, since early-stage labs often operate in shared space and don't create a separate business listing. The 04-implementation estimated 3–12 months lag, which aligns with the verification timeline data.]
- **Behavior of the check on this category:** false-positive (triggers `no_places_business_at_address`)
- **Reasoning:** A legitimate lab with no Google Places presence gets the same flag as a residential address with no business. The manual review step can resolve this, but it adds friction and cost.

### Gap 3: Labs in multi-tenant buildings where Places returns wrong business
- **Category:** Legitimate labs operating in shared buildings (office parks, multi-tenant commercial buildings, university research parks) where the Google Places Nearby Search returns a different tenant (the building management company, a coffee shop, a coworking brand) rather than the lab itself.
- **Estimated size:** [unknown — searched for: "multi-tenant office building percentage businesses Google Places listing", "commercial building multiple tenants Google Maps listing coverage"]. [best guess: in biotech hubs like Kendall Square, South San Francisco, and San Diego, a significant fraction of lab tenants (perhaps 20–40%) are in buildings where the dominant Places listing is the building or landlord entity, not the individual lab tenant.]
- **Behavior of the check on this category:** weak-signal (Places returns a result, but the type/name mismatch triggers `places_category_mismatch` even though the customer is legitimate)
- **Reasoning:** The `places_category_mismatch` flag fires because the matched business name does not match the customer's claimed institution. Reviewer must manually determine whether the customer is a tenant in that building.

### Gap 4: Security-conscious organizations that suppress public presence
- **Category:** Government labs, defense contractors, classified research facilities, and some pharmaceutical companies that intentionally do not maintain a Google Maps / Places presence for security reasons.
- **Estimated size:** [unknown — searched for: "government lab Google Maps listing suppressed", "defense contractor facility Google Places absence"]. [best guess: a small but non-trivial population — perhaps a few dozen to low hundreds of facilities in the US alone (DOE national labs, DTRA facilities, USAMRIID, some BARDA contractors). These are high-value legitimate customers.]
- **Behavior of the check on this category:** false-positive (triggers `no_places_business_at_address`)
- **Reasoning:** These organizations deliberately avoid public-facing listings. The check penalizes their operational security posture.

### Gap 5: International addresses outside US/EU where Places returns ambiguous types
- **Category:** Customers at addresses in countries where Google Places returns results but with the generic `establishment` type only, without specific subtypes like `university` or `medical_lab`. This is common in regions where business-type curation is incomplete.
- **Estimated size:** [unknown — searched for: "Google Places API establishment only type percentage international", "Google Places business type coverage by country"]. [best guess: affects 5–15% of international address lookups, concentrated in Latin America, Southeast Asia, and Eastern Europe where Google's business-type taxonomy is less complete.]
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** A result with only `establishment` type provides no discriminative power — it could be anything. The check cannot determine whether it's a lab, a shop, or a residence.

## Refined false-positive qualitative

Updated from stage 4 with coverage research cross-references:

1. **New / stealth-mode startups** (Gap 2): affects ~30–50% of sub-12-month startups [best guess]. High friction for a fast-growing customer segment.
2. **Security-conscious organizations** (Gap 4): small population but high-value, high-legitimacy customers. False positive here is reputationally costly.
3. **Multi-tenant building mismatch** (Gap 3): concentrated in biotech hubs. Cross-check with m05-incubator-tenant partially mitigates for incubator buildings.
4. **International sparse coverage** (Gap 1): structural — the check degrades to unreliable in low-coverage regions. Not a false positive per se (no flag fires) but a loss of signal.

## Notes for stage 7 synthesis

- The international coverage gap (Gap 1) is the largest by customer volume but is partially structural: Google Places simply has less data outside the US/EU. This makes the check US/EU-biased in practice.
- The new-lab gap (Gap 2) is the most operationally significant false-positive source: it affects the exact population of early-stage startups that synthesis providers most want to serve.
- Gap 3 (multi-tenant mismatch) is partially addressed by cross-referencing with m05-incubator-tenant for known incubator addresses. For non-incubator multi-tenant buildings, there's no automated mitigation.
- The ToS structural risk flagged in stage 4 remains: even if coverage were perfect, Google's enforcement posture could shut down this use case.
