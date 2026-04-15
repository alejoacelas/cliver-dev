# m17-igsc-shared-list — bypass-aware hardening v1

- **measure:** M17 (pre-approval-list)
- **idea:** IGSC shared customer list + member CRM rollup

---

## Attacker story walk

### 1. gradual-legitimacy-accumulation

**Summary:** Patient operator spends 6–12 months building a real LLC, placing small non-SOC orders, aging a domain, and accumulating a clean order history before attempting SOC.

**Bypass methods relevant to this measure:**

- **Method 1 — Time-aged domain and clean order history.** 12 months of clean non-SOC orders; by month 12 the provider shows a year of tenure and a clean record.
  - **MISSED.** The IGSC channel only surfaces customers flagged by *another* IGSC member. A net-new customer who has never been flagged by any member returns null from the IGSC channel. The internal CRM rollup shows a clean history — which is exactly what the attacker manufactured. There is no signal in the implementation that distinguishes "clean because legitimate" from "clean because the attacker carefully placed only non-SOC orders for 12 months." The `internal_prior_red_flag` and `internal_prior_yellow_unresolved` flags fire only on prior negative events; a manufactured-clean history produces none.

- **Method 2 — Aged domain auction purchase (compression variant).** Buys a 5+ year expired domain; compresses domain-age component but not order-history component.
  - **MISSED.** Same reasoning as Method 1 — the IGSC channel and internal CRM check order history and prior flags, not domain provenance.

**Net assessment:** The check provides zero signal against this story. The branch is specifically designed to produce a "clean history" that is exactly the signal this check rewards. The IGSC channel is null (no member has flagged them) and the internal CRM is clean-by-construction.

---

### 2. shell-company

**Summary:** Delaware LLC with real employees, professional website, preprints, lab bench, and 6–12 months of order-history building before SOC.

**Bypass methods relevant to this measure:**

- **Method 1 — Build entity signals from scratch.** Same order-history buildup as gradual-legitimacy-accumulation.
  - **MISSED.** Same reasoning — manufactured clean history is indistinguishable from legitimate clean history to this check.

- **Method 2 — Acquire an existing company.** Buy a going-concern with live provider accounts and order history.
  - **MISSED.** The acquired entity inherits its prior clean order history and any pre-approval status. The IGSC channel has no reason to have flagged it. The internal CRM shows the prior entity's clean record. The implementation does not check for entity ownership changes — company_number, officers, or beneficial ownership are not in the field set.

- **Gradual order escalation + protocol framing.** Orders non-concerning sequences for months, then introduces SOC framed within a defensible research narrative.
  - **MISSED.** Same as Method 1 — the escalation pattern is invisible to a check that only looks at binary flag history.

**Net assessment:** Zero meaningful signal. Both build-from-scratch and acquire paths are designed to produce exactly the "previous company records for past SOC orders and outcomes" that this check rewards.

---

### 3. biotech-incubator-tenant

**Summary:** LLC rents bench space at a biotech incubator, uses the incubator brand for institutional legitimacy, and builds light order history.

**Bypass methods relevant to this measure:**

- **Method 4c — Build a real (light) order history before SOC.** Several routine non-SOC orders over 1–3 months.
  - **MISSED.** Same reasoning — clean order history is the manufactured input.

- **Method 4f — Buy an aged dormant biotech LLC.** Inherits formation history and possibly prior order history.
  - **MISSED.** Same as shell-company acquisition variant.

**Net assessment:** Zero signal. The incubator tenant is net-new with manufactured clean history (or inherited history); neither triggers IGSC or internal CRM flags.

---

### 4. bulk-order-noise-cover

**Summary:** Core facility technician at a real R1 university exploits institutional ordering infrastructure. Long-standing account with years of legitimate order history.

**Bypass methods relevant to this measure:**

- **Method A — Bulk-order noise cover (core facility).** Target sequences bundled into routine multi-PI batches of 200–800 tubes.
  - **MISSED.** The facility's account is genuinely pre-approved with years of clean SOC and non-SOC history. The IGSC channel has no flag. The internal CRM shows the account's legitimate history. The implementation checks account-level history, but the malicious actor operates within the account's normal volume baseline, so no per-order anomaly surfaces.

- **Method C — Temporal noise escalation.** Gradually grows the baseline so adaptive thresholds rise.
  - **MISSED.** Same — gradual volume increase is invisible to a binary flag-history check.

**Net assessment:** Zero signal. The branch explicitly exploits pre-approved accounts. This check rewards exactly the status the attacker inherits.

---

### 5. account-hijack

**Summary:** Attacker compromises a PI's institutional email and takes over a fully-verified provider account.

**Bypass methods relevant to this measure:**

- **Inherited footprint.** The PI has genuine publications, grants, clean order history.
  - **MISSED.** The hijacker inherits the PI's entire IGSC-clean + CRM-clean status. Neither the IGSC channel nor the internal CRM can distinguish a hijacked session from the legitimate PI. The implementation does not include any identity-rebinding or per-order IAL check.

**Net assessment:** Zero signal. Pre-approval is inherited wholesale.

---

### 6. credential-compromise

**Summary:** Remote credential compromise of a verified faculty/lab-manager customer; account takeover via compromised institutional email.

**Bypass methods relevant to this measure:**

- **Account takeover of existing verified customer.** Password reset via compromised institutional email.
  - **MISSED.** Identical to account-hijack — the legitimate customer's clean IGSC and CRM history is silently inherited.

