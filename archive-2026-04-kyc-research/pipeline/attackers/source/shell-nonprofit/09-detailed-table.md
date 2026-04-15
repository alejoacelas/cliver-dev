# Stage 9 Detailed Table — Branch E: Shell Research Nonprofit with Name Collision

This document distills the researched and corrected column for the shell-nonprofit branch into a per-measure reference. Source URLs from the research column are preserved as inline links. Where a finding rests on a best guess rather than a firm source, this is stated.

**Important framing note:** All cost and timeline figures in this document are conditional on the name-collision trick at Measure 4 succeeding. The analytical pass estimates per-review conflation probability at 40–70%, but no published empirical study was found. If providers deploy deliberate name-disambiguation, the branch fails entirely. Expected per-successful-order cost is therefore 1.4–2.5x the stated figures.

---

## Matrix A Measures (all orders)

### Measure 1: Identity Verification — IAL1

**Binding assessment:** Not binding. The attacker uses their own real government-issued ID. IAL1 database-backed validation (name, DOB, SSN, address against AAMVA/credit-bureau records) passes natively because nothing about the attacker's personal identity is fabricated. The soft-binding edge case — a provider cross-checking the principal's name against the entity's beneficial-owner records — does not fire because the attacker *is* the beneficial owner.

**False-negative rate:** 2–5% of legitimate customers fail on first attempt due to document quality issues (poor lighting, blurry images); effective blocking rate after retry is likely <1% ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets); [Persona](https://withpersona.com/blog/identity-verification-pass-rate-metrics)). Irrelevant to this branch.

**Bypass methods:** None needed.

---

### Measure 2: Institutional Affiliation Check

**Binding assessment:** Partially binding via structural mismatch. The shell's own domain is real and inbox-verifiable, so the email check passes. But a provider that cross-references the domain against a known-institution list or requires federated authentication (eduGAIN/InCommon) would flag the shell as unrecognized. In practice, providers likely have a manual-review pathway for small entities that don't match any whitelisted domain, because 5–15% of legitimate small-entity customers (industry labs, community labs, small nonprofits) fall into this exact gap. The shell targets that manual-review pathway.

**False-negative rate:** 5–15% of legitimate institutional users encounter friction if the provider's cross-reference list is incomplete — especially users at industry labs, community labs, or small institutes. Well-sourced from provider-side observations ([Stanford IT](https://uit.stanford.edu/); [UW-Madison IT](https://it.wisc.edu/)).

**Bypass methods:**

#### Stand up the shell's own domain and mailbox

- **What the attacker does:** Registers a domain matching the shell entity name, sets up Google Workspace or Microsoft 365, configures SPF/DKIM/DMARC. The domain email is real and functional. The provider sees a small-entity applicant with a professional-looking domain that matches their entity registration.
- **Expertise:** Novice — domain registration and hosted-email setup are template-driven.
- **Cost:** $100–$250/year for domain + Workspace/365 ([Namecheap](https://www.namecheap.com/domains/); [Google Workspace](https://workspace.google.com/pricing)).
- **Lead-up time:** Hours for setup, but 4–12 weeks of pre-aging the domain before it looks plausibly established.
- **Attacker trace:** Domain WHOIS (attacker name or privacy proxy; proxy recoverable via subpoena), Google/Microsoft billing tied to attacker's payment method, DNS records publicly observable.
- **Key uncertainty:** Whether the provider deploys a domain-vs-known-institution cross-check or federated authentication gating. If so, the shell fails M2 outright.
- **Cross-measure dependencies:** The domain pre-aging period runs in parallel with M3 entity setup and M4 footprint building.

#### ROR self-listing (persistence variant only)

- **What the attacker does:** Submits a curation request to the Research Organization Registry after seeding several preprints naming the shell as an affiliation. If approved, the shell appears in the ROR directory that some providers may reference.
- **Expertise:** Novice for the form submission itself.
- **Cost:** $0.
- **Lead-up time:** 4–6 weeks after preprints exist ([ROR](https://ror.org/blog/2025-10-08-journey-of-a-curation-request/); [ROR FAQ](https://ror.org/about/faqs/)).
- **Attacker trace:** ROR listing is public and permanent, including address and linked preprints.
- **Key caveat:** ROR inclusion requires acknowledgment by multiple people in research-output affiliations; single-person organizations are explicitly out of scope. The curation team may spot the name collision with a real institution and reject. Materially harder than it appears; viable only after successful preprint seeding at M4.
- **Cross-measure dependencies:** Requires M4 preprint seeding to have succeeded first.

---

### Measure 3: Organization Registry + Verified Shipping Address

**Binding assessment:** Binding — one of the structurally binding Matrix A measures. The shell must be a real registered entity with a real address and (under baseline implementation per [measures-in-practice.md](../../measures-in-practice.md)) two registered contacts. The two-contact requirement forces accomplice recruitment, which is the branch's dominant cost driver for Matrix A.

**False-negative rate:** 10–25% of legitimate small-institution customers face friction — home-based startups, community labs, and small nonprofits whose registered address is a virtual office or registered agent ([SBA Advocacy, March 2023](https://advocacy.sba.gov/wp-content/uploads/2023/03/Frequently-Asked-Questions-About-Small-Business-March-2023.pdf)). Providers likely deploy a manual-review escape hatch for this population, which is the same escape hatch the shell targets.

**Bypass methods:**

#### Real-entity registration with virtual-office shipping

- **What the attacker does:** Files a DE/WY/NM LLC (or 501(c)(3) for the persistence variant), obtains an EIN, rents a virtual office in a biotech metro, opens a business bank account, and recruits one accomplice as the second registered contact.
- **Expertise:** Novice for entity formation; Practitioner for accomplice recruitment (social engineering and trust-building to find someone willing to commit their name to a shell).
- **Cost:** Entity + infrastructure: $900–$4,160 (DE/WY/NM LLC $50–$110; registered agent $50–$300/yr; EIN $0; domain + Workspace $100–$250; virtual office 4–6 months $600–$3,000; website $100–$500; bank account $0 in fees). Accomplice (M3-only role for Matrix A): $1,000–$5,000, scaled from the nominee-director market rather than the full four-role rate ([ICIJ offshore formation data](https://offshoreleaks.icij.org/)). **Matrix A one-off total: $1,900–$9,160** ([DE fees](https://corp.delaware.gov/fee/); [WY fees](https://www.businessrocket.com/business-corner/start/llc/cost-wyoming/); [Regus](https://www.regus.com/en-us/united-states/new-york/virtual-offices); [Mercury](https://www.nerdwallet.com/business/banking/reviews/mercury-banking)).
- **Lead-up time:** 6–14 weeks total. LLC filing 1–3 weeks; EIN minutes; virtual office 1 week; bank account 1–4 weeks (1–3 expected fintech denials); accomplice recruitment 2–6 weeks.
- **Attacker trace:** State business registry publicly lists attacker as principal; IRS has EIN tied to attacker's SSN; virtual-office lease in entity name; bank CIP/CDD records with attacker's real ID and SSN. **No FinCEN BOI filing required for US-formed entities** as of March 2025 ([FinCEN IFR](https://www.fincen.gov/news/news-releases/fincen-removes-beneficial-ownership-reporting-requirements-us-companies-and-us)). Accomplice's identity on file at IAL1 database validation.
- **Key uncertainty:** Bank-account opening friction (1–3 fintech denials expected) is real but costs time, not dollars.
- **Cross-measure dependencies:** The accomplice recruited here also serves M6/M7/M8/M9 roles in Matrix B, where the role load — and therefore the price — is much higher (see Matrix B section).

#### Weakened-M3 sensitivity (single contact accepted)

- **What the attacker does:** If a provider implements M3 with a single-contact acceptance path (below the [measures-in-practice.md](../../measures-in-practice.md) baseline but consistent with current practice at many providers), no accomplice is needed. The attacker alone suffices.
- **Expertise:** Aspirant.
- **Cost:** Entity setup only: $900–$4,160. No accomplice cost.
- **Lead-up time:** 2–5 weeks.
- **Attacker trace:** Only the attacker. No second person committed.
- **Key caveat:** This is reported as a sensitivity, not the baseline path. The baseline retains the two-contact design because it creates meaningful security separation.

#### Foreign-formation sub-variant

- **What the attacker does:** Forms the entity in a foreign jurisdiction (UK CIC, Estonian OÜ, Singapore Pte Ltd) and registers to do business in a US state.
- **Expertise:** Practitioner — requires understanding foreign formation regimes and cross-jurisdictional obligations.
- **Cost:** $300–$2,000 setup + annual fees ([UK Companies House CIC](https://www.gov.uk/government/publications/community-interest-companies-fees); [Estonia e-Residency](https://www.e-resident.gov.ee/)).
- **Lead-up time:** 2–8 weeks.
- **Attacker trace:** Foreign registry record lists attacker as director/beneficial owner. **Reintroduces FinCEN BOI filing** (foreign entities registered in US states remain reporting companies under the March 2025 IFR), partially inverting the attraction of this path.

---

### Measure 4: Research & Entity Signals

**Binding assessment:** Binding — the central binding measure for this branch. The name-collision trick is the load-bearing bypass: the shell's name is constructed to collide with a real, better-known research institution so that casual review pulls in the real institution's publications and grants by mistake.

**False-negative rate:** ~15–40% of legitimate small-entity customers (industry startups, community labs, independent research nonprofits, foreign labs) would be rejected under a strict M4 implementation. Providers likely soften M4 into a manual-review signal rather than a hard gate to keep this population. The shell exploits that softening. Best guess; no published quantitative study located.

**Bypass methods:**

#### Name-collision reflected legitimacy

- **What the attacker does:** Registers an entity name that near-collides with a real research institution in the same vertical (e.g., "Midwest Institute for Genomic Health" alongside a real "Midwest Genomics Institute"). When a reviewer searches the entity name, Google results bleed the real institution's publications and grants into the picture.
- **Expertise:** Novice — patient name-space research and picking a plausible near-collision.
- **Cost:** $0 marginal (name choice made at entity registration).
- **Lead-up time:** Hours to days to identify a good collision target.
- **Attacker trace:** State filing publicly shows the entity name; the collision is discoverable by anyone who runs deliberate name-disambiguation (checking EIN, incorporation date, principal name, side-by-side domain comparison).
- **Key uncertainty:** Per-review conflation probability estimated at 40–70% with no empirical basis. If providers deploy deliberate name-disambiguation, the probability collapses to near zero and the branch fails entirely. This is the headline uncertainty for the entire branch.

#### Principal-name collision (free individual-legitimacy backup)

- **What the attacker does:** If the attacker has a common name, Google/PubMed searches on the principal bleed other researchers' publications into the picture. Approximately 2/3 of PubMed authors share a name with at least one other author ([Torvik & Smalheiser](https://pubmed.ncbi.nlm.nih.gov/19779587/)).
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** None additional.
- **Attacker trace:** None additional beyond IAL1 commitment.

#### Thin-but-checkable website

- **What the attacker does:** Builds a templated website with a "team" page, research focus area, and contact information. Pre-ages the domain via Wayback Machine snapshots and organic crawl indexing.
- **Expertise:** Novice.
- **Cost:** $100–$500 (template build via Wix/Squarespace or Fiverr/Upwork).
- **Lead-up time:** 1–2 weeks build + 2–6 months pre-aging before it looks non-fresh ([Internet Archive Save Page Now](https://help.archive.org/help/using-the-wayback-machine/)).
- **Attacker trace:** Domain WHOIS creation date publicly queryable; Wayback snapshots publicly viewable and timestamped; hosting-provider billing records.
- **Cross-measure dependencies:** Domain pre-aging runs in parallel with M2 and M3 setup.

#### Seed the principal's footprint (persistence variant)

- **What the attacker does:** Produces 1–2 credible methods preprints on bioRxiv/OSF/Zenodo, creates an ORCID iD and Google Scholar profile, and lists the shell as affiliation. LLM-assisted drafts can pass bioRxiv's screening ([bioRxiv FAQ](https://www.biorxiv.org/about/FAQ)), though OSF/Zenodo have lighter screening and produce lower-signal preprints.
- **Expertise:** Practitioner — producing a credible methods preprint requires real domain knowledge.
- **Cost:** $0 in dollars; 40–120 hours of effort per preprint.
- **Lead-up time:** 2–6 months including drafting, submission, and Google Scholar indexing lag.
- **Attacker trace:** Preprints are permanent and publicly searchable; ORCID iD ties the preprint author to a durable persistent identifier; the preprint's affiliation field permanently names the shell.

#### Crossref/DOI registration (persistence variant)

- **What the attacker does:** Joins Crossref as a member publisher and mints DOIs for the shell's preprints, making them appear in scholarly infrastructure.
- **Expertise:** Novice — administrative process.
- **Cost:** $200/year + ~$1/DOI ([Crossref fees](https://www.crossref.org/fees/); [Crossref new tier](https://www.crossref.org/blog/some-things-are-big-because-they-are-small-the-new-fee-tier-for-crossref-members-takes-effect/)).
- **Lead-up time:** Weeks for membership application; first DOI within days of activation.
- **Attacker trace:** Crossref membership record is permanent and public; member name, address, and billing email visible.

#### Fiscal sponsorship (persistence variant)

- **What the attacker does:** Onboards with a fiscal sponsor (e.g., [Fractured Atlas](https://www.fracturedatlas.org/fiscal-sponsorship)), which provides a third-party legitimacy signal and leaves the shell on the sponsor's Form 990 (publicly searchable).
- **Expertise:** Practitioner.
- **Cost:** $500–$2,500 onboarding + 5–10% overhead on funds.
- **Lead-up time:** 4–12 weeks for sponsor due diligence.
- **Attacker trace:** Grant application/award are public records; fiscal sponsor's 990 filing names the shell; sponsor's due diligence file includes principal's ID and mission statement.

#### Wikipedia disambiguation edit (persistence variant)

- **What the attacker does:** Edits an existing Wikipedia disambiguation page to add the shell's name — lower visibility than a standalone article and more durable. A standalone stub backed only by the shell's own preprints will likely be deleted under WP:NORG ([Wikipedia WP:NORG](https://en.wikipedia.org/wiki/Wikipedia:Notability_(organizations_and_companies))). Harder than the analytical pass implied.
- **Expertise:** Practitioner — requires familiarity with Wikipedia editing conventions.
- **Cost:** $0 in dollars; 10–40 hours of effort.
- **Lead-up time:** 1–4 weeks.
- **Attacker trace:** Wikipedia edit history is permanent; IP recoverable via CheckUser.

---

### Measure 5: Payment Integrity

**Binding assessment:** Soft-binding through bank-account opening friction. The shell needs a business bank account in the entity's name. Fintechs (Mercury, Relay, Brex) are the likely path, but 1–3 denials are expected before a successful opening for a "research institute" with a thin website. This costs time (1–4 weeks), not money ([Mercury](https://www.nerdwallet.com/business/banking/reviews/mercury-banking)).

**False-negative rate:** 2–8% of legitimate small-entity customers face a name-mismatch friction (fintech BIN sponsor appearing instead of entity name in payment metadata). Most resolved by manual review. Best guess; no published rate found.

**Bypass methods:**

#### Open a business bank account and pay normally

- **What the attacker does:** Applies to 2–4 fintech banks until one opens an account. Pays providers by ACH or card from that account.
- **Expertise:** Novice (Practitioner only if navigating repeated enhanced-due-diligence questions).
- **Cost:** $0 in fees.
- **Lead-up time:** 1–4 weeks including anticipated denials.
- **Attacker trace:** Business bank account in shell name; beneficial owner on file (attacker's real ID, SSN, and signature via bank CIP/CDD — unchanged by FinCEN BOI exemption, since banks collect beneficial-ownership info under separate BSA rules); card payment records tying each order to the shell's account.

---

## Matrix B Measures (SOC orders — adds on top of Matrix A)

**Critical cross-cutting note on accomplice cost:** Matrix B upgrades the accomplice's role from "M3 second contact only" (name-lending, IAL1 database check) to the full four-role commitment: IAL2 biometric, MFA enrollment, repeated vouching with order context, and IBC-letter signer. This upgrade shifts the per-accomplice cost from $1,000–$5,000 (Matrix A) to $5,000–$15,000 (Matrix B), driven by biometric commitment and repeated false statements. The recruitment-funnel loss rate jumps to 95–99% at the IAL2 step. This is the primary mechanism by which Matrix B is harder than Matrix A for this branch.

### Measure 6: Identity Verification — IAL2

**Binding assessment:** Not binding under baseline. The attacker uses their own genuine face and government ID; the accomplice's IAL2 commitment is priced into the four-role accomplice figure above. No identity substitution is attempted.

**False-negative rate:** 3–8% of legitimate customers fail on first attempt; <2% after retry ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)). Irrelevant to this branch.

**Bypass methods:** None needed. The attacker and accomplice both pass with their own real documents.

---

### Measure 7: MFA + Re-authentication

**Binding assessment:** Not binding. The attacker enrolls a TOTP app or burner phone; the accomplice enrolls their own phone per the four-role commitment.

**False-negative rate:** 1–3% of legitimate users encounter MFA friction per session (lost device, token drift). Best guess; no source found. Not meaningful as a bypass barrier.

**Bypass methods:** None needed.

- **Cost:** $0 for TOTP app; $20–$50 for a dedicated burner phone.
- **Attacker trace:** MFA enrollment metadata (phone number, device fingerprint, TOTP seed timestamp) on file at the provider for both principal and accomplice.

---

### Measure 8: Vouching by Registered Contact

**Binding assessment:** Binding — the load-bearing failure mode for Matrix B. The structural attempt is self-vouching: the accomplice (registered as a second contact at the shell) approves the attacker's SOC orders. This passes only if the provider accepts internal vouching from the same entity. If the provider requires the voucher to hold an independent institutional affiliation, the shell fails at M8 outright.

**False-negative rate:** 5–20% of legitimate SOC orders face M8 friction on first attempt (voucher unavailable, uncertain, or outside the research area); hard-block rate after retries likely <5%. Estimated from [measures-in-practice.md](../../measures-in-practice.md) baseline; no published rate.

**Bypass methods:**

#### Self-vouching from accomplice within the shell

- **What the attacker does:** The accomplice, already registered as a second contact at M3 and biometrically committed at M6, approves each SOC order through the provider's vouching workflow. Each approval is an affirmative false statement.
- **Expertise:** Practitioner for accomplice management (maintaining willingness for repeated false statements over the operational lifetime).
- **Cost:** No marginal cost beyond the accomplice figure ($5,000–$15,000 for Matrix B).
- **Lead-up time:** Zero beyond accomplice recruitment.
- **Attacker trace:** Accomplice's real identity and biometrics on file at IDV vendor; per-order vouching record (timestamp, IP, MFA factor, order context) retained at the provider. The pattern of a two-person entity where the same person routinely approves the principal's SOC orders is itself evidence under post-hoc review.
- **Key uncertainty:** Whether providers accept intra-entity vouching at all. If they require cross-organizational independence, this method fails and the branch must escalate to more expensive contingencies.

#### AitM phishing of an existing institutional voucher's session

- **What the attacker does:** Runs a Tycoon 2FA or EvilProxy phishing campaign to hijack the session of a real institutional researcher who could serve as voucher, then uses their authenticated session to approve the order.
- **Expertise:** Practitioner to Expert — requires phishing-kit deployment and session relay during the victim's active session ([Sekoia.io — Tycoon 2FA](https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/)).
- **Cost:** $200–$600 for phishing kit + $50–$200 for lure infrastructure + 20–60 hours of operator time.
- **Lead-up time:** 1–4 weeks.
- **Attacker trace:** Compromised voucher's session metadata logged at provider; phishing infrastructure is throwaway. No attacker biometric committed at this step.
- **Cross-measure dependencies:** Independent of M3 accomplice — this is a contingency that avoids the accomplice-at-M8 role entirely but requires cybercrime tooling the baseline branch does not otherwise need.

#### Credential compromise of colliding institution's staff member

- **What the attacker does:** Obtains credentials for a staff member at the *real* institution whose name the shell collides with, then registers that person as a voucher or uses their existing account.
- **Expertise:** Practitioner — credential-stuffing, targeted phishing, or breach-dump access ([SpyCloud 2024 Identity Exposure Report](https://spycloud.com/resource/2024-identity-exposure-report/)).
- **Cost:** $100–$500 for phishing infrastructure or breach-dump access.
- **Lead-up time:** 2–8 weeks.
- **Attacker trace:** Real staff member's name on vouching record; staff member becomes witness/victim if detected.

#### Anonymous gig-platform voucher recruitment

- **What the attacker does:** Recruits a stranger through anonymous task markets to complete vouching (and potentially IAL2).
- **Expertise:** Novice to Practitioner.
- **Cost:** $500–$3,000 per vouch event; high refusal/fallthrough at IAL2.
- **Lead-up time:** Highly variable; modal outcome is refusal at IAL2.
- **Attacker trace:** Stranger accomplice's biometrics and ID on file; weaker personal link to attacker but discoverable through payment-platform records.

#### Recruit external voucher with independent institutional affiliation

- **What the attacker does:** Cultivates a relationship with a legitimate institutional researcher and persuades them to vouch. Effectively collapses into insider-recruitment.
- **Expertise:** Practitioner/Expert.
- **Cost:** $1,000–$10,000+ per vouch event.
- **Lead-up time:** Weeks to months.
- **Attacker trace:** External voucher's real identity, institutional affiliation, and biometric commitment all on file. The shell becomes largely irrelevant to the trace.

---

### Measure 9: Biosafety Documentation

**Binding assessment:** Binding. The shell has no real IBC. The attacker must produce documentation that passes review without external verification.

**False-negative rate:** 20–40% of legitimate non-academic customers (industry researchers without formal IBC programs, international researchers, community labs) would fail a strict M9 hard gate. This high false-negative rate pressures providers to accept self-attestation or commercial IBC letters — the exact softening the shell exploits. Best guess; no published rate.

**Bypass methods:**

#### Real commercial IBC review (persistence variant)

- **What the attacker does:** Engages a commercial biosafety consultancy (Advarra, WCG/WIRB-Copernicus) to review a protocol description. The resulting letter is genuine third-party attestation, not a forgery.
- **Expertise:** Practitioner — writing a credible protocol that survives biosafety professionals' questions requires real domain knowledge.
- **Cost:** $1,500–$5,000 per protocol, with ongoing annual review fees. Best guess scaled from clinical-trials industry pricing ([Advarra IBC services](https://www.advarra.com/review-services/institutional-biosafety-committee/)).
- **Lead-up time:** 3–8 weeks per protocol (10-day review turnaround plus 2–6 weeks protocol drafting).
- **Attacker trace:** Consultancy has the full research protocol on file under the shell's name and principal's name; reviewers may remember an unusual project; the letter is a genuine document, not a forgery.
- **Key caveat:** Converts M9 from highest-exposure forgery to legitimate third-party attestation. Materially changes the persistence variant's attrition model.

#### Fabricate an IBC approval letter (one-off variant default)

- **What the attacker does:** Produces a letter matching real IBC format conventions (committee roster, meeting date, protocol number, BSL designation, expiration, institutional-officer signature). The accomplice's name appears as committee chair.
- **Expertise:** Novice to Practitioner.
- **Cost:** $0 in dollars; categorical legal exposure.
- **Lead-up time:** Hours to days per letter.
- **Attacker trace:** Forged document on file at every provider the shell uses; cumulative forgery exposure grows with each additional order. The accomplice's name cements their attribution to every SOC order. **Attrition driver: limits each shell to 1–5 SOC orders** before the shell is abandoned or caught.
- **Cross-measure dependencies:** The 1–5 SOC order limit drives the per-order amortization framing in Matrix B totals.

#### Self-attestation

- **What the attacker does:** If a provider accepts self-attestation (a possible softening driven by the high M9 false-negative rate), the attacker simply attests.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** Self-attestation on file; minimal additional trace.

#### Reference a real IBC at the colliding institution

- **What the attacker does:** Names the real institution's IBC in documentation, hoping the provider does not call to verify.
- **Expertise:** Aspirant.
- **Cost:** $0; high categorical risk of immediate detection.
- **Attacker trace:** If verified, the real institution becomes aware and the real IBC office becomes a witness.

#### Foreign-jurisdiction IBC-equivalent letter

- **What the attacker does:** Produces a local-language biosafety document from a jurisdiction where the provider has limited verification reach.
- **Expertise:** Practitioner.
- **Cost:** $200–$1,500 for translation and layout services.
- **Lead-up time:** 1–3 weeks.
- **Attacker trace:** Forged foreign-language document; cumulative exposure similar to domestic forgery but with lower provider verification reach.
