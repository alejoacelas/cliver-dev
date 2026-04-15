# m15-drift-detector — Bypass-aware hardening v1

- **idea:** Cross-order SOC drift detector
- **measure:** M15 — soc-self-declaration
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walkthrough

### 1. lab-manager-voucher — exploit-affiliation, Branch C

**Summary:** Real lab manager orders SOC using vague end-use language ("molecular biology research," "positive control").

**Bypass methods relevant to M15:**

1. **Vague end-use self-declaration broad enough to match any sequence.**
   - **MISSED.** The drift detector watches for *changes* in a customer's feature stream. A lab manager who consistently uses the same vague language across all orders produces a flat feature trajectory — no drift, no flag. The vagueness itself is not a signal the detector looks for; ADWIN/Page-Hinkley detect distributional shifts, not distributional flatness. The `vocab_shift` feature would require the lab manager to *change* their vague wording, which they have no reason to do.

**Net assessment:** The detector does not engage. The bypass is *consistency* — the attacker never drifts.

---

### 2. unrelated-dept-student — exploit-affiliation, Branch A

**Summary:** Student from an unrelated department orders SOC under generic "research purposes."

**Bypass methods relevant to M15:**

1. **Generic end-use description ("research purposes").**
   - **CAUGHT** (partially). If this is the student's first order, the cold-start limitation applies (< 10 orders = no signal). If the student has prior non-SOC orders, the shift from non-SOC to SOC-bearing orders would trigger `screening_hit_rate_increase` and possibly `organism_shift`. But the vague language itself does not drift.
   - **AMBIGUOUS** on cold-start: the implementation states customers with <10 orders produce no signal. A student placing their first few SOC orders is precisely in this window.

**Net assessment:** Weak. The student likely has too few orders for the detector to fire, and if they do have history, only the screening-hit shift (not the declaration vagueness) would flag.

---

### 3. cro-framing — purpose-built, Branch A

**Summary:** Real LLC with engineered alignment between cover story, biosafety plan, publications, and SOC declarations.

**Bypass methods relevant to M15:**

1. **Self-authored biosafety plan with matching research scope.**
   - **MISSED.** The CRO declares a research scope at onboarding and orders within that scope consistently. The drift detector sees a stable feature stream. No shift = no flag.

2. **Predatory-journal publication seeding to lock in research scope.**
   - **MISSED.** Same issue — this is preparation that makes the declaration *consistently* match the orders. No drift.

**Net assessment:** Structural defeat. The CRO-framing branch is designed to be consistent from day one. Drift detection is inherently blind to steady-state deception.

---

### 4. cro-identity-rotation — purpose-built, Branch B

**Summary:** Rotating CRO personas, each with its own tuned service area matching its SOC orders.

**Bypass methods relevant to M15:**

1. **Per-persona service area tuned to match SOC orders.**
   - **MISSED.** Each persona is a new customer account with a consistent declared scope. No drift within any one persona. Cross-persona detection would require linking personas, which the drift detector does not do (it operates per `customer_id`).

**Net assessment:** Structural defeat. New accounts = cold start; consistent accounts = no drift.

---

### 5. gradual-legitimacy-accumulation — purpose-built, Branch E

**Summary:** Attacker builds legitimate research history over months/years, then places SOC orders late.

**Bypass methods relevant to M15:**

1. **Gradual escalation from benign to SOC-adjacent orders.**
   - **AMBIGUOUS.** This is the *intended* use case for the drift detector. ADWIN detects abrupt shifts well; Page-Hinkley is designed for gradual shifts. Whether the detector catches this depends on: (a) how gradual the escalation is — very slow escalation may stay within ADWIN's forgetting window; (b) whether the customer's feature vector crosses a `concerning_trajectory_match` curated pattern; (c) the `bsl_escalation` feature would fire if BSL level increases.
   - If the attacker escalates slowly enough that each order-to-order step is within normal noise, ADWIN's adaptive window will absorb the change. Page-Hinkley should catch cumulative drift, but the threshold is tunable and the implementation does not specify sensitivity parameters.

**Net assessment:** This is the branch where the drift detector is most likely to fire, but the outcome depends heavily on tuning parameters not specified in the implementation.

---

### 6. account-hijack — impersonate-employee, Branch C

**Summary:** SOC orders through hijacked PI account matching the PI's published research.

**Bypass methods relevant to M15:**

1. **Order content and declared use aligned with real PI's research scope.**
   - **MISSED.** If the attacker orders within the PI's existing scope, the feature stream looks continuous. No drift. Only if the attacker orders outside the PI's typical scope would `vocab_shift` or `organism_shift` fire — but a competent attacker would stay within scope.

**Net assessment:** No engagement unless the attacker deviates from the hijacked account's historical pattern.

---

### 7. visiting-researcher — fake-affiliation, Branch D

**Summary:** Visiting researcher declaring use references sponsor's research program.

**Bypass methods relevant to M15:**

