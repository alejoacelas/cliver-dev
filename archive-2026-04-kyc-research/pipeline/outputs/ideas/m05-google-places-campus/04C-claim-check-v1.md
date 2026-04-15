# 04C Claim check — m05-google-places-campus v1

- **"Nominatim absolute maximum 1 req/sec"** — confirmed by [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) snippet: "absolute maximum of 1 request per second". PASS.
- **"Nominatim requires User-Agent header and attribution"** — confirmed by same source. PASS.
- **"Bulk geocoding discouraged"** — confirmed. PASS.
- **"Overpass: queries >100MB or >180s killed"** — claim is reasonable but search snippet did not explicitly confirm these specific numbers. UPGRADE-SUGGESTED: verify against [Overpass API wiki](https://wiki.openstreetmap.org/wiki/Overpass_API). The numbers are widely reported in community guides but the document should cite them directly.
- **"OSM polygon coverage ~80% US R1"** — MISSING-CITATION, pure best-guess marker is appropriate but the number is invented. Suggested fix: replace with `[best guess, no proxy source — community OSM coverage data not systematically published for university polygons]`.
- **Places Text Search endpoint URL** — confirmed by [Places API overview](https://developers.google.com/maps/documentation/places/web-service/overview). PASS.
- **Places ToS clause** — already flagged in m04-google-places-business 4C as OVERSTATED (Places Aggregate vs standard Places). Same caveat applies here.

**Verdict:** REVISE (one MISSING-CITATION number that should be reframed as a pure guess; one UPGRADE-SUGGESTED on Overpass limits)
