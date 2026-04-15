# m20-ror-disjointness — bypass-aware hardening v1

- **measure:** M20 (voucher-legitimacy-soc)
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker story walk

### lab-manager-voucher
**Summary:** Insider exploits PI/BSO rubber-stamping; attacker may be the voucher themselves.

**Bypass methods:**
1. *PI rubber-stamps* — **MISSED.** The PI is at the same institution as the customer. The disjointness rule flags `voucher_customer_same_ror`. However, the manual review exception path allows cross-department vouching (e.g., a central BSO attesting to a different lab). A legitimate PI in the same department would be declined and a different-institution voucher required — but the **legitimate cross-department exception** is the exact loophole this branch exploits. The PI/BSO could claim cross-department authority and the reviewer grants an exception.
2. *Attacker is the registered voucher (self-vouching)* — **CAUGHT partially.** If orderer and voucher are at the same institution, the same-ROR flag fires. But the implementation does not compare orderer identity to voucher identity — it compares *institutions*. Self-vouching from the same institution is caught by the same-ROR rule, but the exception path could allow it if the reviewer doesn't notice they're the same person.
3. *BSO-as-voucher rubber-stamps* — **CAUGHT partially.** BSO is same institution → flag fires. But the SOP explicitly allows "system-wide IBC chair" and "cross-cutting authority" exceptions, which is exactly what a BSO claims.
4. *Clinical/affiliate delegated batch vouching* — **CAUGHT partially.** Same-institution flag fires. But a hospital system's clinical director may have a different ROR (teaching hospital vs. medical school) and pass the disjointness check while still being functionally the same entity.
5. *Recruit PI as co-conspirator* — **CAUGHT partially.** If co-conspirator PI is at a different institution, disjointness passes and the check provides no additional friction. If same institution, flag fires but exception path is available.

**Net assessment:** The disjointness rule forces the attacker to use a voucher from a *different* institution, which is a real structural improvement over unchecked same-institution vouching. But the exception path for cross-department vouching is exploitable, and recruiting a co-conspirator at a different institution is explicitly enumerated in this branch.

### visiting-researcher
**Summary:** Faculty sponsor as voucher, click-approve.

**Bypass methods:**
1. *Faculty sponsor as voucher* — **CAUGHT.** Sponsor is at the same institution as the visiting researcher → `voucher_customer_same_ror`. The visiting researcher must find an external voucher instead. This is meaningful friction — the most natural voucher (the sponsor) is blocked.
2. *Lab manager/dept admin* — **CAUGHT.** Same institution → flag fires.
3. *Second lab member* — **CAUGHT.** Same institution → flag fires.
4. *Second faculty sponsor* — **CAUGHT only if** the second sponsor is at the same institution. If the visitor has a home institution and finds a voucher there, disjointness passes.

**Net assessment:** Strong friction for the primary path (blocks same-institution sponsor). Forces the attacker to find a cross-institutional voucher, which is a real barrier for the visiting-researcher branch. However, Option 4 (second sponsor at a different institution) remains open.

### unrelated-dept-student
**Summary:** Inherited voucher, straw purchaser, credential compromise.

**Bypass methods:**
1. *Pre-delegated ordering authority (inherited voucher)* — **CAUGHT.** Host lab PI is same institution → flag fires. Student needs a different-institution voucher.
2. *Per-order rubber-stamping by inattentive voucher* — **CAUGHT** if the inattentive voucher is same-institution. Forces external voucher.
3. *Straw purchaser via lab member* — **MISSED.** The straw purchaser is the orderer (real lab member); the voucher can be someone at a different institution who knows the straw purchaser. Disjointness check passes because voucher and customer are at different institutions — the actual attacker is absent.
4. *Credential compromise of registered contact* — **MISSED.** This attack targets voucher authentication, not voucher-customer relationship. The disjointness check is irrelevant to credential theft.
5. *Recruit PI as co-conspirator* — **MISSED** if the co-conspirator is at a different institution (disjointness passes).

**Net assessment:** Blocks same-institution rubber-stamping (paths A, B). Does not address straw purchase, credential compromise, or cross-institutional conspiracy.

### shell-nonprofit
**Summary:** Self-vouching from accomplice within shell; escalation to phishing, credential compromise, gig recruitment, external voucher.

