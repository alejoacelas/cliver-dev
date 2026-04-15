# m09-corp-registry-stack — implementation v1

- **measure:** M09 — institution-real-life-sciences
- **name:** Companies House / SEC EDGAR / OpenCorporates / foreign registry stack
- **modes:** D, A
- **summary:** Verify the institution's legal existence and life-sciences scope of activity by querying the appropriate national corporate registry. For UK customers: Companies House. For US public companies: SEC EDGAR. For US private companies and most other jurisdictions: OpenCorporates as the cross-jurisdiction aggregator. Capture incorporation date, status, registered office, officers, SIC/NAICS code.

## external_dependencies

- UK Companies House Public Data API ([source](https://developer.company-information.service.gov.uk/developer-guidelines))
- SEC EDGAR full-text search and submissions API ([source](https://www.sec.gov/search-filings/edgar-application-programming-interfaces))
- OpenCorporates API (cross-jurisdiction aggregator covering 140+ jurisdictions) ([source](https://api.opencorporates.com/))
- Country-specific registries as fallback (US Secretary of State portals, German Handelsregister, French INPI/Infogreffe, etc.) — typically scraped or accessed via OpenCorporates' wrapper.

## endpoint_details

- **Companies House:** `https://api.company-information.service.gov.uk/` — REST + JSON, HTTP Basic auth with a free API key. **Rate limit: 600 requests per 5-minute window** ([source](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting)). Free for non-commercial and commercial use under the developer guidelines. Endpoints used: `/search/companies`, `/company/{number}`, `/company/{number}/officers`.
- **SEC EDGAR:** `https://data.sec.gov/submissions/CIK{cik}.json` and full-text search at `https://efts.sec.gov/LATEST/search-index?q=...`. No auth; required `User-Agent` header naming the requesting org. **Rate limit: 10 requests/second per IP** ([source](https://www.sec.gov/about/developer-resources)). Free.
- **OpenCorporates:** `https://api.opencorporates.com/v0.4/companies/search` — REST + JSON. Self-serve commercial plans (2026): **Essentials £2,250/year, Starter £6,600/year, Basic £12,000/year**, Enterprise priced on request ([source](https://opencorporates.com/pricing/)). Request-metered: even no-result searches consume a call. Effective ~£0.20/call on Basic plan ([source](https://zephira.ai/opencorporates-pricing-explained-2026-plans-api-limits-licensing-and-what-it-means-in-production/)). API key auth.
- **ToS constraints:** Companies House data is open under the UK Open Government Licence; SEC EDGAR is US public domain. OpenCorporates' commercial terms restrict redistribution and require a paid plan for any production / customer-screening use ([source](https://opencorporates.com/legal-information/enterprise-api-terms-of-service/)).

## fields_returned

- **Companies House `/company/{number}`:** company_number, company_name, company_status (active/dissolved/liquidation), company_type (ltd/plc/llp/etc.), date_of_creation, registered_office_address, sic_codes (array of 5-digit UK SIC 2007 codes), accounts info (last/next due dates), confirmation_statement info, has_charges, has_insolvency_history. Officers endpoint returns name, role, date_of_birth (year/month only), nationality, occupation, appointed_on/resigned_on ([source](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/charges)).
- **SEC EDGAR submissions:** CIK, name, sic, sicDescription, ein, ownerOrg, addresses, formerNames, recent filings (form, filingDate, accessionNumber, primaryDocument). Full-text search returns matching filings with snippet and metadata.
- **OpenCorporates company record:** name, company_number, jurisdiction_code, incorporation_date, dissolution_date, company_type, registry_url, branch, current_status, registered_address, industry_codes (NAICS/SIC/local), previous_names, officers, source/data_provenance ([source](https://api.opencorporates.com/documentation/API-Reference)).

## marginal_cost_per_check

- **Companies House:** $0 (free API).
- **SEC EDGAR:** $0.
- **OpenCorporates:** ~£0.20 (~$0.25) per call on the Basic plan, or annual flat fee divided by usage. For a screening operation running 10k checks/year, Basic plan amortizes to ~£1.20/check; running 50k checks/year, ~£0.24/check ([source](https://zephira.ai/opencorporates-pricing-explained-2026-plans-api-limits-licensing-and-what-it-means-in-production/)).
- **Combined cost per customer:** $0.25–$1.50 [best guess: dominated by the OpenCorporates call when the customer is not in CH or EDGAR jurisdiction].
- **Setup cost:** ~3–5 engineering days for the routing layer (jurisdiction detection → registry selection → fallback chain). [best guess: standard API integration effort for 3 endpoints with normalization.]

## manual_review_handoff

- Reviewer receives: customer's stated legal name, registered address, jurisdiction; the routing decision (which registry was queried); raw response from each tried registry; the matched record (if any) with its incorporation date, status, SIC/NAICS, registered address.
- Playbook:
  1. **Match found, status active, SIC/NAICS in life-sciences range** (UK SIC 72110/72190/21100/21200/86900; NAICS 5417/3254/6215/6113), **incorporation > 2 years old:** pass.
  2. **Match found, dissolved/liquidation:** flag `registry_dissolved`, escalate. The customer cannot legally trade.
  3. **Match found, SIC not life-sciences (e.g., consulting, holdings, real estate):** flag `sic_not_life_sciences`. Reviewer reads the company name and activities; many small biotechs use generic SIC codes ("scientific R&D" 72190 or even "management consultancy" 70229). Not auto-deny.
  4. **Match found, incorporation < 12 months:** flag `registry_recent_incorp`. Combine with other M09 signals (domain age, publications); a real new biotech is plausible, but cluster of recent-incorp + new domain + no PubMed footprint is the shell-company pattern.
  5. **No match in any tried registry:** flag `registry_no_record`. Reviewer manually checks the relevant Secretary of State portal (US) or national registry web search to rule out OpenCorporates coverage gap.

## flags_thrown

- `registry_no_record` — institution name not found in any queried registry. Reviewer escalates.
- `registry_dissolved` — record exists but status is dissolved/liquidation/struck-off. Auto-block + reviewer notification.
- `sic_not_life_sciences` — record exists but SIC/NAICS does not include any life-sciences code. Reviewer adjudicates.
- `registry_recent_incorp` — record exists, incorporated < 12 months ago. Reviewer combines with other signals.

## failure_modes_requiring_review

- **OpenCorporates coverage gaps** — many state-level US private LLCs are present, but data freshness varies; some emerging-market jurisdictions are sparse [source: OpenCorporates' own coverage page lists 140+ jurisdictions but with varying completeness](https://api.opencorporates.com/).
- **SIC misclassification** — small biotechs frequently file under generic codes ("other professional, scientific and technical activities") to avoid disclosure of niche, leading to false `sic_not_life_sciences` flags.
- **Name disambiguation** — common-word names ("Genomic Health Inc") return many candidates; reviewer must use registered address or officer name to disambiguate.
- **API errors / 429 throttling** — Companies House 429s after 600/5min, EDGAR after 10/sec. Need retry with backoff.
- **OpenCorporates request-metered cost** for no-match searches ([source](https://zephira.ai/opencorporates-pricing-explained-2026-plans-api-limits-licensing-and-what-it-means-in-production/)) means coverage-gap jurisdictions still spend budget.

## false_positive_qualitative

- Real-but-newly-incorporated biotechs (NewCo spinouts, university spinouts in their first year) trip `registry_recent_incorp`.
- Real biotechs whose registered legal entity is a holding company filed under generic SIC trip `sic_not_life_sciences`.
- US LLCs registered in pass-through states (Delaware, Wyoming, New Mexico) where the registered office is a registered-agent address — hard to distinguish from the shell pattern at this layer.
- Foreign academic/government institutions that are not in any corporate registry at all (state-owned research institutes in Asia, regional CIS institutes) — `registry_no_record` even though they're real.

## record_left

- JSON snapshot of the registry response(s) and a "registry verification record" with fields: queried_name, queried_jurisdiction, registries_tried, matched_company_number, matched_registered_address, matched_status, matched_sic_codes, incorporation_date, query_timestamp.

## bypass_methods_known

[deferred to stage 5]

## bypass_methods_uncovered

[deferred to stage 5]

---

**Sources cited:**
- Companies House developer guidelines: https://developer.company-information.service.gov.uk/developer-guidelines
- Companies House rate limiting: https://developer-specs.company-information.service.gov.uk/guides/rateLimiting
- Companies House API reference: https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/charges
- SEC EDGAR developer resources: https://www.sec.gov/about/developer-resources
- SEC EDGAR APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- OpenCorporates API: https://api.opencorporates.com/
- OpenCorporates pricing: https://opencorporates.com/pricing/
- OpenCorporates API reference: https://api.opencorporates.com/documentation/API-Reference
- OpenCorporates enterprise ToS: https://opencorporates.com/legal-information/enterprise-api-terms-of-service/
- OpenCorporates 2026 pricing analysis: https://zephira.ai/opencorporates-pricing-explained-2026-plans-api-limits-licensing-and-what-it-means-in-production/
