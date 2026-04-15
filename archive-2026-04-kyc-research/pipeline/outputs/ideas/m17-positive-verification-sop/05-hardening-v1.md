# m17-positive-verification-sop — bypass-aware hardening v1

- **measure:** M17 (pre-approval-list)
- **idea:** Annual positive-verification SOP

---

## Attacker story walk

### 1. gradual-legitimacy-accumulation

**Summary:** Patient operator builds a real LLC over 6–12 months, places clean non-SOC orders, then attempts SOC. The entity eventually gets pre-approved.

**Bypass methods relevant to this measure:**

- **Method 1 — Time-aged domain and clean order history.** 12 months of clean orders to reach pre-approval, then persist.
  - **CAUGHT (partially).** Once the entity is pre-approved, the annual re-verification SOP will fire on the 12-month cadence. The SOP sends a positive-confirmation request to the institutional contact and runs an IBC-RMS check and sanctions delta. For the gradual-legitimacy branch:
    - The institutional contact *is* the attacker (or their accomplice). They will reply affirmatively to the positive-confirmation outreach. **MISSED** — the SOP does not include any mechanism to verify that the institutional contact is independent of the entity's principals. The attacker self-confirms.
    - IBC-RMS check: the LLC is unlikely to have an NIH-registered IBC. For non-US or non-IBC-holding entities, the SOP falls back to "direct outreach only." **AMBIGUOUS** — depends on whether the provider treats absence of IBC-RMS record as a flag or as expected for commercial entities.
    - Sanctions delta: will return clean unless the attacker has been sanctioned in the interim. **MISSED** — the attacker is not sanctioned.

- **Method 2 — Aged domain auction purchase.** Compresses domain-age but not order-history component.
  - **Same as Method 1** — the re-verification SOP does not check domain provenance.

**Net assessment:** Weak signal. The SOP's positive-confirmation mechanism is self-confirmable by the attacker. The SOP catches staleness (e.g., entity dissolved, contact unreachable) but not a live, responsive malicious entity that maintains its cover.

---

### 2. shell-company

**Summary:** Delaware LLC built into a plausible biotech; or acquired going concern.

**Bypass methods relevant to this measure:**

- **Build from scratch.** Same as gradual-legitimacy — attacker self-confirms annually.
  - **MISSED.** Self-confirmation by the attacker or their accomplice.

- **Acquire existing company.** Inherited pre-approval; attacker takes over as new principal.
  - **CAUGHT (partially).** If the acquisition changes the institutional contact on file, the SOP's next re-verification cycle will send outreach to the *old* contact. If the old contact is unreachable (departed), the SOP escalates to IBC-RMS backup contact and eventually auto-suspends. However, the attacker can update the contact on file proactively before the re-verification cycle, routing future outreach to themselves. **AMBIGUOUS** — depends on whether the provider requires independent verification of contact-change requests, which is not specified in the implementation.

- **Gradual order escalation.** Same as gradual-legitimacy.
  - **MISSED.** The SOP does not monitor order patterns; it checks entity-level staleness only.

**Net assessment:** Weak-to-moderate. The SOP may catch the acquisition variant if contact change triggers re-verification or if the prior contact is unreachable. But a competent attacker updates the contact proactively.

---

### 3. biotech-incubator-tenant

**Summary:** LLC rents incubator bench space, uses incubator brand, builds light order history.

**Bypass methods relevant to this measure:**

- **Build light order history (1–3 months), then get pre-approved.**
  - **MISSED.** Once pre-approved, the annual SOP fires. The incubator's IBC umbrella may satisfy the IBC-RMS check (if the incubator's host institution has an IBC). The institutional contact is the attacker or the incubator admin (who legitimately confirms the entity is a tenant). Self-confirmation or incubator-admin confirmation both pass.

- **Buy aged dormant biotech LLC.** Same dynamics as shell-company acquisition.
  - **AMBIGUOUS.** Same contact-change question as shell-company.

**Net assessment:** Weak. Incubator-based entities have a real institutional contact (the incubator admin), which satisfies the SOP. The SOP cannot distinguish a malicious tenant from a legitimate one as long as the incubator relationship is real.

---

### 4. bulk-order-noise-cover

**Summary:** Core facility technician at R1 exploits institutional ordering infrastructure.

**Bypass methods relevant to this measure:**

