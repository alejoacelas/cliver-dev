# m19-faculty-page — implementation v1

- **measure:** M19 — individual-legitimacy-soc
- **name:** Faculty / lab page + institutional directory
- **modes:** A
- **summary:** Given the customer's name + claimed institution domain, locate a faculty or lab page on the institution's website that names the customer in a research role. Implementation uses a Google Programmable Search Engine (PSE) `siteSearch` query restricted to the institutional domain, with secondary fetch + regex/role-keyword extraction. Optional cross-check against m07-directory-scrape for HR-directory presence. Records a snapshot of the matched page.

## external_dependencies

- **Google Programmable Search Engine (PSE) Custom Search JSON API** ([source](https://developers.google.com/custom-search/v1/overview)) — site-restricted search.
- **Direct HTTP fetch + HTML parser (BeautifulSoup / readability)** for extracting the matched page content.
- **m07-directory-scrape (sibling idea)** — for HR/staff-directory cross-check.
- **Wayback Machine** (`https://web.archive.org/wayback/available`) — to confirm the page existed at a prior date and is not freshly stood up.
- **Human reviewer.**

## endpoint_details

### Google PSE Custom Search JSON API
- **URL:** `https://www.googleapis.com/customsearch/v1?key=<API_KEY>&cx=<CSE_ID>&q=<query>&siteSearch=<domain>`
- **Auth:** Google Cloud API key + a configured CSE engine ID. ([source](https://developers.google.com/custom-search/v1/overview))
- **Rate limit / quota:** 100 free queries/day; paid tier $5 per 1000 queries up to 10,000 queries/day ([source](https://developers.google.com/custom-search/v1/overview)).
- **CRITICAL caveat:** the Custom Search JSON API is closed to *new* customers; existing customers have until **January 1, 2027** to transition to an alternative ([source](https://developers.google.com/custom-search/v1/overview)). For a check designed to last beyond 2027, plan a Bing Web Search API or self-hosted alternative.
- **ToS:** Google Cloud API ToS apply; no explicit prohibition on KYC use; results cannot be cached for >30 days under Google's standard search-results ToS [unknown — searched for: "Google Custom Search caching results ToS", "PSE results storage limitation"] — exact caching window is in the API ToS but the exact number is fuzzy in public sources.

### Page fetch
- **Auth:** none. Direct GET against `https://<institutional-domain>/...`. Respect `robots.txt` and standard web-crawling etiquette ([source](https://www.scrapingbee.com/blog/robots-txt-web-scraping/)).
- **Rate limit:** self-imposed; 1 req per institution per 2s is courteous.
- **Cost:** $0.

### Wayback Availability API
- **URL:** `https://archive.org/wayback/available?url=<url>&timestamp=YYYYMMDD`
- **Auth:** none.
- **Pricing:** free; community-operated.
- **Rate limit:** [unknown — searched for: "wayback machine availability API rate limit", "internet archive wayback API throttle"] — community guidance suggests low single-digit req/s.

## fields_returned

### PSE search response (per [source](https://developers.google.com/custom-search/v1/reference/rest/v1/Search)):
- `kind`, `url`
- `queries` (request, nextPage)
- `searchInformation`: `totalResults`, `searchTime`
- `items[]`:
  - `title`, `link`, `displayLink`
  - `snippet`, `htmlSnippet`
  - `cacheId`
  - `pagemap` (extracted structured metadata: `metatags`, `person`, `organization`, etc.)
  - `mime`

### Page-fetch derived fields (custom extraction):
- Page URL, last-modified header
- Detected name strings (regex match against customer name + alias variants)
- Detected role keywords nearby (`PhD student`, `Postdoc`, `Assistant Professor`, `Lab Manager`, `Visiting Scholar`)
- Linked CV / publications / ORCID
- Page type heuristic: faculty profile / lab member list / news article / course roster

### Wayback availability response:
- `archived_snapshots.closest`: `available`, `url`, `timestamp`, `status`

## marginal_cost_per_check

- PSE query: $0.005 per query at the paid tier (≤10k/day) ([source](https://developers.google.com/custom-search/v1/overview)). Free for the first 100 queries/day.
- Page fetch: $0 (egress cost negligible).
- Wayback: $0.
- **Total marginal cost:** ~$0.005 per check (one PSE query) plus negligible compute. If the engine uses 2–3 queries (name + variations), ~$0.01–$0.015 per check.
- **setup_cost:** ~1 engineer-day to build PSE integration + role-extraction heuristics + Wayback wrapper. Plus **migration cost** before Jan 2027 to a successor API.

## manual_review_handoff

When `no_faculty_page` fires (no PSE result on the institutional domain naming the customer):
1. Try alternative search backends (DuckDuckGo, Bing) site-restricted to the same domain to rule out a Google indexing gap.
2. Check whether the institution publishes faculty pages at all (some R1s publish departmental pages but not lab pages; some smaller institutions don't publish researcher rosters).
3. Cross-check m07-directory-scrape to see if the customer appears in the HR directory but not on a lab page.
4. If absent from both lab pages and the directory, escalate as "no institutional web presence" — substantive negative.

When `faculty_page_role_mismatch` fires (page found but listed role is non-research, e.g., "Administrative Assistant", "Course Instructor"):
1. Confirm the matched page is actually about the customer (name disambiguation).
2. If the role is genuinely non-research, this is a substantive M19 negative — the individual is not a legitimate user of SOC orders for biology research.
3. Document role string and source URL.

## flags_thrown

- `no_faculty_page` — zero PSE hits naming the customer on the institutional domain.
- `faculty_page_present` — at least one matched page with a research-role keyword. Positive signal.
- `faculty_page_role_mismatch` — page found but role is non-research.
- `faculty_page_recent_only` — page exists but Wayback shows no snapshot before 90 days ago. Soft anomaly — could be a freshly stood-up persona.
- `faculty_page_directory_mismatch` — page on lab site but no entry in m07 directory (could indicate stale lab page or unauthorized).

## failure_modes_requiring_review

- PSE quota exhaustion mid-day — fall back to a secondary backend.
- Institutional sites that block Googlebot or use heavy JS rendering — many lab pages are static HTML, but some Wix/Squarespace ones are SPA-rendered and PSE indexes the shell only.
- Common-name collisions on the same domain (multiple "John Smith"s at one university).
- Pages on subdomains (`bio.example.edu`, `medicine.example.edu`) — PSE `siteSearch` does cover subdomains by default but `siteSearchFilter` can change behavior.
- robots.txt disallows the page → fall back to Wayback snapshot.
- Researchers whose primary online presence is on a lab-group site at a different domain than the institutional one (`mygroup.org` vs `example.edu`).

## false_positive_qualitative

False *negatives* (legitimate customers flagged):
- Researchers at institutions with weak web presence (community colleges, foreign institutions, very small labs).
- Brand-new hires (page not yet published).
- Researchers transitioning between roles (page from prior institution still indexed but new not yet up).
- Names with diacritics that the search engine normalizes inconsistently.
- Researchers known by professional name vs legal name.
- Industry researchers (no faculty page concept).

False *positives* (matched the wrong person):
- Common names + multiple homonyms at the institution.
- Customer's name appears on a page but only as an acknowledgement, course participant, or seminar attendee — not their own profile.

## record_left

A "faculty page snapshot" record per check, persisted in case management:
- Input: customer name + variants + institutional domain.
- PSE query strings + raw response JSON (item links, snippets, totalResults).
- Top matched URL + saved HTML snapshot (or PDF render) + extracted role string.
- Wayback verification: nearest snapshot timestamp + URL.
- Final flag set + reviewer disposition.
