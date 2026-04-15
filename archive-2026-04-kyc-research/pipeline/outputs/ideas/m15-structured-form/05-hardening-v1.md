# m15-structured-form — Bypass-aware hardening v1

- **idea:** Structured SOC declaration form
- **measure:** M15 — soc-self-declaration
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walkthrough

### 1. lab-manager-voucher — exploit-affiliation, Branch C

**Summary:** Real lab manager orders SOC using vague end-use language.

**Bypass methods relevant to M15:**

1. **Vague end-use self-declaration ("molecular biology research," "positive control for assay development").**
   - **CAUGHT** (partially). The structured form forces selection of a specific `intended_use_category` (enum) and `host_organism_taxid` (NCBI validated). The lab manager cannot write "molecular biology research" as the sole declaration — they must pick from the controlled vocabulary. However, the `other` escape hatch remains: the lab manager could select `other` for intended use and enter vague text in `notes`. This triggers the `excessive_other` flag, routing to reviewer.
   - If the lab manager picks a real but vague category (e.g., `protein-expression-purification`) and a valid but generic organism, the form submits without flags. The vagueness has been reduced but not eliminated — the structured fields constrain to a *level* of specificity but the categories may still be too broad to expose intent.

**Net assessment:** Meaningful improvement over free text. The form raises the floor on declaration specificity. The `excessive_other` heuristic catches the laziest evasion. But a minimally cooperative lab manager who picks real categories from the enums can still submit a non-revealing but technically valid form.

---

### 2. unrelated-dept-student — exploit-affiliation, Branch A

**Summary:** Student orders SOC under generic "research purposes."

**Bypass methods relevant to M15:**

1. **Generic end-use description.**
   - **CAUGHT.** "Research purposes" is not an enum value. The student must pick a specific `intended_use_category`, enter a valid organism taxid, and declare BSL level. `bsl_inconsistent` fires if the declared BSL is below the source organism's risk group. `select_agent_no_ibc` fires if the sequence involves a select agent and the student has no IBC approval. The student from an unrelated department is unlikely to know the correct BSL or have IBC approval.

**Net assessment:** Strong. The structured form forces domain-specific knowledge the student likely lacks.

---

### 3. cro-framing — purpose-built, Branch A

**Summary:** Real LLC with engineered alignment between cover story and SOC orders.

**Bypass methods relevant to M15:**

1. **Self-authored biosafety plan with scope matching SOC orders.**
   - **MISSED.** The CRO fills the structured form correctly: selects the appropriate `intended_use_category`, enters the correct `host_organism_taxid`, declares the correct `bsl_level_required`, and claims IBC status (or `not-applicable` for private-sector work without NIH funding). All validations pass. The form captures the correct information — but "correct" information from a malicious actor looks identical to correct information from a legitimate actor.

**Net assessment:** Structural defeat. The form captures data; it does not evaluate intent. The CRO's form submission is technically accurate.

---

### 4. cro-identity-rotation — purpose-built, Branch B

**Summary:** Rotating CRO personas with matching service areas.

**Bypass methods relevant to M15:**

1. **Per-persona service area matches SOC orders.**
   - **MISSED.** Same as cro-framing. Each persona fills the form correctly.

**Net assessment:** Structural defeat.

---

### 5. gradual-legitimacy-accumulation — purpose-built, Branch E

**Summary:** Attacker builds research history justifying SOC.

**Bypass methods relevant to M15:**

1. **Cover-story legitimacy justifies SOC declaration.**
   - **MISSED.** The attacker selects accurate form values reflecting their manufactured research identity. All validations pass.

**Net assessment:** Structural defeat.

---

### 6. account-hijack — impersonate-employee, Branch C

**Summary:** SOC orders through hijacked PI account.

**Bypass methods relevant to M15:**

1. **Declared use matches real PI's published research scope.**
   - **MISSED.** The hijacker fills the form with values consistent with the PI's known work. All fields valid.

**Net assessment:** No engagement — the form looks normal for this account.

---

### 7. visiting-researcher — fake-affiliation, Branch D

**Summary:** Visiting researcher referencing sponsor's research.

