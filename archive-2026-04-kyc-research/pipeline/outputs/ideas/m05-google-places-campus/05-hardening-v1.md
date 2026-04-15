# m05-google-places-campus — Bypass-aware hardening v1

- **measure:** M05 — shipping-institution-association
- **idea:** Google Places + OSM campus polygon containment

---

## Attacker story walk

### biotech-incubator-tenant

**Story summary:** Attacker leases bench space at a recognized biotech incubator so the shipping address resolves to a known biotech building.

**Bypass methods relevant to M05:**

1. **Bench-space lease at a recognized biotech incubator ($1,500–$5,000/mo).**

   **MISSED.** The implementation explicitly notes: "incubator buildings ARE often inside the polygon of recognized biotech parks (LabCentral is at 700 Main St Cambridge, inside the Kendall biotech cluster) — does NOT catch this attacker. The check is satisfied by the bypass." The address is inside or near a campus polygon (or a biotech-district polygon). Point-in-polygon returns `address_inside_campus_polygon` — a positive signal. The attacker passes cleanly.

2. **Standalone rented lab / sublet from a real biotech.**

   **MISSED.** Same logic — the building is in a biotech district. If it falls inside any institutional polygon, it passes. If it does not, it triggers review but the reviewer will find a legitimate commercial lab building, clearing it.

**Net assessment:** This check is structurally unable to distinguish a legitimate incubator tenant from an attacker tenant. The attacker's entire strategy is to be at a real biotech address — which is exactly what this check confirms positively.

---

### community-bio-lab-network

**Story summary:** Attacker constructs community-bio LLC, ships from maker space, coworking, virtual office, or residential address.

**Bypass methods relevant to M05:**

1. **Maker space address** — Maker spaces are NOT inside university campus polygons.

   **CAUGHT.** `address_outside_campus_polygon` fires (assuming the customer claims an institution). But wait — the community-bio attacker does NOT claim a university affiliation. They claim their own LLC/community-bio entity, which is not in ROR or any institution polygon. The check would fire `polygon_missing_for_institution` and fall through to ROR/GLEIF, which also has no record. This catches the attacker IF the provider requires every customer to have a polygon-matchable institution. But community-bio customers legitimately have none.

   **AMBIGUOUS.** Whether this check catches depends on policy: does the provider require all customers to have institution-polygon association? If yes, community-bio is structurally excluded (high FP). If no, this check does not fire on community-bio customers at all, and the attacker passes.

2. **Coworking at biotech cluster** — May or may not be inside a biotech-park polygon.

   **AMBIGUOUS.** Same policy question — does the provider require polygon association for community-bio customers?

3. **Virtual office / residential.**

   **AMBIGUOUS.** Same.

**Net assessment:** The check's applicability to this story depends on a policy decision the implementation does not specify: are community-bio customers expected to have institution-address association? If not, this check is not triggered.

---

### shell-nonprofit

**Story summary:** Attacker forms a shell entity registered to a virtual office in a biotech metro.

**Bypass methods relevant to M05:**

1. **Virtual office in biotech metro** — The virtual office is NOT inside a university campus polygon.

   **CAUGHT.** If the attacker claims affiliation with a real institution, the virtual-office address is outside the institution's campus polygon. `address_outside_campus_polygon` fires. If the attacker claims only their own shell entity, `polygon_missing_for_institution` fires and routes to fallback.

2. **Foreign formation sub-variant** — Foreign virtual office.

   **CAUGHT** under same logic, but with lower OSM polygon coverage internationally.

**Net assessment:** Catches shell-nonprofit if the attacker claims a real institution and ships to a virtual office NOT on that institution's campus. But the shell-nonprofit's strategy is to claim its OWN entity, not a real university — so the check routes to `polygon_missing_for_institution` and falls through to ROR/GLEIF.

---

### cro-framing

**Story summary:** LLC framed as CRO, virtual office/executive suite/coworking in biotech metro.

**Bypass methods relevant to M05:**

