# Stage 9 Detailed Table — Branch D: Shell Company with Real Employees

This document distills the researched column for the shell-company branch into a per-measure reference. Only measures where the researched column found a binding role for this branch are analyzed in depth; other mandatory measures are noted as non-binding at the top of their section. Source URLs from the research column are preserved inline.

---

## Matrix A Measures (applies to all orders)

### Measures 1, 3, 5 (IAL1, Institutional affiliation, Org registry + verified shipping address)

**Binding assessment:** Not binding for this branch. The attacker and any associates use their own real government IDs (IAL1 passes authentically), the shell company is genuinely registered in Delaware with a real business address and bank account (org registry and verified shipping pass), and the company's own domain email satisfies institutional affiliation. The branch's entire premise is to walk these checks through as a genuine entity with real people, committing real identities rather than forging them.

**False-negative rate:** Not meaningful here — the branch doesn't interact with the failure modes of these measures.

**Bypass methods:** None needed. These measures are satisfied by construction.

### Measure 4: Research & Entity Signals (the binding Matrix A measure for this branch)

**Binding assessment:** Binding. A newly-incorporated LLC with no publications, no grants, no regulatory filings, and no order history is exactly the signal profile Measure 4 is designed to flag. The attacker must actively produce entity signals — web presence, lab space, preprints, order history, domain age — that approximate a real small biotech.

