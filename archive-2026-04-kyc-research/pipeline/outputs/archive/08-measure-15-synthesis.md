# Measure 15 — SOC self-declaration validation: Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (count + which) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| m15-structured-form | Internal: controlled-vocabulary form with NCBI Taxonomy lookup | $0/order | Low for passing; flagged on excessive "other/unknown" (3-8%), bsl_inconsistent, taxid_invalid, select_agent_no_ibc | 4 (unrelated-dept-student, lab-manager-voucher, inbox-compromise, bulk-order-noise-cover) | "Other/unknown" escape hatch: 10-25% of submissions may use it, degrading form to free-text equivalent | Technically accurate form submission by malicious actor (8 stories: all purpose-built + insider/hijacker branches) |
| m15-llm-extraction | LLM API (Claude/GPT) + deterministic cross-reference against form and screening | ~$0.005-$0.02/order | Moderate: reviewer checks extraction fidelity via extracted_quotes; multi-category and non-standard nomenclature FPs (10-20%) | 5 (lab-manager-voucher, unrelated-dept-student, inbox-compromise, shell-company, bulk-order-noise-cover) | Terse/formulaic submissions: 15-30% of orders yield no meaningful extraction; non-English: 10-20% degraded | Alignment-by-construction: attacker engineers narrative to match SOC (4 purpose-built + 4 insider/hijacker = 8 stories) |
| m15-screening-reconciliation | Aclid + Battelle UltraSEQ + SecureDNA sequence-screening outputs | ~$0.20-$4/order line (multi-vendor) | High for adjudication: 7-9% of sequences trigger non-regulated SOC matches (benign select-agent genes); vendor disagreements require deep biosafety expertise | 5 (lab-manager-voucher, unrelated-dept-student, inbox-compromise, shell-company, bulk-order-noise-cover) | Novel sequences not in any vendor DB: structural limitation of homology-based screening; short sequences <200bp: 20-40% of order lines | Honest SOC declaration with fabricated justification (8 stories); novel functional analogs evading all vendor DBs |
| m15-ibc-attestation | Customer-uploaded IBC approval letter + NIH IBC-RMS public roster cross-check | $5-$25/SOC order (reviewer time) | High: 5-15 min biosafety reviewer per SOC order; IBC scope-match assessment; chair-contact escalation for suspected forgery | 4 (unrelated-dept-student, inbox-compromise, visiting-researcher, dormant-account-takeover) | Foreign institutions: 40-50% of global customers have no IBC-RMS entry; Section III-F exempt: 30-60% of orders may have no IBC document | Private-sector entities without NIH IBC (4 stories: cro-framing, cro-identity-rotation, shell-company, biotech-incubator-tenant) |
| m15-drift-detector | Internal order-history time-series via River ADWIN/Page-Hinkley | ~$0/order | Moderate: 10-20% of PI accounts per 2-year window show legitimate research pivots (dominant FP source); core-facility/CRO accounts must be excluded or modeled separately | 3 directly + 2 partial (gradual-legitimacy-accumulation primary; unrelated-dept-student, visiting-researcher, bulk-order-noise partial; dormant-account-takeover partial) | Cold-start: 30-50% of accounts have <10 orders (zero signal); consistent attacker: structural blind spot for 8 of 14 mapped stories | Consistent deception from day one (Critical finding): lab-manager-voucher, cro-framing, cro-identity-rotation, insider-recruitment, it-persona-manufacturing, biotech-incubator-tenant, shell-company, account-hijack |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

These gaps appear across ALL or nearly all M15 ideas, representing limitations of the measure itself:

1. **Alignment-by-construction defeats all consistency checks.** When the attacker deliberately engineers their cover story, paperwork, declaration, and SOC orders to be mutually consistent, no M15 cross-check finds a discrepancy. This is the dominant failure mode: the structured form sees a technically accurate submission, the LLM extraction agrees with the form, the screening reconciliation agrees with the declaration, and the IBC document (if one exists) covers the scope. This affects cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant, account-hijack, insider-recruitment, dormant-account-takeover, and it-persona-manufacturing -- 8 of 14 mapped attacker stories.

