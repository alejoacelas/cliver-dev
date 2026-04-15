# m18-nih-reporter — bypass-aware hardening v1

- **measure:** M18 — institution-legitimacy-soc
- **name:** NIH RePORTER funded-institution signal
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walk

### shell-nonprofit

**Summary:** Stand up a fake research nonprofit whose name near-collides with a real institution; register domain, build entity signals, optionally get ROR-listed.

**Bypass methods relevant to this measure:**

1. **"Name-collision reflected legitimacy"** — entity name near-collides with a real funded institution, so a reviewer searching for the shell's name might see the real institution's NIH grants.
   - **Classification: AMBIGUOUS.** The implementation uses `org_names` exact/alias matching in the API. If the attacker names the shell "Midwest Institute for Genomic Health" and the real institution "Midwest Genomics Institute" has NIH grants, a fuzzy search might return the real institution's grants — creating a false positive (the shell appears funded). However, the implementation's name-normalization table maps *known aliases*, not arbitrary near-collisions. Whether the fuzzy fallback (Levenshtein over ExPORTER org_names) would match a deliberately adjacent name depends on the edit distance threshold, which is not specified.
   - **Detail needed:** What Levenshtein threshold is used for the fuzzy fallback? A threshold of ≤2 would miss most name collisions; a broader threshold would increase false positives.

2. **"Stand up the shell's own domain and mailbox"** — irrelevant to this check (domain-level bypass; NIH RePORTER does not use domains).
   - **Classification: N/A.**

3. **"ROR self-listing"** — irrelevant to this check (ROR is a separate data source).
   - **Classification: N/A.**

4. **"Seed the principal's footprint" / "Fiscal sponsorship"** — the shell might eventually apply for and receive an SBIR/STTR grant, but this takes years and is effectively obtaining real legitimacy.
   - **Classification: CAUGHT** in the sense that the check would correctly show no NIH funding for the shell until it actually obtains a grant. The soft flag `no_nih_funding_5yr` would fire.

