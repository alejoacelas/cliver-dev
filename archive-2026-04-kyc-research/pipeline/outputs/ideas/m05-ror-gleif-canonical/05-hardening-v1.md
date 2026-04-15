# m05-ror-gleif-canonical — Bypass-aware hardening v1

- **measure:** M05 — shipping-institution-association
- **idea:** ROR / GLEIF / Companies House canonical address cross-reference

---

## Attacker story walk

### biotech-incubator-tenant

**Story summary:** Attacker leases bench space at a recognized biotech incubator under an LLC. The LLC's registered address IS the incubator building.

**Bypass methods relevant to M05:**

1. **Bench-space lease at a recognized biotech incubator.**

   **MISSED.** The attacker's LLC will NOT be in ROR (not a research organization). It will NOT be in GLEIF (no LEI — small biotech LLCs rarely have one). It MAY be in Companies House if UK-based, or in a state LLC registry if US-based — but Companies House is UK-only and state registries are not queried by this idea. Result: `institution_no_canonical_record` fires, routing to fallback. The fallback does not block the attacker — it routes to other M05/M09 checks. The implementation notes: "partial catch depending on whether the LLC matches some registry record at the incubator address."

2. **Standalone rented lab / sublet.**

   **MISSED.** Same — the LLC has no ROR/GLEIF/Companies House record in most cases.

**Net assessment:** The check produces `institution_no_canonical_record` for the attacker's LLC, which is a useful signal (a claimed "biotech company" with no canonical record is noteworthy), but it is the same signal produced by many legitimate small biotech startups. The flag is not distinguishing.

---

### community-bio-lab-network

**Story summary:** Community-bio LLC, maker space / coworking / virtual office / residential address.

**Bypass methods relevant to M05:**

1. **All address variants (maker space, coworking, virtual office, residential).**

   **MISSED.** The community-bio LLC has no ROR record, no GLEIF LEI, and (if US-based) no Companies House record. `institution_no_canonical_record` fires. But this is the expected signal for the entire legitimate community-bio customer class. The implementation notes: "the LLC's registered address matches the maker space" — if any registry were consulted, the addresses would match because the attacker uses the LLC's own registered address.

**Net assessment:** The check produces the same `institution_no_canonical_record` signal for attacker and legitimate community-bio customer alike. No distinguishing power.

---

### shell-nonprofit

**Story summary:** Shell entity registered to virtual office in biotech metro.

**Bypass methods relevant to M05:**

1. **Real entity registration + virtual office shipping.**

   **MISSED.** The implementation is explicit: "The check passes the attacker. Structural gap: the check verifies registry-claimed address matches shipping address; it doesn't verify the address is real lab space." If the shell LLC registers its address as the virtual office, and the provider queries the LLC's own registry record, the registered address matches the shipping address. The attacker passes cleanly.

   For US LLCs: the state registry (not queried by this idea) would show the registered address. For UK CICs: Companies House would show the registered office, which is the virtual office. The shipping address matches the registered address. `canonical_address_mismatch` does NOT fire.

**Net assessment:** The check is structurally defeated. The attacker registers the same address they ship to.

---

### cro-framing

**Story summary:** LLC framed as CRO, virtual office/executive suite/coworking.

**Bypass methods relevant to M05:**

1. **Virtual office / executive suite / coworking.**

   **MISSED.** Same as shell-nonprofit. The CRO LLC's registered address IS the virtual office. If Companies House (UK) or equivalent (if queried) shows the registered address, it matches the shipping address. No mismatch fires.

   For US LLCs without Companies House records: `institution_no_canonical_record` fires, which routes to fallback — but the same signal fires for legitimate small CROs.

**Net assessment:** Does not catch. Registry-address-matches-shipping is the expected output for any entity that ships to its own registered address.

---

### cro-identity-rotation

**Story summary:** Multiple LLCs, each with its own real address.

**Bypass methods relevant to M05:**

1. **Virtual office per LLC (cheapest).**

   **MISSED.** Each LLC's registered address matches its virtual office. If queried, no mismatch. Most will show `institution_no_canonical_record` since they have no ROR/GLEIF record.

