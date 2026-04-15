# 10 — Resolution Cascade: Address-to-Institution Screening

**Date:** 2026-04-14
**Scope:** Priority (a) — linking address to institutions (M05 + M12)
**Purpose:** Compose the 9 tools investigated in files 01–09 into a single screening flow. Show what fires in what order, how signals combine, what the provider rep sees, and what's fully automatable.

---

## Tool Status

| # | Tool | Live tested? | Status |
|---|------|-------------|--------|
| 01 | ROR API | Yes | Working, free, no auth |
| 02 | GLEIF API | Yes | Working, free, no auth |
| 03 | UK Companies House | Yes | Working. Note: must use "Live application" key, not "Test application" |
| 04 | OSM Overpass | Yes | Working, free, rate-limited (~4 queries before 429) |
| 05 | GeoNames | Yes | Working, free, username-based auth |
| 06 | BIN Lookup (binlist.net) | Yes | Working but **missing fintech BINs** — use Stripe metadata instead |
| 07 | Smarty (USPS address) | No (402) | Credentials valid but free Core plan needs activation |
| 08 | Stripe AVS | Yes (test mode) | Working, card metadata + AVS checks |
| 09 | Plaid Identity Match | Yes (sandbox) | Working, per-field match scores |

---

## Architecture Overview

The screening runs in two phases, each with multiple layers:

```
ORDER ARRIVES
    │
    ├── PHASE 1: Address Verification (runs on every order, <2 sec)
    │   ├── Layer 1: Institution lookup (ROR → GLEIF → Companies House)
    │   ├── Layer 2: Address classification (Smarty: RDI, CMRA, DPV)
    │   ├── Layer 3: Geographic match (GLEIF street → OSM polygon → GeoNames point → city fallback)
    │   └── Output: address_verdict + flags[]
    │
    ├── PHASE 2: Payment Verification (runs on every paid order, <1 sec)
    │   ├── Layer 4: Card metadata (Stripe: funding type, country, issuer)
    │   ├── Layer 5: AVS check (Stripe: address_line1, postal_code, CVC)
    │   ├── Layer 6: Billing-shipping consistency (haversine distance, postal code comparison)
    │   ├── Layer 7: ACH identity match (Plaid, if ACH payment)
    │   └── Output: payment_verdict + flags[]
    │
    └── DECISION ENGINE
        ├── No flags → AUTO-PASS
        ├── Soft flags only → TIER-1 DESK CHECK (10 min, $5–$20)
        ├── Hard flags → TIER-2 MANUAL REVIEW (30–45 min, $15–$90)
        └── Hard block → REJECT (require corrected info)
```

---

## Phase 1: Address Verification

### Layer 1 — Institution Lookup

**Purpose:** Given the customer's claimed institution name, find canonical records to verify it exists and retrieve its known addresses/coordinates.

**Cascade order (try each, use best available):**

```
Input: institution_name (from order form)

1. ROR API (always)
   GET https://api.ror.org/v2/organizations?query={institution_name}
   Returns: org type, city, country, lat/lng (city-level), geonames_id, domains
   Cost: $0 | Latency: ~200ms | Coverage: ~110K research orgs globally

2. GLEIF API (always)
   GET https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]={name}
   Returns: legalAddress (street-level), headquartersAddress (street-level), entity status
   Cost: $0 | Latency: ~300ms | Coverage: ~2.9M entities, biased toward financial/commercial
   NOTE: For US entities, use headquartersAddress (legalAddress is often a Delaware registered agent)

3. UK Companies House (if institution_country = GB)
   GET https://api.company-information.service.gov.uk/search/companies?q={name}
   GET https://api.company-information.service.gov.uk/company/{number}
   Returns: registered_office_address (street-level), SIC codes, company_status, date_of_creation
   Cost: $0 | Latency: ~200ms | Coverage: all UK-registered entities (~5.5M)
   NOTE: Search by legal entity name, not trading name (e.g., "Genome Research Limited" not "Wellcome Sanger Institute")
```

**Output of Layer 1:**

```
institution_record: {
  source:               "ror" | "gleif" | "companies_house" | "none",
  canonical_name:       string,
  canonical_addresses:  [{street, city, postal_code, country, source, resolution}],
  lat_lng:              {lat, lng, precision: "street" | "campus" | "city"},
  org_type:             "education" | "company" | "healthcare" | "facility" | "other",
  entity_status:        "active" | "inactive" | "dissolved" | "unknown",
  geonames_id:          number | null,
  sic_codes:            string[] | null,        // Companies House only
  gleif_status:         "ACTIVE" | "LAPSED" | null,
  ror_id:               string | null,
  lei:                  string | null,
  company_number:       string | null,          // Companies House only
}
```

**Flags from Layer 1:**

