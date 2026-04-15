# m04-usps-rdi — Bypass-aware hardening v1

- **measure:** M04 — shipping-residential
- **idea:** USPS RDI residential indicator (via Smarty / Melissa)

---

## Attacker story walk

### community-bio-lab-network

**Story summary:** Attacker constructs community-bio LLC(s) and ships from residential, maker space, coworking, or virtual office addresses.

**Bypass methods relevant to M04:**

1. **Residential garage lab (own home).**

   **CAUGHT.** `metadata.rdi == "Residential"` fires `address_is_residential`. The implementation routes this to institution-class-aware review, including the community-bio carve-out.

2. **Maker space address** — Commercial under USPS classification.

   **MISSED.** `metadata.rdi == "Commercial"`. Check clears. The attacker story explicitly notes "the address resolves as commercial under USPS CMRA classification."

3. **Coworking at biotech cluster** — Commercial.

   **MISSED.** Same — commercial RDI. Check clears.

4. **Virtual office** — Commercial building, but CMRA flag is separate (M03).

   **MISSED.** RDI returns "Commercial." The `cmra` flag is in the same Smarty response but is covered by a different idea (m03-usps-rdi-cmra), not by this check.

**Net assessment:** Catches residential variant. All commercial-address variants pass. Identical structural coverage to m04-county-assessor.

---

### dormant-domain

**Story summary:** Attacker revives defunct lab, sources address (residential, virtual office, biotech coworking).

**Bypass methods relevant to M04:**

1. **Residential colocation ($0).**

   **CAUGHT.** RDI = Residential. Flag fires.

2. **Virtual office ($100–$500/mo).**

   **MISSED.** RDI = Commercial.

3. **Biotech coworking ($500–$2k/mo).**

   **MISSED.** RDI = Commercial.

**Net assessment:** Catches cheapest path (residential). Commercial paths evade.

---

### foreign-institution

**Story summary:** Attacker claims foreign affiliation, ships to foreign or domestic addresses.

**Bypass methods relevant to M04:**

1. **Method 4: Residential address (US-based).**

   **CAUGHT.** RDI = Residential. Flag fires.

2. **Method 4: Residential address (non-US).**

   **MISSED.** RDI is a USPS product. Zero coverage outside the US. The implementation explicitly notes "US-only: RDI is a USPS product. International addresses get no signal."

3. **Methods 1, 5 (freight forwarder, virtual office).**

   **MISSED.** Commercial addresses, even if US-based.

**Net assessment:** Same as county-assessor — catches US residential only. Structurally blind to international addresses.

---

### cro-framing

**Story summary:** LLC framed as CRO, virtual office/executive suite/coworking.

**Bypass methods relevant to M04:**

1. **Virtual office / executive suite / coworking — all commercial.**

   **MISSED.** RDI = Commercial for all three. Check clears.

2. **FNR edge (residential sole-proprietor).**

   **CAUGHT.** RDI = Residential. Flag fires.

**Net assessment:** Does not catch primary methods. Only catches the edge case.

---

### gradual-legitimacy-accumulation

**Story summary:** 12+ months at virtual office or incubator bench.

**Bypass methods relevant to M04:**

1. **Virtual office (baseline) / incubator bench.**

   **MISSED.** RDI = Commercial.

2. **Residential edge (FNR).**

   **CAUGHT.** RDI = Residential.

**Net assessment:** Irrelevant to primary methods.

---

## Findings

### Finding 1 — Moderate: RDI's binary signal is functionally identical to county-assessor's residential detection, with higher coverage but lower granularity

- **Source:** All stories.
- **Why relevant:** RDI returns a single bit (Residential/Commercial). County assessor returns richer data (use code, owner, lot size). For bypass-detection purposes the two checks have identical hit/miss profiles across every attacker story in the mapping. The implementation correctly notes they should be cross-checked, but in terms of bypass coverage, RDI adds no bypasses caught that county-assessor misses, and vice versa.
- **Severity: Moderate.** Not a bypass gap per se — the two checks are complementary in coverage reliability (RDI has higher US address coverage than county-assessor aggregators), but identical in bypass-detection surface. Stage 7 should note the redundancy.
- **Suggestion:** None for re-research. The value of RDI over county-assessor is availability and cost ($0.001–$0.005/check vs $80K/year for Regrid), not additional bypass detection.

### Finding 2 — Moderate: US-only limitation structurally unaddressable

- **Source:** foreign-institution (all methods).
- **Why missed:** Same as county-assessor Finding 2. USPS data does not exist for non-US addresses.
- **Severity: Moderate.** Structural, not a stage-4 implementation gap.

### Finding 3 — Minor: Mixed-use buildings may produce unreliable RDI

- **Source:** Implementation § failure_modes.
- **Why ambiguous:** "A building with apartments above a lab gets a single building-level RDI; unit-level RDI is less reliable." The implementation does not specify what happens when RDI returns "Residential" for a mixed-use building where the customer's unit is genuinely a lab. This could fire a false positive that, after repeated occurrences, causes reviewer fatigue and weakens the flag.
- **Severity: Minor.** The implementation correctly routes to human review rather than auto-deny.

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

No Critical findings. The implementation correctly detects US residential addresses via a well-documented, low-cost vendor path. Its MISSED bypasses are identical to county-assessor's — all involve commercial addresses or non-US addresses, which are structurally outside M04's residential-detection scope. Pipeline continues to stage 6.
