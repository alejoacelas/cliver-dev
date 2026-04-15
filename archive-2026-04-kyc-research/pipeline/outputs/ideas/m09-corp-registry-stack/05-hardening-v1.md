# m09-corp-registry-stack — bypass-aware hardening v1

- **measure:** M09 — institution-real-life-sciences
- **name:** Companies House / SEC EDGAR / OpenCorporates / foreign registry stack
- **idea file:** `04-implementation-v1.md`

---

## Attacker story walk-through

### 1. shell-company

**Summary:** Purpose-built Delaware LLC, builds entity signals from scratch over 6–12 months, or acquires an existing company.

**Bypass methods relevant to this measure:**

- **Build entity signals from scratch (Bypass 1):** The attacker incorporates a real Delaware LLC, gets an EIN and DUNS. The entity will appear in OpenCorporates (Delaware filings are well-covered). It will have an active status, a recent incorporation date, and a SIC code chosen by the attacker at filing.
  - **Classification: CAUGHT (partially).** The check would find the record and fire `registry_recent_incorp` (< 12 months). However, the attacker can choose a life-sciences SIC code at filing (e.g., NAICS 5417 "Scientific Research and Development"), so `sic_not_life_sciences` would NOT fire. The implementation notes that "cluster of recent-incorp + new domain + no PubMed footprint is the shell-company pattern" — so the `registry_recent_incorp` flag is useful only in combination with other M09 signals.
  - After 12 months, the `registry_recent_incorp` flag no longer fires. The entity looks like a normal small biotech in the registry.
  - **Net: CAUGHT for the first 12 months only, and only as a contributing signal, not a blocking one.**

- **Acquire an existing company (Bypass 2):**
  - **(a) Dormant micro-CRO:** The acquired entity has an aged registration, bypassing `registry_recent_incorp`. Status is active (the attacker reactivates it if needed). SIC code may already be life-sciences or can be updated.
    - **Classification: MISSED.** All registry signals are clean: aged, active, possibly life-sciences SIC. The check passes the attacker.
  - **(b) Going-concern with live provider accounts:** Same as (a) but even cleaner — active entity with established business history.
    - **Classification: MISSED.** The check validates the attacker.

**Net assessment:** The check catches shell-company Bypass 1 for the first year as a weak contributing signal (`registry_recent_incorp`). After 12 months, or for acquired entities, the check provides positive validation to the attacker. Moderate friction overall.

---

### 2. shell-nonprofit

**Summary:** Research nonprofit shell with name near-collision, thin website, preprints, ORCID, and a real DE/WY/NM LLC or 501(c)(3).

**Bypass methods relevant to this measure:**

- **Name-collision reflected legitimacy:** The attacker's entity has its own real corporate registry record. The name-collision trick targets human reviewers and search engines, not the registry lookup itself. The corp-registry check would find the attacker's *own* entity, not the real institution's record.
  - **Classification: CAUGHT (partially).** The check correctly returns the attacker's own entity. If recently incorporated, `registry_recent_incorp` fires. However, the check does not detect that the name is a deliberate near-collision with another entity.

- **Real-entity registration with virtual-office shipping:** Files a DE/WY/NM LLC ($50–$110 filing), obtains EIN, rents virtual office. The registered address will be a registered-agent address (required for DE/WY/NM LLCs).
  - **Classification: CAUGHT (partially).** The check finds the record. `registry_recent_incorp` fires if < 12 months. The implementation notes "US LLCs registered in pass-through states (Delaware, Wyoming, New Mexico) where the registered office is a registered-agent address — hard to distinguish from the shell pattern at this layer." The SIC code can be set to life-sciences by the attacker.

- **Thin-but-checkable website, seed principal's footprint (preprints/ORCID):** Not relevant to registry check.

**Net assessment:** Weak friction via `registry_recent_incorp` for the first year. The pass-through-state registered-agent address is noted as a known weakness. After aging, the check passes the attacker.

---

### 3. cro-framing

**Summary:** Real US LLC as a small CRO. Designed to neutralize entity-signal checks.

**Bypass methods relevant to this measure:**

