# m20-live-video-attestation — Bypass-aware hardening v2 (Critical-only re-check)

- **measure:** M20 (voucher-legitimacy-soc)
- **implementation reviewed:** `04-implementation-v2.md`
- **scope:** Re-evaluation of Critical Findings C1 and C2 from v1.

---

## C1 re-assessment: Rubber-stamping by legitimate vouchers is systematically missed

**v1 finding:** Video attestation verifies the voucher's identity (real person, real ID, real relationship) but does NOT verify whether the voucher has scrutinized the specific SOC order. The two v1 unscripted questions test relationship knowledge, not order content review. Rubber-stamping by real, trusted vouchers produces a clean PASS.

**v2 fix:**
1. Per-order attestation content: voucher must state SOC names and intended use on each order (Mode A video or Mode B digital sign-off).
2. Challenge questions: order-specific questions testing whether the voucher reviewed the order.
3. Accountability framing: explicit recording/liability statement at the start of each call.
4. Rubber-stamping detection: timing analysis on Mode B forms, with auto-escalation to Mode A.

### Did the fix address C1?

**Yes — substantially improved for the inattentive-rubber-stamping class. Limited improvement for the knowing-complicit class.**

**Inattentive rubber-stamping (the dominant sub-class of C1):**
- v1: The voucher clicks "approve" or answers generic relationship questions without engaging with the order content. MISSED.
- v2: **CAUGHT (or at least substantially deterred).**
  - The voucher must now *name specific SOCs* and *explain the intended use* for each order. A PI who has not looked at the order cannot do this without reading it. This converts "approve without reading" into "read, then approve" — a meaningful friction increase.
  - The accountability statement ("this recording may be reviewed... in legal proceedings") creates personal liability perception. A PI who would have rubber-stamped a web form now has their face and voice on record saying "I have reviewed this order and [specific SOC] is for [specific purpose]." The deterrent is behavioral, not technical, but it targets exactly the inattention mechanism.
  - Mode B rubber-stamping detection catches the case where a voucher submits digital sign-offs too quickly to have read the order. Auto-escalation to Mode A forces the voucher back to the full video call.
  - **Residual gap:** A PI who *reads the order but does not understand the biosecurity implications* will still pass. The SOP tests whether the voucher engaged with the order content, not whether they assessed it competently. This is appropriate — the SOP cannot substitute for biosecurity training, which is a separate policy layer.

**Knowing-complicit vouchers (subset of C1 + full C2 from v1):**
- v1: A deliberately complicit PI or recruited voucher passes trivially. MISSED.
- v2: **Marginally improved, but still largely MISSED.**
  - A complicit voucher will read the SOC names, state the intended use (which they know is false), answer challenge questions coherently (they are briefed), and affirm the accountability statement (they have already accepted the risk).
  - The accountability statement raises the perceived *personal legal risk* — the complicit voucher now has a recorded, order-specific statement that can be used against them. This is a real deterrent for vouchers who are "casually complicit" (doing a favor, not deeply committed) but not for determined co-conspirators.
  - **Structural limitation (honestly documented in v2):** No identity or content check can detect malicious intent by a willing participant. The check authenticates identity and engagement with order content; it cannot authenticate intent.

### Story-level reassessment (C1-relevant stories only)

| Story | v1 classification | v2 classification | Change |
|---|---|---|---|
| lab-manager-voucher (PI rubber-stamps) | MISSED | CAUGHT (per-order content forces engagement) | Substantially improved |
| lab-manager-voucher (BSO rubber-stamps) | MISSED | CAUGHT (per-order content forces engagement) | Substantially improved |
| lab-manager-voucher (co-conspirator PI) | MISSED | MISSED (complicit, passes deliberately) | Marginal (accountability deterrent only) |
| visiting-researcher (sponsor click-approve) | MISSED | CAUGHT (Mode B requires content engagement) | Substantially improved |
| unrelated-dept-student (inattentive voucher) | MISSED | CAUGHT (per-order content) | Substantially improved |
| unrelated-dept-student (co-conspirator PI) | MISSED | MISSED (complicit) | Marginal |
| bulk-order-noise-cover (volume inattention) | MISSED | CAUGHT (Mode B per-order + rubber-stamping detection) | Substantially improved |
| gradual-legitimacy-accumulation (casual rubber-stamp) | MISSED | CAUGHT (Mode B per-order + accountability) | Improved |
| insider-recruitment (knowing co-conspirator) | MISSED | MISSED (complicit) | Marginal (accountability deterrent) |
| biotech-incubator-tenant (co-tenant voucher) | MISSED | AMBIGUOUS (co-tenant may not know order details) | Some improvement |
| community-bio-lab-network (peer vouching) | MISSED | AMBIGUOUS (peers may not know specific SOCs) | Some improvement |

### Verdict on C1

**Downgraded from Critical to Moderate.** The per-order content attestation and challenge questions directly address the dominant mechanism of C1 (inattentive rubber-stamping) by forcing the voucher to engage with order-specific content. The accountability framing adds a behavioral deterrent. The knowing-complicit-voucher sub-class remains structurally unaddressed, which is appropriate to document as a Moderate residual — no identity/attestation check can detect intent.

---

## C2 re-assessment: No per-order content requirements

**v1 finding (folded into C1 suggestion):** No per-order attestation content is required. The video call is per-voucher-onboarding, not per-order.

**v2 fix:** Mode A is for onboarding + annual; Mode B (per-order digital sign-off) is required for every SOC order. Both modes require SOC-specific content.

### Did the fix address C2?

**Yes — fully addressed.** Every SOC order now requires a per-order attestation (Mode B at minimum) that includes order-specific content (SOC names, intended use, challenge question). The v1 gap of "per-voucher-onboarding only" is closed.

### Verdict on C2

**Resolved.** No longer a finding.

---

## M1 re-assessment: Self-vouching not explicitly blocked

**v1 finding (Moderate):** No orderer-voucher deconfliction rule.

**v2 fix:** Explicit rule: orderer and voucher must be different natural persons, verified by government-ID-name comparison.

**Verdict:** **Resolved.**

---

## M2 re-assessment: Per-order vs. per-onboarding cadence unspecified

**v1 finding (Moderate):** Implementation does not specify attestation cadence.

**v2 fix:** Mode A at onboarding + annual. Mode B per-order. Explicitly specified.

**Verdict:** **Resolved.**

---

## Other v1 findings (carry forward)

- **M3 (Moderate):** Social engineering of provider staff bypasses the check — unchanged (out of scope).
- **m1 (Minor):** Reviewer language/cultural competence for foreign vouchers — unchanged.
- **m2 (Minor):** Re-attestation cadence for dormant-account defense — **Resolved** (Mode A annual + Mode B per-order).

---

## Verdict: **PASS**

Both Critical findings (C1, C2) have been addressed: C1 downgraded to Moderate (rubber-stamping deterred; complicit vouchers remain structural), C2 fully resolved. Two v1 Moderate findings (M1, M2) resolved. One Moderate finding (M3) carries forward. No remaining Critical findings. No further re-research loop required.
