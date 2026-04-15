# m17-predecessor-reidv — bypass-aware hardening v1

- **measure:** M17 (pre-approval-list)
- **idea:** Predecessor pre-approval re-IAL2 + re-bind

---

## Attacker story walk

### 1. gradual-legitimacy-accumulation

**Summary:** Patient operator builds an LLC over 6–12 months, places clean non-SOC orders, eventually achieves pre-approval, then orders SOC.

**Bypass methods relevant to this measure:**

- **Method 1 — Time-aged domain and clean order history.** 12 months of clean orders under the attacker's own real identity.
  - **CAUGHT.** When the pre-approved entity places a SOC order, the re-IAL2 + re-bind fires. The submitting individual must complete a fresh IAL2 event bound to the specific order. The attacker uses their own real identity throughout this branch — the re-IAL2 succeeds because the attacker's identity is genuine. However, the re-bind *does* create a per-order biometric commitment, which:
    - Strengthens the audit trail: each SOC order has a timestamped IAL2 artifact tied to the attacker's real face and document.
    - Does NOT prevent the order: the check verifies identity, not intent. The attacker passes IAL2 because their identity is real.
  - **Net: CAUGHT for attribution / deterrence. MISSED for prevention.** The check raises the attribution cost for the attacker (biometric commitment per order) but does not block the order.

- **Method 2 — Aged domain auction purchase.** Same as Method 1 — identity is real.
  - **Same classification as Method 1.**

**Net assessment:** The check meaningfully increases attribution risk for this story (per-order biometric commitment) but does not prevent the order. Whether this is "caught" depends on the policy question of whether deterrence-through-attribution is sufficient.

---

### 2. shell-company

**Summary:** Delaware LLC built to look like a real biotech, or acquired going concern.

**Bypass methods relevant to this measure:**

- **Build from scratch.** Attacker uses their own real identity.
  - **CAUGHT for attribution, MISSED for prevention.** Same as gradual-legitimacy — re-IAL2 succeeds because the identity is real.

- **Acquire existing company.** New principal takes over the entity and its pre-approved account.
  - **CAUGHT.** The re-IAL2 surfaces the `predecessor_rebind_name_mismatch` flag — the new individual's IAL2-verified name does not match the predecessor account holder's name on file. The manual review handoff then triggers: the reviewer compares identities, requires institutional confirmation of a legitimate handoff, and re-screens the new individual through m18/m19/m20. This is a genuine catch — the attacker must either:
    - Present as the *same person* as the predecessor (requires deepfake or forged documents to beat liveness + document check — expensive, high expertise).
    - Present as a new individual with a plausible handoff narrative (triggers full re-screening).
  - **Net: CAUGHT for both detection and prevention** (for the acquisition variant specifically).

- **Gradual order escalation.** After initial pre-approval, escalation under real identity.
  - **CAUGHT for attribution, MISSED for prevention.** Same as build-from-scratch.

**Net assessment:** Strong catch for the acquisition variant. Attribution-only for the build-from-scratch variant.

---

### 3. biotech-incubator-tenant

**Summary:** LLC rents bench at incubator, uses incubator brand, attacker uses own identity.

**Bypass methods relevant to this measure:**

- **Build light order history, then SOC.**
  - **CAUGHT for attribution, MISSED for prevention.** Re-IAL2 succeeds because identity is real.

- **Buy aged dormant biotech LLC.** New principal takes over.
  - **CAUGHT.** Same dynamics as shell-company acquisition — `predecessor_rebind_name_mismatch` fires.

**Net assessment:** Same as shell-company: acquisition variant is caught; own-identity variant is attribution-only.

---

### 4. bulk-order-noise-cover

**Summary:** Core facility technician at R1 exploits institutional ordering infrastructure.

**Bypass methods relevant to this measure:**

- **Method A — Bulk-order noise cover.** Core facility tech places SOC order bundled into routine batch.
  - **CAUGHT (conditionally).** The re-IAL2 fires on the SOC order. The submitting individual (the core facility tech) must complete IAL2 bound to this specific order. Two sub-cases:
    - **Per-user facility account:** The tech was the original IAL2'd account holder. Re-IAL2 succeeds; name matches. **CAUGHT for attribution** (per-order biometric commitment), **MISSED for prevention**.
    - **Shared facility account:** The tech is NOT the original IAL2'd account holder (a predecessor opened the account). The `predecessor_rebind_name_mismatch` flag fires. **CAUGHT for both detection and prevention** — the tech must explain who they are and why they're using this account, triggering the legitimate-handoff workflow.
  - The shared-account sub-variant is explicitly highlighted in the m17 attacker mapping ("shared facility provider accounts where the IAL2 biometric on file may belong to a predecessor"). The re-IAL2 idea directly targets this.

