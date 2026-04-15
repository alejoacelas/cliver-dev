# m05-incubator-tenant — Bypass-aware hardening v1

- **measure:** M05 — shipping-institution-association
- **idea:** Incubator / coworking tenant directory

---

## Attacker story walk

### biotech-incubator-tenant

**Story summary:** Attacker leases bench space at a recognized biotech incubator under an LLC, so the shipping address resolves to a known biotech building and inherits incubator-recognized institutional association.

**Bypass methods relevant to M05:**

1. **Bench-space lease at a recognized biotech incubator ($1,500–$5,000/mo).**

   **MISSED (if attacker is a real tenant).** The implementation is explicit: "Catches if attacker uses the incubator address but the LLC is not a tenant. MISSES if attacker actually leases bench space at the incubator (which the attacker model explicitly does for $1,500–5,000/mo). Once the attacker is a real tenant, this check passes them positively." The attacker's LLC appears in the tenant directory. The check confirms the attacker positively. This is the structural core of the bypass.

   **CAUGHT (if attacker falsely claims the incubator address without actually being a tenant).** The implementation fires `incubator_address_no_tenant_listing`, triggering manual review and incubator-manager contact. This would catch a fraudulent address claim. But the attacker model explicitly pays for a real lease to avoid this.

2. **Standalone rented lab / sublet ($1,500–$5,000+/mo, skips incubator vetting).**

   **MISSED.** The standalone lab is NOT at a recognized incubator building in the denylist. The check does not fire at all — the address does not match any incubator in the curated list. The attacker bypasses the check entirely by choosing a non-incubator biotech building.

**Net assessment:** The check is structurally defeated by the story's primary method. The attacker pays for real incubator tenancy specifically to pass this kind of check. The check would catch a fraudulent incubator-address claim, but the attacker model does not use one — it uses a real claim.

---

### community-bio-lab-network

**Story summary:** Attacker constructs community-bio LLC, ships from maker space, coworking, virtual office, or residential address.

**Bypass methods relevant to M05:**

1. **Maker space address.**

   **MISSED.** The implementation notes: "maker spaces (Clear Creek Makerspace, etc.) are NOT in the biotech-incubator denylist; this check does not fire on them." The address does not match any entry in the curated incubator list.

2. **Coworking at biotech cluster.**

   **MISSED.** General coworking spaces (WeWork, Industrious) are not in the biotech-incubator denylist. Only named biotech incubators are tracked.

3. **Virtual office / residential.**

   **MISSED.** Not incubator addresses. Check does not fire.

**Net assessment:** The check is irrelevant to this story. None of the community-bio address types are biotech incubators.

---

### shell-nonprofit

**Story summary:** Shell entity registered to virtual office in biotech metro.

**Bypass methods relevant to M05:**

1. **Virtual office in biotech metro.**

   **MISSED.** Virtual offices (Regus, IWG, Alliance) are not biotech incubators. The address does not match the denylist. Check does not fire.

**Net assessment:** Irrelevant to this story.

---

### cro-framing

**Story summary:** LLC framed as CRO, virtual office/executive suite/coworking in biotech metro.

**Bypass methods relevant to M05:**

1. **Virtual office / executive suite / coworking.**

   **MISSED.** Not incubator addresses. Check does not fire.

**Net assessment:** Irrelevant.

---

### cro-identity-rotation

**Story summary:** Multiple LLCs with virtual offices, rotating across providers.

**Bypass methods relevant to M05:**

1. **Virtual office per LLC / coworking.**

   **MISSED.** Not incubator addresses. Check does not fire.

**Net assessment:** Irrelevant.

---

### dormant-domain

**Story summary:** Revived defunct lab, address sourced from residential/virtual-office/biotech-coworking.

**Bypass methods relevant to M05:**

1. **Virtual office / residential / biotech coworking.**

   **AMBIGUOUS for biotech coworking.** If the biotech coworking happens to be at a recognized incubator building (e.g., the dormant-domain attacker rents at LabCentral), and the attacker's LLC is NOT listed as a tenant, the check CATCHES. If the biotech coworking is at a non-incubator building, the check does not fire.

   **MISSED for virtual office and residential.** Not incubator addresses.

