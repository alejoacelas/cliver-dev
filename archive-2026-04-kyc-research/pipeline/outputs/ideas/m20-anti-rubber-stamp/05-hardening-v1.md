# m20-anti-rubber-stamp — Bypass-aware hardening v1

**Idea under review:** `m20-anti-rubber-stamp/04-implementation-v1.md`
**Measure:** M20 — Voucher-legitimacy (SOC)

---

## Attacker story walk

### lab-manager-voucher

**Summary:** Insider exploits PI/BSO rubber-stamping. Seven sub-variants enumerated in the source.

**Bypass methods relevant to M20:**

- **(b) PI rubber-stamps (modal path):** "The PI clicks approve without reading the sequence context because hundreds of prior approvals were legitimate." Cost: $0.
  - **Classification: CAUGHT (partially).** The `voucher_turnaround_fast` flag (<60 seconds) catches PIs who click-approve instantly. The `voucher_rate_exceeded` flag catches PIs whose vouching volume exceeds thresholds. But the implementation acknowledges: "A PI who rubber-stamps moderately (5/quarter) is invisible to volume thresholds." And a PI who takes 2 minutes to rubber-stamp (reads subject line, clicks approve) evades the 60-second turnaround flag.
  - **Net: MISSED for moderate-volume, not-instant rubber-stamps.** The modal path is exactly a PI who approves quickly but not *instantly*, for a handful of orders.

- **(a) Attacker is the registered voucher:** "the attacker approves their own orders."
  - **Classification: MISSED.** The implementation says "does not catch: the attacker's vouching volume is low because they vouch only for themselves." One self-vouch per quarter is well under any threshold. The `voucher_ring_detected` flag would not fire because a self-vouch is a loop of length 1, and the implementation checks cycles ≤ 4 — but a self-loop requires cross-checking IAL2 records between contacts, which is a different check (not in this SOP).

