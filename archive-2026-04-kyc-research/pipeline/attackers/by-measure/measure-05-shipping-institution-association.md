# Measure 05 — shipping-institution-association

Screen shipping address for association with institutional affiliation. Flag triggers: no public association between affiliation and shipping address.

---

## biotech-incubator-tenant

- **Branch slug:** biotech-incubator-tenant
- **Profile:** purpose-built-organization
- **Target description:** Attacker leases bench space at a recognized biotech incubator under an LLC, so the shipping address resolves to a known biotech building and inherits incubator-recognized institutional association.
- **Bypass excerpts:**

  > **Binding?** Yes — and this is the load-bearing measure for the entire branch. Baseline practice is a provider-hosted registry: real organization record, registered shipping address (commercial or institution-linked, not residential, not P.O. box), commercial-mail-receiving-agency detection, controlled change workflows, two-contact design.

  > **3a — Bench-space lease at a recognized biotech incubator.** The attacker surveys incubators, prepares a brief application package (research focus, team bio, sometimes proof of insurance), submits it, attends a tour or short interview, signs a lease in the LLC's name, and pays deposit plus first month's rent.
  > - Expertise: Novice. Selective university-affiliated incubators (Harvard iLab, Stanford StartX) require articulating a credible scientific pitch and are not viable for a non-scientist attacker. Commercial-coworking-style biotech incubators in secondary metros are.
  > - Cost: Roughly $1,500–$5,000 per month for a single bench in a recognized biotech building. [LabCentral in Cambridge, MA charges $4,600 per month per bench](https://www.statnews.com/2019/03/06/labcentral-bench-startups-kendall/); [BioLabs San Diego advertises bench-rate memberships at approximately $2,200 per month](https://coworkingmag.com/united-states/biolabs-san-diego/). For a one-year operational window the attacker pays $18,000–$60,000 in rent alone.
  > - Lead-up time: A few days to several weeks at light-vetting commercial incubators; weeks to months at selective university-affiliated programs.
  > - Attacker trace: Incubator lease records under the LLC name; the principal's identity is vetted independently by the incubator (sometimes including a brief scientific pitch — a non-scientist principal can fail this in a *visible*, recorded way); badge and access logs; mailroom logs; public tenant directory listing. The incubator becomes a second institutional KYC layer holding the attacker's identity.
  > - Cross-measure dependency: Outcome depends on Fork I. If the provider's address database recognizes the building, the attacker gets full reflected-legitimacy benefit at measure 4 as well; if not, the address still passes commercial classification but the branch loses much of its advantage.

  > **3b — Standalone rented lab or sublet from a real biotech (higher-cost variant).** Rent a small standalone wet-lab space or sublet from an existing biotech in a recognized biotech building. Skips incubator scientific vetting entirely.
  > - Expertise: Novice.
  > - Cost: Plausibly $1,500–$5,000+ per month for a small unit; wet-lab space in U.S. biotech hubs is substantially more expensive per square foot than office space (best guess based on [Excedr's lab space cost guide](https://www.excedr.com/blog/how-much-does-lab-space-cost) and the [Pillar VC biotech lab space FAQ](https://www.pillar.vc/playlist/article/the-bio-lab-faq/)).

- **Why relevant:** The entire branch is engineered around forcing the shipping address to resolve to a building publicly listed as a biotech location — the structural definition of measure 05.
- **Persistent supply chain?** N

---

## community-bio-lab-network

- **Branch slug:** community-bio-lab-network
- **Profile:** purpose-built-organization
- **Target description:** Attacker constructs a community-bio LLC and uses a maker space, biotech-cluster coworking, virtual office, or residence as the registered shipping address for the synthesized "lab."
- **Bypass excerpts:**

  > **Bypass method — Real LLC + maker space address.** File an LLC in [New Mexico ($50, no annual report)](https://www.llcuniversity.com/llc-filing-fees-by-state/) or Wyoming ($100 + $60/year). Obtain an EIN from the IRS. Rent a maker space membership in a biotech-adjacent metro — for example, [Clear Creek Makerspace in the Denver area at $60/month](https://clearcreekmakerspace.com/memberships/). The address resolves as commercial under USPS CMRA classification.
  > - **Expertise: Aspirant.** LLC formation and maker space membership are commodity workflows.
  > - **Cost: ~$50–$100 setup + $720–$1,800/year** for the maker space, depending on city.
  > - **Lead-up time: 1–4 weeks** (LLC processing is the longest pole; everything else parallelizes).
  > - **Trace:** State business registry record naming the principal — publicly searchable and indexed by Open Corporates and Google. EIN application records the responsible party at the IRS. Maker space holds membership records.

  > **Bypass method — Real LLC + coworking space at biotech cluster.** Same LLC mechanics, but a biotech-cluster coworking space ($150–$500/month) gives a stronger commercial address with no CMRA flag and visual legitimacy if anyone checks. **Cost: ~$1,800–$6,000/year.** Otherwise identical.

  > **Bypass method — Real LLC + virtual office.** Virtual office services ($50–$200/month) provide a mail-handling address. Some are flagged as CMRAs by classification tools — selection matters. **Cross-measure trace cost:** Virtual offices require [USPS Form 1583](https://www.anytimemailbox.com/usps-form-1583), which means the virtual office holds a notarized copy of the attacker's government ID image — a strong identity commitment beyond what the synthesis provider sees.

- **Why relevant:** The whole bypass set is constructed to manufacture an address-affiliation tie for a fabricated community lab — the address must publicly associate with the claimed entity.
- **Persistent supply chain?** N

---

## shell-nonprofit

- **Branch slug:** shell-nonprofit
- **Profile:** purpose-built-organization
- **Target description:** Attacker forms a real shell entity (LLC or 501(c)(3) variant) registered to a virtual office at a biotech metro, with bank account and accomplices, to walk the institutional-address association check by construction.
- **Bypass excerpts:**

  > #### Real-entity registration with virtual-office shipping
  >
  > - **What the attacker does:** Files a DE/WY/NM LLC (or 501(c)(3) for the persistence variant), obtains an EIN, rents a virtual office in a biotech metro, opens a business bank account, and recruits one accomplice as the second registered contact.
  > - **Expertise:** Novice for entity formation; Practitioner for accomplice recruitment (social engineering and trust-building to find someone willing to commit their name to a shell).
  > - **Cost:** Entity + infrastructure: $900–$4,160 (DE/WY/NM LLC $50–$110; registered agent $50–$300/yr; EIN $0; domain + Workspace $100–$250; virtual office 4–6 months $600–$3,000; website $100–$500; bank account $0 in fees). Accomplice (M3-only role for Matrix A): $1,000–$5,000, scaled from the nominee-director market rather than the full four-role rate ([ICIJ offshore formation data](https://offshoreleaks.icij.org/)). **Matrix A one-off total: $1,900–$9,160** ([DE fees](https://corp.delaware.gov/fee/); [WY fees](https://www.businessrocket.com/business-corner/start/llc/cost-wyoming/); [Regus](https://www.regus.com/en-us/united-states/new-york/virtual-offices); [Mercury](https://www.nerdwallet.com/business/banking/reviews/mercury-banking)).
  > - **Lead-up time:** 6–14 weeks total. LLC filing 1–3 weeks; EIN minutes; virtual office 1 week; bank account 1–4 weeks (1–3 expected fintech denials); accomplice recruitment 2–6 weeks.
  > - **Attacker trace:** State business registry publicly lists attacker as principal; IRS has EIN tied to attacker's SSN; virtual-office lease in entity name; bank CIP/CDD records with attacker's real ID and SSN. **No FinCEN BOI filing required for US-formed entities** as of March 2025 ([FinCEN IFR](https://www.fincen.gov/news/news-releases/fincen-removes-beneficial-ownership-reporting-requirements-us-companies-and-us)). Accomplice's identity on file at IAL1 database validation.

  > #### Foreign-formation sub-variant
  >
  > - **What the attacker does:** Forms the entity in a foreign jurisdiction (UK CIC, Estonian OÜ, Singapore Pte Ltd) and registers to do business in a US state.
  > - **Cost:** $300–$2,000 setup + annual fees ([UK Companies House CIC](https://www.gov.uk/government/publications/community-interest-companies-fees); [Estonia e-Residency](https://www.e-resident.gov.ee/)).

- **Why relevant:** The shell entity exists specifically to publicly tie a real address to a registered organization name so the address-affiliation check passes.
- **Persistent supply chain?** N

---

## cro-framing

- **Branch slug:** cro-framing
- **Profile:** purpose-built-organization
- **Target description:** Attacker forms a real US (or Estonian) LLC framed as a small CRO and pairs it with a virtual office, executive suite, or coworking address in a biotech metro to satisfy the registry/address check.
- **Bypass excerpts:**

  > **1. Real US LLC + virtual office in a biotech metro.**
  > - Expertise: **Aspirant** — commodity small-business formation done by hundreds of thousands of US LLCs/year.
  > - Cost: Wyoming LLC = $100 filing + $150–$300/yr registered agent ([NCH breakdown](https://nchinc.com/blog/business-startup/how-much-does-wyoming-llc-formation-cost/)). Delaware ~$90 filing + $300/yr franchise tax + $100–$300/yr agent (best guess from [Delaware fee schedule](https://corp.delaware.gov/fee/)). Regus virtual office in California from ~$50–$60/month ([Regus](https://www.regus.com/en-us/united-states/california/virtual-offices)). USPS Form 1583 notarization ~$25 online ([enotaryoncall](https://www.enotaryoncall.com/blog/usps-form-1583-faq-guide/)). Total: ~$300–$700 first month, ~$100–$300/month recurring.
  > - Lead-up time: Wyoming online filing 1–2 business days; full chain (LLC → virtual office → Form 1583 → bank approval) 2–6 weeks.
  > - Trace: State business registry (public, principal name searchable indefinitely); IRS EIN responsible party (private but subpoena-accessible); notarized Form 1583 with photo ID copies; virtual-office tenant KYC; bank KYC under BSA/AML; provider IDV under real name.

  > **2. Real US LLC + non-CMRA executive suite.**
  > - Expertise: Aspirant. Cost: $200–$400/month (best guess from Regus mid-tier listings). Lead-up time and trace as method 1, plus more credible mailroom records.

  > **3. Coworking-space lease (WeWork etc.).**
  > - Expertise: Aspirant. Cost: ~$300–$800/month dedicated desk in biotech metros (best guess). Lead-up: 1–4 weeks. Trace: adds coworking KYC.

  > **4. Foreign jurisdiction LLC + foreign virtual office (Estonian e-Residency).**
  > - Expertise: **Novice** — slightly above Aspirant for cross-border compliance.
  > - Cost: €265 OÜ registration + €150 e-Residency fee ([e-Residency fees](https://learn.e-resident.gov.ee/hc/en-gb/articles/360000625118-Costs-fees)); resident contact-person + registered address €600–€1,200/yr ([Nomad Labs](https://nomad-labs.com/estonian-e-residency-company-what-they-dont-tell-you/)).

- **Why relevant:** Links a real LLC's registry name to a public commercial address that passes association lookup.
- **Persistent supply chain?** N

---

## cro-identity-rotation

- **Branch slug:** cro-identity-rotation
- **Profile:** purpose-built-organization
- **Target description:** Attacker spins up multiple LLC personas, each with its own real address, rotating across providers. Each (entity, provider) pair must independently satisfy the address-affiliation check.
- **Bypass excerpts:**

  > **Method: Real LLC + virtual office (cheapest).**
  > - **What the attacker does:** Files a real LLC (Delaware, Wyoming, or New Mexico is typical) under a plausible CRO name, gets an EIN from the IRS, rents a virtual-office mailing address from a national provider in a biotech cluster (Regus, IWG, Alliance, Davinci), opens a real LLC bank account, and submits all of this to the synthesis provider.
  > - **Expertise:** Novice.
  > - **Cost:** Roughly $1,500–$1,700 per entity year 1: ~$110 Delaware filing fee plus $300 annual franchise tax ([Delaware Division of Corporations Fee Schedule](https://corp.delaware.gov/fee/), [IncNow Delaware LLC fees guide](https://www.incnow.com/delaware-llc/fees/)), $50–$300 registered-agent service, ~$1,000/year virtual office at biotech-cluster locations such as Rockville, Maryland ($59–$89/month per [Regus Rockville Virtual Offices](https://www.regus.com/en-us/united-states/maryland/rockville/virtual-offices)), domain ~$15, and Google Workspace ~$72.
  > - **Attacker trace:** State LLC filings record the principal/manager (the attacker's real name in most jurisdictions); IRS EIN records the responsible party (real person); virtual-office lease records the tenant's identity AND the forwarding destination — a single subpoena from law enforcement to the virtual-office operator would yield the attacker's real receive address.

  > **Method: Real coworking space lease (middle-cost upgrade).**
  > - **What the attacker does:** Rents an actual dedicated desk at a coworking space (WeWork, Industrious, or a local biotech-friendly coworking provider) instead of a virtual office, so the address resolves cleanly to a commercial building rather than a mail-handling location.
  > - **Cost:** ~$150–$700/month per entity for a dedicated desk depending on city, with biotech-cluster cities at the higher end.

- **Why relevant:** Each rotated LLC must establish a fresh public link between the entity name and a real address; this is the entire address-association gate.
- **Persistent supply chain?** N

---

## dormant-domain

- **Branch slug:** dormant-domain
- **Profile:** purpose-built-organization
- **Target description:** Attacker revives a defunct lab's domain and identity, then registers a shipping address that publicly resembles the revived lab's geographic identity (residential, virtual office, or biotech coworking).
- **Bypass excerpts:**

  > **Bypass A — Self-register the revived lab:**
  > - **What the attacker does:** Registers the revived entity on the provider's organization registry using the reanimated domain and the attacker's real IAL1 identity as primary contact.
  > - **Attacker trace:** Org name, web address, and attacker's real identity as primary contact in the provider's registry.

  > **Bypass B — Address sourcing (virtual office / residential / mail aggregator):**
  > - **What the attacker does:** Provides a shipping address consistent with the revived lab's geographic identity. Three options: residential (if the attacker lives in the target metro — $0 marginal), virtual office ($100–$500/mo; CMRA-flag risk per [Smarty docs](https://www.smarty.com/docs/cmra)), or biotech coworking ($500–$2,000/mo with its own KYB intake). Cheapest CMRA-flag-safe path is genuine local residency.
  > - **Cost:** $0 (residential) to $100–$500/mo (virtual office) to $500–$2,000/mo (biotech coworking).
  > - **Attacker trace:** Lease or aggregator account under attacker's real name with real payment. USPS Form 1583 on file at the CMRA. Physical delivery location known.

- **Why relevant:** The revived lab's web identity must publicly point to a geographically consistent shipping address — the association is what makes the dormant identity reusable.
- **Persistent supply chain?** N

---

## gradual-legitimacy-accumulation

- **Branch slug:** gradual-legitimacy-accumulation
- **Profile:** purpose-built-organization
- **Target description:** Attacker accumulates 12+ months of legitimate-looking history under a real LLC at a real address before placing the SOC order, so the address-affiliation tie is genuinely public by the time it matters.
- **Bypass excerpts:**

  > **Method 1 — Virtual office in a biotech metro (BASELINE).** Rent a virtual office in San Diego, Boston, the Research Triangle, or the Bay Area from a commercial provider. Costs start around $49/month per [Alliance Virtual Offices (February 2024)](https://www.alliancevirtualoffices.com/virtual-office-blog/regus-virtual-office-comparison/); Regus has locations in La Jolla and downtown San Diego per their current product pages. The address resolves to a real commercial building in classification databases. Expertise: Novice. Lead-up time: 1–4 weeks to set up. Trace: virtual-office contract in the LLC's name, paid by LLC card; the address is tagged by classification databases as a virtual office. Cross-measure dependency: the address may downgrade Measure 4's signal unless the 12-month buildup gives the provider a reason to treat it as stable.

  > **Method 2 — Incubator bench (Branch D variant).** Rent a bench at a biotech incubator such as LabCentral, BioLabs, or Genspace. LabCentral's Cambridge bench was reported at around $4,600/month in [contemporaneous 2019 STAT News reporting](https://www.statnews.com/2019/03/06/labcentral-bench-startups-kendall/); cheaper regional incubators fall in the $500–$3,000/month range. Expertise: Novice. Lead-up time: 2–8 weeks for admission. Trace: incubator lease, tenant vetting records, possible directory listing, and physical presence at the facility. This is the strongest Measure-3 path and it also strengthens Measure 4 and enables two Measure-9 variants.

  > **Method 4 — Nominee manager.** Use a nominee manager service in Delaware/Wyoming/New Mexico (~$500–$2,000/year) so the attacker's name does not appear on public LLC filings.

- **Why relevant:** The 12-month accumulation strategy is built around making the LLC↔address tie publicly findable (Open Corporates, classification DBs, possibly tenant directories) by order time.
- **Persistent supply chain?** N

---

## inbox-compromise

- **Branch slug:** inbox-compromise
- **Profile:** impersonate-employee
- **Target description:** Attacker compromises a small-college `.edu` inbox and orders synthesis under that persona, redirecting shipment to an address that must associate plausibly with the institution.
- **Bypass excerpts:**

  > 2. **CMRA or virtual office in institution's metro**
  >    - File USPS PS Form 1583 at a Commercial Mail Receiving Agency in the target college's town ([Alliance Virtual Offices](https://www.alliancevirtualoffices.com/virtual-office-blog/cmra-compliance-explained-what-the-usps-actually-requires-from-virtual-office-users/)).
  >    - Expertise: **Novice** — routine filing; detecting providers that flag CMRAs requires light OSINT.
  >    - Cost: $20–$100/month ($19–$100 plan + $5–$25 notarization).
  >    - Lead-up time: 1–7 days.
  >    - Attacker trace: Form 1583 record held by CMRA and submitted to USPS CRD quarterly (retained indefinitely). Attacker's real ID scanned and held by the CMRA operator. Payment method on file.
  >    - Key caveat: SmartyStreets and similar address-validation APIs flag CMRA addresses from the USPS-published CMRA list. A provider with one line of address-hygiene code catches this.

  > 6. **Registry address-change workflow (strong baseline)**
  >    - Navigate a controlled change workflow to redirect approved shipping.
  >    - Expertise: **Practitioner.**
  >    - Cost: $0 direct; collapses into two-inbox + accomplice if second-approver review is required.
  >    - Lead-up time: Days to weeks.
  >    - Attacker trace: Address-change audit log entry at provider.

- **Why relevant:** A CMRA in the institution's metro is selected specifically to associate the address geographically with the claimed institution; the registry address-change workflow targets the institution-association tie directly.
- **Persistent supply chain?** N

---

## foreign-institution

- **Branch slug:** foreign-institution
- **Profile:** fake-affiliation
- **Target description:** Attacker claims affiliation with a foreign academic institution and must produce a shipping address that the provider can associate (or fail to disassociate) with that institution.
- **Bypass excerpts:**

  > **Method 1: In-country freight forwarder + fabricated "satellite office" framing (variant 3a).** The attacker opens a forwarder account in the institution's country, ships to the forwarder's commercial address, and re-exports.
  > - Expertise: Practitioner — business-formation literacy in a foreign jurisdiction, local KYC workaround, customs navigation.
  > - Cost: $350-$1,500 setup (forwarder account $50-$200; local KYC workaround such as CPF/MyNumber/PAN $200-$1,000; fabricated local-language "research annex" letter $50-$200) plus $50-$300 per shipment handling.

  > **Method 2: Real institution address + local accomplice receiver.** A paid local person receives the package at the institutional address and forwards it.
  > - Expertise: Novice. Cost: $200-$1,500 per package (accomplice payment).

  > **Method 4: Residential address framed as researcher's home office.**
  > - Expertise: Novice. Cost: $500-$2,000/month short-term rental if no in-country address; $0 if they do.

  > **Method 5: Virtual office in institution's metro.**
  > - Expertise: Novice. Cost: $50-$200/month ([MailMate Tokyo guide](https://mailmate.jp/blog/virtual-offices-tokyo) citing Regus rates from ~¥7,900/month).
  > - Attacker trace: Regus/local provider has attacker's real name and payment method. CMRA databases may independently flag the address to the provider — weakest M3 option under a strict registry baseline.

- **Why relevant:** Multiple methods are explicitly framed around resolving an address that ties to the foreign institution — "satellite office," "researcher's home office," "virtual office in institution's metro."
- **Persistent supply chain?** N

---

## credential-compromise

- **Branch slug:** credential-compromise
- **Profile:** impersonate-employee
- **Target description:** Attacker compromises a real PI's account and must redirect physical shipment of synthesis away from the PI's institution to a drop address — defeating the institution-address association the PI's account inherits.
- **Bypass excerpts:**

  > **Binding?** Weakly. Friction depends almost entirely on whether carrier-account redirect is available. Under the US baseline (UPS My Choice, FedEx Delivery Manager), it is — so the measure is effectively bypassed at $0 and about 30 minutes of work. Meaningful friction only appears when carrier redirect is blocked and the attacker must physically intercept at the mailroom or file a USPS change of address.

  > - **Carrier account takeover for package redirect (dominant cheapest path).** The attacker creates a UPS My Choice or FedEx Delivery Manager account in the target's name using the PII and email access they already have, and redirects the shipment to a drop address.
  >   - Expertise: Amateurish. Routine consumer account setup.
  >   - Cost: $0 incremental.
  >   - Lead-up time: ~30 minutes.
  >   - Attacker trace: Carrier account creation records, redirect request logs with timestamp and new delivery address. The new delivery address is the highest-durability forensic artifact in the cheapest path.

  > - **USPS change of address redirect.** The attacker files a USPS COA in the target's name to forward mail from the institution to a drop address.

- **Why relevant:** Carrier redirect and USPS COA both move the shipment from an institution-associated address to a non-associated drop — the institution-address tie is the gate the attacker is defeating.
- **Persistent supply chain?** N

---

## account-hijack

- **Branch slug:** account-hijack
- **Profile:** impersonate-employee
- **Target description:** Attacker hijacks an existing PI provider account and either intercepts at the PI's institutional address or uses the registry to add an attacker-controlled "satellite" address — directly attacking the institution-address association.
- **Bypass excerpts:**

  > **Method 1: Physical interception at the PI's approved institutional address.** The attacker (or a paid local confederate) picks up the package at the university mailroom or loading dock by posing as lab personnel.
  > - Expertise: Minimal — physical presence and basic social engineering at a receiving dock.
  > - Cost: $200–2,000 if hiring a local confederate; $50–500 in travel if the attacker goes directly.
  > - Attacker trace: High for the physical step. University mailrooms and loading docks have near-universal camera coverage; hazmat-receiving desks at major research universities often require named-recipient pickup with university ID.

  > **Method 2: Social-engineered address change to an attacker-controlled drop.** From the compromised email, the attacker requests the provider add a new "collaborator lab" or "satellite facility" shipping address.
  > - Expertise: Minimal — composing an email matching the PI's communication style (available from inbox history).
  > - Cost: $0 incremental.
  > - Lead-up time: Hours to draft; 1–3 business days for provider processing.
  > - Attacker trace: Moderate. Provider logs the change request. The second registered contact may receive a notification the attacker cannot suppress.

- **Why relevant:** Method 2 is a direct attack on the address-association control: introduce a new "satellite facility" address that appears institution-linked but is attacker-controlled.
- **Persistent supply chain?** N

---

## it-persona-manufacturing

- **Branch slug:** it-persona-manufacturing
- **Profile:** fake-affiliation
- **Target description:** Attacker manufactures a fake researcher persona inside a real institution's IT footprint and routes synthesis through the host lab's existing org record, leveraging or evading the institution-address association via redirect or sibling-org sub-paths.
- **Bypass excerpts:**

  > **Sub-path A -- Add to existing org record (cheapest):**
  > - **What the attacker does:** Has the rubber-stamping PI submit an add-contact request to add the manufactured persona to the host lab's existing provider account.

  > **Sub-path C -- Sibling org record at the same institution:**
  > - **What the attacker does:** Registers a separate org record for a different department or center at the same institution, using the manufactured persona.
  > - **Expertise:** Practitioner.
  > - **Cost:** $0.
  > - **Lead-up time:** Days.

  > **Shipping sub-paths:**
  > - **Ship to host lab building + intercept:** Physical mailroom interception (Practitioner, $0, requires physical access), delivery-notification interception (Practitioner, $0, requires notifications to route to persona's alias), or carrier rerouting via UPS My Choice / FedEx Delivery Manager (Novice, $0--$20/year + per-package fees [no source found; searched for: "UPS My Choice reroute cost 2025", "FedEx Delivery Manager alternate address fee"]).
  > - **Ship to second institutional address:** Practitioner, $0, requires legitimate pickup access at a second institutional location.
  > - **Attacker trace:** Delivery records name the host lab or second address; carrier-reroute events are logged by the carrier and cannot be suppressed by the attacker.

- **Why relevant:** Sibling-org sub-path manufactures a new institution-address tie inside a real institution; carrier reroute moves the shipment off that tie.
- **Persistent supply chain?** N

---

## visiting-researcher

- **Branch slug:** visiting-researcher
- **Profile:** fake-affiliation
- **Target description:** Attacker poses as a short-term visiting researcher and attaches to a host university's organization record, with shipping going either to the host lab's institutional address or to an off-campus virtual office in the host's metro.
- **Bypass excerpts:**

  > **Option 1 — Attach to existing university org record (auto-approval variant):**
  > - The attacker's `.edu` email matches the university's domain, so the provider's org-record lookup resolves automatically.

  > **Option 3 — Ship to host lab's institutional address:**
  > - Attacker asks sponsor "where should deliveries go?" and uses the lab's standard receiving address.
  > - **Attacker trace:** Order shipped to a real institutional address with attacker's real name as addressee. Mailroom logs record package receipt; lab-level receiving records the handoff.

  > **Option 4 — Off-campus residential/commercial fallback:**
  > - Attacker sets up a virtual office in the university's metro and navigates the provider's address-approval workflow.
  > - **Expertise:** Novice — requires constructing a plausible institutional link.
  > - **Cost:** $50–$300/mo ([Regus](https://www.regus.com/en-us/virtual-office)).
  > - **Attacker trace:** Virtual-office operator creates additional commercial KYC records (name, ID, billing) beyond the institutional address.
  > - **Caveat:** Only needed if the host lab address is unavailable or the attacker wants to avoid lab-level package handling.

- **Why relevant:** Option 4 explicitly engages the address-approval workflow by constructing a "plausible institutional link" through a metro-matched virtual office.
- **Persistent supply chain?** N

---

## dormant-account-takeover

- **Branch slug:** dormant-account-takeover
- **Profile:** exploit-affiliation
- **Target description:** Attacker takes over a dormant provider account that already has approved institution-linked shipping addresses, then either uses an inherited alternate address or files a controlled address change.
- **Bypass excerpts:**

  > **Bypass B — Ship to alternate registered address:**
  > - **What the attacker does:** Uses an alternate address already registered on the dormant account (satellite lab, collaborator, CRO) with weaker physical security.
  > - **Expertise:** Aspirant — uses inherited configuration.
  > - **Attacker trace:** Physical-layer exposure at alternate site; typically less instrumented.

  > **Bypass D — Address change to attacker-controlled destination:**
  > - **What the attacker does:** Submits a controlled-change request on the provider account. Fires the provider's change-review workflow. Used only as last resort.
  > - **Expertise:** Practitioner.
  > - **Attacker trace:** Highest provider-side visibility in the branch. Change-request audit trail.

- **Why relevant:** Bypass D directly engages the address-change/association review workflow; Bypass B exploits already-approved institution-linked alternates.
- **Persistent supply chain?** N
