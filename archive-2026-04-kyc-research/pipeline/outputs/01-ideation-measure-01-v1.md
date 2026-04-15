# Measure 01 — sanctions-name-screen — Ideation v1

**Measure recap:** Screen the customer's full name against applicable lists of designated persons (UN + national sanctions lists). All orders. Auditable. Follow-up: direct contact re: name collision.

**Note on attacker stories:** The mapping file `attackers/by-measure/measure-01-sanctions-name-screen.md` records **zero** relevant wg attacker stories — every wg branch models attackers whose real legal names trivially clear sanctions screening by construction. As instructed for this run, ideas are generated in **direct mode only**, and "relevance" is interpreted as "would plausibly catch the kind of listed-person actor the measure targets" (e.g., a designated proliferation procurement agent attempting to order under their own legal name, or a name matching a UN 1718 / 1737 / OFAC SDN entry). This is a known limitation: the wg attacker corpus does not contain a sanctions-listed adversary, so stage 5 bypass-aware hardening will have nothing to attack against and stage 8 should note that this measure is exercised by a counterfactual adversary class outside the wg story set.

---

## Idea 1 — OFAC SDN List direct ingestion (Treasury consolidated SDN.XML)

- **name:** OFAC Specially Designated Nationals (SDN) List — direct download from US Treasury OFAC
- **summary:** Download the SDN list (and the OFAC Consolidated Sanctions List, which bundles SDN + Sectoral + FSE + NS-PLC + 13599 + others) from `sanctionssearch.ofac.treas.gov` / `home.treasury.gov/policy-issues/financial-sanctions/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists`. Refresh nightly. On each new order, normalize the customer's full name (strip diacritics, transliterate, lowercase, split given/surname) and run an exact + fuzzy match (Jaro-Winkler ≥ 0.92, plus token-set ratio) against `sdn_name` and all `aka` aliases. Free. Government primary source — no vendor risk.
- **attacker_stories_addressed:** none in mapping file (see note above). Targets: designated proliferation actors, NK/Iran/Syria WMD-program-linked individuals on SDN, EO 13382 designations (WMD proliferators), Russia/Belarus designated scientists.
- **external_dependencies:** US Treasury OFAC SDN.XML / SDN.CSV feed (free, public). No auth. Internal name-normalization library (e.g., `unidecode` + `recordlinkage` + `jellyfish` for Jaro-Winkler).
- **manual_review_handoff:** Any fuzzy hit ≥ threshold goes to a compliance reviewer with the customer's full submitted identity, the matched SDN entry (full record incl. DOB, nationality, program, AKAs), and the score. Reviewer playbook: (1) compare DOB / nationality / place of birth if customer collected them; (2) if any of those match → escalate, freeze order, file blocking report per 31 CFR 501.603 within 10 business days; (3) if clear mismatch on DOB/POB/nationality → log as false positive with reasoning, release order; (4) if ambiguous → direct customer contact requesting government ID per the measure's "Direct follow-up re: name collision" instruction.
- **flags_thrown:**
  - Exact name match → freeze + immediate compliance review.
  - Fuzzy match ≥ 0.95 → freeze + review within 1 business day.
  - Fuzzy match 0.92–0.95 → soft hold + review within 3 business days.
  - Match on AKA only → review with note that primary name differs.
