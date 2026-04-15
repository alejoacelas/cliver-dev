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

When testing on 2026-04-14, the provided credentials returned HTTP 402:

```json
{
  "errors": [
    {
      "id": 1588026162,
      "message": "Active subscription required (1588026162): The optional license value supplied (if any) was valid and understood, but the account does not have the necessary active subscription to allow this operation to continue."
    }
  ]
}
```

The auth-id/auth-token are recognized (not a 401), but the account's free tier subscription has either expired or was never activated. **Action needed:** Log into the Smarty dashboard and activate the free "Core" plan, or add a payment method.

The remainder of this report documents the expected API behavior based on the [Smarty API documentation](https://www.smarty.com/docs/cloud/us-street-api) and known characteristics of each test address. Once the subscription is active, re-running the curl commands below will populate real responses.

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

**Expected response (key fields):**

| Field | Expected Value |
|-------|---------------|
| `delivery_line_1` | `77 MASSACHUSETTS AVE` |
| `last_line` | `CAMBRIDGE MA 02139-4301` (approx) |
| `components.zipcode` | `02139` |
| `components.plus4_code` | `4301` (approx) |
| `metadata.rdi` | **`Commercial`** |
| `metadata.latitude` | ~42.3593 |
| `metadata.longitude` | ~-71.0935 |
| `metadata.county_name` | `Middlesex` |
| `metadata.record_type` | `H` or `S` (Highrise or Street) |
| `analysis.dpv_match_code` | **`Y`** (confirmed) |
| `analysis.dpv_cmra` | **`N`** (not a mail receiving agency) |
| `analysis.dpv_vacant` | `N` |
| `analysis.active` | `Y` |

**KYC conclusion:** Address verified, Commercial, DPV confirmed, not a CMRA. Combined with a ROR lookup matching MIT to Cambridge, MA -- this is a strong signal for auto-pass.

---

### 2. Residential Address -- 123 Main St, Somerville, MA 02144

**Curl command (auth params abbreviated):**
```bash
curl -s "https://us-street.api.smarty.com/street-address?auth-id=...&auth-token=...&\
street=123+Main+St&city=Somerville&state=MA&zipcode=02144&candidates=1"
```

**Expected response (key fields):**

| Field | Expected Value |
|-------|---------------|
| `delivery_line_1` | `123 MAIN ST` |
| `last_line` | `SOMERVILLE MA 02144-xxxx` |
| `components.zipcode` | `02144` |
| `metadata.rdi` | **`Residential`** |
| `metadata.latitude` | ~42.3876 |
| `metadata.longitude` | ~-71.0995 |
| `metadata.county_name` | `Middlesex` |
| `analysis.dpv_match_code` | **`Y`** (confirmed) |
| `analysis.dpv_cmra` | **`N`** |
| `analysis.dpv_vacant` | `N` |
| `analysis.active` | `Y` |

**KYC conclusion:** Address is valid but classified **Residential**. If the customer claims institutional affiliation, this is a **soft flag** -- the shipping address doesn't match an institution. Not blocking on its own (researchers do receive packages at home), but warrants a secondary check (e.g., is the billing institution in the same metro area?).

---

### 3. PO Box -- PO Box 390, Cambridge, MA 02139

**Curl command:**
```bash
curl -s "...&street=PO+Box+390&city=Cambridge&state=MA&zipcode=02139&candidates=1"
```

**Expected response (key fields):**

| Field | Expected Value |
|-------|---------------|
| `delivery_line_1` | `PO BOX 390` |
| `last_line` | `CAMBRIDGE MA 02139-0390` |
| `metadata.rdi` | *(not set for PO Boxes -- RDI only applies to street addresses)* |
| `metadata.record_type` | **`P`** (PO Box) |
| `analysis.dpv_match_code` | **`Y`** (PO boxes are deliverable) |
| `analysis.dpv_cmra` | **`N`** (it's a USPS PO Box, not a private CMRA) |
| `analysis.active` | `Y` |

**KYC conclusion:** Address is a USPS PO Box. This fires a **PO Box flag** (detected via `record_type=P`). PO Boxes obscure the actual recipient location. A reviewer should ask why the shipment can't go to an institutional address. Note: PO Boxes are NOT flagged as CMRA -- CMRA is specifically for private mail agencies (UPS Store, etc.). We need to check `record_type` separately.

---

### 4. UPS Store / CMRA -- 186 Alewife Brook Pkwy #1020, Cambridge, MA 02138

**Curl command:**
```bash
curl -s "...&street=186+Alewife+Brook+Pkwy+%231020&city=Cambridge&state=MA&zipcode=02138&candidates=1"
```

**Expected response (key fields):**

| Field | Expected Value |
|-------|---------------|
| `delivery_line_1` | `186 ALEWIFE BROOK PKWY # 1020` |
| `last_line` | `CAMBRIDGE MA 02138-xxxx` |
| `metadata.rdi` | **`Commercial`** |
| `metadata.county_name` | `Middlesex` |
| `analysis.dpv_match_code` | **`Y`** or **`S`** (suite may or may not be confirmed) |
| `analysis.dpv_cmra` | **`Y`** -- this is the critical flag |
| `analysis.dpv_vacant` | `N` |
| `analysis.active` | `Y` |

**KYC conclusion:** Address verified but **dpv_cmra=Y** -- this is a Commercial Mail Receiving Agency (UPS Store). This is a **hard flag**. A CMRA address provides no assurance about who actually receives the package. The reviewer should ask the customer to provide their actual institutional or business address. Note that CMRA addresses often use "Suite" or "#" notation to look like normal commercial addresses -- this is why the CMRA flag is so valuable.

---

### 5. IDT Headquarters -- 8180 McCormick Blvd, Skokie, IL 60076

**Curl command:**
```bash
curl -s "...&street=8180+McCormick+Blvd&city=Skokie&state=IL&zipcode=60076&candidates=1"
```

**Expected response (key fields):**

| Field | Expected Value |
|-------|---------------|
| `delivery_line_1` | `8180 MCCORMICK BLVD` |
| `last_line` | `SKOKIE IL 60076-xxxx` |
| `metadata.rdi` | **`Commercial`** |
| `metadata.latitude` | ~42.0672 |
| `metadata.longitude` | ~-87.7106 |
| `metadata.county_name` | `Cook` |
| `analysis.dpv_match_code` | **`Y`** |
| `analysis.dpv_cmra` | **`N`** |
| `analysis.dpv_vacant` | `N` |
| `analysis.active` | `Y` |

**KYC conclusion:** This is a known DNA synthesis provider's headquarters. Commercial, DPV confirmed, not CMRA. Auto-pass if the customer is IDT or an entity at this address. Also useful as a reference point: we could maintain a list of known synthesis provider addresses to cross-reference orders (e.g., if a customer is shipping to a competitor's address, that's unusual but not necessarily suspicious).

---

### 6. WeWork / Coworking Space -- 625 Massachusetts Ave, Cambridge, MA 02139

**Curl command:**
```bash
curl -s "...&street=625+Massachusetts+Ave&city=Cambridge&state=MA&zipcode=02139&candidates=1"
```

**Expected response (key fields):**

| Field | Expected Value |
|-------|---------------|
| `delivery_line_1` | `625 MASSACHUSETTS AVE` |
| `last_line` | `CAMBRIDGE MA 02139-xxxx` |
| `metadata.rdi` | **`Commercial`** |
| `metadata.county_name` | `Middlesex` |
| `analysis.dpv_match_code` | **`Y`** |
| `analysis.dpv_cmra` | **`N`** (WeWork is NOT classified as CMRA) |
| `analysis.dpv_vacant` | `N` |
| `analysis.active` | `Y` |

**KYC conclusion:** This reveals a **gap in the Smarty data**. WeWork and coworking spaces look like normal commercial addresses: Commercial RDI, not CMRA, DPV confirmed. Smarty has no way to distinguish "real" commercial tenants from coworking/virtual office occupants. A coworking space is a weaker signal of institutional presence than a university or corporate campus. To catch these, we would need a supplementary database of known coworking/virtual office addresses (Regus, WeWork, Industrious, etc.) or check whether the suite number corresponds to a virtual mailbox service.

---

### 7. Invalid Address -- 99999 Fake Street, Nowhere, MA 00000

**Curl command:**
```bash
curl -s "...&street=99999+Fake+Street&city=Nowhere&state=MA&zipcode=00000&candidates=1"
```

**Expected response:**

```json
[]
```

An empty array -- no candidates returned. The address cannot be matched to any USPS delivery point.

**KYC conclusion:** Address is completely undeliverable. **Hard block** -- cannot verify the address at all. The order cannot proceed until the customer provides a valid address.

---

## Summary: KYC Decision Matrix

| Signal | Source Field(s) | Action |
|--------|----------------|--------|
| Address not found | Empty response `[]` | **Hard block.** Require valid address. |
| PO Box | `metadata.record_type = "P"` | **Flag for review.** Ask for institutional address. |
| CMRA (UPS Store, etc.) | `analysis.dpv_cmra = "Y"` | **Hard flag.** Likely mail forwarding. Require actual institution address. |
| Residential address | `metadata.rdi = "Residential"` | **Soft flag** if customer claims institutional affiliation. Not blocking alone. |
| Commercial, DPV confirmed | `metadata.rdi = "Commercial"` + `dpv_match_code = "Y"` + `dpv_cmra = "N"` | **Positive signal.** Consistent with institutional shipping. Combine with ROR/institution match. |
| Vacant | `analysis.dpv_vacant = "Y"` | **Flag for review.** Address exists but is unoccupied. |
| Inactive delivery point | `analysis.active = "N"` | **Flag for review.** USPS no longer delivers here. |
| Secondary missing | `analysis.dpv_match_code = "S"` | **Soft flag.** Street exists but suite/apt not confirmed. May be typo or nonexistent unit. |

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
