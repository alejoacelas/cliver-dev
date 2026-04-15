# m09-clinicaltrials-fda — bypass-aware hardening v1

- **measure:** M09 — institution-real-life-sciences
- **name:** ClinicalTrials.gov + FDA establishment registration cross-check
- **idea file:** `04-implementation-v1.md`

---

## Attacker story walk-through

### 1. shell-company

**Summary:** Purpose-built Delaware LLC, builds entity signals from scratch over 6–12 months (LLC, EIN, DUNS, website, preprints, order history), or acquires an existing company.

**Bypass methods relevant to this measure:**

- **Build entity signals from scratch (Bypass 1):** The shell LLC has no clinical trials and no FDA establishment registration. It is a synthetic biology startup or small biotech — exactly the kind of entity that legitimately has zero ClinicalTrials.gov presence and no FDA registration.
  - **Classification: MISSED.** The implementation explicitly acknowledges this: "many legitimate basic-research labs... have neither." The check fires `no_ctgov_no_fda_registration` but the playbook says this is "non-blocking on its own." The shell company's absence signal is indistinguishable from a real early-stage biotech's absence signal.

- **Acquire an existing company (Bypass 2):** A dormant or micro-CRO acquisition may or may not inherit CT.gov or FDA presence depending on the target. A going-concern with FDA registrations would pass this check outright.
  - **(a) Dormant micro-CRO:** **MISSED** — most small CROs have no CT.gov sponsor record and no FDA establishment registration. Same structural gap as Bypass 1.
  - **(b) Going-concern with FDA registration:** **CAUGHT** — if the acquired company has an existing FDA registration, the check would return a positive match. However, this is a *pass* for the attacker, not a catch. The check's positive evidence would validate the attacker. Net: the check helps the attacker if the acquired entity has registrations, and is blind if it doesn't.

**Net assessment:** This check provides zero friction for the shell-company branch. The attacker either has no registrations (indistinguishable from legitimate thin-profile entities) or inherits real registrations (positive evidence helps the attacker).

---

### 2. shell-nonprofit

**Summary:** Research nonprofit shell with name near-collision to a real institution; builds thin website, preprints, ORCID.

**Bypass methods relevant to this measure:**

- **Name-collision reflected legitimacy:** The attacker's near-collision name (e.g., "Midwest Institute for Genomic Health" vs real "Midwest Genomics Institute") could cause a CT.gov or openFDA search to return results for the *real* institution.
  - **Classification: AMBIGUOUS.** The implementation has name-normalization logic ("lowercased, stopwords stripped, Inc/LLC/Ltd suffix-tolerant") but does not describe disambiguation between near-collision names. If the normalized search for "Midwest Institute for Genomic Health" returns results for "Midwest Genomics Institute," the check would produce *false positive evidence* favoring the attacker. The implementation's `ctgov_match_but_role_unclear` and `fda_registration_address_mismatch` flags could catch this if the address differs, but CT.gov sponsor records do not always include a canonical address to compare against.

- **Real-entity registration with no clinical/regulatory activity:** The nonprofit is a real registered entity but does no clinical trials and has no FDA-regulated products.
  - **Classification: MISSED.** Same structural gap: absence is non-blocking.

- **Seed the principal's footprint (bioRxiv preprints, ORCID):** Not relevant to this measure (CT.gov/FDA-specific).

**Net assessment:** Minimal friction. The name-collision variant could even produce false positive evidence for the attacker if name disambiguation is weak.

---

### 3. cro-framing

**Summary:** Real US LLC presented as a small CRO. The CRO cover story is designed to neutralize entity-signal checks because real small CROs legitimately have no publications, no grants, and no IBC.

**Bypass methods relevant to this measure:**

- **Real LLC + CRO cover story:** Small CROs that do contract research typically do not sponsor clinical trials and may not hold FDA establishment registrations (unless they do GMP manufacturing or device work).
  - **Classification: MISSED.** The implementation acknowledges "small CROs that do contract research but not trial sponsorship and not GMP manufacturing" are legitimately absent. The CRO framing is designed precisely to exploit this gap.

