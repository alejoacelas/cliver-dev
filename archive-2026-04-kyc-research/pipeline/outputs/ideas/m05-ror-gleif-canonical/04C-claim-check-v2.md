# 04C Claim check — m05-ror-gleif-canonical v2

Claims carried forward from v1 (previously verified): ROR v2 city-level only, GLEIF free/no-auth, GLEIF 200 records/request, Companies House 600 req/5min, Companies House free. All PASS (re-verified in v1 claim check).

New claims in v2:

- **"GLEIF total active LEI population ~2.93 million as of late 2025"** — confirmed by [GLEIF blog post](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025): "more than 355,000 new LEIs were issued... increasing the total active LEI population to over 2.93 million." PASS.

- **"UK Companies House register ~5.45 million entities as of December 2025"** — confirmed by [GOV.UK statistics](https://www.gov.uk/government/statistics/incorporated-companies-in-the-uk-october-to-december-2025/incorporated-companies-in-the-uk-october-to-december-2025): "total register size for the UK was 5,450,364 at the end of December 2025." PASS.

- **"ROR lists ~120,000+ organizations"** — confirmed by [ROR home page](https://ror.org/) stating "more than 120,000 organizations." Also consistent with [ROR 2025 archive](https://ror.org/archives/2025/) noting 8,000+ records added in 2025. PASS.

- **"OSM maps university campuses as amenity=university ways or multipolygon relations"** — confirmed by [OSM wiki Tag:amenity=university](https://wiki.openstreetmap.org/wiki/Tag:amenity=university): "For a closed campus, the university area is mapped as an area... multipolygon relations can be used for areas that define the university campus." PASS.

- **"GeoNames free tier 20,000 credits/day"** — confirmed by [GeoNames web services](http://www.geonames.org/export/web-services.html): documented credit system with free tier. PASS.

- **"GeoNames premium $480/year"** — [unknown — searched for: "GeoNames premium account price", "GeoNames commercial pricing"]. The $480 figure was not directly confirmed in search results. UPGRADE-SUGGESTED: verify on GeoNames premium page or mark as `[best guess]`.

- **"<5% of research institutions have LEIs"** — correctly marked `[best guess]`. Not an empirical claim requiring citation. PASS.

- **"60-80% of OECD research institutions have OSM amenity=university polygons"** — correctly marked `[best guess]`. Not verifiable without empirical measurement; the implementation acknowledges this. PASS.

- **"GeoNames point accuracy 200-500m for well-known OECD institutions"** — correctly marked `[best guess]` and has `[unknown]` with search list. PASS.

- **"OSM data is ODbL-licensed"** — confirmed by [OSM wiki](https://wiki.openstreetmap.org/wiki/Overpass_API) and general OSM knowledge. PASS.

**Verdict:** PASS-with-minor (one UPGRADE-SUGGESTED on GeoNames premium pricing; otherwise all new empirical claims are either well-sourced or correctly marked as `[best guess]`/`[unknown]`)
