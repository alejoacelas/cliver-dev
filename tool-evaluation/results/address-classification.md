# Address Classification Endpoint Testing Results

**Date:** 2026-04-15
**Endpoints tested:** Smarty US Street API, Google Places (New), GeoNames, OSM Overpass
**Total test cases:** 35 (10 seed + 25 adversarial)
**API calls used:** Smarty 19/50, Google Places 27/200, GeoNames 6/200, OSM Overpass 3/100

## Executive Summary

Address classification APIs have **severe blind spots** that systematically favor certain failure modes over others. The core problem: **address-only searches provide almost no institutional signal**. Google Places returns `premise` or `subpremise` for MIT, Pfizer, Institut Pasteur, freight forwarders, and residential buildings alike. Only when the institution name is included in the query does Google Places return typed results. This creates a fundamental dependency: the pipeline must already know what institution is at an address to classify it.

### Top 5 Failures (ranked by KYC impact)

| # | Failure | Impact | Affected KYC Step |
|---|---------|--------|-------------------|
| 1 | **Smarty CMRA flag unreliable** — returns N for all 4 UPS Store/PMB addresses tested | CMRA/mail-forwarding detection is broken | (e) PO box / freight forwarder |
| 2 | **Google Places address-only search returns premise for everything** — MIT, Pfizer, freight forwarders all return `premise` | No institutional classification from address alone | (a) address-to-institution |
| 3 | **Coworking lab spaces invisible to all APIs** — LabCentral (no type), BioLabs (empty), JLABS (`corporate_office`) | Cannot detect shared wet-lab spaces | (a) address-to-institution |
| 4 | **Smarty RDI misclassifies in both directions** — Harvard science building = Residential, NYC apartment = Commercial | Residential flag generates both false positives and negatives | (d) residential address |
| 5 | **Freight forwarders invisible without keyword** — address-only search returns `premise` for buildings with 5-8 freight companies | Cannot detect re-shipping hubs from address alone | (e) PO box / freight forwarder |

## Detailed Findings by Endpoint

### Smarty US Street API

**Strengths:**
- Reliably returns RDI (Residential/Commercial) for valid US addresses
- Parses address components accurately including PMB designator
- dpv_match_code distinguishes building-level (D) from suite-level (Y/S) delivery

**Critical failures:**

1. **dpv_cmra is systematically broken.** Tested 4 known CMRA addresses (UPS Store at 1 Mifflin Pl, 186 Alewife Brook Pkwy, 955 Mass Ave via PMB address, and the original archive test). All returned `dpv_cmra=N`. The CMRA flag CANNOT be used as a CMRA detector. Likely explanation: the free tier may not include the full CMRA database, or the CMRA database has poor coverage of UPS Store locations.

2. **RDI is bidirectionally unreliable.**
   - Harvard science building (52 Oxford St) returns `RDI=Residential` — a university building misclassified as residential. A KYC pipeline would incorrectly flag this legitimate institutional address.
   - NYC residential high-rise (200 E 89th St) returns `RDI=Commercial` — a residential building misclassified as commercial. Large apartment buildings with managed mailrooms get Commercial classification. A customer ordering to their apartment would NOT trigger the Residential flag.
   - RDI reflects USPS mail delivery infrastructure, not building occupancy or zoning.

3. **PO Box addresses return empty.** The US Street API does not process PO Box addresses. A separate endpoint (US ZIP Code API or string pattern matching) is needed.

**Useful secondary signals:**
- `building_default_indicator=Y` combined with `dpv_match_code=D` appears for all multi-tenant buildings (WeWork, freight forwarders, Moderna, Pfizer). It's not specific but indicates a shared building.
- `pmb_designator` in parsed components catches PMB addresses even when dpv_cmra fails. Checking for `pmb_designator="PMB"` in the response components is a STRONGER CMRA heuristic than the dpv_cmra flag.
- `record_type=H` (highrise) indicates a multi-story commercial building. Combined with building_default_indicator, this identifies large multi-tenant buildings.

### Google Places (New API)

**Strengths:**
- Rich type taxonomy (university, research_institute, coworking_space, hospital, shipping_service, etc.)
- Good international coverage for universities (IIT Bombay, Tsinghua, USP, Makerere, NUST all correctly classified)
- Detects mainstream coworking spaces (WeWork = `coworking_space`, Regus = `coworking_space` in types)
- Correctly classifies hospitals (MGH = `general_hospital`)
- Government research labs classified as `research_institute` (CSIR-CCMB India)

**Critical failures:**

