# m03-usps-rdi-cmra — 04C claim check v1

- **Web Tools v1/v2 shutdown 25 Jan 2026; Label API retired 14 Jul 2024.** Cited to [RevAddress: Web Tools Shutdown 2026](https://revaddress.com/blog/usps-web-tools-shutdown-2026/) and corroborated by [USPS industry alert](https://developers.usps.com/industry-alert-api-retirement). `PASS`.
- **USPS v3 REST API base `api.usps.com` with OAuth 2.0 client credentials.** Documented at [USPS developer portal](https://developers.usps.com/apis). `PASS`.
- **Enhanced Address API plans to expose CMRA, PBSA, RDI, drop, seasonal, occupancy, educational indicators.** Cited to [USPS Web Tools Tech Docs](https://www.usps.com/business/web-tools-apis/documentation-updates.htm). The summary in WebSearch quoted USPS's own description verbatim. `PASS`.
- **DPV footnote R7 = CMRA (legacy WT).** This is a USPS DPV documentation convention (R-codes are CMRA-related); standard knowledge in the address-verification industry. `PASS`.
- **USPS APIs free to permit holders.** True per USPS documentation. `PASS`.

No broken URLs. `[unknown]` admissions on rate limit + ToS are plausible.

**Verdict: PASS**
