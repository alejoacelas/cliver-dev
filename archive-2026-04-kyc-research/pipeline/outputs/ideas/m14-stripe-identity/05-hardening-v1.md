# m14-stripe-identity — Bypass-aware hardening v1

- **idea:** Stripe Identity (low-friction document + selfie IDV)
- **measure:** M14 — identity-evidence-match
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walkthrough

### 1. account-hijack — impersonate-employee, Branch C

**Summary:** Hijack a real PI's provider account and order SOC under their identity.

**Bypass methods relevant to M14:**

1. **Deepfake injection against the IDV vendor's liveness flow.**
   - **MISSED.** Stripe Identity markets iBeta-tested PAD but publishes no PAD level or ISO 30107-3 certification. The implementation document acknowledges this gap (`[vendor-described, not technically documented]`). No field in `fields_returned` exposes a PAD confidence score or injection-detection signal. The provider has no programmatic way to assess whether Stripe caught an injection vs. a real face. If Stripe's liveness is defeated, the session returns `verified` with no distinguishing signal.

2. **Face morphing on a forged or altered government document.**
   - **MISSED.** Stripe returns `selfie.status` and `document.status` but does not expose a morph-detection score or document-authenticity confidence level. The `document.error.code` set covers tampering at a coarse level (e.g., image manipulation) but morph detection on the embedded photo requires specialized analysis Stripe does not publicly claim. If the morph passes Stripe's internal checks, the session succeeds identically to a genuine one.

3. **IDV-session handoff exploit — initiate on victim's account, complete liveness from a different device.**
   - **AMBIGUOUS.** Stripe Identity uses a client secret tied to the `VerificationSession` object. Whether Stripe binds the session to a device fingerprint or IP is not documented in the implementation. If Stripe allows the client secret to be used from any device, a session created on the victim's account could be completed by the attacker on their own device with their own (or morphed) face.

**Net assessment:** The check imposes cost (attacker must have a deepfake/morph rig, ~$5–30K) but all three bypass methods could produce a clean `verified` session with no distinguishing signal in the returned fields. The implementation as specified does not give the provider any lever to detect these attacks beyond trusting Stripe's opaque liveness.

---

### 2. credential-compromise — Branch A

**Summary:** ATO of existing customer or new-account fraud under stolen PII.

**Bypass methods relevant to M14:**

1. **"ATO inherits prior pass" — no fresh proofing if provider doesn't re-trigger.**
   - **CAUGHT** (conditionally). The implementation describes SOC-order-triggered verification, meaning a new `VerificationSession` is created per SOC order. If enforced, prior verification status is not inherited. However, the implementation does not explicitly state a per-SOC-order trigger policy — flags are thrown on mismatch but the triggering cadence is left to the provider's policy. **AMBIGUOUS** on whether the implementation mandates per-order re-proofing vs. session caching.

2. **Fraudulent govt ID + injection attack.**
   - **MISSED.** Same as account-hijack method 1. No injection-detection signal exposed.

3. **Face morphing.**
   - **MISSED.** Same as account-hijack method 2.

4. **Presentation attack (printed photo, mask, screen replay).**
   - **AMBIGUOUS.** Stripe claims PAD/liveness but no published level. The implementation cannot independently verify PAD strength.

5. **Social-engineer support to push manual override.**
   - **CAUGHT.** The `manual_review_handoff` SOP requires Stripe Dashboard verification of doc/selfie before override. The reviewer sees the raw images and sub-check results. Social engineering must also fool a reviewer looking at the actual Stripe verification report, not just a status flag.

**Net assessment:** Meaningful friction: forces the attacker to invest in injection/morph tools and risk leaving biometric evidence. But the implementation has no signal to distinguish a successful injection from a genuine verification.

---

### 3. dormant-account-takeover — exploit-affiliation, Branch D

**Summary:** IT admin reactivates dormant account whose IAL2 binding belongs to a former lab member.

**Bypass methods relevant to M14:**

1. **Deepfake injection of the original account holder.**
   - **MISSED.** Same analysis as account-hijack method 1.