1. **Address-only search is useless for institutional classification.** Tested 10+ addresses by street address alone. ALL returned `premise` or `subpremise` with no institutional type information. MIT, Pfizer, Institut Pasteur, freight forwarder buildings, residential addresses — all identical `premise` responses. The ONLY exception was Oxford Chemistry (where the building itself has a named entity in Google Maps).

   **Implication for KYC pipeline:** A text search using only the customer-provided address generates zero institutional signal. The pipeline MUST include the institution name (from customer's self-reported affiliation) in the Google Places query to get useful type classification. This makes Google Places a verification tool (does the claimed institution exist at this address?) rather than a discovery tool (what institution is at this address?).

2. **Coworking lab spaces systematically misclassified or absent.**
   - LabCentral: `point_of_interest` only (no coworking_space, no university, no type at all)
   - BioLabs: empty response (not in Google Places database)
   - JLABS: `corporate_office` (technically J&J subsidiary, functionally a coworking lab)
   - Google's type taxonomy has `coworking_space` but only applies it to office coworking (WeWork, Regus). Wet-lab incubator spaces are not a category.

3. **Freight forwarder detection requires keyword injection.** The address `1975 Linden Blvd, Elmont, NY` returns `premise` when searched by address only, but returns `shipping_service` (5 different freight companies!) when "freight forwarder" is added to the query. Similarly for `11099 S La Cienega Blvd, Los Angeles` (8 shipping companies visible with keyword). **The data exists but is unreachable via address-only search.**

   **Possible workaround:** Use Google Places Nearby Search (different endpoint) with the address coordinates and a `type=shipping_service` filter to check if any shipping businesses are at the same location. This would catch freight forwarder clusters without needing keywords.

4. **Nigerian university misclassified.** University of Ibadan returns `primaryType=consultant` despite having `university` in the types array. A KYC pipeline MUST scan the full `types` array, not just `primaryType`.

### GeoNames

**Verdict: Not useful for address classification.**

- Street address searches return zero results (GeoNames is a geographical features database, not an address database)
- Name search with `featureClass=S` found MIT (as `SCH` — school) but nothing else tested
- Reverse geocode returned only "Rogers Building" for MIT coordinates — correct building but no institutional context
- All other searches (LabCentral, freight forwarder, Wuhan Institute) returned zero results

GeoNames adds no signal that isn't better provided by Google Places or OSM. Recommend dropping from the pipeline.

### OSM Overpass

**Verdict: Useful for universities only, fails for everything else.**

- MIT campus polygon confirmed (relation 65066, amenity=university)
- LabCentral: not in OSM despite being 500m from MIT campus
- Genspace: not in OSM (building at the address has no institutional tags)
- Nearby OSM features at LabCentral coordinates include MIT buildings (NE47, NE49) tagged as `building=university` or `building=commercial` with `operator=MIT`

OSM provides strong signal for large university campuses but cannot detect commercial companies, coworking spaces, or community labs. Useful as a supplementary check for university verification only.

## Failure Mode Matrix

| Address Type | Smarty RDI | Smarty CMRA | Google (addr only) | Google (name+addr) | OSM | Detection? |
|---|---|---|---|---|---|---|
| University campus | Commercial | N | premise | university | YES (polygon) | **YES** (with name) |
| Pharma HQ | Commercial | N | subpremise | manufacturer | No | **YES** (with name) |
| Research institute (intl) | N/A | N/A | premise | research_institute | Maybe | **YES** (with name) |
| Coworking lab (LabCentral) | Commercial | N | subpremise | point_of_interest | No | **NO** |
| Coworking office (WeWork) | Commercial | N | N/A | coworking_space | No | **YES** (with name) |
| UPS Store / CMRA | Commercial | **N (wrong)** | premise | courier_service | No | **PARTIAL** (name needed) |
| Freight forwarder | Commercial | N | premise | **premise (wrong)** | No | **NO** (address only) |
| Residential house | Residential | N | premise | N/A | No | **YES** (Smarty RDI) |
| Residential high-rise | **Commercial (wrong)** | N | premise | N/A | No | **NO** |
| Community bio lab | Commercial or Res | N | premise | non_profit | No | **PARTIAL** |
| Hospital | Commercial | N | N/A | general_hospital | Maybe | **YES** (with name) |
| Virtual office | Commercial | N | premise | premise | No | **NO** |

## Recommendations for KYC Pipeline Design

### 1. Always include institution name in Google Places queries
Address-only search is nearly useless. The customer's self-reported institution name must be included. This changes the verification model from "discover what's at this address" to "verify that the claimed institution is at this address."

### 2. Replace dpv_cmra with heuristic CMRA detection
The CMRA flag is broken. Instead use a combination of:
- `components.pmb_designator` = "PMB" in Smarty response (parsed but not flagged)
- `components.secondary_designator` containing "#" or "PMB"
- String pattern match on input address for PO Box / PMB patterns
- Google Places name search for `courier_service` or `shipping_service` at the address

### 3. Use Google Places Nearby Search for freight forwarder detection
A text search won't surface freight companies at an address. A Nearby Search centered on the address coordinates with `includedTypes=["shipping_service"]` would detect freight forwarder clusters without needing keywords. This is the ONLY viable automated detection method found.

### 4. Treat RDI as directional, not definitive
- `RDI=Residential` is a useful flag but generates false positives (Harvard 52 Oxford St)
- `RDI=Commercial` does NOT exclude residential use (NYC high-rises)
- Best used as a soft flag that triggers manual review, not as an automatic block

### 5. Drop GeoNames from this pipeline
Zero useful signal not already available from Google Places. Every GeoNames call is wasted budget.

### 6. Use OSM only for university campus verification
OSM is accurate for university campuses but adds nothing for commercial, coworking, or residential classification. Use as a supplementary check after Google Places returns `university` type.

### 7. Build a coworking lab denylist
LabCentral, BioLabs, JLABS, and similar wet-lab incubators are invisible to all APIs. The only viable detection method is a maintained denylist of known coworking lab addresses. This list is finite and slow-changing (~50-100 addresses globally).

### 8. Scan full types array, not just primaryType
University of Ibadan has `primaryType=consultant` but `university` in the types array. Regus has `primaryType=real_estate_agency` but `coworking_space` in types. Always scan the full array.

## API Call Budget Remaining

| Endpoint | Used | Budget | Remaining |
|---|---|---|---|
| Smarty | 19 | 50 | 31 |
| Google Places | 27 | 200 | 173 |
| GeoNames | 6 | 200 | 194 |
| OSM Overpass | 3 | 100 | 97 |
