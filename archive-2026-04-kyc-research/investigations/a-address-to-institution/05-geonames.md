# 05 - GeoNames API Investigation

**Date:** 2026-04-14
**Goal:** Test whether querying GeoNames directly (using ROR-provided `geonames_id` values, or by searching institution names) gives us more precise coordinates than ROR alone. ROR provides a `geonames_id` for every institution, but it only embeds city-level lat/lng. GeoNames might have campus-level entries.

**API:** `http://api.geonames.org/` (free tier, username `alejoacelas`)

---

## Method

For each test institution, two queries:

1. **ID lookup** — Fetch the GeoNames record for the ROR-provided `geonames_id` (always a city/place).
2. **Name search** — Search for the institution by name with feature codes `UNIV`, `SCH`, `BLDG` to find campus-level entries.

---

## 1. MIT (geonames_id: 4931972)

### 1a. ID lookup — Cambridge, MA

```bash
curl -s "http://api.geonames.org/getJSON?geonameId=4931972&username=alejoacelas"
```

| Field | Value |
|-------|-------|
| **name** | Cambridge |
| **lat** | 42.3751 |
| **lng** | -71.10561 |
| **fclass / fcode** | P / PPL (populated place) |
| **country** | United States |
| **admin1** | Massachusetts |
| **admin2** | Middlesex |
| **admin3** | City of Cambridge |

This is the Cambridge city centroid — exactly what ROR provides.

### 1b. Name search — "Massachusetts Institute of Technology"

```bash
# UNIV search: 0 results
curl -s "http://api.geonames.org/searchJSON?q=Massachusetts+Institute+of+Technology&featureCode=UNIV&maxRows=5&username=alejoacelas"

# SCH search: 1 result
curl -s "http://api.geonames.org/searchJSON?q=Massachusetts+Institute+of+Technology&featureCode=SCH&maxRows=5&username=alejoacelas"
```

**Result (geonameId 4943351, feature code SCH):**

| Field | Value |
|-------|-------|
| **name** | Massachusetts Institute of Technology |
| **lat** | 42.35954 |
| **lng** | -71.09172 |
| **fclass / fcode** | S / SCH (school) |
| **country** | United States |
| **admin1** | Massachusetts |
| **admin2** | Middlesex |
| **admin3** | City of Cambridge |
| **elevation** | 3m |
| **wikipedia** | en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology |

Also found: **MIT Sailing Pavilion** (geonameId 4943354, BLDG, 42.35899, -71.08783) — a specific building on campus.

### 1c. Comparison

| Source | Lat | Lng | Description |
|--------|-----|-----|-------------|
| ROR geonames_id (4931972) | 42.37510 | -71.10561 | Cambridge city centroid |
| GeoNames SCH search (4943351) | 42.35954 | -71.09172 | MIT campus point |
| Google Maps (actual MIT) | ~42.3601 | ~-71.0942 | MIT Great Dome |

**Delta:** ~1.7 km between city centroid and the SCH entry. The SCH entry is significantly more precise — it lands on the MIT campus rather than the middle of Cambridge. This is a real improvement.

---

## 2. University of Cape Town (geonames_id: 7302802)

### 2a. ID lookup — Rondebosch

```bash
curl -s "http://api.geonames.org/getJSON?geonameId=7302802&username=alejoacelas"
```

| Field | Value |
|-------|-------|
| **name** | Rondebosch |
| **lat** | -33.96333 |
| **lng** | 18.47639 |
| **fclass / fcode** | P / PPL (populated place) |
| **country** | South Africa |
| **admin1** | Western Cape |
| **admin2** | City of Cape Town |
| **population** | 15,158 |

Rondebosch is a small suburb — already better than a "Cape Town" city-center point, but still a neighborhood centroid.

### 2b. Name search — "University of Cape Town"

```bash
# UNIV search: 0 results for UCT itself (returned unrelated "Cape Academy" match)
curl -s "http://api.geonames.org/searchJSON?q=University+of+Cape+Town&featureCode=UNIV&maxRows=5&username=alejoacelas"

# Unfiltered search: found UCT as SCHC (college)
curl -s "http://api.geonames.org/searchJSON?q=University+of+Cape+Town&maxRows=5&username=alejoacelas"
```

**Result (geonameId 3369156, feature code SCHC):**

| Field | Value |
|-------|-------|
| **name** | University of Cape Town |
| **lat** | -33.95796 |
| **lng** | 18.46082 |
| **fclass / fcode** | S / SCHC (college) |
| **country** | South Africa |
| **admin1** | Western Cape |
| **admin2** | City of Cape Town |
| **elevation** | 108m (campus is on a hill) |
| **wikipedia** | en.wikipedia.org/wiki/University_of_Cape_Town |

### 2c. Comparison

| Source | Lat | Lng | Description |
|--------|-----|-----|-------------|
| ROR geonames_id (7302802) | -33.96333 | 18.47639 | Rondebosch suburb centroid |
| GeoNames SCHC search (3369156) | -33.95796 | 18.46082 | UCT campus point |
| Google Maps (actual UCT) | ~-33.9577 | ~18.4610 | UCT Upper Campus |

