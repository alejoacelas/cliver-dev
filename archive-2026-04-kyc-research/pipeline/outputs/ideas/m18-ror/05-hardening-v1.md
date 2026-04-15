# m18-ror — bypass-aware hardening v1

- **measure:** M18 — institution-legitimacy-soc
- **name:** ROR Research Organization Registry
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walk

### shell-nonprofit

**Summary:** Fake research nonprofit, name collision, own domain, entity signals, optionally ROR self-listed.

**Bypass methods relevant to this measure:**

1. **"ROR self-listing (persistence variant)"** — shell submits a curation request to ROR after seeding preprints.
   - **Classification: CAUGHT.** The implementation explicitly checks for this via `ror_recent` (record created within 6 months) and `ror_self_listed` (zero relationships, zero external IDs other than ROR's own, ≤1 domains, single name). Both flags would fire for a newly self-listed shell. The reviewer playbook instructs pulling the curation request from ROR's GitHub issues queue to see provenance.
   - **Residual risk:** If the shell waits >6 months after ROR listing before placing a SOC order, `ror_recent` no longer fires. But `ror_self_listed` would still fire because the structural metadata signals (no relationships, no cross-IDs) persist.

2. **"Name-collision reflected legitimacy"** — shell name near-collides with a real institution.
   - **Classification: CAUGHT (partial).** The affiliation-match endpoint returns scored matches. If the shell's name is close to a real institution, both records might appear in results. The `ror_match_low_confidence` flag would fire if the top match is ambiguous between the shell and the real institution. However, if the shell succeeds in getting its own ROR record, the match to that record might score higher (exact match) than the real institution, and the `ror_self_listed` check then becomes the defense line.
   - **Edge case:** If the shell has NOT gotten ROR-listed, `ror_no_match` fires — correctly identifying the shell as unregistered. If it matches the real institution by name proximity, the match would be to the real institution (a false positive), but this is hard to exploit because the reviewer would see that the matched ROR ID's metadata (domain, location, established year) doesn't match the customer's claimed details.

3. **"Thin-but-checkable website" / "Fiscal sponsorship" / "Preprint seeding"** — these construct entity signals outside ROR.
   - **Classification: N/A** for the ROR check itself. The check operates on ROR data only.

**Net assessment:** The check provides strong signal against shell-nonprofit. If the shell is not in ROR, `ror_no_match` fires. If the shell self-lists, `ror_recent` + `ror_self_listed` fire. The implementation's red-flag feature design directly addresses this attacker's strategy.

---

### shell-company

**Summary:** Build a Delaware LLC into a realistic small biotech.

1. **"Build entity signals from scratch"** — new LLC unlikely to be in ROR. ROR covers research organizations; a new biotech LLC would need to go through the curation process.
   - **Classification: CAUGHT.** `ror_no_match` fires for most new biotech LLCs. If the entity eventually gets ROR-listed, `ror_recent` + `ror_self_listed` would fire.

2. **"Acquire an existing company"** — acquiring a real biotech entity.
   - **Classification: AMBIGUOUS.** If the acquired entity is in ROR (rare for small CROs/biotechs), the match would be a true positive. If not, `ror_no_match` fires. The ambiguity is whether the acquired entity's ROR record (if any) would show stale metadata after the ownership change.
   - **Detail needed:** ROR does not track ownership changes — there is no "last verified" concept.

**Net assessment:** Good signal against new shells. The soft flag is appropriate because many legitimate biotech startups are not in ROR.

---

### biotech-incubator-tenant

1. **Incubator tenant under own LLC** — LLC unlikely in ROR.
   - **Classification: CAUGHT.** `ror_no_match` fires. But the incubator itself is likely in ROR, and the customer might claim the incubator as their institution rather than the LLC.
   - **Risk:** If the customer lists the incubator (e.g., "LabCentral") as their institution and is indeed a tenant, the ROR match would be to the incubator — a true positive at the institution level. The fraud is that the customer's LLC is not truly the incubator, but this is a M19/tenant-verification problem, not an institution-existence problem.

**Net assessment:** Check fires correctly for the LLC. The incubator name-borrowing variant is a legitimate edge case that other checks must address.

---

### cro-framing / cro-identity-rotation

1. **CRO shells** — most small CROs are not in ROR.
   - **Classification: CAUGHT.** `ror_no_match` fires. Large real CROs (WuXi, Covance) would match, but the shell is a small fake CRO.

**Net assessment:** Correct identification.

---

### community-bio-lab-network

1. **Community lab** — some established community labs (Genspace) may be in ROR; most are not.
   - **Classification: CAUGHT (mostly).** `ror_no_match` fires for most community labs. If a well-known community lab is in ROR, the match is a true positive.

**Net assessment:** Correct identification for the vast majority.

---

### gradual-legitimacy-accumulation

1. **Patient entity-building** — the entity may eventually get into ROR after 12–24 months of preprint seeding.
   - **Classification: CAUGHT (during buildup).** `ror_no_match` fires during the buildup phase. Once the entity is in ROR, `ror_recent` fires for the first 6 months. After that, `ror_self_listed` would fire if the entity's metadata is thin.
   - **Long-term risk:** After 2+ years, the entity could accumulate enough cross-references (GRID, ISNI, Wikidata from preprint/DOI infrastructure) that `ror_self_listed` no longer fires.

**Net assessment:** Good signal during buildup. Degrades over time as the entity accumulates real metadata — but at that point, the entity has invested significantly in constructing legitimacy, raising the cost of the attack.

---

### dormant-domain

1. **"Acquire lapsed canonical domain"** — the defunct institution may still be in ROR.
   - **Classification: MISSED (partial).** If the defunct institution is in ROR with `status: active` (ROR may not have been updated to mark it inactive), the attacker claiming that institution's name would get a valid ROR match. The implementation checks `ror_inactive` but only if the status field is correctly set.
   - **Mitigation gap:** ROR's curation process may lag institutional closures by months or years. The `admin.last_modified.date` might reveal staleness, but the implementation does not check for it.

2. **"Dangling-DNS subdomain takeover"** — parent institution is in ROR and active.
   - **Classification: MISSED (M19 problem).** The parent institution's ROR record is valid. The fraud is at the individual affiliation level, not the institution level.

3. **"Typosquat / lookalike fallback"** — near-collision with a real institution.
   - **Classification: CAUGHT.** `ror_no_match` fires (the typosquat entity would not be in ROR). Or if the affiliation match returns the real institution as a near-miss, the reviewer would see the mismatch.

**Net assessment:** The dormant-domain branch's primary strategy (claiming a defunct institution's identity) partially evades the check if ROR hasn't updated the status. The typosquat fallback is caught.