| Flag | Trigger | Tier | Action |
|------|---------|------|--------|
| `institution_not_found` | No match in ROR, GLEIF, or Companies House | Tier-2 | Manual review: is this a real institution? |
| `institution_inactive` | ROR status=withdrawn, GLEIF status=LAPSED, or CH status=dissolved | Tier-1 | Desk check: confirm current status |
| `institution_recently_created` | Companies House `date_of_creation` < 12 months ago | Tier-1 | Desk check: very new entity |
| `institution_sic_mismatch` | Companies House SIC codes not in life-sciences list | Tier-1 | Desk check: claimed biotech, registered as retail? |
| `institution_name_vs_legal_name` | Customer's institution name doesn't match any canonical name (fuzzy match <0.7) | Tier-1 | Desk check: could be trading name vs. legal name |

---

### Layer 2 — Address Classification (Smarty / USPS)

**Purpose:** Classify the shipping address as commercial/residential, deliverable/undeliverable, and check for mail-forwarding agencies.

**API call:**

```
GET https://us-street.api.smarty.com/street-address
  ?auth-id={SMARTY_AUTH_ID}
  &auth-token={SMARTY_AUTH_TOKEN}
  &street={shipping_street}
  &city={shipping_city}
  &state={shipping_state}
  &zipcode={shipping_zip}
  &candidates=1
```

**Cost:** $0.003–$0.009/lookup | **Latency:** ~100ms | **Coverage:** US addresses only

**Key fields consumed:**

```
metadata.rdi:              "Commercial" | "Residential"
metadata.record_type:      "S" | "H" | "F" | "P" | "R" | "G"  (P = PO Box)
analysis.dpv_match_code:   "Y" | "N" | "S" | "D"  (Y = confirmed deliverable)
analysis.dpv_cmra:         "Y" | "N"  (Y = UPS Store / private mailbox)
analysis.dpv_vacant:       "Y" | "N"
analysis.active:           "Y" | "N"
```

**Flags from Layer 2:**

| Flag | Trigger | Tier | Action |
|------|---------|------|--------|
| `address_undeliverable` | Empty response (no candidates) or `dpv_match_code=N` | Hard block | Require valid address before proceeding |
| `address_cmra` | `dpv_cmra=Y` | Tier-2 | Hard flag — CMRA (UPS Store, private mailbox). Ask for actual institutional address. |
| `address_po_box` | `record_type=P` | Tier-2 | PO Box obscures recipient location. Ask for institutional address. |
| `address_residential` | `rdi=Residential` AND customer claims institutional affiliation | Tier-1 | Soft flag — shipping to home, not institution. Common for researchers. |
| `address_vacant` | `dpv_vacant=Y` | Tier-1 | Address exists but USPS considers it vacant. |
| `address_inactive` | `active=N` | Tier-1 | USPS no longer delivers here. |

**Gap:** Smarty is US-only. For international addresses, Layer 2 is skipped entirely. Coworking spaces (WeWork, Regus) look identical to legitimate commercial addresses — Smarty cannot distinguish them.

---

### Layer 3 — Geographic Match

**Purpose:** Does the shipping address geographically match the claimed institution? This is the core M05 check.

**Resolution cascade (try each in order, use highest-precision match available):**

```
Input: shipping_address (geocoded to lat/lng), institution_record (from Layer 1)

Step 1: GLEIF street-level match (if GLEIF returned headquartersAddress)
  - Geocode the GLEIF headquartersAddress
  - Compare geocoded shipping vs. geocoded GLEIF address
  - Match if: same postal code AND street name fuzzy match ≥ 0.8
  - Resolution: STREET (~50m precision)

Step 2: Companies House street-level match (if UK entity with company_number)
  - Compare shipping postal code vs. registered_office postal_code
  - Compare shipping street vs. registered_office address_line_1
  - Match if: postal code matches AND street fuzzy match ≥ 0.8
  - Resolution: STREET (~50m precision)

Step 3: OSM polygon point-in-polygon (if institution is a university/research institute)
  Overpass query:
  [out:json][timeout:30];(
    way["amenity"~"university|college|research_institute"]["name"~"{name}",i]
      ({south},{west},{north},{east});
    relation["amenity"~"university|college|research_institute"]["name"~"{name}",i]
      ({south},{west},{north},{east});
  );out geom;

  - Bounding box derived from ROR lat/lng ± 0.02° (~2km)
  - Match if: geocoded shipping address falls inside any returned polygon
  - Resolution: POLYGON (10m–1km campus boundary)
  - Cost: $0 | Latency: 200–500ms

Step 4: GeoNames campus-point + radius (if ROR provides geonames_id)
  a. Try name search first (may find campus-level entry):
     GET http://api.geonames.org/searchJSON?q={name}&featureCode=UNIV&featureCode=SCHC&featureCode=SCH&maxRows=3&username={user}
  b. If no campus entry, fall back to ROR's geonames_id (city centroid):
     GET http://api.geonames.org/getJSON?geonameId={id}&username={user}
  - Match if: haversine(shipping, geonames_point) < threshold
    - Campus-level entry (UNIV/SCH/SCHC): threshold = 1 km
    - City-level entry: threshold = 10 km (very permissive)
  - Resolution: POINT_CAMPUS (~500m) or POINT_CITY (~5–20km)
  - Cost: $0 | Latency: ~200ms

Step 5: City-level fallback (ROR city name comparison)
  - Match if: shipping city name matches ROR city name (or is within same metro area)
  - Resolution: CITY (5–20km, weakest level)
  - NOTE: Adjacent cities fail this check (e.g., Somerville vs. Cambridge, ~1.5km apart)
```

