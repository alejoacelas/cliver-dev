# 04C Claim check — m04-county-assessor v1

Verifying flagged claims from 4F.

- **"$80K/year nationwide"** — [Regrid pricing](https://regrid.com/pricing): search snippet confirms nationwide bulk data starts at $80K/year. PASS.
- **"ATTOM starts at $95/month"** — sourced via [Datarade](https://datarade.ai/data-providers/attom/profile), a third-party listing. OVERSTATED-MILD: Datarade aggregates vendor pricing and may be stale; ATTOM's own pricing pages do not publicly show $95. Suggested fix: weaken to "starts at ~$95/month per third-party listing; vendor's own pricing page is gated."
- **"ReportAll 160.6M parcels / ~99% of US"** — sourced via [ReportAll API page](https://reportallusa.com/products/api). PASS per search snippet.
- **"ATTOM 158M properties / 3,000+ counties"** — [ATTOM Assessor Data](https://www.attomdata.com/data/property-data/assessor-data/). PASS per search snippet.
- **LBCS field names** — [Regrid land use codes](https://regrid.com/land-use-codes) confirms `lbcs_function/structure/site/ownership`. PASS.

**Verdict:** REVISE (one OVERSTATED-MILD on ATTOM pricing source quality; otherwise PASS)
