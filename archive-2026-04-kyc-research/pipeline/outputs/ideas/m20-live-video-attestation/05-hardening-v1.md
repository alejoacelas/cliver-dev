# m20-live-video-attestation — bypass-aware hardening v1

- **measure:** M20 (voucher-legitimacy-soc)
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker story walk

### lab-manager-voucher
**Summary:** Insider exploits PI/BSO rubber-stamping; in some variants attacker is the registered voucher themselves.

**Bypass methods:**
1. *PI rubber-stamps without reading sequence context* — **MISSED.** The live video call verifies the voucher is a real person with a real ID and a real relationship to the customer. It does NOT evaluate whether the voucher has actually reviewed the SOC order content. The two unscripted questions ("When did you last work with [customer]?" and "What lab/group do they work in?") test relationship knowledge, not order scrutiny. A long-tenured lab manager's PI will pass these trivially and honestly, while still rubber-stamping the dangerous order.
2. *Attacker is the registered voucher (self-vouching)* — **AMBIGUOUS.** The implementation does not specify a rule preventing the orderer from also being the voucher. Video attestation would succeed because the person is real. Depends on whether a separate self-vouching prohibition exists upstream (e.g. m20-ror-disjointness or a simple orderer≠voucher rule).
3. *BSO-as-voucher rubber-stamping* — **MISSED.** Same as (1). BSO passes video attestation trivially; the check does not address rubber-stamping.
4. *Clinical/affiliate delegated batch vouching* — **MISSED.** Lab director who approves batch procurement is real, credentialed, and will pass video attestation. The call is per-voucher-onboarding, not per-order, so batch approval inattention is not tested.
5. *Recruit PI/BSO as co-conspirator* — **MISSED.** A knowingly complicit PI passes the video call and answers all questions correctly. The check authenticates identity, not intent.

**Net assessment:** Video attestation does NOT meaningfully reduce cost/lead-time for this attacker. The branch's core bypass (rubber-stamping by a real, trusted voucher) produces exactly the signals the check looks for — a real person with a real ID and genuine knowledge of the customer.

### visiting-researcher
**Summary:** Faculty sponsor acts as voucher; bypass is sponsor click-approve.

**Bypass methods:**
1. *Faculty sponsor as voucher (click-approve)* — **MISSED.** Sponsor is a real person, holds real ID, genuinely knows the visiting researcher. Passes video attestation.
2. *Lab manager/dept admin as voucher* — **MISSED.** Same reasoning.
3. *Second lab member as voucher* — **MISSED.** Same reasoning.
4. *Second faculty sponsor* — **MISSED.** Same reasoning; slightly harder to arrange but still passes the video check.

**Net assessment:** No meaningful cost increase. The check authenticates identity; this branch's bypasses all use real people with real relationships.

### unrelated-dept-student
**Summary:** Exploit affiliation via inherited voucher, straw purchaser, or credential compromise.

