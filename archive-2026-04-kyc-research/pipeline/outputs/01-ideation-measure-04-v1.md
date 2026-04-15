# Stage 1 — Ideation, measure 04 (shipping-residential), v1

Goal: classify a shipping address as residential vs business/institutional, surface signals for manual review.

---

## 1. USPS DPV + RDI (Residential Delivery Indicator)

- **summary:** Submit the shipping address to USPS Address Information System APIs. DPV (Delivery Point Validation) confirms deliverability; RDI returns a "Residential" / "Business" flag for every deliverable US address. Any RDI=Residential triggers the residential gate.
- **modes:** direct, attacker-driven
- **attacker_stories_addressed:** community-bio-lab-network, dormant-domain (residential sub-config), cro-framing, gradual-legitimacy-accumulation
- **external_dependencies:** USPS Web Tools API (RDI is a licensed product, requires separate USPS approval beyond the free Address Validation tier) [best guess on licensing]
- **manual_review_handoff:** Flag goes to KYC reviewer with the parsed address, RDI flag, and the customer's stated institutional affiliation. Playbook: ask the customer "Do you have an institutional affiliation? Where are you working with the sequences?" per measure spec. Reviewer compares answer to institution-association check (measure 05).
- **flags_thrown:** RDI=Residential → manual review. DPV=undeliverable → separate data-quality flag (treat as failure mode, not residential).
- **failure_modes_requiring_review:** API timeout/error, address not DPV-confirmed (cannot determine RDI), foreign address (RDI is US-only).
- **record_left:** Stored API response JSON with timestamp, RDI value, DPV code, normalized address.
- Other fields: # stage 4 / # stage 6

## 2. Melissa Global Address Verification + Residential Delivery Indicator

- **summary:** Melissa's Address Verification API returns an `AddressType` (Residential/Business/PO Box/etc.) plus a Residential Delivery Indicator field for US addresses, sourced from USPS and proprietary append data. Used as a non-USPS-licensed alternative or cross-check.
- **modes:** direct, attacker-driven
- **attacker_stories_addressed:** community-bio-lab-network, dormant-domain, foreign-institution (Melissa Global covers non-US), cro-framing
- **external_dependencies:** Melissa Data API (commercial, per-lookup pricing) # stage 4
- **manual_review_handoff:** Same as #1.
- **flags_thrown:** AddressType=Residential or RDI=R → review.
- **failure_modes_requiring_review:** Ambiguous AddressType (e.g., mixed-use building), low confidence score, foreign address with no RDI equivalent.
- **record_left:** Stored Melissa response with confidence score and AddressType.

## 3. SmartyStreets (Smarty) US Street Address API with RDI add-on

- **summary:** Smarty US Street API returns a `rdi` field ("Residential"/"Commercial"/blank) and a `record_type` field. Already cited in the dormant-domain attacker file as the CMRA-flag-aware product attackers reason about. Cheapest CMRA-aware classifier on the market [best guess].
- **modes:** direct, attacker-driven
- **attacker_stories_addressed:** dormant-domain (explicitly named), community-bio-lab-network, cro-framing, gradual-legitimacy-accumulation
- **external_dependencies:** Smarty US Street API (commercial, subscription + per-lookup) # stage 4
- **manual_review_handoff:** Same as #1; reviewer also sees `record_type` (e.g., "S" street, "H" highrise, "P" PO box) which can disambiguate residential apartment vs commercial highrise.
- **flags_thrown:** rdi=Residential → review. record_type=H + rdi=blank → review (highrise ambiguous).
- **failure_modes_requiring_review:** Blank rdi (Smarty cannot classify), multi-unit address with no secondary unit number.
- **record_left:** Stored Smarty response.

## 4. Lob US Verifications API (residential indicator)

- **summary:** Lob's address verification returns deliverability + a residential indicator. Used as commodity backup vendor; popular in startup stacks. [best guess: Lob exposes RDI similarly to Smarty — verify in stage 4]
- **modes:** direct
- **attacker_stories_addressed:** community-bio-lab-network, dormant-domain
- **external_dependencies:** Lob Verifications API # stage 4
- **manual_review_handoff:** Same as #1.
- **flags_thrown:** Residential flag → review.
- **failure_modes_requiring_review:** API errors, low-confidence deliverability.
- **record_left:** Stored Lob response.

## 5. Google Address Validation API + place-type cross-check

