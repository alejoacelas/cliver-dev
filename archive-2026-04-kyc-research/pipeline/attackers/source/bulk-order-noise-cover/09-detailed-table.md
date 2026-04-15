# Bulk-order noise cover (core facility / cross-PI admin) — Detailed table

Branch E of the exploit-affiliation profile. A core facility technician or departmental administrator at a real US R1 university exploits the institutional ordering infrastructure they already legitimately operate. Two variants: a core facility technician batching target sequences into routine multi-PI orders (volume noise cover), or a cross-PI admin distributing target sequences across 10-40 PIs' budget codes (distribution noise cover). A sub-variant matters: shared facility provider accounts (where the IAL2 biometric on file may belong to a predecessor) substantially lower individual attribution. Marginal financial cost: $0. Lead time: days to weeks. The attack is designed to be indefinitely repeatable.

---

## Matrix A (all orders)

### Measure 1: Identity verification -- IAL1

**Binding?** No. The attacker is a real person with a long-standing provider account. Under the per-user variant, IAL1 was passed against the attacker's genuine PII at hire. Under the shared-account sub-variant, IAL1 was passed by a predecessor who opened the facility account, possibly years ago, and has not been re-run.

**False-negative rate.** ~2-5% of legitimate customers fail IAL1 on first attempt, primarily due to document capture quality issues; effective blocking after retry is <1% ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)). Irrelevant to this branch because the attacker's PII is genuine.

**Bypass methods.** None needed. The attacker's (or predecessor's) identity was validated when the account was created.

- **Attacker trace:** Per-user: attacker's real name, DOB, address, phone, and (if document-centric) scanned ID image retained by IDV vendor for 5-7 years. Cross-correlated with institutional HR records, ORCID, and long order history. Shared-account: the predecessor's PII is on file; the attacker is invisible at this measure entirely.

---

### Measure 2: Institutional affiliation check

