# Measure 09 — institution-real-life-sciences

**Measure:** Verify the institution is real and relevant to life sciences. E.g., confirm org exists via corporate registry or legal ID; check address. Flag if institution is fabricated (no legal entity or discoverable history on third-party websites).

Attacker stories below either fabricate an "institution" from scratch (purpose-built shells / CROs / community labs / incubator tenants) or rely on a real-but-thin institution whose life-sciences signature would not survive an aggressive entity-reality check. Stories where the attacker operates inside a genuine, well-known research institution (account-hijack, credential-compromise, insider-recruitment, lab-manager-voucher, unrelated-dept-student, visiting-researcher, inbox-compromise, bulk-order-noise-cover, it-persona-manufacturing) are excluded — for them this measure is satisfied by construction.

Source files reference "Measure 4 — Research & entity signals" and "Measure 3 — Organization registry + verified shipping address" from the wg pipeline; both stress the same defender capability (does the entity exist as a real life-science organization?) and are excerpted together where relevant.

---

## 1. shell-company

- **Profile:** purpose-built-organization
- **Target description:** A newly-incorporated Delaware LLC with no publications, no grants, no regulatory filings, and no order history — "exactly the signal profile Measure 4 is designed to flag." The attacker actively produces entity signals to approximate a real small biotech.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > **Bypass method 1: Build entity signals from scratch**
  >
  > **What the attacker does:** Incorporates a Delaware LLC, gets an EIN and DUNS number, rents either a virtual office or a co-working lab bench in a biotech hub (Boston, San Diego, RTP, Bay Area), stands up a professional website and LinkedIn profiles, posts one or two bioRxiv preprints, and places routine non-sequence-of-concern orders for several months to build a purchasing track record before attempting a sequence-of-concern order.
  >
  > **Expertise:** STIX **intermediate** — someone who can plan and execute a multi-month setup using commercially available services (registered agents, co-working labs, web hosting) and has enough biotech fluency to make the cover look like a real small biotech. No custom tools or advanced tradecraft.
  >
  > **Cost:**
  > - **Virtual-office tier:** ~$5-15K initial + $500-2K/month ongoing. All-in over the 9-month credibility window: **~$10-30K.**
  > - **Lab-bench tier:** ~$8-20K initial + $2.5-5.5K/month ongoing. All-in over 9 months: **~$30-70K.**
  >
  > Component costs: Delaware LLC formation $300-500; annual franchise tax $300; EIN free; DUNS free (8-30 days) or $229 expedited; virtual office $50-300/mo; co-working lab bench $2-5K/mo; professional website $3-8K one-time; aged domain $100-2,000 if the attacker wants to compress the domain-age waiting period; LinkedIn profiles free (no verification); bioRxiv preprints free, live within 72 hours; initial non-SOC orders $500-2K.
  >
  > **Lead-up time:** **6-12 months** to first sequence-of-concern order. The critical path is order-history building plus domain/entity age; these run **in parallel**, not sequentially. Pure administrative setup (LLC, EIN, bank, website, lab lease) takes 2-4 weeks.

  > **Bypass method 2: Acquire an existing company**
  >
  > **What the attacker does:** Buys an existing biotech/consulting entity from a business brokerage (e.g., Acquire.com), inheriting its formation history, aged domain, and — in the premium version — live synthesis-provider accounts and order history.
  >
  > **(a) Dormant / micro-CRO acquisition (cheap tier):** **$50-100K** for a dormant or micro biotech consulting firm or small CRO with under $1M revenue... The attacker gets formation history, aged domain, possibly legacy customer references — but typically no active provider accounts. **Time to first SOC order: ~8-14 months**.
  >
  > **(b) Going-concern with live provider accounts (premium tier):** **$150-300K+**. Provider accounts "are not typically listed as assets in business sales," so identifying targets requires diligence beyond brokerage listings... The attacker gets live provider relationships and established entity signals. **Time to first SOC order: ~3-6 months**.

- **Why relevant:** Entire branch is engineered around producing the surface artifacts (LLC filing, EIN/DUNS, website, preprints, order history) that an "is this institution real and a life-science org?" check looks for. Measure 09 is precisely the binding gate.

---

## 2. shell-nonprofit