- **failure_modes_requiring_review:** OFAC feed download failure (fail closed: don't process orders until last-known-good feed is < 25 hours old, then escalate ops); Unicode normalization edge cases (CJK names, Arabic transliteration variants); customers using only initials.
- **record_left:** Per-order JSON record: feed version date, normalized customer name, all candidate matches with scores, reviewer ID, decision, timestamp. Retained ≥ 5 years to satisfy OFAC recordkeeping (31 CFR 501.601).
- Other fields: # stage 4 / # stage 6

---

## Idea 2 — UN Security Council Consolidated Sanctions List

- **name:** UN Security Council Consolidated Sanctions List (XML feed)
- **summary:** The UN publishes a single Consolidated List covering all active UN sanctions regimes (1267/1989/2253 ISIL & Al-Qaida, 1718 DPRK, 1737/2231 Iran legacy, 1591 Sudan, 1572 Côte d'Ivoire, etc.) at `scsanctions.un.org/resources/xml/en/consolidated.xml`. Download daily, parse `INDIVIDUAL` entries, run name + alias match against customer full name with same normalization pipeline as Idea 1. Free, primary source. Specifically catches the WMD-procurement actors most relevant to a synthesis provider (DPRK 1718, legacy Iran 1737 individuals).
- **attacker_stories_addressed:** none in mapping file. Targets: 1718 DPRK procurement agents, ISIL/AQ-linked individuals attempting bio procurement.
- **external_dependencies:** UN SC Consolidated List XML feed. No auth. Same internal normalization stack.
- **manual_review_handoff:** Same playbook as Idea 1, but reviewer escalation path differs: matches on UN list trigger UN-member-state reporting obligations (varies by jurisdiction; in US delegates back to OFAC pathway). Reviewer pulls the UN narrative summary for the listed individual (linked from each entry) and compares biographical data.
- **flags_thrown:** Same threshold structure as Idea 1.
- **failure_modes_requiring_review:** UN feed downtime (less reliable than OFAC; cache last-known-good with same 25-hour fail-closed rule); transliteration ambiguity for Arabic / Korean / Persian names is materially worse on the UN list than SDN — review threshold should be lower for non-Latin-script source names.
- **record_left:** Same as Idea 1; retain feed version date.
- Other fields: # stage 4 / # stage 6

---

## Idea 3 — EU Consolidated Financial Sanctions List (CFSP)

- **name:** EU Consolidated Financial Sanctions List (FSF / CFSP XML feed)
- **summary:** The EU's Financial Sanctions Files (`webgate.ec.europa.eu/fsd/fsf`) publish a consolidated XML of every individual and entity designated under EU Council CFSP regulations (currently ~50 active regimes incl. Russia, Belarus, Iran, DPRK, Syria, chemical-weapons regime under Reg 2018/1542). Required for any provider with EU presence or EU-located customers. Download daily, parse, name-match. Free with registration for the FSF auto-download endpoint.
- **attacker_stories_addressed:** none in mapping file. Targets: designated individuals under EU chemical-weapons regime, EU Russia-sanctions-listed scientists, EU DPRK proliferation designations that may not appear on SDN.
- **external_dependencies:** EU FSF account (free, registration required); FSF token-authenticated XML download.
- **manual_review_handoff:** Reviewer playbook as Idea 1; jurisdictional escalation routes through the provider's EU compliance counsel rather than OFAC. EU designations carry asset-freeze obligations under EU Council Regulations directly applicable to EU member-state entities.
- **flags_thrown:** Same threshold structure.
- **failure_modes_requiring_review:** FSF token rotation; occasional schema changes in the FSF XML between regime updates.
- **record_left:** Same as Idea 1.
- Other fields: # stage 4 / # stage 6

---

## Idea 4 — UK OFSI Consolidated List of Financial Sanctions Targets

- **name:** UK HM Treasury OFSI Consolidated List
- **summary:** Office of Financial Sanctions Implementation publishes the UK Consolidated List of Financial Sanctions Targets at `gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets`. Available in CSV, XML, and ODS. Required for UK-nexus providers post-Brexit (the EU and UK lists diverge; UK adds its own designations under SAMLA 2018, e.g., the UK Russia regs). Daily download, normalize, match. Free.
- **attacker_stories_addressed:** none in mapping file. Targets: UK-only designations (e.g., individuals listed under UK Russia, Belarus, Myanmar, Global Human Rights, or Chemical Weapons regs that are not on SDN or EU lists).
- **external_dependencies:** OFSI consolidated list endpoint. No auth.
- **manual_review_handoff:** Same as Idea 1; UK reporting goes to OFSI within the standard reporting timelines under the relevant SI.
- **flags_thrown:** Same threshold structure.
- **failure_modes_requiring_review:** OFSI publishes both "designated" and "transitional" entries; distinguish at parse time.
- **record_left:** Same as Idea 1.
- Other fields: # stage 4 / # stage 6

---

## Idea 5 — Refinitiv World-Check One (commercial aggregator)

- **name:** LSEG / Refinitiv World-Check One
- **summary:** Commercial sanctions + PEP + adverse-media database covering all major government lists plus enforcement actions, regulatory enforcement, and media-sourced derogatory profiles. API-based name screening with built-in name-matching algorithms tuned for transliteration variants. Used by most large financial institutions; appropriate for synthesis providers that want one-stop coverage instead of stitching SDN + UN + EU + UK + ~30 national lists themselves. Returns hit list with score, biographical fields (DOB, nationality, gender), categories (sanctions/PEP/RCA/SOE/adverse-media), and source-document references.
- **attacker_stories_addressed:** none in mapping file. Targets: same as Ideas 1–4 plus listed individuals on national lists not covered by the four primary sources (e.g., Australia DFAT, Japan METI, Singapore MAS, India MHA, Swiss SECO).
- **external_dependencies:** LSEG/Refinitiv contract (vendor-gated pricing # stage 4); World-Check One REST API.
- **manual_review_handoff:** World-Check returns its own match-confidence; reviewer accepts API-flagged hits, opens the World-Check profile (which includes source citations from the original list), compares biographical fields with the customer record, and follows the same escalation playbook as Idea 1. Adverse-media-only hits without sanctions designation should be deprioritized for this measure (this measure is sanctions, not PEP/AM — those belong to other measures or none).
- **flags_thrown:** Any hit in `sanctions` category; AKA-only hit; secondary-id (DOB) match.
- **failure_modes_requiring_review:** API rate limit / outage (fail closed); transliteration false-positive storms on common Arabic/Chinese names (need name-scoring threshold tuned per ethnicity-of-script).
- **record_left:** API response JSON archived per order, including World-Check version, match payload, reviewer decision.
- Other fields: # stage 4 / # stage 6

---

## Idea 6 — Dow Jones Risk & Compliance (Factiva) sanctions feed

- **name:** Dow Jones Risk & Compliance Sanctions list
- **summary:** Alternative to World-Check; same functional category (consolidated sanctions + PEP feed with name-matching API). Worth listing as an independent option because the two vendors have meaningfully different match-tuning, list-coverage edge cases, and pricing models — providers often pilot both before committing. Same screening flow as Idea 5.
- **attacker_stories_addressed:** none in mapping file.
- **external_dependencies:** Dow Jones contract (vendor-gated pricing # stage 4); R&C API.
- **manual_review_handoff:** Same as Idea 5.
- **flags_thrown:** Same as Idea 5.
- **failure_modes_requiring_review:** Same as Idea 5.
- **record_left:** Same as Idea 5.
- Other fields: # stage 4 / # stage 6

---

## Idea 7 — OpenSanctions.org open-data aggregator

- **name:** OpenSanctions Default dataset (open-source consolidated list)
- **summary:** OpenSanctions (`opensanctions.org`) aggregates ~250 source lists (every major sanctions list plus PEPs and crime data) into a single normalized FollowTheMoney-schema dataset, refreshed daily. Available as CSV/JSON/Parquet bulk download under CC-BY 4.0, or via a hosted matching API (`api.opensanctions.org`). Open-data alternative for providers that can't afford World-Check / Dow Jones but want broader-than-OFAC coverage. The matching API uses `nomenklatura` for fuzzy name matching and exposes per-feature scores.
- **attacker_stories_addressed:** none in mapping file. Targets: same listed-person class as Ideas 1–6.
- **external_dependencies:** OpenSanctions bulk dataset (free, CC-BY) OR hosted matching API (paid tier for production # stage 4).
- **manual_review_handoff:** Same playbook as Idea 1; OpenSanctions match payload includes source-list provenance, so reviewer can trace each hit to its primary source (SDN, UN, EU, etc.) before deciding whether the hit triggers a reporting obligation in the provider's jurisdiction.
- **flags_thrown:** Configurable score thresholds via the matching API; same tier structure as Idea 1.
- **failure_modes_requiring_review:** Some source lists in OpenSanctions lag the primary by hours-to-days; for primary-jurisdiction lists, providers should still ingest those directly (Idea 1/2/3/4) and use OpenSanctions for breadth.
- **record_left:** Same as Idea 1; archive the OpenSanctions dataset version hash per check.
- Other fields: # stage 4 / # stage 6

---

## Idea 8 — Trade Compliance vendor: Descartes Visual Compliance / OCR Global Trade

- **name:** Descartes Visual Compliance (formerly Visual Compliance / eCustoms)
- **summary:** Specialty trade-compliance vendor focused on US export-control + sanctions screening. Heavily used by exporters and (per the wg foreign-institution branch quote) by at least one DNA synthesis provider context. Single-vendor screening across SDN, BIS Entity List, DDTC Debarred, plus international sanctions lists, with workflow tooling for hold/release queues integrated to ERP/order systems. Lists this measure surfaces are a subset of what the vendor covers (also covers measure 06 / 08 territory, but here we use only the sanctions-name-screening function).
- **attacker_stories_addressed:** none in mapping file (note: the wg `foreign-institution` / `visiting-researcher` branches reference Visual Compliance specifically as the screening tool that *would* be a hard stop *only* for sanctioned-jurisdiction attackers — confirming the wg corpus does not model a listed individual).
- **external_dependencies:** Descartes contract (vendor-gated # stage 4); REST API or batch screening UI.
- **manual_review_handoff:** Vendor provides a built-in case-management UI; reviewer uses Descartes' workflow rather than a custom queue, but the substantive playbook (compare DOB/POB/nationality, decide release/freeze/report) is identical to Idea 1.
- **flags_thrown:** Same threshold structure.
- **failure_modes_requiring_review:** Same as Idea 5.
- **record_left:** Descartes' built-in audit log + per-order JSON export.
- Other fields: # stage 4 / # stage 6

---

## Idea 9 — Order-time secondary identifier check (DOB/POB/nationality) to suppress false positives

- **name:** Secondary-identifier name-collision SOP
- **summary:** Pure-SOP idea (no new data source). When any name match fires from Ideas 1–8, the SOP requires the reviewer to compare at least one secondary biographical identifier (DOB, place of birth, or nationality) before either releasing or escalating. If the customer record lacks the relevant identifier (e.g., the order form never collected DOB), the SOP requires direct customer outreach requesting a government ID per the measure's "Direct follow-up re: name collision" instruction, and freezes the order until response. Without this SOP, fuzzy matching against common names (Mohammed, Wang, Kim) is unworkable; with it, the false-positive review burden is bounded.
- **attacker_stories_addressed:** none directly. Defensive: prevents the measure from being either (a) so loose it ignores real hits or (b) so strict it auto-denies common names.
- **external_dependencies:** Internal order-form must collect at least DOB OR a government-ID upload; reviewer training; documented playbook.
- **manual_review_handoff:** This idea *is* the playbook. Decision tree: secondary ID matches sanctions entry → freeze + report; secondary ID clearly mismatches → release with logged reasoning; secondary ID missing or ambiguous → request government ID, freeze pending response, deny if no response in N business days.
- **flags_thrown:** Inherits flags from upstream list-match ideas; this idea is the human-side response layer.
- **failure_modes_requiring_review:** Customer refuses to provide DOB/ID → escalate to compliance lead for deny/proceed decision (default deny).
- **record_left:** Reviewer decision log including which secondary identifier was checked and the outcome. Required for OFAC's recordkeeping defense if the customer is later determined to be sanctioned.
- Other fields: # stage 4 / # stage 6

---

## Idea 10 — Continuous re-screening of stored customer records (delta-screening on list updates)

- **name:** Daily delta re-screening against new SDN/UN/EU/UK additions
- **summary:** OFAC, UN, EU, and UK each publish a daily diff (or the provider can compute one against yesterday's snapshot). On each update, re-screen the entire stored customer base — not just incoming orders — against newly added designations. Catches the case where a customer was clear at order time but is later designated; an order in-flight (production / shipping / queued) gets flagged before fulfillment. OFAC explicitly expects this: their FAQ on "Section 50 Year Rule" and the general SDN guidance treats a customer becoming designated mid-relationship as a triggering event.
- **attacker_stories_addressed:** none in mapping file. Targets: customer who became designated between onboarding and order; standing accounts.
- **external_dependencies:** Same feeds as Ideas 1–4; internal customer database with normalized stored names.
- **manual_review_handoff:** Same per-hit playbook as Idea 1; additional escalation: if the customer has open orders or recent shipments, compliance must coordinate with operations to halt in-flight orders and, depending on jurisdiction, may need to file blocking reports on assets the provider holds (e.g., prepaid balance, stored materials).
- **flags_thrown:** New-designation match against existing customer → immediate freeze of all open orders + same review tiers as Idea 1.
- **failure_modes_requiring_review:** Stored customer name normalization drift across years (re-normalize stored records when matcher version changes); name changes (marriage etc.) — re-screen on customer profile updates.
- **record_left:** Per-day delta-screening log: feed version, customers re-screened, hits, decisions. Demonstrates ongoing-due-diligence posture for examiners.
- Other fields: # stage 4 / # stage 6

---

## Coverage notes

- All 10 ideas target the "listed individual ordering under their real name" actor — the only attacker class this measure can plausibly catch. None of the wg branches model that actor; this is documented in the mapping file and is **not** a gap that further ideation can close. It is a gap in the wg attacker corpus.
- Ideas 1–4 are primary-source government feeds. Ideas 5–8 are vendor aggregators. Idea 7 is the open-data middle ground. Ideas 9–10 are the SOP layer that makes any of 1–8 operationally workable.
- A reasonable production stack would combine: (a) one primary-source feed for the home jurisdiction (Idea 1 for US, Idea 3 for EU, Idea 4 for UK) for legal compliance; (b) one aggregator (Idea 5, 6, 7, or 8) for breadth; (c) Idea 9 SOP for review discipline; (d) Idea 10 for continuous coverage. Stage 8 should consider this bundle.
