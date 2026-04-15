# m06-freight-forwarder-denylist — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Freight forwarder / customs broker denylist |
| **measure** | M06 — shipping-export-country |
| **attacker_stories_addressed** | foreign-institution (Method 1: in-country freight forwarder + fabricated satellite office; Method 6: in-country customs broker) |
| **summary** | Maintain an internal denylist of freight forwarders, customs brokers, and consolidators publicly identified as transshipment vectors to embargoed destinations. Sources: BIS Entity List (CSV), OFAC SDN (XML/JSON), Trade Integrity Project (TIP) party-name search, BIS "Don't Let This Happen To You" enforcement compendium, industry advisories, and internal incident history. At order intake, parse the shipping address (including "ship to" / "c/o" fields), match consignee/forwarder name and address against the denylist; flag and escalate hits. |
| **external_dependencies** | BIS Entity List (CSV, filtered to logistics/freight/trading entities); OFAC SDN List; Trade Integrity Project (tradeintegrityproject.com) — Yermak-McFaul / KSE-curated, party-name search bar, no batch API [unknown whether bulk access permitted]; BIS "Don't Let This Happen To You" compendium (PDF, ~annual); BIS Common High Priority List (CHPL); Joint Tri-Seal Compliance Note (March 2024); industry advisories (Descartes, OCR, AAEI, NCBFAA); internal incident history. Optional vendor: Kharon diversion-risk dataset, Descartes Visual Compliance `[vendor-gated]`. |
| **endpoint_details** | No single public endpoint — internal curated list from heterogeneous sources. **Build pipeline:** (1) Daily CSL API pull filtered to Entity/SDN logistics entities; (2) periodic PDF extraction from DLTHTY; (3) TIP party-name lookup at intake or batch refresh (no API, public web search bar, rate limits unknown); (4) manual internal-incident append. **Auth:** CSL = free API key; TIP = none (public web). **Pricing:** Free (federal data + TIP); vendor alternative (Kharon, Descartes): `[vendor-gated; likely $25K–$150K/yr]`. **ToS:** TIP is a research project; commercial scraping at scale may require permission. CSL is public-domain. |
| **fields_returned** | Internal schema per denylist record: `forwarder_name` (canonical + alt names), `address(es)` + country, `source` (Entity List / SDN / TIP / DLTHTY / internal), `source_citation`, `date_added`, `risk_tier` (hard-block / review / advisory), `match_keys` (name variants, DBA, associated addresses). |
| **marginal_cost_per_check** | $0.00 (local string compare + fuzzy match). TIP web lookup ~1–3 sec wall clock if used live. **Setup cost:** ~$10K–$30K initial list assembly + curation workflow + pipeline integration [best guess]. Recurring curation: ~$5K–$20K/yr [best guess]. Vendor alternative: `[vendor-gated]` likely $25K–$150K/yr. |
| **manual_review_handoff** | **Hard-block (Entity/SDN):** auto-deny + reviewer documents per BIS/OFAC requirements (overlaps m06-bis-entity-list). **Review-tier (TIP/internal incident):** escalate to export compliance; compliance reviews TIP citation, decides deny/request alternate forwarder/release with documentation. **Advisory (DLTHTY narrative):** informational; reviewer notes in file, no auto-block. **Address-only match:** escalate — "shell company at known address" pattern per BIS guidance. |
| **flags_thrown** | `freight_forwarder_denylist_hit_hard` (Entity/SDN match); `freight_forwarder_denylist_hit_review` (TIP/internal-incident match); `freight_forwarder_address_match` (known forwarder address, unfamiliar entity — shell pattern); `intake_forwarder_unspecified` (order ships to forwarder address without disclosing relationship); `chpl_item_to_high_diversion_country` (HS/ECCN intersects CHPL AND destination is in BIS diversion-risk countries: Armenia, Georgia, Kazakhstan, Kyrgyzstan, Turkey, UAE). |
| **failure_modes_requiring_review** | List staleness (Entity List daily, DLTHTY annual, TIP irregular, internal incidents subject to backlog); forwarder name not on order (many orders ship to forwarder address under customer name); newly formed shell forwarders (no enforcement history); common forwarder names (DHL, FedEx, UPS) producing benign matches; non-Latin script forwarder names requiring transliteration. |
| **false_positive_qualitative** | (1) Major global forwarders (DHL, FedEx, UPS, Kuehne+Nagel, DSV, DB Schenker) mentioned in advisories as fraud victims/conduits, not bad actors — must be allowlisted. (2) Legitimate biotech distributors in diversion-risk countries (UAE, Turkey) sharing addresses/industry with watched forwarders. (3) Fuzzy-match collisions on common Arabic/Russian/Chinese trading-company names. (4) Single-incident internal additions that may be operational mistakes rather than true diversion. |
| **coverage_gaps** | (1) Unlisted forwarders: >99% of global freight forwarders (~100K–200K firms [best guess]) are not on any denylist — no signal for novel or first-time diverters. (2) Orders not disclosing forwarder relationship [unknown size; best guess: many synthesis orders ship via direct courier, not forwarder]. (3) Newly formed shell forwarders at known addresses — address-match partially mitigates. (4) Non-Russia diversion pathways (Iran, NK, Syria via Malaysia, Oman, etc.) underrepresented in TIP and recent BIS enforcement [unknown size]. (5) Non-Latin script transliteration mismatches for forwarders in China, Middle East, Central Asia. (6) Legitimate global forwarders must be allowlisted to prevent high-volume false positives. |
| **record_left** | Per screen: forwarder/consignee name + address as submitted, denylist version (hash or date stamp), all matches with risk_tier and source_citation, disposition + reviewer signoff. Retention: 5 years per 15 CFR § 762.6. Denylist version stamp lets regulators verify what the provider knew at screening time. |
| **bypass_methods_known** | foreign-institution Method 1 (freight forwarder in non-corridor country) — AMBIGUOUS (depends on listing); Method 6 (customs broker in non-corridor country) — AMBIGUOUS; forwarder name omitted from order — MISSED; newly formed shell forwarder — MISSED. |
| **bypass_methods_uncovered** | Freight forwarders in non-diversion-corridor countries (Brazil, Japan, India, Indonesia, Vietnam) underrepresented on all denylist sources. Forwarder name omission from order defeats name-based matching. Newly formed shell forwarders with no enforcement history are invisible to reactive denylists. |

