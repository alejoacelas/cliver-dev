# m18-cross-shell-graph — bypass-aware hardening v1

- **measure:** M18 (institution-legitimacy-soc)
- **idea:** Cross-shell rotation graph

---

## Attacker story walk

### 1. shell-nonprofit

**Summary:** Fake research nonprofit with name collision, constructed signals.

**Bypass methods relevant to this measure:**

- **Real-entity registration with virtual office.** Files LLC/501(c)(3), rents virtual office, recruits accomplice.
  - **CAUGHT.** The graph stores the registered agent, officer, registered address, WHOIS registrant, CT cert, and hosting fingerprint. If the attacker has previously operated another entity that was screened by this provider, shared fingerprints surface:
    - Same registered agent (if reused). **CAUGHT** via `cross_shell_shared_agent`.
    - Same officer/director name. **CAUGHT** via `cross_shell_shared_officer`.
    - Same hosting provider/IP/JARM. **CAUGHT** via `cross_shell_shared_hosting` (but discounted for cloud-provider noise).
    - Same CT cert across entities. **CAUGHT** via `cross_shell_shared_cert`.
  - **MISSED** if this is the attacker's first entity at this provider (no prior node in the graph to match against — cold-start problem).

- **Name-collision reflected legitimacy.**
  - **MISSED.** Name collision exploits reviewer cognition, not graph infrastructure. The graph does not include "entity name similarity" as a fingerprint type.

- **Stand up domain/mailbox; thin website.**
  - **CAUGHT** if the attacker reuses hosting infrastructure or cert issuer across entities.
  - **MISSED** if the attacker uses fresh, independent infrastructure for each shell.

- **ROR self-listing.**
  - **MISSED.** ROR identifier is not a fingerprint type in the graph.

- **Fiscal sponsorship.**
  - **AMBIGUOUS.** If the fiscal sponsor is shared across multiple shell entities, a `cross_shell_shared_address` or `cross_shell_shared_officer` edge may surface. Depends on the sponsor's relationship structure.

**Net assessment:** Strong catch for serial operators reusing infrastructure or personnel across shells. Zero signal for first-time operators or attackers who use fresh infrastructure per entity. The cold-start problem is the dominant limitation.

---

### 2. shell-company

**Summary:** Delaware LLC built to look like a biotech, or acquired going concern.

**Bypass methods relevant to this measure:**

- **Build entity signals from scratch.**
  - **CAUGHT (conditionally).** Same as shell-nonprofit — if the attacker has prior entities in the graph, shared officer/agent/hosting fingerprints surface. The implementation specifically targets the "same operator stands up serial shells" pattern.
  - **MISSED** for first-time operators.

- **Acquire existing company.**
  - **CAUGHT (partially).** The acquired entity's fingerprints (prior officers, registered agent, hosting) are in the graph. If the new owner changes officers, the old-officer-to-new-officer transition may be visible if the new owner is also an officer on another entity in the graph. But if the acquisition is the attacker's first interaction with this provider, no prior node exists. **AMBIGUOUS** — depends on graph coverage.

**Net assessment:** Same as shell-nonprofit — strong for serial operators, weak for first-time.

---

### 3. biotech-incubator-tenant

**Summary:** LLC rents incubator bench space.

**Bypass methods relevant to this measure:**

- **Incubator residency.** Multiple legitimate tenants share the incubator's address, registered agent, and possibly hosting infrastructure.
  - **CAUGHT (but high false-positive rate).** The incubator's address appears as a shared address across many entities. The mass-formation discount rule in the manual review handoff should suppress this for known incubator addresses. If the discount is correctly calibrated, legitimate tenants clear; if not, they false-positive.
  - **CAUGHT (for truly suspicious cases).** If the attacker is an officer on multiple incubator-tenant entities that were previously flagged/denied, the `cross_shell_shared_officer` signal is genuine.

**Net assessment:** The check works correctly but requires careful calibration of the mass-formation/shared-address discount for known incubator addresses. Risk of high false-positive rate if incubator addresses are not whitelisted.

---

### 4. cro-framing

**Summary:** CRO facade LLC.

**Bypass methods relevant to this measure:**

- **CRO infrastructure (virtual office, website, faked client engagements).**
  - **CAUGHT (conditionally).** If the CRO operator has previously operated another CRO shell (which is the cro-identity-rotation pattern), shared officer, hosting, or cert fingerprints surface. This is the check's primary use case.
  - **MISSED** for the first CRO facade.

**Net assessment:** Strong catch for serial CRO operators; zero signal for first CRO.

---

### 5. cro-identity-rotation

**Summary:** Multiple CRO shell identities rotating to avoid cumulative trace.

**Bypass methods relevant to this measure:**