- **Profile:** purpose-built-organization
- **Target description:** A research nonprofit shell whose name is constructed to near-collide with a real, better-known research institution so that casual review pulls in the real institution's publications and grants by mistake.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > #### Name-collision reflected legitimacy
  >
  > - **What the attacker does:** Registers an entity name that near-collides with a real research institution in the same vertical (e.g., "Midwest Institute for Genomic Health" alongside a real "Midwest Genomics Institute"). When a reviewer searches the entity name, Google results bleed the real institution's publications and grants into the picture.
  > - **Expertise:** Novice — patient name-space research and picking a plausible near-collision.
  > - **Cost:** $0 marginal (name choice made at entity registration).
  > - **Lead-up time:** Hours to days to identify a good collision target.
  > - **Attacker trace:** State filing publicly shows the entity name; the collision is discoverable by anyone who runs deliberate name-disambiguation (checking EIN, incorporation date, principal name, side-by-side domain comparison).
  > - **Key uncertainty:** Per-review conflation probability estimated at 40–70% with no empirical basis. If providers deploy deliberate name-disambiguation, the probability collapses to near zero and the branch fails entirely.

  > #### Thin-but-checkable website
  >
  > - **What the attacker does:** Builds a templated website with a "team" page, research focus area, and contact information. Pre-ages the domain via Wayback Machine snapshots and organic crawl indexing.
  > - **Cost:** $100–$500 (template build via Wix/Squarespace or Fiverr/Upwork).
  > - **Lead-up time:** 1–2 weeks build + 2–6 months pre-aging before it looks non-fresh.

  > #### Seed the principal's footprint (persistence variant)
  >
  > - **What the attacker does:** Produces 1–2 credible methods preprints on bioRxiv/OSF/Zenodo, creates an ORCID iD and Google Scholar profile, and lists the shell as affiliation. LLM-assisted drafts can pass bioRxiv's screening, though OSF/Zenodo have lighter screening and produce lower-signal preprints.
  > - **Expertise:** Practitioner — producing a credible methods preprint requires real domain knowledge.
  > - **Cost:** $0 in dollars; 40–120 hours of effort per preprint.
  > - **Lead-up time:** 2–6 months including drafting, submission, and Google Scholar indexing lag.

  > #### Real-entity registration with virtual-office shipping
  >
  > - **What the attacker does:** Files a DE/WY/NM LLC (or 501(c)(3) for the persistence variant), obtains an EIN, rents a virtual office in a biotech metro, opens a business bank account, and recruits one accomplice as the second registered contact.
  > - **Cost:** Entity + infrastructure: $900–$4,160 (DE/WY/NM LLC $50–$110; registered agent $50–$300/yr; EIN $0; domain + Workspace $100–$250; virtual office 4–6 months $600–$3,000; website $100–$500; bank account $0 in fees).

- **Why relevant:** The branch's headline trick directly attacks institution-reality verification: it relies on a corporate-registry record that exists but is a deliberate near-collision designed to defeat casual life-sciences-relevance lookups.

---

## 3. cro-framing

- **Profile:** purpose-built-organization
- **Target description:** A real US LLC presented as a small contract-research-organization. The CRO cover story is designed to neutralize entity-signal checks because real small CROs legitimately have no publications, no grants, and no IBC.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > **1. Real US LLC + virtual office in a biotech metro.**
  > - Expertise: **Aspirant** — commodity small-business formation done by hundreds of thousands of US LLCs/year.
  > - Cost: Wyoming LLC = $100 filing + $150–$300/yr registered agent. Delaware ~$90 filing + $300/yr franchise tax + $100–$300/yr agent. Regus virtual office in California from ~$50–$60/month. USPS Form 1583 notarization ~$25 online. Total: ~$300–$700 first month, ~$100–$300/month recurring.
  > - Lead-up time: Wyoming online filing 1–2 business days; full chain (LLC → virtual office → Form 1583 → bank approval) 2–6 weeks.
  > - Trace: State business registry (public, principal name searchable indefinitely); IRS EIN responsible party (private but subpoena-accessible); notarized Form 1583 with photo ID copies; virtual-office tenant KYC; bank KYC under BSA/AML; provider IDV under real name.

  > ### Measure 4 — Research & entity signals
  >
  > - **Binding?** Yes — but the CRO cover story is *designed* to neutralize it. Small CROs legitimately have no publications, no grants, no IBC, so absence doesn't differentiate the attacker from real customers.
  >
  >   **1. CRO services-page cover story.** Novice (CRO domain literacy, no tradecraft). Cost ~$16–$30/month for a Squarespace-style template + <$20 domain. Lead-up: 4–8 hours of writing. Quality risk: a biology-literate critical reviewer could detect AI/template content; baseline provider review is unlikely to be biology-literate.
  >
  >   **2. LinkedIn personas for 1–2 founders.** Aspirant. $0. 1–2 hours/profile. Permanent public trace under real name.
  >
  >   **3. Fabricated team — 3–5 employee LinkedIn personas.** Novice (AI photos, profile maintenance). $0–$30/month if Premium added. 2–4 hours/profile + ongoing maintenance.
  >
  >   **4. ORCID + Google Scholar self-affiliation.** Aspirant. $0 — or $200–$5,000 if combined with a paid co-authorship slot.
  >
  >   **5. Crunchbase / company-database self-listing.** Aspirant. $0. 30 min. Public listing tied to LLC name.
  >
  >   **6. Aged-domain purchase.** Novice. $50–$5,000 depending on age/traffic. 1–4 weeks for transfer.
  >
  >   **7. Predatory-journal publication seeding.** Novice. $180–$5,000 per slot. 1–6 months.
  >
  >   **8. No publication strategy — accept thin profile.** Aspirant. $0. None.

