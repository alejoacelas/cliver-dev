# m20-voucher-idv — bypass-aware hardening v1

- **measure:** M20 (voucher-legitimacy-soc)
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker story walk

### lab-manager-voucher
**Summary:** Insider exploits PI/BSO rubber-stamping; attacker may be the voucher.

**Bypass methods:**
1. *PI rubber-stamps* — **MISSED.** PI passes IDV trivially — they have a real government ID and real identity. IDV verifies the voucher is a real person; it does not evaluate whether they reviewed the order.
2. *Attacker is the registered voucher (self-vouching)* — **MISSED.** Lab manager with a real gov ID passes IDV. No orderer ≠ voucher deconfliction in this check.
3. *BSO rubber-stamps* — **MISSED.** BSO has a real gov ID.
4. *Clinical/affiliate batch vouching* — **MISSED.** Lab director passes IDV.
5. *Recruit PI as co-conspirator* — **MISSED.** Complicit PI has a real gov ID.

**Net assessment:** No friction. IDV authenticates identity; this branch uses real people.

### visiting-researcher
**Summary:** Faculty sponsor as voucher, click-approve.

All four options (sponsor, lab manager, second lab member, second sponsor): **MISSED.** All are real people with real IDs. IDV passes.

**Net assessment:** No friction.

### unrelated-dept-student
**Summary:** Inherited voucher, straw purchaser, credential compromise.

1. *Pre-delegated / rubber-stamping (A, B)* — **MISSED.** Real PI, real ID.
2. *Straw purchaser (G)* — **MISSED.** PI vouches for known lab member.
3. *Credential compromise (F)* — **CAUGHT.** Attacker cannot produce the voucher's face + matching gov ID. IDV's face-match-to-selfie and liveness check require the actual voucher's physical presence.
4. *Recruit PI (E)* — **MISSED.** Real PI, real ID.

**Net assessment:** Catches credential compromise. Does not address dominant paths.

### shell-nonprofit
**Summary:** Accomplice self-vouching; phishing, credential compromise, gig recruitment, external voucher.

1. *Accomplice within shell* — **CAUGHT partially.** The accomplice is a real person with a real gov ID → IDV passes identity verification. However, IDV captures biometric data (face, doc), creating a strong attribution trail. The accomplice is now biometrically committed, raising the personal risk of the conspiracy. **CAUGHT** on attribution/deterrence; **MISSED** on prevention.
2. *AitM phishing* — **CAUGHT.** Phishing captures session tokens, not biometrics. IDV requires live selfie + liveness, which cannot be replayed from a phished session.
3. *Credential compromise* — **CAUGHT.** Same as unrelated-dept-student (F).
4. *Gig-platform voucher* — **CAUGHT partially.** Gig worker has a real gov ID, so IDV passes identity. But IDV creates a biometric record of the gig worker, making them personally identifiable and attributable in a later investigation. This raises the deterrence cost significantly. The gig worker must now accept personal biometric exposure.
5. *External recruited voucher* — **MISSED** on prevention (real person, real ID). **CAUGHT** on attribution (biometric record created).

**Net assessment:** IDV does not prevent these bypasses (except phishing/credential compromise) but significantly increases attribution risk for accomplices and recruited vouchers. The deterrence value is real but hard to quantify.

### shell-company
**Summary:** Second shell entity as voucher, recruit external voucher, social-engineer provider staff.

1. *Second shell entity* — **CAUGHT partially.** Person from second shell has real ID → passes IDV. But biometric commitment creates attribution.
2. *External voucher* — **MISSED** on prevention; **CAUGHT** on attribution.
3. *Social engineering* — **MISSED.** Bypasses the check.

**Net assessment:** Attribution value but not preventive for shell-company paths.

### insider-recruitment
**Summary:** Recruited insider as real voucher.

— **MISSED.** Insider has a real gov ID. IDV passes. Attribution trail exists (insider is biometrically committed) but the insider is already a known employee — IDV adds little marginal attribution.

**Net assessment:** No meaningful friction or attribution increment.

### account-hijack
**Summary:** Hijack voucher's account/session.

— **CAUGHT.** IDV requires live biometric presence. Session hijack cannot produce the voucher's face + ID.

**Net assessment:** Strong catch.

### credential-compromise
**Summary:** Compromise PI/voucher credentials.

— **CAUGHT.** Same as account-hijack.