2. **Coworking space.**

   **MISSED.** Same.

**Net assessment:** Each rotated LLC independently passes (or fires the uninformative `institution_no_canonical_record`).

---

### dormant-domain

**Story summary:** Revived defunct lab, address sourced from residential/virtual/biotech-coworking.

**Bypass methods relevant to M05:**

1. **Bypass A (self-register revived lab) + Bypass B (new address different from old lab location).**

   **CAUGHT** if the defunct lab has an old ROR record with a location in a different city than the attacker's new address. ROR v2's city-level location data would show the original lab was in, say, Tucson, while the attacker ships from Denver. `canonical_address_mismatch` fires for a different-city match.

   **MISSED** if (a) the defunct lab has no ROR record, or (b) the attacker happens to be in the same city as the old lab (the "residential-colocation lucky case" explicitly assumes the attacker lives in the original lab's metro).

**Net assessment:** Partially effective. ROR city-level matching catches geographic mismatches for defunct labs that had ROR records. But the cheapest dormant-domain sub-configuration specifically co-locates in the same metro, defeating the city-level check.

---

### inbox-compromise

**Story summary:** Compromised .edu inbox, ships to CMRA/virtual office in institution's metro.

**Bypass methods relevant to M05:**

1. **CMRA / virtual office in institution's metro.**

   **AMBIGUOUS.** The institution IS in ROR (it is a real university). The canonical address from ROR is city-level. The CMRA is in the same city. Since ROR v2 only provides city-level location, a same-city CMRA would fall within the <5km "soft pass" tolerance. `canonical_address_mismatch` likely does NOT fire for a same-city address.

   **CAUGHT** only if the CMRA is in a different city from the university, which the attacker story specifically avoids ("CMRA... in the target college's town").

2. **Registry address-change workflow.**

   **AMBIGUOUS.** Depends on whether the changed address is re-checked against the canonical address and whether it is in the same city.

**Net assessment:** Weak. ROR's city-level granularity means any address in the same city as the institution passes. The attacker specifically selects a same-city CMRA.

---

### foreign-institution

**Story summary:** Attacker claims foreign affiliation, ships to various addresses.

**Bypass methods relevant to M05:**

1. **Method 1: In-country freight forwarder.**

   **AMBIGUOUS.** If the forwarder is in the same city as the institution, ROR city-level match passes. If in a different city, `canonical_address_mismatch` fires.

2. **Method 2: Real institution address + local accomplice.**

   **MISSED.** The address IS the institution. Perfect match.

3. **Method 4: Residential address in institution's area.**

   **AMBIGUOUS.** Same city → passes at ROR city level. Different city → caught.

4. **Method 5: Virtual office in institution's metro.**

   **AMBIGUOUS.** Same city → passes at ROR city level.

**Net assessment:** ROR's city-level granularity makes this check ineffective against any same-city bypass. The foreign-institution story's methods are specifically designed to use same-metro addresses.

---

### credential-compromise

**Story summary:** Compromised PI account, carrier redirect.

**Bypass methods relevant to M05:**

1. **Carrier redirect / USPS COA.**

   **MISSED.** Post-approval transit diversion. The canonical-address check runs at order time against the registered address (which is the institution). Carrier redirect happens after.

**Net assessment:** Irrelevant — transit-layer bypass.

---

### account-hijack

**Story summary:** Hijacked PI account, physical interception or address change.

**Bypass methods relevant to M05:**

1. **Physical interception at institutional address.**

   **MISSED.** Address matches institution. Check passes.

2. **Social-engineered address change to drop address.**

   **CAUGHT** if the new "satellite facility" address is in a different city from the institution's ROR-listed location. The implementation notes: "account-hijack Method 2 — the satellite address won't match the institution's ROR record → CATCHES (in the city-level sense)."

   **MISSED** if the drop is in the same city.

**Net assessment:** Catches cross-city address changes. Misses same-city drops.

---

### it-persona-manufacturing

**Story summary:** Fake persona inside real institution, ships to host lab.

**Bypass methods relevant to M05:**

1. **Ship to host lab / sibling org at same institution.**

   **MISSED.** The host institution IS in ROR. The host lab building IS in the same city. Check passes. The implementation notes: "the host institution IS in ROR; the address IS at the institution; check PASSES the attacker."

2. **Carrier rerouting.**

   **MISSED.** Post-approval.

**Net assessment:** Does not catch. Attacker operates from inside the real institution.

---

### visiting-researcher

**Story summary:** Visiting researcher, ships to host lab or off-campus virtual office.

**Bypass methods relevant to M05:**

1. **Host lab address.**

   **MISSED.** Address is at the institution. Check passes.

2. **Off-campus virtual office in university's metro.**

   **MISSED at city level.** Virtual office is in the same city as the university. ROR city-level match passes.

**Net assessment:** Does not catch. Both paths are same-city.

---

### dormant-account-takeover

**Story summary:** Dormant account takeover, inherited addresses or address change.

**Bypass methods relevant to M05:**

1. **Alternate registered address (inherited).**

   **AMBIGUOUS.** If the alternate address was in a different city from the institution's canonical, the check would catch on re-evaluation. But inherited alternate addresses were previously approved.

2. **Address change to attacker destination.**

   **CAUGHT** if the new address is in a different city. **MISSED** if same city.

**Net assessment:** Depends on geographic distance of the address change.

---

### gradual-legitimacy-accumulation

**Story summary:** 12+ months at virtual office or incubator bench.

**Bypass methods relevant to M05:**

1. **Virtual office (baseline) / incubator bench.**

   **MISSED.** The attacker's LLC has no ROR/GLEIF record. `institution_no_canonical_record` fires but is uninformative (same signal as legitimate startups).

**Net assessment:** Does not catch.

---

## Findings

### Finding 1 — Critical: ROR v2's city-level-only location data makes the check ineffective against same-city bypass methods, which are the dominant attacker strategy

- **Source:** inbox-compromise (same-city CMRA), foreign-institution (same-metro freight forwarder, residential, virtual office), visiting-researcher (same-metro virtual office), dormant-domain (same-metro residential colocation), account-hijack (same-city drop).
- **Why missed:** ROR v2 removed street-level addresses. The `locations[]` field provides only `geonames_details` with city, country, and lat/lng for the city centroid. The implementation's tolerance logic (same city <5km = "soft pass") means ANY address within the institution's city passes. Attacker stories are specifically designed to use same-city addresses — "CMRA in the target college's town," "virtual office in institution's metro," etc.
- **Severity: Critical.** This is the check's primary mechanism (canonical-address-vs-shipping-address distance), and it is structurally limited to city-level granularity for the ROR source, which is the highest-coverage source for research institutions. GLEIF provides street-level addresses but has very low coverage for the institution types in the mapping (universities, small labs). Companies House provides street-level but is UK-only. The net effect is that the street-level matching that would catch same-city bypasses is available for a small fraction of institutions.
- **Suggestion for re-research:** Stage 4 should explicitly quantify what fraction of institutions in the customer base have GLEIF or Companies House records (i.e., what fraction get street-level matching). If that fraction is below ~20%, the check's effective resolution for most institutions is city-level, and the implementation should be reframed as a city-level association check (catching only cross-city mismatches) rather than an address-level check. Additionally, stage 4 should investigate whether ROR's `geonames_id` can be used to pull the GeoNames entry, which sometimes includes more specific location data (e.g., for university-type entries that GeoNames maps to a specific lat/lng rather than city centroid). This would not provide street-level, but could narrow to campus-level for some institutions.

### Finding 2 — Moderate: `institution_no_canonical_record` fires for most small entities (attacker and legitimate alike), providing no distinguishing signal

- **Source:** biotech-incubator-tenant, community-bio-lab-network, cro-framing, cro-identity-rotation, shell-nonprofit, gradual-legitimacy-accumulation.
- **Why missed:** Small biotech LLCs, community-bio entities, and shell entities do not have ROR or GLEIF records. The flag fires identically for attacker and legitimate customer. The implementation correctly routes to fallback (other M05/M09 checks), but the check itself contributes zero signal.
- **Severity: Moderate.** Expected for a registry-based check: registries cover established institutions, not new/small entities. The gap is filled by other ideas. Not a stage-4 implementation flaw.

### Finding 3 — Moderate: Shell entities pass by construction (registered address = shipping address)

- **Source:** shell-nonprofit, cro-framing.
- **Why missed:** The check verifies that shipping address matches the institution's registry address. For entities that register to a virtual office and ship to the same virtual office, the check passes them positively. The implementation correctly identifies this: "the check verifies registry-claimed address matches shipping address; it doesn't verify the address is real lab space."
- **Severity: Moderate.** Structural to the design of canonical-address matching. The check catches claims of affiliation with institutions the attacker does NOT control, but passes entities the attacker DOES control. Other checks (M09 institution-legitimacy, M04 residential detection) must fill this gap.

### Finding 4 — Moderate: Carrier-redirect bypasses are post-check

- **Source:** credential-compromise, it-persona-manufacturing.
- **Why missed:** Transit-layer diversion. Structural — no provider-side address check can detect carrier-level redirect.
- **Severity: Moderate.** Same cross-cutting gap as in m05-google-places-campus.

---

## bypass_methods_known

| Bypass method | Story | Classification |
|---|---|---|
| Bench-space lease (no ROR/GLEIF) | biotech-incubator-tenant | MISSED |
| All addresses (no ROR/GLEIF) | community-bio-lab-network | MISSED |
| Registered address = shipping (virtual office) | shell-nonprofit | MISSED |
| Registered address = shipping (virtual office) | cro-framing | MISSED |
| Virtual office per rotated LLC (no ROR/GLEIF) | cro-identity-rotation | MISSED |
| New address, different city from defunct lab (in ROR) | dormant-domain | CAUGHT |
| New address, same city as defunct lab | dormant-domain | MISSED |
| Defunct lab not in ROR | dormant-domain | MISSED |
| Same-city CMRA | inbox-compromise | MISSED |
| Same-city freight forwarder | foreign-institution | MISSED |
| Local accomplice at institution | foreign-institution | MISSED |
| Same-city residential | foreign-institution | MISSED |
| Same-city virtual office | foreign-institution | MISSED |
| Cross-city address (any method) | foreign-institution | CAUGHT |
| Carrier redirect | credential-compromise | MISSED |
| Physical interception | account-hijack | MISSED |
| Cross-city address change | account-hijack | CAUGHT |
| Same-city drop | account-hijack | MISSED |
| Ship to host lab | it-persona-manufacturing | MISSED |
| Carrier rerouting | it-persona-manufacturing | MISSED |
| Host lab address | visiting-researcher | MISSED |
| Same-city virtual office | visiting-researcher | MISSED |
| Inherited address | dormant-account-takeover | AMBIGUOUS |
| Cross-city address change | dormant-account-takeover | CAUGHT |
| Virtual office / incubator (no ROR/GLEIF) | gradual-legitimacy-accumulation | MISSED |

## bypass_methods_uncovered

- All same-city bypass methods (inbox-compromise, foreign-institution, visiting-researcher, dormant-domain colocation, account-hijack same-city drop) — limited by ROR city-level granularity
- Entities with no canonical record (biotech-incubator-tenant, community-bio-lab-network, cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation)
- Shell entities whose registry address matches shipping (shell-nonprofit, cro-framing)
- Carrier-level redirect (credential-compromise, it-persona-manufacturing)
- Inside-institution paths (it-persona-manufacturing, visiting-researcher host lab)

---

## Verdict: **RE-RESEARCH**

One Critical finding. ROR v2's city-level-only location data means the check's primary matching mechanism cannot distinguish same-city bypass addresses from legitimate institutional addresses. Since the dominant attacker strategy across multiple stories is specifically to use same-city addresses, this is not an edge case — it is the central limitation. Stage 4 re-research should (1) quantify GLEIF/Companies House coverage for the relevant institution types, (2) investigate GeoNames granularity via ROR's `geonames_id`, and (3) reframe the implementation's effective resolution to match the actual data available. One re-research loop permitted.
