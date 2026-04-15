# Coverage research: Faculty / lab page + institutional directory

## Coverage gaps

### Gap 1: Industry / biotech / pharma researchers
- **Category:** R&D scientists at commercial companies who order synthetic DNA. Companies do not publish faculty-style profile pages; their researchers have no equivalent public web presence on an institutional domain.
- **Estimated size:** ~80% of biomedical PhDs work outside academia ([source](https://academiainsider.com/what-percentage-of-phds-stay-in-academia/)). The DNA synthesis market is ~50% commercial by revenue ([source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report)). [best guess: 30–50% of individual synthesis-ordering researchers are in industry and have no faculty page to find. This is the single largest gap.]
- **Behavior of the check on this category:** no-signal (no_faculty_page fires)
- **Reasoning:** The concept of a "faculty page" is inherently academic. Industry researchers may have LinkedIn profiles or company team pages, but these are not on an institutional .edu domain and are not covered by the PSE site-restricted search.

### Gap 2: Institutions with weak or no web presence
- **Category:** Researchers at smaller institutions (community colleges, teaching-focused institutions, small foreign universities) that do not publish individual faculty profile pages.
- **Estimated size:** [unknown — searched for: "percentage of universities that publish faculty profile pages", "faculty directory adoption rate research institutions"]. Not all universities maintain public-facing individual researcher profiles. Major research universities (R1/R2) generally do, but the long tail of institutions — particularly in lower-income countries — often do not. [best guess: 10–20% of academic synthesis customers are at institutions without publishable individual researcher pages]
- **Behavior of the check on this category:** no-signal (no_faculty_page fires)
- **Reasoning:** The check assumes the institution publishes web pages naming individual researchers. Where this infrastructure doesn't exist, the check is structurally blind.

### Gap 3: Recently hired researchers
- **Category:** Researchers who have just started a new position. Their faculty page at the new institution has not yet been published; their old institution's page may still be indexed.
- **Estimated size:** [best guess: at any given time, 5–10% of researchers are within their first 3 months at a new institution, during which web presence lag is common. For the subset who order synthesis reagents in this window, the check will miss or mismatch.]
- **Behavior of the check on this category:** false-positive (trips `no_faculty_page` or matches the wrong institution)
- **Reasoning:** Faculty page publication is a low-priority administrative task. A newly hired assistant professor may not have a departmental page for weeks or months after arrival.

### Gap 4: Non-faculty research staff (technicians, lab managers, core facility staff, BSOs)
- **Category:** Research support staff who place synthesis orders on behalf of a lab but are not faculty members and typically do not have individual profile pages.
- **Estimated size:** Only ~20% of life-sciences PhDs become faculty members ([source](https://academiainsider.com/what-percentage-of-phds-stay-in-academia/)). Support staff (technicians, lab managers) who are not even PhD-holders are a substantial fraction of order-placers. [best guess: 15–25% of academic synthesis orders are placed by non-faculty staff who will not have a profile page]
- **Behavior of the check on this category:** no-signal (no_faculty_page fires)
- **Reasoning:** Lab managers and technicians may appear on a lab group's "members" page but often without a role keyword that the extraction heuristics would classify as "research." They may also only appear in the HR directory (cross-check to m07-directory-scrape), not on a public-facing lab page.

### Gap 5: Researchers with non-Latin-script names or diacritics
- **Category:** Researchers whose names contain diacritics, non-Latin characters, or transliterations that the search engine handles inconsistently (e.g., "Müller" vs "Mueller", Chinese name romanizations).
- **Estimated size:** [best guess: 10–20% of international researchers have names where search-engine normalization could cause mismatches. The miss rate depends on the PSE's Unicode handling and the institutional website's encoding.]
- **Behavior of the check on this category:** weak-signal (search returns zero results due to encoding mismatch, not due to absence)
- **Reasoning:** This is a technical limitation of string matching. The researcher has a page, but the query doesn't find it.

### Gap 6: Google PSE deprecation risk (structural, post-2027)
- **Category:** All customers, if the implementation relies on Google PSE and does not migrate before the January 1, 2027 deadline.
- **Estimated size:** 100% of checks fail if PSE is unavailable. Google has announced the Custom Search JSON API is closed to new customers; existing customers must transition by Jan 2027. Vertex AI Search is the suggested successor for up to 50 domains ([source](https://developers.google.com/custom-search/v1/overview)).
- **Behavior of the check on this category:** no-signal (check becomes inoperable)
- **Reasoning:** This is not a population gap but a structural dependency risk. The implementation document notes this and flags migration, but it's a coverage concern: if the migration is not completed, coverage drops to zero.

### Gap 7: Sites that block Googlebot or use heavy client-side rendering
- **Category:** Researchers at institutions whose websites use JavaScript-heavy frameworks (React, Angular, Wix, Squarespace) or that block search-engine crawlers via robots.txt.
- **Estimated size:** [best guess: 5–10% of institutional websites have significant indexing issues that prevent PSE from surfacing researcher pages. The trend toward CMS-based and SPA-rendered sites is increasing.]
- **Behavior of the check on this category:** no-signal (PSE indexes the shell, not the content)
- **Reasoning:** If Googlebot cannot render the faculty page, PSE will not return it. The page exists but is invisible to the check.

## Refined false-positive qualitative

1. **Industry researchers** (Gap 1) — largest gap; ~30–50% of customers. 100% miss rate. No faculty page concept.
2. **Non-faculty staff** (Gap 4) — ~15–25% of academic orders. No profile page or role mismatch.
3. **Weak-web-presence institutions** (Gap 2) — ~10–20% of academic customers at under-resourced institutions.
4. **Name encoding issues** (Gap 5) — ~10–20% of international researchers; technical false negatives.
5. **Recently hired** (Gap 3) — transient gap for ~5–10% of researchers at any given time.
6. **JS-rendered / blocked sites** (Gap 7) — ~5–10% of institutional sites.
7. **Common-name collisions** (from 04-implementation) — page found but it's the wrong person with the same name.
8. **Acknowledged-but-not-the-researcher mentions** — customer name appears in a seminar list, acknowledgement, or course roster but not as a profile. This is a false-positive match, not a coverage gap.

## Notes for stage 7 synthesis

- This check is strong for established faculty at major research universities in English-speaking countries with good web infrastructure. For that population, coverage is likely >80%.
- The check is structurally blind to the entire commercial/industry customer segment and to non-faculty research staff.
- The PSE deprecation is a hard dependency risk requiring mitigation (Bing Web Search API, Vertex AI Search, or self-hosted alternatives).
- Cross-check with m07-directory-scrape is essential: the directory may catch staff who lack profile pages.
- The Wayback Machine component adds value for detecting freshly manufactured personas but depends on the page having been indexed at least once before.
- Best used as one signal in a multi-source M19 check, not as a standalone gate.