---

### foreign-institution

1. **"Foreign institution exploitation"** — institution may be real-but-misrepresented or wholly fabricated.
   - **Classification: CAUGHT (for fabricated institutions in underrepresented regions).** `ror_no_match` fires. But this is a weak signal because many legitimate foreign institutions in underrepresented regions are also absent from ROR.
   - **Classification: MISSED (for real foreign institutions that are misrepresented).** The real institution is in ROR; the match is valid at the M18 level. The misrepresentation is at the M19 (individual) level.

**Net assessment:** The check catches fabricated foreign institutions (no ROR match) but with high false-negative noise in underrepresented regions. Real-but-misrepresented institutions pass because the institution itself is legitimate.

---

### inbox-compromise / credential-compromise / it-persona-manufacturing

1. **Real institution** — the institution is in ROR and legitimate.
   - **Classification: MISSED (institution is real).** Correct at M18 level; fraud is at M19.

**Net assessment:** Zero additional signal. Expected — these branches attack the individual layer, not the institution layer.

---

## Findings

### Critical

*None.*

### Moderate

**M1. ROR status field may lag institutional closures, allowing dormant-domain attackers to match a "still-active" defunct institution.**
- **Source:** dormant-domain.
- **Why missed:** ROR's curation process relies on community submissions to mark institutions inactive. A defunct institution could remain `active` in ROR for months or years.
- **Suggestion:** Add a `ror_stale_record` flag if `admin.last_modified.date` is >2 years old and the institution type is `Nonprofit` or `Other` (types more likely to go defunct without notice). Also consider cross-referencing with the institution's domain WHOIS status — a domain that has lapsed while the ROR record is still active is a strong signal.

