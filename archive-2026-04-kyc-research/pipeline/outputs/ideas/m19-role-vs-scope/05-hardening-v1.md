# m19-role-vs-scope — Bypass-aware hardening v1

**Idea under review:** `m19-role-vs-scope/04-implementation-v1.md`
**Measure:** M19 — Individual-legitimacy (SOC)

---

## Attacker story walk

### visiting-researcher

**Summary:** Lone operator with real visiting-scholar appointment; stated role and PI are real.

**Bypass methods relevant to M19:**

- **M4 Option 1 — Institution signal piggyback:** The visiting researcher's role claim ("visiting scholar in Prof X's lab") is true. The host PI is independently verifiable (faculty page, NIH grants).
  - **Classification: MISSED.** The SOP's triggers are: (a) junior role + Tier-1 SOC + no verified PI; (b) department/footprint mismatch. The visiting researcher has a verified PI on file, so trigger (a) does not fire. If the host lab works in the relevant domain, trigger (b) does not fire either.

- **M4 Option 3 — LLM-assisted draft methods paper:** Provides domain-aligned context for the role-vs-scope review.
  - **Classification: MISSED.** The paper strengthens the "role is plausible" assessment.

**Net assessment:** The SOP does not bind. The visiting researcher's role claim is true, the PI is real, and the appointment is genuine. The implementation explicitly acknowledges: "Visiting researcher — does not catch: the visiting role and host PI are real."

---

### unrelated-dept-student

**Summary:** Real grad student in a non-wet-lab department ordering SOC reagents.

**Bypass methods relevant to M19:**

- **Bypass A — Reflected legitimacy:** The student claims a rotation in a host lab whose domain matches the order.
  - **Classification: CAUGHT (partially).** If the student's home department is visibly unrelated (e.g., "Department of Computer Science" ordering BSL-3 select agents), the `role_scope_implausible_medium` flag fires. But the student can cite a rotation host in a relevant department, which the reviewer must then verify.

