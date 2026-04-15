# m20-orcid-oauth — bypass-aware hardening v1

- **measure:** M20 (voucher-legitimacy-soc)
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker story walk

### lab-manager-voucher
**Summary:** Insider exploits PI/BSO rubber-stamping; attacker may be the voucher themselves.

**Bypass methods:**
1. *PI rubber-stamps* — **MISSED.** ORCID OAuth proves the voucher controls a real ORCID with employments. A legitimate PI has a strong ORCID record. The check validates identity/affiliation, not whether the PI reviews order content.
2. *Attacker is the registered voucher* — **MISSED.** If the lab manager has their own ORCID (many do), OAuth succeeds. The check does not prevent orderer = voucher.
3. *BSO-as-voucher rubber-stamps* — **MISSED.** BSOs with ORCIDs pass; those without route to the alternate-evidence path (institutional email + faculty page), which a BSO can provide.
4. *Clinical/affiliate delegated batch vouching* — **MISSED.** Lab director's ORCID is typically strong. Batch approval inattention is not tested.
5. *Recruit PI as co-conspirator* — **MISSED.** Complicit PI has a real ORCID.

**Net assessment:** No friction. ORCID OAuth verifies the voucher's scholarly identity; this branch exploits vouchers who are genuinely who they claim to be.

### visiting-researcher
**Summary:** Faculty sponsor as voucher, click-approve.

**Bypass methods:**
1. *Faculty sponsor as voucher* — **MISSED.** Sponsor has a strong ORCID. OAuth proves they are real. Does not address click-approve.
2. *Lab manager/dept admin* — **MISSED.** May or may not have ORCID. If not, alternate-evidence SOP still lets them through with institutional email.
3. *Second lab member* — **MISSED.** Same reasoning.
4. *Second faculty sponsor* — **MISSED.** Strong ORCID expected.

**Net assessment:** No friction. Real academics pass ORCID OAuth trivially.

### unrelated-dept-student
**Summary:** Inherited voucher, straw purchaser, credential compromise.

**Bypass methods:**
1. *Pre-delegated ordering authority* — **MISSED.** Host lab PI has a real ORCID.
2. *Per-order rubber-stamping* — **MISSED.** Same as above.
3. *Straw purchaser via lab member* — **MISSED.** PI vouches for a known lab member; ORCID proves PI identity.
4. *Credential compromise of registered contact* — **CAUGHT.** ORCID OAuth requires the voucher to authenticate directly with ORCID. Stolen provider credentials cannot substitute for ORCID login. The attacker would need the voucher's ORCID password (separate credential set).
5. *Recruit PI as co-conspirator* — **MISSED.** Real ORCID.

**Net assessment:** Catches credential compromise (provider-side only, not ORCID-side). Does not address dominant paths.

### shell-nonprofit
**Summary:** Self-vouching from accomplice; escalation to phishing, credential compromise, gig recruitment, external voucher.

**Bypass methods:**
1. *Self-vouching from accomplice* — **CAUGHT partially.** The accomplice needs an ORCID with employment records at a legitimate institution. If the shell is not a known employer in ORCID (no ROR, no legitimate org record), the `orcid_record_employment_no_ror` flag fires. But if the accomplice has a prior legitimate ORCID from a real institution, they pass. **AMBIGUOUS** — depends on whether the accomplice has a pre-existing legitimate ORCID.
2. *AitM phishing of voucher session* — **CAUGHT partially.** If the phishing captures the ORCID OAuth token after the voucher authenticates, the attacker has a valid token. ORCID OAuth does not include liveness; token replay is possible within the token lifetime. **MISSED** if the attacker captures the token post-authentication. **CAUGHT** if the provider requires the OAuth to happen in a fresh, provider-controlled session that cannot be intercepted.
3. *Credential compromise of colliding institution's staff* — **CAUGHT partially.** The attacker needs the victim's ORCID credentials (not just provider credentials). ORCID accounts have separate passwords. This raises the bar from one credential set to two. But ORCID accounts rarely have MFA enabled. **AMBIGUOUS** — meaningful friction but not a hard stop.
4. *Gig-platform voucher* — **CAUGHT partially.** A gig worker would need their own ORCID with employment records at a legitimate institution. Most gig workers recruited for this purpose would not have such an ORCID. The `orcid_record_empty_employments` or `orcid_record_stale_employments` flags would fire. **CAUGHT** for opportunistic gig recruitment; **MISSED** if the gig worker happens to be a real researcher.
5. *Recruit external voucher with institutional affiliation* — **MISSED.** A real researcher with a real ORCID passes OAuth trivially.

