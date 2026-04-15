# Per-idea synthesis: m08-commercial-pep-watchlist

## Section 1: Filled-in schema

**name**

Commercial PEP / entity watchlist

**measure**

M08 — institution-denied-parties

**attacker_stories_addressed**

No wg attacker stories engage this measure. All 19 branches model attackers at clean institutions or constructing fresh entities not on any sanctions/denied-parties list. The value is pre-listing intelligence, adverse-media detection, and multi-jurisdiction sanctions coverage beyond the free US CSL — regulatory robustness, not bypass resistance against modeled threats.

**summary**

Subscribe to a commercial AML screening vendor (LSEG World-Check, Dow Jones Risk & Compliance, ComplyAdvantage, Sayari Graph, or Bridger XG) and screen each customer institution against their consolidated entity database. The commercial layer adds adverse-media findings, PEP relationships, beneficial-ownership graphs, and pre-listing intelligence that the free CSL does not include — catching entities of concern before they reach formal government denial.

**external_dependencies**

One of: LSEG World-Check (millions of profiles, sanctions/PEPs/adverse media); Dow Jones Risk & Compliance (journalist-built profiles + adverse media); ComplyAdvantage (AI/NLP-driven, API-first); Sayari Graph (corporate-network beneficial-ownership graphs); Bridger Insight XG (LexisNexis, bank-grade screening). Internal compliance reviewer to disposition hits.

**endpoint_details**

**ComplyAdvantage (most publicly documented):** Base URL `https://api.complyadvantage.com/` (global) or `https://api.us.complyadvantage.com/` (US). Search: `POST /searches`. Auth: `Authorization: Token <API_KEY>`. Supports entity types: person, company, organisation, vessel, aircraft. Filters: `entity_type`, `fuzziness` (0-1), `types` (sanction, warning, fitness-probity, pep, adverse-media), country/DOB. Searches double as case records (assignable, status/risk-level fields). Pricing: [vendor-gated — entry tier ~$5k-$30k/yr SMB, ~$50k-$300k+/yr enterprise; per-search ~$0.10-$2.00 at SMB volume, best guess]. Rate limits: [vendor-gated]. **LSEG World-Check:** REST API, OAuth client credentials. Pricing: [vendor-gated — reported $25k-$100k+/yr]. **Dow Jones, Sayari, Bridger:** [vendor-gated — pricing, API auth, rate limits, and field schemas documented only in customer portals; industry reviews suggest mid-five to low-six figures annually for enterprise tiers.]

**fields_returned**

ComplyAdvantage `/searches` response: `search_id`, `ref`; `total_hits`, `total_matches`; `hits[]` containing `doc.id`, `doc.name`, `doc.entity_type`, `doc.aka[]`, `doc.fields[]` (DOB, nationality, addresses, identifiers), `doc.media[]` (adverse-media articles with title, URL, snippet, date, source), `doc.sources[]` (underlying lists: OFAC SDN, EU Consolidated, UN, UK HMT, Interpol, country PEP registers, adverse media), `doc.types[]` (sanction, pep, adverse-media, warning, fitness-probity), `doc.last_updated_utc`; `match_status`, `risk_level`, `assigned_to`, `is_whitelisted`. Other vendors return analogous fields with different names.

**marginal_cost_per_check**

ComplyAdvantage: ~$0.10-$2.00 per search at SMB volume [best guess, vendor-gated]. World-Check: ~$1-$5 per query at low volume [best guess, vendor-gated]. **Setup cost:** $10k-$50k for legal review, integration engineering, and vendor due-diligence. **Annual minimums:** $5k-$300k+/yr depending on vendor and tier [vendor-gated].

**manual_review_handoff**

7-step SOP: (1) Open vendor case. (2) Review matched profile: which list(s) triggered, score, address/country, alias path. (3) Sanction/watchlist hit: auto-deny pending compliance review. (4) PEP hit: enhanced due diligence; request beneficial-ownership info (PEP status of institutional officers is not a deny rule per se). (5) Adverse-media hit: reviewer reads underlying journalism; if credible articles describe sanctions evasion, bioweapons, or proliferation activity, escalate to compliance counsel and likely deny; if unrelated, record disposition and clear. (6) Mark case in vendor portal as true_positive / false_positive / discounted to feed matching tuning. (7) Log all decisions with vendor case ID.

