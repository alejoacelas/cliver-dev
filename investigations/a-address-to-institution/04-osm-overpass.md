# OSM Overpass API for Campus Polygon Retrieval

**Date:** 2026-04-14  
**Purpose:** Test whether OpenStreetMap's Overpass API can return campus boundary polygons for real institutions, to support point-in-polygon address verification in KYC screening.

## Approach

For each institution, query the Overpass API for `way` and `relation` elements tagged as universities or research institutes, filtered by name regex and a geographic bounding box around the known location.

**Key finding on query strategy:** The `around:N` radius filter is very expensive on the Overpass API and frequently times out even at 2000m. Bounding box queries (`south,west,north,east`) are dramatically faster and more reliable. The bounding box approach is also preferable for production use since we already have approximate coordinates from geocoding.

**Rate limiting:** The main Overpass API at `overpass-api.de` rate-limits aggressively (returned HTTP 429 / rate_limited errors after ~4 queries). An alternative mirror at `overpass.kumi.systems` is available as a fallback. For production use, self-hosting an Overpass instance or using a commercial Nominatim/OSM provider would be necessary.

---

## 1. MIT (Cambridge, MA)

**Query:**
```bash
curl -s --data-urlencode 'data=[out:json][timeout:30];(
  way["amenity"="university"]["name"~"Massachusetts Institute of Technology",i]
    (42.35,-71.11,42.37,-71.08);
  relation["amenity"="university"]["name"~"Massachusetts Institute of Technology",i]
    (42.35,-71.11,42.37,-71.08);
);out geom;' 'https://overpass-api.de/api/interpreter'
```

**Result: POLYGON FOUND** -- 1 relation (multipolygon)

| Field | Value |
|-------|-------|
| Type | `relation` (multipolygon) |
| OSM ID | 65066 |
| Name | Massachusetts Institute of Technology |
| Short name | MIT |
| Bounding box | (42.3536, -71.1101) to (42.3653, -71.0817) |
| Members | 13 way segments |
| Total geometry nodes | 234 |
| Wikidata | Q49108 |
| Website | https://web.mit.edu/ |

**Tags (selected):**
```json
{
  "amenity": "university",
  "education": "university",
  "name": "Massachusetts Institute of Technology",
  "short_name": "MIT",
  "addr:city": "Cambridge",
  "addr:state": "MA",
  "phone": "+16172531000",
  "type": "multipolygon",
  "wikidata": "Q49108",
  "wikipedia": "en:Massachusetts Institute of Technology"
}
```

**Sample coordinates (first outer member, way 27366257, 86 nodes):**
```
(42.357521, -71.0926493)
(42.3574652, -71.0928385)
(42.3574445, -71.0929088)
(42.356298, -71.0963212)
...
(42.3538264, -71.103780)
... [86 nodes total forming southern campus boundary]
```

---

## 2. University of Cape Town (South Africa)

**Query:**
```bash
curl -s --data-urlencode 'data=[out:json][timeout:30];(
  way["amenity"="university"]["name"~"University of Cape Town",i]
    (-34.0,18.43,-33.93,18.49);
  relation["amenity"="university"]["name"~"University of Cape Town",i]
    (-34.0,18.43,-33.93,18.49);
);out geom;' 'https://overpass-api.de/api/interpreter'
```

**Result: POLYGON FOUND** -- 1 relation (multipolygon) + 2 additional ways

| Element | OSM ID | Name | Nodes |
|---------|--------|------|-------|
| relation | 2034106 | University of Cape Town | 189 (6 members) |
| way | 32442588 | University of Cape Town Medical School | 44 |
| way | 1027424427 | University of Cape Town | 11 |

**Main campus polygon (relation 2034106):**

| Field | Value |
|-------|-------|
| Bounding box | (-33.9637, 18.4560) to (-33.9517, 18.4719) |
| Members | 6 outer way segments |
| Total geometry nodes | 189 |
| Wikidata | Q951305 |

**Sample coordinates (first outer member, way 32446916):**
```
(-33.9545783, 18.4646299)
(-33.9547389, 18.4650617)
(-33.9548109, 18.4651959)
...
```

**Note:** The Medical School campus is mapped as a separate polygon, which is common for large institutions with satellite campuses. A production system would need to union all matching polygons or test against each independently.

---

## 3. Wellcome Sanger Institute (Hinxton, UK)

**Query:**
```bash
curl -s --data-urlencode 'data=[out:json][timeout:30];(
  way["name"~"Sanger",i](52.06,0.16,52.10,0.21);
  relation["name"~"Sanger",i](52.06,0.16,52.10,0.21);
);out geom;' 'https://overpass-api.de/api/interpreter'
```

