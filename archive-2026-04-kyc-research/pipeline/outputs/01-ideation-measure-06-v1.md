# Stage 1 — Ideation: measure 06 (shipping-export-country) — v1

Measure: screen shipping address country against broad export-restriction / comprehensive-sanctions regimes. Follow-up: Deny.

Only attacker story mapped: `foreign-institution` (ships to a non-comprehensively-sanctioned host like BR/JP/IN/ID/VN/CIS, then re-exports via in-country freight forwarder or customs broker). The measure as written only catches a destination on a country-level list; the bypass is structured around picking host countries that *aren't* on those lists. So ideas split into (a) the literal country-list check and (b) augmentations that catch the re-export structure.

---

## 1. OFAC comprehensively-sanctioned country list (Treasury sanctions programs page)

- **Mode:** Direct
- **Summary:** Maintain a hard-coded list of US-comprehensive-embargo jurisdictions (Cuba, Iran, North Korea, Syria, Crimea / so-called DNR/LNR / Kherson / Zaporizhzhia regions of Ukraine). Resolve the ISO-3166-1 alpha-2 country code of the shipping address (and, where relevant, ISO-3166-2 subdivision for occupied Ukrainian oblasts) and deny if it matches. Source of truth: OFAC "Sanctions Programs and Country Information" page on treasury.gov, refreshed quarterly by compliance.
- **attacker_stories_addressed:** `foreign-institution` (only if attacker picks a comprehensive-embargo host, which the mapped variant explicitly avoids — coverage is therefore weak against this exact branch but is the canonical control)
- **external_dependencies:** OFAC website (manual refresh) or Treasury's `sanctions_programs.xml` feed; an internal address-to-ISO-country normalizer (e.g., libpostal + Google Geocoding API or Smarty International).
- **manual_review_handoff:** None — verdict is Deny per measure follow-up. Compliance gets a notification with the order ID and resolved ISO code.
- **flags_thrown:** `country_comprehensive_embargo` → automatic deny + SAR-style internal log.
- **failure_modes_requiring_review:** Address fails to geocode to a country; subdivision-level ambiguity (Crimea vs mainland Ukraine); disputed territory naming.
- **record_left:** Order record annotated with resolved ISO-3166-1/2 code, list version hash, decision timestamp.
- Other fields: # stage 4

## 2. BIS Country Group E (Country Chart, EAR Part 740 Supp. 1)

- **Mode:** Direct
- **Summary:** Apply the Bureau of Industry and Security's Country Group E:1 (terrorist-supporting: Iran, Syria, North Korea, Cuba) and E:2 (unilateral embargo) as the "broad export restrictions" trigger. This is the canonical US export-control country bucket and is broader than OFAC comprehensive sanctions in some edge cases. Pulled from the EAR Part 740 Supplement No. 1 country chart.
- **attacker_stories_addressed:** `foreign-institution` (same caveat — covers the destination-on-list case only)
- **external_dependencies:** BIS EAR country chart (PDF/HTML on bis.doc.gov); internal parser; ISO normalizer.
- **manual_review_handoff:** Deny; compliance log.
- **flags_thrown:** `bis_country_group_e` → deny.
- **failure_modes_requiring_review:** Country chart updates lag the Federal Register; subdivision-level rules for occupied Ukraine require manual interpretation.
- **record_left:** Resolved ISO + group cell + chart version, frozen at decision time.

## 3. EU consolidated financial sanctions list — territory scope filter

