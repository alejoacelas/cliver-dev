# Compromised small institutional inbox — Detailed table

Branch B of the fake-affiliation profile. A lone operator with practitioner-level cybercrime skills compromises a dormant or lightly monitored email account at a small US college (role mailbox, retired adjunct, alumni-for-life forwarder) and presents themselves to a synthesis provider as a new researcher using that institutional address. The attacker uses their own real identity at the IAL layer and a borrowed institutional persona at the affiliation layer. Two implementation worlds are carried through: "current practice" (single-contact provider, self-vouching, self-declared biosafety) and "strong baseline" (two-contact registry, independent voucher, verified biosafety).

**Cross-cutting infrastructure costs.** Every path in this branch requires residential proxy infrastructure geolocated to the target institution's metro (~$50–$200/month) to defeat Microsoft 365 Exchange Online's default outbound-forwarding block ([Microsoft Learn](https://learn.microsoft.com/en-us/defender-office-365/outbound-spam-policies-external-email-forwarding)) and Defender for Cloud Apps impossible-travel detection ([Microsoft Learn](https://learn.microsoft.com/en-us/defender-cloud-apps/anomaly-detection-policy)). Breach-dump access via DeHashed or equivalent runs ~$10–$30/month ([Oreate AI](https://www.oreateai.com/blog/dehashed-api-pricing-navigating-the-costs-for-2025-and-beyond/1eb20365325837181c5b9759e165af78)). These infrastructure costs are baked into Measure 2.

---

## Matrix A (all orders)

### Measure 1: Identity verification — IAL1

**Binding?** No. The attacker presents their own real government ID, real address, and real phone number. IAL1 passes by construction.

**False-negative rate.** ~2–5% of legitimate customers fail on first attempt; effective blocking <1% after retry. Driven by document-capture quality (poor lighting, glare, missing corners), not fraud ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets); [Persona](https://withpersona.com/blog/being-a-bouncer-adverse-scenarios-identity-verification)). Well-sourced.

**Bypass methods.** None needed.

- **Attacker trace:** Real name, DOB, phone, government ID data, and (for document-centric flows) an ID photograph stored by the provider's IDV vendor (typically 30-day to multi-year retention depending on regulatory class) and by the provider itself (5–7 years). Fully attributable to the attacker as an individual.

---

### Measure 2: Institutional affiliation check

**Binding?** Yes. This is the entire point of the branch — the attacker must obtain control of a real institutional email address to satisfy the affiliation check.

**False-negative rate.** ~5–15% of legitimate institutional users encounter friction if the provider's domain cross-reference is incomplete (large research universities routinely operate 5–20+ email domains spanning medical centers, alumni systems, and merged entities). Best guess; no direct industry data. Irrelevant to Branch B, which targets canonical primary domains.

**Bypass methods:**

1. **Breach-dump credential reuse**
   - The attacker queries commercial breach databases (DeHashed, similar services) for .edu credentials at small colleges, filters for dormant or role accounts, and attempts login through a residential proxy geolocated to the institution's metro. Roughly 5–20 usable credentials per 1,000 addresses queried, with 20–100 attempts needed before finding one truly dormant inbox.
   - Expertise: **Practitioner** — requires operating breach databases, understanding hash/plaintext availability, throttling login attempts, and running geotargeted residential proxies.
   - Cost: ~$200–$700 per successful inbox (DeHashed subscription + residential proxy + yield-adjusted attempts) ([Oreate AI](https://www.oreateai.com/blog/dehashed-api-pricing-navigating-the-costs-for-2025-and-beyond/1eb20365325837181c5b9759e165af78); [Webshare](https://www.webshare.io/pricing); [Decodo](https://decodo.com/proxies/residential-proxies/pricing); [Dark Reading](https://www.darkreading.com/threat-intelligence/millions-of-stolen-us-university-email-credentials-for-sale-on-the-dark-web)).
   - Lead-up time: 2–6 weeks of opportunistic low-rate attempts across many institutions.
   - Attacker trace: Residential-proxy IP in the tenant's Azure AD sign-in logs (geolocated to institution's metro); institutional email committed to provider records. Sign-in logs retained 30–180 days by default, up to 1–2 years under higher licensing tiers. Discoverable if the institution ever pulls logs for an unrelated audit.
   - Key caveat: Yield depends heavily on how many small-college tenants have forced password resets after breaches. The 5–20% survival rate for fresh credentials is a best guess.

2. **Targeted low-volume phishing (AitM kit)**
   - The attacker deploys a Tycoon 2FA or similar adversary-in-the-middle phishing kit against MFA-protected institutional webmail, using lookalike domains via crypto-accepting registrars.
   - Expertise: **Practitioner** — kit acquisition on Telegram, lookalike domain management, delivery tuning through Defender/Gmail filters.
   - Cost: ~$300–$800 per successful inbox (kit license $120–$300 + lookalike domains $50–$150 + proxies $50–$200/month) ([Infosecurity Magazine](https://www.infosecurity-magazine.com/news/sneaky-2fa-joins-tycoon-2fa/); [Barracuda](https://blog.barracuda.com/2025/01/22/threat-spotlight-tycoon-2fa-phishing-kit)).
   - Lead-up time: 1–3 weeks per campaign.
   - Attacker trace: Session-replay token creation in tenant sign-in logs; phishing domains attributable via WHOIS and hosting records (weak obfuscation under privacy proxy; registrar subject to law enforcement subpoena).
   - Key caveat: Truly dormant mailboxes have no one to click a phishing link, so this method is restricted to lightly watched adjunct accounts — a grad student checking once a month — rather than pure role mailboxes.

3. **Adjunct account password-reset via lapsed personal email**
   - The attacker finds a departed adjunct whose recovery email is a re-registrable personal address (Yahoo, AOL, ISP webmail — not Gmail, which never releases usernames), re-registers it, and triggers a password reset.
   - Expertise: **Practitioner** — requires chaining: enumerate departed faculty via archived department pages, identify old personal email from CVs/archives, verify re-registrability, handle KBA.
   - Cost: $20–$50 in OSINT tooling. Time cost dominates.
   - Lead-up time: 2–8 weeks per successful target; very narrow viable slice.
   - Attacker trace: Password-reset logs at the institution show the newly-registered personal address. Email provider records the registrant's real IP unless proxied. Higher per-target attribution risk than breach-dump.

4. **Helpdesk social engineering for password reset**
   - The attacker calls a student-staffed IT helpdesk at a small college with a plausible pretext ("locked out of my account, sabbatical").
   - Expertise: **Novice** — requires only a plausible pretext and basic phone confidence.
   - Cost: Near-zero ($5–$20 for a burner SIM or VoIP minute).
   - Lead-up time: Hours to days per attempt.
   - Attacker trace: Helpdesk ticket in the institution's ITSM system; possible call recording (variable at small colleges). Voice attribution is weak but not zero.

5. **Alumni-for-life forwarder**
   - The attacker either briefly enrolls as a non-degree student at a public university's continuing-ed program ($200–$2,000/semester) or acquires a lapsed alumni forwarder credential via breach dump ($10–$30).
   - Expertise: **Novice** (enrollment path) to **Practitioner** (breach-dump path, same as method 1).
   - Cost: $10–$2,000 depending on path ([Harvard Alumni](https://alumni.harvard.edu/help/email-forwarding); [Harvard Crimson](https://www.thecrimson.com/article/2023/5/5/haa-retains-alumni-emails/)).
   - Lead-up time: Hours (breach-dump) to 4–16 weeks (enrollment).
   - Attacker trace: Alumni forwarder record at the institution (persists indefinitely); for enrollment path, a real enrollment record.
   - Key caveat: **Load-bearing question** — whether providers accept `alumni.<u>.edu` domains as institutional affiliation is unresolved. If accepted, this path drops M2 cost to <$50 and the Path A-current total to ~$70–$150.

6. **Self-issued visiting/affiliate account via departmental sysadmin** (low confidence)
   - Social-engineer a departmental sysadmin into issuing a visiting-researcher account.
   - Expertise: **Novice.**
   - Cost: $0–$100.
   - Lead-up time: 1–6 weeks.
   - Attacker trace: Real name on the institution's directory.
   - Adjacent to Branch D (visiting-researcher piggyback).

---

### Measure 3: Organization registry + verified shipping address

**Binding?** Partially. Under current practice (single-contact provider, free-text institution field), barely binding. Under strong baseline (two-contact registry with approved shipping addresses), this is structurally the hardest Matrix A cell.

**False-negative rate.** Near-zero under current practice (free-text field). Under strong-baseline two-contact registry, 10–20% of legitimate small labs experience friction if the second contact is unavailable, on sabbatical, or has left. Best guess; no direct industry data.

**Bypass methods:**

1. **Single-contact provider (current practice)**
   - Provider-shop to a provider that does not require a second registered contact.
   - Expertise: **Aspirant** — no skill required.
   - Cost: $0.
   - Lead-up time: Zero.
   - Attacker trace: Only the primary persona on file.

2. **CMRA or virtual office in institution's metro**
   - File USPS PS Form 1583 at a Commercial Mail Receiving Agency in the target college's town ([Alliance Virtual Offices](https://www.alliancevirtualoffices.com/virtual-office-blog/cmra-compliance-explained-what-the-usps-actually-requires-from-virtual-office-users/)).
   - Expertise: **Novice** — routine filing; detecting providers that flag CMRAs requires light OSINT.
   - Cost: $20–$100/month ($19–$100 plan + $5–$25 notarization).
   - Lead-up time: 1–7 days.
   - Attacker trace: Form 1583 record held by CMRA and submitted to USPS CRD quarterly (retained indefinitely). Attacker's real ID scanned and held by the CMRA operator. Payment method on file.
   - Key caveat: SmartyStreets and similar address-validation APIs flag CMRA addresses from the USPS-published CMRA list. A provider with one line of address-hygiene code catches this.

3. **Mailroom interception at real institution address**
   - Ship to the institution's real address and physically pick up the package.
   - Expertise: **Novice** — requires physical presence on campus.
   - Cost: $0–$50 (travel, optional pretext for pickup).
   - Lead-up time: Minutes once package arrives.
   - Attacker trace: Physical presence on campus; likely captured by CCTV at small-college mailrooms. No CMRA paper trail.

4. **USPS PO Box / hold-for-pickup**
   - Expertise: **Novice.**
   - Cost: $5–$25/month.
   - Lead-up time: 1–2 days.
   - Attacker trace: Real ID shown at PO Box rental; USPS retains rental record.

5. **Two-inbox compromise + accomplice (strong baseline)**
   - Compromise a second inbox at the same college, recruit an accomplice willing to pass IDV and register as a second contact.
   - Expertise: **Practitioner** for attacker; **Novice** for accomplice (who just shows up for IDV).
   - Cost: ~$1,500–$11,000 (second-inbox compromise $300–$800 with correlated-anomaly penalty, plus accomplice danger premium $1,000–$10,000) ([Microsoft Learn](https://learn.microsoft.com/en-us/defender-cloud-apps/anomaly-detection-policy); [Hacker News — Coinbase case](https://thehackernews.com/2025/05/coinbase-agents-bribed-data-of-1-users.html)).
   - Lead-up time: 4–12 weeks (dominated by accomplice recruitment trust-building and slower second-compromise rate from correlated-anomaly throttling).
   - Attacker trace: Two real institutional addresses committed; two real IDs + biometrics on file at IDV vendor; correlated sign-in anomaly cluster at the same tenant. Accomplice is a live witness with direct knowledge.
   - Cross-measure dependency: This accomplice is potentially reusable for Measure 8 vouching, which determines whether Path B-strong requires one or two recruited individuals.

6. **Registry address-change workflow (strong baseline)**
   - Navigate a controlled change workflow to redirect approved shipping.
   - Expertise: **Practitioner.**
   - Cost: $0 direct; collapses into two-inbox + accomplice if second-approver review is required.
   - Lead-up time: Days to weeks.
   - Attacker trace: Address-change audit log entry at provider.

---

### Measure 4: Research & entity signals

**Binding?** Partially. The institutional footprint of a real small college satisfies institution-level signals (domain age, org registrations, life-sciences programs). Individual-level signals (publications, grants) are exploitable via name-collision and thin-profile techniques.

**False-negative rate.** At small colleges specifically, 40–70% of legitimate researchers (adjuncts, lab managers, undergraduates, 2-year-degree faculty) have no publications indexed in PubMed/Scholar under their current affiliation. A strict personal-publication gate would be unworkable, which is why the row is implemented loosely and why the branch exploits it cleanly. Best guess; no direct industry data.

**Bypass methods:**

1. **Lean on institutional footprint**
   - The small college itself is a real institution with a real life-sciences department. No action needed.
   - Expertise: **Aspirant.**
   - Cost: $0.
   - Lead-up time: Zero.
   - Attacker trace: Persona name + affiliation on file at provider.

2. **LLM-generated thin researcher profile**
   - Create stub ORCID (self-asserted affiliation, not validated against institutional systems per [ORCID documentation](https://info.orcid.org/documentation/integration-guide/orcid-record/)), stub personal page on GitHub Pages or Google Sites, stub LinkedIn.
   - Expertise: **Aspirant.**
   - Cost: $0–$30.
   - Lead-up time: 2–6 hours.
   - Attacker trace: Durable public profile artifacts.

3. **Publication name-collision exploitation**
   - Select a persona name that collides with a common-author name in PubMed, so apparent publication history exists without creating any new records.
   - Expertise: **Novice.**
   - Cost: $0.
   - Lead-up time: 1–2 hours.
   - Attacker trace: No extra trace beyond whatever publications the colliding name carries (not attributable to attacker).

4. **Reviewer institution-call loop**
   - List the compromised inbox as the institutional contact so that any verification email loops back to attacker control.
   - Expertise: **Novice.**
   - Cost: $0.
   - Lead-up time: Zero.
   - Attacker trace: Verification email chain recorded by provider.

5. **Pre-seeded preprint or methods note**
   - Post a methods note to bioRxiv, OSF, or Zenodo under the persona name.
   - Expertise: **Novice.**
   - Cost: $0.
   - Lead-up time: 1–4 weeks (bioRxiv screening typically 48 hours to 1 week).
   - Attacker trace: Durable public preprint citing persona + institution. Persists indefinitely.

---

### Measure 5: Payment integrity

**Binding?** No (with soft caveat). The attacker uses their own real credit card. Billing-address mismatch with the institutional address is the only potential flag; target selection within driving distance of the institution eliminates geographic inconsistency.

**False-negative rate.** Near-zero for institutional customers using established payment methods. Irrelevant to this branch.

**Bypass methods:**

1. **Own real card, target selected within driving distance**
   - Expertise: **Aspirant.**
   - Cost: $0 incremental.
   - Lead-up time: Zero.
   - Attacker trace: Real credit card, real billing address, real name on file at provider. Card issuer retains transaction records 7+ years under BSA. Strong financial attribution.

2. **Prepaid virtual card**
   - Expertise: **Novice.**
   - Cost: $5–$50 setup + 3–5% top-up fee.
   - Lead-up time: Minutes.
   - Attacker trace: Lighter KYC on prepaid products per FinCEN prepaid access rule ([FinCEN CIP](https://www.fincen.gov/resources/statutes-regulations/cip-rule)), but still subject to subpoena.

3. **Small-LLC business card**
   - Expertise: **Novice.**
   - Cost: $100–$300 (LLC filing + card setup).
   - Lead-up time: 1–3 weeks.
   - Attacker trace: LLC filing is public record.

---

## Matrix B (SOC orders — adds on top of Matrix A)

### Measure 6: Identity verification — IAL2

**Binding?** No. The attacker is a real person presenting their own real ID and face. IAL2 passes by construction.

**False-negative rate.** ~2–6% of legitimate customers fail on first attempt; ~1–2% after retry. Demographic disparities persist for older adults and some darker-skinned cohorts per NIST FRVT ([NIST FRVT — Demographic Effects](https://pages.nist.gov/frvt/html/frvt_demographics.html)). Banking IDV failure rate 1.9% overall, 5.5% at online-only retail banks ([Intellicheck via Biometric Update](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)). Well-sourced.

**Bypass methods.** None needed. The attacker authenticates as themselves.

- **What the attacker does:** Presents own face and own government photo ID in a standard vendor flow.
- Expertise: **Aspirant** (no bypass). The lower-trace morphing/injection variant noted in the analytical pass requires **Expert** skills and integrity-check gaps in the IDV vendor.
- Cost: $0 at moment of check.
- Lead-up time: Zero.
- Attacker trace: **The strongest single attribution artifact in the entire chain.** Selfie, government ID image, extracted document data, and liveness check evidence stored at IDV vendor (30-day to multi-year retention, configurable) and provider (5–7 years). If the order is ever investigated, the attacker's face is on file.
- Key observation: IAL2 does zero bypass work — the attacker passes it trivially — but maximum deterrence work. The biometric commitment is the primary long-tail risk the attacker accepts.

---

### Measure 7: MFA + re-authentication

**Binding?** No. The attacker enrolls their own authenticator on the provider account they created.

**False-negative rate.** Education sector MFA adoption at ~64% as of 2024–2025 ([ElectroIQ](https://electroiq.com/stats/multifactor-authentication-statistics/)). Near-zero false-negative rate for smartphone users; 1–3% otherwise.

**Bypass methods.** None needed.

- Expertise: **Aspirant.**
- Cost: $0.
- Lead-up time: Minutes (enrollment).
- Attacker trace: MFA enrollment timestamp + device fingerprint on file. Authentication event logs (IP via residential proxy, timestamp, user-agent) per session. Because the attacker uses a residential proxy in the institution's metro, the IP pattern is consistent but not the attacker's true source.

---

### Measure 8: Vouching by registered contact

**Binding?** Yes under strong baseline; non-binding under current practice. This is the structural single point of failure under strong baseline.

**False-negative rate.** Under strong vouching baseline, an estimated 10–20% of legitimate SOC orders would experience friction or delay due to voucher unavailability (travel, sabbatical, between-institution transition). Best guess. This creates pressure on providers to offer exception pathways that the bypass set exploits.

**Bypass methods:**

1. **Provider-hop to single-field attestation (current practice)**
   - Shop for a provider that accepts self-attestation or single-field approval.
   - Expertise: **Aspirant.**
   - Cost: $0.
   - Lead-up time: Zero.
   - Attacker trace: Self-attestation on file signed by primary persona only.

2. **Accomplice reuse from Measure 3 (strong baseline)**
   - The accomplice recruited for the two-contact registry at Measure 3 returns to vouch through the provider portal with fresh MFA.
   - Expertise: **Practitioner** (attacker) + **Aspirant** (accomplice).
   - Cost: $0 marginal if accomplice is reused from Measure 3 — the danger premium was already paid there.
   - Lead-up time: Subsumed in Measure 3 timeline.
   - Attacker trace: Accomplice's real biometric + ID + MFA authentication event on file at provider. Accomplice is a live witness.
   - Key caveat: The "$0 marginal" assumption depends on the M3 accomplice returning for a second biometric-coupled authentication event at vouching time. Documented failure modes: no-show, lost MFA device, cold feet after seeing the actual SOC order, independent face flag at the provider, defection/reporting. These friction points may push the attacker toward the paid-staffer path even when an M3 accomplice exists.
   - Cross-measure dependency: Cost and feasibility depend entirely on Measure 3 accomplice recruitment.

3. **Paid real-staffer recruitment (strong baseline)**
   - Recruit a small-college adjunct to click approval on a "colleague's order," pitched as a casual favor below the threshold that triggers danger-premium dynamics.
   - Expertise: **Practitioner** (social engineering of a staffer).
   - Cost: $250–$1,300 ($50–$500 per approval + $200–$800 search/vetting across 5–15 cold approaches).
   - Lead-up time: 2–6 weeks.
   - Attacker trace: Real staffer's identity on file at provider as voucher. Staffer is a live witness with partial knowledge.
   - Key caveat: Staffer may become curious and escalate. Rubber-stamp approval rate estimated at 70–90% absent explicit SOC-flag prompts in the vouching UI (best guess, calibrated against code-review rubber-stamp baseline of ~38% at [MergeScout](https://mergescout.com/blog/how-to-measure-code-review-quality/)).

4. **Cross-institution vouching ring (strong baseline)**
   - Two independent Branch B operations at different institutions, each vouching for the other.
   - Expertise: **Practitioner** per participant.
   - Cost: ~$300–$1,000 for the second parallel Measure 2 chain; no additional accomplice fee because each party vouches for the other.
   - Lead-up time: 4–8 weeks (parallel with first operation).
   - Attacker trace: Two compromised inboxes at two institutions. Both personas' real IDs + biometrics on file. Each serves as witness to the other's order. Durable discoverable pattern if providers run voucher-network analytics.

5. **Same-institution social engineering of real faculty** (dominated by paid-staffer option)
   - Expertise: **Novice.**
   - Cost: $0.
   - Lead-up time: Days.

6. **Non-portal email vouching** (low confidence, implementation-dependent)
   - Expertise: **Novice.**
   - Cost: $0.
   - Lead-up time: Zero.

---

### Measure 9: Biosafety documentation

**Binding?** Yes under any non-trivial implementation. Biosafety documentation is the second-most structurally important Matrix B measure after vouching.

**False-negative rate.** If applied as a hard gate, an estimated 20–40% of legitimate annual orders from customers outside NIH-funded US academic institutions (industry researchers, community labs, international researchers, small colleges without their own IBC) would be unable to provide institutional IBC documentation. Best guess. This high FNR creates pressure on providers to accept weaker forms (self-attestation, PI assertion, shared-IBC referral), which makes the measure easier to bypass.

**Bypass methods:**

1. **Shared/consortium IBC documentation**
   - Identify a real partner-institution consortium IBC and reference its publicly posted documentation. Small institutions without their own IBC commonly rely on shared/consortium arrangements, and third-party verification is limited as of 2025 ([NIH OSP — FAQs on IBC Administration](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/)).
   - Expertise: **Novice.**
   - Cost: $0.
   - Lead-up time: 2–8 hours.
   - Attacker trace: References a real partner institution's real, publicly posted IBC documentation. Does not create a new forgery artifact — the referenced document is genuine, which passes casual review.
   - **Probably the cheapest Measure 9 bypass under any baseline above self-declaration.**

2. **Fabricated IBC approval letter on small-college letterhead**
   - Use LLM + public IBC template + letterhead from the college's website.
   - Expertise: **Novice.**
   - Cost: $0–$20 (LLM API credits, PDF tooling).
   - Lead-up time: 2–8 hours.
   - Attacker trace: Forged document on file. Increasingly discoverable after June 2025 NIH transparency requirements.
   - Key caveat: As of June 2025, NIH OSP publicly posts rosters of all active IBCs ([NIH OSP](https://osp.od.nih.gov/nih-strengthens-transparency-measures-for-institutional-biosafety-committees/); [UCLA](https://rsawa.research.ucla.edu/news/nih-transparency-requirements-ibc-2025-06-01/)), so a provider performing any IBC cross-check can verify whether the claimed biosafety officer's name matches. This substantially raises the bar for fabricated letters naming the college's own officer.

3. **Name a real biosafety officer at a peer small college**
   - Use the post-June-2025 public IBC-officer rosters to pick a real officer whose name survives a Google check but is at a different institution.
   - Expertise: **Novice.**
   - Cost: $0.
   - Lead-up time: Hours.
   - Attacker trace: Real officer's name (at a different institution) in provider records. Cross-referencing the officer's real institution against the claimed one catches the forgery quickly if investigated.

4. **VoIP verification-call number on letter**
   - Place an attacker-controlled VoIP number as the contact on a fabricated letter.
   - Expertise: **Novice.**
   - Cost: $1–$20.
   - Lead-up time: Minutes.
   - Attacker trace: VoIP number on file; vendors retain call logs and registration metadata subject to subpoena.

5. **Claim exemption / no IBC required**
   - Expertise: **Aspirant.**
   - Cost: $0.
   - Lead-up time: Zero.

6. **Provider-shop to one that does not require biosafety documentation**
   - Expertise: **Aspirant.**
   - Cost: $0.
   - Lead-up time: Zero.
