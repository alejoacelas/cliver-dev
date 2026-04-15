# m08-commercial-pep-watchlist — Implementation v1

- **measure:** M08 — institution-denied-parties
- **name:** Commercial PEP / entity watchlist
- **modes:** A
- **summary:** Subscribe to one of the major commercial AML screening vendors (LSEG World-Check, Dow Jones Risk & Compliance, ComplyAdvantage, Sayari Graph, Bridger XG) and screen each customer institution against their consolidated entity database. The commercial layer adds adverse-media findings, PEP relationships, beneficial-ownership graphs, and pre-listing intelligence that the free CSL API does not include — catching entities of concern before they reach formal government denial.

## external_dependencies

- One of:
  - **LSEG World-Check** (formerly Refinitiv) — millions of profiles spanning sanctions, PEPs, and adverse media. ([source](https://en.wikipedia.org/wiki/World-Check), [source](https://compliancely.com/blog/sanctions-screening-software-ofac-compliance-tools/))
  - **Dow Jones Risk & Compliance** — journalist-built profiles + adverse media coverage. ([source](https://compliancely.com/blog/sanctions-screening-software-ofac-compliance-tools/))
  - **ComplyAdvantage** — UK RegTech, AI/NLP-driven, API-first integration. ([source](https://docs.complyadvantage.com/), [source](https://complyadvantage.com/fincrime-risk-intelligence/sanctions-watchlists-screening/))
  - **Sayari Graph** — corporate-network beneficial-ownership graphs across global registries.
  - **Bridger Insight XG** (LexisNexis Risk Solutions) — bank-grade screening + watchlists.
- Internal compliance reviewer to disposition hits.

## endpoint_details

Documented in detail for ComplyAdvantage as the most-publicly-documented option; the others are sales-gated.

### ComplyAdvantage

- **Base URL:** `https://api.complyadvantage.com/` (global) or `https://api.us.complyadvantage.com/` (US region). ([source](https://docs.complyadvantage.com/api-docs))
- **Search endpoint:** `POST /searches` ([source](https://docs.complyadvantage.com/api-docs))
- **Auth:** `Authorization: Token <API_KEY>` header ([source](https://docs.complyadvantage.com/api-docs))
- **Supported entity types:** person, company, organisation, vessel, aircraft ([source](https://docs.complyadvantage.com/api-docs))
- **Filters:** `entity_type`, `fuzziness` (0–1), `types` (sanction, warning, fitness-probity, pep, adverse-media), country/year-of-birth filters ([source](https://docs.complyadvantage.com/api-docs))
- **Case management:** searches double as case records; assignable to reviewers, with status + risk-level fields ([source](https://docs.complyadvantage.com/api-docs))
- **Pricing:** [vendor-gated — ComplyAdvantage pricing is sales-quoted; public guidance from G2/industry reviews puts entry tier in the **$5k–$30k/year** band for SMB and **$50k–$300k+/year** for enterprise screening volume.] [unknown — searched for: "complyadvantage pricing per search 2026", "complyadvantage subscription cost SMB" — exact public number not surfaced; would require sales contact for a quote.]
- **Rate limits:** [vendor-gated — published in customer portal; would require sales contact.]
- **ToS:** vendor MSA + DPA; use for AML/KYC screening is the explicitly authorized use case.

### LSEG World-Check

- **Product page:** World-Check One / World-Check Risk Intelligence — REST API.
- **Auth:** OAuth client credentials.
- **Pricing:** [vendor-gated — World-Check pricing is enterprise-only and sales-quoted; widely reported in industry reviews to start in the **$25k–$100k+/year** range.] ([source](https://www.g2.com/products/refinitiv-world-check-risk-intelligence/reviews))
- **Detailed fields & rate limits:** [vendor-gated — would require sales contact.]
- **Public docs:** sparse; the World-Check API reference is behind LSEG's developer portal login.

### Dow Jones RC, Sayari, Bridger

[vendor-gated — public-visible: product pages describe sanctions + PEP + adverse media coverage; pricing, API auth, rate limits, and fields are documented only in customer portals or sales decks. Industry reviews suggest mid-five to low-six figures annually for enterprise tiers. Would require sales contact for: pricing per query, rate limits, full field schemas, and ToS specifics.]

## fields_returned

For ComplyAdvantage `/searches` response (per published API docs):

- `search_id`, `ref` (client-side reference)
- `total_hits`, `total_matches`
- `hits[]` — each containing:
  - `doc.id`, `doc.name`, `doc.entity_type`
  - `doc.aka[]` (aliases)
  - `doc.fields[]` — structured attributes (DOB, nationality, addresses, identifiers)
  - `doc.media[]` — adverse-media articles (title, URL, snippet, date, source)
  - `doc.sources[]` — which underlying lists/databases triggered the hit (e.g., `OFAC SDN`, `EU Consolidated`, `UN`, `UK HMT`, `Interpol Red Notice`, `country PEP register`, `adverse media`)
  - `doc.types[]` — categories: sanction, pep, adverse-media, warning, fitness-probity
  - `doc.last_updated_utc`
- `match_status`, `risk_level`, `assigned_to`, `is_whitelisted`

[vendor-described, not technically documented for the others — World-Check and Dow Jones return analogous sets but field names differ.]

## marginal_cost_per_check

- ComplyAdvantage: typically a **per-search or per-monitored-entity** charge. [best guess based on industry-standard SaaS pricing for AML screening: **$0.10–$2.00 per search** at SMB volume; less at enterprise volume.] [vendor-gated — exact unit pricing requires a quote.]
- World-Check: typically **annual subscription with included query volume**; effective per-query cost varies. [best guess: $1–$5 per query at low volume, falling at scale.]
- **setup_cost:** Vendor onboarding + procurement: typically **$10k–$50k** in legal review, integration engineering, and vendor due-diligence. [best guess: based on typical enterprise AML vendor onboarding effort.]
- **Annual minimums:** typically $5k–$300k+/year depending on tier. [vendor-gated.]

## manual_review_handoff

When the check fires `commercial_entity_hit`:

1. Reviewer opens the vendor case (each search creates a case in the vendor portal as well as in the local CRM).
2. Reviewer reviews the matched profile: which list(s) triggered, the score, the address/country, the alias path (did the customer's institution name match a primary name or an alias).
3. **Sanction/Watchlist hit:** treat with the same severity as a CSL hit (auto-deny pending compliance review).
4. **PEP hit:** PEPs are not denied per se for an institutional customer (the institution's executive being a PEP is rarely a deny-rule); reviewer reads the PEP relationship and applies enhanced due-diligence — request beneficial-ownership info from the customer.
5. **Adverse-media hit:** reviewer reads the underlying journalism. If credible articles describe the institution as front for sanctions evasion, biological-weapons program, or proliferation activity → escalate to compliance counsel and likely deny. If articles are unrelated (e.g., a financial-fraud investigation at a different unit) → record disposition + clear.
6. Reviewer marks the case in the vendor portal as `true_positive` / `false_positive` / `discounted` to feed back into the vendor's matching tuning.
7. All decisions logged with vendor case ID for the audit trail.

## flags_thrown

- `commercial_entity_sanction_hit` — vendor matched against an underlying sanctions/watchlist source. **Action:** auto-deny pending review.
- `commercial_entity_pep_hit` — vendor matched a PEP record. **Action:** enhanced due diligence; request beneficial-owner info.
- `commercial_entity_adverse_media_hit` — vendor matched adverse-media coverage. **Action:** human review of articles.
- `commercial_entity_relationship_hit` — vendor matched on a related party (parent, subsidiary, beneficial owner) rather than the named entity. **Action:** human review.

## failure_modes_requiring_review

- Vendor API outage / 5xx.
- Rate-limit throttling at peak hours.
- Common-name false positives (especially Chinese/Russian institutions where romanization collides).
- Adverse-media hits on stale articles (vendor doesn't always purge resolved-incident records).
- Vendor coverage gaps for non-Western jurisdictions (some PEPs in less-covered countries are not in commercial datasets).
- Beneficial-ownership graph staleness (Sayari/Bridger refresh corporate registries on different cadences).

## false_positive_qualitative

- Universities and research institutes whose names share words with listed entities (very common in Chinese institutional naming).
- Institutions whose adverse-media exposure is from unrelated incidents (financial fraud at the medical center, harassment scandal at a separate department).
- Institutions whose officers happen to be PEPs in their personal capacity but the institution's research operations are unrelated.
- Recently merged or renamed institutions whose new name has not yet propagated through vendor databases.

## record_left

- Vendor case ID + URL.
- Local copy of the JSON response (for retention beyond the vendor's own retention).
- Reviewer disposition + timestamp + reviewer ID.
- Match score + which list/source triggered.

## Open issues for v2

- All vendor pricing remains `[vendor-gated]`. v2 cannot improve this without a sales contact; this is structural.
- World-Check / Dow Jones / Sayari / Bridger field schemas remain `[vendor-gated]` for the same reason.
- Whether ComplyAdvantage's free trial / sandbox is sufficient for an evaluation deserves a stage-6 BOTEC.
- Cost-effectiveness comparison vs. running CSL alone (since CSL is free and overlaps substantially with the commercial layer's sanctions/watchlist component).