- **Bypass B — Grad-student footprint floor:** 0–3 publications is normal; the reviewer cannot distinguish.
  - **Classification: MISSED.** The SOP relies on the data checks (OpenAlex/ORCID/PubMed) for footprint assessment. If those produce no signal (which they don't for early-career), the reviewer has only the self-declared role.

- **Bypass C — Cite a rotation host with a substantive footprint.**
  - **Classification: CAUGHT (partially).** The SOP's step 4 says "contact the PI directly (independently verified contact)." If the reviewer actually contacts the PI and the PI confirms the rotation, the student passes legitimately. If the PI does *not* confirm (because the rotation is fabricated), the check catches it. The key question is whether the reviewer independently verifies the PI's contact information vs. using the student-provided contact.

- **Bypass E — Vague research self-declaration.**
  - **Classification: CAUGHT (partially).** The SOP is designed to evaluate exactly this. A vague declaration should trigger `role_scope_implausible_medium` or at minimum `role_scope_borderline`.

**Net assessment:** The SOP provides moderate friction for this attacker. The key catch mechanism is the "contact the PI directly" step — which works if the PI denies the relationship but fails if the PI confirms (as in a real rotation) or if the student fabricates the PI contact info and the reviewer doesn't independently verify. The implementation acknowledges: "catches the student only if the *department* mismatch is visible."

---

### lab-manager-voucher

**Summary:** Insider whose role legitimately includes oligo ordering.

- **Classification: MISSED.** The implementation explicitly states: "Lab manager / insider recruitment — does not catch: the role is legitimately what they claim." The SOP has no mechanism to distinguish a legitimate lab manager ordering legitimate reagents from a legitimate lab manager ordering SOC reagents for illicit purposes.

**Net assessment:** Structurally unable to bind.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a researcher persona.

- The persona's claimed role (e.g., "research technician" or "visiting scholar") matches the host lab's domain.
  - **Classification: MISSED.** If the persona's role claim is plausible for the host lab, the SOP passes it. The SOP checks role plausibility, not role authenticity.
- If the reviewer contacts the PI (who may be complicit or unaware):
  - **Classification: AMBIGUOUS.** The SOP says "contact the PI directly (independently verified contact)." If the PI is the one who sponsored the manufactured persona (via the IT admin's social engineering), the PI confirms. If the PI is unaware, the PI may or may not catch the discrepancy.

**Net assessment:** Depends on whether the PI is complicit. In the branch's cheapest variant (PI sponsors the manufactured persona), the SOP does not bind. In the variant where the PI is unaware, the "contact the PI" step may catch the persona — but only if the reviewer uses independently-sourced PI contact info.

---

### dormant-account-takeover

- **Classification: MISSED.** The original account holder's role was legitimate when established. The SOP does not re-evaluate role plausibility on dormant accounts unless triggered by something else.

### account-hijack

- **Classification: MISSED.** The PI's role is maximally plausible.

### foreign-institution

- **Classification: AMBIGUOUS.** The SOP's effectiveness depends on the reviewer's ability to evaluate foreign role titles and institutional norms. "Cross-cultural / cross-institutional norms: seniority titles and ordering authority vary by country and lab structure" is listed as a failure mode.

### dormant-domain

- **Classification: AMBIGUOUS.** The attacker claims to be a "successor researcher" at a revived entity. The role claim is unusual but not clearly implausible. The reviewer's judgment depends on domain expertise.

### insider-recruitment

- **Classification: MISSED.** Real insider, real role. Same as lab-manager-voucher.

### bulk-order-noise-cover

- **Classification: MISSED.** The established individual's role is plausible; the SOP evaluates role-vs-order-scope, not order volume anomalies.

---

## Findings

### Critical

None.

### Moderate

**M1. The SOP catches department-level mismatches but not role-authentic insiders.**
- Stories: `lab-manager-voucher`, `insider-recruitment`, `bulk-order-noise-cover`, `visiting-researcher`.
- Why missed: The SOP evaluates *plausibility* of role claims, not *intent*. Attackers whose roles genuinely include ordering SOC reagents are invisible.
- Suggestion: None within this SOP. This is the structural boundary of individual-legitimacy checks — they verify that the person *could* order, not that they *should*.

**M2. "Contact the PI directly" is the load-bearing step but its binding power depends on implementation specifics not pinned down.**
- Stories: `unrelated-dept-student`, `it-persona-manufacturing`.
- Why missed: The SOP says "independently verified contact, not the customer's claimed contact info" — good. But it does not specify *how* the reviewer independently verifies PI contact (faculty page lookup? institutional directory? phone call vs. email?). If the reviewer uses the customer-provided PI email, the check collapses.
- Suggestion: Stage 4 should specify the PI-verification method: (a) look up PI on institutional faculty directory; (b) use the directory-listed email or phone, not any contact info provided by the customer; (c) require the PI to respond via their institutional email with DKIM verification (cross-link to m20-dkim-institutional-email).

**M3. Reviewer subjectivity and calibration.**
- Stories: all.
- Why missed: "Two reviewers can disagree on 'plausible.'" The SOP includes calibration rounds but the implementation does not specify calibration frequency or worked-example content.
- Suggestion: Note this as a setup-cost item; not a bypass per se but a quality risk.

### Minor

**m1. Foreign role-title interpretation.**
- Story: `foreign-institution`.
- Detail: Foreign academic titles (e.g., "Dozent," "Maître de conférences," "Associate Professor" with different meanings in different countries) may be misread by US-trained reviewers.
- Suggestion: Provide a reference table of common foreign academic title equivalencies.

**m2. Dormant-account role staleness.**
- Story: `dormant-account-takeover`.
- Detail: The SOP does not specify re-evaluation of role plausibility on orders from accounts dormant for >N months.
- Suggestion: Cross-link with m16-dormancy-reidv to trigger role re-evaluation when a dormant account reactivates.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Real visiting role + verified PI | visiting-researcher | MISSED |
| Department mismatch visible | unrelated-dept-student | CAUGHT (partially) |
| Cite rotation host PI (PI confirms) | unrelated-dept-student | CAUGHT (partially — depends on independent PI verification) |
| Grad-student footprint floor | unrelated-dept-student | MISSED |
| Vague research self-declaration | unrelated-dept-student | CAUGHT (partially) |
| Legitimate ordering role (insider) | lab-manager-voucher, insider-recruitment, bulk-order-noise-cover | MISSED |
| Manufactured persona with plausible role | it-persona-manufacturing | MISSED (if PI complicit) / AMBIGUOUS (if PI unaware) |
| Original holder's role passes | dormant-account-takeover, account-hijack | MISSED |
| Foreign role-title ambiguity | foreign-institution | AMBIGUOUS |
| "Successor researcher" claim | dormant-domain | AMBIGUOUS |

## bypass_methods_uncovered

- Role-authentic insiders (lab managers, recruited insiders, established individuals)
- Visiting researchers with verified PIs
- Manufactured personas where the sponsoring PI is complicit
- Foreign role-title misinterpretation
- Dormant-account role staleness

---

## Verdict: **PASS**

No Critical findings. The SOP is correctly positioned as a backstop for the data-source checks, and its moderate findings are either structural (insiders with real roles) or addressable by tightening the PI-verification procedure (M2). Pipeline continues to stage 6.
