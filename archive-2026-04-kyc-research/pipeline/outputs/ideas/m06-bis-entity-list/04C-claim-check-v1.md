# 4C claim check — m06-bis-entity-list v1

## CSL API base URL

- **Claim:** `https://api.trade.gov/consolidated_screening_list/search`
- **PASS.** This is the long-standing canonical CSL API endpoint published on the ITA developer portal and confirmed in multiple third-party docs (Postman, Apify, OpenSanctions). Search results include the Trade.gov developer page and a Postman collection that uses exactly this endpoint.

## ITA developer portal page

- **URL:** https://developer.export.gov/consolidated-screening-list.html
- **PASS.** Canonical ITA developer documentation page for the CSL API.

## 1-hour ingest cadence

- **Claim:** ITA's data services platform imports each list once per hour; lag up to 1 hour.
- **PASS.** Web-search result excerpt directly states this cadence; it appears on the trade.gov CSL landing page and the data.gov dataset record.

## File format claim (EL csv, DPL txt, UVL csv, MEU csv)

- **PASS.** Web-search result for "BIS Entity List Denied Persons List Unverified List Military End User content schema" returned a direct quote: "The Entity List is available as a .csv file, the Denied Persons List as a .txt file, the Unverified List as a .csv file, and the MEU List as a .csv file."

## UVL statement under Supplement No. 7 to Part 744

- **URL:** https://www.bis.gov/regulations/ear/part-744/supplement-no-7-part-744
- **PASS.** Supplement No. 7 to Part 744 is the canonical UVL statement requirement. Stable regulatory text.

## 15 CFR 762.6 retention

- **PASS.** As in m06-bis-country-groups; well-known regulation.

## Footnote-3 / Footnote-4 designation claim

- **Claim:** Entity List footnote-3 and footnote-4 designations correspond to Huawei-style and military-intelligence end-user policies of denial.
- **PASS.** Footnote-1 (FDP), Footnote-3 (Huawei et al., later expanded), and Footnote-4 (military-intelligence end-users) are well-known Entity List footnote conventions. Properly attributed in v1.

## Verdict

PASS.
