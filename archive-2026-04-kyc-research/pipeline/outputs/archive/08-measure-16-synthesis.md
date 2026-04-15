# Measure 16 — Account MFA + step-up: Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (count + which) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| m16-auth0-okta | Hosted IdP (Auth0/Okta/Cognito): MFA enrollment, adaptive risk, step-up auth | ~$0/step-up (passkey/TOTP); platform MAU fee | Lockout/recovery handling; unenrolled customers at rollout (30-60%); shared-device labs (5-15%) | 3 branches, 8 of 12 mapped bypass methods (account-hijack, credential-compromise, dormant-account-takeover) | Unenrolled passkey customers: 30-60% at rollout; shared-device lab environments: 5-15% | Cloud account compromise -> synced passkey injection; social engineering of provider support |
| m16-webauthn-yubikey | Hardware FIDO2 token (YubiKey) + AAGUID allowlist enforcement | $0/auth; $50-$100 per customer (hardware) | Enrollment exceptions; lost-token replacement (video-call SOP); attestation failures | 3 branches, 6 bypass methods caught (AitM, infostealer TOTP, FIDO downgrade, SIM-jack, cloud passkey injection, attacker TOTP enrollment) | Distribution/import restrictions: 3-8% of global customers; onboarding token-arrival gap: 10-20% of first SOC orders; cost barrier: 5-10% | MFA reset via email recovery (requires sibling SOP); session hijack (requires order-time step-up); social engineering support |
| m16-no-sms-no-email-reset | IdP config + written recovery SOP: disable SMS, email-only reset requires 2FA | $0 config; $5-$15/recovery event (video call) | Help-desk recovery tickets: 5-10% of customers/year; 15-30 min per ticket vs. 2 min email link | 3 branches, 6 bypass methods caught (email MFA reset, SIM-jack, social engineering partial, attacker TOTP enrollment, password-only reset, FIDO downgrade SMS) | Lost-device recovery friction: 5-10x more expensive; unreachable security contacts: 10-20% of institutions; poor-connectivity regions: 2-5% | Session hijack (out of scope); infostealer TOTP seed (no reset needed); AitM phishing relay (no reset needed); cloud passkey injection (not a recovery event) |
| m16-spycloud-breach | SpyCloud/Constella darknet breach APIs + HIBP Pwned Passwords | ~$0.01 amortized/login; HIBP free | Email-only hits overwhelm academic base (30-50% of emails in at least one breach); reviewer fatigue from soft warnings | 2 branches primary (credential-compromise, account-hijack partial); infostealer TOTP seed partial | Credentials not in any breach corpus (zero-day/AitM): 5-15% of incidents; single-vendor covers 40-70% of data; 48-hour ingest window | AitM phishing relay (fresh credentials never in corpus); session hijack (no login event); all non-credential MFA bypasses |
| m16-dormancy-reidv | Internal dormancy timer + m14 IDV vendor reverification + authenticator re-bind | ~$1.50-$3.00/re-IDV event; <$0.20/customer/yr amortized | Low: <5% of customers trigger; manual review for selfie mismatch (1-3% of events); appearance-change FP at 5+ years | 1 branch central (dormant-account-takeover); partial for account-hijack and credential-compromise on dormant accounts | Active accounts: structural no-signal (by design); selfie aging at 5+ years; session-restoration ambiguity | All methods on active accounts (by design -- covered by other M16 ideas); federated login interaction with dormancy timer |
| m16-order-time-stepup | OIDC max_age=0 per-SOC-order re-auth | $0/order | Low: stepup_failed lock + review; reviewer distinguishes confused-user vs. attacker via IdP audit log | 2 bypass methods caught (session hijack, grace-period exploit); partial contribution when combined with sibling ideas | Programmatic/API orders: 10-30% of volume bypass browser redirect; federated SSO may not honor max_age=0: 15-25% of academic customers | All methods where attacker has valid credentials + valid factor (infostealer TOTP, AitM relay, SIM-jack, cloud passkey injection, attacker-enrolled TOTP) |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

These gaps appear across ALL or nearly all M16 ideas and represent limitations of M16 as a measure:

1. **Social engineering of provider support.** Every idea that involves a human recovery or exception path is vulnerable to social engineering. Auth0/Okta notes it; WebAuthn/YubiKey notes it; no-SMS-no-email-reset mitigates with SOP but acknowledges retrospective-only detection. The by-measure attacker file prices voice cloning at $0-$50 (ElevenLabs) and documents a 442% rise in AI-driven vishing. No M16 idea fully prevents a skilled attacker from convincing a help-desk agent to bypass procedure.

