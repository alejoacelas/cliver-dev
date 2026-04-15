# IT / sysadmin manufacturing a lab persona — Detailed table

Branch B of the exploit-affiliation profile. An IT administrator at a research university or institute uses legitimate admin rights over mail routing, directory entries, and identity management to manufacture a role-plausible persona (lab manager, research tech, visiting scholar) on the real institutional domain, attached to a real host lab selected for its publications, grants, and existing provider relationship. The attacker is a real person with a real ID at IAL1/IAL2; the fraud is at the role-linkage layer, not the identity layer. The cheapest end-to-end path concentrates on a single real PI who rubber-stamps 4--5 touchpoints across the matrix.

---

## Cross-cutting context

**Tenant defenses and identity threat detection.** Microsoft Defender for Identity, Okta Identity Threat Protection, and CrowdStrike ITDR are marketed as enterprise identity-threat-detection products that detect anomalous admin actions; no published data gives the deployment rate at US research universities [no source found; searched for: "Defender for Identity deployment higher education", "Okta ITP research university adoption rate"]. At institutions with such products, the branch's foundational step (create an alias + directory entry for a non-HR-matched identity) generates at least one automated alert.

**HR-driven IAM lifecycle.** SailPoint IdentityNow and Okta Lifecycle Management support HR-authoritative lifecycle integration with Workday and similar HCM systems; orphaned-identity reconciliation is commonly run weekly or monthly in higher-education deployments [no source found; searched for: "SailPoint higher education orphaned identity cadence", "Okta lifecycle management HR reconciliation frequency higher ed"]. Manufactured personas without HR records surface on orphaned-identity reports on whatever cadence the institution runs them, bounding the branch's persistence at institutions with mature IAM.

---

## Matrix A (all orders)

### Measure 1: Identity verification — IAL1

**Binding?** No. The attacker presents their own real government-issued identity. Attribute validation succeeds against credit-bureau and carrier data; OTP is delivered to the attacker's real phone. There is nothing to bypass.

**False-negative rate.** ~2--5% of legitimate customers fail IAL1 on first attempt, primarily due to image-capture quality; <1% after retry [no source found; searched for: "IAL1 document verification false negative rate 2024", "IDV vendor first-attempt pass rate legitimate customer"]. Irrelevant to this branch.

**Bypass methods.** None needed. The attacker is themselves.

- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Instant.
- **Attacker trace:** Real name, DOB, address, government-ID image at the IDV vendor; retained commonly 1--7 years [no source found; searched for: "Onfido data retention period IDV record", "Jumio retention period biometric data"]. Fully attributable.

---

### Measure 2: Institutional affiliation check

**Binding?** Partially binding -- satisfied natively by the branch's capability. The attacker is the person institutions rely on to produce the very signals the affiliation check looks for. Four sub-paths with very different operational profiles exist, depending on institutional IAM maturity.

**False-negative rate.** ~5--15% of legitimate customers fail initial email-based affiliation checks due to typos, wrong-domain submissions, inactive institutional email, or federated-login issues [no source found; searched for: "IDT institutional affiliation rejection rate", "B2B KYC affiliation dropout rate"]. No synthesis-specific data exists.

**Bypass methods.**

**Sub-path A -- Loose-governance direct injection:**
- **What the attacker does:** Creates a mail alias, directory entry, and DL membership for the manufactured persona using the standard admin console. The resulting email address and directory record pass any affiliation check that queries the institution's public directory or accepts mail delivery.
- **Expertise:** Practitioner -- practitioner-level familiarity with institutional IAM tooling, which is the attacker's day job.
- **Cost:** $0.
- **Lead-up time:** Minutes. Downstream risk: surviving the first orphaned-identity reconciliation cycle (typically weekly or monthly at institutions running SailPoint or Okta lifecycle management).
- **Attacker trace:** IAM audit logs under sysadmin account; retention typically 1--7 years; reviewed only under investigation or by ITDR automation.
- **Key uncertainty:** Whether the institution runs orphaned-identity reconciliation and on what cadence. At institutions with HR-authoritative IdM, this sub-path is detected within weeks.

