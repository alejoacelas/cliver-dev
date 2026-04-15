# Stage 1 — Measure 05 shipping-institution-association — v1

Measure: screen shipping address for public association with the customer's claimed institutional affiliation. Flag if no public association exists.

Modes: D = direct, A = attacker-driven.

---

## 1. ROR institutional-address cross-reference

- **Modes:** D, A
- **Summary:** Look up the customer's claimed institution in the Research Organization Registry (ROR) public API (`api.ror.org/organizations`). ROR records include `addresses` (lat/lon, city, country, geonames ID) and `links` (institution website). Geocode the shipping address and compute distance to any ROR address for that org; flag if not within a configurable radius (e.g., 25 km of any ROR location for that org or any of its `relationships` children).
- **attacker_stories_addressed:** visiting-researcher, foreign-institution, inbox-compromise, it-persona-manufacturing, dormant-domain, gradual-legitimacy-accumulation
- **external_dependencies:** ROR public API (free, no auth); a geocoder (Google Maps Geocoding API or Nominatim/OpenStreetMap).
- **manual_review_handoff:** If shipping address >25 km from any ROR-listed location for the claimed org, route to reviewer with both addresses + map link. Reviewer asks customer to explain (satellite campus, off-site lab, conference shipment).
- **flags_thrown:** (a) institution not found in ROR → review; (b) institution found but no address within radius → review; (c) institution found in ROR with no `addresses` populated → soft flag, fall through to other checks.
- **failure_modes_requiring_review:** ROR API 5xx; ambiguous institution name match; multi-campus universities where ROR only lists HQ; geocoder rate limit.
- **record_left:** Stored ROR ID, ROR address records used, geocoded shipping coordinates, distance computed, decision.
- Other fields: # stage 4

## 2. GLEIF LEI registered-address lookup

- **Modes:** D, A
- **Summary:** For corporate/CRO/biotech-LLC customers, query the GLEIF Level-1 LEI public API (`api.gleif.org/api/v1/lei-records`) by legal name to retrieve the entity's registered legal address and headquarters address. Compare to shipping address (string + geocoded). LEIs are issued only after a Local Operating Unit verifies the registered address against an authoritative business register, so a match is a meaningful signal. A no-LEI result is itself a soft signal for small/young CROs.
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation
- **external_dependencies:** GLEIF public API (free, no auth, ~documented rate limits).
- **manual_review_handoff:** If LEI exists but neither legal nor HQ address matches shipping → reviewer asked to confirm with customer. If no LEI for a stated commercial entity → reviewer judges org age + size and may require additional evidence.
- **flags_thrown:** (a) LEI registered address differs from shipping → review; (b) entity has no LEI → soft flag; (c) LEI status `LAPSED` or `RETIRED` → review.
- **failure_modes_requiring_review:** Multiple LEIs match the legal name; LEI registered to a registered-agent address (Delaware/Wyoming) rather than operations.
- **record_left:** LEI code, retrieved registered address, HQ address, status, comparison result.
- Other fields: # stage 4

## 3. Companies House registered-office lookup (UK entities)

- **Modes:** D, A
- **Summary:** For customers claiming a UK affiliation or UK-formed entity, query the Companies House public API (`api.company-information.service.gov.uk/company/{number}` and `/search/companies`) to retrieve registered office address, SIC codes, and officers. Compare registered office to shipping address. SIC codes give a sanity check on life-sciences relevance (e.g., 72110 R&D in biotechnology).
- **attacker_stories_addressed:** cro-framing (UK CIC sub-variant), shell-nonprofit (UK CIC), foreign-institution (UK)
- **external_dependencies:** Companies House API (free with API key).
- **manual_review_handoff:** Mismatched address or non-life-sciences SIC code → review with the registered office and SIC list shown.
- **flags_thrown:** (a) registered office ≠ shipping address; (b) SIC codes unrelated to life sciences; (c) company status `dissolved`/`liquidation`.
- **failure_modes_requiring_review:** Registered office is the accountant's address (very common for UK SMEs); recently incorporated company with thin filings.
- **record_left:** Company number, registered office, SIC codes, status, decision.
- Other fields: # stage 4

