# m17-positive-verification-sop — implementation v2

- **measure:** M17 (pre-approval-list)
- **name:** Annual positive-verification SOP — with independent-contact mandate and counter-party institutional email verification
- **modes:** D
- **summary:** A documented SOP that requires every pre-approved entity to be re-verified on an annual cadence (or sooner if event-triggered). v2 addresses the Critical finding (C1) that positive-confirmation is self-confirmable by attacker-controlled contacts. The fix adds: (1) an independent-contact mandate requiring the provider to look up the contact via an independent channel (switchboard, IBC-RMS, institutional directory) rather than using a customer-provided contact; (2) counter-party institutional email verification requiring the confirmation to originate from a DMARC-aligned institutional email domain independently confirmed to belong to the institution.

## Changes from v1 addressing Critical Finding C1 (self-confirmation by attacker-controlled contacts)

**C1 said:** The SOP sends outreach to "the institutional contact on file." For purpose-built-organization branches, that contact is the attacker or their accomplice. For account-hijack/credential-compromise branches, the attacker controls the contact's inbox. The positive-confirmation reply is affirmative and the SOP has no mechanism to verify the contact's independence from the entity's actual operator.

**v2 response — two hardening layers:**

### Layer 1: Independent-contact mandate

The SOP now mandates that the positive-confirmation request must be sent to a contact obtained through an **independent channel**, not a customer-provided contact. "Independent" means: the provider obtains the contact information from a source the customer does not control.

**Independent contact sources (in priority order):**

1. **IBC-RMS roster (US NIH-funded institutions):** The NIH IBC Registration Management System publicly posts IBC chair, BSO contact, and IBC contact email. These are maintained by the institution's administration, not by the customer. The provider looks up the institution in IBC-RMS and contacts the listed BSO or IBC chair. [source](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/)