1. **Virtual office in biotech metro.**

   **CAUGHT** if the attacker claims affiliation with a real institution whose campus polygon does not contain the Regus address. The Regus is unlikely to be inside a university polygon. `address_outside_campus_polygon` fires.

   **MISSED** if the attacker claims only the CRO LLC as the institution. `polygon_missing_for_institution` fires and falls through. The CRO does not have a campus polygon.

2. **Coworking space (WeWork etc.).**

   **AMBIGUOUS.** Some coworking spaces are inside university-affiliated innovation districts. Depends on the specific location.

**Net assessment:** Effective only when the attacker falsely claims affiliation with a specific known institution. If the attacker presents as an independent CRO, this check's polygon logic does not apply.

---

### cro-identity-rotation

**Story summary:** Multiple LLCs, each with its own real address, rotating across providers.

**Bypass methods relevant to M05:**

1. **Real LLC + virtual office (cheapest).**

   **MISSED** for same reason as cro-framing — the LLC has no campus polygon. `polygon_missing_for_institution` fires.

2. **Real coworking space.**

   **MISSED.** Same.

**Net assessment:** Does not catch rotation because each LLC is its own "institution" with no polygon.

---

### dormant-domain

**Story summary:** Attacker revives defunct lab, ships from residential/virtual-office/biotech-coworking.

**Bypass methods relevant to M05:**

1. **Bypass A (self-register revived lab) + Bypass B (address sourcing).**

   **CAUGHT** if the defunct lab had a real campus or building that is in OSM, and the attacker's new address is NOT at that location. The revived lab's old location may have an OSM polygon or Places entry. The attacker's virtual office or residential address in a different part of the metro would be outside the polygon. `address_outside_campus_polygon` fires.

   **MISSED** if (a) the defunct lab was too small to have an OSM polygon, or (b) the attacker happens to rent a virtual office in the defunct lab's original building/neighborhood.

**Net assessment:** Partially effective. Depends on whether the defunct lab has an OSM polygon (unlikely for small labs) and whether the attacker's address is geographically distant.

---

### inbox-compromise

**Story summary:** Attacker compromises .edu inbox, ships to CMRA/virtual office in institution's metro.

**Bypass methods relevant to M05:**

1. **CMRA or virtual office in institution's metro.**

   **CAUGHT.** The .edu institution has a campus polygon. The CMRA/virtual office is NOT inside the campus polygon (it is elsewhere in the town). `address_outside_campus_polygon` fires.

2. **Registry address-change workflow.**

   **AMBIGUOUS.** If the attacker changes the approved shipping address through the provider's registry, the new address must still pass the polygon check on the next order. If the changed address is outside the polygon, CAUGHT. If the attacker manages to set an address inside the campus, MISSED.

**Net assessment:** Effective against this story. The CMRA in the institution's town is outside the campus polygon.

---

### foreign-institution

**Story summary:** Attacker claims foreign affiliation, ships to forwarder/accomplice/residential/virtual address.

**Bypass methods relevant to M05:**

1. **Method 1: In-country freight forwarder.**

   **CAUGHT** if the forwarder's address is not inside the foreign institution's campus polygon. But OSM polygon coverage for non-OECD institutions is poor. **AMBIGUOUS** overall.

2. **Method 2: Real institution address + local accomplice.**

   **MISSED.** The address IS the institution. Point-in-polygon passes.

3. **Method 4: Residential address.**

   **CAUGHT** if the foreign institution has an OSM polygon and the residence is outside it.

4. **Method 5: Virtual office in institution's metro.**

   **CAUGHT** if polygon exists and virtual office is outside it.

**Net assessment:** Effective in principle but degraded by poor international OSM polygon coverage.

---

### credential-compromise

**Story summary:** Attacker compromises PI's account, redirects shipment via carrier redirect or USPS COA.

**Bypass methods relevant to M05:**

1. **Carrier account takeover for package redirect.**

   **MISSED.** The polygon check happens at order time against the registered address, which IS the institution. The carrier redirect happens after the check passes, during transit. This check cannot detect post-approval shipping diversions.

2. **USPS change of address redirect.**

   **MISSED.** Same — the COA happens outside the provider's control, after the polygon check clears.

**Net assessment:** Does not catch this story. The bypass happens post-check during transit, not at order-placement time.

