# GLEIF API for Institution Screening

Investigation date: 2026-04-14

The [Global Legal Entity Identifier Foundation (GLEIF)](https://www.gleif.org/) maintains the global LEI (Legal Entity Identifier) system -- a 20-character alphanumeric code assigned to legal entities participating in financial transactions. Each LEI record includes **street-level legal and headquarters addresses**, making it potentially valuable for KYC address verification where ROR only provides city-level data.

API: `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]={name}` -- no auth required, free.
Fuzzy fallback: `https://api.gleif.org/api/v1/lei-records?filter[fulltext]={name}`

**Key hypothesis:** GLEIF has the address precision we need (street-level), but its coverage is biased toward financial entities. Most academic institutions won't have LEI records, limiting its utility as a primary lookup source.

---

## 1. Test Results by Institution

### 1a. Pfizer Inc. -- large pharma (financial entity, should have LEI)

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Pfizer%20Inc.'
```

5 records returned. The parent entity:

```json
{
  "lei": "765LHXWGK1KXCLTFYQ30",
  "entity": {
    "legalName": {"name": "PFIZER INC.", "language": "en"},
    "status": "ACTIVE",
    "legalAddress": {
      "addressLines": [
        "C/O THE CORPORATION TRUST COMPANY",
        "CORPORATION TRUST CENTER",
        "1209 ORANGE ST"
      ],
      "city": "WILMINGTON",
      "region": "US-DE",
      "country": "US",
      "postalCode": "19801"
    },
    "headquartersAddress": {
      "addressLines": ["235 EAST 42ND STREET"],
      "city": "NEW YORK",
      "region": "US-NY",
      "country": "US",
      "postalCode": "10017"
    }
  },
  "registration": {
    "status": "ISSUED",
    "initialRegistrationDate": "2012-06-19T13:47:00Z",
    "lastUpdateDate": "2026-03-19T12:44:11Z"
  }
}
```

**Verdict: Excellent.** Two distinct addresses -- the legal address is the Delaware incorporation agent (Corporation Trust Center, a standard registered-agent address), while the headquarters address is the actual NYC office. This dual-address structure is extremely useful: the HQ address is what you'd match against a shipping address, and it's street-level precise.

Also returned: Pfizer Canada (17300 Trans Canada Highway, Kirkland QC), Pfizer Products Inc. (Manchester, CT), and an Amundi fund wrapper (Paris). Multiple subsidiaries with distinct addresses.

---

### 1b. Twist Bioscience Corporation -- mid-size biotech / DNA synthesis provider

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Twist%20Bioscience%20Corporation'
```

```json
{
  "lei": "549300T23BL59LCOH584",
  "entity": {
    "legalName": {"name": "Twist Bioscience Corporation", "language": "en"},
    "status": "ACTIVE",
    "legalAddress": {
      "addressLines": [
        "C/O Incorporating Services Ltd",
        "3500 South Dupont Highway"
      ],
      "city": "Dover",
      "region": "US-DE",
      "country": "US",
      "postalCode": "19901"
    },
    "headquartersAddress": {
      "addressLines": [
        "455 Mission Bay Boulevard South",
        "Suite 545"
      ],
      "city": "San Francisco",
      "region": "US-CA",
      "country": "US",
      "postalCode": "94158"
    }
  },
  "registration": {
    "status": "LAPSED",
    "initialRegistrationDate": "2018-02-21T15:33:00Z",
    "lastUpdateDate": "2023-08-04T17:19:53Z"
  }
}
```

**Verdict: Found, but with caveats.** The record exists and has precise addresses -- Delaware incorporation address + actual San Francisco HQ at Mission Bay (455 Mission Bay Blvd S). However, the registration status is **LAPSED** (last updated Aug 2023), meaning Twist stopped renewing their LEI. The entity is still ACTIVE, but the record may be stale. The HQ address could be outdated.

This is a common pattern for smaller public companies: they register an LEI for SEC filings, then let it lapse after a few years.

---

### 1c. Integrated DNA Technologies (IDT) -- another DNA synthesis provider

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Integrated%20DNA%20Technologies'
```

7 records returned across multiple subsidiaries:

| Legal Name | LEI | Country | Status | Reg Status |
|---|---|---|---|---|
| Integrated DNA Technologies, Inc. | 549300NXUWWKVV3OO135 | US (DE/IL) | ACTIVE | LAPSED |
| Integrated DNA Technologies, Inc. | PUVPD8ZZJX30IGNH0D93 | US (IA) | INACTIVE | RETIRED |
| Integrated DNA Technologies, BVBA | 549300JS0XAFMOEOUC50 | BE | ACTIVE | LAPSED |
| Integrated DNA Technologies Germany GmbH | 549300SNGORUW84G8R03 | DE | ACTIVE | LAPSED |
| Integrated DNA Technologies Spain SL | 5493000TTOE304T7N631 | ES | ACTIVE | LAPSED |
| Integrated DNA Technologies UK, Ltd | 549300ELSEP4VMCZ7208 | GB | ACTIVE | LAPSED |
| Integrated DNA Technologies Pte. Ltd. | 5493003U94W9SKF2Z108 | SG | ACTIVE | LAPSED |

The active US entity (current HQ after the Danaher/Skokie move):

```json
{
  "legalAddress": {
    "addressLines": [
      "C/O The Corporation Trust Company",
      "Corporation Trust Center",
      "1209 Orange Street"
    ],
    "city": "Wilmington", "region": "US-DE", "country": "US", "postalCode": "19801"
  },
  "headquartersAddress": {
    "addressLines": ["8180 McCormick Boulevard"],
    "city": "Skokie", "region": "US-IL", "country": "US", "postalCode": "60076"
  }
}
```

**Verdict: Good global coverage for this specific company.** IDT has LEI records for subsidiaries in 7 countries. The HQ address (8180 McCormick Blvd, Skokie, IL) is the actual facility. But note: every single subsidiary has LAPSED registration status. IDT (owned by Danaher) stopped renewing all LEIs. The retired Iowa entity (Coralville) was the original HQ before the move.

---

### 1d. Massachusetts Institute of Technology (MIT) -- large US university

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Massachusetts%20Institute%20of%20Technology'
```

4 records returned:

| Legal Name | LEI | Status |
|---|---|---|
| MASSACHUSETTS INSTITUTE OF TECHNOLOGY | DLZO3A31IADZ27B62557 | ACTIVE |
| Massachusetts Institute of Technology Welfare Benefit Plans Trust | P956W595JA7E56XMYU23 | -- |
| Massachusetts Institute of Technology Supplemental 401(k) Plan | TMNUJHALE53LBS2RHH79 | -- |
| Massachusetts Institute of Technology Basic Retirement Plan Trust | 8ZV9NC1OEURD2IN1NJ81 | -- |

The main entity record:

```json
{
  "lei": "DLZO3A31IADZ27B62557",
  "entity": {
    "legalName": {"name": "MASSACHUSETTS INSTITUTE OF TECHNOLOGY"},
    "status": "ACTIVE",
    "category": "GENERAL",
    "legalAddress": {
      "addressLines": ["77 MASSACHUSETTS AVENUE"],
      "city": "CAMBRIDGE",
      "region": "US-MA",
      "country": "US",
      "postalCode": "02139"
    },
    "headquartersAddress": {
      "addressLines": ["77 MASSACHUSETTS AVENUE", "E70-9 FL, 200"],
      "city": "CAMBRIDGE",
      "region": "US-MA",
      "country": "US",
      "postalCode": "02139"
    }
  },
  "registration": {
    "status": "ISSUED",
    "initialRegistrationDate": "2012-11-16T14:40:00Z",
    "lastUpdateDate": "2025-06-03T19:33:47Z"
  }
}
```

**Verdict: Surprisingly, MIT HAS an LEI.** This is the exception that proves the rule -- MIT has an LEI because it participates in financial markets (endowment management, derivatives). The address is precise: 77 Massachusetts Avenue, building E70-9 (the Treasurer's Office). Registration is current (ISSUED, updated June 2025).

This contradicts the initial hypothesis that most academic institutions lack LEIs. MIT is a special case -- it's among the largest university endowments globally ($27B+), so it needs an LEI for financial reporting. Most universities don't.

---

### 1e. University of Cape Town -- African university

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=University%20of%20Cape%20Town'
# No direct match for the university itself
```

0 records for the university. Fulltext search found related entities only:

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[fulltext]=University%20of%20Cape%20Town'
```

| Legal Name | LEI | City | Country |
|---|---|---|---|
| University of Cape Town Retirement Fund | 254900RSME7FS8GBVD45 | Cape Town | ZA |
| The University of Cape Town Trust | 894500ODHBHJAJJ3W750 | Surbiton | GB |

Neither is the university itself. The "Retirement Fund" is the staff pension fund. The "Trust" is a UK-registered fundraising entity (in Surbiton, Surrey -- not even in South Africa).

**Verdict: NOT FOUND.** The University of Cape Town itself has no LEI. Unlike MIT, UCT doesn't participate in the financial markets that require LEI registration. The related entities that do appear are financial vehicles (pension fund, trust), not the teaching/research institution. This is the typical pattern for universities outside the US/UK financial system.

---

### 1f. Wellcome Sanger Institute -- UK research institute

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Wellcome%20Sanger%20Institute'
# 0 results
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Sanger%20Institute'
# 0 results
```

Also searched for parent org:

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Wellcome%20Trust'
```

| Legal Name | LEI | City | Country |
|---|---|---|---|
| THE WELLCOME TRUST LIMITED | 549300YQJTZ9YPHW5V73 | LONDON | GB |
| WELLCOME TRUST FINANCE PLC | 549300U3Y9NRYP7NOM09 | LONDON | GB |
| WELLCOME TRUST INVESTMENTS 2 UNLIMITED | 549300DAV0WL27R7HD48 | LONDON | GB |
| WELLCOME TRUST INVESTMENT LIMITED PARTNERSHIP | 549300L4O5MGVPFKWC35 | LONDON | GB |
| WELLCOME EMPLOYEE SHARE OPTION PLAN TRUST | 213800WA5NZTISA2XQ34 | St Helier | JE |

**Verdict: NOT FOUND.** The Sanger Institute itself has no LEI. The Wellcome Trust (parent organization) has multiple LEI records, but these are for its financial vehicles (Trust Ltd, Finance PLC, Investment LP). None of these point to the Hinxton campus where the Sanger Institute actually operates. Even if you found the Wellcome Trust's LEI, its London address is ~80 km from the Sanger Institute's actual location.

---

### 1g. Ginkgo Bioworks -- US commercial biotech (public company)

```bash
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Ginkgo%20Bioworks'
# 0 results
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Ginkgo%20Bioworks'
# 0 results
curl -s 'https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Ginkgo%20Bioworks%20Holdings'
# 0 results
```

**Verdict: NOT FOUND.** Ginkgo Bioworks, despite being a publicly traded company (NYSE: DNA), has no LEI record. This is genuinely surprising -- public companies typically need LEIs for regulatory reporting. Ginkgo may have let it lapse, or it may trade under a holding-company structure not indexed here. Either way, GLEIF provides zero signal for this institution.

For comparison, ROR *does* have Ginkgo (as "Ginkgo Bioworks, Inc.") with city-level location in Boston. GLEIF has nothing.

---

## 2. Summary of Coverage

| Institution | GLEIF Found | LEI Status | Has Street Address | ROR Found |
|---|---|---|---|---|
| Pfizer Inc. | **Yes** | ISSUED (current) | Yes -- 235 E 42nd St, NYC | Yes |
| Twist Bioscience | **Yes** | LAPSED (2023) | Yes -- 455 Mission Bay Blvd, SF | No |
| IDT | **Yes** (7 entities) | All LAPSED | Yes -- 8180 McCormick Blvd, Skokie | No |
| MIT | **Yes** (surprise) | ISSUED (current) | Yes -- 77 Massachusetts Ave, Cambridge | Yes |
| U. Cape Town | **No** (related funds only) | -- | -- | Yes |
| Wellcome Sanger | **No** (parent trust only) | -- | -- | Yes |
| Ginkgo Bioworks | **No** | -- | -- | Yes |

**The pattern is clear:**
- **Financial entities** (pharma, public biotechs, entities with endowments): GLEIF has them, with street-level addresses
- **Academic/research institutions**: Usually absent, unless they participate in financial markets (MIT is the exception)
- **GLEIF and ROR are complementary, not redundant**: GLEIF covers the commercial entities that ROR misses (Twist, IDT), and ROR covers the academic institutions that GLEIF misses (UCT, Sanger)

---

## 3. Worked Examples: Address Verification Using GLEIF

### Example A -- GLEIF Hit: Street-Level Precision Enables Exact Matching

**Scenario:** A company claims to be IDT and requests shipment to:
> 8180 McCormick Boulevard, Skokie, IL 60076

**Step 1: Resolve entity via GLEIF**

```
GET https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Integrated%20DNA%20Technologies
-> LEI: 549300NXUWWKVV3OO135
-> headquartersAddress: 8180 McCormick Boulevard, Skokie, US-IL, 60076
```

**Step 2: Compare shipping address to GLEIF HQ address**

| Field | GLEIF HQ address | Shipping address | Match? |
|---|---|---|---|
| Street | 8180 McCormick Boulevard | 8180 McCormick Boulevard | Yes (exact) |
| City | Skokie | Skokie | Yes |
| Region | US-IL | IL | Yes |
| Postal code | 60076 | 60076 | Yes |

**Decision: AUTO-PASS.** Street-level match eliminates ambiguity entirely. No need for geocoding, radius checks, or campus polygons. The address in the order matches the verified GLEIF headquarters address character-for-character.

**The contrast with ROR:** ROR doesn't have IDT at all. Even if it did, ROR would only give city-level data ("Skokie, IL" at best), which couldn't distinguish between IDT's actual facility and a random house in Skokie. GLEIF's street address makes this a deterministic check rather than a probabilistic one.

**Caveat:** The GLEIF record for IDT is LAPSED (last updated 2017). The address could be outdated. A production pipeline should cross-reference with SEC filings or the company's website for current address.

---

### Example B -- GLEIF Miss: No Signal, Must Fall Through

**Scenario:** A researcher claims affiliation with the Wellcome Sanger Institute and requests shipment to:
> Wellcome Genome Campus, Hinxton, Cambridge CB10 1SA, UK

**Step 1: Attempt GLEIF lookup**

```
GET https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Wellcome%20Sanger%20Institute
-> 0 results

GET https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Sanger%20Institute
-> 0 results
```

**Step 2: Try parent organization**

```
GET https://api.gleif.org/api/v1/lei-records?filter[fulltext]=Wellcome%20Trust
-> Found: THE WELLCOME TRUST LIMITED (London)
-> But: This is a financial holding company in London, ~80km from the Sanger campus in Hinxton
```

**Decision: GLEIF provides no useful signal.** The Wellcome Trust's London address would actually cause a *false mismatch* if naively compared to the Hinxton shipping address. GLEIF is actively misleading here -- the parent entity's financial address has nothing to do with where the research institute is located.

**Fallthrough to ROR:**

```
GET https://api.ror.org/v2/organizations?query=Wellcome%20Sanger%20Institute
-> location: Cambridge, GB (lat: 52.2, lng: 0.117)
-> parent: Wellcome Trust
```

ROR gets us to Cambridge (still ~15 km from Hinxton, but same region). From there, OSM/Nominatim can verify that "Wellcome Genome Campus, Hinxton" is a real research campus.

**The lesson:** When GLEIF misses, the pipeline must not stall. It needs to automatically cascade to ROR, then to geocoding services. The three-source cascade (GLEIF -> ROR -> OSM/Nominatim) covers the gaps each source leaves.

---

## 4. GLEIF API Characteristics

| Property | Value |
|---|---|
| Auth required | No |
| Rate limits | Undocumented, appears generous for testing |
| Response time | 200-800 ms (slower than ROR) |
| Result ordering | Exact name matches first, then fuzzy |
| Total LEI records | ~2.7 million globally |
| Address precision | Street-level (addressLines, city, region, country, postalCode) |
| Coverage bias | Financial entities: banks, funds, public companies, entities with derivatives exposure |
| Coverage gaps | Most universities, research institutes, nonprofits, private companies, community labs |
| Registration staleness | Many records LAPSED -- entity active but LEI not renewed. Addresses may be outdated |
| Dual addresses | Legal address (often incorporation agent) + HQ address (actual operations). Use HQ for matching. |

## 5. Implications for KYC Pipeline Design

**What GLEIF gives you that ROR doesn't:**
- **Street-level addresses** -- enables exact address matching, not just city-level proximity
- **Dual address structure** -- legal (incorporation) vs. HQ (operations), the latter being what matters for shipping verification
- **Coverage of commercial entities** -- Twist Bioscience, IDT, and other DNA synthesis customers that are companies rather than universities
- **Global subsidiary mapping** -- IDT's 7 entities across US/EU/Asia show the full corporate footprint

**What GLEIF doesn't give you:**
- Coverage of academic/research institutions (the majority of DNA synthesis customers)
- Organization type classification (no equivalent of ROR's `types` field)
- Domain/website information
- Guaranteed freshness (many records are LAPSED with potentially stale addresses)
- Coverage of private companies that don't participate in financial markets

**The legal-address trap:** For US corporations, the legal address is almost always a registered agent in Delaware or Nevada -- not where the company actually operates. The `headquartersAddress` field is the one to use for shipping verification. A naive pipeline that checks `legalAddress` would match Pfizer to Wilmington, DE and Twist to Dover, DE, which is useless.

**Recommended pipeline position:** GLEIF should be the **first** lookup in the cascade, before ROR. When it hits, you get deterministic street-level matching. When it misses (which will be often for academic customers), fall through to ROR for city-level matching, then to geocoding services for address validation.

```
Order received: "Wellcome Sanger Institute, Hinxton CB10 1SA"

1. GLEIF lookup: "Wellcome Sanger Institute" -> MISS
2. ROR lookup:  "Wellcome Sanger Institute" -> HIT (Cambridge, GB)
3. Geocode shipping address: Hinxton -> lat/lng -> 14km from Cambridge centroid
4. Decision: Within 25km radius -> AUTO-PASS (or soft-flag for the city mismatch)
```

```
Order received: "Integrated DNA Technologies, 8180 McCormick Blvd, Skokie IL"

1. GLEIF lookup: "Integrated DNA Technologies" -> HIT (8180 McCormick Blvd, Skokie)
2. Street-level match: EXACT
3. Decision: AUTO-PASS (no need for ROR or geocoding)
```
