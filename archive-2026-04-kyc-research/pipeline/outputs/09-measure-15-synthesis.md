# Stage 9 — Per-measure synthesis: Measure 15 (SOC self-declaration)

## 1. Side-by-side comparison of selected ideas

| Field | m15-structured-form | m15-screening-reconciliation | m15-llm-extraction | m15-drift-detector |
|---|---|---|---|---|
| **What it does** | Replaces free-text "intended use" with controlled-vocabulary form (use category, NCBI-validated organism, BSL, IBC status). Data-capture layer feeding all downstream checks. | Runs orders through 1–3 screening vendors (SecureDNA, Aclid, Battelle), reconciles SOC hits against customer declaration. Core M15 cross-check. | LLM extracts canonical SOC declaration from free text; deterministic comparator diffs against form and screening output. Three-way consistency check. | Time-series change-point detection (River ADWIN + Page-Hinkley) over per-customer feature vector of declarations and screening outputs. |
| **Operates on** | Single order, synchronous at intake | Single order, post-submission | Single order, post-submission | Cross-order history, asynchronous |
| **Attacker stories addressed** | unrelated-dept-student, lab-manager-voucher, inbox-compromise, bulk-order-noise-cover | lab-manager-voucher, unrelated-dept-student, inbox-compromise, shell-company, bulk-order-noise-cover | lab-manager-voucher, unrelated-dept-student, inbox-compromise, shell-company, bulk-order-noise-cover | gradual-legitimacy-accumulation, unrelated-dept-student (partial), visiting-researcher (partial), bulk-order-noise-cover (partial), dormant-account-takeover (partial) |
| **Marginal cost** | $0 | $0.20–$4/order line (SecureDNA free; commercial vendors vendor-gated) | $0.005–$0.02/order | ~$0 |
| **Setup cost** | 3–6 eng-weeks | 4–8 eng-weeks | 2–4 eng-weeks | 4–8 eng-weeks |
| **Key flags** | `bsl_inconsistent`, `select_agent_no_ibc`, `taxid_invalid`, `excessive_other` | `soc_screening_disagreement`, `vendor_disagreement`, `inferred_organism_mismatch` | `llm_form_mismatch`, `llm_sequence_disagreement`, `llm_low_confidence` | `soc_drift_detected`, `concerning_trajectory_match`, `screening_hit_rate_increase` |
| **Primary FP source** | other/unknown escape-hatch abuse (10–25% of submissions) | Benign select-agent genes (7–9% of screened sequences) | Multi-category projects causing extraction/form mismatch (10–20%) | Legitimate research pivots (10–20% of PI accounts per 2-year window) |
| **External deps** | NCBI Taxonomy (free, public) | SecureDNA (free), Aclid (commercial), Battelle (commercial) | Anthropic or OpenAI API | None (internal) |

## 2. Coverage gap cross-cut

### Structural gaps (inherent to the approach — not fixable within the idea)

| Gap | Affected ideas | Impact |
|---|---|---|
| **Alignment-by-construction** — attacker engineers consistent declaration, free text, and sequence content so all cross-checks agree | All four ideas | 8 of 14 attacker stories survive the entire stack: cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant, account-hijack, insider-recruitment, dormant-account-takeover, it-persona-manufacturing. This is the dominant structural gap of the M15 measure. |
| **Novel sequences not in any vendor DB** — de novo or engineered threats evade homology-based screening | m15-screening-reconciliation | No signal from any vendor; reconciler has nothing to compare. Fundamental limitation of sequence screening, not M15 specifically. |
| **Consistent-from-start deception** — no temporal drift to detect | m15-drift-detector | 8 of 14 stories use this strategy. Acknowledged and acceptable because per-order checks cover these stories (to the extent they can). |
| **Cold-start** — new customers with <10 orders | m15-drift-detector | ~30–50% of accounts at any time. First-order window covered only by per-order stack. |

### Complementary gaps (fixable by configuration, policy, or tuning)

