# m18-gleif — bypass-aware hardening v1

- **measure:** M18 (institution-legitimacy-soc)
- **idea:** GLEIF LEI lookup + Level-2 relationships

---

## Attacker story walk

### 1. shell-nonprofit

**Summary:** Fake research nonprofit with name collision, constructed entity signals.

**Bypass methods relevant to this measure:**

- **Real-entity registration (DE/WY LLC or 501(c)(3)).**
  - **MISSED.** Most small nonprofits and newly-formed LLCs do not have LEIs. The `no_lei` flag fires — but the implementation explicitly notes this is informational only ("not a stand-alone flag; route to alternative legitimacy checks") because most legitimate research institutions also lack LEIs. The signal is non-discriminatory.

- **Name-collision reflected legitimacy.**
  - **AMBIGUOUS.** If the real institution the shell collides with has an LEI, the fuzzy-name-match logic might return the real institution's LEI record. The `lei_name_fuzzy_match_low_confidence` flag may fire if the match is imprecise. However, the reviewer might mistakenly attribute the real institution's LEI to the shell. The implementation does not specifically address name-collision disambiguation in the GLEIF matching pipeline.

- **Stand up domain/mailbox; ROR self-listing; fiscal sponsorship.**
  - **MISSED.** These M2/M4 bypasses are outside GLEIF's scope.

**Net assessment:** Negligible signal. The shell is very unlikely to have an LEI; the `no_lei` result is shared with the majority of legitimate research entities.

---

### 2. shell-company

**Summary:** Delaware LLC built to look like biotech, or acquired going concern.

**Bypass methods relevant to this measure:**

- **Build from scratch.**
  - **MISSED.** A newly-formed small LLC is very unlikely to obtain an LEI (LEI issuance requires registration with an LOU and costs ~$50–$100/year; there is no business reason for a small biotech to get one unless they trade financial instruments). `no_lei` fires; informational only.

- **Acquire existing company.**
  - **CAUGHT (conditionally).** If the acquired entity had an LEI (more likely for a going-concern with financial-market activity):
    - The LEI record shows the entity's jurisdiction, officers, and parent chain. If the entity was dissolved/merged, the LEI status may be LAPSED/RETIRED. `lei_lapsed` or `lei_entity_inactive` fires. **CAUGHT.**
    - The Level-2 parent chain may expose the acquirer's holding structure. If the acquirer routes through a secrecy jurisdiction, `lei_parent_in_concern_jurisdiction` fires. **CAUGHT.**
    - If the acquired entity files a `NON_CONSOLIDATING` exception to avoid disclosing its new parent, `lei_reporting_exception_suspicious` fires. **CAUGHT.**
  - **MISSED** if the acquired entity never had an LEI (the common case for small biotechs).

**Net assessment:** Weak for build-from-scratch (no LEI). Conditionally useful for acquisition of entities that had LEIs and whose parent chain or status reveals the acquisition.

---

### 3. biotech-incubator-tenant

**Summary:** LLC rents incubator bench.

**Bypass methods relevant to this measure:**

- **Incubator residency.**
  - **MISSED.** Incubator tenants do not have LEIs. `no_lei` fires; informational. The incubator itself may or may not have an LEI, but the check is against the customer entity, not the incubator.

**Net assessment:** Zero signal.

---

### 4. cro-framing

**Summary:** CRO facade LLC.

**Bypass methods relevant to this measure:**

- **CRO infrastructure.**
  - **MISSED.** Small CRO LLCs do not have LEIs. Same dynamics as shell-company build-from-scratch.

**Net assessment:** Zero signal.

---

### 5. cro-identity-rotation

**Summary:** Multiple rotating CRO shells.

**Bypass methods relevant to this measure:**

- **Each rotated shell.**
  - **MISSED.** None of the shells have LEIs. `no_lei` fires repeatedly; uninformative. The rotation pattern is invisible to GLEIF. Cross-entity linkage is the domain of m18-cross-shell-graph.

**Net assessment:** Zero signal.

---

### 6. community-bio-lab-network