- **Bulk-order noise cover + temporal noise escalation.** The R1's pre-approved account is maintained by the institution's administration, not by the attacker.
  - **CAUGHT (partially).** The annual SOP contacts the institutional contact (e.g., the department's biosafety officer or lab director) and asks them to confirm the account is still valid and the authorized personnel are current. If the R1 has robust internal controls, the re-verification may surface the fact that the core-facility tech who is actually placing orders is not the named authorized signer. However:
    - **AMBIGUOUS** — depends on whether the institutional contact performs an internal audit of facility account access when responding to the SOP, or simply rubber-stamps "yes, the account is active." The implementation does not specify what level of institutional response constitutes sufficient positive confirmation.
    - If the facility account lists multiple authorized personnel (typical for core facilities), the tech may be a legitimately-listed operator, making the positive-confirmation response truthful even though the operator's intent is malicious. **MISSED** — the SOP cannot detect malicious intent by a legitimately-authorized operator.

**Net assessment:** Weak. The SOP verifies that the institution and account are real and active — which they are. It cannot detect an insider abusing a legitimate account.

---

### 5. account-hijack

**Summary:** PI email compromise; attacker takes over existing verified provider account.

**Bypass methods relevant to this measure:**

- **Inherited footprint.** PI's account is fully pre-approved; attacker controls the PI's email.
  - **CAUGHT (partially).** The SOP sends positive-confirmation request to the institutional contact on file. Two sub-cases:
    - If the institutional contact *is* the PI (whose email the attacker controls): **MISSED** — the attacker replies affirmatively from the compromised inbox.
    - If the institutional contact is a *different* person (e.g., the biosafety officer): **CAUGHT** — the BSO may notice the PI has departed or may not recognize the account activity. But this depends on institutional internal awareness and is not guaranteed. **AMBIGUOUS**.
  - The implementation's "event-triggered re-verification" fires on "a change in institutional contact email domain" — but the domain hasn't changed (the attacker uses the same institutional domain). **MISSED.**
  - The SOP's "reply forgery" failure mode is directly relevant: "a compromised institutional inbox replies 'yes, all good.'" The implementation flags this but says it catches it "only if positive confirmation is paired with at least one out-of-band channel (phone callback, signed PDF, DMARC alignment check)." The implementation describes these as options but does not mandate them as part of the SOP. **AMBIGUOUS.**

**Net assessment:** Moderate signal only if the institutional contact is different from the compromised PI and is independently aware of account activity. Weak if the PI is the contact.

---

### 6. credential-compromise

**Summary:** Remote credential compromise of a verified faculty/lab-manager customer.

**Bypass methods relevant to this measure:**

- **Account takeover of existing verified customer.** Same dynamics as account-hijack.
  - **MISSED** (if the PI/faculty member is the institutional contact — attacker controls their inbox).
  - **AMBIGUOUS** (if a separate institutional contact exists).

**Net assessment:** Same as account-hijack.

---

### 7. dormant-account-takeover

**Summary:** IT admin takes over dormant provider account of departed researcher.

**Bypass methods relevant to this measure:**

- **Bypass A — Inherited footprint.** Dormant account retains pre-approval.
  - **CAUGHT.** This is the SOP's strongest use case. On annual cycle, the positive-confirmation request goes to the institutional contact. If the researcher has departed, the contact may be unreachable (email bounces) or the institution's biosafety officer reports the researcher is no longer affiliated. The SOP auto-suspends after due date + 30 days. The `reverification_failed_silent` flag fires.
  - However: the IT admin can redirect the departed researcher's inbox to themselves *before* the re-verification fires. **AMBIGUOUS** — depends on timing and whether the provider detects mailbox-redirect vs. genuine reply.

- **Bypass B — Passively constrain order profile.** Keeps within historical patterns.
  - **MISSED.** The SOP does not monitor order patterns.

- **Bypass D — Gradual volume ramp.** Small orders before escalating.
  - **MISSED.** Same — not an order-monitoring check.

**Net assessment:** The SOP is the most effective check in the m17 stack against this story, specifically because a departed researcher's institutional contact eventually becomes unreachable. But the IT admin can race the SOP by redirecting the inbox before the annual cycle fires. Event-triggered re-verification on directory/HR status changes would close this gap but is listed in the SOP only as an aspirational trigger, not as a concrete integration.

---

## Findings

### Critical

**C1: Positive-confirmation self-confirmation by attacker-controlled contacts.**

- **Source:** gradual-legitimacy-accumulation (Method 1), shell-company (build-from-scratch), biotech-incubator-tenant, account-hijack, credential-compromise.
- **Why the implementation misses:** The SOP sends outreach to "the institutional contact on file." For purpose-built-organization branches, that contact *is* the attacker or their accomplice. For account-hijack/credential-compromise branches, the attacker controls the contact's inbox. In both cases, the positive-confirmation reply is affirmative and the SOP has no mechanism to verify the contact's independence from the entity's actual operator. The self-confirmation problem defeats the SOP for 5 of the 7 mapped stories.
- **Suggestion for stage 4 re-research:** Mandate that positive confirmation must come from a contact verifiable through an *independent* channel — e.g., phone callback to a number obtained from IBC-RMS (not from the customer), or confirmation from a *second* independent contact at the institution (not customer-nominated). This would meaningfully harden the SOP against self-confirmation. However, for purpose-built-organization branches where the institution *is* the shell, no independent contact exists — the gap is structural for those stories.

### Moderate

**M1: IBC-RMS coverage gap for non-US and non-academic institutions.**

- **Source:** All purpose-built-organization branches (shell-company, biotech-incubator-tenant, gradual-legitimacy-accumulation).
- **Why it matters:** IBC-RMS covers US institutions receiving NIH funding. LLCs, foreign entities, and private-sector entities outside NIH funding are absent. The SOP falls back to "direct outreach only" for these, which collapses to self-confirmation.

**M2: Order-pattern monitoring is outside the SOP's scope.**

- **Source:** bulk-order-noise-cover (Methods A and C), dormant-account-takeover (Bypasses B and D).
- **Why it matters:** The SOP catches entity-level staleness but not order-level anomalies. This is by design (the SOP is an entity-verification check, not an order-screening check), but it means the SOP provides zero signal against insiders and dormant-account attackers who keep order patterns normal. Not fixable within this idea; complementary order-monitoring ideas would be needed.

### Minor

**m1: Out-of-band confirmation channels are suggested but not mandated.**

- **Source:** account-hijack, credential-compromise.
- **Detail:** The implementation describes "phone callback, signed PDF, DMARC alignment check" as options that would catch compromised-inbox reply forgery, but does not mandate any of them as part of the baseline SOP. This is an AMBIGUOUS case — tightening the SOP to require at least one out-of-band channel would partially close the account-takeover gap.

**m2: Event-triggered re-verification on HR/directory changes is aspirational.**

- **Source:** dormant-account-takeover.
- **Detail:** The SOP lists "a known org-renaming or M&A event" and changes in institutional contact email domain as event triggers, but does not specify a concrete integration with institutional HR systems or directories. The dormant-account story is caught only if the annual cycle fires before the IT admin redirects the inbox.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Time-aged domain + clean order history | gradual-legitimacy-accumulation | MISSED |
| Aged domain auction purchase | gradual-legitimacy-accumulation | MISSED |
| Build entity signals from scratch | shell-company | MISSED |
| Acquire existing company | shell-company | AMBIGUOUS |
| Gradual order escalation | shell-company | MISSED |
| Build light order history (1–3 months) | biotech-incubator-tenant | MISSED |
| Buy aged dormant biotech LLC | biotech-incubator-tenant | AMBIGUOUS |
| Bulk-order noise cover (core facility) | bulk-order-noise-cover | MISSED |
| Temporal noise escalation | bulk-order-noise-cover | MISSED |
| Inherited footprint (PI takeover) | account-hijack | MISSED |
| Account takeover of verified customer | credential-compromise | MISSED |
| Inherited footprint (dormant account) | dormant-account-takeover | CAUGHT |
| Passively constrain order profile | dormant-account-takeover | MISSED |
| Gradual volume ramp | dormant-account-takeover | MISSED |

## bypass_methods_uncovered

- Time-aged domain + clean order history (gradual-legitimacy-accumulation)
- Aged domain auction purchase (gradual-legitimacy-accumulation)
- Build entity signals from scratch (shell-company)
- Gradual order escalation (shell-company)
- Build light order history (biotech-incubator-tenant)
- Bulk-order noise cover (bulk-order-noise-cover)
- Temporal noise escalation (bulk-order-noise-cover)
- Inherited footprint — PI takeover (account-hijack)
- Account takeover of verified customer (credential-compromise)
- Passively constrain order profile (dormant-account-takeover)
- Gradual volume ramp (dormant-account-takeover)

---

## Verdict

**RE-RESEARCH** — One Critical finding (C1: positive-confirmation self-confirmation). The gap is partially addressable by mandating independent-contact verification, which stage 4 should incorporate. The gap remains structural for purpose-built-organization branches where no independent contact exists, but tightening the SOP for the account-takeover branches is worthwhile.
