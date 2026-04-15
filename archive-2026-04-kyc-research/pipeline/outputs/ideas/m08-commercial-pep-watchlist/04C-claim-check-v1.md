# 04C Claim check — m08-commercial-pep-watchlist v1

## Cited URLs / claims

1. `https://docs.complyadvantage.com/api-docs` — claim: search endpoint, auth header, entity types, filters, case-management semantics. **PASS** — official API docs.
2. `https://en.wikipedia.org/wiki/World-Check` — claim: World-Check is LSEG-owned, broad sanctions/PEP/adverse-media coverage. **PASS** — Wikipedia is acceptable for the ownership/scope summary.
3. `https://compliancely.com/blog/sanctions-screening-software-ofac-compliance-tools/` — claim: WC/DJ/CA positioning. **PASS** — third-party industry summary; correctly used as background.
4. `https://complyadvantage.com/fincrime-risk-intelligence/sanctions-watchlists-screening/` — claim: ComplyAdvantage offers sanctions/watchlist screening. **PASS** — vendor product page.
5. `https://www.g2.com/products/refinitiv-world-check-risk-intelligence/reviews` — claim: World-Check enterprise pricing band. **PASS** but **OVERSTATED-LITE** — G2 reviews mention pricing in user comments but G2 is not an authoritative pricing source. The claim is correctly hedged with `[best guess]` and `[vendor-gated]` in v1.

## Mis-citations / overstatements
None requiring revision. All vendor-gated material is correctly marked.

## UPGRADE-SUGGESTED
- LSEG World-Check API reference URL for the official auth flow (behind login; not directly fetchable but should be referenced in v2 if accessible).

## Verdict
**PASS**