**Output of Layer 3:**

```
geo_match: {
  result:           "match" | "mismatch" | "inconclusive",
  resolution:       "street" | "polygon" | "point_campus" | "point_city" | "city" | "none",
  source:           "gleif" | "companies_house" | "osm" | "geonames_campus" | "geonames_city" | "ror_city",
  distance_m:       number | null,       // haversine distance for point-based checks
  polygon_osm_id:   string | null,       // OSM relation/way ID for polygon checks
  confidence:       "high" | "medium" | "low",
}
```

**Confidence mapping:**

| Resolution | Confidence | What it proves |
|------------|------------|----------------|
| `street` | High | Shipping address matches a verified institutional address at the street level |
| `polygon` | High | Shipping address falls within the campus boundary polygon |
| `point_campus` | Medium | Shipping address is within 1km of a known campus point |
| `point_city` | Low | Shipping address is in the same city as the institution |
| `city` | Low | City name matches only (no geographic precision) |
| `none` | — | No match at any level — institution has no geographic data |

**Flags from Layer 3:**

| Flag | Trigger | Tier | Action |
|------|---------|------|--------|
| `geo_mismatch_street` | GLEIF/CH street available but shipping address doesn't match | Tier-1 | Desk check: different street from registered address. Could be satellite office. |
| `geo_mismatch_polygon` | OSM polygon available and shipping address is outside | Tier-1 | Desk check: outside campus boundary. Could be nearby affiliated building. |
| `geo_mismatch_city` | Shipping city ≠ institution city (≥20km away) | Tier-2 | Manual review: different city entirely. Strong mismatch signal. |
| `geo_match_city_only` | Match achieved only at city level (no street/polygon/campus data) | Info | Not a flag — records the weakness of the verification for audit. |
| `geo_no_data` | Institution found in registry but no geographic data usable | Info | Combine with other signals. |

---

## Phase 2: Payment Verification

### Layer 4 — Card Metadata (Stripe)

**Purpose:** Extract identity signals from the payment card itself, before the charge settles.

**Available on PaymentMethod creation (before charge):**

```
PaymentMethod.card.funding:       "credit" | "debit" | "prepaid"
PaymentMethod.card.country:       ISO 3166-1 alpha-2 (e.g., "US", "GB")
PaymentMethod.card.brand:         "visa" | "mastercard" | "amex" | ...
PaymentMethod.card.last4:         string
PaymentMethod.card.fingerprint:   string (stable per-card identifier)
```

**Cost:** $0 (bundled with Stripe) | **Latency:** 0ms (part of payment flow)

**Flags from Layer 4:**

| Flag | Trigger | Tier | Action |
|------|---------|------|--------|
| `card_prepaid` | `funding=prepaid` | Tier-2 | **Hard flag.** Prepaid/gift cards provide zero identity assurance. Reject payment method — require credit, debit, ACH, or wire. |
| `card_country_mismatch` | `card.country` ≠ institution's country | Tier-1 | Desk check: card issued in different country than claimed institution. Common for international students (legitimate). |

---

### Layer 5 — AVS Check (Stripe)

**Purpose:** Verify that the billing address the customer entered matches what the card issuer has on file.

**Available after charge (on Charge object):**

```
Charge.payment_method_details.card.checks:
  address_line1_check:        "pass" | "fail" | "unavailable" | "unchecked"
  address_postal_code_check:  "pass" | "fail" | "unavailable" | "unchecked"
  cvc_check:                  "pass" | "fail" | "unavailable" | "unchecked"

Charge.outcome:
  risk_level:                 "normal" | "elevated" | "highest"
  risk_score:                 0-100
```

**Cost:** $0 (bundled with Stripe) | **Latency:** 0ms (part of charge response)

**Flags from Layer 5:**

