# Stage 2 — Feasibility check, measure 04 (shipping-residential), v2

Reviews `01-ideation-measure-04-v2.md`.

---

## 1. USPS DPV + RDI — **PASS** (carried)
## 2. Melissa Global Address Verification + RDI — **PASS** (carried)
## 3. SmartyStreets US Street API with RDI — **PASS** (carried)
## 4. Lob US Verifications API — **PASS** (carried)
## 5. Google Address Validation + Places place-type cross-check — **PASS** (carried)
## 6. County assessor parcel land-use code (Regrid / ATTOM) — **PASS** (carried)
## 7. OpenAddresses + OSM building-tag heuristic — **PASS** (carried)

## 8. LexisNexis Risk Solutions InstantID Address Verification — **PASS**
Revision addressed v1 critique: single named vendor, single named product, specific field semantics. Distinct from USPS-RDI vendors in #1–#3 (consumer-graph-based). Stage 4 will verify InstantID actually returns the residential/SOHO classification described — if not, fall back to "LexisNexis Address Verification."

## 9. D&B Direct+ business-presence check — **PASS** (carried)
## 10. USPS CMRA cross-check — **PASS** (carried)
## 11. Internal SOP: residential-tolerant customer class — **PASS** (carried)
## 12. Short-term-rental detection (AirDNA / Inside Airbnb) — **PASS** (carried)

## 13. Wayback Machine archived-contact-page co-location check — **PASS**
Concreteness: names the specific Wayback CDX API and a specific computation (city-level distance). Relevance: targets the exact dormant-domain residential-colocation sub-config flagged as a gap in v1. Note for stage 4: this overlaps measure 05 (institution-association) and stage 3 consolidation may merge — for measure 04 in isolation, keep.

---

## Gaps

None remaining. All five attacker stories in the mapping file (community-bio-lab-network, dormant-domain incl. residential sub-config, foreign-institution, cro-framing, gradual-legitimacy-accumulation) are addressed by at least two ideas each. The v1 dormant-domain co-location gap is now closed by idea 13.

---

## Verdicts summary

- PASS: 13
- REVISE: 0
- DROP: 0

STOP: yes