**Net assessment:** Marginal relevance. Only fires if the attacker happens to use a tracked incubator building AND is not a tenant.

---

### inbox-compromise

**Story summary:** Compromised .edu inbox, ships to CMRA/virtual office in institution's metro.

**Bypass methods relevant to M05:**

1. **CMRA/virtual office in metro.**

   **MISSED.** Not an incubator address. Check does not fire.

**Net assessment:** Irrelevant.

---

### foreign-institution

**Story summary:** Attacker claims foreign affiliation, ships to various addresses.

**Bypass methods relevant to M05:**

All methods — freight forwarder, local accomplice, residential, virtual office — are not biotech incubator addresses.

**MISSED.** Check does not fire.

**Net assessment:** Irrelevant. The curated denylist is US-focused; foreign biotech incubators are not tracked.

---

### credential-compromise

**Story summary:** Compromised PI account, carrier redirect.

**Bypass methods relevant to M05:**

1. **Carrier redirect / USPS COA.**

   **MISSED.** Post-approval transit diversion. Even if the original address were at an incubator, the redirect happens after the check.

**Net assessment:** Irrelevant.

---

### account-hijack

**Story summary:** Hijacked PI account, physical interception or address change.

**Bypass methods relevant to M05:**

1. **Physical interception at PI's approved address.**

   **MISSED.** The approved address passes because the PI is a legitimate tenant. No check to run.

2. **Social-engineered address change.**

   **AMBIGUOUS.** If the new "satellite" address happens to be a tracked incubator building and the PI's org is not a tenant there, CAUGHT. Otherwise, the check does not fire.

**Net assessment:** Marginal.

---

### it-persona-manufacturing

**Story summary:** Fake persona inside real institution, ships to host lab.

**Bypass methods relevant to M05:**

1. **Ship to host lab building.**

   **MISSED.** Host lab is at the institution, not a biotech incubator (usually). Check does not fire.

2. **Sibling org record at same institution.**

   **MISSED.** Same.

**Net assessment:** Irrelevant.

---

### visiting-researcher

**Story summary:** Visiting researcher, ships to host lab or off-campus virtual office.

**Bypass methods relevant to M05:**

1. **Host lab address.**

   **MISSED.** Not an incubator address (usually).

2. **Off-campus virtual office.**

   **MISSED.** Not an incubator address.

**Net assessment:** Irrelevant.

---

### dormant-account-takeover

**Story summary:** Dormant account takeover, uses inherited addresses or files address change.

**Bypass methods relevant to M05:**

1. **Alternate registered address / address change.**

   **MISSED** unless the address happens to be a tracked incubator. Check does not fire on most addresses.

**Net assessment:** Irrelevant.

---

### gradual-legitimacy-accumulation

**Story summary:** 12+ months of history at virtual office or incubator bench.

**Bypass methods relevant to M05:**

1. **Virtual office (baseline).**

   **MISSED.** Not an incubator address.

2. **Incubator bench (Branch D variant).**

   **MISSED (if real tenant).** Same as biotech-incubator-tenant — if the attacker is a real tenant, they appear in the directory and pass. The 12-month accumulation window means they may be in the directory as an established resident by order time.

**Net assessment:** The incubator-bench variant is structurally missed for the same reason as biotech-incubator-tenant.

---

## Findings

### Finding 1 — Moderate: The check is structurally defeated by its primary target story (biotech-incubator-tenant)

- **Source:** biotech-incubator-tenant (bench-space lease method, $1,500–$5,000/mo).
- **Why missed:** The attacker pays for a real lease and becomes a real tenant. The check confirms the attacker positively. The implementation correctly identifies this: "Once the attacker is a real tenant, this check passes them positively. Structural limitation."
- **Severity: Moderate** (not Critical). The check still catches fraudulent incubator-address claims (where the attacker does NOT have a real lease). The structural defeat is acknowledged in the implementation and is inherent in any check that relies on tenant directories — a real tenant is indistinguishable from a legitimate customer at this layer. The value is raising the floor cost to $1,500–$5,000/mo for the attacker, which is significant even though the check does not block.
- **Suggestion:** None for re-research. The check's value is cost-raising and deterrent, not blocking. Stage 7 should frame this correctly.