| Gap | Affected ideas | Mitigation |
|---|---|---|
| **Other/unknown escape hatch** — 1–2 field use below `excessive_other` threshold | m15-structured-form, m15-llm-extraction (loses structured input) | Add per-field triggers on load-bearing fields (intended-use category, source organism). |
| **Short sequences <200 bp** — reduced screening sensitivity, fragment-splitting attack | m15-screening-reconciliation | Minimum-length enforcement policy or in-silico assembly of concurrent orders. Estimated 20–40% of order lines affected (unanchored). |
| **Terse/formulaic free text** — LLM extraction yields nothing useful | m15-llm-extraction | 15–30% of orders (unanchored estimate). Falls back to manual review; no automated mitigation within the idea. |
| **Non-English submissions** — degraded LLM extraction | m15-llm-extraction | 10–20% of global orders. Language detection + explicit fallback threshold needed. |
| **Non-US biosafety frameworks** — IBC vocabulary NIH-specific | m15-structured-form | 20–30% of global customers. Extend `ibc_approval_status` enum to cover UK/EU/AU equivalents. |
| **Multi-channel ordering** — email/phone bypasses web form | m15-structured-form | Mandate structured data capture for all channels. |
| **Facility/CRO account exclusions** — drift detector blind spot | m15-drift-detector | Per-subcategory drift tracking or absolute screening-hit counts instead of rates. |
| **Vendor-disagreement adjudication rule** — any-flag-wins vs. majority undefined | m15-screening-reconciliation | Decision policy needed; affects both sensitivity and reviewer load. |
| **Multi-category projects** — single-select form forces lossy representation | m15-structured-form, m15-llm-extraction | Allow multi-select or ranked primary/secondary categories. |
| **Benign select-agent gene FP overload** — 7–9% of screened sequences | m15-screening-reconciliation | Erodes reviewer signal-to-noise. Allowlisting known benign genes or tiered review SOP needed. |

## 3. Bypass methods uncovered: which attacker stories survive the full stack

The full stack (structured form → screening reconciliation → LLM extraction → drift detector) is evaluated against all 14 mapped attacker stories.

### Stories CAUGHT by the stack

| Story | Caught by | Mechanism |
|---|---|---|
| **unrelated-dept-student** | structured-form, screening-reconciliation, llm-extraction | Forced domain-specific fields expose lack of knowledge; vendor SOC hit vs. generic declaration; LLM extraction yields null vs. screening hit. |
| **inbox-compromise** | structured-form, screening-reconciliation, llm-extraction | Select-agent-without-IBC flag; exemption claim vs. vendor SOC hit; LLM finds contradiction. |

### Stories PARTIALLY caught

| Story | Partial detection | Remaining gap |
|---|---|---|
| **lab-manager-voucher** | Form raises specificity floor; screening reconciliation catches vague declaration vs. SOC hit; LLM extraction flags low-confidence. | If the lab manager selects the *correct* enum values (they have domain knowledge), all checks agree. Vague free text is caught; informed-but-vague is not. |
| **bulk-order-noise-cover** | Per-order-line screening cuts through facility boilerplate; drift detector may catch screening-hit-rate increase. | If facility/CRO accounts are excluded from drift, and the SOC orders match the facility's stated scope, detection relies solely on per-line screening reconciliation. |
| **visiting-researcher** | LLM extraction ambiguous; drift detector partial. | Sponsor-framed declaration borrows institutional plausibility; no independent verification of the sponsorship claim. |
| **dormant-account-takeover** | Drift detector catches reactivation pattern (if dormancy handling is implemented). | Dormancy gap handling unspecified; if orders match the original lab's scope, per-order checks see no anomaly. |
| **shell-company** | Screening reconciliation catches bare exemption claim vs. SOC hit. | If the shell company crafts a sophisticated technical cover story matching the SOC, alignment-by-construction applies. |

### Stories that SURVIVE the entire stack (alignment-by-construction bypass)