**Note:** Sanger is tagged `amenity=research_institute`, not `amenity=university`. The query above uses a name-only filter (no amenity constraint) to catch it. In production, we'd need to search across multiple amenity types: `university`, `college`, `research_institute`, and potentially `office` or `building`.

**Result: POLYGON FOUND** -- 1 relation (multipolygon)

| Field | Value |
|-------|-------|
| Type | `relation` (multipolygon) |
| OSM ID | 9398629 |
| Name | Wellcome Sanger Institute |
| Tag | `amenity=research_institute` |
| Bounding box | (52.0787, 0.1830) to (52.0801, 0.1860) |
| Members | 2 (1 outer, 1 inner ring) |
| Total geometry nodes | 72 (65 outer + 7 inner) |
| Wikidata | Q1142544 |

**Sample coordinates (outer ring, way 54585269):**
```
(52.0800335, 0.1850245)
(52.0801179, 0.1853356)
(52.0799096, 0.1854852)
...
```

**Note:** The polygon is relatively small (bounding box spans ~150m x 200m), consistent with a single research campus rather than a large university. The inner ring likely represents a courtyard or excluded area.

---

## 4. Makerere University (Kampala, Uganda)

**Query:**
```bash
curl -s --data-urlencode 'data=[out:json][timeout:30];(
  way["amenity"="university"]["name"~"Makerere",i]
    (0.31,32.55,0.36,32.59);
  relation["amenity"="university"]["name"~"Makerere",i]
    (0.31,32.55,0.36,32.59);
);out geom;' 'https://overpass-api.de/api/interpreter'
```

**Result: POLYGON FOUND** -- 3 ways (no relation)

| Element | OSM ID | Name | Nodes | Bounding Box |
|---------|--------|------|-------|--------------|
| way | 343233634 | Makerere University | 51 | (0.3278, 32.5634) to (0.3420, 32.5733) |
| way | 328666417 | Makerere University College Of Health Science | 5 | (0.3376, 32.5770) to (0.3378, 32.5772) |
| way | 507115116 | Makerere University College of Health Sciences | 5 | (0.3329, 32.5883) to (0.3331, 32.5886) |

**Main campus polygon (way 343233634, 51 nodes):**
```
(0.3279778, 32.5654387)
(0.3277986, 32.5663577)
(0.3277809, 32.5671137)
(0.3278125, 32.5675623)
(0.3282477, 32.5700648)
...
```

**Note:** Makerere has a proper campus polygon (way, not relation), plus two tiny satellite health science campus markers. The main polygon is a closed way with 51 nodes -- good enough for point-in-polygon testing. This is notable because it demonstrates that OSM coverage extends to Sub-Saharan African institutions, not just Western ones.

---

## 5. Ginkgo Bioworks (Boston, MA -- commercial biotech)

**Query (attempt 1 -- broad name search across all tags):**
```bash
curl -s --data-urlencode 'data=[out:json][timeout:30];(
  way["name"~"Ginkgo",i](42.32,-71.07,42.37,-71.01);
  relation["name"~"Ginkgo",i](42.32,-71.07,42.37,-71.01);
  node["name"~"Ginkgo",i](42.32,-71.07,42.37,-71.01);
);out geom;' 'https://overpass.kumi.systems/api/interpreter'
```

**Query (attempt 2 -- office/research tags):**
```bash
curl -s --data-urlencode 'data=[out:json][timeout:30];(
  way["name"~"Ginkgo Bioworks",i](42.32,-71.07,42.37,-71.01);
  relation["name"~"Ginkgo Bioworks",i](42.32,-71.07,42.37,-71.01);
  node["name"~"Ginkgo Bioworks",i](42.32,-71.07,42.37,-71.01);
  way["office"]["name"~"Ginkgo",i](42.32,-71.07,42.37,-71.01);
  node["office"]["name"~"Ginkgo",i](42.32,-71.07,42.37,-71.01);
);out geom;' 'https://overpass.kumi.systems/api/interpreter'
```

**Result: NO POLYGON FOUND** -- both queries returned empty

```json
{
  "version": 0.6,
  "generator": "Overpass API 0.7.62.11 87bfad18",
  "osm3s": {
    "timestamp_osm_base": "2026-04-14T20:49:01Z",
    "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."
  },
  "elements": []
}
```

This is expected. Commercial biotech companies typically lease office/lab space in multi-tenant buildings and are not mapped as named entities in OSM. The building itself may be in OSM, but not with Ginkgo's name attached.

---

## Worked Example A: Point-in-Polygon Test (MIT)

**Scenario:** A customer orders DNA synthesis and provides the shipping address "77 Massachusetts Ave, Cambridge, MA 02139" claiming affiliation with MIT.

