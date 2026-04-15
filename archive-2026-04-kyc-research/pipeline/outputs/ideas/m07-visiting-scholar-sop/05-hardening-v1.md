# m07-visiting-scholar-sop — bypass-aware hardening v1

## Attacker stories walked

### 1. it-persona-manufacturing

**Summary:** IT admin at a real university manufactures a directory entry and email for a fake persona.

**Bypass methods relevant to M07:**

- **Sub-path A — Loose-governance direct injection:** Creates a mail alias and directory entry.
  - **CAUGHT — partially.** The SOP triggers when the customer's web footprint is sparse. A manufactured persona with only a directory entry and no publications/lab page/news would trigger the SOP. Step 2 (sponsor-PI confirmation) is the key test: the attacker must name a sponsoring PI, and the PI must confirm via institutional email. If the PI is unwitting (the IT admin forged the persona without PI knowledge), the PI would deny knowing the person → `sponsor_pi_denies_affiliation` → order denied. If the PI is complicit, the PI confirms → PASS.
  - Classification: **CAUGHT** against an IT admin acting alone; **MISSED** against an IT admin with a complicit PI.

- **Sub-path B — Visiting-scholar pathway:** "Initiates a visiting-scholar appointment with a real PI as sponsor."
  - **MISSED.** The SOP's step 2 asks the sponsoring PI to confirm the visiting appointment. The PI *is* the real sponsor — the PI legitimately initiated the appointment (even if unwittingly serving as cover). The PI confirms. The research-visitors office also confirms because the appointment is real. All three corroborator paths return positive. The SOP passes the attacker.

