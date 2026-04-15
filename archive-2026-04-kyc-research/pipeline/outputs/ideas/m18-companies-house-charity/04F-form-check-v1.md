# 04F form check — m18-companies-house-charity v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / summary | PASS | |
| external_dependencies | PASS | All four registries plus aggregator alternatives. |
| endpoint_details | PASS | Concrete URLs, auth, rate limits (CH cited), pricing, ToS, data freshness caveats. Charity Commission rate-limit `[unknown]` has 2 plausible queries. |
| fields_returned | PASS | Per-registry field lists. |
| marginal_cost_per_check | PASS | Per-source breakdown plus composite + setup. |
| manual_review_handoff | PASS | Seven-step playbook. |
| flags_thrown | PASS | Seven distinct flags including stale-data warning. |
| failure_modes_requiring_review | PASS | Seven concrete modes. |
| false_positive_qualitative | PASS | Six concrete cases. |
| record_left | PASS | |

## Borderline

- Charity Commission rate-limit `[unknown]` is borderline THIN-SEARCH (2 queries). Acceptable but could be tightened.
- Composite cost `[best guess]` has wide range ($0.05–$1); narrowing would require sales-contact research.

## For 4C to verify

- Companies House 600 requests / 5 minutes and free — verify on the [rate limiting guide](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting).
- OpenCorporates "data refresh times can be slow ... stale and incomplete" — verify on the [May 2025 blog](https://blog.opencorporates.com/2025/05/28/why-is-it-so-hard-to-find-us-company-data/).
- IRS TEOS bulk download formats — verify on the [bulk downloads page](https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads).
- "No good per-state SOS APIs" — verify on Middesk and DEV.to sources.

**Verdict:** PASS
