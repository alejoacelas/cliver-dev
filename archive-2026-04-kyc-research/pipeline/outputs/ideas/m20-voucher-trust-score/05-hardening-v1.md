# m20-voucher-trust-score — bypass-aware hardening v1

- **measure:** M20 (voucher-legitimacy-soc)
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker story walk

### lab-manager-voucher
**Summary:** Insider exploits PI/BSO rubber-stamping; attacker may be the voucher.

**Bypass methods:**
1. *PI rubber-stamps* — **MISSED.** A legitimate PI scores high on all signals: IDV passes, ORCID is strong, institutional email is real, seniority is high, institution is legitimate. Score ≥80, auto-approve. The composite score is a weighted sum of identity/affiliation signals; none of the five components test whether the PI reviewed the SOC order.
2. *Attacker is the registered voucher* — **MISSED.** Lab manager with reasonable credentials could score in the PASS or REVIEW band. No orderer ≠ voucher identity comparison in the scoring model.
3. *BSO rubber-stamps* — **MISSED.** BSO may lack ORCID but has institutional email, IDV, and m18 legitimacy → likely scores 60–70 (REVIEW band). Reviewer sees a legitimate BSO and approves.
4. *Clinical/affiliate batch vouching* — **MISSED.** Lab director has strong signals, high score.
5. *Recruit PI as co-conspirator* — **MISSED.** Complicit PI has maximum score.

**Net assessment:** No friction. The composite score aggregates identity/affiliation signals; a legitimate voucher who rubber-stamps or conspires scores high by design.

### visiting-researcher
**Summary:** Faculty sponsor as voucher, click-approve.

All four options: **MISSED.** Faculty sponsors score high (strong ORCID, institutional email, seniority, legitimate institution). Auto-approve at ≥80.

**Net assessment:** No friction.

### unrelated-dept-student
**Summary:** Inherited voucher, straw purchaser, credential compromise.

1. *Pre-delegated / rubber-stamping (A, B)* — **MISSED.** Host lab PI scores high.
2. *Straw purchaser (G)* — **MISSED.** Voucher (PI) scores high regardless of who the real customer is.
3. *Credential compromise (F)* — **CAUGHT partially.** If the attacker cannot produce the voucher's IDV biometrics (component signal `voucher_idv`), that signal scores 0, dragging the composite down by 25 points. This likely pushes into the REVIEW or FAIL band. But if IDV was completed at onboarding and the composite is cached, later credential compromise may use the cached score. **AMBIGUOUS** on freshness.
4. *Recruit PI (E)* — **MISSED.** Complicit PI scores high.

**Net assessment:** Partial catch on credential compromise via IDV component. Otherwise no friction.

### shell-nonprofit
**Summary:** Accomplice, phishing, credential compromise, gig recruitment, external voucher.

1. *Accomplice within shell* — **CAUGHT partially.** If the shell entity fails m18 institution-legitimacy, the institutional gate fires → hard-decline regardless of score. This is a strong structural block. But if the shell has acquired enough m18 legitimacy (real ROR, real domain, real publications), the gate passes and the accomplice can score in the PASS band.
2. *AitM phishing* — **CAUGHT partially.** If the phishing intercepts component signals post-computation, the cached score might be replayed. If the score requires fresh component computation per vouching action, phishing of a session token is insufficient. **AMBIGUOUS** on freshness architecture.
3. *Credential compromise* — **CAUGHT partially.** Same as unrelated-dept-student (F) — IDV component fails for the attacker, dragging score down.
4. *Gig-platform voucher* — **CAUGHT.** A gig worker typically lacks: ORCID (0/20), institutional email (0/15), m19 seniority (0/20). Max possible score with just IDV + m18 = 25 + 20 = 45 → REVIEW band. Reviewer sees no scholarly signals and declines.
5. *External recruited voucher* — **CAUGHT partially.** If the recruited voucher is a real researcher at a legitimate institution, they score high and pass. If they are a non-researcher recruit, they score low on ORCID and seniority. **MISSED** for recruited researchers; **CAUGHT** for non-researcher recruits.

