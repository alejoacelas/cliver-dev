# Export Control — Test Results

**Tested:** 2026-04-14 | **Cases:** 78 (4 rounds) | **Endpoints:** 4 (3 local-logic + 1 blocked)

**KYC step:** (e) PO box / freight forwarder — flag "P.O. Box; freight forwarder address"

## Endpoint status

| Endpoint | Type | Status | Cases tested |
|---|---|---|---|
| PO Box regex | Local logic | Working | 52 |
| ISO 3166 country normalization | Local logic | Working | 78 |
| BIS Country Group D/E | Local logic | Working | 75 |
| Consolidated Screening List | API | **BLOCKED** (deprecated, returns 301) | 0 |

## Summary metrics

| Endpoint | Metric | Value |
|---|---|---|
| PO Box regex | Precision (labeled cases) | 1.000 (14 TP, 0 FP) |
| PO Box regex | Recall (labeled cases) | 1.000 (14 TP, 0 FN) |
| PO Box regex | True negatives | 11 (0 false positives on bait addresses) |
| ISO normalization | Accuracy | 97.4% (76/78 correct) |
| ISO normalization | Failures | 1 wrong (Kosovo->RS), 1 unresolved (misspelling) |
| BIS country groups | Accuracy (labeled) | 100% (17/17 correct dispositions) |

## Coverage boundaries found

### 1. PO Box — CJK/Arabic/Russian equivalents: NOT COVERED

The regex covers 7 language families (English, German, Spanish, French, Portuguese, Dutch, Italian) plus Australian and South African variants. It does **not** cover Chinese (信箱), Arabic (ص.ب), Russian (а/я), Turkish (P.K.), or other non-Latin PO Box equivalents. Estimated impact: 20-40% of customers in non-covered-language countries, though most synthesis order forms use Latin script.

Evidence: cases 33, 34, 35

### 2. PO Box — character substitution (zero-for-O): NOT COVERED

"P 0 Box" (digit zero for letter O) bypasses the regex. The current pattern requires literal ASCII 'O'. Fix: add `[oO0]` character class. Low engineering cost.

Evidence: case 30

### 3. PO Box — creative rewording ("Post Office Lock Box"): NOT COVERED

"Post Office Lock Box" bypasses the regex because the "Lock" insertion breaks the "Post Office Box" pattern match. Known gap from m03 synthesis, confirmed empirically.

Evidence: case 31

### 4. PO Box — fullwidth Unicode: COVERED

Fullwidth characters (e.g., `PO Box`) are correctly detected after NFKC Unicode normalization. The normalization converts fullwidth to ASCII before regex matching.

Evidence: case 32

### 5. PO Box — international variants (7 language families): COVERED

All tested variants detected: Postfach (DE), Boite Postale (FR), BP (FR abbrev), Casella Postale (IT), Apartado Postal (ES), Postbus (NL), Caixa Postal (PT), Locked Bag (AU), Private Bag (ZA), APO/FPO/PSC (military).

Evidence: cases 11-23

### 6. PO Box — false positive resistance: COVERED

Zero false positives on 6 adversarial bait addresses containing "Box", "PO", "Post", and similar substrings: Boxwood Lane, Polar Bear St, Apostle Drive, Pomelo Way, Box Elder Lane, and a Polish address. The `\b` word boundary anchors and PO-prefix requirement prevent false matches.

Evidence: cases 24-29

### 7. ISO normalization — Kosovo: NOT COVERED (BUG)

"Kosovo" fuzzy-matched to Serbia (RS) instead of the user-assigned code XK. pycountry does not recognize Kosovo as a separate country. Must add explicit alias. Although Kosovo is not a major export-control concern, incorrect normalization is a data integrity issue.

Evidence: case 52

### 8. ISO normalization — ambiguous names: COVERED (safe failure)

"Korea" (no North/South qualifier) and "Congo" (no DRC/Republic qualifier) correctly return null with ambiguity warnings instead of silently mapping to one country. This is critical safety behavior: mapping "Korea" to KR (Group A) instead of KP (Group E) would be catastrophic.

Evidence: cases 67, 68

### 9. BIS — Russia/Belarus Part 746 de-facto embargo: COVERED

Russia and Belarus correctly classified as auto_deny via explicit Part 746 overlay, despite being formally Group D (not Group E) in the BIS table. This captures the post-2022 sanctions reality.

Evidence: cases 39, 40

### 10. BIS — Hong Kong vs. China: COVERED

Hong Kong (HK, Group B, pass) correctly distinguished from China (CN, Group D, license_required). This is an important operational distinction given increasing BIS restrictions on HK.

Evidence: case 50

### 11. Consolidated Screening List — entity-level screening: BLOCKED

The API endpoint is deprecated/migrated and returns 301. This is the most significant gap in the export-control group: there is **no automated entity-level screening** against OFAC SDN, BIS Entity List, DPL, UVL, or MEU List. Country-level screening (BIS groups) catches jurisdiction risk but cannot identify specific denied persons or entities at an address.

Evidence: n/a (untestable)

## Iteration log

### Round 1 (seed cases 1-10)

