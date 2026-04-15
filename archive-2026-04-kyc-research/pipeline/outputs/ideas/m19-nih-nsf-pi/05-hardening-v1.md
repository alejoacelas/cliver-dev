# m19-nih-nsf-pi — bypass-aware hardening v1

- **measure:** M19 — individual-legitimacy-soc
- **name:** NIH / NSF / Wellcome / ERC PI lookup
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walk

### visiting-researcher

**Summary:** Obtains real visiting-scholar appointment; genuine .edu credentials; thin personal footprint.

**Bypass methods relevant to this measure:**

1. **"Piggyback on host-lab publication trail"** — the visitor inherits institutional standing but is not a PI.
   - **Classification: CAUGHT (correctly null).** `no_pi_record` fires. The visitor has no PI grants. The manual playbook correctly treats this as expected for non-PI roles.

2. **"Self-asserted ORCID"** — ORCID record exists but is self-asserted, not institution-verified.
   - **Classification: N/A** for the PI check per se, but the implementation uses ORCID as a disambiguator. A self-asserted ORCID would not produce PI records — it's only used to link name to person, not to validate PI status.

**Net assessment:** Flags fire correctly (no PI record). Signal is weak because visiting researchers are expected to have no PI grants. If the visitor claims to be a PI, `pi_at_different_institution` or a contradiction with the null record would be a useful signal.

---

### unrelated-dept-student

**Summary:** Real grad student in a non-wet-lab department; real .edu, thin footprint.

**Bypass methods relevant to this measure:**

1. **"Grad-student footprint floor"** — grad students are never PIs on public grants.
   - **Classification: CAUGHT (correctly null).** `no_pi_record` fires. Expected for all grad students.

2. **"Cite a rotation host with a substantive footprint"** — the student might name a rotation PI.
   - **Classification: N/A** — the check searches for the customer's name, not the rotation PI's.

**Net assessment:** Zero marginal signal. The check cannot distinguish malicious students from legitimate students — both lack PI records.

---

### lab-manager-voucher

**Summary:** Real insider with a legitimate lab-ordering role.

**Bypass methods relevant to this measure:**

1. **Real credentials, expected non-PI status.** — Lab managers are not PIs.
   - **Classification: MISSED (structural).** `no_pi_record` fires. Expected negative.

**Net assessment:** Zero signal. The insider is a legitimate non-PI.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a researcher persona with real institutional credentials.

**Bypass methods relevant to this measure:**

1. **"Direct injection / visiting-scholar pathway"** — manufactured persona has no PI grants.
   - **Classification: CAUGHT (correctly null).** `no_pi_record` fires. The manufactured persona, being fabricated, has no funder history.
   - **Signal strength:** Weak if the persona claims a non-PI role (lab manager, research tech). Moderate if the persona claims PI status — the contradiction between a PI claim and zero funder records is substantive.

**Net assessment:** Provides signal only when the manufactured persona claims PI status. For non-PI role claims, the check fires but is expected negative.

---

### dormant-account-takeover

**Summary:** Take over a dormant real researcher's provider account.

**Bypass methods relevant to this measure:**

1. **Original researcher's PI record** — the original account holder may have PI grants.
   - **Classification: MISSED.** The check validates the registered name's PI record. If the original researcher is/was a PI, `pi_record_present` fires — correctly for the name, but the person at the keyboard is different.
   - **Partial catch:** `pi_inactive_5yr` might fire if the researcher retired or moved on, providing weak staleness signal.
   - **Cross-check:** `pi_at_different_institution` could fire if the researcher's grants list a different institution than the one the dormant account is registered under (researcher moved before account went dormant).

**Net assessment:** Partial signal via staleness indicators. The check cannot detect the takeover itself.

---

### account-hijack

**Summary:** Hijack a real PI's active session.

**Bypass methods relevant to this measure:**

1. **Real PI's active grant record.**
   - **Classification: MISSED.** `pi_record_present` fires, validating the real PI. The hijack is invisible.

**Net assessment:** Zero signal.

---

### foreign-institution

**Summary:** Individual claims affiliation with a foreign institution.

**Bypass methods relevant to this measure:**

1. **Foreign researcher at a non-US/UK/EU institution** — no PI records in the covered funders.
   - **Classification: MISSED (coverage gap).** `no_pi_record` fires. Expected for researchers funded by JSPS, FAPESP, DST, RFBR, etc.

2. **Foreign researcher with US/UK/EU collaborative grants** — might appear as co-PI on an NIH/NSF/UKRI/ERC grant.
   - **Classification: CAUGHT.** If found, `pi_record_present` or `pi_at_different_institution` fires.

**Net assessment:** Weak signal. Most foreign-institution attackers would target institutions in regions where the funder databases provide no coverage.

---

### dormant-domain

**Summary:** Revive a defunct institution's domain; present as a researcher there.

**Bypass methods relevant to this measure:**

