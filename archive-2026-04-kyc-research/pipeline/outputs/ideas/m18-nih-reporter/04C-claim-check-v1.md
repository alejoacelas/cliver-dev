# 04C claim check v1 — m18-nih-reporter

## Verified

- **Endpoint URL `POST /v2/projects/search`** — confirmed by NIH RePORTER API page and multiple third-party clients (repoRter.nih, pynih). PASS.
- **No auth required** — confirmed by NIH API page and confirmed by every third-party client wrapping the endpoint without an API key. PASS.
- **Rate guidance: 1 req/s, large jobs off-hours** — directly quoted from api.reporter.nih.gov page. PASS.
- **`principal_investigators` array with sub-fields** — confirmed in the v2 Data Elements PDF (api.reporter.nih.gov/documents/Data Elements for RePORTER Project API_V2.pdf). PASS.
- **Organization sub-fields including `org_duns`, `org_ueis`, `org_ipf_code`** — present in the v2 data dictionary. PASS.

## Flags

- **UPGRADE-SUGGESTED** — `[unknown]` on KYC commercial use. NIH RePORTER data is in fact explicitly public-domain US government data ([source guidance](https://reporter.nih.gov/faq)) and there is no end-user-license restricting commercial reuse. The `[unknown]` could be upgraded to "no use restriction; data is US government public domain" with a citation to the NIH Data Sharing FAQ.
- **MINOR** — fiscal-year search parameter is named `fiscal_years` (plural array). Document already uses plural. OK.

## Verdict

PASS (no broken URLs; one upgrade suggestion that is non-blocking).