**Bypass methods:**
1. *Self-vouching from accomplice within the shell* — **CAUGHT.** Accomplice and orderer are at the same shell entity → same ROR (if the shell has a ROR) → flag fires. If the shell has no ROR, `voucher_ror_unresolved` fires. Both paths block this bypass.
2. *AitM phishing of existing institutional voucher* — **MISSED.** Targets voucher authentication, not voucher-customer relationship.
3. *Credential compromise of colliding institution's staff* — **MISSED.** Same — targets authentication.
4. *Gig-platform voucher* — **CAUGHT partially.** If the gig worker claims an institution, disjointness to the customer's institution is checked. If the gig worker's institution is fabricated and has no ROR, `voucher_ror_unresolved` fires. But if the gig worker is a real person at a real, different institution, disjointness passes.
5. *Recruit external voucher* — **MISSED.** Voucher is at a genuinely different institution → disjointness passes by design.

**Net assessment:** Strong catch for same-shell vouching. Forces escalation to external voucher recruitment, which the source prices at $1k–$10k per vouch event. Meaningful cost amplification.

### shell-company
**Summary:** Second shell entity as voucher, recruit external voucher, social-engineer provider staff.

**Bypass methods:**
1. *Second shell entity as cross-org voucher* — **CAUGHT partially.** If both shells share a ROR parent (unlikely for purpose-built shells), the hierarchy check catches it. If they have separate RORs, disjointness passes. If neither has a ROR, `voucher_ror_unresolved` fires for the voucher. The `voucher_customer_colocated_company` flag (both for-profit, same city) provides a soft signal.
2. *Recruit external voucher* — **MISSED.** Different institution → disjointness passes.
3. *Social engineering of provider staff* — **MISSED.** Bypasses check entirely.

**Net assessment:** Partial friction for shell-to-shell (catches shared-ROR or no-ROR cases). Two-shell setup with separate RORs in different cities passes.

### insider-recruitment
**Summary:** Recruited insider at same institution.

**Bypass methods:** Recruited insider is same institution as customer. — **CAUGHT.** `voucher_customer_same_ror` fires. The insider cannot vouch from within; the attacker needs an external voucher.

**Net assessment:** Meaningful friction — blocks the recruited insider from serving as voucher (though the insider can still be the orderer).

### account-hijack
**Summary:** Hijack voucher's account/session.

**Bypass methods:** Session/account hijack. — **MISSED.** Targets authentication, not the voucher-customer relationship. Disjointness check is irrelevant.

**Net assessment:** No friction. Out of scope for this check.

### credential-compromise
**Summary:** Compromise PI/voucher credentials.

**Bypass methods:** Credential theft. — **MISSED.** Same as account-hijack — authentication attack, not relationship attack.

**Net assessment:** No friction.

### inbox-compromise
**Summary:** Intercept/forge voucher correspondence.

**Bypass methods:** Email interception. — **MISSED.** Authentication attack. Disjointness check does not defend email channels.

**Net assessment:** No friction.

### dormant-account-takeover
**Summary:** Stale voucher records.

**Bypass methods:** Exploit stale voucher. — **CAUGHT partially.** If the dormant account's stale voucher is at the same institution, `voucher_customer_same_ror` fires on re-check. But `voucher_inactive_ror` only fires if the *institution* is inactive in ROR, not if the *person's account* is dormant. The implementation checks ROR status, not account activity.

**Net assessment:** Partial. Blocks same-institution stale vouchers. Does not detect person-level dormancy.

### biotech-incubator-tenant
**Summary:** Co-tenant recruited as voucher.

**Bypass methods:** Co-tenant as voucher. — **CAUGHT partially.** If the incubator is a single ROR and both customer and voucher are tenants, `voucher_customer_same_ror` fires. But many incubator tenants have their own separate RORs (or no ROR, triggering `voucher_ror_unresolved`). A co-tenant with a genuinely different company ROR passes disjointness.

**Net assessment:** Partial. Depends on ROR structure of the incubator and its tenants.

### community-bio-lab-network
**Summary:** Mutual peer-vouching.

