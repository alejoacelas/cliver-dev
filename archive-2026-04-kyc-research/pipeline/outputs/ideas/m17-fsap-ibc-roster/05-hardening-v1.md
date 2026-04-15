# m17-fsap-ibc-roster — Bypass-Aware Hardening v1

- **measure:** M17 (pre-approval-list)
- **idea:** FSAP + NIH OSP IBC roster ingestion

---

## Attacker Story Walk

### 1. gradual-legitimacy-accumulation

**Summary:** Patient attacker operates a real-but-hollow small biotech for 6-12 months, building order history, then places SOC orders.

**Bypass methods relevant to this measure:**

- **Method 1 — Time-aged domain and clean order history.**
  - **Classification: CAUGHT (partial, by exclusion)** — a fake small biotech will not have an IBC registration (IBCs are at established institutions, not at LLCs). The `ibc_not_listed` flag fires, routing the entity to alternative verification (m18, m19). The check does not *catch* the attacker — it *fails to pre-approve* them, which forces them through a harder path. The implementation notes this: "the central branch builds a *real* small biotech, which would simply not have an IBC at all and would route through the alternative verification."
  - **Net:** The check works by *denying fast-track status*, not by detecting the attack. The attacker is inconvenienced (must pass m18/m19 instead) but not stopped.

- **Method 2 — Aged domain auction purchase.**
  - **Classification: CAUGHT (same exclusion mechanism)** — same as Method 1. No IBC, no pre-approval.

- **Methods 3-10 (ORCID, publications, etc.).**
  - **Classification: CAUGHT (same exclusion mechanism)** — none of these produce an IBC registration.

**Net assessment:** The check is valuable as a *gating* function: it ensures purpose-built entities cannot use the pre-approval fast track. But it does not detect or stop the attack — it merely routes it to the alternative m18/m19 path, which is where the real fight happens.

---

### 2. shell-company

**Summary:** Attacker builds or acquires a shell company.

**Bypass methods relevant to this measure:**

- **Build from scratch.**
  - **Classification: CAUGHT (by exclusion)** — shell companies have no IBC. The `ibc_not_listed` flag fires. Same gating mechanism as gradual-legitimacy-accumulation.

- **Acquire an existing company.**
  - **Classification: CAUGHT (by exclusion)** — an acquired biotech/consulting firm almost certainly has no IBC (IBCs are at universities and research institutions, rarely at small commercial entities). The flag fires.

- **Gradual order escalation.**
  - **Classification: MISSED** — if the entity somehow obtained pre-approval through m18/m19 (not through IBC), order escalation within the pre-approved scope is not re-checked by this idea.

**Net assessment:** Same as gradual-legitimacy-accumulation — the check gates pre-approval but does not independently detect the attack.

---

### 3. biotech-incubator-tenant

**Summary:** Attacker leases bench space at a biotech incubator, forms an LLC.

**Bypass methods relevant to this measure:**

- **Method 3a — Bench-space lease at a recognized incubator.**
  - **Classification: CAUGHT (by exclusion)** — the LLC tenant at an incubator is not on the IBC roster. Some incubators have a shared IBC, but the implementation notes "the tenant LLC is often not formally on the roster." The `ibc_not_listed` flag fires.
  - **Uncertainty:** if the incubator *does* have a shared IBC that lists tenant LLCs, the attacker could be pre-approved incorrectly. The implementation notes this is uncommon but possible.

- **Method 4c — Build light order history.**
  - **Classification: MISSED** — order history is not checked by this idea.

- **Method 4f — Buy an aged dormant biotech LLC.**
  - **Classification: CAUGHT (by exclusion)** — dormant LLCs have no IBC.

**Net assessment:** Effective gating for most incubator tenants. Small uncertainty around shared IBC coverage.

---

### 4. bulk-order-noise-cover

**Summary:** Core facility technician or cross-PI admin at an R1 university batches target sequences into routine multi-PI orders.

**Bypass methods relevant to this measure:**