**Delta:** ~1.5 km between suburb centroid and the SCHC entry. The SCHC entry at elevation 108m matches UCT's famous hilltop campus location. The search result is noticeably more accurate.

---

## 3. Ginkgo Bioworks (geonames_id: 4930956)

### 3a. ID lookup — Boston

```bash
curl -s "http://api.geonames.org/getJSON?geonameId=4930956&username=alejoacelas"
```

| Field | Value |
|-------|-------|
| **name** | Boston |
| **lat** | 42.35843 |
| **lng** | -71.05977 |
| **fclass / fcode** | P / PPLA (seat of first-order admin division) |
| **country** | United States |
| **admin1** | Massachusetts |
| **admin2** | Suffolk |
| **population** | 653,833 |

This is downtown Boston — a large city centroid.

### 3b. Name search — "Ginkgo Bioworks"

```bash
# No results with any feature code or unfiltered
curl -s "http://api.geonames.org/searchJSON?q=Ginkgo+Bioworks&featureCode=UNIV&maxRows=5&username=alejoacelas"
curl -s "http://api.geonames.org/searchJSON?q=Ginkgo+Bioworks&maxRows=5&username=alejoacelas"
```

**Result:** Zero results for all queries. GeoNames has no entry for Ginkgo Bioworks.

### 3c. Comparison

| Source | Lat | Lng | Description |
|--------|-----|-----|-------------|
| ROR geonames_id (4930956) | 42.35843 | -71.05977 | Boston city centroid |
| GeoNames search | — | — | Not found |
| Actual location | ~42.3388 | ~-71.0985 | Ginkgo HQ (Seaport/27 Drydock Ave) |

**Delta:** No improvement possible. GeoNames does not index private companies or biotech firms. For commercial entities like Ginkgo, GeoNames provides zero value beyond the city centroid that ROR already gives us. The actual HQ is ~5.5 km from the Boston centroid.

---

## 4. Wellcome Sanger Institute (geonames_id: 2653941)

### 4a. ID lookup — Cambridge, UK

```bash
curl -s "http://api.geonames.org/getJSON?geonameId=2653941&username=alejoacelas"
```

| Field | Value |
|-------|-------|
| **name** | Cambridge |
| **lat** | 52.2 |
| **lng** | 0.11667 |
| **fclass / fcode** | P / PPLA2 (seat of second-order admin division) |
| **country** | United Kingdom |
| **admin1** | England |
| **admin2** | Cambridgeshire |
| **population** | 145,674 |

This is Cambridge city center. But the Sanger Institute is actually in **Hinxton**, a village ~15 km south of Cambridge.

### 4b. Name search — "Wellcome Sanger Institute"

```bash
# All of these returned 0 results:
curl -s "http://api.geonames.org/searchJSON?q=Wellcome+Sanger+Institute&featureCode=UNIV&maxRows=5&username=alejoacelas"
curl -s "http://api.geonames.org/searchJSON?q=Wellcome+Sanger+Institute&maxRows=5&username=alejoacelas"
curl -s "http://api.geonames.org/searchJSON?q=Sanger+Institute+Hinxton&maxRows=5&username=alejoacelas"
curl -s "http://api.geonames.org/searchJSON?q=Sanger+Centre&maxRows=5&username=alejoacelas"
curl -s "http://api.geonames.org/searchJSON?q=Wellcome+Genome+Campus&maxRows=5&username=alejoacelas"
```

**Result:** Zero results for the Sanger Institute under any name or feature code.

However, **Hinxton itself** is in GeoNames:

```bash
curl -s "http://api.geonames.org/searchJSON?q=Hinxton&country=GB&maxRows=5&username=alejoacelas"
```

| geonameId | name | lat | lng | fcode |
|-----------|------|-----|-----|-------|
| 7292946 | Hinxton | 52.08928 | 0.18739 | ADM4 (admin division) |
| 2646840 | Hinxton | 52.08529 | 0.18198 | PPL (populated place) |

### 4c. Comparison

| Source | Lat | Lng | Description |
|--------|-----|-----|-------------|
| ROR geonames_id (2653941) | 52.20000 | 0.11667 | Cambridge city center |
| GeoNames search | — | — | Sanger not found |
| Hinxton village (2646840) | 52.08529 | 0.18198 | Nearest populated place |
| Actual Sanger location | ~52.0833 | ~0.1863 | Wellcome Genome Campus, Hinxton |

**Delta:** This is the worst case. ROR says "Cambridge" (15 km away), and GeoNames has no entry for the Sanger Institute at all. If we knew to look up Hinxton instead of Cambridge, we'd get within ~300m of the actual campus — but ROR doesn't give us Hinxton's geonames_id, it gives us Cambridge's. GeoNames cannot fix ROR's city-assignment error because the institute itself is not indexed.

---

## 5. Makerere University (geonames_id: 232422)

### 5a. ID lookup — Kampala

```bash
curl -s "http://api.geonames.org/getJSON?geonameId=232422&username=alejoacelas"
```

