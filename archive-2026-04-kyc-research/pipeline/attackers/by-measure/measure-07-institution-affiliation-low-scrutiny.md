# Measure 07 — institution-affiliation-low-scrutiny

Screening: Check that customer is affiliated with their listed institution (low scrutiny). E.g., the customer's email domain matches their listed institution; customer is shown on the institution's website. Flag triggers: customer cannot demonstrate any ties to the institution.

Stories ordered most-directly-engaging first. The "shown on institution website" leg is the distinguishing dimension from M02 — it's defeated by either (a) creating a genuine directory entry on a real institution's site, or (b) standing up a self-controlled "institution" website where the attacker is the only listed person.

---

## it-persona-manufacturing

- **Branch slug:** `it-persona-manufacturing`
- **Profile:** exploit-affiliation
- **Target description:** "An IT administrator at a research university or institute uses legitimate admin rights over mail routing, directory entries, and identity management to manufacture a role-plausible persona (lab manager, research tech, visiting scholar) on the real institutional domain, attached to a real host lab selected for its publications, grants, and existing provider relationship."
- **Bypass excerpts (verbatim):**

  **Sub-path A — Loose-governance direct injection:** "Creates a mail alias, directory entry, and DL membership for the manufactured persona using the standard admin console. The resulting email address and directory record pass any affiliation check that queries the institution's public directory or accepts mail delivery."
  - Expertise: Practitioner. Cost: $0. Lead-up time: Minutes.
  - Downstream risk: surviving the first orphaned-identity reconciliation cycle (typically weekly or monthly at institutions running SailPoint or Okta lifecycle management).

  **Sub-path B — Visiting-scholar / affiliate-program pathway:** "Initiates a visiting-scholar appointment for the manufactured persona through the institution's own administrative process, with a real PI as sponsor. The resulting identity has an HR-matched record and survives orphaned-identity reconciliation."
  - Practitioner. $0 out-of-pocket. 2–8 weeks. Trace: visiting-scholar database entry with sponsoring-PI signature; research-office records.

  **Sub-path C — Reuse of departed real member's directory entry:** "Identifies a departed lab member whose directory entry was not purged, reactivates the entry, and maps it to the manufactured persona's alias." Practitioner. $0.

  **Sub-path D — HR-system injection:** "Injects a record directly into the HR system (Workday, Banner, PeopleSoft), giving the manufactured persona a fully HR-matched identity." Expert. $0.

- **Why relevant:** Directly produces the directory-listing artifact M07 looks for. Sub-path A makes the persona "shown on the institution's website" via the public directory; sub-path D adds full HR-record backing. The whole branch is an M07 attack.
- **Persistent supply chain?** Y

---

## visiting-researcher

- **Branch slug:** `visiting-researcher`
- **Profile:** fake-affiliation
- **Target description:** "A lone operator with social-engineering basics obtains a real visiting-scholar or courtesy appointment at a US/European R1 university through the institution's own lightweight vetting process, then uses the resulting genuine `.edu` credentials to place SOC orders. The attacker uses their own real name throughout. No technical compromise, no document forgery, no credential theft."
- **Bypass excerpts (verbatim):**

  **Upstream sub-chain economics (cross-cutting).** "Nearly every KYC measure is pass-through once the appointment issues, so operational cost lives almost entirely in obtaining the visiting appointment. At a typical R1 department-level courtesy program, the attacker faces $0–$1,500 in institutional fees, $0–$240 for an LLM-assisted draft methods paper used as the pitch anchor, and 40–120 hours of attacker time across 5–20 cold pitches plus sustained correspondence. Total out-of-pocket: $0–$3,000. Total lead time: 2–4 months from first cold pitch to `.edu` email in hand."

  **Measure 2.** "The attacker holds a real `.edu` email on the host university's genuine canonical domain. Inbox verification passes natively." Bypass methods: none needed. Trace: "Real `<name>@<university>.edu` on file."

- **Why relevant:** Once the courtesy appointment issues, the attacker is genuinely listed on the host department's website (visiting-scholars page), in the directory, and has the canonical .edu email. M07's "shown on the institution's website" check returns a clean affirmative because the attacker really is shown on the website.
- **Persistent supply chain?** N (typical 6–12 month appointment)

