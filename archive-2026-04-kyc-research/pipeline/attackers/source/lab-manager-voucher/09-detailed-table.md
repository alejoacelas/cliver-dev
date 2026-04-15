# Lab manager / admin / affiliate who is the voucher — Detailed table

Branch C of the exploit-affiliation profile. An insider whose legitimate day-job is placing oligo orders on behalf of a PI, lab, core facility, or clinical / public-health unit. The attacker holds the registered ordering role on a standing provider account and is often also the registered vouching contact. Three principal variants: university lab manager, visiting-scholar / industry affiliate with weakly vetted credentials, and clinical / public-health laboratory staff. Technical skill: zero. Budget: zero. Every KYC signal the provider sees was satisfied legitimately at onboarding months or years before the attack. The branch's "bypass" is that every measure was designed to catch outsiders, and the attacker is an insider.

---

## Matrix A (all orders)

### Measure 1: Identity verification -- IAL1

**Binding?** No. The attacker uses their own real government ID, real PII, and real phone number. The IAL1 check was performed at account onboarding and is not re-run per order. Nothing to bypass.

**False-negative rate.** Around 2.15% of North American IDV transactions fail on first attempt; effective blocking after retry is well under 1% ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)). This branch's population (institutional researchers with US/EU documents in well-lit office environments) is at the low end of failure rates.

**Bypass methods.** None needed. The attacker authenticates as themselves ($0, zero lead-up, Aspirant).

- **Attacker trace:** Real name, DOB, national ID, phone, and credit-bureau correlation hash stored at the IDV vendor for a multi-year retention period. Directly attributable on any retroactive investigation.

---

### Measure 2: Institutional affiliation check

**Binding?** No. The attacker's institutional email, HR record, and directory listing are all genuine. Domain recognition, inbox verification, and consistency review pass on the merits. Federated login via [eduGAIN](https://edugain.org/about-edugain/) or InCommon, where deployed, also passes natively.

**False-negative rate.** Near-zero for well-documented institutional domains (.edu, .gov, major hospital domains). Expected <5% on inbox verification alone for a real .edu mailbox.

**Bypass methods.** None needed ($0, zero lead-up, Aspirant).

- **Shared departmental account sub-variant:** Where a single provider account is registered to a lab or department name with shared credentials, the provider cannot distinguish the attacker from a legitimate peer on any specific order. This further weakens any future role-validation countermeasure.
- **Attacker trace:** Institutional email, HR record, directory entry all on file. Provider retains the attacker's institutional email and account metadata for the full retention period.
- **Key uncertainty:** Whether any IGSC synthesis provider in 2026 performs role validation against institutional HR (no evidence found; `measures-in-practice.md` does not list this as part of the baseline).

---

### Measure 3: Organization registry + verified shipping address

**Binding?** No. The institution is a real registered research organization. The standing shipping address is the real lab building or central receiving dock. The two-contact baseline is satisfied by two real institutional employees (attacker + PI, or attacker + co-worker).

