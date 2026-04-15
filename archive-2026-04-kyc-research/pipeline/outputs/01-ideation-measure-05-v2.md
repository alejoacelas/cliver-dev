# Stage 1 — Measure 05 — v2

Carries forward v1; revises #11 and #18; drops #13.

Ideas 1–10, 12, 14–17 unchanged from v1 (PASS). Only revised entries are spelled out below; the rest are referenced by name.

---

## 1. ROR institutional-address cross-reference — unchanged (PASS)
## 2. GLEIF LEI registered-address lookup — unchanged (PASS)
## 3. Companies House registered-office lookup — unchanged (PASS)
## 4. Charity Commission lookup — unchanged (PASS)
## 5. Google Maps Places API — institution viewport — unchanged (PASS)
## 6. OSM / Nominatim institution polygon — unchanged (PASS)
## 7. Ringgold Identify — unchanged (PASS)
## 8. Smarty US CMRA / RDI flag — unchanged (PASS)
## 9. Melissa Global Address Verification — unchanged (PASS)
## 10. Institutional website scrape — unchanged (PASS)

## 11. University campus map / facilities portal — REVISED

- **Modes:** D, A
- **Summary:** Curated lookup against per-university campus-map building datasets, used as a high-precision second pass *only* when the customer claims a top-N research university and the shipping ZIP is within the metro. Specific named sources to start: MIT `whereis.mit.edu` (returns building number + street address); Harvard `campusmap.harvard.edu`; Stanford `campus-map.stanford.edu`; UC Berkeley `map.berkeley.edu`; Cambridge `map.cam.ac.uk`; Oxford `maps.ox.ac.uk`. For each, store a snapshot of building→address pairs (scraped quarterly) and check the shipping street address against that table.
- **attacker_stories_addressed:** visiting-researcher, inbox-compromise, it-persona-manufacturing, credential-compromise (validating that the redirected address is *not* an actual building of the institution)
- **external_dependencies:** Per-university map endpoints listed above; quarterly scrape job; libpostal for address normalization.
- **manual_review_handoff:** When the claimed institution is in the curated set and shipping address is not in any building snapshot for that institution, reviewer compares the off-campus address against the institution's official off-site facilities list.
- **flags_thrown:** Shipping address claimed at top-N institution but absent from the institution's own building dataset.
- **failure_modes_requiring_review:** Newly-acquired buildings; affiliated hospitals not in the campus map; map redesign breaks scraper.
- **record_left:** Snapshot version, building list URL, comparison result.
- Other fields: # stage 4

## 12. OpenCorporates registered-address — unchanged (PASS)

## 13. (DROPPED — see Dropped section)

## 14. Incubator/coworking tenant directory scrape — unchanged (PASS)
## 15. Carrier-redirect / mid-stream change SOP — unchanged (PASS)
## 16. Provider org registry with two-contact change control SOP — unchanged (PASS)
## 17. Wikidata institution coordinates — unchanged (PASS)

## 18. GRID legacy dataset — REVISED → reframed as ROR offline cache / outage fallback

- **Modes:** D
- **Summary:** Use the frozen 2021 GRID release as a local cache and disaster-recovery fallback for the ROR-based check (#1). When `api.ror.org` is unreachable or returns 5xx, fall back to a local GRID JSON dump joined to ROR via the GRID→ROR ID crosswalk that ROR publishes. Same comparison logic as #1; explicitly not used as a primary source.
- **attacker_stories_addressed:** Same as #1 (only relevant during ROR outages).
- **external_dependencies:** GRID release files; ROR-published GRID crosswalk.
- **manual_review_handoff:** As in #1; reviewer also sees a "fallback source" tag in the audit record.
- **flags_thrown:** Same as #1.
- **failure_modes_requiring_review:** Frozen since 2021; orgs founded after 2021 will be missing — reviewer must use a different source.
- **record_left:** Source = `grid-2021-fallback`, GRID ID, decision.
- Other fields: # stage 4

---

## Dropped

- **#13 EDGAR / SEC entity address** — Dropped for relevance. None of the 14 attacker stories under measure 05 involve SEC-filing entities; all are small LLCs, community labs, shells, or impersonation scenarios. EDGAR catches no one in the mapping file. Could not find a fixable angle.