**Summary:** Community bio lab as registered institution.

**Bypass methods relevant to this measure:**

- **Community lab legitimacy.**
  - **MISSED.** Community bio labs do not have LEIs.

**Net assessment:** Zero signal.

---

### 7. gradual-legitimacy-accumulation

**Summary:** 12–24 months building entity track record.

**Bypass methods relevant to this measure:**

- **Accumulated entity signals.**
  - **MISSED.** The implementation itself notes: "If the entity obtains an LEI (which a committed actor might do for credibility), the LEI record is clean; the check provides no signal against a well-constructed entity." If the entity does not obtain an LEI (the likely case), `no_lei` fires — uninformative.

**Net assessment:** Zero signal either way.

---

### 8. dormant-domain

**Summary:** Acquire defunct institution's domain.

**Bypass methods relevant to this measure:**

- **Dormant domain inherited signals.**
  - **CAUGHT (conditionally).** If the defunct institution had an LEI, the LEI record will show LAPSED or RETIRED status (because the entity no longer renews). `lei_lapsed` or `lei_entity_inactive` fires. This is a genuine catch — the GLEIF record independently confirms the entity is no longer active, regardless of domain reanimation.
  - **MISSED** if the defunct institution never had an LEI (the common case for small research entities).

**Net assessment:** Conditionally useful for defunct institutions that held LEIs. The implementation correctly notes this use case under `attacker_stories_addressed`.

---

### 9. foreign-institution

**Summary:** Claim affiliation with a foreign institution.

**Bypass methods relevant to this measure:**

- **Asymmetric verification gap.**
  - **CAUGHT (partially).** GLEIF is globally standardized — one of the few data sources that works across jurisdictions without language or registry-access barriers. If the claimed foreign institution has an LEI, the check confirms its existence, jurisdiction, and parent chain. This is a genuine advantage over US/UK-centric registry checks.
  - **MISSED** if the foreign institution is in a country with low LEI adoption (many developing countries) or if the institution is outside the financial sector. The implementation correctly notes: "LEI adoption varies dramatically by country."
  - For fabricated foreign institutions: `no_lei` fires but is uninformative (same result for legitimate foreign institutions without LEIs).

**Net assessment:** Moderate signal for foreign institutions in the financial ecosystem (EU/UK entities are well-represented). Weak signal for foreign institutions in countries with low LEI adoption.

---

### 10. inbox-compromise

**Summary:** Compromise real institutional inbox.

- **CAUGHT (vacuously).** The institution is real; if it has an LEI, the check confirms its legitimacy. The bypass is at the identity layer.

**Net assessment:** No additional signal.

---

### 11. credential-compromise

**Summary:** Compromise real employee credentials.

- **CAUGHT (vacuously).** Same.

**Net assessment:** No additional signal.

---

### 12. it-persona-manufacturing

**Summary:** Manufacture persona at real institution.

- **CAUGHT (vacuously).** Same.

**Net assessment:** No additional signal.

---

## Findings

### Critical

None.

### Moderate

**M1: LEI coverage gap for the target population (research institutions and small biotechs) renders `no_lei` non-discriminatory.**

- **Source:** shell-nonprofit, shell-company (build-from-scratch), biotech-incubator-tenant, cro-framing, cro-identity-rotation, community-bio-lab-network, gradual-legitimacy-accumulation.
- **Why:** The implementation correctly documents this: "fewer than 5% of US R1 universities have LEIs" and most small entities lack LEIs. The `no_lei` flag fires for the vast majority of both legitimate and malicious customers, making it useless as a discriminator. The implementation treats `no_lei` as informational rather than decisive, which is the correct design choice — but it means the check provides no signal against the dominant attacker population (small entities).
- **Structural?** Yes. LEI coverage is a property of the LEI ecosystem, not a field-set problem. No implementation tweak can increase LEI adoption among research institutions.
- **Suggestion:** Stage 4 should more prominently frame GLEIF as a *supplementary* check useful primarily for (a) financial-sector entities, (b) entities that claim LEIs, and (c) Level-2 parent-chain analysis of entities that do have LEIs. It should not be positioned as a primary legitimacy signal for research institutions.