**Net assessment:** The institutional gate (m18) is the strongest defense against shell entities. Gig workers are caught by low composite scores. Recruited real researchers pass.

### shell-company
**Summary:** Second shell as voucher, recruit external voucher, social-engineer provider.

1. *Second shell entity* — **CAUGHT.** If the second shell also fails m18, institutional gate blocks. Even if it passes m18, the person from the second shell likely lacks ORCID and seniority → low score → REVIEW/FAIL.
2. *External voucher* — Same as shell-nonprofit (5).
3. *Social engineering* — **MISSED.** Bypasses the check.

**Net assessment:** Institutional gate + composite score provide meaningful friction for shell-to-shell. Recruited real researchers still pass.

### insider-recruitment
**Summary:** Recruited insider as real voucher.

— **MISSED.** Insider at a legitimate institution scores high on all signals.

**Net assessment:** No friction.

### account-hijack
**Summary:** Hijack voucher's account/session.

— **CAUGHT partially.** If the composite score requires fresh IDV per vouching action, account hijack cannot produce biometrics → IDV component fails → score drops. If score is cached from onboarding, hijack uses the cached score. **AMBIGUOUS** on freshness.

**Net assessment:** Depends on score freshness architecture.

### credential-compromise
**Summary:** Compromise PI/voucher credentials.

— **CAUGHT partially.** Same as account-hijack. Fresh IDV would block; cached score would not.

**Net assessment:** Depends on freshness.

### inbox-compromise
**Summary:** Intercept/forge voucher correspondence.

— **CAUGHT partially.** The DKIM-institutional-email component requires DKIM verification (not just email text). If the provider verifies DKIM headers on a fresh email at vouching time, inbox compromise would need to send from the legitimate mail server (possible with full inbox control on some setups). But if the DKIM signal is cached from onboarding, inbox compromise after onboarding has no effect on the score. **AMBIGUOUS** on component freshness and DKIM re-verification.

**Net assessment:** Partial catch. ORCID OAuth and IDV components are harder to forge via inbox control than DKIM alone.

### dormant-account-takeover
**Summary:** Stale voucher records.

— **CAUGHT partially.** If component signals are re-evaluated, stale ORCID employment triggers `orcid_record_stale_employments` (score drops). If cached, the stale account inherits the old high score.

**Net assessment:** Depends on score re-computation cadence.

### biotech-incubator-tenant
**Summary:** Co-tenant as voucher.

— **CAUGHT partially.** Co-tenant at a real incubator with a real institution (m18 passes). If they have ORCID + seniority signals, they score high → **MISSED.** If they lack scholarly signals, score is moderate → REVIEW band.

**Net assessment:** Depends on the co-tenant's scholarly profile. Real researchers pass; non-researchers hit REVIEW.

### community-bio-lab-network
**Summary:** Peer-vouching.

— **CAUGHT partially.** Community-lab members often lack: ORCID (0/20), institutional DKIM email (0/15 — community labs may not have recognized domains), seniority (0/20). Max score with just IDV + m18 = 25 + 20 = 45 → REVIEW band. If the community lab also fails m18, institutional gate blocks entirely.

**Net assessment:** Meaningful friction. Community-lab vouchers score low on scholarly signals.

### cro-framing
**Summary:** Fake client as voucher or self-vouch.

1. *Fake client persona* — **CAUGHT.** Fabricated persona fails IDV (no real person) → IDV component = 0 → max score 75 even with all other signals → REVIEW band at best. If no real person, all components fail → FAIL.
2. *Self-vouch within CRO* — **MISSED** on prevention (real person, may score high). No orderer ≠ voucher check.

**Net assessment:** Catches fabricated personas. Misses real-person self-vouching.

### cro-identity-rotation
**Summary:** Voucher reconstruction per rotation.

— **CAUGHT partially.** Each rotation's voucher must independently score above threshold. A stable recruited researcher-voucher passes each time. But if the scoring system tracks voucher-ID reuse across customers (see M2 below), pattern detection could flag this. The implementation does not specify cross-customer voucher tracking.