- **summary:** Google Address Validation API normalizes the address and returns USPS data (including DPV and a residential signal for US addresses). Cross-check by reverse-geocoding the normalized address with Places API and inspecting `types` (e.g., `premise`, `establishment`, `point_of_interest`); presence of `establishment` tied to a non-residential category lowers residential confidence.
- **modes:** direct, attacker-driven
- **attacker_stories_addressed:** community-bio-lab-network (a real garage will not be a Google "establishment"), foreign-institution (works internationally), dormant-domain
- **external_dependencies:** Google Maps Platform (Address Validation + Places APIs) # stage 4
- **manual_review_handoff:** If Google says residential AND no overlapping establishment of category "laboratory"/"university"/"corporate office" within 25 m, escalate. Reviewer sees both responses.
- **flags_thrown:** Residential indicator + no co-located business establishment → review.
- **failure_modes_requiring_review:** Mixed-use buildings (apartment over storefront), Places coverage gaps in rural areas.
- **record_left:** Stored Address Validation + Places response.

## 6. County assessor parcel land-use code lookup (Regrid / ATTOM)

- **summary:** Query a national parcel-data aggregator (Regrid "nationwide parcel data" or ATTOM Data Solutions Property API) by address and retrieve the assessor's land-use / property-class code. Codes flagged as SFR ("single family residential"), condo, multi-family, mobile home → residential. Codes flagged as commercial, industrial, institutional, exempt-government → not residential. Strongest signal because it reflects the legal classification of the parcel rather than mail-delivery routing.
- **modes:** direct, attacker-driven
- **attacker_stories_addressed:** community-bio-lab-network (a garage lab parcel will assessor-classify as SFR even if the LLC paperwork frames it as a lab), dormant-domain (revived lab at a residential parcel), cro-framing
- **external_dependencies:** Regrid Parcel API or ATTOM Property API; fallback to direct county assessor portals for missing counties # stage 4
- **manual_review_handoff:** Reviewer sees parcel land-use code, owner name from assessor record, square footage. Playbook: compare assessor owner to LLC name on file; mismatch + residential code → high priority review.
- **flags_thrown:** Land-use = residential SFR/multi-family/condo/mobile → review. Land-use = mixed-use → soft flag.
- **failure_modes_requiring_review:** Parcel coverage gap (some counties not in Regrid), address geocodes to wrong parcel.
- **record_left:** Parcel record snapshot with land-use code and source county.

## 7. OpenAddresses / OpenStreetMap address-tag heuristic

- **summary:** Cross-reference the address against OpenAddresses (open dataset of address points) and OSM. In OSM, look up the nearest building polygon and its `building=` tag; `building=house|residential|apartments|detached|garage|terrace` → residential, `building=commercial|industrial|laboratory|university|hospital` → not. Free, no vendor lock-in; use as a cheap pre-filter or cross-check for vendor disagreement.
- **modes:** direct
- **attacker_stories_addressed:** community-bio-lab-network, foreign-institution (OSM has international coverage, fills the gap where USPS RDI is US-only)
- **external_dependencies:** OpenAddresses dump (S3), OSM Overpass API # stage 4
- **manual_review_handoff:** Reviewer sees the OSM building tag and a screenshot from a static map tile.
- **flags_thrown:** OSM building tag in residential set → review. No nearby building polygon → soft flag (may be rural).
- **failure_modes_requiring_review:** OSM tagging incomplete (especially outside Europe/US urban cores).
- **record_left:** OSM way ID + tag snapshot.

## 8. Experian/Acxiom consumer-vs-business address append

- **summary:** Send the address to a consumer/marketing data provider (Experian Address Validation, Acxiom InfoBase, LexisNexis Risk Address Verification) which returns "consumer present at this address" — a positive consumer match implies residential. Tax-aware datasets like Experian can also tag as SOHO (small-office-home-office).
- **modes:** direct
- **attacker_stories_addressed:** community-bio-lab-network, dormant-domain, gradual-legitimacy-accumulation
- **external_dependencies:** Experian / Acxiom / LexisNexis B2B contracts # stage 4
- **manual_review_handoff:** Reviewer sees consumer-match indicator and any SOHO tag.
- **flags_thrown:** Consumer match present, no business presence → review. SOHO tag → soft flag.
- **failure_modes_requiring_review:** B2C data freshness, ambiguous SOHO classification.
- **record_left:** Append response with provenance.