**Bypass methods relevant to M15:**

1. **Declaration references sponsor's research program.**
   - **CAUGHT** (partially). The structured form may expose gaps: if the visitor claims `ibc_approval_status = approved` but provides a protocol ID that doesn't exist at the claimed institution, downstream checks (m15-ibc-attestation) catch it. The form alone doesn't verify the IBC claim, but it *captures* it in a machine-checkable format for other ideas to cross-reference.
   - If the visitor selects valid enums and a real organism, the form passes.

**Net assessment:** The form is an enabler for other checks, not a blocker itself.

---

### 8. inbox-compromise — fake-affiliation, Branch B

**Summary:** Orders through compromised inbox claiming exemption.

**Bypass methods relevant to M15:**

1. **Claim exemption / no IBC required.**
   - **CAUGHT** (partially). If orders must go through the portal (not email), the attacker must fill the structured form. Selecting `ibc_approval_status = exempt-section-III-F` while ordering a select agent triggers `select_agent_no_ibc`. Selecting `other` or `unknown` for key fields triggers `excessive_other`.
   - However, if the attacker operates through email rather than the portal, the form is never presented. The implementation does not specify whether the form is mandatory for all ordering channels.

**Net assessment:** Effective if the form is mandatory for all channels. Bypassed if email ordering sidesteps the form.

---

### 9. shell-company — Branch D

**Summary:** Real LLC claiming exemption.

**Bypass methods relevant to M15:**

1. **Claim exemption from SOC categories.**
   - **MISSED** (mostly). The shell company fills the form with technically valid values. `ibc_approval_status = not-applicable` is a legitimate selection for private-sector work. If the company selects the right use category, organism, and BSL, the form passes. The exemption claim is captured as a structured field but not challenged by the form alone.

**Net assessment:** The form captures the exemption claim in machine-checkable format but does not itself challenge it.

---

### 10. insider-recruitment — impersonate-employee, Branch B

**Summary:** Recruited insider declares SOC orders covered by existing IBC.

**Bypass methods relevant to M15:**

1. **Self-attest covered by IBC protocol.**
   - **MISSED.** The insider fills the form with accurate values from their lab's real protocol. `ibc_approval_status = approved` with a real protocol ID. All validations pass.

**Net assessment:** No engagement.

---

### 11. it-persona-manufacturing — exploit-affiliation, Branch B

**Summary:** Multiple personas with modified IBC paperwork.

**Bypass methods relevant to M15:**

1. **Lift-and-modify IBC letter backs declaration.**
   - **MISSED.** Each persona fills the form with valid values. The modified IBC protocol ID is not verified by the form (that's m15-ibc-attestation's job).

**Net assessment:** No engagement by the form alone.

---

### 12. bulk-order-noise-cover — exploit-affiliation, Branch E

**Summary:** SOC orders hidden in bulk ordering.

**Bypass methods relevant to M15:**

1. **SOC orders under shared boilerplate declaration.**
   - **CAUGHT** (partially). The structured form forces per-order structured data rather than boilerplate. Each SOC order must declare the specific organism taxid and intended use. This makes the SOC orders machine-distinguishable from the non-SOC bulk — downstream reconciliation (m15-screening-reconciliation) can flag the specific SOC orders even if the account normally orders non-SOC material.
   - However, the facility could still use a shared template with the same form values for all orders.

**Net assessment:** Modest improvement — forces per-order specificity that enables downstream checks.

---

### 13. biotech-incubator-tenant — purpose-built, Branch D

**Summary:** Incubator tenant with self-consistent research scope.

**Bypass methods relevant to M15:**

1. **Stated research scope matches SOC orders.**
   - **MISSED.** Same as cro-framing.

**Net assessment:** Structural defeat.

---

### 14. dormant-account-takeover — exploit-affiliation, Branch D

**Summary:** Reactivated dormant account with inherited scope.

**Bypass methods relevant to M15:**

1. **SOC orders matching previously-recorded lab research area.**
   - **MISSED.** The new user fills the form with values consistent with the dormant lab's scope. Validations pass.

**Net assessment:** No engagement.

---

## Findings

### Critical

None.

