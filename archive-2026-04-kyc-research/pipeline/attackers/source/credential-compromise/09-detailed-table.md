# Branch A (Remote credential compromise) — Detailed synthesis

This document distills the researched column for the remote credential-compromise branch into a per-measure synthesis. Matrix A covers measures binding on all orders; Matrix B adds the measures binding on SOC orders. Every source from the researched column is preserved as an inline link. Where a number is a best guess rather than a firm source, it is noted inline.

**Attacker in brief.** A technically competent individual or small team using off-the-shelf cybercrime tooling — credential-breach databases, infostealer-log marketplaces, credential-stuffing scripts, and (for MFA-protected targets) a rented adversary-in-the-middle phishing kit such as Tycoon 2FA or EvilProxy. They can purchase a fraudulent government ID in the target's name from a dark-web document vendor and have enough social-engineering skill to prime a vouching contact from a compromised email account. They have no prior relationship with anyone at the target institution.

**Target in brief.** Faculty, staff, and lab managers at small US teaching-focused colleges and community colleges with biology/chemistry programs (~2,500 institutions), plus mid-sized US and European research universities reachable through AitM phishing (~1,000+). Targets are identified from public faculty directories and cross-referenced against breach databases and infostealer-log marketplaces. The branch prefers these institutions because of weak email security, slow IT response, and mailrooms that do not scrutinize package recipients.

**Similar scenarios merged into this branch.** AitM phishing against MFA-protected mid-sized universities (a more expensive credential-acquisition variant with identical downstream steps) and opportunistic infostealer-log pre-screening (treated as a cheaper first step before falling back to credential stuffing or AitM phishing).

---

## MATRIX A — All orders

### Measure 1: Identity verification — IAL1

**Binding?** Not a hard block, but materially harder than a pure database+SMS check. The baseline assumption (per `measures-in-practice.md` §1) is a document-centric vendor flow capturing a government ID plus a selfie with liveness. The attacker must either supply a fraudulent ID matching a photo they can present, or take over an account whose IAL1 was already completed by the real user.