**M2: Level-2 parent-chain analysis is defeatable by reporting exceptions.**

- **Source:** shell-company (acquire variant), beneficial-owner-laundering.
- **Why:** The implementation notes that entities can file `NON_CONSOLIDATING` to avoid disclosing parents, and that the `lei_reporting_exception_suspicious` flag fires on `NON_PUBLIC` or `BINDING_LEGAL_OBSTACLES`. However, `NON_CONSOLIDATING` is a legitimate and common exception for entities that are not consolidated by a parent under IFRS/US GAAP. A shell company filing `NON_CONSOLIDATING` is technically correct if it is not a subsidiary. The flag may not fire for the most common evasion path.
- **Suggestion:** Treat `NON_CONSOLIDATING` by a small commercial entity (not a fund, not a subsidiary, not a natural person) as a soft flag worth examining in combination with other signals. The implementation currently only flags `NON_PUBLIC` and `BINDING_LEGAL_OBSTACLES`.

### Minor

**m1: Name-collision disambiguation is not addressed in the GLEIF matching pipeline.**

- **Source:** shell-nonprofit.
- **Detail:** The implementation describes fuzzy matching against GLEIF's name index but does not address what happens when two entities have similar names and the fuzzy match returns the wrong one. The `lei_name_fuzzy_match_low_confidence` flag fires for low-confidence matches but does not distinguish "no match" from "matched the wrong entity."

**m2: Rate limit (60 req/min) may constrain batch onboarding.**

- **Source:** Implementation's own failure modes.
- **Detail:** The bulk download pipeline is the documented mitigation, but adds engineering complexity. The constraint is real for providers with high onboarding volumes.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Real-entity registration (no LEI) | shell-nonprofit | MISSED |
| Name-collision (GLEIF fuzzy match) | shell-nonprofit | AMBIGUOUS |
| Build from scratch (no LEI) | shell-company | MISSED |
| Acquire existing company (entity had LEI) | shell-company | CAUGHT (conditionally) |
| Acquire existing company (no LEI) | shell-company | MISSED |
| Incubator residency (no LEI) | biotech-incubator-tenant | MISSED |
| CRO facade (no LEI) | cro-framing | MISSED |
| Rotated shells (no LEIs) | cro-identity-rotation | MISSED |
| Community lab (no LEI) | community-bio-lab-network | MISSED |
| Accumulated entity signals | gradual-legitimacy-accumulation | MISSED |
| Dormant domain (defunct entity had LEI) | dormant-domain | CAUGHT |
| Dormant domain (no LEI) | dormant-domain | MISSED |
| Foreign institution (has LEI, high-adoption country) | foreign-institution | CAUGHT (partially) |
| Foreign institution (no LEI, low-adoption country) | foreign-institution | MISSED |
| Inbox compromise (real institution) | inbox-compromise | CAUGHT (vacuous) |
| Credential compromise (real institution) | credential-compromise | CAUGHT (vacuous) |
| IT persona manufacturing (real institution) | it-persona-manufacturing | CAUGHT (vacuous) |

## bypass_methods_uncovered

- All purpose-built-organization stories where the entity lacks an LEI (the dominant case): shell-nonprofit, shell-company (build-from-scratch), biotech-incubator-tenant, cro-framing, cro-identity-rotation, community-bio-lab-network, gradual-legitimacy-accumulation
- Dormant-domain where the defunct entity had no LEI
- Foreign institution in low-LEI-adoption country
- NON_CONSOLIDATING reporting exception (shell-company acquire variant)

---

## Verdict

**PASS** — No Critical findings. The check is correctly positioned as a supplementary signal for entities in the financial ecosystem, with genuine value for Level-2 parent-chain analysis and lapsed-entity detection. The fundamental LEI coverage gap for research institutions (M1) is structural and correctly documented in the implementation. The NON_CONSOLIDATING exception gap (M2) is a refinement the implementation could incorporate. Pipeline continues to stage 6.