---

### account-hijack

**Story summary:** Attacker hijacks PI account, intercepts at institutional address or adds "satellite" address.

**Bypass methods relevant to M05:**

1. **Physical interception at PI's approved institutional address.**

   **MISSED.** The address IS the institution. Polygon check passes.

2. **Social-engineered address change to attacker-controlled drop.**

   **CAUGHT.** When the provider processes the address change, the new "satellite facility" address is re-checked against the institution's polygon. If outside, `address_outside_campus_polygon` fires. The implementation notes this: "attacker-controlled drop is unlikely to be inside any campus polygon → CATCHES."

**Net assessment:** Catches the address-change method but not the physical-interception method.

---

### it-persona-manufacturing

**Story summary:** Fake researcher persona inside real institution's IT footprint.

**Bypass methods relevant to M05:**

1. **Sub-path A (add to existing org record) + ship to host lab building.**

   **MISSED.** The host lab building IS inside the university campus polygon. The implementation notes: "host lab building IS inside campus polygon → does NOT catch."

2. **Sub-path C (sibling org at same institution).**

   **MISSED.** Same campus, same polygon.

3. **Carrier rerouting (UPS My Choice / FedEx Delivery Manager).**

   **MISSED.** Post-check transit diversion, same as credential-compromise.

**Net assessment:** Does not catch this story. The attacker operates from inside the real institution.

---

### visiting-researcher

**Story summary:** Attacker poses as visiting researcher, ships to host lab or off-campus virtual office.

**Bypass methods relevant to M05:**

1. **Ship to host lab's institutional address.**

   **MISSED.** Inside campus polygon.

2. **Off-campus virtual office in university's metro.**

   **CAUGHT.** Virtual office is outside campus polygon. `address_outside_campus_polygon` fires.

**Net assessment:** Catches the off-campus fallback but not the primary (host lab) path.

---

### dormant-account-takeover

**Story summary:** Attacker takes over dormant provider account with approved institution-linked addresses.

**Bypass methods relevant to M05:**

1. **Bypass B (ship to alternate registered address).**

   **AMBIGUOUS.** If the alternate address was previously approved and is inside the institution's polygon, MISSED. If outside, it depends on whether the polygon check is re-run on each order.

2. **Bypass D (address change to attacker-controlled destination).**

   **CAUGHT** if the provider re-runs the polygon check on address changes. The new address is outside the polygon.

**Net assessment:** Depends on whether the polygon check is re-evaluated on each order vs only on registration. The implementation does not specify re-evaluation cadence.

---

## Findings

### Finding 1 — Moderate: Carrier-redirect / post-approval shipping diversions bypass the check entirely

- **Source:** credential-compromise (carrier redirect, USPS COA), it-persona-manufacturing (carrier rerouting), account-hijack (physical interception).
- **Why missed:** The polygon check happens at order time against the registered address. All carrier-level redirects (UPS My Choice, FedEx Delivery Manager, USPS COA) occur after the check passes, during transit. The implementation has no mechanism to detect post-approval address changes at the carrier level.
- **Severity: Moderate.** This is structural — no address-association check at the provider level can detect carrier-level redirect. The bypass is cheap ($0) and used by multiple stories, but it is a transit-layer problem outside M05's scope. A separate check (carrier-redirect monitoring) would be a different idea entirely.
- **Suggestion:** Stage 7 should flag carrier-redirect as a cross-cutting gap that no M05 check addresses.

### Finding 2 — Moderate: Polygon coverage gap for non-OECD/small institutions

- **Source:** foreign-institution (all methods), dormant-domain (small defunct labs).
- **Why ambiguous:** The implementation estimates "~80% US R1 universities have boundary relations, dropping sharply for community colleges and non-OECD." For the foreign-institution story, the target institutions are specifically non-Anglophone mid-tier institutions where OSM polygon coverage is poorest. The check degrades to `polygon_missing_for_institution` and falls through to ROR/GLEIF.
- **Severity: Moderate.** The gap is quantified (approximately) and the fallback is specified. But for the specific attacker profile most likely to exploit foreign institutions, the check's primary mechanism is unavailable.
- **Suggestion:** Stage 6 should estimate OSM polygon availability for the institution types most relevant to the foreign-institution story.

