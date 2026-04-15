# m04-google-places-business — Bypass-aware hardening v1

- **measure:** M04 — shipping-residential
- **idea:** Google Places business presence

---

## Attacker story walk

### community-bio-lab-network

**Story summary:** Attacker constructs community-bio LLC(s) and orders synthesis from residential, maker space, coworking, or virtual office addresses.

**Bypass methods relevant to M04:**

1. **Residential garage lab** — No business at address.

   **CAUGHT.** Nearby Search at the residential address returns zero business results (or only residential-type results). `no_places_business_at_address` or `places_category_residential` fires.

2. **Maker space address** — Maker space likely has a Places listing (commercial business).

   **MISSED.** Nearby Search returns the maker space as a commercial business. Types like `community_center` or `gym` or `establishment` would be present. There is no specific "this is not a lab" check — the implementation fires on absence of business or residential-type category, not on presence-of-wrong-business. A maker space that shows up as a business clears the check.

3. **Coworking at biotech cluster** — Commercial building, has Places listing.

   **MISSED.** Nearby Search returns the coworking brand (e.g., WeWork). Types include `office` or similar commercial categories. Check clears.

4. **Virtual office** — Places lists Regus/IWG as commercial business at the address.

   **MISSED.** The implementation explicitly notes: "cro-framing virtual office method: would PASS (Places lists Regus etc. as commercial)."

**Net assessment:** Catches the residential variant (no business at address). All commercial-address variants pass because they have legitimate Places listings. Same structural limitation as the county-assessor check, but expressed through a different signal.

---

### dormant-domain

**Story summary:** Attacker revives defunct lab, sources address (residential, virtual office, biotech coworking).

**Bypass methods relevant to M04:**

1. **Residential colocation ($0)** — No business at residential address.

   **CAUGHT.** `no_places_business_at_address` fires.

2. **Virtual office ($100–$500/mo)** — Places lists the virtual-office operator.

   **MISSED.** Commercial listing present. Check clears.

3. **Biotech coworking ($500–$2k/mo)** — Places lists the coworking facility.

   **MISSED.** The implementation notes the biotech-coworking variant "probably passes."

**Net assessment:** Catches residential; misses commercial. Same pattern.

---

### foreign-institution

**Story summary:** Attacker claims foreign affiliation, ships to various foreign or domestic addresses.

**Bypass methods relevant to M04:**

1. **Method 4: Residential address (short-term rental or home).**

   **AMBIGUOUS.** Depends on Places coverage at the specific foreign address. The implementation notes "uneven Places coverage internationally — weak signal." In OECD urban areas, likely CAUGHT (no business at residential address). In non-OECD rural areas, Places coverage may be too sparse for any result, producing a false "no business" signal that is indistinguishable from a real residential flag.

2. **Method 1: In-country freight forwarder** — Commercial address.

   **MISSED.** Forwarder has a commercial Places listing. Check clears.

3. **Method 5: Virtual office in institution's metro.**

   **MISSED.** Virtual office operator listed. Check clears.

4. **Method 2: Real institution address + local accomplice.**

   **MISSED.** The real institution address has a Places listing. Check clears (and should — the address IS institutional).

**Net assessment:** Weak internationally due to coverage gaps. Residential variant is caught in well-covered areas only.

---

### cro-framing

**Story summary:** LLC framed as CRO, virtual office/executive suite/coworking address.

**Bypass methods relevant to M04:**

1. **Virtual office in biotech metro** — Regus/IWG listed on Places.

   **MISSED.** The implementation explicitly acknowledges this passes.

2. **Executive suite** — Commercial listing present.

   **MISSED.** Check clears.

3. **Coworking (WeWork etc.)** — Commercial listing present.

   **MISSED.** Check clears.

4. **FNR framing (residential sole-proprietor edge cases).**

   **CAUGHT.** No business at residential address.

**Net assessment:** Does not catch primary CRO-framing methods.

---

### gradual-legitimacy-accumulation

**Story summary:** 12+ months of history at a real address before SOC order.

**Bypass methods relevant to M04:**

1. **Virtual office (baseline)** — Commercial listing.

   **MISSED.** Check clears.

2. **Incubator bench** — Incubator has a prominent Places listing.

   **MISSED.** Check clears (and correctly — the incubator is a real business at the address).

3. **Residential edge case (FNR).**

   **CAUGHT.** No business at residential address.

**Net assessment:** Irrelevant to this story's primary methods.

---

## Findings

### Finding 1 — Moderate: "Category mismatch" flag lacks a definition of what categories are suspicious for a claimed lab

- **Source:** community-bio-lab-network (maker space), cro-framing (virtual office).
- **Why the implementation misses it:** The `places_category_mismatch` flag is defined as "matched place has type incompatible with claimed institution (e.g., customer claims 'BioLabs SD' but matched place is 'Starbucks')." But no list of incompatible types is specified. A virtual-office operator (Regus) at a claimed CRO's address should arguably fire `places_category_mismatch` — the customer claims a CRO but the Place is a serviced-office provider. The implementation does not pin this down.
- **Severity: Moderate.** If the category-mismatch logic were tightened (e.g., flag when the Place name is a known virtual-office brand), this check could catch some virtual-office paths. But this would also fire on many legitimate startups at WeWork/Regus, creating a high FP rate. The gap is more of a refinement than a structural miss.
- **Suggestion:** Stage 4 re-research could add a "virtual-office brand list" to the `places_category_mismatch` logic, with a soft-flag rather than hard-flag severity. This would link to M03's CMRA detection for a stronger combined signal.

### Finding 2 — Minor: International coverage gap acknowledged but not quantified

- **Source:** foreign-institution (all methods).
- **Why ambiguous:** The implementation says Places coverage is "uneven" internationally but provides no proxy for the coverage rate. Stage 6 should quantify this.
- **Severity: Minor.** This is a coverage-research gap, not a bypass gap.

### Finding 3 — Minor: ToS structural risk could render the entire idea undeployable

- **Source:** All stories.
- **Why ambiguous:** The implementation flags the Google Maps Platform ToS restriction but calls it a "structural ToS risk" without a verdict. If legal review concludes the use is prohibited, every CAUGHT classification above becomes moot.
- **Severity: Minor** for bypass-hardening purposes (the check works if deployed; the question is whether it CAN be deployed). This is a stage-7 open issue, not a bypass gap.

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
| Residential (OECD urban) | foreign-institution | CAUGHT |
| Residential (non-OECD/rural) | foreign-institution | AMBIGUOUS |
| Freight forwarder | foreign-institution | MISSED |
| Virtual office (foreign metro) | foreign-institution | MISSED |
| Local accomplice at institution | foreign-institution | MISSED |
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
- Local accomplice at institution (foreign-institution)
- Incubator bench (gradual-legitimacy-accumulation)

---

## Verdict: **PASS**

No Critical findings. The implementation correctly catches the residential-address signal it is designed to detect. MISSED bypasses all involve commercial addresses with legitimate Places listings, which is structurally outside the check's detection surface. The category-mismatch refinement (Finding 1) is a Moderate suggestion that could tighten coverage but does not rise to Critical. Pipeline continues to stage 6.
