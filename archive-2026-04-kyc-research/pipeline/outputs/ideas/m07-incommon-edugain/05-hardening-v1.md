# m07-incommon-edugain — bypass-aware hardening v1

## Attacker stories walked

### 1. it-persona-manufacturing

**Summary:** IT admin at a real university manufactures a directory entry and email for a fake persona.

**Bypass methods relevant to M07:**

- **Sub-path A — Loose-governance direct injection:** Creates a mail alias and directory entry on the real institution's domain.
  - **MISSED.** The institution is a real university with a real IdP in InCommon/eduGAIN. The manufactured persona's email is on the same domain as the IdP's `<mdui:Scope>`. The federation check returns `domain_in_incommon` — a strong pass. The check confirms the domain is academic; it cannot distinguish a legitimate employee from a manufactured persona on that same domain.

- **Sub-path B — Visiting-scholar pathway:** Real visiting appointment on the real domain.
  - **MISSED.** Same reasoning. The email domain matches the IdP scope. Clean pass.

- **Sub-path C — Reuse of departed member's directory entry.**
  - **MISSED.** The departed member's email was on the same domain. Reactivation produces an email on the same IdP-scoped domain.

- **Sub-path D — HR-system injection.**
  - **MISSED.** Same domain, same IdP scope.

**Net assessment:** Zero resistance. The federation check validates the *domain*, not the *individual*. Any persona on a federated domain passes.

---

### 2. visiting-researcher

**Summary:** Lone operator obtains a real visiting-scholar appointment at a US/European R1.

**Bypass methods:** None needed — the attacker holds a real `.edu` email at a federated institution.

- **MISSED.** The institution's domain is in InCommon. `domain_in_incommon` fires as a pass.

**Net assessment:** Zero resistance. The attacker's email is on a legitimately federated domain.

---

### 3. unrelated-dept-student

**Summary:** Enrolled grad student in a non-wet-lab department.

**Bypass methods:**

- **Bypass A — Canonical @university.edu:** Real institutional email.
  - **MISSED.** Domain is in InCommon. Clean pass.

- **Bypass C — Federated academic login (InCommon/eduGAIN):** "Authenticates via institutional SSO. Federated assertion includes affiliation and possibly department attributes."
  - **MISSED.** This bypass directly invokes the federation that this idea checks. The student's SSO assertion would include `eduPersonScopedAffiliation` with a value like `student@university.edu` or `member@university.edu`. The implementation as documented only checks whether the *domain* corresponds to a registered IdP — it does not inspect the federated attributes (affiliation type, department). Even if it did, `student` is a legitimate affiliation value.

**Net assessment:** Zero resistance. The check confirms the domain is federated, which the student's domain genuinely is. The richer signal — the `eduPersonScopedAffiliation` attribute itself — is not used (the implementation explicitly notes it operates "out-of-band" without actual SSO).

---

### 4. lab-manager-voucher

**Summary:** Insider with legitimate ordering role.

**Bypass methods:** None needed — "Federated login via eduGAIN or InCommon, where deployed, also passes natively."

- **MISSED.** Domain is federated. Clean pass.

**Net assessment:** Zero resistance.

---

### 5. bulk-order-noise-cover

**Summary:** Core facility technician or cross-PI admin at a real university.

**Bypass methods:** None needed — real institutional email.

- **MISSED.** Domain is federated. Clean pass.

**Net assessment:** Zero resistance.

---

### 6. insider-recruitment

**Summary:** External handler pays a legitimate insider to place orders.

**Bypass methods:** None needed — the insider uses their primary institutional email.

- **MISSED.** Domain is federated. Clean pass.

**Net assessment:** Zero resistance.

---

### 7. account-hijack

**Summary:** Attacker compromises a PI's institutional email and takes over their provider account.

**Bypass methods:** None needed — inherited.

- **MISSED.** The PI's email domain is federated. Clean pass.

**Net assessment:** Zero resistance.

---

### 8. inbox-compromise