- **Mode:** Direct
- **Summary:** Use the EU FSF (Financial Sanctions Files) consolidated list, filtered to country-scope/territorial-restriction entries (Russia/Belarus dual-use under Reg. 833/2014 and 765/2006; Iran under 267/2012; Syria under 36/2012; DPRK under 2017/1509; Crimea/Sevastopol under 692/2014; non-government-controlled Ukrainian areas under 2022/263). Use the FISMA-published XML feed (`https://webgate.ec.europa.eu/fsd/fsf`) which is updated daily. For an EU-domiciled provider, this is the authoritative country-restriction source.
- **attacker_stories_addressed:** `foreign-institution`
- **external_dependencies:** EU FSF XML feed; OAuth credential from EC FISMA; ISO normalizer.
- **manual_review_handoff:** Deny; compliance reviews EU-specific subdivision questions (e.g., shipping to Belarus for "humanitarian" exemption).
- **flags_thrown:** `eu_territorial_restriction` → deny.
- **failure_modes_requiring_review:** XML schema changes; humanitarian-exemption claims by customer.
- **record_left:** Feed pull date, list version, matched regulation citation.

## 4. UK OFSI consolidated list — geographic regime check

- **Mode:** Direct
- **Summary:** UK-domiciled providers (or providers shipping into the UK) screen against the OFSI consolidated list of financial sanctions targets, plus the UK regime-by-regime country pages (Russia, Belarus, Iran, Syria, DPRK, Crimea). OFSI publishes a JSON+CSV consolidated list daily at `https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets`. Country-regime pages give the territorial scope.
- **attacker_stories_addressed:** `foreign-institution`
- **external_dependencies:** OFSI consolidated list daily download.
- **manual_review_handoff:** Deny.
- **flags_thrown:** `ofsi_country_regime` → deny.
- **failure_modes_requiring_review:** Stale download; regime page updates not yet in the consolidated file.
- **record_left:** OFSI list version hash + matched regime.

## 5. UN Security Council Consolidated Sanctions List (country annexes)

- **Mode:** Direct
- **Summary:** Pull the UN Security Council Consolidated List (`https://scsanctions.un.org/resources/xml/en/consolidated.xml`) and use the regime annexes for territorial restrictions (DPRK 1718, Libya 1970, Somalia 751, etc.). For a multinational provider this is a floor that any jurisdiction will recognise.
- **attacker_stories_addressed:** `foreign-institution`
- **external_dependencies:** UN SC XML feed (no auth, free).
- **manual_review_handoff:** Deny.
- **flags_thrown:** `un_sc_country_regime` → deny.
- **failure_modes_requiring_review:** XML schema breakage; UN regimes are person/entity heavy and country annexes require interpretation.
- **record_left:** Feed pull date, list version, matched resolution number.

## 6. Address-to-ISO-3166 country normalization via libpostal + Google/Smarty geocoding

