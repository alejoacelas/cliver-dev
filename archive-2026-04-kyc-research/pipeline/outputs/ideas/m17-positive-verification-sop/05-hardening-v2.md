# m17-positive-verification-sop — Bypass-aware hardening v2 (Critical-only re-check)

- **measure:** M17 (pre-approval-list)
- **idea:** Annual positive-verification SOP — with independent-contact mandate and counter-party institutional email verification
- **scope:** Re-evaluation of Critical Finding C1 from v1 only.

---

## C1 re-assessment: Positive-confirmation self-confirmation by attacker-controlled contacts

**v1 finding:** The SOP sends outreach to "the institutional contact on file." For purpose-built-organization branches, that contact is the attacker. For account-hijack/credential-compromise branches, the attacker controls the contact's inbox. The SOP has no mechanism to verify the contact's independence from the entity's operator.

**v2 fix:** Two layers:
1. Independent-contact mandate: the confirmation must come from a contact obtained via an independent channel (IBC-RMS, switchboard, faculty directory, corporate registry) — not from a customer-provided contact.
2. Counter-party institutional email verification: the reply must pass DMARC validation for the institutional domain, and the domain must match independent sources.
3. Two-contact requirement for non-established entities.

### Did the fix address C1?

**Yes, for account-takeover branches. Partially for purpose-built-organization branches.**

**Account-takeover branches (account-hijack, credential-compromise):**
- v1: MISSED — attacker controls the PI's inbox and replies affirmatively.
- v2: **CAUGHT** — the independent-contact mandate means the provider looks up the BSO or department contact via IBC-RMS or switchboard, not from the customer-provided contact. The attacker controls the PI's email but does not control the BSO's email or the switchboard. The BSO (if independently contacted) may report that the PI has departed or may not confirm the account.
- Residual risk: if the attacker has compromised the *entire institution's email infrastructure* (not just one inbox), the independent contact's reply also comes from a compromised domain. This is a much higher bar than single-inbox compromise.
- **Verdict: Substantially addressed for account-takeover branches.**

**Purpose-built-organization branches (gradual-legitimacy-accumulation, shell-company build-from-scratch, biotech-incubator-tenant):**
- v1: MISSED — the institutional contact is the attacker.
- v2: The independent-contact mandate attempts to find a contact via switchboard/directory/registry. For a purpose-built shell, the attacker *controls the switchboard, the website, the domain, and all registered officers*. The "independent" lookup leads back to attacker-controlled contacts. The two-contact requirement forces the attacker to staff two independently-reachable personas, which is a cost increase but not a hard block.
- The DMARC check ensures the reply comes from the claimed domain — but the attacker controls that domain.
- **Verdict: Marginal improvement for purpose-built organizations.** The v2 implementation honestly documents this structural limitation: "For purpose-built organizations where the institution *is* the shell... independent-contact verification collapses — all 'independent' channels lead back to the attacker."

**Incubator-tenant variant:**
- v1: MISSED — incubator admin legitimately confirms.
- v2: **Partially improved.** If the provider looks up the incubator's IBC or switchboard (not the tenant's), the incubator admin confirms the *tenancy* but not the *intent*. The SOP catches the case where the tenant has left the incubator (admin says "they moved out") but not the case where the tenant is current and malicious. This is the same structural limitation — real tenancy at a real incubator produces a genuine positive confirmation.

### Story-level reassessment (C1-relevant stories only)

| Story | v1 classification | v2 classification | Change |
|---|---|---|---|
| account-hijack (PI inbox controlled) | MISSED | CAUGHT (independent BSO contact) | Substantially improved |
| credential-compromise (inbox controlled) | MISSED | CAUGHT (independent contact) | Substantially improved |
| gradual-legitimacy-accumulation | MISSED | MISSED (shell controls all channels) | Marginal improvement (two-contact cost) |
| shell-company (build from scratch) | MISSED | MISSED (shell controls all channels) | Marginal improvement |
| biotech-incubator-tenant | MISSED | AMBIGUOUS (incubator admin confirms tenancy, not intent) | Minor improvement |

### Verdict on C1

**Downgraded from Critical to Moderate.** The independent-contact mandate directly closes the account-takeover attack path (2 of 5 affected stories) and raises costs for purpose-built organizations (via the two-contact requirement). The structural limitation for shell entities is honestly documented and cannot be solved within the scope of a positive-verification SOP — it requires complementary institution-legitimacy checks (m18, m09). The v2 SOP now has a defensible architecture: it verifies what it can verify (institutional contacts exist and are reachable via independent channels) and explicitly documents what it cannot verify (that the institution itself is not attacker-controlled).

---

## Other v1 findings (not re-assessed; carry forward)

- **M1 (Moderate):** IBC-RMS coverage gap for non-US and non-academic institutions — unchanged. The independent-contact mandate provides fallback channels (switchboard, directory) but these are weaker than IBC-RMS.
- **M2 (Moderate):** Order-pattern monitoring outside SOP scope — unchanged (by design).
- **m1 (Minor):** Out-of-band confirmation channels — **ADDRESSED in v2** (switchboard callback is now mandated as independent channel; DMARC check is now mandated). Resolved.
- **m2 (Minor):** Event-triggered re-verification on HR/directory changes is aspirational — unchanged.

---

## Verdict: **PASS**

The Critical finding (C1) has been addressed and downgraded to Moderate. The v1 Minor finding m1 has been resolved. Two Moderate findings carry forward unchanged. No remaining Critical findings. No further re-research loop required.
