# m12-billing-shipping-consistency — bypass-aware hardening v1

- **measure:** M12 (billing-institution-association)
- **implementation reviewed:** `04-implementation-v1.md`

## Attacker-story walkthrough

### 1. dormant-account-takeover

**Summary:** Successor or unauthorized user takes over an inherited institutional synthesis-provider account.

**Bypass methods relevant to this measure:**

- **Bypass A — Use inherited institutional PO / P-card / billing code.**
  - **Classification: MISSED.** The billing address on the inherited P-card matches the institution by construction. The triple (billing, shipping, institution) is fully consistent. The rules engine passes. The implementation has no mechanism to detect that the *person* using the card is not the authorized cardholder — it checks address consistency, not cardholder identity.

- **Bypass B — Inherited invoice / net-terms billing.**
  - **Classification: MISSED.** Invoice billing routes through the institution's AP system. The billing address is the institution's own address. Triple is consistent. Rules engine passes.

- **Bypass C — Modify PO budget code via finance-system access.**
  - **Classification: MISSED.** Same as Bypass B — the billing address remains institutional regardless of which budget code funds the order. The rules engine sees only addresses, not budget-code provenance.

- **Bypass D — Substituted personal card (failure mode).**
  - **Classification: CAUGHT.** The attacker's personal card has a billing address that does not match the institution. The `billing_institution_postal_mismatch` subflag fires. The implementation explicitly names this pattern as a target case. The `billing_residential_on_institutional_order` subflag may also fire if the personal address is residential per Smarty RDI.

**Net assessment:** The check catches Bypass D (the weak fallback path) but misses Bypasses A–C (the dominant inherited-billing paths). This is structurally expected: the source file frames Bypasses A–C as existing *precisely to avoid tripping* the consistency check, and they succeed because the billing address is genuinely institutional. The check narrows the attacker to inherited billing (time-limited) rather than personal cards (indefinite).

---

### 2. dormant-domain

**Summary:** Lone operator reanimates a defunct research entity's lapsed domain and presents as its successor.

**Bypass methods relevant to this measure:**

- **Bypass A — Personal card, org-name-mismatch accepted (permissive providers).**
  - **Classification: CAUGHT (partially).** At a provider deploying this check, the billing address on a personal card would diverge from the claimed institution's canonical address (the reanimated entity likely has no physical address matching the attacker's). The `billing_institution_postal_mismatch` or `billing_shipping_metro_mismatch` flag fires — unless the attacker lives near the defunct institution's last known address. The source file conditions M5 binding on "org-name-match between the payer and the verified organization." This implementation checks address consistency, not name match — so it partially catches the geographic component but misses the name component.

- **Bypass B — LLC + EIN + fintech business account.**
  - **Classification: AMBIGUOUS.** The attacker forms a Delaware LLC and opens a fintech business account. The LLC's registered address (typically a Delaware registered-agent address) would not match the reanimated institution's last-known canonical address. If the provider's institution-resolution (m05/m18) stores the reanimated entity's historical address, the triple would show billing (DE registered agent) vs. institution (wherever the defunct entity was). This would fire `billing_institution_postal_mismatch`. However, if the attacker registers the LLC at an address near the institution's historical location, or if the institution-resolution system accepts the LLC as the institution, the triple aligns. **The detail the implementation doesn't pin down:** how the institution canonical address is set for a reanimated/defunct entity. This depends on m05/m18 outputs.

**Net assessment:** The check provides meaningful friction for the personal-card path (Bypass A) by catching address divergence, but misses the name-match dimension. For the LLC path (Bypass B), effectiveness depends on how the institution canonical address is resolved — an unresolved dependency on m05/m18.

---

### 3. account-hijack

**Summary:** Attacker compromises a PI's email and takes over their pre-existing synthesis-provider account.

**Bypass methods relevant to this measure:**

- **Inherited payment methods (no bypass needed).**
  - **Classification: MISSED.** The PI's payment methods are already on file. Billing routes to the institution. The triple is fully consistent. The rules engine passes.

- **Method 2 — Social-engineered address change to attacker-controlled drop.**
  - **Classification: CAUGHT.** If the attacker adds a new shipping address (the "collaborator lab" or "satellite facility" drop), the `shipping_institution_postal_mismatch` flag fires when the new shipping address is far from the institution's canonical address. The source file explicitly cites "billing/shipping address mismatch" as the alert this bypass tries to avoid. The implementation's metro-distance check (> 50 km = soft flag, > 1,000 km = hard flag) catches this unless the drop is near the institution.

**Net assessment:** The check catches Method 2 (address-change path) but not the inherited-billing base case. The source file itself says Method 2's billing/shipping mismatch "argues against the address-change path" — this check is the mechanism that creates that argument. Effective for its intended purpose.

---

### 4. inbox-compromise