---

## unrelated-dept-student

- **Branch slug:** `unrelated-dept-student`
- **Profile:** exploit-affiliation
- **Target description:** "A currently enrolled graduate student or postdoc in a department that does not normally order sequences of concern (e.g., computational biology, chemistry, materials science). The attacker has a real `.edu` email, real government ID, real institutional affiliation, and legitimate campus access."
- **Bypass excerpts (verbatim):**

  **Bypass A — Canonical `@university.edu` (primary):** Uses their own institutional email, which was issued by central IT upon enrollment. No action required. Aspirant. $0. Lead-up time: None. **Trace:** Institution's mail server retains all provider correspondence. The attacker's real `.edu` address is on file at the provider permanently.

  **Bypass B — Host-lab or research-group alias:** "Obtains a lab-specific email alias (e.g., `jsmith@genomicslab.university.edu`) during a legitimate rotation." Aspirant. $0. **Caveat:** "A host-lab alias invites a footprint check against the lab's publications, which returns nothing for the attacker — fine for rotation students, but potentially flagged by an attentive reviewer."

  **Bypass C — Federated academic login (InCommon/eduGAIN):** Authenticates via institutional SSO. Federated assertion includes affiliation and possibly department attributes.

- **Why relevant:** Real enrolled student → real directory entry on the university website by construction. M07 returns a clean affirmative because the attacker is genuinely listed; the only weakness exposed is that the listed department is not a wet-lab one (which M07 as scoped does not check).
- **Persistent supply chain?** Y

---

## lab-manager-voucher

- **Branch slug:** `lab-manager-voucher`
- **Profile:** exploit-affiliation
- **Target description:** "An insider whose legitimate day-job is placing oligo orders on behalf of a PI, lab, core facility, or clinical / public-health unit. The attacker holds the registered ordering role on a standing provider account and is often also the registered vouching contact."
- **Bypass excerpts (verbatim):**

  **Binding?** No. "The attacker's institutional email, HR record, and directory listing are all genuine. Domain recognition, inbox verification, and consistency review pass on the merits. Federated login via eduGAIN or InCommon, where deployed, also passes natively."
  **Bypass methods.** None needed ($0, zero lead-up, Aspirant).
  **Shared departmental account sub-variant:** "Where a single provider account is registered to a lab or department name with shared credentials, the provider cannot distinguish the attacker from a legitimate peer on any specific order."
  **Key uncertainty:** "Whether any IGSC synthesis provider in 2026 performs role validation against institutional HR (no evidence found; `measures-in-practice.md` does not list this as part of the baseline)."

- **Why relevant:** "Directory listing all genuine" — the M07 directory-on-website check returns the cleanest possible affirmative. Branch's existence is a demonstration that low-scrutiny M07 is satisfied trivially by anyone with real institutional employment, regardless of whether their actual role is licit.
- **Persistent supply chain?** Y

---

## bulk-order-noise-cover

- **Branch slug:** `bulk-order-noise-cover`
- **Profile:** exploit-affiliation
- **Target description:** "A core facility technician or departmental administrator at a real US R1 university exploits the institutional ordering infrastructure they already legitimately operate. Two variants: a core facility technician batching target sequences into routine multi-PI orders (volume noise cover), or a cross-PI admin distributing target sequences across 10-40 PIs' budget codes."
- **Bypass excerpts (verbatim):**

  **Binding?** No. "The attacker's work email is a real institutional mailbox on a real university domain."
  **Bypass methods.** None needed.
  **Attacker trace:** "Per-user: work email tied to the attacker. Shared-account / role-mailbox (e.g., `genomics-core@university.edu`): accessed by 3-5 staff with delegated permissions; individual attribution depends on institutional IT session logs."

- **Why relevant:** Real core-facility staff → real directory entry on the facility's institutional web page. The role-mailbox sub-variant makes the listed identity a *role*, not a person — defeating any M07 implementation that tries to correlate the named customer with a specific website-listed individual.
- **Persistent supply chain?** Y

---

## insider-recruitment

