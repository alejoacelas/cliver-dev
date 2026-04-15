# m15-llm-extraction — Bypass-aware hardening v1

- **idea:** LLM extraction + deterministic cross-reference
- **measure:** M15 — soc-self-declaration
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walkthrough

### 1. lab-manager-voucher — exploit-affiliation, Branch C

**Summary:** Real lab manager orders SOC using vague end-use language.

**Bypass methods relevant to M15:**

1. **Vague end-use self-declaration ("molecular biology research," "positive control for assay development").**
   - **CAUGHT.** The `llm_low_confidence` flag fires when the free text is too vague for the LLM to extract specific fields. Vague language like "molecular biology research" yields null or generic values for `host_organism`, `target_gene_or_protein`, and `select_agent_referenced`, triggering disagreement with the sequence-screening output (which found a specific SOC). The `llm_sequence_disagreement` flag fires when the declared use is generic but the sequence is a known pathogen gene.
   - Additionally, if the customer also filled a structured form (m15-structured-form) with more specific values, `llm_form_mismatch` catches discrepancies between the vague free text and the more specific form.

**Net assessment:** Strong for this specific bypass. The LLM extraction + sequence cross-reference is designed to catch exactly this: vague declarations that don't explain the specific SOC content.

---

### 2. unrelated-dept-student — exploit-affiliation, Branch A

**Summary:** Student in unrelated department orders SOC under generic "research purposes."

**Bypass methods relevant to M15:**

1. **Generic end-use description ("research purposes").**
   - **CAUGHT.** Same mechanism as lab-manager-voucher: `llm_low_confidence` + `llm_sequence_disagreement`. "Research purposes" extracts no specific organism or use category, while the sequence screening identifies a SOC.

**Net assessment:** Strong.

---

### 3. cro-framing — purpose-built, Branch A

**Summary:** Real LLC with engineered alignment between cover story, biosafety plan, publications, and SOC declarations.

**Bypass methods relevant to M15:**

1. **Self-authored biosafety plan with scope matching SOC orders.**
   - **MISSED.** The CRO has explicitly engineered the free-text narrative to match the orders. The LLM extraction produces a canonical object that *agrees* with both the structured form and the sequence-screening output — because the attacker made them agree. `intended_use_category`, `host_organism`, and `target_gene_or_protein` are all internally consistent. No disagreement = no flag.

2. **Predatory-journal publication seeding locks in research scope.**
   - **MISSED.** Same alignment-by-construction. The LLM sees a coherent narrative backed by the attacker's manufactured research identity.

**Net assessment:** Structural defeat. The LLM extraction catches *inconsistency* between declaration and content. When the attacker manufactures consistency, the check passes.

---

### 4. cro-identity-rotation — purpose-built, Branch B

**Summary:** Rotating CRO personas with per-persona tuned service areas.

**Bypass methods relevant to M15:**

1. **Each persona's service area matches SOC orders.**
   - **MISSED.** Same as cro-framing. Per-persona consistency defeats the cross-reference.

**Net assessment:** Structural defeat.

---

### 5. gradual-legitimacy-accumulation — purpose-built, Branch E

**Summary:** Attacker builds real research history, then places SOC orders.

**Bypass methods relevant to M15:**

1. **Cover-story legitimacy justifies the SOC declaration.**
   - **MISSED.** The attacker's free-text narrative is coherent with the orders because the research identity was built to include SOC-relevant work. LLM extraction produces an object consistent with sequence content.

**Net assessment:** Structural defeat.

---

### 6. account-hijack — impersonate-employee, Branch C

**Summary:** SOC orders through hijacked PI account, declared use aligned with PI's research.

**Bypass methods relevant to M15:**

1. **Declared use matches the real PI's published research scope.**
   - **MISSED.** The attacker writes a declaration consistent with the PI's known research. LLM extraction finds consistency between declaration and SOC content. No flag.

**Net assessment:** No engagement — the hijacker borrows the PI's legitimate research framing.

---

### 7. visiting-researcher — fake-affiliation, Branch D

**Summary:** Orders framed as part of sponsored collaboration.

**Bypass methods relevant to M15:**