**M2. Long-term legitimacy accumulation can eventually clear all red-flag features.**
- **Source:** gradual-legitimacy-accumulation.
- **Why moderate:** After 2+ years and successful cross-referencing (GRID, ISNI, Wikidata), the shell's ROR record would no longer trigger `ror_recent` or `ror_self_listed`. At that point, the only signal is from other M18 checks (funding databases, etc.).
- **Suggestion:** This is partially structural — any registry-based check can be gamed with enough time and investment. The check correctly raises the cost and lead time. The multi-check architecture (ROR + NIH + NSF + CORDIS) provides defense in depth.

### Minor

**m1. Affiliation-match score threshold not pinned.**
- **Source:** Implementation says 0.8 is a "best guess."
- **Why minor:** The threshold determines the boundary between `ror_no_match` and a match. Too low = false matches; too high = false negatives. The implementation should pin this based on testing against known institutions.
- **Suggestion:** Calibrate the threshold against a test set of known-good and known-bad institution names. Document the chosen threshold and its error rates.

**m2. ROR coverage gap in non-Anglophone, non-EU regions.**
- **Source:** foreign-institution, implementation's `failure_modes_requiring_review`.
- **Why minor:** Already documented. The check cannot verify institutions in regions where ROR has sparse coverage.
- **Suggestion:** No implementation fix — structural limitation. Document for stage 8.

---

## bypass_methods_known

| Bypass method | Source story | Classification |
|---|---|---|
| ROR self-listing | shell-nonprofit | CAUGHT |
| Name-collision reflected legitimacy | shell-nonprofit | CAUGHT (partial) |
| Build entity signals from scratch | shell-company | CAUGHT |
| Acquire existing company | shell-company | AMBIGUOUS |
| Incubator tenant (own LLC) | biotech-incubator-tenant | CAUGHT |
| CRO façade | cro-framing | CAUGHT |
| Rotated CRO shells | cro-identity-rotation | CAUGHT |
| Community lab | community-bio-lab-network | CAUGHT |
| Gradual legitimacy accumulation | gradual-legitimacy-accumulation | CAUGHT (degrades over time) |
| Acquire lapsed canonical domain | dormant-domain | MISSED (partial — depends on ROR status) |
| Dangling-DNS subdomain takeover | dormant-domain | MISSED (M19 problem) |
| Typosquat / lookalike | dormant-domain | CAUGHT |
| Foreign institution (fabricated) | foreign-institution | CAUGHT |
| Foreign institution (real, misrepresented) | foreign-institution | MISSED (institution is real) |
| Real institutional inbox | inbox-compromise | MISSED (institution is real) |
| Credential compromise | credential-compromise | MISSED (institution is real) |
| IT persona | it-persona-manufacturing | MISSED (institution is real) |

## bypass_methods_uncovered

| Bypass method | Source story | Why uncovered |
|---|---|---|
| Acquire lapsed canonical domain | dormant-domain | ROR status may not reflect institutional closure |
| Long-term legitimacy accumulation (>2y) | gradual-legitimacy-accumulation | Red-flag features clear as entity accumulates metadata |
| Real-institution branches | inbox-compromise, credential-compromise, it-persona-manufacturing | Check validates institution not individual |

---

## Verdict: **PASS**

No Critical findings. The implementation directly addresses the key M18 attacker strategy (self-listing fabricated organizations) with well-designed red-flag features. Moderate findings concern edge cases (ROR status lag for defunct institutions, long-term legitimacy accumulation) that are partially structural and partially addressable via parameter additions. No re-research needed.
