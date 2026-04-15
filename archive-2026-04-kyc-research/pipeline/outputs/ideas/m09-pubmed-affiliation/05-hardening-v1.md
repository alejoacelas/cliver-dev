# m09-pubmed-affiliation — bypass-aware hardening v1

- **measure:** M09 — institution-real-life-sciences
- **name:** PubMed (NCBI E-utilities) + bioRxiv affiliation history
- **idea file:** `04-implementation-v1.md`

---

## Attacker story walk-through

### 1. shell-company

**Summary:** Purpose-built Delaware LLC, builds entity signals including bioRxiv preprints over 6–12 months.

**Bypass methods relevant to this measure:**

- **Build entity signals from scratch — bioRxiv preprints:** "Posts one or two bioRxiv preprints" as part of the shell setup. Preprints are free to post, live within 72 hours, and indexed by Google Scholar.
  - PubMed: **CAUGHT (partially).** bioRxiv preprints are not indexed in PubMed (only peer-reviewed journal articles are). The `no_pubmed_affiliation_5yr` flag fires. However, the implementation has a separate `pubmed_thin_biorxiv_present` flag that would fire, which the playbook notes is "weak signal due to bioRxiv's low barrier."
  - bioRxiv: **MISSED.** The attacker's preprints would appear in bioRxiv search. The implementation explicitly notes "bioRxiv-only hits, no PubMed: moderate signal... recent attacker stories explicitly cite bioRxiv preprint seeding as cheap."
  - **Net: The check correctly identifies the bioRxiv-only pattern as weak signal, but does not block it.**

- **Acquire an existing company (Bypass 2):** If the acquired entity had published researchers, their PubMed-affiliated papers would appear. But the researchers likely leave when the entity is sold.
  - PubMed: **AMBIGUOUS.** Historical papers affiliated with the entity remain in PubMed indefinitely. But the papers' authors would have moved on. The implementation doesn't check whether current personnel match the published authors.
  - **Classification: AMBIGUOUS** — depends on whether the reviewer cross-checks author names against current customer contacts.

**Net assessment:** The check correctly flags the shell company's thin profile (`no_pubmed_affiliation_5yr`) and appropriately de-weights bioRxiv-only hits. Moderate friction — the attacker is flagged but not blocked, and the flag is shared with many legitimate thin-profile entities.

---

### 2. shell-nonprofit

**Summary:** Research nonprofit shell with name near-collision, preprints on bioRxiv/OSF/Zenodo.

**Bypass methods relevant to this measure:**

- **Name-collision reflected legitimacy:** "When a reviewer searches the entity name, Google results bleed the real institution's publications and grants into the picture."
  - PubMed `[ad]` search: **AMBIGUOUS.** If the attacker's entity name is "Midwest Institute for Genomic Health" and the real institution is "Midwest Genomics Institute," a PubMed `[ad]` affiliation search for the attacker's exact name may or may not return the real institution's papers depending on how authors wrote their affiliation strings. PubMed's `[ad]` field does fuzzy matching but searches the literal text of author-supplied affiliation strings, not a canonical institution registry.
  - **Classification: AMBIGUOUS.** The name-collision may or may not produce false positive PubMed hits. The implementation's `affiliation_collision_risk` flag is designed for this case ("multiple distinct addresses appear in author affiliations for the same name"), which is a relevant mitigation. But the attacker's chosen name is designed to be close enough to bleed results while being distinct enough to be a separate entity.

- **Seed the principal's footprint (bioRxiv preprints):** "Produces 1–2 credible methods preprints on bioRxiv/OSF/Zenodo, creates an ORCID iD and Google Scholar profile."
  - PubMed: **CAUGHT (partially).** bioRxiv preprints not in PubMed → `no_pubmed_affiliation_5yr` fires.
  - bioRxiv: **MISSED.** The preprints appear in bioRxiv, triggering `pubmed_thin_biorxiv_present`, which the implementation correctly identifies as weak signal.

- **Predatory-journal publication seeding (from cro-framing bypass list but applicable):** If the attacker publishes in a predatory but PubMed-indexed journal, the paper would appear in PubMed with the shell's affiliation.
  - **Classification: MISSED.** PubMed indexes some journals later removed from MEDLINE, and some low-quality OA journals remain indexed. A paid paper-mill authorship slot ($200–$5,000) on an existing manuscript in a PubMed-indexed journal would create a real PubMed affiliation hit for the shell entity.