**Binding?** No. The attacker's work email is a real institutional mailbox on a real university domain. If the provider federates to eduGAIN/InCommon, the attacker authenticates through the institution's SSO -- still a native pass. No synthesis provider was found to currently use eduGAIN/InCommon as a primary affiliation gate ([eduGAIN](https://edugain.org/); [eduGAIN SP guide](https://wiki.geant.org/display/eduGAIN/How+to+Join+eduGAIN+as+Service+Provider)).

**False-negative rate.** ~0% for established R1 institutional accounts. No published industry false-negative rate exists for synthesis-provider institutional affiliation checks; by analogy to bank/IRS institutional verification, workflow fail rates run 3-10% on first submission for new entities, but for email-domain recognition on a major university domain, FNR is essentially zero.

**Bypass methods.** None needed.

- **Attacker trace:** Per-user: work email tied to the attacker. Shared-account / role-mailbox (e.g., `genomics-core@university.edu`): accessed by 3-5 staff with delegated permissions; individual attribution depends on institutional IT session logs.

---

### Measure 3: Organization registry + verified shipping address

**Binding?** No. The facility or department has a long-standing provider organization record with multiple registered contacts and approved shipping destinations.

**False-negative rate.** ~0% for established R1 accounts. No public data exists on synthesis-provider organization-registry rejection rates; by analogy to commercial address-validation tooling, institutional accounts on standard addresses have essentially zero rejection.

**Bypass methods.** None needed for the primary path. Three shipping-destination options exist, all using pre-approved addresses:

**Option A -- Core facility stockroom (primary):**
- Standing approved destination. The attacker receives the batch at the shared stockroom.
- At facilities with mature LIMS (e.g., LabKey LIMS supports barcode-based receiving with chain-of-custody audit logs; [LabKey](https://www.labkey.com/products-services/lims-software/lims-inventory-management/)), the tube must be diverted before barcode scan-in. At facilities with looser paper-based receiving, diversion is trivial. LIMS maturity varies (best guess: roughly half of R1 cores have mature LIMS-tracked receiving).
- **Attacker trace:** Attacker's name on registered-contact list (per-user) or one of 3-5 names (shared). Shipping records log destination; institutional LIMS logs may record who received the shipment.

**Option B -- Collaborating-institution shipping:**
- Cores serving multi-institutional consortia have approved addresses at partner institutions. The attacker routes the target tube to a collaborating address where they have informal access. This eliminates the stockroom-diversion step.
- **Attacker trace:** Shipping record shows source facility sending to a routine partner -- innocuous on its face. Onward retrieval requires travel or a contact at the partner site.

**Option C -- Departmental mailroom (cross-PI admin):**
- Standing approved destination under the admin's operational control. No diversion needed.
- **Attacker trace:** Admin's name on institutional mailroom receiving records.

---

### Measure 4: Research & entity signals

**Binding?** No at the entity level. The provider's reviewer sees a facility at an R1 university with multiple active NIH grants -- entity-level review stops there. Per-account composition analytics or per-order sequence-intent review with PI research-scope cross-checking would bind but are not in the baseline.

**False-negative rate.** No published industry false-negative rate exists for customer legitimacy review (entity level) as distinct from sequence screening. The 5% flagging rate from IGSC screening protocols applies to sequence-level screening, not customer-level review ([EBRC 2022 screening paper](https://ebrc.org/wp-content/uploads/2022/04/EBRC-2022-Security-Screening-in-Synthetic-DNA-Synthesis.pdf); [PMC screening analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319849/)). Entity-level rejection rate for established R1 cores is effectively zero.

**Bypass methods.** Five methods, all targeting enhancements beyond baseline:

**Method A -- Bulk-order noise cover (core facility):**
- Target sequence bundles into a routine multi-PI batch of 200-800 tubes. The target must fit the facility's normal product mix by length, modification pattern, and plausible function class (the sequence-selection constraint). Defeats per-account/per-PI volume anomaly detection but not per-account composition analytics.
- **Expertise:** Aspirant -- routine job function.
- **Cost:** $0. Reagent cost charged to PI grant.
- **Lead-up time:** 0-14 days (next routine batch).
- **Attacker trace:** Target tube's order record in provider's per-customer history. Indistinguishable from legitimate orders at the individual-record level.
- **Key caveat:** Composition analytics (detecting unusual sequence types) would bind; volume analytics would not.

**Method B -- Cross-PI distribution (admin):**
- Spread orders across the PI pool so no single PI shows anomalous volume. Usable pool is narrowed by two constraints: only PIs whose IBC scope covers the target sequence class (measure 9) and only PIs who rubber-stamp (measure 8). Plausibly 2-5 PIs in a 40-PI department.
- **Expertise:** Novice -- requires managing which PI's budget code is used for which target.
- **Cost:** $0.
- **Lead-up time:** 1-12 weeks (self-imposed pacing).
- **Attacker trace:** Distributed across 2-5 PI billing records. A department-wide audit would need to connect anomalies across PIs.
- **Cross-measure dependency:** Pool size depends on measure 8 (rubber-stamping) and measure 9 (IBC scope).

**Method C -- Temporal noise escalation:**
- Gradually grow the facility's baseline order volume over months so adaptive rolling-window thresholds rise alongside real activity. The target tube is then absorbed by the elevated baseline.
- **Expertise:** Practitioner -- requires multi-month patience and understanding of anomaly-detection logic.
- **Cost:** $0.
- **Lead-up time:** 2-6 months of patient volume growth.

**Method D -- Multi-provider rotation:**
- Rotate target tubes across 4-5 synthesis providers (Twist, IDT, GenScript, Eurofins). No single vendor accumulates the full pattern. Twist supports institutional eProcurement punchout catalogs at no setup cost ([Twist Bioscience](https://www.twistbioscience.com/procurement-integrations)).
- **Expertise:** Novice -- administrative effort to maintain accounts at multiple vendors.
- **Cost:** $0.
- **Lead-up time:** Days to weeks for account setup.
- **Attacker trace:** Trace distributed across 4-5 separate vendor customer histories.

**Method E -- Hybrid noise cover:**
- Available only at facilities where the technician has discretionary cross-PI billing authority at ordering time. Combines volume and distribution cover.
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** Same as primary variant.
- **Key caveat:** Narrower applicability than the pure variants; depends on facility billing structure.

---

### Measure 5: Payment integrity

**Binding?** No. Payment is through the institutional PO system against a PI grant budget code. Every field is genuinely consistent with the organization record.

**False-negative rate.** ~0% for institutional POs at major US universities. No public data exists on synthesis-provider payment rejection rates for institutional accounts.

**Bypass methods.** None needed.

- **Attacker trace:** PI grant budget code, institutional AP record showing the requisition, provider-side payment record showing institutional PO. Under the shared-account variant, the institutional ordering staff is logged as a role account.
- **Key caveat (cross-PI admin):** University policies distinguish between "Signature Authority" (the legal power to bind the university) and budget authority ([Western Michigan University](https://wmich.edu/policies/signature-authority-grants-contracts)). Under audit, the institutional record shows the PI as authorizer-of-record while the provider portal may show the admin as approver -- a correlation point that does not fire in real time.

---

## Matrix A synthesis

**Cheapest end-to-end path:** $0 marginal financial cost. 0-14 day lead time (core facility, next batch) or 1-12 week effective lead time (cross-PI admin, self-imposed pacing). All five Matrix A measures pass natively using standing infrastructure: real institutional email, long-standing provider account, approved shipping destination, real PI grant budget code, and routine batch submission.

**Which measures do the most work:** None at baseline. Per-account composition anomaly detection or per-order sequence-intent review at measure 4 would bind. Volume-based enhancements are specifically defeated by noise cover.

**Trace profile:** Per-user: attacker's real name, work email, and long order history on file across multiple PI billing records. Shared-account: facility account resolves to 3-5 staff or a role mailbox; individual attribution depends on institutional-side records (session logs, badge access, LIMS entries) the provider cannot see.

---

## Matrix B (SOC orders -- adds on top of Matrix A)

### Measure 6: Identity verification -- IAL2

**Binding?** No. The attacker presents their own real ID and face (per-user) or operates under the predecessor's IAL2 record that has not been re-run (shared-account). No public source documents how synthesis providers handle IAL2 records on staff turnover for shared institutional accounts.

**False-negative rate.** 1.9-5.5% for legitimate customers at first attempt across financial services contexts ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)). ~0% for this attacker because they hold genuine ID and present their genuine face.

**Bypass methods.** None needed.

- **Attacker trace:** Per-user: attacker's face and government-ID image stored by IDV vendor -- the most durable single piece of attribution in the attack. Shared-account: the predecessor's face on file; the current attacker is biometrically unattributed at the provider side.

---

### Measure 7: MFA + re-authentication

**Binding?** No. Per-user: attacker taps own device. Shared-account: shared TOTP secret or hardware token in the facility director's office.

**False-negative rate.** <1% per challenge for legitimate users in normal use. Failure modes are device replacement, time drift, or lost recovery seeds -- irrelevant here.

**Bypass methods.** None needed.

- **Attacker trace:** Per-user: attacker's phone or device fingerprint. Shared-account: shared device fingerprint (e.g., a hardware token or facility-computer browser profile) that has no individual owner.

---

### Measure 8: Vouching by registered contact

**Binding?** Yes on paper; **passes via routinization** under the proposed baseline. The load-bearing failure mode for this branch.

Per the project baseline assumptions, vouching is a proposed workflow rather than an observed industry standard. The proposed baseline assumes the voucher sees "at least a coarse description of what they are approving." Whether the portal surfaces per-sequence flags (which would materially raise the rubber-stamp's legal/professional risk) is unknown -- no synthesis provider's vouching portal UI has been publicly documented.

**False-negative rate.** No public data on vouching false-negative rates. University grant fraud cases illustrate that approval workflows can fail for years when approvers are overloaded ([Berger Montague](https://bergermontague.com/universities-and-research-institutions-commit-grant-fraud/)). Refined estimate: 98-100% rubber-stamp pass rate for routine multi-PI batches, producing ~0% legitimate-customer rejection and near-zero attack detection unless per-sequence flags are surfaced.

**Bypass methods.** Six methods:

**Method A -- Batch-level routinized approval (core facility):**
- The facility director receives a batch notification, clicks through MFA, approves the batch as an operational unit. The target sequence is one tube in 500. Director failure modes include delegation to a subordinate, absence during batch cycles, and dollar-outlier detection if the target tube is visibly more expensive.
- **Expertise:** Aspirant -- the director clicks approve as a routine step; the attacker does nothing special.
- **Cost:** $0.
- **Lead-up time:** 0 days marginal.
- **Attacker trace:** Director on record as approver. Under audit, the director can truthfully say they approved at the batch level rather than the tube level.
- **Key caveat:** Depends on the portal UI assumption (coarse summary vs. per-sequence flags).

**Method B -- Self-vouching by admin (cross-PI admin):**
- Admin is both submitter and registered approver on the departmental account. Whether the provider workflow forbids same-contact as both submitter and approver is unknown under baseline.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** 0 days.
- **Attacker trace:** Admin on record as both submitter and approver -- a pattern that provider-side audit comparing the two fields would catch. Real-time flagging not in baseline.

**Method C -- PI rubber-stamp (cross-PI admin alternate):**
- Route through PIs who both rubber-stamp and whose IBC scope covers the target sequence. The usable pool is plausibly 2-5 PIs in a 40-PI department (not all 40). Per-PI volume anomaly detection is still defeated (1-2 extra tubes across 2-5 PIs per quarter is noise).
- **Expertise:** Practitioner -- requires multi-year institutional knowledge to identify reliable rubber-stampers.
- **Cost:** $0 financial; time cost is the multi-year tenure to read PI behavior patterns.
- **Lead-up time:** 0 days marginal once institutional knowledge is acquired; multi-year acquisition phase.
- **Attacker trace:** PI on record as approver.
- **Cross-measure dependency:** Pool size depends on measure 9 (IBC scope).

**Method D -- Credential compromise of director:**
- Compromise the director's provider-portal credentials (shared password manager, post-it note, keylogger, social engineering) and approve orders directly. Eliminates director-attention dependency. The 2025 Verizon DBIR reports 88% of Basic Web Application Attacks involved stolen credentials ([Verizon DBIR](https://www.verizon.com/business/resources/reports/dbir/); [Descope analysis](https://www.descope.com/blog/post/dbir-2025)).
- **Expertise:** Practitioner to Expert depending on the target's security posture (EDR, SSO, credential rotation policy).
- **Cost:** $0 if credentials are informally accessible; $200-$2,000 if phishing kit or keylogger required.
- **Lead-up time:** Days to weeks.
- **Attacker trace:** Director's account logged as approver; institutional IT logs may show anomalous login patterns.

**Method E -- Insider-insider collusion:**
- Director and technician (or admin) are co-conspirators; director knowingly approves. General insider-threat literature notes 71% of organizations report vulnerability to insider threats ([Syteca, 2025](https://www.syteca.com/en/blog/insider-threat-statistics-facts-and-figures)); no public data quantifies collusion rates in academic settings. Small core facility teams (2-3 people) are structurally susceptible.
- **Expertise:** Aspirant for the operation; difficulty is in recruiting the co-conspirator.
- **Cost:** $0 if dyad already shares motivations; $5,000-$50,000+ for recruited co-conspirator.
- **Lead-up time:** Months to years for recruitment; zero if dyad already exists.
- **Attacker trace:** Two conspirators on record, both genuinely affiliated. Maximum attribution if either flips.

**Method F -- Social engineering of provider support:**
- If portal approval is delayed or held for review, call provider support from the real institutional phone number using real institutional credibility to request expedited handling.
- **Expertise:** Practitioner -- social engineering skill leveraging institutional trust.
- **Cost:** $0 to low hundreds.
- **Lead-up time:** Hours per incident.
- **Attacker trace:** Phone call records, support ticket records at provider.

---

### Measure 9: Biosafety documentation

**Binding?** No. Institutional IBC coverage is standing. NIH IBC oversight is mandatory for NIH-funded institutions; institutions have expanded scope beyond the federal minimum at their discretion ([NIH OSP IBC FAQs](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/)). Commercial IBC services like Advarra offer review in "10 days or less" for entities needing coverage ([Advarra IBC Services](https://www.advarra.com/review-services/institutional-biosafety-committee/)).

**False-negative rate.** ~0% for established R1 cores or departments with standing IBCs.

**Bypass methods.** None needed for the primary path.

**IBC scope shopping (cross-PI admin):** Route target tubes through whichever PI's IBC scope most comfortably covers the target sequence class. At a 40-PI department, the institutional IBC scope spans the union of all PI research programs. The usable PI pool is the intersection of rubber-stampers (measure 8) and adequate IBC scope.

- **Attacker trace:** Real institutional IBC letter on file under the host PI's or facility's name. No forgery.
- **Cross-measure dependency:** IBC scope constrains the PI pool available at measures 4 and 8.

---

## Matrix B synthesis

**Cheapest end-to-end path:** Same as Matrix A plus native-pass IAL2 (own face or predecessor's), MFA tap on own device or shared token, measure 8 routinized approval (cheapest option), and real institutional IBC letter. Total marginal cost beyond Matrix A: $0 for routinization paths; up to $200-$2,000 for credential compromise; variable for insider collusion. Total marginal lead time: same 0-14 days (core facility) or 1-12 weeks (cross-PI admin).

**Which measures do the most work:** Measure 8 is the only Matrix B measure doing non-trivial work, and its effectiveness depends on the portal UI assumption and the director/PI/admin's attention patterns. Under the proposed baseline, measure 8 passes through routinization. Under a tighter portal surface that forces per-sequence attestation, measure 8 binds. Measures 6, 7, and 9 add only attribution (not cost).

**Trace profile:** Per-user: biometric (face + ID) and device fingerprint added on top of Matrix A institutional trace -- maximum attacker attribution at the provider side. Shared-account: predecessor's biometric and shared token's fingerprint added -- current attacker remains invisible at the provider side.

**Attribution delta Matrix A to B:** Substantial under per-user (biometric + device). Negligible under shared-account (additional Matrix B records do not resolve to the current attacker).

---

## Branch summary numbers

| Field | Per-user variant | Shared-account variant |
|---|---|---|
| Total marginal financial cost | $0 | $0 |
| Total marginal lead time | 0-14 days (core facility) / 1-12 weeks (cross-PI admin) | Same |
| Expertise required | Aspirant-Practitioner depending on measure 8 bypass | Same |
| Most durable attacker trace | Biometric at IAL2 | Predecessor's biometric -- current attacker invisible at provider side |
| Bounded by | Employment tenure, audit triggers, inventory-discrepancy detection (core facility) | Same plus role-mailbox / shared-account turnover |
| Defeated by | Per-account composition analytics, per-order sequence-intent review with PI scope cross-check, per-sequence voucher attestation | Same |
| Not defeated by | Per-account/per-PI volume anomaly detection, IAL2 timing, MFA strength, IBC documentation at institutional level | Same |
