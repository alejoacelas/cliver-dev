# m18-nsf-awards — bypass-aware hardening v1

- **measure:** M18 — institution-legitimacy-soc
- **name:** NSF + UKRI + ERC/CORDIS funded-institution signal
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walk

### shell-nonprofit

**Summary:** Fake research nonprofit with name collision, own domain, entity signals, optionally ROR-listed.

**Bypass methods relevant to this measure:**

1. **"Name-collision reflected legitimacy"** — shell's name near-collides with a real funded institution.
   - **Classification: AMBIGUOUS.** Same issue as m18-nih-reporter. If the name-normalization / fuzzy-matching logic is loose, the real institution's NSF/UKRI/CORDIS grants could bleed into the shell's result. If tight, the shell is correctly flagged as unfunded.
   - **Detail needed:** Fuzzy-match threshold and whether partial-token matching is used in CORDIS `participants` substring lookups.

2. **All other shell-nonprofit construction methods** (domain, website, preprints, fiscal sponsorship) — not relevant to this check.
   - **Classification: N/A.**

**Net assessment:** The check correctly flags the shell as lacking funding across NSF/UKRI/CORDIS. Name-collision edge case is ambiguous. `no_funder_record_5yr` fires correctly for the shell.

---

### shell-company

**Summary:** Build a Delaware LLC into a realistic small biotech.

1. **"Build entity signals from scratch"** — no funder grants.
   - **Classification: CAUGHT.** `no_funder_record_5yr` fires. Shell is correctly identified as unfunded.

2. **"Acquire an existing company"** — if the acquired entity had SBIR/STTR or UKRI Innovate UK funding.
   - **Classification: CAUGHT (partial).** Same logic as m18-nih-reporter: if the acquired entity had real grants, those are true positives.

**Net assessment:** Correct identification. The soft flag is appropriate because many legitimate biotech startups also lack public-funder records.

---

### biotech-incubator-tenant

1. **Incubator tenant under own LLC** — no public-funder grants.
   - **Classification: CAUGHT.** Flag fires. Soft signal because startups at incubators routinely lack grants.

**Net assessment:** Low marginal signal over what the incubator address already provides.

---

### cro-framing / cro-identity-rotation

1. **CRO shells** — CROs rarely have direct NSF/UKRI/CORDIS grants.
   - **Classification: CAUGHT.** Flag fires. Reviewer correctly categorizes as expected negative.

**Net assessment:** Correct but low marginal signal.

---

### community-bio-lab-network

1. **Community lab** — rarely in NSF/UKRI/CORDIS databases.
   - **Classification: CAUGHT.** Flag fires. Some US community labs may have NSF informal-education or broadening-participation awards, which would be a true positive.

**Net assessment:** Correct identification.

---

### gradual-legitimacy-accumulation

1. **Patient entity-building** — no funder grants during buildup phase.
   - **Classification: CAUGHT.** Flag fires throughout the buildup period. The entity can only clear it by obtaining real grants.

**Net assessment:** Good temporal signal.

---

### dormant-domain

1. **"Reflected legitimacy from defunct entity"** — the defunct institution may have had NSF/UKRI/CORDIS grants in the last 5 years.
   - **Classification: MISSED.** Same gap as m18-nih-reporter. Historical grants for the defunct institution still appear in the funder databases. The attacker inherits the funded-institution signal.
   - **Mitigation gap:** No check for whether grants are all expired with no active projects.

2. **"Typosquat / lookalike fallback"** — not relevant to funder-record checks.
   - **Classification: N/A.**

**Net assessment:** The dormant-domain branch inherits the defunct institution's funding history across all three funders. Moderate gap, same as m18-nih-reporter.

---

### foreign-institution

1. **Foreign institution exploitation** — coverage depends on geography.
   - **Classification: CAUGHT for UK/EU institutions** (UKRI and CORDIS provide signal). **MISSED for non-US/UK/EU institutions** (Asian, LatAm, African funders are not covered).
   - The implementation correctly documents this as a coverage gap in `failure_modes_requiring_review`.

**Net assessment:** Valuable for UK/EU-affiliated foreign institution claims; zero signal for Global South/Asia. The check extends m18-nih-reporter's US coverage to UK/EU, closing a geographic gap for two major research regions.