**Net assessment:** The name-collision and bioRxiv-seeding paths are partially caught (flagged as weak/suspicious). But the predatory-journal / paper-mill path could create real PubMed hits that pass the check. This is a meaningful gap.

---

### 3. cro-framing

**Summary:** Real LLC as CRO. CRO cover story neutralizes publication-absence checks.

**Bypass methods relevant to this measure:**

- **No publication strategy — accept thin profile (Method 8):** "Aspirant. $0. None." The CRO simply has no publications. Real small CROs legitimately have no publications.
  - PubMed: **CAUGHT.** `no_pubmed_affiliation_5yr` fires. But the implementation acknowledges "Industry CROs whose work is contracted, IP-locked, and never published" as a legitimate false-positive population.
  - **Classification: CAUGHT but noisy.** The flag fires, but it fires on legitimate CROs too. The CRO cover story is designed to make this flag meaningless.

- **ORCID + Google Scholar self-affiliation (Method 4):** Self-asserted ORCID with CRO affiliation. No PubMed impact.
  - **Classification: MISSED.** ORCID is outside PubMed's scope.

- **Predatory-journal publication seeding (Method 7):** "$180–$5,000 per slot. 1–6 months."
  - **Classification: MISSED.** If the journal is PubMed-indexed, the paper creates a real PubMed hit. The implementation does not distinguish predatory-journal publications from legitimate ones within PubMed results.

- **Paid co-authorship slot (from cro-framing Method 4, combined variant):** "$200–$5,000."
  - **Classification: MISSED.** Same as predatory-journal seeding — creates a real PubMed affiliation hit.

**Net assessment:** `no_pubmed_affiliation_5yr` fires on the baseline CRO, but it's a noisy signal. The predatory-journal and paper-mill paths can create PubMed hits that pass the check entirely.

---

### 4. cro-identity-rotation

**Summary:** 2–4 CRO LLCs. Per-entity, same analysis as cro-framing.

**Bypass methods relevant to this measure:**

- Same as cro-framing per entity: no publications → flag fires but is noisy; predatory-journal/paper-mill → MISSED.
- **Synthetic web/persona depth (ORCID profiles):** ORCID is self-asserted, not in PubMed.
  - **Classification: MISSED.**

**Net assessment:** Same as cro-framing, per entity.

---

### 5. biotech-incubator-tenant

**Summary:** LLC at biotech incubator, early-stage stealth biotech posture.

**Bypass methods relevant to this measure:**

- **Reflected legitimacy from incubator tenancy:** No publications. "Early-stage stealth biotech, pre-publication, pre-grant."
  - PubMed: **CAUGHT.** `no_pubmed_affiliation_5yr` fires. But "small biotech startups that have not yet published" is a listed false-positive population.
  - **Classification: CAUGHT but noisy.**

- **Real preprint output (Method 4d):** "Conduct a small wet-lab project at the incubator... and post a preprint on bioRxiv."
  - PubMed: **CAUGHT (partially).** bioRxiv-only → `pubmed_thin_biorxiv_present` → weak signal.
  - **Classification: Flagged as weak signal, not blocked.**

**Net assessment:** Moderate friction via `no_pubmed_affiliation_5yr`, but the signal is noisy for the early-stage-biotech customer class.

---

### 6. gradual-legitimacy-accumulation

**Summary:** Accumulates ORCID, preprints, pay-to-publish articles over 6–12 months.

**Bypass methods relevant to this measure:**

- **ORCID profile and pay-to-publish article (Method 3):** "Publish a methods note or short technical write-up in a low-barrier journal. APCs for reputable pay-to-publish tiers (PLOS ONE, Frontiers) are $1,500–$3,000."
  - PubMed: **MISSED.** PLOS ONE and Frontiers journals are PubMed-indexed. A real publication with the shell entity as affiliation would create a genuine PubMed hit. The implementation would count this as positive evidence.
  - **Classification: MISSED.** The attacker creates a real peer-reviewed publication with proper affiliation.

- **Paper-mill purchased authorship (Method 4):** "$200–$5,000 per slot."
  - PubMed: **MISSED.** If the paper is in a PubMed-indexed journal, it creates a real hit.

- **bioRxiv preprint (Method 5):** Free, live within days.
  - PubMed: **CAUGHT (partially).** `pubmed_thin_biorxiv_present` fires.

- **Conference poster (Method 6):** Not indexed in PubMed.
  - **Classification: MISSED** (not relevant to this check).

**Net assessment:** The gradual-legitimacy branch can create real PubMed-indexed publications for $1,500–$5,000. These pass the check entirely. This is the most concerning bypass for this idea.