| Flag | Trigger | Tier | Action |
|------|---------|------|--------|
| `avs_zip_fail` | `postal_code_check=fail` | Tier-1 | Desk check: billing zip doesn't match issuer records. Stronger geographic signal than street. |
| `avs_both_fail` | `address_line1_check=fail` AND `postal_code_check=fail` | Tier-1 | Desk check: complete billing address mismatch. Could be corporate P-card (centralized billing), could be evasive. |
| `avs_unavailable_us` | Both checks `unavailable` AND `card.country=US` | Tier-1 | Desk check: US-issued card but issuer won't verify address — unusual. |
| `cvc_fail` | `cvc_check=fail` | Tier-1 | Desk check: person may not physically have the card. Primarily fraud signal. |

**Non-flags (expected/normal):**
- `avs_unavailable` for international cards — most non-US/UK/CA issuers don't support AVS. Not a flag.
- `avs_line1_fail` alone — common with P-cards (institutional procurement cards billed to HQ, not lab). Soft signal only when combined with other flags.

---

### Layer 6 — Billing-Shipping Consistency

**Purpose:** Compare billing address, shipping address, and institution's canonical address as a triple-consistency check.

**Logic (no external API — internal computation):**

```python
billing_coords   = geocode(billing_address)
shipping_coords  = geocode(shipping_address)
institution_coords = institution_record.lat_lng  # from Layer 1

billing_shipping_distance = haversine(billing_coords, shipping_coords)
billing_institution_distance = haversine(billing_coords, institution_coords)
shipping_institution_distance = haversine(shipping_coords, institution_coords)

billing_postal   = normalize_postal(billing_address.postal_code)
shipping_postal  = normalize_postal(shipping_address.postal_code)
institution_postal = normalize_postal(institution_record.canonical_addresses[0].postal_code)
```

**Cost:** $0 (uses already-geocoded data) | **Latency:** ~10ms

**Flags from Layer 6:**

| Flag | Trigger | Tier | Action |
|------|---------|------|--------|
| `billing_shipping_metro_mismatch` | `billing_shipping_distance > 100km` | Tier-1 | Desk check: billing and shipping in different metro areas. Common with P-cards. |
| `billing_institution_postal_mismatch` | `billing_postal ≠ institution_postal` AND `billing_institution_distance > 50km` | Tier-1 | Desk check: billing address far from claimed institution. |
| `shipping_institution_postal_mismatch` | `shipping_postal ≠ institution_postal` AND `shipping_institution_distance > 50km` | Tier-1 | Desk check: shipping address far from claimed institution. Already caught by Layer 3, but cross-validates. |
| `all_three_divergent` | All three pairwise distances > 50km | Tier-2 | Manual review: billing, shipping, and institution all in different locations. Strongest billing-shipping signal. |

---

### Layer 7 — ACH Identity Match (Plaid)

**Purpose:** For ACH payments (no card, no AVS), verify that the bank account holder matches the customer's claimed identity.

**Trigger:** ACH payment only (customer completes Plaid Link during checkout)

**API call sequence:**

```
1. Customer completes Plaid Link → public_token
2. POST /item/public_token/exchange → access_token
3. POST /identity/match with:
   - access_token
   - user: {legal_name, address, email_address, phone_number}
   → returns per-field match scores (0-100)
```

**Cost:** ~$0.20–$1.00/call | **Latency:** ~500ms | **Coverage:** US bank accounts only

**Flags from Layer 7:**

| Flag | Trigger | Tier | Action |
|------|---------|------|--------|
| `plaid_name_mismatch` | `legal_name.score < 50` | Tier-2 | Manual review: bank account holder name doesn't match customer name. |
| `plaid_address_mismatch` | `address.score < 30` AND `is_postal_code_match=false` | Tier-1 | Desk check: bank address in different location than claimed. |
| `plaid_full_mismatch` | `legal_name.score < 50` AND `address.score < 30` | Tier-2 | Manual review: appears to be someone else's bank account entirely. |

---

## Decision Engine

### Flag Aggregation

All flags from Layers 1–7 are collected into a single order record:

```
order_screening: {
  order_id:             string,
  screened_at:          timestamp,
  
  // Phase 1 results
  institution_record:   {...},           // Layer 1
  address_class:        {...},           // Layer 2
  geo_match:            {...},           // Layer 3
  
  // Phase 2 results
  card_metadata:        {...},           // Layer 4
  avs_result:           {...},           // Layer 5
  billing_shipping:     {...},           // Layer 6
  plaid_match:          {...} | null,    // Layer 7 (ACH only)
  
  // Aggregated
  flags:                Flag[],
  verdict:              "auto_pass" | "tier1_desk_check" | "tier2_manual_review" | "hard_block",
  hard_blocks:          Flag[],          // subset requiring corrective action
  confidence:           "high" | "medium" | "low",
}
```

### Decision Rules

