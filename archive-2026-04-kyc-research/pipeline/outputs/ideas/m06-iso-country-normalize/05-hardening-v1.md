# m06-iso-country-normalize — bypass-aware hardening v1

**Idea under review:** `outputs/ideas/m06-iso-country-normalize/04-implementation-v1.md`
**Measure:** M06 — shipping-export-country

---

## Attacker story walk

### foreign-institution

**Summary:** Attacker claims affiliation with a foreign academic institution (Brazil, Japan, India, Indonesia, Vietnam, CIS) and ships synthesis to that country, then potentially re-exports.

**Bypass methods relevant to M06 (country normalization + geofence leg):**

1. **In-country freight forwarder + fabricated "satellite office" framing (Method 1).**
   - **MISSED.** The attacker ships to Brazil, Japan, India, Indonesia, or Vietnam. None of these countries contain OFAC-sanctioned sub-regions (the geofence covers Crimea, DPR, LPR, Kherson, Zaporizhzhia — all in Ukraine/Russia — and DPRK variants). The normalization step succeeds (these countries have clean ISO 3166-1 codes), the geofence check returns `none`, and the order proceeds. The normalization service adds no signal.

2. **CIS variant — ship to a Russian-language institution.**
   - **AMBIGUOUS.** If the attacker claims affiliation with a Russian institution and ships to a Russian address, the normalization correctly resolves Russia (RU). The Country Group check (m06-bis-country-groups) then flags Russia as comprehensively sanctioned under post-2022 measures. However, if the attacker ships to a Russian address in an occupied Ukrainian territory (Crimea, Donetsk, Luhansk) while listing the country as "Russia," the geofence check is the critical gate.
   - **CAUGHT** for addresses containing Crimea/DPR/LPR/Kherson/Zaporizhzhia keywords, regardless of whether the declared country is Russia or Ukraine. The `geofence_match` field fires, and the `sanctioned_subregion` flag triggers auto-block.
   - **MISSED** if the address text does not contain any sanctioned-territory keyword and uses a Russian postal code that the normalization service does not map to a sanctioned sub-region. The implementation notes this as a failure mode: "Address that's technically in an allowed country but uses a Russian-administered postal code for an occupied territory."

3. **Real institution address + local accomplice receiver (Method 2).**
   - **MISSED.** The destination is a legitimate foreign university address in a non-sanctioned country. Normalization succeeds; geofence returns `none`. No signal.

4. **Residential / virtual office (Methods 4, 5).**
   - **MISSED.** Same — these are in non-sanctioned countries with clean ISO codes.

**Net assessment:** The country normalization + geofence check has near-zero leverage against the foreign-institution branch's primary targets (Brazil, Japan, India, Indonesia, Vietnam) because these countries contain no OFAC-sanctioned sub-regions. The check's value is concentrated on the CIS variant — catching Russian-occupied Ukrainian territories when the address text contains sanctioned-territory keywords. For the branch's core strategy, the normalization step is a necessary plumbing component (feeding m06-bis-country-groups) but does not independently produce a signal.

---

## Findings

### Critical

None.

### Moderate

1. **Russian-administered postal codes for occupied territories may not be resolved (CIS variant of foreign-institution).**
   - Why missed: The geofence relies on keyword matching in address text (city/region names). Russian postal codes assigned to occupied territories (e.g., 295xxx for Crimea under Russian postal system) are not explicitly mapped in the implementation. An address that uses only a postal code without a city name containing "Crimea" or "Sevastopol" could evade the geofence.
   - Suggestion: Stage 4 should add a postal-code-to-region mapping for Russian postal codes in occupied territories. The Russian postal system assigns distinct index ranges to these regions, and a lookup table would catch addresses that omit territorial keywords.

2. **Non-Latin script variants of sanctioned territory names are a documented gap.**
   - The implementation notes "Sanctioned region in a language variant the geofence table doesn't include (e.g., 'Крим' vs 'Crimea' vs 'Krym')." The foreign-institution branch's CIS variant would likely use Cyrillic address text.
   - Suggestion: Stage 4 should specify that the geofence keyword table includes Cyrillic, Ukrainian, and Russian-language variants of all sanctioned territory names, not just English transliterations. This is a low-effort addition (a few dozen entries).

### Minor

3. **The normalization step is correctly positioned as plumbing for m06-bis-country-groups.**
   - The implementation's independent value is in the geofence (sub-national territory screening), which is a narrow but high-severity use case. For the foreign-institution branch's primary targets, the normalization is necessary infrastructure but produces no independent adversarial signal.
   - No change needed.

4. **Kherson and Zaporizhzhia scope uncertainty is correctly flagged.**
   - The implementation notes these are "NOT in OFAC's comprehensively-sanctioned territory set as of late 2025/early 2026." This is a regulatory question, not an implementation gap.
   - No change needed.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| foreign-institution Method 1 (freight forwarder to non-sanctioned country) | MISSED (no geofence hit) |
| foreign-institution Method 2 (accomplice at non-sanctioned institution) | MISSED (no geofence hit) |
| foreign-institution Methods 4, 5 (residential/virtual office in non-sanctioned country) | MISSED (no geofence hit) |
| foreign-institution CIS variant (address with sanctioned-territory keyword) | CAUGHT |
| foreign-institution CIS variant (address with Russian postal code only, no keyword) | MISSED |

## bypass_methods_uncovered

- All non-CIS foreign-institution methods: destinations are in non-sanctioned countries — structural, no geofence to engage
- CIS variant with Russian postal code only: postal-code-to-region mapping not specified
- CIS variant with Cyrillic-only territory names: geofence keyword table language coverage unspecified

---

**Verdict: PASS**

No Critical findings. The country normalization + geofence check correctly handles its designed scope (sanctioned sub-national territories). Its near-zero leverage against the foreign-institution branch's primary targets (non-sanctioned countries) is structural — those countries have no sanctioned sub-regions. The Moderate findings (postal-code mapping, Cyrillic keyword coverage) are specification improvements for the CIS variant, not fundamental gaps requiring re-research.
