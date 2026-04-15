# Measure 02 — email-affiliation-whois

Screening: Check email address for match with the customer's institutional affiliation. Domain WHOIS lookup; confirm domain matches known institutional domains; confirm address is institutional. Flag triggers: email does not match institution domain; non-institutional domain (e.g., gmail).

Stories ordered most-directly-engaging first. The branches at the top force the WHOIS / domain-age / domain-ownership dimension; the middle group must control a real institutional inbox to satisfy the affiliation check; the lower group passes on the merits with a self-owned commercial domain.

---

## dormant-domain

- **Branch slug:** `dormant-domain`
- **Profile:** fake-affiliation
- **Target description:** "A patient lone operator acquires (or reclaims via dangling-DNS takeover) the canonical domain of a defunct research entity whose publication trail is still live in PubMed, Google Scholar, and NIH RePORTER. The attacker reanimates the domain, stands up a 'we're back' website and mail server, and presents as a 'successor researcher' at a small revived lab — using their own real government ID throughout."
- **Bypass excerpts (verbatim):**

  **Bypass A — Acquire the lapsed canonical domain (primary):**
  - **What the attacker does:** Continuously scrapes citation databases for affiliations whose canonical domains have lapsed, cross-references against TLD drop lists, and buys the domain at drop auction or aftermarket when a high-value match appears. Then stands up a mail server (SPF/DKIM/DMARC configured, 4–6 weeks of domain warming per [Mailforge](https://www.mailforge.ai/blog/domain-warming-best-practices)) and a basic "lab" website mirroring the defunct entity's archive.org snapshot.
  - **Expertise:** Practitioner — corpus mining across PubMed/RePORTER, DNS resolution, and drop-catch auction management require demonstrable competence but are well within the skill envelope of a competent independent researcher.
  - **Cost:** $500–$10,000 for the domain (low end for obscure regional consortia, high end where SEO-operator competition bids up desirable names) + $100–$500 for VPS hosting and mail stack.
  - **Lead-up time:** 3–9 months end-to-end (months of corpus mining and drop-queue waiting; days for acquisition; 4–8 weeks for mail warming).
  - **Attacker trace:** Domain registrant record at the registrar (real name, or privacy-proxy with underlying identity retained for ICANN compliance and subpoena). Hosting-provider billing. Mail server logs. `persona@domain` on file at the synthesis provider alongside IAL1 PII.
  - **Key caveat:** A WHOIS-history check flagging recent registrant changes on old domains would surface this bypass. Whether providers deploy such checks is the marginal flag for this branch.

  **Bypass B — Dangling-DNS subdomain takeover on live parent institution:**
  - **What the attacker does:** Scans .edu subdomains for dangling CNAME records pointing to deprovisioned cloud resources (S3 buckets, Azure endpoints, Heroku apps). When found, claims the resource and takes control of mail for that subdomain. The parent university's WHOIS and domain-age signals remain intact. Squarcina et al. (2021) found exploitable subdomain-takeover vulnerabilities in 887 of the Tranco top-50k domains, including harvard.edu and nih.gov.
  - **Expertise:** Practitioner (bordering Expert).
  - **Cost:** B1 (own cloud account) $0–$50 + $10–$100/mo VPS; B2 (stolen cloud creds) $50–$500 + $10–$100/mo VPS.
  - **Lead-up time:** 3–9 months of continuous scanning; hours to days once a usable resource is found.

  **Bypass C — Typosquat / lookalike fallback:** Registers a near-collision domain at a retail registrar (e.g., `lab-genomics.org` vs. `labgenomics.org`). Novice. $10–$50/year.

- **Why relevant:** The branch's load-bearing measure. Every variant turns directly on whether the provider runs a WHOIS-history / domain-age / dangling-DNS check; the attacker's whole edge is acquiring control of a domain that *passes* a naive WHOIS-and-allowlist lookup.
- **Persistent supply chain?** Y

---

## cro-identity-rotation

- **Branch slug:** `cro-identity-rotation`
- **Profile:** purpose-built-organization
- **Target description:** "A single individual or small pair files 2–4 small contract-research-organization LLCs in different US biotech metros, runs each as a clean small business (real LLC, real bank account, real virtual office, custom email domain), and uses each entity to place orders at a different subset of synthesis providers."
- **Bypass excerpts (verbatim):**

  **Binding assessment.** "No in the email-plus-context baseline. The attacker's custom-domain Google Workspace email is the affiliation evidence; inbox verification passes because the attacker controls the inbox. Becomes binding only if a provider gates on domain age, WHOIS history, or federated academic login (eduGAIN/InCommon)."

  **Method: Fresh domain + DNS/mail-stack maturity signaling.**
  - **What the attacker does:** Registers a `.com` matching the LLC name, sets up Google Workspace, configures SPF/DKIM/DMARC and MX records so the domain looks operationally mature.
  - **Expertise:** Novice. **Cost:** ~$15/year for the domain plus ~$72/year for Google Workspace Business Starter per entity. **Lead-up time:** Same day.
  - **Cross-measure dependency:** Useful only if a provider weights domain age in the affiliation or research-signal review.

  **Method: Aged-domain purchase.**
  - **What the attacker does:** Buys an expired or aged domain matching the LLC name from an aftermarket platform.
  - **Cost:** Wide range; representative names in plausible CRO niches typically cost in the low hundreds to low thousands of dollars per name.
  - **Attacker trace:** WHOIS history is publicly archived (DomainTools, SecurityTrails); transfer creates a dated change record even under WHOIS privacy.
  - **Caveat:** Wayback Machine prior content can betray a domain whose previous purpose was incongruent with a CRO. Clean-content names in plausible niches are scarcer than the headline numbers suggest.

  **Method: Federated login claim avoidance.** Targets only providers that accept commercial customers (most), avoiding any that gate on academic federated login.

- **Why relevant:** Explicitly names domain-age, WHOIS history, and aged-domain marketplaces as the precise dimensions a richer M02 implementation would have to defeat. The branch is a designed-in counterstrategy to exactly this measure.
- **Persistent supply chain?** Y

---

## cro-framing

- **Branch slug:** `cro-framing`
- **Profile:** purpose-built-organization
- **Target description:** "A single individual (or small group) registers a real US LLC under their own real legal name and frames it as a small contract research organization (CRO). They use a virtual office in a biotech metro, a self-built one-page services website, a real bank account, and pass identity verification with their real ID."
- **Bypass excerpts (verbatim):**

  **Measure 2 — Institutional affiliation check.**
  - **Binding?** Yes, but trivially passed: by construction the attacker is the only employee of their own LLC, using a self-owned domain.
  - **Self-owned domain workspace** (Google Workspace + LLC-matching domain).
    - Expertise: **Aspirant** — standard small-business setup, no tradecraft.
    - Cost: ~$10–$22/yr for a .com + Google Workspace Business Starter ~€6.80/user/month with annual commit.
    - Lead-up time: 1–2 hours including DNS propagation (best guess).
    - Trace: Domain WHOIS (privacy proxy gives only weak protection — registrar still holds payment records); Google Workspace billing under real card.

- **Why relevant:** The branch's M02 satisfaction *is* a self-owned `.com` registered minutes before account creation under WHOIS privacy. Any non-allowlist-style M02 (domain-age, business-vs-academic classification, or gated cross-check against a real institution registry) is the only thing that would catch it.
- **Persistent supply chain?** Y

---

## shell-nonprofit

- **Branch slug:** `shell-nonprofit`
- **Profile:** purpose-built-organization
- **Target description:** Branch E. A shell research nonprofit deliberately named to collide with the name of a legitimate small institute, set up with real entity registration, real domain, and a 4–12 week pre-aging window. Conditional on a name-collision conflation succeeding at Measure 4.
- **Bypass excerpts (verbatim):**

  **Binding assessment:** "Partially binding via structural mismatch. The shell's own domain is real and inbox-verifiable, so the email check passes. But a provider that cross-references the domain against a known-institution list or requires federated authentication (eduGAIN/InCommon) would flag the shell as unrecognized."

  **Stand up the shell's own domain and mailbox**
  - **What the attacker does:** Registers a domain matching the shell entity name, sets up Google Workspace or Microsoft 365, configures SPF/DKIM/DMARC. The domain email is real and functional. The provider sees a small-entity applicant with a professional-looking domain that matches their entity registration.
  - **Expertise:** Novice — domain registration and hosted-email setup are template-driven.
  - **Cost:** $100–$250/year for domain + Workspace/365.
  - **Lead-up time:** Hours for setup, but **4–12 weeks of pre-aging the domain before it looks plausibly established.**
  - **Attacker trace:** Domain WHOIS (attacker name or privacy proxy; proxy recoverable via subpoena), Google/Microsoft billing tied to attacker's payment method.
  - **Key uncertainty:** Whether the provider deploys a domain-vs-known-institution cross-check or federated authentication gating. If so, the shell fails M2 outright.

  **ROR self-listing (persistence variant only)**
  - **What the attacker does:** Submits a curation request to the Research Organization Registry after seeding several preprints naming the shell as an affiliation. If approved, the shell appears in the ROR directory that some providers may reference.
  - **Cost:** $0. **Lead-up time:** 4–6 weeks after preprints exist.
  - **Key caveat:** ROR inclusion requires acknowledgment by multiple people in research-output affiliations; single-person organizations are explicitly out of scope.

- **Why relevant:** Names the exact M02 deepenings (domain-vs-known-institution cross-check, federated authentication, ROR cross-reference) that would catch it, and the exact pre-aging window the attacker uses to defeat domain-age signals.
- **Persistent supply chain?** Y

---

## biotech-incubator-tenant

- **Branch slug:** `biotech-incubator-tenant`
- **Profile:** purpose-built-organization
- **Target description:** "An individual or small group … form an LLC, lease bench space at a biotech incubator (BioLabs, LabCentral, Genspace, or a university-affiliated equivalent), and use their own real legal identity throughout — or, in the lower-trace variant, recruit a willing accomplice to be the LLC's named principal."
- **Bypass excerpts (verbatim):**

  **2a — Self-controlled domain + Google Workspace email + LLC name.** Register a biotech-themed domain, set up Google Workspace, list the LLC as the institution at the synthesis provider with billing and shipping aligned to the incubator address.
  - Expertise: Aspirant — commodity small-business setup steps.
  - Cost: Roughly $150–$300 one-time (Delaware LLC filing around $110 plus an annual $300 franchise tax, free EIN from the IRS, $10–$15/year for a `.com` domain) plus ~$6–$7.20 per Google Workspace user per month.
  - Lead-up time: Hours to a few days.
  - Attacker trace: Domain WHOIS records (privacy-shielded but subpoenable), Google Workspace billing tied to the principal's payment instrument.

  **2b — Domain age padding (optional).** Register the domain 6–12 months before applying to providers, or buy an aged parked domain on auction.
  - Cost: Free if pre-registered; tens to thousands of dollars for an aged auctioned `.com` domain.
  - Lead-up time: 6–12 months for organic aging; same-day for an auctioned purchase.
  - Attacker trace: Auction-purchase records tie an aged domain to the buyer's payment method.

- **Why relevant:** Explicitly buys/ages a domain to defeat any M02 implementation that weights domain age. Combined with the incubator address, the attacker is constructing a maximally affirmative answer to "is this email institutional?"
- **Persistent supply chain?** Y

---

## gradual-legitimacy-accumulation

- **Branch slug:** `gradual-legitimacy-accumulation`
- **Profile:** purpose-built-organization
- **Target description:** "A patient individual or small group spends 6–12 months operating a real-but-hollow small biotech or CRO before attempting controlled-sequence orders. Time, not money, is the load-bearing resource."
- **Bypass excerpts (verbatim):**

  **Measure 2 — Institutional affiliation check.**
  - **Binding?** No. The attacker is the LLC's principal by construction. The work email (`principal@example-biotech.com`) sits on a domain they own. Affiliation check (domain recognition, inbox verification, consistency with the org record) trivially passes because everything is mutually consistent and all controlled by the attacker.
  - **Bypass methods:** None needed. Setup cost is a domain (~$15/year) plus Google Workspace (~$6–$8/user/month).
  - **Attacker trace:** Domain WHOIS record (weak privacy via WHOIS proxy), Google Workspace billing record on attacker's or LLC's card, inbox-verification log at the provider.

  **From Measure 4 — Method 1 — Time-aged domain and clean order history.** Register the domain at month 0 and place 5–20 small non-controlled orders … over 12 months. By month 12 the provider's risk system shows a year of customer tenure.
  **Method 2 — Aged domain auction purchase (compression variant).** Buy a 5+ year expired domain whose name fits the LLC via GoDaddy Auctions or NameJet. Price range $50–$5,000 with most biotech-adjacent expired domains in the $100–$1,000 range.

- **Why relevant:** Explicitly times-the-domain to game any M02 deepening that weights age, and explicitly considers aged-domain auctions as the compression path. The whole branch's value comes from making the M02 signal *look* mature.
- **Persistent supply chain?** Y

---

## community-bio-lab-network

- **Branch slug:** `community-bio-lab-network`
- **Profile:** purpose-built-organization
- **Target description:** "A single individual or small group registers two or three 'community biology labs' in underserved metros — Denver, Tucson, Kansas City — as real LLCs or nonprofits with real domains, real maker space addresses, real bank accounts, and real public listings on community-bio directories."
- **Bypass excerpts (verbatim):**

  **Bypass method — Self-owned community lab domain.** Register a `.org` domain (~$15/year) and provision Google Workspace ($7/user/month with one-year commitment). Use `firstname@labdomain.org` as the work email at provider signup.
  - **Expertise: Aspirant** (commodity small-business workflow, no security expertise required).
  - **Cost: ~$100/year** for a single user. **Lead-up time:** hours to a day.
  - **Trace:** WHOIS records the registrant (privacy proxy hides the public record but the registrar still holds it for legal request); Google Workspace billing records the attacker's payment instrument and admin contact.

- **Why relevant:** Self-owned `.org` registered hours before signup. Any M02 implementation that distinguishes academic/recognized institutional domains from custom commercial/.org domains catches it; pure WHOIS lookup does not.
- **Persistent supply chain?** Y

---

## inbox-compromise

- **Branch slug:** `inbox-compromise`
- **Profile:** fake-affiliation
- **Target description:** "A lone operator with practitioner-level cybercrime skills compromises a dormant or lightly monitored email account at a small US college (role mailbox, retired adjunct, alumni-for-life forwarder) and presents themselves to a synthesis provider as a new researcher using that institutional address."
- **Bypass excerpts (verbatim):**

  **Binding?** Yes. This is the entire point of the branch — the attacker must obtain control of a real institutional email address to satisfy the affiliation check.

  **1. Breach-dump credential reuse.** "The attacker queries commercial breach databases (DeHashed, similar services) for .edu credentials at small colleges, filters for dormant or role accounts, and attempts login through a residential proxy geolocated to the institution's metro. Roughly 5–20 usable credentials per 1,000 addresses queried." Expertise: Practitioner. Cost: ~$200–$700 per successful inbox. Lead-up time: 2–6 weeks.

  **2. Targeted low-volume phishing (AitM kit).** "The attacker deploys a Tycoon 2FA or similar adversary-in-the-middle phishing kit against MFA-protected institutional webmail, using lookalike domains via crypto-accepting registrars." Practitioner. ~$300–$800 per successful inbox.

  **3. Adjunct account password-reset via lapsed personal email.** "The attacker finds a departed adjunct whose recovery email is a re-registrable personal address (Yahoo, AOL, ISP webmail — not Gmail, which never releases usernames), re-registers it, and triggers a password reset." Practitioner. $20–$50.

  **4. Helpdesk social engineering for password reset.** "The attacker calls a student-staffed IT helpdesk at a small college with a plausible pretext ('locked out of my account, sabbatical')." Novice. ~$5–$20.

  **5. Alumni-for-life forwarder.** "The attacker either briefly enrolls as a non-degree student at a public university's continuing-ed program ($200–$2,000/semester) or acquires a lapsed alumni forwarder credential via breach dump ($10–$30)." Key caveat: load-bearing question whether providers accept `alumni.<u>.edu` domains as institutional affiliation.

  **6. Self-issued visiting/affiliate account via departmental sysadmin.** Novice. $0–$100.

- **Why relevant:** Six concrete methods of *defeating* M02 by acquiring control of a real institutional email address whose WHOIS and allowlist signals are perfectly genuine. Stresses the implicit assumption that "domain matches a known institution" is sufficient evidence of *who* is sending mail from that domain.
- **Persistent supply chain?** N (one-off variant) / Y (persistent variant explicitly modeled)

---

## credential-compromise

- **Branch slug:** `credential-compromise`
- **Profile:** fake-affiliation
- **Target description:** A moderately skilled attacker compromises a real PI's institutional email account using infostealer logs, breach dumps, or AitM phishing, and uses the genuine `.edu` mailbox to onboard at a synthesis provider as the PI.
- **Bypass excerpts (verbatim):**

  **Binding?** No. The genuine compromised `.edu` email passes the affiliation check authentically.

  **Bypass method — Compromised `.edu` email.** "The attacker logs into the target's institutional mailbox using credentials from a breach or infostealer log, or a session token captured via AitM phishing, and replies to any affiliation-verification email as the real user would."
  - Expertise: Amateurish to Intermediate. Marketplace purchase plus login is trivial; setting up a mail-forwarding rule for persistence is basic O365/Google Workspace admin.
  - Cost: $0 incremental. Credential-acquisition cost is already counted under measure 1.
  - Lead-up time: Minutes once email access is established.
  - Attacker trace: Login IPs and user agents in institutional sign-in logs, mail-forwarding-rule artifacts visible to IT admins, and sent-mail records of any interaction with the provider.

- **Why relevant:** WHOIS-and-allowlist M02 implementation passes the email by design; only an out-of-band signal (sign-in IP anomaly, federated MFA) catches the takeover. The branch demonstrates that a clean email-affiliation signal can be entirely uncoupled from the actual sender's identity.
- **Persistent supply chain?** N

---

## account-hijack

- **Branch slug:** `account-hijack`
- **Profile:** exploit-affiliation (existing-account hijack variant)
- **Target description:** "A moderately skilled attacker compromises a principal investigator's institutional email, then takes over the PI's pre-existing, fully verified synthesis provider account."
- **Bypass excerpts (verbatim):**

  **2. Institutional Affiliation Check.**
  - **Binding?** No. The PI has a real .edu address at a real institution; the affiliation check passes authentically.
  - **False-negative rate.** Very low (<1%) for university-affiliated researchers under a domain + institution-name baseline check.
  - **Bypass methods.** None required. Inherited. Expertise: none. Cost: $0. Lead-up time: none. Trace: none.

- **Why relevant:** Inherits a fully-cleared `@university.edu` mailbox at account-takeover time. M02 signal is structurally satisfied by the victim PI's onboarding artifact and the attacker has nothing to bypass; only at-order-time reauthentication or institutional-side anomaly detection would catch the takeover.
- **Persistent supply chain?** N

---

## dormant-account-takeover

- **Branch slug:** `dormant-account-takeover`
- **Profile:** exploit-affiliation
- **Target description:** "An IT administrator at a target institution uses legitimate mailbox-control and IAM tooling to take over a dormant synthesis-provider account belonging to a departed researcher. The attacker inherits a fully approved persona — passed IAL1 (possibly IAL2), verified affiliation, registered shipping, real publication trail, real biosafety coverage, registered voucher — rather than building one."
- **Bypass excerpts (verbatim):**

  **Binding?** Partially — satisfied by inheritance but active institutional-layer work is required. The provider's baseline (domain allowlist + inbox verification + consistency checks) was already satisfied at account opening. But the provider continues using the registered institutional email for correspondence, so the attacker must control that channel throughout operation.

  **Bypass A — Redirect the original holder's institutional mailbox (primary):** "Adds a silent forwarding rule, transfers the mailbox, or sets a mail-flow BCC on the departed researcher's institutional email address using standard admin tools (Exchange, Google Workspace, M365 mail-flow rules). The provider sees an institutional domain responding normally." Practitioner. $0. Minutes for the IAM action; 1–4 weeks upstream for dormant-account enumeration.

  **Bypass B — Re-activate a fully deprovisioned account:** "Restores a disabled Active Directory / Entra ID / Google Workspace account, resets its password locally, and brings the mailbox back online." Practitioner.

  **Bypass C — Provision new institutional mailbox for fabricated persona:** "Creates a new mailbox under the dormant lab's subdomain (e.g., `successor@labname.university.edu`) as a fabricated institutional identity." Practitioner. $0.

  **Bypass D — Route provider-portal traffic through institutional network egress:** "Logs into the provider via institutional VPN or on-campus jump box so that commodity fraud-scoring tools (Sift, Sardine, Arkose) see expected institutional IP ranges rather than a suspicious new IP." Novice.

  **Bypass E — Federated login via IdP impersonation (uncertainty branch):** Under federated authentication (eduGAIN/InCommon), uses IdP admin tools to impersonate the original holder via SAML assertion. Expert.

- **Why relevant:** Five concrete methods that all defeat M02 by controlling the genuine institutional mail channel itself (not by faking a domain). Bypass C in particular *creates* a new perfectly-affiliated mailbox under a real .edu subdomain — trivially passes any allowlist or WHOIS check.
- **Persistent supply chain?** Y

---

## foreign-institution

- **Branch slug:** `foreign-institution`
- **Profile:** fake-affiliation / exploit-affiliation hybrid
- **Target description:** "A lone operator exploits verification coverage gaps at mid-tier non-Anglophone research institutions … The attacker uses their own real ID throughout and gains access to a real institutional email — via stale-subdomain compromise, a visiting-researcher request, or alumni residue."
- **Bypass excerpts (verbatim):**

  **Binding?** Yes. This is the branch's entry point and primary strategic fork. The attacker must obtain a real institutional email at the target non-Anglophone institution.

  **Method 1: Stale subdomain inbox compromise (local-language variant).** "The attacker queries credential breach dumps for .edu/.ac.jp/etc. addresses at the target institution, then runs low-volume local-language phishing against stale departmental or shared mailboxes. Forwarding rules are set to silently copy provider-related mail." Practitioner. $250–$1,500. 2–8 weeks.

  **Method 2: Visiting-researcher account via local-language sysadmin request.** "The attacker writes a credible local-language collaboration pitch to a department sysadmin requesting a visiting-researcher email account." Novice. $100–$500. 2–6 weeks. Trace: attacker's real name in the institution's ticketing system.

  **Method 3: Alumni / legacy / former-affiliation residue.** Uses own legitimate (albeit stale) credentials at an institution where they once studied or worked. Aspirant. ~$0.

  **Method 4: AitM / session-token phishing against active researcher.** "Live session hijack against an active user with real-time cookie relay, sustaining past MFA prompts." Practitioner/Expert. $500–$1,500.

  **Method 5: Co-opt existing inter-institutional collaboration.** Pure social-engineering narrative — identify and frame a real partnership. Novice. <$200.

  **Method 6: Semi-legitimate short visiting appointment.** Lighter-touch and faster at non-Anglophone institutions where sponsor vetting is lighter. Novice. $200–$1,000.

- **Why relevant:** Six bypasses that all converge on possessing a real `.ac.jp` / `.edu.br` / `.ac.in` mailbox. M02 as currently scoped (domain-vs-known-institution allowlist + WHOIS) is structurally weakest precisely on non-Anglophone domains, and the branch is built on that weakness.
- **Persistent supply chain?** N (per-target) / Y (persistent if attacker rotates institutions)

---

## it-persona-manufacturing

- **Branch slug:** `it-persona-manufacturing`
- **Profile:** exploit-affiliation
- **Target description:** "An IT administrator at a research university or institute uses legitimate admin rights over mail routing, directory entries, and identity management to manufacture a role-plausible persona (lab manager, research tech, visiting scholar) on the real institutional domain, attached to a real host lab."
- **Bypass excerpts (verbatim):**

  **Binding?** Partially binding — satisfied natively by the branch's capability. The attacker is the person institutions rely on to produce the very signals the affiliation check looks for.

  **Sub-path A — Loose-governance direct injection:** "Creates a mail alias, directory entry, and DL membership for the manufactured persona using the standard admin console. The resulting email address and directory record pass any affiliation check that queries the institution's public directory or accepts mail delivery." Practitioner. $0. Minutes.

  **Sub-path B — Visiting-scholar / affiliate-program pathway:** "Initiates a visiting-scholar appointment for the manufactured persona through the institution's own administrative process, with a real PI as sponsor. The resulting identity has an HR-matched record." Practitioner. $0. 2–8 weeks.

  **Sub-path C — Reuse of departed real member's directory entry:** "Identifies a departed lab member whose directory entry was not purged, reactivates the entry, and maps it to the manufactured persona's alias." Practitioner. $0.

  **Sub-path D — HR-system injection:** "Injects a record directly into the HR system (Workday, Banner, PeopleSoft), giving the manufactured persona a fully HR-matched identity." Expert. $0.

- **Why relevant:** Manufactures a fully-resolving institutional mailbox + directory entry on a real .edu, with admin-tool authority. Any M02 implementation that resolves the email and confirms it as institutional will return a clean result; the bypass is the attacker's direct authority over the very system the measure queries.
- **Persistent supply chain?** Y

---

## visiting-researcher

- **Branch slug:** `visiting-researcher`
- **Profile:** fake-affiliation
- **Target description:** "A lone operator with social-engineering basics obtains a real visiting-scholar or courtesy appointment at a US/European R1 university through the institution's own lightweight vetting process, then uses the resulting genuine `.edu` credentials to place SOC orders."
- **Bypass excerpts (verbatim):**

  **Binding?** No. The attacker holds a real `.edu` email on the host university's genuine canonical domain. Inbox verification passes natively.
  **Bypass methods.** None needed.
  **Attacker trace:** Real `<name>@<university>.edu` on file. Institutional mail-server logs record provider correspondence. Inbox verification click logged by the provider.

  **Upstream sub-chain (cross-cutting).** "Total out-of-pocket: $0–$3,000. Total lead time: 2–4 months from first cold pitch to `.edu` email in hand."

- **Why relevant:** Demonstrates that even the strongest possible M02 signal — a real R1 .edu mailbox issued by central IT after the institution's own vetting — can be acquired by a non-affiliate via lightweight social engineering at the visiting-scholar program. M02 has no leverage on this branch by design.
- **Persistent supply chain?** N

---

## shell-company

- **Branch slug:** `shell-company`
- **Profile:** purpose-built-organization
- **Target description:** "Branch D: Shell Company with Real Employees. The shell company is genuinely registered in Delaware with a real business address and bank account, and the company's own domain email satisfies institutional affiliation."
- **Bypass excerpts (verbatim):**

  **Measures 1, 3, 5 (IAL1, Institutional affiliation, Org registry + verified shipping address).**
  - **Binding assessment:** Not binding for this branch. The attacker and any associates use their own real government IDs (IAL1 passes authentically), the shell company is genuinely registered in Delaware with a real business address and bank account (org registry and verified shipping pass), and the company's own domain email satisfies institutional affiliation. The branch's entire premise is to walk these checks through as a genuine entity with real people, committing real identities rather than forging them.
  - **Bypass methods:** None needed. These measures are satisfied by construction.

  **From Bypass method 1 (build entity signals from scratch):** "aged domain $100-2,000 if the attacker wants to compress the domain-age waiting period."

- **Why relevant:** Self-owned `@shellco.com` Google Workspace email passes M02 by construction. The branch's existence demonstrates that the WHOIS-lookup leg of M02 is structurally weak against any clean Delaware LLC with a corresponding domain — and the optional aged-domain purchase is the explicit lever for any M02 deepening that adds domain-age weighting.
- **Persistent supply chain?** Y

---

## unrelated-dept-student

- **Branch slug:** `unrelated-dept-student`
- **Profile:** exploit-affiliation
- **Target description:** "A currently enrolled graduate student or postdoc in a department that does not normally order sequences of concern. The attacker has a real `.edu` email, real government ID, real institutional affiliation, and legitimate campus access."
- **Bypass excerpts (verbatim):**

  **Bypass A — Canonical `@university.edu` (primary):** "Uses their own institutional email, which was issued by central IT upon enrollment. No action required." Aspirant. $0.

  **Bypass B — Host-lab or research-group alias:** "Obtains a lab-specific email alias (e.g., `jsmith@genomicslab.university.edu`) during a legitimate rotation." Aspirant. $0.

  **Bypass C — Federated academic login (InCommon/eduGAIN):** "Authenticates via institutional SSO. The federated assertion includes affiliation and possibly department attributes." Aspirant. $0. Cross-measure dependency: "If a provider gates SOC eligibility on department-level attributes from the federated assertion, this flips to binding."

  **Bypass D — Transliteration / name-disambiguation collision:** Property of bibliographic name-matching systems that applies natively to authors with non-Latin-script names. Aspirant. $0.

- **Why relevant:** Attacker is a real .edu mailbox holder by enrollment. M02 cannot meaningfully constrain this attacker because the email *is* institutionally issued. Only a department-level federated assertion (Bypass C cross-dependency) gives M02 any leverage.
- **Persistent supply chain?** Y (years-long enrollment)

---

## insider-recruitment

- **Branch slug:** `insider-recruitment`
- **Profile:** impersonate-employee (insider variant)
- **Target description:** "An external handler pays a legitimate insider at a research institution (grad student or junior tech in the one-off variant; postdoc, lab tech, or facilities manager in the persistent variant) $1,000–$5,000 per order to place SOC orders on the handler's behalf. The insider uses their own real identity, real institutional email, real payment method, and real shipping address — every KYC signal is authentic."
- **Bypass excerpts (verbatim):**

  **Binding?** No. The insider uses their primary institutional email, which resolves to a genuine .edu domain listed on the provider's allowlist.
  **Bypass methods.** None needed.
  **Attacker trace:** Institutional email address (e.g., jstudent@stateu.edu) is logged and ties the order to a specific person at a specific institution. Handler invisible.

- **Why relevant:** The on-record customer is the real insider; M02 sees a perfect match (real .edu, real institution, real person). The actual purposing party (the handler) is invisible to M02 by construction.
- **Persistent supply chain?** Y

---

## lab-manager-voucher

- **Branch slug:** `lab-manager-voucher`
- **Profile:** exploit-affiliation
- **Target description:** "An insider whose legitimate day-job is placing oligo orders on behalf of a PI, lab, core facility, or clinical / public-health unit. The attacker holds the registered ordering role on a standing provider account."
- **Bypass excerpts (verbatim):**

  **Binding?** No. The attacker's institutional email, HR record, and directory listing are all genuine. Domain recognition, inbox verification, and consistency review pass on the merits. Federated login via eduGAIN or InCommon, where deployed, also passes natively.
  **Bypass methods.** None needed ($0, zero lead-up, Aspirant).

  **Shared departmental account sub-variant:** "Where a single provider account is registered to a lab or department name with shared credentials, the provider cannot distinguish the attacker from a legitimate peer on any specific order."

- **Why relevant:** Real institutional email and HR-record-backed directory entry. M02 has no leverage because every signal it queries is authentically the attacker's. The shared-account sub-variant defeats even per-individual email correlation.
- **Persistent supply chain?** Y

---

## bulk-order-noise-cover

- **Branch slug:** `bulk-order-noise-cover`
- **Profile:** exploit-affiliation
- **Target description:** "A core facility technician or departmental administrator at a real US R1 university exploits the institutional ordering infrastructure they already legitimately operate."
- **Bypass excerpts (verbatim):**

  **Binding?** No. The attacker's work email is a real institutional mailbox on a real university domain. If the provider federates to eduGAIN/InCommon, the attacker authenticates through the institution's SSO — still a native pass. No synthesis provider was found to currently use eduGAIN/InCommon as a primary affiliation gate.
  **Bypass methods.** None needed.
  **Attacker trace:** Per-user: work email tied to the attacker. Shared-account / role-mailbox (e.g., `genomics-core@university.edu`): accessed by 3-5 staff with delegated permissions; individual attribution depends on institutional IT session logs.

- **Why relevant:** Real R1 institutional mailbox or shared role-mailbox. M02 passes natively; the role-mailbox sub-variant breaks per-individual tracking entirely.
- **Persistent supply chain?** Y