**Net assessment:** Meaningful friction for gig-platform and poorly-backstopped accomplice paths. Weak against recruited real researchers. Token-replay risk for phishing path.

### shell-company
**Summary:** Second shell entity as voucher, recruit external voucher, social-engineer provider staff.

**Bypass methods:**
1. *Second shell entity* — **CAUGHT partially.** Person from the second shell needs an ORCID with employment at a recognized org. If neither shell is in ORCID/ROR, both employments and org-disambiguation fail. But if the person has a prior ORCID from a real employer, they pass.
2. *Recruit external voucher* — **MISSED.** Real researcher, real ORCID.
3. *Social engineering of provider staff* — **MISSED.** Bypasses the check entirely.

**Net assessment:** Some friction for shell-to-shell (ORCID employment records are harder to fabricate than domain ownership). Weak against recruited vouchers.

### insider-recruitment
**Summary:** Recruited insider serves as real voucher.

**Bypass methods:** Recruited insider has a real ORCID (or passes alternate-evidence SOP as a real employee). — **MISSED.**

**Net assessment:** No friction.

### account-hijack
**Summary:** Hijack voucher's account/session.

**Bypass methods:** Session hijack. — **CAUGHT partially.** If voucher-onboarding requires a fresh ORCID OAuth, account/session hijack of the provider does not give ORCID access. But if the ORCID OAuth was done at onboarding and the provider only checks the stored token thereafter, a later account hijack can submit vouching approvals without re-authenticating via ORCID. **AMBIGUOUS** — depends on whether ORCID re-authentication is required per vouching action or only at onboarding.

**Net assessment:** Strong if ORCID re-auth is per-action. Weak if ORCID OAuth is one-time-at-onboarding.

### credential-compromise
**Summary:** Compromise PI/voucher credentials.

**Bypass methods:** Credential theft. — **CAUGHT partially.** Attacker needs the voucher's ORCID credentials in addition to provider credentials. ORCID accounts typically lack MFA. Raises the bar but does not eliminate the path.

**Net assessment:** Meaningful friction (second credential set). Not a hard stop.

### inbox-compromise
**Summary:** Intercept/forge voucher correspondence.

**Bypass methods:** Email interception. — **CAUGHT.** ORCID OAuth is a browser redirect, not an email-based flow. Inbox control does not provide ORCID authentication. The attacker would need the voucher's ORCID login.

**Net assessment:** Strong catch. Forces attacker from email-only to credential-theft of ORCID.

### dormant-account-takeover
**Summary:** Stale voucher records.

**Bypass methods:** Exploit stale voucher. — **CAUGHT partially.** If the provider checks `employments` recency, a dormant account's stale ORCID (employment ended >12 months ago) triggers `orcid_record_stale_employments`. But if the original voucher's ORCID still shows active employment (because ORCID records are user-maintained and rarely updated), the staleness is invisible.

**Net assessment:** Partial catch. Depends on ORCID record maintenance habits.

### biotech-incubator-tenant
**Summary:** Co-tenant recruited as voucher.

**Bypass methods:** Co-tenant voucher. — **MISSED.** Real person with plausible ORCID and institutional affiliation at the incubator or a related entity.

**Net assessment:** No meaningful friction.

### community-bio-lab-network
**Summary:** Mutual peer-vouching.

**Bypass methods:** Peer-vouching. — **CAUGHT partially.** Community-lab members often lack ORCIDs or have thin ORCID records (no employments, no works). The `orcid_record_empty_employments` and `orcid_record_no_works` flags would fire. But the alternate-evidence SOP (institutional email + faculty page) might still let them through if the community lab has an email domain.

**Net assessment:** Moderate friction. Raises the bar for community-lab vouchers but the alternate-evidence path is a safety valve.

### cro-framing
**Summary:** Fake client as voucher or self-vouch within CRO.

**Bypass methods:** Fabricated voucher relationship. — **CAUGHT partially.** The "client" voucher needs an ORCID with employment at a recognized institution. If the client persona is fabricated, they likely lack a credible ORCID. But CROs often work with real researchers who could be recruited.

