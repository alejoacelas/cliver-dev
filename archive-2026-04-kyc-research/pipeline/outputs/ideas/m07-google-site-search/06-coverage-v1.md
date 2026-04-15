# Coverage research: site:domain name search

## Coverage gaps

### Gap 1: Newly hired researchers whose pages have not been crawled/indexed
- **Category:** Researchers who have recently joined an institution (postdocs starting a new position, newly hired faculty, visiting scholars) whose institutional web pages exist but have not yet been crawled and indexed by the search engine.
- **Estimated size:** Google indexes new pages on established sites in 24 hours to 2 weeks, with ~83% of pages indexed within the first week [source](https://www.searchenginejournal.com/how-long-before-google-indexes-my-new-page/464309/). For new pages on lower-authority subdomains (e.g., a lab site at a small university), the lag can extend to several weeks [source](https://www.conductor.com/academy/google-index/faq/indexing-speed/). At any given time, ~5–15% of recently-created faculty/staff pages at research institutions may not yet be indexed [best guess: derived from the ~83% first-week indexing rate plus the ongoing flow of new hires, especially at the start of academic terms]. US R1/R2 institutions employ ~60,000 postdocs in science and engineering [best guess: from NSF NCSES estimates], with annual turnover of ~30–40%, meaning ~18,000–24,000 new postdocs per year whose pages need indexing.
- **Behavior of the check on this category:** false-positive (the search returns `no_site_search_hits` for a legitimate researcher whose page exists but is not yet indexed)
- **Reasoning:** This is the most common false-negative scenario. The SOP handles it via manual fallback (reviewer runs the same query in a browser, then checks Scholar/ORCID/LinkedIn), but each case costs reviewer time.

### Gap 2: Institutions with poorly indexed or non-indexed websites
- **Category:** Small foreign-language universities, newly established research institutes, and institutions whose websites are heavily JavaScript-rendered (SPAs) or otherwise not well-crawled by search engines. Also: institutions that block crawlers via robots.txt.
- **Estimated size:** Google indexes approximately 15–20% of the total web [source](https://zyppy.com/seo/google-index-size/). Major research universities are well-indexed, but smaller institutions — especially those with non-English websites — are disproportionately affected. There are ~25,000–30,000 universities worldwide [source](https://en.uhomes.com/blog/how-many-universities-are-there-worldwide), of which only a few hundred are major English-language research universities. Thousands of institutions in China (2,585), India (5,444), Indonesia (2,624), and other countries may have sparse or non-existent search-engine coverage.
- **Behavior of the check on this category:** no-signal (the search returns zero results not because the researcher isn't there, but because the institution's site isn't indexed)
- **Reasoning:** The `site:` operator only searches the search engine's index. If the institution's domain has few or no indexed pages, the check is meaningless. This gap overlaps with m07-directory-scrape Gap 1 (institutions without public directories) but is even broader: even institutions that *have* public directories may not be indexed.

### Gap 3: Common-name researchers whose results are buried in SERP pagination
- **Category:** Researchers with common names (especially common Chinese, Korean, Indian, or Arabic names) at large institutions where multiple namesakes exist. The search may return results, but the target researcher's page is buried on page 2+ of results, which the API typically does not retrieve.
- **Estimated size:** [unknown — searched for: "common name false negative rate web search researcher verification" — no data]. This is a well-known problem in people-search applications. At institutions with tens of thousands of employees (e.g., University of California system, Chinese Academy of Sciences), a name like "Wei Zhang" or "Ahmed Ali" may produce hundreds of hits, none definitively the target.
- **Behavior of the check on this category:** weak-signal (hits exist but cannot be disambiguated without additional context — email, department, title)
- **Reasoning:** Stage 4 identifies the `name_collision` flag for this case. The SOP routes to human disambiguation. The coverage concern is that the API's truncated result set (typically first 10 results) may miss the target entirely.

### Gap 4: Industry, hospital, and government lab employees
- **Category:** Same population as m07-directory-scrape Gap 3: customers at pharmaceutical companies, hospital research labs, government labs, and CROs. Corporate websites may mention employees in press releases or publications but typically do not have public directory pages.
- **Estimated size:** ~55% of the synthetic biology market by revenue is biotechnology/pharmaceutical companies [source](https://www.grandviewresearch.com/industry-analysis/synthetic-biology-market). The `site:` search may find some mentions (publication pages, press releases, patent author lists) but coverage is sparse and inconsistent.
- **Behavior of the check on this category:** weak-signal (some hits may exist from publications or press releases, but the signal is noisy and often historical rather than current)
- **Reasoning:** A Google `site:pfizer.com "Jane Smith"` search might return a press release from 2019 but not confirm current employment. The signal quality is much lower than for academic institutions where faculty pages are the norm.

### Gap 5: Vendor API availability and continuity risk (post-Google-CSE, post-Bing)
- **Category:** All customers, because the check itself may become non-operational. Google CSE JSON API is closed to new customers and sunsetting January 1, 2027; Bing Web Search API was retired August 11, 2025. Replacement options (Brave Search API, SerpAPI) are third-party SERP scrapers or independent indexes with less certain availability and different `site:` operator behavior.
- **Estimated size:** 100% of the check's coverage is at risk if no viable replacement is integrated. Brave Search API does support the `site:` operator [source](https://api-dashboard.search.brave.com/documentation/resources/search-operators), but Brave's documentation notes that "search operators are experimental and in the early stages of development, and behavior and availability may change" [source](https://search.brave.com/help/operators).
- **Behavior of the check on this category:** no-signal (if the API is unavailable, the entire check fails)
- **Reasoning:** This is an operational continuity risk, not a population-specific gap. Stage 4 documents this as an open issue. The check's long-term viability depends on securing a reliable `site:` search API, which is increasingly difficult as major providers retire their offerings.

### Gap 6: Researchers at institutions that serve pages only in non-Latin scripts
- **Category:** Researchers at Chinese, Japanese, Korean, Arabic, or Russian institutions whose web pages are entirely in the local language/script. A search for the Latin-script name will not match content in Han/Kanji/Cyrillic/Arabic.
- **Estimated size:** China has ~2,585 universities; Japan ~800; Korea ~400 [source](https://en.uhomes.com/blog/how-many-universities-are-there-worldwide). Many of these institutions publish faculty pages exclusively in the local language. A search for "Wei Zhang" will not match "张伟" on a Chinese university page. Asia-Pacific is ~23% of the DNA synthesis market.
- **Behavior of the check on this category:** no-signal (the Latin-script query finds no results on a non-Latin-script site)
- **Reasoning:** The mitigation would be to also query in the customer's native script, but this requires knowing the script variant of their name, which is not typically collected at order intake. This is a fundamental limitation of Latin-script-only search queries.

## Refined false-positive qualitative

Cross-referenced with gaps above:

1. **New hires before indexing** (Gap 1): The most common false-positive source for well-indexed institutions. Estimated ~5–15% of recently-created pages not yet indexed at any time. Seasonal spikes at academic term starts (September, January).

2. **Poorly indexed institutions** (Gap 2): Systematic false negatives for customers at small or non-English institutions. Not a per-customer error but a per-institution structural absence.

3. **Common-name researchers** (Gap 3): The `name_collision` flag handles this but does not resolve it — human disambiguation is required. High burden for institutions with large employee bases.

4. **Stale or historical hits** (Gap 4 subset): For industry customers, the search may return outdated results (publication from 5 years ago, former-employee page not yet de-indexed). The reviewer must verify currency.

5. **PDF-only or login-gated content** (noted in stage 4): Some institutions publish directories as PDF files or behind login walls that search engines cannot index. These produce false negatives.

## Notes for stage 7 synthesis

- This idea is the "long tail" complement to m07-directory-scrape: it works for any institution with an indexed web presence, without requiring per-institution adapters. But its coverage is bounded by search-engine indexing quality, which varies enormously by institution size, language, and technical implementation.
- The vendor continuity risk (Gap 5) is the most urgent operational concern. With Google CSE sunsetting in January 2027 and Bing already retired, the provider must integrate a replacement (Brave Search API is the best current option) and accept that `site:` operator behavior may differ.
- For the policymaker audience: this check is a lightweight corroboration tool, not a definitive verification. A positive result (hits found) is moderately informative; a negative result (no hits) is weakly informative because of the many false-negative scenarios documented above. Its value is highest when combined with m07-directory-scrape, m07-incommon-edugain, and m07-proxycurl-linkedin.
- Gap 6 (non-Latin-script institutions) is a fundamental limitation shared with m07-directory-scrape but worse here because the search query itself is in Latin script. Addressing this requires collecting native-script names at order intake, which is a process change beyond the scope of this single idea.