---

## Section 2: Narrative

### What this check is and how it works

This check maintains a curated internal denylist of freight forwarders, customs brokers, and consolidators identified as transshipment vectors to embargoed destinations. The denylist is assembled from multiple public and internal sources: the BIS Entity List and OFAC SDN list (filtered to logistics/trading entities), the Trade Integrity Project (a KSE/Yermak-McFaul research database of third-country suppliers shipping controlled items to Russia), BIS enforcement narratives, industry advisories, and the provider's own incident history. At order intake, the system parses the shipping address — including "care of" and "ship to" fields — and matches the consignee/forwarder name and address against the denylist. Records are tiered: Entity List and SDN matches trigger automatic denial, TIP and internal-incident matches trigger escalation for compliance review, and advisory-level matches are informational. The check also performs address-level matching to catch the "shell company at a known forwarder address" pattern identified in BIS enforcement guidance.

### What it catches

The denylist is most effective against forwarders operating in the Russia/China/Iran diversion corridor — the UAE, Turkey, Armenia, Georgia, Kazakhstan, and Kyrgyzstan transshipment pathway that has been the focus of intensive BIS enforcement since 2022. BIS sent red-flag letters to approximately 700 foreign suppliers identified as shipping CHPL items to Russia; TIP exposes a search interface for these entities. The address-match capability adds a layer for the well-documented pattern where an SDN-designated forwarder is dissolved and a new entity is incorporated at the same address. The `chpl_item_to_high_diversion_country` flag combines ECCN/HS classification with destination to create a composite diversion-risk signal. For the foreign-institution attacker story, the check catches the scenario where the attacker happens to route through a listed forwarder — a coincidence catch rather than a design-level gate.

### What it misses

The dominant gap is structural: the denylist is reactive and catches only known bad actors. Over 99% of global freight forwarding firms are not on any denylist. The foreign-institution branch specifically targets countries (Brazil, Japan, India, Indonesia, Vietnam) outside the primary diversion-risk corridors where TIP and BIS enforcement concentrate. Forwarders in these countries have no documented diversion history and will not appear on the list. Additionally, attackers can omit the forwarder relationship from the order entirely — listing themselves as the consignee at the forwarder's address — defeating name-based matching unless the address itself is in the denylist. Newly formed shell forwarders are by definition invisible to any reactive list. Finally, TIP's data skews heavily toward Russia diversion; diversion networks to Iran, North Korea, and Syria via intermediaries like Malaysia or Oman may be underrepresented.

