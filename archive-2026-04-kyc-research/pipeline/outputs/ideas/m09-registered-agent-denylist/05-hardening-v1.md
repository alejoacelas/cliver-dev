# m09-registered-agent-denylist — bypass-aware hardening v1

- **measure:** M09 — institution-real-life-sciences
- **name:** Mass-formation registered agent + virtual-office / CMRA denylist
- **idea file:** `04-implementation-v1.md`

---

## Attacker story walk-through

### 1. shell-company

**Summary:** Purpose-built Delaware LLC with virtual office or co-working lab bench in a biotech hub.

**Bypass methods relevant to this measure:**

- **Build entity signals from scratch — virtual-office tier:** "Rents either a virtual office or a co-working lab bench in a biotech hub (Boston, San Diego, RTP, Bay Area)."
  - `registered_agent_mass_formation`: **CAUGHT.** If the attacker uses a mass-formation agent (Northwest, Incfile/Bizee, ZenBusiness) for the Delaware LLC, this flag fires. Delaware LLCs *require* a registered agent, and mass-formation services are the cheapest option ($150–$300/yr).
  - `address_virtual_office`: **CAUGHT** for the virtual-office tier. Regus/IWG, Davinci, Alliance are on the denylist. Smarty CMRA flag would identify the address.
  - `address_virtual_office`: **MISSED** for the co-working lab bench tier. Biotech co-working spaces (LabCentral, BioLabs, Genspace) are not CMRAs, are not virtual offices, and are not on the denylist. The implementation explicitly notes this gap: "Coworking biotech labs (LabCentral, BioLabs, Genspace) — not CMRA, not mass-formation, but functionally a 'shared address' pattern."
  - **Net: CAUGHT for virtual-office path; MISSED for co-working-lab path.**

- **Acquire an existing company (Bypass 2):**
  - **(a) Dormant micro-CRO:** May have its own registered address (not a mass-formation agent). The attacker can retain the original address.
    - **Classification: MISSED.** If the acquired entity has a non-virtual registered address, no flags fire.
  - **(b) Going-concern:** Same — inherited address likely passes.
    - **Classification: MISSED.**

**Net assessment:** The check catches the cheapest shell path (mass-formation agent + virtual office) but misses the lab-bench upgrade and the acquisition path. Since the virtual-office tier is priced at $5–15K and the lab-bench tier at $30–70K, the check imposes an effective cost floor by forcing the attacker to upgrade from the cheapest option.

---

### 2. shell-nonprofit

**Summary:** Research nonprofit with virtual-office shipping.

**Bypass methods relevant to this measure:**

- **Real-entity registration with virtual-office shipping:** "Rents a virtual office in a biotech metro... virtual office $600–$3,000 over 4–6 months."
  - `registered_agent_mass_formation`: **CAUGHT** if filing via mass-formation service.
  - `address_virtual_office`: **CAUGHT** if using Regus/IWG/Davinci/Alliance (on denylist) or any USPS-listed CMRA (Smarty flag).

- **If the attacker rents from a small, local virtual-office provider not on the denylist:**
  - `address_virtual_office`: **AMBIGUOUS.** The Smarty CMRA flag would catch USPS-registered CMRAs, but small private mailbox services that haven't registered with USPS as CMRAs produce false negatives. The implementation notes: "CMRA false negatives — small private mailbox services that haven't registered as CMRAs with USPS will not show the cmra flag."

**Net assessment:** Catches the standard virtual-office path via the major chains and CMRA flag. Small/unregistered private mailbox services are a gap.

---

### 3. cro-framing

**Summary:** Real LLC as CRO, virtual office in biotech metro.

**Bypass methods relevant to this measure:**

- **Real LLC + virtual office in biotech metro:** "Regus virtual office in California from ~$50–$60/month."
  - `registered_agent_mass_formation`: **CAUGHT** (mass-formation agent for LLC filing).
  - `address_virtual_office`: **CAUGHT** (Regus is on the denylist; Smarty CMRA flag fires).

- **However:** The implementation notes that "mass agents legitimately serve thousands of real small businesses" and the playbook says mass-formation flag alone is "non-blocking on its own." Many real small CROs also use mass-formation agents and virtual offices.
  - **Classification: CAUGHT but noisy.** High false-positive rate in the small-CRO population.

**Net assessment:** The check fires correctly, but the signal is noisy because the legitimate small-CRO population has the same pattern. Value depends on combination with other M09 signals.

---

### 4. cro-identity-rotation

**Summary:** 2–4 CRO LLCs, each with virtual office.

**Bypass methods relevant to this measure:**

- **Real LLC + virtual office (per entity):** Same as cro-framing per entity.
  - **Classification: CAUGHT** (per entity).

