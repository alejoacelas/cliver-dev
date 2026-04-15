# Step (e): PO Box / Freight Forwarder — Field Assessment

**Measure:** M03 (+M06) — P.O. Box; freight forwarder address
**Endpoint groups assessed:** export-control (PO Box regex, ISO normalization, BIS country groups, Consolidated Screening List), address-classification (Smarty CMRA), llm-exa

---

## Three distinct sub-problems, three different automation levels

Step (e) bundles three operationally different concerns under one flag: PO Box detection, freight forwarder detection, and export control screening. These share a flag label but differ radically in automation feasibility.

**PO Box detection** is essentially solved for Latin-script countries. The regex achieves 100% precision (0 false positives on 11 bait addresses) and 100% recall (14/14 true positives) across 7 language families, Australian/South African conventions, and US military mail codes. Known gaps exist -- CJK, Arabic, and Cyrillic PO Box equivalents are not covered, and a zero-for-O character substitution bypasses the pattern -- but these have known, low-cost fixes.

**Export control country screening** is deterministic and correct. BIS Country Group lookup returned the correct disposition for 17/17 tested countries, including the critical post-2022 Part 746 overlay for Russia/Belarus. The risk is upstream: if ISO normalization feeds the wrong country code, the BIS classification fails. The Korea ambiguity -- "Korea" without North/South qualifier -- is the nightmare case: mapping to KR (Group A, pass) instead of KP (Group E, auto-deny) would be catastrophic. The normalizer correctly returns null with a warning for ambiguous inputs.

**Freight forwarder detection** is unsolved. No tested endpoint can identify a freight forwarder from a street address alone. This is the critical operational gap in step (e).

---

## PO Box regex: the clear success story

The regex was tested across 52 cases in 4 rounds: 10 seed cases, 13 international variants (should-match), 6 false-positive bait addresses (should-not-match), and 6 obfuscation/evasion attempts. Results:

**Should-match variants (all detected):** P.O. Box, PO Box, Post Office Box, PMB, Postfach (German), Boite Postale and BP (French), Casella Postale (Italian), Apartado Postal (Spanish), Postbus (Dutch), Caixa Postal (Portuguese), Locked Bag (Australian), Private Bag (South African), APO/FPO/PSC (US military). Fullwidth Unicode characters (PO Box) are caught after NFKC normalization.

**Should-not-match bait (all correctly rejected):** Boxwood Lane, Polar Bear St, Apostle Drive, Pomelo Way, Box Elder Lane, and a Polish address with partial pattern overlaps. The `\b` word boundary anchors and PO-prefix requirement prevent false matches.

**Evasion attempts (gaps found):** "P 0 Box" (digit zero for letter O) bypasses the regex because the current pattern requires literal ASCII 'O'. Fix: add `[oO0]` character class -- low engineering cost. "Post Office Lock Box" bypasses because the "Lock" insertion breaks the "Post Office Box" pattern match. Chinese 信箱, Arabic ص.ب, and Russian а/я are all undetected -- the regex's scope is Latin script only.

The bottom line: within its defined scope, the regex is excellent. The deterrent value -- making it obvious that PO Box addresses are screened -- may exceed the direct detection value, since a determined attacker would use a street address rather than a PO Box.

---

## Smarty CMRA: broken

The Smarty `dpv_cmra` flag is supposed to detect Commercial Mail Receiving Agencies (UPS Store, PostNet, Mailboxes Etc.). In testing, it returned `N` for all 4 known CMRA addresses: UPS Store at 1 Mifflin Pl, UPS Store at 186 Alewife Brook Pkwy, UPS Store at 955 Mass Ave (via PMB address), and a fourth CMRA from the archive test set.

The flag is systematically non-functional. Likely explanation: the free tier does not include the full CMRA database, or the database has poor coverage of UPS Store locations. Either way, `dpv_cmra` cannot be used for CMRA detection.

**Backup heuristic:** Smarty correctly parses the `pmb_designator` field from address components. When a customer includes "PMB" in their address, Smarty surfaces it as `components.pmb_designator="PMB"` even though `dpv_cmra=N`. Checking for `pmb_designator` in the response is a stronger CMRA signal than the dedicated CMRA flag. But this only works when the customer explicitly uses the PMB designation -- CMRA addresses with suite numbers instead of PMB are invisible.

---

## Export control: country screening works, entity screening is blocked

### ISO country normalization (97.4% accuracy)