## 4. Charity Commission for England and Wales lookup

- **Modes:** D, A
- **Summary:** For customers claiming UK 501(c)(3)-equivalent / charitable / community-bio status, query the Charity Commission Register API (`api.charitycommission.gov.uk`) for the charity's registered address, trustees, and activities. Check shipping address against the registered address.
- **attacker_stories_addressed:** community-bio-lab-network, shell-nonprofit (charitable variant), foreign-institution (UK)
- **external_dependencies:** Charity Commission API (free, requires API key per their dev portal). [best guess on exact endpoint shape]
- **manual_review_handoff:** No charity record for the named entity → review. Charity exists but address mismatch → review.
- **flags_thrown:** Entity claims charity status but no Charity Commission record; address mismatch.
- **failure_modes_requiring_review:** Recently registered charity; Scottish (OSCR) or NI charities not in this register.
- **record_left:** Charity number, registered address, trustees list, status.
- Other fields: # stage 4

## 5. Google Maps Places API — institution polygon / building match

- **Modes:** D, A
- **Summary:** Use Google Places API (Find Place + Place Details) to resolve the claimed institution to a place_id, then retrieve its `geometry/viewport` (and street address). Geocode the shipping address and check whether it falls within the institution's viewport bounds, or within X meters of the institution's location, or shares the same place_id via reverse-geocoding the shipping address. Also detects branded biotech buildings (e.g., "LabCentral", "BioLabs San Diego") because Google Places carries them as POIs.
- **attacker_stories_addressed:** biotech-incubator-tenant, visiting-researcher, foreign-institution, inbox-compromise, it-persona-manufacturing, dormant-domain
- **external_dependencies:** Google Maps Platform (Geocoding + Places); paid per-call.
- **manual_review_handoff:** Reviewer sees both pins on a map, the institution's Place name, and the shipping address's resolved POI (if any).
- **flags_thrown:** (a) shipping address resolves to a different named POI than the claimed institution and is >X m away; (b) institution not findable in Places.
- **failure_modes_requiring_review:** Large multi-building campuses; off-campus medical school buildings; place_id stale.
- **record_left:** Place IDs (institution + shipping POI), distance, viewport check result.
- Other fields: # stage 4

## 6. OpenStreetMap / Nominatim institution-polygon containment

- **Modes:** D
- **Summary:** Free alternative to (5). Use Nominatim (`nominatim.openstreetmap.org/search`) with `polygon_geojson=1` to fetch the institution's polygon (universities and large research institutes are commonly mapped as relations in OSM with `amenity=university` / `landuse=education` / `building=university`). Geocode shipping address; check point-in-polygon. Falls back to bounding-box containment when only a way is available.
- **attacker_stories_addressed:** visiting-researcher, inbox-compromise, foreign-institution, it-persona-manufacturing
- **external_dependencies:** Nominatim (free, usage-policy throttled) or self-hosted Nominatim/Photon; Overpass API (`overpass-api.de`) for richer polygon queries.
- **manual_review_handoff:** Same as (5).
- **flags_thrown:** Shipping point not contained in any institution polygon; institution polygon not in OSM.
- **failure_modes_requiring_review:** OSM coverage uneven outside US/EU; small colleges may have no polygon.
- **record_left:** OSM relation/way ID, polygon source, point-in-polygon decision.
- Other fields: # stage 4

## 7. Ringgold Identify (institutional address directory)

- **Modes:** D
- **Summary:** Ringgold Identify is a commercial directory of ~600k institutions used by scholarly publishers; each record carries verified addresses, parent/child relationships, and Ringgold IDs. Look up the claimed institution and compare its registered address(es) to shipping. Strong for academic/medical institutions with multi-campus structure where ROR is thinner.
- **attacker_stories_addressed:** visiting-researcher, foreign-institution, inbox-compromise, it-persona-manufacturing
- **external_dependencies:** Ringgold Identify Database (paid subscription).
- **manual_review_handoff:** As in (1).
- **flags_thrown:** No address within configured radius of any Ringgold address for the institution.
- **failure_modes_requiring_review:** Subscription gating; coverage skews to publishing-active institutions.
- **record_left:** Ringgold ID, addresses pulled, distance computed.
- Other fields: # stage 4

