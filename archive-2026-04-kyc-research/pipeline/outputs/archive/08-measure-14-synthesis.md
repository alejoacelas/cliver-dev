# Measure 14 — Identity evidence match (IAL2): Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (count) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| m14-jumio | Jumio KYX: doc + selfie + liveness + NFC | ~$1.50-$3.50/verification [best guess] | 6-step playbook; non-Latin-script name mismatch (8-15% of global customers) is dominant FP | 6 (account-hijack, credential-compromise, dormant-account-takeover, dormant-domain, bulk-order-noise, inbox-compromise) | Non-Latin-script names: 8-15% chronic FP without transliteration | ATO inherits prior IAL2 without re-proofing; face morphing on genuine substrate (MAD unconfirmed); fronted accomplice (structural) |
| m14-onfido | Onfido/Entrust: doc + selfie/Motion + NFC | ~$1.20-$3.00 (Standard); +$0.30-$0.80 for Motion [best guess] | 8-step playbook; same non-Latin-script FP; Motion capture failures on low-end devices (5-10%) | 5 (same as Jumio minus inbox-compromise nuance) | Unsupported doc types slightly higher (2,500 vs 5,000 subtypes): 3-7% | Same as Jumio; Motion not mandated as default (configuration gap) |
| m14-persona | Persona: doc + selfie + database + behavioral signals | ~$1.50-$3.00/inquiry [best guess] | 9-step playbook; behavioral signal FPs for tech-savvy users (5-10%); selfie_unique FP for multi-institutional researchers (1-3%) | 5 (same core set) | Database thin coverage outside OECD: 15-30% of intl customers lack 3-factor evidence; no Kantara IAL2 cert | Same as Jumio/Onfido; cross-tenant dedup is tenant-scoped only |
| m14-stripe-identity | Stripe Identity: doc + selfie (passive liveness) | $1.50/verification (list price) | SOC orders escalate to Jumio/Onfido; image-quality failures (5-10% first-attempt) | 5 (via dual-vendor escalation for SOC) | PAD opacity: no published ISO 30107-3 conformance; ~47 countries only | Deepfake injection on Stripe-only path; PAD assurance is opaque |
| m14-login-gov-id-me | Federated IAL2 via Login.gov / ID.me | ~$2-$5/verification (ID.me) [best guess] | Black-box: provider sees boolean only; 10-15% of IDP-rejected customers uninvestigable | 4 (credential-compromise, account-hijack, dormant-account-takeover, bulk-order-noise) | International researchers: 40-60% zero coverage (complete structural exclusion) | All IDP-layer bypasses opaque to provider; ID.me trusted-referee social engineering |
| m14-nfc-epassport | ICAO PKD NFC chip read (within vendor IDV flow) | ~$0-$0.50 incremental | 7-step playbook; NFC tap failures (10-20% first attempt, 3-5% persistent) | 4 (credential-compromise, account-hijack, dormant-account-takeover, dormant-domain) | No ePassport: 10-20%; no NFC device: 5-10%; non-PKD countries: 5-15% | All liveness/injection attacks (orthogonal -- NFC is document-authenticity only); PA-only chip cloning |
| m14-fido2-stepup | FIDO2/WebAuthn order-time assertion | ~$0/assertion; $14-$80 hardware key per customer | 6-flag playbook; unenrolled customers at rollout (20-40%); shared-lab accounts (10-25%) | 5 (credential-compromise, account-hijack, dormant-account-takeover, bulk-order-noise, inbox-compromise) | Shared-lab/core-facility accounts: 10-25% of academic orders; synced passkey trade-off | Social engineering support for re-enrollment; fronted accomplice enrolls own credential (structural) |
| m14-cross-tenant-biometric-dedup | 1:N face-template matching across provider's customer DB | $2-$8/check (vendor) or $0.01-$0.10 (in-house) + $100K-$300K setup | Institution-change FPs (5-10%/yr); demographic bias risk; cold-start (~1,000+ templates needed) | 2 (it-persona-manufacturing same-person multi-persona; accomplice reuse at same provider) | Cross-provider rotation: no cross-vendor biometric sharing exists; privacy/consent blockers (20-40% in BIPA/GDPR jurisdictions) | Fresh accomplice per entity (unique faces); cross-vendor routing; face morphing; ATO-inherited IAL2 |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

These gaps appear across ALL vendor-IDV ideas (Jumio, Onfido, Persona, Stripe) and represent structural limitations of M14:

1. **Fronted-accomplice with real identity.** A willing accomplice using their own real government ID and real face passes any IDV check natively. This covers shell-nonprofit, CRO-identity-rotation, biotech-incubator-tenant, and cro-framing branches. No M14 idea can detect a real human acting as a fronted principal. This is M14's defining structural boundary -- identity verification confirms "this is a real person," not "this person has legitimate intent."

2. **Real-ID-throughout attackers.** Attackers who use their own genuine identity throughout (gradual-legitimacy-accumulation, community-bio-lab-network, shell-company employees, foreign-institution, insider-recruitment, lab-manager-voucher, unrelated-dept-student, visiting-researcher) pass IDV natively. M14 provides deterrence (audit trail) but not detection.

3. **ATO inheriting prior IAL2 without order-time re-proofing.** If the provider does not re-trigger IDV at order time, a credential-compromise or account-hijack attacker inherits the legitimate customer's prior verification. All vendor-IDV ideas note this gap; the fix is a re-proofing trigger policy (SOC orders require fresh IDV).

4. **Face morphing on genuine document substrates.** No vendor publicly confirms morph-attack detection (MAD) as a discrete capability. High-quality morphs that pass both document and biometric checks remain AMBIGUOUS across all ideas. NFC ePassport chip read partially mitigates (chip portrait is cryptographic ground truth).

### Complementary gaps

| Gap | Ideas where it appears | Idea(s) that close it |
|---|---|---|
| Non-Latin-script name mismatches (8-15%) | Jumio, Onfido, Persona, Stripe | Provider-side transliteration layer (not a separate idea but implementation requirement) |
| PAD/liveness opacity | Stripe Identity (opaque) | Jumio (Liveness Premium), Onfido (Motion), Persona (ISO 30107-3 PAD) -- dual-vendor escalation |
| International document coverage | Stripe (~47 countries), Login.gov/ID.me (US/UK only) | Jumio (200+ countries, 5,000+ subtypes), Onfido (195 countries) |
| Same-person multi-persona within tenant | Jumio (no dedup), Onfido (unclear scope), Stripe (no dedup) | Persona (selfie_unique within tenant), cross-tenant-biometric-dedup |
| Same-person multi-persona across tenants/providers | All vendor-IDV ideas, cross-tenant-biometric-dedup | No idea closes this -- structural industry-level gap |
| Session-hijack / ATO inheriting prior pass | All vendor-IDV ideas (if no re-proofing) | FIDO2 step-up (per-order authenticator assertion) |
| Database thin coverage outside OECD | Persona (15-30% intl customers lack database cross-reference) | Jumio, Onfido (not database-dependent for core verdict) |

### Net coverage estimate

If a provider implemented every M14 idea: **most** legitimate customers would successfully verify (>90% for vendor-IDV with transliteration). However, the structural exclusions -- fronted accomplice, real-ID-throughout, same-person multi-persona across providers -- mean that M14 as a measure cannot address the purpose-built-organization and real-identity attacker categories (9-10 of 19 branches). The measure is effective against the identity-theft cluster (credential-compromise, account-hijack, dormant-account-takeover, dormant-domain) and the fabricated-identity cluster (inbox-compromise with no portal access). The remaining coverage gaps are population-based (non-Latin names, low-end devices, no ePassport) rather than attacker-based.

## 3. Bypass cross-cut

### Universally uncovered bypasses

These slip through EVERY M14 idea:

1. **Fronted accomplice with real ID and real face.** Shell-nonprofit, CRO-identity-rotation (fresh accomplice per persona), biotech-incubator-tenant, cro-framing -- the accomplice genuinely holds the identity on file. Not addressable by any IDV check.

2. **Social engineering of provider support to override IDV denial or bypass IDV requirement.** Every idea notes this as a bypass; it targets the human process, not the technical control.

3. **Real-ID-throughout attackers.** The 9 branches using genuine identity throughout produce no IDV signal.

### Bypass methods caught by at least one idea