- **Why relevant:** The CRO posture exists specifically to make "fabricated institution" indistinguishable from "thin-signal real CRO." Verifying life-sciences relevance against the absence of publications/grants is exactly what the cover story neutralises.

---

## 4. cro-identity-rotation

- **Profile:** purpose-built-organization
- **Target description:** A single individual files 2–4 small CRO LLCs in different US biotech metros, runs each as a clean small business (real LLC, real bank account, real virtual office, custom email domain), and uses each entity at a different subset of synthesis providers to spread the pattern.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > - **Method: Real LLC + virtual office (cheapest).**
  >   - **What the attacker does:** Files a real LLC (Delaware, Wyoming, or New Mexico is typical) under a plausible CRO name, gets an EIN from the IRS, rents a virtual-office mailing address from a national provider in a biotech cluster (Regus, IWG, Alliance, Davinci), opens a real LLC bank account, and submits all of this to the synthesis provider.
  >   - **Cost:** Roughly $1,500–$1,700 per entity year 1: ~$110 Delaware filing fee plus $300 annual franchise tax, $50–$300 registered-agent service, ~$1,000/year virtual office at biotech-cluster locations such as Rockville, Maryland ($59–$89/month per Regus Rockville Virtual Offices), domain ~$15, and Google Workspace ~$72.
  >   - **Lead-up time:** 3–6 weeks per entity end-to-end. Constituent steps: LLC filing 1–10 business days, EIN immediately upon online approval but limited to one EIN per responsible party per day, bank account 1–3 weeks, virtual office same day to 1 week, provider intake review 1–2 weeks.

  > - **Method: CRO cover-story neutralization.**
  >   - **What the attacker does:** Frames the entity as a contract research organization. Writes a services description (contract cloning, assay development, methods-for-hire) that is mundane enough to be unremarkable but specific enough to sound like a real small shop.
  >   - **Expertise:** Practitioner — requires enough domain literacy to write a credible CRO services description.
  >   - **Cost:** $0 (a few hours of writing).
  >   - **Lead-up time:** 4–8 hours per entity.

  > - **Method: Synthetic web/persona depth.** Builds a one-page services website, creates LinkedIn profiles for one or two "founders," registers ORCID profiles (free, self-asserted), optionally creates a Google Scholar profile.
  > - **Method: Fake client list / case studies.** Publishes a "selected clients" or anonymized case-study section on the website listing plausible-sounding pseudonymous clients.
  > - **Method: Crunchbase / press-release seeding.** Submits a Crunchbase entry (free, self-submitted) and distributes a paid press release through PRWeb or EIN Presswire ($100–$400).
  > - **Method: Conference attendee badge.** Buys an attendee badge for a major life-science meeting (SLAS, AACR, Bio-IT World) under the LLC name, creating a real public attendee record. Cost: $500–$1,800 per badge.

  > **The load-bearing observation for this branch is that *no shared organization registry exists across synthesis providers* — each (entity, provider) pair is evaluated independently, so the attacker can repeat the same passable artifact across providers and across entities without inheriting any cross-pair history.**