**flags_thrown**


- `commercial_entity_sanction_hit` — vendor matched sanctions/watchlist source; auto-deny pending review.

- `commercial_entity_pep_hit` — vendor matched PEP record; enhanced due diligence.

- `commercial_entity_adverse_media_hit` — vendor matched adverse-media coverage; human review of articles.

- `commercial_entity_relationship_hit` — vendor matched related party (parent, subsidiary, beneficial owner); human review.

**failure_modes_requiring_review**

Vendor API outage / 5xx; rate-limit throttling; common-name false positives (especially Chinese/Russian institutions); adverse-media hits on stale articles (vendor doesn't always purge resolved incidents); vendor coverage gaps for non-Western jurisdictions; beneficial-ownership graph staleness (corporate registries refresh on different cadences).

**false_positive_qualitative**


- **True false positives:** common-name institutional collisions (~30-60% of alerts for institutional screening, based on industry 85-95% FP rate for bank-grade AML adjusted for institutional customers); adverse-media hits from unrelated incidents (e.g., financial fraud at a hospital system's finance division flagging the research wing); PEP hits on officers whose political exposure is irrelevant to the institution's research operations; recently renamed/merged institutions with stale vendor records.

- **False negatives:** PEP gaps in low-disclosure jurisdictions (sub-Saharan Africa, Central Asia); non-English adverse media not indexed (~30-50% of risk-relevant media in China, Middle East, Africa may be missed); recently changed ownership not yet reflected in vendor data.

**coverage_gaps**


- **Gap 1 — PEP gaps in low-disclosure jurisdictions:** ~40-60 countries with weak/nonexistent PEP registries produce structural blind spots.

- **Gap 2 — Non-English adverse media:** vendor coverage is English-centric; ~30-50% of risk-relevant media in China, Middle East, and Africa may be in unindexed publications.

- **Gap 3 — False-positive burden:** ~30-60% of alerts likely false positives for institutional screening; significant operational cost.

- **Gap 4 — Cost barrier for small providers:** $5k-$300k+/yr subscription; ~50-70% of providers by count may find cost prohibitive.

- **Gap 5 — Beneficial-ownership staleness:** [unknown — searched for: "commercial AML vendor corporate registry refresh cadence", "World-Check beneficial ownership data freshness" — refresh cadence vendor-gated]; may lag weeks to months.

- **Gap 6 — Gray-zone jurisdictions:** institutions in countries not subject to any sanctions program and with minimal PEP/adverse-media coverage pass by default.

**record_left**

Vendor case ID + URL; local copy of JSON response (for retention beyond vendor's own policy); reviewer disposition + timestamp + reviewer ID; match score + triggering list/source.

**bypass_methods_known**

None — no wg attacker stories engage this measure.

**bypass_methods_uncovered**

None — no wg attacker stories engage this measure.


## Section 2: Narrative


### What this check is and how it works

This check subscribes to a commercial AML/KYC screening vendor and screens each customer's institution name against the vendor's consolidated entity database. Unlike the free US Consolidated Screening List (m08-bis-entity-csl), which covers only US-origin sanctions lists, commercial vendors aggregate multi-jurisdiction sanctions (EU, UK, UN, regional), politically exposed person (PEP) registries, adverse-media intelligence from monitored news sources, and beneficial-ownership graphs from corporate registries worldwide. The provider submits the institution name as a search query; the vendor returns any matches with source attribution (which list or media source triggered), a match score, and case-management metadata. Hits are categorized as sanction, PEP, adverse-media, or relationship-based and routed to a human reviewer for disposition. ComplyAdvantage is documented in detail (API-first, publicly documented); LSEG World-Check, Dow Jones, Sayari, and Bridger are sales-gated for specifics.


### What it catches

The commercial vendor layer catches two categories the free CSL misses: (1) entities sanctioned by non-US jurisdictions (EU, UK, UN designations without US parallels), and (2) entities with adverse-media profiles indicating biosecurity, proliferation, or sanctions-evasion risk before formal government designation. The PEP component adds a layer of due-diligence on institutions whose officers have political exposure, though this is less directly relevant to biosecurity screening than sanctions and adverse media. The relationship/ownership-graph component (Sayari, Bridger) can identify institutions that are subsidiaries of listed entities even when the subsidiary itself is not individually named — partially closing the CSL's flat-list limitation. No wg attacker story models an adversary operating from a denied-parties-listed institution, so the check's value is regulatory robustness and pre-listing intelligence rather than resistance against the modeled threat set.


### What it misses

The commercial layer has structural blind spots in low-disclosure jurisdictions where PEP registries are incomplete (~40-60 countries) and where adverse-media coverage is English-centric (~30-50% of risk-relevant media in China, the Middle East, and Africa may be in publications not indexed by the vendor). Beneficial-ownership graphs may be stale by weeks to months depending on the jurisdiction's registry refresh cadence. False negatives from transliteration mismatches persist (the same non-Latin-name issue as the CSL, though commercial vendors have larger alias databases). The "gray zone" — institutions in countries not subject to any sanctions program and with minimal PEP/media coverage — passes by default.


### What it costs

This is the most expensive M08 check. Annual subscription minimums range from ~$5k (ComplyAdvantage SMB tier) to $300k+ (World-Check enterprise tier), with per-query costs estimated at $0.10-$2.00 at SMB volume. Setup costs include $10k-$50k for legal review, integration engineering, and vendor due-diligence. The false-positive burden adds ongoing operational cost: industry AML false-positive rates run 85-95% for bank-grade screening, and even for institutional-name screening against DNA synthesis customers, an estimated 30-60% of alerts are likely false positives requiring human disposition. The cost barrier is the most significant practical limitation — an estimated 50-70% of DNA synthesis providers by count may find the subscription cost prohibitive relative to their order volume.


### Operational realism

The manual review workflow mirrors standard AML/KYC compliance practice. Sanction hits are auto-denied pending review; PEP hits trigger enhanced due diligence; adverse-media hits require the reviewer to read the underlying journalism and assess relevance. The vendor's case-management system integrates with the provider's internal CRM, and the true_positive/false_positive feedback loop improves matching over time. The most operationally burdensome aspect is the false-positive volume: a provider screening ~1,000 institutional customers could generate hundreds of alerts, most of which are false positives from name collisions. This is manageable for large providers with dedicated compliance teams but overwhelming for small providers.


### Open questions

All vendor pricing is structurally vendor-gated and cannot be resolved without a sales contact. This is expected for enterprise AML software and is not a deficiency of the research. The cost-effectiveness comparison against the free CSL alone is the key decision for providers: the CSL covers the legally required US sanctions; the commercial layer adds non-US sanctions, adverse media, and PEP intelligence at significant cost. Whether the incremental coverage justifies the cost depends on the provider's customer base (heavily US academic vs. globally diverse), order volume, and regulatory posture.

## Section 3: Open issues for human review


- **No wg attacker stories engage this measure.** The commercial vendor layer's value is regulatory robustness and pre-listing intelligence, not adversarial resistance against the modeled threat set.


- **All vendor pricing is [vendor-gated]:** ComplyAdvantage (~$5k-$30k/yr SMB), World-Check (~$25k-$100k+/yr), Dow Jones/Sayari/Bridger (mid-five to low-six figures/yr). Per-search costs (~$0.10-$2.00) are best guesses from industry reviews. Exact figures require sales contacts.


- **[vendor-gated]:** World-Check, Dow Jones, Sayari, and Bridger field schemas, rate limits, and auth flows are documented only in customer portals.


- **[unknown — searched for: "commercial AML vendor corporate registry refresh cadence", "World-Check beneficial ownership data freshness"]:** Beneficial-ownership graph refresh cadence is vendor-gated; may lag weeks to months.


- **Cost barrier for small providers (Gap 4):** An estimated 50-70% of DNA synthesis providers by count may find the subscription cost prohibitive. If this check is recommended as part of a screening framework, the cost barrier should be acknowledged as limiting population-level effectiveness.


- **False-positive burden (Gap 3):** ~30-60% of alerts likely false positives for institutional screening. This represents a significant ongoing operational cost that should be budgeted into any adoption decision.


- **~20-30 DNA synthesis providers globally:** Used in Gap 4 estimation but not directly cited. The denominator for provider-count estimates is uncertain.