- **Real LLC + virtual office in biotech metro:** Wyoming LLC ($100 + $150–$300/yr agent) or Delaware. Real filing, real EIN, real registered office.
  - **Classification: CAUGHT (partially).** `registry_recent_incorp` fires if < 12 months. SIC code can be set to "Scientific Research and Development" (NAICS 5417) or "Testing Laboratories" (NAICS 5413), so `sic_not_life_sciences` would not fire.

- **CRO services-page cover story, LinkedIn personas, ORCID, Crunchbase, aged domain, predatory-journal seeding, no-publication strategy:** Not relevant to registry check.

**Net assessment:** Same as shell-company: weak `registry_recent_incorp` signal for first year, then clean. The CRO framing is irrelevant to the registry check specifically — it's the combination with other M09 signals that matters.

---

### 4. cro-identity-rotation

**Summary:** 2–4 CRO LLCs, each at a different provider subset.

**Bypass methods relevant to this measure:**

- **Real LLC + virtual office (per entity):** Each entity is a separately filed LLC with its own registry record. Each fires `registry_recent_incorp` independently for the first year.
  - **Classification: CAUGHT (partially).** Same per-entity signal as cro-framing. The rotation aspect (multiple entities) is invisible at the registry level because "no shared organization registry exists across synthesis providers."

- **CRO cover-story neutralization, synthetic web/persona depth, fake client lists, Crunchbase seeding, conference badges:** Not relevant to registry check.

**Net assessment:** Per-entity friction same as cro-framing. The cross-entity rotation pattern is invisible to this check. No worse, no better.

---

### 5. biotech-incubator-tenant

**Summary:** LLC leases bench space at a biotech incubator.

**Bypass methods relevant to this measure:**