**Net assessment:** Zero signal.

---

### 7. dormant-account-takeover

**Summary:** IT admin takes over dormant provider account of departed researcher, inheriting fully-approved persona.

**Bypass methods relevant to this measure:**

- **Bypass A — Inherited footprint (native pass).** Original holder's history is real and clean.
  - **MISSED.** The dormant account's clean history passes CRM check. IGSC has no flag.

- **Bypass B — Passively constrain order profile.** Keeps within the account's historical patterns.
  - **MISSED.** Volume-pattern compliance is invisible to a binary flag check.

- **Bypass D — Gradual volume ramp.** Small orders before escalating to SOC.
  - **MISSED.** Same reasoning.

**Net assessment:** Zero signal. The dormant account's pre-approval status is inherited and undisturbed.

---

## Findings

### Critical

**C1: The check provides zero discriminatory signal against any of the seven mapped attacker stories.**

- **Source:** All seven stories — gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant, bulk-order-noise-cover, account-hijack, credential-compromise, dormant-account-takeover.
- **Why the implementation misses:** The IGSC channel requires another member to have *already* flagged the customer; all seven branches either manufacture a clean history or inherit one, so no prior flag exists. The internal CRM rollup checks for *prior negative events* in the provider's own records; all seven branches ensure no negative events exist. The check fundamentally rewards what these attackers construct (clean history) and cannot detect what they are (malicious).
- **Structural or fixable?** Largely **structural**. The IGSC channel's utility is fundamentally limited to repeat offenders who were caught and flagged at a different provider — a valuable but narrow use case (post-hoc intelligence sharing). The internal CRM rollup catches repeat offenders at the same provider. Neither mechanism can detect a first-time attacker who has carefully maintained a clean record. No field-set tweak to this idea would change this; the gap is inherent in the "flag bad actors after the fact" architecture.
- **Suggestion for stage 4 re-research:** None — this is not a field-set problem. The idea is correctly scoped for what it does (post-hoc intelligence sharing for known-bad actors). The gap should be documented rather than patched. Complementary ideas (m17-positive-verification-sop for staleness, m17-predecessor-reidv for identity inheritance) address different attacker stories.

### Moderate

**M1: Channel under-utilization amplifies the structural gap.**

- **Source:** IGSC "rarely used" framing (RAND 2024, Council on Strategic Risks 2024).
- **Why it matters:** Even for the narrow use case the check is designed for (repeat offenders flagged by other members), the channel's documented under-utilization means most flags that *should* be filed are not. The implementation correctly identifies this as a failure mode but cannot fix it — it is a governance/adoption problem, not a field-set problem.

**M2: Identity-drift defeats fuzzy matching for serial offenders.**

- **Source:** shell-company (acquire variant), cro-identity-rotation (from m18 mapping but relevant to m17 as a serial-entity attacker).
- **Why it matters:** An attacker who was flagged under Entity A and returns as Entity B with a different name, LLC, and domain defeats the `igsc_fuzzy_match` logic. The implementation acknowledges this ("different name, LLC, or domain than the one originally flagged; fuzzy match fails") but has no concrete mitigation — the fingerprint dimensions available (name, org, address, email) are exactly the ones the attacker changes.

### Minor

**m1: Antitrust/GDPR redaction may render IGSC payloads too thin to match on.**

- **Source:** Implementation's own ToS constraints section.
- **Detail:** If the originating member shares only narrative facts without PII, the receiving provider cannot confirm a match. This is an AMBIGUOUS case — the degree of PII sharing is a governance decision not pinned down in the implementation.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Time-aged domain + clean order history | gradual-legitimacy-accumulation | MISSED |
| Aged domain auction purchase | gradual-legitimacy-accumulation | MISSED |
| Build entity signals from scratch (order history) | shell-company | MISSED |
| Acquire existing company with live accounts | shell-company | MISSED |
| Gradual order escalation + protocol framing | shell-company | MISSED |
| Build light order history (1–3 months) | biotech-incubator-tenant | MISSED |
| Buy aged dormant biotech LLC | biotech-incubator-tenant | MISSED |
| Bulk-order noise cover (core facility) | bulk-order-noise-cover | MISSED |
| Temporal noise escalation | bulk-order-noise-cover | MISSED |
| Inherited footprint (PI takeover) | account-hijack | MISSED |
| Account takeover of verified customer | credential-compromise | MISSED |
| Inherited footprint (dormant account) | dormant-account-takeover | MISSED |
| Passively constrain order profile | dormant-account-takeover | MISSED |
| Gradual volume ramp | dormant-account-takeover | MISSED |

## bypass_methods_uncovered

All 14 bypass methods listed above are MISSED. The check provides signal only against the narrow case of a known-bad actor who was previously flagged by another IGSC member and returns with the same identity surface — a scenario not represented in any of the seven mapped attacker stories.

---

## Verdict

**STRUCTURAL** — The single Critical finding (C1) is structural. The IGSC shared list and internal CRM rollup are designed for post-hoc intelligence sharing about known-bad actors, not for detecting first-time attackers with manufactured or inherited clean histories. All seven mapped attacker stories bypass the check entirely, and no field-set or implementation tweak can close this gap. The idea is correctly scoped for what it does; the limitation should be documented and routed to human review. Complementary ideas under m17 (positive-verification-sop, predecessor-reidv) and m18 address different attack surfaces.
