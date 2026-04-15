# Detailed table — Biotech incubator tenant

**Branch:** Purpose-built organization / Branch D — Biotech incubator tenant.
**Attacker:** An individual or small group with $500–$3,000+ per month in ongoing budget. They form an LLC, lease bench space at a biotech incubator (BioLabs, LabCentral, Genspace, or a university-affiliated equivalent), and use their own real legal identity throughout — or, in the lower-trace variant, recruit a willing accomplice to be the LLC's named principal. They convert money into a clean physical biotech-building address rather than relying on a virtual office.
**Target:** Any nucleic acid synthesis provider. The branch's defining move is to make the address-verification check (measure 3) pass *cleanly* rather than marginally, and to lean on the reflected legitimacy of neighboring real biotech tenants when the provider reviews other entity signals.

**Two binary defensive forks govern the branch's strength:**
- **Fork I — Address recognition.** Does the synthesis provider's address-classification system recognize the incubator building as a known biotech building? If yes, the branch is at full strength. If no, it degrades to roughly the strength of a virtual-office shell-LLC branch, even though the attacker has paid for real bench space.
- **Fork II — Vouching independence.** Does the provider require the second registered contact who vouches for an SOC order to be at a *different* institution than the orderer? If no, same-LLC self-vouching trivially succeeds. If yes, the attacker has to recruit a real external scientist (typically as a paid scientific advisory board member), which is substantially harder.

---

## Matrix A (all orders)

### Measure 1 — Identity verification (IAL1)

**Binding?** No. The attacker uses their own real government-issued ID and real face. The commercial identity-verification vendor flow (database check + SMS, or document scan + selfie) confirms a real existing identity bound to a real phone and address, so it passes by construction.

**False-negative rate:** Roughly 2–10% of legitimate customers in mature Western markets fail this measure on first attempt due to damaged documents, lighting/camera issues, name mismatches against credit bureaus, or recent address changes. Coverage drops sharply outside well-documented countries (down to 0% in countries like Iran where no automated path exists). Best guess based on the [IDV in practice notes](../../notes/idv-in-practice.md) and the IDV coverage spreadsheet referenced there.

**Bypass methods:**

**1a — Attacker as principal (baseline).** The attacker themselves files the LLC, signs the lease, opens the bank account, and passes IDV under their own name.
- Expertise: Aspirant — no specialized skill, you pass your own ID.
- Cost: $0 attacker cost (the IDV check itself, ~$0.80–$2.00 per check, is paid by the synthesis provider).
- Lead-up time: Minutes for the IDV session.
- Attacker trace: The attacker's real government ID image, real selfie/biometric template, device fingerprint, and IP are all stored at the IDV vendor and forwarded to the synthesis provider. Retention is vendor- and jurisdiction-dependent (no public source located in this pass).
- Caveat: This commits the attacker to the records of every institution touched (provider, IDV vendor, LLC state filing, EIN, bank, incubator). It is the highest-trace variant.

