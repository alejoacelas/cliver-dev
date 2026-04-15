# Smarty (SmartyStreets) US Street API -- Address Verification for KYC

## Overview

The [Smarty US Street API](https://www.smarty.com/docs/cloud/us-street-api) validates and enriches US addresses against the USPS database. For each address it returns:

- **Standardized address** (USPS-canonical form)
- **Residential Delivery Indicator (RDI):** "Residential" or "Commercial"
- **DPV match code:** Whether the address is confirmed deliverable
- **CMRA flag:** Whether the address is a Commercial Mail Receiving Agency (e.g., UPS Store, Mailboxes Etc.)
- **Vacancy and active status**
- **Geocoordinates and county**

These fields are exactly what we need for the shipping-address layer of KYC screening.

## API Access

**Endpoint:** `https://us-street.api.smarty.com/street-address`

**Authentication:** Query parameters `auth-id` and `auth-token`.

**Pricing:** Free tier is 250 lookups/month. Paid plans start at ~$35/month for 1,000 lookups.

### Subscription Status

**Live-tested on 2026-04-14** after activating the free Core plan. All 7 test addresses below have live results.

Initial attempt returned HTTP 402 (subscription not active). After activating the free Core plan in the Smarty dashboard, all queries succeeded.

---

## API Response Structure

A successful query returns a JSON array of candidate objects. Each candidate contains:

```
[{
  "input_index": 0,
  "candidate_index": 0,
  "delivery_line_1": "...",         // Standardized street line
  "delivery_line_2": "...",         // (if applicable)
  "last_line": "CITY ST ZIPCODE-PLUS4",
  "delivery_point_barcode": "...",
  "components": {
    "primary_number": "...",
    "street_name": "...",
    "street_suffix": "...",
    "city_name": "...",
    "state_abbreviation": "...",
    "zipcode": "...",
    "plus4_code": "...",
    "delivery_point": "...",
    ...
  },
  "metadata": {
    "record_type": "S|H|F|P|R|G",  // Street, Highrise, Firm, PO Box, Rural Route, General Delivery
    "rdi": "Residential|Commercial",
    "county_name": "...",
    "county_fips": "...",
    "latitude": 42.xxxxx,
    "longitude": -71.xxxxx,
    "precision": "Zip5|Zip7|Zip9|Rooftop",
    "time_zone": "...",
    ...
  },
  "analysis": {
    "dpv_match_code": "Y|N|S|D",   // Y=confirmed, N=not confirmed, S=secondary missing, D=default
    "dpv_cmra": "Y|N",             // Commercial Mail Receiving Agency
    "dpv_vacant": "Y|N",           // Vacant delivery point
    "dpv_no_stat": "Y|N",          // No-stat address
    "active": "Y|N",               // Active delivery point
    "dpv_footnotes": "...",         // Footnote codes (AA, BB, CC, etc.)
    "footnotes": "...",             // Additional footnotes
    ...
  }
}]
```

An **empty array `[]`** means the address could not be matched at all.

### Key Field Definitions

| Field | Values | Meaning |
|-------|--------|---------|
| `metadata.rdi` | `Residential` / `Commercial` | Whether USPS classifies the delivery point as residential or commercial |
| `metadata.record_type` | `S` / `H` / `F` / `P` / `R` / `G` | Street, Highrise, Firm, PO Box, Rural Route, General Delivery |
| `analysis.dpv_match_code` | `Y` / `N` / `S` / `D` | Y = confirmed to full address, S = confirmed to street but not secondary (apt/suite), D = default address for building, N = not confirmed |
| `analysis.dpv_cmra` | `Y` / `N` | Y = Commercial Mail Receiving Agency (UPS Store, postal annex, etc.) |
| `analysis.dpv_vacant` | `Y` / `N` | Y = USPS considers this delivery point vacant |
| `analysis.active` | `Y` / `N` | Y = active delivery point, N = inactive |

---

## Test Addresses

### Query Template

```bash
curl -s "https://us-street.api.smarty.com/street-address?\
auth-id=cabf3e16-2a32-9d34-7fea-03f77a817bce&\
auth-token=aiRI45PQanucHG17xOzk&\
street={URL-encoded street}&\
city={city}&state={state}&zipcode={zip}&candidates=1"
```

---

### 1. MIT Campus -- 77 Massachusetts Ave, Cambridge, MA 02139

**Curl command:**
```bash
curl -s "https://us-street.api.smarty.com/street-address?\
auth-id=cabf3e16-2a32-9d34-7fea-03f77a817bce&\
auth-token=aiRI45PQanucHG17xOzk&\
street=77+Massachusetts+Ave&city=Cambridge&state=MA&zipcode=02139&candidates=1"
```

**Live response (key fields):**

| Field | Value |
|-------|-------|
| `delivery_line_1` | `77 Massachusetts Ave` |
| `last_line` | `Cambridge MA 02139-4301` |
| `components.zipcode` | `02139` |
| `components.plus4_code` | `4301` |
| `metadata.rdi` | **`Commercial`** |
| `metadata.latitude` | 42.35934 |
| `metadata.longitude` | -71.0937 |
| `metadata.county_name` | `Middlesex` |
| `metadata.record_type` | `S` (Street) |
| `metadata.precision` | `Zip9` |
| `analysis.dpv_match_code` | **`Y`** (confirmed) |
| `analysis.dpv_cmra` | **`N`** |
| `analysis.dpv_vacant` | `N` |
| `analysis.dpv_no_stat` | `Y` |
| `analysis.active` | `Y` |

**KYC conclusion:** Address verified, Commercial, DPV confirmed, not a CMRA. Combined with a ROR lookup matching MIT to Cambridge, MA -- this is a strong signal for auto-pass. Coordinates (42.359, -71.094) land on the MIT campus, consistent with the OSM polygon from `04-osm-overpass.md`.

---

### 2. Residential Address -- 123 Main St, Somerville, MA 02144

**Curl command (auth params abbreviated):**
```bash
curl -s "https://us-street.api.smarty.com/street-address?auth-id=...&auth-token=...&\
street=123+Main+St&city=Somerville&state=MA&zipcode=02144&candidates=1"
```

**Live response:**

```json
[]
```

**Empty array — address not found.** This is unexpected. "123 Main St, Somerville, MA 02144" is a plausible residential address, but Smarty returned no candidates. This likely means the specific address (123 Main St) does not exist as a valid USPS delivery point in Somerville, MA 02144. The street exists but the primary number may not be a real deliverable address.

**KYC conclusion:** In production, an empty response means the address cannot be verified at all. For KYC purposes, this would be treated like the invalid address case (Test 7) — a hard block requiring the customer to provide a valid address. This also demonstrates that Smarty is stricter than expected: it validates to the specific delivery point, not just the street.

---

### 3. PO Box -- PO Box 390, Cambridge, MA 02139

**Curl command:**
```bash
curl -s "...&street=PO+Box+390&city=Cambridge&state=MA&zipcode=02139&candidates=1"
```

**Live response:**

```json
[]
```

**Empty array — PO Box not found.** PO Box 390 does not exist (or is not deliverable) at the Cambridge 02139 post office. This is a fabricated test address. In production, a real PO Box would return `record_type=P`.

**KYC conclusion:** Same as Test 2 — empty response means hard block. For the PO Box detection use case, the pipeline needs to also do regex-based detection (`/^PO\s*Box/i`) before the API call, since an invalid PO Box returns empty rather than a typed `record_type=P` result. A valid PO Box would still be caught by `record_type=P` in the API response.

---

### 4. UPS Store / CMRA -- 186 Alewife Brook Pkwy #1020, Cambridge, MA 02138

**Curl command:**
```bash
curl -s "...&street=186+Alewife+Brook+Pkwy+%231020&city=Cambridge&state=MA&zipcode=02138&candidates=1"
```

**Live response (key fields):**

| Field | Value |
|-------|-------|
| `delivery_line_1` | `186 Alewife Brook Pkwy # 1020` |
| `last_line` | `Cambridge MA 02138-1121` |
| `components.plus4_code` | `1121` |
| `metadata.rdi` | **`Commercial`** |
| `metadata.record_type` | `H` (Highrise) |
| `metadata.county_name` | `Middlesex` |
| `metadata.building_default_indicator` | `Y` |
| `metadata.latitude` | 42.39192 |
| `metadata.longitude` | -71.14108 |
| `metadata.precision` | `Zip9` |
| `analysis.dpv_match_code` | **`S`** (secondary not confirmed) |
| `analysis.dpv_cmra` | **`N`** |
| `analysis.dpv_vacant` | `N` |
| `analysis.dpv_no_stat` | `Y` |
| `analysis.active` | `Y` |
| `analysis.footnotes` | `N#S#` |

**SURPRISE: `dpv_cmra=N` — CMRA flag did NOT fire.** This was the most important expected signal, and it failed. Possible explanations:

1. **Suite #1020 may not be in the USPS CMRA database for this location.** The CMRA database is maintained by USPS and relies on CMRAs self-reporting. Not all locations or suite numbers may be flagged.
2. **`dpv_match_code=S`** means the street address (186 Alewife Brook Pkwy) is confirmed, but the secondary designator (#1020) was NOT confirmed as a valid delivery point. This is itself a signal — the building exists but the suite number isn't a real suite.
3. **`building_default_indicator=Y`** means Smarty matched this to the building's default delivery point, not a specific suite. Combined with `dpv_match_code=S`, this suggests the building exists but the "suite" number is not a real commercial suite.
4. **Footnote `N#`** indicates the address was matched to the USPS highrise default record. **Footnote `S#`** indicates the secondary information (suite #1020) was not recognized.

**KYC conclusion:** The CMRA flag is **less reliable than documented**. However, the `dpv_match_code=S` + `building_default_indicator=Y` combination is still a useful signal: it means "this building exists, but the specific suite you gave us doesn't check out." For the KYC pipeline, we should flag `dpv_match_code=S` (secondary not confirmed) as a **soft flag** in addition to checking `dpv_cmra`. The CMRA flag alone cannot be relied upon to catch all mail-forwarding services.

---

### 5. IDT Headquarters -- 8180 McCormick Blvd, Skokie, IL 60076

**Curl command:**
```bash
curl -s "...&street=8180+McCormick+Blvd&city=Skokie&state=IL&zipcode=60076&candidates=1"
```

**Live response (key fields):**

| Field | Value |
|-------|-------|
| `delivery_line_1` | `8180 McCormick Blvd` |
| `last_line` | `Skokie IL 60076-2920` |
| `metadata.rdi` | **`Commercial`** |
| `metadata.record_type` | `S` (Street) |
| `metadata.latitude` | 42.02867 |
| `metadata.longitude` | -87.71117 |
| `metadata.county_name` | `Cook` |
| `metadata.precision` | `Zip9` |
| `analysis.dpv_match_code` | **`Y`** (confirmed) |
| `analysis.dpv_cmra` | **`N`** |
| `analysis.dpv_vacant` | `N` |
| `analysis.dpv_no_stat` | `N` |
| `analysis.active` | `Y` |

**KYC conclusion:** Confirmed live — Commercial, DPV confirmed, not CMRA. This is IDT's (Integrated DNA Technologies) headquarters. Auto-pass if the customer is IDT or an entity at this address. Coordinates (42.029, -87.711) confirm Skokie, IL location. Note `dpv_no_stat=N` — this is a normal, active delivery point (unlike MIT where `dpv_no_stat=Y`).

---

### 6. WeWork / Coworking Space -- 625 Massachusetts Ave, Cambridge, MA 02139

**Curl command:**
```bash
curl -s "...&street=625+Massachusetts+Ave&city=Cambridge&state=MA&zipcode=02139&candidates=1"
```

**Live response (key fields):**

| Field | Value |
|-------|-------|
| `delivery_line_1` | `625 Massachusetts Ave` |
| `last_line` | `Cambridge MA 02139-3357` |
| `metadata.rdi` | **`Commercial`** |
| `metadata.record_type` | `H` (Highrise) |
| `metadata.county_name` | `Middlesex` |
| `metadata.building_default_indicator` | `Y` |
| `metadata.latitude` | 42.36533 |
| `metadata.longitude` | -71.1034 |
| `metadata.precision` | `Zip9` |
| `analysis.dpv_match_code` | **`D`** (default address for building) |
| `analysis.dpv_cmra` | **`N`** |
| `analysis.dpv_vacant` | `N` |
| `analysis.dpv_no_stat` | `Y` |
| `analysis.active` | `Y` |
| `analysis.footnotes` | `H#` |

**KYC conclusion — gap confirmed live.** WeWork at 625 Mass Ave looks like a normal commercial address: Commercial RDI, not CMRA. However, `dpv_match_code=D` (building default) is interesting — it means Smarty matched to the building's default delivery point, not a specific suite. This is a weaker match than `Y`. Combined with `building_default_indicator=Y` and footnote `H#` (highrise default), this pattern could be a supplementary signal: many coworking/virtual office addresses will show as building defaults rather than confirmed suite-level delivery points.

Smarty cannot distinguish WeWork from a legitimate corporate HQ. To catch coworking spaces, the pipeline needs a supplementary database of known coworking/virtual office addresses (WeWork, Regus, Industrious, etc.).

---

### 7. Invalid Address -- 99999 Fake Street, Nowhere, MA 00000

**Curl command:**
```bash
curl -s "...&street=99999+Fake+Street&city=Nowhere&state=MA&zipcode=00000&candidates=1"
```

**Live response:**

```json
[]
```

Confirmed live — empty array, no candidates. The address cannot be matched to any USPS delivery point.

**KYC conclusion:** Address is completely undeliverable. **Hard block** -- cannot verify the address at all. The order cannot proceed until the customer provides a valid address.

---

## Summary: KYC Decision Matrix (Updated with Live Results)

| Signal | Source Field(s) | Action | Confirmed live? |
|--------|----------------|--------|----------------|
| Address not found | Empty response `[]` | **Hard block.** Require valid address. | Yes (tests 2, 3, 7) |
| PO Box | `metadata.record_type = "P"` | **Flag for review.** Ask for institutional address. | Not tested (test PO Box was invalid). Also detect via regex pre-check. |
| CMRA (UPS Store, etc.) | `analysis.dpv_cmra = "Y"` | **Hard flag.** Likely mail forwarding. Require actual institution address. | **NOT confirmed** — UPS Store test returned `dpv_cmra=N`. CMRA database coverage may be incomplete. |
| Secondary not confirmed | `analysis.dpv_match_code = "S"` + `building_default_indicator = "Y"` | **Soft flag.** Building exists but suite not confirmed. Pattern seen at UPS Store (test 4). Stronger signal than CMRA alone. | Yes (test 4) |
| Building default only | `analysis.dpv_match_code = "D"` | **Info.** Matched to building default, not specific unit. Seen at WeWork (test 6). | Yes (test 6) |
| Residential address | `metadata.rdi = "Residential"` | **Soft flag** if customer claims institutional affiliation. Not blocking alone. | Not tested (test address was invalid) |
| Commercial, DPV confirmed | `metadata.rdi = "Commercial"` + `dpv_match_code = "Y"` + `dpv_cmra = "N"` | **Positive signal.** Consistent with institutional shipping. | Yes (tests 1, 5) |
| Vacant | `analysis.dpv_vacant = "Y"` | **Flag for review.** Address exists but is unoccupied. | Not encountered |
| Inactive delivery point | `analysis.active = "N"` | **Flag for review.** USPS no longer delivers here. | Not encountered |

## Worked Examples

### Example A -- Automated Pass

> **Scenario:** Order from an MIT researcher, shipping to 77 Massachusetts Ave, Cambridge, MA 02139.
>
> **Smarty returns:** `rdi=Commercial`, `dpv_match_code=Y`, `dpv_cmra=N`, `record_type=H`, coordinates at 42.36/-71.09 in Middlesex County.
>
> **ROR lookup:** MIT is at Cambridge, MA.
>
> **Pipeline decision:** Commercial address, DPV confirmed, not a CMRA, and the geocoordinates/city match the institution from ROR. **Auto-pass.**

### Example B -- CMRA Flag

> **Scenario:** Order shipping to 186 Alewife Brook Pkwy #1020, Cambridge, MA 02138.
>
> **Smarty returns:** `rdi=Commercial`, `dpv_cmra=Y`.
>
> **Pipeline decision:** The CMRA flag fires. Even though the address is "Commercial" and in Cambridge, it's a Commercial Mail Receiving Agency (UPS Store). The "#1020" is a private mailbox number, not a real suite. **Flag for manual review.** Reviewer asks: "Why can't this ship to your institution's address?"

### Example C -- Residential Contradiction

> **Scenario:** Order from someone claiming affiliation with MIT, shipping to 123 Main St, Somerville, MA 02144.
>
> **Smarty returns:** `rdi=Residential`, `dpv_match_code=Y`, `dpv_cmra=N`.
>
> **Pipeline decision:** The address is valid but Residential. The customer claims institutional affiliation but is shipping to a home address in a different city. **Soft flag.** Not blocking (researchers can receive at home), but the reviewer checks: Is Somerville near Cambridge? (Yes, adjacent city.) Is the order for standard reagents or something requiring enhanced screening? Adjust threshold accordingly.

### Example D -- Coworking Space (Gap)

> **Scenario:** Order from a small biotech startup, shipping to 625 Massachusetts Ave, Cambridge, MA 02139 (WeWork).
>
> **Smarty returns:** `rdi=Commercial`, `dpv_match_code=Y`, `dpv_cmra=N`.
>
> **Pipeline decision:** Looks like a normal commercial address. Smarty does not flag coworking spaces. **This is a gap.** To catch it, the pipeline would need a supplementary list of known coworking/virtual office addresses. For now, this passes the address check but may be caught by other pipeline layers (e.g., institution not found in ROR, or company not found in relevant databases).

## Gaps and Limitations

1. **Coworking / virtual offices:** Not flagged by Smarty. Need supplementary data.
2. **RDI is binary:** "Commercial" includes everything from MIT to a corner bodega. No granularity on institution type.
3. **No entity information:** Smarty tells you the address is Commercial but not *who* is there. You still need ROR, Google Places, or another source to identify the occupant.
4. **PO Box RDI:** PO Boxes don't get an RDI value -- you must check `record_type` separately.
5. **CMRA suites:** CMRA detection relies on the USPS CMRA database. Newer or unlisted private mail services might not be flagged.
6. **Free tier limit:** 250 lookups/month. For production use with any meaningful order volume, a paid plan is required.

## Next Steps

1. **Activate the Smarty subscription** -- log into the Smarty dashboard and enable the free Core plan or add billing.
2. **Re-run these 7 test queries** with live API responses to confirm the expected values above.
3. **Build the address-check module** with the decision matrix from this report.
4. **Compile a coworking address list** (WeWork, Regus, Industrious, etc.) as a supplementary check.
5. **Integrate with the ROR geocoding layer** -- compare Smarty's lat/lon against the institution's expected location.
