# m05-google-places-campus — Implementation v1

- **measure:** M05 — shipping-institution-association
- **name:** Google Places + OSM campus polygon containment
- **summary:** Resolve the customer's claimed institution to (a) a Google Places `place_id` for the institution and (b) an OpenStreetMap relation describing the campus polygon. Geocode the customer's shipping address; test whether the address coordinates fall inside the campus polygon (point-in-polygon). Containment is a strong positive signal of institution-address association.

## external_dependencies

- **Google Places API (New)** — Text Search to resolve institution name to `place_id`; Place Details for canonical location. [source](https://developers.google.com/maps/documentation/places/web-service/overview)
- **OpenStreetMap Overpass API** — query for campus relations tagged `amenity=university`, `amenity=hospital`, or `landuse=education`. [source](https://wiki.openstreetmap.org/wiki/Overpass_API)
- **OpenStreetMap Nominatim API** — geocode the shipping address. [source](https://nominatim.org/)
- **A point-in-polygon library** (Shapely / Turf / PostGIS).
- **Same Google Places ToS risk as m04-google-places-business** — see note below.

## endpoint_details

- **Google Places Text Search:** `https://places.googleapis.com/v1/places:searchText` — POST, API-key auth in header. Pricing: same SKU model as m04 ($32–$40 per 1000 requests). [source](https://developers.google.com/maps/documentation/places/web-service/overview)
- **Overpass API:** `https://overpass-api.de/api/interpreter` — POST query in Overpass QL. Free, no auth, public instance. Suggested heavy users self-host. [source](https://wiki.openstreetmap.org/wiki/Overpass_API)
- **Overpass rate limits:** public instance has fair-use quotas; queries returning >100MB or running >180s are killed. Heavy production use requires self-hosted instance. [source](https://wiki.openstreetmap.org/wiki/Overpass_API)
- **Nominatim public instance:** `https://nominatim.openstreetmap.org/search` — GET. **Hard rate limit: 1 req/sec absolute maximum.** Bulk geocoding strongly discouraged on the public instance. Production use requires self-hosting Nominatim. [source](https://operations.osmfoundation.org/policies/nominatim/)
- **Nominatim usage policy:** must provide valid `User-Agent` header identifying the application; must display OSM attribution. [source](https://operations.osmfoundation.org/policies/nominatim/)
- **Self-hosted Nominatim:** ~1TB disk, multi-day import; runs as a Postgres+PHP service. Setup cost is the dominant factor. [unknown — searched for: "Nominatim self-host hardware requirements 2026", "Nominatim full planet import time"]

## fields_returned

- **Places Text Search response:** `id` (place_id), `displayName`, `formattedAddress`, `location` (lat/lng), `viewport` (bounding box), `types[]`, `primaryType`, `googleMapsUri`. [source](https://developers.google.com/maps/documentation/places/web-service/overview)
- **Overpass relation query response:** OSM elements with `id`, `type=relation`, `tags{}` (including `name`, `amenity`, `landuse`, `wikidata`), and `members[]` referencing ways forming the boundary; with `out geom` mode, the actual coordinate ring is resolved. [source](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)
- **Nominatim geocode response:** `lat`, `lon`, `display_name`, `address{}` (parsed), `boundingbox`, `osm_type`, `osm_id`, `class`, `type`, optionally `geojson` polygon if `polygon_geojson=1`. [source](https://nominatim.org/)
- **Containment result:** boolean `inside_polygon` + the OSM relation ID matched against.

## marginal_cost_per_check

- **Places Text Search:** ~$0.032/check at Basic SKU (one call per institution; cacheable as `place_id` per the 30-day caching policy). After first lookup, $0 for repeat customers from the same institution.
- **Overpass:** $0 (public) or amortized fraction of self-hosted infra (~$50–$200/month for a small EC2 box).
- **Nominatim:** $0 if self-hosted; cannot use public instance for production screening volumes.
- **setup_cost:** Self-hosting Nominatim and a tile-by-tile Overpass mirror is multi-day engineering. ~1–2 engineer-weeks initial. Ongoing: ~$200/mo infra.

## manual_review_handoff

When `address_outside_campus_polygon` fires:
1. Reviewer pulls the matched OSM relation, the geocoded shipping coordinates, and the distance from polygon edge.
2. If distance is < 500m, reviewer manually checks for known affiliate buildings (hospitals, research institutes, satellite labs) within that radius — universities often have buildings just off the main campus polygon.
3. Reviewer cross-references with the institution's official "locations" page or campus map.
4. Reviewer checks ROR (m05-ror-gleif) for the institution's listed address(es) — campuses with multiple sites should appear there.
5. **Decision:**
   - Inside polygon → strong positive, clear this dimension.
   - <500m + known affiliate → soft pass, log the decision rationale.
   - >500m + no known affiliate → hard hold, request the customer document the building's relationship to the institution.

When `polygon_missing_for_institution` fires:
1. Reviewer manually constructs a fallback bounding box from the institution's website or Wikipedia.
2. Falls through to ROR/GLEIF address comparison (m05-ror-gleif).

## flags_thrown

- `address_inside_campus_polygon` — positive signal, no review needed.
- `address_outside_campus_polygon` — review per playbook above.
- `polygon_missing_for_institution` — Overpass returned no relation. Action: fallback to ROR/GLEIF.
- `places_resolved_to_multiple_institutions` — Text Search returned multiple `place_id` candidates. Action: reviewer disambiguates.

## failure_modes_requiring_review

- **Polygon coverage:** OSM polygon coverage of universities is good in the US/Europe but spotty in lower-income countries [best guess: ~80% US R1 universities have boundary relations, dropping sharply for community colleges and non-OECD]. Hospitals coverage is worse.
- **Polygon definition:** university polygons in OSM frequently exclude affiliated buildings (off-campus dorms, leased research buildings).
- **Multi-campus institutions:** an institution may have 5+ campuses, and the OSM `name` tag may only match one — requires `wikidata` tag matching.
- **Geocoding ambiguity:** Nominatim returns multiple results for the same address.
- **Stale OSM data:** new buildings take weeks-to-months to appear.
- **Rate limit exhaustion** on public instances → degrade to fallback.

## false_positive_qualitative

- **Visiting researchers** with home addresses in the campus area (apartment near university) — they live near campus but don't ship to a lab. Will fail polygon containment unless their address happens to be inside the campus.
- **Off-campus institutional housing** for grad students.
- **University-owned but spatially separated assets** (animal facilities, observatories, field stations).
- **Hospital systems** with many community sites not on the main hospital campus.
- **Industry-partner buildings** physically inside or adjacent to campus that are not formally part of the institution.

## record_left

- The matched `place_id`, the OSM relation ID, the geocoded coordinates, the boolean containment result, and the geocode + Overpass query timestamps. Stored in compliance log.

## ToS structural risk

Inherits the m04-google-places ToS concern: Maps Platform service-specific terms restrict using Places output for decisions about individuals (housing, employment, credit, insurance). Customer screening is plausibly outside that enumerated list but should be legally reviewed. [source](https://cloud.google.com/maps-platform/terms/maps-service-terms). Nominatim usage policy is permissive but only for self-hosted production volumes.

## attacker_stories_addressed

- `biotech-incubator-tenant` — incubator buildings ARE often inside the polygon of recognized biotech parks (LabCentral is at 700 Main St Cambridge, inside the Kendall biotech cluster) — does NOT catch this attacker. The check is satisfied by the bypass.
- `cro-framing` virtual office — the Regus address is unlikely to be inside any university campus polygon → CATCHES.
- `dormant-domain` — depends on whether the revived lab's geographic identity matches a real institution polygon.
- `community-bio-lab-network` maker-space variant — maker space addresses won't be inside any university polygon → CATCHES.
- `it-persona-manufacturing` (sub-path C: sibling org at same institution) — host lab building IS inside campus polygon → does NOT catch.
- `account-hijack` Method 2 (satellite facility address) — attacker-controlled drop is unlikely to be inside any campus polygon → CATCHES.

Sources:
- [Google Places API overview](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Maps Platform service terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
- [Overpass API wiki](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Overpass QL guide](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Nominatim project home](https://nominatim.org/)