Tested 78 inputs across alpha-2 codes, alpha-3 codes, common abbreviations, formal ISO names, non-English names in 6 languages, dangerous ambiguities, old/historical names, territories, and misspellings. 76/78 correct. The two failures:
- **Kosovo mapped to Serbia** (wrong): pycountry fuzzy match returns RS instead of XK. Fix: add explicit alias.
- **"Australa" unresolved** (too-severe misspelling): pycountry fuzzy search threshold too strict.

The custom alias table is essential. Without it, pycountry alone fails on "Rossiya", "Zhongguo", "Deutschland", "PRC", "UK", "USA" (hits alpha-3 by coincidence), and "People's Republic of China." The alias table turns these from failures into reliable mappings.

**Safety behavior:** "Korea" (no qualifier), "Congo" (no qualifier), and other genuinely ambiguous inputs correctly return null with an ambiguity warning. This is critical: the system must refuse to guess rather than risk mapping Korea to the wrong country.

### BIS Country Group lookup (100% accuracy)

Tested 17 countries across all BIS groups: 3 Group E (Iran, North Korea, Syria -- auto-deny), 2 Part 746 overlay (Russia, Belarus -- auto-deny), 4 Group D (China, Pakistan, UAE, India -- license_required), 4 Group A (US, UK, Germany, Australia -- pass), 2 Group B (Singapore, Hong Kong -- pass), and 2 edge cases.

All 17 dispositions correct. The lookup is a deterministic table from 15 CFR 740 Supplement 1. Russia and Belarus are correctly classified as auto-deny via explicit Part 746 overlay despite being formally Group D. Hong Kong (HK, Group B, pass) is correctly distinguished from China (CN, Group D, license_required).

The risk is entirely upstream: if ISO normalization provides the wrong country code, BIS classification follows the error faithfully. The Korea ambiguity is the single most dangerous case in the pipeline.

### Consolidated Screening List (BLOCKED)

The API endpoint is deprecated and returns HTTP 301. This is the most significant gap across all 5 KYC steps: there is no automated entity-level screening against OFAC SDN, BIS Entity List, Denied Persons List, Unverified List, or Military End-User List.

**Impact:** Country-level screening catches jurisdiction risk (Iran, North Korea, etc.) but cannot identify specific denied persons or entities. An order to a BIS Entity List entity in China -- a non-embargoed country -- would pass every working check: PO Box regex sees a street address, ISO normalization succeeds, BIS returns license_required (not deny), and no entity screening exists to catch the specific entity.

**Mitigation options:**
1. Vendor solution (Visual Compliance, Descartes, SAP GTS): $5K-50K/year. Maintained, real-time updates.
2. Manual CSV/XML download from trade.gov: Free, but requires building local search/matching logic with name variant handling.
3. Alternative API: Check if trade.gov has published a replacement endpoint.

---

## Freight forwarder detection: the unsolved problem

No tested endpoint can identify a freight forwarder from a street address alone. Addresses at freight forwarder warehouses (1975 Linden Blvd in Elmont, NY with 5 freight companies; 11099 S La Cienega Blvd in LA with 8 freight companies) return "premise" from Google Places and produce no signal from Smarty, Exa, or any other API when searched by address only.

**Why this matters for synthesis providers:** Freight forwarders are the primary mechanism for circumventing export controls. A US freight forwarder address allows a customer in an embargoed country to appear as a domestic US customer. The address is a normal commercial street address. The country is the US (Group A, pass). The PO Box regex sees a street address. Every automated check passes. Only entity-level screening (blocked) or a freight forwarder denylist could catch this.

**Exa's limitation:** Exa can identify named forwarding services (Shipito, MyUS) when the service name is in the query. But in a KYC flow, the customer provides an address, not a forwarding service name. When Exa searches "1396 W Herndon Ave, Fresno" (Shipito's address), it finds nothing freight-related. The data exists -- these are real businesses with websites -- but web search by address alone does not surface them.

**Google Places workaround (proposed, not tested):** Google Places has the freight forwarder data. When "freight forwarder" is added as a keyword, text search at 1975 Linden Blvd returns 5 shipping_service results. The proposed workaround: use Google Places Nearby Search centered on the address coordinates with `includedTypes=["shipping_service"]`. This would detect freight forwarder clusters without needing keywords in the query. This is the most promising lead but was not validated.

