# m01-global-sanctions-union — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | UN/EU/UK/CA/AU sanctions union |
| **measure** | M01 — Sanctions name screen |
| **attacker_stories_addressed** | denied-individual, sanctioned-jurisdiction-routing, foreign-buyer-shell (from spec); however, stage 5 found zero attacker stories in the by-measure mapping engage this measure — all 19 wg branches model attackers whose names trivially clear sanctions screening by construction. |
| **summary** | Union of UN Security Council Consolidated List, EU Financial Sanctions File (FSF), UK OFSI Consolidated List, Canada SEMA, and Australia DFAT — sourced via OpenSanctions (which aggregates them into a single FtM-formatted dataset) or direct primary feeds. Single screening pipeline mirroring the OFAC pipeline. Required for non-US shipments where EU/UK/CA/AU sanctions are the binding legal regime. |
| **external_dependencies** | OpenSanctions "Consolidated Sanctions" collection (bundles UN, EU, UK OFSI, Canada SEMA, Australia DFAT, and others); direct primary feeds (UN XML, EU FSF XML, UK OFSI CSV/XML, Canada SEMA, Australia DFAT) as fallback/verification; internal reviewer queue. |
| **endpoint_details** | **OpenSanctions API:** `POST https://api.opensanctions.org/match/sanctions` with the `sanctions` collection. API-key auth via header. List price: EUR 0.10/call; volume discounts at >=20k req/mo [vendor-gated for tiers]. **OpenSanctions bulk:** free for non-commercial; commercial license [vendor-gated]. **Direct feeds:** all five primary feeds are public, no auth, free; government open-data ToS. Total source count in OpenSanctions: 328 sources spanning sanctions, PEPs, criminal-interest entities. |
| **fields_returned** | From OpenSanctions: FtM entity schema — entity ID, schema (Person/Organization), name+aliases, DOB, nationality, addresses, idNumbers, datasets array indicating which lists hit, sourceUrl, first_seen, last_seen, match score. From direct feeds: each list defines its own fields (UN XML: dataid, name parts, DOB, POB, nationality, list type, reference number, listed-on date; UK OFSI: similar plus group ID; EU FSF: programme + entity record). Cross-vendor union loses native fields except those surviving FtM normalization. |
| **marginal_cost_per_check** | OpenSanctions API: EUR 0.10/call (covers all sanctions lists in one call). OpenSanctions bulk + self-host: free non-commercial; [vendor-gated] commercial. Direct primary feeds: $0 marginal; **setup_cost:** [best guess: 2-4 engineer-weeks] to write five parsers and a unified matcher. |
| **manual_review_handoff** | Hit enters queue with: customer record, matched entity, fuzzy score, list source(s). Reviewer determines applicable jurisdictions (shipment destination + provider corporate domicile dictate which lists are mandatory). Hit on a binding list: freeze + report per that jurisdiction's regime (UK: report to OFSI; EU: report to national competent authority; AU: report to DFAT/AUSTRAC). Disambiguate via DOB, nationality, address. Cross-jurisdictional: a hit on any one binding list is sufficient grounds to refuse. |
| **flags_thrown** | `un_hit` (UN Security Council list match); `eu_fsf_hit` (EU Financial Sanctions File match); `uk_ofsi_hit` (UK OFSI match); `ca_sema_hit` (Canada SEMA match); `au_dfat_hit` (Australia DFAT match); `multi_jurisdiction_hit` (match across two or more lists — high confidence). |
| **failure_modes_requiring_review** | List freshness lag if self-hosting feeds and one parser breaks silently; transliteration variants (Cyrillic, Arabic, Han, Hangul) producing borderline scores; UN Reference Number reuse/re-listing creating duplicate records; date-format inconsistencies across feeds; OpenSanctions normalization may collapse or split entities differently than primary feeds; API outage -> fall back to most-recent bulk snapshot. |
| **false_positive_qualitative** | (1) Transliteration-variant false positives — union of 5+ lists means more alias variants per sanctioned person, increasing fuzzy-match surface; worst for Cyrillic, Arabic, Chinese names. (2) Generic entity-name collisions for commercial customers with common corporate name patterns. (3) Country-of-origin bias — customers from Iran, Russia, China, DPRK face systematically higher false-positive rates. (4) Multi-list pileup — independent false positives on the same common name across different lists may be treated as higher-confidence when they are actually independent errors. |
| **coverage_gaps** | (1) Customers in countries with no independent sanctions program and minimal UN/EU listing activity — no signal (~20-30% of global synthesis customer base by volume). (2) Actors operating through jurisdictions not covered by the five-list union (Japan, South Korea, India, Israel) — weak signal if using only 5 direct feeds; mitigated if using OpenSanctions aggregation. (3) Transliteration and script-variant misses for non-Latin names — weak signal (may miss true positives) and false-positive (may flag wrong people). (4) Entity-name collisions for generic commercial customers — false-positive. |
| **record_left** | List version snapshot, matched entity, score, reviewer disposition, vendor request ID if API used. Per-customer audit trail of which lists screened against, when, and outcome — needed for regulator audit of non-US shipment approvals. |
| **bypass_methods_known** | None — no attacker stories in the by-measure mapping engage this measure. |
| **bypass_methods_uncovered** | None — no attacker stories engage this measure. |

