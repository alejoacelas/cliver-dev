# Coverage research: BIS Entity List + DPL + UVL + MEU consignee screen

## Coverage gaps

### Gap 1: Entities not on any BIS list (the vast majority of customers)
- **Category:** Legitimate synthesis customers whose organization is not on the Entity List, DPL, UVL, or MEU list. This check produces no signal — neither positive nor negative — for unlisted entities. It only flags known bad actors.
- **Estimated size:** The Entity List contains ~715 Chinese entities alone as of July 2024 [source](https://en.wikipedia.org/wiki/Entity_List), with total entities across all countries likely in the range of 1,500–2,500 [best guess: China represents roughly a third to half of Entity List entries by volume based on recent addition patterns]. The Consolidated Screening List across all 11 source lists contains perhaps 10,000–15,000 entries total [best guess: based on the known SDN list size of ~12,000+ entries plus smaller lists]. Against a global base of hundreds of thousands of potential synthesis customers, unlisted entities represent >99% of the customer base.
- **Behavior of the check on this category:** no-signal (the check returns zero matches; it provides no information about the legitimacy of unlisted entities)
- **Reasoning:** This is by design — a restricted-party screen is a denylist, not a positive-verification tool. The check catches known bad actors but says nothing about unknown ones. Any attacker not yet listed passes through silently.

### Gap 2: Subsidiaries and affiliates of listed entities (pre-October 2025 gap, partially closed)
- **Category:** Foreign subsidiaries, joint ventures, and affiliates that are 50%+ owned by a listed entity but were not themselves named on the Entity List.
- **Estimated size:** Before the September 2025 "50% Affiliates Rule," any entity not specifically named was excluded from Entity List restrictions, even if majority-owned by a listed parent [source](https://www.akingump.com/en/insights/alerts/bis-publishes-50-affiliates-rule). BIS stated this enabled "diversionary schemes, such as the creation of new foreign companies to evade Entity List restrictions" [source](https://natlawreview.com/article/bis-rule-significantly-expands-reach-entity-list-export-controls-includes-temporary). The number of such affiliates is not publicly quantified, but for major listed entities (e.g., Huawei with hundreds of global subsidiaries), the count is substantial.
- **Estimated size post-rule:** The 50% rule now extends restrictions to affiliates meeting the ownership threshold. However, the CSL API may not yet enumerate all such affiliates — the rule creates a legal obligation on exporters to conduct due diligence on ownership, not a new API data field. [unknown — searched for: "CSL API affiliate entity coverage 50% rule", "consolidated screening list affiliate data" — no indication the API has been updated to flag affiliates automatically].
- **Behavior of the check on this category:** weak-signal (the API may not return a match for an unlisted affiliate; the exporter must independently verify ownership)
- **Reasoning:** The 50% rule shifts the compliance burden to the exporter. The CSL API screen alone is insufficient — it must be complemented by ownership research (e.g., via GLEIF, corporate registries, or vendor services like Kharon).

### Gap 3: Non-Latin script name transliteration mismatches
- **Category:** Customers and consignees whose names are in Chinese (Han), Arabic, Cyrillic, or other non-Latin scripts, where transliteration to Latin characters may not match the CSL's recorded transliteration.
- **Estimated size:** Asia-Pacific accounts for ~23% of the global DNA synthesis market [source](https://www.cognitivemarketresearch.com/dna-synthesis-market-report). China alone is ~8% ($280M in 2024) [source](https://www.grandviewresearch.com/horizon/outlook/dna-synthesis-market/china). A substantial fraction of APAC and Middle East/Africa customers will have names that require transliteration. The CSL's `alt_names` coverage is incomplete for non-Latin variants [noted in stage 4 failure modes].
- **Behavior of the check on this category:** weak-signal (fuzzy matching partially compensates, but Romanization of Han characters has multiple valid systems — Pinyin, Wade-Giles, local customs — leading to both false negatives and false positives)
- **Reasoning:** Name screening in non-Latin scripts is a well-documented challenge in compliance [source](https://fintech.global/2025/02/07/overcoming-name-screening-challenges-in-chinese-and-non-latin-scripts/). Financial institutions report that false positive rates in sanctions screening reach 90–95% overall [source](https://www.facctum.com/blog/false-positive-rates-in-aml-screening), largely driven by common-name and transliteration issues. DNA synthesis screening at lower volumes would face the same structural problem.

### Gap 4: Common-name false positives on individuals
- **Category:** Legitimate individual customers whose names (especially common Arabic, Chinese, or Russian names) produce fuzzy matches against individual entries on the DPL or SDN lists.
- **Estimated size:** Financial institutions report sanctions screening false positive rates of 90–95% [source](https://www.facctum.com/blog/false-positive-rates-in-aml-screening). For DNA synthesis, volumes are far lower (thousands to tens of thousands of orders/year per provider, not millions), so the absolute number of false positives is smaller, but the ratio may be comparable for fuzzy-match configurations.
- **Behavior of the check on this category:** false-positive
- **Reasoning:** This is the dominant operational burden of restricted-party screening. Each false positive requires manual review (address comparison, alt-name check, DOB comparison where available). For synthesis providers, the review cost per false positive (~$15–$45 in reviewer time [best guess: from m06-hs-eccn-classification per-check cost]) can be significant at scale.

### Gap 5: Newly formed entities created to evade the list
- **Category:** Shell companies, front organizations, or newly incorporated entities created after the most recent Entity List update, specifically to evade screening.
- **Estimated size:** [unknown — searched for: "BIS Entity List evasion rate new entities", "shell company export control evasion frequency" — no quantitative data]. BIS enforcement actions describe this as a recurring pattern (the Tri-Seal Compliance Note of March 2024 cites multiple cases), but the base rate is not publicly estimated.
- **Behavior of the check on this category:** no-signal (newly created entities are not on any list)
- **Reasoning:** This is the fundamental limitation of any denylist approach. The 50% Affiliates Rule partially addresses this for subsidiaries of listed parents, but a truly novel shell company with no ownership link to a listed entity will pass the screen.

## Refined false-positive qualitative

Cross-referenced with gaps above:

1. **Common personal names** (Gap 4): The highest-volume false-positive source. Arabic names ("Ali Hassan," "Mohammed Ahmed"), Chinese names ("Wei Zhang," "Li Wang"), and Russian names produce frequent fuzzy hits. Mitigation: tune the fuzzy-match score threshold (stage 4 suggests 0.75–0.92 range) and require secondary-field confirmation (address, country).

2. **Universities sharing names with listed entities** (noted in stage 4): Several Chinese universities (e.g., National University of Defense Technology, Harbin Engineering University) are on the Entity List. Legitimate research collaborations with non-listed campuses or departments of the same university may trip the screen. The 50% Affiliates Rule makes this worse: if a university is listed, any 50%+ owned subsidiary (e.g., a university-owned biotech spin-off) is now also restricted.

3. **Address collisions** (noted in stage 4): In dense commercial districts (e.g., Zhongguancun, Dubai Internet City), a listed entity and an unrelated tenant may share a street address. The CSL returns addresses with matches, but address-level deduplication is imperfect.

## Notes for stage 7 synthesis

- This check is structurally a denylist — it catches known bad actors (Gap 1 documents that >99% of customers produce no signal). Its value is highest when paired with positive-verification checks (m07 ideas, m18/m19 ideas) that provide signal for the unlisted majority.
- The 50% Affiliates Rule (Gap 2) is a major recent development that significantly expands the check's nominal coverage but creates a new operational burden: the CSL API alone may not flag affiliates, requiring complementary ownership-research tools.
- False-positive management (Gaps 3–4) is the dominant operational cost. Financial-sector benchmarks (90–95% FP rate) are the best available proxy but may overstate the problem for synthesis screening given lower volumes and more structured customer data.
