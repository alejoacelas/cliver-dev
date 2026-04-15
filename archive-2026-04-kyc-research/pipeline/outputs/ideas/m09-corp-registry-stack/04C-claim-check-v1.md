# 04C claim check — m09-corp-registry-stack v1

## Claims verified from search results

1. **Companies House rate limit "600 requests per 5-minute window".** Direct quote from cited rate-limiting page: "You can make up to 600 requests within a 5 minute period." PASS.

2. **SEC EDGAR rate limit "10 requests/second per IP".** Confirmed by SEC's own announcement page: "the SEC limits automated searches to a total of no more than 10 requests per second." PASS.

3. **OpenCorporates 2026 pricing (Essentials £2,250 / Starter £6,600 / Basic £12,000).** Source is zephira.ai third-party analysis. Likely accurate given the level of specificity, but UPGRADE-SUGGESTED: cross-cite against opencorporates.com/pricing directly. The zephira.ai page is a reasonable secondary source pending direct confirmation.

4. **OpenCorporates request-metered ("no-result searches consume a call").** Confirmed by zephira.ai. PASS but same upgrade caveat.

5. **OpenCorporates ~£0.20/call effective on Basic plan.** Derived figure from zephira.ai. PASS as `[best guess]`-equivalent.

## Flags

- **UPGRADE-SUGGESTED** — OpenCorporates pricing should be cross-cited against the vendor's own pricing page (https://opencorporates.com/pricing/) which is in the bibliography but not used for the specific numbers.
- **MISSING-CITATION** — UK SIC 2007 code list claim (72110/72190/21100/21200/86900 = life-sciences). The codes are real UK SIC codes per ONS but the document does not cite a source. Suggested fix: cite https://resources.companieshouse.gov.uk/sic/.
- **MISSING-CITATION** — NAICS codes 5417/3254/6215/6113 claim. Suggested fix: cite https://www.census.gov/naics/.

No BROKEN-URL, MIS-CITED, or OVERSTATED flags.

**Verdict:** REVISE (two missing citations on the SIC/NAICS code lists, one upgrade-suggested on pricing). Salvageable; v2 optional.
