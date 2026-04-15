# Measure 12 — billing-institution-association

**Measure:** Screen billing address for association with institutional affiliation. Flag triggers when billing address is not associated with the institution. Applies to all orders; follow-up is direct follow-up.

This is a payer-vs-institution consistency check. It binds whenever the attacker's payment instrument's billing address (and/or cardholder/account-holder name) does not match the institutional record on file. Stories are listed below in order of how directly their bypass methods engage this consistency check.

---

## 1. dormant-account-takeover

- **Profile:** exploit-affiliation
- **Target description:** A successor or unauthorized user takes over an inherited but unattended institutional synthesis-provider account whose original holder has departed. The branch's binding question at the payment step is whether inherited institutional billing is still live, and what happens when the attacker has to substitute a payment method.
- **Persistent supply chain?** N (one-shot exploitation of inherited credentials)
- **Bypass excerpts (verbatim):**

  > ### Measure 5: Payment integrity
  >
  > **Binding?** Conditionally. Non-binding where inherited institutional billing is still live; binding when billing has been closed out and the attacker must substitute a payment method. NIH grant closeout requires final reports within 120 days of project end date, so the live-billing window is narrow at well-run institutions.
  >
  > **False-negative rate.** Effectively 0% for inherited billing (the billing method is unchanged). Not applicable for substituted card (the card *should* fail the name-match check — this is a design-intent block, not a false negative).
  >
  > **Bypass A — Use inherited institutional PO / P-card / billing code:**
  > - **What the attacker does:** Continues using the payment method configured at account opening.
  > - **Expertise:** Aspirant. **Cost:** $0. **Lead-up time:** 0.
  > - **Attacker trace:** Institutional accounting records under the original holder's account number. Discoverable on institutional audit.
  > - **Key caveat:** P-cards deactivate on HR separation; grant billing closes within months. Narrow time window.
  >
  > **Bypass B — Inherited invoice / net-terms billing:**
  > - **What the attacker does:** Uses invoice billing without per-order card authorization; the institution's AP system processes the invoice.
  > - **Expertise:** Aspirant. **Cost:** $0. **Lead-up time:** 0.
  > - **Attacker trace:** Institutional invoice record plus provider archive.
  >
  > **Bypass C — Modify PO budget code via finance-system access:**
  > - **What the attacker does:** Temporarily reroutes the order to a different live budget code the attacker knows is funded. Requires finance-system admin rights in addition to mailbox admin.
  > - **Expertise:** Practitioner. **Cost:** $0. **Lead-up time:** Minutes.
  > - **Attacker trace:** Finance-system audit log. Monitored by institutional internal audit rather than IT security — different detection pipeline.
  >
  > **Bypass D — Substituted personal card (failure mode):**
  > - **What the attacker does:** Adds a personal payment card. The cardholder name mismatches the account holder name (the original holder's), so the provider's name-match consistency check flags it. This sub-path blocks the branch for most attackers.
  > - **Expertise:** Aspirant. **Cost:** $0–$100. **Lead-up time:** Minutes.
  > - **Attacker trace:** Attacker's own card on file — the branch's first provider-side identity commitment.

- **Why relevant:** Bypass D is the most explicit in-corpus engagement with measure 12: the source file names the "name-match consistency check" as a "design-intent block" of this exact branch. Bypasses A–C exist precisely to avoid having to trip Bypass D.

---

## 2. dormant-domain

- **Profile:** fake-affiliation
- **Target description:** Lone operator reanimates a defunct research entity's lapsed canonical domain and presents as its successor researcher. At the payment step the branch must produce something that survives an org-name-match check between payer and verified organization.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > ### Measure 5: Payment integrity
  >
  > **Binding?** Conditional. Binding if the provider enforces org-name-match between the payer and the verified organization. Non-binding otherwise.
  >
  > **Bypass A — Personal card, org-name-mismatch accepted (permissive providers):**
  > - **What the attacker does:** Pays with their own personal credit card. At providers that do not enforce org-name matching, this passes trivially.
  > - **Expertise:** Aspirant.
  > - **Cost:** $0.
  > - **Lead-up time:** 0.
  > - **Attacker trace:** Real card on file at provider.
  >
  > **Bypass B — LLC + EIN + fintech business account (stricter providers):**
  > - **What the attacker does:** Forms a Delaware LLC ($90 state filing + $100–$300 registered agent), obtains an EIN, opens a fintech business bank account (e.g., Mercury, which runs KYB including real principal place of business and source-of-funds documentation).
  > - **Expertise:** Novice — business formation is well-documented.
  > - **Cost:** $200–$1,000 total ($110 state filing + $100–$300 registered agent + $50–$500 optional services). Plus $300/year Delaware franchise tax.
  > - **Lead-up time:** 1–4 weeks for US residents; 3–4 months for non-residents due to IRS SS-4 fax/mail processing.
  > - **Attacker trace:** State business filing with attacker's real name as registered agent/member. EIN at IRS listing attacker as responsible party. Fintech bank KYB record with full identity and source-of-funds documentation. Substantially more committed than the personal-card path.

- **Why relevant:** Source file explicitly conditions M5 binding on "org-name-match between the payer and the verified organization" — the literal definition of measure 12. The two-bypass branch (personal card vs LLC bank account) is structured around whether the provider enforces this match.

---

## 3. account-hijack

- **Profile:** impersonate-employee
- **Target description:** A moderately skilled attacker compromises a PI's institutional email and takes over the PI's pre-existing fully-verified synthesis provider account. Almost everything is inherited; the branch's only real Matrix A friction is around shipping address and the side-effect on billing-vs-shipping consistency.
- **Persistent supply chain?** N (account-takeover, time-limited)
- **Bypass excerpts (verbatim):**

  > ### 5. Payment Integrity
  >
  > **Binding?** No. The PI's payment methods — PO numbers, procurement cards — are already on file; billing routes to the institution, not the attacker.
  >
  > **False-negative rate.** Very low (<1%) for established institutional accounts. Best guess.
  >
  > **Bypass methods.** None required. Inherited. Expertise: none. Cost: $0. Trace: none, but if paired with a Method 2 address change, a billing/shipping address mismatch could trigger a payment alert — another argument against the address-change path.

  > **Method 2: Social-engineered address change to an attacker-controlled drop.** From the compromised email, the attacker requests the provider add a new "collaborator lab" or "satellite facility" shipping address.
  > - Expertise: Minimal — composing an email matching the PI's communication style (available from inbox history).
  > - Cost: $0 incremental.
  > - Lead-up time: Hours to draft; 1–3 business days for provider processing.
  > - Cross-measure dependency: If paired with the email-based MFA reset path (Measure 7 Method 1), the 1–3 day address-change processing window overlaps with the "days, not weeks" MFA-reset detection window.

- **Why relevant:** The source file explicitly cites a "billing/shipping address mismatch" alert as a constraint that argues against the Method 2 address-change path — i.e., measure 12 is the alert the branch is trying to avoid tripping.

---

## 4. inbox-compromise

- **Profile:** impersonate-employee
- **Target description:** Attacker compromises an institutional inbox and orders against that affiliation. Pays with a real personal card; explicitly selects targets within driving distance to keep the billing address geographically consistent with the institution.
- **Persistent supply chain?** N
- **Bypass excerpts (verbatim):**

  > ### Measure 5: Payment integrity
  >
  > **Binding?** No (with soft caveat). The attacker uses their own real credit card. Billing-address mismatch with the institutional address is the only potential flag; target selection within driving distance of the institution eliminates geographic inconsistency.
  >
  > 1. **Own real card, target selected within driving distance**
  >    - Expertise: **Aspirant.**
  >    - Cost: $0 incremental.
  >    - Lead-up time: Zero.
  >    - Attacker trace: Real credit card, real billing address, real name on file at provider. Card issuer retains transaction records 7+ years under BSA. Strong financial attribution.
  >
  > 2. **Prepaid virtual card**
  >    - Expertise: **Novice.**
  >    - Cost: $5–$50 setup + 3–5% top-up fee.
  >    - Lead-up time: Minutes.
  >    - Attacker trace: Lighter KYC on prepaid products per FinCEN prepaid access rule, but still subject to subpoena.
  >
  > 3. **Small-LLC business card**
  >    - Expertise: **Novice.**
  >    - Cost: $100–$300 (LLC filing + card setup).
  >    - Lead-up time: 1–3 weeks.
  >    - Attacker trace: LLC filing is public record.

- **Why relevant:** Branch explicitly identifies "billing-address mismatch with the institutional address" as the only payment-side flag and engineers target selection (driving-distance) to defeat measure 12 by aligning billing zip with institutional zip.

---

## 5. credential-compromise

- **Profile:** impersonate-employee
- **Target description:** Attacker operates under a real institution's identity via compromised credentials. The dominant payment path is the institutional invoice/PO under the target's affiliation; a personal-card alternative is listed as a fallback.
- **Persistent supply chain?** N
- **Bypass excerpts (verbatim):**

  > ### Measure 5: Payment integrity
  >
  > **Binding?** No. Per `measures-in-practice.md` §5, this measure is non-binding for any attacker using their own identity or a well-matched fraudulent identity — which includes this branch, since invoiced orders bill the institution directly under the target's genuine affiliation.
  >
  > **Bypass methods:**
  >
  > - **Invoiced order (dominant).** The attacker orders on institutional invoice/PO, charging the institution's billing system as the target would.
  >   - Expertise: Amateurish.
  >   - Cost: $0 incremental.
  >   - Lead-up time: None beyond order placement.
  >   - Attacker trace: Invoice/PO record linking the order to the institutional billing system; delayed accounting review (days to months).
  >
  > - **Credit card in the target's name.** Identity-fraud new-card application or a cloned card.
  >   - Expertise: Intermediate.
  >   - Cost: $200–$500 for a cloned card; $0 for a fraudulent new-card application but with financial-fraud detection risk.
  >   - Lead-up time: Days (cloned) to 1–2 weeks (new application).
  >   - Attacker trace: Highly attributable card application or transaction records; the issuer's fraud detection may alert before shipment.

- **Why relevant:** The cloned/fraudulent-card sub-path exists specifically because a personal card in the *attacker's* name would mismatch the target institution. The branch routes around measure 12 either by riding the institution's own AP system (invoiced) or by cloning a card in the target's name.

---

## 6. shell-company

- **Profile:** purpose-built-organization
- **Target description:** Newly incorporated Delaware LLC with real Delaware business address, real EIN, and real LLC bank account. Billing address matches the LLC institution by construction.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > ### Measures 1, 3, 5 (IAL1, Institutional affiliation, Org registry + verified shipping address)
  >
  > **Binding assessment:** Not binding for this branch. The attacker and any associates use their own real government IDs (IAL1 passes authentically), the shell company is genuinely registered in Delaware with a real business address and bank account (org registry and verified shipping pass), and the company's own domain email satisfies institutional affiliation. The branch's entire premise is to walk these checks through as a genuine entity with real people, committing real identities rather than forging them.
  >
  > **Bypass methods:** None needed. These measures are satisfied by construction.

- **Why relevant:** Measure 12 is satisfied by construction *because* the branch builds a real LLC bank account whose billing address matches the LLC's registered "institutional" address. The branch engages the measure structurally (it is the reason an LLC bank account is required and a personal card is not used), even though no active bypass is needed.

---

## 7. shell-nonprofit

- **Profile:** purpose-built-organization
- **Target description:** Shell research nonprofit with name-collision trick. The shell needs a real business bank account in the entity's name; pays providers by ACH or card from that account.
- **Persistent supply chain?** Y
- **Bypass excerpts (verbatim):**

  > ### Measure 5: Payment Integrity
  >
  > **Binding assessment:** Soft-binding through bank-account opening friction. The shell needs a business bank account in the entity's name. Fintechs (Mercury, Relay, Brex) are the likely path, but 1–3 denials are expected before a successful opening for a "research institute" with a thin website.
  >
  > **False-negative rate:** 2–8% of legitimate small-entity customers face a name-mismatch friction (fintech BIN sponsor appearing instead of entity name in payment metadata). Most resolved by manual review.
  >
  > #### Open a business bank account and pay normally
  >
  > - **What the attacker does:** Applies to 2–4 fintech banks until one opens an account. Pays providers by ACH or card from that account.
  > - **Expertise:** Novice (Practitioner only if navigating repeated enhanced-due-diligence questions).
  > - **Cost:** $0 in fees.
  > - **Lead-up time:** 1–4 weeks including anticipated denials.
  > - **Attacker trace:** Business bank account in shell name; beneficial owner on file (attacker's real ID, SSN, and signature via bank CIP/CDD — unchanged by FinCEN BOI exemption, since banks collect beneficial-ownership info under separate BSA rules); card payment records tying each order to the shell's account.

- **Why relevant:** Source file explicitly names "fintech BIN sponsor appearing instead of entity name in payment metadata" as the friction surface measure 12 fires on. The branch's bypass is to push through fintech account-opening so the payer name matches the shell.

---

## 8. cro-framing / cro-identity-rotation / biotech-incubator-tenant / community-bio-lab-network / gradual-legitimacy-accumulation

- **Profile:** purpose-built-organization (all five)
- **Target description:** Real US LLC variants (CRO cover story, CRO multiplied across providers, biotech-incubator tenant, community-bio-lab nonprofit, slow-aging hollow biotech). All open a real LLC business bank account whose billing address matches the LLC's registered address by construction.
- **Persistent supply chain?** Y (all)
- **Bypass excerpts (verbatim):**

  cro-framing M5:
  > ### Measure 5 — Payment integrity
  >
  > - **Binding?** No. Real LLC bank account, real card, all under real name.
  > - **FNR:** Estimated <5% — controls are corroborative with manual-review fallback. Best guess.
  > - **Bypass methods:** None needed. Mercury / Relay / Bluevine offer free LLC business banking. Constrained by the bank-account choke point in Measure 3.

  cro-identity-rotation M5:
  > **Binding assessment.** No. Each LLC has a real business bank account opened in the principal's name. Payment-method consistency holds (LLC card matches LLC customer record); no identity-obfuscating payment used.
  >
  > - **Method: LLC business bank account.**
  >   - **What the attacker does:** Opens a business checking account at a major US bank or a startup-focused neobank (Mercury, Brex, Stripe Atlas) using the real LLC paperwork and the attacker's real ID.
  >   - **Caveat — bank-side parallel risk:** A single individual opening 4 LLC bank accounts in short succession matches the AML pattern for "structured shell formation." Banks may file SARs... or close any one of the LLC accounts mid-operation.

  biotech-incubator-tenant M5:
  > **Binding?** No. Payments come from the LLC's business bank account; names match; no anonymous rails are used.
  > **Bypass methods:** None needed.
  > - Attacker trace: Bank KYC records under the principal's identity tied to the LLC; transactions logged by the bank and the synthesis provider's payment processor.

  community-bio-lab-network M5:
  > **Binding?** No. The attacker pays from a real business bank account in the LLC's name. Payer details match registered org details. No identity-obfuscating payment.
  >
  > **Bypass method — LLC business bank account.** Open an account at a fee-free business bank such as Mercury (no monthly fees, no minimum balance).

  gradual-legitimacy-accumulation M5:
  > **Binding?** No. The LLC has a real business bank account (opened at an FDIC bank with EIN, formation documents, and the attacker as signatory). Payments are by ACH or business credit card; the billing address matches the registered address; no crypto or gift cards.

- **Why relevant:** All five branches engage measure 12 structurally — the LLC business bank account exists *so that* the payer name and billing address match the LLC's registered "institution." If providers tightened measure 12 to require the institution to be a recognized life-sciences organization (rather than any LLC), every one of these branches would have to do extra work; under current implementations the measure is satisfied by construction. The cro-identity-rotation entry is the most directly stressed because of the explicit AML "structured shell formation" caveat — banks closing accounts mid-operation would force a substitution path that engages the same measure-12 surface as dormant-account-takeover Bypass D.

---

## Summary

8 entries (the cro-framing / cro-identity-rotation / biotech-incubator-tenant / community-bio-lab-network / gradual-legitimacy-accumulation cluster is one combined entry). Most-directly engaging: dormant-account-takeover, dormant-domain, account-hijack, inbox-compromise, credential-compromise. Structurally engaged but satisfied by construction: shell-company, shell-nonprofit, and the LLC-cluster.
