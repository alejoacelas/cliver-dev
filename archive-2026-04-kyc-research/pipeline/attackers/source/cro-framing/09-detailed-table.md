# Stage 9 Detailed Table — CRO framing

**Branch:** A single individual (or small group) registers a real US LLC under their own real legal name and frames it as a small contract research organization (CRO). They use a virtual office in a biotech metro, a self-built one-page services website, a real bank account, and pass identity verification with their real ID. The "CRO" cover story is tuned so that every signal absence — no publications, no grants, no university IBC — is legitimately explained.

---

## Matrix A (all orders)

### Measure 1 — Identity verification (IAL1)

- **Binding?** No. The attacker uses their own real government-issued ID, real face, real phone. No bypass needed.
- **False-negative rate (legitimate customers):** Roughly 5–15% on first attempt for US-onboarded legitimate customers, driven by capture quality and attribute mismatch; per-country attribute-validation coverage ranges from 0% to ~99% globally ([Onfido docs](https://documentation.onfido.com/getting-started/general-introduction/)). Both figures are best-guess inferences from vendor coverage materials.
- **Bypass methods:** None needed.
- **Attacker trace:** Real name, DOB, address, phone, document image, and biometric template logged with the provider's IDV vendor. Document images and biometrics may be retained up to ~3 years per [Onfido / Entrust facial-scan policy](https://onfido.com/facial-scan-policy-and-release/).

### Measure 2 — Institutional affiliation check

- **Binding?** Yes, but trivially passed: by construction the attacker is the only employee of their own LLC, using a self-owned domain.
- **FNR:** Estimated 20–40% for small-business / startup customers globally — they often use generic email domains, share addresses, or lack matching institutional records. Best guess; no public benchmark.
- **Bypass methods:**
  - **Self-owned domain workspace** (Google Workspace + LLC-matching domain).
    - Expertise: **Aspirant** — standard small-business setup, no tradecraft.
    - Cost: ~$10–$22/yr for a .com ([Namecheap](https://www.namecheap.com/domains/), best-guess for list pricing) + Google Workspace Business Starter ~€6.80/user/month with annual commit ([Google pricing](https://workspace.google.com/pricing.html)).
    - Lead-up time: 1–2 hours including DNS propagation (best guess).
    - Trace: Domain WHOIS (privacy proxy gives only weak protection — registrar still holds payment records); Google Workspace billing under real card.
    - No cross-measure dependency beyond using the same LLC name as Measure 3.

### Measure 3 — Organization registry + verified shipping address

- **Binding?** Yes. This is the structural anchor of the branch — a real LLC, real address, real bank account.
- **FNR:** ~15–30% of legitimate small-business / startup applicants may use addresses that fail strict CMRA-style classification (virtual offices, coworking, residential sole-proprietor addresses). Best guess from USPS CMRA prevalence and small-biotech operating norms.
- **Bypass methods:**

  **1. Real US LLC + virtual office in a biotech metro.**
  - Expertise: **Aspirant** — commodity small-business formation done by hundreds of thousands of US LLCs/year.
  - Cost: Wyoming LLC = $100 filing + $150–$300/yr registered agent ([NCH breakdown](https://nchinc.com/blog/business-startup/how-much-does-wyoming-llc-formation-cost/)). Delaware ~$90 filing + $300/yr franchise tax + $100–$300/yr agent (best guess from [Delaware fee schedule](https://corp.delaware.gov/fee/)). Regus virtual office in California from ~$50–$60/month ([Regus](https://www.regus.com/en-us/united-states/california/virtual-offices)). USPS Form 1583 notarization ~$25 online ([enotaryoncall](https://www.enotaryoncall.com/blog/usps-form-1583-faq-guide/)). Total: ~$300–$700 first month, ~$100–$300/month recurring.
  - Lead-up time: Wyoming online filing 1–2 business days; full chain (LLC → virtual office → Form 1583 → bank approval) 2–6 weeks (best guess combining sourced LLC + fintech timelines, e.g. [Mercury LLC banking](https://mercury.com/llc-banking)).
  - FinCEN context: as of March 2025, [FinCEN removed BOI reporting](https://www.fincen.gov/news/news-releases/fincen-removes-beneficial-ownership-reporting-requirements-us-companies-and-us) for US companies and US persons, eliminating one identifying disclosure for this attacker.
  - Trace: State business registry (public, principal name searchable indefinitely); IRS EIN responsible party (private but subpoena-accessible); notarized Form 1583 with photo ID copies; virtual-office tenant KYC; bank KYC under BSA/AML; provider IDV under real name.
  - Cross-measure dependency: bank account opening is the practical bottleneck for *all* address methods, not a separate method.

  **2. Real US LLC + non-CMRA executive suite.**
  - Expertise: Aspirant. Cost: $200–$400/month (best guess from Regus mid-tier listings). Lead-up time and trace as method 1, plus more credible mailroom records.

  **3. Coworking-space lease (WeWork etc.).**
  - Expertise: Aspirant. Cost: ~$300–$800/month dedicated desk in biotech metros (best guess). Lead-up: 1–4 weeks. Trace: adds coworking KYC.

  **4. Foreign jurisdiction LLC + foreign virtual office (Estonian e-Residency).**
  - Expertise: **Novice** — slightly above Aspirant for cross-border compliance.
  - Cost: €265 OÜ registration + €150 e-Residency fee ([e-Residency fees](https://learn.e-resident.gov.ee/hc/en-gb/articles/360000625118-Costs-fees)); resident contact-person + registered address €600–€1,200/yr ([Nomad Labs](https://nomad-labs.com/estonian-e-residency-company-what-they-dont-tell-you/)).
  - Lead-up time: ~6–8 weeks for e-Residency processing + 1–2 days for OÜ registration (best guess).
  - Trace: Estonian Business Register (public); e-Residency biometrics held by Estonian government; contact-person KYC; Wise Business KYC. Banking is the choke point — Estonian banks have tightened toward e-Residents, leaving fintechs as the workaround.

  **5. Bank-account opening (constraint, not a method).** Mercury requires US registration, formation docs, EIN, and ID for ≥25% owners and may reject thin-doc LLCs ([Mercury Eligibility](https://support.mercury.com/hc/en-us/articles/28770467511060-Eligibility)). Estimated 20–40% first-application rejection rate for brand-new LLCs at fintechs (best guess).

### Measure 4 — Research & entity signals

- **Binding?** Yes — but the CRO cover story is *designed* to neutralize it. Small CROs legitimately have no publications, no grants, no IBC, so absence doesn't differentiate the attacker from real customers.
- **FNR:** Estimated 30–60% for legitimate small CROs and similar new entities — research-signal coverage falls sharply outside academic environments, and NIH RePORTER only covers US federally funded work. Best guess; no published synthesis-customer benchmark. The US CRO market was ~$17.5B in 2023, so the legitimate base rate is large enough to make this FNR plausible ([Spherical Insights](https://www.sphericalinsights.com/reports/united-states-contract-research-organization-cros-market)).
- **Bypass methods:**

  **1. CRO services-page cover story.** Novice (CRO domain literacy, no tradecraft). Cost ~$16–$30/month for a Squarespace-style template + <$20 domain ([Squarespace pricing](https://www.squarespace.com/pricing), best guess). Lead-up: 4–8 hours of writing. Quality risk: a biology-literate critical reviewer could detect AI/template content; baseline provider review is unlikely to be biology-literate.

  **2. LinkedIn personas for 1–2 founders.** Aspirant. $0. 1–2 hours/profile. Permanent public trace under real name.

  **3. Fabricated team — 3–5 employee LinkedIn personas.** Novice (AI photos, profile maintenance). $0–$30/month if Premium added. 2–4 hours/profile + ongoing maintenance. Failure mode: LinkedIn periodically purges fabricated accounts; profiles with no external connections are visibly weak.

  **4. ORCID + Google Scholar self-affiliation.** Aspirant. $0 — or $200–$5,000 if combined with a paid co-authorship slot ([Nature on paper-mill pricing](https://www.nature.com/articles/d41586-023-00062-9), [Abalkina 2023](https://onlinelibrary.wiley.com/doi/full/10.1002/leap.1574); best guess for the slot range). Lead-up: 30 min for the profile, 1–6 months for a paid paper to appear. Permanent public trace.

  **5. Crunchbase / company-database self-listing.** Aspirant. $0. 30 min. Public listing tied to LLC name.

  **6. Aged-domain purchase.** Novice. $50–$5,000 depending on age/traffic (best guess from auction marketplaces). 1–4 weeks for transfer. Failure mode: WHOIS history and Wayback expose registrant change; the trick mostly fails against critical review.

  **7. Predatory-journal publication seeding.** Novice. $180–$5,000 per slot. 1–6 months. **Cross-measure dependency:** the paper's stated research area locks in Measure 9 biosafety scope and order categories.

  **8. No publication strategy — accept thin profile.** Aspirant. $0. None.

  **Marginal flag:** No public evidence any synthesis provider currently runs CRO-specific enhancements (client-reference verification, wet-lab subcontractor checks). [No source found; searched for "Twist IDT GenScript CRO verification process" and similar.]

### Measure 5 — Payment integrity

- **Binding?** No. Real LLC bank account, real card, all under real name.
- **FNR:** Estimated <5% — controls are corroborative with manual-review fallback. Best guess.
- **Bypass methods:** None needed. Mercury / Relay / Bluevine offer free LLC business banking ([Mercury LLC banking](https://mercury.com/llc-banking)). Constrained by the bank-account choke point in Measure 3.

---

## Matrix B (SOC orders — adds 6–9)

### Measure 6 — Identity verification (IAL2)

- **Binding?** No. Real face, real ID, real liveness selfie.
- **FNR:** ~85–95% legitimate-customer pass rate on first attempt globally (best guess from vendor reports); per-country attribute coverage 0–99%.
- **Bypass methods:** None needed.
- **Trace:** Higher-fidelity biometric commitment than Measure 1 — facial template, liveness video, document image, possibly NFC data — retained up to ~3 years per [Entrust/Onfido policy](https://onfido.com/facial-scan-policy-and-release/). [Onfido Known Faces](https://onfido.com/solutions/known-faces/) flags repeat applicants within a single business customer's flow.

### Measure 7 — MFA + re-authentication

- **Binding?** No. The attacker controls the device that holds the TOTP seed.
- **FNR:** Under 5% on first attempt (best guess).
- **Bypass methods:** None.
- **Trace:** TOTP seed bound to attacker's device; enrollment events logged.

### Measure 8 — Vouching by registered contact

- **Binding?** **Yes, with a binary fork.** Permissive baseline (any second contact qualifies): branch survives with one accomplice. Strict baseline (voucher must be at a verified independent institution): **branch dies completely.**
- **FNR:** Permissive ~5–15%; strict ~30–60% (small entities and community labs lack qualifying third parties). Best guess.
- **Bypass methods (assuming permissive baseline):**

  **1. Trusted personal accomplice as second registered contact.** Aspirant. $0 in money; significant in trust commitment and ongoing availability. Hours for IAL2 enrollment, then hours per SOC order for fresh-MFA approval. Trace: accomplice's full IDV record on file (face, ID, biometrics retained up to 3 years), trivially attributable to the attacker through their personal relationship.

  **2. Paid accomplice via gig platform.** Novice. $50–$500 actual outlay; effective cost is higher because gig workers commonly refuse identity-verification tasks for unfamiliar third parties [no source found; searched for Upwork/Craigslist/TaskRabbit refusal rates]. Days to weeks to recruit; recurring per-order availability problem. Trace: worker IDV on file + gig-platform records linking worker to attacker's real card.

  **3. Sock-puppet helper LLC.** Novice. ~$1,000 setup + ~$200/month recurring (≈2× single-LLC cost). 2–6 weeks (parallel to primary LLC). Survives only the weakest enforcement (domain-mismatch check); fails biometric dedup if same person operates both, fails any substantive third-party verification.

  **4. Self-vouching with two attacker accounts.** Novice. $0 if it works, but likely fails at any provider running [Onfido Known Faces](https://onfido.com/solutions/known-faces/) or equivalent customer-side dedup — the same biometric appearing twice *is* the failure trace.

- **Cross-measure dependency:** Voucher-independence enforcement collapses the entire branch — the highest-leverage defensive change for this attacker.

### Measure 9 — Biosafety documentation

- **Binding?** Yes, partially. No central registry for private-entity IBCs exists, so the verification surface is thin.
- **FNR:** ~30–60% or higher for small private entities and non-NIH-funded organizations, because verification at small organizations is "extremely difficult" per the proposed baseline ([measures-in-practice §9](../../../measures-in-practice.md), best-guess synthesis).
- **Bypass methods:**

  **1. Self-authored biosafety plan referencing standard frameworks.** Novice (BMBL familiarity; AI assistance suffices). $0 (BMBL and university templates are public). 6–12 hours of writing for a tailored 5–15 page plan. Quality risk: if a reviewer asks "who is your biosafety officer?" and the answer is the attacker themselves with no biosafety background on LinkedIn, plan credibility collapses — mitigation is to designate the accomplice or bring in methods 3/4. **Cross-measure dependency:** the plan's research scope must match Measure 4 publication seeding (if used) and order categories.

  **2. Fabricated IBC approval letter.** Novice. $0. 1–2 hours. Forged document on LLC letterhead; persistent forensic artifact.

  **3. Pay a real biosafety consultancy.** Aspirant (the consultant does the work). ~$1,000–$5,000 for a generic small-shop biosafety program (best guess; no published price point — referenced from [BSL-2 lab construction strategies](https://financialmodelslab.com/blogs/profitability/bsl-2-laboratory) which gives capital-project percentages). 2–6 weeks. Trace: real consulting firm paid through real bank account; consultant has business records linking their work to the LLC.

  **4. Pay a credentialed freelancer for light review only.** Aspirant. $200–$500 for a freelance biosafety officer to review and sign an attacker-drafted plan; freelancer hourly rates ~$100–$300/hour (best guess from ABSA-style market norms). 1–2 weeks. Trace: freelancer business records + payment trail.

---

## Cross-branch cost / time bottom line

- **Cheapest Matrix A path:** ~$350–$750 first month + ~$140–$290/month recurring; 2–6 weeks lead-up dominated by LLC + virtual office + bank approval.
- **Cheapest Matrix B path:** Matrix A + $0 (self-vouching with trusted accomplice + self-authored biosafety plan) up to ~$1,000–$5,500 (helper LLC + freelance reviewer + consultant variant).
- The branch's defining cost is **identity commitment**, not money or expertise: the attacker's real legal name lands on the state business registry, the IRS, the bank, the IDV vendor, the virtual office, the domain registrar, and LinkedIn — and an accomplice's identity lands on the IDV vendor and the gig platform if used.