```
if any flag in hard_blocks:
    verdict = "hard_block"
    # Customer must fix the issue before order proceeds
    # Hard blocks: address_undeliverable, card_prepaid

elif any flag.tier == "tier-2":
    verdict = "tier2_manual_review"
    # Flags: address_cmra, address_po_box, geo_mismatch_city,
    #        institution_not_found, plaid_name_mismatch,
    #        plaid_full_mismatch, all_three_divergent

elif any flag.tier == "tier-1":
    verdict = "tier1_desk_check"
    # Flags: address_residential, avs_zip_fail, avs_both_fail,
    #        card_country_mismatch, billing_shipping_metro_mismatch,
    #        geo_mismatch_street, geo_mismatch_polygon,
    #        institution_inactive, institution_recently_created,
    #        institution_sic_mismatch, etc.

else:
    verdict = "auto_pass"
```

### Flag Interaction Rules (composites)

Some flag combinations are more significant than the individual flags:

```
# Residential address + institution not found = escalate to tier-2
if "address_residential" in flags AND "institution_not_found" in flags:
    escalate to tier-2 (reason: "no verifiable institution, shipping to home")

# AVS fail + billing-shipping mismatch = escalate to tier-2  
if "avs_both_fail" in flags AND "billing_shipping_metro_mismatch" in flags:
    escalate to tier-2 (reason: "billing address fails AVS and diverges from shipping")

# Card country mismatch + geo mismatch = escalate to tier-2
if "card_country_mismatch" in flags AND "geo_mismatch_city" in flags:
    escalate to tier-2 (reason: "card, shipping, and institution all in different countries")

# Institution found + geo match at street/polygon + AVS pass = override soft flags
if geo_match.confidence == "high" AND avs_line1 == "pass" AND avs_zip == "pass":
    downgrade tier-1 flags to info-only (reason: "strong positive signals override soft concerns")
```

---

## Provider Rep View

### Auto-Pass (no flags)

The rep sees nothing — the order flows through without human involvement.

**Estimated share of orders:** 50–70% (well-known institutions, clean addresses, standard payment)

### Tier-1 Desk Check

**What the rep sees:**

```
┌─────────────────────────────────────────────────────────┐
│ ORDER #12345 — Desk Check Required                      │
│                                                         │
│ Customer: Dr. Jane Smith                                │
│ Institution: MIT (ror.org/042nb2s44) ✓ Active           │
│ Shipping: 77 Massachusetts Ave, Cambridge, MA 02139     │
│ Billing:  100 Memorial Drive, Cambridge, MA 02142       │
│                                                         │
│ FLAGS:                                                  │
│  ⚠ avs_zip_fail — billing zip (02142) doesn't match    │
│    card issuer records                                  │
│                                                         │
│ POSITIVE SIGNALS:                                       │
│  ✓ Institution found in ROR (education, active)         │
│  ✓ Shipping inside MIT campus polygon (OSM rel/65066)   │
│  ✓ Card: Visa credit, US-issued                         │
│  ✓ Shipping-institution distance: 0.0 km                │
│                                                         │
│ LIKELY EXPLANATION: P-card billed to MIT central         │
│ finance (100 Memorial Drive) rather than lab address.    │
│                                                         │
│ [APPROVE]  [ESCALATE TO TIER-2]  [REJECT]              │
└─────────────────────────────────────────────────────────┘
```

**Rep action:** Glance at positive signals, see that shipping is on-campus, billing is same city — approve. ~2 minutes.

**Estimated share of orders:** 20–35%

### Tier-2 Manual Review

**What the rep sees:**

```
┌─────────────────────────────────────────────────────────┐
│ ORDER #12346 — Manual Review Required                   │
│                                                         │
│ Customer: Alex Johnson                                  │
│ Institution: "BioForge Labs" — NOT FOUND in ROR/GLEIF   │
│ Shipping: 186 Alewife Brook Pkwy #1020,                 │
│           Cambridge, MA 02138                           │
│ Billing:  Same as shipping                              │
│                                                         │
│ FLAGS:                                                  │
│  🔴 institution_not_found — no registry match           │
│  🔴 address_cmra — UPS Store (CMRA=Y per Smarty)       │
│                                                         │
│ POSITIVE SIGNALS:                                       │
│  ✓ Card: Visa credit, US-issued                         │
│  ✓ AVS: line1 pass, zip pass                            │
│                                                         │
│ ⚠ COMBINED ASSESSMENT: Unknown institution + CMRA       │
│   shipping address. This pattern is consistent with     │
│   mail-forwarding evasion.                              │
│                                                         │
│ RESOLUTION STEPS:                                       │
│  1. Search for "BioForge Labs" in state corp registry   │
│  2. Check if company has a website with team page       │
│  3. Request customer provide institutional address      │
│  4. If legitimate small biotech: request PO or invoice  │
│     from institutional email domain                     │
│                                                         │
│ [APPROVE]  [REQUEST INFO FROM CUSTOMER]  [REJECT]      │
└─────────────────────────────────────────────────────────┘
```