## 8. SmartyStreets (Smarty) US address metadata + CMRA flag

- **Modes:** D, A
- **Summary:** Use Smarty US Street Address API to (a) validate and standardize the shipping address, (b) read RDI (residential delivery indicator) and CMRA flag (USPS-published Commercial Mail Receiving Agency list). A CMRA flag on an address claimed as institutional is a direct contradiction with measure 05 — the address is a mail-handling facility, not a building publicly associated with the named institution. Fires before any institution-side lookup.
- **attacker_stories_addressed:** community-bio-lab-network (virtual office), shell-nonprofit (virtual office), cro-framing (virtual office), cro-identity-rotation (virtual office), inbox-compromise (CMRA in metro), dormant-domain (virtual office), foreign-institution (virtual office in metro), gradual-legitimacy-accumulation (virtual office baseline), visiting-researcher (virtual-office fallback)
- **external_dependencies:** Smarty US Street API (paid per lookup; free tier).
- **manual_review_handoff:** Reviewer sees the CMRA flag and the USPS-standardized address; asks customer to provide the institution's actual receiving location.
- **flags_thrown:** RDI=residential; CMRA=true; address fails USPS validation.
- **failure_modes_requiring_review:** Newly-listed CMRAs not yet in USPS file; non-US addresses fall back to International API which lacks CMRA equivalents.
- **record_left:** Standardized address, RDI, CMRA flag, USPS DPV codes.
- Other fields: # stage 4

## 9. Melissa Address Verification (international RDI/CMRA equivalent)

- **Modes:** D, A
- **Summary:** Same role as Smarty for non-US addresses; Melissa Global Address Verification returns address-type metadata for many countries and can flag mailbox/forwarder addresses outside the US. Used to catch Estonian/UK/Singapore virtual offices used in foreign-formation sub-variants.
- **attacker_stories_addressed:** cro-framing (Estonian sub-variant), shell-nonprofit (foreign formation), foreign-institution
- **external_dependencies:** Melissa Global Address Verification API (paid).
- **manual_review_handoff:** Same as (8).
- **flags_thrown:** Address type = mailbox/forwarder; address fails validation.
- **failure_modes_requiring_review:** Country coverage gaps; metadata richness varies.
- **record_left:** Standardized address, address type code, country.
- Other fields: # stage 4

## 10. Institutional website scrape — directory / contact / "find us" page

- **Modes:** D, A
- **Summary:** From the claimed institution's domain (resolved via ROR `links` or the customer's email domain), fetch and scrape the canonical "Contact", "Locations", "Find us", "Directions", or department directory pages. Extract postal addresses with a regex/LLM and compare against shipping. Catches satellite labs and field stations not in ROR.
- **attacker_stories_addressed:** visiting-researcher, inbox-compromise, foreign-institution, it-persona-manufacturing, dormant-domain
- **external_dependencies:** HTTP fetcher; address-extraction (libpostal or LLM); cache.
- **manual_review_handoff:** Reviewer sees scraped addresses and the matching/non-matching shipping address.
- **flags_thrown:** Shipping address not present in any scraped address on institution website.
- **failure_modes_requiring_review:** JS-rendered sites; institution lists only main address; broken pages.
- **record_left:** URLs scraped, addresses found, comparison result.
- Other fields: # stage 4

## 11. University campus map / facilities portal lookup

