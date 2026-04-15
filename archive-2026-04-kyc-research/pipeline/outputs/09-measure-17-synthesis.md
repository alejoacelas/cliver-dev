# Measure 17 — Pre-Approval List: Per-Measure Synthesis

## Selected stack (4 ideas)

| Field | m17-fsap-ibc-roster | m17-positive-verification-sop | m17-event-driven-reeval | m17-predecessor-reidv |
|---|---|---|---|---|
| **Role in stack** | Entry gate | Calendar-based maintenance | Inter-cycle trigger | Per-order identity |
| **Layer** | Entity (institution) | Entity (institution) | Entity (institution) | Individual (submitter) |
| **Trigger** | Onboarding | Annual (or event-triggered early) | Continuous event feeds | Each SOC order |
| **Primary signal** | IBC-RMS roster match + BSO confirmation | Independent-contact positive confirmation + DMARC + sanctions delta | OpenCorporates officer change, OFAC delta, breach feed, dormancy timer | Document + selfie + liveness (IAL2) bound to order |
| **Primary catching mechanism** | Exclusion — no IBC → denied fast track | Stale-approval expiry + independent-contact mandate defeats inbox-only compromise | Entity demotion on corporate change events | `predecessor_rebind_name_mismatch` flag |
| **Marginal cost / entity / year** | $0 (IBC-RMS); $5–$25 one-time (FSAP attestation) | $75–$150 | $1–$5 | $1.50/SOC order (Stripe Identity) |
| **Setup cost** | 2–4 eng-weeks | $15K–$35K | 4–8 eng-weeks + vendor contracts | $20K–$80K (incl. legal for biometric storage) |
| **Key external dependency** | NIH IBC-RMS (public, no API); CDC/APHIS FSAP (not public) | IBC-RMS, institutional switchboards, public directories, DMARC | OpenCorporates API (vendor-gated pricing), OFAC SLS (free) | IDV vendor (Stripe Identity, ID.me, Persona, Onfido) |
| **Coverage population** | US NIH-funded academic (50–70% of US academic customers) | All pre-approved entities (universal but labor-intensive) | Corporate entities in OpenCorporates (excludes ~30–50% academic/gov) | All SOC-order submitters (universal) |
| **Dominant false-positive trigger** | Out-of-scope researchers at IBC institutions (30–50%) | Small entities failing two-contact requirement; DMARC-none institutions (~70–80% of academic) | Routine officer turnover at large institutions | Legitimate handoffs (10–20% of accounts/year in academia) |

---

## Coverage gap cross-cut

### Structural gaps (unfixable within this measure)

| Gap | Affected ideas | Nature |
|---|---|---|
| **Purpose-built entity controlling all channels** | SOP, IBC roster, event-driven | Attacker builds a real entity with real IBC registration, real switchboard, real contacts. All "independent" verification channels lead back to the attacker. Two-contact requirement is a speed bump, not a block. | 
| **Own-identity attacker passes re-IAL2** | Predecessor re-IDV | Attacker uses their real identity throughout — re-IAL2 succeeds because the identity is genuine. Check provides attribution (per-order biometric commitment) but not prevention. |
| **BSO confirms person, not order content** | IBC roster | IBC is a governance attestation. BSO confirms affiliation, not that specific sequences are authorized. Rogue insider ordering unauthorized sequences within a legitimate institution is invisible. |
| **FSAP entity list not public** | IBC roster | 230-entity roster requires manual attestation-and-callback SOP. Structural government policy limitation. |
| **Control changes without corporate filings** | Event-driven | Management buyouts, beneficial-ownership shifts that produce no registry filing generate no event. Estimated <5% of legitimate changes but potentially 100% of attacker-engineered ones. |

### Complementary gaps (addressable by sibling measures or operational tuning)

