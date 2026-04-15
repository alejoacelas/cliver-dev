# m07-google-site-search — Implementation v1

- **measure:** M07 — institution-affiliation-low-scrutiny
- **name:** site:domain name search
- **modes:** A
- **summary:** For each new customer, run `site:<institution-domain> "<customer name>"` against a programmatic web-search API. A non-empty hit set on faculty/lab/news/publication pages on the institution's own domain corroborates the customer's claimed affiliation.

## external_dependencies

- A web-search API capable of restricted-domain queries. As of 2026 the two historically obvious choices are **both effectively unavailable to new integrators**:
  - **Google Custom Search JSON API / Programmable Search Engine** — "closed to new customers"; existing customers must transition off by **January 1, 2027**. The Site-Restricted variant ceased serving traffic on January 8, 2025. ([Google CSE JSON API overview](https://developers.google.com/custom-search/v1/overview), [Site Restricted API doc](https://developers.google.com/custom-search/v1/site_restricted_api))
  - **Microsoft Bing Web Search API** — retired August 11, 2025; replacement is "Grounding with Bing Search" inside Azure AI Foundry, which returns model-mediated citations rather than raw SERPs and costs 40–483% more. ([Microsoft Lifecycle announcement](https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement))
- Practically deployable alternatives (each is a third-party SERP scraper or independent index): **Brave Search API**, **SerpAPI**, **Firecrawl Search**, **Linkup**, or scraping via a rotating-proxy provider. [best guess: any of these supports a `site:` operator since all proxy or mimic Google/Bing SERPs; pricing is in the $1–$15 / 1k-queries band based on the public pricing pages of Brave and SerpAPI.]
- Human reviewer (KYC analyst) to triage hit lists.

## endpoint_details

Documented for the two named-in-spec vendors plus the most plausible 2026 replacements:

- **Google CSE JSON API** (legacy, closed to new customers):
  - Endpoint: `https://www.googleapis.com/customsearch/v1` ([source](https://developers.google.com/custom-search/v1/overview))
  - Auth: API key + a `cx` (Programmable Search Engine ID). ([source](https://developers.google.com/custom-search/v1/overview))
  - Rate limit: 100 free queries/day; paid tier capped at 10,000 queries/day at $5 per 1,000 additional queries. ([source](https://developers.google.com/custom-search/v1/overview))
  - ToS: General Google APIs ToS; no specific KYC carve-out. [unknown — searched for: "google custom search api terms of service KYC", "google custom search permitted uses screening" — no KYC-specific restriction surfaced; the standard ToS does prohibit re-distributing results.]
  - Pricing: $5 / 1k queries above the free 100/day. ([source](https://developers.google.com/custom-search/v1/overview))
  - Status: closed to new customers; sunset Jan 1 2027. ([source](https://developers.google.com/custom-search/v1/overview))
- **Bing Web Search API** (retired): N/A as of Aug 11 2025. ([source](https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement))
- **Brave Search API** (recommended replacement): public pricing page documents a free tier (1 query/sec, up to 2k queries/month) and paid plans starting around $3 / 1k queries. [best guess: Brave's `q` parameter accepts the `site:` operator like Google because Brave runs an independent crawler that respects standard search operators.] [unknown — searched for: "brave search api site operator institution", "brave search api KYC compliance" — public docs were not retrieved in this iteration; deferred to v2.]
- **SerpAPI Google engine** (Google scraper): documented support for `site:` operator and `q` parameter. Pricing: ~$75/mo for 5k searches (~$15 / 1k). [best guess: based on widely-cited public SerpAPI pricing pages.] [unknown — searched for: "serpapi google site operator", "serpapi pricing 2026" in this iteration; verify in v2.]

## fields_returned

For Google CSE JSON API the response includes (per Google's CSE JSON spec):

- `items[].title`, `items[].link`, `items[].displayLink`, `items[].snippet`, `items[].htmlSnippet`
- `items[].pagemap` — extracted structured data (OpenGraph, schema.org, metatags) when present
- `searchInformation.totalResults`, `searchInformation.searchTime`
- `queries.request[]` for query echo + pagination

[vendor-described, not technically documented for the screening use-case: pagemap richness varies by site.] ([source](https://developers.google.com/custom-search/v1/overview))

For SerpAPI / Brave equivalents the field names differ (`organic_results[].title|link|snippet`) but the same logical content is returned. [best guess: any SERP-style API will surface title + URL + snippet at minimum.]

## marginal_cost_per_check

- One customer = ~1–3 distinct queries (full name, full name + title, name + lab) against one domain.
- At Google CSE legacy pricing: 1–3 × $0.005 = **$0.005–$0.015 per customer**. ([source](https://developers.google.com/custom-search/v1/overview))
- At SerpAPI/Brave-class replacement pricing ($3–$15 / 1k queries): **$0.003–$0.045 per customer**. [best guess: ranges from named replacement vendors above.]
- **setup_cost:** Negligible engineering ($1–5k) to wire one API + a result-scoring heuristic; no dataset license. [best guess: 1–2 engineer-days at typical loaded rates.]

## manual_review_handoff

Standard SOP when the check fires `no_site_search_hits`:

1. Reviewer opens the API response log and the original queries.
2. Reviewer manually runs the same `site:<domain> "<name>"` query in a browser (Google web search), then a relaxed query without quotes, then a query against `site:<parent-domain>` (e.g., university root, not the lab subdomain).
3. If still no hits, reviewer searches for the customer's name on Google Scholar, ORCID, and LinkedIn (free) restricted to the institution.
4. If reviewer finds the customer on the institution site by manual search, mark as **API false negative**; clear the flag and log the missed query pattern for index tuning.
5. If reviewer finds *no* listing anywhere on the institution but finds clear public profile elsewhere (Scholar paper with the institution as affiliation, ORCID with current employment), escalate to "low-scrutiny pass with note: not on institution site, corroborated by external publication."
6. If reviewer finds nothing anywhere, send a templated "please confirm your role at <institution>" email and require a reply from a verified institutional contact (PI, dept admin) before releasing the order.

## flags_thrown

- `no_site_search_hits` — zero results returned. **Action:** human triage per SOP above.
- `low_quality_hits_only` — hits exist but are limited to (a) cached / Wayback artifacts, (b) generic department pages with no name match in the live page, or (c) name appears only in PDF supplementary material. **Action:** treat as soft positive; human spot-check.
- `name_collision` — hits include a person on the institution site who shares the customer's name but has an obviously different role (e.g., undergraduate listed in 2009 honors page when the customer claims to be a faculty member). **Action:** human disambiguation.

## failure_modes_requiring_review

- API quota exceeded / 429 throttling.
- Institution domain not crawled or sparsely indexed (small foreign universities, recently-launched labs).
- Customer is a new hire whose page has not yet been crawled (new-faculty lag is typically 2–6 weeks for major search indexes). [best guess.]
- Customer name is in a non-Latin script and the institution website serves the page only in the local script.
- The institution uses JavaScript-rendered directories that are not crawled by the underlying engine.
- Common-name false negatives because the SERP results are paginated past the cutoff and the agent only fetches the first page.

## false_positive_qualitative

Legitimate-customer cases that this check incorrectly trips on (i.e., no hits even though the customer is real):

- Newly-hired postdocs / staff before their faculty page exists.
- Researchers at institutions that publish only PDF directories (not crawled) or that gate the directory behind a login.
- Researchers at small foreign-language institutions whose website is poorly indexed by Google/Bing.
- Researchers in highly siloed core facilities whose names appear only in internal SharePoint, not on the public site.
- Common-name researchers (e.g., "Wei Zhang" at a Chinese university) whose hits are buried under thousands of namesakes and dropped by the SERP truncation.
- Clinical-trial PIs whose only public listing is on ClinicalTrials.gov rather than the hospital website.

## record_left

For every customer screened the system stores:

- The exact query string(s) issued.
- Timestamp + API endpoint + API version.
- The full JSON response (or the first N result objects) including `link`, `title`, `snippet`, `pagemap`.
- Reviewer notes if the flag was triaged.

This artifact is sufficient for an auditor to reproduce the check and to defend "we attempted institutional-affiliation corroboration via web search."

## Open issues for v2

- Replacement vendor pricing & ToS still need primary-source citation; current v1 has [best guess] markers for Brave and SerpAPI.
- Whether any replacement supports a true `site:` operator with the same semantics as Google needs vendor-doc verification.
- Quantitative new-hire-lag and small-institution-coverage estimates are unscoped (deferred to stage 6).