**False-negative rate for legitimate customers.** Roughly 10–20% first-attempt failure at a mid-tier vendor, with a 10–50% spread across vendors. Driven by demographic disparities (darker skin tones) and document-image quality. Sourced to the [GSA 2024 equity study](https://www.nextgov.com/emerging-tech/2024/09/gsa-testing-finds-variations-accuracy-digital-id-verification-tech/399850/) and [full arXiv paper](https://arxiv.org/html/2409.12318v1). Under the lighter database+SMS alternative, the legitimate failure rate drops to roughly 2–5% (best guess, below GSA numbers because database validation is less error-prone than biometric matching).

**Bypass methods:**

- **Account takeover of an existing verified customer (cheapest path under the document+selfie baseline).** The attacker compromises a faculty member who already has a verified account with the synthesis provider, then resets the provider password via the compromised institutional email — inheriting the prior IAL1 pass without performing any direct identity attack.
  - Expertise: Intermediate (adapted commodity tooling; no custom exploits).
  - Cost: $5–$1,050. The floor is just an infostealer log ([Sekoia](https://blog.sekoia.io/overview-of-the-russian-speaking-infostealer-ecosystem-the-logs/)); the upper end covers an optional SIM swap if password-reset SMS challenges are used.
  - Lead-up time: 1–3 days.
  - Attacker trace: No biometric artifact created. Password-reset event, MFA re-enrollment event, and login anomalies in provider and institutional email logs. Significantly lower-trace than any direct IDV bypass.
  - Caveat: Requires a target who is already an active customer at the provider. Narrows the target pool sharply.
  - Cross-measure dependency: This method is the same operational move that bypasses measure 6 (IAL2) and measure 2 (affiliation); its feasibility depends on measure 6 being an onboarding-only check, not re-triggered per order.

- **Fraudulent government ID plus a passive-liveness selfie (baseline IAL1, new account).** The attacker buys a physical or template forgery in the target's name with an attacker-supplied photo, presents it to the vendor's document check, and passes the selfie step because the ID photo matches the face on camera.
  - Expertise: Intermediate to Advanced — document procurement and selfie presentation, but no injection attack if the IAL1 vendor tier uses only passive liveness.
  - Cost: $1,000–$3,000+ for a custom document ([PrivacyAffairs 2023](https://www.privacyaffairs.com/dark-web-price-index-2023/)). A template-only forgery at $200–$600 may suffice if the vendor skips [AAMVA DLDV](https://www.aamva.org/technology/systems/verification-systems/dldv) validation, but `measures-in-practice.md` assumes at least template-level checks and often AAMVA in the US, pushing the attacker toward the higher range.
  - Lead-up time: 1–3 weeks, dominated by document procurement.
  - Attacker trace: Fraudulent document image and attacker-linked selfie (or morph) stored by the IDV vendor, retained for years. High-durability biometric artifact — the same one that would be created under Matrix B Path B.
  - Cross-measure dependency: This is the same artifact the attacker would need for measure 6, so choosing this path means paying the Matrix B IAL2 cost even on a Matrix A-only attack.

- **Breached PII plus SIM swap (only if the provider uses the lighter database+SMS IAL1 variant).** The attacker buys the target's name, DOB, address, and SSN from a dark-web index, then bribes or tricks a carrier employee into porting the target's number to a SIM the attacker controls, in order to intercept the SMS OTP used by the database+SMS flow.
  - Expertise: Intermediate. Requires operational coordination of SIM-swap timing with the IDV flow.
  - Cost: $310–$1,100. PII $10–$100 ([PrivacyAffairs 2023](https://www.privacyaffairs.com/dark-web-price-index-2023/); [Deep Strike 2025](https://deepstrike.io/blog/dark-web-data-pricing-2025)); SIM swap $300–$1,000 ([Security Boulevard](https://securityboulevard.com/2024/04/sim-swap-bribe-t-mobile-300-richixbw/); [Recorded Future](https://go.recordedfuture.com/hubfs/reports/cta-2021-0825.pdf); [FCC order](https://docs.fcc.gov/public/attachments/FCC-23-95A1.pdf), which raised the bar after July 2024 by requiring carrier authentication before SIM changes).
  - Lead-up time: 1–3 days.
  - Attacker trace: Target's real PII in IDV vendor records; disposable prepaid SIM; carrier SIM-swap records retained 3 years per FCC order.
  - Caveat: Only applies when the provider uses the lighter database+SMS IAL1 variant. `measures-in-practice.md` flags this as a "serious alternative," not the baseline.

- **Infostealer log with phone/carrier access (database+SMS variant, no SIM swap).** If an infostealer log already contains the target's carrier-portal or email-to-SMS access, the attacker can receive the OTP without a separate SIM swap.
  - Expertise: Intermediate.
  - Cost: $5–$100 — just the log ([Sekoia](https://blog.sekoia.io/overview-of-the-russian-speaking-infostealer-ecosystem-the-logs/); [ReliaQuest](https://reliaquest.com/blog/infostealer-pipeline-stolen-credential-attacks-russian-marketplace/)).
  - Lead-up time: Hours.
  - Attacker trace: Same PII in IDV records as the SIM-swap method, plus a marketplace transaction in cryptocurrency. No SIM-swap carrier record.
  - Caveat: Same provider-tier constraint as the SIM-swap method.

### Measure 2: Institutional affiliation check

**Binding?** No. The genuine compromised `.edu` email passes the affiliation check authentically.

**False-negative rate for legitimate customers.** Roughly 1–3% (best guess). Main failure modes: spam-filtering of verification emails, recently changed institutional addresses, or adjunct/emeritus faculty whose accounts have been deactivated.

**Bypass method — Compromised `.edu` email.** The attacker logs into the target's institutional mailbox using credentials from a breach or infostealer log, or a session token captured via AitM phishing, and replies to any affiliation-verification email as the real user would.
- Expertise: Amateurish to Intermediate. Marketplace purchase plus login is trivial; setting up a mail-forwarding rule for persistence is basic O365/Google Workspace admin.
- Cost: $0 incremental. Credential-acquisition cost is already counted under measure 1.
- Lead-up time: Minutes once email access is established.
- Attacker trace: Login IPs and user agents in institutional sign-in logs ([Azure AD sign-in logs](https://learn.microsoft.com/en-us/azure/active-directory/reports-monitoring/concept-sign-ins)), mail-forwarding-rule artifacts visible to IT admins, and sent-mail records of any interaction with the provider. May be flagged by conditional-access policies at institutions using Azure AD or Google Workspace with monitoring.
- Cross-measure dependency: Free because the email compromise is already paid for at measure 1.

### Measure 3: Organization registry + verified shipping address

**Binding?** Weakly. Friction depends almost entirely on whether carrier-account redirect is available. Under the US baseline (UPS My Choice, FedEx Delivery Manager), it is — so the measure is effectively bypassed at $0 and about 30 minutes of work. Meaningful friction only appears when carrier redirect is blocked and the attacker must physically intercept at the mailroom or file a USPS change of address.

**False-negative rate for legitimate customers.** Roughly 2–5% (best guess). Driven by new facilities, multi-campus institutions, and inconsistent address formatting.

**Bypass methods:**

- **Ship to institution mailroom and physically intercept.** The attacker (or a local accomplice) positions near the mailroom at the expected delivery window and claims the package.
  - Expertise: Intermediate. Physical surveillance and timing; at small colleges, an in-person impersonation may require social-engineering skill.
  - Cost: $0 if the attacker is local; $100–$500 per interception if a local accomplice is hired (best guess).
  - Lead-up time: 1–5 days.
  - Attacker trace: Package tracking, mailroom sign-out logs, security camera footage, potential eyewitness identification. This is the highest-attribution step in the branch.
  - Cross-measure dependency: None directly, but the scaled variant of the branch depends on having accomplices at many institutions.

- **Carrier account takeover for package redirect (dominant cheapest path).** The attacker creates a UPS My Choice or FedEx Delivery Manager account in the target's name using the PII and email access they already have, and redirects the shipment to a drop address.
  - Expertise: Amateurish. Routine consumer account setup.
  - Cost: $0 incremental.
  - Lead-up time: ~30 minutes.
  - Attacker trace: Carrier account creation records, redirect request logs with timestamp and new delivery address. The new delivery address is the highest-durability forensic artifact in the cheapest path. [FedEx Delivery Manager](https://www.fedex.com/en-us/delivery-manager.html); [Chargebacks911](https://chargebacks911.com/package-redirection-scam/); [TechCrunch 2023](https://techcrunch.com/2023/03/01/us-postal-service-change-of-address-fraud/).

- **USPS change of address redirect.** The attacker files a USPS COA in the target's name to forward mail from the institution to a drop address.
  - Expertise: Amateurish.
  - Cost: $1.25 USPS fee. Since July 2024, online filings require mobile phone identity proofing, which would add a SIM swap ($300–$1,000) unless the attacker already has one for the database+SMS IAL1 variant. This method is not chosen in any cheapest path.
  - Lead-up time: 7–10 days, with a physical confirmation letter sent to the old address that creates a detection window.
  - Attacker trace: USPS COA filing records, confirmation letter to the old address, credit card used for the fee, and the new forwarding address. [USPS Change of Address](https://www.usps.com/manage/forward.htm).
  - Cross-measure dependency: SIM-swap step can be reused from the database+SMS IAL1 variant at no incremental cost.

### Measure 4: Research & entity signals

**Binding?** No. The attacker operates under a real institution's identity with a real faculty profile, research program, and public publication history.

**False-negative rate for legitimate customers.** Roughly 1–3% at academic institutions and 5–15% at non-academic institutions (best guess).

**Bypass method — Genuine institution signals.**
- Expertise: Minimal.
- Cost: $0 incremental.
- Lead-up time: Minutes.
- Attacker trace: None beyond what is already in the provider account.

### Measure 5: Payment integrity

**Binding?** No. Per `measures-in-practice.md` §5, this measure is non-binding for any attacker using their own identity or a well-matched fraudulent identity — which includes this branch, since invoiced orders bill the institution directly under the target's genuine affiliation. There is a weak residual friction from delayed institutional accounting review, but that is a trace-creation event rather than a block.

**False-negative rate for legitimate customers.** Roughly 1–2% (best guess). Centralized purchasing mismatches and expired procurement cards.

**Bypass methods:**

- **Invoiced order (dominant).** The attacker orders on institutional invoice/PO, charging the institution's billing system as the target would.
  - Expertise: Amateurish.
  - Cost: $0 incremental.
  - Lead-up time: None beyond order placement.
  - Attacker trace: Invoice/PO record linking the order to the institutional billing system; delayed accounting review (days to months).

- **Credit card in the target's name.** Identity-fraud new-card application or a cloned card.
  - Expertise: Intermediate.
  - Cost: $200–$500 for a cloned card; $0 for a fraudulent new-card application but with financial-fraud detection risk.
  - Lead-up time: Days (cloned) to 1–2 weeks (new application).
  - Attacker trace: Highly attributable card application or transaction records; the issuer's fraud detection may alert before shipment.

---

## MATRIX B — SOC orders (adds measures 6–9)

### Measure 6: Identity verification — IAL2

**Binding?** Yes — a hard barrier on direct attempts, with one important exception: if the attacker takes over an existing verified customer's account and IAL2 is not re-triggered per order, the attacker inherits the prior pass without performing any IAL2 attack.

**False-negative rate for legitimate customers.** Roughly 10–20% at baseline; across vendors the range is 10–50%, with significant demographic disparities. [GSA 2024 study](https://www.nextgov.com/emerging-tech/2024/09/gsa-testing-finds-variations-accuracy-digital-id-verification-tech/399850/); [arXiv](https://arxiv.org/html/2409.12318v1); [Persona](https://withpersona.com/blog/identity-verification-pass-rate-metrics); [ID Tech Wire](https://idtechwire.com/two-of-five-idv-vendors-show-no-bias-in-equity-focused-gsa-study/) (two of five GSA-tested vendors showed no demographic bias; three had statistically significant disparities).

**Bypass methods:**

- **Account takeover of an existing verified customer (critical exception).** Same move as in measure 1. The attacker resets the provider password via the compromised institutional email and inherits the prior IAL2 verification.
  - Expertise: Intermediate.
  - Cost: $0 incremental beyond Matrix A credentials.
  - Lead-up time: Minutes.
  - Attacker trace: Password-reset and MFA re-enrollment events in provider logs. No facial image, no document image.
  - Caveat — cross-measure dependency: This path only works if IAL2 is an onboarding-only check. If the provider re-triggers IAL2 at SOC-order submission, the attacker must defeat IAL2 directly and collapses into one of the fraudulent-ID methods below.

- **Method 1: Fraudulent government ID plus injection attack.** A custom forged document is combined with a virtual camera or face-swap tool that injects synthetic video into the vendor's selfie capture, bypassing the device camera.
  - Expertise: Advanced. Requires custom document procurement, understanding of IDV vendor SDK architecture, and ability to execute a video injection.
  - Cost: $1,500–$4,000+. Document $1,000–$3,000+ ([PrivacyAffairs 2023](https://www.privacyaffairs.com/dark-web-price-index-2023/) — forged passports average $1,478; [Safety Detectives 2026](https://www.safetydetectives.com/blog/dark-web-the-average-cost-of-buying-a-new-identity/); [PrivacySharks 2026](https://www.privacysharks.com/dark-web-price-index/)); injection tooling $200–$500 ([iProov 2025](https://www.iproov.com/reports/threat-intelligence-report-2025-remote-identity-attack) — 127 face-swap tools catalogued; [iProov press](https://www.iproov.com/press/annual-identity-verification-threat-intelligence-report) — native virtual-camera attacks up 2,665% in 2024; [BusinessWire](https://www.businesswire.com/news/home/20250226745447/en/iProov-Issues-Annual-Identity-Verification-Threat-Intelligence-Report)). Effective per-success cost is 1.7–3.3× nominal because leading IDV vendors check hundreds of attributes and AAMVA can catch forged DL numbers in real time; 2024 industry data shows 6% of IDV attempts were impersonation and fraud was up 20% year-over-year ([AAMVA DLDV](https://www.aamva.org/technology/systems/verification-systems/dldv); [Veriff 2024](https://www.prnewswire.com/news-releases/veriff-annual-identity-fraud-report-reveals-20-rise-in-fraud-302005039.html); best-guess multiplier).
  - Lead-up time: 1–4 weeks.
  - Attacker trace: Fraudulent document image and injected synthetic face stored by the vendor (high durability); failed-verification records with session metadata.

- **Method 2: Fraudulent government ID plus face morphing.** The ID photo is morphed to blend the target's face with the attacker's, letting a single ID pass selfie-matching against either person.
  - Expertise: Advanced.
  - Cost: $1,000–$3,000+ (document) plus $0–$200 (morphing tools).
  - Lead-up time: 1–4 weeks.
  - Attacker trace: Morphed document photo plus the attacker's actual face in the selfie — the highest-attribution biometric trace in the branch.
  - Caveat: At the [NIST FATE MORPH](https://pages.nist.gov/frvt/html/frvt_morph.html) evaluation, top morph-detection algorithms still miss 10–28% of high-quality sequestered morphs at a 1% false-detection rate ([NIST FRVT Part 4 report](https://pages.nist.gov/frvt/reports/morph/frvt_morph_report.pdf); [NIST FATE MORPH 2025](https://pages.nist.gov/ifpc/2025/presentations/28.pdf); [secunet MAD](https://ecs-org.eu/secunet-detects-morphing-attack-achieving-an-excellent-result-in-nist-frvt-morph-test/); [Biometric Update](https://www.biometricupdate.com/202508/new-nist-guidelines-look-at-face-morph-attacks-and-how-to-stop-them)). Only helpful where the vendor deploys morph-attack detection — elsewhere, Method 3 is strictly cheaper.

- **Method 3: Fraudulent government ID plus presentation attack (passive liveness only).** The attacker holds a forged ID to camera and presents their real face for the selfie — works when the vendor uses only passive liveness.
  - Expertise: Intermediate.
  - Cost: $1,000–$3,000+ (document only).
  - Lead-up time: 1–3 weeks.
  - Attacker trace: Attacker's real face captured; fraudulent document stored.
  - Caveat: Only applies if the vendor's liveness tier is passive-only, not active or device-integrity-bound.

- **Method 4: Social-engineer provider support to bypass IAL2.** The attacker opens a support ticket claiming difficulty with the selfie flow and convinces a support agent to grant a manual override.
  - Expertise: Intermediate.
  - Cost: $0 incremental.
  - Lead-up time: Hours to days.
  - Attacker trace: Support ticket records and manual override in the audit trail.

- **Uncertainty branch — full stack (Level 3 liveness + NFC + MAD + injection detection).** If the provider deploys NFC chip reading, Methods 1, 2, and 3 all fail; only Method 4 and the account-takeover exception remain viable.

### Measure 7: MFA + re-authentication

**Binding?** No for the TOTP baseline.

**False-negative rate for legitimate customers.** Roughly 1–3% (best guess). Users losing device access during enrollment or re-enrollment.

**Bypass methods:**

- **Attacker enrolls own TOTP (new or reset account).** The attacker registers a TOTP seed they control during account creation or after a password reset.
  - Expertise: Amateurish.
  - Cost: $0 incremental.
  - Lead-up time: Minutes.
  - Attacker trace: TOTP enrollment record and authentication logs.

- **Infostealer-sourced TOTP seed.** The log may include the target's existing TOTP seed; the attacker imports it and generates valid codes without re-enrolling.
  - Expertise: Amateurish.
  - Cost: $0 incremental (already paid for under measure 1).
  - Lead-up time: Minutes.
  - Attacker trace: Concurrent TOTP usage patterns — detectable but rarely monitored.

- **Uncertainty branch — passkeys/FIDO2.** If the provider requires passkeys bound to a hardware authenticator, expertise rises to Advanced and a bypass may not be feasible for this attacker profile.

### Measure 8: Vouching by registered contact

**Binding?** Yes — a meaningful barrier, though strength depends on how rigorously the vouching contact actually verifies the request.

**False-negative rate for legitimate customers.** Roughly 5–15% (best guess). Drivers: vouching contact unavailable, not recognizing the requester, or declining on the first ask.

**Bypass methods:**

- **Method 1: Social-engineer the vouching contact from the compromised email.** Before the provider's request arrives, the attacker sends a priming message from the target's account: "I'm about to submit an order for [real project name pulled from the lab's public page], you'll get a vouching request from [provider]." The contact, recognizing the sender and the project, approves.
  - Expertise: Intermediate.
  - Cost: $0 incremental.
  - Lead-up time: Hours to days.
  - Per-attempt success rate: roughly 20–40% for SOC-level approvals. Calibrated from [Verizon DBIR 2025](https://www.verizon.com/business/resources/reports/dbir/) and pretexting data in [StationX](https://www.stationx.net/phishing-statistics/) and [Keepnet](https://keepnetlabs.com/blog/top-phishing-statistics-and-trends-you-must-know), which find spear-phishing click rates of 47–54%; downward-adjusted because vouching for SOC materials is a higher-stakes action than a click (best guess).
  - Attacker trace: Priming email in the compromised account's sent folder (strong, durable artifact), vouching contact's memory, provider portal approval records.
  - Caveat: Each failed attempt creates cascading detection risk — if the vouching contact calls the real faculty member to verify, the email and account compromises are exposed simultaneously.

- **Method 2: Compromise a second account to self-vouch.** The attacker compromises a second institutional email belonging to a plausible collaborator and uses it as the registered voucher.
  - Expertise: Intermediate.
  - Cost: $5–$1,000+ incremental (another round of credential acquisition).
  - Lead-up time: Hours to days.
  - Attacker trace: Two compromised accounts; doubles the digital footprint.

### Measure 9: Biosafety documentation

**Binding?** Partially, with inverse correlation to measure 3. At NIH-funded institutions with registered Institutional Biosafety Committees (IBCs), this measure is easily satisfied. At institutions without IBCs, it narrows the viable target pool.

**False-negative rate for legitimate customers.** Roughly 15–40% (best guess). Institutions without formal IBCs, or researchers whose work does not require IBC review.

**Bypass methods:**

- **Method 1: Reference the institution's existing IBC.** The attacker cites the target institution's real IBC number, verifiable against the [NIH Office of Science Policy IBC rosters](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/).
  - Expertise: Amateurish.
  - Cost: $0 incremental.
  - Lead-up time: Minutes.
  - Attacker trace: IBC reference number in the order record.
  - Caveat: Only works at the ~500–800 institutions with registered IBCs (best-guess BOTEC), narrowing the target pool from the ~2,500 small-college baseline.

- **Method 2: Claim exemption or alternative compliance.** The attacker states that the ordered sequence does not require IBC review under applicable guidelines.
  - Expertise: Amateurish.
  - Cost: $0 incremental.
  - Lead-up time: Minutes.
  - Attacker trace: Stated justification in the order record.

- **Method 3: Fabricate IBC documentation.** The attacker generates a plausible-looking IBC approval letter referencing the institution's real committee.
  - Expertise: Intermediate.
  - Cost: $0 incremental.
  - Lead-up time: Hours.
  - Attacker trace: Fabricated document in provider records.

---

## Bottom-line synthesis

**Cheapest Matrix A path.** Under the document+selfie IAL1 baseline, the dominant path is account takeover of an existing verified customer combined with carrier-redirect shipping. Total cost $5–$50, lead time 1–5 days, expertise Intermediate. Under the database+SMS IAL1 alternative, the SIM-swap variant costs $305–$1,050 and the infostealer-phone-access variant $5–$100.

**Cheapest Matrix B path (Path A — account takeover).** Same as Matrix A at the credential layer, with inherited IAL2, attacker-enrolled TOTP, social-engineered vouching, and IBC reference. Total $5–$1,050 depending on sub-variant; lead time 1–10 days; success rate ~3–12% per attempt (best guess BOTEC combining target selection, SIM swap where used, and vouching SE).

**Matrix B Path B — new account with fraudulent ID.** $1,805–$5,050+ total, 2–5 weeks lead time, Advanced expertise, ~1–7% per-attempt success. Effective cost per success $3,600–$16,800+ (best guess).

**Measures doing the most work.** Vouching (measure 8) is the primary non-zero friction in both Matrix A and B — no method eliminates it, and the 20–40% per-attempt success rate dominates the chain-fragility calculation. IAL2 (measure 6) does the most work only under Path B or when IAL2 is re-triggered per order; under the dominant Path A it is fully bypassed. IAL1 (measure 1) does moderate work under the document+selfie baseline, forcing the attacker into ATO or fraudulent-ID flows. Org registry + shipping (measure 3) does little work unless carrier redirect is blocked. MFA, affiliation, research signals, and payment are non-binding in this branch.

**Trace profile of the cheapest Path A attempt.** No biometric trace. The strongest forensic artifacts are (a) the carrier-redirect delivery address, which points at a physical location the attacker controls, and (b) the priming email in the compromised account's sent folder, which is direct evidence of the social-engineering step. Supporting artifacts include institutional email sign-in logs (residential-proxy IPs, 90–180 day retention), provider account logs, and an email-forwarding rule visible to IT admins. Path B adds the attacker's face (or a morph containing it) and a fraudulent document to the IDV vendor's biometric records — a fundamentally higher-attribution commitment.
