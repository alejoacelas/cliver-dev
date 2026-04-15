# Insider recruitment — Detailed table

Branch B of the impersonate-employee profile. An external handler pays a legitimate insider at a research institution (grad student or junior tech in the one-off variant; postdoc, lab tech, or facilities manager in the persistent variant) $1,000–$5,000 per order to place SOC orders on the handler's behalf. The insider uses their own real identity, real institutional email, real payment method, and real shipping address — every KYC signal is authentic.

**Recruitment economics (cross-cutting).** The handler's dominant cost is not bypassing measures but finding and compensating the insider. Dark-web insider recruitment markets are large: Flashpoint counted 91,321 insider-recruitment posts across industries in 2025 ([Flashpoint](https://flashpoint.io/blog/insider-threats-2025-intelligence-2026-strategy/)), and the 2025 Coinbase case showed cybercriminals successfully bribing overseas support agents ([Hacker News](https://thehackernews.com/2025/05/coinbase-agents-bribed-data-of-1-users.html)). A grad-student stipend of $30K–$45K against ~$64K in graduate debt ([Education Data Initiative](https://educationdata.org/average-graduate-student-loan-debt); [Cornell](https://gradschool.cornell.edu/financial-support/stipend-rates/)) makes a $3,000–$5,000 payment genuinely motivating. Best-guess BOTEC: handler spends $3,000–$10,000 in recruitment (5–20 approaches, 20–80 hours) plus $1,000–$2,000 base insider payment per non-SOC order, rising to $2,000–$5,000 per SOC order due to the IAL2 deterrence premium.

---

## Matrix A (all orders)

### Measure 1: Identity verification — IAL1

**Binding?** No. The insider uses their own real, government-issued identity. Every IAL1 check passes authentically because there is no impersonation.

