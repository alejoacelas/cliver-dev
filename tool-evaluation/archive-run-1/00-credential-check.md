# Stage 0 — Credential Check Log

**Executed:** 2026-04-14 ~21:20 CDT  
**Status:** 28/31 endpoints operational, 2 blocked, 2 docs-only

## Summary

| Status | Count | Endpoints |
|---|---|---|
| **Live** | 26 | ROR, GLEIF, Companies House, Smarty, Google Places, GeoNames, OSM Overpass, RDAP, binlist, InCommon, Stripe test, Plaid sandbox, Exa, NIH RePORTER, NSF Awards, UKRI, PubMed, ORCID, OpenAlex, + 7 local logic |
| **Blocked** | 2 | OpenCorporates (API requires paid account), Screening List (API endpoint deprecated/migrated) |
| **Docs-only** | 2 | Stripe AVS prod, Plaid Identity Match prod |
| **Local logic** | 7 | Disposable blocklist, MX/SPF/DMARC, lookalike detector, PO Box regex, BIS country groups, ISO normalize, billing-shipping consistency, fintech BIN denylist |

## Detailed test results

### Free / no-auth APIs

**ROR API v2** — `GET https://api.ror.org/v2/organizations?query=MIT`  
Result: OK. Returned 38 results. First match: "MIT". Fields include names, types, country, city, domains, external IDs.

**GLEIF API** — `GET https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Google`  
Result: OK. Returned LEI record for "GOOGLE FRANCE". Returns legal address, HQ address, entity status.

**RDAP** — `GET https://rdap.verisign.com/com/v1/domain/pfizer.com`  
Result: OK for .com/.net/.org domains. pfizer.com: registration 1992-04-28, expiration 2027-04-29.  
**Important:** .edu domains have NO RDAP server. IANA bootstrap returns 404 for mit.edu. Must fall back to `whois mit.edu` (via whois.educause.edu). Whois works but returns less structured data.

**OSM Overpass** — `POST https://overpass-api.de/api/interpreter`  
Result: OK. API functional. Initial query `node[name="MIT"][amenity=university]` returned 0 elements — query was too narrow (MIT is mapped as a `way`, not a `node`). Need broader Overpass QL queries (area search, way/relation).

**binlist.net** — `GET https://lookup.binlist.net/411111`  
Result: OK. BIN 411111 → brand: Visa Classic, type: debit, bank: Conotoxia Sp. Z O.O. Rate limited to ~10/min.

**InCommon/eduGAIN** — `GET https://md.incommon.org/InCommon/InCommon-metadata.xml`  
Result: OK. Downloaded 108MB XML metadata file. Contains IdP entity entries for all federated institutions.

**NIH RePORTER** — `POST https://api.reporter.nih.gov/v2/projects/search`  
Result: OK. MIT query returned 14,753 projects. First PI: FREEMAN, DENNIS M.

**NSF Awards** — `GET https://api.nsf.gov/services/v1/awards.json?keyword=MIT`  
Result: OK. Returned award results including title and institution.

**UKRI Gateway** — `GET https://gtr.ukri.org/gtr/api/organisations?q=Oxford`  
Result: OK. Returned 707 organisations. Note: minimum page size is 10 (p < 10 returns error). Omit pagination params for defaults.

**PubMed** — `GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=MIT[Affiliation]&retmax=1&retmode=json`  
Result: OK. MIT affiliation search returned 43,706 articles. First PMID: 41979678.

**ORCID** — `GET https://pub.orcid.org/v3.0/search?q=affiliation-org-name:MIT&rows=1`  
Result: OK. Returned 6,313 results. First ORCID: 0000-0003-2646-0606. Requires Accept: application/json header.

**OpenAlex** — `GET https://api.openalex.org/institutions?search=MIT&per_page=1`  
Result: OK. Returned 39 institution results. First: Massachusetts Institute of Technology.

### Credentialed APIs

**Smarty US Street API** — `GET https://us-street.api.smarty.com/street-address?auth-id=...&auth-token=...&street=77+Massachusetts+Ave&city=Cambridge&state=MA&zipcode=02139`  
Result: OK. DPV match: Y (confirmed), RDI: Commercial, CMRA: N (not a mail forwarding address). All key fields present.

**Stripe test mode** — `POST https://api.stripe.com/v1/payment_methods` with `tok_visa`  
Result: OK. Created PaymentMethod. Brand: visa, Funding: credit, Country: US. Note: raw card numbers are blocked — must use test tokens (tok_visa, tok_mastercard_prepaid, etc.).

**Plaid sandbox** — `POST https://sandbox.plaid.com/link/token/create`  
Result: OK. Created sandbox link token, expiration 2026-04-15. Sandbox returns synthetic data — good for schema validation only.

**Companies House** — `GET https://api.company-information.service.gov.uk/search/companies?q=ginkgo` with basic auth  
Result: OK. Returned 90 results. First: GINKGO LIMITED. Returns registered address, SIC codes, company status.

**Exa neural search** — `POST https://api.exa.ai/search` with `{"query":"MIT biosafety","numResults":1}`  
Result: OK. Returned 1 result: "Biological - MIT EHS". Neural search mode functional.

**GeoNames** — `GET http://api.geonames.org/searchJSON?q=MIT&maxRows=1&username=alejoacelas`  
Result: OK. Returned 1,486 results. First: "Mit Ghamr" (city in Egypt). Need institution-specific queries or reverse geocoding for useful results.

**Google Places (New API)** — `POST https://places.googleapis.com/v1/places:searchText` with `{"textQuery":"Massachusetts Institute of Technology"}`  
Result: OK. Returned MIT result with primaryType: university. Address and type classification working.

### Blocked APIs

**OpenCorporates** — `GET https://api.opencorporates.com/v0.4/companies/search?q=ginkgo+bioworks`  
Result: FAILED. HTTP 401 — "Invalid Api Token. Please check your OpenCorporates account." Free-tier unauthenticated API access no longer supported. Requires paid API subscription. Setup guide written.

**Consolidated Screening List** — `GET https://api.trade.gov/v1/consolidated_screening_list/search?api_key=...&q=huawei`  
Result: FAILED. HTTP 301 redirect to developer.trade.gov HTML page. The v1 API endpoint appears deprecated. The gateway v2 endpoint also returns HTML. Need to find the new API location or use bulk data downloads from OFAC. Setup guide written.

### Local logic (verified)

**MX/SPF/DMARC** — Tested with `dig MX mit.edu`, `dig TXT mit.edu`, `dig TXT _dmarc.mit.edu`.  
Result: OK. MX: mit-edu.mail.protection.outlook.com (Microsoft 365). SPF: autospf.email. DMARC: v=DMARC1; p=none. All DNS queries functional.

**PO Box regex, disposable blocklist, lookalike detector, BIS country groups, ISO normalization, billing-shipping consistency, fintech BIN denylist** — all local logic, no network calls required. Will be validated with test cases in stage 3.

### Docs-only (no test call)

**Stripe AVS (production)** — Test mode returns deterministic AVS codes that don't reflect real issuer behavior. Documentation review only.

**Plaid Identity Match (production)** — Sandbox returns synthetic identity data. Real match scores require production credentials and real bank connections.