- **Cross-entity pattern:** The `address_high_density_registrations` flag (OpenCorporates > 100 companies at same address) would fire for virtual-office addresses that host many LLCs.
  - **Classification: CAUGHT** — but this catches the address, not the cross-entity pattern of the same attacker operating multiple entities.

**Net assessment:** Same as cro-framing per entity. The rotation pattern is not directly detected (no cross-provider signal), but each entity individually gets flagged.

---

### 5. biotech-incubator-tenant

**Summary:** LLC leases bench space at a recognized biotech incubator.

**Bypass methods relevant to this measure:**

- **Bench-space lease at recognized biotech incubator:** LabCentral ($4,600/month), BioLabs ($2,200/month). The incubator address is a real commercial building, not a CMRA or virtual office.
  - `registered_agent_mass_formation`: **CAUGHT** if the LLC is filed with a mass-formation agent. But the registered-agent address (statutory requirement) is often different from the business/shipping address. The LLC's *registered agent* may be Northwest/Bizee, while the *business address* is LabCentral.
  - `address_virtual_office`: **MISSED.** Biotech incubator addresses are not CMRAs, not virtual offices, and not on the denylist. The implementation explicitly flags this: "Coworking biotech labs... Need a separate enriched list of biotech-incubator addresses."
  - `address_high_density_registrations`: **AMBIGUOUS.** Biotech incubators host dozens of companies at one address — OpenCorporates might show > 100 registrations. But this also catches legitimate co-working spaces.

**Net assessment:** The incubator address is the load-bearing bypass for this check. The implementation acknowledges this gap. The registered-agent flag fires on the statutory agent but not on the operational address. Effective for the registered-agent dimension; blind for the business-address dimension.

---

### 6. gradual-legitimacy-accumulation

**Summary:** Real-but-hollow biotech with virtual office or incubator bench.

**Bypass methods relevant to this measure:**

- **Virtual office in biotech metro (BASELINE, Method 1):** "$49/month" for basic virtual office.
  - `address_virtual_office`: **CAUGHT.** Standard chain virtual offices are on the denylist; CMRA flag fires.

- **Incubator bench (Branch D variant, Method 2):** LabCentral, regional incubators ($500–$3,000/month).
  - `address_virtual_office`: **MISSED.** Same gap as biotech-incubator-tenant.

**Net assessment:** Catches the baseline virtual-office path; misses the incubator upgrade. The incubator upgrade costs $500–$4,600/month, so the check imposes a cost floor.

---

### 7. community-bio-lab-network

**Summary:** Community-bio labs at maker-space addresses.

**Bypass methods relevant to this measure:**

- **Real LLC + maker space address:** "Rent a maker space membership in a biotech-adjacent metro — for example, Clear Creek Makerspace in the Denver area at $60/month."
  - `registered_agent_mass_formation`: **CAUGHT** if using mass-formation agent for the LLC filing.
  - `address_virtual_office`: **MISSED.** Maker spaces are not CMRAs, not virtual offices, not on the denylist. They are real physical locations.
  - `address_high_density_registrations`: **AMBIGUOUS.** Depends on how many LLCs are registered at the maker-space address.

**Net assessment:** The maker-space address bypasses the virtual-office denylist. Same structural gap as biotech incubators — real shared physical spaces that are not CMRAs. The implementation would need a separate "shared-workspace" enrichment to detect these.

---

### 8. dormant-domain

**Summary:** Acquires lapsed domain of defunct research entity.

**Bypass methods relevant to this measure:**

- **Self-register the revived lab:** If the attacker files a new entity to match the defunct entity's name, they may use a mass-formation agent and virtual office.
  - `registered_agent_mass_formation`: **CAUGHT** if using mass-formation agent.
  - `address_virtual_office`: **CAUGHT** if using virtual office.

- **If the attacker operates from a real address (rented office, residential):** No flags fire.
  - **Classification: MISSED.**

**Net assessment:** Catches the cheapest path (mass-formation + virtual office). An attacker willing to rent real office space bypasses the check.

---

### 9. foreign-institution

**Summary:** Exploits verification gaps at non-Anglophone institutions.

**Bypass methods relevant to this measure:**

- **All methods:** The attacker claims affiliation with a real foreign institution. The institution's registered address is its actual campus or office — not a mass-formation agent or virtual office.
  - **Classification: MISSED.** The check is designed for US-registered entities using US mass-formation services and US virtual offices. Foreign institutions are outside its scope.
  - Additionally, the Smarty CMRA flag only works for US addresses. Foreign addresses cannot be checked for CMRA status.

**Net assessment:** Inapplicable for foreign-institution scenarios.

---

## Findings

### Finding 1 — Moderate: Biotech incubator and co-working lab addresses bypass the denylist

