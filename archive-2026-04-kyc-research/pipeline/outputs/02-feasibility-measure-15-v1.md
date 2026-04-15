# Stage 2 — Feasibility check, Measure 15, v1

Reviewing `01-ideation-measure-15-v1.md`. Two gates: concreteness, relevance.

---

## 1. Mandatory structured SOC declaration field in checkout (IGSC-aligned)
- **Concreteness:** PASS — names IGSC HSP v2.0 as the SOC definition reference, NCBI Taxonomy as taxonomy source, and specifies the form fields. Stage 4 can verify the IGSC HSP version.
- **Relevance:** PASS — directly attacks the vague-free-text vector (lab-manager-voucher, unrelated-dept-student) and the boilerplate-reuse vector (bulk-order-noise-cover) by forcing per-order structured fields.
- **Verdict: PASS**

## 2. LLM extraction of intended-use free text into structured frame
- **Concreteness:** PASS — names Anthropic/OpenAI APIs and UniProt/HGNC for normalization, specifies the JSON schema slots. Stage 4 can pick a model and verify normalization sources.
- **Relevance:** PASS — directly attacks lab-manager-voucher and unrelated-dept-student "vague research purposes" pattern by scoring vagueness and emitting a structured comparator.
- **Verdict: PASS**

## 3. Deterministic cross-reference of declaration vs IGSC HSP screening output
- **Concreteness:** PASS — names IGSC HSP, BLAST, NCBI Taxonomy, and specifies the rules table. SOP is concrete (rules enumerated, escalation tiers named).
- **Relevance:** PASS — this is the core M15 mechanism; addresses lab-manager-voucher, unrelated-dept-student, and the exemption-claim cluster (inbox-compromise, shell-company).
- **Verdict: PASS**

## 4. Aclid screening API
- **Concreteness:** PASS — vendor named (best guess on exact product). Stage 4 to confirm product naming.
- **Relevance:** PASS — provides the screening half of the cross-check; does not by itself catch alignment-by-construction (correctly noted in idea).
- **Verdict: PASS**

## 5. Battelle UltraScreen
- **Concreteness:** PASS — vendor named (best guess on product name); stage 4 verifies.
- **Relevance:** PASS — same role as 4; differentiation argument (different functional-class annotations) is meaningful so not a duplicate.
- **Verdict: PASS**

## 6. SecureDNA
- **Concreteness:** PASS — names SecureDNA hashed protocol; concrete.
- **Relevance:** PASS — same role as 4–5 with a privacy-preserving twist worth keeping distinct.
- **Verdict: PASS**

## 7. Daily batch reconciliation report
- **Concreteness:** PASS — names Looker / Metabase, specifies columns and trigger thresholds.
- **Relevance:** PASS — uniquely addresses bulk-order-noise-cover (base-rate dilution), it-persona-manufacturing (template clones), cro-identity-rotation (cross-persona templates), gradual-legitimacy-accumulation (longitudinal drift). These are stories no single per-order check catches.
- **Verdict: PASS**

## 8. Discrepancy-escalation playbook (tiered SOP)
- **Concreteness:** PASS — names tiers, response-time SLAs, templated emails, ticket system (Jira/ServiceNow), references SAR + FBI WMD coordinator (best guess). Stage 4 verifies the actual SAR channel.
- **Relevance:** PASS — addresses lab-manager-voucher, unrelated-dept-student, insider-recruitment, inbox-compromise, account-hijack by forcing independent verification of self-attestations.
- **Verdict: PASS**

## 9. Independent IBC-protocol-number verification SOP
- **Concreteness:** PASS — concrete SOP with verifiable inputs (institutional IBC office, verified via institutional website not customer email).
- **Relevance:** PASS — directly addresses insider-recruitment (M9 Option 3 self-attestation), it-persona-manufacturing (lifted IBC letters), inbox-compromise (fabricated IBC docs).
- **Verdict: PASS**

## 10. Exemption-claim hard gate: structured exemption taxonomy
- **Concreteness:** PASS — names Select Agent Regulations (42 CFR 73, 9 CFR 121, 7 CFR 331), HHS Screening Framework Guidance, IGSC HSP exclusions list as canonical sources. Stage 4 can confirm regulatory citations and current exemption catalog.
- **Relevance:** PASS — directly addresses inbox-compromise and shell-company exemption-claim bypass cluster, which is one of the three dominant M15 failure modes per the mapping file.
- **Verdict: PASS**

## 11. Cover-story consistency cross-check (M4/M9/M15 unification)
- **Concreteness:** PASS — concrete in that it specifies the comparison axes (organism family, functional class, BSL) and that M4/M9 outputs must be structured. Slightly cross-measure but the SOP itself is the named artifact.
- **Relevance:** PASS — addresses cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant, dormant-account-takeover. These alignment-by-construction stories are not addressed by any single per-order check; this is the only idea targeting them at the cross-check layer.
- **Verdict: PASS**

## 12. Longitudinal declaration-drift detector
- **Concreteness:** PASS — concrete (per-account rolling profile, defined alert types).
- **Relevance:** PASS — addresses account-hijack, dormant-account-takeover, gradual-legitimacy-accumulation. These are not caught by any per-order content check.
- **Verdict: PASS**

## 13. Sponsor-attestation requirement for visiting-researcher framings
- **Concreteness:** PASS — concrete SOP with named verification path (institutional directory, not customer-supplied).
- **Relevance:** PASS — addresses visiting-researcher specifically; no other idea covers it.
- **Verdict: PASS**

## 14. Per-order declaration enforcement
- **Concreteness:** PASS — concrete enforcement rule (declaration hash diff per order, facility-account metadata).
- **Relevance:** PASS — addresses bulk-order-noise-cover at the form-layer (complement to idea 7 which addresses it at the reconciliation layer).
- **Verdict: PASS**

## 15. Hijack-detection cross-check: declaration provenance vs account baseline
- **Concreteness:** PASS — names Sift / Castle as candidate behavioral analytics vendors; specifies signals.
- **Relevance:** PASS — addresses account-hijack (where declaration content is correct but provenance is anomalous — a gap in pure content cross-checks).
- **Verdict: PASS**

---

## Gaps (uncovered attacker classes)

Reviewing the 14 stories against the 15 ideas:

- lab-manager-voucher → 1, 2, 3, 8 ✓
- unrelated-dept-student → 1, 2, 3, 8 ✓
- cro-framing → 11 ✓
- cro-identity-rotation → 7, 11 ✓
- gradual-legitimacy-accumulation → 7, 11, 12 ✓
- account-hijack → 8, 12, 15 ✓
- visiting-researcher → 13 ✓
- inbox-compromise → 3, 8, 9, 10 ✓
- shell-company → 3, 10 ✓
- insider-recruitment → 8, 9 ✓
- it-persona-manufacturing → 7, 9 ✓
- bulk-order-noise-cover → 1, 7, 14 ✓
- biotech-incubator-tenant → 11 ✓
- dormant-account-takeover → 11, 12 ✓

All 14 mapped attacker stories are addressed by at least one idea. No uncovered classes.

---

## Stop condition

Zero REVISE, zero DROP, no uncovered attacker classes.

**STOP: yes**
