# m06-freight-forwarder-denylist — implementation research v1

- **measure:** M06 — shipping-export-country
- **name:** Freight forwarder / customs broker denylist
- **modes:** A (curated internal list, ad-hoc lookup at order intake)
- **summary:** Maintain an internal denylist of freight forwarders, customs brokers, and consolidators publicly identified as transshipment vectors to embargoed destinations. At order intake, parse the shipping address (and any "ship to forwarder" flag), match the consignee/forwarder name and address against the denylist; flag and escalate hits. Sources: BIS enforcement actions, OFAC SDN designations of forwarders, the [Trade Integrity Project](https://www.tradeintegrityproject.com/) (Yermak-McFaul / KSE), industry advisories, and the provider's own incident history.

- **attacker_stories_addressed:** foreign-institution (Method 1: in-country freight forwarder + fabricated satellite office; Method 6: in-country customs broker)

## external_dependencies

- [BIS Entity List](https://www.bis.gov/regulations/ear/part-744/supplement-no-4-part-744) — periodically adds forwarders and trading companies (e.g., the 2023–2025 additions of UAE, Hong Kong, and Turkish shell trading companies for Russia diversion).
- [OFAC SDN List](https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists) — designations of front-company forwarders.
- [Trade Integrity Project (TIP)](https://www.tradeintegrityproject.com/) — Yermak-McFaul / KSE-curated list of third-country suppliers with documented post-2022 exports of CHPL (common high-priority list) items to Russia. TIP exposes a search bar (party name lookup) but does not publish a downloadable list. Recommended in BIS's [July 2024 diversion-risks guidance](https://www.bis.gov/press-release/bis-issues-guidance-addressing-export-diversion-risks).
- [BIS "Don't Let This Happen To You" enforcement compendium](https://www.bis.doc.gov/index.php/documents/enforcement/1005-don-t-let-this-happen-to-you-1/file) — narrative case studies (last updated March 2024) naming forwarders involved in violations.
- [BIS Common High Priority List (CHPL)](https://www.bis.gov/sites/default/files/files/CHPL_2023-07.pdf) — items most diverted; relevant context for which forwarders to watch.
- Industry advisories from Descartes / OCR / Visual Compliance, plus AAEI and NCBFAA member alerts.
- Provider's internal incident history: any forwarder previously associated with a diverted order, CMRA hit, or address fraud — added to the denylist by compliance.
- [Joint Tri-Seal Compliance Note (March 2024)](https://www.bis.doc.gov/index.php/documents/enforcement/3240-tri-seal-compliance-note/file) — DOJ + Treasury + Commerce guidance establishing the expectation that exporters screen against diversion-risk lists, not just SDN/Entity.

## endpoint_details

- **No single public endpoint.** This is an internal curated list assembled from heterogeneous sources.
- **Build pipeline:**
  1. Daily pull of BIS Entity List (CSV) and OFAC SDN (XML/JSON), filtered to records with `type=Entity` AND business activity ~ logistics/freight/trading. (Data via [ITA CSL API](https://api.trade.gov/consolidated_screening_list/search) — same one used in m06-bis-entity-list, but post-filtered.)
  2. Periodic name-extraction scrape of "Don't Let This Happen To You" PDF (manual or LLM, refreshed each release).
  3. TIP party-name lookup at intake (one search per intake forwarder; TIP has no batch API).
  4. Manual append of incident history.
- **Auth (CSL leg):** API key, free.
- **Auth (TIP leg):** None; public web search bar. No published API. [unknown — searched for: "Trade Integrity Project API", "tradeintegrityproject.com bulk download", "TIP freight forwarder data export"].
- **Rate limits:** TIP web rate-limits unknown — built for occasional human queries, not automated lookup. Risk of being blocked under heavy use. CSL leg as in m06-bis-entity-list.
- **Pricing:** Free (federal data + TIP). Optional vendor: Descartes Visual Compliance, [Kharon](https://www.kharon.com/) — Kharon explicitly markets a diversion-risk and forwarder-network dataset, but pricing is sales-gated. `[vendor-gated; pricing requires sales contact]`.
- **ToS:** TIP is a research project; commercial scraping at scale would likely require permission. CSL data is public-domain federal.

## fields_returned

For each denylist record (internal schema):

- `forwarder_name` (canonical + alt names)
- `address(es)` and country
- `source` (Entity List / SDN / TIP / DLTHTY case / internal incident)
- `source_citation` (Federal Register notice, OFAC press release URL, TIP search result snapshot, internal incident ID)
- `date_added`
- `risk_tier` ("hard-block" for Entity/SDN; "review" for TIP and internal incident; "advisory" for DLTHTY narrative)
- `match_keys` (free-form: name variants, common DBA, known associated addresses)

## marginal_cost_per_check

- **Per check:** $0.00 for the local denylist match (string compare + fuzzy).
- **TIP web lookup at intake:** ~1–3 seconds wall clock if used live; the agent's recommendation is to do batch refresh of TIP results offline rather than live, to avoid load on TIP.
- **setup_cost:** ~$10K–$30K to assemble the initial list, build the curation workflow, and integrate with the order pipeline. Recurring curation: ~$5K–$20K/yr `[best guess: small-data curation work, comparable to a watchlist-tuning function]`.
- Vendor alternative (Kharon, Descartes diversion-risk add-on): `[vendor-gated]` likely $25K–$150K/yr.

## manual_review_handoff

- **Hard-block hit (Entity List / SDN):** auto-deny + reviewer documents and reports per BIS/OFAC requirements (overlap with m06-bis-entity-list).
- **Review-tier hit (TIP / internal incident):** escalate to export compliance. Compliance reviews the TIP citation (does the forwarder actually appear in TIP's search results for CHPL diversion to Russia?), the date, and decides: deny, request alternate forwarder, or release with documentation.
- **Advisory hit (DLTHTY narrative case):** informational only; reviewer notes in the file but doesn't auto-block. Used as supporting evidence for other flags.
- **Address-only match (forwarder name unknown but address matches a known forwarder address):** escalate; this is the "shell company at known address" pattern flagged by [BIS](https://www.bis.gov/press-release/bis-issues-guidance-addressing-export-diversion-risks).

## flags_thrown

- `freight_forwarder_denylist_hit_hard` — Entity/SDN match on forwarder
- `freight_forwarder_denylist_hit_review` — TIP or internal-incident match
- `freight_forwarder_address_match` — known forwarder address with unfamiliar entity name (shell pattern)
- `intake_forwarder_unspecified` — order ships to a freight forwarder address but customer didn't disclose the forwarder relationship (informational; cross-checked with CMRA classification)
- `chpl_item_to_high_diversion_country` — order's HS/ECCN intersects CHPL AND destination is in [BIS's diversion-risk countries list](https://www.bis.gov/press-release/bis-issues-guidance-addressing-export-diversion-risks) (Armenia, Georgia, Kazakhstan, Kyrgyzstan, Turkey, UAE per current guidance)

## failure_modes_requiring_review

- **List staleness.** Entity List updates daily-ish; DLTHTY updates yearly; TIP updates irregularly; internal incidents are subject to compliance team backlog.
- **Forwarder name not on the order.** Many orders ship to a forwarder address without naming the forwarder; the address matches a forwarder facility but the consignee on paper is a different LLC.
- **Newly-formed shell forwarders** (the OFAC October 2024 Compliance Communiqué scenario describes exactly this: an SDN forwarder removed from the bill of lading and replaced with a brand-new entity at the same address).
- **Common forwarder names** (DHL, FedEx, UPS branches) producing benign matches.
- **Non-Latin script forwarder names** (Cyrillic, Han, Arabic) requiring transliteration.

## false_positive_qualitative

- **Major global forwarders** (DHL, FedEx, UPS, Kuehne+Nagel, DSV, DB Schenker) — core list of legitimate exporters whose names appear in advisories as victims/conduits of fraud, not as bad actors. Must be allowlisted.
- **Real biotech distributors** in diversion-risk countries (e.g., legitimate scientific instruments distributors in UAE or Turkey) that share addresses or industry classifications with watched forwarders.
- **Fuzzy matches on common Arabic/Russian/Chinese surnames** in forwarder principals.
- **Single-shipment incidents** marked as "internal incident" that might have been one-off operational mistakes by an otherwise legitimate forwarder.

## record_left

For each screen:
- The forwarder/consignee name and address as submitted on the order
- The denylist version (a hash or date stamp of the curated file used)
- All matches (with risk_tier and source_citation)
- Disposition + reviewer signoff

Retention: 5 years per [15 CFR § 762.6](https://www.bis.gov/regulations/ear/part-762-recordkeeping). The denylist version stamp is critical: it lets a regulator verify what the provider knew at the time of screening.

## bypass_methods_known

(Stage 5 fills.)

## bypass_methods_uncovered

(Stage 5 fills.)