**Rep action:** Follow resolution steps. Typically sends info request to customer. ~15–30 minutes over 1–2 days (includes waiting for customer response).

**Estimated share of orders:** 5–15%

### Hard Block

**What the rep sees:**

```
┌─────────────────────────────────────────────────────────┐
│ ORDER #12347 — BLOCKED                                  │
│                                                         │
│ Customer: Pat Williams                                  │
│ Institution: Stanford University                        │
│ Shipping: 99999 Fake Street, Nowhere, MA 00000          │
│                                                         │
│ BLOCKS:                                                 │
│  ⛔ address_undeliverable — Smarty returned empty       │
│     (no USPS delivery point)                            │
│                                                         │
│ Customer has been notified: "Please provide a valid     │
│ shipping address to proceed with your order."           │
│                                                         │
│ [awaiting customer response]                            │
└─────────────────────────────────────────────────────────┘
```

**Estimated share of orders:** <2%

---

## Worked Case Stories

### Case 1: MIT Researcher — Auto-Pass

**Order:** Dr. Sarah Chen, MIT, oligo order, $450

| Field | Value |
|-------|-------|
| Institution claim | Massachusetts Institute of Technology |
| Shipping address | 77 Massachusetts Ave, Cambridge, MA 02139 |
| Billing address | 77 Massachusetts Ave, Cambridge, MA 02139 |
| Payment | Visa credit card, US-issued |

**Layer 1 — Institution lookup:**
- ROR: Found (ror.org/042nb2s44), type=education, city=Cambridge MA, geonames_id=4931972
- GLEIF: Found (LEI exists — MIT endowment entity), headquartersAddress=77 Massachusetts Ave

**Layer 2 — Address classification:**
- Smarty: `rdi=Commercial`, `dpv_match_code=Y`, `dpv_cmra=N`, `active=Y`

**Layer 3 — Geographic match:**
- GLEIF street match: postal code 02139 matches, street "Massachusetts Ave" matches → **resolution=STREET, confidence=HIGH**
- (OSM polygon also available as backup: shipping point inside relation/65066)

**Layer 4 — Card metadata:**
- `funding=credit`, `country=US` → matches institution country

**Layer 5 — AVS:**
- `address_line1_check=pass`, `postal_code_check=pass`, `cvc_check=pass`

**Layer 6 — Billing-shipping:**
- Same address → distance = 0km

**Flags:** None
**Verdict:** AUTO-PASS
**Time:** 0 minutes human time, ~1.5 seconds API time
**Cost:** <$0.01 (API calls only)

---

### Case 2: P-Card Billing Mismatch — Tier-1 Desk Check

**Order:** Dr. James Park, Stanford University, gene fragment, $1,200

| Field | Value |
|-------|-------|
| Institution claim | Stanford University |
| Shipping address | 450 Jane Stanford Way, Stanford, CA 94305 |
| Billing address | 3160 Porter Drive, Palo Alto, CA 94304 |
| Payment | Visa credit card, US-issued |

**Layer 1:** ROR found (Stanford, education, active)
**Layer 2:** Smarty: Commercial, DPV confirmed, not CMRA
**Layer 3:** OSM polygon found — shipping address inside Stanford campus polygon → **resolution=POLYGON, confidence=HIGH**
**Layer 5:** `address_line1_check=fail`, `postal_code_check=pass`

**Flags:**
- `avs_line1_fail` (Tier-1) — billing street doesn't match issuer records

**Positive signals:**
- Shipping inside campus polygon (high confidence)
- Institution found, active
- Card US-issued, zip code passes AVS
- Billing and shipping both in Palo Alto/Stanford area (4km apart)

**Verdict:** TIER-1 DESK CHECK
**Rep action:** Sees strong geo match, billing is 4km away in Palo Alto (Stanford finance office at 3160 Porter Drive is a known P-card billing address). Approve.
**Time:** ~2 minutes
**Cost:** ~$2–$4

---

### Case 3: Prepaid Card — Hard Block

**Order:** Jordan Lee, "NextGen Therapeutics," custom gene synthesis, $2,800

| Field | Value |
|-------|-------|
| Institution claim | NextGen Therapeutics |
| Shipping address | PO Box 999, Anywhere, NY 10001 |
| Payment | Mastercard prepaid, US-issued |

**Layer 1:** Not found in ROR, GLEIF, or Companies House → `institution_not_found`
**Layer 2:** Smarty: `record_type=P` (PO Box) → `address_po_box`
**Layer 4:** `funding=prepaid` → `card_prepaid` (HARD BLOCK)

**Flags:**
- `card_prepaid` (Hard block)
- `institution_not_found` (Tier-2)
- `address_po_box` (Tier-2)

