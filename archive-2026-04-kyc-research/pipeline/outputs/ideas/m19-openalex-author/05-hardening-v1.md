# m19-openalex-author — Bypass-aware hardening v1

**Idea under review:** `m19-openalex-author/04-implementation-v1.md`
**Measure:** M19 — Individual-legitimacy (SOC)

---

## Attacker story walk

### visiting-researcher

**Summary:** Lone operator obtains a real visiting-scholar appointment at a US/European R1 university, uses genuine `.edu` credentials, real name throughout.

**Bypass methods relevant to M19:**

- **M4 Option 1 — Piggyback on host-lab publication trail / institution signal dominance:** "The host university's entity footprint (publications, grants, institutional standing) passes any provider review. The attacker inherits this by association."
  - **Classification: MISSED.** The implementation's `openalex_no_author_found` flag fires only when zero candidates are returned. But the reviewer playbook (step 3) says "zero candidates is not a denial — route to m19-orcid-employments and m18." The attacker does not need a personal OpenAlex profile — the institution signal carries them. The check produces no negative signal.

- **M4 Option 2 — Self-asserted ORCID with host-university affiliation:** "As of 2023, ~2% of ORCID records have institution-verified affiliations."
  - **Classification: MISSED.** This bypass targets ORCID (m19-orcid-employments), not OpenAlex directly. But the cross-routing in the reviewer playbook (step 3) sends no-match cases to ORCID, where the attacker's self-asserted ORCID provides a weak positive. The OpenAlex check itself produces no signal.

- **M4 Option 3 — LLM-assisted draft methods paper:** Cost $0–$240.
  - **Classification: MISSED.** If the attacker posts a preprint on bioRxiv, OpenAlex will index it (the implementation notes this). A single preprint at the claimed institution would satisfy `openalex_affiliation_mismatch` — the affiliation appears in the `affiliations[]` array. The `openalex_topic_mismatch` flag might fire if the preprint's topic diverges from the order, but the attacker can align the preprint topic to the order domain.

- **M4 Option 5 — Real minor footprint (preprint):** Cost $0–$2,000.
  - **Classification: MISSED.** Same mechanism as Option 3. One bioRxiv preprint = one OpenAlex work = affiliation match + works_count >= 1.

**Net assessment:** The check does not meaningfully raise cost or lead time for this attacker. A visiting researcher with zero personal publications is handled by the "not a denial" playbook; one with a single seeded preprint passes affirmatively.

---

### unrelated-dept-student

**Summary:** Real grad student in a non-wet-lab department uses their own real `.edu` and identity. Individual-legitimacy review must distinguish them from a wet-lab peer.

**Bypass methods relevant to M19:**

- **Bypass A — Reflected legitimacy from home institution:** "the institution's research profile carries the attacker through individual-level thinness."
  - **Classification: MISSED.** Same as visiting-researcher Option 1. The institution is a real R1; OpenAlex has thousands of authors there. The student's absence produces a `openalex_no_author_found` flag that the playbook treats as non-denial.

- **Bypass B — Grad-student footprint floor:** "having 0–3 publications in the first 2–3 years of a PhD is population-normal."
  - **Classification: MISSED.** The implementation explicitly acknowledges this in `false_positive_qualitative`: "Early-career researchers (first/second year PhD, postdocs in their first lab) — population-normal to have 0–3 publications." The check cannot distinguish the attacker from the 15–30% of legitimate customers in the same bucket.

- **Bypass C — Cite a rotation host with a substantive footprint.**
  - **Classification: MISSED.** The customer names a real PI. The reviewer may verify the PI exists but the OpenAlex check is on the *customer*, not the PI. The PI's footprint is irrelevant to the customer's OpenAlex match.

- **Bypass D — Transliteration / name-disambiguation collision.**
  - **Classification: AMBIGUOUS.** The implementation lists "Common-name disambiguation collisions" as a failure mode. If the student has a common name, they may be conflated with a real researcher — a false *negative* for the check (letting a non-match appear as a match). The implementation does not specify how disambiguation collisions are handled beyond "reviewer adjudicates."

- **Bypass E — Vague research self-declaration.**
  - **Classification: MISSED.** OpenAlex does not check self-declarations. This bypass is orthogonal to the check.

**Net assessment:** The check does not meaningfully reduce cost or lead time for this attacker. The attacker is indistinguishable from early-career legitimate customers.

