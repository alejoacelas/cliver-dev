# Detailed Column: Branch E — Gradual Legitimacy Accumulation

**Profile:** Purpose-built organization
**Branch scenario:** A patient individual or small group spends 6–12 months operating a real-but-hollow small biotech or CRO before attempting controlled-sequence orders. Time, not money, is the load-bearing resource. The attacker uses their own real identity throughout and accepts that every artifact — LLC filings, non-SOC orders, publications, ORCID profiles — ties their real name to a deepening paper trail. That trail is simultaneously legitimacy (if never investigated) and evidence (if ever investigated). The branch bets on the former.

**Substrate:** Branch A (virtual office in a biotech metro) is the baseline cost anchor. Branch D (bench space at a real incubator) is a more expensive variant that buys stronger signals at several rows.

**Two load-bearing assumptions carried through every row below:**
1. The provider's research-and-entity-signals review actually weights customer tenure and order history (not just point-in-time entity profile). If not, the branch's rationale collapses.
2. The provider's vouching workflow does not enforce voucher independence (i.e., does not require the voucher to come from a separate verified institution). If it does, the cheapest-path cost at Measure 8 rises.

---

## Matrix A (all orders)

### Measure 1 — Identity verification (IAL1)

**Binding?** No. The attacker uses their own real government ID, real face, real phone number. The IDV vendor flow (document scan or PII + SMS code) works as designed and produces a true positive.

**False-negative rate for legitimate customers:** Moderate in a few countries. Coverage is strong in the US, EU, UK, India, and other high-coverage jurisdictions, and weak-to-absent in countries such as Iran, where manual fallback is required. See [notes/idv-in-practice.md](../../../notes/idv-in-practice.md) for the per-country picture. [Estimated — based on vendor coverage discussion.]

**Bypass methods:** None needed. The attacker submits genuine evidence and accepts the trace cost. Vendor pass-through cost is roughly $0.50–$2 per check.

**Attacker trace:** Full name, date of birth, address, phone, document image stored with the commercial IDV vendor and the synthesis provider. Persists for the vendor's retention period (typically years). The attacker's identity is committed on day one.

---

### Measure 2 — Institutional affiliation check

**Binding?** No. The attacker is the LLC's principal by construction. The work email (`principal@example-biotech.com`) sits on a domain they own. Affiliation check (domain recognition, inbox verification, consistency with the org record) trivially passes because everything is mutually consistent and all controlled by the attacker.

**False-negative rate:** Very low (<5%) for real small-biotech applicants. [Best guess; no specific source.]