**Sub-path B -- Visiting-scholar / affiliate-program pathway:**
- **What the attacker does:** Initiates a visiting-scholar appointment for the manufactured persona through the institution's own administrative process, with a real PI as sponsor. The resulting identity has an HR-matched record and survives orphaned-identity reconciliation.
- **Expertise:** Practitioner -- navigating a multi-office administrative flow (sponsoring department, international-scholar office if J-1, HR onboarding).
- **Cost:** $0 out-of-pocket. Opportunity cost of cover-story construction and PI engagement.
- **Lead-up time:** 2--8 weeks, including sponsoring-department approval and (for J-1 visa holders) DS-2019 processing [no source found; searched for: "visiting scholar onboarding timeline US university 2024", "J-1 scholar processing time weeks"].
- **Attacker trace:** Visiting-scholar database entry with sponsoring-PI signature; research-office records; institutional email with a visitor-account flag.
- **Cross-measure dependency:** Consumes the rubber-stamping PI resource -- the same PI who must rubber-stamp at M3, M5, and M8.

**Sub-path C -- Reuse of departed real member's directory entry:**
- **What the attacker does:** Identifies a departed lab member whose directory entry was not purged, reactivates the entry, and maps it to the manufactured persona's alias.
- **Expertise:** Practitioner -- same IAM skill as sub-path A, plus identifying a suitable departed member.
- **Cost:** $0.
- **Lead-up time:** Hours to days.
- **Attacker trace:** IAM audit log records the reactivation under the sysadmin account. The departed real person is a bystander whose name is now on the provider account; if they are findable via LinkedIn or professional networks, retrospective investigators can contact them.

**Sub-path D -- HR-system injection:**
- **What the attacker does:** Injects a record directly into the HR system (Workday, Banner, PeopleSoft), giving the manufactured persona a fully HR-matched identity.
- **Expertise:** Expert -- requires admin rights extending into HR systems typically outside standard IT admin scope.
- **Cost:** $0.
- **Lead-up time:** Hours, subject to HR's own audit and review.
- **Attacker trace:** HR-system audit logs under HR's retention policy -- deeper institutional footprint than the IAM-only sub-paths.

---

### Measure 3: Organization registry + verified shipping address

**Binding?** Partially binding. The host lab is real and has an existing provider relationship; friction is in the add-contact workflow and last-mile product interception.

**False-negative rate.** ~5--15% of legitimate customers at institutions with non-standard naming or multiple billing entities [no source found; searched for: "IDT organizational account rejection rate", "synthesis provider verified shipping address rejection rate"].

**Bypass methods.**

**Sub-path A -- Add to existing org record (cheapest):**
- **What the attacker does:** Has the rubber-stamping PI submit an add-contact request to add the manufactured persona to the host lab's existing provider account. Alternatively, uses a self-service or notification-only workflow if the provider permits it.
- **Expertise:** Practitioner (default) to Expert (account-takeover variant).
- **Cost:** $0 (rubber-stamping-PI path). Accomplice cost ($1,000--$10,000) if two-contact IAL2 independence is enforced [no source found; searched for: "insider threat market price coconspirator 2024"].
- **Lead-up time:** 3--10 business days for provider onboarding [no source found; searched for: "IDT institutional account setup time days", "Twist Bioscience account verification turnaround"].
- **Attacker trace:** Provider-side addition event with submitting-contact credentials (PI's or attacker's).
- **Cross-measure dependency:** Requires the rubber-stamping PI from M2 sub-path B.

**Sub-path B -- New organization record:**
- **What the attacker does:** Registers a new org record using the manufactured persona and one additional contact (accomplice or second manufactured persona).
- **Expertise:** Practitioner.
- **Cost:** $0 to $1,000--$10,000 (if accomplice required for two-contact gate).
- **Lead-up time:** 1--4 weeks.

**Sub-path C -- Sibling org record at the same institution:**
- **What the attacker does:** Registers a separate org record for a different department or center at the same institution, using the manufactured persona.
- **Expertise:** Practitioner.
- **Cost:** $0.
- **Lead-up time:** Days.