| Field | Value |
|-------|-------|
| **name** | Kampala |
| **lat** | 0.31628 |
| **lng** | 32.58219 |
| **fclass / fcode** | P / PPLC (capital of a political entity) |
| **country** | Uganda |
| **admin1** | Central Region |
| **admin2** | Kampala District |
| **population** | 1,680,600 |

This is the Kampala city centroid for a sprawling capital of 1.7M people.

### 5b. Name search — "Makerere University"

```bash
curl -s "http://api.geonames.org/searchJSON?q=Makerere+University&featureCode=UNIV&maxRows=5&username=alejoacelas"
```

**Results (2 hits):**

| geonameId | name | lat | lng | fcode |
|-----------|------|-----|-----|-------|
| 8260559 | Makerere University School of Public Health | 0.33791 | 32.57702 | UNIV |
| 8629678 | Makerere University | 0.33572 | 32.56815 | UNIV |

**Full record for Makerere University (geonameId 8629678):**

| Field | Value |
|-------|-------|
| **name** | Makerere University |
| **lat** | 0.33572 |
| **lng** | 32.56815 |
| **fclass / fcode** | S / UNIV (university) |
| **country** | Uganda |
| **admin1** | Central Region |
| **admin2** | Kampala District |
| **admin3** | Kampala Capital City |
| **admin4** | Kawempe |
| **wikipedia** | en.wikipedia.org/wiki/Makerere_University |

### 5c. Comparison

| Source | Lat | Lng | Description |
|--------|-----|-----|-------------|
| ROR geonames_id (232422) | 0.31628 | 32.58219 | Kampala city centroid |
| GeoNames UNIV search (8629678) | 0.33572 | 32.56815 | Makerere campus point |
| Google Maps (actual Makerere) | ~0.3349 | ~32.5675 | Makerere main campus |

**Delta:** ~2.4 km between Kampala centroid and the UNIV entry. The UNIV entry is within ~100m of the actual campus location. This is the best improvement in our test set.

---

## Summary

| Institution | ROR geonames_id resolves to | Direct search finds campus? | Feature code | Precision gain |
|-------------|----------------------------|---------------------------|--------------|----------------|
| MIT | Cambridge, MA (PPL) | Yes — SCH entry | SCH | ~1.7 km closer |
| University of Cape Town | Rondebosch (PPL) | Yes — SCHC entry | SCHC | ~1.5 km closer |
| Ginkgo Bioworks | Boston (PPLA) | No — not in GeoNames | — | None |
| Wellcome Sanger Institute | Cambridge, UK (PPLA2) | No — not in GeoNames | — | None (15 km error persists) |
| Makerere University | Kampala (PPLC) | Yes — UNIV entry | UNIV | ~2.4 km closer |

### Key Findings

1. **GeoNames has campus-level entries for some institutions** — but coverage is inconsistent. 3 of 5 test institutions were found; 2 were not.

2. **Feature code inconsistency is a problem.** MIT is coded as `SCH` (school), UCT as `SCHC` (college), Makerere as `UNIV` (university). There is no single feature code that reliably finds all institutions. A search strategy needs to try `UNIV`, `SCHC`, `SCH`, and possibly unfiltered search.

3. **Private companies are absent.** GeoNames is a geographic features database, not a business directory. Ginkgo Bioworks (and presumably most commercial biotech companies) simply don't exist in it.

4. **Research institutes that aren't universities are absent.** The Sanger Institute — one of the world's most important genomics facilities — has zero presence in GeoNames. This is the most concerning gap for our KYC use case, since many DNA synthesis customers are research institutes, not universities.

5. **GeoNames cannot fix ROR's city-assignment errors.** The Sanger case shows the fundamental limit: ROR assigns geonames_id 2653941 (Cambridge), but the institute is in Hinxton. Even though Hinxton exists in GeoNames, we'd need to already know the correct location to look it up.

6. **When it works, the improvement is meaningful.** For the 3 institutions found, coordinates improved by 1.5-2.4 km — the difference between "somewhere in the city" and "on the actual campus."

### API Notes

- Free tier allows 1000 credits/day, 10,000/month per username.
- `getJSON` costs 1 credit; `searchJSON` costs 1-4 credits depending on rows returned.
- Response times: 100-300ms per request.
- No API key required — just a registered username.
- Rate limits are generous for batch processing but a pipeline would need to respect the daily cap.

### Implications for the Pipeline

**GeoNames as a supplementary lookup is marginally useful but not reliable enough to be a primary strategy.** The coverage gap for non-university research institutions (like the Sanger Institute) is a serious limitation for biosecurity screening, where many customers are exactly these kinds of organizations.

A better approach might be:
1. Use ROR's embedded lat/lng as the baseline (city-level).
2. For institutions where ROR provides a geonames_id, try a GeoNames name search to find a more precise campus entry — but treat this as an opportunistic improvement, not a guarantee.
3. For precise campus-level coordinates, OSM/Overpass (investigated in `04-osm-overpass.md`) or Google/Mapbox geocoding are more reliable because they index buildings and named places, not just geographic features and populated places.
