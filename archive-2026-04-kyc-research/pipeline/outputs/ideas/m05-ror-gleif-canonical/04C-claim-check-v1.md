# 04C Claim check — m05-ror-gleif-canonical v1

- **"ROR v2 location is city-level via geonames; addresses field removed"** — confirmed by [ROR v2 announcement](https://ror.org/blog/2024-04-15-announcing-ror-v2/) and [ROR data structure](https://ror.readme.io/docs/ror-data-structure) snippets: "Location information previously in addresses field is now in locations field with subfields geonames_id and geonames_details" and "country name, country code, latitude, longitude, specific location (city), and GeoNames ID". PASS.
- **"GLEIF API free, no registration required"** — confirmed by [GLEIF API page](https://www.gleif.org/en/lei-data/gleif-api) snippet: "Use of the API is free of charge and does not require registration". PASS.
- **"GLEIF returns up to 200 records per request"** — confirmed by same source snippet. PASS.
- **"GLEIF Level 1 includes legal entity name and registered address"** — confirmed by [LEI Data access](https://www.gleif.org/en/lei-data/access-and-use-lei-data) snippet. PASS.
- **"Companies House 600 requests / 5 minutes; 429 on excess"** — confirmed verbatim by [rate limiting guide](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting). PASS.
- **"Companies House is free"** — confirmed. PASS.
- **"ROR is CC0"** — claimed but not directly verified in search snippets [unknown — search snippets did not include the license clause]. UPGRADE-SUGGESTED: cite the ROR data download page or the about page directly.

**Verdict:** PASS-with-minor (one UPGRADE-SUGGESTED on the ROR CC0 license claim; otherwise all empirical claims well-sourced)
