# Coverage research: BIS Entity List + Consolidated Screening List

## Coverage gaps

### Gap 1: Entities sanctioned by non-US jurisdictions but not listed on the CSL
- **Category:** Institutions sanctioned by the EU, UK, UN, Australia, or other jurisdictions but not (yet) listed on any of the 13 US lists aggregated by the CSL. This includes entities designated under EU autonomous sanctions, UK sanctions (post-Brexit), or UN Security Council resolutions where the US has not adopted a parallel designation.
- **Estimated size:** The CSL aggregates only US-origin lists (BIS, OFAC, State). The EU Consolidated List, UK Sanctions List, and UN Consolidated List each contain entities not present on US lists. [best guess: the overlap between US and EU/UK sanctions is high for major programs (Russia, Iran, North Korea) but diverges for regional programs. OpenSanctions' consolidated dataset contains ~40,000+ entities across all jurisdictions ([source](https://www.opensanctions.org/datasets/sanctions/)); the CSL likely contains a subset of these. Perhaps ~10-20% of globally sanctioned entities relevant to biosecurity are on non-US lists but absent from the CSL.]
- **Behavior of the check on this category:** no-signal (CSL returns no match; entity appears clean)
- **Reasoning:** A DNA synthesis provider subject to US jurisdiction is legally required to screen against US lists, but an institution sanctioned only by the EU (e.g., a Belarusian research entity under EU sanctions but not US OFAC SDN) would pass the CSL screen. This gap matters for providers with global customers.

### Gap 2: Subsidiaries and affiliates not individually listed
- **Category:** Subsidiaries, joint ventures, and controlled entities of CSL-listed parents that are not individually named in the CSL. OFAC's "50% rule" (entities 50%+ owned by SDN-listed persons are themselves blocked) applies, but the CSL API does not return ownership graphs — only named entries.
- **Estimated size:** [best guess: for each major listed entity (e.g., a Chinese military-industrial conglomerate), there may be 5-50 subsidiaries not individually listed. The total number of unlisted subsidiaries of CSL entities is likely in the thousands. In practice, compliance teams must independently research ownership structures.] OFAC's 50% rule guidance confirms this gap exists by design. ([source](https://ofac.treasury.gov/faqs/topic/1591))
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The CSL is a flat list, not a corporate-ownership graph. An institution that is a wholly-owned subsidiary of a listed entity but not itself named will not trigger a hit. This requires supplementary ownership-graph checks (e.g., Sayari, OpenCorporates).

### Gap 3: Non-Latin-script name transliteration misses
- **Category:** Institutions whose names are in Chinese, Russian, Arabic, or other non-Latin scripts and whose CSL entry uses a specific transliteration that does not match the customer-supplied transliteration. The fuzzy matcher operates on Latin-alphabet strings only.
- **Estimated size:** False-positive rates for sanctions screening can reach up to 95% for common names ([source](https://www.visualcompliance.com/blog/best-trade-compliance-tools-for-managing-false-positives-in-ofac-screening/)), but the converse — false negatives from transliteration mismatches — is less measured. [best guess: ~5-10% of non-Latin-name entities may slip through due to transliteration divergence. Chinese institution names are particularly vulnerable because romanization can vary (Pinyin vs. Wade-Giles vs. institutional English name).]
- **Behavior of the check on this category:** false-negative (no match despite the entity being listed)
- **Reasoning:** The CSL's `alt_names[]` field mitigates this by including known alternative spellings, but coverage is incomplete. "Northwest Polytechnical University" vs. "Northwestern Polytechnical University" vs. "Xi Bei Gong Ye Da Xue" illustrates the problem.

### Gap 4: Newly designated entities in the 0-24 hour lag window
- **Category:** Entities added to any of the 13 underlying lists but not yet reflected in the CSL's daily 05:00 EST refresh.
- **Estimated size:** The CSL updates daily ([source](https://www.trade.gov/consolidated-screening-list)). The lag window is at most ~24 hours after a Federal Register notice is published. [best guess: at any given time, 0-5 entities may be in the lag window. The practical risk is low because new designations are publicized via Federal Register and press releases before the CSL ingests them, so a competent compliance team can screen manually.]
- **Behavior of the check on this category:** false-negative (entity not yet in the daily snapshot)
- **Reasoning:** This is a timing gap, not a structural gap. Mitigated by monitoring Federal Register notices in parallel.

### Gap 5: Entities operating under undocumented aliases or trading names
- **Category:** Listed entities that operate under trading names, subsidiary brands, or informal aliases not catalogued in the CSL's `alt_names[]` field.
- **Estimated size:** [unknown — searched for: "CSL alt_names coverage completeness", "BIS Entity List alias coverage gaps" — no published assessment of alias completeness exists.] [best guess: OFAC and BIS add aliases when identified through enforcement actions, but the coverage is reactive. Some entities deliberately use unlisted trading names to evade screening.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** This is a cat-and-mouse problem inherent to any name-based screening approach.

### Gap 6: False positives from common institutional names
- **Category:** Legitimate institutions whose names collide with CSL-listed entities due to common words (e.g., "National University of Defense Technology" vs. similarly named institutions in unrelated countries; "Beijing Institute of Technology" appearing in CSL while "Beijing University of Technology" does not).
- **Estimated size:** False positive rates in sanctions screening can be extremely high — up to 95% of alerts at some institutions ([source](https://www.visualcompliance.com/blog/best-trade-compliance-tools-for-managing-false-positives-in-ofac-screening/)). For the CSL with fuzzy matching, [best guess: ~5-15% of queries against Chinese/Russian institution names may return at least one low-confidence false-positive hit requiring manual review.]
- **Behavior of the check on this category:** false-positive (legitimate customer flagged)
- **Reasoning:** The fuzzy matcher (`fuzzy_name=true`) increases recall at the cost of precision. Manual review dispositions most false positives, but at a cost of analyst time.

## Refined false-positive qualitative

**True false positives (legitimate customers flagged):**
1. Common-name institutional collisions, especially for Chinese/Russian institutions (Gap 6, ~5-15% of queries from those regions)
2. Institutions with English translations that partially match listed entity names

**False negatives (listed entities that pass the screen):**
1. Non-US-sanctioned entities not on the CSL (Gap 1, ~10-20% of globally sanctioned entities)
2. Unlisted subsidiaries of listed parents (Gap 2, thousands of entities)
3. Transliteration mismatches (Gap 3, ~5-10% of non-Latin-name entities)
4. 0-24h lag window (Gap 4, minimal practical risk)
5. Undocumented aliases (Gap 5, unknown scale)

## Notes for stage 7 synthesis

- The CSL is the **minimum viable** denied-parties screen for US-jurisdiction providers — it is legally required, free, and catches the most important cases. But it is not sufficient alone.
- The most actionable coverage improvement is adding **non-US sanctions lists** (EU, UK, UN) — either via OpenSanctions overlay or a commercial vendor (m08-commercial-pep-watchlist).
- The **subsidiary/ownership gap** (Gap 2) is the hardest to close and requires a fundamentally different data source (corporate ownership graph, e.g., Sayari).
- The false-positive burden from fuzzy name matching is operationally significant for providers with Chinese/Russian institutional customers and should be budgeted into the manual-review cost model.