- **CRO services-page cover story, LinkedIn personas, ORCID, Crunchbase listing, aged domain, no-publication strategy:** None of these produce CT.gov or FDA artifacts.
  - **Classification: MISSED** (irrelevant to this check; the check simply won't fire).

**Net assessment:** Zero friction. The CRO framing specifically exploits the structural blind spot of clinical-trial and FDA-registration databases for non-clinical-trial, non-manufacturing CROs.

---

### 4. cro-identity-rotation

**Summary:** 2–4 CRO LLCs filed in different biotech metros, each used at a different subset of providers.

**Bypass methods relevant to this measure:**

- **Real LLC + virtual office (cheapest), CRO cover-story neutralization, synthetic web/persona depth, fake client lists, Crunchbase seeding, conference attendee badges:** None produce CT.gov or FDA registration artifacts. Each entity is a clean small CRO with no clinical trial activity.
  - **Classification: MISSED.** Same as cro-framing — structural gap.

**Net assessment:** Zero friction. The rotation aspect is irrelevant to this check; each individual entity fails to appear, same as cro-framing.

---

### 5. biotech-incubator-tenant

**Summary:** LLC leases bench space at a biotech incubator, relies on reflected legitimacy.

**Bypass methods relevant to this measure:**

- **Bench-space lease at recognized biotech incubator:** The incubator tenant has no clinical trials and no FDA establishment. They describe themselves as "early-stage stealth biotech, pre-publication, pre-grant."
  - **Classification: MISSED.** Structural gap — early-stage incubator tenants legitimately have no presence in these databases.

- **Reflected legitimacy from incubator tenancy, light order history, real preprint output, buy aged dormant biotech LLC:** None produce CT.gov/FDA artifacts (except possibly the aged-dormant-biotech variant, which might inherit FDA registrations if the dormant entity had them — rare).
  - **Classification: MISSED** for the baseline path. **AMBIGUOUS** for the aged-dormant-biotech variant if the dormant entity had FDA registrations.

**Net assessment:** Zero friction for the standard incubator-tenant path.

---

### 6. gradual-legitimacy-accumulation

**Summary:** Real-but-hollow small biotech operated for 6–12 months, accumulating domain age, order history, ORCID, preprints.

**Bypass methods relevant to this measure:**

- **Time-aged domain, clean order history, ORCID + pay-to-publish, bioRxiv preprint, conference poster, Crunchbase listing, SBIR application:** None of these produce CT.gov or FDA registration artifacts.
  - **Classification: MISSED.** The entire branch's signal-accumulation strategy is orthogonal to clinical-trial and FDA databases.

- **Virtual office in biotech metro, incubator bench:** Same — no CT.gov/FDA relevance.
  - **Classification: MISSED.**

**Net assessment:** Zero friction. The branch accumulates signals that are explicitly outside this check's scope.

---

### 7. community-bio-lab-network

**Summary:** 2–3 community biology labs registered as LLCs/nonprofits in underserved metros with maker-space addresses and DIYbio.org listings.

**Bypass methods relevant to this measure:**

- **Real LLC + maker space address, minimal community-bio web presence, DIYbiosphere self-listing, citizen-science platform traces:** Community bio labs have no clinical trials and no FDA registrations by definition.
  - **Classification: MISSED.** The mapping file notes "a measure-4 review configured around publication history, NIH grants, and university IBC oversight would have a near-100% false-negative rate against community bio labs." The same applies to CT.gov/FDA: 100% false-negative rate.

**Net assessment:** Zero friction. Structural blind spot for the entire community-bio customer class.

---

### 8. dormant-domain

**Summary:** Attacker acquires the lapsed canonical domain of a defunct research entity whose publication trail is still live.

**Bypass methods relevant to this measure:**

- **Acquire lapsed canonical domain + reflected legitimacy from defunct entity's real publication trail:** If the defunct entity was ever a CT.gov sponsor or held FDA registrations, those records still exist in the database.
  - **Classification: AMBIGUOUS.** The check would find the defunct entity's historical CT.gov/FDA records and return a positive match. But the implementation does not check *liveness* — whether the entity is currently active, whether the registration is current vs. expired. The openFDA registration is periodically refreshed (annually), so a defunct entity's registration would eventually drop off. CT.gov trial records are permanent. If the defunct entity has historical CT.gov trials, the check produces *false positive evidence* for the attacker.

- **Active citation seeding via preprints:** Not relevant to CT.gov/FDA.

- **Self-register the revived lab:** Not relevant to this check directly.

**Net assessment:** AMBIGUOUS to actively harmful (positive evidence for attacker). The check lacks a liveness/recency dimension for historical CT.gov records.

---

### 9. foreign-institution

**Summary:** Exploits verification coverage gaps at mid-tier non-Anglophone research institutions.

**Bypass methods relevant to this measure:**

- **Author-name ambiguity, coverage-gap reliance on non-English venues, fabricated ORCID/Scholar, ride institution's generic footprint:** The real foreign institution may or may not have CT.gov/FDA presence. Many non-US institutions run clinical trials registered on CT.gov (it accepts international trials), but mid-tier non-Anglophone institutions in Brazil, India, Indonesia, Vietnam, and CIS are less likely to be registered.
  - **Classification: MISSED** for institutions not on CT.gov. **CAUGHT** (provides positive evidence) for institutions with CT.gov presence — but this *helps* the attacker who is exploiting a real institution's affiliation.

**Net assessment:** Minimal friction. For non-US institutions without CT.gov presence, the check is blind. For those with CT.gov presence, the check validates the attacker's claimed affiliation.

---

## Findings

### Finding 1 — Moderate: Structural false-negative rate for non-clinical, non-regulatory entities

- **Source:** shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network (all 6 purpose-built-org stories)
- **Why missed:** CT.gov and FDA registration databases cover only entities that sponsor/run clinical trials or manufacture/distribute FDA-regulated products. The majority of life-sciences entities (basic-research labs, computational biology, CROs, community labs, early-stage biotechs) have no presence in either database. The implementation correctly identifies this as a "positive corroboration" check, not a blocking gate — but the consequence is that the check contributes zero signal for the 6 most relevant attacker branches.
- **Suggestion:** No tightening possible within this idea's scope — the gap is structural to the data source. The idea is correctly positioned as a *corroborating* signal, useful only when it fires positive. Its value is concentrated on the subset of customers (pharma sponsors, device manufacturers, clinical sites) where absence would be surprising.

### Finding 2 — Minor: Name-collision false-positive risk in CT.gov searches

- **Source:** shell-nonprofit (name-collision reflected legitimacy)
- **Why missed:** The implementation's name-normalization layer does not describe a disambiguation protocol for near-collision names. CT.gov sponsor-name search is fuzzy. A name-collision attacker could receive false positive evidence if the search returns the real institution's trials. The `fda_registration_address_mismatch` flag partially addresses this for FDA, but CT.gov sponsor records do not reliably carry address information for comparison.
- **Suggestion:** Stage 4 could specify that CT.gov positive matches must be cross-validated against the customer's registered address or officer names before being counted as positive evidence. This would close the name-collision gap for CT.gov specifically.

### Finding 3 — Minor: Historical CT.gov records lack liveness check for dormant-domain scenario

- **Source:** dormant-domain (reflected legitimacy from defunct entity's real publication trail)
- **Why missed:** CT.gov trial records are permanent. A defunct entity's historical trials remain searchable indefinitely. The implementation does not check whether the matched trials are recent/active vs. completed/terminated years ago, or whether the entity's FDA registration is current.
- **Suggestion:** Stage 4 could add a recency filter: count only trials with a `primaryCompletionDate` or `statusVerifiedDate` within the last 5 years as positive evidence. Older-only results should be flagged as `ctgov_match_stale`.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Build entity signals from scratch (no trials/FDA) | shell-company | MISSED |
| Acquire dormant micro-CRO (no trials/FDA) | shell-company | MISSED |
| Acquire going-concern with FDA registration | shell-company | CAUGHT (helps attacker) |
| Name-collision reflected legitimacy | shell-nonprofit | AMBIGUOUS |
| Real nonprofit with no clinical/regulatory activity | shell-nonprofit | MISSED |
| CRO cover story — no trials by design | cro-framing | MISSED |
| CRO cover story — rotation variant | cro-identity-rotation | MISSED |
| Incubator tenancy — early-stage, pre-clinical | biotech-incubator-tenant | MISSED |
| Time-aged domain + accumulated non-clinical signals | gradual-legitimacy-accumulation | MISSED |
| Community-bio lab — no clinical/regulatory activity | community-bio-lab-network | MISSED |
| Acquire lapsed domain of defunct entity with historical CT.gov records | dormant-domain | AMBIGUOUS |
| Foreign institution without CT.gov presence | foreign-institution | MISSED |
| Foreign institution with CT.gov presence | foreign-institution | CAUGHT (helps attacker) |

## bypass_methods_uncovered

| Bypass | Story | Why uncovered |
|---|---|---|
| Build entity signals from scratch | shell-company | Non-clinical entities structurally absent from CT.gov/FDA |
| Acquire dormant micro-CRO | shell-company | Same structural gap |
| CRO cover story | cro-framing, cro-identity-rotation | Real small CROs legitimately absent |
| Incubator tenancy (early-stage) | biotech-incubator-tenant | Pre-clinical entities absent |
| Signal accumulation (non-clinical) | gradual-legitimacy-accumulation | Signals orthogonal to CT.gov/FDA |
| Community-bio labs | community-bio-lab-network | Structural 100% false-negative for this customer class |
| Name-collision reflected legitimacy | shell-nonprofit | Weak disambiguation in CT.gov search |
| Defunct entity historical records | dormant-domain | No liveness/recency filter on CT.gov matches |

---

## Verdict: **PASS**

No Critical findings. The structural false-negative rate (Finding 1) is Moderate because the implementation already correctly positions itself as a non-blocking corroborating signal — it is not supposed to catch these branches alone. The name-collision (Finding 2) and liveness (Finding 3) issues are Minor refinements. Pipeline continues to stage 6.
