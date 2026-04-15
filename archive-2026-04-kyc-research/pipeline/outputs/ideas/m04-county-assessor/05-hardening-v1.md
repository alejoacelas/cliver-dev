# m04-county-assessor — Bypass-aware hardening v1

- **measure:** M04 — shipping-residential
- **idea:** County assessor parcel use-code (US)

---

## Attacker story walk

### community-bio-lab-network

**Story summary:** Attacker constructs community-bio LLC(s) and orders synthesis, using residential garage lab as shipping address.

**Bypass methods relevant to M04:**

1. **Real LLC + residential garage as stated lab address** — List the attacker's own residence framed as a "garage lab." Cost: ~$50–$100, no monthly address cost.

   **CAUGHT.** The parcel use-code lookup returns `lbcs_function` in the 1100–1900 (residential) range, firing `parcel_use_residential`. The implementation explicitly names this scenario and routes it to the carve-out review playbook. The check fires; whether the order is ultimately denied depends on the reviewer's judgment under the community-bio carve-out policy.

2. **Real LLC + maker space address** — Rent maker space membership, address resolves as commercial.

   **MISSED.** Maker space parcels carry commercial or industrial use codes. The parcel lookup returns a non-residential code, and the check clears. The attacker passes cleanly.

3. **Real LLC + coworking space at biotech cluster** — Commercial address, no CMRA flag.

   **MISSED.** Same logic — commercial parcel code, check clears.

4. **Real LLC + virtual office** — Virtual office address.

   **MISSED.** Virtual office buildings sit on commercially-coded parcels. The check clears. (CMRA detection is a separate M03 check, not covered by this idea.)

**Net assessment:** The check catches the cheapest residential-framing variant but the attacker can avoid it by spending $60–$500/mo on a maker space or coworking address. The check raises the floor cost from ~$50 to ~$770+/year but does not block the story.

---

### dormant-domain

**Story summary:** Attacker revives a defunct lab's domain and sources a geographically-consistent shipping address (residential, virtual office, or biotech coworking).

**Bypass methods relevant to M04:**

1. **Residential address (cheapest CMRA-flag-safe path, $0 marginal)** — Attacker lives in the target metro and uses their home address.

   **CAUGHT.** Parcel use-code is residential. `parcel_use_residential` fires.

2. **Virtual office ($100–$500/mo)** — Commercial building.

   **MISSED.** Commercial parcel code. Check clears.

3. **Biotech coworking ($500–$2,000/mo)** — Commercial building.

   **MISSED.** Commercial parcel code. Check clears.

**Net assessment:** Catches the cheapest sub-configuration (residential-colocation lucky case at $600–$2,000 total). The attacker can shift to a virtual office for $100–$500/mo to evade. Raises cost by at least $1,200/year.

---

### foreign-institution

**Story summary:** Attacker claims affiliation with a foreign academic institution and ships to a foreign or domestic address.

**Bypass methods relevant to M04:**

1. **Method 4: Residential address framed as researcher's home office** — Short-term rental or owned home.

   **CAUGHT (US addresses only).** If the address is in the US, parcel use-code returns residential. `parcel_use_residential` fires. **MISSED for non-US addresses** — county assessor data is US-only. The implementation acknowledges this as a structural gap.

2. **Method 1: In-country freight forwarder** — Commercial address.

   **MISSED.** Commercial parcel. Check clears (and only if the address is US-based, which for a foreign-institution story it usually is not).

3. **Method 5: Virtual office in institution's metro** — Commercial building.

   **MISSED.** Same.

**Net assessment:** Weak. The foreign-institution story's primary shipping paths are non-US, where this check provides zero signal. Even for US-based addresses, only the residential variant is caught.

---

### cro-framing

**Story summary:** Attacker stands up a real LLC framed as a small CRO with a virtual office, executive suite, or coworking address.

**Bypass methods relevant to M04:**

1. **Real US LLC + virtual office in a biotech metro** — Commercial building.

   **MISSED.** Commercial parcel code. Check clears.

2. **Real US LLC + non-CMRA executive suite** — Commercial building.

   **MISSED.** Same.

3. **Coworking-space lease** — Commercial building.

   **MISSED.** Same.

4. **FNR framing (residential sole-proprietor addresses)** — The branch notes ~15–30% of legitimate small-biz applicants may use residential addresses.

   **CAUGHT** for those who do ship to residential parcels. Fires `parcel_use_residential`.

**Net assessment:** This check does not catch the primary cro-framing bypass methods (virtual office, executive suite, coworking). It only catches the edge case where a CRO-framed attacker happens to ship to a residential address, which the branch itself treats as a secondary/fallback path.

---

### gradual-legitimacy-accumulation

**Story summary:** Attacker accumulates 12+ months of legitimate-looking history under a real LLC at a real address.

**Bypass methods relevant to M04:**