**Net assessment:** The check correctly identifies the shell as unfunded. The name-collision issue (where fuzzy matching might bleed the real institution's grants into the result) is an ambiguous edge case that depends on the fuzzy-fallback implementation. If the fuzzy match is tight, the shell gets correctly flagged. If it's loose, the shell might accidentally pass. The `no_nih_funding_5yr` flag is a soft negative — reviewers combine it with other signals, which is the correct design.

---

### shell-company

**Summary:** Build a Delaware LLC into something resembling a real small biotech.

**Bypass methods relevant to this measure:**

1. **"Build entity signals from scratch"** — the shell has no NIH grants and would not for years.
   - **Classification: CAUGHT.** `no_nih_funding_5yr` fires. The shell is correctly identified as having zero NIH funding.

2. **"Acquire an existing company"** — buying a dormant micro-CRO or going concern.
   - **Classification: CAUGHT (partial).** If the acquired company never had NIH grants (most small CROs), the flag fires correctly. If the company had historic SBIR/STTR grants, the flag would not fire — but this is a true positive (the company did have real NIH funding).

**Net assessment:** Strong signal against shell companies with no research funding history. The flag is correctly soft (many legitimate industry entities also lack NIH grants), and the manual playbook correctly categorizes industrial entities as "negative result expected."

---

### biotech-incubator-tenant

**Summary:** Rent space at a biotech incubator; use own LLC identity.

**Bypass methods relevant to this measure:**

1. **Incubator tenant under own LLC** — the LLC has no NIH grants.
   - **Classification: CAUGHT.** `no_nih_funding_5yr` fires. However, the manual playbook correctly notes that industry/startup entities are expected to lack NIH funding, so the flag would be soft.
   - **Risk:** The reviewer might dismiss the flag too easily because the entity appears to be a "legitimate startup at a reputable incubator."

**Net assessment:** The check fires correctly but its soft nature means it adds only marginal signal when combined with the strong positive signal from the incubator address.

---

### cro-framing

**Summary:** CRO façade with entity-type cover.

**Bypass methods relevant to this measure:**

1. **CRO entity construction** — CROs often lack direct NIH grants.
   - **Classification: CAUGHT.** `no_nih_funding_5yr` fires. But the manual playbook correctly categorizes CROs as "not an NIH-eligible category," softening the flag to expected-negative.

**Net assessment:** Correct identification, but low signal because the flag is expected for CROs.

---

### cro-identity-rotation

**Summary:** Multiple rotated CRO shells.

**Bypass methods relevant to this measure:**

1. **Each rotated shell has no NIH funding.**
   - **Classification: CAUGHT.** Each shell triggers `no_nih_funding_5yr`. Same limitations as cro-framing.

**Net assessment:** Same as cro-framing. Low marginal signal per instance.

---

### community-bio-lab-network

**Summary:** Community biology lab as institutional cover.

**Bypass methods relevant to this measure:**

1. **Community lab as institution** — community labs do not receive NIH grants (or rarely via education/outreach R25 awards).
   - **Classification: CAUGHT.** Flag fires. But community labs are a category the reviewer might categorize as "expected negative."

**Net assessment:** Correct identification; low signal because community labs are a known NIH-unfunded category.

---

### gradual-legitimacy-accumulation

**Summary:** 12–24 months building entity track record (preprints, grants, orders).

**Bypass methods relevant to this measure:**

1. **Accumulated legitimacy** — the branch's timeline suggests the entity might eventually apply for SBIR/STTR, but the implementation checks against a 5-year window.
   - **Classification: CAUGHT (for the first 5+ years).** The flag correctly identifies the entity as having no NIH funding during its buildup phase. If the entity eventually receives a grant, the flag would correctly clear — but at that point the entity has obtained real legitimacy.

**Net assessment:** Good temporal signal. The 5-year window means the check remains effective throughout the typical buildup period (12–24 months). The entity can only clear this check by obtaining an actual NIH grant, which is real legitimacy.

---

### dormant-domain

**Summary:** Acquire a defunct institution's domain; inherit its publication trail.

**Bypass methods relevant to this measure:**

1. **"Reflected legitimacy from defunct entity's real publication trail"** — the defunct entity may have had NIH grants that are still in RePORTER.
   - **Classification: MISSED.** This is the key bypass. If the defunct institution had NIH grants in the last 5 years, the implementation would return those grants when searching for the institution's name. The attacker inherits the legitimacy signal. The check would show `nih_funding_historical_only` or even `nih_funding_active` if grants from the final years are within the window.
   - **Mitigation gap:** The implementation does not cross-check whether the institution is currently operational (e.g., whether the organization still has active employees, whether the grants have been terminated). It takes the presence of grant records at face value.

2. **"Dangling-DNS subdomain takeover"** — the attacker operates under a live institution's subdomain.
   - **Classification: MISSED (tangential).** The parent institution's NIH grants are in RePORTER. If the attacker claims the parent institution's name, the grants validate — but this is actually correct (the institution is real). The bypass is that the attacker isn't really affiliated with the institution. This is a M19 (individual legitimacy) problem, not a M18 problem.

**Net assessment:** The dormant-domain branch's primary strategy (inheriting a defunct institution's name) can inherit its NIH funding history. The check produces a false positive — it validates the institution as funded when the real institution is defunct. This is a moderate gap: the attacker must target a recently-defunct institution (grants within 5 years), narrowing the candidate pool.

---

### foreign-institution

**Summary:** Claim affiliation with a foreign institution.

**Bypass methods relevant to this measure:**

1. **Foreign institution exploitation** — foreign institutions are not in NIH RePORTER (with rare exceptions for foreign components of US grants).
   - **Classification: CAUGHT (expected negative).** `no_nih_funding_5yr` fires. The manual playbook correctly identifies "foreign" as an expected-negative category.

**Net assessment:** Correct identification, but low marginal signal because foreign institutions routinely lack NIH grants. The check adds essentially nothing for this branch.

---

### inbox-compromise

**Summary:** Compromise a real institutional inbox.

**Bypass methods relevant to this measure:**

1. **Real institutional inbox** — the attacker presents as affiliated with a real institution that likely has NIH grants.
   - **Classification: MISSED.** The real institution's NIH funding validates. The check produces a true positive for the institution — but the attacker is not truly affiliated. This is a M19 problem, not M18.

**Net assessment:** Zero additional signal. The check validates the real institution, which is correct at the institution level.

---

### credential-compromise

**Summary:** Compromise real institutional employee credentials.

**Bypass methods relevant to this measure:**

1. **Real institution's credentials** — same as inbox-compromise.
   - **Classification: MISSED (same reasoning).**

**Net assessment:** Zero additional signal.

---

### it-persona-manufacturing

**Summary:** IT admin creates a researcher persona at a real institution.

**Bypass methods relevant to this measure:**

