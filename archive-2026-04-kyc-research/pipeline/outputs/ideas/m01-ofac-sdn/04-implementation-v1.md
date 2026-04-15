# m01-ofac-sdn — implementation v1

- **measure:** M01
- **name:** OFAC SDN + Consolidated screen
- **modes:** D
- **summary:** Screen the customer's legal name (and DOB/address when available) against OFAC SDN and the OFAC Consolidated (non-SDN) Sanctions List, either by ingesting Treasury's Sanctions List Service files directly or by calling a vendor wrapper (OpenSanctions, ofac-api.com). Fuzzy-match on name (vendors typically use Jaro-Winkler / Soundex variants [best guess: standard sanctions-screening practice]) with score threshold; require human disposition on hits.

- **external_dependencies:**
  - Primary feed: Treasury OFAC Sanctions List Service (SLS), publishes SDN + Consolidated in XML, CSV, and fixed/delimited formats [source](https://ofac.treasury.gov/sanctions-list-service).
  - Vendor wrapper option A: OpenSanctions `/match` API (datasets `us_ofac_sdn`, `us_ofac_cons`) [source](https://www.opensanctions.org/docs/api/matching/).
  - Vendor wrapper option B: ofac-api.com consolidated screening API; lists refreshed at least every 5 minutes (some every 2 minutes); fuzzy matching "designed in coordination with the US Treasury Department based on Treasury guidelines" [source](https://docs.ofac-api.com/search-api).
  - Internal: customer DB; reviewer queue.

- **endpoint_details:**
  - **Treasury SLS (free):** Bulk file downloads at `https://sanctionslist.ofac.treas.gov/Home/SdnList` and `.../ConsolidatedList`; no auth; no per-call rate limit (re-pull on Treasury's update cadence — typically intra-day on update days) [source](https://ofac.treasury.gov/sanctions-list-service). ToS: U.S. Government work, public domain; no specific commercial restriction for screening use.
  - **OpenSanctions `/match`:** `POST https://api.opensanctions.org/match/sanctions` (or `/match/default`) with API-key header; pay-as-you-go metering, 30-day free trial on business email; volume discounts begin at 20,000 req/mo [source](https://www.opensanctions.org/api/). Pricing: €0.10/call list price [source](https://www.opensanctions.org/api/); USD pricing [vendor-gated — only EUR list price publicly visible; USD and volume tier pricing require sales contact].
  - **ofac-api.com:** REST search API with API-key auth; vendor exposes a `source` filter parameter to choose lists [vendor docs split across pages — syntax on `/search-api/request`, overview on `/search-api`]; refresh "at least every 5 minutes, some every 2 minutes" [source](https://docs.ofac-api.com/search-api). Pricing tiers [vendor-gated — public docs describe features; pricing requires account/sales contact].

- **fields_returned:**
  - From SLS XML/CSV: entity UID, name, name type (primary/aka/weak-aka), entity type (individual/entity/vessel/aircraft), program(s), title, DOB(s), POB(s), nationality, citizenship, addresses, IDs (passport, tax ID), remarks, list publication date [source](https://ofac.treasury.gov/faqs/topic/1641).
  - From OpenSanctions `/match`: matched entity ID, schema (Person/Organization), caption, score, features matrix (name, country, dob, address), `datasets` array (e.g. `us_ofac_sdn`), source URLs [source](https://www.opensanctions.org/docs/api/matching/).
  - From ofac-api.com: match score per record, matched-name string, list source code, list-entry metadata, fuzzy-match technique used [vendor-described, not technically documented in publicly-fetched page].

- **marginal_cost_per_check:**
  - Self-hosted on SLS feed: ~$0 marginal; setup_cost = engineering to ingest XML, build matcher, deploy reviewer UI [best guess: 1–3 engineer-weeks].
  - OpenSanctions: €0.10 ≈ $0.11 per `/match` call list price [source](https://www.opensanctions.org/api/); lower at volume tiers [vendor-gated].
  - ofac-api.com: [vendor-gated — pricing not on public docs page].

- **manual_review_handoff:**
  1. Hit appears in queue with: customer record, matched SDN/Consolidated entry, fuzzy score, matched fields, list snapshot date.
  2. Reviewer compares secondary identifiers (DOB, nationality, address, aliases) between customer and listed entity.
  3. If 2+ secondary identifiers match → confirm hit, freeze order, file to compliance for OFAC reporting (blocked-property report within 10 business days if applicable per 31 CFR 501.603) [best guess: standard OFAC compliance SOP].
  4. If only name matches and other identifiers diverge → mark as common-name false positive, document rationale, release.
  5. If insufficient identifiers in customer record → request DOB / nationality / address from customer through callback, do not ship pending response.

- **flags_thrown:**
  - `ofac_sdn_hit` — fuzzy score above threshold against an SDN entry → human disposition required before ship.
  - `ofac_consolidated_hit` — fuzzy score above threshold against a non-SDN consolidated list entry → human disposition; may have list-program-specific handling (FSE, NS-PLC, SSI).
  - `ofac_weak_alias_hit` — match against a "weak AKA" (OFAC's own designation for low-quality aliases) → lower-priority queue, still reviewed [source](https://ofac.treasury.gov/faqs/topic/1641).

- **failure_modes_requiring_review:**
  - Common-name false positives (e.g., "Mohammed Ali", "Wang Wei") generating high fuzzy scores against unrelated SDN entries.
  - Transliteration variants (Cyrillic↔Latin, Arabic↔Latin) producing borderline scores.
  - Customer record missing DOB/nationality so reviewer cannot disambiguate.
  - Vendor API outage / 5xx errors → fall back to local SLS file copy or hold orders.
  - List update lag if self-hosted feed isn't refreshed (Treasury can publish multiple times per day on action days).
  - Weak-AKA entries — OFAC flags certain aliases as low-quality and discourages action on those matches alone [source](https://ofac.treasury.gov/faqs/topic/1641).

- **false_positive_qualitative:**
  - Researchers with very common names (especially Arabic, Persian, Han Chinese, Hispanic patronymics) frequently collide with SDN entries.
  - Customers sharing a name with a sanctioned individual but with a clearly different DOB / nationality / location.
  - Companies with generic names (e.g., "Global Trading Co.") that collide with shell-company designations.
  - Researchers based in countries that share common surnames with designated persons but no other connection.

- **record_left:**
  - Per check: list snapshot date/version, fuzzy score, matched list entry ID, matched fields, reviewer disposition, timestamp, reviewer ID.
  - Per system: archived copies of SLS XML by date for audit reproducibility.
  - If using OpenSanctions or ofac-api.com: vendor request ID + full JSON response stored.

## For 4C to verify
- The €0.10/call OpenSanctions list price.
- That ofac-api.com's stated ~2-minute refresh and source-filter syntax actually appear on the cited docs page.
- That SLS file formats listed (XML/CSV/fixed/delimited) match Treasury's FAQ page.