- **Method A — Bulk-order noise cover (core facility).**
  - **Classification: CAUGHT (partial, via BSO callback)** — the attacker is at a real R1 university that is on the IBC roster. The BSO callback asks "is this person operating within your IBC's purview?" A competent BSO would confirm the core facility staff person, but might not know that a specific tube in a 200-tube batch is unauthorized. The check confirms the *person* is legitimate, not the *order content*. The implementation correctly notes: "effectiveness depends on BSO diligence."

- **Method B — Cross-PI distribution.**
  - **Classification: CAUGHT (partial, same mechanism)** — the PIs are all on the IBC roster. The BSO confirms them. The check confirms institutional governance exists but cannot detect that specific sequences within orders are unauthorized.

- **Method C — Temporal noise escalation.**
  - **Classification: MISSED** — gradual volume growth does not trigger any IBC-level re-check.

**Net assessment:** The IBC/BSO check provides a *governance attestation* — it confirms the institution has biosafety oversight. But it cannot detect a rogue insider operating within that governance framework. The attacker is a *real employee* at a *real IBC-registered institution* ordering through *legitimate channels*. The BSO's affirmative response is accurate at the institutional level and misleading at the order level.

---

### 5. account-hijack

**Summary:** Attacker compromises a PI's email, inherits their verified account.

**Bypass methods relevant to this measure:**

- **Inherited entity signals.**
  - **Classification: MISSED** — the legitimate PI is real and on the IBC. The BSO confirms the PI's affiliation. The check provides no signal against an attacker operating from inside a legitimate account. The implementation notes: "weakly addressed — the legitimate PI is real and on the IBC, so the check passes."

**Net assessment:** Zero value against this branch. The attacker inherits exactly the IBC affiliation that the check validates.

---

### 6. credential-compromise

**Summary:** Attacker compromises faculty/staff credentials.

**Bypass methods relevant to this measure:**

- **Account takeover of an existing verified customer.**
  - **Classification: MISSED** — same as account-hijack. The legitimate customer's IBC affiliation is inherited.

**Net assessment:** Zero value.

---

### 7. dormant-account-takeover

**Summary:** IT admin takes over a dormant provider account.

**Bypass methods relevant to this measure:**

- **Bypass A — Inherited footprint (native pass).**
  - **Classification: CAUGHT (partial, via BSO callback)** — if the provider re-runs the BSO callback when the account returns from dormancy, the BSO might respond "this researcher has departed." This catches the branch cleanly — but *only* if the BSO callback is re-triggered. The implementation mentions this as possible but does not specify *when* the BSO callback is re-run (at onboarding only? periodically? on dormancy return?).

- **Bypass B — Passively constrain order profile.**
  - **Classification: MISSED** — no IBC-level re-check is triggered by normal ordering patterns.

- **Bypass D — Gradual volume ramp.**
  - **Classification: MISSED** — same reasoning.

**Net assessment:** Potentially valuable if the BSO callback is re-triggered on dormancy return, but the implementation does not specify this trigger.

---

## Findings

### Finding 1 — Moderate: FSAP entity list is not publicly available — the FSAP half of this idea is a manual SOP, not an automated check