- **Each instance independently passes institution-legitimacy review; rotation is the evasion strategy.**
  - **CAUGHT.** This is the check's *primary design target*. The graph is specifically built to detect "the same operator stands up serial shells." Each new CRO shell shares fingerprints (officer, registered agent, hosting, CT cert, GLEIF parent) with prior shells. The "≥2 independent fingerprint matches" rule triggers.
  - **MISSED (conditionally).** If the attacker takes extraordinary measures to avoid fingerprint overlap:
    - Different officer names (uses different accomplices for each shell). **MISSED** for officer fingerprint.
    - Different registered agents per shell. **MISSED** for agent fingerprint.
    - Different hosting infrastructure per shell. **MISSED** for hosting/cert fingerprint.
    - Different domain registrant per shell. **MISSED** for WHOIS fingerprint.
  - If the attacker achieves zero fingerprint overlap across shells, the graph provides no signal. The cost of achieving this is high (new accomplice per shell, new infrastructure per shell) but not prohibitive for a well-funded attacker.

**Net assessment:** Strong catch for the common case (lazy infrastructure/officer reuse). Defeatable by a well-funded attacker who invests in per-shell isolation, at significantly increased cost and complexity.

---

### 6. community-bio-lab-network

**Summary:** Community bio lab as institutional cover.

**Bypass methods relevant to this measure:**

- **Community lab collective identity.**
  - **MISSED.** Community labs are typically single entities, not serial shells. The graph detects cross-entity linkage, not single-entity legitimacy. If the attacker operates only one community lab, the graph has nothing to match against.
  - **CAUGHT (edge case).** If the same person operates multiple community labs (different names, same officer), the graph surfaces this.

**Net assessment:** Zero signal for single-entity community labs.

---

### 7. gradual-legitimacy-accumulation

**Summary:** 12–24 months building a single entity.

**Bypass methods relevant to this measure:**

- **Single entity, patient buildup.**
  - **MISSED.** The graph detects cross-entity linkage. A patient operator with a single entity has no second entity to link to. The graph provides no signal.

**Net assessment:** Zero signal. The branch uses one entity, not serial shells.

---

### 8. dormant-domain

**Summary:** Acquire defunct institution's domain.

**Bypass methods relevant to this measure:**

- **Dormant domain inherited signals.**
  - **CAUGHT (conditionally).** The defunct institution's prior fingerprints (officers, hosting, address) may be in the graph if the institution was a prior customer. The new operator's fingerprints won't match — which is itself a signal if the graph tracks "fingerprint change" events. However, the implementation as written tracks only "shared fingerprints," not "fingerprint changes within the same entity." **MISSED** for fingerprint-change detection.
  - If the attacker also operates another entity in the graph, shared fingerprints may surface.

**Net assessment:** Weak. The graph is designed for cross-entity linkage, not intra-entity fingerprint changes. The dormant-domain branch reanimates a single entity, not multiple.

---

### 9. foreign-institution

**Summary:** Claim affiliation with a foreign institution.

**Bypass methods relevant to this measure:**

- **Asymmetric verification gap.**
  - **MISSED.** The graph's fingerprint sources are predominantly US/UK-centric (Companies House officers, OpenCorporates SOS data, GLEIF). Foreign institutions in jurisdictions with opaque registries may not have officer/agent data in the graph. WHOIS and hosting fingerprints work globally, but CT certs and officer data do not.

**Net assessment:** Reduced signal for foreign institutions due to limited registry coverage. WHOIS and hosting fingerprints still work.

---

### 10. inbox-compromise

**Summary:** Compromise real institutional inbox.

- **MISSED.** The institution is real; the attacker's identity is not in the graph as an entity operator. The graph detects entity-level linkage, not identity-level impersonation.

**Net assessment:** Zero signal.

---

### 11. credential-compromise

**Summary:** Compromise real employee credentials.

- **MISSED.** Same as inbox-compromise — identity-layer attack, not institution-layer.

**Net assessment:** Zero signal.

---

### 12. it-persona-manufacturing

**Summary:** Manufacture persona at real institution.

- **MISSED.** Same — the institution is real; the manufactured persona does not create a new entity node in the graph.

**Net assessment:** Zero signal.

---

## Findings

### Critical

None.

### Moderate

**M1: Cold-start problem — the graph is only useful in proportion to historical customer base.**

- **Source:** All purpose-built-organization stories (shell-nonprofit, shell-company, cro-framing, cro-identity-rotation, community-bio-lab-network) for first-time operators.
- **Why:** The graph detects cross-entity linkage against *prior screened entities*. A first-time attacker with no prior entities in the graph produces no matches. The implementation acknowledges this under failure modes but has no mitigation beyond noting it takes "a year or two of data."
- **Suggestion:** IGSC-level graph sharing across providers (if the antitrust/GDPR constraints from m17-igsc-shared-list could be resolved) would dramatically reduce the cold-start problem. This is a governance question, not a technical one.