**Summary:** Lone operator compromises a dormant or lightly monitored email at a small US college.

**Bypass methods:**

- **Adjunct account via lapsed personal email recovery:**
  - **AMBIGUOUS.** If the small college is an InCommon member, the domain passes. If the small college is *not* in InCommon (many are not — the implementation notes "many small colleges" are excluded), then `domain_no_federation` fires. This is one of the few scenarios where the federation check provides useful signal — but only against small non-federated colleges. Classification depends on the specific institution.

- **Alumni-for-life forwarder:**
  - **AMBIGUOUS.** The implementation notes: "Email is on an `alumni.<u>.edu` forwarder; the alumni domain may or may not be a registered scope." If `alumni.u.edu` is not in the IdP's `<mdui:Scope>`, the check might flag `domain_no_federation`. But the parent-domain rollup logic (noted as a failure mode) would likely catch the parent `u.edu` as federated and pass it. Net: depends on implementation of the rollup logic.

- **Self-issued visiting/affiliate account:**
  - **MISSED** (if institution is federated) or **CAUGHT** (if institution is a small non-federated college). Same reasoning as the adjunct variant.

**Net assessment:** Moderate resistance against attackers targeting small non-federated institutions. Zero resistance against attackers targeting federated institutions. The check's value here is as a *filter* that separates federated (higher-trust) from non-federated (lower-trust) domains.

---

### 9. credential-compromise

**Summary:** Attacker compromises a real PI's institutional email.

**Bypass methods:** Compromised `.edu` email on a federated domain.

- **MISSED.** Domain is federated. Clean pass.

**Net assessment:** Zero resistance.

---

### 10. dormant-account-takeover

**Summary:** IT admin takes over a dormant provider account.

**Bypass methods:**

- **Bypass A — Redirect original holder's mailbox:**
  - **MISSED.** Same federated domain.

- **Bypass B — Re-activate deprovisioned account:**
  - **MISSED.** Same domain.

- **Bypass C — New mailbox for fabricated persona:**
  - **MISSED.** The fabricated persona is on the same institutional domain, which is federated. Domain-level check passes.

**Net assessment:** Zero resistance. The check operates at the domain level; all bypasses use the same domain.

---

### 11. foreign-institution

**Summary:** Lone operator exploits verification gaps at mid-tier non-Anglophone institutions.

**Bypass methods:**