**False-negative rate:** High and structurally hard to reduce. Roughly 40% of new biopharma assets launched 2018-2023 came from companies with little commercialization experience ([McKinsey](https://www.mckinsey.com/industries/life-sciences/our-insights/small-but-mighty-priming-biotech-first-time-launchers-to-compete-with-established-players)). Best guess: 20-40% of synthesis provider customers at any given time are thin-signal entities (startups under 2 years old, small CROs, consulting firms) that would be indistinguishable from a well-constructed shell on paper. Aggressive tightening creates unacceptable false-positive rates on real small biotechs.

---

#### Bypass method 1: Build entity signals from scratch

**What the attacker does:** Incorporates a Delaware LLC, gets an EIN and DUNS number, rents either a virtual office or a co-working lab bench in a biotech hub (Boston, San Diego, RTP, Bay Area), stands up a professional website and LinkedIn profiles, posts one or two bioRxiv preprints, and places routine non-sequence-of-concern orders for several months to build a purchasing track record before attempting a sequence-of-concern order.

**Expertise:** STIX **intermediate** — someone who can plan and execute a multi-month setup using commercially available services (registered agents, co-working labs, web hosting) and has enough biotech fluency to make the cover look like a real small biotech. No custom tools or advanced tradecraft.

**Cost:**
- **Virtual-office tier:** ~$5-15K initial + $500-2K/month ongoing. All-in over the 9-month credibility window: **~$10-30K.**
- **Lab-bench tier:** ~$8-20K initial + $2.5-5.5K/month ongoing. All-in over 9 months: **~$30-70K.**

Component costs: Delaware LLC formation $300-500 ([LLCUniversity](https://www.llcuniversity.com/delaware-llc/costs/)); annual franchise tax $300; EIN free; DUNS free (8-30 days) or $229 expedited ([D&B](https://www.dnb.com/en-us/smb/duns/get-a-duns.html)); virtual office $50-300/mo ([Alliance Virtual Offices](https://www.alliancevirtualoffices.com/virtual-office-blog/virtual-office-costs/)); co-working lab bench $2-5K/mo ([Excedr](https://www.excedr.com/blog/how-much-does-lab-space-cost), [BioLabs San Diego](https://coworkingmag.com/united-states/biolabs-san-diego/)); professional website $3-8K one-time ([GoodFirms](https://www.goodfirms.co/resources/website-construction-cost-survey)); aged domain $100-2,000 if the attacker wants to compress the domain-age waiting period; LinkedIn profiles free (no verification — [NPR](https://www.npr.org/2022/03/27/1088140809/fake-linkedin-profiles)); bioRxiv preprints free, live within 72 hours ([bioRxiv](https://www.biorxiv.org/about/FAQ)); initial non-SOC orders $500-2K.

**Lead-up time:** **6-12 months** to first sequence-of-concern order. The critical path is order-history building plus domain/entity age; these run **in parallel**, not sequentially. Pure administrative setup (LLC, EIN, bank, website, lab lease) takes 2-4 weeks. LLC formation can be same-day expedited ([IncNow](https://www.incnow.com/faq/long-formation-process-take/)).

**Attacker trace:** Fully exposed in the branch's own frame, but with a critical privacy layer. Delaware LLC formation is public record (name, registered agent, formation date), and the business address, bank account, and provider accounts are all tied to real identities. However, Delaware does not require listing members or managers ([UpCounsel](https://www.upcounsel.com/delaware-llc-privacy)), and as of **March 26, 2025** the Corporate Transparency Act no longer requires domestic entities to report beneficial ownership to FinCEN ([FinCEN](https://www.fincen.gov/news/news-releases/fincen-removes-beneficial-ownership-reporting-requirements-us-companies-and-us)). With a nominee registered-agent structure, the attacker's name need not appear on any public filing unless a court compels disclosure ([CitizenX](https://citizenx.com/insights/anonymous-llc-states/)). The identities of the people who interact with providers are still on file with the providers themselves.

**Key uncertainty:** The order-history building window is an analytical estimate, not a directly sourced figure. Providers do not publish the thresholds at which a new customer becomes "seasoned."

**Cross-measure dependencies:** The 6-12 month Measure 4 window is the dominant cost driver for the branch. Measure 8 (second shell entity) and Measure 9 (biosafety setup) both fit inside this window in parallel and do not extend the timeline.

---

#### Bypass method 2: Acquire an existing company

**What the attacker does:** Buys an existing biotech/consulting entity from a business brokerage (e.g., Acquire.com), inheriting its formation history, aged domain, and — in the premium version — live synthesis-provider accounts and order history.

**Expertise:** STIX **intermediate.** Same operational planning as building from scratch, plus business-acquisition negotiation. Brokerages handle the mechanics; domain expertise is still required to operate the acquired entity convincingly.

**Cost and timeline split into two distinct scenarios:**

**(a) Dormant / micro-CRO acquisition (cheap tier):** **$50-100K** for a dormant or micro biotech consulting firm or small CRO with under $1M revenue, based on typical 1-3x revenue multiples for service businesses (best guess). The attacker gets formation history, aged domain, possibly legacy customer references — but typically no active provider accounts. **Time to first SOC order: ~8-14 months** (4-12 weeks to close + 2-4 weeks ownership transfer + 6-12 months of provider-account building and aging, comparable to build-from-scratch).

**(b) Going-concern with live provider accounts (premium tier):** **$150-300K+**. Provider accounts "are not typically listed as assets in business sales," so identifying targets requires diligence beyond brokerage listings and sellers command a premium. For reference, a biotech/pharma consulting firm with ~$10M revenue and $1.7M EBITDA was listed in 2024 ([American Healthcare Capital](https://americanhealthcarecapital.com/listing/pacs1b/)) — far above the $300K floor. The premium-tier figure is a best guess. The attacker gets live provider relationships and established entity signals. **Time to first SOC order: ~3-6 months** (close + transfer + modest ramp before escalating to SOC-adjacent orders).

**Attacker trace:** The acquisition transaction creates a paper trail (purchase agreement, ownership-transfer filings) that build-from-scratch avoids, but the entity's pre-existing history provides cover. Net exposure depends on whether the attacker buys directly or through a holding entity.

**Key uncertainty:** The premium-tier price is a labeled best guess. Going-concerns with transferable live provider accounts are not listed openly, so there is no market data.

**Cross-measure dependencies:** Scenario (b) is the only path in the branch that compresses the Measure 4 timeline below 6 months; scenario (a) does not, because provider accounts must still be aged.

---

## Matrix B Measures (SOC orders only)

### Measures 2, 6, 7 (IAL2, Step-up re-auth, MFA)

**Binding assessment:** Not binding for this branch. The attacker and associates use their real government IDs, so IAL2 selfie/liveness passes authentically. MFA and step-up re-authentication are trivially satisfied because the accounts belong to real people with real phones and security keys. The cost of these measures to this branch is zero.

**False-negative rate:** Not relevant to this branch.

**Bypass methods:** None needed.

---

### Measure 8: Vouching by Registered Contact (cross-organizational variant)

**Binding assessment:** Binding **if** providers require the voucher to be at a different registered organization. The shell company can trivially self-vouch between its own employees, so without the cross-org requirement this measure collapses. With the cross-org requirement, the attacker must manufacture a connection to a second organization.

**False-negative rate:** No source found (searched for "vouching false positive rate synthesis provider order approval"); this is a proposed, not deployed, measure. Best guess: **5-15%** of legitimate small or new entities (community labs, very early startups, international customers without US institutional connections) would struggle to find a cross-org voucher. This is a structural friction point for the measure itself.

#### Bypass method 1: Establish a second shell entity

**What the attacker does:** Sets up a second virtual-office-tier shell entity — incorporated separately, with different nominal personnel — whose only purpose is to exist as a "registered organization" that can vouch for the primary entity.

**Expertise:** STIX **intermediate.** Same skills as the first shell, duplicated.

**Cost:** A second virtual-office-tier entity: **~$5-15K initial + $500-1,500/month ongoing**, additive to the primary entity's cost. The second entity doesn't place orders, so it only needs to exist — not run a lab bench.

**Lead-up time:** **Zero if started in parallel** with the first entity; adds 3-6 months if started afterwards.

**Attacker trace:** Two separate entities with overlapping ownership or personnel create a potentially detectable pattern if the provider cross-checks vouching relationships against business registry data. With nominee structures in different jurisdictions, the link may not be visible.

**Cross-measure dependencies:** Parallelism with Measure 4 only works if the attacker plans both entities from the start; retrofitting adds months.

#### Bypass method 2: Recruit an external voucher

**What the attacker does:** Identifies and pays someone at a legitimate institution to act as a vouching contact — an approach that overlaps with the insider-recruitment branch (Branch B), except that the voucher only approves, rather than places, orders.

**Expertise:** STIX **intermediate.** Requires social engineering skill to identify and recruit.

**Cost:** **$1,000-5,000 per vouching event**, or a retainer. Best guess, based on Branch B insider payment estimates.

**Lead-up time:** 2-8 weeks to identify and recruit. Best guess.

**Attacker trace:** **Highest-attribution component of this measure's bypass.** The external voucher is a human link who knows the attacker (or an intermediary) and can identify them under later questioning.

#### Bypass method 3: Social engineering of provider staff

**What the attacker does:** A scientifically credible front person — ideally already on staff at the shell — talks past compliance staff in a phone or email exchange, relying on domain fluency in biosafety and research to make the vouching requirement bend or be waived.

**Expertise:** STIX **intermediate to advanced.** Requires real biosafety and research fluency to be convincing.

**Cost:** Negligible if the shell already has a scientifically credentialed front person. Otherwise ~$500-2,000 to hire a consultant for a single call (best guess).

**Lead-up time:** Minutes to hours for the interaction itself, assuming the shell entity is already established and has a credible narrative.

**Attacker trace:** Provider call logs and email records create an auditable trail; the front person's identity is exposed.

**Cross-measure dependencies:** Depends on the shell already having a scientifically credible front person — which may be supplied by Measure 9 Method 7 (unwitting scientist hire).

---

### Measure 9: Biosafety Documentation

**Binding assessment (post-research reassessment):** Measure 9 is **formally binding** — providers can decline to ship sequence-of-concern orders without biosafety documentation — but **functionally cheap and fast** for this branch. A private company that does not receive NIH funding has no legal obligation to hold a CBSP credential or register an IBC with NIH, and the branch has multiple low-cost paths to produce documentation (self-constituted IBC in 1-2 months for a few thousand dollars, or genuine third-party IBC review for $3-10K on a 2-3 month timeline). Combined with the 30-50% legitimate-customer false-negative rate, providers cannot tighten this measure substantially without blocking large numbers of real small-biotech customers. Net effect: Measure 9 does not meaningfully gate the shell-company branch.

**False-negative rate:** NIH IBC registration requirements apply only to NIH-funded institutions ([NIH OSP FAQ, April 2024](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/)), and there is no centralized public registry for private-entity IBCs. Best guess: **30-50%** of legitimate private-sector synthesis customers (small CROs, consulting firms, international companies) cannot produce IBC documentation that is independently verifiable by the provider.

#### Method 1: Fabricated IBC documents

**What the attacker does:** Creates a fake letterhead and an "IBC approval" letter listing committee members — either invented or real names used without consent.

**Expertise:** STIX **amateurish to intermediate.** Trivial to produce; harder to make survive scrutiny.

**Cost:** Near zero.

**Lead-up time:** Days.

**Attacker trace:** High if audited — fabricated names are discoverable through basic verification calls; real names used without consent create legal exposure and a witness who can identify the attacker.

**Key risk:** Fails catastrophically if the provider calls a listed committee member. University IBC audit procedures exist ([UTK Biosafety](https://biosafety.utk.edu/biosafety-program/ibc/ibc-charter-and-bylaws/ibc-audit-sop/)) but apply to the institution's own labs, not provider-side customer verification. Best guess: provider-side initial detection is low, but rises sharply on any follow-up.

#### Method 2: Third-party biosafety service (Advarra, Sabai, Sitero, WCG)

**What the attacker does:** Submits a protocol to a commercial IBC-review firm (Advarra, Sabai Global, Sitero, or WCG) and obtains genuine, independently-issued biosafety documentation. Advarra is the IBC of record for over 1,500 research sites ([Advarra](https://www.advarra.com/review-services/institutional-biosafety-committee-services/), [Sabai](https://sabaiglobal.com/sabai-ibc-services/), [Sitero](https://sitero.com/biosafety/ibc/), [WCG](https://www.wcgclinical.com/solutions/ibc-review/)).

**Expertise:** STIX **intermediate.** Must construct a scientifically plausible protocol that a real biosafety expert will review.

**Cost:** **$3-10K per protocol** for initial review (best guess; pricing not publicly listed, searched for 2024-2025 pricing and found nothing), with ~$1-3K ongoing annual review.

**Lead-up time:** Advarra's review timeline is **10 days or less** from submission ([Advarra](https://www.advarra.com/review-services/institutional-biosafety-committee-services/)). For a shell company starting from scratch, 4-8 weeks including NIH registration support plus protocol preparation. **Total: 2-3 months.**

**Attacker trace:** Low for the entity — the documentation is real. But the review itself is a detection opportunity: the reviewer is an independent expert who may flag concerns about the protocol or the entity.

**Key risk:** The review is genuine, not a rubber stamp. The attacker must produce a protocol that is both scientifically credible AND compatible with their actual intent — a real constraint, not a paper one.

#### Method 3: University affiliation via incubator IBC access

**What the attacker does:** Applies to a university-affiliated incubator (e.g., LabCentral) and then submits a research protocol through that university's IBC.

**Expertise:** STIX **intermediate to advanced.** Must pass a competitive incubator selection and then a real university IBC review.

**Cost:** **$3-8K/month** for incubator/lab space. LabCentral bench was $4,600/mo as of 2019 ([STAT News](https://www.statnews.com/2019/03/06/labcentral-bench-startups-kendall/)), with a 25%+ reduction announced for 2026 ([LabCentral](https://www.labcentral.org/apply-for-space/process-criteria)). BioLabs memberships start at $400/mo per-person and $2,200/mo per-bench ([BioLabs](https://www.biolabs.io/featuresandfees), [Coworking Mag](https://coworkingmag.com/united-states/biolabs-san-diego/)). University IBC fees are typically bundled; some may charge $500-2K per protocol (best guess).

**Lead-up time:** 2-6 months from application to residency (best guess; no published acceptance rates), plus 4-8 weeks for IBC protocol review. **Total: 3-9 months.**

**Attacker trace:** Low for the entity itself, but the incubator relationship and IBC review create real institutional records, and IBC members become potential witnesses.

**Key constraint:** LabCentral limits applicants to companies with under $10M raised and under $3M trailing 12-month revenue ([LabCentral](https://www.labcentral.org/apply-for-space/process-criteria)). Compatible with a shell-company profile, but the attacker cannot overcapitalize the entity.

#### Method 4: Jurisdiction shopping

**What the attacker does:** Incorporates and operates in a jurisdiction whose biosafety requirements are effectively nil for unfunded private entities — which, per the research, is essentially everywhere: NIH IBC requirements bind only NIH-funded institutions ([NIH OSP FAQ](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/)).

**Expertise:** STIX **intermediate.**

**Cost:** Comparable to build-from-scratch baseline; potentially lower monthly costs outside biotech hubs.

**Lead-up time:** Similar to baseline.

**Attacker trace:** An unusual jurisdiction (no biotech hub) may itself be a flag during provider review (best guess), but many legitimate small biotechs operate in lower-cost areas.

**Key finding:** Jurisdiction shopping in this branch is less about finding weak states and more about the baseline reality that no jurisdiction mandates IBC for unfunded private entities.

#### Method 5: Claim exemption

**What the attacker does:** Argues to the provider that the order does not require IBC review — e.g., "non-recombinant application," "computational validation only," "diagnostic positive control."

**Expertise:** STIX **amateurish to intermediate.** Enough domain knowledge to construct a plausible exemption argument.

**Cost:** Zero incremental.

**Lead-up time:** Zero incremental.

**Attacker trace:** The exemption claim is documented in provider records. If the ordered sequences are later found to be inconsistent with the claimed exemption, this creates strong evidence of deception.

**Key tension:** If the order IS for a sequence of concern, claiming exemption either requires lying about what the order contains (a separate deception) or arguing the end-use doesn't require IBC review — plausible only for edge cases. Weak for most SOC-relevant threat scenarios.

#### Method 6: BSO training + self-constituted IBC

**What the attacker does:** Has a designee complete ABSA's 1-week BBTC course (and free/cheap online biosafety courses), recruits two unpaid community members plus additional volunteers to meet NIH Guidelines IBC composition (minimum 5 members including 2 unaffiliated community representatives — [NIH OSP FAQ](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/)), and self-designates a BSO without the CBSP credential.

**Expertise:** STIX **intermediate to advanced.** Note that ABSA's CBSP actually requires 3-6 **years** of post-baccalaureate biosafety experience ([ABSA CBSP requirements](https://absa.org/cbsp/), [EHS Careers](https://ehscareers.com/employer-blog/cbsp-certified-biosafety-professional-career-guide/)) — so CBSP from scratch is impractical. The feasible version is self-designation without CBSP, which private companies not receiving NIH funding can legally do.

**Cost:** **~$3.5-4K all-in.** ABSA BBTC is $3,125-3,400 for the 1-week course ([ABSA BBTC](https://absa-bbtc.org/)); online courses $0-500 ([FutureLearn](https://www.futurelearn.com/courses/biosecurity), [CITI](https://about.citiprogram.org/series/biosafety-and-biosecurity-bss/)); community IBC members $0.

**Lead-up time:** **1-2 months** (1-2 weeks BBTC + 2-4 weeks to recruit community members). Much faster than the analytical assessment's original "3-6 months" if CBSP is not pursued.

**Attacker trace:** Moderate. IBC membership list, minutes, and BSO training records are discoverable; community members are potential witnesses. All documentation is formally legitimate — the deception is in review quality, not existence.

**Cross-measure dependencies:** Fits entirely inside the Measure 4 window.

#### Method 7: Hire an unwitting scientist

**What the attacker does:** Hires a real scientist into a legitimate-looking role at the shell company. The scientist believes they are doing real research and serves as the credentialed front for protocol submissions, IBC interactions, and provider vouching — while the attacker controls research direction.

**Expertise:** STIX **advanced.** Intelligence tradecraft: managing an unwitting asset over months while framing sequence-of-concern orders within a credible research program.

**Cost:** Scientist I biotech role averages $105,262/yr as of April 2025, with most earning $92,796-$118,761 ([Salary.com](https://www.salary.com/research/salary/benchmark/scientist-i-biotech-salary)). Add $20-40K/yr benefits and overhead for a **loaded cost of ~$100-190K/yr** (best guess).

**Lead-up time:** 4-12 weeks for recruitment and onboarding + familiarization time. **Total: 2-4 months** from decision to first provider interaction.

**Attacker trace:** Very low for the attacker personally. The unwitting scientist is the visible face of the company; the attacker's exposure is limited to employment records (structured through the LLC). The scientist becomes the primary witness if investigated, and their genuine belief in legitimacy makes them a credible front during routine scrutiny.

**Cross-measure dependencies:** Shares the Measure 4 window; also supplies the scientifically credible front person that Measure 8 Method 3 (SE of provider staff) and Measure 9 Method 2 (third-party biosafety review) rely on to look credible.

---

### Sequence Screening (co-binding control)

**Binding assessment:** Binding for sequence-of-concern orders in the sense that screening is the last layer between the attacker and the material. This branch's Measure 4 credibility doesn't bypass screening — it changes how a flagged order is handled during manual review, because the reviewing analyst sees an established entity rather than a new one.

**False-negative rate:** IGSC sequence screening flags ~**2% of all screened orders** for manual review as of 2024 ([PMC/Screening State of Play](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319849/), [NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK584258/)). Future rates could be reduced by excluding housekeeping genes and conserved sequences ([PMC/Practical Questions](https://pmc.ncbi.nlm.nih.gov/articles/PMC11447131/)). For legitimate researchers ordering sequence-of-concern-adjacent sequences, best guess: **20-50% of legitimate SOC-adjacent orders trigger a manual-review flag.**

#### Bypass: Gradual order escalation + protocol framing

**What the attacker does:** Orders non-concerning sequences for months to build a normal-looking purchasing pattern, then introduces flagged orders framed within a defensible research narrative consistent with the company's stated program.

**Expertise:** STIX **advanced.** Requires deep domain expertise about legitimate research program ordering patterns, knowledge of which sequences will trigger screening, and scientific fluency for the justification narrative.

**Cost:** No incremental cost beyond the order-history building already required for Measure 4. Orders at standard prices ($0.07-0.30/bp for gene fragments).

**Lead-up time:** 6-12 months of legitimate ordering — the **same timeline as Measure 4**, not additive.

**Attacker trace:** Every order is in provider records; the benign-to-SOC escalation pattern is visible in retrospective analysis. Cross-provider ordering patterns may be detectable by IGSC member companies, which together represent a majority of commercial gene synthesis capacity worldwide ([IGSC](https://genesynthesisconsortium.org/), [Harmonized Screening Protocol v3.0, Sept 2024](https://genesynthesisconsortium.org/wp-content/uploads/IGSC-Harmonized-Screening-Protocol-v3.0-1.pdf)).

**Cross-measure dependencies:** Runs inside Measure 4's window and depends on the same credibility assets.

#### Bypass: Sequence fragmentation (split orders across providers)

**What the attacker does:** Splits a sequence-of-concern into fragments that individually pass screening, ordered from multiple providers, then assembles them in-house using standard molecular-biology methods (Gibson assembly, restriction digestion).

**Expertise:** STIX **advanced to expert.** Requires knowledge of screening algorithm thresholds, ability to design fragments that evade screening but reassemble, and hands-on molecular biology skills.

**Cost:** Best guess 2-3x the cost of a single intact order, due to overlap regions, extra cloning, and QC.

**Lead-up time:** No additional lead-up beyond entity setup; fragmentation design takes days to weeks.

**Attacker trace:** Split orders create records at multiple providers. If cross-provider coordination (IGSC or a centralized mechanism) is operational, the pattern of related fragments ordered by the same entity is detectable. The Sept 2024 OSTP Framework targets a 50 bp minimum screening length; a March 2025 bioRxiv preprint showed commercial screening tools detected obfuscation when at least one fragment was ≥50 bp ([bioRxiv, March 2025](https://www.biorxiv.org/content/10.1101/2025.03.12.642526v1.full), [OSTP Framework, Sept 2024](https://aspr.hhs.gov/S3/Documents/OSTP-Nucleic-Acid-Synthesis-Screening-Framework-Sep2024.pdf)). The OSTP framework names split-order detection as a screening requirement but uses "may" rather than "shall" ([Council on Strategic Risks, May 2024](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/)). Active regulatory development.

#### Bypass: Benchtop synthesis (circumvent provider screening entirely)

**What the attacker does:** Buys a benchtop DNA synthesizer and synthesizes sequences in-house, eliminating provider-side screening as a control.

**Expertise:** STIX **expert to innovator.** Equipment operation plus assembly/verification skills.

**Cost:** **$50K-500K+** for a benchtop DNA synthesizer (best guess based on known pricing for platforms like DNA Script SYNTAX). Likely exceeds the shell company's other setup costs combined.

**Lead-up time:** 4-12 weeks for procurement; weeks to months for operator training.

**Attacker trace:** Equipment purchase is traceable (serial numbers, vendor records). But the synthesis itself occurs in-house with no provider interaction — this converts the threat model from "defeating provider-side screening" to "defeating equipment-side controls," which currently do not exist ([Arms Control Association, Nov 2025](https://www.armscontrol.org/blog/2025-11-24/regulatory-gaps-benchtop-nucleic-acid-synthesis-create-biosecurity-vulnerabilities), [NTI](https://www.nti.org/analysis/articles/benchtop-dna-synthesis-devices-capabilities-biosecurity-implications-and-governance/)). IGSC protocol does not cover benchtop devices.

**Note:** Not specific to this branch — any sufficiently resourced attacker could pursue benchtop synthesis. Included here because the shell company's lab space and institutional cover provide a plausible reason to purchase such equipment.

---

## Integrated observations

**Cheapest Matrix A path:** Build-from-scratch, virtual-office tier. **~$10-30K all-in** over a 6-12 month window. Critical path: order-history building in parallel with domain/entity aging. Administrative setup is 2-4 weeks.

**Cheapest Matrix B path:** Virtual-office build-from-scratch (Measure 4) + self-constituted IBC via Method 6 (Measure 9) + second shell entity for vouching (Measure 8). **Total: ~$20-50K all-in over 6-12 months**, dominated by the Measure 4 window. Measure 9 adds ~$3.5K/1-2 months (or ~$3-10K/2-3 months via third-party IBC) and Measure 8 adds ~$5-15K plus $500-1.5K/month for a parallel second shell. If the attacker expects provider audit of biosafety documentation, the Method 2 third-party IBC route is preferred despite the higher cost.

**FNR correlation note:** The measure-level false-negative rates are correlated, not independent. The same thin-signal entities that fail Measure 4 also fail Measures 8 and 9. The combined Matrix B FNR for legitimate customers is therefore roughly the **max** of components (~30-50%, driven by Measure 9), not the sum.