2. **Face morphing on a forged ID under original holder's name.**
   - **MISSED.** Same analysis as account-hijack method 2.

3. **Route to manual review fallback and social-engineer the reviewer.**
   - **CAUGHT.** The SOP in `manual_review_handoff` requires the reviewer to compare `verified_outputs` (name/DOB) against the account-holder record and see Stripe's sub-check results. An IT admin who is not the original holder would produce a name/DOB mismatch, triggering `stripe_identity_name_mismatch`. The reviewer would see this flag.

4. **Abandon SOC orders if order-triggered re-proofing is enforced.**
   - **CAUGHT.** This is deterrence-by-design — the attacker gives up. The check succeeds by forcing abandonment.

**Net assessment:** Strong deterrence. The attacker must either possess a deepfake/morph rig capable of fooling Stripe's undisclosed PAD, or abandon SOC orders entirely.

---

### 4. dormant-domain — fake-affiliation, Branch A

**Summary:** Re-register lapsed academic domain and present as that institution.

**Bypass methods relevant to M14:**

1. **Injection attack against weak vendor SDK ($5–30K rig).**
   - **MISSED.** Same as above — no injection-detection signal.

2. **Attacker uses own real face on real documents.**
   - **CAUGHT.** Stripe Identity verifies the attacker's real ID; `verified_outputs` name will match the account holder (the attacker). M14 passes because there is no mismatch. However, this means M14 does not *detect* the attacker — the attack is elsewhere (fake affiliation). This is a structural pass-through, not a detection.