- **Source:** shell-company (lab-bench tier), biotech-incubator-tenant, gradual-legitimacy-accumulation (incubator variant), community-bio-lab-network (maker space)
- **Why missed:** Biotech incubators (LabCentral, BioLabs), co-working labs, and maker spaces are real physical locations with real commercial addresses. They are not CMRAs, not virtual offices, and not on the denylist. The implementation explicitly notes this gap: "Need a separate enriched list of biotech-incubator addresses." Four attacker stories exploit this gap.
- **Suggestion:** Maintain a supplementary list of known biotech incubators, co-working labs, and maker spaces. Flag addresses matching this list with a new signal like `address_shared_lab_space`. This would not be a denylist (these are legitimate locations) but a "shared-space" indicator that combines with other signals. However, this list is harder to maintain than the virtual-office denylist because incubators are less centralized than major chains. Alternatively, use OpenCorporates `address_high_density_registrations` as a proxy — if > 20 companies share the address, flag it regardless of CMRA status.

### Finding 2 — Moderate: Mass-formation agent flag has high false-positive rate

- **Source:** All stories using LLC filing (shell-company, cro-framing, cro-identity-rotation, etc.)
- **Why missed:** The implementation correctly notes that "mass agents legitimately serve thousands of real small businesses." Delaware, Wyoming, and New Mexico LLCs *require* a registered agent, and the cheapest options are mass-formation services. The flag fires on a huge portion of legitimate small biotechs. The playbook addresses this by making the flag non-blocking on its own, but this means it provides weak standalone signal.
- **Suggestion:** No implementation change needed — the flag is correctly positioned as a *contributing* signal. The value proposition is that it raises suspicion in combination with other shell indicators (recent incorporation, fresh domain, no publications), not that it identifies shells on its own.

### Finding 3 — Minor: CMRA false negatives for small/unregistered private mailbox services

- **Source:** shell-nonprofit (small local virtual-office variant)
- **Why missed:** Smarty's CMRA flag depends on USPS CRD registration. Small private mailbox services that haven't registered with USPS as CMRAs show `cmra: N`. The implementation acknowledges this.
- **Suggestion:** Supplement with the `address_high_density_registrations` flag from OpenCorporates — even unregistered mailbox services will have many companies at the same address.

### Finding 4 — Minor: Acquired entities bypass all flags

- **Source:** shell-company (Bypass 2 — acquire existing company)
- **Why missed:** An acquired entity has its own registered address, its own registered agent (which may be a boutique service, not a mass-formation agent), and its own business address. None of these trigger the denylist unless the acquired entity was already using denylist services.
- **Suggestion:** This is correctly handled by the companion corp-registry-stack idea (officer-turnover detection). No change needed in this idea.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Mass-formation agent for LLC | shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, community-bio-lab-network, dormant-domain | CAUGHT (`registered_agent_mass_formation`) |
| Virtual office (Regus/IWG/Davinci/Alliance) | shell-company (virtual tier), shell-nonprofit, cro-framing, gradual-legitimacy-accumulation (baseline) | CAUGHT (`address_virtual_office`) |
| CMRA-registered mailbox service | shell-nonprofit | CAUGHT (Smarty CMRA flag) |
| Co-working lab bench (LabCentral, BioLabs) | shell-company (lab tier), biotech-incubator-tenant | MISSED |
| Maker space address | community-bio-lab-network | MISSED |
| Incubator bench (regional, $500–$3,000/mo) | gradual-legitimacy-accumulation (incubator variant) | MISSED |
| Small unregistered private mailbox | shell-nonprofit (variant) | AMBIGUOUS (CMRA false negative) |
| Acquired entity's non-virtual address | shell-company (Bypass 2) | MISSED |
| Real foreign institution address | foreign-institution | MISSED (outside scope) |

## bypass_methods_uncovered

| Bypass | Story | Why uncovered |
|---|---|---|
| Biotech incubator / co-working lab address | shell-company (lab tier), biotech-incubator-tenant, gradual-legitimacy-accumulation | Not CMRA, not virtual office; real physical space outside denylist |
| Maker space address | community-bio-lab-network | Same — real physical shared space |
| Acquired entity with clean address | shell-company (Bypass 2) | Inherited address not on any denylist |
| Small unregistered CMRA | shell-nonprofit | Smarty CMRA flag depends on USPS registration |
| Foreign institution address | foreign-institution | US-focused denylist; no CMRA data for foreign addresses |

---

## Verdict: **PASS**

No Critical findings. The check meaningfully catches the cheapest attack path (mass-formation agent + major-chain virtual office), imposing a cost floor that forces attackers to upgrade to co-working lab space ($2,000–$5,000/month) or entity acquisition ($50,000+). The biotech-incubator gap (Finding 1) is Moderate because (a) the implementation already identifies it, (b) incubator leases impose their own cost and trace, and (c) a supplementary shared-space list is a feasible incremental improvement. Pipeline continues to stage 6.