**Verdict:** HARD BLOCK — prepaid card rejected before manual review is even needed.
**Customer message:** "We're unable to process prepaid cards. Please use a credit card, debit card, or ACH bank transfer."
**Time:** 0 minutes human time
**Cost:** $0

---

### Case 4: UPS Store + Unknown Institution — Tier-2 Manual Review

**Order:** Morgan Davis, "Precision Genomics LLC," DNA fragments, $950

| Field | Value |
|-------|-------|
| Institution claim | Precision Genomics LLC |
| Shipping address | 186 Alewife Brook Pkwy #1020, Cambridge, MA 02138 |
| Billing address | 186 Alewife Brook Pkwy #1020, Cambridge, MA 02138 |
| Payment | Visa credit card (Mercury Bank BIN), US-issued |

**Layer 1:** Not found in ROR or GLEIF → `institution_not_found`
**Layer 2:** Smarty: `rdi=Commercial`, `dpv_cmra=Y` → `address_cmra`
**Layer 4:** `funding=credit`, `country=US`, issuer metadata indicates fintech/neobank
**Layer 5:** AVS: all pass (address registered with the prepaid card matches what they entered)

**Flags:**
- `institution_not_found` (Tier-2)
- `address_cmra` (Tier-2)
- Composite: unknown institution + CMRA → elevated concern

**Verdict:** TIER-2 MANUAL REVIEW
**Rep action:** Searches state corporation registry for "Precision Genomics LLC." Checks for website, LinkedIn presence. Sends email to customer requesting: actual business address, business website, and whether they can pay via institutional invoice. If legitimate startup: may approve with added monitoring. If no response or suspicious responses: reject.
**Time:** 20–30 minutes
**Cost:** $15–$60

---

### Case 5: International Researcher — Tier-1 Desk Check

**Order:** Dr. Amara Osei, Makerere University, oligo order, $280

| Field | Value |
|-------|-------|
| Institution claim | Makerere University |
| Shipping address | Makerere University, P.O. Box 7062, Kampala, Uganda |
| Billing address | [personal address in Kampala] |
| Payment | Visa credit card, UG-issued |

**Layer 1:** ROR found (Makerere University, education, active, city=Kampala, geonames_id=232422)
**Layer 2:** Smarty: SKIPPED (US-only)
**Layer 3:**
- GLEIF: no record
- OSM polygon found (way/343233634) — but shipping address is a PO Box, can't geocode to point
- GeoNames: campus-level entry found (0.33572, 32.56815, UNIV)
- Fallback to city-level: Kampala matches → **resolution=CITY, confidence=LOW**