- **Sub-path C — Reuse of departed member's directory entry.**
  - **CAUGHT.** The manufactured persona claims to be the departed member (or a new person in the departed member's slot). Step 2: the "sponsoring PI" either (a) does not recognize the name and denies, or (b) recognizes the departed member and says "they left." Step 3: the research-visitors office confirms no current appointment. Result: `research_office_unable_to_confirm` → deny. Exception: if the IT admin also manipulates the research-visitors office records (sub-path D territory), the check is defeated.

- **Sub-path D — HR-system injection.**
  - **AMBIGUOUS.** If the HR record is comprehensive enough that the research-visitors office can confirm the persona (because the office relies on the same HR system the attacker injected into), step 3 returns a false positive. Whether the research-visitors office checks HR directly or maintains its own appointment records is institution-dependent. Classification: **AMBIGUOUS** — depends on institutional architecture.

**Net assessment:** Moderate resistance against sub-paths A (acting alone) and C. Weak resistance against sub-path B (real appointment) and D (HR injection that propagates to the visitors office). The SOP's effectiveness depends heavily on whether the sponsoring PI is complicit and whether the visitors office has independent records.

---

### 2. visiting-researcher

**Summary:** Lone operator obtains a real visiting-scholar appointment at a US/European R1.

**Bypass methods:** None needed — the attacker has a genuine appointment.

- **MISSED.** The SOP's step 2 (sponsor-PI confirmation) succeeds because the PI really did sponsor the attacker. Step 3 (research-visitors office) also succeeds because the appointment is real. All corroborators confirm.

**Net assessment:** Zero resistance. This is the SOP's central weakness: a real visiting-scholar appointment with a genuine sponsor and genuine institutional appointment records passes every step of the corroboration process. The attacker story is specifically designed to defeat this kind of check.

---

### 3. unrelated-dept-student

**Summary:** Currently enrolled grad student in a non-wet-lab department.

- **AMBIGUOUS.** Whether the SOP triggers depends on whether the student's web footprint is "sparse." A grad student may have a lab page, publication, or department listing — if so, step 1 (web corroboration) passes and the SOP exits early. If the student is new or the department doesn't publish student pages, the SOP proceeds to step 2: the student names a PI, and the PI confirms enrollment. The confirmation is genuine.
- **MISSED** in the general case: the student is genuinely affiliated. The SOP confirms genuine affiliation.

**Net assessment:** Zero resistance. The SOP confirms real enrollment, which is exactly the problem — the student's affiliation is real but their department is irrelevant to wet-lab work. The SOP does not check department relevance.

---

### 4. lab-manager-voucher

**Summary:** Insider with legitimate ordering role.

- **MISSED.** The SOP probably doesn't trigger at all (the insider has a strong web footprint from years of employment). If it does trigger, step 1 (web corroboration) returns positive (core facility page, lab page, publications listing). If step 1 fails, step 2 (PI confirmation) succeeds because the PI employs the insider.

**Net assessment:** Zero resistance.

---

### 5. bulk-order-noise-cover

**Summary:** Core facility technician or cross-PI admin.

- **MISSED.** Same as lab-manager-voucher. Genuine employee with a strong institutional footprint.

**Net assessment:** Zero resistance.

---

### 6. insider-recruitment

**Summary:** External handler pays a legitimate insider.

- **MISSED.** The insider is a real institutional member. SOP confirms the genuine affiliation. The handler is invisible.

**Net assessment:** Zero resistance.

---

### 7. account-hijack

**Summary:** Attacker compromises a PI's email and takes over their provider account.

- **MISSED.** The hijacked PI has a faculty page (step 1 passes). Even if step 2 is invoked, the "PI" is the hijacked account itself — the attacker responds from the PI's email, effectively confirming their own identity. The SOP's step 2 has a noted failure mode: "email-thread phishing risk: an attacker who controls the customer's mailbox could also control a fake 'PI' address on the same compromised domain." The SOP instructs to "require the PI's address to be independently verified against the institution's faculty directory before trusting the reply" — which catches the case where the attacker forges a PI email, but NOT the case where the attacker IS the PI (or is using the PI's real mailbox).

**Net assessment:** Zero resistance. The PI's web presence is genuine.

---

### 8. inbox-compromise

**Summary:** Lone operator compromises a dormant email at a small college.

**Bypass methods:**

- **Adjunct account recovery:**
  - **CAUGHT.** The departed adjunct has a sparse or absent web footprint at the institution. Step 1 (web search) may find a stale faculty page but `low_quality_hits_only` routes to step 2. Step 2: the attacker must name a sponsoring PI. If the adjunct was real and had a known PI, the PI would say "they left." If the attacker invents a PI name, the PI won't respond or will deny. Step 3: the research-visitors office confirms no current appointment for the adjunct. Result: `research_office_unable_to_confirm` → deny.

- **Alumni-for-life forwarder:**
  - **CAUGHT.** An alumni has no current appointment. Step 1 finds no current web presence. Step 2: the attacker must name a PI, who either doesn't know them or says "they're an alum, not a current researcher." Step 3: no appointment on record. Deny.

- **Self-issued visiting/affiliate account:**
  - **CAUGHT — partially.** If the attacker's name is on the directory (per the source), step 1 might find the listing. But step 2 (PI confirmation) is the gating check: the attacker must name a real PI. If the departmental sysadmin who issued the account acts as "sponsor," the sysadmin is not a PI and the SOP should require PI-level confirmation. But if the institution's research-visitors office confirms the account (because the sysadmin registered it in the system), step 3 passes → **MISSED.**

**Net assessment:** Strong resistance against adjunct and alumni variants. Moderate resistance against self-issued accounts (depends on whether the sysadmin's registration propagates to the visitors office).

---

### 9. credential-compromise

**Summary:** Attacker compromises a real PI's email.

- **MISSED.** The PI has a faculty page. Step 1 passes immediately. The SOP exits with PASS based on web corroboration alone.

**Net assessment:** Zero resistance.

---

### 10. dormant-account-takeover

**Summary:** IT admin takes over a dormant provider account.

**Bypass methods:**

- **Bypass A — Redirect original holder's mailbox:**
  - **AMBIGUOUS.** The original holder may still have a live faculty page (step 1 passes) — **MISSED** in that case. If the page is gone, step 2: the attacker (as IT admin) might respond to the PI-confirmation email from the original holder's mailbox, self-confirming. The SOP's anti-spoofing check ("independently verify PI's address against faculty directory") would verify that the email comes from a listed faculty member — and the original holder may still be listed. **MISSED** if the original holder is still listed; **CAUGHT** if fully removed.

- **Bypass C — Fabricated persona:**
  - **CAUGHT.** The fabricated persona has no web footprint. Step 1 fails. Step 2: the attacker must name a PI. If the PI is unknowing, they deny. Step 3: no appointment on record. Deny.
  - Exception: the IT admin who fabricated the persona could also fabricate a visitors-office record (sub-path D overlap), in which case step 3 returns a false positive.

**Net assessment:** Strong resistance against Bypass C (fabricated persona). Weak-to-no resistance against Bypass A (departed researcher with residual web presence).

---

### 11. foreign-institution

**Summary:** Lone operator exploits verification gaps at non-Anglophone institutions.

**Bypass methods:**

- **Visiting-researcher account via local-language sysadmin request:**
  - **AMBIGUOUS.** The SOP's step 3 (contact the research-visitors office) is the key check. But the implementation notes "Customer claims an institution that has no centralized research-visitors office (smaller colleges, foreign institutions)" as a failure mode. Many non-Anglophone institutions lack a centralized visitors office with a publicly listed email. Step 2 (PI confirmation) may also fail because the "PI" is a local professor who doesn't respond to English-language emails promptly. The SOP adds "1-10 days of wall-clock latency" — for foreign institutions, this may be weeks.

- **Alumni / legacy credentials:**
  - **CAUGHT** if the institution cooperates with step 3. **MISSED** if not.

- **Semi-legitimate short visiting appointment:**
  - **MISSED** if the appointment is genuine and the PI/visitors office confirms.

**Net assessment:** Weak resistance. The SOP depends on institutional cooperation, which is weakest at exactly the non-Anglophone institutions this attacker targets. The implementation acknowledges this but has no fallback.

---

### 12. dormant-domain

**Summary:** Attacker acquires a defunct entity's domain.

- **CAUGHT.** The SOP requires corroboration from a living institutional contact. The defunct entity has no research-visitors office, no active PIs, and no current web footprint beyond the attacker's own content. Step 1 might find the attacker's own "we're back" page but the reviewer should recognize it as self-published. Steps 2 and 3 fail: no PI to contact, no office to call. Deny.

**Net assessment:** Strong resistance. The SOP's reliance on human institutional contacts is a strength here — a dead institution has no contacts to confirm.

---

### 13. shell-company

**Summary:** Shell company with real employees.

- **CAUGHT — partially.** The SOP triggers because the customer's footprint is sparse. Step 1: web search may find the attacker's own website, but it's self-published. Step 2: the "sponsoring PI" would be the attacker themselves or a co-conspirator listed as the company's "research director." The SOP requires the PI's address to be independently verified against the institution's faculty directory — but for a shell company, there is no independent faculty directory. Step 3: there is no research-visitors office at a shell LLC.
- However: the SOP as written is targeted at *visiting scholars at universities*, not at small companies. The failure mode text notes "Visiting scholars at corporate research labs (Google Research, Microsoft Research, pharma) where there is no 'visiting scholar office' analog." A shell company would hit this same path, and the SOP does not have a clear DENY workflow for entities that simply lack a visitors office — it defaults to "require additional KYC (M19, M20)."

**Net assessment:** Moderate resistance. The SOP correctly identifies the lack of institutional infrastructure but does not hard-deny — it escalates. The escalation to M19/M20 is the real barrier, not this SOP.

---

### 14–16. shell-nonprofit, cro-framing, cro-identity-rotation

- Same analysis as shell-company. The SOP escalates because there is no research-visitors office. **CAUGHT — partially** (escalation, not denial).

**Net assessment:** Moderate resistance per entity. Real barrier is the escalation target (M19/M20).

---

### 17. biotech-incubator-tenant

**Summary:** LLC at a biotech incubator.

- **AMBIGUOUS.** The incubator may have an admin office that can confirm tenancy (analogous to a research-visitors office). If the incubator cooperates, step 3 succeeds — and the attacker is genuinely a tenant. **MISSED** if the incubator confirms.

**Net assessment:** Weak resistance. If the incubator is cooperative, the SOP confirms the attacker's genuine tenancy.

---

### 18. gradual-legitimacy-accumulation

**Summary:** Patient individual builds a hollow biotech.

- Same as shell-company/CRO framing. No visitors office, no independent PI directory. SOP escalates to M19/M20. **CAUGHT — partially.**

**Net assessment:** Moderate resistance (escalation, not denial).

---

### 19. community-bio-lab-network

**Summary:** Community biology labs.

- Same analysis. No visitors office, no PI directory. SOP escalates. **CAUGHT — partially.**

**Net assessment:** Moderate resistance.

---

## Findings

### Finding 1 — Critical: Real visiting-scholar appointments defeat the SOP completely

**Source:** visiting-researcher, it-persona-manufacturing (sub-path B).

**Why missed:** The SOP is designed to corroborate visiting-scholar claims by contacting the sponsoring PI and the research-visitors office. When the appointment is *genuine* — the PI really did sponsor the person, the visitors office really did process the appointment — every corroboration step returns positive. The visiting-researcher branch is specifically designed to exploit this: "Nearly every KYC measure is pass-through once the appointment issues." The SOP cannot distinguish a visiting scholar with malicious intent from one with benign intent, because the corroboration targets (PI, visitors office) only know that the appointment exists, not why the visitor wants oligos.

**Suggestion for stage 4 re-research:** This gap is structural to any corroboration-based SOP. The visiting-researcher story is designed to defeat affiliation checks by obtaining genuine affiliation. The countermeasure would need to go beyond affiliation verification to *purpose* verification — which is M15 (self-declaration) and M19 (individual legitimacy SOC) territory, not M07 territory. The implementation document should explicitly acknowledge that the SOP cannot catch the visiting-researcher attack. One possible tightening: add a step where the SOP asks the sponsoring PI not just "is this person your visiting scholar?" but also "what is the research project for which they need oligo synthesis?" and cross-reference the answer against the ordered sequences. This would not be a stage 4 implementation change but a new M15/M19-adjacent signal layered into the SOP.

### Finding 2 — Critical: Genuine insiders pass with zero resistance across 5 stories

**Source:** lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise.

**Why missed:** Same structural issue as all M07 ideas: the SOP confirms genuine affiliation, and these attackers have genuine affiliation. The handler in insider-recruitment is invisible by construction. The hijacker in account-hijack/credential-compromise operates under a real PI's identity whose web presence and institutional records are all genuine.

**Suggestion for stage 4 re-research:** Not addressable. Structural to M07.

### Finding 3 — Moderate: Non-Anglophone institution cooperation gap

**Source:** foreign-institution.

**Why missed:** The SOP's steps 2 and 3 require institutional contacts to respond to English-language verification queries. Many non-Anglophone institutions have no centralized research-visitors office reachable by email, and PIs may be slow or unresponsive to unfamiliar English correspondence. The implementation notes this as a failure mode but provides no fallback beyond "require additional KYC (M19, M20)."

**Suggestion:** Define explicit SLA: if no institutional response within 10 business days for a non-Anglophone institution, route to an alternative verification path (e.g., require the customer to provide a signed letter on institutional letterhead, or accept a confirmation from a known InCommon/eduGAIN federated email instead). This reduces the wall-clock delay.

### Finding 4 — Moderate: SOP assumes university-like institutional structure

**Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network (7 stories).

**Why missed:** The SOP's three corroboration paths (web search, PI email, research-visitors office) are designed for universities. Non-university entities (LLCs, nonprofits, incubator tenants, community labs) have no research-visitors office and may not have an identifiable PI. The SOP correctly escalates these to "require additional KYC (M19, M20)" but does not define when to trigger this escalation vs. when to attempt the university-focused SOP. A screening analyst encountering a small CRO would waste time running steps 2-3 before realizing the institution has no visitors office.

**Suggestion:** Add a pre-check: before running the SOP, classify the institution as university/hospital/government-lab vs. company/nonprofit/incubator. For the latter category, skip steps 2-3 and route directly to M19/M20 escalation.

### Finding 5 — Minor: Account-hijack email self-confirmation loophole

**Source:** account-hijack.

**Why missed:** The SOP's step 2 requires PI confirmation from an institutional email. If the "customer" IS the PI (whose account was hijacked), the attacker can self-confirm by responding from the hijacked PI mailbox. The SOP notes the need to "independently verify the PI's address against the faculty directory" — but this verification confirms the PI is real, not that the person controlling the mailbox is the PI. This is a known limitation that the SOP acknowledges but does not resolve.

**Suggestion:** Cross-reference with M16 (MFA step-up) to verify the person controlling the account is the PI. Not addressable within M07 alone.

---

## bypass_methods_known

| Story | Bypass method | Classification |
|---|---|---|
| it-persona-manufacturing | Sub-path A (IT admin alone, no PI complicity) | CAUGHT |
| it-persona-manufacturing | Sub-path A (with complicit PI) | MISSED |
| it-persona-manufacturing | Sub-path B (real visiting appointment) | MISSED |
| it-persona-manufacturing | Sub-path C (departed member) | CAUGHT |
| it-persona-manufacturing | Sub-path D (HR injection → visitors office) | AMBIGUOUS |
| visiting-researcher | Genuine visiting appointment | MISSED |
| unrelated-dept-student | Real enrollment | MISSED |
| lab-manager-voucher | Genuine employment | MISSED |
| bulk-order-noise-cover | Genuine employment | MISSED |
| insider-recruitment | Genuine insider | MISSED |
| account-hijack | Inherited PI identity + self-confirmation | MISSED |
| inbox-compromise | Adjunct account recovery | CAUGHT |
| inbox-compromise | Alumni forwarder | CAUGHT |
| inbox-compromise | Self-issued visiting account (no visitors-office record) | CAUGHT |
| inbox-compromise | Self-issued visiting account (with visitors-office record) | MISSED |
| credential-compromise | Compromised PI email | MISSED |
| dormant-account-takeover | Bypass A (departed researcher still listed) | MISSED |
| dormant-account-takeover | Bypass A (departed researcher fully removed) | CAUGHT |
| dormant-account-takeover | Bypass C (fabricated persona) | CAUGHT |
| foreign-institution | Visiting-researcher (genuine appointment) | MISSED |
| foreign-institution | Visiting-researcher (institution uncooperative) | AMBIGUOUS |
| foreign-institution | Alumni/legacy credentials | CAUGHT (if office cooperates) |
| dormant-domain | Revived domain, no live contacts | CAUGHT |
| shell-company | No visitors office → escalation | CAUGHT (partial — escalation) |
| shell-nonprofit | No visitors office → escalation | CAUGHT (partial — escalation) |
| cro-framing | No visitors office → escalation | CAUGHT (partial — escalation) |
| cro-identity-rotation | No visitors office → escalation per entity | CAUGHT (partial — escalation) |
| biotech-incubator-tenant | Incubator confirms tenancy | MISSED |
| gradual-legitimacy-accumulation | No visitors office → escalation | CAUGHT (partial — escalation) |
| community-bio-lab-network | No visitors office → escalation | CAUGHT (partial — escalation) |

## bypass_methods_uncovered

- **Structural — genuine visiting appointments:** visiting-researcher, it-persona-manufacturing sub-path B
- **Structural — genuine insiders:** lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise
- **Implementation-specific — non-Anglophone institution cooperation:** foreign-institution (genuine appointments at unresponsive institutions)
- **Implementation-specific — account-hijack self-confirmation:** account-hijack

## Verdict

**STRUCTURAL** — two Critical findings. Finding 1 (real visiting-scholar appointments defeat the SOP) is structural: the SOP verifies that an appointment exists but cannot assess the appointee's intent, which is the visiting-researcher story's entire design. Finding 2 (genuine insiders pass) is structural to M07's scope. Both are routed to human review. The SOP does provide meaningful resistance against purpose-built-organization attackers (via escalation to M19/M20 when no visitors office exists), against inbox-compromise variants (adjunct, alumni), and against dormant-domain attacks. Pipeline continues to stage 6.
