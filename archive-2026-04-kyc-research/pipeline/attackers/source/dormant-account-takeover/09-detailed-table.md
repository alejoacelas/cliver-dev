# IT account-takeover of dormant lab provider account — Detailed table

Branch D of the exploit-affiliation profile. An IT administrator at a target institution uses legitimate mailbox-control and IAM tooling to take over a dormant synthesis-provider account belonging to a departed researcher. The attacker inherits a fully approved persona — passed IAL1 (possibly IAL2), verified affiliation, registered shipping, real publication trail, real biosafety coverage, registered voucher — rather than building one. The core capital is the institutional IT role itself. Direct dollar cost across the entire chain is zero.

---

## Matrix A (all orders)

### Measure 1: Identity verification — IAL1

**Binding?** No. IAL1 was completed by the original account holder at opening. No per-order re-check fires. The attacker presents no identity at this layer and is invisible.

**False-negative rate.** ~2–5% first-attempt failure for legitimate customers; <1% effective blocking after retry ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)).

**Bypass methods.** None needed. The attacker does nothing at this measure — the original holder's PII (name, DOB, ID document, selfie) remains on file as a false trail.

- **Attacker trace:** None. The provider's identity records point to the original holder, not the attacker. Provider-side investigation starting from the IAL1 layer reaches the wrong person.

---

### Measure 2: Institutional affiliation check

**Binding?** Partially — satisfied by inheritance but active institutional-layer work is required. The provider's baseline (domain allowlist + inbox verification + consistency checks) was already satisfied at account opening. But the provider continues using the registered institutional email for correspondence, so the attacker must control that channel throughout operation.