- **Branch slug:** `insider-recruitment`
- **Profile:** impersonate-employee (insider variant)
- **Target description:** "An external handler pays a legitimate insider at a research institution (grad student or junior tech in the one-off variant; postdoc, lab tech, or facilities manager in the persistent variant) $1,000–$5,000 per order to place SOC orders on the handler's behalf. The insider uses their own real identity, real institutional email, real payment method, and real shipping address — every KYC signal is authentic."
- **Bypass excerpts (verbatim):**

  **Measure 2 — Binding?** No. The insider uses their primary institutional email, which resolves to a genuine .edu domain listed on the provider's allowlist.
  **Bypass methods.** None needed.
  **Attacker trace:** Institutional email address (e.g., jstudent@stateu.edu) is logged and ties the order to a specific person at a specific institution. Handler invisible.

- **Why relevant:** The on-record customer is the real insider, who is genuinely listed on the institution's directory page. M07 returns a clean affirmative; the actual purposing party (the handler) is invisible by construction.
- **Persistent supply chain?** Y (persistent variant explicitly modeled)

---

## account-hijack

- **Branch slug:** `account-hijack`
- **Profile:** exploit-affiliation
- **Target description:** "A moderately skilled attacker compromises a principal investigator's institutional email, then takes over the PI's pre-existing, fully verified synthesis provider account. Because identity, affiliation, payment, and shipping are already on file, the attacker inherits the PI's verified status across most KYC measures."
- **Bypass excerpts (verbatim):**

  **2. Institutional Affiliation Check.** "Binding? No. The PI has a real .edu address at a real institution; the affiliation check passes authentically. False-negative rate: Very low (<1%) for university-affiliated researchers under a domain + institution-name baseline check. Bypass methods. None required. Inherited."

- **Why relevant:** The hijacked PI is a real listed faculty member with a directory page on the institution website. M07 returns the genuine PI's affirmative listing; nothing about the takeover changes the fact that the customer of record corresponds to a real, web-listed person.
- **Persistent supply chain?** N

---

## inbox-compromise

- **Branch slug:** `inbox-compromise`
- **Profile:** fake-affiliation
- **Target description:** "A lone operator with practitioner-level cybercrime skills compromises a dormant or lightly monitored email account at a small US college (role mailbox, retired adjunct, alumni-for-life forwarder) and presents themselves to a synthesis provider as a new researcher using that institutional address."
- **Bypass excerpts (verbatim):**

  **3. Adjunct account password-reset via lapsed personal email.** "The attacker finds a departed adjunct whose recovery email is a re-registrable personal address (Yahoo, AOL, ISP webmail), re-registers it, and triggers a password reset." Practitioner. $20–$50.

  **5. Alumni-for-life forwarder.** "The attacker either briefly enrolls as a non-degree student at a public university's continuing-ed program ($200–$2,000/semester) or acquires a lapsed alumni forwarder credential via breach dump ($10–$30)." **Load-bearing question — whether providers accept `alumni.<u>.edu` domains as institutional affiliation.**

  **6. Self-issued visiting/affiliate account via departmental sysadmin.** Novice. $0–$100. Trace: real name on the institution's directory.

- **Why relevant:** Variants 3, 5, and 6 produce identities that may also be present on the institution's website (departed-adjunct legacy faculty pages cached by Wayback / still indexed; alumni listings; departmental visiting-affiliate pages). Method 6 explicitly notes the attacker's "real name on the institution's directory." Where the inbox is a *role mailbox* with no individual web listing, M07's "shown on website" leg is the gating signal that catches the bypass.
- **Persistent supply chain?** N (one-off) / Y (persistent variant)

---

## credential-compromise

- **Branch slug:** `credential-compromise`
- **Profile:** fake-affiliation
- **Target description:** A moderately skilled attacker compromises a real PI's institutional email account using infostealer logs, breach dumps, or AitM phishing, and uses the genuine `.edu` mailbox to onboard at a synthesis provider as the PI.
- **Bypass excerpts (verbatim):**

  **Binding?** No. The genuine compromised `.edu` email passes the affiliation check authentically.
  **Bypass method — Compromised `.edu` email.** "The attacker logs into the target's institutional mailbox using credentials from a breach or infostealer log, or a session token captured via AitM phishing, and replies to any affiliation-verification email as the real user would." Amateurish to Intermediate. $0 incremental.

  **From Measure 4:** "The attacker operates under a real institution's identity with a real faculty profile, research program, and public publication history. Bypass method — Genuine institution signals."