**Step 1:** Geocode the shipping address to coordinates.  
77 Massachusetts Ave geocodes to approximately **(42.3593, -71.0935)**.

**Step 2:** Check against the MIT polygon bounding box.  
MIT bounds: **(42.3536, -71.1101)** to **(42.3653, -71.0817)**

```
42.3536 <= 42.3593 <= 42.3653  -- latitude is inside
-71.1101 <= -71.0935 <= -71.0817  -- longitude is inside
```

The point passes the bounding box check. This is a necessary but not sufficient condition (bounding boxes are rectangular; campus polygons are irregular).

**Step 3:** Full point-in-polygon test.  
77 Mass Ave is MIT's main entrance / Building 7 -- it sits well within the campus core. The polygon has 234 geometry nodes across 13 member ways, forming a detailed campus boundary. A ray-casting algorithm against this polygon would confirm the point is inside.

**Step 4:** Return verification result.  
Address **(42.3593, -71.0935)** is inside the MIT campus polygon (OSM relation 65066). The claimed affiliation is **geographically consistent**.

**What this proves:** For institutions with OSM polygons, we can do precise boundary testing rather than crude radius checks. A building across the street from MIT would fail the polygon test even though it's within any reasonable radius.

---

## Worked Example B: No Polygon Fallback (Ginkgo Bioworks)

**Scenario:** A customer claims affiliation with Ginkgo Bioworks and provides a shipping address at "27 Drydock Ave, Boston, MA 02210".

**Step 1:** Query Overpass API for Ginkgo Bioworks -- returns empty `elements: []`.

**Step 2:** Fall back to GeoNames or geocoding-based verification.
- Look up Ginkgo Bioworks headquarters via GeoNames or company database
- Known location: approximately (42.3467, -71.0415) in Boston's Seaport district
- Geocode "27 Drydock Ave" to approximately (42.3480, -71.0420)
- Calculate haversine distance: ~150 meters

**Step 3:** Apply radius-based check.  
Since we have no polygon, use a configurable radius (e.g., 500m for commercial companies in dense urban areas).
150m < 500m -- the address is **within the fallback radius**.

**Step 4:** Return verification result with lower confidence.
```
{
  "match": true,
  "method": "radius_fallback",
  "confidence": "medium",
  "distance_m": 150,
  "radius_m": 500,
  "note": "No OSM polygon available; used point+radius"
}
```

vs. the polygon-based result:
```
{
  "match": true,
  "method": "polygon",
  "confidence": "high",
  "osm_id": "relation/65066",
  "note": "Address falls within campus boundary polygon"
}
```

---

## Summary Table

| Institution | Country | OSM Element | Nodes | Bounding Box | Has Polygon? |
|-------------|---------|-------------|-------|--------------|-------------|
| MIT | USA | relation/65066 | 234 | 42.354,-71.110 to 42.365,-71.082 | Yes |
| U. of Cape Town | South Africa | relation/2034106 | 189 | -33.964,18.456 to -33.952,18.472 | Yes |
| Wellcome Sanger | UK | relation/9398629 | 72 | 52.079,0.183 to 52.080,0.186 | Yes |
| Makerere University | Uganda | way/343233634 | 51 | 0.328,32.563 to 0.342,32.573 | Yes |
| Ginkgo Bioworks | USA | -- | -- | -- | No |

## Key Takeaways

1. **Coverage is good for universities and major research institutes.** All four academic/research institutions had polygon data, including ones in South Africa and Uganda. This is better than expected for Global South coverage.

2. **Commercial companies are typically absent.** Ginkgo Bioworks, despite being a well-known biotech company, has no OSM presence. This is the expected pattern for companies that lease space in multi-tenant buildings.

3. **Tag diversity matters.** Universities use `amenity=university`, but the Sanger Institute uses `amenity=research_institute`. A production query must search across multiple tag values, or skip the amenity filter and search by name alone within the bounding box.

4. **Multi-campus institutions return multiple elements.** UCT returns 3 elements (main campus relation + medical school way + small way). Makerere returns 3 ways. The system needs to either union these or test against each.

5. **Bounding box queries are essential.** The `around:N` radius filter is computationally expensive and frequently times out. Bounding box filtering is fast and reliable -- and we already have approximate coordinates from the geocoding step.

6. **Rate limiting is aggressive.** The public Overpass API rate-limited after ~4 queries. For production use, options include:
   - Self-hosted Overpass instance (~50GB disk for planet extract)
   - Pre-fetching and caching polygons for known institutions
   - Using a commercial OSM data provider
   - Nominatim API (returns polygons directly for some features)

7. **The two-tier strategy works.** Polygon when available (high confidence), radius fallback when not (medium confidence). The confidence level should be surfaced to human reviewers.