**False-negative rate.** Near-zero for established institutional addresses. USPS CASS-certified address validation achieves very high match rates on real academic / hospital addresses ([USPS CASS certification](https://postalpro.usps.com/certifications/cass)).

**Bypass methods.** None needed for the standing address ($0, zero lead-up, Aspirant).

- **Lower-trace shipping variant (collaborating institution):** The attacker adds a collaborator's institution as a secondary registered shipping address, shipping SOC tubes there to avoid peer observation at the home institution's receiving dock. Requires a real collaboration arrangement (days to weeks for pre-existing; months if starting fresh). No monetary cost. Provider-side address-change review completes on a business-day timescale.
- **Attacker trace:** Institution's organization record, standing shipping address, and two real contacts on file. Institutional mailroom logs link each delivery to the lab. For the collaborating-institution variant, the new shipping address is also on file.

---

### Measure 4: Research & entity signals

**Binding?** No. The institution's real publications, grants (indexed in [NIH RePORTER](https://reporter.nih.gov/)), web presence, and corporate registry entry all pass the "does this entity look real" review natively.

**False-negative rate.** Near-zero for NIH-funded US research universities, teaching hospitals, and state public-health labs.

**Bypass methods.** None needed ($0, zero lead-up, Aspirant).

- **Early-career exception:** The attacker personally may lack publications, but reviewers expect lab managers, technicians, and visiting affiliates to lack individual research footprints. This is normatively acceptable.
- **IP geolocation signal:** The attacker ordering from an institutional workstation produces IP geolocation matching the institution ([MaxMind GeoIP2](https://www.maxmind.com/en/geoip2-city-accuracy-comparison)), reinforcing legitimacy.
- **Attacker trace:** No new artifacts beyond the name provided at measures 1-3 -- the attacker rides the institution's existing footprint.

---

### Measure 5: Payment integrity

**Binding?** No. The attacker pays through the institution's real P-card (in the attacker's name, tied to the institution) or real institutional PO. Payment-to-identity consistency is perfect.

**False-negative rate.** Near-zero for institutional payments.

**Bypass methods.** None needed ($0, zero lead-up, Aspirant).

- **P-card threshold interaction:** Standard oligo orders ($50-$500) and gene-fragment orders ($500-$5,000) typically fit under university P-card per-transaction thresholds ($3,500-$10,000; see [GWU P-Card Policy](https://compliance.gwu.edu/procurement-card-p-card)). Larger orders can be split or routed through the lab's existing PO workflow. Periodic institutional P-card audits exist ([Columbia Purchasing Card Policy](https://universitypolicies.columbia.edu/content/purchasing-card-policy); [Baker Tilly practitioner guidance](https://www.bakertilly.com/insights/efficiently-and-effectively-auditing-your-p-card-program)) but check for fraud/misuse patterns, not sequence content.
- **Attacker trace:** Real P-card statement in institutional accounting. Provider payment record matches the registered institution. Institutional accounting department has full line-item history.

---

## Matrix A synthesis

**Total Matrix A cost:** $0 direct, $0 lead-up. Per-order marginal cost is the attacker's time to add one line item to a requisition they were going to submit anyway -- minutes per order, indistinguishable from the legitimate day-job.

**Every Matrix A measure is non-binding.** The attacker satisfies each natively because every signal the provider checks -- identity, affiliation, organization, entity signals, payment -- is genuinely the attacker's own, legitimately acquired for real operational reasons.

**Trace profile:** Attacker's own real identity fully committed across every row. Structurally maximal attribution, operationally invisible: retroactive investigation trivially identifies the attacker, but proactive detection requires someone to decide to investigate a non-anomalous institutional account.

---

## Matrix B (SOC orders -- adds these on top of Matrix A)

### Measure 6: Identity verification -- IAL2

**Binding?** No. The attacker passes with their own real face, real passport/license, and real biometrics. As of February 2025, vendors like Entrust/Onfido have achieved [NIST 800-63 IAL2 certification](https://onfido.com/blog/unlocking-trust-in-digital-identity-what-nist-800-63-ial2-certification-means-for-identity-verification/) -- these checks work well, but they confirm the attacker is who they say they are, which is not in dispute.

**False-negative rate.** ~0.1-5% depending on vendor and conditions. For institutional researchers with US/EU documents in good-lighting conditions, first-attempt pass rates are 95%+.

**Bypass methods.** None needed ($0, zero lead-up, Aspirant). The IAL2 check was likely performed once at account opening.

- **Attacker trace:** Face and document images stored by the IDV vendor; biometric template retained for multi-year KYC retention period. Face-recognition queries could reach the attacker during a targeted investigation but do not occur routinely.

---

### Measure 7: MFA + re-authentication

**Binding?** No. The attacker enrolls their own TOTP app or institutional SSO push factor on their own device. Every challenge passes trivially.

**False-negative rate.** A small but non-trivial share of enterprise MFA attempts require fallback to backup codes or helpdesk assistance (best-guess synthesis from [Duo Security case studies](https://duo.com/resources/case-studies)). For the attacker, this is a minor nuisance, not a barrier.

**Bypass methods.** None needed ($0, zero lead-up, Aspirant).

- **FIDO2/passkey note:** Even if the institution deploys phishing-resistant MFA, the branch is unaffected -- the attacker enrolls the FIDO2 key on their own device legitimately.
- **Attacker trace:** MFA enrollment ties the account to the attacker's device fingerprint. Every SOC authentication adds a log entry linking the attacker's device to the order submission event.

---

### Measure 8: Vouching by registered contact

**Binding?** Partial -- the only meaningfully binding measure in the entire matrix for this branch, and even it is satisfied by exploiting normal institutional behavior.

**False-negative rate.** Roughly 5-15% of legitimate SOC orders would experience vouching friction in a naive baseline implementation (voucher travel, time zones, holidays, email delays); providers will tune workflow to minimize this (best-guess; no public data).

**Bypass methods.** Seven sub-variants in decreasing order of relevance:

**(b) PI rubber-stamps (modal path):**
- The PI receives a vouching-approval request from their own trusted lab manager for a routine-looking oligo order. The PI clicks approve without reading the sequence context because hundreds of prior approvals were legitimate. Requires no technical skill -- only social calibration (observing the PI's behavior patterns, timing orders to moments of distraction, preparing bland requisition language). Long-tenured lab managers do all of this as part of their normal job.
- Expertise: Novice. Cost: $0. Lead-up: zero for long-tenured staff; weeks to months for new hires.
- Nearest empirical analog: [IRB expedited-review rubber-stamping dynamics](https://www.hhs.gov/ohrp/regulations-and-policy/guidance/index.html) and IBC review workload patterns at [UIC](https://research.uic.edu/compliance/ibc/) and [University of Michigan](https://research-compliance.umich.edu/institutional-biosafety-committee-ibc).
- Sustainability ceiling: bounded by PI sensitization events at roughly annual cadence (mandatory training refreshers via [CITI Program biosafety modules](https://about.citiprogram.org/), peer-institution incidents, new IBC chairs). Expected operation lifetime: 1-3 years.
- Attacker trace: PI's real name and device on the vouching approval log per approved order.

**(a) Attacker is the registered voucher:**
- Under implementations that allow the same person to hold both ordering and vouching roles (e.g., via two institutional email accounts), the attacker approves their own orders.
- Expertise: Aspirant. Cost: $0. Lead-up: zero.
- Key uncertainty: whether baseline implementations cross-check IAL2 records between contacts.
- Attacker trace: same-person match on both contact records, immediately visible if cross-checked.

**(b') BSO-as-voucher architecture:**
- Under the more formal "biosafety officer approves all SOC orders" architecture, the attacker exploits BSO volume-driven rubber-stamping. BSOs at large research universities oversee hundreds of active protocols ([ABSA International](https://absa.org/); [UNC IBC](https://ehs.unc.edu/committees/ibc/)) and face the same approval-fatigue dynamics as PIs.
- Expertise: Novice. Cost: $0. Lead-up: longer than (b) -- up to a full IBC review cycle (~12 months) to observe BSO behavior.
- Attacker trace: BSO's real name and institutional role on the approval log.

**(b'') Ghost / inactive second contact:**
- Under weaker implementations where the second contact's existence satisfies the vouching requirement without per-order approval, the attacker's job is nil. Under the baseline (fresh per-order MFA approval), this sub-variant does not apply.
- Expertise: Aspirant. Cost: $0. Lead-up: zero.
- Attacker trace: none beyond the second contact record on file.

**(b''') Stale voucher on long-tenured accounts:**
- Many standing accounts carry registered contacts who have since retired or left. If the provider never re-verifies contact currency, the stale voucher may approve out of habit or the workflow may fall through.
- Expertise: Aspirant. Cost: $0. Lead-up: zero.
- Attacker trace: none specific to the attacker.

**(c) Clinical / affiliate delegated batch vouching:**
- In clinical and public-health labs, vouching is delegated to a lab director who approves batch-level procurement requests covering all reagent orders for a period. Individual-sequence inspection is infeasible at the volumes involved (hundreds to thousands of reagent orders per month; best-guess from CAP/CLIA laboratory procurement norms).
- Expertise: Aspirant. Cost: $0. Lead-up: zero.
- Attacker trace: director/PI identity on batch-level approval log.

**(d) Recruit PI/BSO as co-conspirator:**
- The voucher knowingly approves the order. Cost is scenario-dependent: $0 (ideological) to $100,000s (financial). Insider-driven incidents cost enterprises $19.5M/yr on average ([Ponemon/DTEX 2026 report](https://ponemon.dtexsystems.com/)).
- Expertise: Novice. Lead-up: weeks to years.
- Attacker trace: communication channel between attacker and co-conspirator; PI/BSO identity on approval log.

**(e) Credential compromise of voucher (out of scope):**
- AiTM phishing to steal the voucher's session cookies ([Microsoft 2022 threat intelligence](https://www.microsoft.com/en-us/security/blog/2022/07/12/from-cookie-theft-to-bec-attackers-use-aitm-phishing-sites-as-entry-point-to-further-financial-fraud/)). Requires Practitioner-plus skill ($500-$5,000). Listed for completeness; belongs in the account-hijack branch.

---

### Measure 9: Biosafety documentation

**Binding?** No. The institution has a real IBC, and the attacker cites the lab's real IBC protocol number. The provider verifies the protocol exists and is active; it does not cross-check whether the specific ordered sequence falls within the protocol's approved scope, because that check requires biological expertise and is [infeasible at scale per `measures-in-practice.md` section 9](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/).

**False-negative rate.** Near-zero for NIH-funded institutions citing real registered protocols. High for small private entities (the opposite end of the distribution, irrelevant to this branch).

**Bypass methods (no forgery needed for the primary path):**

**Cite the real protocol and let scope ambiguity absorb the SOC sequence (primary):**
- The lab's IBC protocol has a scope description written years ago in general terms. The attacker submits the real protocol number; the provider verifies the protocol is active and the institution's IBC approved it. No sequence-scope cross-check occurs.
- Expertise: Aspirant. Cost: $0. Lead-up: zero.
- Attacker trace: real protocol number on file, no forgery. Mismatch surfaces only if the IBC audits order history against protocol scope.

**Cross-lab protocol citation:**
- The attacker cites a protocol from a different lab at the same institution whose scope covers additional organism families. Provider-level verification succeeds because the cited protocol is real and registered at the institution.
- Expertise: Aspirant. Cost: $0. Lead-up: zero.
- Attacker trace: traceable mismatch between ordering lab and cited protocol lab, visible on any internal cross-check.

**Vague end-use self-declaration:**
- The attacker writes a free-text declaration broad enough that nearly any sequence aligns ("molecular biology research," "positive control for assay development"). Reviewed for obvious red flags but not independently cross-checked.
- Expertise: Aspirant. Cost: $0. Lead-up: zero.

**Submit clinical biosafety approvals (clinical variant):**
- Hospital/public-health labs have broad biosafety approvals covering diagnostic and surveillance work. Real documentation, no forgery.
- Expertise: Aspirant. Cost: $0.

**Forge supplementary documentation (fallback):**
- If the provider demands additional materials, the attacker can obtain real documents (as lab manager, they often have access) or forge them using real institutional templates.
- Expertise: Novice. Cost: $0. Lead-up: hours.
- Attacker trace: forged document on file creates independent criminal-liability exposure.

**IBC audit cadence as cumulative failure mode:** IBCs meet at least yearly and protocols are renewed on a recurring cycle, with some institutions approving multi-year periods subject to yearly update ([MTSU IBC](https://research.mtsu.edu/IBC/); [NIH OSP FAQs](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/)). At renewal, a reviewer who cross-checks the lab's order history against the approved scope would surface the mismatch. Most IBCs do not routinely do this. Additionally, NIH's updated IBC transparency requirements (Notice NOT-OD-25-082) direct institutions to post IBC meeting minutes online beginning mid-2025 ([CITI Program blog](https://about.citiprogram.org/blog/nih-reinforces-transparency-in-biosafety-oversight-with-new-ibc-requirements/)), marginally increasing external visibility.

---

## Matrix B synthesis

**Total Matrix B cost:** $0 direct under the modal path (sub-variant b -- PI rubber-stamps). Per-order marginal cost: minutes of the attacker's time, indistinguishable from their day-job.

**Matrix A to Matrix B delta:** Essentially zero. Matrix B adds biometric commitment at M6 and a voucher approval click at M8. Neither costs money, requires new infrastructure, or requires a new identity.

**Trace profile:** Attacker's personal identity maximally committed across every measure -- real name, real face, real biometrics, real MFA device, real institutional email, real address, real payment, real IBC protocol, real PI on vouching log. Institutional records (HR, procurement, SSO logs, IBC registration, mailroom logs, P-card statements) reinforce every provider-side artifact. Attribution is structurally maximal and operationally invisible.

**Persistent-variant sustainability ceiling:** Bounded by three cumulative failure modes, none of which defeats the branch on any single order:

1. **PI/BSO sensitization** at roughly annual cadence (training refreshers, institutional reviews, news cycles). Expected operation lifetime: 1-3 years before a sensitization event creates non-zero detection probability.
2. **IBC protocol renewal review** at ~12-month cycles. If the reviewer compares order history against approved scope, the mismatch surfaces. Not universal but non-zero probability over multi-year operations.
3. **Diversion discrepancy accumulation** at the receiving point. For small-lab variants, peer observation of the shared fridge compounds over time; for core-facility variants, inventory-log discrepancies accumulate in shared systems.

**Near-term countermeasures that would materially bind this branch:**

1. Same-person IAL2 cross-check between ordering and vouching contacts (blocks sub-variant a; low provider cost).
2. Fresh per-sequence vouching that cannot be delegated to batch approval (weakens b, b', c; medium provider cost, erodes legitimate turnaround).
3. Per-order role validation against institutional HR (catches administrative/IT titles; high integration cost).
4. Sequence-scope cross-check against cited IBC protocol (catches out-of-scope sequences; infeasible at scale per `measures-in-practice.md`).
5. Institutional-governance: IBC order-history audit at protocol renewal (not a provider measure).

None of these countermeasures are in the matrix baseline.