- **Why relevant:** The compromised PI has a faculty page on the institution website. M07's directory-listing check returns a clean affirmative for the named victim PI; the attacker is operating under that identity, so M07 confirms a real web-listed person.
- **Persistent supply chain?** N

---

## dormant-account-takeover

- **Branch slug:** `dormant-account-takeover`
- **Profile:** exploit-affiliation
- **Target description:** "An IT administrator at a target institution uses legitimate mailbox-control and IAM tooling to take over a dormant synthesis-provider account belonging to a departed researcher. The attacker inherits a fully approved persona — passed IAL1 (possibly IAL2), verified affiliation, registered shipping, real publication trail."
- **Bypass excerpts (verbatim):**

  **Bypass A — Redirect the original holder's institutional mailbox (primary):** Adds a silent forwarding rule, transfers the mailbox, or sets a mail-flow BCC on the departed researcher's institutional email address.
  **Bypass B — Re-activate a fully deprovisioned account.**
  **Bypass C — Provision new institutional mailbox for fabricated persona:** "Creates a new mailbox under the dormant lab's subdomain (e.g., `successor@labname.university.edu`) as a fabricated institutional identity." Practitioner. $0. **Cross-measure dependency:** "Directly enables the fabricated-colleague vouching path at Measure 8."

- **Why relevant:** Bypass A inherits the original holder's faculty page (still cached / often still live for months after departure). Bypass C invents a new persona — *not* listed on the institution website by default — and the attacker, as IT admin, can extend the manufacture upstream into the directory layer. M07's "shown on website" check is the gating signal that distinguishes Bypass A (passes) from Bypass C (fails unless attacker also touches the directory).
- **Persistent supply chain?** Y

---

## foreign-institution

- **Branch slug:** `foreign-institution`
- **Profile:** fake-affiliation / exploit-affiliation hybrid
- **Target description:** "A lone operator exploits verification coverage gaps at mid-tier non-Anglophone research institutions (Brazilian federal universities, Japanese prefectural labs, Indian state agricultural universities, Indonesian/Vietnamese national research institutes, Russian-language CIS institutions)."
- **Bypass excerpts (verbatim):**

  **Method 2: Visiting-researcher account via local-language sysadmin request.** "The attacker writes a credible local-language collaboration pitch to a department sysadmin requesting a visiting-researcher email account." Novice. $100–$500. **Cross-measure dependency:** "This M2 choice unlocks zero-cost M3 variant 3b (attacker's name is on the roster) and zero-cost M9 (real institutional letterhead access). The trade-off is full identity commitment to the institution's records."

  **Method 3: Alumni / legacy / former-affiliation residue.** Uses own legitimate (albeit stale) credentials at an institution where they once studied or worked. **Cross-measure dependency:** "Like visiting-researcher, unlocks zero-cost M3 variant 3b (name matches roster)."

  **Method 6: Semi-legitimate short visiting appointment.** "Similar to the full visiting-researcher method but lighter-touch and faster at non-Anglophone institutions where sponsor vetting is lighter." Novice. $200–$1,000.

- **Why relevant:** Methods 2, 3, and 6 produce a real entry on the host institution's roster / personnel page in the local language. M07 as scoped likely cannot fluently parse non-Anglophone institutional websites for personnel listings, and even if it can, the attacker really is listed.
- **Persistent supply chain?** N (per-target)

---

## dormant-domain

