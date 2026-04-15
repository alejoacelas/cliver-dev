# m19-faculty-page — Per-idea synthesis

## Section 1: Filled-in schema

### **name**

Faculty / lab page + institutional directory

### **measure**

M19 — individual-legitimacy-soc

### **attacker_stories_addressed**

visiting-researcher, unrelated-dept-student, lab-manager-voucher, it-persona-manufacturing, dormant-account-takeover, account-hijack, foreign-institution, dormant-domain, insider-recruitment, bulk-order-noise-cover

### **summary**

Given the customer's name and claimed institution domain, locate a faculty or lab page on the institution's website that names the customer in a research role. Uses a Google Programmable Search Engine (PSE) site-restricted query, with secondary page fetch and role-keyword extraction. Cross-checks against m07-directory-scrape for HR/staff directory presence. Uses Wayback Machine to verify the page existed before a recent window, detecting freshly manufactured personas.

### **external_dependencies**

Google PSE Custom Search JSON API (API key + CSE ID; $5/1000 queries; **closed to new customers, sunset Jan 1, 2027**); direct HTTP page fetch + HTML parser; m07-directory-scrape sibling idea; Wayback Machine availability API; human reviewer.

### **endpoint_details**

- **Google PSE:** `https://www.googleapis.com/customsearch/v1?key=...&cx=...&q=...&siteSearch=<domain>`; auth via API key + CSE ID; 100 free queries/day, $5/1000 paid (up to 10,000/day); JSON API closed to new customers, existing must migrate by Jan 2027
- **Page fetch:** direct GET; no auth; self-imposed 1 req/2s; $0; respect robots.txt
- **Wayback:** `https://archive.org/wayback/available?url=...&timestamp=YYYYMMDD`; no auth; free; rate limit [unknown — searched for: "wayback machine availability API rate limit"]
- **Google caching ToS:** [unknown — searched for: "Google Custom Search caching results ToS", "PSE results storage limitation"] — likely 30-day limit

### **fields_returned**

**PSE:** `items[]` with title, link, displayLink, snippet, htmlSnippet, cacheId, pagemap (when present — not always populated); searchInformation (totalResults, searchTime). **Page-fetch derived:** page URL, last-modified header, detected name strings, detected role keywords with context (PhD Student, Postdoc, Assistant Professor, Lab Manager, Visiting Scholar), linked CV/publications/ORCID, page type heuristic. **Wayback:** `archived_snapshots.closest` with available, url, timestamp, status.

### **marginal_cost_per_check**

~$0.005 per PSE query at paid tier; 2–3 queries with name variations = ~$0.01–$0.015 per check. Page fetch and Wayback: $0. **Setup cost:** ~1 engineer-day for PSE integration + role-extraction heuristics + Wayback wrapper. **Migration cost** before Jan 2027 to successor API (Bing Web Search or Vertex AI Search).

### **manual_review_handoff**

**`no_faculty_page`:** try alternative search backends (DuckDuckGo, Bing) site-restricted; check whether institution publishes faculty pages at all; cross-check m07 directory; if absent from both, escalate as "no institutional web presence." **`faculty_page_role_mismatch`:** confirm matched page is about the customer; if role is non-research, substantive M19 negative; document role string and source URL.

### **flags_thrown**

- `no_faculty_page` (zero hits naming customer on institutional domain)
- `faculty_page_present` (matched page with research-role keyword — positive)
- `faculty_page_role_mismatch` (page found but role is non-research)
- `faculty_page_recent_only` (Wayback shows no snapshot before 90 days — soft anomaly)
- `faculty_page_directory_mismatch` (on lab site but absent from m07 directory)

### **failure_modes_requiring_review**

- PSE quota exhaustion (fall back to secondary backend)
- JS-rendered institutional sites (PSE indexes shell only)
- common-name collisions on same domain
- subdomain handling in PSE `siteSearch`
- robots.txt disallows page (fall back to Wayback)
- researchers with primary presence on external lab-group domain