**False-negative rate.** ~10–25% of legitimate researchers fail on first attempt (non-institutional email use, non-standard domains); ~3–8% final blocking after manual review ([LSE Impact Blog](https://blogs.lse.ac.uk/impactofsocialsciences/2018/06/21/institutional-versus-commercial-email-addresses-which-one-to-use-in-your-publications/); best-guess scaling).

**Bypass methods.**

**Bypass A — Redirect the original holder's institutional mailbox (primary):**
- **What the attacker does:** Adds a silent forwarding rule, transfers the mailbox, or sets a mail-flow BCC on the departed researcher's institutional email address using standard admin tools (Exchange, Google Workspace, M365 mail-flow rules). The provider sees an institutional domain responding normally.
- **Expertise:** Practitioner — uses built-in IAM tools that are part of the day job. The distinguishing skill is selecting the right sub-variant and understanding audit visibility.
- **Cost:** $0.
- **Lead-up time:** Minutes for the IAM action; 1–4 weeks upstream for dormant-account enumeration.
- **Attacker trace:** Institutional IAM audit log entry under the attacker's sysadmin account. Microsoft Defender XDR, Huntress, Elastic, and Red Canary ship prebuilt detection rules for forwarding-rule creation ([Microsoft Learn](https://learn.microsoft.com/en-us/defender-xdr/alert-grading-playbook-inbox-forwarding-rules); [Red Canary](https://redcanary.com/blog/threat-detection/email-forwarding-rules/)). Narrows viable institutions to those with unmonitored IAM auditing.
- **Key caveat:** Silent forwarding is lowest visibility; full mailbox transfer is visible if the original holder logs back in.

**Bypass B — Re-activate a fully deprovisioned account:**
- **What the attacker does:** Restores a disabled Active Directory / Entra ID / Google Workspace account, resets its password locally, and brings the mailbox back online. Works even at institutions with adequate deprovisioning as long as the attacker has directory admin rights.
- **Expertise:** Practitioner — higher institutional privilege than Bypass A (directory admin, not just mail-flow admin).
- **Cost:** $0.
- **Lead-up time:** Hours for re-enable; days to weeks for enumeration of deprovisioned accounts.
- **Attacker trace:** Directory admin action log — typically higher-sensitivity audit events than forwarding rules. Helpdesk-level attackers cannot do this.

**Bypass C — Provision new institutional mailbox for fabricated persona:**
- **What the attacker does:** Creates a new mailbox under the dormant lab's subdomain (e.g., `successor@labname.university.edu`) as a fabricated institutional identity. Primary use is for Measure 8 vouching.
- **Expertise:** Practitioner — standard admin-console action.
- **Cost:** $0.
- **Lead-up time:** Minutes for provisioning; hours for supporting directory entries.
- **Attacker trace:** New mailbox creation in institutional directory; flagged by HR-IAM sync sweeps.
- **Cross-measure dependency:** Directly enables the fabricated-colleague vouching path at Measure 8.

**Bypass D — Route provider-portal traffic through institutional network egress:**
- **What the attacker does:** Logs into the provider via institutional VPN or on-campus jump box so that commodity fraud-scoring tools (Sift, Sardine, Arkose) see expected institutional IP ranges rather than a suspicious new IP.
- **Expertise:** Novice — VPN credentials are standard issue for IT staff.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** Institutional VPN/egress logs showing provider-bound traffic. Less sensitively monitored than mail audit logs.

**Bypass E — Federated login via IdP impersonation (uncertainty branch):**
- **What the attacker does:** Under federated authentication (eduGAIN/InCommon), uses IdP admin tools to impersonate the original holder via SAML assertion.
- **Expertise:** Expert — IdP admin actions require deeper knowledge and are typically held by a smaller, more-monitored admin pool.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** IdP audit log; high sensitivity. [needs verification: how commonly synthesis providers use federated login in 2026.]

---

### Measure 3: Organization registry + verified shipping address

**Binding?** No at the registry layer — everything is inherited. But physical delivery interception at the institutional mailroom is the most attacker-exposing step in the entire chain.

**False-negative rate.** ~5–15% of legitimate small research entities face friction on first attempt (address-verification mismatches, lab relocations); best-guess.

**Bypass methods.**

**Bypass A — Intercept delivery at the institutional mailroom:**
- **What the attacker does:** Physically appears at the university mailroom to collect the package, presenting a cover story ("I'm picking up for Dr. Smith's old project"). For controlled-material packages, must show ID and sign a chain-of-custody receipt.
- **Expertise:** Novice technically, but requires physical access and a plausible institutional role. Central IT admins have weaker cover than departmental IT; helpdesk-level attackers usually cannot execute this step.
- **Cost:** $0.
- **Lead-up time:** Timing-dependent — must appear within the package holding window (typically 5–10 business days).
- **Attacker trace:** **Highest exposure in the entire chain.** Face on mailroom cameras (30–90 day retention), government or institutional ID if controlled-material check, signature on package receipt, mailroom staff as human witness. Campus mailroom platforms increasingly log signed collection events ([Smart Track Pro](https://edubusinesssolutions.com/smart-track-pro/)).

**Bypass B — Ship to alternate registered address:**
- **What the attacker does:** Uses an alternate address already registered on the dormant account (satellite lab, collaborator, CRO) with weaker physical security.
- **Expertise:** Aspirant — uses inherited configuration.
- **Cost:** $0.
- **Lead-up time:** Immediate if alternate address exists.
- **Attacker trace:** Physical-layer exposure at alternate site; typically less instrumented.

**Bypass C — Social-engineer successor recipient:**
- **What the attacker does:** Lets the package reach the current occupants of the lab space, then approaches with a cover story to collect it.
- **Expertise:** Practitioner — social engineering of a real researcher.
- **Cost:** $0.
- **Lead-up time:** Hours to weeks.
- **Attacker trace:** Successor researcher becomes a living witness. Works for low-profile packages; fails when visible controlled-material markings trigger escalation.

**Bypass D — Address change to attacker-controlled destination:**
- **What the attacker does:** Submits a controlled-change request on the provider account. Fires the provider's change-review workflow. Used only as last resort.
- **Expertise:** Practitioner.
- **Cost:** $0.
- **Lead-up time:** Hours to days.
- **Attacker trace:** Highest provider-side visibility in the branch. Change-request audit trail.

---

### Measure 4: Research & entity signals

**Binding?** Conditionally non-binding — defeated under the baseline, but a single defensive enhancement (institutional-directory cross-check asking "is this researcher still here?") catches the branch cleanly.

**False-negative rate.** ~15–30% of legitimate small/new/non-US research entities face friction on first pass (thin publication footprint, non-English venue underweighting, RePORTER coverage gaps); best-guess.

**Bypass methods.**

**Bypass A — Inherited footprint (native pass):**
- **What the attacker does:** Nothing. The original holder's publication trail, grant history, and institutional affiliation are real and indexed.
- **Expertise:** N/A.
- **Cost:** $0. **Lead-up time:** 0.
- **Attacker trace:** None.

**Bypass B — Passively constrain order profile:**
- **What the attacker does:** Keeps order volume within the account's historical patterns to avoid anomaly-detection triggers.
- **Expertise:** Practitioner.
- **Cost:** $0. **Lead-up time:** Ongoing.
- **Attacker trace:** None beyond orders.

**Bypass C — Narrative framing as successor researcher:**
- **What the attacker does:** If provider correspondence asks about resumed activity, explains it as a normal academic transition ("finishing Dr. Smith's old experiments").
- **Expertise:** Practitioner — sustaining a cover story.
- **Cost:** $0. **Lead-up time:** Ongoing.
- **Attacker trace:** Written correspondence on file at the provider.

**Bypass D — Gradual volume ramp (persistent variant):**
- **What the attacker does:** Starts with small oligo orders before escalating to SOC-range material over weeks.
- **Expertise:** Practitioner.
- **Cost:** $0. **Lead-up time:** Weeks.
- **Attacker trace:** Extended order history.

---

### Measure 5: Payment integrity

**Binding?** Conditionally. Non-binding where inherited institutional billing is still live; binding when billing has been closed out and the attacker must substitute a payment method. NIH grant closeout requires final reports within 120 days of project end date ([NIH Grants](https://grants.nih.gov/grants-process/post-award-monitoring-and-reporting/closeout)), so the live-billing window is narrow at well-run institutions.

**False-negative rate.** Effectively 0% for inherited billing (the billing method is unchanged). Not applicable for substituted card (the card *should* fail the name-match check — this is a design-intent block, not a false negative).

**Bypass methods.**

**Bypass A — Use inherited institutional PO / P-card / billing code:**
- **What the attacker does:** Continues using the payment method configured at account opening.
- **Expertise:** Aspirant. **Cost:** $0. **Lead-up time:** 0.
- **Attacker trace:** Institutional accounting records under the original holder's account number. Discoverable on institutional audit.
- **Key caveat:** P-cards deactivate on HR separation; grant billing closes within months. Narrow time window.

**Bypass B — Inherited invoice / net-terms billing:**
- **What the attacker does:** Uses invoice billing without per-order card authorization; the institution's AP system processes the invoice.
- **Expertise:** Aspirant. **Cost:** $0. **Lead-up time:** 0.
- **Attacker trace:** Institutional invoice record plus provider archive.

**Bypass C — Modify PO budget code via finance-system access:**
- **What the attacker does:** Temporarily reroutes the order to a different live budget code the attacker knows is funded. Requires finance-system admin rights in addition to mailbox admin.
- **Expertise:** Practitioner. **Cost:** $0. **Lead-up time:** Minutes.
- **Attacker trace:** Finance-system audit log. Monitored by institutional internal audit rather than IT security — different detection pipeline.
- **Cross-measure dependency:** Requires attacker to hold finance-system privilege, plausible at smaller institutions where IT/finance IT are unified.

**Bypass D — Substituted personal card (failure mode):**
- **What the attacker does:** Adds a personal payment card. The cardholder name mismatches the account holder name (the original holder's), so the provider's name-match consistency check flags it. This sub-path blocks the branch for most attackers.
- **Expertise:** Aspirant. **Cost:** $0–$100. **Lead-up time:** Minutes.
- **Attacker trace:** Attacker's own card on file — the branch's first provider-side identity commitment.

---

## Matrix B (SOC orders) — adds on top of Matrix A

### Measure 6: Identity verification — IAL2

**Binding?** **The pivot measure for the entire branch.** Not binding under onboarding-time IAL2 (the inherited "passed" state suffices). Fully catching under order-triggered IAL2 with biometric re-proofing against the stored original-holder template (the attacker's face does not match).

**False-negative rate.** ~5–15% first-attempt failure for legitimate customers (capture quality, aged photos, liveness false rejections); best-guess interpolation from [Intellicheck](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets) data. Deepfakes linked to 20% of biometric fraud attempts per [FinTech Magazine](https://fintechmagazine.com/news/cybercrime-when-the-sun-is-down-entrust-shows-attack-surge) / [Entrust 2026](https://www.entrust.com/resources/reports/identity-fraud-report).

**Bypass methods.**

**Bypass A — Deepfake / video injection attack (off-profile):**
- **What the attacker does:** Renders a real-time deepfake of the original holder's face from archived imagery and injects it into the vendor flow, bypassing the device camera. **This requires Expert-to-Innovator expertise — far above the branch's Practitioner-level IT admin.**
- **Expertise:** Expert to Innovator.
- **Cost:** Low thousands (basic DaaS) to $5k–$30k (hardened vendor); best-guess from threat intelligence reports ([Cyble](https://cyble.com/knowledge-hub/deepfake-as-a-service-exploded-in-2025/)).
- **Lead-up time:** Weeks to months.
- **Attacker trace:** No biometric committed; technical trace only (SDK tamper indicators, session IP, device fingerprint).
- **Key caveat:** Flagged as off-profile. An attacker with these skills has better branches than "IT admin takeover of dormant accounts."

**Bypass B — Face morphing on forged original-holder ID (off-profile):**
- **What the attacker does:** Creates a morphed photo blending attacker and original holder features, printed on a forged ID. The morph passes automated comparison for both identities. NIST released FATE MORPH 4B guidelines in 2025 for morph detection ([Biometric Update](https://www.biometricupdate.com/202508/new-nist-guidelines-look-at-face-morph-attacks-and-how-to-stop-them)).
- **Expertise:** Expert. **Cost:** $100–$2,000. **Lead-up time:** Days to weeks.
- **Attacker trace:** Morphed photo on file; recoverable by forensic review.

**Bypass C — Manual-review fallback exploitation:**
- **What the attacker does:** Deliberately fails automated verification to trigger human review. If the human reviewer does not compare against the stored template, the attacker passes with their own face. [needs verification: which IDV vendors include stored-template comparison in manual review.]
- **Expertise:** Practitioner. **Cost:** $0. **Lead-up time:** Hours.
- **Attacker trace:** Attacker's real face committed — loses the no-biometric-commitment property.

**Bypass D — Abandon SOC orders:**
- **What the attacker does:** Restricts to Matrix A orders. The rational play under order-triggered IAL2 with comparison.

---

### Measure 7: MFA + re-authentication

**Binding?** Conditional on factor type and factor-recovery workflow. Non-binding under relayable TOTP with email-channel MFA recovery (the branch's assumed baseline). Catching under separate MFA recovery paths (SMS, backup codes, IDV step-up). Catching under phishing-resistant MFA bound to the original holder's device.

**False-negative rate.** <1% for legitimate customers controlling their own factor.

**Bypass methods.**

**Bypass A — Email-channel MFA recovery (baseline assumption):**
- **What the attacker does:** After password reset, triggers MFA recovery through the same email channel and enrolls a new TOTP on an attacker-controlled device.
- **Expertise:** Novice. **Cost:** $0. **Lead-up time:** Minutes.
- **Attacker trace:** New TOTP seed / device fingerprint enrolled at the provider.

**Bypass B — Social-engineer provider support:**
- **What the attacker does:** Contacts provider support claiming to be the account holder, requests MFA reset outside the normal workflow. The 0ktapus campaign (2022) demonstrated credential + MFA theft via social engineering at scale across 130+ organizations ([Group-IB](https://www.group-ib.com/blog/0ktapus/)).
- **Expertise:** Practitioner. **Cost:** $0. **Lead-up time:** Hours to days.
- **Attacker trace:** Support ticket log, voice recording if applicable.

**Bypass C — IdP impersonation (federated login):**
- **What the attacker does:** Re-enrolls the original holder's MFA factors at the IdP level, then logs into the provider via federation.
- **Expertise:** Expert. **Cost:** $0. **Lead-up time:** Hours.
- **Attacker trace:** IdP audit log — high-sensitivity event.

**Bypass D — IdP MFA policy relaxation:**
- **What the attacker does:** Temporarily reduces MFA requirements at the institutional IdP level, logs in, restores the policy.
- **Expertise:** Expert. **Cost:** $0. **Lead-up time:** Minutes to hours.
- **Attacker trace:** Two IdP audit log entries (relax + restore) — very distinctive pattern.

---

### Measure 8: Vouching by registered contact

**Binding?** Yes. The inherited voucher must be activated or replaced.

**False-negative rate.** ~15–30% friction for legitimate small labs finding a second voucher; best-guess.

**Bypass methods.**

**Bypass A — Voucher-also-dormant: full second takeover cycle:**
- **What the attacker does:** Redirects the dormant voucher's institutional mailbox, triggers a provider-side password reset on the voucher's account, and re-enrolls MFA. This is the entire M2 chain duplicated on a second provider account.
- **Expertise:** Practitioner. **Cost:** $0. **Lead-up time:** 1–4 additional weeks.
- **Attacker trace:** Two IAM audit entries, two provider session logs, doubled F3/F4 risks.
- **Key caveat:** Doubles every detection risk. The voucher's mailbox-redirection is a second SIEM alert at the institution.

**Bypass B — Fabricated colleague via new mailbox provisioning:**
- **What the attacker does:** Creates a new institutional mailbox for a fabricated persona and submits a contact-change request to replace the registered voucher. If the provider's vouching workflow does not independently re-proof new vouchers, this is the cheapest path. [needs verification: whether baseline vouching workflows re-proof at voucher registration.]
- **Expertise:** Practitioner. **Cost:** $0. **Lead-up time:** Hours plus 1–10 business days provider processing.
- **Attacker trace:** Mailbox creation in institutional directory plus contact-change audit trail at the provider.
- **Cross-measure dependency:** Directly uses M2 Bypass C (new mailbox provisioning).

**Bypass C — IdP impersonation of voucher (federated login):**
- **What the attacker does:** Impersonates the voucher at the IdP level without any mailbox action.
- **Expertise:** Expert. **Cost:** $0. **Lead-up time:** Hours.
- **Attacker trace:** IdP audit log.

**Bypass D — Multi-voucher weakest-link:**
- **What the attacker does:** If the account has multiple registered vouchers, targets the most dormant or defeatable one rather than all.
- **Expertise:** Aspirant (targeting only). **Cost:** $0. **Lead-up time:** 0 beyond enumeration.
- **Attacker trace:** None beyond selected path.

---

### Measure 9: Biosafety documentation

**Binding?** Conditionally non-binding — defeated under baseline, caught only by an institutional IBC cross-check that is not part of the baseline. Institutional IBC protocols that are not proactively closed by a departing PI remain nominally active through their multi-year renewal cycle ([Indiana University IBC](https://research.iu.edu/compliance/biosafety/submissions/closure.html)).

**False-negative rate.** ~25–40% friction for small private labs on first SOC submission (no centralized registry, no standard format); from measures-in-practice.md.

**Bypass methods.**

**Bypass A — Inherited institutional IBC protocol (native pass):**
- **What the attacker does:** Lets the inherited IBC coverage stand. At institutions with poor closure discipline, protocols remain nominally active for years after PI departure.
- **Expertise:** Aspirant. **Cost:** $0. **Lead-up time:** 0.
- **Attacker trace:** None from passive inheritance.

**Bypass B — Attach a real active IBC protocol from a different lab at the same institution (preferred):**
- **What the attacker does:** Pulls a real active IBC protocol from the institutional research-office DMS and attaches it to the order. The document is genuine — real protocol number, real biosafety officer signature, real institution. Caught only if the reviewer cross-checks whether the ordered sequences fall within the protocol's scope.
- **Expertise:** Practitioner — navigates the institutional DMS and selects a protocol with plausibly consistent scope.
- **Cost:** $0. **Lead-up time:** Hours to days.
- **Attacker trace:** DMS access log under attacker's credentials. Biosafety officer's name on the submitted document becomes a witness if the provider cross-checks.

**Bypass C — Modify the institutional IBC database directly:**
- **What the attacker does:** Updates the dormant lab's protocol record to extend its expiration or add the "successor researcher" to approved personnel.
- **Expertise:** Expert — requires database-level access, not just DMS read.
- **Cost:** $0. **Lead-up time:** Minutes to hours.
- **Attacker trace:** Database audit log — highly distinctive event on a low-volume data surface.

**Bypass D — Umbrella-protocol claim:**
- **What the attacker does:** Claims coverage under an existing institutional umbrella protocol.
- **Expertise:** Practitioner. **Cost:** $0. **Lead-up time:** Hours.
- **Attacker trace:** Claim text on file; cross-checkable.