1. **Real institution** — same reasoning.
   - **Classification: MISSED (institution is real).**

**Net assessment:** Zero additional signal. The institution is genuinely legitimate; the fraud is at the individual level.

---

## Findings

### Critical

*None.*

### Moderate

**M1. Dormant-domain branch inherits defunct institution's NIH funding history.**
- **Source:** dormant-domain, bypass "Reflected legitimacy from defunct entity's real publication trail."
- **Why missed:** RePORTER retains historical grant records. A defunct institution that had grants in the last 5 years still appears funded. The implementation does not check whether the institution is currently operational.
- **Suggestion:** Cross-reference the `project_end_date` of the most recent grant. If all grants ended >2 years ago and none are active, add a `nih_funding_all_expired` sub-flag. Also consider checking whether the organization's DUNS/UEI is still active (SAM.gov entity status). This is a parameter/logic refinement, not a re-research issue.

**M2. Name-collision fuzzy matching could produce false validation.**
- **Source:** shell-nonprofit, bypass "Name-collision reflected legitimacy."
- **Why ambiguous:** The implementation's fuzzy fallback for name normalization could inadvertently match a shell's deliberately adjacent name to a real institution's grants, making the shell appear funded.
- **Suggestion:** Tighten the fuzzy fallback to require exact or alias-table matches only, using the fuzzy path only to suggest alternatives for human review — not to auto-match.

### Minor

**m1. Soft-flag design means check is easily dismissed for legitimate-looking entities.**
- **Source:** biotech-incubator-tenant, cro-framing, community-bio-lab-network.
- **Why minor:** The `no_nih_funding_5yr` flag is correctly soft (many legitimate entities lack NIH grants), but this softness means the flag adds minimal friction for shell entities operating under cover types (CRO, startup, community lab) that reviewers expect to be NIH-unfunded.
- **Suggestion:** This is inherent to the check's design. The value is in the *positive* signal (presence of grants confirms legitimacy), not in the *negative* signal (absence of grants). No implementation change needed.

**m2. Foreign-affiliate subgrants spotty in RePORTER.**
- **Source:** foreign-institution.
- **Why minor:** The implementation already notes this in `failure_modes_requiring_review`. Foreign institutions that participate in NIH grants as subrecipients may not appear in RePORTER, producing false negatives. Already documented; no additional suggestion.

---

## bypass_methods_known

| Bypass method | Source story | Classification |
|---|---|---|
| Name-collision reflected legitimacy | shell-nonprofit | AMBIGUOUS |
| Build entity signals from scratch (no NIH grants) | shell-company | CAUGHT |
| Acquire existing company (may inherit grants) | shell-company | CAUGHT (partial) |
| Incubator tenant (no NIH grants) | biotech-incubator-tenant | CAUGHT |
| CRO façade (no NIH grants) | cro-framing | CAUGHT |
| Rotated CRO shells | cro-identity-rotation | CAUGHT |
| Community lab (no NIH grants) | community-bio-lab-network | CAUGHT |
| Gradual legitimacy accumulation | gradual-legitimacy-accumulation | CAUGHT |
| Reflected legitimacy from defunct entity | dormant-domain | MISSED |
| Dangling-DNS subdomain takeover | dormant-domain | MISSED |
| Foreign institution | foreign-institution | CAUGHT (expected negative) |
| Real institutional inbox | inbox-compromise | MISSED (institution is real) |
| Credential compromise at real institution | credential-compromise | MISSED (institution is real) |
| IT persona at real institution | it-persona-manufacturing | MISSED (institution is real) |

## bypass_methods_uncovered

| Bypass method | Source story | Why uncovered |
|---|---|---|
| Reflected legitimacy from defunct entity | dormant-domain | Defunct institution's grants still in RePORTER; no operational-status check |
| Name-collision (if fuzzy match is loose) | shell-nonprofit | Fuzzy fallback might bleed real institution's grants into result |
| Real-institution branches (inbox, credential, IT persona) | inbox-compromise, credential-compromise, it-persona-manufacturing | Check validates institution not individual; these branches exploit real institutions |

---

## Verdict: **PASS**

No Critical findings. The moderate findings concern edge cases (dormant-domain inheritance, fuzzy-match bleed) that are addressable via parameter tuning and do not require re-research. The check's primary value — positive evidence that an institution has NIH funding — is sound and correctly designed as a soft signal that combines with other M18 checks.