| Story | Why it survives | Profile |
|---|---|---|
| **cro-framing** | Deliberately engineers consistency between CRO service scope, declaration, biosafety plan, publication trail, and sequence content. All four checks find agreement. | purpose-built-organization, Branch A |
| **cro-identity-rotation** | Each rotating persona has self-consistent scope tuned to its SOC orders. New accounts defeat drift detector (cold-start). | purpose-built-organization, Branch B |
| **gradual-legitimacy-accumulation** | Real publications, real grants build genuine-looking research history. Declaration matches screening because alignment is real-on-paper. Drift detector is the intended catch, but if escalation is gradual enough or calibrated to stay below thresholds, it survives. | purpose-built-organization, Branch E |
| **account-hijack** | Orders placed through real PI's account match published research scope. Detection requires noticing the account is hijacked (identity layer), not noticing the declaration is wrong. | impersonate-employee, Branch C |
| **insider-recruitment** | Recruited insider declares SOC as covered by existing real IBC protocol. Institutionally coherent — all checks agree. | impersonate-employee, Branch B |
| **it-persona-manufacturing** | Multiple personas inside a real institution, each with lifted-and-modified IBC documentation. Documentary support backs every declaration. | exploit-affiliation, Branch B |
| **biotech-incubator-tenant** | Tenant's stated research program is self-consistent with SOC declarations and screening output. | purpose-built-organization, Branch D |

**Net: 7 of 14 stories fully survive the M15 stack.** These share a common structure — the attacker manufactures or inherits legitimate-looking alignment between declaration and content. The M15 measure (cross-checking declaration against screening) is structurally unable to catch attackers who ensure there is nothing to cross-check against.

## 4. Structural gaps flagged as open issues

### Issue 1 — Alignment-by-construction is the dominant failure mode (7/14 stories)

The entire M15 stack is a consistency-checking architecture. Its power is in catching *inconsistency* between what the customer says and what the sequences are. When an attacker ensures consistency by construction — whether through a purpose-built organization with real research credentials, a hijacked account with matching scope, or an insider with inherited protocol access — the stack has no signal. This is structural to the measure definition: M15 asks whether the declaration aligns with screening. If the attacker ensures it does, M15 passes. Addressing this requires measures outside M15 (identity verification, institutional verification, voucher quality, end-use monitoring).

### Issue 2 — Short-sequence screening gap (20–40% of order lines, unanchored estimate)

If 20–40% of order lines fall below the ~200 bp minimum for effective homology-based screening, a significant fraction of orders have reduced or no screening signal for the reconciliation engine to work with. This estimate has no citation and is load-bearing for assessing the fragment-splitting attack vector. A minimum-length enforcement policy or in-silico assembly strategy is needed.

### Issue 3 — Escape-hatch usage rate is the structured form's load-bearing unknown

The best-guess range of 10–25% for `other/unknown` usage has no synthesis-industry citation. If usage is at the high end, the form's value as a data-capture layer degrades substantially, and the downstream checks that depend on it (LLM extraction, screening reconciliation, drift detection) lose their structured input. Per-field triggers on load-bearing fields (intended-use category, source organism) should be implemented regardless.

### Issue 4 — Terse-submission gap limits LLM extraction coverage

An estimated 15–30% of orders (unanchored) contain free text too short or formulaic for meaningful LLM extraction. For these orders, the three-way check (form vs. LLM vs. screening) collapses to a two-way check (form vs. screening), losing the independent signal that catches vague-but-enum-valid declarations.

### Issue 5 — Cold-start gap leaves new customers uncovered by drift detection

The drift detector provides zero signal for customers with <10 orders (~30–50% of accounts). New accounts are the highest-risk window for purpose-built attacker branches (cro-identity-rotation creates fresh accounts by design). Per-order checks must carry the full M15 burden for these accounts.

### Issue 6 — Vendor-gated commercial screening details unresolved

Aclid and Battelle API specifications, pricing, auth models, and minimum-length parameters are all vendor-gated. The SecureDNA endpoint URL is undocumented (client code on GitHub may contain it). These gaps must be resolved through sales conversations before the reconciliation engine can be fully designed.

### Issue 7 — No extraction-accuracy benchmark for LLM layer

The LLM extraction layer has no specified evaluation benchmark. Without empirical hallucination-rate data on realistic customer text, the false-positive burden is unpredictable. An eval set of representative customer submissions is needed before deployment.

### Issue 8 — Multi-channel mandate unspecified

The structured form is defined for the web portal. If email, phone, or EDI ordering channels bypass the form, structured data capture has gaps that degrade all downstream checks. A channel-mandate policy is needed.