1. **Orders framed as part of sponsored collaboration.**
   - **CAUGHT** (partially). If the "visitor" account is new, cold-start applies. If existing, the visitor's prior orders may not have involved SOC, and the shift to SOC-bearing orders could trigger `screening_hit_rate_increase`. But the declaration itself is consistent with the sponsor framing.

**Net assessment:** Weak signal at best, dependent on order history.

---

### 8. inbox-compromise — fake-affiliation, Branch B

**Summary:** Orders through compromised inbox claiming exemption from SOC disclosure.

**Bypass methods relevant to M15:**

1. **Claim exemption / no IBC required.**
   - **MISSED.** If orders are placed through email (not the account portal), the drift detector may not ingest them at all — it requires structured data from the order DB. Even if ingested, an exemption claim produces a null SOC declaration, and the detector's feature vector has no input to shift on.

**Net assessment:** The drift detector cannot engage with exemption-claim framings or email-only ordering.

---

### 9. shell-company — Branch D

**Summary:** Real LLC ordering under benign business cover story, claiming exemption.

**Bypass methods relevant to M15:**

1. **Claim exemption from SOC categories.**
   - **MISSED.** Same as inbox-compromise: exemption claims produce no SOC declaration data for the detector to analyze.

**Net assessment:** No signal.

---

### 10. insider-recruitment — impersonate-employee, Branch B

**Summary:** Recruited insider self-attests orders covered by existing IBC protocol.

**Bypass methods relevant to M15:**

1. **Self-attest covered by existing IBC protocol.**
   - **MISSED.** Insider orders within the lab's existing scope. The feature stream continues the lab's historical pattern. No drift.

**Net assessment:** No engagement — the insider's orders look identical to the lab's normal ordering.

---

### 11. it-persona-manufacturing — exploit-affiliation, Branch B

**Summary:** Multiple personas inside real institution, each with lift-and-modify IBC paperwork.

**Bypass methods relevant to M15:**

1. **Lift-and-modify real IBC letter to back declaration.**
   - **MISSED** (per persona). Each persona has its own customer_id and its own consistent declaration. Cold-start for new personas; no drift for established ones.

**Net assessment:** Structural defeat (new accounts + consistency).

---

### 12. bulk-order-noise-cover — exploit-affiliation, Branch E

**Summary:** SOC orders hidden inside bulk legitimate ordering under shared facility declaration.

**Bypass methods relevant to M15:**

1. **SOC orders under shared boilerplate facility-research declaration.**
   - **CAUGHT** (partially). The `screening_hit_rate_increase` feature could detect a step-up in screening flags within the facility's order stream. However, if the SOC orders are a small fraction of the overall volume, the signal-to-noise ratio is poor. The implementation acknowledges that "CRO accounts that legitimately serve many different research projects — drift is the steady state" in the false-positive section, which implies shared-facility accounts would be excluded or heavily discounted.

**Net assessment:** Weak — the detector may fire on `screening_hit_rate_increase` but noise-dilution and facility-account false-positive handling likely suppress the signal.

---

### 13. biotech-incubator-tenant — purpose-built, Branch D

**Summary:** Incubator tenant with self-consistent research scope.

**Bypass methods relevant to M15:**

1. **Stated research scope to incubator and provider is identical and self-consistent.**
   - **MISSED.** Same as cro-framing: consistency from day one, no drift.

**Net assessment:** No signal.

---

### 14. dormant-account-takeover — exploit-affiliation, Branch D

**Summary:** Reactivated dormant account inherits the original lab's declared research scope.

**Bypass methods relevant to M15:**

1. **SOC orders matching the previously-recorded lab research area.**
   - **CAUGHT** (partially). A dormant account suddenly placing orders after a long gap could trigger drift detection — specifically, the reactivation itself is a temporal anomaly. Whether ADWIN/Page-Hinkley detect a gap-then-activity pattern depends on how the feature vector handles time gaps. If the detector treats the gap as zero-valued observations, the reactivation looks like a step change. If it only processes events, the gap is invisible.
   - **AMBIGUOUS.** The implementation does not specify how dormancy/gaps are handled in the streaming detector.

**Net assessment:** Possible detection if dormancy handling is implemented, but not specified.

---

## Findings

### Critical

**C1 — Drift detector is structurally blind to consistent deception.**

- **Stories affected:** lab-manager-voucher, cro-framing, cro-identity-rotation, insider-recruitment, it-persona-manufacturing, biotech-incubator-tenant, shell-company, account-hijack (8 of 14 stories).
- **Why missed:** The drift detector only flags *changes* in a customer's feature stream. Attackers who maintain a consistent cover story from the start — whether through vague language, engineered alignment, or operating within an inherited scope — produce flat trajectories. The implementation acknowledges this in the "Why this is M15-relevant" section ("the attacker who maintains a long, consistent fake history is *not* caught") but does not offer any mitigation.
- **Suggestion for re-research:** The implementation should explicitly scope the detector's coverage to *escalation* and *pivot* patterns and document the structural gap for consistent-deception branches. Consider whether a complementary *static* anomaly detector (e.g., flagging declarations that are suspiciously vague or boilerplate-like) could address the vague-declaration cluster, or whether that belongs in a different idea (m15-llm-extraction or m15-structured-form).

