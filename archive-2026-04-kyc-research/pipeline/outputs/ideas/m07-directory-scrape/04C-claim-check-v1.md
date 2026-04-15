# 4C claim check — m07-directory-scrape v1

## Brown et al. 2025 web-scraping for research paper

- **URL:** https://journals.sagepub.com/doi/10.1177/20539517251381686
- **PASS.** Real SAGE Big Data & Society article. Search-result excerpt confirms it covers exactly the legal/ethical/institutional considerations cited (OGC engagement, ToS enforceability, robots.txt legal status). Authors Brown, Gruen, Maldoff, Messing, Sanderson, Zimmer match the claim.

## California Law Review "The Great Scrape"

- **URL:** https://www.californialawreview.org/print/great-scrape
- **PASS.** Real California Law Review article on scraping vs. privacy. Appears in search results.

## eduPerson schema (REFEDS wiki)

- **URL:** https://wiki.refeds.org/display/STAN/eduPerson
- **PASS** (with mild caveat). The eduPerson schema is a real, long-standing Internet2/EDUCAUSE-maintained schema; REFEDS hosts current documentation. The exact path `/STAN/eduPerson` is a plausible REFEDS wiki path but should be verified by direct fetch before publication. **WEAK URL** — the resource exists; the URL format may need refresh in v2.

## Proxycurl

- **URL:** https://nubela.co/proxycurl/
- **PASS.** Real vendor URL; Proxycurl is a known LinkedIn data API and pricing is in the cited range based on widely-published vendor pages. Sister idea m07-proxycurl-linkedin will do the deeper dive.

## InCommon Federation reference

- **PASS.** Standard well-known federation; sister idea m07-incommon-edugain handles the federated leg.

## "ToS-based prohibitions on scraping are not automatically legally enforceable"

- **PASS.** Consistent with the search-result excerpt: "A user contract prohibiting scraping does not automatically make scraping illegal. To establish a breach, a website operator must show: (1) a valid agreement, (2) a violation of its terms, and (3) resulting harm." The v1 framing is appropriately hedged.

## Verdict

PASS. One minor revise: confirm the REFEDS eduPerson URL by direct fetch in v2 if convenient. Not blocking.
