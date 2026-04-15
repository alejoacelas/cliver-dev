# 4C Claim check — m17-event-driven-reeval v1

| Claim | URL | Verdict | Notes |
|---|---|---|---|
| OpenCorporates API exists w/ events + filings endpoints | https://api.opencorporates.com/ + https://api.opencorporates.com/documentation/API-Reference | PASS | API reference describes companies, officers, events, filings endpoints. |
| OpenCorporates ~200M companies | https://blog.opencorporates.com/2025/02/13/getting-started-with-the-opencorporates-api/ | PASS | Marketing claim consistent with OpenCorporates' published numbers. |
| OFAC SLS provides delta files | https://ofac.treasury.gov/faqs/topic/1641 | PASS | OFAC FAQ explicitly describes the delta file format and an annual archive. |
| OFAC SLS is free / no auth | https://ofac.treasury.gov/sanctions-list-service | PASS | Public download service; standard government data product. |
| FinCEN 2018 CDD rule introduced beneficial-ownership identification | https://www.sanctions.io/blog/perpetual-kyc-customer-due-diligence | PASS | Sanctions.io blog accurately summarizes the FinCEN CDD rule and pKYC trigger events. |
| ComplyAdvantage perpetual KYC framing | https://complyadvantage.com/insights/perpetual-kyc/ | PASS | Real industry blog. |
| OpenCorporates per-customer-per-year cost ~$0.10–$1.00 | (best guess) | PASS-as-best-guess | Explicitly marked. |

No `BROKEN-URL`, `MIS-CITED`, or `OVERSTATED` flags.

## Verdict

**PASS**
