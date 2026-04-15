# m05-ror-gleif-canonical — Implementation v2

- **measure:** M05 — shipping-institution-association
- **name:** ROR / GLEIF / Companies House canonical address cross-reference + OSM campus polygon augmentation
- **summary:** For a claimed institution, fetch its canonical address(es) from ROR (research organizations), GLEIF (Legal Entity Identifier records), and Companies House (UK only). **v2 augmentation:** for institutions where ROR provides only city-level location, augment with OpenStreetMap campus polygons (queried via Overpass API using `amenity=university` way/relation geometries) and/or GeoNames point coordinates (from the `geonames_id` in the ROR record). Geocode the customer-provided shipping/billing address; test whether it falls inside the OSM campus polygon or within a configurable radius of the GeoNames point. Mismatch beyond tolerance raises a flag. Absence of any canonical record is also a flag.

## Changes from v1 addressing Critical Finding C1 (ROR v2 city-level-only)

**C1 said:** ROR v2 removed street-level addresses; `locations[]` gives only city/country/lat/lng via GeoNames. The dominant attacker strategy is same-city addresses (CMRAs, virtual offices in the institution's metro), which pass a city-level check.

**v2 response — three-layer resolution strategy:**

1. **GLEIF street-level (where available):** GLEIF LEI records include `entity.legalAddress` and `entity.headquartersAddress` with street, city, postal code. But GLEIF coverage is structurally low for the relevant institution types. As of late 2025, the total active LEI population is ~2.93 million entities globally [source](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025). LEIs are required for entities in regulated financial markets; most universities, research institutes, and small biotech labs do not have LEIs. [best guess: <5% of US/EU research institutions (universities, national labs) have LEIs; coverage is higher for large pharma/CROs that trade derivatives or securities, perhaps 30-50% of large commercial biotech]. Net: GLEIF provides street-level for a small minority of the customer base.

2. **Companies House street-level (UK only):** Returns `registered_office_address` with street-level fields. The UK register has ~5.45 million entities as of December 2025 [source](https://www.gov.uk/government/statistics/incorporated-companies-in-the-uk-october-to-december-2025/incorporated-companies-in-the-uk-october-to-december-2025). Useful for the UK customer subset but does not scale globally. Other national company registries (DE Handelsregister, FR Infogreffe, etc.) could extend this but require per-country integrations — addressed by m09-corp-registry-stack.

3. **ROR GeoNames point + OSM campus polygon (new in v2):** This is the primary resolution improvement for research institutions.

   - **GeoNames point coordinates from ROR:** Each ROR record's `locations[].geonames_id` links to a GeoNames entry. GeoNames stores lat/lng for each entry. For entries with feature code `S.UNIV` (spot/building: university) or `S.SCH` (school), the coordinates represent the institution's physical location, not the city centroid — they are typically placed at or near the main campus [best guess: GeoNames contributors place university entries at the campus location; accuracy varies but is generally within 200-500m of the main campus center for well-known institutions in OECD countries]. This is substantially more precise than using the city centroid. However, GeoNames entries are point locations, not polygons — they don't capture campus extent. A 500m radius around the GeoNames point captures the main campus of a small institution but misses satellite campuses or large distributed campuses. [source for GeoNames feature codes](https://download.geonames.org/export/dump/featureCodes_en.txt); [source for ROR location structure](https://ror.readme.io/docs/ror-data-structure).

   - **OpenStreetMap campus polygon (new augmentation):** OSM maps university campuses as `amenity=university` ways (closed polygons) or multipolygon relations. These represent the actual campus footprint — not a point, not a city. The Overpass API can retrieve these polygons given an institution name or a bounding box around the GeoNames point [source](https://wiki.openstreetmap.org/wiki/Tag:amenity=university). The implementation queries: `[out:json]; area["amenity"="university"]["name"~"{institution_name}"]->.a; way(area.a); out geom;` (or equivalent relation query). This returns the campus boundary polygon. The provider then tests whether the customer's geocoded shipping address falls inside the polygon (standard point-in-polygon test).

   - **Coverage estimate for OSM campus polygons:** OSM has good coverage for universities in OECD countries (US, EU, UK, JP, AU, CA). Coverage is weaker for institutions in sub-Saharan Africa, Central Asia, and parts of South America. [best guess: >80% of US/EU universities with ROR records have an `amenity=university` polygon in OSM; <50% for institutions in low-mapping-activity regions]. ROR lists ~120,000+ organizations [source](https://ror.org/); the overlap with OSM-mapped institutions is not documented but can be empirically measured by matching ROR names against OSM names within the GeoNames city.

   - **Effective resolution per source:**

     | Source | Resolution | Coverage of SOC customer base |
     |---|---|---|
     | GLEIF | Street-level | Low (<5% of research institutions) [best guess] |
     | Companies House | Street-level | UK entities only |
     | GeoNames point (via ROR) | ~200-500m campus-center point | ~100% of ROR-listed institutions (all have geonames_id) |
     | OSM campus polygon | Campus footprint (10m–1km boundary) | ~60-80% of OECD research institutions [best guess]; lower elsewhere |
     | City-level fallback (ROR city) | City (~5-20km) | 100% of ROR-listed institutions |

   - **Matching cascade:** For each institution, try sources in order of resolution: (1) GLEIF street match, (2) Companies House street match, (3) OSM polygon point-in-polygon, (4) GeoNames point + radius, (5) city-level fallback. Use the highest-resolution match available. Flag the resolution level used in the audit record.

## external_dependencies

- **ROR API v2** — `https://api.ror.org/v2/organizations` — free, no auth. [source](https://ror.readme.io/docs/basics)
- **GLEIF LEI Look-up API** — free, no auth. [source](https://www.gleif.org/en/lei-data/gleif-api)
- **UK Companies House Public Data API** — free, API key required, 600 req/5min. [source](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting)
- **OpenStreetMap Overpass API** — free, no auth, rate-limited by server capacity. Public instances: `https://overpass-api.de/api/interpreter`, `https://lz4.overpass-api.de/api/interpreter`. Fair-use policy; heavy users should run a private Overpass instance. [source](https://wiki.openstreetmap.org/wiki/Overpass_API)
- **GeoNames web services** — free for up to 20,000 credits/day (1 credit per request); premium accounts available at $480/year for higher limits. [source](http://www.geonames.org/export/web-services.html)
- **Geocoder** for distance comparison (Nominatim self-hosted or Google Geocoding API).
- **Point-in-polygon library** (e.g., Shapely/GEOS for Python, Turf.js for JS).

## endpoint_details

- **ROR v2:** Same as v1. Endpoint: `https://api.ror.org/v2/organizations?query={institution_name}`. No auth. Rate limit: none documented. Free. v2 provides `locations[].geonames_id` and `geonames_details` (city, country, lat/lng) but **no street-level address**. [source](https://ror.org/blog/2024-04-15-announcing-ror-v2/)

- **GLEIF LEI Look-up:** Same as v1. Endpoint: `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]={name}`. Returns `entity.legalAddress` and `entity.headquartersAddress` with street-level fields. Free, no auth. [source](https://www.gleif.org/en/lei-data/gleif-api)

- **Companies House:** Same as v1. Returns `registered_office_address` with street-level. 600 req/5min. [source](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting)

- **OpenStreetMap Overpass API (new in v2):**
  - Endpoint: `https://overpass-api.de/api/interpreter` (public) or self-hosted.
  - Auth: none.
  - Rate limit: server-dependent; public instances throttle at ~2 req/sec sustained with 10k timeout. [unknown — searched for: "Overpass API rate limit requests per second", "overpass-api.de throttle policy"]
  - Free (OSM data is ODbL-licensed; derived databases must attribute).
  - Query: `[out:json][timeout:25]; (way["amenity"="university"]["name"~"{name}",i](around:5000,{lat},{lng}); relation["amenity"="university"]["name"~"{name}",i](around:5000,{lat},{lng});); out geom;`
  - Returns: polygon nodes with lat/lng forming the campus boundary.
  - **ToS:** ODbL requires attribution. Using OSM data for internal compliance screening is permitted; publishing derived data requires share-alike. [source](https://wiki.openstreetmap.org/wiki/Overpass_API)

- **GeoNames web service:**
  - Endpoint: `http://api.geonames.org/getJSON?geonameId={id}&username={user}` — retrieves full record for a GeoNames ID, including lat/lng, feature code, and administrative hierarchy.
  - Auth: registered username (free tier).
  - Rate limit: 20,000 credits/day free; 1 credit per request. [source](http://www.geonames.org/export/web-services.html)
  - Free (premium at $480/year for higher limits).

## fields_returned

**Same as v1 for ROR, GLEIF, Companies House** (see v1 for full field lists).

**New — OpenStreetMap Overpass response:**
- Way/relation ID, `tags.name`, `tags.amenity`, `tags.wikidata` (if present), `geometry` (array of `{lat, lon}` nodes forming the polygon boundary). [source](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)

**New — GeoNames getJSON response (via geonames_id from ROR):**
- `geonameId`, `name`, `toponymName`, `lat`, `lng`, `fcl` (feature class), `fcode` (feature code, e.g., `UNIV`), `countryCode`, `adminCode1`, `adminName1`, `population`, `timezone`. [source](http://www.geonames.org/export/web-services.html)

## marginal_cost_per_check

- ROR, GLEIF, Companies House: **$0** (all free APIs). Same as v1.
- GeoNames: $0 at free tier (well within 20k/day for most providers). Premium: ~$0.001/check amortized.
- Overpass API: $0 (but should self-host for production; hosting cost ~$50-100/month for a dedicated instance). [best guess: based on OSM Overpass self-hosting guides]
- Geocoding: ~$0.005 (Google) or $0 (self-hosted Nominatim).
- Point-in-polygon computation: negligible.
- **Total marginal: <$0.02/check** (v1 was <$0.01; slight increase from GeoNames/Overpass calls).
- **setup_cost:** v1 estimate + ~1 additional engineer-week for OSM/GeoNames integration, polygon caching, and the matching cascade logic. Total: ~2-3 engineer-weeks.

## manual_review_handoff

**Updated from v1 to reflect the resolution cascade:**

When `canonical_address_mismatch` fires:
1. Reviewer sees which resolution level triggered the mismatch (street/polygon/point/city).
2. **Street-level mismatch (GLEIF/Companies House):** strongest signal. Reviewer checks for known satellite offices.
3. **Polygon mismatch (OSM):** customer address is outside the campus polygon. Reviewer checks whether the address is at a known satellite campus, hospital, or research park not captured by the OSM polygon. Cross-ref m05-google-places-campus.
4. **GeoNames point mismatch (>500m from campus center, no OSM polygon available):** moderate signal. Reviewer applies wider tolerance and checks institution website "Locations" page.
5. **City-level mismatch only (no higher resolution available):** weakest signal. Only flags cross-city/cross-country mismatches. Reviewer notes the resolution limitation in the log.

When `institution_no_canonical_record` fires: same as v1.

## flags_thrown

- `canonical_address_mismatch` — with sub-field `resolution_level: street | polygon | point | city` indicating the matching precision. Action: human review per updated playbook.
- `institution_no_canonical_record` — no ROR / GLEIF / Companies House hit. Same as v1.
- `multiple_canonical_records_conflict` — same as v1.
- `institution_status_inactive` — same as v1.
- `osm_polygon_not_found` — institution found in ROR but no OSM campus polygon could be matched. Action: informational; fall back to GeoNames point or city-level. Log for coverage tracking.

## failure_modes_requiring_review

- **ROR is city-level only in v2.** Mitigated in v2 by OSM polygon and GeoNames point augmentation, but not eliminated — OSM coverage is incomplete for non-OECD institutions.
- **OSM polygon quality varies.** Some campus polygons are outdated, incomplete (missing satellite campuses), or incorrectly drawn. [best guess: ~5-10% of OSM university polygons have boundary errors significant enough to cause false positives for addresses within 200m of the true boundary].
- **GeoNames point accuracy varies.** For well-known universities in OECD countries, the point is typically within 200-500m of the main campus. For smaller or less-known institutions, accuracy may be lower. [unknown — searched for: "GeoNames university coordinate accuracy study", "GeoNames spatial accuracy assessment"]
- **OSM name matching.** Matching ROR institution names to OSM `name` tags requires fuzzy matching; OSM names may be in local scripts or abbreviated differently from ROR.
- **GLEIF coverage gap:** most academic entities have no LEI. Same as v1.
- **Companies House is UK-only.** Same as v1.
- **Multi-campus institutions** — OSM multipolygon relations help but may not capture all campuses. Same structural issue as v1, partially mitigated.
- **API outages** — now 5 external services instead of 3; more failure modes. Cascade design means partial outages degrade resolution but don't block the check.

## false_positive_qualitative

Same as v1, plus:
- **Addresses just outside OSM polygon boundaries** — legitimate facilities at the campus edge or in adjacent research parks may fall outside the drawn polygon.
- **Institutions with outdated or missing OSM polygons** that fall back to the weaker city-level check.

## record_left

- All canonical addresses pulled (ROR, GLEIF, Companies House), the GeoNames point coordinates, the OSM polygon (stored as GeoJSON or WKT), the customer-claimed address, the geocoded coordinates, the resolution level used, the match result, the distance or point-in-polygon boolean, and the matched IDs (ROR ID, LEI, Companies House number, GeoNames ID, OSM way/relation ID). Stored in compliance log.

## attacker_stories_addressed — updated assessment

**Same-city bypass methods (the C1 gap):**

- **inbox-compromise (same-city CMRA):** v1 MISSED. **v2: CAUGHT if OSM polygon available** — a CMRA in the same city but outside the campus polygon would now fail the polygon check. If no OSM polygon, falls back to GeoNames point check (~500m radius), which catches CMRAs >500m from campus center but misses CMRAs within 500m. **Improvement: substantial for OECD institutions with OSM polygons; marginal otherwise.**

- **foreign-institution (same-metro virtual office, residential, freight forwarder):** v1 MISSED. **v2: partially CAUGHT** — virtual offices and freight forwarders are typically in commercial districts, not on campus. OSM polygon check would catch them unless they happen to be within the campus polygon. GeoNames point check catches addresses >500m from campus center.

- **visiting-researcher (same-metro virtual office):** v1 MISSED. **v2: CAUGHT if OSM polygon available** — off-campus virtual office falls outside polygon.

- **dormant-domain (same-metro residential colocation):** v1 MISSED. **v2: partially CAUGHT** — residential address is unlikely to be inside the campus polygon, unless the institution has residential housing and the attacker's address is within it.

- **account-hijack (same-city drop address):** v1 MISSED. **v2: CAUGHT if OSM polygon available** — drop address outside campus polygon.

**Structural gaps that remain unchanged from v1:**
- Entities with no canonical record (biotech-incubator-tenant, community-bio-lab-network, etc.) — unchanged.
- Shell entities whose registry address matches shipping — unchanged.
- Carrier-level redirect — unchanged.
- Inside-institution paths — unchanged (and now explicitly pass the tighter polygon check too).

**Net v2 improvement:** The OSM polygon augmentation converts the check from a city-level association check to a campus-level association check for ~60-80% of OECD research institutions. This directly addresses the dominant attacker strategy (same-city, off-campus addresses). The improvement is limited by OSM coverage (weak for non-OECD institutions) and by the structural gap for entities without ROR records.

Sources:
- [ROR home](https://ror.org/)
- [ROR v2 announcement](https://ror.org/blog/2024-04-15-announcing-ror-v2/)
- [ROR data structure](https://ror.readme.io/docs/ror-data-structure)
- [GLEIF API](https://www.gleif.org/en/lei-data/gleif-api)
- [GLEIF LEI statistics 2025](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)
- [Companies House rate limiting](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting)
- [Companies House UK register statistics Q4 2025](https://www.gov.uk/government/statistics/incorporated-companies-in-the-uk-october-to-december-2025/incorporated-companies-in-the-uk-october-to-december-2025)
- [OSM amenity=university tag](https://wiki.openstreetmap.org/wiki/Tag:amenity=university)
- [OSM Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [GeoNames web services](http://www.geonames.org/export/web-services.html)
- [GeoNames feature codes](https://download.geonames.org/export/dump/featureCodes_en.txt)