**Net assessment:** Strong catch.

### inbox-compromise
**Summary:** Intercept/forge voucher correspondence.

— **CAUGHT.** If voucher approval requires IDV (not just email confirmation), inbox control is insufficient. Attacker needs the voucher's physical face and gov ID.

**Net assessment:** Strong catch.

### dormant-account-takeover
**Summary:** Stale voucher records.

— **CAUGHT** if IDV re-verification is required. The account taker cannot produce the original voucher's biometrics. **AMBIGUOUS** if IDV is one-time-at-onboarding and no re-verification is required.

**Net assessment:** Depends on re-verification cadence (not specified).

### biotech-incubator-tenant
**Summary:** Co-tenant recruited as voucher.

— **MISSED.** Real person, real gov ID. Passes IDV. Attribution trail exists but co-tenant is already known.

**Net assessment:** No meaningful friction.

### community-bio-lab-network
**Summary:** Peer-vouching.

— **MISSED.** Community-lab peers are real people with real IDs. IDV passes.

**Net assessment:** No friction. Attribution trail exists (biometric record of community-lab voucher) but the peer relationship is genuine.

### cro-framing
**Summary:** Fake client as voucher or self-vouch within CRO.

1. *Fake client persona* — **CAUGHT** if the persona is purely fabricated (no real person behind it). IDV requires a real person + real gov ID.
2. *Self-vouch within CRO* — **MISSED.** Real person, real ID. No orderer ≠ voucher check.

**Net assessment:** Catches fabricated personas. Does not block real-person self-vouching.

### cro-identity-rotation
**Summary:** Voucher reconstruction per rotation.

— **CAUGHT partially.** Each voucher must complete IDV, adding ~$1.50–$5 per rotation plus the voucher's time friction. If the same voucher reuses their biometrics across rotations, the provider could detect this (face-match across sessions), but the implementation does not specify cross-session biometric deduplication.

**Net assessment:** Per-rotation cost amplification. No cross-rotation deduplication specified.

### gradual-legitimacy-accumulation
**Summary:** Long-term voucher rubber-stamps.

— **MISSED.** Long-term voucher has a real gov ID.

**Net assessment:** No friction.

### dormant-domain
**Summary:** Fabricated voucher persona on revived domain.

— **CAUGHT.** Fabricated persona cannot produce matching gov ID + live selfie. A real person could be recruited, but then IDV captures their biometrics (attribution).

**Net assessment:** Strong catch against fabricated personas. Attribution for recruited real persons.

### foreign-institution
**Summary:** Foreign colleague as voucher.

— **CAUGHT partially.** Foreign voucher has a real gov ID, but vendor document coverage for non-OECD passports may be limited (acknowledged in `failure_modes_requiring_review`). If the vendor supports the doc type, IDV passes and the foreign voucher is biometrically committed. If not, the check fails to complete — which is a blocking failure for a legitimate voucher, not a bypass.

**Net assessment:** Passes if doc type is supported; creates attribution. Doc-type coverage gaps are a false-positive issue, not a bypass.

### it-persona-manufacturing
**Summary:** Manufactured persona with IT credentials.

— **CAUGHT.** Gov ID is issued to a real person. If the manufactured persona uses a name that does not match the attacker's gov ID, `voucher_idv_name_mismatch` fires. If it uses the attacker's real name, IDV passes but the attacker is now biometrically committed under their real identity.

**Net assessment:** Strong catch if name mismatch; strong attribution if real-name persona.

### bulk-order-noise-cover
**Summary:** Volume-driven voucher inattention.

— **MISSED.** IDV is a voucher-qualification event, not per-order. Rubber-stamping under volume is unaffected.

**Net assessment:** No friction.

---

## Findings

### Critical

**C1. Rubber-stamping by real, IDV-verified vouchers is systematically missed.**
- Stories: lab-manager-voucher (all), visiting-researcher (all), unrelated-dept-student (A, B, G), bulk-order-noise-cover, gradual-legitimacy-accumulation, community-bio-lab-network.
- Why missed: IDV verifies the voucher is a *real person with a real government ID*. It does not verify whether the voucher has scrutinized the SOC order. Every exploit-affiliation branch that uses a real, inattentive voucher passes this check.
- Suggestion: Same as ORCID — this is structural. IDV is an identity check, not an order-scrutiny check. Requires a complementary per-order attestation mechanism.

### Moderate