**False-negative rate.** ~2–5% of legitimate customers fail IAL1 on first attempt, dropping below 1% after retry. Primary drivers are document capture quality and international coverage gaps, not fraud ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets); [Shufti](https://shuftipro.com/blog/why-does-id-verification-fail-in-2025-causes-fixes-shufti/)). Irrelevant for this branch.

**Bypass methods.** None needed.

- **Attacker trace:** The insider's real name, DOB, government ID number, phone, and (for document-centric flows) an ID photograph are stored by the provider for 5–7 years. Accessible to compliance staff and, by subpoena, to investigators. The handler leaves zero trace.

---

### Measure 2: Institutional affiliation check

**Binding?** No. The insider uses their primary institutional email, which resolves to a genuine .edu domain listed on the provider's allowlist.

**False-negative rate.** ~5–15% friction for legitimate users at medical centers, affiliated institutes, or recently merged entities with incomplete domain cross-references (best-guess, based on observed complexity of university email ecosystems). Irrelevant to the insider.

**Bypass methods.** None needed.

- **Attacker trace:** Institutional email address (e.g., jstudent@stateu.edu) is logged and ties the order to a specific person at a specific institution. Institutional email servers may record confirmation and notification traffic. Handler invisible.

---

### Measure 3: Organization registry + verified shipping address

**Binding?** No. The insider is either already on their institution's registry or can be added via a routine administrative request. Orders flow through shared procurement portals like SciQuest/Jaggaer where multiple lab members transact under one institutional account ([Northwestern Procurement](https://www.northwestern.edu/procurement/source-purchase/approvals-workflow/); [U-Michigan Procurement](https://procurement.umich.edu/u-m-employees/purchasing/ordering/purchase-order/)).

**False-negative rate.** Minimal at institutions with existing provider relationships; ~5–10% friction for institutions setting up registry for the first time (days to weeks). Not relevant here.

**Bypass methods.** None needed.

- **Attacker trace:** Insider's name on the organization's authorized-orderer list; institutional shipping address on file; institutional procurement records log the individual orderer, PO number, and grant account (typically retained 7+ years for federal audit compliance). At portal-mediated institutions the provider may only see "University of X, Dept of Biology" rather than the individual. Handler invisible.

---

### Measure 4: Research & entity signals

**Binding?** No. The insider's institutional context (PI, lab, department) supplies the entity signals; strict personal-publication requirements would flag 30–50% of grad students and 60–80% of lab technicians as false negatives (best-guess based on measures-in-practice baseline), so providers in practice accept institutional context as a substitute.

**False-negative rate.** High (~30–80%) if applied as a hard gate on personal publications for early-career researchers. In practice the measure is softened to institutional context, driving effective FNR much lower. Insider passes either way.

**Bypass methods.** None needed.

- **Attacker trace:** Insider's lab affiliation, PI, and department are recorded or inferable. Persistent-variant insiders may have their own publications that further anchor identification. Handler invisible.

---

### Measure 5: Payment integrity

**Binding?** No. The order is charged to institutional funds via the insider's lab grant or departmental account — a real institutional payment flow. A typical SOC-relevant order runs $200–$2,000 (e.g., ~$525 for a 1,500 bp fragment at GenScript's ~$0.35/bp pricing; [GenScript](https://helpcenter.genscript.com/hc/en-us/articles/360031980552); [GenScript FLASH](https://www.genscript.com/economy-gene-synthesis.html)).

**False-negative rate.** Near-zero for institutional customers using established payment methods. Payment integrity is a consistency check, not a barrier.

**Bypass methods.** None needed.

- **Attacker trace:** The charge lands as a line item in the lab or department budget, tagged to a specific grant number for federally funded labs. PIs reviewing monthly reconciliations could in principle notice it. Standard university procurement policy requires PI sign-off above ~$500–$1,000 thresholds (best-guess from [Northwestern](https://www.northwestern.edu/procurement/source-purchase/approvals-workflow/), [Indiana](https://procurement.iu.edu/sop/sop-purch-02.html)). The handler-to-insider cash payment ($1,000–$5,000) is invisible to provider and institutional systems; crypto or Venmo transfers would be discoverable under forensic investigation.

---

### Matrix A synthesis

All five Matrix A measures pass authentically; bypass cost is $0. The handler's real expense is recruitment plus insider compensation.

- **One-off variant:** ~$4,000–$12,000 per successful order ($3,000–$10,000 recruitment + $1,000–$2,000 base insider payment).
- **Persistent variant:** ~$1,300–$4,000 per order amortized over 5–10 orders ($300–$2,000 amortized recruitment + $1,000–$2,000 base insider payment).

Lead-up time is dominated by recruitment (weeks to months); measures themselves add zero. Matrix A's contribution is not friction but attribution trail — the insider's identity is comprehensively committed, useful only for post-hoc investigation if the order is independently flagged.

The **Matrix A → Matrix B marginal increment** is the IAL2 deterrence premium ($1,000–$3,000 in additional insider compensation), not a new bypass cost stack.

---

## Matrix B (SOC orders — adds on top of Matrix A)

### Measure 6: Identity verification — IAL2

**Binding?** No in bypass terms — but operationally the most economically consequential measure. The insider presents their own face, own ID, and real liveness check, which all pass. IAL2's value here is deterrence: it raises the insider's perceived legal exposure because their biometrics are committed to a flagged-sequence order.

**False-negative rate.** ~2–6% of legitimate customers fail on first attempt; ~1–2% after retry. NIST-documented demographic disparities in facial recognition (higher error rates for women, darker skin tones, elderly, and those wearing head coverings) account for part of this ([SIA](https://www.securityindustry.org/report/what-nist-data-shows-about-facial-recognition-and-demographics/); [Biometric Update](https://www.biometricupdate.com/202508/fairness-in-facial-recognition-hinges-on-mix-of-factors-including-cultural-norms)). North American banking IDV failure rate is 1.9% overall, 5.5% at online-only retail banks ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)). Insider can retry.

**Bypass methods.** None needed, but the handler pays a **deterrence premium**:
- **What happens:** The insider authenticates with their own ID and face. No technical bypass.
- **Expertise:** Not applicable.
- **Cost:** $0 in bypass; the base insider payment rises from $1,000–$2,000 to $2,000–$5,000 per SOC order (1.5–3× multiplier; best-guess informed by the Coinbase case where even lower-risk data-access bribery generated $180–$400 million in remediation costs — [Coinbase](https://www.coinbase.com/blog/protecting-our-customers-standing-up-to-extortionists)).
- **Lead-up time:** Zero.
- **Attacker trace:** The strongest attribution artifact in the entire chain. Selfie image, ID photograph, extracted identity data, and liveness result are stored by the IDV vendor (30 days to 3 years, configurable; [Entrust/Onfido docs](https://documentation.onfido.com/getting-started/general-introduction/)) and by the provider (5–7 years). If the order is ever investigated, the insider's face is on file. The handler remains invisible.
- **Cross-measure dependency:** The IAL2 premium feeds forward into the total cost of every measure below — it is priced once and applied across the Matrix B order.

---

### Measure 7: MFA + re-authentication

**Binding?** No. The insider enrolls their own TOTP or push-notification device. US education sector MFA adoption is ~64% ([ElectroIQ](https://electroiq.com/stats/multifactor-authentication-statistics/)), so this is routine.

**False-negative rate.** Near-zero for smartphone users; 1–3% friction for users without smartphones or with device compatibility issues.

**Bypass methods.** None needed.

- **Attacker trace:** MFA enrollment metadata (device type, timestamp) and authentication events (timestamps, IPs) are logged. Records confirm the enrolled user is the person placing the order — which is true. Handler invisible.

---

### Measure 8: Vouching by registered contact

**Binding?** Partial — structurally present but not operationally binding. This is the only measure that forces another human into the loop, making it the most structurally significant control in the stack. But in practice vouching is defeated by social routine.

**False-negative rate.** ~5–15% of legitimate SOC orders experience delay when the registered voucher is unavailable (travel, sabbatical). Providers face operational pressure to create exception pathways, which the attacker can also exploit. Best-guess — vouching as specified is not yet a standardized industry practice.

**Bypass methods.**

**Option 1 — Ask the PI or lab manager to vouch (one-off):**
- **What happens:** Insider asks their PI to approve, framing it as thesis or lab work. Routine social interaction.
- **Expertise:** Aspirant (no skill beyond ordinary lab politeness).
- **Cost:** $0.
- **Lead-up time:** Minutes to hours.
- **Attacker trace:** PI's identity and approval timestamp logged; indistinguishable from a legitimate vouching event.

**Option 2 — Ask a senior labmate to vouch (one-off):**
- **What happens:** Insider gets approval from a senior colleague rather than the PI.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** Labmate's identity and approval logged.

**Option 3 — Social-engineer provider support to waive vouching (one-off):**
- **What happens:** Insider calls provider support with a plausible story ("my PI is traveling and we need this urgently").
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** Hours (support call turnaround).
- **Attacker trace:** Support-call transcript and override decision logged by provider.
- **Caveat:** Depends on provider having an exception pathway and support staff willing to use it.

**Option 4 — Exploit routinized rubber-stamp approval (persistent):**
- **What happens:** Insider submits SOC orders through the normal approval workflow; the voucher approves without substantive review because it is routine.
- **Expertise:** Aspirant (the bypass *is* the routine).
- **Cost:** $0.
- **Lead-up time:** Weeks to months of legitimate ordering first, to normalize the pattern.
- **Attacker trace:** Indistinguishable from legitimate vouching approvals; voucher identity logged.
- **Key uncertainty:** Rubber-stamp rate estimate rests on analogy to code review, where 30–60% of approvals receive zero substantive comments and 38% of PRs get no review comments ([MergeScout](https://mergescout.com/blog/how-to-measure-code-review-quality/); [Core Security](https://www.coresecurity.com/blog/what-rubber-stamping-and-why-it-serious-cybersecurity-concern)). Best-guess for contextually consistent orders from known colleagues: 80–95%. For SOC-flagged sequences outside the lab's normal scope: 50–80%, depending on whether the vouching UI surfaces the SOC flag. No direct empirical data exists for gene synthesis vouching.

**Option 5 — Recruit a colluding voucher (persistent, two-insider variant):**
- **What happens:** Handler recruits a second insider at the same institution to reliably approve orders.
- **Expertise:** Intermediate (for handler) — requires bilateral recruitment and ongoing management.
- **Cost:**
  - **Referral-based second insider** (first insider provides a warm lead): $500–$2,000 voucher payment per order + $1,000–$5,000 amortized recruitment. Total per order: ~$2,500–$7,000.
  - **Independent second-insider recruitment** (no referral, e.g., for compartmentalization): $500–$2,000 voucher payment + the full $3,000–$10,000 recruitment BOTEC. Total per order: ~$3,000–$8,000.
- **Lead-up time:** Weeks to months for the second recruitment; faster with a referral.
- **Attacker trace:** Both insiders' identities logged; handler still invisible.
- **Cross-measure dependency:** Dominated by Option 4 ($0) whenever Option 4 is available. Option 5 is only attractive if the first insider cannot or will not use a willing rubber-stamp voucher. The referral-discount assumption is load-bearing and best-guess.

**Option 6 — Order splitting across institutions (persistent):**
- **What happens:** Handler recruits multiple insiders at different institutions to split a SOC sequence set across orders.
- **Expertise:** Intermediate (handler).
- **Cost:** Multiplied recruitment: ~$9,000–$30,000 for 3 insiders at 3 institutions per complete sequence set.
- **Lead-up time:** Months.
- **Attacker trace:** Three independent insider identities on file at three institutions; handler still invisible.

**Cross-measure dependencies:** The rubber-stamp bypass (Option 4) is the economic linchpin for the persistent variant — it keeps the Matrix B total at $2,500–$6,000 rather than forcing a jump to Options 5 or 6. If providers surface SOC flags prominently in the vouching UI and require explicit sign-off language, Option 4's rate drops and the persistent-variant cost rises.

---

### Measure 9: Biosafety documentation

**Binding?** Partial — depends heavily on the insider's lab and the provider's enforcement. No centralized public registry of IBC approvals exists, which means providers cannot efficiently verify whether a specific researcher is listed on a specific protocol ([NIH OSP FAQs](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/); [NIH transparency announcement](https://about.citiprogram.org/blog/nih-reinforces-transparency-in-biosafety-oversight-with-new-ibc-requirements/)).

**False-negative rate.** ~20–40% of legitimate customers outside NIH-funded US academic institutions would fail a hard documentation gate (industry researchers, international researchers, community labs); ~5–10% within NIH-funded US universities (early-career researchers not yet listed on relevant protocols). This high FNR pressures providers to accept self-attestation or PI assertion — exactly the forms the attacker can exploit.

**Bypass methods.**

**Option 1 — Submit the lab's existing IBC approval (persistent, often non-binding):**
- **What happens:** Insider references their own lab's real IBC protocol. No deception if existing approval plausibly covers the sequences.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Zero.
- **Attacker trace:** Reference to real IBC protocol logged.

**Option 2 — Reference another lab's IBC approval:**
- **What happens:** Insider submits a protocol from a different lab at the same institution.
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** Hours to days.
- **Attacker trace:** Cross-reference to an unrelated lab's protocol — could be noticed if scrutinized.
- **Cross-measure dependency:** Conflicts with Measure 8 — the voucher (from the insider's own lab) may notice a protocol reference from outside the lab.

**Option 3 — Claim the order is covered by an existing IBC protocol:**
- **What happens:** Insider self-attests that sequences fall under a covered protocol, without submitting documentation.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Zero.
- **Attacker trace:** Self-attestation logged; no document to verify.
- **Caveat:** Exploits the verification gap created by the absence of a centralized IBC registry.

**Option 4 — Exploit sparse provider enforcement:**
- **What happens:** The provider simply does not require documentation for this order type or jurisdiction.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Zero.
- **Attacker trace:** None beyond the order itself.

**Option 5 — Obtain IBC approval legitimately (persistent):**
- **What happens:** Insider drafts a credible scientific justification and submits it through the institution's real IBC process, potentially involving their PI.
- **Expertise:** Practitioner — requires biosafety-regulation domain knowledge and scientific credibility.
- **Cost:** $0 in dollars (IBC review is a free institutional service); real cost is in insider time and additional witnesses created (PI, committee members).
- **Lead-up time:** 4–12 weeks. IBCs typically meet monthly and require 4-week submission lead time, with 4–6 week review ([UW EH&S](https://www.ehs.washington.edu/biological/biological-research-approval/institutional-biosafety-committee-ibc); [UW-Green Bay](https://www.uwgb.edu/ibc/approval-process/)).
- **Attacker trace:** Insider's name permanently on IBC protocol roster; PI listed as responsible investigator; institutional record retained indefinitely.
- **Cross-measure dependency:** Only viable for persistent variant where handler can plan months ahead.

---

### Matrix B synthesis

**Cheapest persistent path:** Total handler cost per SOC order ~$2,500–$6,000 (amortized recruitment $500–$1,000 + insider SOC payment $2,000–$5,000 + $0 bypass costs; gene synthesis $200–$2,000 is charged to the institution, not the handler). Uses rubber-stamp vouching (Option 4) and lab's own IBC protocol (Option 1).

**Cheapest one-off path:** ~$5,000–$15,000 per SOC order (full recruitment $3,000–$10,000 + insider SOC payment $2,000–$5,000 + $0 bypass costs).

**Lead-up time:** 3–15 weeks one-off (dominated by recruitment); 1–3 weeks per subsequent persistent order.

**Expertise:** Handler is Intermediate (social-engineering and relationship management); insider is Minimal/Aspirant (normal job activity).

**Which measures do the most work.** None creates bypass friction; all the KYC stack's contribution against this branch flows through two channels:
1. **Deterrence** — IAL2 biometric commitment raises insider compensation by 50–200%, making recruitment harder at the margin.
2. **Trace** — comprehensive records enable post-hoc investigation if the order is flagged through other means (tip, institutional audit, law enforcement investigation of the handler's broader network).
3. **Vouching (partial)** — the only measure that forces an unwitting third party into the chain, with a non-zero but low (~5–20%) detection probability for orders clearly outside the lab's research scope. Rubber-stamping collapses this at the persistent-variant limit.

The defense against insider recruitment lies substantially outside the KYC stack — in recruitment difficulty, institutional procurement oversight, biosafety committees, and law enforcement. The Flashpoint 2025 data (91,321 insider-recruitment posts) and the Coinbase case demonstrate that insider recruitment is an active, scaled phenomenon, not theoretical.