2. **Fronted accomplice / real identity throughout.** M16 is authentication, not authorization. An attacker who enrolls their own MFA factor under their own identity (or an accomplice's identity) passes all M16 checks natively. This is structural and matches M14's boundary: authentication confirms "you are who you claim to be," not "you should have access to SOC."

3. **Programmatic/API ordering bypasses browser-mediated controls.** Order-time step-up (max_age=0) and WebAuthn ceremonies require a browser redirect. LIMS-to-provider API integrations bypass this entirely. Estimated at 10-30% of order volume at scale providers. This gap requires API-token-scoped MFA (e.g., short-lived API tokens requiring human MFA approval per batch) -- not specified by any current idea.

### Complementary gaps

| Gap | Ideas where it appears | Idea(s) that close it |
|---|---|---|
| Email-channel MFA reset (cheapest ATO path) | Auth0/Okta (if not configured properly), order-time-stepup (no reset needed for session attacks), spycloud-breach (no reset event), dormancy-reidv (dormant only) | No-SMS-no-email-reset (directly closes); WebAuthn/YubiKey (TOTP not accepted, so email-reset to TOTP is useless) |
| Session hijack via stolen cookies | Auth0/Okta (partial via adaptive risk), WebAuthn/YubiKey (no authenticator interaction), no-SMS-no-email-reset (out of scope), spycloud-breach (no login event), dormancy-reidv (no login event) | Order-time-stepup (max_age=0 forces fresh auth, invalidating stolen session) |
| Infostealer TOTP seed | No-SMS-no-email-reset (no reset needed), order-time-stepup (valid TOTP passes fresh auth), dormancy-reidv (factor-agnostic but dormant only) | Auth0/Okta (passkey-only policy eliminates TOTP); WebAuthn/YubiKey (TOTP not accepted); spycloud-breach (catches seed if in corpus) |
| AitM phishing relay (Tycoon 2FA) | No-SMS-no-email-reset (no reset needed), spycloud-breach (fresh credentials not in corpus), dormancy-reidv (dormant only), order-time-stepup (relay completes fresh auth) | Auth0/Okta (FIDO2 origin-binding); WebAuthn/YubiKey (origin-binding defeats relay) |
| SIM-jacking / SS7 | Auth0/Okta (passkey-only), spycloud-breach (out of scope), dormancy-reidv (dormant only), order-time-stepup (if SMS still a factor) | WebAuthn/YubiKey (SMS not a factor); no-SMS-no-email-reset (SMS disabled) |
| Cloud passkey injection | WebAuthn/YubiKey (AAGUID allowlist blocks synced passkeys), no-SMS-no-email-reset (not a recovery event), spycloud-breach (out of scope) | Auth0/Okta acknowledges gap -- requires policy decision on synced vs. hardware-bound |
| Dormant-account takeover | Auth0/Okta (partial), WebAuthn/YubiKey (partial), no-SMS-no-email-reset (partial), spycloud-breach (weak signal), order-time-stepup (partial) | Dormancy-reidv (central purpose -- factor-agnostic selfie match catches different person) |
| Credential-stuffing from breach data | Auth0/Okta (partial via adaptive risk), WebAuthn/YubiKey (out of scope), no-SMS-no-email-reset (out of scope), dormancy-reidv (dormant only), order-time-stepup (valid credentials pass) | Spycloud-breach (directly detects breached credentials; forces reset before SOC ordering) |
| FIDO2 downgrade to SMS/TOTP | Auth0/Okta (passkey-only blocks fallback), no-SMS-no-email-reset (SMS disabled), spycloud-breach (out of scope) | WebAuthn/YubiKey (no fallback configured; downgrade-attempt flag fires) |
| Grace-period exploit | Auth0/Okta (per-order auth_time check), WebAuthn/YubiKey (out of scope), no-SMS-no-email-reset (out of scope), spycloud-breach (out of scope), dormancy-reidv (dormant only) | Order-time-stepup (max_age=0 eliminates grace period) |

### Net coverage estimate

If a provider implemented all six ideas: the credential-theft and session-hijack attack surface would be substantially closed for customers with enrolled hardware tokens. However, an estimated **some** (30-60%) of customers would face enrollment friction at rollout (passkeys not yet universal), and the 10-30% of orders submitted via API would bypass browser-mediated controls entirely. The measure is highly effective against the three engaged attacker branches (account-hijack, credential-compromise, dormant-account-takeover) but provides zero signal on the remaining 16 branches that do not involve credential theft.

### Attacker stories where every idea fails

The by-measure file limits M16 engagement to three attacker branches. All other branches either create fresh accounts (enrolling their own MFA by construction) or use real identity throughout. For these, M16 imposes no barrier:

- All purpose-built-organization branches (shell-company, shell-nonprofit, CRO-framing, CRO-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network)
- All fake-affiliation branches except dormant-domain (dormant-domain, foreign-institution, visiting-researcher, inbox-compromise -- though inbox-compromise partially engages if portal-only ordering is enforced)
- exploit-affiliation branches except dormant-account-takeover (bulk-order-noise-cover, it-persona-manufacturing, unrelated-dept-student, lab-manager-voucher)
- insider-recruitment

## 4. Bundling recommendations

**Recommended bundle: Auth0/Okta hosted IdP + WebAuthn/YubiKey hardware tokens + no-SMS-no-email-reset SOP + order-time step-up + dormancy re-IDV. SpyCloud/breach-check as supplementary signal.**

The six ideas form a tightly integrated defense-in-depth stack where each idea closes specific gaps left by the others:

**Layer 1 -- Auth0/Okta (delivery mechanism):** Provides the IdP infrastructure for MFA enrollment, factor lifecycle, adaptive risk, and step-up. This is the platform on which all other ideas execute. Passkey-only enforcement for SOC orders is the core policy.

**Layer 2 -- WebAuthn/YubiKey (factor strength):** Hardware-token-only enforcement with AAGUID allowlist closes the cloud-passkey-injection gap that synced passkeys leave open. This is the highest-assurance factor configuration and the only one that defeats AitM phishing relay, infostealer TOTP, FIDO downgrade, SIM-jacking, and synced-passkey injection simultaneously. Cost: $50-$100/customer hardware.

**Layer 3 -- No-SMS-no-email-reset (recovery hardening):** Closes the email-channel MFA recovery bypass that is the cheapest path in credential-compromise and dormant-account-takeover. Without this, the hardware-token enforcement is undermined by the ability to enroll a new token via email. Cost: $5-$15 per recovery event, 5-10% of customers/year.

**Layer 4 -- Order-time step-up (session freshness):** max_age=0 per SOC order closes session-hijack and grace-period exploits. Zero marginal cost. The combination of hardware-only factor (Layer 2) + fresh authentication per order (Layer 4) means the attacker must possess the physical hardware token at order time -- not just a stolen session or replayed credential.

**Layer 5 -- Dormancy re-IDV (temporal coverage):** Catches the specific dormant-account-takeover branch by re-verifying the human's identity after 180 days of inactivity. Factor-agnostic -- asks "are you the same person?" regardless of how you authenticated. Low volume (<5% of customers trigger), low cost (~$1.50-$3.00/event).

**Supplementary -- SpyCloud/breach-check:** Proactive detection of compromised credentials from breach marketplaces. Closes the credential-stuffing path and provides early warning for infostealer-sourced accounts. The 48-hour ingest window and incomplete corpus coverage make it a "best effort" addition rather than a primary control. The main operational cost is managing the high volume of email-only hits in an academic customer base (30-50% of emails in at least one breach).

**What the full bundle still leaves uncovered:**
- **Social engineering of provider support** remains the highest-leverage residual attack. Dual-agent sign-off for all MFA resets, mandatory delays, and institutional notification are recommended but are procedural controls that depend on human adherence.
- **Programmatic/API ordering** bypasses browser-mediated controls (10-30% of order volume). Requires a separate API-token MFA mechanism not specified by any current idea.
- **Cloud account compromise -> synced passkey injection** is closed by the WebAuthn/YubiKey AAGUID allowlist (hardware-only). If the provider accepts synced passkeys for convenience, this gap re-opens.
- **All 16 attacker branches not involving credential theft.** M16 is a credential-theft defense; it has no purchase on purpose-built organizations, fake affiliations, insider recruitment, or real-identity-throughout attackers.

**Operational cost of running all six:** One IdP contract (Auth0/Okta/Cognito), hardware-token procurement ($50-$100/customer), SpyCloud or Constella annual contract (low-five to low-six figures), help-desk staffing for recovery tickets (500-1,000/year for a 10,000-customer provider). The dominant operational burden is the rollout enrollment campaign (30-60% of customers need passkeys) and ongoing help-desk recovery (5-10% of customers/year at 15-30 min per ticket). The six ideas share a single IdP and a single help-desk queue, so the multi-idea bundle does not multiply operational infrastructure.
