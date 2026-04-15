# Coverage research: ISO 3166 normalization + sanctioned-territory geofence

## Coverage gaps

### Gap 1: Non-Latin script addresses where transliteration fails or is ambiguous
- **Category:** Customers submitting addresses in Cyrillic, Arabic, Han, Korean, or other non-Latin scripts where automated transliteration produces different Romanizations than the geofence table expects. Includes: Russian addresses in Cyrillic for occupied-territory detection; North Korean addresses in Hangul/Hanja; Arabic addresses in Gulf states near sanctioned entities.
- **Estimated size:** Asia-Pacific accounts for ~23% of the global DNA synthesis market [source](https://www.cognitivemarketresearch.com/dna-synthesis-market-report). Address normalization tools achieve ~98.9% accuracy on well-formed addresses (Libpostal benchmark) [source](https://github.com/openvenues/libpostal) but "two addresses referring to the same place may not match even a single character" when comparing non-Latin and transliterated forms [source](https://www.geopostcodes.com/blog/international-address-data/). For ambiguous or incomplete inputs, accuracy drops to ~90% [source](https://address-hub.com/address-intelligence/normalization/). The ~10% failure rate on ambiguous non-Latin addresses is a significant gap for geofence detection.
- **Behavior of the check on this category:** weak-signal (the normalization may fail to resolve the sub-national region, producing an `unrecognized_country_token` flag rather than a definitive geofence match or clear)
- **Reasoning:** This is the primary technical challenge. A Cyrillic address in the occupied Donetsk oblast may not be recognized by the geofence if the table only contains Latin transliterations of city/region names. The mitigation (transliteration layer + multiple spelling variants) is documented in stage 4 but adds maintenance burden.

### Gap 2: Partial-oblast sanctions — distinguishing occupied from unoccupied portions of Donetsk, Luhansk, Kherson, and Zaporizhzhia
- **Category:** Customers in the government-controlled (unoccupied) portions of Donetsk, Luhansk, Kherson, and Zaporizhzhia oblasts. OFAC sanctions apply to the occupied portions, but the oblasts are not entirely sanctioned. Determining which side of the contact line an address falls on is non-trivial.
- **Estimated size:** Pre-conflict, Donetsk oblast had ~4.3M people and Luhansk ~2.2M. The contact line divides each oblast unevenly. The occupied portions are estimated at ~60–70% of Donetsk and ~90% of Luhansk by area [best guess: based on 2022–2024 front-line maps]. Legitimate Ukrainian academic and research institutions displaced from the occupied zones but still registered in the oblast (e.g., Donetsk National University, now operating from Vinnytsia) would have addresses that mention "Donetsk" in organizational names.
- **Behavior of the check on this category:** false-positive (the geofence keyword match fires on "Donetsk" in the address even for institutions operating in government-controlled territory)
- **Reasoning:** Many US companies developed city-name and postal-code lists for Crimea compliance and are extending them to Donetsk/Luhansk [source](https://www.kelleydrye.com/viewpoints/blogs/trade-and-manufacturing-monitor/how-do-you-identify-locations-subject-to-the-new-u-s-embargo-on-the-dnr-lnr). But the partial-oblast problem means that a postal-code-based approach will either over-block (include government-controlled postal codes) or under-block (miss occupied-zone postal codes that have been reassigned by Russian authorities).

### Gap 3: Disputed and unrecognized territories not in ISO 3166
- **Category:** Customers in territories that have no official ISO 3166-1 code or have ambiguous status: Kosovo (user-assigned XK), Taiwan (officially under CN in some contexts, TW in others), Western Sahara, Somaliland, Northern Cyprus (TRNC), Transnistria, Abkhazia, South Ossetia.
- **Estimated size:** ISO 3166-1 covers 249 entities, of which 193 are UN member states [source](https://en.wikipedia.org/wiki/ISO_3166-1). The uncoded territories represent a small fraction of the global synthesis customer base. Taiwan is the most significant for synthesis (active biotech sector); it has a de facto code (TW) that most systems use. Kosovo uses XK. The others are negligible for synthesis demand [best guess: <0.1% of orders outside Taiwan].
- **Behavior of the check on this category:** weak-signal (the normalization may produce `unrecognized_country_token` for genuinely ambiguous cases, which correctly escalates to review)
- **Reasoning:** For most disputed territories the `unrecognized_country_token` flag is the correct behavior. Taiwan's TW code is well-established in practice. The gap is narrow.

### Gap 4: Addresses routed through VPNs, mail drops, or re-mailing services that obscure the true country
- **Category:** Customers who use a virtual address, re-mailing service, or VPN-masked IP-geolocation to make their address appear to be in an allowed country when they are physically in a sanctioned territory.
- **Estimated size:** [unknown — searched for: "virtual address re-mailing service export control evasion", "VPN address masking sanctions compliance" — no quantitative data on the prevalence in synthesis specifically]. This is a known evasion technique documented in BIS enforcement actions for general exports.
- **Behavior of the check on this category:** no-signal (the normalization processes the declared address, which shows an allowed country; the true location is not detected)
- **Reasoning:** Address normalization is fundamentally a data-quality tool, not a fraud-detection tool. It normalizes what it receives. If the input is a US mailbox rented by someone in Crimea, normalization correctly returns "US" — the evasion is invisible. Complementary checks (m03-pobox-regex-sop, m03-usps-rdi-cmra, IP geolocation) are needed.

### Gap 5: Russian-administered postal codes in occupied territories
- **Category:** After occupation, Russian authorities assigned new postal codes to Crimea (starting with 29xxxx) and to Donetsk/Luhansk/Kherson/Zaporizhzhia territories. A customer using a Russian-administered postal code for an occupied territory will have a country code of "RU" — the geofence must recognize these postal code ranges as belonging to occupied Ukrainian territory.
- **Estimated size:** Crimea's postal system covers ~2M residents. The occupied portions of the four oblasts cover several million more. Legitimate synthesis orders from these territories are near-zero [best guess], but the risk is from orders that use these postal codes either inadvertently or deliberately.
- **Behavior of the check on this category:** weak-signal (detectable if the geofence table includes the Russian-administered postal code ranges for occupied territories; no-signal if it does not)
- **Reasoning:** Stage 4 documents this as a failure mode. The mitigation requires maintaining a mapping of Russian-administered postal codes for occupied territories, which is non-trivial because Russia has changed these codes multiple times since 2014.

## Refined false-positive qualitative

Cross-referenced with gaps above:

1. **Displaced Ukrainian institutions** (Gap 2): Universities and research institutes originally registered in Donetsk or Luhansk that now operate from government-controlled territory. Their organizational names and some address fields still contain "Donetsk" or "Luhansk," triggering the keyword-based geofence. These are legitimate customers who should not be blocked.

2. **North Korean transliteration collisions** (noted in stage 4): South Korean cities or surnames that produce fuzzy matches against North Korean name variants (e.g., "Choson" appears in historical references to Korean culture, not just DPRK).

3. **Russia-domiciled customers in non-occupied regions** (Gap 1): A customer in Moscow or St. Petersburg whose address is poorly parsed by the normalization tool may trigger an `unrecognized_country_token` flag, generating unnecessary review.

4. **Diaspora addresses with sanctioned-locality keywords** (noted in stage 4): A company named "Crimea Heritage Foundation" based in Toronto, or a department called "Donetsk Studies Center" at a US university, would trigger keyword-based geofence detection.

## Notes for stage 7 synthesis

- This idea is a prerequisite for m06-bis-country-groups (provides the normalized country input). Its coverage gaps directly affect the downstream check.
- The hardest technical problem is Gap 2 (partial-oblast sanctions). No off-the-shelf tool cleanly distinguishes occupied from unoccupied portions of split oblasts. This requires ongoing human curation of postal-code and city-name mappings.
- Gap 4 (address masking) is structural — normalization cannot detect fraud. This must be complemented by address-verification checks (m03-smarty-melissa, m04-google-places-business) and behavioral signals.
- The false-positive burden from keyword-based geofencing (Gaps 2, diaspora addresses) is manageable in volume (DNA synthesis orders to or mentioning occupied territories are rare) but high-stakes per incident (a wrongful block on a displaced Ukrainian institution is both operationally and reputationally damaging).