### **false_positive_qualitative**

1. Industry researchers — ~30–50% of customers, 100% miss rate, no faculty page concept
2. Non-faculty staff (technicians, lab managers) — ~15–25% of academic orders, no profile page or role mismatch
3. Weak-web-presence institutions — ~10–20% of academic customers
4. Name encoding issues (diacritics, non-Latin) — ~10–20% of international researchers
5. Recently hired — ~5–10% transient gap
6. JS-rendered/blocked sites — ~5–10%
7. Common-name collisions — wrong person matched
8. Acknowledged-but-not-the-researcher mentions (seminar lists, acknowledgements)

### **coverage_gaps**

1. Industry/biotech/pharma researchers — ~30–50% of customers [best guess]
2. Institutions with weak/no web presence — ~10–20% of academic customers [unknown — searched for prevalence data]
3. Recently hired researchers — ~5–10% transient
4. Non-faculty research staff — ~15–25% of academic orders [best guess]
5. Researchers with non-Latin names/diacritics — ~10–20% of international researchers [best guess]
6. Google PSE deprecation risk — 100% coverage loss if not migrated by Jan 2027
7. JS-rendered/blocked sites — ~5–10% of institutional sites [best guess]

### **record_left**

"Faculty page snapshot" record: input (name + variants + institutional domain); PSE query strings + raw response JSON; top matched URL + saved HTML snapshot or PDF render + extracted role string; Wayback verification (nearest snapshot timestamp + URL); final flag set + reviewer disposition.

### **bypass_methods_known**

- Visiting-scholar lab page listing (visiting-researcher) — AMBIGUOUS
- reflected legitimacy / department page (unrelated-dept-student) — CAUGHT partial
- IT-injected directory entry (it-persona-manufacturing) — CAUGHT moderate
- self-created lab page on revived domain (dormant-domain) — CAUGHT moderate but defeatable via pre-aging
- dormant researcher stale page (dormant-account-takeover) — AMBIGUOUS.

### **bypass_methods_uncovered**

1. Pre-aged lab page via Wayback "Save Page Now" (dormant-domain) — Wayback cannot distinguish organic vs. user-initiated saves
2. Non-life-sciences student on department page (unrelated-dept-student) — department context extraction underspecified
3. Real insider/established researcher web presence (lab-manager-voucher, insider-recruitment, bulk-order-noise-cover, account-hijack) — check validates genuine web presence, cannot detect malicious intent
4. Foreign institution web presence (foreign-institution) — non-English pages and weak indexing reduce effectiveness

---

## Section 2: Narrative

### What this check is and how it works

The faculty-page check verifies that a customer claiming to be a researcher at a specific institution actually appears on that institution's website in a research role. At onboarding, the system sends the customer's name to a Google Programmable Search Engine query restricted to the institution's domain, retrieves the top results, and fetches the best-matching page. A role-keyword extraction pipeline identifies whether the customer is named as faculty, a postdoc, a PhD student, a lab manager, or another research-relevant role. The Wayback Machine is then consulted to verify the page existed at a prior date, detecting freshly manufactured personas. An optional cross-check against m07-directory-scrape confirms the customer appears in the institution's HR directory. The primary API dependency is Google's Custom Search JSON API at $0.005–0.015 per check, though this API is closed to new customers and existing customers must migrate by January 2027.

### What it catches

The check provides its strongest signal against the IT-persona-manufacturing story, where an IT admin creates a directory entry but typically cannot also create a faculty or lab page (which is maintained by individual labs, not central IT). The `faculty_page_directory_mismatch` flag catches personas that exist in directories but not on lab pages. Against the dormant-domain story, the `faculty_page_recent_only` flag detects that a "lab page" on a revived domain was created recently, matching the domain-revival timeline. For unrelated-department students, the check can partially catch role mismatches if the extracted department context indicates a non-life-sciences field. Against visiting-researcher stories, the check provides genuine positive or negative signal depending on whether the visitor has been listed on a lab page.

