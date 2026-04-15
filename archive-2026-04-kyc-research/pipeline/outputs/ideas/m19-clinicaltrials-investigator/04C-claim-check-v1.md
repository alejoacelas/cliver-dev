# 04C claim check v1 — m19-clinicaltrials-investigator

## Verified

- **CT.gov v2 API base** — confirmed at clinicaltrials.gov/data-api/api. PASS.
- **10 req/s rate limit** — explicit on the v2 API page. PASS.
- **API v2 OpenAPI 3.0 spec** — confirmed. PASS.
- **`overallOfficials` array with role enum** — confirmed in CT.gov v2 data model docs (per third-party API references like davila7/claude-code-templates and pytrials). PASS.
- **BMIS coverage from Oct 1, 2008** — explicit on the FDA BMIS landing page. PASS.
- **BMIS quarterly updates** — explicit on the FDA BMIS landing page. PASS.
- **BIMO program scope and inspection classifications NAI/VAI/OAI** — confirmed via FDA BIMO inspection metrics page and third-party regulatory references. PASS.
- **CT.gov is US government public-domain** — confirmed via clinicaltrials.gov terms page. PASS.

## Flags

- **MINOR / OVERSTATED** — exact Essie query syntax `AREA[OverallOfficialName]"<Last, First>"` should be re-verified against CT.gov v2 query docs; the AREA[] syntax exists but the exact field-name token may differ (`OverallOfficialName` vs `overallOfficialName`). **Suggested fix:** verify in v2 by fetching `clinicaltrials.gov/data-api/about-api/study-data-structure` before publishing the v2 implementation.
- **UPGRADE-SUGGESTED** — `[unknown]` on BMIS download format. The BMIS landing page does identify the file format (typically Excel `.xlsx`); replace `[unknown]` with a fetched, cited answer in v2.

## Verdict

REVISE (minor). No broken URLs, two small upgrades for v2.
