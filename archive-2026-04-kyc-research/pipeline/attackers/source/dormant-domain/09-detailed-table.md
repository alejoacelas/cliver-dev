# Hijacked dormant academic / society domain — Detailed table

Branch A of the fake-affiliation profile. A patient lone operator acquires (or reclaims via dangling-DNS takeover) the canonical domain of a defunct research entity whose publication trail is still live in PubMed, Google Scholar, and NIH RePORTER. The attacker reanimates the domain, stands up a "we're back" website and mail server, and presents as a "successor researcher" at a small revived lab — using their own real government ID throughout. Budget: low-end hundreds to tens of thousands upfront; lead time: months to nearly two years, dominated by corpus mining and (if pursued) citation seeding.

---

## Matrix A (all orders)

### Measure 1: Identity verification — IAL1

**Binding?** No. The attacker presents their own real government-issued identity. Attribute validation succeeds against credit bureau and carrier data; OTP is delivered to the attacker's real phone. There is nothing to bypass.

**False-negative rate.** ~2–5% of legitimate customers fail IAL1 on first attempt, primarily due to document capture quality and international document coverage gaps. Effective blocking after retry is <1% ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)).

**Bypass methods.** None needed for the cheapest path ($0, own ID). A lower-trace variant exists — using stolen PII plus a SIM swap to pass under a victim's identity — but it is expensive ($300–$5,000 for a SIM swap, [ReliaQuest](https://reliaquest.com/blog/exploring-sim-swapping-services-on-cybercriminal-forums/)) and unnecessary for this branch's profile, since the attacker commits their real identity at every downstream measure anyway.

- **Attacker trace:** Real name, DOB, national ID or SSN-last-4, phone number, and credit-bureau correlation hash stored at the IDV vendor for 5–7 years. Accessible to the provider's compliance team and, via subpoena, to law enforcement.

---

### Measure 2: Institutional affiliation check

**Binding?** Yes — the load-bearing measure of the branch. The attacker must control a domain that a synthesis provider's affiliation check accepts as belonging to a legitimate research institution. Everything else in the branch depends on this.

