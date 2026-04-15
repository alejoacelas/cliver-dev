# Stage 2 — Measure 05 — Feasibility v2

Reviewing v2 against the two gates.

---

1. ROR institutional-address cross-reference — **PASS**
2. GLEIF LEI registered-address lookup — **PASS**
3. Companies House registered-office lookup — **PASS**
4. Charity Commission lookup — **PASS**
5. Google Maps Places API — institution viewport — **PASS**
6. OSM / Nominatim institution polygon — **PASS**
7. Ringgold Identify — **PASS**
8. Smarty US CMRA / RDI flag — **PASS**
9. Melissa Global Address Verification — **PASS**
10. Institutional website scrape — **PASS**
11. University campus map / facilities portal — **PASS.** Now names six specific endpoints (MIT, Harvard, Stanford, Berkeley, Cambridge, Oxford) and a concrete scrape-cache SOP. Concreteness gate cleared.
12. OpenCorporates registered-address — **PASS**
13. (dropped in v2)
14. Incubator/coworking tenant directory scrape — **PASS**
15. Carrier-redirect / mid-stream change SOP — **PASS**
16. Provider org registry with two-contact change control SOP — **PASS**
17. Wikidata institution coordinates — **PASS**
18. GRID legacy dataset (reframed as ROR fallback) — **PASS.** Now scoped explicitly as outage fallback for #1 with the GRID→ROR crosswalk; no longer dominated.

---

## Gaps

Same residual gap noted in v1: physical interception at a real institutional address (account-hijack Method 1, visiting-researcher Option 3). This is structurally outside measure 05's scope — the address really is the institution — and is the responsibility of receiving-side controls at the institution, not the synthesis provider's address-association check. Not a gap to close in this measure.

No new uncovered classes.

## STOP: yes