1. **Declaration references sponsor's research program.**
   - **AMBIGUOUS.** If the visiting researcher writes a detailed declaration referencing the sponsor's program, the LLM extraction could either (a) find it consistent with the SOC and pass, or (b) flag a disagreement if the sponsor's research area doesn't typically involve the specific SOC. Depends on how well the attacker tailors the narrative.

**Net assessment:** Weak — a competent attacker tailors the narrative to match.

---

### 8. inbox-compromise — fake-affiliation, Branch B

**Summary:** Orders through compromised inbox claiming exemption.

**Bypass methods relevant to M15:**

1. **Claim exemption / no IBC required — frame order as exempt from SOC disclosure.**
   - **CAUGHT.** The LLM extraction from an exemption-claim email would produce null or "exempt" values for SOC fields, while the sequence-screening output identifies a SOC. This triggers `llm_sequence_disagreement` (declared use is "exempt" but content is SOC). The `llm_low_confidence` flag may also fire if the exemption claim provides no substantive use description.

**Net assessment:** Strong — exemption claims that contradict sequence content are exactly what the cross-reference catches.

---

### 9. shell-company — Branch D

**Summary:** Real LLC claiming exemption from SOC categories.

**Bypass methods relevant to M15:**

1. **Claim exemption from SOC categories.**
   - **CAUGHT** (partially). If the company claims its work is "non-regulated" or "exempt" but the sequence content is a SOC, the cross-reference flags this. However, if the company provides a detailed and technically plausible description of the work that happens to involve a SOC (e.g., "diagnostic assay development for [pathogen]"), the extraction produces a consistent object that passes.
   - The bare exemption claim is caught; a well-crafted technical narrative is not.

**Net assessment:** Partial — catches lazy exemption claims but not sophisticated cover stories.

---

### 10. insider-recruitment — impersonate-employee, Branch B

**Summary:** Recruited insider declares SOC orders covered by existing IBC protocol.

**Bypass methods relevant to M15:**

1. **Self-attest covered by IBC protocol.**
   - **MISSED.** The insider writes a declaration consistent with the lab's real research scope. LLM extraction produces a canonical object matching both the form and the sequence content. No disagreement.

**Net assessment:** No engagement — genuine alignment between declaration and content.

---

### 11. it-persona-manufacturing — exploit-affiliation, Branch B

**Summary:** Multiple personas with lift-and-modify IBC paperwork.

**Bypass methods relevant to M15:**

1. **Lift-and-modify IBC letter backs declaration.**
   - **MISSED.** Each persona writes a declaration consistent with the modified IBC letter and the order content. LLM extraction finds internal consistency.

**Net assessment:** No engagement.

---

### 12. bulk-order-noise-cover — exploit-affiliation, Branch E

**Summary:** SOC orders hidden in bulk legitimate ordering.

**Bypass methods relevant to M15:**

1. **SOC orders under shared generic facility-research declaration.**
   - **CAUGHT.** If the facility uses a single boilerplate declaration for all orders, the LLM extraction produces a generic object. For orders with SOC content, the cross-reference against sequence screening finds a disagreement: generic declaration vs. specific SOC sequence. `llm_sequence_disagreement` fires.
   - However, if the facility's boilerplate is *specific enough* to cover a range of organisms including the SOC, the extraction may not flag it.

**Net assessment:** Partial — catches boilerplate-vs-SOC disagreements but not broad-scope facilities.

---

### 13. biotech-incubator-tenant — purpose-built, Branch D

**Summary:** Incubator tenant with self-consistent research scope.

**Bypass methods relevant to M15:**

1. **Stated research scope identical to provider.**
   - **MISSED.** Same alignment-by-construction as cro-framing.

**Net assessment:** No signal.

---

### 14. dormant-account-takeover — exploit-affiliation, Branch D

**Summary:** Reactivated dormant account inherits original lab's research scope.

**Bypass methods relevant to M15:**

1. **SOC orders matching previously-recorded lab scope.**
   - **MISSED.** The new user writes a declaration consistent with the dormant lab's historical scope. LLM extraction finds consistency.

**Net assessment:** No engagement.

---

## Findings

### Critical

None.

### Moderate

**M1 — Alignment-by-construction defeats the cross-reference for all purpose-built branches.**