2. **Genuine insider/hijacker with research-scope knowledge.** When the attacker (or hijacked account) has real knowledge of the institution's research scope, declarations are substantively correct. M15 cannot distinguish "correct declaration by legitimate researcher" from "correct declaration by attacker who knows the research scope."

3. **Exemption claims.** Several branches use exemption claims (Section III-F exempt, "not applicable") that produce null or minimal data for cross-checking. The structured form captures the claim, but none of the downstream checks (LLM extraction, screening reconciliation) can evaluate its validity. Only m15-ibc-attestation challenges exemption claims, and even there, the challenge is a document requirement rather than a substantive assessment.

### Complementary gaps

| Gap | Ideas where it appears | Idea(s) that close it |
|---|---|---|
| Vague/generic free-text declarations | Structured form (allows "other/unknown") | LLM extraction (flags `llm_low_confidence` + `llm_sequence_disagreement`); screening reconciliation (vendor SOC hit vs. no declaration) |
| Form "other/unknown" escape hatch | Structured form (10-25% of submissions) | LLM extraction (operates on free-text notes field); but terse submissions degrade both |
| Non-English submissions | LLM extraction (10-20% degraded) | Screening reconciliation (sequence-based, language-independent); structured form (controlled vocabularies are language-neutral) |
| Novel organisms not in NCBI | Structured form (<2% taxid_invalid) | LLM extraction (can extract organism names without NCBI validation); screening vendors (coverage is sequence-based) |
| Short sequences <200bp | Screening reconciliation (20-40% of order lines) | None -- structural to homology-based screening |
| Foreign institutions without IBC registry | IBC attestation (40-50% exclusion) | Alternative-evidence path needed (undefined); structured form + LLM extraction + screening reconciliation still apply |
| Cold-start for new customers | Drift detector (30-50% of accounts) | Structured form + LLM extraction + screening reconciliation (per-order checks, no history needed) |
| Legitimate research pivots as FP | Drift detector (10-20% of PI accounts) | None -- inherent to time-series approach; triage playbook absorbs cost |

### Net coverage estimate

If a provider implemented all five ideas: **many** legitimate customers would be covered without friction -- the structured form and screening reconciliation run automatically, with human review only for flagged cases. However, an estimated **some** (20-35%) would experience at least one false-positive interaction across the stack: 7-9% from benign select-agent gene screening hits, 10-25% from form escape-hatch flags, 15-30% from terse submissions yielding no LLM extraction. The structural gap remains: M15's consistency-checking approach has no purchase on the 8 attacker stories where declarations, paperwork, and sequences are all self-consistent by design. These require M17/M18/M19/M20 legitimacy verification -- M15 validates the declaration, not the declarer.

## 3. Bypass cross-cut

### Universally uncovered bypasses

These slip through EVERY M15 idea:

1. **Engineered alignment by purpose-built organizations.** CRO-framing, CRO-identity-rotation, gradual-legitimacy-accumulation, and biotech-incubator-tenant all engineer consistency between cover story, SOC declaration, and order content. No M15 check detects this because there is nothing inconsistent to find.

