# Unrelated-department grad student / postdoc — Detailed table

Branch A of the exploit-affiliation profile. A currently enrolled graduate student or postdoc in a department that does not normally order sequences of concern (e.g., computational biology, chemistry, materials science). The attacker has a real `.edu` email, real government ID, real institutional affiliation, and legitimate campus access. Budget is zero; no infrastructure or tooling required. The attack exploits the fact that early-career grad students have thin publication footprints regardless of department — the KYC stack cannot reliably distinguish a first-year comp-bio student from a first-year wet-lab student. Three Matrix B paths exist: primary (inherited voucher via rotation host), straw purchaser (lab-authorized colleague places order), and credential compromise (hijack PI's provider session).

---

## Matrix A (all orders)

### Measure 1: Identity verification — IAL1

**Binding?** No. The attacker presents their own real government-issued ID. Attribute validation succeeds; OTP is delivered to their real phone. There is nothing to bypass.

**False-negative rate.** Commercial IDV subsystems tested by DHS RIVR 2025 showed DFRR ranging from under 1% (best subsystem) to over 97% (worst) on genuine US state IDs ([ID Tech Wire](https://idtechwire.com/dhs-rivr-results-expose-major-gaps-in-id-document-validation-performance/); [Biometric Update](https://www.biometricupdate.com/202602/dhs-rivr-results-suggest-most-id-document-validation-disastrously-ineffective)). Effective blocking after retry and manual fallback is likely <2% for domestic users.

**Bypass methods.** None needed for the cheapest path ($0, own ID). Lower-trace variants (stolen PII + SIM swap, synthetic identity) were considered and discarded because they break downstream cross-measure consistency — the attacker commits their real identity everywhere.

- **Attacker trace:** Real name, DOB, address, phone, and document images or credit-bureau correlation hash at the provider and IDV vendor. Retention 5–7 years. Accessible via compliance and subpoena.

---

### Measure 2: Institutional affiliation check

**Binding?** No under baseline (canonical `.edu` passes natively); partial under a federated-login variant that parses department attributes.

**False-negative rate.** An average of 13% of corresponding authors in Web of Science (2008–2012) used non-institutional email addresses, rising from 10% to 16% over the period ([LSE Impact Blog](https://blogs.lse.ac.uk/impactofsocialsciences/2018/06/21/institutional-versus-commercial-email-addresses-which-one-to-use-in-your-publications/)). Estimated 10–25% first-attempt failure for legitimate researchers (non-institutional email, non-standard domains); ~3–8% final blocking after manual review (best guess).

**Bypass methods.**

**Bypass A — Canonical `@university.edu` (primary):**
- **What the attacker does:** Uses their own institutional email, which was issued by central IT upon enrollment. No action required.
- **Expertise:** Aspirant — not an attack at all; this is honest email use.
- **Cost:** $0.
- **Lead-up time:** None.
- **Attacker trace:** Institution's mail server retains all provider correspondence. The attacker's real `.edu` address is on file at the provider permanently.

**Bypass B — Host-lab or research-group alias:**
- **What the attacker does:** Obtains a lab-specific email alias (e.g., `jsmith@genomicslab.university.edu`) during a legitimate rotation.
- **Expertise:** Aspirant (during active rotation) to Novice (if requesting without an active project).
- **Cost:** $0.
- **Lead-up time:** Days to weeks.
- **Attacker trace:** Lab mail log associates the alias with the attacker.
- **Caveat:** A host-lab alias invites a footprint check against the lab's publications, which returns nothing for the attacker — fine for rotation students, but potentially flagged by an attentive reviewer.

**Bypass C — Federated academic login (InCommon/eduGAIN):**
- **What the attacker does:** Authenticates via institutional SSO. The federated assertion includes affiliation and possibly department attributes (best guess: [InCommon](https://incommon.org/federation/), [eduGAIN](https://edugain.org/)).
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** Institutional SSO log records every provider authentication event, creating a durable record correlatable with order timestamps.
- **Cross-measure dependency:** If a provider gates SOC eligibility on department-level attributes from the federated assertion, this flips to binding. Most providers likely do not parse at this depth.

**Bypass D — Transliteration / name-disambiguation collision:**
- **What the attacker does:** Nothing — this is a property of bibliographic name-matching systems that applies natively to authors with non-Latin-script names ([ORCID's rationale for persistent identifiers](https://info.orcid.org/); best guess).
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** None beyond the onboarding form.

---

### Measure 3: Organization registry + verified shipping address

**Binding?** No at the KYC-stack level, but the host-lab enrollment step carries real institutional-side friction (human evaluation by lab admin or PI).

**False-negative rate.** Estimated 10–20% first-attempt failure for small research entities (CMRA-flag misclassification, solo-PI labs unable to supply two contacts, jurisdiction mismatches). Most recoverable on manual review (best guess).

**Bypass methods.**

**Bypass A — Enroll under the host lab's existing account (primary):**
- **What the attacker does:** During a legitimate rotation (typically 6–12 weeks per rotation, 2–4 rotations in the first year of a biomedical PhD; best guess), asks the lab admin or PI to add them as an authorized user on the lab's synthesis-provider account. This is standard procedure for rotation students in wet-lab environments.
- **Expertise:** Aspirant to Novice — navigating a social process, not exploiting a technical vulnerability.
- **Cost:** $0 monetary; time cost is rotation embedding.
- **Lead-up time:** 2–8 weeks of rotation embedding before the "add me to the vendor account" request is socially feasible.
- **Attacker trace:** Provider user-management log (attacker added as authorized user). Host lab's internal rotation onboarding records. Lab admin's memory.

**Bypass B — Shared institutional procurement account:**
- **What the attacker does:** Orders through the university's eProcurement platform, which routes through pre-approved suppliers with automated approval workflows ([EANDI](https://www.eandi.org/resources/ei-blog/what-is-eprocurement-universities); [BidFinderEDU](https://bidfinderedu.com/resources/how-university-procurement-works/)).
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** Institutional procurement system log, student's designated pickup point.
- **Caveat:** Whether a grad student can place an SOC-class order through the shared system without lab-PI sign-off varies by institution. Most eProcurement systems route actual ordering authority back to a lab/cost-center owner.

**Bypass C — Self-register as a personal researcher account:**
- **What the attacker does:** Creates a personal account at the provider using their real identity and institutional affiliation.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** Provider registry record in the attacker's real identity.

**Bypass D — Ship to an inhabited building:**
- **What the attacker does:** Ships to the cited PI's real lab building/mailroom, which they already have card-swipe access to.
- **Expertise:** Aspirant (legitimate building access) to Novice (if interception requires informal-lab conditions).
- **Cost:** $0.
- **Attacker trace:** University mailroom log (named-recipient pickup), building access log, host-lab inventory if the package passes through lab receiving.
- **Caveat:** In competent labs with formal inventory workflows, inbound packages are logged on receipt by a lab receiving person and compared against expected orders. A rotation student cannot reliably intercept before this step. Interception is feasible only in informal labs where packages land on a shared bench.

**Bypass E — Ship to collaborating institution or CRO:**
- **What the attacker does:** Directs shipment to a collaborator's institution.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** Collaborator institution's receiving log.

---

### Measure 4: Research & entity signals

**Binding?** Partial. Institution-level checks pass trivially (major R1 universities have large indexed publication counts and many NIH awards per [NIH RePORTER](https://reporter.nih.gov/); best guess). Individual-level checks are where friction lives, but early-career thinness is population-normal.

**False-negative rate.** Estimated 15–30% of legitimate customers have individual footprints thin enough to flag on strict review — early-career researchers, industry scientists, community labs, many non-Western researchers (best guess).

**Bypass methods.**

**Bypass A — Reflected legitimacy from home institution:**
- **What the attacker does:** Nothing — the institution's research profile carries the attacker through individual-level thinness.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** None beyond onboarding form.

**Bypass B — Grad-student footprint floor:**
- **What the attacker does:** Nothing — having 0–3 publications in the first 2–3 years of a PhD is population-normal (best guess; typical median first-author paper at 3–5 years into a biomedical PhD).
- **Expertise:** Aspirant — not constructed.
- **Cost:** $0.
- **Attacker trace:** None.

**Bypass C — Cite a rotation host with a substantive footprint:**
- **What the attacker does:** Names the rotation-host PI (who has a real publication record) in the order context.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Part of rotation embedding (weeks).
- **Attacker trace:** Host PI's name in the attacker's onboarding record.

**Bypass D — Transliteration / name-disambiguation collision:**
- **What the attacker does:** Nothing — name ambiguity in PubMed is well-documented and motivated ORCID's creation ([ORCID](https://info.orcid.org/); best guess).
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** None.

**Bypass E — Vague research self-declaration:**
- **What the attacker does:** Submits a generic end-use description like "research purposes." Providers have reported (September 2024 workshop, Chatham House Rule, per [2025 IBBIS whitepaper](https://ibbis.bio/wp-content/uploads/2025/11/IBBIS_Whitepaper_2025_Implementing-Emerging-Customer-Screening-Standards-for-Nucleic-Acid-Synthesis.pdf)) that such descriptions are difficult to interpret.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** Self-declaration on file.

**Bypass F — Multi-provider order splitting:**
- **What the attacker does:** Distributes orders across multiple synthesis providers, each seeing only a subset.
- **Expertise:** Novice.
- **Cost:** $0 monetary; modest time per provider onboarding.
- **Attacker trace:** Identity committed at each provider independently; cross-provider pattern visible only to an investigator pulling records from multiple providers.

**Bypass G — Directory incompleteness fallback:**
- **What the attacker does:** Nothing — the provider's directory check may not cover all institutional subdomains or cross-listed centers.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** None.

---

### Measure 5: Payment integrity

**Binding?** No. Institutional payment instruments pass natively.

**False-negative rate.** Negligible — most institutional payment instruments pass trivially.

**Bypass methods.**

**Bypass A — Personal credit card with reimbursement:**
- **What the attacker does:** Pays personally; seeks reimbursement from department finance.
- **Expertise:** Aspirant.
- **Cost:** $0 marginal to the KYC stack (the order cost itself is the attacker's expense).
- **Attacker trace:** Personal card on file at provider; reimbursement paperwork at department finance.
- **Caveat:** Non-standard line items (e.g., "custom DNA synthesis" on a computational department's grant) can flag on cost-center compliance grounds (best guess; consistent with policies like [Penn State FN18](https://policy.psu.edu/policies/fn18)).

**Bypass B — Departmental P-card via TA/RA duties:**
- **What the attacker does:** Uses a P-card accessible through existing duties.
- **Expertise:** Aspirant.
- **Cost:** $0 marginal.
- **Attacker trace:** Card transaction log at department finance; provider payment record.

**Bypass C — Pre-shared host-lab P-card:**
- **What the attacker does:** Uses the host lab's P-card, shared for routine ordering.
- **Expertise:** Aspirant.
- **Cost:** $0 marginal.
- **Attacker trace:** Host lab's card transaction log.

**Bypass D — Institutional purchase order via RA role:**
- **What the attacker does:** Places a PO through the institution's procurement system ([BidFinderEDU](https://bidfinderedu.com/resources/how-university-procurement-works/)).
- **Expertise:** Aspirant to Novice.
- **Cost:** $0 marginal.
- **Lead-up time:** Days (new PO) to minutes (existing standing PO).
- **Attacker trace:** PO number in the university procurement system; provider record.

---

### Matrix A synthesis

**Cheapest end-to-end path (host-lab route):** Own real ID (M1, $0, minutes) → canonical `.edu` (M2, $0, none) → enroll under host lab's account after rotation embedding (M3, $0, 2–8 weeks) → reflected institutional legitimacy + thin-footprint camouflage + vague research statement (M4, $0, none) → host lab P-card or personal card (M5, $0 marginal).

**Alternative (shared-procurement route):** Same as above but replaces M3 with institutional procurement portal; no host lab required; availability varies by institution.

**Total Matrix A monetary cost:** $0 upfront for KYC-stack bypasses. The attacker's only expense is the synthesis order itself.

**Total Matrix A lead-up time:** Minutes (if rotation embedding and account access already exist) to one semester (new rotation setup from scratch).

**Which measures do the most work:** Measure 4 is the only KYC-stack measure that could catch this branch, and only via department-level role validation that baseline checks typically do not perform. Measures 1, 2, 3, 5 are non-binding at the KYC level; their friction is institutional-side (lab admin user-add, mailroom handling, expense audit).

**Combined legitimate-customer false-rejection rate (Matrix A):** Per-measure first-attempt rates for the most vulnerable segments (small labs, non-US researchers, early-career scientists): M2 ~10–25%, M3 ~10–20%, M4 ~15–30%. Combined first-pass rejection under modest correlation: plausibly 25–50% for the worst-served segments. Final combined blocking: ~5–15% after manual review. The attacker is not in these vulnerable segments — they pass natively.

**Trace profile:** Maximum KYC-stack attribution (real PII, real `.edu`, real student record, real institutional billing). Additional institutional-side artifacts (lab user-add log, mailroom log, expense audit, rotation paperwork) not visible to the provider but available to institutional investigators.

---

## Matrix B (SOC orders — adds on top of Matrix A)

### Measure 6: Identity verification — IAL2

**Binding?** No. The attacker presents their own real face and real document.

**False-negative rate.** Per DHS RIVR 2025, DFRR ranges widely across subsystems; best-performing at ~0.2%, worst near total rejection ([ID Tech Wire](https://idtechwire.com/dhs-rivr-results-expose-major-gaps-in-id-document-validation-performance/)). International-student manual-review fallback for countries with limited vendor coverage.

**Bypass methods.** None needed — own face, own document, live person. Aspirant; $0; minutes.

- **Attacker trace:** Face, document images, biometric template at IDV vendor, retention 1–7 years.

---

### Measure 7: MFA + re-authentication

**Binding?** No.

**False-negative rate.** Negligible (<1%).

**Bypass methods.** None needed — own device, own MFA enrollment. Aspirant; $0; minutes.

- **Attacker trace:** TOTP seed or push-device fingerprint tied to attacker's device; institutional IDP log if SSO-delegated.

---

### Measure 8: Vouching by registered contact

**Binding?** Yes. The single KYC-stack measure that can bind against this branch under the primary path. Three alternative path families exist.

**False-negative rate.** Estimated 15–30% first-attempt for small/new labs (solo-PI groups without a second contact, PIs who are traveling or unreachable). Most recoverable by adding a second contact (best guess).

**Bypass methods.**

**Bypass A — Pre-delegated ordering authority:**
- **What the attacker does:** Inherits pre-delegation from the host lab's PI, who has already authorized designated lab members to place routine orders. Standard practice at many large US research labs (best guess; consistent with delegation policies like [Penn State FN18](https://policy.psu.edu/policies/fn18)).
- **Expertise:** Aspirant — not constructing pre-delegation, just inheriting it.
- **Cost:** $0.
- **Lead-up time:** None marginal; depends on M3 enrollment choosing a host lab that already has pre-delegation.
- **Attacker trace:** Provider log shows pre-delegating PI as authority; individual order carries the student's identity.
- **Cross-measure dependency:** Depends on M3 enrollment; the host-lab choice at M3 locks in voucher identity.

**Bypass B — Per-order rubber-stamping by inattentive voucher:**
- **What the attacker does:** Frames the order plausibly and the PI clicks approve without detailed inspection. Formal approval policies disfavor rubber-stamp signatures (best guess; consistent with [University of Iowa IRB assurances](https://hso.research.uiowa.edu/submit-irb/new-hawkirb-project-applications/about-assurances)) but behavioral reality varies.
- **Expertise:** Aspirant to Novice.
- **Cost:** $0 marginal.
- **Lead-up time:** Minutes per order (PI clicks approve) to days (PI delays).
- **Attacker trace:** Provider log shows PI as voucher with fresh MFA. Email framing exists in both parties' sent items. PI is a potential witness.
- **Caveat:** In early deployment of SOC vouching (first 2–4 years), PIs are likely more attentive than steady-state because the workflow is unfamiliar. Rubber-stamping is a steady-state outcome.

**Bypass C — Lab-admin-delegation voucher:**
- **What the attacker does:** Uses a lab admin's authority if the admin, rather than the PI, is the registered second contact.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** Lab admin's identity on vouching log.

**Bypass D — Thesis-committee member or class-project advisor fallback:**
- **What the attacker does:** Names a thesis-committee member or class-project advisor as voucher; these are real relationships.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** Advisor's identity on vouching log.

**Bypass E — Recruit PI as knowing co-conspirator:**
- **What the attacker does:** Recruits the PI to knowingly approve orders. This is insider recruitment, not KYC bypass.
- **Expertise:** Practitioner.
- **Cost:** Variable — $0 (ideological alignment) to tens of thousands.
- **Attacker trace:** PI becomes a co-conspirator whose cooperation or turning is the dominant attribution risk.
- **Context:** Nearly 70% of life-sciences respondents reported increasing insider incidents ([Security Magazine](https://www.securitymagazine.com/articles/99656-70-of-life-sciences-see-a-rise-in-insider-data-loss-incidents); Code42 report); absolute life-sciences incident counts (~20/month) are lower than some other industries.

**Bypass F — Credential compromise of registered contact:**
- **What the attacker does:** Compromises the PI's provider or institutional credentials (credential stuffing, proximity-based observation, shared-workstation access) and approves their own vouching request.
- **Expertise:** Novice (credential-stuffing against a reused password) to Practitioner (intercepting MFA, exploiting session tokens).
- **Cost:** $0–$500.
- **Lead-up time:** Days to weeks of observation.
- **Attacker trace:** Provider log shows PI as approver. Institutional IDP log records the login event. If device fingerprinting flags it, a security alert may fire.
- **Key caveat:** Modern IDPs (Microsoft 365, Google Workspace, Okta) deploy device fingerprinting and anomalous-login detection. End-to-end success probability per attempt is low single-digit percent given credential-stuffing rates of ~0.1–2% (best guess) and MFA catch rates commonly >50% for anomalous logins. Viable as a fallback with persistence, not a reliable primary path. Per the 2025 Verizon DBIR (via [DeepStrike](https://deepstrike.io/blog/compromised-credential-statistics-2025)), stolen credentials were the initial vector in 22% of breaches.

**Bypass G — Straw purchaser via authorized lab member:**
- **What the attacker does:** Identifies a cooperative lab member (senior grad student, postdoc, technician) and frames the request as a favor or pays for cooperation. The straw purchaser passes all 9 measures using their own legitimate credentials.
- **Expertise:** Novice — requires identifying a cooperative target and framing the request plausibly.
- **Cost:** $0 (favor) to an unanchored upper bound — roughly $5,000 per order as a ceiling from loose analogy to banking/telecom insider recruitment; no published figures for academic-lab straw-purchaser compensation.
- **Lead-up time:** Days to weeks of social recruitment.
- **Attacker trace:** Attacker entirely absent from provider records. Attribution runs through the straw purchaser, who is the primary witness.
- **Context:** Insider-insider collusion accounts for roughly 17% of insider-threat incidents (best guess from CERT insider-threat literature; not directly confirmed at that figure).

---

### Measure 9: Biosafety documentation

**Binding?** Partial — existence checks pass trivially (the attacker cites a real protocol); scope audit against ordered sequences is where the measure could bind.

**False-negative rate.** Estimated 25–40% first-attempt for small private labs and non-US entities (best guess; verification at small/private organizations is "extremely difficult" per measures-in-practice framing).

**Bypass methods.**

**Bypass A — Cite host lab's existing IBC protocol:**
- **What the attacker does:** References the host lab's real IBC protocol number. Per NIH guidance NOT-OD-25-082 (issued March 2025, effective June 1, 2025), IBC meeting minutes are expected to be publicly posted and IBC rosters are available via NIH OSP's IBC Registration Management System ([UCLA RSAWA](https://rsawa.research.ucla.edu/news/nih-transparency-requirements-ibc-2025-06-01/); [NIH OSP template](https://osp.od.nih.gov/wp-content/uploads/2025/05/Minutes-PtoC-and-Template.pdf); [UMaine guidance](https://umaine.edu/research-compliance/2025/04/29/biosafety-new-nih-transparency-guidance-april-2025/)). Protocol-holder PIs and IBC member names are publicly identifiable; protocol numbers may require bench access.
- **Expertise:** Aspirant to Novice (depends on how the protocol number is obtained).
- **Cost:** $0.
- **Lead-up time:** Hours (publicly available PI/IBC names) to weeks (if bench access is needed for protocol numbers).
- **Attacker trace:** Real protocol number tied to real institution in provider record. If provider cross-checks the institutional biosafety office, the institution learns of the order.

**Bypass B — Cite home department's umbrella protocol:**
- **What the attacker does:** References a departmental umbrella IBC protocol.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Caveat:** For computational/materials departments without umbrella coverage for SOC sequences, this bypass may not have a plausible protocol to cite.
- **Attacker trace:** Home department's umbrella protocol on file.

**Bypass C — Submit another researcher's legitimate documentation:**
- **What the attacker does:** Uses documentation from a different lab accessible via multi-lab rotation access.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** Chosen protocol on file; discoverable in retrospective audit.

**Bypass D — Self-attestation:**
- **What the attacker does:** Signs a self-attestation form.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** False attestation on file (legally fraught).

**Bypass E — Copy PI's IBC documentation directly from lab records:**
- **What the attacker does:** Copies the real IBC documentation from the host lab.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Attacker trace:** None beyond the submitted PDF, which is a real document.

**Bypass F — Volume gradualism:**
- Cross-measure persistence technique. Small frequent orders reduce per-order probability of scope audit.

---

### Matrix B synthesis

**Three alternative path families:**

**Primary path (inherited voucher via host lab):**
1. Measures 1–7: all $0, all pass natively.
2. Measure 8: inherited from host-lab enrollment. Resolution depends on PI voucher behavior — pre-delegation ($0, no marginal time), rubber-stamping ($0, minutes per order), or attentive voucher (blocked).
3. Measure 9: cite host lab's real protocol. $0; access ranges from free (post-2025 public IBC data) to weeks of rotation embedding.

Total: $0 monetary. Time: 2–8 weeks rotation embedding. Contingent on voucher behavior.

**Straw purchaser path:**
1. Attacker recruits a lab-authorized researcher. Cost: $0 (favor) to roughly $5,000/order (unanchored ceiling).
2. Straw purchaser passes all 9 measures using their own legitimate credentials.
3. Attacker receives sequences via informal lab transfer.

Total: $0–$5,000/order. Time: days to weeks of social recruitment. **Attacker entirely absent from provider records.**

**Credential compromise path:**
1. Measures 1–7: all $0, all pass natively under attacker's own identity.
2. Measure 8: attacker compromises PI's credentials and approves own vouching request. $0–$500. Days to weeks. Low single-digit success probability per attempt.
3. Measure 9: cite real protocol as in primary path.

Total: $0–$500. Time: days to weeks. Success rate limited by MFA and device fingerprinting.

**Which path is cheapest under which conditions:**
- **Steady-state vouching routinization:** Primary path with rubber-stamping PI. $0.
- **Early-deployment attentive vouching:** Straw purchaser path. $0–$5,000/order; removes voucher attentiveness from the dependency.
- **PI with weak opsec and attacker with proximity:** Credential compromise. $0–$500; high institutional IDP detection risk.

**Combined legitimate-customer false-rejection rate (Matrix B):** Matrix B adds M8 vouching (~15–30% first-attempt for small/new labs) and M6 IAL2. Combined with Matrix A's 25–50% first-pass rate for vulnerable segments, the full stack first-pass false-rejection rate for worst-served segments could reach 35–60% under uncorrelated assumptions. Final combined blocking: ~10–20% for small non-US entities. The attacker is not in these segments.

**Where Matrix B measures are doing the most work:**
- **Measure 8 is doing almost all the marginal work** under the primary path. Under straw purchaser and credential compromise, M8 is either bypassed entirely or circumvented.
- **Measure 9 does partial work** only when providers perform scope audit against ordered sequences. Existence checks pass trivially.
- **Measures 6, 7 add attribution only** — pure deterrence, no barrier.

**How much harder is Matrix B than Matrix A:** Matrix B adds $0 monetary cost under all three paths but adds a voucher-behavior dependency (primary), an operational recruitment step (straw purchaser), or a compromise step (credential). The effective difficulty increase depends on (1) voucher-attention distribution, (2) the attacker's social proximity to cooperative lab members, and (3) PI opsec quality. None of these is a monetary cost or a technical KYC-stack barrier — all are distributional properties of the human institutional context.

**Distinctive properties of this branch:**
- Lowest monetary cost of any branch: $0 across all paths at the KYC-stack level.
- Largest eligible attacker population: ~818,000+ US grad students in SEH fields ([NCSES NSF 25-316](https://ncses.nsf.gov/pubs/nsf25316/figure/1)) plus comparable non-US populations.
- Highest attribution under the primary path; lowest attribution (straw purchaser, attacker absent from records) under the alternative path.
- Detection fundamentally requires noticing *intent mismatch* rather than *artifact falsity* — every record is real and correctly attributed; no fabricated documents exist anywhere in the branch.