- **Mode:** Direct (enabling control for ideas 1–5)
- **Summary:** The country screen only works if the *resolved* ship-to country is reliable. Use libpostal for parse, then Google Maps Geocoding API or Smarty International Street API to resolve the address to a verified ISO-3166-1 alpha-2 country and ISO-3166-2 subdivision. Reject orders where the resolved country differs from the customer-typed country, or where the resolved subdivision is on a partial-territory list (Crimea, Sevastopol, occupied oblasts).
- **attacker_stories_addressed:** `foreign-institution` (catches typo'd or mis-declared country fields; supports subdivision-level Ukraine control)
- **external_dependencies:** libpostal (open-source); Google Geocoding API or Smarty International ($).
- **manual_review_handoff:** Mismatch between typed and resolved country → human review with both values surfaced.
- **flags_thrown:** `country_field_mismatch`, `restricted_subdivision`.
- **failure_modes_requiring_review:** Geocoder returns low-confidence; address in unsupported country.
- **record_left:** Raw input address, parsed components, resolved lat/long, ISO-3166-1/2.

## 7. Freight-forwarder address detection via Loqate / Melissa "freight forwarder" attribute

- **Mode:** Attacker-driven (`foreign-institution` Method 1 — in-country freight forwarder)
- **Summary:** The mapped bypass is "ship to a forwarder's commercial address in BR/IN/JP/etc., then re-export." Even if the destination country isn't on a list, the *address* being a known forwarder is the strongest available signal. Loqate and Melissa Data both expose a "freight forwarder" / "mail-drop" attribute on their address-verification responses (Loqate's `AdditionalAttributes.IsFreightForwarder`; Melissa's `MAK` plus `AddressType`). Cross-reference with a curated list of the top international freight forwarders (DB Schenker, Aramex, MyUS, Shipito, Borderlinx, Forward2Me, Stackry — `[best guess]` for BR/IN/VN-local equivalents). Flag → Deny per measure 06 follow-up since this is the *means* of routing into a restricted country.
- **attacker_stories_addressed:** `foreign-institution` (Method 1 — freight forwarder; Method 6 — customs broker if vendor flags those too)
- **external_dependencies:** Loqate or Melissa Global Address Verification; internal forwarder watchlist.
- **manual_review_handoff:** Compliance reviews any forwarder hit with destination + customer affiliation context. Standard playbook: deny unless customer demonstrates the forwarder is a contracted institutional logistics partner with documentation.
- **flags_thrown:** `freight_forwarder_destination` → manual review → likely deny.
- **failure_modes_requiring_review:** Vendor attribute missing or stale; legitimate institutional logistics consolidators flagged as forwarders.
- **record_left:** Vendor response JSON, forwarder name, watchlist version.

## 8. Customs-broker address detection via national broker registries

- **Mode:** Attacker-driven (`foreign-institution` Method 6)
- **Summary:** Method 6 of the foreign-institution branch routes through an "in-country customs broker." Brokers are licensed and listed: US CBP "Customs Broker License Information" CSV, Brazilian RFB "Despachante Aduaneiro" registry, India CBIC Customs Brokers Licensing Regulation registry, Japan JCBA member directory `[best guess]`, Vietnam GDC broker list `[best guess]`. Build a one-time scrape into a name+address lookup table; flag if ship-to address matches a registered broker premises.
- **attacker_stories_addressed:** `foreign-institution` (Method 6)
- **external_dependencies:** National customs-broker registries; periodic re-scrape.
- **manual_review_handoff:** Compliance: deny unless customer can document an institutional shipping contract with the broker.
- **flags_thrown:** `customs_broker_destination` → review → deny.
- **failure_modes_requiring_review:** Registries incomplete; broker operates from a residential address.
- **record_left:** Registry source, entry ID, scrape date.

## 9. HS / Schedule B classification check via USA Trade Census / WCO HS API

- **Mode:** Attacker-driven (`foreign-institution` re-export structuring)
- **Summary:** Synthetic DNA / synthetic genes ship under HS 2934.99 ("other nucleic acids and their salts") or Schedule B equivalents; some destinations require export licensing for items in Wassenaar dual-use category 1C353 (genetic elements / human pathogens). Classify the order's HS code automatically (the provider knows the SKU), then run a destination × HS-code license lookup against the BIS EAR Commerce Country Chart (Part 738 Supp. 1) and the EU dual-use Annex I (Reg 2021/821). If the destination requires a license for that HS / ECCN and no license is on file, deny.
- **attacker_stories_addressed:** `foreign-institution` (catches the variant where destination is *not* embargoed but still license-controlled — e.g., shipping a 1C353 to a Country Group D destination)
- **external_dependencies:** Internal SKU→HS/ECCN map; BIS Country Chart parser; EU Annex I parser; optional WCO HS API or USA Trade Online Schedule B lookup for verification.
- **manual_review_handoff:** Export-control officer reviews any "license required" hit; standard playbook is to refuse unless customer provides BIS license number + validates against BIS SNAP-R.
- **flags_thrown:** `eccn_license_required_destination` → export officer review → deny or escalate to BIS license check.
- **failure_modes_requiring_review:** Sequence not classifiable as 1C353 without sequence-screen output; ambiguous EAR99 vs 1C353 calls.
- **record_left:** SKU, HS code, ECCN, destination country chart cell, license number if any.

## 10. Re-export risk scoring via Kharon / Sayari / Refinitiv (LSEG) World-Check Trade

- **Mode:** Attacker-driven (`foreign-institution` Method 1, 6 — re-export structuring)
- **Summary:** Even when the immediate destination is allowed, vendors like Kharon ClearView, Sayari Graph, and LSEG (Refinitiv) World-Check One with the Trade Compliance module score the *onward re-export risk* of an address: corporate links between the consignee and parties on the BIS Entity List, BIS Unverified List, OFAC SDN, EU consolidated list; trade-flow patterns showing onward shipments to embargoed countries; UFLPA / Section 1260H linkages. Sayari Graph in particular exposes shipment-level bills-of-lading data that can flag a consignee whose past shipments re-export to Iran/Russia/etc. Use the score as a third gate after country list and forwarder check.
- **attacker_stories_addressed:** `foreign-institution` (Methods 1 & 6 — the re-export structure is what these vendors are built to detect)
- **external_dependencies:** Kharon ClearView API or Sayari Graph API or LSEG World-Check One Trade Compliance — vendor contract; an internal scoring threshold.
- **manual_review_handoff:** Compliance reviews any non-trivial score; playbook escalates to denial if the consignee has any documented onward shipments to a Country Group E destination in the last 24 months.
- **flags_thrown:** `reexport_risk_high`, `consignee_entity_list_link`, `consignee_unverified_list_link`.
- **failure_modes_requiring_review:** Vendor false positives (legitimate consolidators); thin coverage in non-OECD countries; vendor API downtime.
- **record_left:** Vendor query ID, score, matched entity link evidence, decision.

## 11. BIS Entity List + Unverified List + MEU List direct screen of consignee

- **Mode:** Attacker-driven (`foreign-institution`)
- **Summary:** Independent of the country check, screen the consignee name and address against the BIS Entity List, Unverified List, Military End User (MEU) List, and Denied Persons List. These are the country-tied lists that most directly catch "ship to a named entity in a Country Group D destination." Source: BIS Consolidated Screening List API at `https://api.trade.gov/static/consolidated_screening_list/consolidated.json` (free, US gov). This API also bundles OFAC SDN, State Dept AECA debarred, etc., into one feed.
- **attacker_stories_addressed:** `foreign-institution`
- **external_dependencies:** Trade.gov Consolidated Screening List API (free, no auth) or its CSL search endpoint.
- **manual_review_handoff:** Any hit → compliance → deny.
- **flags_thrown:** `entity_list_hit`, `unverified_list_hit`, `meu_list_hit`.
- **failure_modes_requiring_review:** Name fuzzy-match noise; transliteration of foreign-language names.
- **record_left:** CSL query, matched entry ID, confidence score.

## 12. OFAC SDN + Sectoral Sanctions Identifications (SSI) screen of consignee/address

- **Mode:** Attacker-driven (`foreign-institution`)
- **Summary:** Run the consignee name, address, and any provided phone/email through the OFAC SDN list and the SSI list. Use the OFAC SDN XML or the Trade.gov CSL aggregation. While SDN is a person/entity list (not a country list), an SDN hit at a foreign address is the highest-confidence "do not ship" signal for measure 06's denial follow-up.
- **attacker_stories_addressed:** `foreign-institution`
- **external_dependencies:** OFAC SDN XML (`https://www.treasury.gov/ofac/downloads/sdn.xml`) or Trade.gov CSL.
- **manual_review_handoff:** Hit → deny.
- **flags_thrown:** `ofac_sdn_hit`, `ofac_ssi_hit`.
- **failure_modes_requiring_review:** Common-name false positives.
- **record_left:** OFAC list version, matched entry UID.

## 13. Distance-from-claimed-institution geofence

- **Mode:** Attacker-driven (`foreign-institution` — Method 1 framing as "satellite office")
- **Summary:** The attacker frames a forwarder address as a "satellite office" of the claimed institution. Compute the geodesic distance between (a) the resolved ship-to address (via the geocoder in idea 6) and (b) the canonical address of the claimed institution from ROR (`https://api.ror.org/organizations`) which carries lat/long. If distance > 50 km AND the ship-to is in a different ISO-3166-2 subdivision than any ROR-listed location for the institution, flag for review.
- **attacker_stories_addressed:** `foreign-institution`
- **external_dependencies:** ROR API (free); geocoder from idea 6.
- **manual_review_handoff:** Reviewer asks customer to document the satellite office (lease, institutional letter on the institution's `.edu`-equivalent domain).
- **flags_thrown:** `ship_to_off_campus`, `ship_to_distant_subdivision`.
- **failure_modes_requiring_review:** Genuinely distributed institutions (CNRS, Max Planck); field stations.
- **record_left:** ROR ID, ROR address, ship-to address, distance in km.

## 14. Country-of-shipment risk tiering using Basel AML Index + FATF grey/black list as a proxy

- **Mode:** Direct
- **Summary:** For destinations not on a comprehensive embargo, apply an enhanced-due-diligence tier based on the Basel AML Index country score and the FATF "Jurisdictions under Increased Monitoring" (grey list) and "High-Risk Jurisdictions Subject to a Call for Action" (black list). FATF black-list countries (currently DPRK, Iran, Myanmar) overlap heavily with embargo lists, but the grey list (~20 jurisdictions) catches structuring-prone destinations not yet under full embargo. Trigger enhanced review rather than auto-deny.
- **attacker_stories_addressed:** `foreign-institution` (CIS variants the branch enumerates often live on FATF grey list)
- **external_dependencies:** FATF public list page (manual quarterly refresh); Basel Institute on Governance AML Index (annual PDF, free for non-commercial).
- **manual_review_handoff:** Enhanced due diligence packet — institution verification + biosafety committee letter required before ship.
- **flags_thrown:** `fatf_grey_list_destination`, `fatf_black_list_destination`.
- **failure_modes_requiring_review:** List staleness; political vs technical updates.
- **record_left:** List version, matched country, EDD packet ID.

## 15. Wassenaar Arrangement participating-state classification check

- **Mode:** Direct
- **Summary:** Cross-check destination country against Wassenaar Arrangement participating states (42 countries). Synthetic biology / dual-use category 1C / 2B controls assume the destination is a Wassenaar participant for the export control regime to "carry over." A non-participant destination for a 1C353-classifiable order automatically escalates to manual export-control review. Source: Wassenaar Arrangement public participating-states page.
- **attacker_stories_addressed:** `foreign-institution`
- **external_dependencies:** Wassenaar Arrangement website (manual list, ~stable).
- **manual_review_handoff:** Export-control officer.
- **flags_thrown:** `non_wassenaar_destination_for_dual_use_sku` → review.
- **failure_modes_requiring_review:** Borderline classification.
- **record_left:** Country, Wassenaar status, date checked.

## 16. Country sanctions API aggregator: OpenSanctions

- **Mode:** Direct
- **Summary:** Use the OpenSanctions free dataset (`https://www.opensanctions.org/datasets/`) which aggregates 200+ source lists including OFAC SDN, BIS Entity, EU consolidated, UK OFSI, UN SC, Canada SEMA, Australia DFAT, Swiss SECO, into a single FollowTheMoney-typed JSON / CSV / API. Run consignee + address through the OpenSanctions Match API (`https://api.opensanctions.org/match/`) using the `default` collection. Free for non-commercial; paid tier has higher rate limits.
- **attacker_stories_addressed:** `foreign-institution`
- **external_dependencies:** OpenSanctions Match API.
- **manual_review_handoff:** Hit → compliance → deny.
- **flags_thrown:** `opensanctions_match` with source-list breakdown.
- **failure_modes_requiring_review:** Common-name false positives; vendor uptime.
- **record_left:** OpenSanctions match ID, score, source lists hit.

## Dropped

(none yet — first iteration)
