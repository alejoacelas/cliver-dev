# m19-clinicaltrials-investigator — bypass-aware hardening v1

- **measure:** M19 — individual-legitimacy-soc
- **name:** ClinicalTrials.gov + FDA BIMO investigator
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walk

### visiting-researcher

**Summary:** Lone operator obtains a real visiting-scholar appointment at a university, uses genuine .edu credentials; thin personal research footprint.

**Bypass methods relevant to this measure:**

1. **"Piggyback on host-lab publication trail / institution signal dominance"** — host institution's standing passes review; visitor inherits by association.
   - **Classification: MISSED (out of scope).** This check is individual-level, not institution-level. But the visiting researcher would have no ClinicalTrials.gov or FDA BMIS record. The flag `no_ctgov_record` + `no_fda_bimo_record` would fire.
   - **However:** The manual playbook correctly notes that basic-science researchers, trainees, and non-clinical researchers routinely have no ClinicalTrials/BMIS record. The reviewer would likely categorize the visiting researcher as "expected negative — non-clinical research." The flag fires but provides weak signal.

2. **"Self-asserted ORCID with host-university affiliation"** — ORCID record exists but is not verified by the institution.
   - **Classification: N/A** for this check (ORCID is a different data source).

3. **"LLM-assisted draft methods paper" / "Real minor footprint (preprint)"** — publication footprint building.
   - **Classification: N/A** for this check (publication records are a different data source).

**Net assessment:** Correct flags fire but provide near-zero marginal signal because the visiting-researcher persona is in the population of legitimate researchers who are expected to have no clinical-trial record.

---

### unrelated-dept-student

**Summary:** Real grad student in a non-wet-lab department; real identity, real .edu, thin footprint is population-normal.

**Bypass methods relevant to this measure:**

1. **"Grad-student footprint floor"** — 0–3 publications in first 2–3 years is normal; certainly no clinical-trial record.
   - **Classification: MISSED (structural).** `no_ctgov_record` + `no_fda_bimo_record` fire, but this is expected for all grad students. The check cannot distinguish a malicious unrelated-dept student from a legitimate early-career researcher.

2. **"Reflected legitimacy from home institution"** — institution strength compensates for individual thinness.
   - **Classification: N/A** for this check.

**Net assessment:** Zero marginal signal. The check structurally cannot distinguish this attacker from the ~50%+ of legitimate grad student customers who have no clinical-trial involvement.

---

### lab-manager-voucher

**Summary:** Insider whose legitimate job is placing orders; real identity, real role, real credentials.

**Bypass methods relevant to this measure:**

1. **"The attacker's institutional email, HR record, and directory listing are all genuine."** — Lab managers/technicians have no ClinicalTrials.gov or BMIS records.
   - **Classification: MISSED (structural).** Flags fire but are expected negative. Lab managers, technicians, and support staff who legitimately place synthesis orders are not listed on Form 1572s or as study officials.

**Net assessment:** Zero signal. The check cannot bind this attacker without also flagging the entire population of legitimate lab-staff orderers.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a researcher persona with real institutional credentials.

**Bypass methods relevant to this measure:**

1. **"Direct injection / visiting-scholar pathway"** — manufactured persona has no ClinicalTrials/BMIS history.
   - **Classification: CAUGHT (weakly).** `no_ctgov_record` + `no_fda_bimo_record` fire. But the manufactured persona would be presented as a lab manager or research tech — roles where the absence is expected. If the persona is presented as a clinical researcher, the absence would be more suspicious.

**Net assessment:** Flags fire but signal strength depends on the claimed role. For non-clinical role claims, weak. For clinical role claims, moderate.

---

### dormant-account-takeover

**Summary:** Take over a dormant but real provider account belonging to a real researcher.

**Bypass methods relevant to this measure:**

1. **Inherited individual legitimacy** — the original account holder may have ClinicalTrials/BMIS records.
   - **Classification: MISSED.** If the original researcher has a ClinicalTrials.gov or BMIS record, the positive signal validates — but the person operating the account is different. The check validates the *registered name*, not the *current operator*. This is an authentication problem (M16/M14), not a legitimacy-check problem.

**Net assessment:** The check either (a) validates the original researcher's record (missing the takeover) or (b) fires no flags because the researcher has a legitimate record. Either way, zero signal against the takeover.

---

### account-hijack

**Summary:** Hijack a real PI's active session.

**Bypass methods relevant to this measure:**

1. **Real PI's credentials** — the PI almost certainly has ClinicalTrials.gov records if they run FDA-regulated trials.
   - **Classification: MISSED.** Same as dormant-account-takeover. The check validates the PI's record, not the person at the keyboard.

**Net assessment:** Zero signal.

---

### foreign-institution

**Summary:** Individual claims affiliation with a foreign institution; provider cannot verify individual against foreign institution.

**Bypass methods relevant to this measure:**

1. **Foreign researcher** — ClinicalTrials.gov only covers US-site investigators; BMIS only covers FDA-regulated investigators.
   - **Classification: MISSED (expected negative).** Most foreign researchers at non-US institutions have no ClinicalTrials.gov or BMIS records. The flag fires but is expected negative for this population.

