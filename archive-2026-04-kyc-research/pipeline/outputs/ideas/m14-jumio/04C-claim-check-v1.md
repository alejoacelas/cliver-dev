# 04C claim-check v1 — m14-jumio

Claims verified against the v1 implementation document.

## Verified

- **HTTP Basic Auth + token/secret on legacy NetVerify**, headers `Accept: application/json`, `Authorization: Basic`, `User-Agent: Company App/v1.0`. The Jumio implementation-guides repo on GitHub documents exactly these headers and the user-agent enforcement note. Citation supports claim. PASS.
- **OAuth2 bearer for the newer Jumio Platform; legacy basic auth still supported but deprecated.** The "upgrading from netverify" doc on documentation.jumio.ai is the canonical reference; vendor security guidance recommends bearer tokens. PASS (note: docs page may require navigation; v1 hedges appropriately).
- **Result retrieval via Netverify Retrieval API and Callback URL.** Confirmed in the documentation.jumio.ai callback page and multiple community mirrors. PASS.
- **Injection attacks: 88% YoY rise; 9x surge in 2024 with 28x camera-emulator spike.** The Jumio press release and the Help Net Security article both reproduce these numbers and attribute them to Jumio's own threat data. PASS — but note `STALE-RISK` since these are vendor self-reports updated annually.
- **NIST IAL2 certification claim.** Jumio's privacy/trust center and public sector page both assert IAL2 alignment. The strict Kantara Trust Framework Provider listing was not directly verified in this round; v1 correctly hedges with `[vendor-described]`. PASS-with-hedge.

## Flags

- **OVERSTATED (minor):** v1 claims "5,000+ document subtypes across 200+ countries/territories." This figure is recurrent in Jumio marketing copy but the spec inherited "3000+ documents" from `00-spec.md`. Recommendation: harmonize to vendor's current published figure. The Jumio product page should be re-fetched in v2 to lock the exact number. Cite exactly. Suggested fix: change to "vendor advertises support for thousands of ID document subtypes across 200+ countries [vendor-described — Jumio product page](https://www.jumio.com/products/identity-verification/)" until the precise number is re-verified.
- **UPGRADE-SUGGESTED:** The `[best guess: $1.50–$3.50 per check]` for marginal cost. Public RFP responses (e.g., US state procurement records, City of NYC IDV RFPs) sometimes disclose IDV per-transaction pricing. Suggested search: `"Jumio" site:gov RFP price per verification`, `"Jumio" contract per-verification cost public records`.
- **THIN-SEARCH (minor):** Rate-limit `[unknown]` admission has 3 queries; acceptable but could add `"Jumio" "throttle"` and `"Jumio platform" tps quota` to strengthen.

## Verdict

REVISE-OPTIONAL — all critical claims hold; only minor harmonization (`5,000+` vs `3000+`) and an upgrade-suggested cost lookup. The document is salvageable as v1 and may be promoted; a v2 pass is optional.