- **Why relevant:** Each entity must independently pass an institution-reality / life-sciences-relevance check at every provider. Branch's claim is that current implementations of measure 09 cannot tell a fresh CRO LLC apart from the legitimate small-CRO population.

---

## 5. biotech-incubator-tenant

- **Profile:** purpose-built-organization
- **Target description:** An LLC that leases real bench space at a recognized biotech incubator (BioLabs, LabCentral, Genspace), converting money into a clean physical biotech-building address and leaning on the reflected legitimacy of neighboring real biotech tenants when reviewers check entity signals.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > **3a — Bench-space lease at a recognized biotech incubator.** The attacker surveys incubators, prepares a brief application package (research focus, team bio, sometimes proof of insurance), submits it, attends a tour or short interview, signs a lease in the LLC's name, and pays deposit plus first month's rent.
  > - Expertise: Novice. Selective university-affiliated incubators (Harvard iLab, Stanford StartX) require articulating a credible scientific pitch and are not viable for a non-scientist attacker. Commercial-coworking-style biotech incubators in secondary metros are.
  > - Cost: Roughly $1,500–$5,000 per month for a single bench in a recognized biotech building. LabCentral in Cambridge, MA charges $4,600 per month per bench; BioLabs San Diego advertises bench-rate memberships at approximately $2,200 per month. For a one-year operational window the attacker pays $18,000–$60,000 in rent alone.
  > - Lead-up time: A few days to several weeks at light-vetting commercial incubators; weeks to months at selective university-affiliated programs.
  > - Attacker trace: Incubator lease records under the LLC name; the principal's identity is vetted independently by the incubator (sometimes including a brief scientific pitch — a non-scientist principal can fail this in a *visible*, recorded way); badge and access logs; mailroom logs; public tenant directory listing.

  > **4a — Reflected legitimacy from incubator tenancy.** Lean on the measure-3 incubator address, a one-page LLC website describing the research focus in early-stage-startup language, LinkedIn bios for the 1–2 person team, and the incubator's tenant directory listing. Cite "early-stage stealth biotech, pre-publication, pre-grant" as the explanation for thin signals — a real and common posture for first-year tenants.

  > **4c — Build a real (light) order history before SOC.** Place several routine non-SOC orders (primers, gene blocks, plasmid backbones) over 1–3 months. Risk-scoring systems weight clean order history positively.

  > **4d — Real preprint output (stronger signal).** Conduct a small wet-lab project at the incubator (or commission a real assay from a CRO) and post a preprint on bioRxiv. The work may be entirely legitimate within the LLC's stated research area.

  > **4f — Buy an aged dormant biotech LLC.** Purchase a dormant existing biotech entity from a business broker. Inherits aged registration and possibly aged domain or prior order history. Cost: Roughly $500 to several thousand dollars.

- **Why relevant:** The incubator-tenant directory listing is the load-bearing artifact that turns a brand-new LLC into something that looks "real and life-sciences" to a corporate-registry-plus-address check. The branch's whole purpose is to defeat measure 09 with a small but real spend.

---

## 6. gradual-legitimacy-accumulation

- **Profile:** purpose-built-organization
- **Target description:** A real-but-hollow small biotech or CRO operated for 6–12 months before any controlled-sequence orders. Time, not money, is the load-bearing resource: the attacker accumulates a domain-age, order-history, ORCID and preprint trail until the entity looks "thin but typical of a real new small biotech."
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > **Method 1 — Time-aged domain and clean order history.** Register the domain at month 0 and place 5–20 small non-controlled orders (oligos, primers, gene fragments) over 12 months — $500–$2,000 in real synthesis spend plus shipping. By month 12 the provider's risk system shows a year of customer tenure, a clean payment record, and a real order pattern. Expertise: Novice. Lead-up time: 6–12 months. Trace: every order is a permanent dated provider record tied to the attacker's name and LLC.
  >
  > **Method 2 — Aged domain auction purchase (compression variant).** Buy a 5+ year expired domain whose name fits the LLC via GoDaddy Auctions or NameJet. Price range $50–$5,000 with most biotech-adjacent expired domains in the $100–$1,000 range.
  >
  > **Method 3 — ORCID profile and pay-to-publish article.** Create an ORCID profile (free; self-registration allows any self-asserted affiliation) and publish a methods note or short technical write-up in a low-barrier journal. APCs for reputable pay-to-publish tiers (PLOS ONE, Frontiers) are $1,500–$3,000. Total 3–6 months.
  >
  > **Method 4 — Paper-mill purchased authorship (compression variant).** Buy an authorship slot on an existing accepted manuscript via a paper-mill broker. Estimated price $200–$5,000 per slot.
  >
  > **Method 5 — bioRxiv preprint.** Post a preprint on bioRxiv with the LLC as affiliation. Free.
  >
  > **Method 6 — Conference poster.** Attend a small biotech conference and present a poster. Registration $300–$1,500 plus travel $500–$2,000.
  >
  > **Method 7 — Crunchbase, AngelList, and similar listings.** Free self-serve profiles listing the LLC.
  >
  > **Method 8 — SBIR or state-grant application (no award).** Submit an NIH SBIR Phase I or state economic-development application.

  > **Method 1 — Virtual office in a biotech metro (BASELINE).** Rent a virtual office in San Diego, Boston, the Research Triangle, or the Bay Area from a commercial provider. Costs start around $49/month. Method 2 — Incubator bench (Branch D variant). LabCentral's Cambridge bench was reported at around $4,600/month; cheaper regional incubators fall in the $500–$3,000/month range.