- **Branch slug:** `dormant-domain`
- **Profile:** fake-affiliation
- **Target description:** "A patient lone operator acquires (or reclaims via dangling-DNS takeover) the canonical domain of a defunct research entity whose publication trail is still live in PubMed, Google Scholar, and NIH RePORTER. The attacker reanimates the domain, stands up a 'we're back' website and mail server, and presents as a 'successor researcher' at a small revived lab."
- **Bypass excerpts (verbatim):**

  **Bypass A — Acquire the lapsed canonical domain.** "Then stands up a mail server (SPF/DKIM/DMARC configured, 4–6 weeks of domain warming) and a basic 'lab' website mirroring the defunct entity's archive.org snapshot."
  - Cost: $500–$10,000 for the domain + $100–$500 for VPS hosting and mail stack.
  - Trace: "A Google search of the revived entity name surfaces the attacker's landing page."

- **Why relevant:** The attacker explicitly stands up a "lab" website on the revived canonical domain that lists the attacker as "successor researcher." M07's "shown on the institution's website" check returns a clean affirmative — because the attacker controls the institution's website. M07 has no leverage against a self-controlled "institution."
- **Persistent supply chain?** Y

---

## shell-company

- **Branch slug:** `shell-company`
- **Profile:** purpose-built-organization
- **Target description:** "Branch D: Shell Company with Real Employees. The shell company is genuinely registered in Delaware with a real business address and bank account, and the company's own domain email satisfies institutional affiliation."
- **Bypass excerpts (verbatim):**

  **Measures 1, 3, 5 — Bypass methods:** None needed. These measures are satisfied by construction. ("the company's own domain email satisfies institutional affiliation. The branch's entire premise is to walk these checks through as a genuine entity with real people.")

  **Bypass method 1 (entity signals):** "stands up a professional website and LinkedIn profiles, posts one or two bioRxiv preprints" … "professional website $3-8K one-time" … "LinkedIn profiles free (no verification)."

- **Why relevant:** Self-controlled "company website" lists the attacker as the principal/founder — M07 affirms because the attacker is shown on the institution's (their own) website. The whole purpose-built-organization profile relies on M07 being a low-scrutiny check that does not distinguish the attacker's own corporate website from a real third-party institutional website.
- **Persistent supply chain?** Y

---

## shell-nonprofit

- **Branch slug:** `shell-nonprofit`
- **Profile:** purpose-built-organization
- **Target description:** Branch E. A shell research nonprofit deliberately named to collide with a real small institute, with a self-owned domain pre-aged 4–12 weeks; persistence variant adds ROR self-listing.
- **Bypass excerpts (verbatim):**

  **Stand up the shell's own domain and mailbox** (covered in M02 above).

  **ROR self-listing (persistence variant only):** "Submits a curation request to the Research Organization Registry after seeding several preprints naming the shell as an affiliation. If approved, the shell appears in the ROR directory that some providers may reference." Novice. $0. 4–6 weeks. **Key caveat:** "ROR inclusion requires acknowledgment by multiple people in research-output affiliations; single-person organizations are explicitly out of scope."

  **Branch framing:** "The attacker [seeds] preprints naming the shell as an affiliation."

- **Why relevant:** Self-controlled shell website lists the attacker; ROR self-listing additionally satisfies a "shown in a recognized institutional registry" check. The branch deliberately produces directory artifacts (preprint affiliations, ROR record) that mimic the "shown on institution website" signal M07 looks for.
- **Persistent supply chain?** Y

---

## cro-framing

- **Branch slug:** `cro-framing`
- **Profile:** purpose-built-organization
- **Target description:** "A single individual (or small group) registers a real US LLC under their own real legal name and frames it as a small contract research organization (CRO). They use a virtual office in a biotech metro, a self-built one-page services website."
- **Bypass excerpts (verbatim):**

  **Self-owned domain workspace** (Google Workspace + LLC-matching domain). Aspirant. ~$10–$22/yr + Google Workspace. 1–2 hours.

  **Branch description:** "self-built one-page services website."

- **Why relevant:** Self-built CRO website lists the attacker as the principal. M07 returns affirmative because the attacker is genuinely "shown on the institution's website" — the institution being their own LLC.
- **Persistent supply chain?** Y

---

## cro-identity-rotation

