# m01-commercial-watchlist — implementation v1

- **measure:** M01
- **name:** Commercial watchlist (World-Check / Dow Jones / LexisNexis Bridger)
- **modes:** D
- **summary:** Use a commercial PEP+sanctions+adverse-media aggregator to catch entries before they appear on government lists and to surface adverse media. Three dominant vendors: LSEG/Refinitiv World-Check One, Dow Jones Risk & Compliance, LexisNexis Bridger Insight XG.

- **external_dependencies:**
  - LSEG (Refinitiv) World-Check One API or Zero-Footprint Screening API [source](https://developers.lseg.com/en/api-catalog/customer-and-third-party-screening/world-check-one-api).
  - Dow Jones Risk & Compliance (Risk Center / API).
  - LexisNexis Bridger Insight XG.
  - Internal reviewer queue + adverse-media triage workflow.

- **endpoint_details:**
  - **World-Check One API:** REST API, OAuth/HMAC auth via LSEG developer portal; supports synchronous screening and ongoing monitoring; "Zero Footprint" variant returns matches without persisting customer data on LSEG infrastructure [source](https://developers.lseg.com/en/api-catalog/customer-and-third-party-screening/world-check-one-zero-footprint-screening-api). Pricing: [vendor-gated — public marketing pages describe features; pricing requires sales contact, typical enterprise contracts in five-to-six figures annually per industry G2 reviews](https://www.g2.com/products/refinitiv-world-check-risk-intelligence/reviews). ToS: licensed data, contractual restriction on redistribution.
  - **Dow Jones R&C:** [vendor-gated — Dow Jones Risk Center is a hosted portal + API; pricing not publicly listed; sales contact required].
  - **LexisNexis Bridger Insight XG:** Hosted platform with API and batch upload; [vendor-gated — pricing not publicly listed].

- **fields_returned:**
  - World-Check profile fields: subject ID, full name + AKAs, category (PEP / sanctioned / law enforcement / adverse media / SOE), sub-category, DOB(s), nationality, country of residence, identification numbers, role/position (for PEPs), associated entities, sources cited (URLs to articles/list entries), date added, date last updated, match score [vendor-described, not technically documented in public free pages — drawn from World-Check One marketing fact sheet](https://www.refinitiv.com/content/dam/marketing/en_us/documents/fact-sheets/world-check-one-api.pdf).
  - Dow Jones / Bridger return analogous fields (PEP class 1–4, sanctions list source, adverse media tags, related parties) [vendor-described].

- **marginal_cost_per_check:**
  - [vendor-gated — none of the three vendors publish per-check pricing publicly]. Industry rule of thumb from KYC vendor comparisons: ~$0.50–$5 per screening at low/mid volume, dropping with volume; enterprise contracts typically structured as annual subscription with included screening volume rather than pure per-call [best guess: drawn from G2/SoftwareSuggest review snippets and standard KYC vendor pricing patterns].
  - setup_cost: license negotiation + integration engineering [best guess: 4–8 engineer-weeks plus annual license in the low-to-mid five figures USD minimum].

- **manual_review_handoff:**
  1. Hit lands in compliance reviewer queue with: customer record, matched profile, category (PEP / sanction / adverse media), match score, vendor profile URL.
  2. Reviewer opens the vendor profile and reads cited sources (sanctions list entry, news article, court record).
  3. For PEP-only hits: apply provider's PEP risk policy — typically allow with enhanced due diligence note unless PEP class is high-risk (PEP1) or jurisdiction-restricted.
  4. For sanctions hits: treat as OFAC-equivalent (freeze, escalate to compliance officer).
  5. For adverse-media hits: read articles, distinguish "subject of investigation/conviction" (block) from "incidentally mentioned" (release with note).
  6. Document disposition with vendor case ID + reviewer rationale.

- **flags_thrown:**
  - `watchlist_hit` — match against any non-government sanctions/enforcement list aggregated by vendor (e.g., national LE lists not yet on OFAC).
  - `pep_hit` — politically exposed person match → enhanced due diligence note, generally not a block on its own.
  - `adverse_media_hit` — news linking customer to financial crime, fraud, terrorism, weapons proliferation → reviewer reads articles.
  - `state_owned_entity_hit` — for entity customers connected to sanctioned-jurisdiction state ownership.

- **failure_modes_requiring_review:**
  - High false-positive rate on common names — vendor "fuzziness" tuning is a perennial trade-off.
  - PEP class definitions vary by vendor and jurisdiction; reviewer must understand vendor's PEP taxonomy.
  - Adverse-media articles in non-English languages may have translation gaps.
  - Vendor data refresh lag (typically 24h) vs OFAC's intra-day updates — pair with direct OFAC feed.
  - License/cost may force tiered screening (only screen high-value or SOC orders).
  - API errors / vendor outage → fall back to OFAC-only screening.

- **false_positive_qualitative:**
  - Researchers who happen to be PEPs in their home country (e.g., a senior academic who also serves on a government science advisory board).
  - Researchers with the same name as a PEP (very common for South/East Asian and Latin American names).
  - Researchers mentioned incidentally in adverse media (e.g., quoted as an expert in a fraud article).
  - Faculty at universities that are state-owned (China, Saudi Arabia, Russia) flagged via SOE lists even when the individual is benign.

- **record_left:** Vendor case ID + full match record (matched profile, score, sources, reviewer disposition, timestamp). Vendor-side audit trail of which screenings were run, when, and outcome — used in regulator audits.

## For 4C to verify
- That the World-Check One Zero Footprint API page describes a no-persist mode.
- The G2 reviews citation for pricing being non-public (qualitative claim).
