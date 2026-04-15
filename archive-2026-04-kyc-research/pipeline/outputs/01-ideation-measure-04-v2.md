# Stage 1 — Ideation, measure 04 (shipping-residential), v2

Carries forward all PASS ideas from v1 unchanged. Revises idea 8. Adds one new idea targeting the dormant-domain co-location gap surfaced by v1 feasibility.

---

## 1. USPS DPV + RDI

(Unchanged from v1 — PASS.)

## 2. Melissa Global Address Verification + RDI

(Unchanged — PASS.)

## 3. SmartyStreets US Street API with RDI

(Unchanged — PASS.)

## 4. Lob US Verifications API

(Unchanged — PASS.)

## 5. Google Address Validation + Places place-type cross-check

(Unchanged — PASS.)

## 6. County assessor parcel land-use code (Regrid / ATTOM)

(Unchanged — PASS.)

## 7. OpenAddresses + OSM building-tag heuristic

(Unchanged — PASS.)

## 8. LexisNexis Risk Solutions InstantID Address Verification (revised)

- **summary:** Submit the shipping address to LexisNexis Risk Solutions' InstantID address verification product, which returns a deliverability code plus a "residential / business" classification sourced from LexisNexis's consumer-data graph (the same graph used for KYC at US banks). This is distinct from the USPS-RDI vendors in #1–#3 because it's grounded in consumer presence rather than mail-routing classification — useful as a tie-breaker and as the SOHO-aware check.
- **modes:** direct, attacker-driven
- **attacker_stories_addressed:** community-bio-lab-network, dormant-domain, gradual-legitimacy-accumulation
- **external_dependencies:** LexisNexis Risk Solutions InstantID API (commercial, B2B contract) # stage 4
- **manual_review_handoff:** Reviewer sees LexisNexis classification, any SOHO indicator, and consumer-presence count.
- **flags_thrown:** Classification=Residential or SOHO indicator → review.
- **failure_modes_requiring_review:** Consumer-data freshness, ambiguous SOHO.
- **record_left:** Stored InstantID response.

## 9. D&B Direct+ business-presence check

(Unchanged — PASS.)

## 10. USPS CMRA cross-check (Smarty `dpv_cmra`)

(Unchanged — PASS.)

## 11. Internal SOP: residential-tolerant customer class

(Unchanged — PASS.)

## 12. Short-term-rental detection (AirDNA / Inside Airbnb)

(Unchanged — PASS.)

## 13. Wayback Machine archived-contact-page co-location check (new, addresses gap)

- **summary:** For customers claiming affiliation with a defunct or revived lab/institution, fetch archived snapshots of the institution's old contact page from the Internet Archive Wayback Machine (CDX API) and extract any historical addresses. Compare the historical city/state to the current shipping address. The dormant-domain attacker's residential-colocation sub-config only works when the attacker genuinely lives in the lab's original metro; mismatch is a signal the revival is purely paper. Pairs with measure 05 but adds a temporal angle measure 05 doesn't cover.
- **modes:** attacker-driven (gap)
- **attacker_stories_addressed:** dormant-domain (residential-colocation sub-config)
- **external_dependencies:** Internet Archive Wayback Machine CDX API + simple address-extraction parser # stage 4
- **manual_review_handoff:** Reviewer sees the archived snapshots, extracted addresses, and a city-level distance from the shipping address. Playbook: if shipping address >100 km from any historical address AND residential, escalate.
- **flags_thrown:** Residential + no historical address within metro → escalate. No archived contact page found at all → soft flag (the institution may never have had a web presence).
- **failure_modes_requiring_review:** Wayback coverage gaps for small labs, address extraction false negatives, recently moved legitimate labs.
- **record_left:** Snapshot URLs + extracted addresses + computed distance.

---

## Dropped

(none — idea 8 was revised, not dropped)