2. **Insider/hijacker using legitimate research scope.** Account-hijack (orders matching real PI's published scope), insider-recruitment (real lab, real protocol), dormant-account-takeover (inherited lab scope), it-persona-manufacturing (lift-and-modify real IBC letter) -- all produce declarations that genuinely align with screening output.

3. **Novel functional analogs not in any vendor DB.** De novo designed pathogens and codon-optimized variants that evade homology-based screening produce no vendor flag, so no reconciliation signal fires regardless of what the customer declares.

### Bypass methods caught by at least one idea

| Bypass method | Caught by | Not caught by |
|---|---|---|
| Vague "research purposes" declaration | Structured form (forced enum selection), LLM extraction (`llm_low_confidence`), screening reconciliation (`soc_screening_disagreement`) | IBC attestation (document requirement, not declaration quality); drift detector (no trajectory signal from single order) |
| Exemption claim contradicting sequence content | LLM extraction (`llm_sequence_disagreement`), screening reconciliation (`soc_screening_disagreement`) | Structured form (captures claim but doesn't challenge); drift detector (no trajectory) |
| Bulk-order concealment under generic facility declaration | Screening reconciliation (per-line vendor hit vs. generic declaration), LLM extraction (boilerplate vs. SOC disagreement) | Drift detector (facility accounts excluded or FP-dominated); IBC attestation (facility-wide IBC covers scope) |
| Fabricated IBC letter with real names | IBC attestation (chair-contact step via roster email catches forgery) | All other ideas (no document verification) |
| Gradual escalation toward SOC over time | Drift detector (BSL escalation, screening-hit-rate increase) | All other ideas (per-order checks, no longitudinal view) |

### Attacker stories where every idea fails

The following branches defeat all five M15 ideas because their declarations are substantively correct and self-consistent:

- **cro-framing** (Branch A): Self-authored biosafety plan + publication seeding + matching SOC declaration. All five ideas see agreement.
- **cro-identity-rotation** (Branch B): Each persona's CRO service area tuned to match SOC orders. Same pattern, multiplied.
- **insider-recruitment** (Branch B): Real insider self-attests under existing real IBC protocol. All checks pass.
- **it-persona-manufacturing** (Branch B): Lift-and-modify real IBC letter provides documentary support for any declaration.

## 4. Bundling recommendations

**Recommended bundle: structured-form + screening-reconciliation + LLM-extraction (three-layer automated stack), with IBC-attestation for SOC orders and drift-detector as supplementary signal.**

The five ideas form a layered pipeline rather than competing alternatives:

- **Structured form** is the precondition for the other checks. Without controlled-vocabulary input, neither LLM extraction nor screening reconciliation has structured data to cross-reference. Zero marginal cost, 3-6 weeks setup.

- **Screening reconciliation** is the highest-leverage single check: it compares the customer's declaration against independent, automated sequence-screening output. When the customer fails to declare an SOC that vendors identify, the disagreement is immediate and unambiguous. Multi-vendor reconciliation (SecureDNA free + one commercial vendor) catches single-vendor coverage gaps. Cost: $0.20-$4/order line.

- **LLM extraction** adds a consistency layer between free-text narratives and structured data. It catches the lazy-declaration pattern (vague text that doesn't match specific SOC content) and exemption-claim contradictions. Very low cost (~$0.01/order).

- **IBC attestation** is the only idea that validates the institutional infrastructure behind the declaration, not just the declaration itself. It catches naive attackers who lack IBC coverage and exposes forged documents via the chair-contact step. But it has massive coverage gaps (40-50% foreign exclusion, 30-60% Section III-F exempt) and high per-check cost ($5-25). It should be required for SOC orders with select-agent sequences and optional/alternative-evidence-based for other SOC orders.

- **Drift detector** catches the one scenario the per-order checks miss: gradual escalation over time. But it provides zero value for new accounts (cold-start) and is structurally blind to consistent deception. Position as a supplementary background signal, not a primary gate.

**What the full bundle still leaves uncovered:** Alignment-by-construction (the dominant bypass pattern) defeats all five ideas. The 8 stories where attacker, declaration, and SOC content are self-consistent require verification of the declarer's legitimacy (M17/M18/M19/M20), not the declaration's consistency.

**Operational cost of running all five:** One structured form (internal), one LLM API contract (Anthropic or OpenAI, ~$0.01/order), one-to-three sequence-screening vendor contracts (SecureDNA free + Aclid/Battelle sales-gated), IBC-attestation reviewer queue (biosafety-qualified, $5-25/SOC order), and drift-detector infrastructure (internal, near-zero marginal cost). The dominant ongoing expense is the biosafety reviewer for IBC attestation and screening-reconciliation adjudication -- these share a reviewer pool and benefit from combined training.
