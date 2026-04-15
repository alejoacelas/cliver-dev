# Measure 16 — mfa-stepup

Practice: enable MFA on customer portals; when sequence screening flags a SOC, confirm MFA is on for that account (step-up auth). Threats mitigated: credential theft.

Stories below are ordered most-directly-engaging first. Only branches whose attack chain *requires* defeating MFA on a pre-existing customer account are listed; branches where the attacker creates a fresh provider account (and thus enrolls their own MFA factor by construction) are not relevant — MFA is not a barrier in those branches.

---

## 1. account-hijack

- **Branch slug:** account-hijack
- **Profile:** impersonate-employee (existing-account hijack via PI email compromise)
- **Target:** "A moderately skilled attacker compromises a principal investigator's institutional email, then takes over the PI's pre-existing, fully verified synthesis provider account. Because identity, affiliation, payment, and shipping are already on file, the attacker inherits the PI's verified status across most KYC measures and only needs to bypass the measures that re-check at order time."
- **Bypass excerpts (verbatim, from "### 7. MFA + Re-authentication"):**

  > **Binding?** Yes. This is the primary technical barrier under the baseline design.
  >
  > **False-negative rate.** ~2–5% per TOTP attempt ([27% of MFA problems are time-sync issues](https://lideroo.com/blog/handling-failed-mfa-attempts-step-by-step-guide)); ~1–3% for SMS due to delivery delays and roaming.
  >
  > **Bypass methods.**
  >
  > **Method 1: MFA reset via email recovery.** Use the compromised inbox to trigger a "lost authenticator" reset.
  > - Expertise: Minimal — standard account recovery UX.
  > - Cost: $0.
  > - Lead-up time: Hours; some providers impose 24–72 hour cooling-off periods. Best guess on cooling-off.
  > - Attacker trace: Moderate–high. Reset event is logged; the PI's TOTP app immediately stops working and the PI discovers on next login. Many providers send confirmation to backup channels. Detection window: days, not weeks.
  > - Cross-measure dependency: Compounds unfavorably with Measure 3 Method 2 (address change) — see note there.
  >
  > **Method 2: Session hijack via stolen cookies + anti-detect browser.** Replay a captured session token behind a fingerprint-matched [GoLogin/Multilogin](https://oxylabs.io/blog/gologin-vs-multilogin) profile and a residential proxy geolocated to the PI.
  > - Expertise: Intermediate — browser-fingerprint matching is a practiced skill.
  > - Cost: $100–300/month. [Anti-detect browser $49–99/month; residential proxy ~$55–80/month for 10 GB](https://aimultiple.com/proxy-pricing).
  > - Lead-up time: Hours, but session tokens have limited lifetime. [Constella's 2026 Identity Breach Report](https://constella.ai/top-5-learnings-from-the-2026-identity-breach-report/) notes infostealer packages typically contain credentials alongside tokens, so the attacker can often fall back to credential replay.
  > - Attacker trace: Low — login looks consistent with the PI's normal fingerprint and geography.
  >
  > **Method 3: Infostealer-exfiltrated TOTP seed.** A purchased or deployed [infostealer log](https://securityboulevard.com/2026/04/48-hours-the-window-between-infostealer-infection-and-dark-web-sale/) contains the TOTP seed from a browser-based or desktop authenticator.
  > - Expertise: Intermediate — log interpretation, TOTP seed extraction.
  > - Cost: $10–200. Often $0 if the seed is in the same log used for credentials; otherwise fresh logs on Russian Market sell for $10–50.
  > - Lead-up time: Minutes if the seed is already in a purchased log; days to weeks if a targeted infostealer deployment is needed.
  > - Attacker trace: Near-zero on the provider side — valid credentials, valid code, no reset event, no new-device enrollment. This is the zero-trace MFA bypass.
  > - Uncertainty: Probability that a random PI's TOTP seed is in marketplace logs is low (~1–5%); hardware tokens and encrypted phone apps are not exfiltrated.
  >
  > **Method 4: Real-time AitM phishing relay.** Phish the PI with a [Tycoon 2FA](https://www.microsoft.com/en-us/security/blog/2026/03/04/inside-tycoon2fa-how-a-leading-aitm-phishing-kit-operated-at-scale/) or EvilProxy kit, relaying both password and MFA token to the provider in real time. [Tycoon 2FA accounted for 89% of PhaaS attacks in early 2025.](https://www.infosecurity-magazine.com/news/sneaky-2fa-joins-tycoon-2fa/)
  > - Expertise: Intermediate — turnkey platforms lower the skill bar.
  > - Cost: $120–350. Tycoon 2FA is $120 for 10 days, $350/month.
  > - Lead-up time: Days for campaign setup; hours if infrastructure already exists from the email compromise.
  > - Attacker trace: Moderate. A second phishing email in the PI's inbox raises the chance of IT report; provider sees a login from the proxy IP unless the kit uses residential proxies.
  >
  > **Method 5: FIDO2 downgrade attack.** Spoof a browser user agent that lacks FIDO support to force fallback to SMS or TOTP, which can then be relayed. [Demonstrated by Proofpoint in 2025 using a modified Evilginx phishlet](https://www.proofpoint.com/us/blog/threat-insight/dont-phish-let-me-down-fido-authentication-downgrade); [IOActive disclosed a related technique at OOTB2025](https://www.ioactive.com/authentication-downgrade-attacks-deep-dive-into-mfa-bypass/); [Apple has called out SMS/password-reset fallbacks as undermining passkey phishing resistance](https://workos.com/blog/passkeys-stop-ai-phishing-mfa-fallbacks).
  > - Expertise: Intermediate — protocol knowledge, phishlet configuration.
  > - Cost: $0–100 incremental beyond existing AitM infrastructure.
  > - Lead-up time: Hours.
  > - Attacker trace: Low — provider sees a login from an "older device," which is a normal event. [Not yet exploited in the wild as of August 2025.](https://petri.com/downgrade-attack-fido-passkey-security/)
  >
  > **Method 6: SIM-jacking / SS7 interception.** Swap the PI's phone number to an attacker-controlled SIM (via carrier social engineering) or intercept SMS over SS7.
  > - Expertise: Minimal (SIM swap via carrier SE) to intermediate (SS7).
  > - Cost: SIM swap $100–500 for a one-off university target (best guess; [dark-web listings of $8,000–20,000 target high-value crypto cases](https://saily.com/blog/sim-swapping-scam/)); SS7 access $1,000–10,000+, typically nation-state or organized crime.
  > - Lead-up time: SIM swap hours to days; SS7 days to weeks.
  > - Attacker trace: Moderate for SIM swap (PI's phone goes dead; carrier records are subpoenable). Low for SS7 (passive).
  > - Uncertainty: Post-2024 carrier hardening cut SIM-swap success rates to ~30–50%. [FBI IC3 tracked $25.98M in SIM swap losses in 2024.](https://deepstrike.io/blog/sim-swap-scam-statistics-2025)
  >
  > **Method 7: Social engineering provider support.** Call the provider's support line posing as the locked-out PI, using identity details from the inbox and optionally a cloned voice.
  > - Expertise: Intermediate. Voice cloning tools are cheap — [ElevenLabs Creator at $22/month](https://elevenlabs.io/pricing) or free open-source (RVC, so-vits-svc); [CrowdStrike saw a 442% half-year rise in AI-driven vishing](https://www.aicerts.ai/news/voice-cloning-supercharges-social-engineering-attack-tactics/).
  > - Cost: $0–50.
  > - Lead-up time: Hours to days.
  > - Attacker trace: Moderate. Support ticket is logged; voice recording may be retained. Detection may be slower than self-service because the support agent may bypass automated notifications.
  >
  > **Method 8: Compromise cloud account to inject a passkey.** Break into the PI's Apple iCloud or Google account and add a device to the passkey sync group.
  > - Expertise: Advanced — lateral compromise plus passkey sync architecture.
  > - Cost: $0–200 incremental if cloud credentials are in the same infostealer haul; otherwise the cost of a second credential theft.
  > - Lead-up time: Hours to weeks.
  > - Attacker trace: Low on the provider side (legitimate passkey). Moderate on the cloud side (Apple/Google new-device alerts).
  >
  > **Method 9: Timing — exploit grace period.** Act inside a 5–30 minute post-MFA window using a hijacked session, before re-authentication is required.
  > - Expertise: Minimal.
  > - Cost: $0.
  > - Lead-up time: Unpredictable — depends on the PI's login patterns.
  > - Attacker trace: Very low. No source found; highly unreliable as a primary bypass, works only combined with session hijack.

- **Why relevant:** This branch's entire SOC-side attack chain hinges on defeating MFA + re-authentication on a hijacked existing PI account; the source explicitly names MFA as "the primary technical barrier under the baseline design" and enumerates nine bypasses against it.
- **Persistent supply chain?** N

---

## 2. credential-compromise

- **Branch slug:** credential-compromise
- **Profile:** impersonate-employee (remote credential compromise of a faculty/staff/lab manager who already has a verified provider account)
- **Target:** "Faculty, staff, and lab managers at small US teaching-focused colleges and community colleges with biology/chemistry programs (~2,500 institutions), plus mid-sized US and European research universities reachable through AitM phishing (~1,000+). Targets are identified from public faculty directories and cross-referenced against breach databases and infostealer-log marketplaces."
- **Bypass excerpts (verbatim, from "### Measure 7: MFA + re-authentication"):**

  > **Binding?** No for the TOTP baseline.
  >
  > **False-negative rate for legitimate customers.** Roughly 1–3% (best guess). Users losing device access during enrollment or re-enrollment.
  >
  > **Bypass methods:**
  >
  > - **Attacker enrolls own TOTP (new or reset account).** The attacker registers a TOTP seed they control during account creation or after a password reset.
  >   - Expertise: Amateurish.
  >   - Cost: $0 incremental.
  >   - Lead-up time: Minutes.
  >   - Attacker trace: TOTP enrollment record and authentication logs.
  >
  > - **Infostealer-sourced TOTP seed.** The log may include the target's existing TOTP seed; the attacker imports it and generates valid codes without re-enrolling.
  >   - Expertise: Amateurish.
  >   - Cost: $0 incremental (already paid for under measure 1).
  >   - Lead-up time: Minutes.
  >   - Attacker trace: Concurrent TOTP usage patterns — detectable but rarely monitored.
  >
  > - **Uncertainty branch — passkeys/FIDO2.** If the provider requires passkeys bound to a hardware authenticator, expertise rises to Advanced and a bypass may not be feasible for this attacker profile.

  Also from the IAL1/account-takeover discussion (verbatim):

  > **Account takeover of an existing verified customer (cheapest path under the document+selfie baseline).** The attacker compromises a faculty member who already has a verified account with the synthesis provider, then resets the provider password via the compromised institutional email — inheriting the prior IAL1 pass without performing any direct identity attack.
  > - Expertise: Intermediate (adapted commodity tooling; no custom exploits).
  > - Cost: $5–$1,050. The floor is just an infostealer log ([Sekoia](https://blog.sekoia.io/overview-of-the-russian-speaking-infostealer-ecosystem-the-logs/)); the upper end covers an optional SIM swap if password-reset SMS challenges are used.
  > - Lead-up time: 1–3 days.
  > - Attacker trace: No biometric artifact created. Password-reset event, MFA re-enrollment event, and login anomalies in provider and institutional email logs. Significantly lower-trace than any direct IDV bypass.

- **Why relevant:** The dominant cheapest path is account takeover of an existing verified customer; MFA is bypassed by either re-enrolling a TOTP after email-channel password reset or replaying an infostealer-sourced TOTP seed. Step-up MFA on SOC orders is the gating control on this entire attack class.
- **Persistent supply chain?** N

---

## 3. dormant-account-takeover

- **Branch slug:** dormant-account-takeover
- **Profile:** exploit-affiliation (institutional IT admin takes over a dormant synthesis-provider account belonging to a departed researcher)
- **Target:** "An IT administrator at a target institution uses legitimate mailbox-control and IAM tooling to take over a dormant synthesis-provider account belonging to a departed researcher. The attacker inherits a fully approved persona — passed IAL1 (possibly IAL2), verified affiliation, registered shipping, real publication trail, real biosafety coverage, registered voucher — rather than building one."
- **Bypass excerpts (verbatim, from "### Measure 7: MFA + re-authentication"):**

  > **Binding?** Conditional on factor type and factor-recovery workflow. Non-binding under relayable TOTP with email-channel MFA recovery (the branch's assumed baseline). Catching under separate MFA recovery paths (SMS, backup codes, IDV step-up). Catching under phishing-resistant MFA bound to the original holder's device.
  >
  > **False-negative rate.** <1% for legitimate customers controlling their own factor.
  >
  > **Bypass methods.**
  >
  > **Bypass A — Email-channel MFA recovery (baseline assumption):**
  > - **What the attacker does:** After password reset, triggers MFA recovery through the same email channel and enrolls a new TOTP on an attacker-controlled device.
  > - **Expertise:** Novice. **Cost:** $0. **Lead-up time:** Minutes.
  > - **Attacker trace:** New TOTP seed / device fingerprint enrolled at the provider.
  >
  > **Bypass B — Social-engineer provider support:**
  > - **What the attacker does:** Contacts provider support claiming to be the account holder, requests MFA reset outside the normal workflow. The 0ktapus campaign (2022) demonstrated credential + MFA theft via social engineering at scale across 130+ organizations ([Group-IB](https://www.group-ib.com/blog/0ktapus/)).
  > - **Expertise:** Practitioner. **Cost:** $0. **Lead-up time:** Hours to days.
  > - **Attacker trace:** Support ticket log, voice recording if applicable.
  >
  > **Bypass C — IdP impersonation (federated login):**
  > - **What the attacker does:** Re-enrolls the original holder's MFA factors at the IdP level, then logs into the provider via federation.
  > - **Expertise:** Expert. **Cost:** $0. **Lead-up time:** Hours.
  > - **Attacker trace:** IdP audit log — high-sensitivity event.
  >
  > **Bypass D — IdP MFA policy relaxation:**
  > - **What the attacker does:** Temporarily reduces MFA requirements at the institutional IdP level, logs in, restores the policy.
  > - **Expertise:** Expert. **Cost:** $0. **Lead-up time:** Minutes to hours.
  > - **Attacker trace:** Two IdP audit log entries (relax + restore) — very distinctive pattern.

- **Why relevant:** The branch takes over a dormant verified provider account; step-up MFA on SOC orders is one of the few measures that can re-bind to the original holder's device rather than to whoever currently controls the email channel. The branch explicitly notes phishing-resistant MFA bound to the original holder's device would catch the chain.
- **Persistent supply chain?** N