- **Visiting-researcher account via local-language sysadmin request:**
  - **AMBIGUOUS.** Depends on whether the target institution's national federation is in eduGAIN. Brazilian federal universities are likely in RNP/CAFe (Brazil's R&E federation, which is in eduGAIN). Japanese prefectural labs may or may not be in GakuNin/eduGAIN. Indian state agricultural universities are likely *not* in eduGAIN (India's INFED joined eduGAIN only recently and coverage is thin). Indonesian/Vietnamese national research institutes are unlikely to be in eduGAIN. Russian-language CIS institutions are not in eduGAIN.
  - Where the institution *is* in eduGAIN: **MISSED** — domain matches scope.
  - Where the institution is *not* in eduGAIN: `domain_no_federation` fires — **CAUGHT** as a low-trust signal. But this also fires for legitimate staff at those institutions, so the signal is diluted by false positives.

- **Alumni / legacy credentials:**
  - **AMBIGUOUS.** Same institution-dependent logic.

- **Semi-legitimate short visiting appointment:**
  - **AMBIGUOUS.** Same.

**Net assessment:** Moderate resistance for non-Anglophone institutions outside eduGAIN's coverage. Zero resistance for institutions inside eduGAIN. The check's value is as a coarse trust-tier signal: federated domains get a fast pass, non-federated domains get escalated.

---

### 12. dormant-domain

**Summary:** Patient lone operator acquires a defunct research entity's canonical domain.

**Bypass methods:**

- **Acquire lapsed domain + stand up website and mail server:**
  - **CAUGHT.** The revived domain is not a registered IdP in InCommon or eduGAIN. The defunct entity's IdP (if it ever had one) would have been deregistered when the entity closed. `domain_no_federation` fires. This is a genuine catch.

**Net assessment:** Strong resistance. This is one of the federation check's best-case scenarios: a revived domain that no longer corresponds to an active academic IdP is correctly flagged as non-federated.

---

### 13. shell-company

**Summary:** Shell company with self-owned domain.

**Bypass methods:**

- **Self-owned domain + Google Workspace:**
  - **CAUGHT.** A newly-registered LLC domain is not in InCommon or eduGAIN. `domain_no_federation` fires.

**Net assessment:** Strong resistance. The federation check correctly identifies the shell company's domain as non-academic/non-federated.

---

### 14. shell-nonprofit

**Summary:** Shell research nonprofit with self-owned domain.

**Bypass methods:**

- **Self-owned domain:**
  - **CAUGHT.** Not in any R&E federation.

- **ROR self-listing (persistence variant):**
  - Not relevant to this idea (federation check, not ROR).

**Net assessment:** Strong resistance. Same as shell-company.

---

### 15. cro-framing

**Summary:** Individual registers a CRO LLC with self-owned domain.

- **CAUGHT.** LLC domain is not in InCommon or eduGAIN. `domain_no_federation` fires.

**Net assessment:** Strong resistance.

---

### 16. cro-identity-rotation

**Summary:** Multiple CRO LLCs, each with its own domain.

- **CAUGHT.** Each LLC domain is individually non-federated. `domain_no_federation` fires on each.

**Net assessment:** Strong resistance per entity.

---

### 17. biotech-incubator-tenant

**Summary:** LLC at a biotech incubator.

- **CAUGHT.** The LLC's own domain is not federated.
- **Note:** If the attacker uses an email at the incubator's domain (e.g., `tenant@biolabs.io`), the incubator domain is also not in an R&E federation. Still caught.

**Net assessment:** Strong resistance.

---

### 18. gradual-legitimacy-accumulation

**Summary:** Patient individual builds a real-but-hollow small biotech.

- **CAUGHT.** The LLC domain is not in an R&E federation regardless of how much legitimacy is accumulated. LinkedIn, Crunchbase, and bioRxiv listings do not create an InCommon/eduGAIN IdP.

**Net assessment:** Strong resistance. The federation check is immune to accumulated self-asserted signals.

---

### 19. community-bio-lab-network

**Summary:** Community biology labs registered as LLCs/nonprofits.

- **CAUGHT.** Community lab domains are not in R&E federations. DIYbio.org and DIYbiosphere listings have no bearing on federation metadata.

**Net assessment:** Strong resistance.

---

## Findings

### Finding 1 — Critical: Genuine insiders and real appointees at federated institutions pass with zero resistance

**Source:** visiting-researcher, unrelated-dept-student, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise, it-persona-manufacturing, dormant-account-takeover (9+ stories).

**Why missed:** The federation check validates the *domain*, not the *individual*. Any email on a federated domain gets a strong pass. This means the check provides zero signal about whether a specific person at a federated institution is legitimate, authorized, or acting in good faith. It is structurally a domain-trust check, not a person-affiliation check.

**Suggestion for stage 4 re-research:** This gap is structural to the "out-of-band metadata lookup" design. The implementation explicitly chose not to require actual federated SSO authentication. If the implementation *did* require SSO, it could obtain `eduPersonScopedAffiliation` attributes (e.g., `faculty@`, `staff@`, `student@`) which would at least distinguish role categories — though it still would not catch insiders. Requiring SSO, however, would fundamentally change the cost structure (InCommon membership, SP registration, SAML integration). This finding is structural within the current out-of-band design.

### Finding 2 — Moderate: Non-Anglophone institution coverage creates a two-tier system

**Source:** foreign-institution.

**Why missed:** The check correctly identifies non-federated domains as lower-trust, but eduGAIN coverage is geographically uneven. Institutions in Western Europe and Australasia are well-covered; institutions in India, Southeast Asia, Central Asia, Sub-Saharan Africa, and the CIS are poorly covered. Legitimate researchers at non-federated institutions are flagged alongside attackers, producing a correlated false-positive pattern that must be managed by the manual review SOP.

**Suggestion for stage 4 re-research:** No implementation change needed; this is correctly handled by the manual review SOP (reviewer cross-references against ROR and global HE lists). Stage 6 should quantify the eduGAIN coverage gap by region.

### Finding 3 — Minor: Alumni-forwarder domain rollup logic is unspecified

**Source:** inbox-compromise (alumni-for-life forwarder variant).

**Why missed:** The implementation notes sub-domain rollup as a failure mode but does not specify the rollup policy. If `alumni.u.edu` rolls up to `u.edu` (which is a registered scope), the alumni forwarder passes — which may be undesirable since alumni are not current affiliates.

**Suggestion:** Define an explicit policy: `alumni.*` sub-domains should NOT roll up to the parent scope for purposes of this check. The `alumni` prefix should be treated as a negative signal (stale affiliation).

---

## bypass_methods_known

| Story | Bypass method | Classification |
|---|---|---|
| it-persona-manufacturing | Sub-paths A–D (all on federated domain) | MISSED |
| visiting-researcher | Genuine appointment at federated institution | MISSED |
| unrelated-dept-student | Canonical .edu at federated institution | MISSED |
| unrelated-dept-student | Federated login (InCommon/eduGAIN) | MISSED |
| lab-manager-voucher | Genuine employment at federated institution | MISSED |
| bulk-order-noise-cover | Genuine employment at federated institution | MISSED |
| insider-recruitment | Genuine insider at federated institution | MISSED |
| account-hijack | Inherited PI identity at federated institution | MISSED |
| inbox-compromise | Adjunct at non-federated small college | CAUGHT (if non-federated) |
| inbox-compromise | Adjunct at federated institution | MISSED |
| inbox-compromise | Alumni-for-life forwarder | AMBIGUOUS (rollup logic) |
| inbox-compromise | Self-issued visiting account | AMBIGUOUS (institution-dependent) |
| credential-compromise | Compromised .edu email at federated institution | MISSED |
| dormant-account-takeover | Bypasses A–C (all on federated domain) | MISSED |
| foreign-institution | Visiting-researcher at federated institution | MISSED |
| foreign-institution | Visiting-researcher at non-federated institution | CAUGHT |
| dormant-domain | Revived lapsed domain | CAUGHT |
| shell-company | Self-owned LLC domain | CAUGHT |
| shell-nonprofit | Self-owned nonprofit domain | CAUGHT |
| cro-framing | Self-owned CRO domain | CAUGHT |
| cro-identity-rotation | Per-entity self-owned domain | CAUGHT |
| biotech-incubator-tenant | LLC domain or incubator domain | CAUGHT |
| gradual-legitimacy-accumulation | LLC domain | CAUGHT |
| community-bio-lab-network | Community lab domain | CAUGHT |

## bypass_methods_uncovered

- **Structural — any attacker on a federated domain:** it-persona-manufacturing, visiting-researcher, unrelated-dept-student, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise, dormant-account-takeover (all bypass methods at federated institutions)
- **Implementation-specific — alumni-forwarder rollup:** inbox-compromise alumni variant

## Verdict

**STRUCTURAL** — one Critical finding (Finding 1: genuine insiders/appointees at federated institutions pass with zero resistance). This is structural to the out-of-band domain-level design — the check is a domain-trust classifier, not a person-affiliation verifier. It catches purpose-built-organization attackers (shell companies, CROs, dormant domains, community labs — 8 stories) with strong resistance, which is substantial value, but provides zero resistance against exploit-affiliation and fake-affiliation attackers who operate on genuinely federated domains (9+ stories). This structural finding is routed to human review at the end of the run. Pipeline continues to stage 6.
