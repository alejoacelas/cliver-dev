# m18-companies-house-charity — bypass-aware hardening v1

- **measure:** M18 (institution-legitimacy-soc)
- **idea:** UK CH + Charity Commission + US SOS + IRS TEOS

---

## Attacker story walk

### 1. shell-nonprofit

**Summary:** Fake research nonprofit with name collision, constructed entity signals.

**Bypass methods relevant to this measure:**

- **Real-entity registration with virtual office.** Files a DE/WY/NM LLC or 501(c)(3).
  - **CAUGHT (partially).** The check confirms the entity *exists* — Companies House (if UK), OpenCorporates/SOS (if US), IRS TEOS (if 501(c)(3)). However, the entity is real. It has a valid registration, active status, and EIN. The check confirms legal existence, which the shell has constructed. The useful signals are secondary:
    - `registry_recently_incorporated` fires if the entity is new relative to claims of being an established institution. **CAUGHT** — a shell filed months ago claiming years of history is surfaced.
    - `registry_filing_overdue` fires if the shell hasn't filed required returns (CH accounts, confirmation statements). **CAUGHT** — shells often neglect filings.
    - Officers/PSC data: a single-officer entity at a mass-formation address is flagged for cross-shell analysis (routed to m18-cross-shell-graph). **CAUGHT** — the officer pattern is surfaced.
  - **MISSED.** The check confirms the entity is legally real — which it is. Legal existence is necessary but not sufficient for institutional legitimacy. The check does not verify the entity *does research* or has life-sciences relevance.

- **Name-collision reflected legitimacy.**
  - **CAUGHT (partially).** If the reviewer searches for the near-collision name in the registry, two similar entities may appear. The CH/SOS check can surface both and note the discrepancy. However, this depends on the reviewer doing a proactive name-similarity search, which is not part of the automated check flow — the implementation searches by exact or customer-provided company number. **AMBIGUOUS** — depends on reviewer behavior.

- **Fiscal sponsorship.**
  - **CAUGHT.** If the fiscal sponsor is a 501(c)(3), IRS TEOS confirms its legitimacy. But this confirms the sponsor, not the shell. The shell's own IRS TEOS entry (if it has one) shows its own tax-exempt status, which may be legitimate (newly granted) or absent (pending). **AMBIGUOUS**.

**Net assessment:** The check confirms legal existence (which the shell has) and provides secondary signals (recency, filing status, officer patterns) that are useful but not dispositive. The check is part of a multi-layered stack; alone it does not catch a well-constructed shell.

---

### 2. shell-company

**Summary:** Delaware LLC built into a plausible biotech, or acquired going concern.

**Bypass methods relevant to this measure:**

- **Build from scratch.** Real Delaware LLC, EIN, bank account.
  - **CAUGHT (partially).** Same as shell-nonprofit — the entity is legally real. Secondary signals:
    - `registry_recently_incorporated` fires. **CAUGHT.**
    - Officer data from CH (if UK) or OpenCorporates (if US): a single-officer LLC at a registered agent's address. **CAUGHT** — surfaced for cross-shell analysis.
    - Delaware/Wyoming opacity: DE and WY do not require public officer disclosure. **MISSED** — the check cannot extract officer/PSC data from these states via OpenCorporates.

- **Acquire existing company.** Buy a dormant or going-concern entity.
  - **CAUGHT (partially).** The entity has an aged incorporation date (no `recently_incorporated` flag). However:
    - If the entity was dissolved and re-incorporated, the registry shows the gap. **CAUGHT.**
    - If the entity was never dissolved, the check shows a clean, active record. **MISSED** — ownership change is not visible in most SOS/CH records unless officer filings are updated, and OpenCorporates may be stale on officer data.

**Net assessment:** Moderate signal. Catches recently-incorporated shells and filing-status anomalies. Cannot catch well-constructed shells with aged registrations, especially in opaque states (DE, WY, NM).

---

### 3. biotech-incubator-tenant

**Summary:** LLC rents incubator bench space.

**Bypass methods relevant to this measure:**