---

### inbox-compromise / credential-compromise / it-persona-manufacturing

1. **Real institution** — attacker operates under a real institution that likely has funder records.
   - **Classification: MISSED (institution is real).** The check validates the institution, which is correct at the M18 level. The fraud is at the individual level (M19).

**Net assessment:** Zero additional signal against these branches. Correct behavior — M18 checks institution, not individual.

---

## Findings

### Critical

*None.*

### Moderate

**M1. Dormant-domain branch inherits defunct institution's funding history across all three funders.**
- **Source:** dormant-domain.
- **Why missed:** Historical grants persist in NSF, UKRI, and CORDIS databases. No operational-status cross-check.
- **Suggestion:** Same as m18-nih-reporter: check whether the most recent grants are all expired (end date >2 years ago, no active status). Add a `funder_record_all_expired` sub-flag.

**M2. CORDIS participants substring matching produces false matches.**
- **Source:** Implementation's `failure_modes_requiring_review` already notes this; confirmed here.
- **Why moderate:** A shell whose name shares tokens with a real funded participant (e.g., "European Institute of Technology" matching against multiple legitimate "Institute of Technology" entries) could receive a false validation.
- **Suggestion:** Use exact-match or alias-table-only matching for CORDIS, not substring. Already partially addressed in the implementation document ("exact + alias lookup rather than substring").

**M3. Non-US/UK/EU coverage gap leaves Asian, LatAm, African institution claims unverifiable.**
- **Source:** foreign-institution.
- **Why moderate:** The three funders cover US, UK, and EU. Institutions in Japan, Brazil, India, China, etc. have no equivalent funder database queried here. This is a structural limitation of the available open data.
- **Suggestion:** No implementation fix available — the open funder-database landscape does not extend to these regions. The gap should be documented for stage 8 as a structural M18 coverage limitation.

### Minor

**m1. Name-collision fuzzy matching across three funder naming conventions.**
- **Source:** shell-nonprofit.
- **Why minor:** Each funder has different naming conventions (NSF uses `awardeeName`, UKRI uses `name`, CORDIS uses a delimited string). The name-normalization table must cover cross-funder alias variants. An error in normalization could either miss a real institution or bleed results from a near-collision.
- **Suggestion:** Specify the normalization table's source and update cadence. Consider seeding from ROR's cross-referenced `external_ids` (FundRef, which maps to NSF/NIH/UKRI funder IDs).

---

## bypass_methods_known

| Bypass method | Source story | Classification |
|---|---|---|
| Name-collision reflected legitimacy | shell-nonprofit | AMBIGUOUS |
| Build entity signals from scratch | shell-company | CAUGHT |
| Acquire existing company | shell-company | CAUGHT (partial) |
| Incubator tenant | biotech-incubator-tenant | CAUGHT |
| CRO façade | cro-framing | CAUGHT |
| Rotated CRO shells | cro-identity-rotation | CAUGHT |
| Community lab | community-bio-lab-network | CAUGHT |
| Gradual legitimacy accumulation | gradual-legitimacy-accumulation | CAUGHT |
| Reflected legitimacy from defunct entity | dormant-domain | MISSED |
| Foreign institution (UK/EU) | foreign-institution | CAUGHT |
| Foreign institution (non-US/UK/EU) | foreign-institution | MISSED |
| Real institutional inbox | inbox-compromise | MISSED (institution is real) |
| Credential compromise at real institution | credential-compromise | MISSED (institution is real) |
| IT persona at real institution | it-persona-manufacturing | MISSED (institution is real) |

## bypass_methods_uncovered

| Bypass method | Source story | Why uncovered |
|---|---|---|
| Reflected legitimacy from defunct entity | dormant-domain | Historical grants persist; no operational-status check |
| Foreign institution (non-US/UK/EU) | foreign-institution | No funder database coverage |
| Real-institution branches | inbox-compromise, credential-compromise, it-persona-manufacturing | Check validates institution not individual |

---

## Verdict: **PASS**

No Critical findings. The moderate findings (defunct institution inheritance, CORDIS substring matching, geographic coverage gaps) are consistent with known limitations of funder-database-based checks and are addressable via parameter tuning or documented as structural. No re-research needed.