### Finding 3 — Minor: Re-evaluation cadence unspecified

- **Source:** dormant-account-takeover (Bypass D), account-hijack (Method 2).
- **Why ambiguous:** The implementation does not state whether the polygon check runs on every order or only at registration/address-change time. If it runs only once, address changes that bypass the provider's review workflow are not re-checked.
- **Severity: Minor.** The implementation's manual-review playbook implies the check runs when `address_outside_campus_polygon` fires, but the triggering cadence is not pinned down.
- **Suggestion:** Stage 4 re-research should clarify: polygon containment should be re-evaluated on every order, not only on registration.

### Finding 4 — Minor: Biotech-incubator-tenant passes positively

- **Source:** biotech-incubator-tenant (bench-space lease).
- **Why missed:** The attacker IS at a real biotech address that IS inside a biotech-district polygon. The check's positive signal works against the provider here: it confirms the attacker is at a biotech location. Structural — no polygon-based check can distinguish legitimate from malicious incubator tenants.
- **Severity: Minor.** The implementation correctly identifies this as a structural limitation. The m05-incubator-tenant idea is the complementary check for this case.

---

## bypass_methods_known

| Bypass method | Story | Classification |
|---|---|---|
| Bench-space lease at incubator | biotech-incubator-tenant | MISSED |
| Standalone rented lab | biotech-incubator-tenant | MISSED |
| Maker space (no institution claim) | community-bio-lab-network | AMBIGUOUS |
| Virtual office in biotech metro (own entity) | shell-nonprofit | AMBIGUOUS |
| Virtual office (claims real institution) | cro-framing | CAUGHT |
| Virtual office (claims own CRO) | cro-framing | MISSED |
| Virtual office per rotated LLC | cro-identity-rotation | MISSED |
| Address differs from defunct lab's location | dormant-domain | CAUGHT |
| Address near defunct lab (small lab, no polygon) | dormant-domain | MISSED |
| CMRA in institution's metro | inbox-compromise | CAUGHT |
| Registry address-change workflow | inbox-compromise | AMBIGUOUS |
| Freight forwarder (foreign) | foreign-institution | AMBIGUOUS |
| Local accomplice at institution | foreign-institution | MISSED |
| Residential (foreign, polygon exists) | foreign-institution | CAUGHT |
| Virtual office (foreign, polygon exists) | foreign-institution | CAUGHT |
| Carrier redirect | credential-compromise | MISSED |
| USPS COA redirect | credential-compromise | MISSED |
| Physical interception at institution | account-hijack | MISSED |
| Social-engineered address change | account-hijack | CAUGHT |
| Add persona to existing org + ship to host lab | it-persona-manufacturing | MISSED |
| Sibling org at same institution | it-persona-manufacturing | MISSED |
| Carrier rerouting | it-persona-manufacturing | MISSED |
| Ship to host lab address | visiting-researcher | MISSED |
| Off-campus virtual office | visiting-researcher | CAUGHT |
| Ship to alternate registered address | dormant-account-takeover | AMBIGUOUS |
| Address change to attacker destination | dormant-account-takeover | CAUGHT |

## bypass_methods_uncovered

- Bench-space lease at biotech incubator (biotech-incubator-tenant) — structural
- Physical interception / ship to institution address (account-hijack, it-persona-manufacturing, visiting-researcher, foreign-institution)
- Carrier-level redirect (credential-compromise, it-persona-manufacturing)
- Virtual-office paths where attacker claims own entity, not a real institution (cro-framing, cro-identity-rotation, shell-nonprofit)
- Small defunct labs with no OSM polygon (dormant-domain)

---

## Verdict: **PASS**

No Critical findings. The polygon-containment check is effective against its core use case: verifying that a shipping address is geographically associated with a claimed institution. It correctly catches virtual-office and off-campus addresses when the customer claims a known institution. Its MISSED cases are either structural (attacker operates from inside a real institution, carrier-level redirect) or policy-dependent (no institution claim by community-bio or CRO customers). Pipeline continues to stage 6.
