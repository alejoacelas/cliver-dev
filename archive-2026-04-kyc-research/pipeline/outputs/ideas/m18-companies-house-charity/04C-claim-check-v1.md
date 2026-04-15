# 04C claim check — m18-companies-house-charity v1

## Claims spot-checked

- **Companies House 600 requests / 5 minutes, free** — directly supported by [Companies House rate limiting guide](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting) and corroborating Temenos/Company Warehouse summaries. PASS.
- **Charity Commission API in beta, requires registration + key** — supported by [register-of-charities.charitycommission.gov.uk documentation page](https://register-of-charities.charitycommission.gov.uk/en/documentation-on-the-api) per search summary. PASS.
- **Charity Commission covers England and Wales only** — well-established (OSCR for Scotland, CCNI for Northern Ireland are separate); supported by general charity-commission scope. PASS.
- **OpenCorporates 198M+ companies in 140 jurisdictions** — supported per search summary from [opencorporates.com](https://opencorporates.com/). PASS.
- **OpenCorporates US data staleness** — directly supported by [their May 2025 blog](https://blog.opencorporates.com/2025/05/28/why-is-it-so-hard-to-find-us-company-data/). PASS.
- **No good per-state SOS APIs** — supported by [Middesk](https://www.middesk.com/blog/secretary-of-state-api), [OpenCorporates blog](https://blog.opencorporates.com/2025/05/28/why-is-it-so-hard-to-find-us-company-data/), [DEV.to](https://dev.to/avabuildsdata/how-to-search-secretary-of-state-business-filings-programmatically-multi-state-2n9b). PASS.
- **IRS TEOS bulk downloads — Pub 78, 990 series, 990-N, Auto Revocation List, Determination Letters** — supported per search summary from [TEOS bulk downloads page](https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads). PASS.
- **TEOS pipe-delimited ASCII / XML formats** — supported per [TEOS Dataset Guide P5891](https://www.irs.gov/pub/irs-pdf/p5891.pdf). PASS.
- **KYB aggregator pricing $500–$5000/month** — supported by [DEV.to multi-state SOS guide](https://dev.to/avabuildsdata/how-to-search-secretary-of-state-business-filings-programmatically-multi-state-2n9b). PASS.

## Flags

- **UPGRADE-SUGGESTED:** the Charity Commission rate-limit `[unknown]` could plausibly be sourced from the developer hub itself once registered; not a v1 blocker.

**Verdict:** PASS