- **Method C — Temporal noise escalation.** Same identity, same account.
  - **Same as Method A** — re-IAL2 creates per-order attribution; prevention depends on whether account is shared.

**Net assessment:** Strong catch for the shared-account sub-variant (surfaces unauthorized users of shared accounts). Attribution-only for the per-user variant.

---

### 5. account-hijack

**Summary:** PI email compromise; attacker takes over fully-verified provider account.

**Bypass methods relevant to this measure:**

- **Inherited footprint.** The attacker controls the PI's email but is a different physical person.
  - **CAUGHT.** The re-IAL2 fires on the SOC order. The attacker must present a face and document. Two outcomes:
    - **Attacker presents own identity:** `predecessor_rebind_name_mismatch` fires — the name does not match the PI on file. The attacker is detected and the order is held.
    - **Attacker attempts to impersonate the PI:** must defeat liveness detection + document matching (present a forged/stolen document matching the PI's name, plus beat selfie-match to the document photo and liveness). This is a high-expertise, non-trivial attack ($300–$1,000+ for high-quality document forgery, plus deepfake risk against liveness). The `predecessor_rebind_low_selfie_match` and `predecessor_rebind_document_tampering` flags are designed to catch this.
  - **Net: CAUGHT.** The re-IAL2 re-bind is the *primary* defense against this attacker story. The attacker must either expose themselves (name mismatch) or invest in a high-cost, high-expertise impersonation of the PI's physical identity.

**Net assessment:** Strong catch. This is the idea's core use case. The per-order re-bind forces the attacker to prove they are the same person who was originally approved — which they are not.

---

### 6. credential-compromise

**Summary:** Remote credential compromise; account takeover of existing verified customer.

**Bypass methods relevant to this measure:**

- **Account takeover of existing verified customer.**
  - **CAUGHT.** Same dynamics as account-hijack. The attacker's IAL2 event produces a name mismatch with the customer on file. The `predecessor_rebind_name_mismatch` flag fires.

**Net assessment:** Strong catch. Same as account-hijack.

---

### 7. dormant-account-takeover

**Summary:** IT admin takes over dormant provider account of departed researcher.

**Bypass methods relevant to this measure:**

- **Bypass A — Inherited footprint.** IT admin uses dormant account.
  - **CAUGHT.** Re-IAL2 fires on SOC order. The IT admin's name does not match the departed researcher's. `predecessor_rebind_name_mismatch` fires. The implementation's manual review handoff correctly identifies the "different individual, claimed legitimate handoff" and "different individual, no plausible handoff narrative" paths.

- **Bypass B — Passively constrain order profile.** Keeps within historical patterns.
  - **CAUGHT.** Regardless of order patterns, the re-IAL2 fires on each SOC order. The identity mismatch is order-level, not pattern-level.

- **Bypass D — Gradual volume ramp.** Small orders before escalating.
  - **AMBIGUOUS.** If the gradual ramp starts with non-SOC orders, re-IAL2 does not fire (it's SOC-triggered only). The attacker establishes a new pattern of activity under the dormant account before hitting the SOC trigger. When they finally place a SOC order, re-IAL2 fires and catches them. But they've already been actively using the account, potentially alerting (or not alerting) other monitoring systems.

- **Rebind by a sophisticated attacker who controls predecessor's documents.** The implementation's own failure mode notes that an IT admin with access to scanned ID copies in HR could attempt to present the predecessor's identity. Defeated only by strict liveness enforcement.
  - **AMBIGUOUS.** Depends on liveness-detection rigor. The implementation notes "NIST IAL2's biometric requirement defeats this only if liveness is enforced strictly." If the vendor's liveness detection is robust (which is the current state of the art for major vendors), this is caught. If not, it's missed.

**Net assessment:** Strong catch. The re-IAL2 directly defeats the dormant-account branch by forcing the current operator to prove they are the person originally approved. This is the idea's second core use case (alongside account-hijack).

---

## Findings

### Moderate

**M1: Re-IAL2 provides attribution but not prevention for own-identity purpose-built-organization branches.**

- **Source:** gradual-legitimacy-accumulation (Method 1), shell-company (build-from-scratch), biotech-incubator-tenant (own-identity variant).
- **Why:** The attacker uses their own real identity throughout. Re-IAL2 succeeds because the identity is genuine. The check creates a per-order biometric commitment that strengthens the audit trail and raises attribution risk, but does not block the order. This is by design (the idea targets identity-inheritance, not fabricated-identity), but it means the idea provides no *preventive* signal against these stories.
- **Suggestion:** No field-set change — the idea is correctly scoped. Document the attribution-vs-prevention distinction. Prevention for own-identity branches comes from m18/m19/m20 (institutional and individual legitimacy checks), not from identity re-binding.

**M2: Non-SOC orders are not covered by re-IAL2.**

- **Source:** dormant-account-takeover (Bypass D — gradual volume ramp); bulk-order-noise-cover (Method A, for non-SOC components of mixed batches).
- **Why:** Re-IAL2 fires only on SOC orders. An attacker who uses a dormant/shared account for non-SOC orders first builds activity without triggering the check. This is a design choice (IAL2 per order is expensive in user friction), not a bug, but it means the check is blind to the ramp-up phase.
- **Suggestion:** Consider whether a lighter-weight identity check (e.g., MFA step-up without full IAL2) should fire on *any* order from an account that has been dormant for > N months, not just SOC orders. This would catch the dormant-account ramp phase. However, this increases friction for legitimate account reactivations.

### Minor

**m1: Liveness detection rigor is the load-bearing assumption for dormant-account-takeover with HR document access.**

- **Source:** dormant-account-takeover (IT admin with access to scanned IDs).
- **Detail:** The implementation acknowledges this and names it as a failure mode. The fix is to mandate presentation-attack-detection (PAD) Level 2 at minimum, which major vendors (Persona, Onfido, Jumio) now offer. AMBIGUOUS because the implementation does not specify which PAD level is required.

**m2: Legitimate-handoff friction may be high in academic settings.**

- **Source:** All stories that trigger `predecessor_rebind_name_mismatch`.
- **Detail:** Staff turnover, postdoc transitions, and lab-manager changes are routine in academia. Each triggers the full re-screening workflow (institutional confirmation + m18/m19/m20 re-screening). The implementation acknowledges this under false_positive_qualitative but does not estimate the volume or propose a streamlined path for institutions with verified HR integrations.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Time-aged domain + clean order history | gradual-legitimacy-accumulation | CAUGHT (attribution) / MISSED (prevention) |
| Aged domain auction purchase | gradual-legitimacy-accumulation | CAUGHT (attribution) / MISSED (prevention) |
| Build entity signals from scratch | shell-company | CAUGHT (attribution) / MISSED (prevention) |
| Acquire existing company | shell-company | CAUGHT |
| Gradual order escalation | shell-company | CAUGHT (attribution) / MISSED (prevention) |
| Build light order history | biotech-incubator-tenant | CAUGHT (attribution) / MISSED (prevention) |
| Buy aged dormant biotech LLC | biotech-incubator-tenant | CAUGHT |
| Bulk-order noise cover (per-user account) | bulk-order-noise-cover | CAUGHT (attribution) / MISSED (prevention) |
| Bulk-order noise cover (shared account) | bulk-order-noise-cover | CAUGHT |
| Temporal noise escalation | bulk-order-noise-cover | CAUGHT (attribution) / MISSED (prevention) |
| Inherited footprint (PI takeover) | account-hijack | CAUGHT |
| Account takeover of verified customer | credential-compromise | CAUGHT |
| Inherited footprint (dormant account) | dormant-account-takeover | CAUGHT |
| Passively constrain order profile | dormant-account-takeover | CAUGHT |
| Gradual volume ramp (non-SOC ramp phase) | dormant-account-takeover | AMBIGUOUS |
| IT admin with HR document access | dormant-account-takeover | AMBIGUOUS |

## bypass_methods_uncovered

- Time-aged domain + clean order history — prevention (gradual-legitimacy-accumulation)
- Build entity signals from scratch — prevention (shell-company)
- Gradual order escalation — prevention (shell-company)
- Build light order history — prevention (biotech-incubator-tenant)
- Bulk-order noise cover (per-user account) — prevention (bulk-order-noise-cover)
- Temporal noise escalation — prevention (bulk-order-noise-cover)
- Gradual volume ramp, non-SOC ramp phase (dormant-account-takeover)

Note: the "uncovered" items above are prevention-only misses; the check provides attribution signal (per-order biometric commitment) for all of them.

---

## Verdict

**PASS** — No Critical findings. The idea is correctly scoped to its core use case (closing identity-inheritance gaps in pre-approval). It is strongly effective against account-hijack, credential-compromise, dormant-account-takeover, and the acquisition sub-variants of shell-company and biotech-incubator-tenant. It provides attribution-only signal (not prevention) against own-identity purpose-built-organization branches, which is by design. The two Moderate findings (attribution-vs-prevention distinction; non-SOC order gap) are design tradeoffs, not field-set bugs.
