# Measure 17 — pre-approval-list

Practice: for each SOC order, screen the customer against any existing pre-authorized / pre-approved lists or designations, and/or against previous company records for past SOC orders and outcomes. The measure does not by itself "stop" attackers; it lets the provider treat customers with a clean documented history as already-vouched. Stories below engage the measure either by manufacturing the very order/tenure history that pre-approval would key on (purpose-built-organization branches), or by inheriting a pre-approved customer record via account takeover (impersonate-employee / exploit-affiliation branches).

Ordered most-directly-engaging first.

---

## 1. gradual-legitimacy-accumulation

- **Branch slug:** gradual-legitimacy-accumulation
- **Profile:** purpose-built-organization
- **Target:** "A patient individual or small group spends 6–12 months operating a real-but-hollow small biotech or CRO before attempting controlled-sequence orders. Time, not money, is the load-bearing resource. The attacker uses their own real identity throughout and accepts that every artifact — LLC filings, non-SOC orders, publications, ORCID profiles — ties their real name to a deepening paper trail. That trail is simultaneously legitimacy (if never investigated) and evidence (if ever investigated). The branch bets on the former."
- **Bypass excerpts (verbatim, from the branch's central row, Measure 4):**

  > **Two load-bearing assumptions carried through every row below:**
  > 1. The provider's research-and-entity-signals review actually weights customer tenure and order history (not just point-in-time entity profile). If not, the branch's rationale collapses.

  > **Binding?** Yes — this is the central row of the branch. Measure 4 is the only Matrix A row with a signal that changes over time. The branch's whole claim is that 12 months of aging the domain, accumulating order history, and seeding publications moves the entity from "new and suspicious" to "thin but typical of a real new small biotech."

  > **Method 1 — Time-aged domain and clean order history.** Register the domain at month 0 and place 5–20 small non-controlled orders (oligos, primers, gene fragments) over 12 months — $500–$2,000 in real synthesis spend plus shipping. By month 12 the provider's risk system shows a year of customer tenure, a clean payment record, and a real order pattern. Expertise: Novice. Lead-up time: 6–12 months. Trace: every order is a permanent dated provider record tied to the attacker's name and LLC. This is the strongest trace asset and the core mechanism of the branch.
  >
  > **Method 2 — Aged domain auction purchase (compression variant).** Buy a 5+ year expired domain whose name fits the LLC via [GoDaddy Auctions](https://auctions.godaddy.com/beta) or [NameJet](https://www.namejet.com/). Price range $50–$5,000 with most biotech-adjacent expired domains in the $100–$1,000 range. Compresses the domain-age component but not the order-history component. Trace: historical WHOIS records preserve prior owners and can embarrass a new owner.

  > **Key uncertainty and load-bearing assumption:** The branch assumes the provider's Measure-4 review actually weights customer tenure and order history. If the review is point-in-time only, the 12-month buildup buys nothing.

  > ## Persistence
  >
  > The branch is explicitly designed for persistence. Once the entity has matured, it can support repeat SOC orders for years as long as the order pattern looks normal (mixed SOC and non-SOC) and no downstream event triggers retrospective scrutiny. Each additional order deepens both legitimacy (dominant if uninvestigated) and attribution (only if investigated). The accumulating trace is a one-way ratchet.

- **Why relevant:** The branch's entire economic logic is to manufacture a "previous company records for past SOC orders and outcomes" record so the provider's pre-approval mechanism eventually treats the entity as a known customer. If pre-approval keys on tenure + clean order history, this branch is the canonical attack against it.
- **Persistent supply chain?** Y

---

## 2. shell-company

- **Branch slug:** shell-company
- **Profile:** purpose-built-organization (shell company with real employees)
- **Target:** "A newly-incorporated LLC with no publications, no grants, no regulatory filings, and no order history is exactly the signal profile Measure 4 is designed to flag. The attacker must actively produce entity signals — web presence, lab space, preprints, order history, domain age — that approximate a real small biotech." Branch builds — or buys — a real Delaware LLC with real employees and a 6–12 month buildup of provider account history before placing SOC orders.
- **Bypass excerpts (verbatim):**

  > #### Bypass method 1: Build entity signals from scratch
  >
  > **What the attacker does:** Incorporates a Delaware LLC, gets an EIN and DUNS number, rents either a virtual office or a co-working lab bench in a biotech hub (Boston, San Diego, RTP, Bay Area), stands up a professional website and LinkedIn profiles, posts one or two bioRxiv preprints, and places routine non-sequence-of-concern orders for several months to build a purchasing track record before attempting a sequence-of-concern order.
  >
  > **Lead-up time:** **6-12 months** to first sequence-of-concern order. The critical path is order-history building plus domain/entity age; these run **in parallel**, not sequentially. Pure administrative setup (LLC, EIN, bank, website, lab lease) takes 2-4 weeks.

  > #### Bypass method 2: Acquire an existing company
  >
  > **What the attacker does:** Buys an existing biotech/consulting entity from a business brokerage (e.g., Acquire.com), inheriting its formation history, aged domain, and — in the premium version — live synthesis-provider accounts and order history.
  >
  > **(b) Going-concern with live provider accounts (premium tier):** **$150-300K+**. Provider accounts "are not typically listed as assets in business sales," so identifying targets requires diligence beyond brokerage listings and sellers command a premium ... The attacker gets live provider relationships and established entity signals. **Time to first SOC order: ~3-6 months** (close + transfer + modest ramp before escalating to SOC-adjacent orders).

  > #### Bypass: Gradual order escalation + protocol framing
  >
  > **What the attacker does:** Orders non-concerning sequences for months to build a normal-looking purchasing pattern, then introduces flagged orders framed within a defensible research narrative consistent with the company's stated program.
  >
  > **Cost:** No incremental cost beyond the order-history building already required for Measure 4. Orders at standard prices ($0.07-0.30/bp for gene fragments).
  >
  > **Lead-up time:** 6-12 months of legitimate ordering — the **same timeline as Measure 4**, not additive.
  >
  > **Attacker trace:** Every order is in provider records; the benign-to-SOC escalation pattern is visible in retrospective analysis.

- **Why relevant:** Both the build-from-scratch and acquisition paths explicitly aim to create "previous company records for past SOC orders and outcomes" — either by aging the account themselves or by buying a going concern that already carries one. Pre-approval lists keyed on prior order history are the surface this branch is constructed against.
- **Persistent supply chain?** Y

---

## 3. biotech-incubator-tenant

- **Branch slug:** biotech-incubator-tenant
- **Profile:** purpose-built-organization
- **Target:** "An individual or small group with $500–$3,000+ per month in ongoing budget. They form an LLC, lease bench space at a biotech incubator (BioLabs, LabCentral, Genspace, or a university-affiliated equivalent), and use their own real legal identity throughout — or, in the lower-trace variant, recruit a willing accomplice to be the LLC's named principal."
- **Bypass excerpts (verbatim, from Measure 4):**

  > **4c — Build a real (light) order history before SOC.** Place several routine non-SOC orders (primers, gene blocks, plasmid backbones) over 1–3 months. Risk-scoring systems weight clean order history positively.
  > - Expertise: Novice.
  > - Cost: A few hundred dollars in throwaway non-SOC orders; standard primer orders from major synthesis vendors (e.g., IDT) typically cost $5–$30 each (best guess from public price pages).
  > - Lead-up time: 1–3 months.
  > - Attacker trace: Order history under the LLC name and the principal's identity, retained per provider data-retention.
  >
  > **4f — Buy an aged dormant biotech LLC.** Purchase a dormant existing biotech entity from a business broker. Inherits aged registration and possibly aged domain or prior order history.
  > - Expertise: Novice.
  > - Cost: Roughly $500 to several thousand dollars (no firm public source located).
  > - Lead-up time: Days to weeks.
  > - Attacker trace: Acquisition records via the broker; the original principal must be replaced or pass IDV — adds an identity-handoff complication.

- **Why relevant:** Branch explicitly seeds "clean order history" and considers acquiring an entity with prior order history specifically because risk-scoring systems weight a clean history positively — the exact mechanism a pre-approval / past-SOC-records check rewards.
- **Persistent supply chain?** Y

---

## 4. bulk-order-noise-cover

- **Branch slug:** bulk-order-noise-cover
- **Profile:** exploit-affiliation (core-facility technician or cross-PI admin at a real R1 university)
- **Target:** "A core facility technician or departmental administrator at a real US R1 university exploits the institutional ordering infrastructure they already legitimately operate. Two variants: a core facility technician batching target sequences into routine multi-PI orders (volume noise cover), or a cross-PI admin distributing target sequences across 10-40 PIs' budget codes (distribution noise cover). A sub-variant matters: shared facility provider accounts (where the IAL2 biometric on file may belong to a predecessor) substantially lower individual attribution. Marginal financial cost: $0. Lead time: days to weeks. The attack is designed to be indefinitely repeatable."
- **Bypass excerpts (verbatim):**

  > **Binding?** No. The attacker is a real person with a long-standing provider account. Under the per-user variant, IAL1 was passed against the attacker's genuine PII at hire. Under the shared-account sub-variant, IAL1 was passed by a predecessor who opened the facility account, possibly years ago, and has not been re-run.

  > **Binding?** No. The facility or department has a long-standing provider organization record with multiple registered contacts and approved shipping destinations.

  > **Method A -- Bulk-order noise cover (core facility):**
  > - Target sequence bundles into a routine multi-PI batch of 200-800 tubes. The target must fit the facility's normal product mix by length, modification pattern, and plausible function class (the sequence-selection constraint). Defeats per-account/per-PI volume anomaly detection but not per-account composition analytics.
  > - **Expertise:** Aspirant -- routine job function.
  > - **Cost:** $0. Reagent cost charged to PI grant.
  > - **Lead-up time:** 0-14 days (next routine batch).
  > - **Attacker trace:** Target tube's order record in provider's per-customer history. Indistinguishable from legitimate orders at the individual-record level.

  > **Method C -- Temporal noise escalation:**
  > - Gradually grow the facility's baseline order volume over months so adaptive rolling-window thresholds rise alongside real activity. The target tube is then absorbed by the elevated baseline.

- **Why relevant:** The branch operates from inside a long-standing R1 core-facility account that any reasonable pre-approval list would already have on it (years of prior SOC orders with clean outcomes). The attack works precisely *because* the account is pre-approved by history; the branch deliberately keeps order patterns within the established baseline so the pre-approval is never re-evaluated.
- **Persistent supply chain?** Y

---

## 5. account-hijack

- **Branch slug:** account-hijack
- **Profile:** impersonate-employee (PI email compromise → existing-account hijack)
- **Target:** "A moderately skilled attacker compromises a principal investigator's institutional email, then takes over the PI's pre-existing, fully verified synthesis provider account. Because identity, affiliation, payment, and shipping are already on file, the attacker inherits the PI's verified status across most KYC measures and only needs to bypass the measures that re-check at order time."
- **Bypass excerpts (verbatim):**

  > Under Matrix A, nearly every measure evaluates the PI (genuine, verified) rather than the attacker behind the compromised email.

  > **4. Research & Entity Signals**
  >
  > **Binding?** No. The PI has genuine publications, grants, and a visible lab — the strongest possible research signals.
  >
  > **Bypass methods.** None required. Inherited. Expertise: none. Cost: $0. Trace: none, provided the attacker orders sequences consistent with the PI's published research area (discoverable from public profiles and the compromised inbox).

  > **Matrix A:** Only shipping address is even partially binding. Every other Matrix A measure is inherited outright.
  > **Matrix B, Scenario 1:** MFA, vouching, and biosafety are nominally binding but all have near-zero-cost bypasses for an attacker already controlling the PI's inbox. IAL2 remains inherited.

- **Why relevant:** The hijacker inherits the legitimate PI's entire history of past orders and outcomes — exactly the data a pre-approval mechanism would key on. Pre-approval keyed on the PI's record is silently transferred to the attacker.
- **Persistent supply chain?** N

---

## 6. credential-compromise

- **Branch slug:** credential-compromise
- **Profile:** impersonate-employee (remote credential compromise of an already-verified faculty/lab-manager customer)
- **Target:** "Faculty, staff, and lab managers at small US teaching-focused colleges and community colleges with biology/chemistry programs (~2,500 institutions), plus mid-sized US and European research universities reachable through AitM phishing (~1,000+). Targets are identified from public faculty directories and cross-referenced against breach databases and infostealer-log marketplaces."
- **Bypass excerpts (verbatim):**

  > - **Account takeover of an existing verified customer (cheapest path under the document+selfie baseline).** The attacker compromises a faculty member who already has a verified account with the synthesis provider, then resets the provider password via the compromised institutional email — inheriting the prior IAL1 pass without performing any direct identity attack.
  >   - Caveat: Requires a target who is already an active customer at the provider. Narrows the target pool sharply.
  >   - Cross-measure dependency: This method is the same operational move that bypasses measure 6 (IAL2) and measure 2 (affiliation); its feasibility depends on measure 6 being an onboarding-only check, not re-triggered per order.

  > **Cheapest Matrix A path.** Under the document+selfie IAL1 baseline, the dominant path is account takeover of an existing verified customer combined with carrier-redirect shipping.

- **Why relevant:** The dominant cheapest path explicitly requires "a target who is already an active customer at the provider" — i.e., a customer the provider's pre-approval / prior-order-history record already counts as known-good. The attack inherits whatever pre-approval status the legitimate user accumulated.
- **Persistent supply chain?** N

---

## 7. dormant-account-takeover

- **Branch slug:** dormant-account-takeover
- **Profile:** exploit-affiliation (institutional IT admin takes over a dormant provider account belonging to a departed researcher)
- **Target:** "An IT administrator at a target institution uses legitimate mailbox-control and IAM tooling to take over a dormant synthesis-provider account belonging to a departed researcher. The attacker inherits a fully approved persona — passed IAL1 (possibly IAL2), verified affiliation, registered shipping, real publication trail, real biosafety coverage, registered voucher — rather than building one. The core capital is the institutional IT role itself. Direct dollar cost across the entire chain is zero."
- **Bypass excerpts (verbatim, Measure 4):**

  > **Binding?** Conditionally non-binding — defeated under the baseline, but a single defensive enhancement (institutional-directory cross-check asking "is this researcher still here?") catches the branch cleanly.

  > **Bypass A — Inherited footprint (native pass):**
  > - **What the attacker does:** Nothing. The original holder's publication trail, grant history, and institutional affiliation are real and indexed.
  > - **Expertise:** N/A.
  > - **Cost:** $0. **Lead-up time:** 0.
  > - **Attacker trace:** None.
  >
  > **Bypass B — Passively constrain order profile:**
  > - **What the attacker does:** Keeps order volume within the account's historical patterns to avoid anomaly-detection triggers.
  > - **Expertise:** Practitioner.
  > - **Cost:** $0. **Lead-up time:** Ongoing.
  > - **Attacker trace:** None beyond orders.

  > **Bypass D — Gradual volume ramp (persistent variant):**
  > - **What the attacker does:** Starts with small oligo orders before escalating to SOC-range material over weeks.
  > - **Expertise:** Practitioner.
  > - **Cost:** $0. **Lead-up time:** Weeks.
  > - **Attacker trace:** Extended order history.

- **Why relevant:** The branch is explicitly built around inheriting "a fully approved persona" — including any pre-approval / past-SOC record the dormant account already holds. The "passively constrain order profile" and "gradual volume ramp" bypasses are designed to keep that pre-approval status undisturbed.
- **Persistent supply chain?** N