- **Why relevant:** Branch is engineered around the assumption that measure 09 weights tenure and accumulated artifacts. Aging the domain, seeding ORCID/preprints/Crunchbase, and placing benign orders are precisely the moves that turn a freshly fabricated "institution" into one with discoverable life-sciences history.

---

## 7. community-bio-lab-network

- **Profile:** purpose-built-organization
- **Target description:** Two or three "community biology labs" registered as real LLCs/nonprofits in underserved metros — Denver, Tucson, Kansas City — with real domains, maker-space addresses, bank accounts, and DIYbio.org listings. The defining feature is operating in a customer class whose legitimate members genuinely lack publications, grants, and university IBC oversight.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > **Bypass method — Real LLC + maker space address.** File an LLC in New Mexico ($50, no annual report) or Wyoming ($100 + $60/year). Obtain an EIN from the IRS. Rent a maker space membership in a biotech-adjacent metro — for example, Clear Creek Makerspace in the Denver area at $60/month. The address resolves as commercial under USPS CMRA classification.
  > - **Cost: ~$50–$100 setup + $720–$1,800/year** for the maker space, depending on city.
  > - **Lead-up time: 1–4 weeks**.
  > - **Trace:** State business registry record naming the principal — publicly searchable and indexed by Open Corporates and Google. EIN application records the responsible party at the IRS. Maker space holds membership records.

  > **Bypass method — Minimal community-bio web presence + DIYbio.org listing.** A one-page website (template, $0–$240/year) describing educational programming, open-equipment policy, and community research interests. Request a listing on the DIYbio.org local directory, which adds groups within ~24 hours of being notified with no formal scientific vetting. Join one or two community bio Slack groups. Allow the domain at least 30 days to age before the provider account is created (or buy an aged domain for ~$50–$300).
  >
  > **Bypass method — Self-listing under community bio umbrella organizations (DIYbiosphere).** The DIYbiosphere is a community-maintained directory accepting self-submitted entries. Free, no vetting beyond self-description.
  >
  > **Bypass method — Lightweight third-party trace via citizen-science platforms.** Register on Protocols.io, iNaturalist, or similar (free). Self-publish 1–2 protocols. Creates Google-searchable artifacts that look like research outputs without going through any peer review.

  > A measure-4 review configured around publication history, NIH grants, and university IBC oversight would have a near-100% false-negative rate against community bio labs if applied as a hard gate. The provider cannot reject "no publications, no grants, no IBC" without rejecting the entire legitimate customer class.

- **Why relevant:** Branch sits exactly inside the customer class where measure 09's "discoverable history on third-party websites" criterion is structurally weak. DIYbio.org / DIYbiosphere listings are deliberately the third-party history that the measure would accept.

---

## 8. dormant-domain

