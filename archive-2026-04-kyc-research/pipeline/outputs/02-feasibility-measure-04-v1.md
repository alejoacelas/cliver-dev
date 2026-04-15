# Stage 2 — Feasibility check, measure 04 (shipping-residential), v1

Reviews `01-ideation-measure-04-v1.md`. Two gates: concreteness, relevance.

---

## 1. USPS DPV + RDI — **PASS**
Concreteness: names USPS RDI, a specific licensed product. Relevance: directly addresses the residential gate against community-bio-lab-network, dormant-domain residential sub-config, cro-framing FNR landscape. Note for stage 4: confirm RDI licensing (separate from Web Tools free tier).

## 2. Melissa Global Address Verification + RDI — **PASS**
Concreteness: specific vendor + named field (`AddressType`, RDI). Relevance: covers same stories plus foreign-institution via Global product.

## 3. SmartyStreets US Street API with RDI — **PASS**
Concreteness: named vendor, named fields (`rdi`, `record_type`). Relevance: explicitly cited by attackers in the dormant-domain mapping file as the product they reason about — highest-relevance idea in the set.

## 4. Lob US Verifications API — **PASS**
Concreteness: specific vendor + endpoint name; the residential indicator is marked `[best guess]` which is acceptable per stage-1 rules. Relevance: addresses residential gate. Slight overlap with #1–#3 but Lob is a distinct SaaS path stage 4 should price separately.

## 5. Google Address Validation + Places place-type cross-check — **PASS**
Concreteness: two named Google APIs, named field (`types`). Relevance: the cross-check is the novel value — addresses community-bio-lab-network and works internationally for foreign-institution. Strong idea.

## 6. County assessor parcel land-use code (Regrid / ATTOM) — **PASS**
Concreteness: two named aggregators with specific products. Relevance: the parcel land-use code is a stronger legal signal than mail-routing RDI and directly catches community-bio-lab-network (garage parcel = SFR regardless of LLC framing). Highest substantive value of the direct-mode ideas.

## 7. OpenAddresses + OSM building-tag heuristic — **PASS**
Concreteness: names OpenAddresses dataset and OSM Overpass with the specific `building=` tag values. Relevance: foreign-institution coverage where USPS RDI fails. Stage 4 should be honest about OSM tag completeness.

## 8. Experian/Acxiom/LexisNexis consumer-vs-business append — **REVISE**
Concreteness: lists three vendors but doesn't commit to one or name a specific product/field. Relevance is fine. **Revision needed:** pick one vendor and name the specific product (e.g., "LexisNexis Risk Solutions InstantID Address Verification" or "Experian Mosaic SOHO segment") so stage 4 has a single thing to look up. Pluralizing dilutes the idea.

## 9. D&B / Bisnode business-presence check — **PASS**
Concreteness: D&B Direct+ is a specific named product with a known query-by-address path. Relevance: handles the cro-framing branch where a real business *should* exist at the address — its absence is the signal. Good complementary check.

## 10. USPS CMRA cross-check (Smarty `dpv_cmra`) — **PASS**
Concreteness: named field. Relevance: dormant-domain explicitly mentions CMRA. Note this overlaps measure 03 (PO Box); stage 3 consolidation may merge. For now keep as a sibling check that closes a substitute path the residential gate would otherwise leave open.

## 11. Internal SOP: residential-tolerant customer class — **PASS**
Concreteness: SOP with specific inputs (state LLC filing, biosafety attestation, measure-20 voucher) and a specific decision tree. Per stage-1 rules an SOP idea passes concreteness if paired with a specific signal + playbook — this one is. Relevance: directly closes the community-bio-lab-network "provider has no customer-class-aware policy" assumption which the attacker file flags as the pivotal uncertainty.

## 12. Short-term-rental detection (AirDNA / Inside Airbnb) — **PASS**
Concreteness: two specific datasets named. Relevance: foreign-institution branch *explicitly* names Airbnb as the residential-procurement path; this is the only idea in the set that engages it directly. Keep.

---

## Gaps

- **No idea targets the dormant-domain "residential-colocation lucky case" verification angle:** that branch's bypass relies on the attacker genuinely living in the lab's historical metro. An idea that compares the shipping address city/state to the historical address of the claimed institution (from archived web pages, e.g., Wayback Machine snapshots of the lab's old contact page) could flag implausible co-locations. Worth adding in v2 if not covered by measure 05 (institution-association). For measure 04 in isolation, leaving as a noted gap.
- **No idea handles foreign residential addresses outside OSM coverage** beyond Melissa Global and Google. Acceptable — three vendors is enough breadth for stage 4.

---

## Verdicts summary

- PASS: 11 (ideas 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12)
- REVISE: 1 (idea 8)
- DROP: 0

STOP: no
