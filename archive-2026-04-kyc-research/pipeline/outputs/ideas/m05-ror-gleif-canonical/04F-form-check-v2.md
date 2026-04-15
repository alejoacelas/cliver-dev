# 04F Form check — m05-ror-gleif-canonical v2

| Field | Verdict |
|---|---|
| name / measure / summary | PASS — updated to reflect OSM augmentation |
| external_dependencies | PASS — five sources named with URLs and auth/pricing; two new (Overpass, GeoNames web service) |
| endpoint_details | PASS — concrete URLs, auth model, rate limits (or explicit `[unknown]`) for all five sources; Overpass query example included; GeoNames credit model documented |
| fields_returned | PASS — full field lists for all five sources |
| marginal_cost_per_check | PASS — updated to <$0.02 with breakdown; setup_cost updated |
| manual_review_handoff | PASS — updated to reflect resolution cascade with per-level reviewer guidance |
| flags_thrown | PASS — 5 flags including new `osm_polygon_not_found` and `resolution_level` sub-field |
| failure_modes_requiring_review | PASS — 8 failure modes including new OSM quality, GeoNames accuracy, and name-matching issues |
| false_positive_qualitative | PASS — v1 classes retained + 2 new OSM-specific classes |
| record_left | PASS — comprehensive; includes GeoJSON/WKT polygon, resolution level, all IDs |
| attacker_stories_addressed | PASS — per-story reassessment with v2 resolution improvements |

## Observations

- The resolution cascade (street > polygon > point > city) is well-structured and addresses the C1 finding directly.
- GLEIF coverage estimate ("<5% of research institutions") is marked `[best guess]` — acceptable given no public data exists on this.
- OSM coverage estimate ("60-80% of OECD research institutions") is marked `[best guess]` — reasonable but unverifiable without empirical measurement. The implementation acknowledges this and suggests measuring overlap.
- GeoNames point accuracy ("200-500m for well-known OECD institutions") has an `[unknown]` marker with search list — acceptable.
- Overpass API rate limit has `[unknown]` marker with search list — acceptable for a free public API.

**Verdict:** PASS