## Section 2: Narrative

### What this check is and how it works

This check screens every customer name against a union of the five major non-US sanctions lists: the UN Security Council Consolidated List, the EU Financial Sanctions File, the UK OFSI Consolidated List, Canada's SEMA list, and Australia's DFAT list. The simplest implementation uses the OpenSanctions API, which aggregates all five (plus hundreds more) into a single call at EUR 0.10 each. Alternatively, a provider can download the five lists directly (all are free, public government data) and build a self-hosted matcher, which costs $0 per check but requires 2-4 engineer-weeks to build parsers for five different feed formats. The check mirrors the OFAC screening pipeline and is legally required for non-US shipments where EU, UK, Canadian, or Australian sanctions regimes are binding.

### What it catches

The check catches customers who appear on any of the five major non-US sanctions lists. Its primary value is legal compliance for international shipments — a UK-bound shipment requires OFSI screening, an EU-bound shipment requires FSF screening. The `multi_jurisdiction_hit` flag (match across two or more lists) provides high-confidence identification. However, as with all M01 checks, stage 5 found that none of the 19 modeled attacker stories engage sanctions screening. Every modeled attacker trivially clears name-based checks. The check's biosecurity value is limited to catching the rare case where a customer happens to already be on a sanctions list.

### What it misses

The check has zero predictive power for novel threats — customers in developing countries with no sanctions program presence (~20-30% of global synthesis customers) get no signal. Transliteration misses are a structural problem: different lists use different romanization standards for Cyrillic, Arabic, and Chinese names, and the customer's own transliteration may match none of them. If using only the five named direct feeds, actors designated on Japanese, South Korean, or Indian national lists would be missed — though using OpenSanctions as the backend largely mitigates this. The fundamental coverage limitation is the same as all list-based approaches: absence of a match tells you nothing about intent.

### What it costs

Via OpenSanctions API: EUR 0.10 per check, covering all lists in a single call. Via self-hosted direct feeds: $0 per check but 2-4 engineer-weeks of setup to build five parsers and a unified matcher. The false-positive burden is higher than OFAC-only screening because the union list is larger — more alias variants per sanctioned person means more name-space collisions. Customers from Iran, Russia, China, and DPRK face systematically higher false-positive rates, creating a de facto discriminatory screening burden that requires careful policy consideration.

### Operational realism

The reviewer workflow is jurisdiction-aware: upon a hit, the reviewer must determine which list is binding based on shipment destination and provider domicile. A hit on any binding list is sufficient grounds to refuse service. Cross-jurisdictional reporting varies (OFSI in the UK, national competent authority in the EU, DFAT/AUSTRAC in Australia). The reviewer disambiguates using DOB, nationality, and address, then records the disposition with list version snapshots and matched entity details. API outages trigger fallback to the most recent bulk snapshot. For high-stakes hits, the reviewer should cross-check the primary list URL because OpenSanctions normalization may collapse or split entities differently than the source feed.

### Open questions

The key open question is whether this check should be implemented as a separate idea or merged with m01-ofac-sdn into a single "comprehensive sanctions screening" implementation, since OpenSanctions already bundles OFAC with all five international lists. Additionally, whether the marginal value of non-US sanctions screening justifies the additional false-positive burden depends on the provider's international shipment volume. For a US-only provider, this check is largely redundant with OFAC screening.

## Section 3: Open issues for human review

- **Zero attacker-story engagement:** Stage 5 found no modeled attacker stories engage this measure. The check's value is legal compliance for international shipments, not adversarial biosecurity detection. Whether to include it in a biosecurity screening regime (vs. treating it purely as a compliance obligation) is a policy decision.
- **Potential merge with m01-ofac-sdn:** If implemented via OpenSanctions, this check and OFAC screening share the same backend. A decision is needed on whether to treat them as one implementation or keep them separate for audit/reporting purposes.
- **Country-of-origin bias in false positives:** Customers from Iran, Russia, China, and DPRK face systematically higher false-positive rates. This raises equity concerns that require policy input.
- **[vendor-gated] OpenSanctions commercial license pricing:** Required for any commercial deployment of the API or bulk data; pricing requires sales contact.
- **Transliteration coverage adequacy:** Whether FtM normalization adequately handles cross-script matching for biosecurity-relevant names (particularly Chinese and Arabic) is an empirical question not resolved by desk research.