- **Modes:** D
- **Summary:** Many universities publish a `maps.<university>.edu` or facilities portal with building list + addresses (e.g., `campusmap.harvard.edu`, `map.stanford.edu`). When the customer claims a US R1, fetch the campus map's building dataset (often a GeoJSON or KML behind the map) and check shipping address against listed building addresses. Stronger than ROR for "which building" granularity.
- **attacker_stories_addressed:** visiting-researcher, inbox-compromise, it-persona-manufacturing
- **external_dependencies:** Per-university map data (no standard API). [best guess]
- **manual_review_handoff:** As in (10).
- **flags_thrown:** Shipping building not listed in the campus map dataset.
- **failure_modes_requiring_review:** No standardized format; only practical for top-N universities; off-campus affiliated institutes excluded.
- **record_left:** Source URL, building list version, decision.
- Other fields: # stage 4

## 12. OpenCorporates registered-address cross-reference

- **Modes:** D, A
- **Summary:** Query OpenCorporates API (`api.opencorporates.com/companies/search`) for the claimed entity name; retrieve principal/registered address(es) across jurisdictions and compare with shipping. Particularly useful where the customer is a US LLC and ROR/GLEIF have nothing — OpenCorporates indexes state business registries (Delaware, Wyoming, New Mexico) so it surfaces shell-LLC registered-agent addresses.
- **attacker_stories_addressed:** shell-nonprofit, cro-framing, cro-identity-rotation, community-bio-lab-network, gradual-legitimacy-accumulation, biotech-incubator-tenant
- **external_dependencies:** OpenCorporates API (paid above small free tier).
- **manual_review_handoff:** Reviewer sees the registered-agent address vs the shipping address. If registered-agent address ≠ shipping, that does not by itself fail (legitimate startups often differ), but combined with a CMRA flag, virtual-office address, or no other public association → review.
- **flags_thrown:** (a) entity not found in OpenCorporates → soft flag; (b) registered address is a known registered-agent service (e.g., Harvard Business Services in Lewes, DE) AND shipping is a CMRA → review.
- **failure_modes_requiring_review:** Registered-agent addresses dominate Delaware/Wyoming/NM filings; need known-registered-agent list for second-pass logic.
- **record_left:** Jurisdiction, company number, registered address, decision.
- Other fields: # stage 4

## 13. EDGAR / SEC entity address (US public/registered entities)

- **Modes:** D
- **Summary:** For larger biotech/CRO customers, query the SEC EDGAR full-text and submissions APIs (`data.sec.gov/submissions/CIK{cik}.json`) for the entity's business address as filed. Free, authoritative for public filers and Reg A/Reg D filers.
- **attacker_stories_addressed:** cro-framing, gradual-legitimacy-accumulation
- **external_dependencies:** SEC EDGAR (free, fair-use throttled).
- **manual_review_handoff:** Reviewer sees filed business address vs shipping.
- **flags_thrown:** Filed business address ≠ shipping; entity not in EDGAR (only a soft signal — most LLC CROs are not filers).
- **failure_modes_requiring_review:** Coverage limited to filers.
- **record_left:** CIK, business address, filing date.
- Other fields: # stage 4

## 14. Incubator/coworking tenant directory scrape

- **Modes:** A
- **Summary:** When the shipping address resolves to a known biotech incubator building (LabCentral, BioLabs locations, JLABS, Genspace, IndieBio), fetch that incubator's public tenant directory and verify the claimed institution name appears as a current tenant. Most major incubators publish member lists; absence of the claimed entity is a strong signal that the address-affiliation tie was manufactured but the tenancy is fake.
- **attacker_stories_addressed:** biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network
- **external_dependencies:** Per-incubator scrapers (LabCentral `labcentral.org/community`, BioLabs locations pages, JLABS `jlabs.jnjinnovation.com/locations`). [best guess on exact URLs]
- **manual_review_handoff:** Reviewer sees the incubator name, the date of last tenant-list crawl, and whether the customer entity appears.
- **flags_thrown:** (a) shipping address matches an incubator building but customer entity not in tenant list → review; (b) shipping matches an incubator and customer entity in list → soft pass.
- **failure_modes_requiring_review:** Tenant lists are stale; some incubators publish only "selected" tenants.
- **record_left:** Incubator name, source URL, snapshot, decision.
- Other fields: # stage 4

## 15. Carrier-redirect / mid-stream address-change SOP (registry-bound shipping)

