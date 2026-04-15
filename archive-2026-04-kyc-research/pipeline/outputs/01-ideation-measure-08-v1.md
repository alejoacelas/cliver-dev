# Stage 1 — Ideation — measure 08 institution-denied-parties — v1

**Note on relevance:** the mapping file `attackers/by-measure/measure-08-institution-denied-parties.md` lists zero relevant wg attacker stories. All wg branches by construction operate from clean (non-listed) host institutions. Per run instructions, ideation here is run in **direct mode only**, and "relevance" is interpreted as "would plausibly catch a customer claiming affiliation with a listed institution" (e.g., a hypothetical Iranian / DPRK / PLA-affiliated research institute, an Entity-Listed Chinese university, a sanctioned Russian state lab). Stage 2 should note this gate limitation.

Mode tag on every idea below: **Direct**.

---

## 1. BIS Entity List screen (US Commerce / EAR Supplement No. 4 to Part 744)

- **summary:** Screen the customer's stated institution name (and any parent / aliases) against the US Bureau of Industry and Security Entity List, the canonical US export-control denied-parties list of foreign entities (universities, research institutes, state-owned labs, front companies) subject to license requirements. The list explicitly enumerates Chinese universities tied to PLA "Seven Sons of National Defence," Iranian universities, Russian research institutes, etc. — exactly the institutional class measure 08 targets. Match on normalized name + country + any listed aliases; throw a hard flag on any hit.
- **attacker_stories_addressed:** none in mapping file (see note above); covers the hypothetical "customer claims affiliation with Entity-Listed institute" pattern.
- **external_dependencies:** BIS Entity List (published in the Federal Register and as part of the Consolidated Screening List via trade.gov); periodic re-pull (≥ weekly).
- **manual_review_handoff:** any name-match (exact or fuzzy above threshold) → compliance reviewer who confirms the match against the listed entity's address / aliases / country and, on confirmation, denies the order and files an internal export-control record. Playbook: (1) confirm country, (2) compare addresses, (3) check listed aliases, (4) deny + log + escalate to export-control officer.
- **flags_thrown:** exact name match → deny pending review; high fuzzy score (>0.9) → manual review; country + partial-token match → manual review.
- **failure_modes_requiring_review:** transliteration ambiguity (Cyrillic / Farsi / Chinese), institutional rename, parent-vs-subsidiary scoping, federal-register update lag.
- **record_left:** screening hit log with list version, query string, match score, reviewer decision, timestamp.
- Other fields: # stage 4 / # stage 6.

---

## 2. OFAC SDN + non-SDN consolidated screening (Treasury / OFAC SDN List)

- **summary:** Screen institution name against the OFAC Specially Designated Nationals (SDN) list and OFAC's other consolidated lists (SSI, FSE, NS-PLC, etc.) published by the US Treasury Office of Foreign Assets Control. SDN includes sanctioned state-owned research bodies (e.g., Russian defense research institutes after 2022 designations). Match logic: name + aliases + addresses, with country filter to reduce false positives.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** OFAC SDN list (XML / CSV / SDN.XML feeds from sanctionssearch.ofac.treas.gov); pull on OFAC's recent-actions cadence.
- **manual_review_handoff:** hit → compliance officer reviews against full SDN entry (DOB / address / programs); confirmed match → deny + OFAC voluntary self-disclosure assessment.
- **flags_thrown:** exact / strong fuzzy match on entity name → deny; address-only match → review.
- **failure_modes_requiring_review:** common-name collisions (e.g., "Institute of Physics"), de-listing lag, alias gaps.
- **record_left:** OFAC screening log (per-order) retained ≥ 5 years for export audits.

---

## 3. Consolidated Screening List (CSL) via trade.gov API

- **summary:** Use the US Government's Consolidated Screening List API (search.trade.gov/v2/consolidated_screening_list/search), which merges nine US lists from BIS (Entity List, Denied Persons, Unverified List, MEU List), DDTC (Debarred), and OFAC (SDN, FSE, ISN, NS-PLC, SSI). Single API call per institution name returns hits across all nine. This is the closest thing to a free, official "one-shot" denied-parties screen for institutions and is plausibly the default for a small DNA-synthesis provider without budget for a paid sanctions vendor.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** trade.gov CSL API (free, requires registration for higher rate limits); falls back to bulk download.
- **manual_review_handoff:** any hit → compliance reviewer pulls the underlying list entry (CSL response includes `source` and `source_list_url`); confirms; denies.
- **flags_thrown:** any non-empty hits array → review; score ≥ threshold → auto-deny pending review.
- **failure_modes_requiring_review:** API outage (gov shutdown), fuzzy-match coverage limits, refresh lag relative to underlying source lists.
- **record_left:** API request + raw JSON response stored per order.