## 9. D&B / Bisnode business-presence check (negative residential signal)

- **summary:** Query Dun & Bradstreet Direct+ API or D&B Hoovers for any business at the shipping address; ZoomInfo or PitchBook as alternatives. Absence of any registered business at the address combined with USPS RDI=Residential is a strong residential signal; presence of a registered business at the address weakens the residential classification (handles legitimate small biotech in a converted house).
- **modes:** direct, attacker-driven
- **attacker_stories_addressed:** cro-framing (a real LLC at the address would have a D&B record if old enough), gradual-legitimacy-accumulation, community-bio-lab-network
- **external_dependencies:** D&B Direct+ API # stage 4
- **manual_review_handoff:** Reviewer compares any D&B match's business name and SIC/NAICS codes against the customer's claimed institution.
- **flags_thrown:** Zero D&B matches at address AND vendor RDI=Residential → escalate. D&B match exists but NAICS not in life-sciences → soft flag.
- **failure_modes_requiring_review:** D&B coverage gap for very new entities (<6 months), false matches for shared addresses.
- **record_left:** D&B response with DUNS, business name, NAICS.

## 10. USPS CMRA list cross-check (sister to RDI, not the same flag)

- **summary:** USPS publishes a list of Commercial Mail Receiving Agencies (CMRAs) — virtual mailbox / mail forwarding services. While CMRAs are *not* residential, attackers in the dormant-domain story explicitly avoid CMRA flags by using residential addresses. Including CMRA detection as a sibling check ensures the residential gate isn't bypassed by trivially flipping to a CMRA. Smarty exposes a `dpv_cmra` field; USPS Address Validation also returns it.
- **modes:** attacker-driven (closes the substitute path)
- **attacker_stories_addressed:** dormant-domain (explicitly references CMRA), community-bio-lab-network
- **external_dependencies:** Smarty / USPS RDI+CMRA # stage 4
- **manual_review_handoff:** CMRA flag → separate review path (similar treatment to PO Box, measure 03).
- **flags_thrown:** dpv_cmra=Y → review.
- **failure_modes_requiring_review:** Stale CMRA list (USPS update cadence ~quarterly).
- **record_left:** Stored flag + USPS list snapshot date.

## 11. Internal SOP: residential-tolerant customer class

- **summary:** Operational SOP (not a vendor): if address is classified residential, route to a "community-bio / sole-proprietor" customer class that requires additional evidence (state LLC filing matching the address; biosafety self-attestation; voucher per measure 20). Without this SOP, residential = blanket denial; with it, the gate becomes a routing decision instead of a fail. Directly motivated by the community-bio-lab-network attacker story which exploits the "provider has no customer-class-aware policy" assumption.
- **modes:** attacker-driven
- **attacker_stories_addressed:** community-bio-lab-network (explicit), gradual-legitimacy-accumulation
- **external_dependencies:** human reviewer; secretary-of-state filings (already used by measure 09)
- **manual_review_handoff:** Reviewer collects: state filing showing residential address as registered office, copy of biosafety attestation, SOC voucher (measure 20). Decides accept-with-monitoring vs deny.
- **flags_thrown:** Residential + no state filing match → deny. Residential + filing match + no voucher → request voucher.
- **failure_modes_requiring_review:** Filing search returns ambiguous results.
- **record_left:** Decision memo linked to the order, with cited filings.

## 12. Short-term-rental address detection (AirDNA / Inside Airbnb)

- **summary:** For shipments to addresses that are also active short-term rentals, that's a strong signal of the foreign-institution attacker's "rented residence during shipment window" pattern. AirDNA sells STR listings data; Inside Airbnb publishes scraped data for many cities free. Cross-reference shipping address against active STR listings.
- **modes:** attacker-driven
- **attacker_stories_addressed:** foreign-institution (explicit — names Airbnb)
- **external_dependencies:** AirDNA API or Inside Airbnb dataset # stage 4
- **manual_review_handoff:** Reviewer sees STR listing match (host name, listing URL).
- **flags_thrown:** Address matches active STR listing → escalate (combine with residential flag → likely deny).
- **failure_modes_requiring_review:** STR listings often coarsened to block-level for privacy → false matches; coverage gaps outside major metros.
- **record_left:** STR match record.

---

## Dropped

(none in v1)
