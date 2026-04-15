# 04C claim check v1 — m19-faculty-page

## Verified

- **PSE Custom Search JSON API endpoint** — confirmed at developers.google.com/custom-search/v1/overview. PASS.
- **100 free queries/day; $5 per 1000 paid; cap 10000/day** — explicit on the overview page. PASS.
- **JSON API closed to new customers; Jan 1, 2027 sunset for existing customers** — explicit on the overview page. PASS. (This is a load-bearing constraint and the document correctly flags it as a migration requirement.)
- **`siteSearch` parameter restricts results to a domain** — confirmed in the PSE reference docs. PASS.
- **Wayback availability endpoint at `archive.org/wayback/available`** — public Internet Archive endpoint, confirmed widely. PASS.
- **robots.txt is not legally binding but creates civil risk** — confirmed by multiple legal/scraping references. PASS as background rationale, not as a hard claim.

## Flags

- **MINOR / OVERSTATED** — `pagemap` structured metadata is documented but not always populated; some institutional pages return empty `pagemap`. The document treats it as available; weaken to "when present, includes ..."
- **UPGRADE-SUGGESTED** — `[unknown]` on Google's caching ToS limit. The Google Cloud terms reference a 30-day cache limitation in some contexts; could be more concretely cited from `https://policies.google.com/terms` or the Custom Search Service-Specific Terms. Worth a real fetch in v2.

## Verdict

PASS.