**M1. Self-vouching (orderer = voucher) not blocked.**
- Stories: lab-manager-voucher (a), cro-framing (self-vouch).
- Why missed: No comparison of orderer's IDV biometrics/name against voucher's IDV biometrics/name.
- Suggestion: Compare IDV-verified names and face embeddings between orderer and voucher. Flag `voucher_orderer_same_person` if match.

**M2. No cross-session biometric deduplication.**
- Stories: cro-identity-rotation.
- Why missed: The same voucher can IDV separately for multiple customers/CRO rotations without detection.
- Suggestion: Run face-match across all voucher IDV sessions. Flag `voucher_face_reuse` when the same biometric appears vouching for unrelated entities. Vendors like Persona Graph offer this.

**M3. Re-verification cadence unspecified.**
- Stories: dormant-account-takeover.
- Why missed: If IDV is one-time-at-onboarding, a later account takeover can vouch without re-IDV.
- Suggestion: Require IDV re-verification annually and on vouching actions for SOC orders above a risk threshold.

**M4. Attribution is real but not scored as a preventive signal.**
- Stories: shell-nonprofit (accomplice, gig worker, external voucher), shell-company, cro-framing.
- Why exploitable: IDV creates a strong attribution trail (biometric + gov ID) that deters some attackers but does not prevent a willing accomplice from completing the flow. The implementation does not distinguish between "IDV passed" (clean signal) and "IDV passed but the voucher is biometrically committed to a conspiracy" (deterrence only).
- Suggestion: Acknowledge deterrence value explicitly in the coverage model. Not a stage-4 implementation change, but relevant for stage 6 coverage assessment.

### Minor

**m1. Vendor document-type coverage gaps for non-OECD passports.**
- Stories: foreign-institution.
- Detail: Acknowledged in `failure_modes_requiring_review`. Not a bypass — it is a false-positive / coverage-gap issue.

**m2. Demographic facial-recognition bias.**
- Stories: foreign-institution, community-bio-lab-network.
- Detail: Acknowledged in `false_positive_qualitative`. Not a bypass but a fairness concern.

---

## bypass_methods_known

| Bypass | Classification | Notes |
|---|---|---|
| Credential compromise / session hijack | CAUGHT | IDV requires live biometric presence |
| AitM phishing | CAUGHT | Cannot replay biometrics from session token |
| Inbox compromise | CAUGHT | Email cannot substitute for biometric IDV |
| Fabricated persona (no real person) | CAUGHT | No matching gov ID + face |
| IT-manufactured persona (name mismatch) | CAUGHT | `voucher_idv_name_mismatch` fires |
| Dormant-domain fabricated voucher | CAUGHT | No real person behind the persona |
| Dormant-account takeover (with re-IDV) | CAUGHT | Account taker lacks original biometrics |
| PI/BSO rubber-stamping | MISSED | Real person, real gov ID; order scrutiny untested |
| Recruited/complicit voucher | MISSED | Real person, real gov ID, willing participant |
| Straw purchaser via lab member | MISSED | Voucher genuinely knows straw purchaser |
| Volume-driven rubber-stamping | MISSED | One-time qualification, not per-order |
| Community-lab peer vouching | MISSED | Real people, real IDs |
| Social engineering of provider staff | MISSED | Bypasses check entirely |
| Self-vouching (orderer = voucher) | MISSED | No identity deconfliction |
| Shell accomplice (biometric attribution only) | AMBIGUOUS | IDV passed but deterrence value, not prevention |
| Gig-platform voucher (biometric attribution) | AMBIGUOUS | Real ID passes; deterrence from biometric commitment |

## bypass_methods_uncovered

- PI/BSO rubber-stamping (real, trusted voucher)
- Recruited/complicit voucher (real person, real gov ID)
- Straw purchaser with legitimate voucher
- Volume-driven rubber-stamping
- Community-lab peer-vouching
- Self-vouching (no orderer ≠ voucher rule)
- Social engineering of provider staff

---

## Verdict: **STRUCTURAL**

One Critical finding (C1: rubber-stamping by real vouchers). This gap is structural to IDV as an identity-verification check — no implementation tweak can make IDV evaluate per-order scrutiny. The gap requires complementary checks (per-order attestation, behavioral analysis). Moderate findings M1–M3 are implementable refinements. Route C1 to human review; M1–M3 are recommendations for stage 4 refinement.