| Gap | Affected ideas | Mitigation path |
|---|---|---|
| **Non-US / non-academic institutions** | IBC roster (no signal for ~40–50% of customers) | m18 institution-legitimacy + m19 individual-legitimacy provide alternative verification |
| **Commercial biotech without IBC/FSAP** | IBC roster (no signal for ~30–40% of customers) | Same — m18/m19 alternative verification path |
| **DMARC not enforced (~70–80% of academic institutions)** | SOP | Phone-callback supplement (already in SOP design); reframe DMARC as bonus signal, not reliable control |
| **Non-English institution switchboard lookup** | SOP | Multilingual staff, translation tools, extended callback windows; cost estimates need upward revision |
| **OpenCorporates jurisdiction data-freshness lag** | Event-driven | Weekly (not monthly) reconciliation for SOC-active entities; explicit latency-window risk acceptance |
| **Academic institutions not in OpenCorporates** | Event-driven | ~30–50% of pre-approved entities may be invisible; annual SOP covers these on calendar cadence |
| **IDV friction / abandonment** | Predecessor re-IDV | Estimated 10–25% first-encounter drop rate; customer communication and streamlined UX; B2B friction data needed |
| **Legitimate-handoff volume in academia** | Predecessor re-IDV | 10–20% of accounts/year; streamlined institutional-confirmation path needed |
| **Non-SOC orders not covered by re-IAL2** | Predecessor re-IDV | Lighter-weight identity check on non-SOC orders from dormant accounts (recommended, not yet specified) |
| **Shared core-facility accounts** | Predecessor re-IDV | 5–15% of accounts; structural mismatch with one-person-per-account model; requires account-architecture decision |

---

## Bypass methods uncovered: attacker stories surviving the entire selected stack

### Stories where the stack provides prevention

| Attacker story | Caught by | Mechanism |
|---|---|---|
| **account-hijack** | SOP (independent-contact mandate) + re-IAL2 (name mismatch) | Attacker controls PI inbox but not BSO/switchboard; re-IAL2 surfaces different person |
| **credential-compromise** | SOP (independent contact) + re-IAL2 (name mismatch) + event-driven (breach feed) | Breach feed demotes entity; independent contact routes confirmation away from compromised inbox; re-IAL2 catches identity swap |
| **dormant-account-takeover** | Re-IAL2 (name mismatch) + event-driven (dormancy timer) | Dormancy timer demotes entity; re-IAL2 at SOC order catches IT admin's identity |
| **shell-company acquisition variant** | Event-driven (OpenCorporates officer change) + re-IAL2 (name mismatch) | Corporate filing surfaces ownership change; new principal's name mismatches predecessor |

### Stories where the stack provides partial coverage (exclusion or attribution, not detection-at-order-time)

| Attacker story | Stack response | Residual risk |
|---|---|---|
| **gradual-legitimacy-accumulation** | IBC roster: excluded if no IBC (routed to m18/m19). SOP: two-contact requirement raises cost. Re-IAL2: attribution only (real identity passes). Event-driven: no events generated. | If attacker has real IBC registration (e.g., a patient operator who actually obtains legitimate institutional affiliation), the entire stack is bypassed for prevention. Per-order biometric commitment provides post-incident attribution only. **Residual: HIGH.** |
| **shell-company build-from-scratch** | IBC roster: excluded (no IBC). SOP: two-contact requirement (speed bump). Re-IAL2: attribution only. Event-driven: no events. | Same as above. If attacker routes through m18/m19 alternative verification successfully, the pre-approval stack has no remaining catch. **Residual: HIGH — deferred to m18/m19.** |
| **biotech-incubator-tenant** | IBC roster: usually excluded (incubator tenant unlikely to have own IBC). SOP: incubator admin confirms tenancy, not intent. Re-IAL2: attribution only for own-identity variant. Event-driven: no events for primary path. | LLC-purchase variant caught by event-driven + re-IAL2. Own-identity primary path: attacker is a real tenant with real bench space — IBC exclusion is the primary barrier, but if the incubator itself has IBC registration, the tenant may inherit it. **Residual: MODERATE — depends on IBC inheritance rules.** |
| **bulk-order-noise-cover** | IBC roster: BSO confirms person, not order content. SOP: entity is a real R1 university — passes all entity-level checks. Re-IAL2: attacker uses own identity on per-user account (attribution only); shared-account variant caught. Event-driven: institution is real and unchanged — no events. | Per-user-account variant: the rogue technician is a real, affiliated employee with a legitimate account. The entire entity-level stack (IBC, SOP, event-driven) confirms the institution. Re-IAL2 confirms the technician's real identity. Nothing in this measure detects unauthorized sequence content within authorized orders. **Residual: HIGH — requires order-content screening (m1–m3), not pre-approval-list controls.** |

