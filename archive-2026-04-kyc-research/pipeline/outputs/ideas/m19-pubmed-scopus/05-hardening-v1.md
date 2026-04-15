# m19-pubmed-scopus — Bypass-aware hardening v1

**Idea under review:** `m19-pubmed-scopus/04-implementation-v1.md`
**Measure:** M19 — Individual-legitimacy (SOC)

---

## Attacker story walk

### visiting-researcher

**Summary:** Lone operator with real visiting-scholar appointment, real `.edu`.

**Bypass methods relevant to M19:**

- **M4 Option 1 — Institution signal piggyback:** Attacker inherits host institution's PubMed/Scopus profile.
  - **Classification: MISSED.** The PubMed search is per-author, not per-institution. But `no_pubmed_author` alone is "does not by itself deny" (playbook step 3). The attacker is routed to institutional verification.

- **M4 Option 3 — LLM-assisted draft methods paper ($0–$240):** If posted to a PubMed-indexed journal (unlikely for preprints alone — PubMed indexes PMC-deposited preprints from bioRxiv only selectively).
  - **Classification: MISSED.** If the preprint is deposited in PMC (automatic for NIH-funded work), it appears in PubMed. Otherwise, PubMed may not index it. But the "no match is not denial" playbook means this bypass is unnecessary — absence alone does not block.

- **M4 Option 5 — Real minor footprint (preprint):** If the preprint reaches PubMed via PMC.
  - **Classification: MISSED.** Same as above.

**Net assessment:** The check adds no meaningful barrier beyond OpenAlex. `no_pubmed_author` is non-denial; a single indexed publication at the host institution would clear it.

---

### unrelated-dept-student

**Summary:** Real grad student, real affiliation, thin footprint.

- **Bypass A — Reflected legitimacy:** `no_pubmed_author` fires → non-denial.
  - **Classification: MISSED.**

- **Bypass B — Grad-student footprint floor:** 0–3 pubs is normal; many may not be PubMed-indexed (especially for non-biomedical departments).
  - **Classification: MISSED.** The implementation notes "Researchers outside biomedicine" and "Early-career researchers" in false positives.

- **Bypass E — Vague research self-declaration.**
  - **Classification: MISSED.** Orthogonal to the check.

**Net assessment:** Not binding. The student is indistinguishable from the false-positive population.

---

### lab-manager-voucher

**Summary:** Insider with legitimate ordering role, no publications.

- **Classification: MISSED.** "Industry scientists rarely publish in PubMed-indexed venues" and lab managers/technicians are explicitly in the false-positive population.

**Net assessment:** Structurally unable to bind.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a researcher persona.

- The manufactured persona has no PubMed record → `no_pubmed_author` fires.
  - **Classification: CAUGHT (weakly).** Flag fires, but per playbook this routes to enrichment, not denial.
- If the attacker seeds a publication listing the persona as coauthor on a real lab paper:
  - **Classification: MISSED.** One PubMed-indexed paper with matching affiliation clears the check.

**Net assessment:** Weak signal. Same as OpenAlex — catches the persona without a seeded publication, but denial depends on all corroboration checks also failing.

---

### dormant-account-takeover

- **Classification: MISSED.** Original holder's PubMed record is legitimate.

### account-hijack

- **Classification: MISSED.** PI's PubMed record is legitimate.

### foreign-institution

- **Classification: MISSED.** PubMed is US-biomedical-centric. Foreign researchers in non-biomedical fields are under-indexed. The implementation notes this.

### dormant-domain

- **Classification: AMBIGUOUS.** Defunct institution's historical PubMed papers persist. The attacker may benefit from name collision with past authors. The implementation does not specify a currency check on the affiliation.

### insider-recruitment

- **Classification: MISSED.** Real insider, real record (or population-normal absence).

### bulk-order-noise-cover

- **Classification: MISSED.** Established individual's PubMed record is real.

---

## Findings

### Critical

None.

### Moderate

**M1. PubMed adds no discriminating power beyond OpenAlex for the dominant attacker patterns.**
- Stories: all M19 stories.
- Why missed: The same structural limitation applies — absence is non-informative, presence can be cheaply constructed, and the false-positive population overlaps entirely with the attacker population.
- Suggestion: The implementation already frames PubMed as "second-source corroboration to OpenAlex." The incremental value is cross-source agreement (all sources agree = higher confidence), not independent catch capability.

**M2. Scopus commercial license cost vs. incremental value is questionable.**
- Stories: all.
- Why missed: Scopus provides the same author-lookup signal as OpenAlex/PubMed but requires a commercial license (low five figures USD/year). The incremental bypass-detection capability over the free sources is near-zero.
- Suggestion: Stage 4 could note that Scopus is a "nice to have" for cross-validation but should not be a gating dependency.

**M3. PubMed scope is narrower than OpenAlex — biomedical only.**
- Stories: `foreign-institution`, `unrelated-dept-student` (non-biomedical departments).
- Why missed: PubMed does not index chemistry, physics, engineering, or computational venues well. An attacker in these fields is structurally invisible.
- Suggestion: Acknowledge this as a coverage gap; do not rely on PubMed as the sole second source for non-biomedical orders.

### Minor

**m1. `pubmed_affiliation_stale` threshold (3 years) may be too generous.**
- If the most recent paper with the claimed institution is 2.5 years old, it passes. A visiting researcher's appointment may last only 6–12 months, so the 3-year window could pass someone who left the institution 2 years ago.
- Suggestion: Consider a 2-year window, or parameterize based on the customer's claimed role duration.

**m2. PubMed Affiliation field is free-text and inconsistent.**
- The implementation notes this: "only attached to *recent* (post-2014ish) records consistently." Affiliation queries have low recall on older records.
- Suggestion: Acknowledged; no fix.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| No PubMed record (non-denial) | visiting-researcher, unrelated-dept-student, lab-manager-voucher, foreign-institution | MISSED |
| Seeded PubMed-indexed publication | it-persona-manufacturing, visiting-researcher | MISSED |
| Grad-student footprint floor | unrelated-dept-student | MISSED |
| Non-biomedical scope gap | unrelated-dept-student, foreign-institution | MISSED |
| Real insider (no publications normal) | lab-manager-voucher, insider-recruitment, bulk-order-noise-cover | MISSED |
| Original holder's record | dormant-account-takeover, account-hijack | MISSED |
| Historical affiliation persistence | dormant-domain | AMBIGUOUS |
| Manufactured persona without publication | it-persona-manufacturing | CAUGHT (weak) |

## bypass_methods_uncovered

- All bypasses listed as MISSED above
- PubMed biomedical-only scope gap for non-biomedical populations
- Scopus license barrier limiting practical deployment

---

## Verdict: **PASS**

No Critical findings. The check is correctly framed as second-source corroboration, not an independent detection mechanism. Its value is in cross-source agreement with OpenAlex, not in catching bypasses that OpenAlex misses. Pipeline continues to stage 6.