2. **Institutional switchboard/directory lookup:** For institutions not in IBC-RMS (non-US, non-academic, non-NIH-funded), the provider looks up the institution's main telephone switchboard number from the institution's official website (verified via domain match to the customer's claimed institutional domain) or from a public directory. The provider calls the switchboard and asks to be connected to the biosafety office, sponsored programs office, or the named department. The provider then confirms the customer's affiliation and authorization via this independently-reached contact. [best guess: this is standard practice in financial-services enhanced due diligence (EDD) for high-risk beneficial owners — the "callback to a publicly available number, not the number provided by the customer" principle is well-established in AML/KYC guidance; see [AUSTRAC customer identification guidance](https://www.austrac.gov.au/business/core-guidance/customer-identification-and-verification/customer-identification-know-your-customer-kyc) on independent verification of customer information].

3. **Public faculty/staff directory:** For academic institutions, the provider looks up the customer's named PI or authorized signer in the institution's public faculty/staff directory (typically at `{institution-domain}/directory` or via Google site-restricted search). The provider contacts the PI at the directory-listed email address, not the email the customer provided. This catches account-hijack scenarios where the attacker controls the PI's inbox but has not compromised the institution's directory listing.

4. **Companies House / corporate registry officer lookup (UK/equivalents):** For UK corporate entities, the provider can look up the registered officers and their correspondence addresses via Companies House. The provider contacts a registered officer directly. [source](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/officers)

**Operational rule:** The SOP explicitly prohibits using any contact information provided by the customer being re-verified. The contact must be independently sourced. If no independent contact can be identified for an entity, the re-verification fails and the entity's pre-approval is suspended pending a higher-touch verification (e.g., in-person site visit, m20-live-video-attestation with the entity principal).

### Layer 2: Counter-party institutional email verification

When the positive-confirmation reply arrives by email, the SOP now requires:

1. **DMARC alignment check:** The reply email must pass DMARC validation for the institutional domain. This prevents the attacker from spoofing a reply from the institutional domain. Most major academic and research institutions enforce DMARC (`p=reject` or `p=quarantine`) on their domains [best guess: >70% of US R1 universities have DMARC enforcement as of 2025, based on the general trend of DMARC adoption in higher education driven by federal email security mandates].

2. **Domain verification against independent source:** The email domain of the replying contact must match the institution's domain as recorded in ROR, IBC-RMS, or the institution's official website — not as provided by the customer. This prevents the attacker from claiming an institution with a domain they control (e.g., a shell entity's domain) and then replying from that domain.

3. **Two-contact requirement for purpose-built organizations:** For entities that are not established academic/government institutions (i.e., commercial entities, LLCs, new organizations <3 years old, entities with no IBC-RMS record), the SOP requires positive confirmation from **two independent contacts** at the institution, obtained via different independent channels (e.g., one from the corporate registry officer list, one from a switchboard callback). This raises the cost for an attacker who controls one contact but may not control two independently-sourced contacts.

**Structural limitation acknowledged:** For purpose-built organizations where the institution *is* the shell (and therefore the attacker controls the switchboard, the website, the domain, and all officers), independent-contact verification collapses — all "independent" channels lead back to the attacker. The two-contact requirement for non-established entities provides a speed bump but not a hard block. The SOP documents this as a known structural gap for the purpose-built-organization attacker class; other ideas (m18 institution-legitimacy checks, m09 entity-verification) must fill this gap.

## external_dependencies

Same as v1, plus:
- Public faculty/staff directories at academic institutions (web lookup).
- Institutional switchboard phone numbers (web lookup or directory service).
- Companies House officers API (for UK entities) [source](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/officers).
- DMARC validation library or email gateway with DMARC reporting (e.g., provider's existing email infrastructure; most enterprise email gateways include DMARC validation).

## endpoint_details

Same as v1 for IBC-RMS and sanctions delta.

- **Companies House officers endpoint (new):** `https://api.company-information.service.gov.uk/company/{company_number}/officers` — returns list of current and resigned officers with name, role, appointment date, and correspondence address. Same auth and rate limits as the main Companies House API.

- **DMARC validation:** No external endpoint — checked at the receiving mail server. Provider's email gateway should log DMARC results (pass/fail/none) for inbound emails; the SOP reviews these logs for the confirmation reply.

## fields_returned

Same as v1, plus:

**From independent-contact lookup:**
- Contact source (IBC-RMS / switchboard / faculty directory / corporate registry)
- Contact name, title, email, phone (as obtained from the independent source)
- Timestamp and method of contact lookup
- Whether the contact is the same as or different from the customer-provided contact (flag if same — this is expected for legitimate entities but notable)

**From DMARC validation:**
- DMARC result (pass / fail / none) for the confirmation reply email
- SPF and DKIM alignment details
- Sending domain vs. claimed institutional domain

## marginal_cost_per_check

- v1 estimate: $50-$100 per entity per year (30-60 min analyst time).
- **v2 increase:** The independent-contact lookup adds ~15-30 min per entity (switchboard call, directory lookup, source documentation). Revised estimate: **$75-$150 per entity per year** [best guess: 45-90 min at $100/hr fully loaded]. The two-contact requirement for non-established entities doubles the contact-verification portion for that subset.
- IBC-RMS lookup, DMARC validation: $0 marginal.
- **setup_cost:** Same as v1 ($10K-$30K), plus ~$5K for DMARC validation integration and independent-contact-lookup SOP documentation. Total: **$15K-$35K**.

## manual_review_handoff

Updated from v1:

1. **30 days before due date:** Workflow tool opens re-verification ticket. **Analyst first identifies the independent contact** — looks up IBC-RMS, then switchboard, then faculty directory, then corporate registry. Documents the source.
2. **Analyst sends positive-confirmation request** to the independently-sourced contact (NOT to any customer-provided contact).
3. **At due date:** If no reply, send second attempt via different channel (e.g., if email failed, try phone callback to switchboard).
4. **Due date + 30 days:** If still no positive confirmation, auto-suspend.
5. **On reply received:** Analyst checks DMARC alignment of the reply email. Runs sanctions delta. Runs IBC-RMS check. If DMARC fails or the domain doesn't match, treat as a failed confirmation.
6. **For non-established entities (two-contact requirement):** Both contacts must independently confirm. If only one confirms, escalate to senior reviewer.
7. **Event-triggered re-verification:** Same as v1.

## flags_thrown

Same as v1, plus:
- `reverification_contact_not_independent` — analyst could not identify an independent contact for the entity (no IBC-RMS, no public directory, no switchboard). Action: suspend; escalate to higher-touch verification.
- `reverification_dmarc_fail` — confirmation reply email failed DMARC validation. Action: treat as unconfirmed; re-attempt via phone callback.
- `reverification_domain_mismatch` — reply email domain does not match the institution's domain from independent sources. Action: treat as unconfirmed; escalate.
- `reverification_two_contact_partial` — for non-established entities, only one of two required contacts confirmed. Action: senior reviewer escalation.

## failure_modes_requiring_review

Same as v1, plus:
- **Independent contact unreachable but entity is legitimate.** Small institutions may not have a public switchboard or directory. The provider must decide whether to accept a customer-provided contact with additional scrutiny or suspend. The SOP documents this as a case for senior reviewer judgment.
- **DMARC not enforced by institution.** Some institutions (especially non-US) do not enforce DMARC. The DMARC check returns `none`. The SOP treats this as a weaker (but not failed) confirmation — log the gap, proceed with phone callback as supplementary channel.
- **Switchboard callback logistics.** International callbacks involve timezone coordination and potentially language barriers. The SOP should specify a 3-business-day window for callback attempts before escalating.
- **Two-contact requirement for legitimate new entities.** New legitimate biotech startups may have only 1-2 people, making two independent contacts impossible. The SOP should specify a fallback: for entities with <5 employees (per corporate registry), accept one independent contact plus one additional corroborating signal (e.g., m18-gleif registration, m09-corp-registry presence, m20-live-video-attestation).

## false_positive_qualitative

Same as v1, plus:
- **Institutions whose switchboard does not route to biosafety/sponsored-programs** (common in non-US institutions and industry).
- **Institutions without DMARC enforcement** (reply flagged as DMARC-none, creating friction).
- **Legitimate new entities** with few employees unable to provide two independent contacts.

## record_left

Same as v1, plus:
- Independent contact source documentation (IBC-RMS snapshot, directory screenshot, switchboard call log with timestamp).
- DMARC validation result for the confirmation reply.
- For two-contact entities: both contact sources and both confirmation artifacts.
- `contact_independence_verified: true/false` flag per re-verification cycle.

## Sourcing notes

- The "callback to independently obtained number" principle is a well-established AML/KYC enhanced due diligence practice. AUSTRAC's customer identification guidance states that customer information should be verified using "reliable and independent documents" or "reliable and independent electronic data" [source](https://www.austrac.gov.au/business/core-guidance/customer-identification-and-verification/customer-identification-know-your-customer-kyc). The financial-services analogue is the requirement to call a customer back on a publicly listed phone number rather than a number the customer provides, used for high-risk transactions. [best guess: this principle is not formally codified in a single regulation but is considered best practice across multiple AML/KYC frameworks]
- DMARC adoption in higher education has been driven by federal mandates (BOD 18-01 for .gov domains; Google/Yahoo 2024 sender requirements for bulk email) and is generally high among US R1 universities. [best guess: >70% enforcement rate for US R1 universities as of 2025; lower for non-US institutions]
- IBC-RMS public roster per [NIH OSP IBC FAQs](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/) and [CITI Program 2024 summary](https://about.citiprogram.org/blog/nih-reinforces-transparency-in-biosafety-oversight-with-new-ibc-requirements/).