**Bypass methods:** Peer-vouching. — **CAUGHT partially.** If two members of the same community lab share the lab's ROR, `voucher_customer_same_ror` fires. If the community lab has no ROR, `voucher_ror_unresolved` fires. But if peer vouchers are at different community labs (each with its own identity), disjointness passes.

**Net assessment:** Moderate friction for within-lab vouching. Cross-lab mutual vouching passes.

### cro-framing
**Summary:** Fake client as voucher or self-vouch within CRO.

**Bypass methods:**
1. *Fake client as voucher* — **CAUGHT partially.** If the fake client's institution has no ROR, `voucher_ror_unresolved` fires. If it has a ROR that is disjoint from the CRO's, it passes.
2. *Self-vouch within CRO* — **CAUGHT.** Same entity → same ROR → flag fires.

**Net assessment:** Catches self-vouching. Partial catch on fake-client depending on ROR existence.

### cro-identity-rotation
**Summary:** Voucher reconstruction per rotation.

**Bypass methods:** Per-rotation voucher. — **CAUGHT partially.** Each new CRO identity needs a disjoint voucher. If the same voucher is reused across rotations, the provider could (but the implementation does not specify) detect the pattern. The disjointness check alone passes each time as long as voucher and new CRO have different RORs.

**Net assessment:** Disjointness passes per rotation. No cross-rotation pattern detection specified.

### gradual-legitimacy-accumulation
**Summary:** Long-term voucher who rubber-stamps.

**Bypass methods:** Cultivated voucher rubber-stamps. — **CAUGHT** if the voucher is at the same institution (forces external voucher). **MISSED** if the attacker has cultivated a voucher at a different institution.

**Net assessment:** Depends on whether the cultivated voucher is same-institution or cross-institution.

### dormant-domain
**Summary:** Fabricated voucher persona on revived domain.

**Bypass methods:** Fabricated voucher on same domain. — **CAUGHT.** Same domain → likely same ROR → `voucher_customer_same_ror` fires. If the domain is not in ROR, `voucher_ror_unresolved` fires.

**Net assessment:** Strong catch.

### foreign-institution
**Summary:** Foreign colleague as voucher.

**Bypass methods:** Cross-border verification asymmetry. — **CAUGHT partially.** Disjointness passes (foreign institution is genuinely different). The check does not evaluate whether the foreign institution is legitimate — that is m18's job. ROR coverage for foreign institutions is weaker (80.9% of ROR IDs in top 20 countries). If the foreign voucher's institution has no ROR, `voucher_ror_unresolved` fires.

**Net assessment:** Disjointness passes by design (foreign = different). The check provides the ROR-unresolved signal for institutions not in ROR, which is useful but not a hard block.

### it-persona-manufacturing
**Summary:** Manufactured persona with IT credentials as voucher.

**Bypass methods:** Manufactured persona at same institution. — **CAUGHT.** Same institution → `voucher_customer_same_ror` fires. The manufactured persona is at the same institution as the attacker.

**Net assessment:** Strong catch. Forces the attacker to find an external voucher.

### bulk-order-noise-cover
**Summary:** Volume-driven voucher inattention.

**Bypass methods:** Rubber-stamping under volume. — **MISSED.** Disjointness is a one-time structural check. It does not address per-order inattention. If the voucher is at a different institution (passes disjointness), volume-driven rubber-stamping proceeds unchecked.

**Net assessment:** No friction for per-order inattention.

---

## Findings

### Critical

None. The disjointness check does what it claims to do — block same-institution vouching — and the stories where it misses are either authentication attacks (out of scope) or cross-institutional recruitment (which this check is not designed to catch). The exception path for cross-department vouching (M1 below) is a concern but not a provable miss of a cheap/common bypass, since it requires reviewer complicity or inattention.

### Moderate