- **Source:** General (the idea's name implies both FSAP and IBC, but the FSAP component is fundamentally limited).
- **Why missed:** The implementation clearly documents this: "NOT publicly available" and "the provider can ASK the customer to attest in writing." The FSAP component degrades to an attestation-and-callback workflow with no automated verification. For FSAP-relevant entities (select agent work), this is a meaningful gap because the entire check rests on the customer's honesty and the provider's ability to contact the Responsible Official.
- **Suggestion:** This is structural. The FSAP entity list will not be made public for security reasons. The best the implementation can do is the RO-callback SOP, which is already described. Stage 7 should note that FSAP verification is inherently weaker than IBC verification due to the lack of a public dataset.

### Finding 2 — Moderate: IBC roster confirms institutional governance, not order-level authorization

- **Source:** bulk-order-noise-cover (Methods A, B).
- **Why missed:** The BSO callback confirms "this person is affiliated with your institution and operates within your IBC's purview." This is a *person-level* governance check, not an *order-level* authorization. A rogue core-facility technician who is genuinely within the IBC's purview (they handle SOC material as part of their job) would be confirmed by the BSO. The check cannot detect that a specific sequence in a 200-tube batch is unauthorized.
- **Suggestion:** This is structural for an institutional-roster-based check. Per-order authorization would require a fundamentally different mechanism (e.g., the BSO approving each SOC order individually, which is not scalable). Stage 7 should note this limitation.

### Finding 3 — Moderate: BSO callback is not specified to re-fire on dormancy return

- **Source:** dormant-account-takeover (Bypass A).
- **Why missed:** The implementation describes the BSO callback at onboarding but does not specify re-running it when a dormant account returns. For the dormant-account-takeover branch, re-running the BSO callback is the primary catching mechanism (the BSO would say "this researcher departed"). Without a re-trigger, the original onboarding confirmation stands indefinitely.
- **Suggestion:** Stage 4 should specify that the BSO confirmation has an expiration date (e.g., 12-24 months) and is re-triggered on dormancy return. This tightens the dormant-account-takeover catch significantly.

### Finding 4 — Minor: IBC-RMS has no documented API — scraper fragility

- **Source:** General.
- **Why missed:** The implementation notes this: "ingest must be a scraper, fragile to UI changes." This is an operational fragility, not a bypass gap, but it means the IBC roster could go stale silently if the scraper breaks.
- **Suggestion:** Implement a freshness check: if the IBC-RMS snapshot is older than N days, flag all IBC-based pre-approvals for manual re-verification.

### Finding 5 — Minor: Foreign institutions are entirely uncovered

- **Source:** General.
- **Why missed:** The implementation notes: "FSAP is US-only, IBC is US-NIH-funded primarily." Foreign institutions with legitimate SOC needs (e.g., a UK university working on select agents under ACDP) are not in either roster and would always route to m18/m19. This is a coverage gap, not a bypass.
- **Suggestion:** Acknowledge in stage 7 that this idea is US-centric. For international coverage, complementary rosters would be needed (e.g., UK HSE Approved List, EU Dual-Use Regulation Annex listings). This is a potential future idea, not a fix for this one.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Time-aged domain + clean history | gradual-legitimacy-accumulation | CAUGHT (by exclusion — no IBC, forced to m18/m19) |
| All signal-seeding methods | gradual-legitimacy-accumulation | CAUGHT (by exclusion) |
| Build entity from scratch | shell-company | CAUGHT (by exclusion) |
| Acquire existing company | shell-company | CAUGHT (by exclusion) |
| Gradual order escalation | shell-company | MISSED (post-approval behavior) |
| Bench-space lease | biotech-incubator-tenant | CAUGHT (by exclusion, usually) |
| Buy aged dormant LLC | biotech-incubator-tenant | CAUGHT (by exclusion) |
| Bulk-order noise cover | bulk-order-noise-cover | CAUGHT (partial — BSO confirms person, not order) |
| Cross-PI distribution | bulk-order-noise-cover | CAUGHT (partial — same) |
| Temporal noise escalation | bulk-order-noise-cover | MISSED |
| Inherited entity signals | account-hijack | MISSED (PI is on IBC) |
| Account takeover | credential-compromise | MISSED (customer is on IBC) |
| Dormant account inherited footprint | dormant-account-takeover | CAUGHT (partial — if BSO callback re-fires) |
| Passively constrain order profile | dormant-account-takeover | MISSED |

## bypass_methods_uncovered

- Account-hijack / credential-compromise: structural — the legitimate user's IBC affiliation is inherited by the attacker.
- Bulk-order noise cover (order-level authorization): structural — IBC roster is person-level, not order-level.
- BSO callback not re-triggered on dormancy: implementation gap.
- Foreign institutions: coverage gap.
- FSAP entity list non-public: structural.

---

## Verdict

**PASS** — no Critical findings. The idea's primary function (gating pre-approval by IBC roster presence) works as designed: purpose-built entities are excluded from the fast track, and the BSO callback adds a human verification step. The Moderate findings are structural limitations of a roster-based approach that are already acknowledged in the implementation. Pipeline continues to stage 6.