**Freight forwarder denylist (proposed, not tested):** A curated list of known re-shipping hub addresses. The list is finite (~50-100 major forwarding addresses in the US) and slow-changing. Maintenance cost is low. Combined with Google Places Nearby Search, this would provide two independent detection layers.

---

## Profile groups and resolution time

| Group | Time tier | Est. time | Fraction | Resolution |
|---|---|---|---|---|
| Standard OECD street address | Auto | 0 min | ~50% | PO Box=no, BIS=pass |
| PO Box address (Latin script) | Auto | 0 min | ~5% | PO Box=yes, auto-flag |
| Embargoed country (Group E / Part 746) | Auto | 0 min | ~3% | BIS=auto_deny |
| Group D country order | Quick review | 2-5 min | ~10% | BIS=license_required, check item + end-user |
| CJK/Arabic/Russian PO Box | Quick review | 1-3 min | ~2% | Regex miss, manual review of non-Latin address |
| Freight forwarder address | Investigation | 10-20 min | ~5% | Invisible to automation, requires manual investigation |
| UPS Store / CMRA (no PMB) | Investigation | 5-10 min | ~3% | Smarty CMRA broken, manual check needed |

### Standard street address in OECD country

The majority of legitimate synthesis orders. PO Box regex returns no hit, ISO normalization resolves to an OECD country, BIS disposition is pass. All three local-logic checks complete instantly at zero cost. No human involvement.

### PO Box address (any Latin-script country)

Deterministic detection. PO Box regex fires, order is auto-flagged. The follow-up depends on provider policy: some providers hard-reject (reagents cannot be physically delivered to a PO Box), others soft-flag and ask for an alternative address. Either way, the detection is automatic.

### Embargoed country address

BIS Group E or Part 746 auto-deny. Deterministic. No judgment needed. The ISO normalization step is critical -- if the country field says "Iran" or "Persia" or "DPRK", the alias table and BIS lookup handle it automatically.

### Group D country order

BIS returns license_required. Not an auto-deny, but heightened scrutiny. The reviewer checks whether the order is for controlled items (which depends on ECCN classification from step M06, not yet integrated) and whether the end-user institution is verified through other KYC steps. For a Chinese university ordering standard reagents, this may resolve quickly. For an unknown entity ordering controlled items, it triggers a deeper investigation.

### Freight forwarder address

The hardest case. The address looks normal, all automated checks pass, and only manual investigation or a maintained denylist would catch it. In practice, these cases may surface through step (a) failure -- if no institution is found at the shipping address, the reviewer would investigate further. But a freight forwarder at a commercial building with other businesses would not necessarily trigger a step (a) failure.

---

## Recommended endpoint combination

**PO Box detection:**
1. PO Box regex (every order -- 100% precision/recall for Latin script, zero cost)
2. Smarty `pmb_designator` parsing (US only -- backup CMRA heuristic)

**Drop:** Smarty `dpv_cmra` (systematically broken)

**Export control:**
1. ISO country normalization (every order -- 97.4% accuracy, feeds BIS lookup)
2. BIS Country Group lookup (every order -- deterministic, 100% accuracy)
3. Consolidated Screening List for entity-level screening (BLOCKED -- requires vendor solution or CSV download)

**Freight forwarder detection:**
1. Freight forwarder address denylist (proposed, curated list of ~50-100 known forwarding addresses)
2. Google Places Nearby Search with `type=shipping_service` (proposed, not tested)
3. Exa web search (supplementary -- works only when forwarding service name is known)

---

## Unresolved issues

1. **Consolidated Screening List API is BLOCKED.** No automated entity-level screening. This is the single most critical gap across all 5 KYC steps. Must be resolved before production deployment.
2. **Google Places Nearby Search for freight forwarder detection is proposed but not tested.** The data exists in Google Places -- the question is whether the Nearby Search API surfaces it reliably.
3. **CJK/Arabic/Cyrillic PO Box equivalents are not covered.** Extending the regex is low engineering cost but was not implemented.
4. **Zero-for-O substitution bypasses the regex.** Known fix: add `[oO0]` character class.
5. **Sub-national sanctioned territories** (Crimea, Donetsk, Luhansk) are not modeled in the BIS lookup.
6. **Kosovo ISO normalization bug** maps to Serbia instead of XK.
7. **ECCN x Country Chart cross-reference** is not implemented -- BIS check uses country groups only, not item-specific export classification.
8. **Freight forwarder denylist** does not yet exist and would need curation and quarterly maintenance.
