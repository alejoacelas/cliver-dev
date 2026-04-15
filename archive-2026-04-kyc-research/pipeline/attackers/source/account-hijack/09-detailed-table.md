# Branch C — Existing-Account Hijack (PI Compromise): Detailed Measure Table

**Scenario.** A moderately skilled attacker compromises a principal investigator's institutional email, then takes over the PI's pre-existing, fully verified synthesis provider account. Because identity, affiliation, payment, and shipping are already on file, the attacker inherits the PI's verified status across most KYC measures and only needs to bypass the measures that re-check at order time.

## Matrix A Measures (all orders)

Under Matrix A, nearly every measure evaluates the PI (genuine, verified) rather than the attacker behind the compromised email. The only partially-binding Matrix A measure is the shipping address.

---

### 1. Identity Verification — IAL1

**Binding?** No. IAL1 was completed at onboarding; the attacker inherits the PI's verified status via account takeover.

**False-negative rate.** Roughly 1–3% for legitimate US customers under database + SMS IAL1, driven primarily by database mismatches after moves, name changes, or thin credit files; international customers fail at higher rates due to coverage gaps. Best guess calibrated against [Intellicheck's 2.15% overall ID failure rate](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets) and [DHS RIVR document-validation data](https://www.biometricupdate.com/202602/dhs-rivr-results-suggest-most-id-document-validation-disastrously-ineffective); not directly measured for non-document IAL1.

**Bypass methods.** None required. Inherited from PI's account. Expertise: none. Cost: $0. Lead-up time: none. Attacker trace: none from this measure.

---

### 2. Institutional Affiliation Check

**Binding?** No. The PI has a real .edu address at a real institution; the affiliation check passes authentically.

**False-negative rate.** Very low (<1%) for university-affiliated researchers under a domain + institution-name baseline check. Higher (~5–10%) for industry researchers at small firms whose affiliation signals are weaker. Best guess; no direct source.

**Bypass methods.** None required. Inherited. Expertise: none. Cost: $0. Lead-up time: none. Trace: none.

---

### 3. Organization Registry + Verified Shipping Address

**Binding?** Partial. This is the only Matrix A measure that forces the attacker to do work beyond inheriting the PI's status, because the package must physically reach attacker hands.

**False-negative rate.** Low (<2%) for researchers at established institutions with registered addresses. The main legitimate-customer pain point is shipments to satellite facilities, collaborators, or field sites — address-change requests take 1–3 business days. Best guess.

**Bypass methods.**

**Method 1: Physical interception at the PI's approved institutional address.** The attacker (or a paid local confederate) picks up the package at the university mailroom or loading dock by posing as lab personnel.
- Expertise: Minimal — physical presence and basic social engineering at a receiving dock. No technical skill, but the attacker must understand the institution's receiving procedures.
- Cost: $200–2,000 if hiring a local confederate; $50–500 in travel if the attacker goes directly. Confederate figure is a best guess extrapolated from gig-economy package-pickup rates with a risk premium; no direct source.
- Lead-up time: 1–5 days for reconnaissance (identify receiving building, hours, ID requirements).
- Attacker trace: High for the physical step. University mailrooms and loading docks have near-universal camera coverage; hazmat-receiving desks at major research universities often require named-recipient pickup with university ID. Standard oligo shipments typically go through general receiving, not hazmat. [UMN biosafety receiving policy](https://hsrm.umn.edu/research-safety/biosafety/shipping-transporting-and-receiving-biological-materials); [BU biosafety manual](https://www.bu.edu/research/ethics-compliance/safety/biological-safety/ibc/resources/biosafety-manual/chapter-11-transportation-of-biological-materials/); [Parcel Pending on mailroom chain-of-custody gaps](https://www.parcelpending.com/en-us/blog/campus-mailroom-challenges/).
- Uncertainty: Interception success is ~60–80% at general receiving, ~20–40% at hazmat receiving with ID checks. Best guess.

**Method 2: Social-engineered address change to an attacker-controlled drop.** From the compromised email, the attacker requests the provider add a new "collaborator lab" or "satellite facility" shipping address.
- Expertise: Minimal — composing an email matching the PI's communication style (available from inbox history).
- Cost: $0 incremental.
- Lead-up time: Hours to draft; 1–3 business days for provider processing. Best guess.
- Attacker trace: Moderate. Provider logs the change request. The second registered contact may receive a notification the attacker cannot suppress (especially if delivered by SMS or push).
- Uncertainty: Detection probability depends on the notification channel — ~10–20% if email-only (suppressible via inbox rules), ~30–50% if SMS/push. Best guess.
- Cross-measure dependency: If paired with the email-based MFA reset path (Measure 7 Method 1), the 1–3 day address-change processing window overlaps with the "days, not weeks" MFA-reset detection window. Joint success drops sharply. The cheapest undetected path pairs address change with a zero-trace MFA bypass (Measure 7 Method 2 or 3) instead.

**Method 3: Intercept at approved address while impersonating a lab member.** Equivalent to Method 1 but framed as in-person pickup. Expertise minimal; cost $50–500 travel; lead-up 1–5 days; trace same as Method 1 — physical presence recorded, university ID check is the barrier.

---

### 4. Research & Entity Signals

**Binding?** No. The PI has genuine publications, grants, and a visible lab — the strongest possible research signals.

**False-negative rate.** Very low (<1%) for established PIs at research universities (this branch's target population). Best guess.

**Bypass methods.** None required. Inherited. Expertise: none. Cost: $0. Trace: none, provided the attacker orders sequences consistent with the PI's published research area (discoverable from public profiles and the compromised inbox).

---

### 5. Payment Integrity

**Binding?** No. The PI's payment methods — PO numbers, procurement cards — are already on file; billing routes to the institution, not the attacker.

**False-negative rate.** Very low (<1%) for established institutional accounts. Best guess.

**Bypass methods.** None required. Inherited. Expertise: none. Cost: $0. Trace: none, but if paired with a Method 2 address change, a billing/shipping address mismatch could trigger a payment alert — another argument against the address-change path.

---

## Matrix B Measures (SOC orders)

Matrix B adds IAL2 re-verification, MFA + re-authentication, vouching, and biosafety documentation. Under **Scenario 1** (IAL2 persists from onboarding), IAL2 is also inherited. Under **Scenario 2** (IAL2 re-verified at SOC order time), IAL2 becomes a binding technical barrier and the dominant cost driver.

---

### 6. Identity Verification — IAL2

**Binding?** Conditionally. Not binding under Scenario 1 (inherited). Binding under Scenario 2 (re-verified per SOC order).

**False-negative rate.** ~1–3% per re-verification attempt for legitimate PIs, driven by lighting/camera issues, appearance changes since the document photo, or document expiration. If re-verification is required per order, cumulative annoyance is a real operational cost. Calibrated against [DHS RIVR results](https://www.biometricupdate.com/202602/dhs-rivr-results-suggest-most-id-document-validation-disastrously-ineffective); direct best guess for the re-verification case.

**Bypass methods.**

**Method 1: Deepfake injection.** Generate a real-time face-swap of the PI and inject it into the IDV pipeline via virtual camera or client-SDK interception.
- Expertise: Advanced — combines two skills (deepfake generation, which is commoditized via [Deepfake-as-a-Service platforms](https://cyble.com/knowledge-hub/deepfake-as-a-service-exploded-in-2025/), and camera/SDK bypass, which requires understanding the vendor's client architecture).
- Cost: $200–2,000 total. DaaS plus tooling; virtual camera software is free. Best guess from bottom-up tooling costs; no direct per-unit DaaS price.
- Lead-up time: 3–14 days (source material collection, model training, testing against the specific vendor).
- Attacker trace: Low if the injection succeeds against passive/active liveness. Against [Level 3 / certified](https://sumsub.com/blog/face-liveness-detection/) vendors with device integrity checks, the attempt itself logs as a fraud signal.
- Success by liveness tier: passive ~40–70%; active ~15–35%; Level 3 <5% (no documented successful defeat as of early 2026). Supported by the [WEF Cybercrime Atlas finding](https://facia.ai/blog/what-most-liveness-vendors-get-wrong-about-deepfake-defense/) that moderate-quality face-swap + camera injection can deceive certain biometric systems, and [HSToday's report](https://www.hstoday.us/subject-matter-areas/cybersecurity/surge-in-digital-injection-and-deepfake-attacks-on-identity-verification-systems/) of a 2,665% surge in native virtual camera attacks and 300% rise in face-swap attacks YoY.

**Method 2: Face morphing (document attack).** Procure a fraudulent ID with a morphed photo from a dark-web vendor (or morph the PI's own document) so the document passes inspection but matches either the attacker or the PI.
- Expertise: Advanced — document forgery plus morph generation.
- Cost: $1,000–5,000. [Genuine dark-web passports average $745–850; European driver's license forgeries start at $305](https://www.safetydetectives.com/blog/dark-web-the-average-cost-of-buying-a-new-identity/); morphed photos command a premium.
- Lead-up time: 2–6 weeks, dominated by dark-web document procurement (1–4 weeks).
- Attacker trace: High. A fraudulent document is on file with the provider and is detectable by [dedicated morph-detection software per NIST SP 800-224 guidance](https://www.nist.gov/news-events/news/2025/08/nist-guidelines-can-help-organizations-detect-face-photo-morphs-deter). NFC chip verification is the hard counter — the chip stores the original photo.
- Success: ~30–60% against standard IDV without NFC or morph detection; <5% with NFC; 10–25% against dedicated morph detection. Best guess, supported by [DHS RIVR's finding that most document-validation systems have high false-acceptance rates](https://www.biometricupdate.com/202602/dhs-rivr-results-suggest-most-id-document-validation-disastrously-ineffective). [Humans are poor at spotting morphs even with training.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6663958/)

**Method 3: Exploit IDV session handoff.** Manipulate the IDV session token or API calls to skip the biometric step.
- Expertise: Intermediate.
- Cost: $0–100 for tooling.
- Lead-up time: Hours to days for vendor-flow reconnaissance.
- Attacker trace: Session anomalies (replay, device fingerprint mismatch) visible in vendor logs.
- Uncertainty: Speculative. No source found. Success probably <10% against mature vendors with device-bound, short-lived tokens; potentially higher against small vendors.

---

### 7. MFA + Re-authentication

**Binding?** Yes. This is the primary technical barrier under the baseline design.

**False-negative rate.** ~2–5% per TOTP attempt ([27% of MFA problems are time-sync issues](https://lideroo.com/blog/handling-failed-mfa-attempts-step-by-step-guide)); ~1–3% for SMS due to delivery delays and roaming.

**Bypass methods.**

**Method 1: MFA reset via email recovery.** Use the compromised inbox to trigger a "lost authenticator" reset.
- Expertise: Minimal — standard account recovery UX.
- Cost: $0.
- Lead-up time: Hours; some providers impose 24–72 hour cooling-off periods. Best guess on cooling-off.
- Attacker trace: Moderate–high. Reset event is logged; the PI's TOTP app immediately stops working and the PI discovers on next login. Many providers send confirmation to backup channels. Detection window: days, not weeks.
- Cross-measure dependency: Compounds unfavorably with Measure 3 Method 2 (address change) — see note there.

**Method 2: Session hijack via stolen cookies + anti-detect browser.** Replay a captured session token behind a fingerprint-matched [GoLogin/Multilogin](https://oxylabs.io/blog/gologin-vs-multilogin) profile and a residential proxy geolocated to the PI.
- Expertise: Intermediate — browser-fingerprint matching is a practiced skill.
- Cost: $100–300/month. [Anti-detect browser $49–99/month; residential proxy ~$55–80/month for 10 GB](https://aimultiple.com/proxy-pricing).
- Lead-up time: Hours, but session tokens have limited lifetime. [Constella's 2026 Identity Breach Report](https://constella.ai/top-5-learnings-from-the-2026-identity-breach-report/) notes infostealer packages typically contain credentials alongside tokens, so the attacker can often fall back to credential replay.
- Attacker trace: Low — login looks consistent with the PI's normal fingerprint and geography.

**Method 3: Infostealer-exfiltrated TOTP seed.** A purchased or deployed [infostealer log](https://securityboulevard.com/2026/04/48-hours-the-window-between-infostealer-infection-and-dark-web-sale/) contains the TOTP seed from a browser-based or desktop authenticator.
- Expertise: Intermediate — log interpretation, TOTP seed extraction.
- Cost: $10–200. Often $0 if the seed is in the same log used for credentials; otherwise fresh logs on Russian Market sell for $10–50.
- Lead-up time: Minutes if the seed is already in a purchased log; days to weeks if a targeted infostealer deployment is needed.
- Attacker trace: Near-zero on the provider side — valid credentials, valid code, no reset event, no new-device enrollment. This is the zero-trace MFA bypass.
- Uncertainty: Probability that a random PI's TOTP seed is in marketplace logs is low (~1–5%); hardware tokens and encrypted phone apps are not exfiltrated.

**Method 4: Real-time AitM phishing relay.** Phish the PI with a [Tycoon 2FA](https://www.microsoft.com/en-us/security/blog/2026/03/04/inside-tycoon2fa-how-a-leading-aitm-phishing-kit-operated-at-scale/) or EvilProxy kit, relaying both password and MFA token to the provider in real time. [Tycoon 2FA accounted for 89% of PhaaS attacks in early 2025.](https://www.infosecurity-magazine.com/news/sneaky-2fa-joins-tycoon-2fa/)
- Expertise: Intermediate — turnkey platforms lower the skill bar.
- Cost: $120–350. Tycoon 2FA is $120 for 10 days, $350/month.
- Lead-up time: Days for campaign setup; hours if infrastructure already exists from the email compromise.
- Attacker trace: Moderate. A second phishing email in the PI's inbox raises the chance of IT report; provider sees a login from the proxy IP unless the kit uses residential proxies.

**Method 5: FIDO2 downgrade attack.** Spoof a browser user agent that lacks FIDO support to force fallback to SMS or TOTP, which can then be relayed. [Demonstrated by Proofpoint in 2025 using a modified Evilginx phishlet](https://www.proofpoint.com/us/blog/threat-insight/dont-phish-let-me-down-fido-authentication-downgrade); [IOActive disclosed a related technique at OOTB2025](https://www.ioactive.com/authentication-downgrade-attacks-deep-dive-into-mfa-bypass/); [Apple has called out SMS/password-reset fallbacks as undermining passkey phishing resistance](https://workos.com/blog/passkeys-stop-ai-phishing-mfa-fallbacks).
- Expertise: Intermediate — protocol knowledge, phishlet configuration.
- Cost: $0–100 incremental beyond existing AitM infrastructure.
- Lead-up time: Hours.
- Attacker trace: Low — provider sees a login from an "older device," which is a normal event. [Not yet exploited in the wild as of August 2025.](https://petri.com/downgrade-attack-fido-passkey-security/)

**Method 6: SIM-jacking / SS7 interception.** Swap the PI's phone number to an attacker-controlled SIM (via carrier social engineering) or intercept SMS over SS7.
- Expertise: Minimal (SIM swap via carrier SE) to intermediate (SS7).
- Cost: SIM swap $100–500 for a one-off university target (best guess; [dark-web listings of $8,000–20,000 target high-value crypto cases](https://saily.com/blog/sim-swapping-scam/)); SS7 access $1,000–10,000+, typically nation-state or organized crime.
- Lead-up time: SIM swap hours to days; SS7 days to weeks.
- Attacker trace: Moderate for SIM swap (PI's phone goes dead; carrier records are subpoenable). Low for SS7 (passive).
- Uncertainty: Post-2024 carrier hardening cut SIM-swap success rates to ~30–50%. [FBI IC3 tracked $25.98M in SIM swap losses in 2024.](https://deepstrike.io/blog/sim-swap-scam-statistics-2025)

**Method 7: Social engineering provider support.** Call the provider's support line posing as the locked-out PI, using identity details from the inbox and optionally a cloned voice.
- Expertise: Intermediate. Voice cloning tools are cheap — [ElevenLabs Creator at $22/month](https://elevenlabs.io/pricing) or free open-source (RVC, so-vits-svc); [CrowdStrike saw a 442% half-year rise in AI-driven vishing](https://www.aicerts.ai/news/voice-cloning-supercharges-social-engineering-attack-tactics/).
- Cost: $0–50.
- Lead-up time: Hours to days.
- Attacker trace: Moderate. Support ticket is logged; voice recording may be retained. Detection may be slower than self-service because the support agent may bypass automated notifications.

**Method 8: Compromise cloud account to inject a passkey.** Break into the PI's Apple iCloud or Google account and add a device to the passkey sync group.
- Expertise: Advanced — lateral compromise plus passkey sync architecture.
- Cost: $0–200 incremental if cloud credentials are in the same infostealer haul; otherwise the cost of a second credential theft.
- Lead-up time: Hours to weeks.
- Attacker trace: Low on the provider side (legitimate passkey). Moderate on the cloud side (Apple/Google new-device alerts).

**Method 9: Timing — exploit grace period.** Act inside a 5–30 minute post-MFA window using a hijacked session, before re-authentication is required.
- Expertise: Minimal.
- Cost: $0.
- Lead-up time: Unpredictable — depends on the PI's login patterns.
- Attacker trace: Very low. No source found; highly unreliable as a primary bypass, works only combined with session hijack.

---

### 8. Vouching by Registered Contact

**Binding?** Yes — forces the attacker into the social domain.

**False-negative rate.** ~10–20% of legitimate orders delayed >48 hours due to voucher travel, leave, or workload. A significant operational friction point that creates pressure toward rubber-stamping. Best guess.

**Bypass methods.**

**Method 1: Social engineering via the PI's email.** From the compromised account, send a priming message to the usual voucher: "I'm submitting an order for [real project name]; you'll get a vouching request."
- Expertise: Minimal — match the PI's communication style, reference a plausible project (both available from the inbox).
- Cost: $0.
- Lead-up time: Hours to 1–2 business days for the voucher to approve.
- Attacker trace: Moderate. The priming email is discoverable if investigated.
- Key risk: The voucher mentioning the approval to the PI in passing — ~50–70% within a week for close colleagues, ~15–30% in distributed contexts. This is the hardest-to-mitigate detection mechanism because it is spontaneous social behavior. Best guess. Approval rate once sent: ~80–95% (higher than the [33% baseline phish-prone rate](https://sprinto.com/blog/social-engineering-statistics/) because this is not a click-through attack but a known-colleague approval).

**Method 2: Compromise the vouching contact.** Run a second credential-compromise campaign against the voucher.
- Expertise: Intermediate.
- Cost: $200–2,000 (second AitM campaign or breach lookup, plus possible local access costs).
- Lead-up time: Days to weeks.
- Attacker trace: High — two compromised accounts in the same lab group is a strong investigative signal.

**Method 3: Change the registered vouching contact.** Swap the voucher through the provider portal.
- Expertise: Minimal.
- Cost: $0.
- Lead-up time: Hours to days.
- Attacker trace: High. Provider logs the change; the original voucher receives a removal notification on a channel the attacker cannot suppress, and is the most likely person to flag it.

**Method 4: Timing — vouch during an active order period.** Wait for the PI's natural ordering window so the vouching request blends in.
- Expertise: Minimal.
- Cost: $0.
- Lead-up time: Variable — days to months waiting for the right window.
- Attacker trace: Low (order blends). In-person mention risk remains.

---

### 9. Biosafety Documentation

**Binding?** Conditionally — depends on whether existing PI documentation covers the ordered sequences.

**False-negative rate.** 15–30% if applied as a hard gate — the highest of any measure. Many legitimate researchers cannot readily produce formal IBC documentation (non-NIH-funded institutions, new projects, international formats). Best guess, consistent with `measures-in-practice.md` noting biosafety documentation is "high-value when independently verifiable, but sparse and jurisdiction-dependent."

**Bypass methods.**

**Method 1: Use the PI's existing IBC approvals.** Most established PIs have broad approvals covering common organism/sequence categories. If the order fits that scope, the measure is inert.
- Expertise: None. Cost: $0. Lead-up: none. Trace: none.

**Method 2: Fabricate or modify IBC documents.** IBC protocols are institution-specific with limited standardization; a convincing fabrication requires format familiarity but not deep biosafety expertise.
- Expertise: Minimal.
- Cost: $0–100.
- Lead-up time: Hours.
- Attacker trace: Low unless audited. [Registered IBCs use the centralized IBC-RMS system](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/), but provider verification against it is uncommon for routine orders.

**Method 3: Obtain genuine documents from the PI's email.** Search the compromised inbox for IBC correspondence and reuse the PI's actual documents.
- Expertise: None.
- Cost: $0.
- Lead-up time: Minutes to hours.
- Attacker trace: None — the documents are genuine.

---

## Summary of Binding Structure

- **Matrix A:** Only shipping address is even partially binding. Every other Matrix A measure is inherited outright.
- **Matrix B, Scenario 1:** MFA, vouching, and biosafety are nominally binding but all have near-zero-cost bypasses for an attacker already controlling the PI's inbox. IAL2 remains inherited.
- **Matrix B, Scenario 2:** IAL2 re-verification becomes the single highest-leverage binding measure and the dominant cost and success-probability bottleneck. Total cost rises from ~$314–2,229 (Matrix A alone) to ~$514–4,429 (full Scenario 2 + B), and compounded success drops to ~2–20%.