- **Stories affected:** cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant (4 stories).
- **Why missed:** The LLM extraction + deterministic cross-reference catches *inconsistencies* between what the customer says and what the sequences contain. When the attacker deliberately engineers the narrative to match, all three inputs (free text, form, sequence content) agree. No disagreement = no flag. This is structural to a consistency-checking approach.
- **Note:** Not addressable within this idea's scope. Complementary ideas (m15-ibc-attestation, m15-drift-detector, m15-screening-reconciliation) address different bypass vectors.

**M2 — Insiders and account hijackers with research-scope knowledge produce consistent declarations.**

- **Stories affected:** insider-recruitment, account-hijack, dormant-account-takeover, it-persona-manufacturing (4 stories).
- **Why missed:** These attackers know the legitimate research scope and write declarations that match it. The LLM extraction confirms consistency rather than detecting malice.
- **Note:** Structural — intent detection is outside this check's scope.

**M3 — LLM hallucination risk creates false flags.**

- **Stories affected:** All stories (cross-cutting).
- **Why relevant:** The implementation notes that the LLM may extract claims the customer didn't make. While `extracted_quotes` provides an audit trail, a hallucinated extraction that disagrees with the form creates a false positive, and reviewer fatigue from false positives reduces the effectiveness of the triage step. The implementation does not specify an evaluation benchmark for extraction accuracy.
- **Suggestion for re-research:** Stage 4 should include an extraction-accuracy eval: run the prompt on a held-out set of real customer descriptions and measure extraction fidelity. If the hallucination rate on vague text is high, the `llm_low_confidence` threshold needs calibration.

### Minor

**N1 — Non-English text quality not specified.**

- **Stories affected:** visiting-researcher, foreign-institution adjacent.
- **Why ambiguous:** The implementation notes "English performance is best, other major languages are usable, low-resource languages should fall back to manual" but does not specify which languages are tested or what the fallback language-detection mechanism is.
- **Suggestion:** Specify the language detection step and the threshold for falling back to manual.

**N2 — Batch API latency vs. order-time processing.**

- **Stories affected:** All (operational).
- **Why ambiguous:** 50% cost savings with batch API but batch processing is asynchronous. The implementation does not specify whether extraction runs synchronously at order time or asynchronously in batch. If batched, the flag arrives after the order may already be in process.
- **Suggestion:** Clarify the expected latency path: synchronous at order time, or asynchronous with an order-hold until extraction completes.

---

## bypass_methods_known

| # | Bypass method | Classification | Stories |
|---|---|---|---|
| 1 | Vague/generic declaration → low confidence + sequence disagreement | CAUGHT | lab-manager-voucher, unrelated-dept-student |
| 2 | Exemption claim contradicts sequence content | CAUGHT | inbox-compromise, shell-company (bare claim) |
| 3 | Boilerplate facility declaration vs. SOC sequence | CAUGHT | bulk-order-noise-cover (partial) |
| 4 | Engineered narrative-to-sequence alignment | MISSED | cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant |
| 5 | Insider with research-scope knowledge | MISSED | insider-recruitment, account-hijack, dormant-account-takeover |
| 6 | Per-persona consistent declarations | MISSED | it-persona-manufacturing |
| 7 | Sophisticated technical cover story | MISSED | shell-company (crafted narrative) |
| 8 | Sponsor-framed declaration | AMBIGUOUS | visiting-researcher |

## bypass_methods_uncovered

| # | Bypass method | Severity | Notes |
|---|---|---|---|
| 1 | Alignment-by-construction (narrative matches SOC) | Moderate | Structural to consistency-check approach |
| 2 | Insider/hijacker research-scope knowledge | Moderate | Structural — intent invisible |
| 3 | Sophisticated technical cover story | Moderate | Well-crafted narratives pass |
| 4 | LLM hallucination false flags | Moderate | Eval benchmark needed |

---

## Verdict: **PASS**

No Critical findings. The idea is well-scoped as a consistency checker for the vague-declaration and exemption-claim attack vectors, which are the most common and lowest-cost M15 evasion methods. Alignment-by-construction and insider-knowledge bypasses are structural to any consistency-based approach and are appropriately handled by complementary ideas. Pipeline continues to stage 6.