- **(b') BSO-as-voucher:** "BSO volume-driven rubber-stamping."
  - **Classification: CAUGHT (partially).** BSOs vouch for many people by job design → `voucher_rate_exceeded` fires. The audit playbook spot-checks 3 vouches. Whether the audit catches the SOC order depends on the sample: if only 1 of 50 vouches is malicious, the probability of the spot-check catching it in a sample of 3 is ~6%.
  - **Suggestion the implementation does not make:** weighted sampling toward SOC orders (rather than uniform random) would materially improve detection.

- **(b'') Ghost / inactive second contact:**
  - **Classification: MISSED.** This sub-variant involves a stale contact, not an active vouching event. No vouching velocity to detect.

- **(b''') Stale voucher on long-tenured accounts:**
  - **Classification: MISSED.** Same — no active vouching volume anomaly.

- **(c) Clinical / affiliate delegated batch vouching:**
  - **Classification: CAUGHT (partially).** Batch-level vouching produces high volume → `voucher_rate_exceeded` fires. But the implementation's audit samples 3 vouches from the batch. The individual SOC order is one among hundreds of legitimate batch items.

- **(d) Recruit PI/BSO as co-conspirator:**
  - **Classification: MISSED.** A recruited co-conspirator vouches deliberately. Their vouching pattern is indistinguishable from legitimate vouching (normal turnaround, normal volume).

**Net assessment:** The SOP catches extreme-volume and instant-turnaround patterns but misses the modal attack: a PI who approves a few orders with 2+ minute turnaround. The BSO audit pathway has weak detection probability for low-prevalence malicious vouches within high-volume legitimate flows.

---

### visiting-researcher

**Summary:** Faculty sponsor vouches for the visitor. Four voucher options.

- **Option 1 — Faculty sponsor as voucher:** The sponsor vouches for 1 visiting researcher — well under any volume threshold. Turnaround may be >60 seconds.
  - **Classification: MISSED.** Volume: 1 vouch. Turnaround: normal. Ring: none.

- **Option 2 — Lab manager / admin as voucher:**
  - **Classification: MISSED.** Lab manager vouches for a small number of people; same as Option 1.

- **Option 3 — Second lab member:**
  - **Classification: MISSED.** Single vouch, normal pattern.

- **Option 4 — Second faculty sponsor:**
  - **Classification: MISSED.** Single vouch.

**Net assessment:** Not binding. All voucher options produce single, normal-looking vouching events.

---

### unrelated-dept-student

**Summary:** Three path families (inherited voucher, straw purchaser, credential compromise).

- **Bypass A — Pre-delegated ordering authority:** Inherits voucher from host lab PI.
  - **Classification: MISSED.** The PI's vouching pattern includes many legitimate vouches; one additional student is invisible.

- **Bypass B — Per-order rubber-stamping by inattentive voucher:**
  - **Classification: CAUGHT (partially).** Only if the PI's approval turnaround is <60 seconds.

- **Bypass G — Straw purchaser via authorized lab member:**
  - **Classification: MISSED.** The straw purchaser places one order; their voucher approves one order. No anomaly.

- **Bypass F — Credential compromise of registered contact:**
  - **Classification: MISSED.** Not a vouching-velocity event.

- **Bypass E — Recruit PI as co-conspirator:**
  - **Classification: MISSED.** Deliberate, normal-looking vouching.

**Net assessment:** Minimal binding. The SOP catches only the fast-turnaround rubber-stamp variant.

---

### shell-nonprofit

**Summary:** Self-vouching from accomplice within the shell; escalation to phishing, credential compromise, gig-platform, or recruited external voucher.

- **Self-vouching from accomplice:** One accomplice vouches for one or two personas in the shell.
  - **Classification: MISSED.** Volume: 1–2 vouches per quarter. Well under threshold.

- **AitM phishing / credential compromise / gig-platform / recruited external voucher:**
  - **Classification: MISSED.** All produce single, isolated vouching events. No volume anomaly.

**Net assessment:** Not binding. Shell operations produce minimal vouching volume by design.

---

### shell-company

**Summary:** Second shell entity as cross-org voucher, recruited external voucher, or social engineering.

- All three bypass methods produce single-vouch events.
  - **Classification: MISSED.** No volume anomaly.

**Net assessment:** Not binding.

---

### insider-recruitment

**Summary:** Recruited insider serves as real voucher.

- **Classification: MISSED.** Recruited insider vouches deliberately; their pattern is normal.

**Net assessment:** Structurally unable to bind.

---

### account-hijack

**Summary:** Hijack the voucher's account and self-approve.

- **Classification: MISSED.** A single hijacked approval does not trigger volume or turnaround flags (the hijacker can take their time).

**Net assessment:** Authentication attack, not vouching-pattern attack.

---

### credential-compromise

**Summary:** Compromise PI/voucher credentials.

- **Classification: MISSED.** Same as account-hijack.

---

### inbox-compromise

**Summary:** Intercept/forge voucher email.

- **Classification: MISSED.** This bypasses the vouching workflow entirely (email-based workflows). The SOP monitors the provider's own vouching system; if the vouching happens via intercepted email outside the system, the SOP sees nothing.

**Net assessment:** Orthogonal. The SOP applies only to in-system vouching.

---

### dormant-account-takeover

**Summary:** Stale registered vouchers on dormant accounts.

- **Classification: MISSED.** The dormant voucher may not have been active recently, but their stale approval (or the absence of fresh vouching) does not trigger volume flags.

---

### biotech-incubator-tenant

**Summary:** Recruit co-tenant or incubator staff as voucher.

- **Classification: MISSED.** Single vouch from a co-tenant. Normal pattern.

---

### community-bio-lab-network

**Summary:** Community-lab peers as vouchers; mutual-vouching norms.

- **Classification: CAUGHT (partially).** If multiple community-lab members vouch for each other, the `voucher_ring_detected` flag (cycles ≤ 4) may fire. Also, the `voucher_diversity_low` flag may fire if all vouches are within the same community lab.
- **But:** The implementation notes "this would force community-lab vouchers into compliance review, with uncertain outcomes." Legitimate community labs may exhibit the same pattern.

**Net assessment:** Some detection for ring-vouching patterns within a small community, but high false-positive risk against legitimate community labs.

---

### cro-framing

**Summary:** Fake "client institution" as voucher, or self-vouch within CRO.

- **Classification: MISSED.** CRO vouching produces isolated events. No volume anomaly.

---

### cro-identity-rotation

**Summary:** Each rotated CRO identity reconstructs a voucher relationship.

- **Classification: MISSED.** Each new identity produces a single vouch. No volume anomaly per identity.

---

### gradual-legitimacy-accumulation

**Summary:** Cultivated long-term voucher relationship.

- **Classification: MISSED.** The cultivated voucher is "one of many legitimate vouches the senior figure issues." Normal pattern.

---

### dormant-domain

**Summary:** Fabricated voucher persona on the same revived domain.

- **Classification: MISSED.** One vouch from a new persona. No volume anomaly.

---

### foreign-institution

**Summary:** Foreign colleague as voucher.

- **Classification: MISSED.** Single vouch from abroad. Normal pattern.

---

### it-persona-manufacturing

**Summary:** Second manufactured persona as in-institution voucher.

- **Classification: MISSED.** Single vouch from a manufactured but credentialed persona. No volume anomaly.

---

### bulk-order-noise-cover

**Summary:** Voucher rubber-stamps within high-volume legitimate flow.

- **Classification: CAUGHT (partially).** The voucher's high volume triggers `voucher_rate_exceeded`. But as with the BSO variant, the spot-check audit has low probability of catching the specific SOC order buried in legitimate volume.

---

## Findings

### Critical

None.

### Moderate

**M1. The modal PI rubber-stamp (moderate volume, 2+ minute turnaround) is invisible.**
- Stories: `lab-manager-voucher` (b), `unrelated-dept-student` (B).
- Why missed: The 60-second turnaround threshold catches only the most careless instant-approval pattern. A PI who takes 90 seconds to skim and approve — the realistic rubber-stamp behavior — evades it. The volume threshold catches only extreme outliers.
- Suggestion: Consider a *content-engagement signal*: did the voucher access the order details page before approving? A "approved without viewing order details" flag would be more discriminating than raw turnaround time. However, this requires UX instrumentation that the implementation document does not discuss.

**M2. Single-shot attacks are structurally invisible to rate-based detection.**
- Stories: `shell-nonprofit`, `shell-company`, `visiting-researcher`, `cro-framing`, `dormant-domain`, `foreign-institution`, `it-persona-manufacturing`.
- Why missed: These attacks produce 1–2 vouching events total, well under any rate threshold. Rate-limiting is designed for pattern detection across many events; it structurally cannot detect isolated events.
- Suggestion: None within this SOP. Single-shot detection requires qualitative voucher assessment (m20-coauthor-graph, m20-dkim-institutional-email), not rate analysis.

**M3. Audit spot-check sampling has low detection probability for rare malicious vouches.**
- Stories: `lab-manager-voucher` (b' BSO), `bulk-order-noise-cover`.
- Why missed: Sampling 3 vouches from a pool of 50+ gives ~6% detection probability per malicious vouch. The implementation does not specify risk-weighted sampling.
- Suggestion: Weight audit sampling toward SOC orders and orders from new/unusual customers.

**M4. No cross-provider visibility.**
- Stories: all.
- Why missed: An attacker using different providers for each order avoids any single provider's detection. The implementation flags this as `[unknown]` — no cross-provider vouching database exists.
- Suggestion: Note as structural; would require IGSC-level coordination.

### Minor

**m1. `voucher_ring_detected` cycle-length cap (≤ 4) may be too short.**
- Story: `community-bio-lab-network`.
- Detail: Rings of length 5–6 in a small community would evade. But extending the cap increases false positives on legitimate cross-vouching networks.
- Suggestion: Parameterize; default 4 seems reasonable.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| PI rubber-stamp (instant, <60s) | lab-manager-voucher (b) | CAUGHT (partially) |
| PI rubber-stamp (moderate, >60s) | lab-manager-voucher (b), unrelated-dept-student (B) | MISSED |
| Self-vouch (attacker is voucher) | lab-manager-voucher (a) | MISSED |
| BSO volume rubber-stamp | lab-manager-voucher (b') | CAUGHT (partially — audit sampling weak) |
| Ghost/stale voucher | lab-manager-voucher (b'', b''') | MISSED |
| Batch vouching (clinical) | lab-manager-voucher (c) | CAUGHT (partially) |
| Recruited co-conspirator voucher | lab-manager-voucher (d), insider-recruitment | MISSED |
| Single-shot sponsor vouch | visiting-researcher (all options) | MISSED |
| Pre-delegated ordering authority | unrelated-dept-student (A) | MISSED |
| Straw purchaser | unrelated-dept-student (G) | MISSED |
| Credential compromise of voucher | unrelated-dept-student (F), credential-compromise | MISSED |
| Shell self-vouch / accomplice vouch | shell-nonprofit, shell-company | MISSED |
| Phishing / gig-platform voucher | shell-nonprofit | MISSED |
| Community mutual vouching | community-bio-lab-network | CAUGHT (partially) |
| CRO self/client vouch | cro-framing, cro-identity-rotation | MISSED |
| Dormant-domain fabricated voucher | dormant-domain | MISSED |
| Foreign colleague single vouch | foreign-institution | MISSED |
| Manufactured persona vouch | it-persona-manufacturing | MISSED |
| Bulk-order voucher high volume | bulk-order-noise-cover | CAUGHT (partially) |
| Hijacked voucher account | account-hijack, dormant-account-takeover | MISSED |
| Intercepted voucher email | inbox-compromise | MISSED |
| Gradual-legitimacy cultivated voucher | gradual-legitimacy-accumulation | MISSED |

## bypass_methods_uncovered

- PI rubber-stamp with >60-second turnaround (modal attack)
- All single-shot vouching attacks (shells, CROs, visiting researchers, foreign institutions)
- Self-vouch (attacker holds both roles)
- Recruited co-conspirator voucher
- Credential/session compromise of voucher
- Ghost/stale voucher exploitation
- Cross-provider rotation

---

## Verdict: **PASS**

No Critical findings. The SOP is correctly positioned as a detection mechanism for extreme rubber-stamping patterns (high volume, instant turnaround). Its Moderate findings are structural — rate-based detection cannot catch single-shot or moderate-volume attacks, and the modal PI rubber-stamp evades the turnaround threshold. These are acknowledged limitations, not implementation defects. The SOP's value is in catching the *tail* of voucher abuse, not the *median*. Pipeline continues to stage 6.
