# Coverage research: Google Places + OSM campus polygon containment

## Coverage gaps

### Gap 1: Institutions without OSM campus polygon (non-OECD, community colleges, hospitals)
- **Category:** Customers claiming affiliation with institutions that do not have a boundary relation in OpenStreetMap. This disproportionately affects: (a) institutions in non-OECD countries where OSM volunteer mapping is sparse, (b) US community colleges and small teaching institutions, (c) hospitals and clinical research sites (hospital campus polygons are less commonly mapped than university campons).
- **Estimated size:** OSM building footprint data exceeds 80% completeness for only 1,848 urban centers (16% of the urban population); completeness is below 20% for 9,163 cities (48% of the urban population) [source](https://www.nature.com/articles/s41467-023-39698-6). For university-specific polygons, the implementation estimates ~80% of US R1 universities have boundary relations, dropping sharply for community colleges and non-OECD institutions [best guess from 04-implementation]. [best guess: for synthesis-customer-relevant institutions globally, perhaps 50–60% have a usable OSM campus polygon. The remainder triggers `polygon_missing_for_institution` and falls through to ROR/GLEIF address comparison.]
- **Behavior of the check on this category:** no-signal (triggers `polygon_missing_for_institution`)
- **Reasoning:** Without a polygon, the point-in-polygon test cannot run. The check degrades to a manual bounding-box construction by the reviewer or falls back to ROR/GLEIF. The primary value proposition (automated containment check) is lost.

### Gap 2: Multi-campus institutions where OSM covers only the main campus
- **Category:** Customers shipping to satellite campuses, affiliated hospitals, research parks, or extension sites of a multi-campus institution. The OSM relation for the institution may only describe the main campus.
- **Estimated size:** [unknown — searched for: "multi-campus university satellite site count US", "university affiliated hospital separate campus OSM"]. [best guess: among large research universities (US R1/R2, ~250 institutions), roughly half have 2+ campuses or major affiliated sites. If only the primary campus polygon is in OSM, the check produces a false negative for addresses at satellite sites — affecting perhaps 10–20% of orders from these institutions.]
- **Behavior of the check on this category:** false-positive (triggers `address_outside_campus_polygon` for a legitimate institutional address)
- **Reasoning:** The customer is genuinely affiliated with the institution and ships to a real institutional building, but that building is on a campus not covered by the OSM polygon. The manual review step can catch this (reviewer checks the institution's "locations" page), but it adds cost and delay.

### Gap 3: Industry customers (biotech/pharma companies are not "campuses")
- **Category:** Customers at commercial biotech or pharmaceutical companies. These companies typically do not have OSM campus polygons — OSM maps educational and healthcare campuses, not corporate office parks. The check's fundamental design assumes an institutional (academic/hospital) customer base.
- **Estimated size:** Biotech/pharma companies account for ~46–52% of gene synthesis revenue [source](https://www.gminsights.com/industry-analysis/gene-synthesis-market) [source](https://market.us/report/gene-synthesis-service-market/). These customers are effectively invisible to this check. [best guess: by order count, industry customers may be 30–45% of total orders, given that academic orders tend to be smaller and more frequent.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** A pharma company at a commercial office building has no OSM campus polygon. The check returns `polygon_missing_for_institution`. This is not an error — the check was designed for institutional customers — but it means the check provides no value for nearly half the customer base by revenue.

### Gap 4: University-owned off-campus assets (field stations, observatories, animal facilities)
- **Category:** Customers shipping to university-owned facilities that are geographically distant from any campus polygon: field stations, marine biology labs, observatories, agricultural experiment stations, off-campus animal facilities.
- **Estimated size:** [unknown — searched for: "university off campus research facility count US", "field stations research stations total United States"]. The Organization of Biological Field Stations (OBFS) lists ~200+ member stations in the US [best guess from general knowledge of OBFS membership]. These are legitimate research facilities owned by universities but often located in rural areas far from any campus.
- **Behavior of the check on this category:** false-positive (triggers `address_outside_campus_polygon`)
- **Reasoning:** The address is legitimate and university-affiliated, but the point-in-polygon test fails because the facility is nowhere near the campus. The reviewer must manually verify the institutional relationship.

### Gap 5: Nominatim geocoding errors in ambiguous addresses
- **Category:** Customers whose shipping addresses geocode incorrectly via Nominatim, placing the point on the wrong side of a campus polygon boundary. Affects addresses with ambiguous street names, apartment numbers in large complexes, or addresses in areas with poor OSM address coverage.
- **Estimated size:** [unknown — searched for: "Nominatim geocoding accuracy rate percentage", "OpenStreetMap address geocoding error rate"]. [best guess: Nominatim's geocoding accuracy for well-mapped US/EU addresses is ~90–95% at the building level; for less-mapped regions it drops to 70–80%. An incorrect geocode near a campus boundary could flip the containment result.]
- **Behavior of the check on this category:** false-positive or false-negative depending on the direction of the error
- **Reasoning:** A geocoding error of even 50m can place a point inside or outside a campus polygon at the boundary. This is an operational noise source rather than a systematic coverage gap.

## Refined false-positive qualitative

Updated from stage 4:

1. **Multi-campus satellite sites** (Gap 2): ~10–20% of orders from large research universities [best guess]. High-friction false positive because the customer is demonstrably affiliated.
2. **Off-campus university assets** (Gap 4): ~200+ field stations in the US alone. Small population but systematically excluded.
3. **Visiting researchers near campus** (from stage 4): live near but not on campus. Low-priority false positive — these addresses fail containment but may pass other M05 checks.
4. **Industry-partner buildings on campus edges** (from stage 4): ambiguous containment result.

The largest false-positive-by-omission category is **industry customers** (Gap 3) — the check provides no signal for them at all.

## Notes for stage 7 synthesis

- This check is fundamentally **academic/hospital-oriented**. It provides strong positive signal (containment = inside polygon) for the ~50–60% of institutions that have OSM polygons, but zero signal for industry customers (~30–45% of orders) and degraded signal for institutions without polygons.
- The OSM polygon gap (Gap 1) is the binding constraint. Improving it requires volunteer mapping effort, which is outside the synthesis provider's control. Self-hosting Overpass and contributing polygons to OSM is possible but expensive.
- Gap 3 (industry customers) is structural and cannot be fixed within this idea's design — it requires a different data source (e.g., commercial property records, D&B business data).
- The check is best used as a **positive signal** (containment confirms institution-address association) rather than a **negative signal** (non-containment does not reliably reject).
