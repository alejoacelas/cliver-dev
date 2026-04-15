# m06-bis-entity-list — bypass-aware hardening v1

**Idea under review:** `outputs/ideas/m06-bis-entity-list/04-implementation-v1.md`
**Measure:** M06 — shipping-export-country (consignee leg)

---

## Attacker story walk

### foreign-institution

**Summary:** Attacker claims affiliation with a foreign academic institution and ships synthesis to that foreign country, potentially through a freight forwarder or customs broker that may be a restricted party.

**Bypass methods relevant to M06 (entity screening leg):**

1. **In-country freight forwarder + fabricated "satellite office" framing (Method 1).**
   - **AMBIGUOUS.** The check screens the consignee name and address against BIS Entity List, DPL, UVL, and MEU. Whether the forwarder is caught depends on whether the specific forwarder appears on any of these lists. Most freight forwarders in Brazil, Japan, India, Indonesia, and Vietnam are NOT on the BIS Entity List (which is predominantly focused on Chinese, Russian, Iranian, and UAE/Turkish entities involved in diversion). The check would fire only if the specific forwarder happens to be listed.
   - **Detail not pinned down:** The implementation screens the "consignee org and end-user" — but if the order lists the customer (the fake-affiliated researcher) as the consignee and the forwarder is listed only in a "ship to" or "care of" field, does the check also screen the forwarder name? The implementation says "parse the shipping address" but does not specify whether intermediary/forwarder names embedded in the address are separately screened.

2. **In-country customs broker (Method 6).**
   - **AMBIGUOUS (same analysis).** Customs brokers in the enumerated countries are generally not on BIS lists unless they have a documented diversion history.

3. **Real institution address + local accomplice receiver (Method 2).**
   - **MISSED.** The consignee is the fake-affiliated researcher at the real institution's address. Neither the researcher name (a fabricated persona or a real visiting scholar) nor the institution (a legitimate foreign university) appears on the Entity List. The check produces no signal.

4. **Residential address / virtual office (Methods 4, 5).**
   - **MISSED.** The consignee is the attacker using a residential or virtual-office address. Neither the attacker (using their real name) nor the address is on any BIS list. No signal.

**Net assessment:** The Entity List check has weak leverage against the foreign-institution branch because the branch deliberately uses legitimate foreign academic institutions, not entities that appear on restricted-party lists. The check would catch the scenario only if the attacker happens to route through a listed forwarder — a coincidence rather than a design-level catch.

---

## Findings

### Critical

None.

### Moderate

1. **Forwarder/intermediary names embedded in shipping addresses may not be separately screened (foreign-institution Method 1).**
   - Why missed: The implementation screens "consignee org and end-user" but does not specify whether a freight forwarder listed in the "ship to" or "care of" address line is also run through the CSL API as a separate query.
   - Suggestion: Stage 4 should clarify that the screening logic parses the shipping address for intermediary names (freight forwarder, customs broker, "c/o" entities) and screens each entity separately, not just the primary consignee.

2. **Non-Latin script consignee names have incomplete coverage (documented failure mode).**
   - The implementation correctly identifies this as a failure mode, but the foreign-institution branch specifically targets non-Anglophone institutions where names are in local scripts (Cyrillic for CIS, Kanji for Japan, Devanagari for India, etc.). The CSL API's `alt_names` coverage for these scripts is incomplete.
   - Suggestion: This is partially structural (depends on BIS data quality). Stage 4 could specify a transliteration step before querying the API, and note that dual-query (original script + transliterated) is recommended.

### Minor

3. **The check is correctly scoped but has near-zero leverage against this branch's specific attacker stories.**
   - The foreign-institution branch uses legitimate foreign institutions, not restricted parties. The Entity List check is designed to catch known bad actors, not actors using legitimate-but-exploited institutional identities.
   - This is not a gap — it's correct scoping. The check's value is against a different threat model (a known restricted entity attempting to order directly).

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| foreign-institution Method 1 (freight forwarder) | AMBIGUOUS (depends on whether forwarder is listed + whether forwarder name is parsed from address) |
| foreign-institution Method 2 (accomplice at real address) | MISSED |
| foreign-institution Method 4 (residential) | MISSED |
| foreign-institution Method 5 (virtual office) | MISSED |
| foreign-institution Method 6 (customs broker) | AMBIGUOUS |

## bypass_methods_uncovered

- foreign-institution Method 2: accomplice at real institution address — consignee is a legitimate institution, no list hit
- foreign-institution Methods 4, 5: residential/virtual office with unlisted attacker name — no list hit
- Forwarder/intermediary name parsing from address lines: implementation does not specify whether intermediaries are screened

---

**Verdict: PASS**

No Critical findings. The Entity List check is correctly scoped for its purpose (catching known restricted parties) and is not expected to have leverage against the foreign-institution branch, which deliberately uses non-listed legitimate institutions. The Moderate findings are specification clarifications (intermediary parsing, transliteration) rather than fundamental gaps.
