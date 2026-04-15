# Form check: m07-google-site-search / 06-coverage-v1.md

## Schema field: `coverage_gaps`

- [PASS] Six gaps identified, each with category, estimated size, behavior classification, and reasoning.
- [FLAG] Gap 1 estimate that ~5–15% of recently-created pages are not yet indexed is `[best guess]` derived from the 83% first-week indexing rate. The derivation conflates "new pages" in general with "faculty pages at university sites," which may have different crawl priorities. Consider noting this limitation.
- [FLAG] Gap 1 postdoc turnover figure (~18,000–24,000/year) is `[best guess]` from NSF estimates without a direct citation. Same issue as m07-directory-scrape Gap 2.
- [FLAG] Gap 3 is `[unknown]` — search list is thin (1 query). Consider searching for name-disambiguation studies or people-search accuracy literature.
- [PASS] Gap 5 vendor continuity is well-documented with primary sources (Google CSE sunset, Bing retirement, Brave API docs).

## Schema field: `false_positive_qualitative`

- [PASS] Five categories cross-referenced with gaps. Good specificity.
- [PASS] Seasonal spike observation (September, January) adds useful operational context.

## Sourcing conventions

- [PASS] Google indexing speed citations from multiple sources. Brave API documentation cited with primary source.
- [PASS] Worldwide university counts cited.
- [FLAG] The "15–20% of the total web indexed" figure from Zyppy is a blog-grade source. Consider noting its approximate nature.

## Structure

- [PASS] All required sections present.
- [PASS] Each gap has required sub-fields.

## Summary

4 flags, 0 blockers. Main issues: two best-guess estimates without direct citations; one `[unknown]` with thin search list; one blog-grade source for web indexing coverage.