---

### lab-manager-voucher

**Summary:** Insider whose legitimate day job is placing oligo orders. Individual record is real and authentic.

**Bypass methods relevant to M19:**

- **"The attacker uses their own real government ID, real PII, and real phone number."**
  - **Classification: MISSED.** The attacker is a real person at a real institution. If the lab manager has no publications (population-normal for the role), the `openalex_no_author_found` flag fires but the playbook says "not a denial."

- **"Early-career exception: The attacker personally may lack publications, but reviewers expect lab managers, technicians, and visiting affiliates to lack individual research footprints."**
  - **Classification: MISSED.** The implementation explicitly lists "Lab managers, technicians, BSOs, core-facility staff" in `false_positive_qualitative`. The check must accommodate them, which means the attacker passes.

**Net assessment:** The check is structurally unable to bind against this attacker. The attacker's role legitimately lacks a publication footprint.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a researcher persona via institutional IT systems; the persona has real institutional credentials.

**Bypass methods relevant to M19:**

- The manufactured persona will initially have no OpenAlex record → `openalex_no_author_found`. Per the playbook, this is "not a denial."
  - **Classification: CAUGHT (weakly).** The flag fires, and the persona is routed to corroboration checks. If none of the corroboration checks produce a positive signal either, the persona should eventually be denied. But the implementation does not guarantee denial on absence across all checks — it says "require a positive signal from at least one" alternative.

- If the attacker additionally seeds a preprint listing the persona as author at the host institution:
  - **Classification: MISSED.** One preprint = OpenAlex match. The persona passes.

**Net assessment:** Weak positive signal when the attacker has not seeded a preprint. Fully bypassed once a single preprint is posted ($0, 1–2 weeks).

---

### dormant-account-takeover

**Summary:** Take over a dormant but real provider account. Individual-legitimacy is the original account holder's.

- **Classification: MISSED.** The OpenAlex record belongs to the original account holder and is valid. The check confirms the legitimate researcher's identity, not the hijacker's.

**Net assessment:** Check is invisible to this attack vector. The bypass is at the authentication layer, not the legitimacy layer.

---

### account-hijack

**Summary:** Hijack a real PI's active session/credentials.

- **Classification: MISSED.** Same as dormant-account-takeover. The PI's OpenAlex profile is real and passes.

**Net assessment:** Invisible. Authentication attack, not legitimacy attack.

---

### foreign-institution

**Summary:** Individual claims affiliation with a foreign institution; provider cannot verify against foreign HR/directory.

- Foreign institutions are less well-indexed by OpenAlex (especially non-English-language venues). The `openalex_no_author_found` flag may fire but is treated as non-denial.
  - **Classification: MISSED.** The implementation notes "Non-Western researchers publishing in venues that are under-indexed by OpenAlex" in false positives. The check cannot distinguish a real foreign researcher with low OpenAlex coverage from an attacker.

**Net assessment:** Structurally weak. OpenAlex coverage asymmetry means the check is least useful where verification is most needed.

---

### dormant-domain

**Summary:** Revived dormant institutional domain. Attacker presents as "successor researcher" using residual publication trail.

- The defunct institution's past publications are still in OpenAlex. The attacker claims to be a researcher at the revived entity.
  - **Classification: AMBIGUOUS.** If the attacker uses a name that collides with a past researcher at the defunct institution, OpenAlex may return that researcher's record. If the attacker uses their own real name, `openalex_no_author_found` fires (non-denial). The key ambiguity: whether the reviewer would check that the institution is *currently active* vs. historically active in OpenAlex.

**Net assessment:** Weak. The check relies on the institution's historical footprint, which is exactly what the attacker exploits.

---

### insider-recruitment

**Summary:** Recruit a real insider whose individual legitimacy is authentic.

- **Classification: MISSED.** The insider's OpenAlex record (if any) is genuine. Same as lab-manager-voucher.

**Net assessment:** Structurally unable to bind.

---

### bulk-order-noise-cover

**Summary:** SOC orders hidden inside high-volume legitimate ordering by an established individual.

- **Classification: MISSED.** The individual's OpenAlex record is real and established. The check passes natively.

**Net assessment:** Invisible. The check verifies the individual is real, which they are.

---

## Findings

### Critical

None.

### Moderate