- **Incubator residency.** The LLC is a real registered entity.
  - **CAUGHT (partially).** Same as shell-company build-from-scratch — the entity is legally real. `registry_recently_incorporated` may fire. Officer patterns may be surfaced.
  - The incubator's registered address may or may not match the LLC's registered address. If the LLC is registered in WY/DE but operates from a Boston incubator, the registered-address mismatch is not a standard flag in this implementation.

**Net assessment:** Weak signal. The entity is legally real; secondary signals are the same as for any small LLC.

---

### 4. cro-framing

**Summary:** CRO facade LLC.

**Bypass methods relevant to this measure:**

- **Real US LLC + virtual office.**
  - **CAUGHT (partially).** Same dynamics — entity is legally real. `registry_recently_incorporated` and officer patterns are surfaced. The CRO framing does not affect the registry check because the registry records entity type and status, not industry.

**Net assessment:** Same as shell-company build-from-scratch.

---

### 5. cro-identity-rotation

**Summary:** Multiple rotating CRO shells.

**Bypass methods relevant to this measure:**

- **Each rotated shell is a separate legal entity.**
  - **CAUGHT (partially).** Each new shell triggers `registry_recently_incorporated`. The series of recently-incorporated entities is visible to cross-shell analysis (m18-cross-shell-graph) but this check processes each entity individually and does not cross-reference. **MISSED** for the rotation pattern; **CAUGHT** for individual recency.

**Net assessment:** Partial — catches individual recency but not the rotation pattern.

---

### 6. community-bio-lab-network

**Summary:** Community biology lab as registered institution.

**Bypass methods relevant to this measure:**

- **Community lab as institutional cover.**
  - **CAUGHT.** If the community lab is a registered entity (many are 501(c)(3)s), the check confirms legal existence and tax-exempt status via TEOS. If the lab is unincorporated, `registry_no_record` fires, which is a useful signal.
  - **MISSED** for distinguishing a legitimate community lab from a malicious one — both have the same registry profile.

**Net assessment:** Confirms legal existence; cannot distinguish malicious from legitimate community labs.

---

### 7. gradual-legitimacy-accumulation

**Summary:** 12–24 months building entity track record.

**Bypass methods relevant to this measure:**

- **Accumulated entity signals.** Entity is aged, legally real, with filing history.
  - **MISSED.** By month 12–24, the entity has passed the `recently_incorporated` window, has filed required returns, and looks like a normal active company. The check provides no signal against a well-aged entity.

**Net assessment:** Zero signal after the entity ages past the recency threshold.

---

### 8. dormant-domain

**Summary:** Acquire expired domain of defunct research institution.

**Bypass methods relevant to this measure:**