### Summary of surviving bypass methods

The following attacker methods survive the entire four-idea stack without detection or prevention:

1. **Patient entity construction with real IBC registration.** An attacker who spends years building a genuine institutional affiliation — including obtaining real IBC registration — passes all four checks. The IBC roster confirms them, the annual SOP independently contacts their own BSO, event-driven re-evaluation sees no changes, and re-IAL2 confirms their real identity. Only m18/m19 institution-legitimacy and individual-legitimacy checks (outside this measure) can catch the hollowness of the underlying research program.

2. **Rogue insider at a real institution (per-user account).** A core-facility technician or cross-PI admin at a real R1 university, ordering on their own legitimate account, passes every check in the stack. Their institution has IBC, the SOP confirms the institution, no corporate events fire, and re-IAL2 confirms their real identity. The attack surface is order content, not identity or institutional legitimacy — it requires sequence-screening measures (m1–m3), not pre-approval controls.

3. **Own-identity attacker with successful m18/m19 passage.** Any purpose-built-organization branch where the attacker uses their real identity and successfully navigates the m18/m19 alternative verification path (triggered by IBC exclusion) returns to the pre-approval roster and is thereafter maintained by the SOP and event-driven re-evaluation — none of which can detect that the underlying research program is hollow.

---

## Structural gaps flagged as open issues

1. **Purpose-built organizations remain the canonical unaddressed threat.** All four selected ideas are entity-level or identity-level controls. None assess whether the entity's stated research program is genuine. The gradual-legitimacy-accumulation and build-from-scratch shell-company branches are designed to pass exactly these controls. Resolution requires m18 (institution-legitimacy) and m19 (individual-legitimacy) — these are not optional complements but load-bearing requirements for the pre-approval system's integrity against purpose-built organizations.

2. **DMARC enforcement rate materially lower than initial estimates.** Cited data shows ~20–30% of academic institutions globally enforce DMARC at quarantine/reject levels, vs. the implementation doc's >70% estimate. The SOP's Layer 2 (email authentication) is effectively absent for most academic institutions. The phone-callback supplement is essential, not optional. Cost and time estimates for the SOP should be revised upward to reflect phone callbacks as the default verification channel.

3. **IBC-RMS coverage is narrow.** The roster covers US NIH-funded academic institutions only — estimated 50–70% of US academic synthesis customers. Commercial biotech (~30–40% of customers), foreign institutions (~40–50%), and non-NIH US academic institutions all route to m18/m19. The IBC roster is high-value for its covered population but should not be framed as a general-purpose pre-approval gate.

4. **OpenCorporates coverage excludes academic and government entities.** An estimated 30–50% of pre-approved entities (academic institutions, government labs) may be outside OpenCorporates entirely. For these entities, event-driven re-evaluation provides no corporate-change signal; the annual SOP is the sole maintenance mechanism.

5. **Legitimate-handoff volume creates sustained operational burden.** In an academic-weighted customer base, 10–20% of accounts per year may experience personnel changes, each triggering `predecessor_rebind_name_mismatch` and requiring manual review, institutional confirmation, and potentially full re-screening. No streamlined institutional-HR-integration path is proposed. This is the dominant ongoing cost driver for the re-IAL2 idea and needs operational design before deployment.

6. **NIST IAL2 conformance gap.** Only ID.me has documented NIST 800-63A IAL2 conformance. Stripe Identity, Persona, and Onfido offer "IAL2-equivalent" flows without formal attestation. Policy decision required: mandate ID.me (documented conformance, likely higher cost, less flexibility) or accept vendor-equivalent with documented justification.

7. **Non-SOC order gap in re-IAL2.** Re-IAL2 fires only on SOC orders. An attacker using a dormant or shared account can place non-SOC orders to build activity without triggering identity re-verification. A lighter-weight identity check on non-SOC orders from dormant accounts is recommended but not yet specified.

8. **BSO confirmation is person-level, not order-level.** The IBC roster and BSO callback confirm that a person is affiliated with an institution that has biosafety oversight. They do not confirm that specific sequences in a specific order are authorized. This is a structural limitation of roster-based approaches and cannot be closed within measure 17.