### Finding 2 — Moderate: Check has extremely narrow firing surface — only ~30–50 addresses in the denylist

- **Source:** All non-incubator stories (community-bio-lab-network, shell-nonprofit, cro-framing, cro-identity-rotation, inbox-compromise, foreign-institution, credential-compromise, visiting-researcher, dormant-account-takeover).
- **Why missed:** The curated denylist covers ~30–50 biotech incubator buildings. For any story whose address type is not a biotech incubator, the check simply does not fire. This is by design — the check targets a specific address class — but it means the check contributes zero signal to the vast majority of M05 stories.
- **Severity: Moderate.** The narrow scope is correct for the idea's purpose. The gap is filled by other M05 ideas (campus polygon, ROR/GLEIF canonical address).

### Finding 3 — Minor: JLABS has no comprehensive public directory — check structurally weak for JLABS addresses

- **Source:** biotech-incubator-tenant (if attacker uses a JLABS location).
- **Why ambiguous:** The implementation notes JLABS is "invitation-only (~40 residents per location) and individual residents are listed selectively in news/press." The flag `incubator_address_known_low_directory_quality` fires, defaulting to manual contact. But the manual-contact path depends on JLABS responding, which the implementation rates as uncertain.
- **Severity: Minor.** The implementation correctly identifies this and routes to manual contact. The gap is a specific incubator's transparency, not a flaw in the idea's design.

### Finding 4 — Minor: Tenant list lag (4–12 weeks) creates a timing window for new tenants

- **Source:** biotech-incubator-tenant, gradual-legitimacy-accumulation.
- **Why ambiguous:** A new tenant (legitimate or attacker) may not appear in the scraped directory for 4–12 weeks. During this window, `incubator_address_no_tenant_listing` fires for a legitimate customer, creating a false positive. For an attacker, this is a temporary inconvenience resolved by the manual-contact escalation (which confirms tenancy directly with the incubator).
- **Severity: Minor.** The escalation path handles this correctly.

---

## bypass_methods_known

| Bypass method | Story | Classification |
|---|---|---|
| Real bench-space lease (attacker is tenant) | biotech-incubator-tenant | MISSED |
| Fraudulent incubator address claim (not tenant) | biotech-incubator-tenant | CAUGHT |
| Standalone rented lab (non-incubator building) | biotech-incubator-tenant | MISSED |
| Maker space | community-bio-lab-network | MISSED |
| Coworking / virtual office / residential | community-bio-lab-network | MISSED |
| Virtual office (biotech metro) | shell-nonprofit | MISSED |
| Virtual office / exec suite / coworking | cro-framing | MISSED |
| Virtual office per rotated LLC | cro-identity-rotation | MISSED |
| Virtual office / residential | dormant-domain | MISSED |
| Biotech coworking at tracked incubator (not tenant) | dormant-domain | CAUGHT |
| CMRA / virtual office | inbox-compromise | MISSED |
| All foreign address types | foreign-institution | MISSED |
| Carrier redirect | credential-compromise | MISSED |
| Physical interception / address change | account-hijack | MISSED |
| Ship to host lab | it-persona-manufacturing | MISSED |
| Host lab / off-campus virtual office | visiting-researcher | MISSED |
| Inherited address / address change | dormant-account-takeover | MISSED |
| Virtual office / incubator bench (real tenant) | gradual-legitimacy-accumulation | MISSED |

## bypass_methods_uncovered

- Real incubator tenancy (biotech-incubator-tenant, gradual-legitimacy-accumulation) — structural
- All non-incubator address types (majority of stories)
- JLABS and other low-directory-quality incubators (partial)

---

## Verdict: **PASS**

No Critical findings. The check is correctly scoped as a narrow, high-specificity control targeting one specific bypass pattern (fraudulent incubator-address claims). Its structural inability to catch real incubator tenants is acknowledged and inherent. The value is cost-raising for the biotech-incubator-tenant story ($1,500–$5,000/mo minimum) and providing positive verification for legitimate incubator-based customers. The vast majority of M05 attacker stories operate outside this check's firing surface, which is expected and filled by other M05 ideas. Pipeline continues to stage 6.