**M1. Cross-department exception path is exploitable.**
- Stories: lab-manager-voucher (1, 3), visiting-researcher (via edge cases).
- Why exploitable: The SOP allows same-institution vouching when the voucher demonstrates "cross-cutting authority" (e.g., system-wide IBC chair). A BSO or institutional biosafety officer claims exactly this authority. The reviewer is asked to judge cross-department independence but has no tooling to verify it beyond the voucher's self-assertion.
- Suggestion: Require that cross-department exceptions provide verifiable evidence (e.g., a letter on institutional letterhead from the IBC, not just the voucher's claim). Cap same-institution exceptions at a low rate (e.g., max 10% of vouchers for any given customer institution).

**M2. Two-shell bypass (separate RORs, different cities).**
- Stories: shell-company (1).
- Why missed: Two purpose-built shells with separate ROR registrations in different cities pass the disjointness check. The `voucher_customer_colocated_company` soft signal requires same city, so different-city shells evade it.
- Suggestion: Add a `voucher_customer_both_company` flag when both are type `company` in ROR, regardless of colocation. Companies vouching for companies is inherently higher-risk for this measure.

**M3. Cross-lab mutual vouching in community bio networks.**
- Stories: community-bio-lab-network.
- Why missed: Two different community labs each with separate identities pass disjointness. The check cannot detect reciprocal vouching patterns (A vouches for B, B vouches for A).
- Suggestion: Add a reciprocity detector: if voucher V1 at org A vouched for customer at org B, and later voucher V2 at org B vouches for customer at org A, flag `voucher_reciprocal_pattern`.

**M4. No cross-rotation pattern detection for CRO identity rotation.**
- Stories: cro-identity-rotation.
- Why missed: Same voucher passing disjointness against multiple CRO identities is not tracked.
- Suggestion: Track voucher-ID reuse across customers. Flag when the same voucher vouches for multiple unrelated entities within a time window.

### Minor

**m1. ROR coverage gaps for foreign and small institutions.**
- Stories: foreign-institution, biotech-incubator-tenant.
- Detail: `voucher_ror_unresolved` fires but the implementation does not specify how the reviewer handles it. Could become a silent pass-through.

**m2. Hospital/university system ROR hierarchy complexity.**
- Stories: lab-manager-voucher (4), unrelated-dept-student.
- Detail: Acknowledged in `failure_modes_requiring_review`. Teaching hospital vs. medical school ROR relationships may cause false positives or allow functionally same-entity vouching through distinct RORs.

---

## bypass_methods_known

| Bypass | Classification | Notes |
|---|---|---|
| Same-institution vouching (PI, BSO, lab member) | CAUGHT | `voucher_customer_same_ror` flag fires |
| Self-vouching within same entity | CAUGHT | Same-ROR check |
| Shell self-vouching (accomplice within shell) | CAUGHT | Same-ROR or ROR-unresolved |
| Dormant-domain fabricated voucher (same domain) | CAUGHT | Same-ROR or ROR-unresolved |
| IT-manufactured persona (same institution) | CAUGHT | Same-ROR |
| Insider recruitment (same institution vouching blocked) | CAUGHT | Same-ROR |
| Cross-institutional recruited voucher | MISSED | Disjointness passes by design |
| Credential compromise / session hijack | MISSED | Authentication attack, out of scope |
| Inbox compromise | MISSED | Authentication attack, out of scope |
| Social engineering of provider staff | MISSED | Bypasses check entirely |
| Volume-driven rubber-stamping (external voucher) | MISSED | Per-order inattention not tested |
| Straw purchaser (attacker absent from records) | MISSED | Voucher knows straw purchaser, disjoint |
| Cross-department exception exploitation | AMBIGUOUS | Depends on reviewer rigor |
| Two-shell separate-ROR bypass | AMBIGUOUS | Passes disjointness; soft signals may catch |
| Cross-lab mutual vouching | AMBIGUOUS | Separate RORs pass; no reciprocity detection |

## bypass_methods_uncovered

- Cross-institutional recruited/complicit voucher (by design — disjointness is structural, not intent)
- Credential/session/inbox compromise (authentication attacks, out of scope)
- Volume-driven rubber-stamping by external voucher
- Straw purchaser with disjoint voucher
- Social engineering of provider staff

---

## Verdict: **PASS**

No Critical findings. The disjointness check performs well against its design target (blocking same-institution/same-entity vouching) and meaningfully increases attacker cost for branches that relied on internal vouching. The bypasses it misses (cross-institutional recruitment, authentication attacks, rubber-stamping) are either out of scope by design or require complementary checks (m20-live-video-attestation, m20-voucher-idv, m20-voucher-trust-score). Moderate findings M1–M4 are refinements, not gaps in the check's core function. Pipeline continues to stage 6.
