# CRO identity rotation across providers — Detailed table

**Branch slug:** `cro-identity-rotation` (Purpose-built organization, Branch B)

**Branch scenario.** A single individual or small pair files 2–4 small contract-research-organization LLCs in different US biotech metros, runs each as a clean small business (real LLC, real bank account, real virtual office, custom email domain), and uses each entity to place orders at a different subset of synthesis providers. Identity verification at every entity is passed honestly with the attacker's own real face and government ID. The point of running multiple entities is not to defeat any single provider's checks but to spread orders across providers such that no single defender ever sees the full pattern.

**Strategy summary.** Each entity is built using commodity small-business workflows that thousands of legitimate small CROs execute every year — LLC filing, EIN, Google Workspace, virtual office in a biotech cluster, business bank account. The CRO cover story explains away the absences (no publications, no grants, no university IBC) that would otherwise flag a brand-new shell. Per-entity year-1 cost is roughly $1,600–$2,300 on the cheapest path or $5,500–$9,600 with credible-defense upgrades (coworking lease, hired biosafety consultant, hired voucher consultant). The branch's resilience does not come from any individual measure being hard to bypass — it comes from two structural ecosystem features: (1) no synthesis provider currently shares organization-registry or customer-history data with competitors, and (2) cross-tenant biometric duplicate detection at the IDV-vendor level (technically available at Onfido, Veriff, Jumio) is not enabled by default in synthesis-provider deployments. The branch breaks profile-wide if either (a) the proposed vouching workflow enforces voucher *independence* from the orderer's institution or (b) measure 9 begins to require third-party-verifiable IBC documentation.

**Persistent supply chain assessment.** This branch is designed for persistence by replacement. Each entity is treated as disposable: when one is flagged, the attacker stands up a fresh LLC in 3–6 weeks while the others continue operating. Costs and traceability accumulate linearly with the number of entities and are partitioned across providers — but every entity creates a fresh, real attribution path back to the attacker (state filings, EIN responsible-party records, bank KYC, biometric records at IDV vendors). Attribution risk grows monotonically with persistence; the attacker's bet is that no defender ever assembles cross-provider records into a single picture. The bet is undefeated under current ecosystem practice but turns immediately if any provider activates cross-tenant signals at its IDV vendor.

---

## Matrix A (all orders)

### Measure 1 — Identity verification (IAL1)

**Binding assessment.** No. The attacker uses their real legal name and real government-issued ID at every entity, so PII validation against credit bureaus and government databases passes natively and the SMS confirmation goes to the attacker's own phone.

**False-negative rate.** Low for users in mature markets with credit-bureau or government-database coverage; near-100% in low-coverage jurisdictions (Iran, Russia, Pakistan, Bangladesh) where automated attribute validation is unavailable. Sourced from the project's IDV reference notes citing the [IDV Coverage spreadsheet](https://docs.google.com/spreadsheets/d/1_jK0d1LhTI51aJnSdnU_0HfDzjUENZAgUjcl0GDlWoc/edit?usp=sharing).

**Bypass methods.** None needed; pass natively.

- **Method: Own real identity (default).**
  - **What the attacker does:** Enters their real PII at the provider's identity-verification flow and receives an SMS confirmation code on their own phone.
  - **Expertise:** Novice (basic computer literacy; the same flow every legitimate customer completes).
  - **Cost:** $0 to the attacker (the provider absorbs the ~$0.50–$1.50 vendor fee per check).
  - **Lead-up time:** 2–5 minutes per provider.
  - **Attacker trace:** Real name, date of birth, phone number, and document numbers committed to each provider's IDV vendor (Onfido/Entrust, Veriff, Jumio, Persona). Records typically retained 5–7 years.
  - **Caveat:** Within a single provider, opening multiple entity accounts under the same biometric template is a one-person-many-accounts cluster that the provider could detect if it ran cross-account biometric comparison; most providers do not today.

### Measure 2 — Institutional affiliation check

**Binding assessment.** No in the email-plus-context baseline. The attacker's custom-domain Google Workspace email is the affiliation evidence; inbox verification passes because the attacker controls the inbox. Becomes binding only if a provider gates on domain age, WHOIS history, or federated academic login (eduGAIN/InCommon).

**False-negative rate.** Moderate for new commercial entities; the baseline check passes new custom-domain LLCs by design. The high false-negative rate against the new-small-CRO population is exactly the structural feature this branch exploits.

**Bypass methods (defensive cushion against domain-age signals).**