### Moderate

**M1 — The `other/unknown` escape hatch degrades the form to free text.**

- **Stories affected:** lab-manager-voucher, any story where the attacker prefers vagueness.
- **Why relevant:** The `excessive_other` flag fires at 3+ controlled fields using `other/unknown`, but an attacker who uses `other` on only 1–2 fields (e.g., just `intended_use_category = other`) avoids the flag while still being vague on the most important field. The threshold of 3 is arbitrary.
- **Suggestion for re-research:** Stage 4 should specify which fields are "load-bearing" (where `other` should always trigger review regardless of the overall count). Candidate: `intended_use_category` and `source_organism_taxid` should individually trigger review if set to `other`.

**M2 — Form does not challenge exemption claims.**

- **Stories affected:** inbox-compromise, shell-company.
- **Why missed:** `ibc_approval_status = not-applicable` and `exempt-section-III-F` are valid selections. The form captures the claim but does not itself verify it. Verification depends on other ideas (m15-ibc-attestation).
- **Note:** This is by design — the form is a data-capture layer, not a verification layer.

**M3 — Multi-channel ordering may bypass the form.**

- **Stories affected:** inbox-compromise (email-based ordering).
- **Why missed:** The implementation does not specify whether the structured form is mandatory for all ordering channels (web portal, email, phone, EDI). If legacy channels exist, the form can be sidestepped.
- **Suggestion for re-research:** Stage 4 should specify that the structured form is required for all channels, or describe how non-portal orders are converted to the structured format.

### Minor

**N1 — Single-select intended-use for multi-purpose orders.**

- **Stories affected:** Cross-cutting (false positive concern).
- **Why relevant:** The enum is single-select. Researchers whose orders span multiple categories are forced to pick one, reducing data quality and triggering false disagreements with downstream checks.
- **Suggestion:** Allow multi-select or ranked primary/secondary use categories.

**N2 — Vocabulary drift as new use categories emerge.**

- **Stories affected:** Operational.
- **Why relevant:** The implementation notes that vocabulary must be curated. Without a defined update cadence, the form's coverage degrades over time.
- **Suggestion:** Specify vocabulary review cadence (e.g., quarterly).

---

## bypass_methods_known

| # | Bypass method | Classification | Stories |
|---|---|---|---|
| 1 | Vague free text replaced by forced enum selection | CAUGHT | lab-manager-voucher, unrelated-dept-student |
| 2 | BSL inconsistency detected | CAUGHT | unrelated-dept-student |
| 3 | Select-agent without IBC flagged | CAUGHT | unrelated-dept-student, inbox-compromise |
| 4 | Excessive `other` use flagged | CAUGHT | lab-manager-voucher (lazy path) |
| 5 | Technically accurate form submission by purpose-built orgs | MISSED | cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant |
| 6 | Insider with real protocol data fills form correctly | MISSED | insider-recruitment, account-hijack, dormant-account-takeover |
| 7 | Per-persona valid submissions | MISSED | it-persona-manufacturing |
| 8 | Exemption claim captured but unchallenged | MISSED | shell-company |
| 9 | Email ordering bypasses form | MISSED | inbox-compromise (email channel) |
| 10 | Form enables downstream checks (data capture) | CAUGHT (indirect) | bulk-order-noise-cover, visiting-researcher |

## bypass_methods_uncovered

| # | Bypass method | Severity | Notes |
|---|---|---|---|
| 1 | Technically accurate form from malicious actor | Moderate | Structural — form captures data, not intent |
| 2 | 1–2 field `other` use below threshold | Moderate | Per-field threshold needed |
| 3 | Multi-channel bypass | Moderate | Channel-mandate gap |
| 4 | Exemption claims unchallenged | Moderate | By design; paired with m15-ibc-attestation |

---

## Verdict: **PASS**

No Critical findings. The structured form is an enabling layer that raises the floor on declaration specificity and powers downstream M15 checks. Its structural limitation (cannot evaluate intent) is inherent and well-understood. Moderate findings (escape-hatch threshold, multi-channel mandate) are addressable in stage 4 refinement. Pipeline continues to stage 6.