### Moderate

**M1 — Cold-start gap for new accounts (<10 orders).**

- **Stories affected:** unrelated-dept-student, cro-identity-rotation (new personas), it-persona-manufacturing (new personas), visiting-researcher.
- **Why missed:** Implementation states customers with <10 orders produce no signal. Many attacker branches use fresh accounts or accounts with minimal history.
- **Note:** Structural to time-series detection; not fixable without external signals. Other ideas (m15-structured-form, m15-llm-extraction) cover static per-order checks.

**M2 — Exemption-claim declarations produce null data for the detector.**

- **Stories affected:** inbox-compromise, shell-company.
- **Why missed:** If a customer declares "exempt / no SOC," the detector's feature vector has no SOC-related input to stream over. The implementation does not describe how null/exempt declarations are encoded.
- **Suggestion:** Stage 4 should specify how exempt declarations are encoded in the feature vector (e.g., a binary "declared-exempt" feature that, if it suddenly appears after prior non-exempt orders, triggers drift).

**M3 — Facility/CRO account exclusions suppress valid signals.**

- **Stories affected:** bulk-order-noise-cover.
- **Why missed:** The false-positive handling explicitly discounts CRO and facility accounts ("drift is the steady state"). This exclusion creates a blind spot for bulk-order-noise-cover, which operates through exactly these account types.
- **Suggestion:** Instead of excluding facility accounts, use a per-subcategory drift (e.g., track the SOC fraction separately from the non-SOC fraction) or flag the absolute count of screening hits, not just the rate.

### Minor

**N1 — Gradual escalation sensitivity depends on unspecified tuning parameters.**

- **Stories affected:** gradual-legitimacy-accumulation.
- **Why ambiguous:** ADWIN's `delta` parameter and Page-Hinkley's `threshold`/`alpha` are not specified. The claim that both detectors run in parallel is sound, but without sensitivity parameters the coverage is unverifiable.
- **Suggestion:** Stage 4 should specify the parameter ranges or describe a calibration procedure.

**N2 — Dormancy/gap handling unspecified.**

- **Stories affected:** dormant-account-takeover.
- **Why ambiguous:** The streaming detector's behavior during temporal gaps in the order stream is not documented. A dormant account reactivating could be caught or missed depending on gap encoding.
- **Suggestion:** Document how gaps are handled (e.g., explicit zero-fill vs. event-only stream).

---

## bypass_methods_known

| # | Bypass method | Classification | Stories |
|---|---|---|---|
| 1 | Consistent vague/boilerplate declarations (no drift) | MISSED | lab-manager-voucher, unrelated-dept-student |
| 2 | Engineered alignment (cover story matches SOC from day 1) | MISSED | cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation |
| 3 | Ordering within inherited/existing scope (no drift) | MISSED | account-hijack, insider-recruitment, dormant-account-takeover |
| 4 | Exemption-claim framing (null SOC data) | MISSED | inbox-compromise, shell-company |
| 5 | New persona cold start (<10 orders) | MISSED | cro-identity-rotation, it-persona-manufacturing, visiting-researcher, unrelated-dept-student |
| 6 | Lift-and-modify IBC letter (consistent persona) | MISSED | it-persona-manufacturing |
| 7 | Noise dilution in bulk facility ordering | MISSED (partial) | bulk-order-noise-cover |
| 8 | Gradual escalation within detector threshold | AMBIGUOUS | gradual-legitimacy-accumulation |
| 9 | Screening-hit-rate step-up (shift from non-SOC to SOC) | CAUGHT | unrelated-dept-student, visiting-researcher, bulk-order-noise-cover |
| 10 | BSL escalation feature | CAUGHT | gradual-legitimacy-accumulation (if step is large enough) |
| 11 | Concerning-trajectory curated match | CAUGHT | gradual-legitimacy-accumulation (if trajectory is curated) |

## bypass_methods_uncovered

| # | Bypass method | Severity | Notes |
|---|---|---|---|
| 1 | Consistent deception (no drift signal) | Critical | 8+ stories; structural to time-series approach |
| 2 | Cold-start for new accounts | Moderate | Structural to streaming detection |
| 3 | Exemption-claim null data | Moderate | Feature-encoding gap |
| 4 | Facility/CRO exclusion creating blind spot | Moderate | FP-handling design choice |
| 5 | Gradual escalation below threshold | Minor | Tuning-dependent |
| 6 | Dormancy gap handling | Minor | Specification gap |

---

## Verdict: **STRUCTURAL**

One Critical finding (C1): the drift detector is structurally blind to attackers who maintain consistency from the start, which is the dominant attacker strategy in 8 of 14 mapped stories. This gap is inherent to the time-series change-detection approach and cannot be closed by tweaking the implementation. The implementation already acknowledges this. The finding is routed to human review; the detector remains valuable for the escalation/pivot cluster but is not a standalone defense against M15 evasion.