- **Branch slug:** `cro-identity-rotation`
- **Profile:** purpose-built-organization
- **Target description:** "A single individual or small pair files 2–4 small contract-research-organization LLCs in different US biotech metros, runs each as a clean small business … and uses each entity to place orders at a different subset of synthesis providers."
- **Bypass excerpts (verbatim):**

  **Per-entity year-1 cost is roughly $1,600–$2,300 on the cheapest path or $5,500–$9,600 with credible-defense upgrades (coworking lease, hired biosafety consultant, hired voucher consultant).**
  **Strategy summary** notes that "each entity is built using commodity small-business workflows that thousands of legitimate small CROs execute every year."

- **Why relevant:** Each LLC has its own self-controlled CRO website that lists the attacker as principal. M07 returns affirmative on each entity in isolation; cross-entity correlation (which would catch the rotation) is outside M07's scope.
- **Persistent supply chain?** Y

---

## biotech-incubator-tenant

- **Branch slug:** `biotech-incubator-tenant`
- **Profile:** purpose-built-organization
- **Target description:** "An individual or small group … form an LLC, lease bench space at a biotech incubator (BioLabs, LabCentral, Genspace, or a university-affiliated equivalent)."
- **Bypass excerpts (verbatim):**

  **3a — Bench-space lease at a recognized biotech incubator.** "Attacker trace: Incubator lease records under the LLC name … public tenant directory listing."
  **4a — Reflected legitimacy from incubator tenancy.** "Lean on the measure-3 incubator address, a one-page LLC website describing the research focus in early-stage-startup language, LinkedIn bios for the 1–2 person team, and the incubator's tenant directory listing."

- **Why relevant:** Two web-listing signals: (1) the attacker's own LLC one-page website, and (2) the *real* biotech incubator's public tenant directory listing the LLC. The second is genuinely a third-party institutional website showing the attacker's entity — M07 returns a strong affirmative, satisfied by a real directory at a recognized incubator.
- **Persistent supply chain?** Y

---

## gradual-legitimacy-accumulation

- **Branch slug:** `gradual-legitimacy-accumulation`
- **Profile:** purpose-built-organization
- **Target description:** "A patient individual or small group spends 6–12 months operating a real-but-hollow small biotech or CRO before attempting controlled-sequence orders. Time, not money, is the load-bearing resource."
- **Bypass excerpts (verbatim):**

  **Method 7 — Crunchbase, AngelList, and similar listings.** "Free self-serve profiles listing the LLC. Trace: public self-asserted profile with attacker's name as founder."
  **Method 9 — LinkedIn footprint.** "LinkedIn profiles for attacker and accomplice listing the LLC as employer. Free. LinkedIn is self-asserted and unverified."
  **Method 5 — bioRxiv preprint.** "Post a preprint on bioRxiv with the LLC as affiliation. Free. … Trace: permanent indexed preprint with author, LLC, posting date."

- **Why relevant:** Generates multiple third-party web listings (Crunchbase, AngelList, LinkedIn, bioRxiv preprints) that collectively satisfy any "shown on institution website" check that does not distinguish self-asserted listings from third-party-vetted ones.
- **Persistent supply chain?** Y

---

## community-bio-lab-network

- **Branch slug:** `community-bio-lab-network`
- **Profile:** purpose-built-organization
- **Target description:** "A single individual or small group registers two or three 'community biology labs' in underserved metros — Denver, Tucson, Kansas City — as real LLCs or nonprofits with real domains, real maker space addresses, real bank accounts, and real public listings on community-bio directories."
- **Bypass excerpts (verbatim):**

  **Bypass method — Minimal community-bio web presence + DIYbio.org listing.** "A one-page website (template, $0–$240/year) describing educational programming, open-equipment policy, and community research interests. Request a listing on the DIYbio.org local directory, which adds groups within ~24 hours of being notified with no formal scientific vetting."
  **Bypass method — Self-listing under community bio umbrella organizations (DIYbiosphere).** "The DIYbiosphere is a community-maintained directory accepting self-submitted entries. Free, no vetting beyond self-description." **Cost: $0.**

- **Why relevant:** Both an attacker-controlled lab website *and* a real third-party community-bio directory listing (DIYbio.org, DIYbiosphere) within 24 hours of self-submission. M07's "shown on institution's website" check is satisfied by either; the third-party listings give the attacker a non-self-asserted directory presence at zero cost and zero vetting.
- **Persistent supply chain?** Y
