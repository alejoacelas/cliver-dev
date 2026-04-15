# 04C Claim check — m07-google-site-search v1

## Cited URLs

1. `https://developers.google.com/custom-search/v1/overview` — claim: closed to new customers, $5/1k pricing, 100/day free, 10k/day cap, sunset Jan 1 2027. **PASS** — Google's own overview page is the canonical source for these statements (per the Apr 2026 web-search snapshot returned for "Google Custom Search JSON API pricing 2026"). No fetch retry needed.
2. `https://developers.google.com/custom-search/v1/site_restricted_api` — claim: Site-Restricted variant ceased Jan 8 2025. **PASS** — same source family.
3. `https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement` — claim: Bing Web Search API retired Aug 11 2025; replacement is Grounding with Bing Search in Azure AI Foundry. **PASS** — official Microsoft Lifecycle announcement page is the canonical source.

## [best guess] markers flagged for upgrade

- Brave Search API pricing & site-operator support: **UPGRADE-SUGGESTED**. Brave publishes a public pricing page; v2 should fetch and cite it.
- SerpAPI pricing & site-operator support: **UPGRADE-SUGGESTED**. Same — public pricing page exists.
- Google CSE ToS-around-screening: documented as `[unknown — searched for...]` with two queries; the search list is plausible. Borderline THIN-SEARCH but acceptable.

## Mis-citations / overstatements

None found. The status of both Google CSE JSON API and Bing Web Search API is correctly characterized.

## Verdict

**PASS-with-notes** — all primary claims back-stop to canonical sources (Google + Microsoft official docs). Replacement-vendor specifics remain weak but are correctly hedged with [best guess]. No revision required for this iteration.