- **Bench-space lease at recognized biotech incubator:** The LLC is a real filing. Registered office may be the incubator address (not a registered-agent address, but a real commercial address in a biotech building).
  - **Classification: CAUGHT (partially).** `registry_recent_incorp` fires if < 12 months. The incubator address passes the address-quality signals (it's a real commercial address, not a CMRA). SIC can be set to life-sciences.

- **Buy an aged dormant biotech LLC:** Inherits aged registration.
  - **Classification: MISSED.** Aged registration, active status, possibly life-sciences SIC. The check validates the attacker.

- **Reflected legitimacy, light order history, real preprint output:** Not relevant to registry check.

**Net assessment:** Same `registry_recent_incorp` pattern. The incubator address is actually *better* than a registered-agent address from the attacker's perspective because it looks more legitimate.

---

### 6. gradual-legitimacy-accumulation

**Summary:** Real-but-hollow small biotech operated for 6–12 months before controlled-sequence orders.

**Bypass methods relevant to this measure:**

- **Time-aged domain and clean order history (Method 1):** The LLC is filed early. After 12 months, `registry_recent_incorp` no longer fires.
  - **Classification: MISSED.** The entire branch strategy is to wait out the aging window. After 12 months, the registry check produces a clean pass.

- **Aged domain auction purchase (compression variant):** Domain aging, not entity aging — but the entity can also be filed early.
  - **Classification: MISSED** if entity is pre-aged alongside domain.

- **All other methods (ORCID, pay-to-publish, bioRxiv, conference, Crunchbase, SBIR):** Not relevant to registry check.

- **Virtual office in biotech metro, incubator bench:** The registered address is either a virtual office or incubator. Both pass the registry check.
  - **Classification: MISSED** — once aged, fully clean.

**Net assessment:** Zero friction after the aging period. The branch is explicitly designed to wait out time-based gates.

---

### 7. community-bio-lab-network

**Summary:** Community biology labs as LLCs/nonprofits in underserved metros.

**Bypass methods relevant to this measure:**

- **Real LLC + maker space address:** New Mexico LLC ($50, no annual report) or Wyoming. Files under a maker-space address.
  - **Classification: CAUGHT (partially).** `registry_recent_incorp` fires if < 12 months. The SIC code will likely be generic ("other professional/scientific activities") which may trigger `sic_not_life_sciences` depending on how the SIC range is defined. However, the implementation notes that "small biotechs frequently file under generic codes" making this flag noisy.

- **Minimal community-bio web presence, DIYbio.org listing, citizen-science platforms:** Not relevant to registry check.

**Net assessment:** Weak friction. `registry_recent_incorp` for the first year. The SIC signal is noisy. After aging, the check passes the attacker. The community-bio customer class is structurally hard to distinguish from legitimate community labs.

---

### 8. dormant-domain

**Summary:** Acquires lapsed domain of a defunct research entity.

**Bypass methods relevant to this measure:**

- **Acquire the lapsed canonical domain:** The attacker may or may not file a new LLC. If operating under the defunct entity's name without incorporating, the registry check would find the defunct entity's record.
  - **Classification: CAUGHT.** If the defunct entity's corporate registration shows status `dissolved` or `struck-off`, the check fires `registry_dissolved`. This is auto-block per the playbook. This is a meaningful catch.
  - **However:** The attacker could file a *new* entity with the same name (or near-collision name) in a different jurisdiction (e.g., new Wyoming LLC with the defunct institution's name). The check would find both records. The reviewer would need to disambiguate.
  - **Classification for new-entity variant: AMBIGUOUS.** Depends on whether the reviewer catches the discrepancy between a new LLC and the defunct entity's historical corporate record.

- **Self-register the revived lab:** Files a new entity. `registry_recent_incorp` fires.
  - **Classification: CAUGHT (partially).** Recent incorporation combined with a reanimated domain (caught by domain-auth-stack) is a strong composite signal.

**Net assessment:** Meaningful friction. `registry_dissolved` catches the direct-reuse path. `registry_recent_incorp` catches the re-file path. However, if the attacker files a new entity 12+ months before the SOC order, the aging window closes.

---

### 9. foreign-institution

**Summary:** Exploits verification gaps at mid-tier non-Anglophone institutions.

**Bypass methods relevant to this measure:**

- **Author-name ambiguity, coverage-gap reliance, fabricated ORCID/Scholar, ride institution's generic footprint:** The attacker claims affiliation with a real foreign institution. The institution has a real corporate/government registration in its home country.
  - **Classification: CAUGHT (partially).** If the provider queries OpenCorporates for the foreign institution, it may find a record (OpenCorporates covers 140+ jurisdictions). But: (a) OpenCorporates coverage of mid-tier non-Anglophone institutions (Brazilian, Indian, Indonesian, Vietnamese, CIS) varies; (b) the institution is *real*, so the check validates the attacker's claimed affiliation; (c) the check cannot determine whether the *individual* actually works there.
  - **Net: MISSED.** The check validates the real institution's existence, which is not in dispute. The exploit is at the *affiliation verification* layer (does this person work there?), not the *entity existence* layer.

**Net assessment:** Zero friction. The institution exists in registries. The attacker's exploit is at the individual-affiliation level, outside this check's scope.

---

## Findings

### Finding 1 — Moderate: `registry_recent_incorp` window is time-bounded and non-blocking

- **Source:** shell-company (Bypass 1), shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network
- **Why partially missed:** The `registry_recent_incorp` flag fires only for entities incorporated < 12 months. The shell-company, cro-framing, and gradual-legitimacy-accumulation branches explicitly plan for 6–12 month lead-up times. After the aging window closes, the flag no longer fires. Furthermore, the flag is non-blocking ("combine with other M09 signals"), so even during the window it only contributes to a composite score.
- **Suggestion:** Consider a longer window (e.g., 24 months) and a graduated scoring approach (higher suspicion at 0–6 months, moderate at 6–18, low at 18–36). This would not close the gap but would extend the friction period. However, this increases false positives on real new biotechs.

### Finding 2 — Moderate: SIC/NAICS codes are attacker-controlled at filing

- **Source:** shell-company, cro-framing, cro-identity-rotation, shell-nonprofit
- **Why missed:** The attacker chooses the SIC/NAICS code when filing the LLC. Filing "Scientific Research and Development" (NAICS 5417) or "Testing Laboratories" (NAICS 5413) defeats the `sic_not_life_sciences` flag entirely. The implementation acknowledges that "small biotechs frequently file under generic codes" making the flag noisy, but does not address the converse: attackers can *choose* life-sciences codes at filing with zero verification.
- **Suggestion:** The SIC/NAICS flag is useful only as a *negative* signal (non-life-sciences codes add suspicion) but not as a *positive* signal (life-sciences codes should not be treated as evidence of actual life-sciences work). Stage 4 could clarify this asymmetric treatment.

### Finding 3 — Moderate: Entity acquisition bypasses all time-based signals

- **Source:** shell-company (Bypass 2), biotech-incubator-tenant (buy aged dormant LLC)
- **Why missed:** Acquiring a dormant or going-concern entity inherits aged incorporation, potentially life-sciences SIC, and active status. The check returns a fully clean pass. The implementation does not flag *ownership changes* or *officer turnover* (which would signal a recent acquisition).
- **Suggestion:** For Companies House, officer-change events are visible via the `/company/{number}/officers` endpoint (appointed_on/resigned_on dates). A recent wholesale officer turnover combined with an old entity could be flagged. OpenCorporates also returns officer data. This would require a new flag like `registry_officer_turnover_recent`. However, this data is not available for all jurisdictions (US Secretary of State filings often don't include officers for LLCs).

### Finding 4 — Minor: OpenCorporates coverage gaps for non-Anglophone institutions

- **Source:** foreign-institution
- **Why missed:** OpenCorporates covers 140+ jurisdictions but with "varying completeness." Mid-tier non-Anglophone institutions (the foreign-institution attacker's target) may not be well-covered. The check returns `registry_no_record` for a real institution, creating a false negative.
- **Suggestion:** Accept this as a known coverage gap and document the fallback (reviewer manually checks the national registry web search, as the playbook already specifies).

### Finding 5 — Minor: Pass-through state registered-agent addresses are indistinguishable

- **Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation
- **Why missed:** The implementation notes this explicitly: "US LLCs registered in pass-through states (Delaware, Wyoming, New Mexico) where the registered office is a registered-agent address — hard to distinguish from the shell pattern at this layer." This is a known limitation deferred to the registered-agent-denylist idea.
- **Suggestion:** No change needed — this is correctly deferred to a companion idea.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Build entity signals (real LLC, life-sciences SIC) | shell-company | CAUGHT (partially — `registry_recent_incorp` for 12 months only) |
| Acquire dormant micro-CRO | shell-company | MISSED |
| Acquire going-concern | shell-company | MISSED |
| Name-collision entity with real registration | shell-nonprofit | CAUGHT (partially — `registry_recent_incorp`) |
| Real LLC in pass-through state | shell-nonprofit | CAUGHT (partially — `registry_recent_incorp`) |
| Real LLC + CRO cover story | cro-framing | CAUGHT (partially — `registry_recent_incorp`) |
| Real LLC per entity (rotation) | cro-identity-rotation | CAUGHT (partially — `registry_recent_incorp` per entity) |
| Incubator tenant LLC | biotech-incubator-tenant | CAUGHT (partially — `registry_recent_incorp`) |
| Buy aged dormant biotech LLC | biotech-incubator-tenant | MISSED |
| Time-aged entity (12+ months) | gradual-legitimacy-accumulation | MISSED |
| Community-bio LLC | community-bio-lab-network | CAUGHT (partially — `registry_recent_incorp`) |
| Defunct entity — direct reuse of dissolved record | dormant-domain | CAUGHT (`registry_dissolved`) |
| Defunct entity — refile as new entity | dormant-domain | CAUGHT (partially — `registry_recent_incorp`) |
| Real foreign institution | foreign-institution | MISSED (check validates the real institution) |

## bypass_methods_uncovered

| Bypass | Story | Why uncovered |
|---|---|---|
| Acquire dormant/going-concern entity | shell-company, biotech-incubator-tenant | Inherited aged registration passes all checks |
| Time-aged entity (12+ months) | gradual-legitimacy-accumulation | Wait out the `registry_recent_incorp` window |
| Attacker-selected SIC/NAICS code | shell-company, cro-framing, cro-identity-rotation | SIC is self-reported at filing, no verification |
| Real foreign institution affiliation | foreign-institution | Check validates entity existence, not individual affiliation |
| Officer turnover after acquisition | shell-company (Bypass 2) | No officer-change detection implemented |

---

## Verdict: **PASS**

No Critical findings. The check provides meaningful (if time-bounded) friction for newly filed entities and a strong signal for dissolved entities. The moderate findings — SIC attacker-controllability, entity-acquisition bypass, and time-window expiry — are real but either (a) already acknowledged in the implementation, (b) partially addressable by companion ideas, or (c) addressable with minor refinements in a future stage-4 iteration. Pipeline continues to stage 6.