- **Modes:** A
- **Summary:** SOP rather than data source. Bind shipments to the institution-registered address only: ship with carrier flags that prohibit recipient redirect (UPS "Direct Delivery Only" / FedEx "Hold for Pickup with no redirect" / signature-required-from-named-recipient), and require provider-side change-of-address review with second-contact approval if the customer asks for redirection. Closes the carrier-account-takeover bypass that defeats every database check above by simply moving the package post-shipment.
- **attacker_stories_addressed:** credential-compromise, account-hijack, dormant-account-takeover, it-persona-manufacturing (carrier reroute sub-path)
- **external_dependencies:** UPS / FedEx / DHL shipper APIs (carrier flags); internal change-control workflow.
- **manual_review_handoff:** Address-change requests routed to human review with the provider's two-contact policy: notify the second registered contact and require explicit confirmation before changing.
- **flags_thrown:** Any post-order address change; any carrier-reroute event reported by the carrier webhook.
- **failure_modes_requiring_review:** Legitimate lab moves; conference shipments; carrier flag not honored at last-mile.
- **record_left:** Carrier flag set on the label; change-request log; second-contact confirmation record.
- Other fields: # stage 4

## 16. Provider-side org registry with "two-contact" change control SOP

- **Modes:** A
- **Summary:** SOP. The provider maintains a hosted org registry: for each customer organization, a canonical institution-linked shipping address tied to two registered contacts. New address additions require a controlled workflow (second-contact attestation, cooling-off period, automatic re-run of measures 1, 5, 8 against the new address, re-screen of the relationship). Directly addresses the "social-engineered satellite address" pattern.
- **attacker_stories_addressed:** account-hijack, dormant-account-takeover, it-persona-manufacturing, inbox-compromise (registry change-workflow sub-path), credential-compromise
- **external_dependencies:** Provider's own registry; identity-of-second-contact (measure 14 IDV plumbing).
- **manual_review_handoff:** Address-add request → reviewer follows a fixed playbook: verify second contact independently, re-run association checks against the proposed address, contact a known phone number for the institution.
- **flags_thrown:** (a) Add-address request from a single contact; (b) second contact does not respond within N days; (c) new address fails any of the database checks.
- **failure_modes_requiring_review:** Legitimate sole-PI labs; rapid PI mobility.
- **record_left:** Registry diff log, second-contact attestation, re-screen results.
- Other fields: # stage 4

## 17. Wikidata institution coordinates / addresses

- **Modes:** D
- **Summary:** Free fallback to ROR/Ringgold. Wikidata items for institutions carry P625 (coordinate location), P969 (street address), P17 (country), and P527 (has part) for sub-campuses. Query via SPARQL (`query.wikidata.org/sparql`) by ROR ID (P6782) or by name. Compare shipping address coordinates to Wikidata coordinates for the institution and any sub-campus.
- **attacker_stories_addressed:** visiting-researcher, foreign-institution, inbox-compromise, it-persona-manufacturing
- **external_dependencies:** Wikidata SPARQL endpoint (free).
- **manual_review_handoff:** Same as (1).
- **flags_thrown:** Coordinates >25 km away from any Wikidata-listed location for the institution.
- **failure_modes_requiring_review:** Coverage and accuracy uneven; no canonical addresses for many smaller orgs.
- **record_left:** Wikidata QID, coordinates fetched, decision.
- Other fields: # stage 4

## 18. GRID legacy institution address dataset

- **Modes:** D
- **Summary:** GRID was the predecessor to ROR; the final 2021 release is a free downloadable JSON/CSV dataset with institutional addresses. Use as a static fallback when ROR is unreachable or for institutions ROR has deprecated. Same comparison logic as (1).
- **attacker_stories_addressed:** Same as (1).
- **external_dependencies:** GRID release files (free download, frozen).
- **manual_review_handoff:** As in (1).
- **flags_thrown:** Same as (1).
- **failure_modes_requiring_review:** Frozen — no new orgs after 2021.
- **record_left:** GRID ID, address record version, decision.
- Other fields: # stage 4

## Dropped

(none yet — first iteration)