**Bypass methods:**
1. *Pre-delegated ordering authority (inherited voucher)* — **MISSED.** Host lab PI is a real voucher, passes video attestation.
2. *Per-order rubber-stamping by inattentive voucher* — **MISSED.** Same as lab-manager-voucher (1).
3. *Straw purchaser via authorized lab member* — **MISSED.** The straw purchaser is a real lab member; the voucher (the lab's PI) knows the straw purchaser and will pass the call. The actual attacker is absent from the process.
4. *Credential compromise of registered contact* — **CAUGHT.** The live video call with ID check would detect that the person on the call is not the credentialed voucher (face-match to ID). This is a direct catch.
5. *Recruit PI as knowing co-conspirator* — **MISSED.** Same as lab-manager-voucher (5).

**Net assessment:** Catches credential compromise (one of five bypasses). Does not address the dominant paths (rubber-stamping, straw purchase, co-conspiracy).

### shell-nonprofit
**Summary:** Self-vouching from accomplice; escalation to phishing, credential compromise, gig-platform recruitment, or external recruited voucher.

**Bypass methods:**
1. *Self-vouching from accomplice within the shell* — **CAUGHT partially.** The accomplice is a real person who can pass video attestation. However, if the accomplice is poorly backstopped (no genuine institutional knowledge, scripted answers), the unscripted questions and coaching-detection checks might catch this. **AMBIGUOUS** — depends on accomplice quality.
2. *AitM phishing of existing institutional voucher's session* — **CAUGHT.** Video call with live ID check cannot be replayed via a session hijack. The attacker would need the real voucher's face and ID, not just their session token.
3. *Credential compromise of colliding institution's staff* — **CAUGHT.** Same as unrelated-dept-student (4) — live face-to-ID matching defeats credential theft.
4. *Anonymous gig-platform voucher recruitment* — **CAUGHT partially.** The gig worker is a real person with a real ID, so they pass identity verification. However, the unscripted questions about the relationship with the customer would likely expose a gig worker who has no genuine knowledge. **AMBIGUOUS** — depends on how well the gig worker is briefed.
5. *Recruit external voucher with independent institutional affiliation* — **MISSED.** A recruited voucher with real credentials and genuine institutional affiliation passes the video call. The check authenticates identity and relationship plausibility, but a well-briefed recruited voucher provides both.

**Net assessment:** Meaningfully increases cost for phishing/credential-compromise paths. Provides some friction for gig-platform and shell-accomplice paths (depends on reviewer skill at detecting coached answers). Does not address recruited external vouchers.

### shell-company
**Summary:** Second shell entity as voucher, recruit external voucher, social-engineer provider staff.

**Bypass methods:**
1. *Second shell entity as cross-org voucher* — **CAUGHT partially.** Person from the second shell has a real ID but their relationship claims may be thin. Unscripted questions could expose this. **AMBIGUOUS** — depends on how well the shell is backstopped.
2. *Recruit external voucher* — **MISSED.** Same as shell-nonprofit (5).
3. *Social engineering of provider staff* — **MISSED.** This bypasses the voucher check entirely by manipulating the provider into waiving it. Video attestation cannot defend against internal provider-staff manipulation.

**Net assessment:** Weak friction on shell-to-shell vouching. Does not address external recruitment or social engineering.

### insider-recruitment
**Summary:** Recruited insider serves as real voucher, knowingly approves orders.

**Bypass methods:** Recruited insider is a real, credentialed employee. — **MISSED.** Passes video attestation with genuine ID and genuine institutional knowledge.

**Net assessment:** No friction. Check authenticates identity; the insider is genuinely who they claim to be.

### account-hijack
**Summary:** Hijack voucher's account/session to self-approve.

**Bypass methods:** Session/account hijack. — **CAUGHT.** Video call requires live presence with matching government ID. Session hijack is insufficient.

**Net assessment:** Strong catch. This is a core strength of the video attestation check.

### credential-compromise
**Summary:** Compromise PI/voucher credentials.

**Bypass methods:** Credential theft to approve own orders. — **CAUGHT.** Same as account-hijack — live video with ID defeats remote credential use.

**Net assessment:** Strong catch.

### inbox-compromise
**Summary:** Intercept/forge voucher correspondence and approval flows.

**Bypass methods:** Inbox control to forge voucher approval. — **CAUGHT.** If vouching requires a live video call, email interception cannot substitute. The attacker would need to appear on camera with the voucher's ID.

**Net assessment:** Strong catch. Forces attacker from an inbox-only attack to a physical-presence attack.

### dormant-account-takeover
**Summary:** Dormant accounts have stale voucher records; takeover inherits the voucher relationship.

**Bypass methods:** Exploit stale voucher relationship. — **CAUGHT.** If the provider requires a fresh video attestation (not just an inherited stale approval), the attacker cannot produce the original voucher on camera.

**Net assessment:** Strong catch, IF the implementation requires periodic re-attestation. The current implementation does not explicitly specify re-attestation cadence. **AMBIGUOUS** on cadence.

### biotech-incubator-tenant
**Summary:** Recruit co-tenant or incubator staff as cross-org voucher.

**Bypass methods:** Recruit co-tenant as voucher. — **MISSED.** Co-tenant is real, has real ID, and can plausibly claim a professional relationship. Passes video attestation.

**Net assessment:** No meaningful friction.

### community-bio-lab-network
**Summary:** Peer-vouching within community lab network.

**Bypass methods:** Mutual peer-vouching at low cost. — **MISSED.** Community lab peers are real people with real IDs and genuine knowledge of each other. Video attestation authenticates identity, which is not the weakness this branch exploits.

**Net assessment:** No friction. The branch exploits the low bar of community norms, not identity fraud.

### cro-framing
**Summary:** Fake client institution as voucher or self-vouch within CRO.

**Bypass methods:** Fabricated client-as-voucher or internal self-vouching. — **CAUGHT partially.** If the "client" voucher is a fabricated persona, video attestation with ID check establishes they are a real person. But the relationship claim (client of the CRO) may be hard to disprove with unscripted questions. **AMBIGUOUS** — depends on the depth of the CRO backstory.

**Net assessment:** Some friction for purely fabricated personas; weak against real people in a fabricated business relationship.

### cro-identity-rotation
**Summary:** Each rotated CRO identity must reconstruct a voucher relationship.

**Bypass methods:** Voucher reconstruction per rotation. — **CAUGHT partially.** Each rotation requires a new live video call, adding ~$25–30 per rotation plus scheduling friction. This is meaningful cost amplification. But if the attacker recruits one stable external voucher who claims a different client relationship each time, they pass.

**Net assessment:** Meaningful cost amplification per rotation ($25–30 + scheduling), but a stable recruited voucher defeats it.

### gradual-legitimacy-accumulation
**Summary:** Cultivate long-term voucher relationship as part of accumulated legitimacy.

**Bypass methods:** Voucher knows the entity casually and rubber-stamps. — **MISSED.** After years of legitimate relationship, the voucher passes video attestation trivially. This is the same rubber-stamping problem as lab-manager-voucher.

**Net assessment:** No friction. The branch builds exactly the kind of legitimate relationship that passes the check.

### dormant-domain
**Summary:** Revived domain paired with fabricated voucher persona.

**Bypass methods:** Fabricated voucher on the same domain. — **CAUGHT.** Video attestation with ID check catches a purely fabricated persona (the "voucher" either doesn't exist or can't produce matching ID).

**Net assessment:** Strong catch against fabricated personas. Weak if the attacker recruits a real person to act as the voucher.

### foreign-institution
**Summary:** Foreign colleague as voucher with verification asymmetry.

**Bypass methods:** Cross-border voucher verification is structurally weak. — **CAUGHT partially.** Video attestation with ID check verifies the person is real and holds a real foreign ID. But the reviewer cannot easily assess whether the claimed foreign institutional affiliation is genuine, and the unscripted questions may be hampered by language barriers (acknowledged in `false_positive_qualitative`). **AMBIGUOUS** — depends on reviewer language capability and the strength of the foreign institution backstory.

**Net assessment:** Partial friction. Identity is verified; affiliation claim remains hard to assess.

### it-persona-manufacturing
**Summary:** Manufacture second persona with real IT-issued credentials to act as voucher.

**Bypass methods:** Manufactured but credentialed voucher persona. — **CAUGHT.** Video attestation requires a government ID match. A manufactured IT persona (real email, real badge) may not have a matching government ID, since government IDs are issued to real people, not IT artifacts. This is a strong catch — the persona is real in the IT system but may not map to the person appearing on camera.

**Net assessment:** Strong catch IF the government ID name does not match the manufactured persona name. **AMBIGUOUS** if the manufactured persona uses the attacker's real name with a fake job title.

### bulk-order-noise-cover
**Summary:** Voucher rubber-stamps within high-volume legitimate flow.

**Bypass methods:** Volume-driven voucher inattention. — **MISSED.** The video call authenticates the voucher; it does not test per-order scrutiny. If video attestation is per-voucher-onboarding (not per-order), volume-driven rubber-stamping is unaffected.

**Net assessment:** No friction.

---

## Findings

### Critical

**C1. Rubber-stamping by legitimate vouchers is systematically missed.**
- Stories: lab-manager-voucher, visiting-researcher, unrelated-dept-student (paths A, B), bulk-order-noise-cover, gradual-legitimacy-accumulation.
- Why missed: Video attestation verifies the voucher's *identity* (real person, real ID, real relationship knowledge). It does NOT verify whether the voucher has actually scrutinized the specific SOC order. The two unscripted questions test relationship knowledge, not order content review. The modal bypass for exploit-affiliation branches is a real, legitimate voucher who rubber-stamps — and this check produces a clean PASS for exactly that scenario.
- Suggestion: Add a per-order attestation element (not just per-voucher-onboarding): on each SOC order, the voucher must state the specific sequences/genes and their intended use on camera, or sign a per-order digital attestation with sequence-specific content. This raises the cost of inattention but does not eliminate it.

**C2. Recruited/complicit vouchers pass trivially.**
- Stories: lab-manager-voucher (d), shell-nonprofit (5), shell-company (2), insider-recruitment, biotech-incubator-tenant, community-bio-lab-network.
- Why missed: A knowingly complicit or financially recruited voucher is a real person with a real ID and (often) a genuine institutional relationship. Video attestation's identity checks are not designed to detect intent or financial motivation. The check authenticates *who the voucher is*, not *why they are vouching*.
- Suggestion: This is partially structural — no identity check can detect malicious intent. Complementary signals (m20-ror-disjointness, m20-voucher-trust-score's seniority weighting, behavioral anomaly detection on voucher-order patterns) may help but cannot close this gap fully.

### Moderate

**M1. Self-vouching is not explicitly blocked.**
- Stories: lab-manager-voucher (a), cro-framing.
- Why missed: The implementation does not specify a rule that orderer ≠ voucher. If the same person can hold both roles, video attestation succeeds trivially.
- Suggestion: Add an explicit orderer-voucher identity deconfliction rule (compare verified names / gov ID numbers).

**M2. Per-order vs. per-onboarding cadence is unspecified.**
- Stories: bulk-order-noise-cover, cro-identity-rotation.
- Why missed: The implementation describes the video call as a voucher-qualification event but does not pin down whether re-attestation is required per order, per period, or only at onboarding. If only at onboarding, volume-driven rubber-stamping is unaffected.
- Suggestion: Specify cadence: at minimum, annual re-attestation plus per-order digital sign-off referencing the video attestation.

**M3. Social engineering of provider staff bypasses the check entirely.**
- Stories: shell-company (3).
- Why missed: This is an attack on the provider's internal compliance process, not on the voucher. Out of scope for this specific check but should be noted.
- Suggestion: Covered by internal compliance training, not by this check.

### Minor

**m1. Reviewer language/cultural competence for foreign vouchers.**
- Stories: foreign-institution.
- Detail: The implementation acknowledges this in `false_positive_qualitative` but does not specify a language-competent reviewer pool or translation protocol for unscripted questions.

**m2. Re-attestation cadence for dormant-account defense.**
- Stories: dormant-account-takeover.
- Detail: Video attestation catches dormant-account takeover only if re-attestation is required. The implementation does not specify periodic re-attestation triggers.

---

## bypass_methods_known

| Bypass | Classification | Notes |
|---|---|---|
| Credential compromise / session hijack of voucher | CAUGHT | Live face-to-ID match defeats remote credential use |
| AitM phishing of voucher session | CAUGHT | Cannot replay a live video call |
| Inbox compromise to forge voucher approval | CAUGHT | Video call cannot be substituted by email |
| Fabricated voucher persona (no real person) | CAUGHT | Gov ID + face match requires a real person |
| Dormant-account voucher inheritance (if re-attestation exists) | CAUGHT | Fresh call required |
| IT-manufactured persona (gov ID mismatch) | CAUGHT | Gov ID name vs. IT persona name diverge |
| PI/BSO rubber-stamping | MISSED | Check verifies identity, not order scrutiny |
| Recruited/complicit voucher | MISSED | Real person with real ID and real relationship |
| Straw purchaser via authorized lab member | MISSED | Voucher knows the straw purchaser genuinely |
| Batch/volume-driven voucher inattention | MISSED | Per-onboarding check, not per-order |
| Self-vouching (orderer = voucher) | MISSED | No deconfliction rule specified |
| External recruited voucher (financial) | MISSED | Real person, real institution |
| Community-lab mutual vouching | MISSED | Real people, genuine peer relationships |
| Social engineering of provider staff | MISSED | Out of scope for this check |
| Gig-platform voucher | AMBIGUOUS | Depends on reviewer detection of coached answers |
| Shell accomplice voucher | AMBIGUOUS | Depends on accomplice backstory quality |
| Foreign-institution voucher | AMBIGUOUS | Language barrier limits reviewer assessment |

## bypass_methods_uncovered

- PI/BSO rubber-stamping (real, trusted voucher who does not scrutinize the order)
- Recruited/complicit voucher (real person, genuine credentials, malicious intent)
- Straw purchaser via authorized lab member (attacker absent from the process)
- Batch/volume-driven voucher inattention
- Self-vouching (no orderer ≠ voucher rule)
- External recruited voucher
- Community-lab mutual peer-vouching
- Social engineering of provider staff
- Gradual-legitimacy-accumulation rubber-stamping

---

## Verdict: **RE-RESEARCH**

Two Critical findings (C1: rubber-stamping systematically missed; C2: recruited/complicit vouchers pass trivially). C1 is addressable by adding per-order attestation content requirements. C2 is partially structural but can be tightened with complementary signals. Recommend one re-research loop through stage 4 to address C1 (per-order attestation) and M1 (self-vouching deconfliction).
