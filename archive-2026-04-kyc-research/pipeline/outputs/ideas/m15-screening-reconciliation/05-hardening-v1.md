# m15-screening-reconciliation — Bypass-aware hardening v1

- **idea:** Sequence-screening / declaration reconciliation across Aclid + Battelle UltraSEQ + SecureDNA
- **measure:** M15 — soc-self-declaration
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walkthrough

### 1. lab-manager-voucher — exploit-affiliation, Branch C

**Summary:** Real lab manager orders SOC using vague end-use language.

**Bypass methods relevant to M15:**

1. **Vague end-use self-declaration.**
   - **CAUGHT.** The reconciler compares the vendor screening output (which identifies the specific SOC organism/threat class) against the customer's declared `intended_use_category` and `host_organism`. A vague declaration like "molecular biology research" with no specific organism declared triggers `inferred_organism_mismatch` and `soc_screening_disagreement` when the vendor identifies a select agent or BWC-listed organism. The declaration's vagueness is exactly what makes the disagreement detectable.

**Net assessment:** Strong. This is the canonical use case for the reconciler.

---

### 2. unrelated-dept-student — exploit-affiliation, Branch A

**Summary:** Student orders SOC under generic "research purposes."

**Bypass methods relevant to M15:**

1. **Generic end-use description.**
   - **CAUGHT.** Same mechanism as lab-manager-voucher. "Research purposes" declares no specific organism; vendor identifies a SOC → disagreement → flag.

**Net assessment:** Strong.

---

### 3. cro-framing — purpose-built, Branch A

**Summary:** Real LLC with engineered alignment between cover story and SOC declarations.

**Bypass methods relevant to M15:**

1. **Self-authored biosafety plan with scope matching SOC orders.**
   - **MISSED.** The CRO declares the SOC (e.g., "diagnostic assay development for [pathogen]"), and the screening output confirms the same pathogen. Declaration and screening agree. The reconciler finds no disagreement.

2. **Predatory-journal publication seeding.**
   - **MISSED.** Irrelevant to screening reconciliation.

**Net assessment:** Structural defeat. When the attacker declares the SOC honestly (with a fabricated justification), reconciliation passes.

---

### 4. cro-identity-rotation — purpose-built, Branch B

**Summary:** Rotating CRO personas matching service areas to SOC orders.

**Bypass methods relevant to M15:**

1. **Per-persona service area matches SOC orders.**
   - **MISSED.** Same as cro-framing: declared use matches screening output.

**Net assessment:** Structural defeat.

---

### 5. gradual-legitimacy-accumulation — purpose-built, Branch E

**Summary:** Attacker builds legitimate history then orders SOC.

**Bypass methods relevant to M15:**

1. **Cover-story legitimacy justifies SOC declaration.**
   - **MISSED.** Attacker declares the SOC with a plausible research justification. Screening confirms the SOC. Reconciler sees agreement.

**Net assessment:** Structural defeat.

---

### 6. account-hijack — impersonate-employee, Branch C

**Summary:** SOC orders through hijacked PI account matching PI's research.

**Bypass methods relevant to M15:**

1. **Declared use matches the real PI's scope.**
   - **MISSED.** The hijacker declares SOC use consistent with the PI's work. Screening finds the SOC. Reconciler sees agreement.

**Net assessment:** No engagement.

---

### 7. visiting-researcher — fake-affiliation, Branch D

**Summary:** Orders framed as sponsored collaboration.

**Bypass methods relevant to M15:**

1. **Declaration references sponsor's research program.**
   - **AMBIGUOUS.** If the visitor declares the SOC and provides a plausible research framing, reconciliation passes. If the visitor doesn't declare the SOC (hoping screening misses it), the reconciler catches the gap. The outcome depends on whether the attacker honestly declares the SOC.

**Net assessment:** Partial — catches non-declaration but not honest-declaration-with-fake-justification.

---

### 8. inbox-compromise — fake-affiliation, Branch B

**Summary:** Orders through compromised inbox claiming exemption.

**Bypass methods relevant to M15:**

1. **Claim exemption / no IBC required.**
   - **CAUGHT.** The exemption claim produces no SOC declaration, but the screening vendors identify the SOC in the sequences. `soc_screening_disagreement` fires: vendor flagged SOC, customer did not declare. This is the classic reconciliation case.

**Net assessment:** Strong.

---

### 9. shell-company — Branch D

**Summary:** Real LLC claiming exemption.

**Bypass methods relevant to M15:**

1. **Claim exemption from SOC categories.**
   - **CAUGHT** (if exemption = no declaration). Same as inbox-compromise: screening finds SOC, customer didn't declare → flag.
   - **MISSED** (if the company declares the SOC with a cover story). If the shell company provides a benign-sounding but technically aligned declaration, reconciliation passes.

**Net assessment:** Catches bare exemption claims; misses sophisticated cover stories.

---

### 10. insider-recruitment — impersonate-employee, Branch B

**Summary:** Recruited insider declares SOC orders covered by IBC protocol.

**Bypass methods relevant to M15:**

1. **Self-attest covered by IBC protocol.**
   - **MISSED.** The insider declares the SOC honestly under the lab's real protocol. Screening confirms. Reconciler passes.

**Net assessment:** No engagement.

---

### 11. it-persona-manufacturing — exploit-affiliation, Branch B

**Summary:** Multiple personas with modified IBC paperwork.

**Bypass methods relevant to M15:**

1. **Lift-and-modify IBC letter backs declaration.**
   - **MISSED.** Each persona declares the SOC consistently. Screening confirms. No reconciliation disagreement.

**Net assessment:** No engagement.

