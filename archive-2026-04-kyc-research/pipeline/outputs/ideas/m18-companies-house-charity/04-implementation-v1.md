# m18-companies-house-charity — implementation v1

- **measure:** M18 (institution-legitimacy-soc)
- **name:** UK CH + Charity Commission + US SOS + IRS TEOS
- **modes:** D, A
- **summary:** Verify the customer's claimed institution exists as a legal entity by querying national/state corporate, charity, and nonprofit registries: UK Companies House (companies), UK Charity Commission for England and Wales (charities), US state Secretaries of State (companies, via OpenCorporates aggregation given no usable per-state APIs), and IRS Tax Exempt Organization Search (TEOS) for US nonprofits. Returns legal status (active / dissolved / lapsed), incorporation date, registered office, officers, and where applicable charitable status. Catches "shell-company," "dissolved-company," "fake-nonprofit" attacker stories at the legal-existence layer.

## external_dependencies

- **UK Companies House developer API** ([developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk/get-started)).
- **UK Charity Commission Register of Charities API** ([register-of-charities.charitycommission.gov.uk/en/documentation-on-the-api](https://register-of-charities.charitycommission.gov.uk/en/documentation-on-the-api); developer hub at [api-portal.charitycommission.gov.uk](https://api-portal.charitycommission.gov.uk/)).
- **US state Secretaries of State** — 50 separate state registers with no national API.
- **OpenCorporates** as the aggregation layer for US SOS data ([opencorporates.com](https://opencorporates.com/); [API docs](https://api.opencorporates.com/documentation/API-Reference)).
- **IRS Tax Exempt Organization Search (TEOS)** ([apps.irs.gov/app/eos/](https://apps.irs.gov/app/eos/)) and the Exempt Organizations Business Master File Extract bulk download ([irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads](https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads)).
- Optionally, alternatives to OpenCorporates: Middesk, Cobalt Intelligence, LexisNexis (KYB aggregators) per [Middesk SOS API blog](https://www.middesk.com/blog/secretary-of-state-api).

## endpoint_details

### UK Companies House
- **Base URL:** `https://api.company-information.service.gov.uk` (per [developer guide](https://developer.company-information.service.gov.uk/get-started)).
- **Auth:** API key (free) via developer account.
- **Rate limit:** **600 requests per 5-minute window** (~2/s) per [Companies House rate limiting guide](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting). 429 returned on excess. Higher limits available on request, not guaranteed.
- **Pricing:** **free** ([Temenos overview of CH API](https://journey.temenos.com/images/exchange-packages/companieshouse-Readme.html); [Company Warehouse blog](https://www.thecompanywarehouse.co.uk/blog/companies-house-api)).
- **ToS:** standard UK gov open data; commercial use permitted.

### UK Charity Commission
- **Developer portal:** [api-portal.charitycommission.gov.uk](https://api-portal.charitycommission.gov.uk/).
- **Auth:** API key after free registration.
- **Status:** beta as of [the documentation page](https://register-of-charities.charitycommission.gov.uk/en/documentation-on-the-api).
- **Rate limit:** explicit rate limiting applied; specific numbers `[unknown — searched for: "Charity Commission API rate limit", "register of charities API rate limit per minute"]`. `[best guess: similar order of magnitude to Companies House — low hundreds per minute.]`
- **Pricing:** free.
- **Coverage:** charities registered in **England and Wales only**. Scotland (OSCR) and Northern Ireland (CCNI) are separate registries with their own portals.

### US Secretaries of State (via OpenCorporates)
- **URL:** `https://api.opencorporates.com/v0.4/` ([API Reference](https://api.opencorporates.com/documentation/API-Reference)).
- **Auth:** API key.
- **Coverage:** "50 US state registers into a standardized schema" per OpenCorporates; 198M+ companies across 140 jurisdictions ([OpenCorporates](https://opencorporates.com/)).
- **Pricing:** OpenCorporates has free tier for low volume + paid tiers; aggregator KYB services like Middesk/Cobalt are $500–$5,000/month per [DEV.to multi-state SOS guide](https://dev.to/avabuildsdata/how-to-search-secretary-of-state-business-filings-programmatically-multi-state-2n9b).
- **Direct SOS APIs:** "every state has a business entity registry, but none of them have good APIs" — direct integration with all 50 is impractical ([OpenCorporates blog: Why is it so hard to find US Company data?](https://blog.opencorporates.com/2025/05/28/why-is-it-so-hard-to-find-us-company-data/)).
- **Data freshness caveat:** "OpenCorporates' data refresh times can be slow in some places – even in the U.S. – so its data can be stale and incomplete" per the same OpenCorporates blog. Important for the "dissolved-company" detection use case.
- **ToS:** OpenCorporates ToS restricts redistribution; consuming the data for an internal screening decision is generally permitted on paid tiers.

### IRS TEOS
- **Web tool:** [apps.irs.gov/app/eos/](https://apps.irs.gov/app/eos/).
- **Bulk data downloads:** [irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads](https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads). Includes Pub. 78 Data, Form 990 series returns, Form 990-N, Automatic Revocation List, and copies of Determination Letters per [TEOS bulk downloads page](https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads).
- **Bulk format:** pipe-delimited ASCII text; some XML for e-filed returns per [TEOS Dataset Guide P5891](https://www.irs.gov/pub/irs-pdf/p5891.pdf).
- **Auth:** anonymous public; no API key.
- **Public API:** `[unknown — searched for: "IRS TEOS REST API", "IRS Tax Exempt Organization Search API", "TEOS programmatic access"]`. The bulk downloads are the canonical programmatic path; there is no documented JSON API.
- **Pricing:** free.

## fields_returned

### Companies House (per company endpoint)
- company_number, company_name, company_status (active / dissolved / liquidation / etc.), date_of_creation, date_of_cessation, jurisdiction, registered_office_address, sic_codes, type, accounts (filing dates and overdue flag), confirmation_statement (filing dates), officers (separate endpoint), persons-with-significant-control (separate endpoint), filing_history (separate endpoint).

### Charity Commission API
- organisation_number, registered_charity_number, group_subsidy_suffix, charity_name, registration_status, date_of_registration, date_of_removal, charitable activities and area-of-operation fields per [register-of-charities.charitycommission.gov.uk documentation](https://register-of-charities.charitycommission.gov.uk/en/documentation-on-the-api).

### OpenCorporates
- jurisdiction, company_number, name, current_status, incorporation_date, dissolution_date, company_type, registered_address, agent_name, agent_address, officers, branch info per [OpenCorporates API Reference](https://api.opencorporates.com/documentation/API-Reference).

### IRS TEOS
- EIN, organization name, in care of name, city, state, country, deductibility code, NTEE code (where present), revocation status (from Automatic Revocation List), 990 filing artifacts including revenue/asset figures, determination letter PDF where available. Per [TEOS Dataset Guide P5891](https://www.irs.gov/pub/irs-pdf/p5891.pdf).

## marginal_cost_per_check

- **UK Companies House:** $0.
- **UK Charity Commission:** $0.
- **OpenCorporates:** depends on tier. `[best guess: $0.05–$0.50 per company lookup at moderate volume on a paid OpenCorporates tier; KYB aggregators (Middesk, Cobalt) at $500–$5K/month effectively price out at $0.10–$5 per check depending on volume per [DEV.to guide](https://dev.to/avabuildsdata/how-to-search-secretary-of-state-business-filings-programmatically-multi-state-2n9b).]`
- **IRS TEOS:** $0 marginal if using a local mirror of the bulk download; analyst time for individual lookups otherwise.
- **Composite per check (one customer touching all four):** `[best guess: $0.05–$1 marginal, dominated by the OpenCorporates / KYB aggregator side.]`
- **Setup cost:** `[best guess: $20K–$60K to integrate all four sources, normalize fields, set up the bulk-mirror refresh for TEOS, and resolve cross-jurisdiction name matching.]`

## manual_review_handoff

When `registry_no_record` or `registry_dissolved` fires:

1. Reviewer identifies the registry expected to contain the customer (UK company → CH; UK charity → CC; US company → OpenCorporates; US nonprofit → TEOS).
2. Reviewer queries directly with name variants and stated company/charity number if customer provided one.
3. **No record found:** reviewer asks the customer for their company number / charity number / EIN. Re-queries.
4. **Still no record:** check whether the institution might exist in a registry not in the stack (Scotland OSCR, NI CCNI, foreign equivalent, US single-state niche registry). Document gap; consider voucher path (m20).
5. **Dissolved status:** treat as denial-by-default; require explicit customer explanation (e.g., recent re-incorporation under a new entity); biosecurity-officer review.
6. **Officers / PSC pattern matches a known shell signal** (registered agent at a mass-formation address, single-officer company with no filings): escalate to the m18-cross-shell-graph idea for cross-shell linkage analysis.
7. **TEOS Automatic Revocation List hit:** the org has lost tax-exempt status — strong negative signal for nonprofit legitimacy claim.

## flags_thrown

- `registry_no_record` — no match in the relevant registry.
- `registry_dissolved` — match exists but is in dissolved/struck-off/liquidation status.
- `registry_filing_overdue` — for Companies House, accounts/confirmation-statement overdue (a soft signal of dormancy).
- `teos_revoked` — IRS Automatic Revocation List hit.
- `teos_no_record` — claimed nonprofit not in TEOS / EO BMF.
- `registry_recently_incorporated` — company exists but incorporation date is suspiciously recent relative to customer claims of an established institution.
- `registry_stale_data_warning` — OpenCorporates reports the SOS source as stale; treat the negative as soft.

## failure_modes_requiring_review

- **OpenCorporates staleness.** Per [OpenCorporates 2025 blog](https://blog.opencorporates.com/2025/05/28/why-is-it-so-hard-to-find-us-company-data/), some US state data lags. A "no record" for a recent incorporation may be a false negative.
- **State coverage uneven.** Some states (Wyoming, New Mexico, Delaware) are particularly opaque — anonymous LLCs, no officer disclosure.
- **Charity Commission scope** — England and Wales only. Scottish charities (OSCR) and Northern Ireland (CCNI) need separate handling.
- **Foreign entities** entirely outside the stack — requires an extension to other national registries (BvD ORBIS, OpenCorporates non-US, GLEIF) for non-US/UK customers.
- **Name normalization** — "ACME Inc.", "ACME Incorporated", "ACME, Inc." may not match cleanly across registries.
- **Charity Commission API beta status** ([per docs](https://register-of-charities.charitycommission.gov.uk/en/documentation-on-the-api)) — may have stability or coverage issues.
- **TEOS lag** — IRS bulk file is updated monthly; very recently revoked organizations may not yet show.

## false_positive_qualitative

- New legitimate startups whose state SOS data hasn't propagated to OpenCorporates yet.
- Foreign academic institutions outside the US/UK whose home registry isn't in the stack.
- US 501(c)(3)s in the determination-pending state (applied for tax-exempt status, not yet ruled).
- Recently-dissolved entities in legitimate wind-down (e.g., research org folded into a parent — the staff and PI continuity is real but the legal entity is gone).
- Sole-proprietorships / unincorporated research collectives that exist but have no registry entry by design.
- Charities registered under non-EW UK jurisdictions (Scotland, NI).

## record_left

- Per registry queried: query terms, response payload, timestamp.
- Snapshot of the matched record (or absence) saved to the customer file.
- Officer / PSC list snapshot from CH; agent snapshot from OpenCorporates SOS source.
- 990 / determination letter PDF reference for TEOS hits.
- Reviewer's adjudication memo for any flagged result.
- Sufficient artifact set to demonstrate the negative was investigated thoroughly.

## Sourcing notes

- Companies House rate limit (600 / 5 min) and free pricing are both directly documented at the Companies House developer portal.
- OpenCorporates' explicit acknowledgment of data staleness in [their own May 2025 blog](https://blog.opencorporates.com/2025/05/28/why-is-it-so-hard-to-find-us-company-data/) is the load-bearing caveat for this idea — it's a key reason this check produces softer signals than its UK equivalent.
- The "no good per-state SOS APIs" finding is consistent across [the OpenCorporates blog](https://blog.opencorporates.com/2025/05/28/why-is-it-so-hard-to-find-us-company-data/), [Middesk's SOS API blog](https://www.middesk.com/blog/secretary-of-state-api), and the [DEV.to multi-state guide](https://dev.to/avabuildsdata/how-to-search-secretary-of-state-business-filings-programmatically-multi-state-2n9b). Aggregation is structurally necessary.