### What it costs

Marginal cost per check is zero (local lookup). The distinctive cost is curation: assembling the initial denylist from heterogeneous sources is estimated at $10K–$30K, with ongoing maintenance at $5K–$20K/year for monitoring Entity List updates, refreshing TIP lookups, and processing internal incidents. The TIP access model is a constraint: it offers only a web search bar with no batch API, unknown rate limits, and uncertain terms for commercial scraping. A vendor alternative (Kharon's diversion-risk dataset or Descartes Visual Compliance) would provide a maintained and structured feed but at $25K–$150K/year (vendor-gated). The choice between in-house curation and vendor subscription depends on the provider's compliance team capacity.

### Operational realism

Hard-block hits (Entity/SDN) overlap with m06-bis-entity-list and follow the same auto-deny + documentation workflow. Review-tier hits (TIP/internal) require compliance staff to evaluate the TIP citation — confirming the forwarder appears in TIP's search results for CHPL diversion — and decide: deny, request an alternate forwarder, or release with documentation. The address-match flag is operationally novel and requires judgment: a match on a known forwarder address with an unfamiliar entity name could be a shell company or an unrelated tenant in the same building. False positives from major global forwarders (DHL, FedEx, UPS) appearing in advisory documents necessitate a maintained allowlist. Each screen produces an auditable record including the denylist version stamp — critical for demonstrating to regulators what the provider knew at screening time.

### Open questions

The Trade Integrity Project's access model is unresolved: it has no batch API, no published record count, and uncertain terms of service for automated querying. Whether TIP integration is feasible as automated lookup (with risk of being blocked) or must remain a manual-lookup supplement affects the denylist's completeness. The 4C claim check flagged the CHPL PDF URL as potentially stale (date-stamped path); this should be updated to the BIS landing page hosting the current revision. Stage 5's suggestion to add a blanket "flag any international shipment routed through a freight forwarder" rule — moving from a denylist to a disclosure-requirement model — was not incorporated into the implementation but would significantly expand coverage at the cost of review volume.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** The denylist's limited leverage against the foreign-institution branch (which avoids the Russia/China/Iran corridor) is a structural limitation of reactive denylists, not an implementation gap.
- **`[unknown]` fields affecting policy implications:**
  - TIP batch API / bulk download availability: searched for "Trade Integrity Project API", "tradeintegrityproject.com bulk download", "TIP freight forwarder data export" — no results. Access model limits automated integration.
  - CSL/TIP rate limits for automated queries: unknown for both.
  - Fraction of synthesis orders using freight forwarders: no data specific to synthesis.
  - Non-Russia diversion forwarder networks (Iran, NK, Syria): no systematic open-source dataset equivalent to TIP exists for these corridors.
  - Shell forwarder evasion rate: no quantitative data.
- **`[vendor-gated]` fields:**
  - Kharon diversion-risk dataset and Descartes Visual Compliance pricing (likely $25K–$150K/yr) require sales contact.
- **06F flags not fully resolved:**
  - Global freight forwarder count (~100K–200K) is loosely estimated from US figures; FIATA membership stats could anchor it.
  - "700 foreign suppliers" BIS red-flag letter figure cited from secondary trade press; primary BIS source would strengthen.
- **4C flag:** CHPL PDF URL (`CHPL_2023-07.pdf`) is date-stamped and may be stale; should be re-pointed to a stable BIS landing page.
- **Stage 5 Moderate findings:**
  - Non-diversion-corridor country coverage gap: forwarders in Brazil, Japan, India, Indonesia, Vietnam are underrepresented. Consider a blanket "international shipment via forwarder" flag as an alternative to denylist-only approach.
  - Forwarder name omission: implementation should specify forwarder-disclosure requirement when shipping address resolves to a known freight facility.
- **Cross-measure dependency:** The `chpl_item_to_high_diversion_country` flag requires ECCN/HS classification from m06-hs-eccn-classification.