**Net assessment:** M14 imposes an audit trail (the attacker's real identity is on file) but does not block the order. The injection path is the only one where M14 is the blocking gate, and it's missed.

---

### 5. cro-identity-rotation — purpose-built, Branch B

**Summary:** Short-lived CRO personas with fresh accomplice identities at each provider.

**Bypass methods relevant to M14:**

1. **Fresh real human submits IAL2 for each new persona.**
   - **MISSED (structural).** The accomplice's real face and real ID match the account holder record because the accomplice *is* the account holder. Stripe Identity returns a clean `verified` session. No field in `fields_returned` flags that the identity is being used as a front. M14 cannot distinguish a willing accomplice from a genuine principal.

2. **IDV-vendor-aware provider selection to avoid cross-tenant biometric matching.**
   - **MISSED (structural).** Stripe Identity does not expose cross-tenant biometric dedup. Each `VerificationSession` is scoped to the provider's Stripe account. Even if the same accomplice face appears at multiple providers, Stripe does not surface this.

**Net assessment:** Structural defeat. M14 passes by definition for fronted-accomplice branches.

---

### 6. shell-nonprofit — purpose-built, Branch E

**Summary:** Shell 501(c)(3) with accomplice completing IAL2 as second registered contact.

**Bypass methods relevant to M14:**

1. **Accomplice completes IAL2 with real face and real ID.**
   - **MISSED (structural).** Same as cro-identity-rotation: real accomplice = real identity = clean pass. No field detects fronting.

**Net assessment:** Structural defeat.

---

### 7. biotech-incubator-tenant — purpose-built, Branch D

**Summary:** Incubator slot under attacker's or accomplice's real ID.

**Bypass methods relevant to M14:**

1. **Attacker uses own real ID (passes IAL1/IAL2 natively).**
   - **MISSED (structural).** Real ID = clean pass. Audit trail only.

2. **Accomplice acts as named principal.**
   - **MISSED (structural).** Same fronted-accomplice pattern.

**Net assessment:** Structural defeat. M14 provides audit trail but no blocking signal.

---

### 8. bulk-order-noise-cover — exploit-affiliation, Branch E

**Summary:** Hide SOC orders inside high-volume ordering at a shared facility.

**Bypass methods relevant to M14:**

1. **Shared-account sub-variant: IAL2 on file belongs to predecessor facility manager who left.**
   - **CAUGHT.** If the provider triggers a new `VerificationSession` at SOC order time, the current orderer must verify. Their `verified_outputs` (name/DOB) will mismatch the original account holder, triggering `stripe_identity_name_mismatch`. The reviewer sees this and follows up.

**Net assessment:** Effective — this is the core M14 use case (named orderer ≠ account holder).

---

### 9. it-persona-manufacturing — exploit-affiliation, Branch B

**Summary:** Multiple personas inside real institution's email domain.

**Bypass methods relevant to M14:**

1. **Real attacker completes IAL2 in own face for one persona.**
   - **CAUGHT** (single persona). Stripe verifies the real attacker; identity matches account holder.

2. **Second persona requires either accomplice or biometric collision.**
   - **AMBIGUOUS.** Stripe Identity does not expose intra-tenant biometric dedup (checking whether the same face has already verified under a different account). The implementation does not mention cross-session face matching. If the attacker uses their own face for two personas, Stripe may or may not flag this — no field surfaces it.

**Net assessment:** M14 catches the first persona (audit trail) but the second-persona-same-face risk is unaddressed. The implementation has no cross-session dedup mechanism.

---

### 10. inbox-compromise — fake-affiliation, Branch B

**Summary:** Compromised institutional inbox used to request orders via email without creating accounts.

**Bypass methods relevant to M14:**

1. **Branch sidesteps IAL2 entirely by acting through email.**
   - **CAUGHT.** If M14 is enforced (any SOC order requires identity evidence from a named human), the email-only path is blocked. The attacker cannot complete a `VerificationSession` without presenting a face and document.

**Net assessment:** Strong — M14 kills this branch if enforcement is mandatory.

---

### Branches using real identity throughout

- **shell-company, foreign-institution, gradual-legitimacy-accumulation, insider-recruitment, lab-manager-voucher, unrelated-dept-student, visiting-researcher, community-bio-lab-network, cro-framing:** All use real government IDs. M14 passes natively. **MISSED (structural)** — no detection signal because there is no mismatch. M14 provides audit trail / deterrence only.

---

## Findings

### Critical

**C1 — No injection-detection or PAD-confidence signal exposed by Stripe Identity.**

- **Stories affected:** account-hijack, credential-compromise, dormant-account-takeover, dormant-domain (all identity-theft branches).
- **Why missed:** Stripe Identity returns binary `verified`/`requires_input` status and coarse `document.error.code` / `selfie.status` values. No field exposes a PAD confidence score, injection-detection flag, or liveness confidence level. The provider cannot programmatically distinguish a successful deepfake injection from a genuine verification. Stripe claims iBeta-tested PAD but publishes no certification level.
- **Suggestion for re-research:** Stage 4 should investigate whether Stripe Identity exposes any risk signals, fraud signals, or `risk_insights` fields (similar to Stripe Radar's risk scoring) that could serve as a proxy for injection confidence. If not, the implementation should explicitly document that the provider is fully dependent on Stripe's opaque liveness and that supplementary injection-detection (e.g., device-integrity attestation, session-binding to a registered device) must come from elsewhere.

### Moderate

**M1 — No cross-session or cross-tenant biometric dedup.**

- **Stories affected:** cro-identity-rotation, it-persona-manufacturing, shell-nonprofit, biotech-incubator-tenant.
- **Why missed:** Stripe Identity scopes each `VerificationSession` to the merchant's account. There is no exposed API for checking whether the same biometric has appeared in other sessions (within the same merchant or across merchants). This is structural to Stripe's product design.
- **Note:** A separate idea (`m14-cross-tenant-biometric-dedup`) may address this gap. Not fixable within Stripe Identity alone.

**M2 — Fronted-accomplice branches defeat M14 structurally.**

- **Stories affected:** cro-identity-rotation, shell-nonprofit, biotech-incubator-tenant, cro-framing, and all real-ID branches.
- **Why missed:** When a real human willingly presents their real identity as the account holder, M14 produces a clean pass. This is by design — M14 verifies that the orderer *is who they claim to be*, not that their *intent is legitimate*. Intent detection is outside M14's scope.
- **Note:** Not addressable by tweaking the implementation. Other measures (M15, M18, M19, M20) target legitimacy rather than identity.

**M3 — Re-proofing cadence not explicitly specified.**

- **Stories affected:** credential-compromise (ATO-inherits-prior-pass), bulk-order-noise-cover (shared-account).
- **Why missed:** The implementation describes flags for mismatches but does not explicitly mandate that a new `VerificationSession` is created for *every* SOC order. If a provider caches a prior verification, ATO and shared-account attacks inherit the pass.
- **Suggestion for re-research:** Stage 4 should add an explicit policy statement: "a new VerificationSession MUST be created for each SOC order" or specify the re-proofing interval.

### Minor

**N1 — Session device-binding is undocumented.**

- **Stories affected:** account-hijack (IDV-session handoff exploit).
- **Why ambiguous:** The implementation does not specify whether Stripe binds a session's client secret to a device fingerprint or IP. If not, the handoff exploit is viable.
- **Suggestion:** Stage 4 should document Stripe's session-binding behavior or explicitly mark it `[unknown]`.

**N2 — Morph-detection capability undocumented.**

- **Stories affected:** account-hijack, credential-compromise, dormant-account-takeover.
- **Why ambiguous:** Stripe does not publicly claim morph detection on document photos. The implementation does not address this. Morphs that pass Stripe's document checks produce indistinguishable `verified` results.
- **Suggestion:** Document as a known limitation; if Stripe has unpublished morph detection, note it as `[vendor-gated]`.

---

## bypass_methods_known

| # | Bypass method | Classification | Stories |
|---|---|---|---|
| 1 | Deepfake injection against liveness flow | MISSED | account-hijack, credential-compromise, dormant-account-takeover, dormant-domain |
| 2 | Face morphing on forged/altered document | MISSED | account-hijack, credential-compromise, dormant-account-takeover |
| 3 | IDV-session handoff exploit | AMBIGUOUS | account-hijack |
| 4 | ATO inherits prior IAL2 pass | AMBIGUOUS | credential-compromise |
| 5 | Social-engineer manual review | CAUGHT | credential-compromise, dormant-account-takeover |
| 6 | Presentation attack (photo/mask/replay) | AMBIGUOUS | credential-compromise |
| 7 | Fresh accomplice submits real IAL2 | MISSED (structural) | cro-identity-rotation, shell-nonprofit, biotech-incubator-tenant |
| 8 | Vendor-aware provider selection (avoid cross-tenant dedup) | MISSED (structural) | cro-identity-rotation |
| 9 | Real attacker uses own real ID | MISSED (structural) | dormant-domain, biotech-incubator-tenant, all real-ID branches |
| 10 | Shared-account predecessor IAL2 mismatch | CAUGHT | bulk-order-noise-cover |
| 11 | Same-face multi-persona (no intra-tenant dedup) | AMBIGUOUS | it-persona-manufacturing |
| 12 | Email-only ordering (sidestep IAL2) | CAUGHT | inbox-compromise |
| 13 | Abandon SOC orders (deterrence) | CAUGHT | dormant-account-takeover |

## bypass_methods_uncovered

| # | Bypass method | Severity | Notes |
|---|---|---|---|
| 1 | Deepfake injection — no PAD signal exposed | Critical | Provider cannot detect; fully opaque to Stripe's internal checks |
| 2 | Face morphing — no morph-detection signal | Critical | Same opacity problem |
| 3 | Fresh accomplice with real ID | Moderate (structural) | M14 cannot address by design |
| 4 | Cross-tenant biometric dedup absent | Moderate (structural) | Stripe product limitation |
| 5 | Same-face multi-persona intra-tenant | Moderate | No dedup API |
| 6 | Session handoff (device-binding unknown) | Minor | Documentation gap |

---

## Verdict: **RE-RESEARCH**

One Critical finding (C1): the implementation does not surface or address the absence of PAD/injection-detection signals from Stripe Identity, which is the primary attack vector for identity-theft branches. Stage 4 should investigate whether Stripe exposes any risk/fraud signals and explicitly document the provider's dependency on Stripe's opaque liveness, plus specify re-proofing cadence (M3).