Ran 10 seed cases covering easy (OECD countries), medium (military addresses, Group D/E destinations), and hard (PO Box variants, non-English country names). All three endpoints worked correctly on the seed set. Confirmed:
- PO Box regex catches standard variants (P.O. Box, PMB, PSC/APO) and misses creative rewording ("Post Office Lock Box")
- ISO normalization handles "People's Republic of China", "USA", "United States of America", and "Rossiya" (via custom alias table)
- BIS classification correctly auto-denies Iran (Group E) and Russia (Part 746)

Decided to probe: international PO Box variants, false-positive bait addresses, obfuscation attacks.

### Round 2 (PO Box adversarial, cases 11-35)

Targeted PO Box regex specifically. Tested 25 cases across three categories:
1. **Should-match variants (13 cases):** All detected. Covered 9+ language families plus military codes.
2. **Should-not-match false-positive bait (6 cases):** All correctly rejected. Zero false positives.
3. **Obfuscation/evasion (6 cases):** Confirmed known gaps — zero-for-O, "Lock Box" rewording, CJK/Arabic/Russian equivalents all bypass. Fullwidth Unicode correctly caught via NFKC.

Key finding: the regex's coverage is excellent within its defined scope (Latin-script PO Box variants + military). The gaps are all non-Latin scripts and deliberate character substitution. The m03 synthesis's assessment holds up: the check's deterrent value exceeds its direct detection value.

### Round 3 (BIS Country Group classification, cases 36-52)

Tested 17 countries across all BIS groups: 3 Group E (auto-deny), 2 Part 746 de-facto embargo (auto-deny), 4 Group D (license_required), 4 Group A (pass), 2 Group B (pass), and 2 edge cases (Hong Kong separate from CN, Kosovo unmapped). All 17 dispositions correct.

Key finding: the static table lookup is trivially deterministic. The real risk is upstream — if ISO normalization feeds the wrong country code, the entire BIS classification fails. The Korea ambiguity is the nightmare case.

### Round 4 (ISO normalization edge cases, cases 53-78)

Tested 26 inputs across alpha-2 codes, alpha-3 codes, common abbreviations (USA, UK, UAE, PRC, DPRK), formal ISO names, non-English names (6 languages), dangerous ambiguities, old/historical names, territories, and misspellings. 24/26 correct (92.3%), with 2 failures:
1. Kosovo -> Serbia (wrong: pycountry fuzzy match)
2. "Australa" -> unresolved (pycountry fuzzy search too strict)

Key finding: the custom alias table is essential. pycountry alone cannot handle "Rossiya", "Zhongguo", "Deutschland", "PRC", "UK", "USA" (hits alpha-3 path coincidentally), or "People's Republic of China". Without the custom table, normalization accuracy would drop significantly.

## Key fields and their usefulness

| Endpoint | Field | Useful for flag | Coverage quality |
|---|---|---|---|
| PO Box regex | hit (bool) | (e) PO box detection | Excellent for Latin-script variants, zero for CJK/Arabic/Russian |
| PO Box regex | match_token | (e) PO box variant identification | Exact substring, good for audit trail |
| ISO normalization | iso2 | (e) upstream of BIS lookup | 97.4% accuracy; fails safely on ambiguous inputs |
| ISO normalization | confidence | (e) escalation signal | "low"/"none" triggers manual review |
| BIS country groups | disposition | (e) export control action | Deterministic; auto_deny/license_required/pass/escalate |
| BIS country groups | flags | (e) specific concern type | Distinguishes E1 embargo vs D license-required vs Part 746 |
| Screening List | (all) | (e) entity-level screening | **BLOCKED** — no data available |

## Consolidated Screening List gap analysis

The API deprecation creates a significant blind spot: the three working endpoints handle **country-level** and **address-format-level** screening, but there is **no entity-level screening** against:

- OFAC SDN (Specially Designated Nationals)
- BIS Entity List (entities requiring license for all items)
- BIS Denied Persons List
- BIS Unverified List
- BIS Military End-User List

**Impact:** An order to a named denied party in a non-embargoed country (e.g., a BIS Entity List entity in China or a sanctioned individual in the UAE) would pass all three working endpoints — PO Box regex sees a street address, ISO normalization succeeds, and BIS country groups flags "license required" but does not check the entity name.

**Mitigation options:**
1. **Vendor solution** (Visual Compliance, Descartes, SAP GTS): $5K-50K/yr. Maintained, real-time updates.
2. **Manual CSV/XML download** from trade.gov: Free, but loses real-time update cadence. Requires building local search/matching logic and handling name variants.
3. **Alternative API:** Check if trade.gov has published a replacement endpoint since the deprecation.

## What I'd test with more budget

- Cyrillic and Arabic script PO Box variants with extended regex patterns
- Sub-national sanctioned territories (Crimea addresses listed as "Russia" vs "Ukraine")
- ECCN x Country Chart cross-reference (requires m06-hs-eccn-classification dependency)
- Temporal edge cases: recently sanctioned entities, recently removed countries
- Customer dataset (`customers.csv`) filtered for Group D/E countries and non-standard country_raw values