- **Dormant domain provides aged history from defunct entity.**
  - **CAUGHT.** If the underlying legal entity was dissolved (e.g., the nonprofit's registration lapsed), the registry shows dissolved/struck-off status. `registry_dissolved` fires. This is a strong catch — the domain may be reanimated but the legal entity is dead.
  - **MISSED** if the legal entity was never incorporated (some research groups exist as divisions of larger institutions) or if the entity is in a jurisdiction outside the stack's coverage.

**Net assessment:** Strong catch when the defunct entity had a legal registration that shows as dissolved. This is the check's strongest use case.

---

### 9. foreign-institution

**Summary:** Claim affiliation with a foreign institution.

**Bypass methods relevant to this measure:**

- **Asymmetric verification gap.**
  - **MISSED.** The check covers UK (Companies House, Charity Commission) and US (SOS, TEOS). Foreign institutions outside these jurisdictions produce `registry_no_record`, which is also true for all legitimate non-US/UK entities. The check provides zero discriminatory signal for this story.

**Net assessment:** Zero signal for non-US/UK institutions.

---

### 10. inbox-compromise

**Summary:** Compromise real institutional inbox.

- **CAUGHT (vacuously).** The institution is real and legally registered. The check passes correctly. The bypass is at the identity layer.

**Net assessment:** No additional signal.

---

### 11. credential-compromise

**Summary:** Compromise real institutional employee's credentials.

- **CAUGHT (vacuously).** Same as inbox-compromise.

**Net assessment:** No additional signal.

---

### 12. it-persona-manufacturing

**Summary:** Manufacture persona at real institution.

- **CAUGHT (vacuously).** Same.

**Net assessment:** No additional signal.

---

## Findings

### Critical

None.

### Moderate

**M1: OpenCorporates staleness + Delaware/Wyoming opacity create a blind spot for the dominant shell-company formation jurisdictions.**

- **Source:** shell-company (build-from-scratch and acquire), cro-framing, cro-identity-rotation.
- **Why:** Delaware and Wyoming are the most popular US shell-formation jurisdictions and the most opaque (no public officer disclosure, minimal filing requirements). OpenCorporates' self-acknowledged data staleness means even the available fields may lag. The implementation correctly flags this but has no mitigation.
- **Suggestion:** For DE/WY entities, the implementation should escalate to a secondary KYB lookup (e.g., Middesk or Cobalt Intelligence, which do direct SOS pulls) and require the customer to provide officer names for independent verification. This adds cost but addresses the specific gap.

**M2: Foreign institution coverage is absent.**

- **Source:** foreign-institution.
- **Why:** The check covers US and UK only. Non-US/UK entities (a substantial fraction of synthesis customers) produce uninformative "no record" results.
- **Suggestion:** Add OpenCorporates' 140-jurisdiction coverage as a fallback for non-US/UK entities. OpenCorporates already covers non-US jurisdictions; the implementation's current framing restricts it to US SOS data only. This is a configuration change, not a new integration.

### Minor

**m1: `registry_recently_incorporated` threshold is not defined.**

- **Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation.
- **Detail:** The implementation throws this flag but does not define what "recently" means (6 months? 12 months? 24 months?). The threshold affects sensitivity: too short misses patient attackers; too long false-positives legitimate new entities.

**m2: IRS TEOS monthly lag may miss recently-revoked organizations.**

- **Source:** Implementation's own failure modes.
- **Detail:** The Automatic Revocation List is updated monthly. A shell nonprofit whose tax-exempt status was revoked in the last 30 days would not yet appear.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Real-entity registration (active LLC/501c3) | shell-nonprofit | CAUGHT (existence confirmed; secondary signals) |
| Name-collision reflected legitimacy | shell-nonprofit | AMBIGUOUS |
| Build from scratch (DE/WY LLC) | shell-company | CAUGHT (recency, officer patterns) |
| Acquire existing company | shell-company | CAUGHT (partially — dissolution gaps; MISSED for clean acquisitions) |
| Incubator residency (real LLC) | biotech-incubator-tenant | CAUGHT (recency) |
| CRO facade LLC | cro-framing | CAUGHT (recency, officer patterns) |
| Rotated shells | cro-identity-rotation | CAUGHT (individual recency; MISSED for rotation pattern) |
| Community lab registration | community-bio-lab-network | CAUGHT (legal existence) |
| Accumulated entity signals (aged entity) | gradual-legitimacy-accumulation | MISSED |
| Dormant domain (defunct entity dissolved) | dormant-domain | CAUGHT |
| Dormant domain (no legal entity) | dormant-domain | MISSED |
| Foreign institution | foreign-institution | MISSED |
| Inbox compromise (real institution) | inbox-compromise | CAUGHT (vacuous) |
| Credential compromise (real institution) | credential-compromise | CAUGHT (vacuous) |
| IT persona manufacturing | it-persona-manufacturing | CAUGHT (vacuous) |

## bypass_methods_uncovered

- Gradual-legitimacy-accumulation (aged entity past recency threshold)
- Dormant-domain (entity never had legal registration)
- Foreign institution (non-US/UK)
- Shell-company clean acquisition (no dissolution/officer change visible)
- Rotation pattern across multiple shells (individual entities caught but pattern missed)

---

## Verdict

**PASS** — No Critical findings. The check is correctly scoped as a legal-existence verification layer. It is strongest against dissolved/defunct entities (dormant-domain) and provides useful secondary signals (recency, filing status, officer patterns) for newly-formed shells. The two Moderate findings (DE/WY opacity; foreign coverage gap) are addressable in stage 4 re-research but are scope extensions rather than bugs. Pipeline continues to stage 6.
