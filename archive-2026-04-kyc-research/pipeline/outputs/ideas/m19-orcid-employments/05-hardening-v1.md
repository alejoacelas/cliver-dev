# m19-orcid-employments — Bypass-aware hardening v1

**Idea under review:** `m19-orcid-employments/04-implementation-v1.md`
**Measure:** M19 — Individual-legitimacy (SOC)

---

## Attacker story walk

### visiting-researcher

**Summary:** Lone operator with real visiting-scholar appointment at an R1 university.

**Bypass methods relevant to M19:**

- **M4 Option 2 — Self-asserted ORCID with host-university affiliation:** "As of 2023, ~2% of ORCID records have institution-verified affiliations." The attacker creates an ORCID and self-asserts the host university. Cost: $0. Lead-up: minutes.
  - **Classification: CAUGHT (partially).** The implementation's `orcid_self_asserted_only` flag fires when the claimed institution is present but only as self-asserted. The reviewer playbook (step 2) says this is "not sufficient alone; require corroboration." However, the attacker has a real `.edu` email from the host institution, which constitutes corroboration. The flag fires but the corroboration path clears it.
  - **Net: MISSED in combination.** The self-asserted flag fires, but the required corroboration (institutional email) is satisfied by the real appointment. The check adds friction (flag + corroboration step) but does not block.

- **M4 Option 1 — Institution signal piggyback:** The host institution's record dominates. If the attacker does not provide an ORCID, `orcid_no_record` fires — but it's "enrichment, not denial."
  - **Classification: MISSED.** Absence of ORCID is non-informative.

- **orcid_recent flag:** If the attacker creates the ORCID in the last 60 days with only the claimed employer, this fires.
  - **Classification: CAUGHT (weakly).** Catches the attacker only in the narrow window where the ORCID is <60 days old and no publications are linked. A patient attacker who creates the ORCID months before the order (during the 2–4 month appointment lead-up) evades this flag entirely.

**Net assessment:** The check adds a small amount of friction (self-asserted flag + 60-day window) but the visiting-researcher's real institutional email provides corroboration that clears the flags. Minimal binding.

---

### unrelated-dept-student

**Summary:** Real grad student, real `.edu`, thin publication footprint, non-wet-lab department.

**Bypass methods relevant to M19:**

- **Bypass A — Reflected legitimacy:** Student may or may not have an ORCID. If no ORCID → `orcid_no_record` (non-denial). If ORCID exists with self-asserted current enrollment → `orcid_self_asserted_only` fires, but institutional email corroboration clears it.
  - **Classification: MISSED.** Same pattern as visiting-researcher.

- **Bypass B — Grad-student footprint floor:** Having no ORCID or a sparse ORCID is population-normal for early-career.
  - **Classification: MISSED.** The implementation acknowledges "Researchers without an ORCID at all" in false positives: "in the US life-sciences PI population, ORCID coverage is high (60–80%); among lab staff, technicians, BSOs, and industry scientists it is much lower (20–40%)."

- **Bypass D — Transliteration / name-disambiguation collision.**
  - **Classification: AMBIGUOUS.** ORCID search by name may return multiple candidates or the wrong one; listed as a failure mode.

**Net assessment:** Not binding. The student's ORCID status (present or absent) is indistinguishable from population-normal early-career patterns.

---

### lab-manager-voucher

**Summary:** Insider with legitimate institutional role; real identity throughout.

- Lab managers typically lack ORCID or have a sparse one. `orcid_no_record` fires → non-denial. If they do have ORCID, it's self-asserted but corroborated by institutional email.
  - **Classification: MISSED.** The implementation lists "Lab managers, technicians, BSOs, core-facility staff" under "Researchers without an ORCID at all" false positives.

**Net assessment:** Structurally unable to bind.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a researcher persona with real institutional credentials.

- The manufactured persona can have a freshly-created ORCID.
  - **Classification: CAUGHT (partially).** `orcid_recent` fires if created within 60 days. The implementation says "treat as suspicious — record created within the last 60 days with only the claimed employer asserted by the user themselves is consistent with the `it-persona-manufacturing` attacker pattern. Escalate." This is a direct design-target.
  - **Evasion:** If the attacker creates the ORCID >60 days before the order and gradually populates it, the flag does not fire. Cost: $0, lead-up: 60+ days. This is within the branch's normal 2–4 month operational timeline.

- If the attacker has the host institution assert the employment in ORCID via their Member API access (the IT admin may have credentials to do this):
  - **Classification: MISSED.** The implementation notes "catches the persona only if the attacker hasn't yet had the host institution assert the employment in ORCID." An IT admin with access to the institution's ORCID member integration can push the assertion.

**Net assessment:** Catches the impatient/unsophisticated variant (fresh ORCID in <60 days). Defeated by the patient variant (>60 days) or the IT-admin variant (institution-asserted).

---

### dormant-account-takeover

**Summary:** Take over dormant real researcher's account.

- The original researcher's ORCID record is legitimate and current.
  - **Classification: MISSED.** Check verifies the registered identity, not the current operator.

**Net assessment:** Invisible. Authentication layer.

---

