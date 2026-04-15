# 4C claim check — m01-ofac-sdn v1

- **OFAC SLS file formats (XML/CSV/fixed/delimited)** — supported by https://ofac.treasury.gov/sanctions-list-service and FAQ topic/1641. PASS.
- **OpenSanctions €0.10/call list price** — confirmed on https://www.opensanctions.org/api/. PASS.
- **OpenSanctions volume discount starting 20,000 req/mo** — confirmed via search snippet from same source. PASS.
- **OpenSanctions /match dataset filter (us_ofac_sdn, us_ofac_cons)** — supported by https://www.opensanctions.org/docs/api/matching/. PASS.
- **ofac-api.com refresh ~2 minutes** — OVERSTATED. Docs page actually says "at least every 5 minutes, and some every 2 minutes." Fix: weaken to "5 minutes baseline, 2 minutes for some sources."
- **ofac-api.com source filter `"source": ["SDN", ...]`** — MIS-CITED on the linked page (syntax not visible there); the syntax came from earlier search snippet. Fix: cite the request page `/search-api/request` or weaken to "vendor exposes a source filter parameter [vendor docs split across pages]."
- **Jaro-Winkler + Soundex matching attribution to ofac-api.com** — UNDERCITED on linked page (page only says "designed in coordination with US Treasury based on Treasury guidelines," no explicit algorithm names). Fix: weaken to "vendor states fuzzy matching designed per Treasury guidelines" or move algorithm-name claim to a `[best guess]` based on standard sanctions-screening practice.

Verdict: REVISE (minor — three small overstatements on the ofac-api.com vendor; everything else PASS).
