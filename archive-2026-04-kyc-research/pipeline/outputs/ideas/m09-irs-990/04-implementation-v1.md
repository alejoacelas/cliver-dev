# m09-irs-990 — implementation v1

- **measure:** M09 — institution-real-life-sciences
- **name:** IRS Form 990 / Candid / ProPublica Nonprofit Explorer cross-check
- **modes:** A
- **summary:** For US 501(c)(3) institutions, fetch the most recent Form 990 from (a) the IRS public AWS S3 bucket of e-filed 990s, (b) ProPublica Nonprofit Explorer API as a structured-search front end, and optionally (c) Candid (formerly GuideStar) for richer structured fields. Inspect total revenue, program-service expenses, board names, and program-description text for life-sciences alignment.

## external_dependencies

- IRS Form 990 e-file dataset on AWS S3 (`s3://irs-form-990`) ([source](https://registry.opendata.aws/irs990/)).
- ProPublica Nonprofit Explorer API v2 ([source](https://projects.propublica.org/nonprofits/api/)).
- Candid (formerly GuideStar) API as paid enrichment ([source](https://candid.org/use-our-data/apis)).
- IRS Form 990 series downloads index page (organizational metadata, EIN registration) ([source](https://www.irs.gov/charities-non-profits/form-990-series-downloads)).

## endpoint_details

- **IRS S3 bucket:** `https://s3.amazonaws.com/irs-form-990` — public HTTPS, no auth, no rate limit beyond AWS S3 defaults [best guess: AWS S3 standard request rate of 5,500 GET/sec/prefix is far above any screening volume]. Index file at `s3://irs-form-990/index.json` listing every filing with EIN, filer name, filing date, S3 path to the XML return. Filings from 2011 to present, refreshed monthly ([source](https://aws.amazon.com/blogs/publicsector/irs-990-filing-data-now-available-as-an-aws-public-data-set/)).
- **ProPublica Nonprofit Explorer API v2:** base `https://projects.propublica.org/nonprofits/api/v2/`. Endpoints: `/search.json?q=...` for full-text org search, `/organizations/{ein}.json` for full org detail. **Free, no auth required, simple Data Terms of Use** ([source](https://projects.propublica.org/nonprofits/api/)). Rate limit not officially documented [unknown — searched for: "ProPublica Nonprofit Explorer API rate limit", "propublica nonprofits api throttling", "propublica nonprofits api requests per minute"].
- **Candid (GuideStar) API:** REST + JSON. Free 30-day trial; production pricing not publicly listed (sales-gated) ([source](https://candid.org/use-our-data/apis)). [vendor-gated — Candid publishes API product names (Essentials, Premier, etc.) and the data fields they return; enterprise pricing requires sales contact]. Candid Premium personal subscription is $1,199/year for the GUI but is not the API plan ([source](https://guidestar.candid.org/guidestar-pro-pricing/)).
- **ToS:** IRS data is public; ProPublica Data Terms permit redistribution with attribution; Candid is a commercial license.

## fields_returned

- **IRS 990 XML (e-filed Form 990):** EIN, organization name (and prior names), tax year, total_revenue, total_expenses, net_assets, program_service_expenses, fundraising_expenses, mission_statement, program_service_accomplishments (free text descriptions), officers/directors/key employees with compensation, principal_office_address, NTEE category code, schedule O narrative, schedule J compensation detail, plus 100+ other line items ([source](https://github.com/Nonprofit-Open-Data-Collective/irs-990-efiler-database)).
- **ProPublica Nonprofit Explorer API response:** organization metadata (ein, name, address, ntee_code, subsection_code [501(c)(3) etc.], classification_codes, ruling_date, asset_amt, income_amt), filings array each with tax_period, fiscal year, totrevenue, totfuncexpns, totassetsend, pdf_url, and 40–120 form-specific line items depending on form type (990 / 990-EZ / 990-PF) ([source](https://projects.propublica.org/nonprofits/api/)).
- **Candid API:** advertised richer fields including IRS BMF data, financial trends, leadership, programs, and Candid Seal (GuideStar transparency rating). Specific field list is `[vendor-gated; published as marketing categories — "Essentials", "Premier", "Charity Check" — without per-field schemas in public docs]` ([source](https://candid.org/use-our-data/apis)).

## marginal_cost_per_check

- **IRS S3 + ProPublica:** $0 marginal (both free).
- **Candid enrichment:** [vendor-gated]; comparable nonprofit-data APIs price in the $5–$50/customer range for enterprise contracts [best guess: extrapolated from typical KYC/data-enrichment vendor ranges; Candid does not publish per-call pricing].
- **Setup cost:** ~3 engineering days to wire ProPublica + S3 index lookup + 990 XML parser. The XML schema is well-documented by community projects (irs990efile R package, Nonprofit Open Data Collective tooling).

## manual_review_handoff

- Reviewer receives: customer's stated org name, its claimed EIN if any, the matched ProPublica record, the most recent Form 990's parsed fields (revenue, mission statement, program description, NTEE code), and the flag(s) thrown.
- Playbook:
  1. **Match found, has Form 990 in last 2 years, NTEE code in life-sciences range (H-Medical Research, B-Education-Higher Ed, U-Science & Technology, V-Social Science, F-Mental Health), program description mentions wet-lab / molecular / biology / genomics / pathogen / vaccine / therapy / diagnostic etc.:** pass.
  2. **Match found but only 990-N postcards (organizations < $50k gross receipts) — no financial detail:** flag `990_revenue_implausible` (low signal — typical of community labs and small startups). Reviewer escalates to publication / website signals.
  3. **Match found but NTEE code is non-life-sciences (e.g., A — Arts, T — Philanthropy):** flag `990_program_not_life_sciences`. Reviewer reads program description.
  4. **No match in IRS/ProPublica:** flag `no_990`. Either the org isn't a US 501(c)(3) (foreign, for-profit, government) and this check is non-applicable, or it's brand new (< 1 filing year), or it doesn't exist.
  5. **Revenue suspiciously low for claimed scope:** flag `990_revenue_implausible`. A claimed "biotech research nonprofit" with $5k annual revenue is incongruent.

## flags_thrown

- `no_990` — no IRS / ProPublica record exists. Action: confirm whether the customer is even claiming 501(c)(3) status; if not, this check is N/A.
- `990_revenue_implausible` — revenue too low for claimed scope, OR only 990-N postcards.
- `990_program_not_life_sciences` — NTEE code or mission text doesn't match life-sciences.

## failure_modes_requiring_review

- Smallest nonprofits (< $50k gross receipts) file the 990-N "e-postcard" which contains only EIN, name, address, and confirmation of small size — no financial or program data ([source](https://www.irs.gov/charities-non-profits/form-990-series-downloads)).
- Filing lag — a nonprofit's most recent 990 may be 12–18 months stale because Form 990 is due 5 months after fiscal year end with extensions.
- Name disambiguation across "Foundation Inc" / "Research Institute" / "Trust" name variants.
- Mid-year EIN reuse / org rename (rare but happens).
- Foreign affiliates of US 501(c)(3)s have their own EIN issues.
- IRS S3 bucket monthly refresh — recently filed returns may be missing.

## false_positive_qualitative

- New 501(c)(3)s (< 1 fiscal year) trip `no_990` legitimately.
- Community / DIY-bio nonprofits that genuinely operate at < $50k revenue and only file 990-N — `990_revenue_implausible` is a structural false positive.
- Fiscally sponsored projects that don't have their own EIN and operate under a fiscal sponsor's 990 — the customer name will not match.
- Foreign nonprofit research orgs (UK charities, German e.V., Indian Section 8 companies) — not in IRS data at all; this check is N/A and reviewer falls back to corp-registry-stack.
- For-profit small biotechs (the majority of biotech) — `no_990` is correct but uninformative.

## record_left

- ProPublica JSON response, parsed Form 990 fields (revenue, NTEE, mission text, program description), S3 path to source XML, query timestamp.

## bypass_methods_known

[deferred to stage 5]

## bypass_methods_uncovered

[deferred to stage 5]

---

**Sources cited:**
- IRS 990 AWS public dataset: https://registry.opendata.aws/irs990/
- AWS public sector blog on IRS 990 dataset: https://aws.amazon.com/blogs/publicsector/irs-990-filing-data-now-available-as-an-aws-public-data-set/
- IRS Form 990 series downloads: https://www.irs.gov/charities-non-profits/form-990-series-downloads
- ProPublica Nonprofit Explorer API v2: https://projects.propublica.org/nonprofits/api/
- Candid APIs: https://candid.org/use-our-data/apis
- GuideStar Pro pricing: https://guidestar.candid.org/guidestar-pro-pricing/
- Nonprofit Open Data Collective irs-990-efiler-database (XML schema reference): https://github.com/Nonprofit-Open-Data-Collective/irs-990-efiler-database
