# m14-cross-tenant-biometric-dedup — Bypass-aware hardening v1

- **measure:** M14 — identity-evidence-match
- **idea:** Cross-tenant biometric dedup (1:N face-template matching across provider's customer base)

---

## Attacker story walk

### Group A: Identity-theft branches with active IDV-pipeline bypasses

**Stories 1–4: account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A)**

These four stories share overlapping bypass methods aimed at IAL2 IDV pipelines. Grouped because the biometric-dedup check interacts with them identically.

**Bypass methods and classification:**

- **Deepfake injection against IDV vendor liveness flow** (stories 1, 2, 3, 4)
  - **AMBIGUOUS** — If the injected face is a synthetic novel face, the 1:N dedup produces no collision (no prior template to match). If the injected face is the victim's real face (reconstructed from photos), the 1:N dedup sees a match to the victim's existing template, which looks like a legitimate 1:1 re-verification pass, not a dedup hit. The check catches the attacker only if the attacker reuses their own real face across multiple fake identities — a narrow scenario. Detail not pinned down: whether the implementation distinguishes "same face matching same identity" (expected) from "same face matching a different identity" (suspicious).

- **Face morphing on forged/altered government document** (stories 1, 2, 3)
  - **MISSED** — A morphed face that blends the attacker and victim can pass the 1:1 face-match against the document portrait AND may not collide with either party's prior template at the dedup threshold (morphs sit between two face clusters). The dedup check is designed for exact duplicates, not morphs.

- **IDV-session handoff exploit** (story 1)
  - **MISSED** — Session handoff means the attacker initiates on the victim's account but a different device completes liveness. The resulting template is the real person's face who completed liveness. Dedup would only flag this if that person already has another identity on file.

- **ATO inherits prior IAL2 pass** (story 2)
  - **MISSED** — No new biometric is submitted; no dedup check is triggered. The bypass pre-empts the check entirely.

- **Social-engineer support for manual override** (stories 2, 3)
  - **MISSED** — Bypasses the automated pipeline entirely. Dedup cannot engage if the flow is overridden by a human.

- **Injection attack against weak vendor SDK ($5-30K rig)** (story 4)
  - **AMBIGUOUS** — Same logic as deepfake injection above. Whether the injected face collides with a prior template depends on the face used and whether the attacker has other identities on file.

**Net assessment for stories 1-4:** The biometric-dedup check provides minimal value against identity-theft attacks. These attackers are not enrolling multiple identities — they are impersonating a single victim. The check's value proposition (catching one face across multiple identities) does not match these attackers' operational pattern.

---

### Story 5: cro-identity-rotation (Branch B) — purpose-built

**Bypass methods:**

- **IDV-vendor-aware provider selection: picks at most one provider per IDV vendor**
  - **MISSED** — This is the structural cross-vendor gap the implementation document itself acknowledges. The check only deduplicates within a single provider's tenant. The attacker explicitly routes around this by using each provider only once per IDV vendor.

- **Fresh real human accomplice per provider persona**
  - **MISSED** — Each accomplice is a unique real person with a unique real face. No biometric collision occurs because the face templates are genuinely different.

**Net assessment:** The check is directly designed for this story but both bypass methods slip through. Within-tenant dedup catches only accomplice reuse at the same provider; the branch avoids that by design.

---

### Story 6: shell-nonprofit (Branch E) — purpose-built

**Bypass method:**

- **Accomplice completes IAL2 with real face and real ID**
  - **CAUGHT (partially)** — If the same accomplice serves as the fronted principal for multiple shell nonprofits at the same provider, the 1:N dedup catches the collision (same face, different identity/organization). **MISSED** if the accomplice is dedicated to a single entity.

**Net assessment:** Catches accomplice reuse across entities at the same provider. Does not catch the single-entity case.

---

### Story 7: biotech-incubator-tenant (Branch D) — purpose-built

**Bypass methods:**

- **1a: attacker uses own real ID**
  - **CAUGHT (partially)** — Only if the attacker has another identity on file at the same provider. If this is their only account, no collision.

- **1b: accomplice in own real identity**
  - **CAUGHT (partially)** — Same logic: only on accomplice reuse.

**Net assessment:** Same as shell-nonprofit. Value only on reuse.

---

### Story 8: bulk-order-noise-cover (Branch E) — exploit-affiliation

**Bypass method:**

- **Shared-account IAL2 belongs to predecessor facility manager**
  - **MISSED** — The current orderer is a different person but no new biometric is submitted (they use the institutional account with the prior IAL2 on file). Dedup only fires when a new biometric template is captured.

**Net assessment:** Check does not engage because no fresh biometric is presented.

---

### Story 9: it-persona-manufacturing (Branch B) — exploit-affiliation

**Bypass methods:**

- **Same-domain two-persona self-vouching**
  - **CAUGHT** — If one real person completes IAL2 for both personas at the same provider, the 1:N dedup catches the face collision (same face, two identity records). This is a core strength of the check.

- **Second persona requires accomplice or biometric collision risk**
  - **CAUGHT** if the same real person does both; **MISSED** if a genuine second person is recruited.

**Net assessment:** Meaningfully reduces the viability of one-person multi-persona schemes at a single provider. Defeated if the attacker recruits a second real human.

---

