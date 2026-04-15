# 04C Claim check — m08-bis-entity-csl v1

## Cited URLs / claims

1. `https://www.trade.gov/consolidated-screening-list` — claim: CSL is a unified ITA-published superset, free, daily refresh at 05:00 EST. **PASS** — official ITA page.
2. `https://developer.export.gov/consolidated-screening-list.html` — claim: list of underlying source codes (DPL, EL, MEU, UVL, ISN, DTC, CAP, CMIC, FSE, MBS, PLC, SSI, SDN), search field set. **PASS**.
3. `https://github.com/InternationalTradeAdministration/developerportal/wiki/5:-%E2%80%9CFuzzy%E2%80%9D-Name-Search-is-Live-for-the-CSL` — claim: `fuzzy_name=true`, score ranking, "Corporation"/"Inc" filtering. **PASS** — official ITA developer wiki.
4. `https://catalog.data.gov/dataset/consolidated-screening-list-api-0226f` — claim: API + bulk download both available. **PASS**.
5. `https://developer.trade.gov/apis` — claim: API key auth via developer portal. **PASS**.
6. `https://developer.trade.gov/terms-of-service` — claim: ToS authorizes export-screening use. **PASS**.
7. `https://www.opensanctions.org/datasets/us_trade_csl/` — claim: OpenSanctions mirrors CSL. **PASS**.

## OVERSTATED / borderline

- The list count (v1 says "11" then enumerates 13 codes). The 11/13 discrepancy reflects ITA's evolving list set; flagged for v2 reconciliation. Not a citation problem per se.
- "5-year retention period for export records" is `[best guess]`, correctly hedged. v2 should cite EAR §762 directly.

## UPGRADE-SUGGESTED
- EAR §762 retention: `https://www.bis.doc.gov/index.php/regulations/export-administration-regulations-ear` — fetch in v2.
- Rate-limit number: developer portal docs page.

## Verdict
**PASS**