**Net assessment:** Friction for fabricated personas; weak against real recruits.

### cro-identity-rotation
**Summary:** Voucher reconstruction per rotation.

**Bypass methods:** Per-rotation voucher. — **CAUGHT partially.** Each rotation needs a voucher with a valid ORCID and current employment. This is harder to produce repeatedly than a simple form submission. But one stable recruited researcher could vouch for multiple rotated CRO identities.

**Net assessment:** Meaningful per-rotation friction. Circumventable with a stable recruited voucher.

### gradual-legitimacy-accumulation
**Summary:** Long-term voucher who rubber-stamps.

**Bypass methods:** Cultivated voucher rubber-stamps. — **MISSED.** Long-term voucher has a strong ORCID.

**Net assessment:** No friction.

### dormant-domain
**Summary:** Fabricated voucher persona on revived domain.

**Bypass methods:** Fabricated voucher. — **CAUGHT.** A fabricated persona cannot produce a real ORCID with employment records. The `voucher_no_orcid_claim` flag routes to alternate evidence, and a fabricated persona on a dormant domain is unlikely to have a faculty page or published papers.

**Net assessment:** Strong catch against fabricated personas.

### foreign-institution
**Summary:** Foreign colleague as voucher.

**Bypass methods:** Cross-border verification asymmetry. — **CAUGHT partially.** ORCID is global. If the foreign voucher has an ORCID, their employment records can be checked. But ORCID adoption is lower in many foreign regions (acknowledged in `false_positive_qualitative`), and the alternate-evidence SOP for vouchers without ORCIDs may be easier to satisfy with a foreign institutional email that is hard to verify.

**Net assessment:** Partial catch. ORCID coverage gaps in foreign regions limit effectiveness.

### it-persona-manufacturing
**Summary:** Manufactured second persona with IT credentials.

**Bypass methods:** Manufactured persona as voucher. — **CAUGHT.** A manufactured IT persona would not have a legitimate ORCID (ORCIDs are tied to real scholarly identities, not IT accounts). The `voucher_no_orcid_claim` path would require alternate evidence; a manufactured persona might have an institutional email but likely lacks publications or a faculty page.

**Net assessment:** Strong catch. ORCID is a harder identity layer to fabricate than IT credentials.

### bulk-order-noise-cover
**Summary:** Volume-driven voucher inattention.

**Bypass methods:** Rubber-stamping under volume. — **MISSED.** ORCID OAuth is a one-time voucher-qualification event. Per-order rubber-stamping is not addressed.

**Net assessment:** No friction.

---

## Findings

### Critical

**C1. Rubber-stamping by legitimate vouchers with real ORCIDs is systematically missed.**
- Stories: lab-manager-voucher (all), visiting-researcher (all), unrelated-dept-student (A, B), bulk-order-noise-cover, gradual-legitimacy-accumulation.
- Why missed: ORCID OAuth proves the voucher *is who they claim to be* and *has a scholarly identity*. It does not verify whether the voucher has reviewed the specific SOC order. Every exploit-affiliation branch that uses a real, inattentive voucher passes this check.
- Suggestion: This is partially structural — ORCID OAuth is an identity/affiliation check, not an order-scrutiny check. It should be paired with a per-order attestation mechanism (see m20-live-video-attestation C1). Within stage 4, no tweak to the ORCID implementation addresses this gap; it requires a complementary check.

### Moderate

**M1. Alternate-evidence SOP is a bypass safety valve.**
- Stories: community-bio-lab-network, shell-nonprofit (accomplice with prior employer), visiting-researcher (lab manager without ORCID).
- Why missed: The alternate-evidence path (institutional email + one of {paper, faculty page, grant record}) is significantly weaker than ORCID OAuth. An attacker who cannot produce an ORCID can often produce an institutional email (via inbox compromise, shell domain, or real enrollment) plus a plausible faculty page (easy to fabricate on a shell domain).
- Suggestion: Tighten the alternate-evidence SOP: require DKIM-verified institutional email (not self-asserted) AND at least two independent corroborating signals (not just one). Flag alternate-evidence vouchers for elevated scrutiny on downstream checks.