---

### 12. bulk-order-noise-cover — exploit-affiliation, Branch E

**Summary:** SOC orders hidden in bulk legitimate ordering.

**Bypass methods relevant to M15:**

1. **SOC orders under shared generic declaration.**
   - **CAUGHT.** If the facility's generic declaration does not mention the specific SOC organism, but screening identifies it, `soc_screening_disagreement` fires. The noise cover doesn't help because reconciliation operates per-order-line, not in aggregate.

**Net assessment:** Strong — per-order-line reconciliation cuts through volume noise.

---

### 13. biotech-incubator-tenant — purpose-built, Branch D

**Summary:** Incubator tenant with self-consistent research scope.

**Bypass methods relevant to M15:**

1. **Stated research scope matches SOC orders.**
   - **MISSED.** Same as cro-framing: declaration matches screening.

**Net assessment:** No engagement.

---

### 14. dormant-account-takeover — exploit-affiliation, Branch D

**Summary:** Reactivated dormant account inherits lab's scope.

**Bypass methods relevant to M15:**

1. **SOC orders matching previously-recorded lab research area.**
   - **MISSED.** Attacker declares SOC use consistent with the dormant lab's scope. Screening confirms.

**Net assessment:** No engagement.

---

## Findings

### Critical

None.

### Moderate

**M1 — Reconciliation is structurally blind to honest-declaration-with-fabricated-justification.**

- **Stories affected:** cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, account-hijack, insider-recruitment, it-persona-manufacturing, biotech-incubator-tenant, dormant-account-takeover (8 stories).
- **Why missed:** The reconciler checks whether the declaration *matches* the screening output. When the attacker declares the SOC (with a false or borrowed justification), the reconciler sees agreement. Intent evaluation is outside scope.
- **Note:** This is structural to any reconciliation approach. Not addressable by tweaking the implementation. Complementary ideas (m15-ibc-attestation, m15-llm-extraction) address justification quality.

**M2 — Novel functional analogs not in any vendor DB.**

- **Stories affected:** Cross-cutting (any attacker using codon-optimized or functionally analogous sequences).
- **Why missed:** All three vendors rely on homology or curated threat databases. Codon-optimized sequences, chimeric constructs, or synthetic biology approaches producing the same function from different sequences may evade all vendors simultaneously. The implementation acknowledges this as "known structural gap of all sequence-screening tools."
- **Note:** This is a fundamental limitation of current sequence-screening technology, not a gap in this idea's implementation. Not addressable here.

**M3 — Short sequences below vendor minimum length.**

- **Stories affected:** Cross-cutting (attackers who split orders into short fragments).
- **Why missed:** Battelle's minimum is ~200 bp per fragment. An attacker who orders sequences below this threshold may evade screening on some vendors. The implementation notes this but does not specify a minimum-length enforcement policy.
- **Suggestion for re-research:** Stage 4 should specify minimum order-line length for screening (or flag short fragments for aggregation before screening).

### Minor

**N1 — Aclid and Battelle API specs are vendor-gated.**

- **Stories affected:** Operational.
- **Why ambiguous:** The implementation cannot specify auth model, exact endpoint, or pricing for Aclid or Battelle. Integration requires sales contact for both.
- **Note:** Appropriately flagged as `[vendor-gated]`. Not a bypass issue.

**N2 — Vendor-disagreement adjudication not well-specified.**

- **Stories affected:** All (where vendors disagree).
- **Why ambiguous:** The implementation says the reviewer "adjudicates" when vendors disagree but does not specify a decision rule (e.g., any-flag-wins vs. majority-flag-wins). A conservative any-flag-wins policy maximizes sensitivity but increases reviewer load.
- **Suggestion:** Specify the adjudication rule.

---

## bypass_methods_known

| # | Bypass method | Classification | Stories |
|---|---|---|---|
| 1 | Vague/generic declaration vs. vendor SOC hit | CAUGHT | lab-manager-voucher, unrelated-dept-student |
| 2 | Exemption claim vs. vendor SOC hit | CAUGHT | inbox-compromise, shell-company (bare claim) |
| 3 | Boilerplate facility declaration vs. per-line vendor hit | CAUGHT | bulk-order-noise-cover |
| 4 | Honest SOC declaration with fabricated justification | MISSED | cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant |
| 5 | Inherited research scope with honest SOC declaration | MISSED | account-hijack, insider-recruitment, dormant-account-takeover, it-persona-manufacturing |
| 6 | Novel functional analogs evading all vendor DBs | MISSED | cross-cutting |
| 7 | Short fragments below vendor minimum | MISSED | cross-cutting |
| 8 | Visitor with sponsor-aligned declaration | AMBIGUOUS | visiting-researcher |
| 9 | Sophisticated cover story + SOC declaration | MISSED | shell-company (crafted narrative) |

## bypass_methods_uncovered

| # | Bypass method | Severity | Notes |
|---|---|---|---|
| 1 | Honest-declaration-with-fabricated-justification | Moderate | Structural to reconciliation |
| 2 | Novel functional analogs | Moderate | Structural to sequence screening |
| 3 | Short fragment evasion | Moderate | Minimum-length policy needed |
| 4 | Vendor-disagreement adjudication undefined | Minor | Decision-rule gap |

---

## Verdict: **PASS**

No Critical findings. The reconciliation idea is well-targeted at the non-declaration and vague-declaration attack vectors (the most common M15 evasion methods) and adds multi-vendor coverage as a bonus. Structural limitations (alignment-by-construction, novel analogs) are shared across all M15 ideas and appropriately acknowledged. Pipeline continues to stage 6.