### account-hijack

**Summary:** Hijack real PI's active session.

- **Classification: MISSED.** Same as dormant-account-takeover.

**Net assessment:** Invisible.

---

### foreign-institution

**Summary:** Individual claims affiliation with a foreign institution.

- ORCID adoption varies by region. The attacker may have no ORCID → non-denial, or a self-asserted ORCID → weak signal.
  - **Classification: MISSED.** Institution-verified assertions from foreign institutions are even rarer than the 2% baseline.

**Net assessment:** Structurally weak for international cases.

---

### dormant-domain

**Summary:** Revived dormant institutional domain.

- The attacker creates an ORCID with self-asserted affiliation to the revived entity. `orcid_self_asserted_only` fires.
  - **Classification: CAUGHT (weakly).** The flag fires, requiring corroboration. Corroboration path: institutional email from the revived domain (which the attacker controls) — this satisfies the corroboration requirement.
  - **Net: MISSED in combination.** The attacker controls the domain and the inbox.

**Net assessment:** Not binding. The corroboration path (institutional email) is controlled by the attacker.

---

### insider-recruitment

**Summary:** Recruited real insider.

- **Classification: MISSED.** Insider's ORCID (if any) is genuine.

**Net assessment:** Structurally unable to bind.

---

### bulk-order-noise-cover

**Summary:** Established individual hides SOC orders in legitimate volume.

- **Classification: MISSED.** Individual's ORCID is real.

**Net assessment:** Invisible.

---

## Findings

### Critical

None.

### Moderate

**M1. Self-asserted ORCID + institutional email corroboration clears all flags for attackers with real institutional access.**
- Stories: `visiting-researcher`, `unrelated-dept-student`, `dormant-domain`.
- Why missed: The `orcid_self_asserted_only` flag is the check's primary discriminating signal, but the reviewer playbook accepts institutional email as corroboration. Any attacker who controls an institutional inbox (which all of these do) clears the flag.
- Suggestion: Stage 4 could tighten by requiring corroboration from a *non-email* source (e.g., OpenAlex publication match, or supervisor confirmation). But this would significantly increase false-positive friction for the ~98% of ORCID users who have only self-asserted affiliations.

**M2. `orcid_recent` 60-day window is easily evaded by patient attackers.**
- Stories: `it-persona-manufacturing`, `visiting-researcher`.
- Why missed: The 60-day threshold is arbitrary and the attacker's operational timeline (months) exceeds it. A 6-month or 12-month window would catch more but false-positive on legitimate researchers who create ORCID as part of starting a new position.
- Suggestion: Consider a sliding threshold: `orcid_recent` fires if the ORCID was created within 6 months AND has <3 linked works AND the sole employment is self-asserted. This narrows evasion but increases false positives.

**M3. Institution-verified assertion (the strong signal) is available to only ~2% of the population.**
- Stories: all.
- Why missed: The implementation correctly identifies this as a limitation. The strong check is too rare to serve as a gate.
- Suggestion: None — this is a structural limitation of the ORCID ecosystem. The check is correctly framed as confidence-upgrading, not gatekeeping.

**M4. Authentication-layer attacks invisible.**
- Stories: `account-hijack`, `dormant-account-takeover`.
- Why missed: Same as m19-openalex-author. M19 checks legitimacy, not authentication.
- Suggestion: None within M19.

### Minor

**m1. IT admin may have ORCID member API access to push institution-verified assertions.**
- Story: `it-persona-manufacturing`.
- Detail not pinned down: Whether the reviewer would detect that the institution-verified assertion was pushed by an IT admin rather than an HR system.
- Suggestion: Note in the reviewer playbook that institution-verified assertions should be cross-checked against the institution's known ORCID integration method (if discoverable).

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Self-asserted ORCID + institutional email corroboration | visiting-researcher, unrelated-dept-student, dormant-domain | MISSED (flag fires but clears) |
| No ORCID (population-normal absence) | unrelated-dept-student, lab-manager-voucher, foreign-institution | MISSED |
| Fresh ORCID (<60 days) | it-persona-manufacturing | CAUGHT (weak — evadable by patience) |
| IT admin pushes institution-verified assertion | it-persona-manufacturing | MISSED |
| Real insider ORCID (or lack thereof) | lab-manager-voucher, insider-recruitment, bulk-order-noise-cover | MISSED |
| Original holder's ORCID passes | dormant-account-takeover, account-hijack | MISSED |
| Grad-student ORCID sparseness normal | unrelated-dept-student | MISSED |

## bypass_methods_uncovered

- Self-asserted ORCID cleared by institutional-email corroboration
- Patient ORCID creation (>60 days before order)
- IT admin institution-verified assertion injection
- Non-publishing role population (lab managers, technicians)
- Authentication-layer attacks (hijack, dormant-account)
- Foreign-institution low ORCID adoption

---

## Verdict: **PASS**

No Critical findings. The check is correctly scoped as a confidence-upgrading tool, not a gate. Its primary value — the institution-verified assertion signal — is real but affects only ~2% of the population. The Moderate findings are structural or already acknowledged. Pipeline continues to stage 6.