**1b — Accomplice as principal (lower-trace variant).** The attacker recruits a willing accomplice (paid associate, friend, family member) to be the LLC's named principal. The accomplice signs the lease, opens the bank account, and passes IDV; the attacker stays one step removed from the synthesis-provider records.
- Expertise: Novice — recruiting and managing a willing accomplice is a small operational skill.
- Cost: $0 for an unpaid accomplice; roughly $2,000–$10,000 over the operational lifetime for a paid accomplice (best guess based on dark-web identity-mule market pricing; no firm citation located).
- Lead-up time: Days to weeks for recruiting; the IDV step itself is minutes.
- Attacker trace: The accomplice — not the attacker — is on file at the synthesis provider and the IDV vendor. The attacker still surfaces in the LLC's operating agreement and may surface at the bank's customer due diligence step.
- Cross-measure dependency: The accomplice is the customer of record across measures 2, 3, 5, 6. The attacker can be the second registered contact (measure 3c) and therefore the in-LLC voucher under method 8a, but doing so partially undoes the lower-trace benefit.
- Caveat: As of March 2025, FinCEN [removed beneficial-ownership reporting requirements](https://www.fincen.gov/news/news-releases/fincen-removes-beneficial-ownership-reporting-requirements-us-companies-and-us) for U.S.-formed companies, so newly-formed U.S. LLCs no longer file BOI directly with FinCEN. This makes the accomplice variant lighter-trace than it would have been under the original 2024 Corporate Transparency Act regime.

---

### Measure 2 — Institutional affiliation check

**Binding?** Yes, but only weakly. The attacker controls the LLC's domain and email, so the structural check (work email + institution name + order context consistency) is satisfied by construction. The remaining question is whether the provider runs a richer "is this institution real" probe.

**False-negative rate:** No firm sourced figure. Industry biotech and small-CRO customers without `.edu` or major-corporate work emails make up a large fraction of legitimate synthesis customers, so the affiliation check as commonly implemented is structurally weak for this population.

**Bypass methods:**

**2a — Self-controlled domain + Google Workspace email + LLC name.** Register a biotech-themed domain, set up Google Workspace, list the LLC as the institution at the synthesis provider with billing and shipping aligned to the incubator address.
- Expertise: Aspirant — commodity small-business setup steps.
- Cost: Roughly $150–$300 one-time (Delaware LLC filing around [$110](https://corp.delaware.gov/fee/) plus an annual $300 franchise tax, free EIN from the IRS, $10–$15/year for a `.com` domain) plus ~$6–$7.20 per Google Workspace user per month ([Google Workspace pricing](https://workspace.google.com/pricing.html)).
- Lead-up time: Hours to a few days; Delaware LLC filings typically clear in 1–3 business days.
- Attacker trace: Domain WHOIS records (privacy-shielded but subpoenable), Google Workspace billing tied to the principal's payment instrument, LLC state filings naming the principal, IRS EIN responsible-party records.
- Uncertainty: Whether some providers run deeper checks (calling the listed phone number, looking up the LLC in state registries, checking domain age, cross-referencing against business databases) — likely varies by provider.

**2b — Domain age padding (optional).** Register the domain 6–12 months before applying to providers, or buy an aged parked domain on auction.
- Expertise: Aspirant.
- Cost: Free if pre-registered; tens to thousands of dollars for an aged auctioned `.com` domain (best-guess from typical broker auctions on [GoDaddy Auctions](https://auctions.godaddy.com/) and [Namecheap Marketplace](https://www.namecheap.com/market/)).
- Lead-up time: 6–12 months for organic aging; same-day for an auctioned purchase.
- Attacker trace: Auction-purchase records tie an aged domain to the buyer's payment method.

---

### Measure 3 — Organization registry + verified shipping address

**Binding?** Yes — and this is the load-bearing measure for the entire branch. Baseline practice is a provider-hosted registry: real organization record, registered shipping address (commercial or institution-linked, not residential, not P.O. box), commercial-mail-receiving-agency detection, controlled change workflows, two-contact design.

**False-negative rate:** Most virtual-mailbox addresses in the U.S. are flagged as Commercial Mail Receiving Agency (CMRA) addresses by tools like [Smarty's address verification API](https://www.smarty.com/docs/cmra), and many banks and KYC tools reject CMRA-flagged addresses as primary business addresses. A meaningful fraction of legitimate small biotechs and academic visiting researchers use virtual or shared addresses that trip these flags — plausibly 5–15% of legitimate small-customer applications would fail an aggressive enforce-no-CMRA rule (best guess; no firm source).

**Bypass methods:**

**3a — Bench-space lease at a recognized biotech incubator.** The attacker surveys incubators, prepares a brief application package (research focus, team bio, sometimes proof of insurance), submits it, attends a tour or short interview, signs a lease in the LLC's name, and pays deposit plus first month's rent.
- Expertise: Novice. Selective university-affiliated incubators (Harvard iLab, Stanford StartX) require articulating a credible scientific pitch and are not viable for a non-scientist attacker. Commercial-coworking-style biotech incubators in secondary metros are.
- Cost: Roughly $1,500–$5,000 per month for a single bench in a recognized biotech building. [LabCentral in Cambridge, MA charges $4,600 per month per bench](https://www.statnews.com/2019/03/06/labcentral-bench-startups-kendall/); [BioLabs San Diego advertises bench-rate memberships at approximately $2,200 per month](https://coworkingmag.com/united-states/biolabs-san-diego/). For a one-year operational window the attacker pays $18,000–$60,000 in rent alone.
- Lead-up time: A few days to several weeks at light-vetting commercial incubators; weeks to months at selective university-affiliated programs.
- Attacker trace: Incubator lease records under the LLC name; the principal's identity is vetted independently by the incubator (sometimes including a brief scientific pitch — a non-scientist principal can fail this in a *visible*, recorded way); badge and access logs; mailroom logs; public tenant directory listing. The incubator becomes a second institutional KYC layer holding the attacker's identity.
- Cross-measure dependency: Outcome depends on Fork I. If the provider's address database recognizes the building, the attacker gets full reflected-legitimacy benefit at measure 4 as well; if not, the address still passes commercial classification but the branch loses much of its advantage.

**3b — Standalone rented lab or sublet from a real biotech (higher-cost variant).** Rent a small standalone wet-lab space or sublet from an existing biotech in a recognized biotech building. Skips incubator scientific vetting entirely.
- Expertise: Novice.
- Cost: Plausibly $1,500–$5,000+ per month for a small unit; wet-lab space in U.S. biotech hubs is substantially more expensive per square foot than office space (best guess based on [Excedr's lab space cost guide](https://www.excedr.com/blog/how-much-does-lab-space-cost) and the [Pillar VC biotech lab space FAQ](https://www.pillar.vc/playlist/article/the-bio-lab-faq/)).
- Lead-up time: Weeks to months for commercial real-estate timelines.
- Attacker trace: Landlord lease records and building access. Loses the third-party tenant-directory signal that incubators provide.

**3c — Two-contact requirement.** The attacker registers a second contact under the LLC. In Method 1a this is the accomplice; in Method 1b the attacker can be the second contact, or a third party.
- Expertise: Aspirant.
- Cost: $0 (the second contact is reused from another step).
- Lead-up time: Hours.
- Attacker trace: The second contact's real ID at the IDV vendor.

---

### Measure 4 — Research & entity signals

**Binding?** Yes, but weakly. This is a bundled legitimacy review covering web presence, registration history, people with research backgrounds, and public funding records. The attacker has none of those signals on day one — but neither do many legitimate first-year incubator-tenant biotechs, which is why measure 4 cannot be enforced strictly for this customer class without unacceptable friction for legitimate customers.

**False-negative rate:** Industry survival data show roughly [10% of startups fail within their first year and around 70% fail between years 2 and 5](https://www.equidam.com/startup-survival-rates-risk-factor-valuation-startups-investment/), implying a continuously refilled population of pre-publication early-stage entities. The legitimate-customer false-negative rate of an aggressive enforce-publications-or-grants rule for first-year incubator-tenant biotechs is plausibly 30–60% (best guess).

**Bypass methods:**

**4a — Reflected legitimacy from incubator tenancy.** Lean on the measure-3 incubator address, a one-page LLC website describing the research focus in early-stage-startup language, LinkedIn bios for the 1–2 person team, and the incubator's tenant directory listing. Cite "early-stage stealth biotech, pre-publication, pre-grant" as the explanation for thin signals — a real and common posture for first-year tenants.
- Expertise: Novice.
- Cost: $50–$200 for web hosting and a basic template site; LinkedIn is free.
- Lead-up time: A day or two.
- Attacker trace: LinkedIn profiles tied to the principal's real or pseudonymous name; web hosting billing.

**4b — Padding signals (low-effort).** Create ORCID profiles with self-asserted affiliation; optionally create AI-generated LinkedIn personas for additional "employees" using AI-generated headshots.
- Expertise: Novice.
- Cost: $0–$100 (ORCID is free; AI image generation costs a few dollars).
- Lead-up time: Hours.
- Attacker trace: ORCID accounts, AI-generated headshots, LinkedIn personas — distinctive forensic artifacts that look like normal early-stage hustle in normal review.

**4c — Build a real (light) order history before SOC.** Place several routine non-SOC orders (primers, gene blocks, plasmid backbones) over 1–3 months. Risk-scoring systems weight clean order history positively.
- Expertise: Novice.
- Cost: A few hundred dollars in throwaway non-SOC orders; standard primer orders from major synthesis vendors (e.g., IDT) typically cost $5–$30 each (best guess from public price pages).
- Lead-up time: 1–3 months.
- Attacker trace: Order history under the LLC name and the principal's identity, retained per provider data-retention.

**4d — Real preprint output (stronger signal).** Conduct a small wet-lab project at the incubator (or commission a real assay from a CRO) and post a preprint on bioRxiv. The work may be entirely legitimate within the LLC's stated research area.
- Expertise: Practitioner — requires either domain-literate principals or commissioning real work from a CRO and writing a coherent preprint.
- Cost: [bioRxiv preprint posting is free](https://www.biorxiv.org/about/FAQ); marginal reagent costs of a few hundred to a few thousand dollars on top of bench space the attacker is already paying for, or low-thousand-dollar CRO commission fees.
- Lead-up time: Weeks to a few months.
- Attacker trace: Public preprint forever associated with the LLC and listed authors — strong legitimacy if uninvestigated, strong evidence if investigated.

**4e — Purchased authorship via paper-mill journal.** Pay for inclusion as co-author on a paper at a low-quality journal that accepts paid placements.
- Expertise: Novice.
- Cost: Hundreds to a few thousand dollars per slot, based on academic-fraud investigations reported in [Nature](https://www.nature.com/articles/d41586-021-00733-5) and tracked at [Retraction Watch](https://retractionwatch.com/category/by-subject/paper-mills/).
- Lead-up time: Weeks to months.
- Attacker trace: Publication record permanently lists the buyer; predatory-journal indexing flags exist and are tracked by integrity researchers.

**4f — Buy an aged dormant biotech LLC.** Purchase a dormant existing biotech entity from a business broker. Inherits aged registration and possibly aged domain or prior order history.
- Expertise: Novice.
- Cost: Roughly $500 to several thousand dollars (no firm public source located).
- Lead-up time: Days to weeks.
- Attacker trace: Acquisition records via the broker; the original principal must be replaced or pass IDV — adds an identity-handoff complication.

---

### Measure 5 — Payment integrity

**Binding?** No. Payments come from the LLC's business bank account; names match; no anonymous rails are used.

**False-negative rate:** Very low among legitimate customers — at most a few percent for genuinely small early-stage companies that occasionally pay via third-party processors or personal cards.

**Bypass methods:** None needed.
- Expertise: Aspirant.
- Cost: $0–$25/month in business banking fees and minimums.
- Lead-up time: Days to a couple of weeks for account opening and bank KYC.
- Attacker trace: Bank KYC records under the principal's identity tied to the LLC; transactions logged by the bank and the synthesis provider's payment processor. Even though [FinCEN rescinded direct beneficial-ownership reporting for U.S. LLCs in March 2025](https://www.fincen.gov/news/news-releases/fincen-removes-beneficial-ownership-reporting-requirements-us-companies-and-us), banks still run their own customer due diligence under the [FinCEN CDD Final Rule](https://www.fincen.gov/resources/statutes-and-regulations/cdd-final-rule), which requires identifying and verifying the beneficial owners of legal-entity customers at account opening — so the attacker is still committed at the bank.

---

## Matrix B (SOC orders — adds these on top of Matrix A)

### Measure 6 — Identity verification (IAL2)

**Binding?** No. The principal (attacker under 1a, accomplice under 1b) presents their own real government photo ID and real face. The vendor flow — document validation, facial comparison, liveness check, attribute validation against AAMVA / ICAO PKD / equivalent — passes against a real ID.

**False-negative rate:** Same as measure 1 (roughly 2–10% in mature Western markets, much higher in countries without authoritative document validation infrastructure).

**Bypass methods:** Same as measure 1; nothing additional needed beyond passing the IDV session with a real ID.
- Expertise: Aspirant (1a) / Novice (1b).
- Cost: $0 to attacker (1a); accomplice fee (1b — see measure 1).
- Lead-up time: Minutes for the session.
- Attacker trace: Real biometric template at the IDV vendor and the synthesis provider. Cross-vendor biometric correlation is not standard; an attacker concerned about prior IDV exposure can route through a synthesis provider that uses a different IDV vendor.

---

### Measure 7 — MFA + re-authentication

**Binding?** No. The principal controls the LLC's Workspace and the registered email, so they enroll their own TOTP, push, or even FIDO2 hardware key. Step-up re-authentication at SOC submission or shipping-address change is satisfied trivially.

**False-negative rate:** Very low — most legitimate customers can enroll TOTP or push MFA without difficulty.

**Bypass methods:** None needed.
- Expertise: Aspirant.
- Cost: $0 (TOTP) to ~$50 (FIDO2 hardware key).
- Lead-up time: Minutes.
- Attacker trace: MFA enrollment device tied to the principal.

---

### Measure 8 — Vouching by registered contact

**Binding?** Yes — and it is the load-bearing addition Matrix B brings beyond Matrix A. Whether it bites hard or trivially depends on Fork II (vouching independence enforcement).

**False-negative rate:** No firm public source. A meaningful fraction of legitimate small biotech startups have only one or two principals, all of whom are insiders to the same entity, so strict voucher-orderer independence enforcement is structurally costly to legitimate small companies.

**Bypass methods:**

**8a — Same-LLC self-vouching (Fork II = no enforcement).** The second registered contact (the accomplice in Method 1a, the attacker in Method 1b) logs into the provider portal, completes fresh MFA, and approves the order.
- Expertise: Aspirant.
- Cost: $0 (the second contact is reused from measure 3c).
- Lead-up time: Minutes per order.
- Attacker trace: Second contact's real identity, biometric, device, and approval action all logged at the provider; the second contact knows the principal personally.
- Caveat: This is a fragile assumption. Independence enforcement is a low-cost defensive evolution that providers will likely add as soon as same-entity vouching becomes a recognized pattern.

**8b — Paid scientific advisory board (SAB) member as voucher (Fork II = enforcement).** Pay a real scientist as an SAB member of the LLC. SAB membership is a real practice for early-stage biotechs, so the framing is independently legitimate. The SAB member registers at the provider under their own institutional email, passes IDV under their own identity, and approves SOC orders citing their advisory role.
- Expertise: Practitioner — sustained social engineering across weeks-to-months of relationship-building, plus ongoing relationship management. The chain is: identify candidate scientist → initial contact → consulting offer → negotiate retainer → sign SAB agreement → get them registered at the provider → repeat at every SOC order.
- Cost: Plausibly $5,000–$25,000 per year in cash retainer plus equity grants; biotech SAB compensation typically blends low-thousand-dollar cash retainers, per-meeting honoraria, and 0.1–0.3% equity (best guess based on [LifeSciVC's biotech SAB guide](https://lifescivc.com/2012/09/biotech-scientific-advisory-boards-what-works-what-doesnt/), [FundingSage advisory compensation guide](https://fundingsage.com/3-considerations-for-advisory-board-compensation/), and [M Accelerator advisor benchmarks](https://maccelerator.la/en/blog/entrepreneurship/advisor-compensation-benchmarks-by-startup-stage/)).
- Lead-up time: Weeks to months for the recruiting chain.
- Attacker trace: SAB member's real institutional identity and biometric committed at the provider; consulting agreement, payment records, public LinkedIn association; SAB member becomes a witness if anything goes wrong.
- Cross-measure dependency: The SAB member is also a third-party legitimacy signal that strengthens measure 4 as a side benefit.

**8c — Recruited friendly scientist (one-off variant of 8b).** Recruit a one-off real scientist to vouch for a specific order without the institutionalized SAB framing.
- Expertise: Practitioner.
- Cost: Roughly $500–$5,000 per voucher event as a per-favor honorarium (best guess; no firm public source).
- Lead-up time: Weeks per voucher unless a contact already exists.
- Attacker trace: Same as 8b but without legitimate cover.

**8d — Compromised scientist account (out-of-profile fallback).** Phish or buy credentials for a real scientist's institutional account, take over an existing provider account or register a new one under their identity, and vouch.
- Expertise: Expert.
- Cost: Compromised email credentials with PII trade for low single-digit to low double-digit dollars per account in industry tracking ([SpyCloud 2024 Identity Exposure Report](https://spycloud.com/resource/2024-identity-exposure-report/)); defeating the impersonated scientist's IAL2 adds $1,000–$10,000+ in tooling and per-attempt cost. Loses the branch's defining advantage; listed for completeness only.
- Lead-up time: Days to weeks.
- Attacker trace: Stolen credentials leave forensic traces at the victim's institution; the victim is a witness.

---

### Measure 9 — Biosafety documentation

**Binding?** Yes, partially. There is no central registry for private-entity Institutional Biosafety Committees (IBCs), so verification at small or privately controlled organizations is mostly procedural — does the document look real? — rather than authoritative.

**False-negative rate:** [NIH IBC registration applies only to NIH-funded institutions](https://osp.od.nih.gov/biotechnology/nih-guidelines/), and no equivalent centralized public registry exists for private-entity IBCs. The legitimate-customer false-negative rate for any hard-gate biosafety-documentation requirement is plausibly 30–60% of small biotech and community-lab customers (best guess based on the gap between NIH-funded institutional infrastructure and the broader customer population).

**Bypass methods:**

**9a — Self-authored biosafety program citing incubator facility framework.** Draft a 5–15 page biosafety plan covering BSL-1/BSL-2 work appropriate to the LLC's stated research focus. Reference the incubator's facility-level biosafety framework. Lift sections from publicly-available university IBC standard operating procedures to raise plausibility above pure AI generation.
- Expertise: Novice.
- Cost: $0–$50 (AI assistance subscription if used; templates are free).
- Lead-up time: A few hours to a day.
- Attacker trace: Plan signed under the principal's name. If the provider calls the incubator to verify, the incubator's likely answer is "we don't issue tenant-specific biosafety attestations" — the expected legitimate answer for most commercial incubators.

**9b — Incubator-issued biosafety attestation (legitimate path where available).** Some incubators (especially university-affiliated) routinely issue tenant-specific biosafety attestations. The attacker may legitimately obtain such an attestation by representing low-risk BSL-1/BSL-2 work to the incubator's facility biosafety officer.
- Expertise: Practitioner — requires articulating a BSL-1/BSL-2 work plan credibly to a domain expert (the BSO), who may probe more deeply than incubator admissions did.
- Cost: $0 marginal cost beyond the incubator rent. Trades against Fork I selection: selective university-affiliated incubators are more likely to issue these but less likely to admit a non-scientist applicant.
- Lead-up time: Days to weeks for the BSO interaction.
- Attacker trace: A real institutional biosafety artifact issued by the incubator under the LLC name.

**9c — Fabricated IBC approval letter.** Forge an IBC approval letter on letterhead claiming approval from a non-existent "company IBC" or claiming approval from the incubator's biosafety committee.
- Expertise: Novice.
- Cost: $0–$50.
- Lead-up time: Hours.
- Attacker trace: The forged letter is itself evidence of intent if discovered. Highest detection risk if the provider verifies with the named issuer.

**9d — Recruited friendly biosafety consultant signature.** Pay an independent biosafety consultant to review and sign a biosafety plan for the LLC.
- Expertise: Practitioner.
- Cost: Plausibly $500–$5,000 for a signed plan; independent biosafety consultants in the U.S. typically bill $100–$300 per hour (best guess based on typical biosafety consulting rate cards; no single direct citation located).
- Lead-up time: Weeks.
- Attacker trace: Consultant invoices and the consultant's real identity on the document. The same consultant may serve double duty as voucher under some provider implementations.

---

## Synthesis

**Cheapest end-to-end Matrix A path:** Method 1a + 2a + 3a (commercial-coworking incubator in a secondary metro) + 4a + 5. The dominant cost is incubator rent (~$1,500–$5,000/month). One-time setup costs are roughly $300–$800. The attacker's own IDV cost is $0. Total Matrix A operational cost for one year: roughly **$20,000–$65,000**.

**Cheapest end-to-end Matrix B path:** Inherit Matrix A unchanged for measures 6 and 7. Measure 8 = Method 8a (free, instant) if Fork II is off; Method 8b (paid SAB member, $5K–$25K/year ongoing) if Fork II is on. Measure 9 = Method 9a (self-authored plan, $0–$50). Total Matrix B operational cost for one year:
- Fork II = no enforcement: roughly **$20,000–$65,000** (effectively unchanged from Matrix A).
- Fork II = enforcement: roughly **$25,000–$90,000** (Matrix A baseline plus SAB retainer plus weeks of recruiting effort).

**Trace profile:** Fully committed under Method 1a — the principal is on file at the IDV vendor, the synthesis provider, the LLC state filing, the EIN, the domain registrar, Workspace, the incubator (a second institutional KYC layer), the bank (with CDD), and the payment processor. Under Method 1b, the synthesis-provider-facing identity is the accomplice, but the attacker still surfaces at LLC formation and bank CDD. Under Method 8b (Fork II enforcement), an SAB member's institutional identity is committed too — **triple commitment** across provider, incubator, and SAB member's home institution.

**Cross-product order anomaly:** Independent of Matrix A vs. B, an LLC ordering synthesized DNA but no corresponding consumables (enzymes, kits, reagents from major life-science suppliers) is a cross-supplier anomaly that accumulates over time. The synthesis provider sees only its own orders; defenders aggregating across suppliers (or auditing retrospectively) would notice. Mitigated at small additional cost by also placing reagent orders.