### Story 10: inbox-compromise (Branch B) — fake-affiliation

**Bypass method:**

- **Branch sidesteps IAL2 entirely by acting through email**
  - **MISSED** — No biometric is submitted; the check never engages.

**Net assessment:** Zero engagement.

---

### Stories 11-19: Real-identity branches (shell-company, foreign-institution, gradual-legitimacy, insider-recruitment, lab-manager-voucher, unrelated-dept-student, visiting-researcher, community-bio-lab-network, cro-framing)

**Bypass method (all):**

- **Attacker/accomplice uses own real ID throughout**
  - **CAUGHT (partially)** — Only if the same real person appears under different identities at the same provider. For single-identity-per-person branches, no collision. **MISSED** for all branches where each person maintains exactly one identity.

**Net assessment:** Dedup adds a deterrence/audit signal for multi-identity reuse at a single provider. For single-identity-per-person attackers (the majority of these branches), zero detection value.

---

## Findings

### Critical

**C1: Cross-vendor dedup gap is structural and acknowledged but unmitigated.**
- **Source:** cro-identity-rotation (story 5).
- **Why missed:** The implementation can only dedup within a single provider's tenant. No cross-provider biometric sharing exists commercially. The attacker branch is explicitly designed to exploit this gap.
- **Suggestion:** No implementation-level fix exists. This is a structural gap that would require an industry-level shared biometric blocklist (analogous to UIDAI Aadhaar). Flag for human review as a policy/industry recommendation, not a technical tightening.
- **Severity rationale:** Classified Critical because the check's primary stated use case is catching identity rotation, and the most sophisticated rotation branch explicitly defeats it.

### Moderate

**M1: Face morphing bypasses dedup thresholds.**
- **Source:** account-hijack (story 1), credential-compromise (story 2), dormant-account-takeover (story 3).
- **Why missed:** Morphed faces sit between two face clusters and may not trigger the similarity threshold in either direction. Dedup is designed for exact duplicates, not morphs.
- **Suggestion:** Morph detection is a different ML problem (morph-attack detection / MAD). Could be added as a separate check but is outside the scope of biometric dedup.

**M2: ATO-inherited IAL2 and shared-account scenarios pre-empt the check.**
- **Source:** credential-compromise (story 2), bulk-order-noise-cover (story 8).
- **Why missed:** No new biometric is captured; the dedup check never fires. The bypass is that no fresh IDV is triggered.
- **Suggestion:** Addressed by other M14 ideas (order-time step-up, FIDO2) rather than by biometric dedup.

**M3: Accomplice-per-entity branches defeat dedup unless accomplice is reused.**
- **Source:** shell-nonprofit (story 6), biotech-incubator-tenant (story 7), cro-identity-rotation (story 5).
- **Why missed:** Each entity has a unique real human; no biometric collision.
- **Suggestion:** Structural; no technical fix within biometric dedup. Cross-measure mitigation (M18 entity verification, M9 beneficial-ownership checks) is the relevant countermeasure.

### Minor

**m1: Similarity-threshold tuning for morph vs duplicate not specified.**
- **Source:** Implementation doc specifies 0.85-0.95 threshold ranges but does not discuss morph-attack-detection-aware threshold calibration.
- **Suggestion:** Specify that the threshold is for duplicate detection only and that MAD is a separate capability.

**m2: Cold-start problem not quantified in terms of detection lag.**
- **Source:** Implementation doc notes ~1,000+ templates needed but does not estimate how long a new provider would operate before the database becomes useful.
- **Suggestion:** Minor; stage 6 coverage research can quantify.

---

## bypass_methods_known

| Bypass method | Classification | Source stories |
|---|---|---|
| Deepfake injection (novel synthetic face) | AMBIGUOUS | 1, 2, 3, 4 |
| Deepfake injection (victim's reconstructed face) | MISSED | 1, 2, 3 |
| Face morphing on forged document | MISSED | 1, 2, 3 |
| IDV-session handoff | MISSED | 1 |
| ATO inherits prior IAL2 (no fresh biometric) | MISSED | 2, 8 |
| Social-engineer support for manual override | MISSED | 2, 3 |
| Injection against weak vendor SDK | AMBIGUOUS | 4 |
| Cross-vendor provider routing (one provider per IDV vendor) | MISSED | 5 |
| Fresh real accomplice per persona | MISSED | 5, 6, 7 |
| Accomplice reuse across entities at same provider | CAUGHT | 6, 7, 9 |
| Same-person multi-persona at same provider | CAUGHT | 9 |
| Email-only ordering (bypass portal) | MISSED | 10 |
| Real ID throughout (single identity per person) | MISSED | 11-19 |

## bypass_methods_uncovered

- Face morphing on forged document
- IDV-session handoff
- ATO inherits prior IAL2 (no fresh biometric)
- Social-engineer support for manual override
- Cross-vendor provider routing
- Fresh real accomplice per persona (unique per entity)
- Email-only ordering (bypass portal)
- Real ID throughout (single identity per person)
- Deepfake injection of victim's reconstructed face

---

## Verdict: **STRUCTURAL**

One Critical finding (C1: cross-vendor dedup gap) exists but is structural — no implementation-level tightening can address it. The gap requires an industry-level shared biometric blocklist that does not exist. Pipeline continues; finding routed to human review.