1. **Virtual office in a biotech metro (BASELINE)** — Commercial building.

   **MISSED.** Commercial parcel code. Check clears.

2. **Incubator bench (Branch D variant)** — Commercial/institutional building.

   **MISSED.** Institutional or commercial parcel code. Check clears.

3. **FNR framing: residential addresses in the manual-review escape hatch population.**

   **CAUGHT** for those actually shipping to residential parcels. But this branch's primary methods avoid residential.

**Net assessment:** The check is structurally irrelevant to this story's primary methods. All main paths use commercial addresses.

---

## Findings

### Finding 1 — Moderate: All commercial-address bypass methods pass cleanly

- **Source:** community-bio-lab-network (maker space, coworking), cro-framing (virtual office, executive suite, coworking), dormant-domain (virtual office, biotech coworking), gradual-legitimacy-accumulation (virtual office, incubator bench).
- **Why missed:** The parcel use-code check only distinguishes residential from non-residential. Any attacker spending $60–$500/mo on a commercial address evades completely. The field set (`lbcs_function`, `usecode`) has no granularity below "residential vs commercial vs mixed."
- **Severity: Moderate** (not Critical) because this check is not supposed to catch commercial-address paths — it is a residential-detection check. The gap is structural to the measure definition (M04 = "screen for residential"), not a failure of the implementation. Other ideas (M03 CMRA, M05 institution-association) cover virtual offices and commercial non-lab addresses.
- **Suggestion:** None — the implementation correctly scopes itself to residential detection. The gap is addressed by the measure stack, not by this individual idea.

### Finding 2 — Moderate: US-only coverage leaves foreign-institution story unaddressed

- **Source:** foreign-institution (all methods).
- **Why missed:** County assessor data is US-only. The implementation acknowledges this and lists no international equivalent.
- **Severity: Moderate.** The foreign-institution story's primary paths are inherently non-US. An international parcel-use equivalent does not exist in aggregated form. Other M04 checks (Google Places) provide partial international coverage.
- **Suggestion:** The implementation already degrades to `parcel_use_unknown_county` and routes to RDI fallback. For international addresses, routing to Google Places (m04-google-places-business) as the international fallback would be a tighter linkage, but this is a stage-7 synthesis concern, not a stage-4 re-research concern.

### Finding 3 — Minor: Community-bio carve-out policy creates an inherent pass-through for the community-bio-lab-network story

- **Source:** community-bio-lab-network residential variant.
- **Why ambiguous:** The implementation fires `parcel_use_residential` correctly, but the manual-review playbook includes a carve-out for "credible community-bio framing." The attacker's framing IS credible community-bio framing by construction. Whether the reviewer catches the attacker depends entirely on signals outside this check.
- **Severity: Minor.** The implementation correctly identifies this as a structural limitation and routes it to senior review. The gap is inherent in M04's design when applied to a customer class that legitimately operates from residential addresses.

---

## bypass_methods_known

| Bypass method | Story | Classification |
|---|---|---|
| Residential garage lab | community-bio-lab-network | CAUGHT |
| Maker space address | community-bio-lab-network | MISSED |
| Coworking at biotech cluster | community-bio-lab-network | MISSED |
| Virtual office | community-bio-lab-network | MISSED |
| Residential colocation ($0) | dormant-domain | CAUGHT |
| Virtual office ($100–$500/mo) | dormant-domain | MISSED |
| Biotech coworking ($500–$2k/mo) | dormant-domain | MISSED |
| Residential home office (US) | foreign-institution | CAUGHT |
| Residential home office (non-US) | foreign-institution | MISSED |
| Freight forwarder | foreign-institution | MISSED |
| Virtual office (foreign metro) | foreign-institution | MISSED |
| Virtual office (biotech metro) | cro-framing | MISSED |
| Executive suite | cro-framing | MISSED |
| Coworking lease | cro-framing | MISSED |
| Residential sole-proprietor | cro-framing | CAUGHT |
| Virtual office (baseline) | gradual-legitimacy-accumulation | MISSED |
| Incubator bench | gradual-legitimacy-accumulation | MISSED |
| Residential (FNR edge) | gradual-legitimacy-accumulation | CAUGHT |

## bypass_methods_uncovered

- Maker space address (community-bio-lab-network)
- Coworking at biotech cluster (community-bio-lab-network)
- Virtual office (community-bio-lab-network, dormant-domain, cro-framing, gradual-legitimacy-accumulation, foreign-institution)
- Biotech coworking (dormant-domain)
- Executive suite (cro-framing)
- Coworking lease (cro-framing)
- Freight forwarder (foreign-institution)
- Incubator bench (gradual-legitimacy-accumulation)
- All non-US addresses (foreign-institution)

---

## Verdict: **PASS**

No Critical findings. The implementation correctly identifies and catches residential addresses within its US scope. All MISSED bypasses involve commercial addresses, which are structurally outside M04's residential-detection mandate. Pipeline continues to stage 6.