**Shipping sub-paths:**
- **Ship to host lab building + intercept:** Physical mailroom interception (Practitioner, $0, requires physical access), delivery-notification interception (Practitioner, $0, requires notifications to route to persona's alias), or carrier rerouting via UPS My Choice / FedEx Delivery Manager (Novice, $0--$20/year + per-package fees [no source found; searched for: "UPS My Choice reroute cost 2025", "FedEx Delivery Manager alternate address fee"]).
- **Ship to second institutional address:** Practitioner, $0, requires legitimate pickup access at a second institutional location.
- **Attacker trace:** Delivery records name the host lab or second address; carrier-reroute events are logged by the carrier and cannot be suppressed by the attacker.

---

### Measure 4: Research & entity signals

**Binding?** Partially binding, and the branch's strongest row. The host lab's real publication trail, grant footprint, and web presence do most of the work automatically.

**False-negative rate.** ~30--60% of legitimate customers outside well-documented academic populations have thin public research footprints [no source found; searched for: "publication history check false negative rate early career", "NIH RePORTER coverage scope"]. Widely flagged as a high-FNR measure.

**Bypass methods.**

**Lean on host-lab footprint (baseline):**
- **What the attacker does:** Points reviewers at the host lab's real, indexed publications and grants. No fabrication needed.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Instant.
- **Attacker trace:** Persona name on file alongside the host lab's real research footprint.

**Stub institutional web page:**
- **What the attacker does:** Creates a personnel page for the manufactured persona on the institutional web server, using admin access.
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** A stub page on the real institutional domain; attacker's admin account created it in the CMS logs.

**ORCID + Google Scholar profile:**
- **What the attacker does:** Creates an ORCID and Google Scholar profile for the manufactured persona with host-lab affiliation. Google Scholar allows any user with a Google account to create a profile; affiliation strings are self-declared and not independently verified [no source found; searched for: "Google Scholar profile affiliation verification process"].
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** Thin ORCID and Scholar artifacts tying the persona name to the host lab.

**Preprint pre-seeding on bioRxiv / OSF:**
- **What the attacker does:** Submits a preprint under the manufactured persona with host-lab affiliation. bioRxiv collects affiliation information but does not independently verify it against institutional records [no source found; searched for: "bioRxiv affiliation verification submission process"].
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** 1--4 weeks (bioRxiv screening delay).
- **Attacker trace:** Durable preprint artifact with persona name and host-lab affiliation.

---

### Measure 5: Payment integrity

**Binding?** No. The host lab's existing institutional payment method is inherited.

**False-negative rate.** Near-zero -- payment consistency checks rarely block legitimate customers.

**Bypass methods.**

**Inherited institutional payment (cheapest):**
- **What the attacker does:** Orders on the host lab's existing org record, which has an institutional payment method (PO, institutional card, or cost-center billing) already on file.
- **Expertise:** Aspirant.
- **Cost:** $0 out-of-pocket.
- **Lead-up time:** Instant.
- **Attacker trace:** No personal financial artifact; charge appears on the host lab's monthly cost-center statement.
- **Key uncertainty:** AP detection channel -- PIs who review cost-center reports will see an unauthorized provider charge. The cheapest path depends on targeting a PI who does not review these reports -- the same rubber-stamping-PI dependency as M2/M3/M8.

**Miscategorize via P-card admin:**
- **What the attacker does:** Uses P-card administration role (if available) to route the charge to a different cost center or categorize it under a routine supply line.
- **Expertise:** Practitioner.
- **Cost:** $0.
- **Lead-up time:** Minutes.

**Personal-card fallback:**
- **What the attacker does:** Pays with their own card under a "pre-reimbursement" framing.
- **Expertise:** Aspirant.
- **Cost:** Personal financial exposure at the face value of the order.
- **Attacker trace:** Attacker's personal card on file at the provider.

---

## Matrix B (SOC orders add these)

### Measure 6: Identity verification — IAL2

**Binding?** No. The attacker is a real person presenting their own face.

**False-negative rate.** ~5--20% of legitimate customers fall to manual review or retry on first IAL2 attempt; <3% ultimately blocked [no source found; searched for: "Onfido first attempt completion rate IAL2", "Jumio IAL2 pass rate legitimate customer 2024"]. Attacker is unaffected.

**Bypass methods.** None needed for the cheapest path.

- **What the attacker does:** Presents own face and real ID to the selfie + liveness vendor flow.
- **Expertise:** Aspirant.
- **Cost:** $0 at bypass; the structural cost is biometric commitment -- the attacker's real face is now on file.
- **Lead-up time:** Instant.
- **Attacker trace:** Real face, real ID, real liveness record at the IDV vendor; retained commonly 1--7 years. Subpoena-accessible.

**Persistence bound:** Each persona rotation re-commits the attacker's face. IDV vendors operate face-clustering for internal fraud detection [no source found; searched for: "Onfido cross-customer face similarity fraud detection", "Jumio repeat face detection IDV fraud analytics"]. Sustained persona rotation accumulates detection risk monotonically. Indefinite persistence requires rotating accomplices at IAL2, operating at a low rotation cadence, or accepting accumulating face-clustering risk.

---

### Measure 7: MFA + re-authentication

**Binding?** No. The attacker enrolls their own device.

**False-negative rate.** Near-zero for legitimate customers who control their enrolled factor. ~15--25% enrollment friction during initial onboarding [no source found; searched for: "MFA enrollment abandonment rate customer identity"].

**Bypass methods.** None needed.

- **What the attacker does:** Enrolls own TOTP or push-notification device.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** MFA device fingerprint at the provider; device/IP metadata may link to the attacker's institutional workstation or network.

---

### Measure 8: Vouching by registered contact -- pressure point

**Binding?** Yes. This is the single load-bearing control for the branch. The gap between weak-baseline vouching (attacker's own attestation, $0) and strong-baseline vouching with an attentive PI (accomplice recruitment, $1,000--$10,000, witting witness) is the entire Matrix B cost delta.

**False-negative rate.** ~10--25% of legitimate customers under a strong-baseline two-registered-contact workflow with fresh-MFA requirement [no source found; searched for: "synthesis provider vouching rejection rate", "CSSWG vouching false negative rate"]. Not yet a widely deployed design.

**Bypass methods.**

**Ask the rubber-stamping PI directly (cheapest against strong baseline):**
- **What the attacker does:** Asks the target PI to register as a vouching contact at the provider, under a cover story ("I'm the new tech, the provider needs you as a registered second contact"). The PI must complete the provider's vouching-contact onboarding flow, including IAL2 biometric verification with their own face and government ID, plus MFA enrollment on their own device.
- **Expertise:** Aspirant -- social skill is the only skill required.
- **Cost:** $0 out-of-pocket.
- **Lead-up time:** 1--4 weeks, dominated by the time for the PI to complete the provider's vouching-contact onboarding, not by the attacker's actions.
- **Attacker trace:** PI's real IAL2 record at the provider (newly created or pre-existing). PI is a bystander whose name is on the vouching action.
- **Key uncertainty (upgraded from stage 5):** The PI must be willing to complete a non-trivial provider onboarding flow -- IAL2 biometric verification plus MFA enrollment -- under the attacker's cover story. A truly disengaged PI may refuse on grounds of "too much work for something I don't understand." The rubber-stamping failure mode applies most cleanly to routine approval actions the PI already does (signing requisitions, approving cost-center charges); it applies less cleanly to new onboarding actions the PI has never done before. This is the single largest operational uncertainty in the cheapest Matrix B path.
- **Cross-measure dependencies:** This method consumes the same rubber-stamping-PI resource as M2 (visiting-scholar sponsorship), M3 (contact-addition submission), and M5 (cost-center non-review). If the PI fails at any one touchpoint, the entire cheapest path degrades.

**Accomplice at a different lab (fallback):**
- **What the attacker does:** Recruits a witting coconspirator -- a real lab manager or researcher at a different lab -- who registers as a vouching contact and approves SOC orders.
- **Expertise:** Practitioner.
- **Cost:** $1,000--$10,000+ [no source found; searched for: "insider threat market price coconspirator 2024", "dark web insider recruitment pricing financial fraud"].
- **Lead-up time:** 2--6 weeks.
- **Attacker trace:** Accomplice's full real identity, biometrics, and MFA record at the provider. Accomplice is a durable witness with direct knowledge -- the single biggest operational risk of this fallback.

**Same-domain two-persona self-vouching:**
- **What the attacker does:** Manufactures a second persona in the institution's IAM and presents both as independently legitimate contacts.
- **Expertise:** Practitioner.
- **Cost:** $0 if the provider does not require independent IAL2 per contact; $1,000--$10,000 if it does (accomplice needed for second IAL2).
- **Lead-up time:** 1--4 weeks.
- **Attacker trace:** Two personas in institutional IAM, two IAL2 records at the provider, correlated metadata detectable by provider-side fraud analytics.

**Manufactured "PI-office" delegated alias:**
- **What the attacker does:** Creates a PI-office-style alias (e.g., `pi.jones.lab@institution.edu`) that routes to the attacker, and uses it as the "PI's" vouching identity.
- **Expertise:** Practitioner.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** IAM audit logs show the alias creation under the attacker's admin account.
- **Key caveat:** Defeated by any provider that requires the vouching contact to complete independent IAL2 (the attacker would need to present a different face).

**Provider hops to weaker implementations:**
- **What the attacker does:** Selects a provider with a weaker vouching workflow (order-specific attestation rather than registered-contact verification).
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Hours (provider selection).
- **Attacker trace:** Attacker's own attestation in the weaker provider's records.

---

### Measure 9: Biosafety documentation

**Binding?** Yes. An independent documentation gate that contributes friction separate from the vouching control.

**False-negative rate.** ~30--50% of legitimate customers at non-NIH-funded or international institutions [no source found; searched for: "NIH IBC registration scope non-NIH funded", "IBC public registry private entity"]. Widely flagged as a high-FNR measure.

**Bypass methods.**

**Lift and modify another lab's real IBC letter from institutional document repository (cheapest):**
- **What the attacker does:** Accesses a real IBC approval letter from the institution's document repository (BioRAFT, SciShield, departmental share), copies it, and modifies the protocol number to reference a real host-lab protocol. The result is a plausible letter on real institutional letterhead with a real BSO name.
- **Expertise:** Novice -- PDF editing.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** Modified document with real BSO name on institutional letterhead -- the highest-attribution forgery artifact in the branch. A single verification call with roster-level specificity ("Is [persona name] listed on protocol [number]?") burns the operation.
- **Key uncertainty:** Whether the attacker's IT admin role extends to read access on EH&S / biosafety document repositories, which are typically administered by EH&S staff with role-based permissions scoped to biosafety-office users [no source found; searched for: "BioRAFT SciShield admin role EH&S vs IT"].
- **Precondition (from stage 5a):** The protocol-number modification must reference a real host-lab protocol number, which the attacker must learn from the repository. If the repository does not expose protocol numbers, the attacker must fabricate a plausible number format, reducing the letter's survivability under verification.

**Fabricate IBC letter from scratch:**
- **What the attacker does:** Produces a forged IBC letter using institutional letterhead templates (accessible via admin role) and a plausible committee composition.
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** Forged document in provider records; less survivable than the lift-and-modify variant because the committee composition and protocol details are fabricated rather than copied from a real letter.

**Self-declaration of real IBC coverage:**
- **What the attacker does:** Attests that the host lab's IBC coverage extends to the manufactured persona's work, exploiting providers that accept self-declaration.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** Self-attestation in provider records.
- **Key caveat:** Only works where the provider accepts self-attestation.

**Institutional IBC-system injection (deepest, rarest):**
- **What the attacker does:** Injects a protocol-roster entry directly into the institution's IBC tracking system (BioRAFT, SciShield).
- **Expertise:** Expert -- requires elevated access across two admin domains (IT + EH&S).
- **Cost:** $0.
- **Lead-up time:** Hours (if access available).
- **Attacker trace:** IBC protocol-roster entry; EH&S system audit logs.

**Exploit providers that do not require documentation:**
- **What the attacker does:** Selects a provider with no biosafety documentation requirement.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Hours (provider selection).

---

## End-to-end synthesis

**Matrix A total (cheapest path with rubber-stamping PI):** $0 out-of-pocket, 2--8 weeks, 1 attacker + 1 unwitting PI. Central load-bearing assumption: a single real PI who rubber-stamps visiting-scholar sponsorship (M2), contact-addition notification (M3), cost-center non-review (M5), and -- if Matrix B -- vouching registration and approval (M8). If the PI is attentive at any one touchpoint, the cheapest path breaks.

**Matrix B total (cheapest path, rubber-stamping PI cooperates including own IAL2 onboarding):** $0 out-of-pocket + attacker's biometric commitment, 3--10 weeks, 1 attacker + 1 unwitting PI. Key uncertainty: the PI must complete the provider's vouching-contact onboarding flow (IAL2 + MFA), which is higher friction than routine form-signing.

**Matrix B total (fallback when PI refuses vouching-contact onboarding):** $1,000--$10,000+, 5--14 weeks, 1 attacker + 1 witting accomplice. The accomplice is a durable witness -- the single biggest operational risk of the fallback.

**Matrix B total (weak-baseline vouching workflow):** $0 out-of-pocket + biometric commitment, 2--8 weeks, 1 attacker + 1 unwitting PI. Under order-specific attestation vouching, the branch is a pure lone-attacker operation at $0 throughout.

**Where the KYC stack contributes:** Measures 1, 4, 5, 7 contribute near-zero friction. Measure 2 contributes zero friction under loose governance and substantial friction (2--8 weeks) under HR-authoritative IdM. Measure 3 contributes friction only if the add-contact workflow requires something beyond a rubber-stamping PI. Measure 8 is the single load-bearing control -- the strong-vs-weak implementation gap is the entire Matrix B cost delta. Measure 9 contributes an independent documentation gate; lift-and-modify of a real letter is the cheapest bypass and undetectable without a BSO verification call at roster-level specificity. Measure 6 contributes zero bypass friction but maximum post-hoc attribution and bounds sustained persona rotation through face clustering.