- **Profile:** fake-affiliation
- **Target description:** A lone operator acquires (or reclaims via dangling-DNS takeover) the canonical domain of a defunct research entity whose publication trail is still live in PubMed, Google Scholar, and NIH RePORTER. The attacker reanimates the domain and presents as a "successor researcher" at a small revived lab.
- **Persistent supply chain?** Y (persistent variant explicitly priced)
- **Bypass excerpts (verbatim):**

  > **Bypass A — Acquire the lapsed canonical domain (primary):**
  > - **What the attacker does:** Continuously scrapes citation databases for affiliations whose canonical domains have lapsed, cross-references against TLD drop lists, and buys the domain at drop auction or aftermarket when a high-value match appears. Then stands up a mail server (SPF/DKIM/DMARC configured, 4–6 weeks of domain warming) and a basic "lab" website mirroring the defunct entity's archive.org snapshot.
  > - **Expertise:** Practitioner — corpus mining across PubMed/RePORTER, DNS resolution, and drop-catch auction management.
  > - **Cost:** $500–$10,000 for the domain (low end for obscure regional consortia, high end where SEO-operator competition bids up desirable names) + $100–$500 for VPS hosting and mail stack.
  > - **Lead-up time:** 3–9 months end-to-end.

  > **Bypass A — Reflected legitimacy from defunct entity's real publication trail (baseline):**
  > - **What the attacker does:** Points reviewers at the real, indexed publications associated with the defunct entity's domain. No fabrication needed — the records already exist in PubMed, Scholar, and RePORTER.
  > - **Cost:** $0 incremental.
  > - **Lead-up time:** 0 active work; leveraged passively from M2 Bypass A.

  > **Bypass C — Active citation seeding via low-bar OA preprints / methods notes:**
  > - **What the attacker does:** Writes and publishes bioRxiv preprints or open-access methods notes under the revived-lab affiliation, creating fresh entries in Scholar and CrossRef that tie the attacker's name to the entity.
  > - **Cost:** $0 (bioRxiv only) to ~$1,700 (1–3 OA journal APCs).
  > - **Lead-up time:** 6–12 months.

  > **Bypass A — Self-register the revived lab:**
  > - **What the attacker does:** Registers the revived entity on the provider's organization registry using the reanimated domain and the attacker's real IAL1 identity as primary contact.

- **Why relevant:** The branch synthesizes a "life-sciences institution" by reanimating a defunct one whose legacy publications are still discoverable. Measure 09 ("discoverable history on third-party websites") would pass on the legacy footprint while the actual entity is no longer real — the precise failure mode the measure is meant to catch but cannot if it does not check liveness.

---

## 9. foreign-institution

- **Profile:** exploit-affiliation
- **Target description:** A lone operator exploits verification coverage gaps at mid-tier non-Anglophone research institutions (Brazilian federal universities, Japanese prefectural labs, Indian state agricultural universities, Indonesian/Vietnamese national research institutes, Russian-language CIS institutions). Differential advantage is operating where Western providers' verification stacks have limited reach.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > **Method 1: Author-name ambiguity / transliteration collision.** Select a persona name that collides with real published authors in PubMed. About two-thirds of PubMed author names are vulnerable to homonym/synonym ambiguity; East Asian names are the most ambiguous. A casual reviewer searching a common romanized name at a large institution will surface real publications.
  > - Expertise: Aspirant. Cost: $0. Lead-up time: hours. Attacker trace: none.
  >
  > **Method 2: Coverage-gap reliance on non-English publication venues.** The provider's M4 review simply has limited reach into non-English literature.
  > - Expertise: Aspirant. Cost: $0. Lead-up time: zero. Attacker trace: none.
  >
  > **Method 3: Fabricated ORCID / Google Scholar profile + institutional cross-link.** Seed an ORCID profile, Google Scholar page, and 2-4 LLM-drafted preprints on a regional server (SciELO Preprints, Research Square).
  > - Expertise: Novice. Cost: $100-$500. Lead-up time: 2-8 weeks for indexing to propagate.
  >
  > **Method 4: Ride institution's generic footprint.** The target institution's overall research presence carries the order through casual review.

  > **False-negative rate.** Best guess: 20-50% of legitimate researchers at mid-tier non-Anglophone institutions would fail a strict M4 gate on first pass... NIH RePORTER covers only NIH-funded projects; non-English publication venues and grant databases have weak coverage.

- **Why relevant:** The institution is real, but measure 09's "discoverable history" check is reliant on Anglophone, Western-indexed sources. The branch deliberately routes through institutions whose reality cannot be verified through the same registries used for US/EU customers — the measure passes by coverage gap rather than by genuine verification.

---

## Summary

9 relevant stories — measure 09 is the central binding measure for purpose-built-organization branches and one fake-affiliation / one exploit-affiliation branch that fabricate or exploit institution-reality signals.
