# m01-global-sanctions-union — implementation v1

- **measure:** M01
- **name:** UN/EU/UK/CA/AU sanctions union
- **modes:** D
- **summary:** Union of UN Security Council Consolidated List, EU Financial Sanctions File, UK OFSI Consolidated List, Canada SEMA, Australia DFAT — sourced via OpenSanctions (which already aggregates them) or direct primary feeds. Single screening pipeline mirroring the OFAC pipeline. Required for non-US shipments.

- **external_dependencies:**
  - OpenSanctions "Consolidated Sanctions" collection — bundles UN, EU, UK OFSI, Canada SEMA, Australia DFAT and others into a single FtM-formatted dataset [source](https://www.opensanctions.org/datasets/sanctions/).
  - Direct primary feeds (fallback / verification):
    - UN Security Council Consolidated List (XML) [source](https://www.opensanctions.org/datasets/sources/) — UN provides a single XML feed.
    - EU Financial Sanctions File (FSF) — EU provides XML; access via EU Sanctions Map portal.
    - UK OFSI Consolidated List — published as CSV/XML by HM Treasury.
    - Canada SEMA Consolidated Autonomous Sanctions List [source](https://www.opensanctions.org/datasets/ca_dfatd_sema_sanctions/).
    - Australia DFAT Consolidated List [source](https://www.opensanctions.org/datasets/au_dfat_sanctions/).

- **endpoint_details:**
  - **OpenSanctions API path:** `POST https://api.opensanctions.org/match/sanctions` with the `sanctions` collection (which is the union of all sanctions sources). API-key auth via header. €0.10/call list price [source](https://www.opensanctions.org/api/); volume discounts at ≥20k req/mo [vendor-gated for tiers].
  - **OpenSanctions bulk:** Free for non-commercial; commercial bulk-data license [vendor-gated].
  - **Direct feeds:** All five primary feeds are public, no auth, free; ToS = government open-data.
  - Total source count in OpenSanctions: 328 sources spanning sanctions, PEPs, criminal-interest entities [source](https://www.opensanctions.org/datasets/sources/).

- **fields_returned:**
  - From OpenSanctions: same FtM entity schema as `m01-ofac-sdn` (entity ID, schema, name+aliases, dob, nationality, addresses, idNumbers, datasets array indicating which lists hit, sourceUrl, first_seen, last_seen, score from `/match`).
  - From direct UN/EU/UK/CA/AU feeds: each list defines its own fields. UN XML: dataid, individual/entity, name parts, DOB, POB, nationality, list type, reference number, listed-on date. UK OFSI: similar plus group ID. EU FSF: programme + entity record. [vendor/feed-described — cross-vendor union loses native fields except those that survive FtM normalization].

- **marginal_cost_per_check:**
  - OpenSanctions API: €0.10/call list price ([source](https://www.opensanctions.org/api/)); covers all sanctions lists in one call.
  - OpenSanctions bulk + self-host: free non-commercial; [vendor-gated] commercial.
  - Direct primary feeds: $0 marginal; [best guess: 2–4 engineer-weeks] setup cost to write five parsers and a unified matcher.

- **manual_review_handoff:**
  1. Hit lands in queue with: customer record, matched entity, fuzzy score, list source(s) (UN/EU/OFSI/SEMA/DFAT).
  2. Reviewer determines applicable jurisdictions: shipment destination + provider corporate domicile dictate which lists are mandatory (e.g., UK shipment → OFSI binding; EU customer → EU FSF binding).
  3. If hit on a binding list: freeze + report per that jurisdiction's regime (e.g., UK: report to OFSI; EU: report to national competent authority; AU: report to DFAT/AUSTRAC).
  4. Disambiguate via DOB, nationality, address as in OFAC playbook.
  5. Cross-jurisdictional: a hit on any one binding list is sufficient grounds to refuse.

- **flags_thrown:**
  - `un_hit` — match against UN Security Council list.
  - `eu_fsf_hit` — match against EU Financial Sanctions File.
  - `uk_ofsi_hit` — match against UK OFSI Consolidated List.
  - `ca_sema_hit` — match against Canada SEMA list.
  - `au_dfat_hit` — match against Australia DFAT list.
  - `multi_jurisdiction_hit` — match across two or more lists (high confidence).

- **failure_modes_requiring_review:**
  - List freshness lag if self-hosting feeds and one parser breaks silently.
  - Transliteration variants (Cyrillic, Arabic, Han, Hangul) producing borderline scores against EU/UK lists that often carry transliteration variants.
  - UN Reference Number reuse / re-listing creating duplicate records.
  - Date-format inconsistencies across feeds (DD/MM/YYYY vs ISO).
  - OpenSanctions normalization may collapse or split entities differently than primary feeds; for high-stakes hits the reviewer should cross-check the primary list URL.
  - API outage → fall back to most-recent bulk snapshot.

- **false_positive_qualitative:**
  - Same name-collision issues as OFAC screen, especially for non-Latin scripts where EU/UK lists carry many transliteration aliases.
  - Customers from countries that have many sanctioned individuals on a UN list (e.g., DPRK-related, Iran-related, Russia-related) — researchers with culturally common names face high collision rates.
  - Entity-name collisions for generic corporate forms ("Trading Co.", "Shipping Ltd.").

- **record_left:**
  - Same as OFAC: list version snapshot, matched entity, score, reviewer disposition, vendor request ID if API used.
  - Per-customer audit trail: which lists they were screened against, when, and outcome — needed if a regulator audits why a non-US shipment was approved.

## For 4C to verify
- That OpenSanctions Consolidated Sanctions collection actually bundles all five named jurisdictions.
- The 328-source headline number.
- Australian DFAT and Canadian SEMA dataset slugs (`au_dfat_sanctions`, `ca_dfatd_sema_sanctions`).