**M2: Well-funded attacker can defeat the graph by per-shell isolation.**

- **Source:** cro-identity-rotation.
- **Why:** An attacker who uses different accomplices, different registered agents, different hosting, and different domains for each shell achieves zero fingerprint overlap. The cost is high (new accomplice + new infrastructure per shell) but not prohibitive.
- **Suggestion:** Add behavioral/temporal fingerprints that are harder to isolate: entity formation date clustering, SOS filing patterns, order timing patterns, writing-style analysis on customer communications. These are harder for the attacker to vary but also harder to engineer and higher false-positive. AMBIGUOUS whether this is practical.

**M3: The graph does not detect intra-entity fingerprint changes (relevant to dormant-domain and acquisition variants).**

- **Source:** dormant-domain, shell-company (acquire).
- **Why:** The implementation tracks "shared fingerprints across entities" but not "fingerprint changes within a single entity's history" (e.g., officer changed, WHOIS changed, hosting changed). A dormant-domain attacker or a shell-company acquirer changes the entity's fingerprints; the old-to-new transition could be a signal.
- **Suggestion:** Add intra-entity fingerprint-change detection: "officer X was replaced by officer Y on date Z" as a trackable event, especially for previously-screened entities. This would catch dormant-domain reanimation and entity acquisitions.

### Minor

**m1: Mass-formation agent discount needs an actively maintained whitelist.**

- **Source:** biotech-incubator-tenant, shell-company (DE/WY formation agents).
- **Detail:** The implementation describes mass-formation agent discounting but does not specify how the whitelist is maintained. A stale whitelist either over-discounts (misses signal) or under-discounts (false-positives legitimate entities).

**m2: Cloud-tenant hosting noise is acknowledged but filtering heuristics are not specified.**

- **Source:** All stories using cloud hosting.
- **Detail:** Two entities sharing an AWS IP block is meaningless; the implementation acknowledges this but does not specify the ASN/hosting-provider exclusion list. Without it, the `cross_shell_shared_hosting` flag fires constantly on false positives.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Real-entity registration (serial operator) | shell-nonprofit | CAUGHT |
| Real-entity registration (first-time operator) | shell-nonprofit | MISSED |
| Name-collision reflected legitimacy | shell-nonprofit | MISSED |
| Domain/website (reused infrastructure) | shell-nonprofit | CAUGHT |
| Domain/website (fresh per-entity infrastructure) | shell-nonprofit | MISSED |
| Build from scratch (serial) | shell-company | CAUGHT |
| Build from scratch (first-time) | shell-company | MISSED |
| Acquire existing company | shell-company | AMBIGUOUS |
| Incubator residency (shared address) | biotech-incubator-tenant | CAUGHT (with discount calibration) |
| CRO facade (serial) | cro-framing | CAUGHT |
| CRO facade (first-time) | cro-framing | MISSED |
| Rotation with infrastructure reuse | cro-identity-rotation | CAUGHT |
| Rotation with per-shell isolation | cro-identity-rotation | MISSED |
| Community lab (single entity) | community-bio-lab-network | MISSED |
| Gradual legitimacy (single entity) | gradual-legitimacy-accumulation | MISSED |
| Dormant domain reanimation | dormant-domain | MISSED |
| Foreign institution | foreign-institution | MISSED (partially — WHOIS/hosting still work) |
| Inbox compromise | inbox-compromise | MISSED |
| Credential compromise | credential-compromise | MISSED |
| IT persona manufacturing | it-persona-manufacturing | MISSED |

## bypass_methods_uncovered

- First-time operators across all purpose-built-organization stories (cold-start)
- Per-shell infrastructure isolation (cro-identity-rotation, well-funded)
- Single-entity branches (gradual-legitimacy-accumulation, community-bio-lab-network)
- Intra-entity fingerprint changes (dormant-domain, shell-company acquisition)
- Identity-layer attacks (inbox-compromise, credential-compromise, it-persona-manufacturing)
- Name-collision strategy (shell-nonprofit)

---

## Verdict

**PASS** — No Critical findings. The check is correctly scoped as a cross-entity linkage detector targeting serial shell operators. It is strongly effective against its primary design target (cro-identity-rotation with infrastructure reuse) and provides useful signal for serial operators across all purpose-built-organization branches. The cold-start problem (M1), per-shell isolation defeat (M2), and intra-entity change detection gap (M3) are Moderate findings that represent scope extensions, not field-set bugs. Pipeline continues to stage 6.