| Bypass method | Caught by | Not caught by |
|---|---|---|
| Deepfake injection | Jumio (Liveness Premium), Onfido (Motion), Persona (PAD), Stripe (via escalation) | Stripe (Stripe-only path, PAD opaque); Login.gov/ID.me (opaque); NFC (orthogonal); FIDO2 (orthogonal); dedup (orthogonal) |
| Face morphing on document | NFC ePassport (chip portrait is ground truth) | All vendor-IDV ideas (MAD unconfirmed); FIDO2, dedup (orthogonal) |
| ATO inheriting prior IAL2 | FIDO2 step-up (per-order assertion); all vendor-IDV ideas (with re-proofing trigger policy) | All vendor-IDV ideas (without re-proofing); NFC (orthogonal to re-proofing); Login.gov/ID.me (if assertion stale) |
| Session-hijack / cookie replay | FIDO2 step-up (fresh cryptographic challenge per order) | All vendor-IDV ideas (IDV is a one-time event); all others |
| Same-person multi-persona (same provider) | Persona (selfie_unique), cross-tenant-biometric-dedup | Jumio, Onfido, Stripe, NFC, FIDO2, Login.gov/ID.me |
| IDV-session handoff (different device completes liveness) | FIDO2 step-up (authenticator bound to device) | Vendor-IDV ideas (depends on SDK session binding -- AMBIGUOUS) |
| Email-only ordering bypasses portal | FIDO2 step-up (portal-only enforced); all vendor-IDV (if IDV required for all channels) | Login.gov/ID.me (OIDC flow blocks email); NFC, dedup (require IDV engagement) |

### Attacker stories where every idea fails

- **cro-identity-rotation** (Branch B): Fresh accomplice per persona, cross-vendor routing. Every M14 idea fails -- within-tenant dedup is defeated by one-provider-per-vendor strategy; fresh accomplices have unique faces.
- **shell-nonprofit** (Branch E): Accomplice passes IDV with own real ID.
- **biotech-incubator-tenant** (Branch D): Same pattern.
- **cro-framing** (Branch A): Real face, real ID, real liveness selfie -- "Bypass methods: None needed."
- **gradual-legitimacy-accumulation** (Branch E): Own real ID throughout.
- **insider-recruitment** (Branch B): Insider's own real identity.
- **lab-manager-voucher** (Branch C): Real ID, real PII.
- **community-bio-lab-network**: Real IDs throughout.
- **shell-company** (Branch D): Real employees, real IDs.

## 4. Bundling recommendations

**Recommended core bundle: one vendor-IDV (Jumio or Onfido) + NFC ePassport + FIDO2 step-up.**

This three-layer stack provides:
- **Vendor-IDV (Jumio or Onfido):** Document authenticity + biometric matching + liveness detection. Jumio offers broader document coverage (5,000+ subtypes); Onfido's Motion provides stronger documented injection-attack defense. Either requires Liveness Premium / Motion enabled for SOC orders.
- **NFC ePassport:** The only defense against face morphing on genuine documents. Adds cryptographic ground truth where available. Falls back gracefully to OCR-only when unavailable.
- **FIDO2 step-up:** Closes the ATO-inherits-prior-IAL2 gap and session-hijack gap. Per-order authenticator assertion proves the same human who completed onboarding IDV is placing this specific order. $0 marginal cost.

**Combined cost:** ~$1.50-$4.00 per SOC order (vendor-IDV + NFC increment) + $14-$80 one-time hardware key per customer.

**Optional additions:**
- **Stripe Identity as low-friction pre-screen:** $1.50 for all orders (including non-SOC), with mandatory escalation to Jumio/Onfido for SOC orders. Useful if the provider wants a lightweight IDV gate on all customers, not just SOC.
- **Persona as alternative vendor-IDV:** Offers built-in selfie_unique within-tenant dedup and behavioral signals. But lacks Kantara IAL2 certification -- a regulatory risk if M14 mandates certification.
- **Cross-tenant biometric dedup:** Addresses a narrow scenario (same-person multi-persona at one provider) at very high cost ($100K-$300K setup). Cost-benefit is questionable given that the most sophisticated rotation branch (cro-identity-rotation) explicitly defeats it.
- **Login.gov/ID.me as optional convenience path:** Only for US customers who already have accounts. Cannot serve as primary M14 implementation due to 40-60% international exclusion.

**What the full bundle still leaves uncovered:** The 9 attacker branches using real identity (fronted accomplice or own genuine ID) are structurally undetectable by any M14 configuration. These require M15 (SOC declaration validation), M17 (pre-approval list), M18 (institution legitimacy), M19 (individual legitimacy), and M20 (voucher legitimacy) -- the identity layer cannot assess authorization or intent.

**Operational cost of running multiple ideas:** The core bundle (one vendor-IDV + NFC + FIDO2) requires one IDV vendor contract, free ICAO PKD access, and open-source FIDO2 libraries. Adding Stripe as a pre-screen adds a second vendor (but most providers already have Stripe). Adding cross-tenant dedup adds either a third vendor or a substantial in-house build. The dominant manual-review burden comes from non-Latin-script name mismatches (8-15%), which affect all vendor-IDV ideas equally and require a provider-side transliteration layer regardless of vendor choice.