**Layer 5:** AVS: `unavailable` for both checks (Ugandan issuer doesn't support AVS)

**Flags:**
- `geo_match_city_only` (Info — not a flag, but records low confidence)
- `avs_unavailable` (not flagged — expected for international)

**Positive signals:**
- Institution found in ROR and GeoNames (UNIV feature code)
- OSM campus polygon exists (can verify if street address is provided later)
- Card country (UG) matches institution country

**Verdict:** AUTO-PASS (despite low geo confidence, the institution is well-known and card country matches)
**Time:** 0 minutes
**Cost:** <$0.01

**Note:** If the order were higher-value or for sequences of concern, the low geo confidence could be used to trigger additional screening. The system records the confidence level for audit purposes.

---

### Case 6: Wellcome Sanger Institute — Cross-Source Resolution

**Order:** Dr. Emma Williams, Wellcome Sanger Institute, gene fragment, $1,600

| Field | Value |
|-------|-------|
| Institution claim | Wellcome Sanger Institute |
| Shipping address | Wellcome Genome Campus, Hinxton, Cambridge CB10 1SA, UK |
| Billing address | Same |
| Payment | Visa debit card, GB-issued |

**Layer 1 — Institution lookup:**
- ROR: Found as "Wellcome Sanger Institute" (ror.org/05cy4wa09), type=facility, city=Cambridge (WRONG — actually Hinxton, 15km away)
- GLEIF: No LEI record
- Companies House: Search for "Wellcome Sanger Institute" → may not match. Search for "Genome Research Limited" → company 02742969, registered office in Hinxton, SIC=72110 (biotech R&D), status=active

**Layer 2:** Smarty: SKIPPED (US-only; would need UK equivalent like Loqate or Royal Mail PAF)

**Layer 3 — Geographic match:**
- Companies House: registered_office postal_code = CB10 1SA → matches shipping postal_code. **resolution=STREET, confidence=HIGH**
- OSM polygon: relation/9398629 found for "Wellcome Sanger Institute" (amenity=research_institute). Shipping address geocodes to inside the polygon. **resolution=POLYGON, confidence=HIGH**
- (ROR city-level would have said "Cambridge" — 15km from actual location in Hinxton. This is the case where the cascade matters most.)

**Flags:** None (thanks to Companies House and OSM resolving the ROR city-level inaccuracy)
**Verdict:** AUTO-PASS
**Time:** 0 minutes
**Cost:** <$0.01

**Key insight:** This case demonstrates why the cascade exists. ROR alone would have placed the institution in Cambridge (15km off). The cascade to Companies House (street-level) and OSM (polygon) correctly resolved the location to Hinxton.

---

## Cost Summary

| Verdict | Frequency | Human time | Cost per order | Annual cost (10K orders) |
|---------|-----------|------------|----------------|--------------------------|
| Auto-pass | 50–70% | 0 min | <$0.01 | <$100 |
| Tier-1 desk check | 20–35% | 2–5 min | $2–$10 | $4K–$35K |
| Tier-2 manual review | 5–15% | 15–45 min | $15–$90 | $7.5K–$135K |
| Hard block | <2% | 0 min | $0 | $0 |
| **Blended average** | | | **$3–$25/order** | **$30K–$250K** |

**API costs (separate from human time):**

| Service | Cost per call | Calls per order | Annual cost (10K orders) |
|---------|--------------|-----------------|--------------------------|
| ROR | $0 | 1 | $0 |
| GLEIF | $0 | 1 | $0 |
| Companies House | $0 | 0.1 (UK only) | $0 |
| OSM Overpass | $0 | 0.5 | $0 |
| GeoNames | $0 | 0.5 | $0 |
| Smarty | $0.003–$0.009 | 0.7 (US only) | $21–$63 |
| Stripe (AVS) | $0 | 1 | $0 |
| Plaid | $0.20–$1.00 | 0.05 (ACH only) | $100–$500 |
| **Total API** | | | **$121–$563/year** |

API costs are negligible. Human review time is the dominant cost, which is why maximizing the auto-pass rate matters.

---

## Automation Assessment

| Category | Fully automated | Needs human | LLM-triageable |
|----------|----------------|-------------|-----------------|
| Institution lookup (Layer 1) | Yes | — | — |
| Address classification (Layer 2) | Yes | — | — |
| Geographic match (Layer 3) | Yes | — | — |
| Card metadata (Layer 4) | Yes | — | — |
| AVS interpretation (Layer 5) | Yes | — | — |
| Billing-shipping consistency (Layer 6) | Yes | — | — |
| Plaid identity match (Layer 7) | Yes | — | — |
| Flag aggregation & verdicts | Yes | — | — |
| Tier-1 desk check resolution | — | Yes (2–5 min) | Yes — LLM can explain likely cause (e.g., "P-card billing to HQ") and recommend approve/escalate |
| Tier-2 manual review resolution | — | Yes (15–45 min) | Partially — LLM can search public records, draft info-request emails, but final approve/reject requires human judgment |
| Hard block communication | Yes (templated) | — | — |

**LLM triage opportunity:** An LLM could reduce Tier-1 desk checks from 2–5 minutes to <30 seconds by providing an explanation and recommendation. If the LLM's recommendation is "approve" and confidence is high, the rep could one-click approve. This would cut the blended cost significantly, since Tier-1 is the highest-volume human-touch category.

---

## Known Gaps

1. **International address classification.** Smarty is US-only. No equivalent for non-US addresses in this stack. Options: Loqate (global, $0.04/lookup), Google Address Validation API ($0.007/lookup), Melissa (global, $0.01/lookup).

2. **Coworking / virtual offices.** Smarty classifies WeWork as normal commercial. Need supplementary database of known coworking addresses (WeWork, Regus, Industrious locations).

3. **Invoice/PO orders.** ~30–50% of B2B orders have no card payment. Layers 4–6 are entirely blind. Plaid (Layer 7) only applies to ACH. Wire transfers produce no payment-layer identity signal.

4. **Trading name vs. legal name.** "Wellcome Sanger Institute" → "Genome Research Limited." The pipeline needs fuzzy matching or a fallback to search multiple registries when the first search fails.

5. **Multi-campus universities.** A researcher at MIT Lincoln Lab (Lexington, MA, 20km from Cambridge campus) would trigger `geo_mismatch_city`. Need curated satellite-campus records for high-volume institutions.

6. **OSM Overpass rate limiting.** Public API rate-limits after ~4 queries. For production: pre-fetch and cache polygons for known institutions, or self-host an Overpass instance (~50GB disk).

7. **Smarty subscription.** Free Core plan needs activation in the Smarty dashboard before live tests can run.

---

## Next Steps

1. **Activate Smarty free plan** — log into dashboard, enable Core plan, re-run 7 test addresses
2. **Move to priority (e)** — PO boxes / freight forwarders (shares Smarty dependency)
5. **Draft flag specs** in the format from `notes/measure-A-deep-dive-planning.md`
6. **Author case stories** (~30 stories spanning legitimate, negligent, and adversarial)