1. **"Name-disambiguation collision exploitation"** — the attacker selects a defunct entity where their name collides with a former PI.
   - **Classification: AMBIGUOUS.** If the attacker's name matches a former PI at the defunct institution who has grants in the databases, `pi_record_present` fires — a false positive. The institution on the grant would match the claimed institution (the defunct one), so `pi_at_different_institution` would NOT fire. The `pi_inactive_5yr` flag might fire if the defunct PI's grants are old enough.
   - **Mitigation:** This is a narrow attack (requires name collision with a specific former PI). The implementation's ORCID disambiguator could help: if the real PI has an ORCID and the attacker doesn't (or has a different one), the mismatch would surface. But ORCID-based disambiguation is described as "if available."

2. **Attacker's own name (no collision)** — no PI grants.
   - **Classification: CAUGHT (correctly null).** `no_pi_record` fires.

**Net assessment:** The check correctly identifies most dormant-domain attackers as having no PI record. The narrow name-collision variant could produce a false positive, but `pi_inactive_5yr` provides a partial defense.

---

### insider-recruitment

**Summary:** Recruit a real insider whose individual legitimacy is authentic.

1. **Real insider** — may or may not be a PI depending on their role.
   - **Classification: MISSED (structural).** If the insider is a PI, the check validates them. If not, it's expected negative.

**Net assessment:** Zero signal.

---

### bulk-order-noise-cover

**Summary:** Established individual hides SOC orders in high volume.

1. **Real established researcher** — likely a PI with active grants.
   - **Classification: MISSED (structural).** `pi_record_present` validates the researcher.

**Net assessment:** Zero signal.

---

## Findings

### Critical

*None.*

### Moderate

**M1. Name-collision exploitation in the dormant-domain scenario could produce false PI validation.**
- **Source:** dormant-domain, "Name-disambiguation collision exploitation."
- **Why missed:** If the attacker's name collides with a former PI at the defunct institution, the PI lookup returns that PI's grants with a matching institution — validating the attacker. The ORCID disambiguator is optional ("if available") and many older PIs lack ORCID records.
- **Suggestion:** Require ORCID-based confirmation when PI records are found for names associated with institutions that have other suspicious signals (e.g., m18-ror `ror_inactive`, m18-nih-reporter `nih_funding_all_expired`). If no ORCID is available, flag as `pi_record_unverified`.

**M2. Check provides near-zero signal against the majority of M19 attacker stories.**
- **Source:** visiting-researcher, unrelated-dept-student, lab-manager-voucher, insider-recruitment, bulk-order-noise-cover.
- **Why moderate:** The check is positive-evidence-only, and most M19 attacker stories involve individuals who are either (a) real and legitimate (insiders, established researchers) or (b) legitimately non-PI (students, lab managers, visiting researchers). The check's absence signal is structurally weak for these populations.
- **Suggestion:** This is inherent to PI-lookup checks. The value is concentrated in cases where the customer claims PI status and the claim can be verified or contradicted. No implementation change needed; this finding informs stage 8 about complementary coverage needs.

### Minor

**m1. Five-funder coverage still misses most non-Western funders.**
- **Source:** foreign-institution.
- **Why minor:** Already documented. The implementation covers NIH, NSF, UKRI, Wellcome, and ERC — five major Western funders. Asian, African, and Latin American funders are not covered.

**m2. Common-name collisions across funders without universal ORCID.**
- **Source:** Implementation's `failure_modes_requiring_review`.
- **Why minor:** Already documented. The `pi_name_collision_unresolved` flag handles this.

---

## bypass_methods_known

| Bypass method | Source story | Classification |
|---|---|---|
| Institution piggyback (non-PI) | visiting-researcher | CAUGHT (correctly null, weak signal) |
| Grad-student footprint floor | unrelated-dept-student | CAUGHT (correctly null, weak signal) |
| Real lab-manager credentials | lab-manager-voucher | MISSED (structural) |
| Manufactured persona (no PI grants) | it-persona-manufacturing | CAUGHT (correctly null, moderate if PI claimed) |
| Dormant account — original PI's record | dormant-account-takeover | MISSED |
| Active session hijack — real PI | account-hijack | MISSED |
| Foreign researcher (non-US/UK/EU) | foreign-institution | MISSED (coverage gap) |
| Name-disambiguation collision | dormant-domain | AMBIGUOUS |
| Attacker's own name (no collision) | dormant-domain | CAUGHT |
| Real insider | insider-recruitment | MISSED (structural) |
| Established researcher | bulk-order-noise-cover | MISSED (structural) |

## bypass_methods_uncovered

| Bypass method | Source story | Why uncovered |
|---|---|---|
| Real lab-manager credentials | lab-manager-voucher | Non-PIs expected to have no funder record |
| Dormant account — original PI's record | dormant-account-takeover | Check validates registered name, not current operator |
| Active session hijack | account-hijack | Check validates real PI |
| Foreign researcher (non-US/UK/EU) | foreign-institution | No funder-database coverage |
| Name-disambiguation collision | dormant-domain | Name collision inherits former PI's grants |
| Real insider / established researcher | insider-recruitment, bulk-order-noise-cover | Check validates genuine individuals |

---

## Verdict: **PASS**

No Critical findings. The moderate findings (name-collision exploitation, structural null for most stories) reflect the inherent nature of PI-lookup checks as positive-evidence instruments. The check is well-designed for its narrow role — verifying claimed PI status — and correctly soft for populations where PI status is not expected. No re-research needed.