**Bypass methods:** None needed. Setup cost is a domain (~$15/year) plus Google Workspace (~$6–$8/user/month per [Google Workspace pricing](https://workspace.google.com/pricing/)).

**Attacker trace:** Domain WHOIS record (weak privacy via WHOIS proxy), Google Workspace billing record on attacker's or LLC's card, inbox-verification log at the provider.

---

### Measure 3 — Organization registry + verified shipping address

**Binding?** Partial. The LLC is real and the address is real, but the address must survive a provider review and the two-contact requirement must be satisfied.

**False-negative rate:** Moderate for small and new entities. The provider's address classifier may flag virtual offices, CMRA addresses, or residential addresses; manual review catches most but adds friction. [Estimated.]

**Bypass methods:**

**Method 1 — Virtual office in a biotech metro (BASELINE).** Rent a virtual office in San Diego, Boston, the Research Triangle, or the Bay Area from a commercial provider. Costs start around $49/month per [Alliance Virtual Offices (February 2024)](https://www.alliancevirtualoffices.com/virtual-office-blog/regus-virtual-office-comparison/); Regus has locations in La Jolla and downtown San Diego per their current product pages. The address resolves to a real commercial building in classification databases. Expertise: Novice. Lead-up time: 1–4 weeks to set up. Trace: virtual-office contract in the LLC's name, paid by LLC card; the address is tagged by classification databases as a virtual office. Cross-measure dependency: the address may downgrade Measure 4's signal unless the 12-month buildup gives the provider a reason to treat it as stable.

**Method 2 — Incubator bench (Branch D variant).** Rent a bench at a biotech incubator such as LabCentral, BioLabs, or Genspace. LabCentral's Cambridge bench was reported at around $4,600/month in [contemporaneous 2019 STAT News reporting](https://www.statnews.com/2019/03/06/labcentral-bench-startups-kendall/); cheaper regional incubators fall in the $500–$3,000/month range. Expertise: Novice. Lead-up time: 2–8 weeks for admission. Trace: incubator lease, tenant vetting records, possible directory listing, and physical presence at the facility. This is the strongest Measure-3 path and it also strengthens Measure 4 and enables two Measure-9 variants. Cost 10× higher than baseline.

**Method 3 — Foreign-jurisdiction LLC.** Register a UK Ltd or offshore entity where corporate records are thinner. Cost roughly comparable to US LLC formation. Trace: foreign corporate filings, still public in most jurisdictions.

**Method 4 — Nominee manager.** Use a nominee manager service in Delaware/Wyoming/New Mexico (~$500–$2,000/year) so the attacker's name does not appear on public LLC filings. Provider-side identity remains fully committed at IAL1/IAL2 — this only reduces *public-record* exposure.

**Method 5 — Accomplice as second registered contact.** A friend, family member, or paid acquaintance is named as the second contact. They pass IAL2 with their own real ID. Cost: $0 for family; $500–$5,000 over the buildup period for a paid acquaintance (estimate; the real cost is recruitment and 12-month retention discipline). This is tightly coupled to Measure 8 vouching.

**Key uncertainty:** Whether address-classification vendors flag virtual-office tenancy and whether providers actually act on that flag. [Needs verification.]

---

### Measure 4 — Research and entity signals

**Binding?** Yes — this is the central row of the branch. Measure 4 is the only Matrix A row with a signal that changes over time. The branch's whole claim is that 12 months of aging the domain, accumulating order history, and seeding publications moves the entity from "new and suspicious" to "thin but typical of a real new small biotech."

**False-negative rate:** Structurally very high for the small-new-biotech customer class. Measures-in-practice flags that publication, research background, and grant-database signals are silent or weak for industry, startups, community labs, and many non-Western applicants. Per [McKinsey (Small but mighty)](https://www.mckinsey.com/industries/life-sciences/our-insights/small-but-mighty-priming-biotech-first-time-launchers-to-compete-with-established-players), roughly 40% of new biopharma assets launched 2018–2023 came from companies with little or no prior commercialization experience — evidence that legitimate thin-signal small biotechs are a large population. [NIH RePORTER](https://reporter.nih.gov/) covers only NIH-funded projects, so it is silent on non-NIH-funded startups.

**Bypass methods:**

**Method 1 — Time-aged domain and clean order history.** Register the domain at month 0 and place 5–20 small non-controlled orders (oligos, primers, gene fragments) over 12 months — $500–$2,000 in real synthesis spend plus shipping. By month 12 the provider's risk system shows a year of customer tenure, a clean payment record, and a real order pattern. Expertise: Novice. Lead-up time: 6–12 months. Trace: every order is a permanent dated provider record tied to the attacker's name and LLC. This is the strongest trace asset and the core mechanism of the branch.

**Method 2 — Aged domain auction purchase (compression variant).** Buy a 5+ year expired domain whose name fits the LLC via [GoDaddy Auctions](https://auctions.godaddy.com/beta) or [NameJet](https://www.namejet.com/). Price range $50–$5,000 with most biotech-adjacent expired domains in the $100–$1,000 range. Compresses the domain-age component but not the order-history component. Trace: historical WHOIS records preserve prior owners and can embarrass a new owner.

**Method 3 — ORCID profile and pay-to-publish article.** Create an ORCID profile (free; self-registration allows any self-asserted affiliation per [ORCID documentation](https://support.orcid.org/hc/en-us/articles/25578292888215-Add-a-verified-institutional-email-domain-to-your-record)) and publish a methods note or short technical write-up in a low-barrier journal. APCs for reputable pay-to-publish tiers (PLOS ONE, Frontiers) are $1,500–$3,000 per [PLOS fees](https://plos.org/fees/); predatory OA journals cost $100–$1,000. Hidden chain: writing a credible manuscript requires 40–100 hours of plausible scientific writing for an attacker without biology background or 10–40 hours for one with it; the journal's editorial gate does occasionally reject thin submissions; indexing in Scholar takes additional weeks. Total 3–6 months. Expertise: Practitioner (scientific-writing fluency required; not just cover-story literacy). Trace: permanent indexed publication and ORCID record tied to the attacker's real name and LLC affiliation.

**Method 4 — Paper-mill purchased authorship (compression variant).** Buy an authorship slot on an existing accepted manuscript via a paper-mill broker. Nature has documented this as a [multimillion-dollar trade in paper authorships (2023)](https://www.nature.com/articles/d41586-023-00062-9); [Nature's 2025 follow-up](https://www.nature.com/articles/d41586-025-01824-3) details how paper mills operate and sell authorship slots. Estimated price $200–$5,000 per slot. Compresses publication seeding from months to weeks. Expertise: Practitioner. Trace: real indexed publication but with co-authors the attacker has no relationship to; paper-mill investigations are increasing, and retractions create the retroactive-investigation trigger the branch bets against. **Qualitatively worse trace than Method 1 and Method 3.**

**Method 5 — bioRxiv preprint.** Post a preprint on [bioRxiv](https://www.biorxiv.org/) with the LLC as affiliation. Free. [bioRxiv screens all submissions (June 2022 procedures)](https://connect.biorxiv.org/news/2022/06/13/screening_procedures) for plagiarism, non-scientific content, inappropriate article types, and public-harm material; screening is typically 24–72 hours. Expertise: Practitioner (writing a credible preprint). Trace: permanent indexed preprint with author, LLC, posting date.

**Method 6 — Conference poster.** Attend a small biotech conference and present a poster. Registration $300–$1,500 plus travel $500–$2,000 per conference. Some proceedings are indexed. Trace: conference records, abstract in proceedings, photos, and incidental travel records.

**Method 7 — Crunchbase, AngelList, and similar listings.** Free self-serve profiles listing the LLC. Trace: public self-asserted profile with attacker's name as founder.

**Method 8 — SBIR or state-grant application (no award).** Submit an NIH SBIR Phase I or state economic-development application. Free; 40–80 hours of writing. Unfunded applications are typically not indexed in [NIH RePORTER](https://reporter.nih.gov/), so this is a weaker signal than Methods 3–5.

**Method 9 — LinkedIn footprint.** LinkedIn profiles for attacker and accomplice listing the LLC as employer. Free. LinkedIn is self-asserted and unverified.

**Method 10 — AI-assisted drafting across all the above.** $20–$200/month for an LLM subscription cuts writing time by roughly half. Does not eliminate the need for domain-literate review and customization; AI-text classifier risk if reviewers scan outputs.

**Key uncertainty and load-bearing assumption:** The branch assumes the provider's Measure-4 review actually weights customer tenure and order history. If the review is point-in-time only, the 12-month buildup buys nothing.

---

### Measure 5 — Payment integrity

**Binding?** No. The LLC has a real business bank account (opened at an FDIC bank with EIN, formation documents, and the attacker as signatory). Payments are by ACH or business credit card; the billing address matches the registered address; no crypto or gift cards.

**False-negative rate:** Very low (<2%) for applicants with real business bank accounts. [Estimated.]

**Bypass methods:** None needed. Account opening is free at most US business banks; monthly fees are $0–$30.

**Attacker trace:** Bank-side KYC/CIP record at account opening (identity, EIN, often beneficial-ownership information for the bank's own records even after the March 2025 FinCEN reporting rescission for domestic entities). Every transaction is a dated bank record. This is a parallel institutional record outside the provider's view but could be compelled in an investigation.

---

## Matrix B (SOC orders — adds 6–9)

### Measure 6 — Identity verification (IAL2)

**Binding?** No. Same logic as Measure 1: own real ID, own real face, own real biometric. IAL2's document-scan-plus-selfie-plus-liveness pipeline works exactly as designed and produces a true positive. The accomplice (second registered contact) also enrolls with their own real ID.

**False-negative rate:** Moderate for legitimate customers globally. Document-quality issues, facial-comparison edge cases, and country coverage gaps drive rejections and manual fallback. [Estimated 5–15%.]

**Bypass methods:** None needed. Vendor pass-through cost $2–$6 per check.

**Attacker trace:** Document image, biometric template, liveness video for both the attacker and the accomplice. Persists at IDV vendor and provider. Best practice for the branch is that the accomplice enrolls early in the buildup (month 0–3) so their tenure as a registered contact matches the LLC's overall age.

---

### Measure 7 — MFA and re-authentication

**Binding?** No. The attacker controls the account end-to-end and enrolls their own TOTP or push-based MFA factor at account creation. Step-up re-authentication on SOC submission and address changes is completed by the legitimate account holder (the attacker).

**False-negative rate:** Very low (<5%) for customers enrolled in standard MFA. [Estimated.]

**Bypass methods:** None needed. Free authenticator apps.

**Attacker trace:** TOTP secret stored on the attacker's phone; provider authentication audit log.

---

### Measure 8 — Vouching by registered contact

**Binding?** **Conditional.** Binding only if the provider's vouching workflow enforces voucher independence (the voucher must come from a separate, independently verified institution). If independence is not enforced, the branch defeats this measure at zero marginal cost via the second accomplice contact. This conditional is a load-bearing assumption of the branch.

**False-negative rate:** Depends entirely on workflow design. If independence is enforced, genuine one-person startups and small CROs would fail this measure at a very high rate (20–40% estimated — many real small biotechs have no independent voucher). If not enforced, almost any real entity can name two contacts and FNR is under 5%.

**Bypass methods:**

**Method 1 (BASELINE, independence not enforced) — Accomplice on the same LLC vouches.** The second registered contact, enrolled at IAL2 at month 0–3, receives the vouching request, authenticates with their own MFA, and approves the SOC order. Cost: $0 marginal. Expertise: Novice. Lead-up time: minutes at SOC submission (accomplice already enrolled). Hidden chain at recruitment: the accomplice must agree to commit their real identity to a system that stores biometrics for years, remain reliable for 12+ months, retain access to their MFA device, not have a falling-out with the attacker, and not have independent legal exposure that invalidates them. Trace: accomplice's real identity on file, vouching action logged with timestamp, documented relationship to attacker.

**Method 2 (FALLBACK if independence is enforced) — External paid voucher.** Recruit a real person at a real other institution to register as an external voucher — most cheaply, a paid academic in a low-income country. Estimated $50–$500 per voucher (extrapolated from the documented paid-authorship market; vouching-specific pricing is not directly documented per [Nature 2023](https://www.nature.com/articles/d41586-023-00062-9) and [Nature 2025](https://www.nature.com/articles/d41586-025-01824-3)). Expertise: Practitioner. Lead-up time: 1–4 weeks. Trace: voucher's real identity on file, payment trail to attacker, a third committed identity.

**Method 3 — Reciprocal vouching with a parallel Branch E entity.** Two attackers running parallel entities vouch for each other. Doubles infrastructure cost. Trace: both attackers' identities fully committed at both providers.

**Method 4 (Branch D substrate only) — Incubator co-tenant vouch via social engineering.** After 12 months of visible incubator tenancy, ask a co-tenant scientist to vouch as a "neighbor who knows our work." Closer to social engineering than a structural bypass. Trace: real third party with no payment trail but a professional relationship via the incubator.

**Key uncertainty:** Whether the baseline measure-8 workflow requires the voucher to be an employee or affiliate of the ordering organization, or whether it permits any registered external voucher. [Needs verification.]

---

### Measure 9 — Biosafety documentation

**Binding?** Yes — second load-bearing row of the branch alongside Measure 4. There is no central registry for private-entity biosafety committees. [NIH's Institutional Biosafety Committee requirement](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/) applies to institutions receiving NIH funding for recombinant or synthetic nucleic acid research; private entities that do not take NIH funding are not subject to this specific requirement.

**False-negative rate:** Very high for legitimate small private biotechs. [Estimated 40–70% of legitimate small private biotech applicants would not have NIH-registered IBC documentation; they operate under self-maintained biosafety programs or external arrangements.]

**Bypass methods:**

**Method 1 (BASELINE) — Self-authored biosafety program, AI-assisted.** Draft an internal biosafety plan modeled on BMBL 6th ed. and the NIH Guidelines; sign it as the LLC's biosafety officer; submit it to the provider as evidence of a self-maintained program. Hidden chain: the drafter must read BMBL 6th ed., understand the relevant NIH Guidelines sections, and know which risk-group classifications apply. For an attacker without biosafety background, that is 40–100 hours of practitioner-level domain study before writing begins. With AI assistance (~$20/month for an LLM subscription), the drafting itself compresses to 5–15 hours, but the review and customization burden remains substantial — LLM output can hallucinate citations, mis-classify risk groups, or cite outdated guidance. Expertise: Practitioner (domain literacy required, not just cover-story literacy). Trace: document on file at provider with the attacker's signature; AI-text classifier risk.

**Method 2 — Third-party biosafety consulting service.** Contract a commercial biosafety consultant such as [WCG](https://www.wcgclinical.com/insights/if-a-site-needs-to-submit-to-create-an-ibc-with-wcg-how-long-does-the-nih-registration-process-typically-take/) or similar for a real review and signed IBC-equivalent documentation. Estimated $2,000–$10,000 for basic review. The consultant reviews the plan, not the intent of specific orders, so sequences are unlikely to trigger scrutiny if framed as routine cloning or assay work. Expertise: Practitioner. Lead-up time: 4–12 weeks. Trace: real vendor relationship, invoices, consultant's name on the signed documentation. Strengthens Measure 4 as a side benefit. [Needs verification on which commercial biosafety services will sign IBC-equivalent documentation for small private entities and what providers accept.]

**Method 3 (Branch D variant) — Incubator facility-level biosafety framework.** Reference the incubator's facility-level BSL-1 or BSL-2 program. The provider cannot independently verify which specific tenants are covered by which protocols. Trace: incubator name on file.

**Method 4 (Branch D variant, stronger) — Sponsored-research IBC arrangement.** Pay a university for a light sponsored-research contract that extends IBC coverage to the LLC. Some universities will do this for $500–$5,000. Produces real IBC documentation tied to a real institution. Trace: sponsored-research contract, university name on provider-side documentation, university grants-management records. [Needs verification on which universities will do this and at what price.]

**Method 5 — Exemption claim.** Argue that the order does not require IBC review (synthetic DNA for non-recombinant computational work, reference material). Plausibility depends on the specific sequence and the provider's exemption criteria.

**Method 6 — Jurisdiction-shopped LLC.** Incorporate where biosafety oversight for private companies is weaker. Only affects Measure 9 if the provider accepts the local regime as an IBC substitute.

---

## Cheapest end-to-end path (summary)

**Baseline (Branch A substrate, voucher independence not enforced):** ~$2,500–$8,000 in one-time setup and buildup spend over 6–12 months, plus $900–$3,600/year ongoing. Uses virtual-office Measure 3, non-SOC order history and either pay-to-publish or paper-mill publication at Measure 4, accomplice vouching at Measure 8, and AI-assisted self-authored biosafety documentation at Measure 9.

**Fallback (voucher independence enforced):** Add $50–$500 for a paid external voucher plus 1–4 weeks of recruitment. Total still under $10,000.

**Branch D variant:** $50,000–$100,000/year in running cost dominated by incubator bench rent. Enables the strongest Measure 3 signal and the strongest Measure 9 methods. Used only when the incremental signal depth justifies the ten-fold cost increase.

## Trace profile

Maximally exposed and deepening with time. By month 12 the attacker has committed: their full IAL2 record plus the accomplice's, 10–20 dated non-SOC orders, 1–2 indexed publications tied to the LLC, an ORCID profile, LinkedIn and Crunchbase entries, the LLC's public filings, the EIN, a bank KYC record (outside the provider's view but compelable), domain WHOIS history, the virtual-office contract, and a signed self-authored biosafety document. If the paper-mill variant is used, potential co-authors the attacker has no relationship with and a non-trivial probability of future retraction that could trigger retrospective investigation. This is the deepest attribution surface of any branch in the purpose-built-organization profile.

## Persistence

The branch is explicitly designed for persistence. Once the entity has matured, it can support repeat SOC orders for years as long as the order pattern looks normal (mixed SOC and non-SOC) and no downstream event triggers retrospective scrutiny. Each additional order deepens both legitimacy (dominant if uninvestigated) and attribution (only if investigated). The accumulating trace is a one-way ratchet.

## Where the branch can fail

Failure modes during buildup: a non-SOC order happens to contain a watch-list sequence and triggers ad-hoc review; the bank flags the LLC for unrelated reasons and the attacker loses the account mid-buildup; the virtual-office provider notices unusual mail volume; the LLC is administratively dissolved for delinquent filings; the accomplice drops out or loses MFA; a pay-to-publish journal rejects the manuscript; a paper-mill purchased paper is retracted in a later investigation; AI-text classifiers flag the biosafety document; the provider deploys CRO-specific Measure-4 enhancements (client references, corresponding-author cross-checks on listed publications) during the buildup window; retrospective investigation is triggered by sequence screening hits or law enforcement. Failure after maturation: provider's Measure-4 review does not actually weight tenure as assumed; provider enforces voucher independence and the external-voucher fallback is exposed; a downstream event triggers retrospective examination of the full 12-month paper trail.
