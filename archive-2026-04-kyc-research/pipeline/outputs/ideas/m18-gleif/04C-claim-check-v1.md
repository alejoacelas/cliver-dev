# m18-gleif — Claim check v1

**Document under review:** `04-implementation-v1.md`

## Verified claims

### GLEIF API base URL
- **Claim:** `https://api.gleif.org/api/v1/`
- **Cited:** [gleif.org/en/lei-data/gleif-api](https://www.gleif.org/en/lei-data/gleif-api)
- **Verified:** The GLEIF API page confirms this is the base URL. **PASS.**

### GLEIF API is anonymous and free
- **Claim:** "Anonymous — no API key required" and "There is no charge for the use of GLEIF's LEI data."
- **Cited:** [gleif.org/en/lei-data/gleif-api](https://www.gleif.org/en/lei-data/gleif-api) and [gleif.org/en/lei-data/access-and-use-lei-data](https://www.gleif.org/en/lei-data/access-and-use-lei-data)
- **Verified:** Both claims confirmed on the GLEIF site. **PASS.**

### GLEIF API rate limit
- **Claim:** "60 requests per minute per user."
- **Cited:** [gleif.org/en/lei-data/gleif-api](https://www.gleif.org/en/lei-data/gleif-api)
- **Verified:** The GLEIF API documentation confirms rate limiting at 60 requests per minute per user. **PASS.**

### Active LEI population ~2.8 million
- **Claim:** "~2.8 million active LEIs as of Q2 2025."
- **Cited:** [GLEIF blog post on LEI adoption in 2025](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)
- **Verified:** The GLEIF blog reports approximately 2.8 million active LEIs by Q2 2025 (93,000 issued in Q2, bringing total to 2.8M). **PASS.**

### Bulk download availability
- **Claim:** Daily concatenated file available for download in XML and CSV.
- **Cited:** [gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file)
- **Verified:** The download page confirms daily generation and availability. **PASS.**

### Level-2 RR-CDF v2.1 format
- **Claim:** Level-2 relationship records use the RR-CDF v2.1 format with `IS_DIRECTLY_CONSOLIDATED_BY` and `IS_ULTIMATELY_CONSOLIDATED_BY` relationship types.
- **Cited:** [gleif.org Level 2 RR-CDF page](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-relationship-record-rr-cdf-2-1-format)
- **Verified:** The GLEIF documentation confirms these relationship types and the v2.1 format. **PASS.**

### Level-2 "Who Owns Whom" page
- **Claim:** Entities report "direct accounting consolidating parent" and "ultimate accounting consolidating parent."
- **Cited:** [gleif.org Level 2 Who Owns Whom](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-who-owns-whom)
- **Verified:** Confirmed. **PASS.**

### Reporting exceptions
- **Claim:** Entities can file exceptions including `NON_PUBLIC`, `BINDING_LEGAL_OBSTACLES`, `NON_CONSOLIDATING`, etc.
- **Cited:** [gleif.org Level 2 Reporting Exceptions](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-reporting-exceptions-2-1-format)
- **Verified:** Confirmed. **PASS.**

### GLEIF Postman documentation
- **Claim:** API endpoints documented at Postman.
- **Cited:** [documenter.getpostman.com/view/7679680/SVYrrxuU](https://documenter.getpostman.com/view/7679680/SVYrrxuU)
- **Verified:** The Postman collection exists and documents the GLEIF API endpoints. **PASS.**

### LEI adoption driven by DORA and MiFID II
- **Claim:** EU adoption driven by regulatory mandates.
- **Cited:** [GLEIF blog](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)
- **Verified:** The blog explicitly mentions DORA as driving LEI adoption in 2025. **PASS.**

## Uncited claims flagged

### LEI coverage of research institutions
- **Claim:** "[best guess: fewer than 5% of US R1 universities have LEIs]"
- **Status:** Correctly marked as `[best guess]`. This is an important but unverified estimate. It could be checked by searching GLEIF for known R1 university names (e.g., "Harvard University", "Stanford University", "Massachusetts Institute of Technology"). A spot check might strengthen or weaken this estimate.
- **Flag:** **UPGRADE-SUGGESTED.** The estimate is plausible but a quick GLEIF API spot-check of 10–20 R1 universities would provide empirical grounding.

### API endpoint paths for parent/child lookup
- **Claim:** `GET /lei-records/{lei}/direct-parent` and `GET /lei-records/{lei}/ultimate-parent`
- **No direct citation** for these specific paths; derived from the Postman documentation.
- **Status:** The Postman collection suggests these endpoint patterns, and the GLEIF API page describes relationship-link traversal. Plausible. **PASS** with caveat that exact paths should be tested.

## Summary of flags

| # | Claim | Flag | Severity |
|---|---|---|---|
| 1 | R1 university LEI coverage "<5%" | UPGRADE-SUGGESTED | Low — correctly marked [best guess] |

## Verdict

**PASS.** All cited URLs resolve and substantively back their claims. The GLEIF API documentation is thorough and publicly accessible. One UPGRADE-SUGGESTED flag for the R1 LEI coverage estimate, which is correctly marked as a best guess. No broken URLs, no mis-citations, no overstated claims.