- **Method: Fresh domain + DNS/mail-stack maturity signaling.**
  - **What the attacker does:** Registers a `.com` matching the LLC name, sets up Google Workspace, configures SPF/DKIM/DMARC and MX records so the domain looks operationally mature.
  - **Expertise:** Novice.
  - **Cost:** ~$15/year for the domain plus ~$72/year for Google Workspace Business Starter per entity.
  - **Lead-up time:** Same day (with ~30 min DNS configuration per entity).
  - **Attacker trace:** Domain registrant on file at the registrar, paid via the LLC bank card.
  - **Cross-measure dependency:** Useful only if a provider weights domain age in the affiliation or research-signal review.

- **Method: Aged-domain purchase.**
  - **What the attacker does:** Buys an expired or aged domain matching the LLC name from an aftermarket platform.
  - **Expertise:** Novice.
  - **Cost:** Wide range; representative names in plausible CRO niches typically cost in the low hundreds to low thousands of dollars per name. Marketplace-wide averages reported by aggregators ([The Website Flip aged-domain valuation guide](https://thewebsiteflip.com/guide/aged-domain-worth-valuation/)) are higher because they include premium names.
  - **Lead-up time:** Same day to 2 weeks (auction cycles plus transfer).
  - **Attacker trace:** WHOIS history is publicly archived (DomainTools, SecurityTrails); transfer creates a dated change record even under WHOIS privacy.
  - **Caveat:** Wayback Machine prior content can betray a domain whose previous purpose was incongruent with a CRO. Clean-content names in plausible niches are scarcer than the headline numbers suggest.

- **Method: Federated login claim avoidance.**
  - **What the attacker does:** Targets only providers that accept commercial customers (most), avoiding any that gate on academic federated login.
  - **Expertise:** Novice. Free.
  - **Trace:** None.

### Measure 3 — Organization registry + verified shipping address

**Binding assessment.** Yes, per entity, but trivially passable with a real LLC + virtual office. The load-bearing observation for this branch is that *no shared organization registry exists across synthesis providers* — each (entity, provider) pair is evaluated independently, so the attacker can repeat the same passable artifact across providers and across entities without inheriting any cross-pair history.

**False-negative rate.** Estimated 15–30% of new legitimate small commercial entities operating from virtual offices would be incorrectly flagged or blocked under hard-gate enforcement, dropping below 5% for established institutions at recognized addresses. Sourced qualitatively from `measures-in-practice.md` measure 3 discussion; no published study quantifies this rate for the new-small-life-science-entity population.

**Bypass methods (cheap → middle → upgrade).**

- **Method: Real LLC + virtual office (cheapest).**
  - **What the attacker does:** Files a real LLC (Delaware, Wyoming, or New Mexico is typical) under a plausible CRO name, gets an EIN from the IRS, rents a virtual-office mailing address from a national provider in a biotech cluster (Regus, IWG, Alliance, Davinci), opens a real LLC bank account, and submits all of this to the synthesis provider.
  - **Expertise:** Novice.
  - **Cost:** Roughly $1,500–$1,700 per entity year 1: ~$110 Delaware filing fee plus $300 annual franchise tax ([Delaware Division of Corporations Fee Schedule](https://corp.delaware.gov/fee/), [IncNow Delaware LLC fees guide](https://www.incnow.com/delaware-llc/fees/)), $50–$300 registered-agent service, ~$1,000/year virtual office at biotech-cluster locations such as Rockville, Maryland ($59–$89/month per [Regus Rockville Virtual Offices](https://www.regus.com/en-us/united-states/maryland/rockville/virtual-offices)), domain ~$15, and Google Workspace ~$72.
  - **Lead-up time:** 3–6 weeks per entity end-to-end. Constituent steps: LLC filing 1–10 business days, EIN immediately upon online approval ([IRS — Get an EIN](https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number)) but limited to one EIN per responsible party per day ([IRS Form SS-4 instructions](https://www.irs.gov/instructions/iss4)), bank account 1–3 weeks, virtual office same day to 1 week, provider intake review 1–2 weeks.
  - **Attacker trace:** State LLC filings record the principal/manager (the attacker's real name in most jurisdictions); IRS EIN records the responsible party (real person); virtual-office lease records the tenant's identity AND the forwarding destination — a single subpoena from law enforcement to the virtual-office operator would yield the attacker's real receive address. Following the [FinCEN interim final rule of March 2025](https://www.fincen.gov/news/news-releases/fincen-removes-beneficial-ownership-reporting-requirements-us-companies-and-us), US-formed LLCs are no longer required to file Beneficial Ownership Information reports, so the expected federal BOI trace is currently absent for this branch.
  - **Cross-measure dependency:** The same LLC name, EIN, and address must carry through measures 4 (research signals), 5 (payment), 8 (vouching), and 9 (biosafety) for any one entity.

- **Method: Real coworking space lease (middle-cost upgrade).**
  - **What the attacker does:** Rents an actual dedicated desk at a coworking space (WeWork, Industrious, or a local biotech-friendly coworking provider) instead of a virtual office, so the address resolves cleanly to a commercial building rather than a mail-handling location.
  - **Expertise:** Novice.
  - **Cost:** ~$150–$700/month per entity for a dedicated desk depending on city, with biotech-cluster cities at the higher end ([WeWork Solutions](https://www.wework.com/solutions); industry-average ~$636/month per [Coworking Resources blog](https://www.coworkingresources.org/blog/coworking-space-prices)). Per-entity year-1 total roughly $5,500–$7,500.
  - **Lead-up time:** Same day to 1 week.
  - **Attacker trace:** Coworking provider has lease records, on-site security cameras, swipe-card logs.
  - **Cross-measure dependency:** Strengthens the address signal at measure 3 in addition to providing a real working location.

- **Method: Sublet bench time from another small CRO (hybrid).**
  - **What the attacker does:** Pays a small real CRO for occasional bench access, providing a real lab address.
  - **Expertise:** Practitioner — requires identifying a willing subletter and negotiating the arrangement.
  - **Cost:** Highly variable; $500–$3,000/month plausible. No published rate cards exist.
  - **Lead-up time:** 2–8 weeks.
  - **Attacker trace:** Sublet contract or invoice records create a third-party witness to the LLC's existence.

- **Method: Offshore registry.** Listed for completeness; counterproductive for this branch because offshore filings are themselves a measure-4 red flag for a US-styled CRO.

**Provider intake friction (per entity).** Major synthesis providers run new-commercial-account intake queues that may include cold-calling the listed phone number, requesting additional documents, asking for a short pitch about the CRO's work, or routing to slower-track human review. These are not formal KYC measures but they cost the attacker tens of hours of attentive work per entity. (Twist Bioscience, IDT, and GenScript do not publish their intake procedures in publicly accessible materials.)

### Measure 4 — Research & entity signals

**Binding assessment.** Yes, per entity. This is the *primary* per-entity binding constraint. The CRO cover story is engineered to neutralize it: real CROs legitimately have no publications (work is client-confidential), no grants (funded by clients), no university IBC, and may have founders with thin public profiles.

**False-negative rate.** High — estimated 30–50% of legitimate small new commercial entities lack the publication or grant footprint that would positively confirm the entity. Per `measures-in-practice.md`, the research-signal check has "high false-negative risk outside well-documented academic populations." [NIH RePORTER](https://reporter.nih.gov/) covers only NIH-funded research and captures only a small fraction of total commercial life-science activity.

**Bypass methods.**

- **Method: CRO cover-story neutralization.**
  - **What the attacker does:** Frames the entity as a contract research organization. Writes a services description (contract cloning, assay development, methods-for-hire) that is mundane enough to be unremarkable but specific enough to sound like a real small shop.
  - **Expertise:** Practitioner — requires enough domain literacy to write a credible CRO services description.
  - **Cost:** $0 (a few hours of writing).
  - **Lead-up time:** 4–8 hours per entity.
  - **Attacker trace:** None beyond the entity itself.
  - **Cross-measure dependency:** The cover story must carry to measure 9 (self-maintained biosafety) and to measure 3 (small CRO + virtual or coworking address).

- **Method: Synthetic web/persona depth.**
  - **What the attacker does:** Builds a one-page services website, creates LinkedIn profiles for one or two "founders," registers ORCID profiles (free, self-asserted), optionally creates a Google Scholar profile.
  - **Expertise:** Novice.
  - **Cost:** $0–$50 per entity beyond the domain.
  - **Lead-up time:** 1–3 days per entity.
  - **Attacker trace:** ORCID, LinkedIn, and Google Scholar profiles persist publicly under the attacker's real name.

- **Method: Fake client list / case studies.**
  - **What the attacker does:** Publishes a "selected clients" or anonymized case-study section on the website listing plausible-sounding pseudonymous clients ("a Bay Area gene-therapy startup"). A reviewer cannot verify these without contacting them, which they will not do at intake.
  - **Expertise:** Novice. $0; ~1 hour.
  - **Attacker trace:** Public web content.

- **Method: Crunchbase / press-release seeding.**
  - **What the attacker does:** Submits a Crunchbase entry (free, self-submitted) and distributes a paid press release through PRWeb or EIN Presswire ($100–$400).
  - **Expertise:** Novice.
  - **Cost:** $100–$400.
  - **Lead-up time:** Same day to 1 week.
  - **Attacker trace:** Crunchbase submitter info and press-release sender info.

- **Method: Conference attendee badge.**
  - **What the attacker does:** Buys an attendee badge for a major life-science meeting (SLAS, AACR, Bio-IT World) under the LLC name, creating a real public attendee record.
  - **Expertise:** Novice.
  - **Cost:** $500–$1,800 per badge depending on conference and timing.
  - **Lead-up time:** Days to months.
  - **Attacker trace:** Conference attendee list under the attacker's real name.

- **Method: GitHub / open-source contributions.**
  - **What the attacker does:** Pushes trivial AI-generated bioinformatics code under the LLC's GitHub organization to signal technical activity.
  - **Expertise:** Novice. $0.
  - **Attacker trace:** GitHub commit history.

### Measure 5 — Payment integrity

**Binding assessment.** No. Each LLC has a real business bank account opened in the principal's name. Payment-method consistency holds (LLC card matches LLC customer record); no identity-obfuscating payment used.

**False-negative rate.** Very low. Almost any payment method consistent with the verified customer passes.

**Bypass methods.** None needed.

- **Method: LLC business bank account.**
  - **What the attacker does:** Opens a business checking account at a major US bank or a startup-focused neobank (Mercury, Brex, Stripe Atlas) using the real LLC paperwork and the attacker's real ID.
  - **Expertise:** Novice.
  - **Cost:** $0 setup; $0–$25/month maintenance.
  - **Lead-up time:** Same day to 3 weeks (in-person at most banks; ~1–3 days at neobanks).
  - **Attacker trace:** Bank KYC records the real principal under the bank's own AML framework.
  - **Caveat — bank-side parallel risk:** A single individual opening 4 LLC bank accounts in short succession matches the AML pattern for "structured shell formation." Banks may file SARs (filed without notice to the customer; visible to FinCEN and downstream investigators) or close any one of the LLC accounts mid-operation. The attacker may need to spread across multiple banks.

---

## Matrix B (SOC orders add these)

### Measure 6 — Identity verification (IAL2)

**Binding assessment.** No at any single provider — the attacker uses their own real ID, real face, and real liveness response at each provider's IDV flow. The branch's load-bearing analytical observation is that nothing about the per-provider IDV process correlates the attacker's identity *across* providers in current practice.

**False-negative rate.** Low (estimated 1–5%) in high-coverage markets (US/UK/EU/India/Brazil/Singapore); near-100% in low-coverage markets where manual fallback is the only path. No publicly available study reports per-vendor FNR for legitimate users at the IAL2-equivalent strength level.

**Bypass methods.**

- **Method: Own real identity (default).**
  - **What the attacker does:** Photographs their real government ID, takes a selfie, performs a head-turn for liveness — exactly what every legitimate customer does.
  - **Expertise:** Novice.
  - **Cost:** $0 to the attacker; the provider pays the IDV vendor roughly $2–$6 per check (per the project's IDV reference notes covering document scan, liveness, and attribute validation components).
  - **Lead-up time:** ~3–5 minutes per provider (per the project's IDV reference notes for typical US/UK/EU customer experience).
  - **Attacker trace:** Highest possible per provider — real biometric template + real document image retained 5–7 years per typical IDV vendor policy.

- **Method: IDV-vendor-aware provider selection (highest-leverage tactic distinctive to this branch).**
  - **What the attacker does:** Maps synthesis providers to their underlying IDV vendor (Onfido/Entrust, Veriff, Jumio, Persona) and picks at most one provider per IDV vendor — defeating *same-vendor cross-tenant biometric matching*, which is a real and technically already-deployed capability at the major IDV vendors but is not enabled by default in the synthesis-provider context.
  - **Expertise:** Practitioner.
  - **Cost:** $0 (selection cost only).
  - **Lead-up time:** ~1 day of research.
  - **Attacker trace:** Same biometrics committed at each chosen provider, but partitioned by IDV vendor — no shared template across vendors.
  - **Effectiveness caveat:** [Veriff markets "Risk Labels," "FaceBlock," and "CrossLinks" cross-customer fraud features](https://www.veriff.com/brand-comparison/veriff-vs-onfido); [Jumio describes a network of 30M+ identities used to detect cross-customer patterns](https://www.jumio.com/); [Onfido / Entrust matches against DMV records for synthetic and duplicate detection](https://onfido.com/). Whether any of these is currently enabled for synthesis-provider tenants is publicly undocumented. The branch's gap is closeable on the IDV-vendor side without provider-side action.

- **Method: Country / document selection.**
  - **What the attacker does:** Chooses to present a US passport vs. a US driver's license vs. a foreign passport at different providers. Different documents route through different attribute-validation back-ends (AAMVA, credit bureau, ICAO PKD).
  - **Expertise:** Novice if the attacker holds the documents.
  - **Cost:** $0–$2,000.
  - **Trace:** Document choice routes through different back-ends.

- **Method: Per-provider accomplice rotation.**
  - **What the attacker does:** Recruits a different real person to front each entity at each provider, so biometrics never repeat across providers. Each accomplice's identity also has to serve as the LLC principal at the entity they front (state filing, EIN, bank, domain).
  - **Expertise:** Practitioner.
  - **Cost:** $500–$5,000 per accomplice (no published rate exists; estimated from adjacent money-mule recruitment rates).
  - **Lead-up time:** 1–4 weeks per accomplice.
  - **Attacker trace:** Each accomplice's real identity fully committed at one provider; payment/coercion link between attacker and accomplice provides the attribution path.

- **Method: Synthetic shell-of-shells.** Same as accomplice rotation but with two accomplices per entity (one as incorporator, one as operator). Higher cost; partitioned attribution.

- **Method: Foreign-national accomplice in low-coverage country.** Routes the IDV through manual fallback; reduces cross-tenant biometric linkage but raises measure 4 scrutiny ("why is a US-incorporated CRO operated by a foreign national?").

### Measure 7 — MFA + re-authentication

**Binding assessment.** No. The attacker controls every account from start to finish; all MFA factors (TOTP, SMS, push, passkey) are set up by the attacker on attacker-owned devices.

**False-negative rate.** Estimated <5% for the US/EU/Asia commercial population (smartphone access required).

**Bypass methods.** None needed.

- **Method: Set up MFA on attacker-owned devices.**
  - **Expertise:** Aspirant.
  - **Cost:** $0.
  - **Lead-up time:** 5 minutes per provider.
  - **Attacker trace:** MFA seed material on attacker's devices; phone numbers tied to attacker's carrier account.

### Measure 8 — Vouching by registered contact

**Binding assessment.** Yes — and the entire purpose-built-organization profile's viability is conditional on whether the proposed vouching workflow enforces voucher *independence* from the orderer's institution. Per `measures-in-practice.md`, the proposed baseline requires "a separate registered contact must approve the order through the provider portal with fresh MFA" but does not crisply require independence. This branch is analyzed under the no-independence baseline.

**False-negative rate.** Essentially zero under the no-independence baseline (any registered second contact passes); very high under enforced independence (most legitimate small CROs do not naturally have an external voucher).

**Bypass methods.**

- **Method: Same-LLC second contact (cheapest).**
  - **What the attacker does:** Designates the attacker as the first registered contact and an accomplice (spouse, family member, or friend) as the second contact, both under the same LLC. The voucher reviews and approves each order through the provider portal with fresh MFA.
  - **Expertise:** Novice.
  - **Cost:** $0 if the accomplice is willing; $500–$5,000 per entity for a paid accomplice.
  - **Lead-up time:** Days per entity.
  - **Attacker trace:** Voucher's biometrics + ID committed at IAL2 at each provider; provider records show voucher and orderer both registered under the same LLC.
  - **Cross-measure dependency:** If the same accomplice is used across multiple entities, that creates a cross-entity biometric link visible to any provider that biometrically de-duplicates within itself.

- **Method: LinkedIn / Upwork-recruited consultant voucher.**
  - **What the attacker does:** Hires a real biosafety or regulatory-affairs consultant through LinkedIn or Upwork as a paid contractor and registers them as the LLC's second contact. The consultant is a real third party with their own institutional history; they are not employed by the LLC but they pass the "second registered contact who has passed IDV" requirement.
  - **Expertise:** Practitioner — requires plausibly representing the LLC and managing the relationship.
  - **Cost:** $500–$5,000 per entity engagement (estimated from Upwork freelancer rates of $50–$200/hour for regulatory affairs and biosafety categories).
  - **Lead-up time:** 2–6 weeks per entity.
  - **Attacker trace:** Consultant's real identity on file at the provider; payment records (Upwork, Stripe, ACH) link the attacker to the consultant.
  - **Note:** This is one realization of the same-LLC second contact method, not a separate path.

- **Method: Family-member voucher.** Cheapest accomplice option; family relationship may be discoverable through public records.

- **Method: Cross-entity attacker ring.** Two attackers running their own portfolios vouch across portfolios. Each appears as an "external" voucher to a single provider but creates a cross-portfolio biometric cluster at any provider that runs cross-account analysis.

- **Method: Pay-for-voucher (knowing).** Hire a real corruptible person at an unrelated institution. Highly variable cost; criminal exposure for both parties.

**Sensitivity — voucher independence enforced:** If the standard requires the voucher to be from a separate verifiable institution, Branch B (and the entire purpose-built-organization profile) becomes infeasible without recruiting a real corrupted insider, which collapses the attack into fake-affiliation or insider-recruitment profiles.

### Measure 9 — Biosafety documentation

**Binding assessment.** Yes per entity. Second key per-entity binding measure. The CRO cover story makes "self-maintained biosafety program" plausible because real small CROs do not have university IBCs.

**False-negative rate.** High — estimated 40–70% of legitimate small private commercial entities would lack third-party-verifiable IBC documentation under hard-gate enforcement. Per `measures-in-practice.md`, "Verification of IBC existence at small or privately controlled organizations is extremely difficult."

**Bypass methods (cheap → middle → upgrade).**

- **Method: Self-authored CRO biosafety program.**
  - **What the attacker does:** Drafts a 5–20 page biosafety plan referencing the publicly available [CDC BMBL 6th Edition](https://www.cdc.gov/labs/bmbl/index.html) and NIH OSP guidance, declares a BSL-1/BSL-2 operating environment, and names a self-appointed biosafety officer. AI-assisted drafting plus public university templates.
  - **Expertise:** Practitioner — requires enough biosafety vocabulary to draft a plan that survives reviewer scrutiny.
  - **Cost:** $0.
  - **Lead-up time:** 8–16 hours per entity.
  - **Attacker trace:** PDF on file at the provider; named biosafety officer.
  - **Risk:** A biosafety-literate reviewer can detect common errors (wrong BSL designations, mis-cited NIH Guidelines sections, generic emergency response language); obvious tells flag the entire entity.

- **Method: Hire a freelance biosafety consultant.**
  - **What the attacker does:** Pays a credentialed biosafety consultant (e.g., a retired EHS professional) to draft a real biosafety plan for the LLC. The consultant may not realize the LLC is hollow.
  - **Expertise:** Novice (recruiting and paying); the consultant supplies the expertise.
  - **Cost:** $500–$3,000 per entity, estimated from regulatory-consulting rates of $50–$200/hour × 5–15 hours of plan drafting. ([Biosafety Buyer's Guide — Biosafety Consultants](https://biosafetybuyersguide.org/consultants.html); [Triumvirate Environmental — Biosafety Consulting Services](https://www.triumvirate.com/services/ehs-consulting-services/biosafety-consulting-services))
  - **Lead-up time:** 2–6 weeks per entity.
  - **Attacker trace:** Consultant's name on the document; payment records.

- **Method: Pay a commercial IBC service for review.**
  - **What the attacker does:** Engages a commercial IBC service ([Advarra IBC](https://www.advarra.com/review-services/institutional-biosafety-committee-services/), WCG IBC) to provide a real third-party-verifiable IBC review for the paper LLC. Highest credibility tier.
  - **Expertise:** Novice.
  - **Cost:** Estimated $5,000–$15,000+ per entity setup plus annual review fees (no published rate; estimated from adjacent commercial IRB review costs). Advarra advertises [10-day-or-less review timelines](https://www.advarra.com/review-services/institutional-biosafety-committee-services/).
  - **Lead-up time:** 2–8 weeks for onboarding plus IBC review cycle.
  - **Attacker trace:** IBC firm runs onboarding KYC on the LLC and may catch the entity is hollow.

- **Method: Boilerplate IBC-equivalent letter.** A one-page attestation on LLC letterhead. Works only if the provider asks for an attestation rather than a full plan.

- **Method: NIH OSP letter forgery.** Detectable; federal-crime exposure (18 USC 1001). Listed for completeness.