**Net assessment:** Near-zero signal. The check's databases are US-centric. Foreign clinical investigators might appear if they ran trials with US sites, but the typical foreign-institution attacker targets institutions in regions with minimal US trial involvement.

---

### dormant-domain

**Summary:** Use a revived dormant institutional domain; present as a "researcher" at the defunct institution.

**Bypass methods relevant to this measure:**

1. **"Reflected legitimacy from defunct entity's real publication trail"** — the defunct institution's researchers may be in ClinicalTrials.gov.
   - **Classification: AMBIGUOUS.** The attacker presents under their own name, not a former researcher's name. If the attacker's name doesn't match any ClinicalTrials.gov/BMIS investigator, the flags fire correctly. If the attacker has a common name that collides with a real investigator, they might get a false positive match.
   - If the attacker uses "Name-disambiguation collision exploitation" (per the dormant-domain source), they target collisions with authors, not necessarily clinical investigators — a much smaller intersection.

**Net assessment:** Flags fire correctly for the attacker's real name (no clinical record). The name-collision variant is a narrow edge case.

---

### insider-recruitment

**Summary:** Recruit a real insider whose individual legitimacy is authentic.

**Bypass methods relevant to this measure:**

1. **Real insider** — the insider may or may not have ClinicalTrials/BMIS records depending on their role.
   - **Classification: MISSED (structural).** If the insider is a clinical researcher, they have records and the check validates them — correctly at the M19 level, but the insider is malicious. If they're not clinical, the check provides no signal.

**Net assessment:** Zero signal. The insider is a real, legitimate individual.

---

### bulk-order-noise-cover

**Summary:** Hide SOC orders inside high-volume legitimate ordering by an established individual.

**Bypass methods relevant to this measure:**

1. **Real established researcher** — likely has ClinicalTrials.gov records if clinical; certainly has a legitimate research footprint.
   - **Classification: MISSED (structural).** The check validates the real researcher.

**Net assessment:** Zero signal.

---

## Findings

### Critical

*None.*

### Moderate

**M1. Check is structurally null for the vast majority of M19 attacker stories.**
- **Source:** All stories except dormant-domain (where it provides weak signal).
- **Why missed:** ClinicalTrials.gov and FDA BMIS cover only clinical/translational researchers who have served as investigators on FDA-regulated trials. The M19 attacker stories primarily involve (a) real individuals whose legitimacy the check validates, (b) personas in non-clinical roles where absence is expected, or (c) foreign researchers outside US clinical-trial infrastructure.
- **Suggestion:** This is structural — not an implementation gap. The check provides value only for the narrow intersection of customers who claim clinical/translational research roles AND are at US institutions. The implementation correctly handles this by designing the flags as positive-evidence and explicitly documenting the populations for which absence is expected. No implementation change needed; the finding should inform stage 8 synthesis about which M19 ideas provide complementary coverage.

### Minor

**m1. Common-name collision risk in ClinicalTrials.gov lookups.**
- **Source:** dormant-domain (name-collision variant), implementation's `failure_modes_requiring_review`.
- **Why minor:** Already documented. The implementation uses middle-name initial + affiliation as disambiguators.

**m2. FDA BMIS coverage begins Oct 2008; older investigators not covered.**
- **Source:** Implementation's `failure_modes_requiring_review`.
- **Why minor:** Already documented. Senior investigators active only before 2008 would not appear.

---

## bypass_methods_known

| Bypass method | Source story | Classification |
|---|---|---|
| Institution piggyback | visiting-researcher | MISSED (out of scope) |
| Grad-student footprint floor | unrelated-dept-student | MISSED (structural) |
| Real lab-manager credentials | lab-manager-voucher | MISSED (structural) |
| Manufactured persona (non-clinical role) | it-persona-manufacturing | CAUGHT (weakly) |
| Dormant account inheritance | dormant-account-takeover | MISSED |
| Active session hijack | account-hijack | MISSED |
| Foreign researcher | foreign-institution | MISSED (expected negative) |
| Reflected legitimacy from defunct entity | dormant-domain | AMBIGUOUS |
| Real insider | insider-recruitment | MISSED (structural) |
| Bulk-order noise cover | bulk-order-noise-cover | MISSED (structural) |

## bypass_methods_uncovered

| Bypass method | Source story | Why uncovered |
|---|---|---|
| Institution piggyback | visiting-researcher | Check operates on individual, not institution; absence expected for non-clinical |
| Grad-student footprint floor | unrelated-dept-student | All grad students lack clinical-trial records |
| Real lab-manager credentials | lab-manager-voucher | Lab staff lack clinical-trial records |
| Dormant account inheritance | dormant-account-takeover | Check validates registered name, not current operator |
| Active session hijack | account-hijack | Same as above |
| Foreign researcher | foreign-institution | US-centric databases |
| Real insider | insider-recruitment | Insider is genuinely legitimate |
| Bulk-order noise cover | bulk-order-noise-cover | Researcher is genuinely legitimate |

---

## Verdict: **PASS**

No Critical findings. The single Moderate finding (structural null for most M19 stories) reflects the inherent narrowness of clinical-trial databases as an individual-legitimacy signal. The check is correctly designed as positive-evidence with explicit expected-negative documentation. Its value is concentrated in the subset of customers claiming clinical/translational roles, where a hit provides strong positive evidence. No re-research needed.