---

## 4. EU Consolidated Financial Sanctions List (FSF / CFSP) XML feed

- **summary:** Screen institution against the EU's consolidated list of persons, groups, and entities subject to EU financial sanctions, published by the European Commission's Financial Sanctions Database as a daily-refreshed XML file. Captures EU-designated Russian, Belarusian, Iranian, Syrian, DPRK research and defense entities not always present on US lists. Important for any provider with EU customers or operations.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** EU FSF XML feed (webgate.ec.europa.eu/fsd/fsf); requires EU login token for direct download or use of mirror.
- **manual_review_handoff:** hit → compliance reviews the entry's "regulation" field for the underlying CFSP decision; deny + log.
- **flags_thrown:** exact match → deny; alias / partial → review.
- **failure_modes_requiring_review:** XML schema changes, name transliteration, EU-only listings unfamiliar to US compliance.
- **record_left:** screening log with EU regulation reference.

---

## 5. UN Security Council Consolidated Sanctions List (1267 / 1988 / etc.)

- **summary:** Screen against the UN Security Council Consolidated Sanctions List, the canonical UN-level denied-parties list (covers 1267 ISIL/Al-Qaida, 1988 Taliban, 1718 DPRK, 2231 Iran, plus country-specific regimes). Measure 08 explicitly names "national or UN" lists, so this is a compliance must-have rather than optional. Published as XML and HTML on un.org/securitycouncil/sanctions/un-sc-consolidated-list.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** UN consolidated list XML (free, public); refresh on UN designation cadence.
- **manual_review_handoff:** hit → compliance reviewer; UN listings are typically dispositive → deny.
- **flags_thrown:** any name / alias hit → deny pending review.
- **failure_modes_requiring_review:** romanization variants for Arabic / Korean entity names, listings primarily for individuals (rare for institutions), data freshness.
- **record_left:** UN list version + entry reference number per hit, retained for audit.

---

## 6. UK OFSI Consolidated List (HM Treasury sanctions list)

- **summary:** Screen against the UK Office of Financial Sanctions Implementation (OFSI) Consolidated List, the post-Brexit UK denied-parties list (gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets). UK list increasingly diverges from EU; covers UK-only Russian and Belarusian designations and a growing set of research / defence entities. Necessary for providers shipping into / out of the UK.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** OFSI consolidated list (CSV / XML, free, daily refresh).
- **manual_review_handoff:** hit → compliance reviews the OFSI entry's regime; deny.
- **flags_thrown:** match → deny; alias / partial → review.
- **failure_modes_requiring_review:** UK / EU divergence, naming standards differ from US lists.
- **record_left:** OFSI list version per match.

---

## 7. Refinitiv (LSEG) World-Check One screening

- **summary:** Use Refinitiv (now LSEG) World-Check One, the largest commercial PEP / sanctions / adverse-media screening database, to screen institution names. World-Check aggregates ~all national sanctions lists, regulatory enforcement actions, and curated adverse-media records, including entries for institutions and state-owned research bodies. Standard at large compliance shops; provides an API + batch screening.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** Refinitiv World-Check One subscription + API credentials; vendor contract.
- **manual_review_handoff:** hit → compliance reviewer in vendor portal; reviewer adjudicates "true match / false / discounted" with documented rationale; true match on a sanctions category → deny.
- **flags_thrown:** sanctions category hit → deny; PEP / adverse-media hit on institution → review (not necessarily deny).
- **failure_modes_requiring_review:** vendor false positives (common-name collisions), API auth errors, list-coverage gaps for non-Western entities.
- **record_left:** vendor case ID + reviewer disposition retained per order.

---

## 8. Dow Jones Risk & Compliance (RiskCenter) institutional screening

- **summary:** Use Dow Jones Risk & Compliance (formerly Factiva sanctions / RiskCenter), the second-largest commercial sanctions + PEP database. Includes denied-parties lists and proprietary research on state-owned entities, military-linked universities, and front companies, with curated identifiers and aliases that reduce common-name false positives compared to raw government feeds. Differentiates from World-Check via different curation methodology and adverse-media coverage.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** Dow Jones R&C subscription + API.
- **manual_review_handoff:** identical to Refinitiv playbook; hit + sanctions category → deny.
- **flags_thrown:** sanctions match → deny; "state-owned enterprise" / "military end-user" classification → review.
- **failure_modes_requiring_review:** vendor lag relative to source lists, scoring opacity, false positives.
- **record_left:** vendor case ID per screening.

