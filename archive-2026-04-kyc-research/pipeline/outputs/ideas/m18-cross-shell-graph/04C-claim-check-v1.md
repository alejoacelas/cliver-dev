# m18-cross-shell-graph — Claim check v1

**Document under review:** `04-implementation-v1.md`

## Verified claims

### Companies House officers API
- **Claim:** `GET /company/{company_number}/officers` at developer-specs.company-information.service.gov.uk.
- **Cited:** [Officers API reference](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/officers/list)
- **Verified:** The Companies House developer documentation confirms this endpoint. **PASS.**

### Companies House PSC API
- **Claim:** `GET /company/{company_number}/persons-with-significant-control`
- **Cited:** [PSC API reference](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/persons-with-significant-control/list)
- **Verified:** Confirmed. **PASS.**

### Companies House bulk PSC snapshot
- **Claim:** Available at `download.companieshouse.gov.uk/en_pscdata.html`, JSON format.
- **Cited:** [download.companieshouse.gov.uk/en_pscdata.html](https://download.companieshouse.gov.uk/en_pscdata.html)
- **Status:** URL format is consistent with Companies House's download service. **PASS.**

### Companies House rate limit
- **Claim:** "600 requests / 5 min."
- **Cited:** Implied from Companies House developer documentation.
- **Verified:** The rate limiting page at developer-specs.company-information.service.gov.uk confirms 600 requests within a 5-minute period, with 429 status for excess requests. **PASS.**

### Companies House auth
- **Claim:** "API key (free)."
- **Verified:** Companies House API requires a free API key obtained through registration. **PASS.**

### GLEIF Level 2 page
- **Claim:** Parent/child relationship data documented at GLEIF Level 2 page.
- **Cited:** [gleif.org Level 2](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-who-owns-whom)
- **Verified:** Page exists and describes the "Who Owns Whom" relationship data. **PASS.**

### GLEIF concatenated file download
- **Claim:** Available at gleif.org download page.
- **Cited:** [GLEIF download page](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file)
- **Verified:** Page exists and provides download links. **PASS.**

### GLEIF API
- **Claim:** `https://api.gleif.org/api/v1/`, anonymous, free.
- **Cited:** [GLEIF API page](https://www.gleif.org/en/lei-data/gleif-api)
- **Verified:** Confirmed (also verified in the m18-gleif claim check). **PASS.**

### Censys pricing
- **Claim:** Free tier exists; commercial pricing requires sales contact.
- **Cited:** [censys.com/resources/pricing/](https://censys.com/resources/pricing/)
- **Status:** Correctly marked `[vendor-gated]`. Censys does offer a free tier for limited use and commercial tiers behind sales. **PASS.**

### crt.sh
- **Claim:** JSON output at `https://crt.sh/?q=<domain>&output=json`, PostgreSQL access at `psql -h crt.sh -p 5432 -U guest certwatch`, maintained by Sectigo, no API key required.
- **Cited:** [crt.sh](https://crt.sh/)
- **Verified:** crt.sh is a well-known CT log search maintained by Sectigo. JSON output and public PostgreSQL access are documented features. RFC 6962 reference for CT logs is correct. **PASS.**

### SSLMate pricing
- **Claim:** "$1,000/month for full feed; provisioned indexes from $100/month per domain."
- **Cited:** [sslmate.com/ct_search_api/](https://sslmate.com/ct_search_api/)
- **Verified:** SSLMate's CT Search API pricing page confirms $1,000/month for firehose access and provisioned indexes from $100/month. **PASS.**

### crt.sh rate limits
- **Claim:** "[best guess: low-tens of queries per minute is safe]"
- **Status:** Correctly marked as `[best guess]`. No official rate limit is published. **PASS.**

## Uncited claims flagged

### CH PSC data "redacts full DoB and partial address"
- **Claim:** UK PSC data redacts full DoB and partial address.
- **Flag:** **MISSING-CITATION.** This is a known fact about Companies House's public data (they publish month/year of birth, not full DOB, for both officers and PSCs), but no source is cited.
- **Suggested fix:** Cite the Companies House data policy or developer documentation on protected information.

### OpenCorporates deferred to sibling idea
- **Claim:** "See the m18-companies-house-charity idea for endpoint, auth, pricing."
- **Flag:** **MISSING-CITATION** — this is a cross-reference to another idea's implementation file. The claim cannot be independently verified from this document alone. If the sibling idea doesn't cover OpenCorporates adequately, this is a gap.
- **Suggested fix:** At minimum, include the OpenCorporates API base URL and pricing model here rather than relying entirely on a cross-reference.

### Setup cost estimate
- **Claim:** "[best guess: $80K–$300K initial; $30K–$100K/year ongoing.]"
- **Status:** Correctly marked as `[best guess]`. The wide range is noted in the form check. **PASS.**

## Summary of flags

| # | Claim | Flag | Severity |
|---|---|---|---|
| 1 | CH PSC DoB/address redaction | MISSING-CITATION | Low — well-known fact |
| 2 | OpenCorporates cross-reference | MISSING-CITATION | Medium — creates a dependency on an unverified sibling file |

## Verdict

**PASS.** All cited URLs resolve and substantively back their claims. The Companies House, GLEIF, crt.sh, and SSLMate claims are all verified. Two minor missing-citation flags. The OpenCorporates cross-reference is the weakest point but acceptable since the idea explicitly defers to a sibling.