**M2. ORCID OAuth token replay risk.**
- Stories: shell-nonprofit (AitM phishing).
- Why missed: The implementation does not specify token-binding or freshness requirements. If the attacker phishes the ORCID OAuth flow (capturing the authorization code or access token in transit), they can replay it.
- Suggestion: Use PKCE (Proof Key for Code Exchange) in the OAuth flow; require that the ORCID redirect URI is on a provider-controlled domain with HSTS; consider requiring re-authentication for each vouching action (not just onboarding).

**M3. ORCID re-authentication cadence is unspecified.**
- Stories: account-hijack, dormant-account-takeover.
- Why missed: The implementation describes ORCID OAuth at voucher onboarding but does not specify whether re-authentication is required per vouching action, per period, or only once. If once, account hijack after onboarding bypasses the ORCID layer.
- Suggestion: Require ORCID re-authentication at minimum annually and on any vouching action for SOC orders above a risk threshold.

**M4. Self-vouching (orderer = voucher) not blocked.**
- Stories: lab-manager-voucher (a).
- Why missed: No identity deconfliction between orderer and voucher ORCID iDs.
- Suggestion: Compare `orderer_orcid` ≠ `voucher_orcid`. Trivial to implement.

### Minor

**m1. ORCID adoption gaps in foreign/clinical/industry fields.**
- Stories: foreign-institution, visiting-researcher (lab managers).
- Detail: Acknowledged in `false_positive_qualitative` but the alternate-evidence SOP (M1 above) is the practical escape route for attackers targeting these populations.

**m2. ORCID employment records are user-maintained.**
- Stories: dormant-account-takeover.
- Detail: Stale employment records are unreliable indicators of current affiliation. The implementation's 12-month staleness check helps but depends on researcher diligence in updating ORCID.

---

## bypass_methods_known

| Bypass | Classification | Notes |
|---|---|---|
| Credential compromise (provider-side only) | CAUGHT | ORCID OAuth requires separate authentication |
| Inbox compromise for email-based vouching | CAUGHT | OAuth is browser-redirect, not email |
| Fabricated persona (no ORCID, no scholarly record) | CAUGHT | ORCID employment + works checks expose thin records |
| IT-manufactured persona | CAUGHT | No real ORCID for IT-only artifacts |
| Dormant-domain fabricated voucher | CAUGHT | Cannot produce credible ORCID |
| Gig-platform voucher (no scholarly background) | CAUGHT | Empty ORCID record, flags fire |
| PI/BSO rubber-stamping | MISSED | Real ORCID, real identity; order scrutiny untested |
| Recruited/complicit voucher | MISSED | Real ORCID, real credentials |
| Straw purchaser via lab member | MISSED | PI voucher has real ORCID |
| Volume-driven voucher inattention | MISSED | One-time-at-onboarding check |
| Gradual-legitimacy rubber-stamping | MISSED | Strong ORCID from years of legitimate work |
| Social engineering of provider staff | MISSED | Bypasses check entirely |
| AitM phishing (ORCID token replay) | AMBIGUOUS | Depends on PKCE, token binding, freshness |
| Account hijack (post-onboarding) | AMBIGUOUS | Depends on re-auth cadence |
| Shell accomplice with prior legitimate ORCID | AMBIGUOUS | Depends on employment recency check stringency |
| Community-lab peers via alternate-evidence SOP | AMBIGUOUS | Depends on alternate-evidence SOP rigor |

## bypass_methods_uncovered

- PI/BSO rubber-stamping (real, trusted voucher; order scrutiny untested)
- Recruited/complicit voucher (real ORCID, real credentials)
- Straw purchaser via lab member
- Volume-driven voucher inattention
- Gradual-legitimacy rubber-stamping
- Social engineering of provider staff
- Alternate-evidence SOP as bypass safety valve

---

## Verdict: **STRUCTURAL**

One Critical finding (C1: rubber-stamping by legitimate vouchers). This gap is structural to ORCID OAuth as an identity/affiliation check — no implementation tweak within this idea can address per-order scrutiny. The gap requires a complementary check (per-order attestation, behavioral anomaly detection) rather than re-research of the ORCID implementation. Moderate findings M1–M4 are addressable within stage 4 but do not rise to Critical. Route C1 to human review; M1–M4 are recommendations for stage 4 refinement if a re-research loop is triggered by a sibling idea.