**False-negative rate.** An estimated 10–25% of legitimate researchers fail on first attempt, driven by non-institutional-email use (~13–16% per [LSE Impact Blog](https://blogs.lse.ac.uk/impactofsocialsciences/2018/06/21/institutional-versus-commercial-email-addresses-which-one-to-use-in-your-publications/)), non-standard domain structures at hospitals and cross-listed centers, visiting scholars, and retirees. Final blocking after manual review is likely ~3–8%.

**Bypass methods.**

**Bypass A — Acquire the lapsed canonical domain (primary):**
- **What the attacker does:** Continuously scrapes citation databases for affiliations whose canonical domains have lapsed, cross-references against TLD drop lists, and buys the domain at drop auction or aftermarket when a high-value match appears. Then stands up a mail server (SPF/DKIM/DMARC configured, 4–6 weeks of domain warming per [Mailforge](https://www.mailforge.ai/blog/domain-warming-best-practices)) and a basic "lab" website mirroring the defunct entity's archive.org snapshot.
- **Expertise:** Practitioner — corpus mining across PubMed/RePORTER, DNS resolution, and drop-catch auction management require demonstrable competence but are well within the skill envelope of a competent independent researcher.
- **Cost:** $500–$10,000 for the domain (low end for obscure regional consortia, high end where SEO-operator competition bids up desirable names; [DomainDetails](https://domaindetails.com/kb/domain-investing/expired-domain-auctions-comparison); [747Media House](https://747mediahouse.com/expired-domains/)) + $100–$500 for VPS hosting and mail stack.
- **Lead-up time:** 3–9 months end-to-end (months of corpus mining and drop-queue waiting; days for acquisition; 4–8 weeks for mail warming).
- **Attacker trace:** Domain registrant record at the registrar (real name, or privacy-proxy with underlying identity retained for ICANN compliance and subpoena). Hosting-provider billing. Mail server logs. `persona@domain` on file at the synthesis provider alongside IAL1 PII. A Google search of the revived entity name surfaces the attacker's landing page.
- **Key caveat:** A WHOIS-history check flagging recent registrant changes on old domains would surface this bypass. Whether providers deploy such checks is the marginal flag for this branch.

**Bypass B — Dangling-DNS subdomain takeover on live parent institution:**
- **What the attacker does:** Scans .edu subdomains for dangling CNAME records pointing to deprovisioned cloud resources (S3 buckets, Azure endpoints, Heroku apps). When found, claims the resource and takes control of mail for that subdomain. The parent university's WHOIS and domain-age signals remain intact. Squarcina et al. (2021) found exploitable subdomain-takeover vulnerabilities in 887 of the Tranco top-50k domains, including harvard.edu and nih.gov ([USENIX Security 2021](https://www.usenix.org/system/files/sec21-squarcina.pdf)).
- **Expertise:** Practitioner (bordering Expert) — requires knowledge of subdomain-takeover mechanics, ability to scan at scale, and ability to claim the resource before bug-bounty discovery.
- **Cost:** Two sub-variants:
  - *B1 — Own-identity cloud account:* $0–$50 for the bucket/endpoint + $10–$100/mo scanning VPS. But the attacker's identity is committed at the cloud provider via cloud-account KYC, eliminating the trace advantage.
  - *B2 — Stolen cloud credentials:* $50–$500 for low-tier AWS/GCP keys on stealer-log markets ([DeepStrike](https://deepstrike.io/blog/dark-web-data-pricing-2025); [DarkOwl](https://www.darkowl.com/blog-content/the-darknet-economy-of-credential-data-keys-and-tokens/)) + $10–$100/mo scanning VPS. Lowest-trace variant, but cloud providers increasingly correlate stolen-credential activity with abuse signals and may lock the account mid-operation.
- **Lead-up time:** 3–9 months of continuous scanning; hours to days once a usable resource is found.
- **Attacker trace:** B1: cloud-provider billing and KYC in attacker's name; no registrar trail. B2: crypto payment trail to stealer-log marketplace; cloud provider's KYC record is a mismatched victim identity. Neither sub-variant leaves a registrar trace at the parent university.
- **Cross-measure dependency:** B2 introduces a stolen-credential failure mode not present in Bypass A — the cloud account may be suspended at any time, collapsing the bypass.

**Bypass C — Typosquat / lookalike fallback:**
- **What the attacker does:** Registers a near-collision domain at a retail registrar (e.g., `lab-genomics.org` vs. `labgenomics.org`).
- **Expertise:** Novice — trivial registrar operation.
- **Cost:** $10–$50/year.
- **Lead-up time:** Hours.
- **Attacker trace:** Same as Bypass A (registrar record) but without the patient corpus-mining investment. Easy to discredit on visual inspection.
- **Key caveat:** Defeated by any provider that checks domain-string similarity against known institutional domains. A low-investment, low-reliability fallback.

**Bypass D — Catch-all MX for multi-persona mailboxes:**
- **What the attacker does:** Configures a catch-all mail server on the controlled domain, generating multiple persona addresses (e.g., `dr.jones@`, `lab.admin@`).
- **Expertise:** Novice — single mail-server config flag.
- **Cost:** $0 incremental once the domain is controlled.
- **Lead-up time:** Minutes.
- **Attacker trace:** All persona addresses are trivially attributable to the same domain owner. Multi-persona use on a small revived lab is itself a flag if the provider tracks account-graph signals.

---

### Measure 3: Organization registry + verified shipping address

**Binding?** Yes. The attacker must place a plausible organization on the provider's registry and deliver product to a verifiable address.

**False-negative rate.** ~10–20% of legitimate small research entities fail on first attempt, driven by reliance on mail-receiving services (CMRA-flagged), solo-PI labs unable to supply two contacts, and cross-metro researcher mobility creating jurisdiction mismatches. Most are recoverable on manual review.

**Bypass methods.**

**Bypass A — Self-register the revived lab:**
- **What the attacker does:** Registers the revived entity on the provider's organization registry using the reanimated domain and the attacker's real IAL1 identity as primary contact.
- **Expertise:** Aspirant — filling a self-attested form.
- **Cost:** $0 incremental.
- **Lead-up time:** Hours.
- **Attacker trace:** Org name, web address, and attacker's real identity as primary contact in the provider's registry.

**Bypass B — Address sourcing (virtual office / residential / mail aggregator):**
- **What the attacker does:** Provides a shipping address consistent with the revived lab's geographic identity. Three options: residential (if the attacker lives in the target metro — $0 marginal), virtual office ($100–$500/mo; CMRA-flag risk per [Smarty docs](https://www.smarty.com/docs/cmra)), or biotech coworking ($500–$2,000/mo with its own KYB intake). Cheapest CMRA-flag-safe path is genuine local residency.
- **Expertise:** Novice (virtual office) to Practitioner (understanding which providers use CMRA-flag-aware validation from Smarty/Melissa/Google address products).
- **Cost:** $0 (residential) to $100–$500/mo (virtual office) to $500–$2,000/mo (biotech coworking). iPostal1 starts at $9.99/mo ([iPostal1](https://ipostal1.com/virtual-mailing-address-plans-pricing.php)); UPS Store mailboxes at $10–$60/mo ([MailboxAvenue](https://mailboxavenue.com/blogs/the-mailbox-blog/how-much-are-ups-mailboxes)).
- **Lead-up time:** 1–2 weeks (virtual office application, USPS Form 1583 notarization). Biotech coworking: 4–12 weeks.
- **Attacker trace:** Lease or aggregator account under attacker's real name with real payment. USPS Form 1583 on file at the CMRA. Physical delivery location known.

**Bypass C — Two-contact accomplice (load-bearing, inherited by M8):**
- **What the attacker does:** Recruits a second person to register as an additional contact at the revived lab, satisfying the two-contact requirement. This person commits their real identity via IAL1 and, for SOC orders, IAL2 and MFA.
- **Expertise:** Practitioner — identifying, vetting, compensating, and retaining a co-conspirator who commits real biometrics is an operator-competence problem.
- **Cost:** Wide band — $0–$15,000 per order, depending on recruitment path. Trust-based recruitment (family, former labmate) may work for $0 monetary plus 20–80+ hours of operator time over months. Arms-length paid-stranger recruitment runs $3,000–$15,000 per order to overcome perceived legal risk and small-pool defection dynamics. The $1,000–$5,000 per-order figure from banking/telecom insider markets ([Flashpoint](https://flashpoint.io/blog/insider-threats-2025-intelligence-2026-strategy/); [Cybersecurity News](https://cybersecuritynews.com/threat-actors-are-hiring-insiders-in-banks-telecoms/)) is the closest published proxy, but academic second-contact recruitment differs structurally: no forum-style marketplace, a tiny candidate pool, and turnover of an outed accomplice is terminal for the operation. First-order effective cost (amortized recruitment + operator time + first payment): $3,000–$20,000.
- **Lead-up time:** Weeks to months for recruitment and vetting.
- **Attacker trace:** Accomplice's full PII committed at IAL1; their real name, face, and device committed via M6/M7 if SOC is pursued. The relationship trail between attacker and accomplice is the main attribution surface and the main defection risk.
- **Key uncertainty:** The cost band is wide because the academic second-contact recruitment market is undocumented — the range is honest about this uncertainty.

**Bypass D (not labeled separately in the research but implied):** The attacker may attempt to satisfy the two-contact requirement via catch-all mailbox personas from M2 Bypass D. This is defeated by any provider requiring independent IAL1 for each registered contact.

---

### Measure 4: Research & entity signals

**Binding?** Yes. The provider's entity-signal review must conclude the organization looks like a real research entity. This branch's core strength is that the defunct entity's real publication trail does much of the work automatically.

**False-negative rate.** ~15–30% of legitimate small, new, or non-US research entities fail on first pass, driven by thin publication footprints, non-English venue underweighting, and NIH RePORTER coverage that excludes non-US-funded work. M4 is the biggest individual contributor to legitimate-customer friction in Matrix A.

**Bypass methods.**

**Bypass A — Reflected legitimacy from defunct entity's real publication trail (baseline):**
- **What the attacker does:** Points reviewers at the real, indexed publications associated with the defunct entity's domain. No fabrication needed — the records already exist in PubMed, Scholar, and RePORTER.
- **Expertise:** Novice — the attacker is pointing at records that already exist.
- **Cost:** $0 incremental.
- **Lead-up time:** 0 active work; leveraged passively from M2 Bypass A.
- **Attacker trace:** Attacker's name on the revived landing page and in provider onboarding. The original publications do not list the attacker.

**Bypass B — Name-disambiguation collision exploitation:**
- **What the attacker does:** Selects defunct entities where the attacker's real name (or an accomplice's name) happens to collide with an author on the entity's original publications. Only 58% of PubMed authors have a full original name populated ([PMC 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8363810/)), meaning last-name + first-initial matching creates substantial ambiguity.
- **Expertise:** Practitioner — requires joint corpus-mining filtering on publication trail plus name collision.
- **Cost:** $0 incremental if the name match is natural; full accomplice recruitment cost ($1,000–$5,000+) if a name-matched person must be recruited.
- **Lead-up time:** Absorbed into M2 corpus-mining phase.
- **Attacker trace:** Muddied by the existence of a real homonym researcher, but a determined investigator disambiguates within hours via co-author network or ORCID cross-check.

**Bypass C — Active citation seeding via low-bar OA preprints / methods notes:**
- **What the attacker does:** Writes and publishes bioRxiv preprints or open-access methods notes under the revived-lab affiliation, creating fresh entries in Scholar and CrossRef that tie the attacker's name to the entity. bioRxiv is free ([bioRxiv](https://www.biorxiv.org/about-biorxiv)); journal APCs have a median of ~$561 ([bioRxiv preprint 2025](https://www.biorxiv.org/content/10.1101/2025.10.10.681750v1.full.pdf)).
- **Expertise:** Practitioner — writing publishable methods notes under a research persona.
- **Cost:** $0 (bioRxiv only) to ~$1,700 (1–3 OA journal APCs).
- **Lead-up time:** 6–12 months (drafting, submitting, revising, indexing). **Sequencing note:** citation seeding cannot begin until the domain is under attacker control, so these months stack on top of M2's 3–9 months, not in parallel.
- **Attacker trace:** Permanent public OA publications under attacker's name and revived-lab affiliation. Indexed in Scholar and CrossRef. Durable, retractable only by the publisher — a high-commitment public artifact.

**Bypass D — Light ORCID / Scholar seeding (baseline uplift):**
- **What the attacker does:** Creates an ORCID profile and Google Scholar profile tied to the revived-lab affiliation.
- **Expertise:** Aspirant — free sign-up forms.
- **Cost:** $0.
- **Lead-up time:** ~1 hour plus indexing lag.
- **Attacker trace:** ORCID and Scholar profiles publicly tying attacker's name to the revived lab. Durable, search-indexed.

---

### Measure 5: Payment integrity

**Binding?** Conditional. Binding if the provider enforces org-name-match between the payer and the verified organization. Non-binding otherwise.

**False-negative rate.** Negligible for legitimate customers. Payment-network declines at checkout (~3–8%) are driven by expired cards, insufficient funds, and CVV mismatches — unrelated to KYC.

**Bypass methods.**

**Bypass A — Personal card, org-name-mismatch accepted (permissive providers):**
- **What the attacker does:** Pays with their own personal credit card. At providers that do not enforce org-name matching, this passes trivially.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** 0.
- **Attacker trace:** Real card on file at provider.

**Bypass B — LLC + EIN + fintech business account (stricter providers):**
- **What the attacker does:** Forms a Delaware LLC ($90 state filing + $100–$300 registered agent; [Confiance](https://confiancebizsol.com/delaware-llc-formation-fees-and-requirements/); [Harvard Business Services](https://www.delawareinc.com/llc/delaware-llc-annual-fee/)), obtains an EIN, opens a fintech business bank account (e.g., Mercury, which runs KYB including real principal place of business and source-of-funds documentation).
- **Expertise:** Novice — business formation is well-documented.
- **Cost:** $200–$1,000 total ($110 state filing + $100–$300 registered agent + $50–$500 optional services). Plus $300/year Delaware franchise tax.
- **Lead-up time:** 1–4 weeks for US residents; 3–4 months for non-residents due to IRS SS-4 fax/mail processing.
- **Attacker trace:** State business filing with attacker's real name as registered agent/member. EIN at IRS listing attacker as responsible party. Fintech bank KYB record with full identity and source-of-funds documentation. Substantially more committed than the personal-card path.

---

### Matrix A synthesis

**Three sub-configurations (from cheapest to most invested):**

- **Sub-config 1 — Residential-colocation lucky case, no accomplice, no seeding:** $600–$2,000. Domain $500 + hosting $100–$500 + $0 residential address + $0 personal card + $0 reflected legitimacy. Only available when the attacker genuinely lives in the original lab's metro area.
- **Sub-config 2 — Dangling-subdomain variant (stealer-log creds), no accomplice, no seeding:** $200–$900. Stolen cloud creds $50–$500 + scanning VPS $10–$100/mo + $0 residential address + $0 personal card. Adds a stolen-credential failure mode.
- **Sub-config 3 — Generic case with accomplice (no residential luck):** $4,000–$20,000. Sub-config 1 base + accomplice first-order effective cost $3,000–$20,000.
- **Sub-config 4 — Full upfront investment:** $9,800–$39,700 (competitive domain $5,000–$10,000 + hosting $100–$500 + virtual office ~$1,200–$6,000/yr + citation seeding $0–$1,700 + LLC $500–$1,500 + accomplice $3,000–$20,000).

**Lead time:** Without citation seeding: 3–9 months. With citation seeding: 9–21 months (domain must precede seeding; they cannot run in parallel).

**Combined legitimate-customer first-pass rejection:** For small / non-US / new labs, roughly 30–50% combined across M1–M4 (heavy positive correlation — the same population fails multiple measures), recoverable to ~8–15% final block rate after appeals. For well-documented US academia: ~5–15% first-pass, <3% final block. M4 is the biggest individual contributor.

**Trace profile:** Personal identity fully committed. Accomplice identity committed in sub-configs 3–4. Multiple real legal and public-record artifacts (registrar, hosting, ORCID, landing page, LLC if taken).

---

## Matrix B (SOC orders — adds on top of Matrix A)

### Measure 6: Identity verification — IAL2

**Binding?** No (cheapest path — own face). The attacker presents their own face and real ID to a selfie + liveness vendor flow. Everything passes authentically.

**False-negative rate.** ~5–15% of legitimate customers fail on first attempt, stacking liveness/capture-quality rejections on top of the ~2% document-IDV baseline ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)). NIST-documented demographic disparities in facial recognition contribute.

**Bypass methods.**

**Bypass A — Own face (cheapest):**
- **What the attacker does:** Presents self to camera with real ID.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** Biometric template stored at IDV vendor (Jumio, Onfido, Persona, etc.; typically 1–5 years). Document images retained. Face-recognition template correlatable across any future IDV session at the same vendor.

**Bypass B — Injection attack against weak vendor SDK:**
- **What the attacker does:** Builds an injection rig that defeats liveness detection without device-integrity enforcement — camera driver hooking, synthetic-video pipeline, attestation-flow analysis.
- **Expertise:** Expert — sustained engineering on the IDV vendor's SDK.
- **Cost:** $5,000–$30,000 engineering setup; near-zero per attempt afterward. Best-guess — no direct public price exists.
- **Lead-up time:** Weeks to months for rig development; per-attempt minutes.
- **Attacker trace:** No live person committed; trace runs through breach-data marketplace (victim document photo), injection rig artifacts (IP, device fingerprint), and attacker infrastructure.
- **Key caveat:** Unnecessary for this branch because the attacker commits their real identity everywhere else anyway. Only relevant if the attacker wants to specifically avoid biometric commitment.

**Bypass C — Manual-fallback country selection:**
- **What the attacker does:** Exploits vendors' manual-review fallback for document types or countries not covered by automated flows.
- **Expertise:** Novice.
- **Cost:** $0 (genuine documents with false narrative) to $1,000–$5,000 (passport-quality forgery, depending on country).
- **Lead-up time:** Days to weeks.
- **Attacker trace:** Document on file at vendor; human reviewer decision log.

---

### Measure 7: MFA + re-authentication

**Binding?** No. The attacker enrolls their own TOTP or push-notification device.

**False-negative rate.** <1% for legitimate customers who control their enrolled factor. Lost-device recovery flows handle edge cases.

**Bypass methods.** None needed.

- **What the attacker does:** Enrolls own MFA device (TOTP seed or push app). Authenticates at SOC order submission and any shipping-address changes.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Minutes.
- **Attacker trace:** TOTP seed or push-device fingerprint tied to attacker's device at the identity provider. MFA enrollment and authentication events logged.

---

### Measure 8: Vouching by registered contact

**Binding?** Yes. The recruitment-and-trust problem is the load-bearing operational risk for this branch. No real second contact exists at the defunct entity, so the attacker must supply one — and that person must independently pass the provider's registered-contact requirements.

**False-negative rate.** ~15–30% of legitimate small labs (1–3 researchers) experience significant friction finding a second appropriate voucher for every SOC order. This is not yet a standardized industry practice, so the rate is a best-guess.

**Bypass methods.**

**Bypass A — Recruited willing collaborator (cleanest):**
- **What the attacker does:** Uses the accomplice already recruited at M3, who logs into the provider portal and approves the SOC order.
- **Expertise:** Practitioner (recruitment-and-trust management).
- **Cost:** Per-order marginal cost: $0–$15,000, inheriting the full M3 Bypass C range. Trust-based accomplice: $0 monetary per vouching act. Arms-length paid stranger: $3,000–$15,000 per order.
- **Lead-up time:** Per order: minutes (accomplice logs in, approves). Recruitment cost was front-loaded at M3.
- **Attacker trace:** Per-order portal-approval log under the accomplice's authenticated session; accomplice biometrics retained from M6; accomplice MFA device fingerprint from M7. Relationship trail (payment channel to accomplice) accrues with each per-order payment.
- **Cross-measure dependency:** Cost and feasibility at M8 are entirely determined by the accomplice-recruitment choice at M3. A trust-based accomplice makes M8 near-free; an arms-length stranger makes it the most expensive single per-order cost in the stack.

**Bypass B — Gig-economy paid mule:**
- **What the attacker does:** Posts on verification-jobs marketplaces and hires a throwaway mule to register as a second contact and approve the order.
- **Expertise:** Novice-to-Practitioner.
- **Cost:** $50–$500 per vouching session ([Flashpoint](https://flashpoint.io/blog/insider-threats-2025-intelligence-2026-strategy/)), plus turnover cost (recurring re-onboarding of new second contacts at the same lab is itself a flag).
- **Lead-up time:** Days per order (mule scheduling).
- **Attacker trace:** Mule's real biometrics on file; no relationship trail to attacker beyond gig-platform channel.
- **Key caveat:** Frequent turnover of second contacts at a "small revived lab" is a strong anomaly signal if the provider tracks contact-change rates.

**Bypass C — Social-engineer a former collaborator:**
- **What the attacker does:** Reaches out from the revived domain to a former co-author or collaborator listed on the defunct entity's publications, asking them to vouch for the "revived lab." Cold outreach under a research-persona cover.
- **Expertise:** Practitioner (social engineering under an academic cover).
- **Cost:** $0 monetary + significant operator time.
- **Lead-up time:** Weeks per successful approach.
- **Attacker trace:** The former collaborator becomes a witness if they later remember the interaction. Their vouching session is logged in their real identity at their current institution.
- **Key caveat:** If the former collaborator recognizes that the entity was defunct and finds the revival suspicious, the approach collapses and creates a witness who may alert others.

---

### Measure 9: Biosafety documentation

**Binding?** Yes (for SOC). This is the most structurally fragile measure for the branch because no real parent institution issues IBC coverage for the revived lab. Commercial fee-for-service IBC review largely removes the fragility for the persistent variant, at substantial cost.

**False-negative rate.** ~25–40% of legitimate small private labs fail a hard documentation gate on first attempt, driven by the absence of a centralized public IBC registry, non-standard document formats, and many small entities either having no IBC or operating under commercial IBC contracts not all providers recognize. M9 is the biggest individual contributor to legitimate-customer friction in Matrix B.

**Bypass methods.**

**Bypass A — Commercial fee-for-service IBC review (dominant for persistent SOC):**
- **What the attacker does:** Engages a commercial IBC provider (e.g., WCG) to review a benign cover protocol for the revived lab. The LLC from M5 is effectively required for client onboarding. WCG's 2025 fee schedule: Pre-submission Consultation $1,060 + Site Assessment & Initial Review $7,978, running ~$8,000–$9,000 in year one ([WCG fee schedule via Rutgers](https://research.rutgers.edu/system/files/2025-01/wcg-irb-standard-fee-schedule.pdf)). Continuing annual fees at a similar rate.
- **Expertise:** Practitioner — writing a plausible benign research protocol that survives commercial IBC reviewer scrutiny requires domain knowledge of BSL risk groups, protocol format, and applicable NIH guidelines.
- **Cost:** ~$8,000–$9,000 first year; ~$8,000/year continuing.
- **Lead-up time:** 4–12 weeks for initial review, plus 2–6 weeks of client onboarding. Can run concurrently with citation seeding once the LLC exists.
- **Attacker trace:** Real client record at the commercial IBC under the revived lab's legal name. Real protocol on file. Attacker or accomplice named as PI. Durable third-party record that the provider can verify.
- **Cross-measure dependency:** Requires the LLC from M5 Bypass B to be in place.

**Bypass B — Fabricate IBC approval letter:**
- **What the attacker does:** Produces a forged IBC approval letter citing the revived lab's institutional status. Must get the committee composition, protocol-number format, organism/risk-group list, and signatures plausible enough to survive visual inspection by a biosecurity reviewer.
- **Expertise:** Practitioner — visual design is Novice-level, but surviving a competent reviewer's domain knowledge requires biosecurity familiarity.
- **Cost:** $50–$500 for design tools and time. Unpriced tail risk: criminal liability for document forgery and false statements in commerce.
- **Lead-up time:** Days.
- **Attacker trace:** Forged document in the provider's record. Cumulative-detection risk grows with each order and each different reviewer who examines the document.
- **Key caveat:** This is the cheapest one-off path but the riskiest for persistent use. Each additional order compounds the probability that a reviewer notices an inconsistency.

**Bypass C — Umbrella-protocol claim at real partner institution:**
- **What the attacker does:** Claims the order falls under an IBC approval at a real partner institution.
- **Expertise:** Novice.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** Names a real institution; cross-checkable on a single phone call by the provider's reviewer.
- **Key caveat:** Fragile — collapses on the first verification call.

**Bypass D — Sparse-coverage attestation:**
- **What the attacker does:** Self-attests that biosafety coverage is in place, exploiting the fact that providers in many jurisdictions cannot independently verify IBC status for small entities.
- **Expertise:** Aspirant.
- **Cost:** $0.
- **Lead-up time:** Hours.
- **Attacker trace:** Self-attestation signed by attacker in the provider record.
- **Key caveat:** Only works where the provider accepts self-attestation — depends entirely on how strictly the provider enforces the documentation requirement.

---

### Matrix B synthesis

**Three variant configurations:**

- **Variant 1 — One-off SOC order, fabricated IBC letter (high tail risk):** Matrix A sub-config 3 base ($4,000–$20,000) + fabricated letter ~$50–$500 + IAL2/MFA/vouching marginal $0 + per-SOC-order accomplice payment $0–$15,000. **Upfront: $4,000–$20,000; per-SOC-order marginal: $50–$15,500.** Criminal-exposure tail risk from document forgery; cumulative-detection risk across orders.

- **Variant 2 — Persistent supply chain, commercial IBC + LLC (dominant for persistent):** Matrix A sub-config 3 base ($4,000–$20,000) + LLC $200–$1,000 + WCG first-year IBC ~$8,000–$9,000 + IAL2/MFA marginal $0 + per-SOC-order accomplice payment $0–$15,000. **Upfront: $12,200–$30,000; per-SOC-order marginal: $0–$15,000** + ~$8,000/yr IBC continuing fees amortized.

- **Variant 3 — Full upfront investment (competitive domain, citation seeding, everything):** Matrix A sub-config 4 base ($9,800–$39,700) + LLC included + WCG first-year IBC ~$8,000–$9,000. **Upfront: $17,800–$48,700; per-SOC-order marginal as Variant 2.**

**Lead time:** One-off variant: 3–9 months (no seeding) or 9–21 months (with seeding). Persistent variant (commercial IBC): 5–12 months without seeding, 10–22 months with seeding (IBC onboarding can run concurrently with seeding once the LLC exists).

**Combined legitimate-customer first-pass rejection:** Adding Matrix B rows to Matrix A: M6 5–15%, M7 <1%, M8 15–30%, M9 25–40%. Combined first-pass rejection for small / non-US / new labs is roughly 50–70% (heavy correlation); final block rate after appeals and fallbacks probably 20–35%. High enough to challenge whether the full Matrix B set can be enforced as strictly mandatory without routing a substantial fraction of legitimate small-lab users to alternative paths (e.g., third-party vouching). M9 is the single biggest contributor.

**Trace profile:** Personal identity fully committed. Accomplice fully committed. Multiple durable legal artifacts (LLC, EIN, bank, commercial IBC client record, ORCID, landing page, preprints if seeded). Biometric templates at IDV vendor. Under the commercial-IBC option, no forged documents — legal exposure is limited to false statements about scientific intent.

**Where the KYC stack binds:** M2 (defeated mechanically but with months of upstream corpus-mining friction), M3 (address friction + accomplice recruitment cost), M4 (reflected legitimacy works but reviewer correspondence is a long-run attrition risk), M5 (conditionally binding under org-name-match), M8 (accomplice-trust problem — the single biggest persistent-variant failure mode), M9 (largely converted to a solved problem by commercial IBC for the persistent variant, but at ~$8,000/yr). The branch's success rests on three bets: (1) the provider's fraud tooling does not surface domain-recency signals, (2) the accomplice remains reliable and undefected, and (3) the commercial-IBC protocol scope is not cross-checked against the actual sequences ordered.