---

## 9. LexisNexis Bridger Insight XG screening

- **summary:** Use LexisNexis Bridger Insight XG, a third major commercial sanctions / watchlist screening engine. Bridger aggregates global sanctions and law-enforcement lists with a tunable matching engine; widely used in mid-market US compliance, including by life-sciences companies. Differentiates by built-in fuzzy-match tuning and audit-grade logging that satisfies BIS / OFAC examiner expectations.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** LexisNexis Bridger subscription, batch + API integration.
- **manual_review_handoff:** Bridger flags routed to compliance reviewer in Bridger workflow UI; reviewer dispositions and audit log retained.
- **flags_thrown:** sanctions hit on institution → deny; high-risk-jurisdiction match → review.
- **failure_modes_requiring_review:** vendor list-update SLA, false positives, integration failures.
- **record_left:** Bridger case + audit trail.

---

## 10. Sayari Graph (entity-network screening for state-owned and front-org structures)

- **summary:** Use Sayari Graph, a commercial entity-resolution and corporate-network database that goes beyond list screening by mapping institutional ownership, parentage, and beneficial-ownership chains. Useful for catching cases where the *literal* customer institution is not on a denied-parties list but is owned, controlled, or operated by a listed entity (a common Entity-List evasion pattern: a Chinese university creates a clean-name research center that is in fact a subsidiary of a listed parent). Sayari ingests the major sanctions lists and flags entities within N hops of a listed node.
- **attacker_stories_addressed:** none in mapping file; addresses the "listed parent, clean-name child" evasion pattern that a future attacker branch could use.
- **external_dependencies:** Sayari Graph subscription + API.
- **manual_review_handoff:** any "within 1 hop of listed entity" hit → compliance reviewer assesses ownership / control link; depending on jurisdiction (OFAC 50% rule, BIS Entity List affiliate guidance) → deny.
- **flags_thrown:** direct list hit → deny; 1-hop ownership link to listed entity → review under OFAC 50% rule; n-hop link → log only.
- **failure_modes_requiring_review:** opaque ownership in jurisdictions with weak corporate-registry transparency (China, Russia, Iran), graph-staleness, false ownership inferences.
- **record_left:** Sayari case export with the ownership graph at time of screening.

---

## 11. SECO (Switzerland) sanctions list — supplemental national list

- **summary:** Screen against the Swiss State Secretariat for Economic Affairs (SECO) sanctions list, a national list closely tracking but not identical to EU sanctions. Useful as a supplemental check for European-shipping providers and catches a small set of Swiss-only designations. `[best guess]` on whether the marginal coverage is worth the integration cost — flagged for stage 2.
- **attacker_stories_addressed:** none.
- **external_dependencies:** SECO list (sesam.search.admin.ch), free.
- **manual_review_handoff:** hit → compliance review (likely cross-check against EU and US for redundancy).
- **flags_thrown:** match → review.
- **failure_modes_requiring_review:** limited stand-alone value vs CSL + EU.
- **record_left:** screening log entry.

---

## 12. Internal denied-institution allow/deny list maintained by the provider (SOP)

- **summary:** Maintain an internal, provider-curated list of institutions that have been previously denied for sanctions reasons, plus institutions flagged in trade-press or NGO research as fronts for listed entities (e.g., Australian Strategic Policy Institute's "China Defence Universities Tracker," C4ADS reports on DPRK procurement networks). On every order, screen against this internal list before falling through to government / vendor lists. SOP rather than a single data source. Provides institutional memory across orders and lets the provider encode reviewer judgment.
- **attacker_stories_addressed:** none in mapping file; addresses the recurrence pattern (same listed institution attempting under different name framings over time).
- **external_dependencies:** internal database, ASPI China Defence Universities Tracker (free), C4ADS reports (free PDFs), reviewer SOP.
- **manual_review_handoff:** match → straight to senior compliance reviewer (because the entry exists only because a prior reviewer added it); reviewer reconfirms current applicability and denies.
- **flags_thrown:** match → deny; "tracker tier 'Very High Risk'" → review.
- **failure_modes_requiring_review:** stale internal entries, ASPI scoring methodology disputes.
- **record_left:** internal-list version + reviewer who added the entry + reason.

---

## Dropped

(none — first iteration)