---

### 7. community-bio-lab-network

**Summary:** Community biology labs with no publications, no grants.

**Bypass methods relevant to this measure:**

- **Minimal community-bio presence, citizen-science platform traces:** No PubMed publications.
  - PubMed: **CAUGHT.** `no_pubmed_affiliation_5yr` fires. But the mapping notes "a measure-4 review configured around publication history... would have a near-100% false-negative rate against community bio labs."
  - **Classification: CAUGHT but structurally noisy.** Real community bio labs have the exact same profile.

- **Self-published protocols on Protocols.io, iNaturalist:** Not in PubMed.
  - **Classification: MISSED** (outside scope).

**Net assessment:** The flag fires but is structurally useless for distinguishing attacker community labs from legitimate ones.

---

### 8. dormant-domain

**Summary:** Acquires lapsed domain of defunct research entity with live publication trail.

**Bypass methods relevant to this measure:**

- **Reflected legitimacy from defunct entity's real publication trail:** "Points reviewers at the real, indexed publications associated with the defunct entity's domain. No fabrication needed — the records already exist in PubMed, Scholar, and RePORTER."
  - PubMed: **MISSED.** The defunct entity's historical publications are still in PubMed with the entity's name as affiliation. A PubMed `[ad]` search returns real papers. The check produces strong positive evidence for the attacker.
  - **Classification: MISSED.** The check validates the attacker's claimed institution based on historical publications that are no longer being produced.

- **Active citation seeding via low-bar OA preprints (Bypass C):** Creates fresh PubMed entries (if published in journals) or bioRxiv entries under the revived-lab affiliation.
  - **Classification: MISSED.** Creates additional genuine publication records.

**Net assessment:** The check actively validates the dormant-domain attacker. Historical publications of the defunct entity serve as the attacker's positive evidence. The implementation does not check whether publications are *recent* vs. historical-only — a recency filter would help here.

---

### 9. foreign-institution

**Summary:** Exploits verification gaps at non-Anglophone institutions.

**Bypass methods relevant to this measure:**

- **Author-name ambiguity / transliteration collision (Method 1):** "Select a persona name that collides with real published authors in PubMed. About two-thirds of PubMed author names are vulnerable to homonym/synonym ambiguity."
  - PubMed: **MISSED.** The attacker searches for the *institution's* name, which is a real institution with real PubMed-indexed publications. The `[ad]` affiliation search returns real papers. The check validates the institution's reality.
  - **Classification: MISSED.** The check works at the institution level and the institution is real.

- **Coverage-gap reliance on non-English publication venues (Method 2):** "The provider's M4 review simply has limited reach into non-English literature."
  - PubMed: **AMBIGUOUS.** If the real institution publishes primarily in non-English venues not indexed by PubMed, the check may return low/zero results despite the institution being real and active.
  - **Classification: AMBIGUOUS** — could produce false negatives on legitimate institutions in non-Anglophone venues.

- **Fabricated ORCID / Google Scholar (Method 3):** ORCID and Scholar profiles are self-asserted. Not in PubMed directly.
  - **Classification: MISSED** (outside PubMed scope).

- **Ride institution's generic footprint (Method 4):** The real institution's PubMed presence carries the check.
  - **Classification: MISSED.** The check validates the real institution.

**Net assessment:** Zero friction. The institution is real and has PubMed publications. The attacker benefits from the institution's legitimate publication record.

---

## Findings

### Finding 1 — Moderate: Pay-to-publish and paper-mill paths create genuine PubMed hits

- **Source:** gradual-legitimacy-accumulation (Methods 3–4), cro-framing (Method 7), shell-nonprofit (predatory-journal variant)
- **Why missed:** PubMed indexes publications from PLOS ONE ($1,500 APC), Frontiers journals ($1,000–$3,000 APC), and other legitimate OA journals. A real publication with the attacker's institution as affiliation creates a genuine PubMed record indistinguishable from any other publication. Paper-mill purchased authorship ($200–$5,000) on an existing accepted manuscript achieves the same result. The implementation has no mechanism to distinguish bought vs. earned publications.
- **Suggestion:** This is a structural limitation — PubMed does not flag predatory or paper-mill publications. A partial mitigation would be to weight publication *volume* and *recency distribution*: a single paper at a single journal is much weaker than a sustained multi-year publication pattern across multiple journals. Stage 4 could add a `pubmed_single_paper_only` flag for institutions with exactly 1 PubMed hit. But an attacker willing to spend $3,000–$15,000 on 3–5 publications would defeat even this refinement.

