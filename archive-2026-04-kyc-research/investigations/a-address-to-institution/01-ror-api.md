# ROR API for Institution Screening

Investigation date: 2026-04-14

The [Research Organization Registry (ROR)](https://ror.org) is an open, community-led registry of research organization identifiers and metadata. This investigation tests whether ROR can serve as the institution-lookup layer in a KYC pipeline for DNA synthesis screening: given a claimed institutional affiliation, can we resolve it to a verified organization with location data?

API: `https://api.ror.org/v2/organizations?query={name}` -- no auth, no rate-limit key required, free.

---

## 1. Test Results by Institution

### 1a. Massachusetts Institute of Technology (MIT) -- large US university

```bash
curl -s "https://api.ror.org/v2/organizations?query=Massachusetts%20Institute%20of%20Technology"
```

```json
{
  "id": "https://ror.org/042nb2s44",
  "names": [
    {"value": "Massachusetts Institute of Technology", "types": ["ror_display", "label"]},
    {"value": "MIT", "types": ["acronym"]},
    {"value": "Instituto Tecnologico de Massachusetts", "types": ["label"], "lang": "es"}
  ],
  "types": ["education", "funder"],
  "status": "active",
  "established": 1861,
  "domains": ["mit.edu"],
  "links": [
    {"type": "website", "value": "https://web.mit.edu"},
    {"type": "wikipedia", "value": "http://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology"}
  ],
  "locations": [
    {
      "geonames_id": 4931972,
      "geonames_details": {
        "name": "Cambridge",
        "country_code": "US",
        "country_subdivision_code": "MA",
        "lat": 42.3751,
        "lng": -71.10561,
        "continent_code": "NA"
      }
    }
  ],
  "external_ids": [
    {"type": "grid", "preferred": "grid.116068.8"},
    {"type": "isni", "all": ["0000 0001 2341 2786"]},
    {"type": "wikidata", "preferred": "Q49108"},
    {"type": "fundref", "preferred": "100006919"}
  ]
}
```

**Verdict:** Excellent. Top result is exact match. City-level location (Cambridge, MA), domain, and multiple cross-reference IDs. The lat/lng (42.3751, -71.1056) is the GeoNames centroid for Cambridge, MA -- not MIT's campus coordinates.

---

### 1b. University of Cape Town -- African university (non-OECD coverage test)

```bash
curl -s "https://api.ror.org/v2/organizations?query=University%20of%20Cape%20Town"
```

```json
{
  "id": "https://ror.org/03p74gp79",
  "names": [
    {"value": "University of Cape Town", "types": ["ror_display", "label"]},
    {"value": "UCT", "types": ["acronym"]},
    {"value": "Universiteit van Kaapstad", "types": ["label"], "lang": "af"},
    {"value": "iYunivesithi yaseKapa", "types": ["label"], "lang": "xh"},
    {"value": "South African College", "types": ["alias"]}
  ],
  "types": ["education", "funder"],
  "status": "active",
  "established": 1829,
  "domains": [],
  "links": [
    {"type": "website", "value": "https://uct.ac.za"},
    {"type": "wikipedia", "value": "http://en.wikipedia.org/wiki/University_of_Cape_Town"}
  ],
  "locations": [
    {
      "geonames_id": 7302802,
      "geonames_details": {
        "name": "Rondebosch",
        "country_code": "ZA",
        "country_subdivision_code": "WC",
        "lat": -33.96333,
        "lng": 18.47639,
        "continent_code": "AF"
      }
    }
  ]
}
```

**Verdict:** Good coverage of non-OECD institutions. Note: `domains` is empty (not all records populate this). The location resolves to "Rondebosch" (a suburb of Cape Town where the campus actually sits) rather than "Cape Town" -- this is more precise than MIT's city-level entry, likely because the GeoNames entry used is suburb-level. The `links` field gives us the website domain (`uct.ac.za`) even though `domains` is empty.

---

### 1c. Ginkgo Bioworks -- US commercial biotech company

```bash
curl -s "https://api.ror.org/v2/organizations?query=Ginkgo%20Bioworks"
```

```json
{
  "id": "https://ror.org/0311zp875",
  "names": [
    {"value": "Ginkgo Bioworks, Inc. (United States)", "types": ["ror_display"]},
    {"value": "Ginkgo Bioworks, Inc.", "types": ["label"]},
    {"value": "Ginkgo BioWorks", "types": ["alias"]},
    {"value": "Ginkgo", "types": ["alias"]}
  ],
  "types": ["company"],
  "status": "active",
  "established": 2009,
  "domains": ["ginkgo.bio"],
  "links": [
    {"type": "website", "value": "https://www.ginkgo.bio"},
    {"type": "wikipedia", "value": "https://en.wikipedia.org/wiki/Ginkgo_Bioworks"}
  ],
  "locations": [
    {
      "geonames_id": 4930956,
      "geonames_details": {
        "name": "Boston",
        "country_code": "US",
        "country_subdivision_code": "MA",
        "lat": 42.35843,
        "lng": -71.05977,
        "continent_code": "NA"
      }
    }
  ]
}
```

**Verdict:** ROR covers commercial companies, not just universities. `types: ["company"]` distinguishes it. Only 6 total results for "Ginkgo Bioworks" (vs 30K+ fuzzy matches for "MIT"), so the match is precise. Note that Ginkgo's actual HQ is in the Seaport district of Boston -- the lat/lng here is downtown Boston's GeoNames centroid, not the specific address.

---

### 1d. Wellcome Sanger Institute -- UK research institute

```bash
curl -s "https://api.ror.org/v2/organizations?query=Wellcome%20Sanger%20Institute"
```

```json
{
  "id": "https://ror.org/05cy4wa09",
  "names": [
    {"value": "Wellcome Sanger Institute", "types": ["ror_display", "label"]},
    {"value": "WTSI", "types": ["acronym"]},
    {"value": "The Sanger Centre", "types": ["alias"]},
    {"value": "Wellcome Trust Sanger Institute", "types": ["alias"]}
  ],
  "types": ["nonprofit"],
  "status": "active",
  "established": 1992,
  "domains": ["sanger.ac.uk"],
  "links": [
    {"type": "website", "value": "https://www.sanger.ac.uk"},
    {"type": "wikipedia", "value": "http://en.wikipedia.org/wiki/Wellcome_Trust_Sanger_Institute"}
  ],
  "locations": [
    {
      "geonames_id": 2653941,
      "geonames_details": {
        "name": "Cambridge",
        "country_code": "GB",
        "country_subdivision_code": "ENG",
        "lat": 52.2,
        "lng": 0.11667,
        "continent_code": "EU"
      }
    }
  ],
  "relationships": [
    {"label": "Wellcome Trust", "type": "parent", "id": "https://ror.org/029chgv08"}
  ]
}
```

**Verdict:** Good. `types: ["nonprofit"]` rather than "education." The `relationships` field shows Wellcome Trust as the parent -- useful for understanding org structure. Note: the Sanger Institute's actual campus is in Hinxton (south of Cambridge), but ROR locates it to "Cambridge" -- a ~15 km discrepancy. This matters for address matching.

---

### 1e. Makerere University -- Ugandan university (small/non-Western test)

```bash
curl -s "https://api.ror.org/v2/organizations?query=Makerere%20University"
```

```json
{
  "id": "https://ror.org/03dmz0111",
  "names": [
    {"value": "Makerere University", "types": ["ror_display", "label"]},
    {"value": "Chuo Kikuu cha Makerere", "types": ["label"], "lang": "sw"}
  ],
  "types": ["education", "funder"],
  "status": "active",
  "established": 1922,
  "domains": ["mak.ac.ug"],
  "links": [
    {"type": "website", "value": "https://mak.ac.ug"},
    {"type": "wikipedia", "value": "http://en.wikipedia.org/wiki/Makerere_University"}
  ],
  "locations": [
    {
      "geonames_id": 232422,
      "geonames_details": {
        "name": "Kampala",
        "country_code": "UG",
        "country_subdivision_code": "C",
        "lat": 0.31628,
        "lng": 32.58219,
        "continent_code": "AF"
      }
    }
  ],
  "relationships": [
    {"label": "Uganda Cancer Institute", "type": "child"},
    {"label": "Butabika Hospital", "type": "related"},
    {"label": "Mulago Hospital", "type": "related"}
  ]
}
```

**Verdict:** Excellent coverage. Even includes the Swahili name and affiliated hospitals. Makerere is the oldest university in East Africa and well-represented. ROR's coverage extends well beyond OECD countries.

---

### 1f. Genspace -- small US community bio lab (edge case test)

```bash
curl -s "https://api.ror.org/v2/organizations?query=Genspace"
# Also tried: query.advanced=Genspace
```

```json
{
  "number_of_results": 0,
  "items": []
}
```

Also tested `BioCurious` (another community bio lab) -- also zero results.

**Verdict: Not found.** Community bio labs, makerspaces, and small non-academic organizations are not in ROR. This is a critical gap: these are exactly the kinds of non-traditional entities that might order synthetic DNA and would need screening. ROR is curated for *research organizations* -- community labs, startups, and individual customers fall outside its scope.

---

## 2. Summary of ROR Data Quality

| Institution | Found | Types | City | Country | Domain | Lat/Lng precision |
|---|---|---|---|---|---|---|
| MIT | Yes | education, funder | Cambridge | US | mit.edu | City centroid |
| U. Cape Town | Yes | education, funder | Rondebosch | ZA | (via links) | Suburb-level |
| Ginkgo Bioworks | Yes | company | Boston | US | ginkgo.bio | City centroid |
| Wellcome Sanger | Yes | nonprofit | Cambridge | GB | sanger.ac.uk | City centroid (~15km off) |
| Makerere U. | Yes | education, funder | Kampala | UG | mak.ac.ug | City centroid |
| Genspace | **No** | -- | -- | -- | -- | -- |

**Key observations:**
- ROR covers ~110K organizations globally. Major universities, research institutes, and established companies are well-covered.
- Location data is **city-level only** -- never street addresses. The lat/lng is a GeoNames centroid for the city or suburb, not the institution's campus.
- The `domains` field is inconsistently populated (empty for UCT). The `links` field is more reliable for website URLs.
- The `types` taxonomy (`education`, `company`, `nonprofit`, `funder`, `facility`, etc.) is useful for risk tiering.
- Community bio labs, startups, and individual researchers are **not covered**.

---

## 3. Worked Examples: Address Verification Using ROR

### Example A -- Automated Pass

**Scenario:** A researcher claims affiliation with MIT and requests shipment to:
> 77 Massachusetts Ave, Cambridge, MA 02139

**Step 1: Resolve institution via ROR**

```
GET https://api.ror.org/v2/organizations?query=MIT
-> id: https://ror.org/042nb2s44
-> location: Cambridge, MA, US (lat: 42.3751, lng: -71.1056)
-> geonames_id: 4931972
```

**Step 2: Geocode the shipping address**

Using a geocoding service (Google Maps, Mapbox, or Nominatim):
```
77 Massachusetts Ave, Cambridge, MA 02139
-> lat: 42.3593, lng: -71.0935
-> city: Cambridge
-> state: MA
-> country: US
```

**Step 3: Compare**

| Check | ROR data | Shipping address | Match? |
|---|---|---|---|
| Country | US | US | Yes |
| State/subdivision | MA | MA | Yes |
| City | Cambridge | Cambridge | Yes |
| Distance (lat/lng) | 42.375, -71.106 | 42.359, -71.094 | ~2.0 km |

**Decision: AUTO-PASS.**

City-level match is sufficient here. The ~2 km distance between the GeoNames city centroid and MIT's actual address is well within tolerance. No manual review needed.

**What ROR alone cannot do:** Confirm the shipping address is actually *on MIT's campus* (vs. a random house in Cambridge). For that, you'd need either:
- **Campus polygon** from OpenStreetMap (the `way` for MIT's campus boundary)
- **Street-level geocoding** to verify the address is a known MIT building

For most KYC purposes, city-level match + institutional email verification (`@mit.edu`, which ROR provides via the `domains` field) is sufficient.

---

### Example B -- Flag for Review

**Scenario:** Same researcher claims MIT affiliation but ships to:
> 123 Main St, Somerville, MA 02144

**Step 1: Resolve institution via ROR** (same as above)

```
-> location: Cambridge, MA, US
```

**Step 2: Geocode the shipping address**

```
123 Main St, Somerville, MA 02144
-> lat: 42.3876, lng: -71.0995
-> city: Somerville
-> state: MA
-> country: US
```

**Step 3: Compare**

| Check | ROR data | Shipping address | Match? |
|---|---|---|---|
| Country | US | US | Yes |
| State/subdivision | MA | MA | Yes |
| City | Cambridge | **Somerville** | **NO** |
| Distance (lat/lng) | 42.375, -71.106 | 42.388, -71.100 | ~1.5 km |

**The problem:** City-level matching **catches this** -- Cambridge != Somerville. The order would be flagged for manual review.

But notice the irony: the geographic distance (~1.5 km) is *smaller* than Example A (~2.0 km). Somerville is immediately adjacent to Cambridge. Many MIT researchers live in Somerville. A rigid city-name check would flag a perfectly legitimate shipment.

**What happens at different matching levels:**

| Strategy | Result | Notes |
|---|---|---|
| **Country only** | Pass | Too loose -- misses most diversion |
| **State/subdivision** | Pass | Too loose for KYC |
| **City name** | **FLAG** | Catches this, but high false-positive rate in metro areas |
| **Distance radius (e.g. 25km)** | Pass | Somerville is ~1.5km from Cambridge centroid |
| **Campus polygon** | FLAG | 123 Main St, Somerville is not on MIT's campus |

**Recommendation for KYC pipeline:**

Use a **tiered approach**:
1. **Country + subdivision match** as the first gate (reject obvious mismatches immediately)
2. **Distance radius** (e.g., 25-50 km from ROR lat/lng) as the second gate -- catches shipments to another state while allowing adjacent-city deliveries
3. **City-name mismatch** as a soft flag -- log it, but don't auto-reject. Many legitimate deliveries go to adjacent municipalities
4. **Email domain verification** as an independent signal -- if the customer has a verified `@mit.edu` email, the Somerville address is much more likely legitimate (researcher shipping to home)

---

## 4. ROR API Characteristics

| Property | Value |
|---|---|
| Auth required | No |
| Rate limits | Undocumented, but generous for testing. Production use should add courtesy delays. |
| Response time | 2-50 ms (fast) |
| Result ordering | Relevance-ranked; exact matches come first |
| Total organizations | ~110,000 |
| Coverage gaps | Community labs, startups, individuals, military/intelligence |
| Update frequency | Regular curation; records show `last_modified` dates through 2025-2026 |
| Cross-references | GRID, ISNI, Wikidata, Crossref Funder Registry |

## 5. Implications for KYC Pipeline Design

**What ROR gives you:**
- Canonical institution identity (deduplicate "MIT" / "Massachusetts Institute of Technology" / "Instituto Tecnologico de Massachusetts")
- City-level geolocation via GeoNames
- Organization type classification (education, company, nonprofit, etc.)
- Email domain for independent verification
- Cross-reference IDs to link to other databases

**What ROR does NOT give you:**
- Street addresses or campus boundaries
- Individual researcher verification
- Coverage of non-research entities (community labs, individuals, shell companies)
- Risk scoring or sanctions-list status

**Supplementary data sources needed:**
- **GeoNames API** (free, using the `geonames_id` from ROR) -- can get administrative boundaries, nearby places, postal codes
- **OpenStreetMap / Nominatim** -- campus polygons, building-level geocoding
- **Google Maps / Mapbox Geocoding** -- shipping address -> lat/lng conversion
- **Institutional email verification** -- confirm `@mit.edu` actually works / belongs to customer
- **Sanctions/export-control lists** -- BIS Entity List, SDN list, etc. (ROR does not cover this)
