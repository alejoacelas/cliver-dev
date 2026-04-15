# Visiting-researcher / collaborator workflow piggyback — Detailed table

Branch D of the fake-affiliation profile. A lone operator with social-engineering basics obtains a real visiting-scholar or courtesy appointment at a US/European R1 university through the institution's own lightweight vetting process, then uses the resulting genuine `.edu` credentials to place SOC orders. The attacker uses their own real name throughout. No technical compromise, no document forgery, no credential theft.

**Upstream sub-chain economics (cross-cutting).** Nearly every KYC measure is pass-through once the appointment issues, so operational cost lives almost entirely in obtaining the visiting appointment. At a typical R1 department-level courtesy program, the attacker faces $0–$1,500 in institutional fees ([UC Berkeley VSPA](https://vspa.berkeley.edu/about/university-services-fee); [USF](https://www.usfca.edu/center-for-asia-pacific-studies/visiting-scholars)), $0–$240 for an LLM-assisted draft methods paper used as the pitch anchor, and 40–120 hours of attacker time across 5–20 cold pitches plus sustained correspondence. Total out-of-pocket: $0–$3,000. Total lead time: 2–4 months from first cold pitch to `.edu` email in hand ([UCI 2-week rule](https://ap.uci.edu/resources/visitorsandvisitingscholars/); [Rutgers process description](https://ohr.rutgers.edu/visiting_appointment_process.html)). The scoped attacker is US-resident; J-1 living-allowance documentation (~$34k/yr; [Penn Global](https://global.upenn.edu/isss/j1scholar-app/)) does not apply. Export-control screening via Visual Compliance ([UNC](https://research.unc.edu/compliance/export-controls/application/restricted-parties/); [Brown](https://division-research.brown.edu/research-cycle/conduct-research/export-controls/research-activities-impacted-export-controls); [Stanford](https://doresearch.stanford.edu/resources/tools-documents/export-controls-restricted-party-screening)) passes for a clean US name — it is a hard stop only for sanctioned-jurisdiction attackers, for whom Branch D does not apply.

---

## Matrix A (all orders)

### Measure 1: Identity verification — IAL1

**Binding?** No. The attacker uses their own real identity — real government-issued ID, real phone, real billing address. Nothing to bypass.

**False-negative rate.** ~2–5% first-attempt failure across ~100 million North American IDV transactions in 2025 ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)); <1% after retry/manual review. Adverse conditions (poor lighting, blurry images) are the primary driver ([Persona](https://withpersona.com/blog/identity-verification-pass-rate-metrics)). Irrelevant for this branch.

**Bypass methods.** None needed.

- **Attacker trace:** Real name, DOB, government ID number, phone, and real billing address recorded by the IDV vendor and retained 5–7 years. Accessible to provider compliance and, via subpoena, to investigators. Permanently links the attacker to the account.

---

### Measure 2: Institutional affiliation check

**Binding?** No. The attacker holds a real `.edu` email on the host university's genuine canonical domain. Inbox verification passes natively.

**False-negative rate.** 5–15% of legitimate institutional users may encounter friction if the provider's domain cross-reference list is incomplete — primarily medical-center and affiliated-institute users at large R1s with 5–20+ email domains (best-guess from observed complexity of university email ecosystems). Irrelevant for this branch — the attacker is assigned a canonical `.edu` directly.

**Bypass methods.** None needed.

- **Attacker trace:** Real `<name>@<university>.edu` on file. Institutional mail-server logs record provider correspondence. Inbox verification click logged by the provider. Links the account to the specific institution and appointment.

---

### Measure 3: Organization registry + verified shipping address

**Binding?** Partially — one routine administrative step. The attacker must attach to the host university's organization record and arrange a shipping address.

**False-negative rate.** 2–5% of legitimate onboarding flows experience friction — typically new labs, new departments, or address normalization issues. Low enough that providers cannot make this strict without breaking onboarding ([Northwestern Procurement](https://www.northwestern.edu/procurement/source-purchase/approvals-workflow/)).

**Bypass methods.**

**Option 1 — Attach to existing university org record (auto-approval variant):**
- The attacker's `.edu` email matches the university's domain, so the provider's org-record lookup resolves automatically.
- **Expertise:** Aspirant — pure flow-through.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** Attacker's real name appears on the university's authorized-orderer list.

**Option 2 — Attach via sponsor/admin approval:**
- Attacker asks sponsor or lab admin to approve them on the existing org record.
- **Expertise:** Aspirant — one routine email.
- **Cost:** $0.
- **Lead-up time:** Minutes to hours.
- **Attacker trace:** Same as Option 1, plus sponsor's approval action logged.

**Option 3 — Ship to host lab's institutional address:**
- Attacker asks sponsor "where should deliveries go?" and uses the lab's standard receiving address.
- **Expertise:** Aspirant — conversational ask.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** Order shipped to a real institutional address with attacker's real name as addressee. Mailroom logs record package receipt; lab-level receiving records the handoff.

**Option 4 — Off-campus residential/commercial fallback:**
- Attacker sets up a virtual office in the university's metro and navigates the provider's address-approval workflow.
- **Expertise:** Novice — requires constructing a plausible institutional link.
- **Cost:** $50–$300/mo ([Regus](https://www.regus.com/en-us/virtual-office)).
- **Lead-up time:** 1–3 days for virtual office setup + provider's address-approval SLA.
- **Attacker trace:** Virtual-office operator creates additional commercial KYC records (name, ID, billing) beyond the institutional address.
- **Caveat:** Only needed if the host lab address is unavailable or the attacker wants to avoid lab-level package handling.

---

### Measure 4: Research & entity signals

**Binding?** No. The host university's institutional signal dominates any individual-level check. Early-career researchers routinely lack strong personal publication footprints — the hypothetical rejection rate under strict enforcement would be 20–40% ([NSF SED](https://ncses.nsf.gov/pubs/nsf24300/report); [PubMed ambiguity rate](https://pmc.ncbi.nlm.nih.gov/articles/PMC11588201/)), so providers treat Measure 4 as a soft signal bundle rather than a gate. Actual operating false-negative rate is effectively ~0%.

**False-negative rate.** 20–40% hypothetical under strict personal-publication enforcement; ~0% actual because providers cannot enforce without blocking a large fraction of legitimate early-career customers. Irrelevant for this branch.

**Bypass methods.**

**Option 1 — Piggyback on host-lab publication trail / institution signal dominance:**
- The host university's entity footprint (publications, grants, institutional standing) passes any provider review. The attacker inherits this by association.
- **Expertise:** Aspirant — free signal.
- **Cost:** $0.
- **Lead-up time:** Immediate.
- **Attacker trace:** Institutional signal is the host's, not the attacker's — adds no personal attribution.

**Option 2 — Self-asserted ORCID with host-university affiliation:**
- Attacker creates an ORCID profile and self-asserts affiliation with the host university. As of 2023, ~2% of ORCID records have institution-verified affiliations; the vast majority are self-asserted ([ORCID](https://info.orcid.org/a-closer-look-at-orcids-affinity-for-affiliations/)).
- **Expertise:** Aspirant — web form.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** ORCID profile in attacker's real name linked to the real host university. Persists indefinitely.

**Option 3 — LLM-assisted draft methods paper:**
- Attacker drafts a methods paper with LLM assistance, consistent with the collaboration pitch used in the upstream sub-chain.
- **Expertise:** Novice — domain literacy + LLM prompting.
- **Cost:** $0–$240 (Claude/GPT-4 subscription over 2–3 months). When the same paper serves as both the upstream pitch anchor and the Measure 4 signal, this cost is already included in the upstream sub-chain total — do not double-count.
- **Lead-up time:** 2–8 weeks of iterative drafting (overlaps with upstream sub-chain).
- **Attacker trace:** Any preprint or posted paper is permanently archived with attacker's name.

**Option 4 — Author name-collision exploitation:**
- With 55%+ of PubMed author names shared by different researchers ([PubMed](https://pmc.ncbi.nlm.nih.gov/articles/PMC11588201/)), the attacker may passively benefit from name collisions during provider review.
- **Expertise:** Aspirant — passive benefit.
- **Cost:** $0.
- **Lead-up time:** Immediate.
- **Attacker trace:** None incremental.

**Option 5 — Real minor footprint (preprint):**
- Attacker posts a real preprint on bioRxiv (free; [bioRxiv FAQ](https://www.biorxiv.org/about/FAQ)) to establish a minimal personal publication record.
- **Expertise:** Novice — requires pre-existing or LLM-assisted domain knowledge.
- **Cost:** $0 (preprint servers) to $2,000 (if pursuing a real journal open-access publication — though Nature Communications APCs run $7,350; [Nature Communications](https://www.nature.com/ncomms/open-access)).
- **Lead-up time:** 1–2 weeks from draft to posted (preprint).
- **Attacker trace:** Publication permanently archived with attacker's name.

---

### Measure 5: Payment integrity

**Binding?** No. The attacker uses a personal card in their own real name, matching the verified identity. Institutional PO or p-card is also available if the sponsor coordinates.

**False-negative rate.** <2% of legitimate customers blocked when using a consistent personal card matching the verified identity. Cross-border transactions face reduced authorization rates ([Stripe](https://stripe.com/resources/more/cross-border-payments-explained)), but the scoped attacker is US-resident.

**Bypass methods.**

**Option 1 — Personal card in attacker's real name:**
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Zero.
- **Attacker trace:** Real card linked to real billing address and real bank KYC chain.

**Option 2 — Institutional PO / departmental account:**
- Attacker coordinates with sponsor or lab admin for each order.
- **Expertise:** Novice — requires per-order coordination.
- **Cost:** $0 (uses host institution's funds).
- **Lead-up time:** Hours to days per order.
- **Attacker trace:** Host institution's accounts-payable records tie the order to a lab project number, persisting 7–10 years in the university's financial system.
- **Cross-measure dependency:** Deepens sponsor involvement — useful if it reinforces the "legitimate collaborator" narrative, but adds institutional witnesses.

**Option 3 — Institutional p-card issued to visiting scholar:**
- **Expertise:** Novice — one-time sponsor sign-off.
- **Cost:** $0.
- **Lead-up time:** Multi-week issuance process at most R1s ([U-Michigan Procurement — P-Card](https://procurement.umich.edu/u-m-employees/purchasing/pcard/)).
- **Attacker trace:** P-card issuance records tie the attacker to institutional finance system.

---

## Matrix B (SOC orders — adds on top of Matrix A)

### Measure 6: Identity verification — IAL2

**Binding?** No. Real face, real ID, real liveness — passes natively at any tier. The attacker authenticates as themselves; there is no technical bypass.

**False-negative rate.** 5–15% first-attempt failures; 2–5% post-retry. Face capture and liveness detection are the modal failure modes for legitimate users ([Persona](https://withpersona.com/blog/identity-verification-pass-rate-metrics); [Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets); [NIST SP 800-63A IAL2](https://pages.nist.gov/800-63-3-Implementation-Resources/63A/ial2remote/)).

**Bypass methods.** None needed.

- **Attacker trace:** Biometric template (face) permanently committed to the IDV vendor's records, typically retained for the duration of the commercial relationship plus 5–7 years. Linked to the real government document image. This is the hardest single attribution artifact to repudiate in this branch.

---

### Measure 7: MFA + re-authentication

**Binding?** No. The attacker enrolls their own device and authenticates with their own TOTP or passkey. Authentication failure rates of 2–5% per session for legitimate users are driven by out-of-date software, not security friction ([Duo 2024 Trusted Access Report](https://duo.com/resources/ebooks/2024-duo-trusted-access-report)); <1% hard-block after recovery.

**False-negative rate.** 2–5% transient failures per session; <1% hard-block.

**Bypass methods.** None needed.

- **Attacker trace:** Device fingerprint, IP, MFA factor registration time, and factor type logged per session. Ties provider sessions to the attacker's operational device.

---

### Measure 8: Vouching by registered contact

**Binding?** Yes — structurally required, low friction, high attribution. This is the only measure that forces another human into the loop, making it the most structurally significant control. But the friction is almost entirely attributional rather than preventative.

**False-negative rate.** 5–15% of legitimate SOC orders experience vouching delay; 1–3% ultimately fail due to voucher unavailability or refusal. By analogy to multi-party enterprise procurement approval workflows, 3–8% of requests are delayed >48 hours due to approver unavailability (best-guess — no synthesis-specific data).

**Bypass methods.**

**Option 1 — Faculty sponsor as registered voucher:**
- The sponsor who granted the visiting appointment registers as the second contact and approves SOC orders. The attacker frames orders as collaborative work aligned with the original pitch.
- **Expertise:** Novice — social engineering of a consenting party who has already agreed to the collaboration.
- **Cost:** $0 marginal beyond the upstream cost of recruiting the sponsor.
- **Lead-up time:** Minutes per order (registration once; click-approve per order). If the sponsor must first onboard with the provider: 30–60 minutes of sponsor time + the provider's IAL1/IAL2 flow (days to a week).
- **Attacker trace:** Sponsor's identity, MFA device, IP, and approval timestamp logged per order. The sponsor becomes a named witness on every approved order. High attribution for both parties.
- **Key uncertainty:** The sponsor may balk at specific SOC sequences outside the stated collaboration scope.
- **Cross-measure dependency:** Reuses the same social relationship established in the upstream sub-chain. The sponsor's willingness to vouch is downstream of the pitch quality — a weak pitch means both the appointment and the vouching are at risk.

**Option 2 — Lab manager / departmental administrator as voucher:**
- Sponsor delegates day-to-day ordering approval to a lab manager or admin, who registers as the second contact.
- **Expertise:** Novice — routine administrative delegation.
- **Cost:** $0.
- **Lead-up time:** Minutes per order.
- **Attacker trace:** Sponsor's provider account is the approver-of-record, but the lab admin is the human actor — creating ambiguous attribution between sponsor (nominally responsible) and admin (actually clicked).

**Option 3 — Second lab member:**
- A second member of the sponsor's lab registers as voucher.
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** Minutes per order.
- **Attacker trace:** Second lab member's identity logged. Creates a third institutional witness.

**Option 4 — Second faculty sponsor:**
- Attacker recruits a second faculty sponsor at the same or a different institution.
- **Expertise:** Practitioner — doubles the upstream pitch effort and requires a coherent second research narrative.
- **Cost:** $0 marginal, but the upstream sub-chain effort roughly doubles.
- **Lead-up time:** Months (a second full pitch cycle).
- **Attacker trace:** Two independent sponsor identities committed. Broadens the institutional paper trail.
- **Caveat:** Only necessary if the primary sponsor is unwilling to vouch or if the attacker wants redundancy.

---

### Measure 9: Biosafety documentation

**Binding?** Partially — lighter than it appears due to the public-IBC-lookup option, but availability is conditional on host-institution IBC disclosure practices. Baseline enforcement is loose enough that the measure is more paperwork-friction than gate ([measures-in-practice.md](../../measures-in-practice.md) notes biosafety verification is "sparse in current practice").

**False-negative rate.** 10–25% of legitimate customers experience biosafety-documentation friction (wrong form, missing signature, outdated protocol number); <5% hard-block after back-and-forth. No public data on legitimate-user biosafety-documentation rejection rates at synthesis providers (best-guess).

**Bypass methods.**

**Option 1 — Public IBC protocol number lookup:**
- At the ~25–50% of US R1s that publish per-protocol detail (protocol number + lab/PI + organism category), the attacker finds the host lab's IBC protocol number from publicly accessible IBC pages ([NIEHS](https://www.niehs.nih.gov/about/boards/ibc); [UNC EHS](https://ehs.unc.edu/committees/ibc/); [UMich](https://research-compliance.umich.edu/institutional-biosafety-committee-ibc); [UIC](https://research.uic.edu/compliance/ibc/); [UW EHS](https://www.ehs.washington.edu/biological/biological-research-approval/institutional-biosafety-committee-ibc)). NIH OSP requires IBCs to make meeting minutes publicly available upon request ([NIH OSP April 2024 FAQs](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/)).
- **Expertise:** Aspirant — web scraping or manual search.
- **Cost:** $0.
- **Lead-up time:** Minutes to hours.
- **Attacker trace:** Real IBC protocol number on file at the provider, linked to the real host lab. Creates a cross-reference to institutional biosafety records.
- **Caveat:** Coverage is conditional — roughly 25–50% of R1s publish enough detail (best-guess from manual sampling of 10 top-50 R1 IBC pages). At the remaining ~50–75%, this option is unavailable.

**Option 2 — Sponsor-asked IBC claim:**
- Attacker asks the sponsor to forward or identify the relevant IBC protocol number. One moderately uncomfortable social-engineering ask.
- **Expertise:** Novice.
- **Cost:** $0 (uses sponsor's time).
- **Lead-up time:** Hours to days (sponsor's response time + document retrieval).
- **Attacker trace:** Sponsor's email forwarding the document is in the attacker's inbox and may be subpoenable from either side.
- **Key uncertainty:** The sponsor may balk — this is the one KYC-side friction that could plausibly stop a first order, but only when (a) the public lookup is unavailable and (b) the sponsor refuses the ask.
- **Cross-measure dependency:** Deepens the sponsor relationship further. If the sponsor already vouches (Measure 8), the incremental social cost of asking for an IBC number is low.

**Option 3 — BSL-1/BSL-2 blanket facility coverage:**
- Attacker cites the host institution's public facility-level biosafety approval rather than a specific protocol.
- **Expertise:** Aspirant — cite public facility information.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** Reference to institutional facility approval on file.

**Option 4 — "In-progress" escape hatch:**
- Some providers accept an "IBC application in progress" attestation for a first order.
- **Expertise:** Aspirant — pass-through.
- **Cost:** $0.
- **Lead-up time:** Immediate.
- **Attacker trace:** Self-attestation logged; no document to verify.
- **Caveat:** Provider-dependent and only valid for a first order.

**Option 5 — Real IBC amendment adding visitor:**
- Attacker is formally added to the host lab's IBC protocol through the institution's real amendment process.
- **Expertise:** Novice — real institutional process.
- **Cost:** $0–$500 (possible institutional processing fees).
- **Lead-up time:** 2–8 weeks (committee meeting cycles at most R1s are monthly).
- **Attacker trace:** Attacker's real name appears on a real institutional IBC protocol, persisting indefinitely in the university's biosafety records. This is the highest-durability attribution artifact in the branch.

**Option 6 — Fabricated IBC documentation:**
- Attacker forges IBC approval letters.
- **Expertise:** Practitioner — document forgery that must survive provider review.
- **Cost:** $100–$1,000 if using a freelance forger.
- **Lead-up time:** Days to weeks.
- **Attacker trace:** Forged document on file; fails if provider cross-checks with the institution's biosafety office.
- **Caveat:** Discouraged path — inconsistent with the branch's defining advantage (everything else is genuine). Detection risk is higher than for other options.

**Biosafety path selection.** The cheapest Measure 9 variant depends on host-institution IBC disclosure practice. At the ~25–50% of R1s that publish per-protocol detail, Option 1 costs $0 and minutes. At the remaining ~50–75%, the cheapest fallbacks are Option 2 (sponsor-asked, $0, hours–days, one social-engineering ask with modest risk of sponsor balking) or Option 4 (in-progress escape hatch, immediate but provider-dependent and first-order-only).

---

## Matrix B synthesis

**Cheapest end-to-end path.** All cost is in the upstream sub-chain ($0–$3,000 + 2–4 months + 40–120 hours). Once the appointment issues, every KYC measure adds $0 in marginal cost and minutes in marginal time:

| Stage | Action | Marginal cost | Marginal time |
|---|---|---|---|
| Upstream sub-chain | Pitch, sponsor agreement, institutional processing | $0–$3,000 | 2–4 months |
| IAL1 | Own real ID | $0 | minutes |
| Affiliation | Real `.edu` email, inbox verify | $0 | minutes |
| Registry/shipping | Attach to existing org; ship to host lab | $0 | minutes |
| Research signals | ORCID self-assert + institution piggyback | $0 | minutes |
| Payment | Personal card, real billing address | $0 | minutes |
| IAL2 | Own face + liveness | $0 | minutes |
| MFA | Own TOTP/passkey | $0 | minutes |
| Vouching | Sponsor (or lab admin delegate) click-approve | $0 | minutes per order |
| Biosafety | Public IBC lookup (25–50% of R1s) OR sponsor-asked / in-progress escape hatch | $0 | minutes–hours (public lookup) / hours–days (sponsor-asked) |
| **Total Matrix B** | | **$0–$3,000** | **~2–4 months (upstream-dominated); +0–3 days if biosafety falls back to sponsor-asked** |

**Per-successful-order amortized cost (persistence variant, 5–10 SOC orders over 6–12 month appointment):** $0–$600 per order, dominated by amortized upstream cost.

**Which measures do the most work.** Three measures (3 registry/shipping, 8 vouching, 9 biosafety) are at least partially binding, but none imposes meaningful marginal dollar cost. The binding is attributional (Measure 8) or procedural (Measures 3, 9) rather than financial. The KYC stack's contribution against this branch flows through two channels:

1. **Trace** — every datum on file is authentic: real name, real DOB, real government ID, real biometrics, real `.edu`, real host institution, real faculty sponsor, real directory listing, real lab address, real personal card. Provider-side retention is 5+ years; host-institution records persist 7+ years. This is the highest-attribution Matrix A/B path in the fake-affiliation profile. The attacker's bet is non-investigation, not non-attribution.
2. **Vouching (structural)** — the only measure that forces an unwitting third party into the chain, creating a named institutional witness per SOC order. Detection probability depends entirely on whether the sponsor scrutinizes order content against the stated collaboration scope.

**The one residual KYC-side friction that could plausibly stop a first order** is Measure 9 biosafety — and only when the IBC protocol number is not publicly listed (~50–75% of R1s) and the sponsor balks when asked to forward it.

**Defenses that actually matter for this branch** lie substantially outside the KYC stack: (1) the host institution's visiting-scholar vetting at the upstream sub-chain (pitch credibility, reference calls, anchor-artifact scrutiny); (2) export-control / Visual Compliance screening — hard stop for sanctioned-jurisdiction attackers, no effect on the scoped US-resident attacker; (3) the sponsor's domain-expert judgment at the first SOC order; (4) provider-side behavioral anomaly detection on the "newly-minted visiting scholar, fast time-to-SOC, sponsor-voucher coupling, no prior order history" pattern.