**M1. Early-career / non-publishing populations make absence non-informative.**
- Stories: `visiting-researcher`, `unrelated-dept-student`, `lab-manager-voucher`, `it-persona-manufacturing`.
- Why missed: 15–30% of legitimate customers have thin footprints; the implementation must treat absence as non-denial to avoid unacceptable false-positive rates. This means the check provides a positive signal when present but zero negative signal when absent — and the dominant attacker patterns are precisely the ones with absent footprints.
- Suggestion: The implementation already acknowledges this. No tightening within the OpenAlex check alone would fix it — it is structural. The value of this check is in *upgrading confidence when a match exists*, not in *downgrading confidence when one does not*.

**M2. Single seeded preprint defeats the check for $0–$240.**
- Stories: `visiting-researcher` (Options 3, 5), `it-persona-manufacturing`.
- Why missed: OpenAlex indexes bioRxiv and other preprint servers. One preprint = one work = affiliation match. The check has no mechanism to evaluate *quality* of the publication record (a single preprint with zero citations is treated identically to a well-cited body of work for purposes of clearing `openalex_affiliation_mismatch`).
- Suggestion: Stage 4 could add a "minimum footprint threshold" (e.g., works_count >= 3 AND at least one with cited_by_count > 0) before treating an OpenAlex match as a positive signal. But this tightening would re-increase false positives on legitimate early-career researchers.

**M3. Authentication-layer attacks (hijack, dormant-account-takeover) are invisible.**
- Stories: `account-hijack`, `dormant-account-takeover`.
- Why missed: The check verifies the *registered identity's* legitimacy, not *who is currently operating the account*. This is structural — M19 is a legitimacy check, not an authentication check.
- Suggestion: None within M19; these are M16 (MFA/stepup) concerns.

### Minor

**m1. Dormant-domain ambiguity on institutional currency.**
- Story: `dormant-domain`.
- Why ambiguous: The implementation does not specify whether the reviewer checks if the institution in `last_known_institutions` is *currently operational*. A defunct institution whose historical footprint persists in OpenAlex would appear legitimate.
- Suggestion: Add a reviewer playbook step: verify the institution has recent (within 2 years) indexed works, not just historical presence.

**m2. Foreign-institution coverage gap.**
- Story: `foreign-institution`.
- Why missed: OpenAlex coverage is lower for non-English venues. The check's discriminating power is weakest for the population where M19 verification is most needed.
- Suggestion: No fix within OpenAlex; acknowledged as a structural limitation.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Institution signal piggyback (no personal footprint needed) | visiting-researcher, unrelated-dept-student | MISSED |
| Self-asserted ORCID (cross-routed from OpenAlex) | visiting-researcher | MISSED |
| LLM-assisted preprint seeding | visiting-researcher, it-persona-manufacturing | MISSED |
| Grad-student footprint floor (0–3 pubs is normal) | unrelated-dept-student | MISSED |
| Cite rotation host PI | unrelated-dept-student | MISSED |
| Name-disambiguation collision | unrelated-dept-student | AMBIGUOUS |
| Real insider with legitimate non-publishing role | lab-manager-voucher, insider-recruitment, bulk-order-noise-cover | MISSED |
| Manufactured persona with no preprint | it-persona-manufacturing | CAUGHT (weak) |
| Manufactured persona with seeded preprint | it-persona-manufacturing | MISSED |
| Dormant account — original holder's record passes | dormant-account-takeover | MISSED |
| Hijacked session — PI's record passes | account-hijack | MISSED |
| Foreign institution under-indexed | foreign-institution | MISSED |
| Dormant domain — historical footprint persists | dormant-domain | AMBIGUOUS |

## bypass_methods_uncovered

- Institution signal piggyback (no personal footprint needed)
- LLM-assisted preprint seeding ($0–$240)
- Grad-student footprint floor
- Real insider with legitimate non-publishing role
- Dormant-account authentication-layer bypass
- Session-hijack authentication-layer bypass
- Foreign-institution coverage asymmetry
- Dormant-domain historical footprint exploitation

---

## Verdict: **PASS**

No Critical findings. The Moderate findings are either structural (the check is a positive-signal-only tool, not a gate) or already acknowledged in the implementation document. The check's value proposition — upgrading confidence when a match exists — is intact. Pipeline continues to stage 6.