### What it misses

The check has three categories of blind spots. First, it is structurally silent on the entire commercial/industry customer segment (~30–50% of synthesis customers) — companies do not publish faculty-style profile pages. Second, it cannot detect malicious intent from legitimate insiders (lab-manager-voucher, insider-recruitment, bulk-order-noise-cover, account-hijack), because their web presence is genuine. Third, the Wayback-based freshness check can be defeated by pre-aging: an attacker who uses Wayback's "Save Page Now" feature during the domain-aging phase creates a snapshot indistinguishable from an organic crawl. The department/role context extraction is also underspecified — a student in computer science listed as "PhD Student" would not be flagged unless the system extracts and evaluates department context, which the current implementation's regex approach does not clearly do.

### What it costs

Marginal cost is approximately $0.01–0.015 per check (2–3 PSE queries at $5/1000). Page fetching and Wayback queries are free. Setup cost is roughly one engineer-day. The hard dependency on Google PSE, with its announced sunset for existing customers by January 2027, creates a mandatory migration cost to Bing Web Search API, Google Vertex AI Search, or a self-hosted alternative.

### Operational realism

When `no_faculty_page` fires, the reviewer first determines whether the institution publishes faculty pages at all — many smaller institutions and all commercial entities do not. This distinction between "page absent because the person doesn't exist" and "page absent because the institution doesn't publish them" is the central operational challenge. The m07-directory-scrape cross-check helps: if the person appears in the HR directory but not on a lab page, the picture is different from appearing in neither. When `faculty_page_recent_only` fires, the reviewer checks Wayback snapshot timestamps against domain registration dates for consistency. Every check produces an archived HTML snapshot of the matched page, ensuring the evidence is preserved even if the page later changes.

### Open questions

The Google PSE deprecation is the most pressing operational issue — without migration, the check becomes inoperable after January 2027. The `pagemap` structured metadata in PSE responses is not always populated (flagged by 04C), reducing extraction quality for some pages. The Wayback API rate limit is undocumented, requiring experimentation. Google's caching ToS limit (likely 30 days) constrains how long search-result data can be retained — the exact terms should be confirmed from Google's Service-Specific Terms. The department-context extraction logic needs to be specified in more detail to fully catch the unrelated-department student scenario.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.**
- **Moderate finding M1 (Wayback pre-aging defeat):** An attacker can pre-age a fabricated lab page by using Wayback's "Save Page Now" feature, creating a snapshot indistinguishable from organic crawl. Suggested mitigation: cross-reference Wayback snapshot timestamps against domain WHOIS creation dates (requires integration with m18-lookalike-domain signals).
- **Moderate finding M2 (department context extraction underspecified):** The role-keyword extraction does not clearly extract and evaluate department context, reducing effectiveness against unrelated-department students. Needs specification of department/field context pairing logic.
- **[unknown] Wayback Machine availability API rate limit:** No official documentation found. Community guidance suggests low single-digit req/s.
- **[unknown] Google caching ToS limit:** Likely 30 days but exact number is fuzzy in public sources. Should be confirmed from Google's Service-Specific Terms.
- **[unknown] Percentage of institutions publishing faculty profile pages:** No data found despite searching. Estimate of 10–20% gap is reasoning-based. (Stage 6F, BORDERLINE.)
- **Google PSE sunset (Jan 1, 2027):** Hard dependency risk requiring migration to a successor API. Not a bypass issue but an operational must-do.
- **`pagemap` availability:** Not always populated in PSE responses (Stage 4C, MINOR). Role extraction should not depend on it.
- **Policy decision: handling `no_faculty_page` for industry customers.** The check is structurally null for ~30–50% of customers. Must be used as one signal in a multi-source model, never as a standalone gate.