**Summary:** Attacker compromises an institutional inbox and orders using their own real personal card.

**Bypass methods relevant to this measure:**

- **Method 1 — Own real card, target selected within driving distance.**
  - **Classification: MISSED.** The attacker deliberately selects target institutions within driving distance of their own home address. The personal card's billing address is in the same metro area as the institution. The triple is geographically consistent: billing (attacker's home, nearby), shipping (attacker's home or institution), institution (nearby). The rules engine's distance check passes because all three are within 50 km. The implementation document explicitly identifies this as a structural limitation in the `failure_modes_requiring_review` section.

- **Method 2 — Prepaid virtual card.**
  - **Classification: AMBIGUOUS.** A prepaid virtual card may have a synthetic or minimal billing address. Whether the triple-consistency check catches it depends on what billing address the prepaid card returns to the PSP. If the PSP returns a billing address at all (some prepaid cards have no billing address on file), the check would flag the missing/mismatched billing. But this is primarily an m10 concern, not m12.

- **Method 3 — Small-LLC business card.**
  - **Classification: AMBIGUOUS.** Depends on where the LLC is registered relative to the target institution. If the attacker forms the LLC near the target institution (which they have already selected for geographic proximity), the LLC billing address aligns with the institution and the check passes. If the LLC is registered elsewhere (Delaware registered agent), the check catches the divergence. The detail the implementation doesn't pin down: whether the LLC address or the card's billing address (which might differ from the LLC's registered address) is what the PSP reports.

**Net assessment:** The check fails against Method 1, which is the branch's primary path. The attacker engineered geographic proximity specifically to defeat this control. This is a known structural limitation — the check catches geographic divergence, not identity divergence. The implementation already documents this.

---

### 5. credential-compromise

**Summary:** Attacker operates under a real institution's identity via compromised credentials.

**Bypass methods relevant to this measure:**

- **Invoiced order (dominant).**
  - **Classification: MISSED.** The attacker orders on institutional invoice. Billing is the institution's own AP address. The triple is consistent. The rules engine passes.

- **Credit card in the target's name (cloned/fraudulent).**
  - **Classification: CAUGHT (partially).** A cloned card in the target's name would have the target's billing address, which should match the institution. The triple is consistent and the rules engine passes — but the cloned card is a fraud on the card issuer, not on the synthesis provider's address-consistency check. A fraudulent new-card application in the target's name at the target's address would also pass. **However**, if the cloned card has a billing address different from the institution (e.g., the target's home address rather than the institution's address), the `billing_institution_postal_mismatch` flag would fire.

**Net assessment:** The invoiced-order path (dominant) bypasses the check by construction. The cloned-card fallback may or may not trip the check depending on the target's billing address. The check provides minimal friction for this branch.

---

### 6. shell-company

**Summary:** Newly incorporated Delaware LLC with real business address, bank account.

**Bypass methods relevant to this measure:**

- **Satisfied by construction.**
  - **Classification: MISSED.** The LLC bank account's billing address matches the LLC's registered "institutional" address. The triple is consistent. The rules engine passes. The branch's entire design is to satisfy these checks by construction.

**Net assessment:** Zero friction. The check is structurally blind to purpose-built organizations whose billing and institutional addresses match.

---

### 7. shell-nonprofit

**Summary:** Shell research nonprofit with name-collision trick.

**Bypass methods relevant to this measure:**

- **Open a business bank account and pay normally.**
  - **Classification: MISSED.** Same as shell-company: the business bank account's billing address matches the entity's registered address. The triple is consistent. The source file notes a secondary friction: "fintech BIN sponsor appearing instead of entity name in payment metadata" — but that is a name-match issue, not an address-consistency issue. This implementation checks addresses, not names.

**Net assessment:** Zero friction. Same structural blindness as shell-company.

---

### 8. cro-framing / cro-identity-rotation / biotech-incubator-tenant / community-bio-lab-network / gradual-legitimacy-accumulation

**Summary:** Five LLC-based branches. All open real LLC business bank accounts whose billing addresses match the LLC's registered address.

**Bypass methods relevant to this measure:**

- **All: satisfied by construction.**
  - **Classification: MISSED (all five).** Real LLC bank account, billing address matches registered address. Triple is consistent. Rules engine passes.

**Net assessment:** Zero friction across all five branches. Same structural blindness as shell-company and shell-nonprofit: the check cannot distinguish a purpose-built shell from a legitimate small biotech when all three addresses align.

---

## bypass_methods_known

| Story | Bypass | Classification |
|---|---|---|
| dormant-account-takeover | A — inherited PO/P-card | MISSED |
| dormant-account-takeover | B — inherited invoice | MISSED |
| dormant-account-takeover | C — modified budget code | MISSED |
| dormant-account-takeover | D — substituted personal card | CAUGHT |
| dormant-domain | A — personal card (permissive) | CAUGHT (partially — address only, not name) |
| dormant-domain | B — LLC + fintech bank account | AMBIGUOUS |
| account-hijack | inherited payment | MISSED |
| account-hijack | Method 2 — address-change drop | CAUGHT |
| inbox-compromise | Method 1 — own card, driving distance | MISSED |
| inbox-compromise | Method 2 — prepaid virtual card | AMBIGUOUS |
| inbox-compromise | Method 3 — small-LLC card | AMBIGUOUS |
| credential-compromise | invoiced order | MISSED |
| credential-compromise | cloned card | CAUGHT (partially) |
| shell-company | satisfied by construction | MISSED |
| shell-nonprofit | business bank account | MISSED |
| cro-framing | LLC bank account | MISSED |
| cro-identity-rotation | LLC bank account | MISSED |
| biotech-incubator-tenant | LLC bank account | MISSED |
| community-bio-lab-network | LLC bank account | MISSED |
| gradual-legitimacy-accumulation | LLC bank account | MISSED |

## bypass_methods_uncovered

- **Inherited institutional billing** (dormant-account-takeover A/B/C, account-hijack inherited, credential-compromise invoiced): the check cannot detect when a legitimate institutional payment method is used by an unauthorized person.
- **Geographic-proximity target selection** (inbox-compromise Method 1): the attacker engineers address consistency by selecting nearby institutions.
- **Purpose-built organization with aligned addresses** (shell-company, shell-nonprofit, all five LLC-cluster branches): the check is structurally blind to entities that satisfy billing-institution consistency by construction.

## Findings

### Finding 1 — Moderate

**Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation (7 branches).

**What the implementation misses:** All purpose-built-organization branches satisfy the triple-consistency check by construction. The LLC bank account's billing address matches the LLC's "institutional" address. This is the largest class of bypasses by branch count.

**Why:** The implementation checks address consistency, not whether the institution is a legitimate research organization. That distinction is the job of m09/m18 (institution-legitimacy checks), not m12. This is a structural limitation of the measure, not a fixable gap in the implementation.

**Severity rationale:** Moderate, not Critical, because (a) this is a known structural limitation of address-consistency checks — they verify internal consistency, not legitimacy; (b) the purpose-built-organization branches are addressed by other measures (m09 institution-legitimacy, m18 accreditation); (c) the implementation cannot reasonably be tightened to catch this without becoming a different measure.

### Finding 2 — Moderate

**Source:** inbox-compromise Method 1 (driving-distance target selection).

**What the implementation misses:** The attacker defeats the check by selecting target institutions within driving distance, ensuring the personal card's billing address is in the same metro area. The triple passes the distance threshold.

**Why:** The check catches geographic divergence, not "wrong person at the right place." The implementation already documents this as a structural limitation in `failure_modes_requiring_review`.

**Severity rationale:** Moderate. The bypass requires the attacker to constrain their target set to nearby institutions, which is a real operational cost (reduces the pool of viable targets). The implementation correctly self-diagnoses this limitation. No re-research needed.

### Finding 3 — Minor

**Source:** dormant-domain Bypass B (LLC + fintech bank account).

**What the implementation misses / leaves ambiguous:** The check's effectiveness against the LLC path depends on how the institution canonical address is set for a reanimated/defunct entity. If m05/m18 resolves the reanimated entity's historical address, the LLC billing address (Delaware registered agent) would diverge and the check catches it. If the institution-resolution system accepts the LLC or its address as the institution, the check passes.

**Why:** The implementation's dependency on m05/m18 institution-resolution outputs is stated but the behavior for defunct/reanimated entities is not pinned down.

**Suggestion:** Stage 7 synthesis should note this dependency explicitly: the check's value against dormant-domain Bypass B is conditional on m05/m18 correctly resolving the institution canonical address for defunct entities.

### Finding 4 — Minor

**Source:** dormant-domain Bypass A (personal card, org-name-mismatch).

**What the implementation misses:** The implementation checks address consistency but not payer-name-vs-institution-name consistency. The source file conditions M5 binding on "org-name-match between the payer and the verified organization." A cardholder-name-vs-institution-name check is not part of this implementation.

**Why:** The implementation scope is address consistency. Name-match is a different signal (closer to what m12-fintech-denylist touches via issuer-name). This is a design-scope boundary, not a bug.

**Suggestion:** If name-match were added to the rules engine (compare `payment_method.billing_details.name` to the institution name), it would catch Bypass A for dormant-domain and the cloned-card fallback for credential-compromise. This could be a stage 4 refinement if prioritized, but it is a scope expansion, not a fix to the current implementation.

## Verdict

**PASS** — no Critical findings. Two Moderate findings are structural limitations that the implementation already acknowledges or that are addressed by other measures. Two Minor findings identify ambiguities and a potential scope expansion. Pipeline continues to stage 6.
