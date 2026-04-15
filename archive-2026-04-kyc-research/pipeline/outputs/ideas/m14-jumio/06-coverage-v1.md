# Coverage research: Jumio Identity Verification

## Coverage gaps

### Gap 1: Researchers from countries with unsupported or thin document coverage
- **Category:** Legitimate researchers whose primary government-issued ID (national ID card, driver's license) is not among Jumio's 5,000+ supported subtypes — typically sub-national IDs from smaller African, Central Asian, and Pacific Island states, or non-standard document formats (refugee travel documents, laissez-passer, emergency travel documents).
- **Estimated size:** Jumio claims coverage across 200+ countries/territories [source](https://www.jumio.com/global-coverage/), but the 5,000 subtypes are concentrated in high-volume markets. The World Bank estimates 850 million people globally lack any official ID, with 56% of sub-Saharan Africa (472 million) unregistered [source](https://blogs.worldbank.org/en/digital-development/850-million-people-globally-dont-have-id-why-matters-and-what-we-can-do-about). Among DNA synthesis customers specifically, the market is ~80%+ OECD-concentrated [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799), so the affected tail is small. [best guess: 2–5% of synthesis customers hold a primary ID that Jumio either does not support or handles with degraded accuracy. Reasoning: non-OECD academic researchers exist (emerging biotech hubs in Nigeria, Kenya, India's tier-2 cities, Southeast Asia) and some use sub-national IDs; but most who order internationally will have a passport, which Jumio does cover.]
- **Behavior of the check on this category:** no-signal (`DENIED_UNSUPPORTED_ID_TYPE`) or weak-signal (OCR extraction without template matching)
- **Reasoning:** The practical fallback is to ask the customer to use a passport instead. Customers who have only a non-supported national ID and no passport are hard-excluded.

### Gap 2: Non-Latin-script name mismatches between ID and account record
- **Category:** Researchers whose legal name on the government ID is in a non-Latin script (Arabic, Chinese, Japanese, Korean, Cyrillic, Devanagari, Thai, etc.) and whose synthesis-provider account record uses a romanized or anglicized form. Jumio extracts the name as-written on the ID; comparison against the account record produces a mismatch flag.
- **Estimated size:** Approximately 60% of the world's population uses a non-Latin primary script. Among synthesis customers, the share is lower but still significant: China, Japan, South Korea, India, Russia, and Middle Eastern countries together represent a substantial fraction of international synthesis orders. [best guess: 15–25% of international synthesis customers (i.e., non-US/EU) have non-Latin names on their primary ID. Among all synthesis customers globally, ~8–15% would face this issue. Reasoning: OECD-heavy market but with significant East Asian presence; Chinese and Japanese researchers are major synthesis consumers.]
- **Behavior of the check on this category:** false-positive (`identityVerification.similarity = NO_MATCH` or name-field mismatch against the account record, even though the person is genuine)
- **Reasoning:** This requires the synthesis provider to implement a transliteration-aware name-matching layer between Jumio output and the account record. Without it, false positives on this population would be chronic.

### Gap 3: Facial similarity bias — age gap, head coverings, skin tone
- **Category:** (a) Customers with a significant age gap between their ID photo and current appearance (e.g., passport issued 8+ years ago). (b) Customers who wear head coverings for religious or medical reasons that partially occlude the face. (c) Customers with darker skin tones, where facial recognition algorithms historically show higher false match/non-match rates.
- **Estimated size:** (a) Passports are valid for 10 years; at any time, a significant fraction of holders have photos 5+ years old. [best guess: 20–40% of passport holders have a photo >5 years old.] (b) Head coverings: primarily affects Muslim women (hijab), Sikh men (turban), some Orthodox Jewish women, and medical patients. Among global synthesis customers, [best guess: 3–8%.] (c) NIST FRVT 2024 data shows that top-100 algorithms are now >99.5% accurate across demographics, with the gap between highest and lowest demographic narrowing to 99.7%–99.85% for top-60 algorithms [source](https://pages.nist.gov/frvt/html/frvt_demographics.html). Bias exists but has narrowed dramatically for leading vendors. [best guess: <0.5% incremental false-positive rate attributable to skin-tone bias for Jumio-tier algorithms.]
- **Behavior of the check on this category:** false-positive (face-match `NO_MATCH` or depressed similarity score)
- **Reasoning:** Age-gap is the largest driver of false positives in face matching. Jumio's Liveness Premium and AI have improved, but aged photos remain a structural challenge. The SOP should allow re-capture with a fresher selfie and manual review escalation.

### Gap 4: Low-bandwidth / low-end device capture failures
- **Category:** Researchers in regions with limited internet bandwidth (rural areas, developing countries) or using older mobile devices / desktop webcams that cannot capture the high-resolution images Jumio's SDK requires for document authentication and liveness detection.
- **Estimated size:** [best guess: 3–7% of synthesis customers globally experience capture-quality issues. Reasoning: synthesis customers skew toward institutional settings with reasonable connectivity, but field researchers, developing-country academics, and researchers working remotely from low-infrastructure areas are not negligible.]
- **Behavior of the check on this category:** false-positive (`ERROR_NOT_READABLE_ID` or liveness failure due to low image quality, not fraud)
- **Reasoning:** Retriable — the provider can ask the customer to use a different device or location. But persistent failures in low-infrastructure contexts create repeated friction.

### Gap 5: Recent name changes (marriage, divorce, gender marker update)
- **Category:** Researchers whose legal name has changed since their synthesis-provider account was created, and whose current government ID reflects the new name while the account record still has the old name (or vice versa — new account name, old ID).
- **Estimated size:** US marriage rate is ~6 per 1,000 population/year; roughly 70% of women change their surname at marriage. Gender marker changes are rarer but growing. [best guess: 1–3% of active synthesis customers per year have a name discrepancy between their ID and account record due to a life event.]
- **Behavior of the check on this category:** false-positive (name mismatch flag)
- **Reasoning:** Easily resolved by updating the account record or re-issuing the ID, but creates friction and requires manual review in the interim.

### Gap 6: Customers without any government-issued photo ID
- **Category:** Legitimate researchers who do not possess a government-issued photo ID that Jumio can verify — either because they never obtained one (rare in OECD countries but possible for some stateless persons, refugees with research positions) or because their only ID is expired.
- **Estimated size:** In the US, ~6–11% of citizens lack a current government-issued photo ID [source](https://www.brennancenter.org/our-work/analysis-opinion/debunking-misinformation-photo-id). Among synthesis customers (who skew toward employed professionals), the rate is much lower. [best guess: <1% of synthesis customers lack any valid government photo ID. Reasoning: ordering synthesis requires institutional affiliation and payment infrastructure that correlate strongly with having ID.]
- **Behavior of the check on this category:** no-signal (cannot initiate the Jumio flow)
- **Reasoning:** Numerically tiny but creates a hard exclusion with no automated workaround.

## Refined false-positive qualitative

Updated from 04-implementation-v1:

1. **Non-Latin-script name mismatch** (Gap 2) — chronic FP for ~8–15% of global customers without transliteration layer. Highest-impact gap.
2. **Age-gap face mismatch** (Gap 3a) — affects ~20–40% of passport holders with >5-year-old photos; most resolved by re-capture.
3. **Unsupported document types** (Gap 1) — ~2–5% of customers; fallback to passport if available.
4. **Head coverings / skin-tone bias** (Gap 3b, 3c) — smaller incremental effect with modern algorithms but reputationally sensitive.
5. **Low-bandwidth capture failures** (Gap 4) — ~3–7%; retriable but friction-generating.
6. **Name changes** (Gap 5) — ~1–3%/year; resolvable with account update.
7. **No ID at all** (Gap 6) — <1%; hard exclusion.

## Notes for stage 7 synthesis

- The largest operational false-positive driver for Jumio in a synthesis context is non-Latin-script name mismatches (Gap 2), not fraud detection per se. The provider MUST implement a transliteration/fuzzy-name-matching layer between Jumio output and the account record.
- Face-match bias has narrowed dramatically per NIST FRVT 2024 data, but age-gap remains a structural issue that no algorithm fully solves.
- The ~2–5% unsupported-document tail is manageable if the provider accepts passports as the universal fallback, but this creates friction for customers whose passports are expired or unavailable.
- Jumio's 200+ country coverage is best-in-class for document IDV vendors; the coverage gaps identified here apply equally or worse to Onfido, Persona, and other competitors.