**Net assessment:** Per-rotation the check applies. No cross-rotation detection.

### gradual-legitimacy-accumulation
**Summary:** Long-term voucher rubber-stamps.

— **MISSED.** After years of legitimate work, the voucher scores maximum on all signals.

**Net assessment:** No friction.

### dormant-domain
**Summary:** Fabricated voucher on revived domain.

— **CAUGHT.** Fabricated persona fails IDV and ORCID. If the domain fails m18, institutional gate blocks. Even if m18 passes (domain appears legitimate), the individual signals (IDV, ORCID, seniority) are weak → low score.

**Net assessment:** Strong catch.

### foreign-institution
**Summary:** Foreign colleague as voucher.

— **CAUGHT partially.** Foreign voucher with ORCID and institutional email scores well. Without ORCID (lower adoption in some regions), score drops by 20. Without recognized institutional email domain, drops by 15. Could land in REVIEW band even if legitimate. **AMBIGUOUS** — the check provides friction but also false-positive risk for legitimate foreign vouchers.

**Net assessment:** Provides friction proportional to the foreign voucher's digital footprint. Biases against under-represented regions.

### it-persona-manufacturing
**Summary:** Manufactured persona with IT credentials.

— **CAUGHT.** Manufactured persona has institutional email (15/15) but likely fails: IDV name mismatch (0/25), no ORCID (0/20), no seniority (0/20). Max score = 15 + 20 (m18) = 35 → FAIL band.

**Net assessment:** Strong catch.

### bulk-order-noise-cover
**Summary:** Volume-driven voucher inattention.

— **MISSED.** Composite score is per-voucher, not per-order. A high-scoring voucher can rubber-stamp unlimited orders.

**Net assessment:** No friction.

---

## Findings

### Critical