### Finding 2 — Moderate: Historical publication trail validates dormant-domain attacker

- **Source:** dormant-domain (reflected legitimacy from defunct entity's real publication trail)
- **Why missed:** PubMed retains all historical publications indefinitely. A defunct entity's papers from 5–15 years ago still appear in `[ad]` searches. The implementation counts publications "in the last 5 years" via date filter, which helps — but a defunct entity that was active until, say, 3 years ago would still show recent-enough publications.
- **Suggestion:** Stage 4 could add a *recency trend* analysis: if publications clustered 3–5 years ago with nothing in the last 2 years, flag `pubmed_publication_trend_declining`. This would distinguish a defunct entity (step-function decline) from a slow-but-active one (gradual decline).

### Finding 3 — Minor: `no_pubmed_affiliation_5yr` is structurally noisy for CRO, early-stage, and community-bio customer classes

- **Source:** cro-framing, biotech-incubator-tenant, community-bio-lab-network
- **Why missed:** The implementation correctly identifies all three as false-positive populations ("Industry CROs whose work is contracted... Small biotech startups that have not yet published... DIY / community bio labs"). The flag fires on these legitimate customers at the same rate as on attackers. The signal-to-noise ratio is low for these customer classes.
- **Suggestion:** No implementation change possible — this is a structural limitation of using publication history as a proxy for life-sciences legitimacy. The check's value is concentrated on the academic/institutional customer class where publication absence is genuinely suspicious.

### Finding 4 — Minor: bioRxiv affiliation search is limited to corresponding author only

- **Source:** Implementation's own acknowledged limitation
- **Why missed:** The bioRxiv API "exposes only the corresponding author's affiliation, not all author affiliations." This means a legitimate institution where researchers are co-authors but not corresponding authors would show lower bioRxiv counts than expected. This is a data-completeness issue, not a bypass issue.
- **Suggestion:** The implementation already suggests mirroring bioRxiv and using Rxivist for full affiliations. This would improve completeness for legitimate institutions but does not affect the attacker analysis.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| bioRxiv preprint seeding (free, 72h) | shell-company, shell-nonprofit, gradual-legitimacy-accumulation | CAUGHT (partially — `pubmed_thin_biorxiv_present` flagged as weak) |
| No publication strategy (CRO cover) | cro-framing, cro-identity-rotation | CAUGHT (`no_pubmed_affiliation_5yr`) but noisy |
| Early-stage stealth posture | biotech-incubator-tenant | CAUGHT (`no_pubmed_affiliation_5yr`) but noisy |
| Community-bio lab (no publications) | community-bio-lab-network | CAUGHT (`no_pubmed_affiliation_5yr`) but structurally noisy |
| Pay-to-publish in PubMed-indexed journal ($1,500–$3,000) | gradual-legitimacy-accumulation | MISSED |
| Paper-mill purchased authorship ($200–$5,000) | gradual-legitimacy-accumulation, cro-framing | MISSED |
| Name-collision PubMed affiliation bleed | shell-nonprofit | AMBIGUOUS |
| Defunct entity's historical publication trail | dormant-domain | MISSED |
| Active citation seeding under revived-lab name | dormant-domain | MISSED |
| Real foreign institution's PubMed record | foreign-institution | MISSED (validates real institution) |
| Non-English venue coverage gap | foreign-institution | AMBIGUOUS |

## bypass_methods_uncovered

| Bypass | Story | Why uncovered |
|---|---|---|
| Pay-to-publish / paper-mill PubMed hits | gradual-legitimacy-accumulation, cro-framing | Genuine PubMed records indistinguishable from earned publications |
| Defunct entity's historical publications | dormant-domain | No recency-trend analysis to detect step-function publication decline |
| Real foreign institution's publication record | foreign-institution | Check validates institution, not individual affiliation |

---

## Verdict: **PASS**

No Critical findings. The two Moderate findings (pay-to-publish creating genuine PubMed hits, and dormant-domain reflected legitimacy) are real gaps but rated Moderate rather than Critical because: (1) pay-to-publish requires $1,500–$5,000+ and 3–6 months, adding meaningful cost and time to the attack; (2) the dormant-domain scenario is already targeted by the companion domain-auth-stack idea; and (3) both gaps are partially addressable with refinements (single-paper flag, recency-trend analysis) rather than requiring re-research. Pipeline continues to stage 6.