**C1. High-scoring legitimate vouchers who rubber-stamp or conspire are systematically missed.**
- Stories: lab-manager-voucher (all), visiting-researcher (all), unrelated-dept-student (A, B, G), insider-recruitment, gradual-legitimacy-accumulation, bulk-order-noise-cover.
- Why missed: The composite score is a weighted sum of identity, affiliation, and seniority signals. All five components measure *who the voucher is*, not *what the voucher does per order*. A maximum-score voucher who rubber-stamps or knowingly conspires is indistinguishable from a maximum-score voucher who exercises due diligence. The scoring model has no per-order behavioral component.
- Suggestion: This is structural for a composite trust score based on identity/affiliation signals. Addressing it within this idea would require adding a behavioral/per-order component (e.g., voucher's historical approve-all rate, time-to-approve, order-content-awareness attestation). This fundamentally changes the score from an identity score to a behavioral score and may be better addressed as a separate complementary idea.

### Moderate

**M1. Score freshness / re-computation cadence is unspecified.**
- Stories: account-hijack, credential-compromise, inbox-compromise, dormant-account-takeover.
- Why exploitable: The implementation describes score computation but not when it happens. If the score is computed once at voucher onboarding and cached, all post-onboarding attacks (credential theft, account hijack) use the cached high score without re-verification.
- Suggestion: Specify that the composite score is re-computed per vouching action (or at minimum per-order for SOC), requiring fresh component signals. At a minimum, re-compute on a time-based cadence (e.g., every 90 days) and on any security event.

**M2. No cross-customer voucher-reuse tracking.**
- Stories: cro-identity-rotation, shell-company (second shell).
- Why missed: Same voucher vouching for multiple unrelated entities is not detected by the per-voucher score.
- Suggestion: Add a `voucher_reuse_count` signal: number of distinct customers this voucher has vouched for in the past 12 months. Elevate to REVIEW if >2.

**M3. Self-vouching (orderer = voucher) not blocked.**
- Stories: lab-manager-voucher (a), cro-framing (self-vouch).
- Why missed: No identity deconfliction between orderer and voucher.
- Suggestion: Compare IDV-verified identities. Flag `voucher_orderer_same_person`.

**M4. Institutional gate bypass for well-backstopped shells.**
- Stories: shell-nonprofit (accomplice with m18-passing shell).
- Why missed: A shell that has invested in m18 legitimacy (real ROR, real domain, real publications) passes the institutional gate. The composite score then evaluates the accomplice on identity/seniority signals, which may be strong if the accomplice is a recruited real researcher.
- Suggestion: This is partially addressed by m18 itself. For the trust score, consider adding a "institutional age" or "institutional-customer-history" signal: new institutions with no prior order history receive a penalty.

**M5. Industry voucher bias.**
- Stories: biotech-incubator-tenant, foreign-institution.
- Why exploitable: Industry vouchers systematically lack ORCID (0/20) and may lack institutional DKIM email (0/15), capping their max score at ~65 even when fully legitimate. This creates a coverage gap where legitimate industry vouchers always land in the REVIEW band, consuming reviewer capacity and potentially normalizing REVIEW-band approvals (making it easier for marginal cases to slip through).
- Suggestion: Add industry-specific signal alternatives (e.g., LinkedIn company verification, Dun & Bradstreet DUNS, or professional-license check) or adjust weights for vouchers whose institution `types` in ROR includes `company`.

### Minor

**m1. Weight calibration requires production data.**
- Detail: The 0.25/0.20/0.15/0.20/0.20 weighting is a best guess. Miscalibration could create systematic blind spots (e.g., ORCID overweighted for a population where most legitimate vouchers lack one).

**m2. Drift monitoring may not catch slow adversarial adaptation.**
- Detail: The 2σ alert threshold is per-week. An adversary who slowly shifts the score distribution (e.g., by running many legitimate orders to establish a baseline) may not trigger the alert.

---

## bypass_methods_known

| Bypass | Classification | Notes |
|---|---|---|
| Fabricated persona (no real person) | CAUGHT | IDV fails → score collapses |
| IT-manufactured persona | CAUGHT | IDV name mismatch + no ORCID/seniority → FAIL |
| Dormant-domain fabricated voucher | CAUGHT | All individual signals fail |
| Gig-platform voucher (non-researcher) | CAUGHT | No ORCID/seniority/DKIM → low score |
| Shell entity failing m18 | CAUGHT | Institutional gate blocks |
| Community-lab voucher (no scholarly signals) | CAUGHT | Low composite score → REVIEW/FAIL |
| PI/BSO rubber-stamping | MISSED | Maximum score; no per-order component |
| Recruited/complicit researcher voucher | MISSED | High score on all signals |
| Insider recruitment | MISSED | Legitimate employee, high score |
| Volume-driven rubber-stamping | MISSED | Per-voucher score, not per-order |
| Gradual-legitimacy rubber-stamping | MISSED | Years of legitimacy → max score |
| Self-vouching | MISSED | No orderer ≠ voucher check |
| Social engineering of provider staff | MISSED | Bypasses check entirely |
| Credential compromise (cached score) | AMBIGUOUS | Depends on re-computation cadence |
| Account hijack (cached score) | AMBIGUOUS | Depends on re-computation cadence |
| Shell with m18 legitimacy + recruited researcher | AMBIGUOUS | Gate passes; researcher scores high |
| Foreign-institution voucher | AMBIGUOUS | Friction proportional to digital footprint; bias risk |

## bypass_methods_uncovered

- PI/BSO rubber-stamping (max-score vouchers; no per-order scrutiny)
- Recruited/complicit researcher voucher (real credentials → high score)
- Insider recruitment at legitimate institution
- Volume-driven rubber-stamping
- Gradual-legitimacy rubber-stamping
- Self-vouching (no orderer ≠ voucher deconfliction)
- Social engineering of provider staff

---

## Verdict: **STRUCTURAL**

One Critical finding (C1: high-scoring legitimate vouchers who rubber-stamp or conspire). This gap is structural to a composite score based on identity/affiliation signals — the score measures *who the voucher is*, not *what they do per order*. Adding a per-order behavioral component would fundamentally change the idea's scope. Moderate findings M1–M5 are addressable within stage 4 and would meaningfully improve the implementation. Route C1 to human review; M1–M5 are recommendations for refinement.
