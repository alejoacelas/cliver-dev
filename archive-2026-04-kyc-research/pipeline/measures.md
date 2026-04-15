# Measures

Parsed from the "Practices and processes for a minimal KYC standard" table on the Minimal Standard tab of the [CSSWG meeting #2 doc](https://docs.google.com/document/d/11eBx9w7YKkTVoSzuxleD_2I9d9HO7SADLz7WBDsN-tk/edit?tab=t.0). This is the canonical measure list for the pipeline. Each measure is one row of the table; the "Removed: Payment method" row is excluded.

Each measure has a stable number and slug. Use these everywhere in the pipeline (stage 0 mapping files, stage 1 ideation outputs, idea slugs in stage 3).

Field meanings:
- **Practice** — what information the provider collects
- **Screening process** — how providers use/screen that information (this is the operative content for ideation)
- **Purpose** — why
- **Applies to** — All orders / SOC orders only
- **Flag triggers** — what providers are looking for
- **Threats mitigated** — who might be stopped
- **Follow-up** — what providers do with flags
- **Auditable** — Y / blank

---

## 01 — sanctions-name-screen

- **Practice:** Full name
- **Screening process:** Screen name against applicable lists of designated persons.
- **Purpose:** Establish customer identity
- **Applies to:** All orders
- **Flag triggers:** Name appears on national or UN sanctions lists
- **Threats mitigated:** Honest bad actor
- **Follow-up:** Direct follow-up re: name collision
- **Auditable:** Y

---

## 02 — email-affiliation-whois

- **Practice:** Email
- **Screening process:** Check email address for match with the customer's institutional affiliation. Domain WHOIS lookup; confirm domain matches known institutional domains; confirm address is institutional.
- **Purpose:** Verify customer identity; verify customer affiliation
- **Applies to:** All orders
- **Flag triggers:** Email does not match institution domain; non-institutional domain (e.g., gmail)
- **Threats mitigated:** Honest naive actor (DIY); fabricated identity (falsely claim affiliation)
- **Follow-up:** Direct follow-up re: institutional affiliation
- **Auditable:** Y

---

## 03 — shipping-po-box

- **Practice:** Shipping address
- **Screening process:** Screen shipping address for P.O. Box.
- **Purpose:** Verify customer identity
- **Applies to:** All orders
- **Flag triggers:** Address is a P.O. Box
- **Threats mitigated:** Fabricated (or concealed) identity
- **Follow-up:** Direct follow-up re: institutional affiliation (e.g., "Do you have an institutional affiliation? Where are you working with the sequences?")
- **Auditable:** Y

---

## 04 — shipping-residential

- **Practice:** Shipping address
- **Screening process:** Screen shipping address for residential address.
- **Purpose:** Verify customer identity
- **Applies to:** All orders
- **Flag triggers:** Address is residential
- **Threats mitigated:** Honest naive actor (DIY); honest bad actor
- **Follow-up:** Direct follow-up re: institutional affiliation (same wording as 03)
- **Auditable:** Y

---

## 05 — shipping-institution-association

- **Practice:** Shipping address
- **Screening process:** Screen shipping address for association with institutional affiliation.
- **Purpose:** Verify customer identity
- **Applies to:** All orders
- **Flag triggers:** No public association between affiliation and shipping address
- **Threats mitigated:** Fabricated identity
- **Follow-up:** Follow-up only if any other flag raised
- **Auditable:** (blank)

---

## 06 — shipping-export-country

- **Practice:** Shipping address
- **Screening process:** Screen shipping address for countries subject to broad (not just SOC) export restrictions.
- **Purpose:** Verify customer legitimacy
- **Applies to:** All orders
- **Flag triggers:** Shipping address in country subject to local comprehensive sanctions or export restrictions
- **Threats mitigated:** (unspecified)
- **Follow-up:** Deny
- **Auditable:** Y

---

## 07 — institution-affiliation-low-scrutiny

- **Practice:** Institution
- **Screening process:** Check that customer is affiliated with their listed institution (low scrutiny). E.g., the customer's email domain matches their listed institution; customer is shown on the institution's website.
- **Purpose:** Verify customer identity
- **Applies to:** All orders
- **Flag triggers:** Customer cannot demonstrate any ties to the institution
- **Threats mitigated:** Fabricated legitimacy
- **Follow-up:** Direct follow-up
- **Auditable:** (blank)

---

## 08 — institution-denied-parties

- **Practice:** Institution
- **Screening process:** Screen the institution against national or UN denied parties list.
- **Purpose:** Verify customer legitimacy
- **Applies to:** All orders
- **Flag triggers:** Institution on national or UN denied parties list
- **Threats mitigated:** Honest bad actor
- **Follow-up:** Deny
- **Auditable:** Y

---

## 09 — institution-real-life-sciences

- **Practice:** Institution
- **Screening process:** Verify the institution is real and relevant to life sciences. E.g., confirm org exists via corporate registry or legal ID; check address.
- **Purpose:** Legitimacy
- **Applies to:** All orders
- **Flag triggers:** Institution is fabricated (e.g., org has no legal entity or discoverable history on third-party websites)
- **Threats mitigated:** Fabricated legitimacy
- **Follow-up:** Direct follow-up
- **Auditable:** Y

---

## 10 — payment-bin-giftcard

- **Practice:** Payment method
- **Screening process:** Check purchasing card's Bank Identification Number (BIN) to identify gift cards.
- **Purpose:** Verify customer identity
- **Applies to:** SOC orders
- **Flag triggers:** Payment method can be used to obscure identity (e.g., crypto, gift card)
- **Threats mitigated:** Fabricated (or concealed) identity
- **Follow-up:** Direct follow-up
- **Auditable:** Y

---

## 11 — payment-no-crypto

- **Practice:** Payment method
- **Screening process:** Do not accept cryptocurrency for payment.
- **Purpose:** Verify customer identity and legitimacy
- **Applies to:** All orders
- **Flag triggers:** Customer attempts to pay with crypto
- **Threats mitigated:** Fabricated (or concealed) identity
- **Follow-up:** Deny
- **Auditable:** Y

---

## 12 — billing-institution-association

- **Practice:** Payment method
- **Screening process:** Screen billing address for association with institutional affiliation.
- **Purpose:** Verify customer identity
- **Applies to:** All orders
- **Flag triggers:** Billing address not associated with the institution
- **Threats mitigated:** Fabricated identity
- **Follow-up:** Direct follow-up
- **Auditable:** Y

---

## 13 — phone-voip-check

- **Practice:** Phone number
- **Screening process:** Check phone number for VoIP.
- **Purpose:** Verify customer identity
- **Applies to:** All orders
- **Flag triggers:** Phone number is VoIP
- **Threats mitigated:** Fabricated (or concealed) identity
- **Follow-up:** Follow-up only if any other flag raised
- **Auditable:** Y

---

## 14 — identity-evidence-match

- **Practice:** Collect evidence to verify customer identity (per the document's other tab — NIST 800-63 IAL or GPG 45 score; can be performed by the provider or a third-party identity verification provider).
- **Screening process:** Match provided evidence with provided customer information.
- **Purpose:** Verify customer identity
- **Applies to:** SOC orders
- **Flag triggers:** Refusal to provide information; mismatch between provided information and identity evidence
- **Threats mitigated:** Fabricated identity
- **Follow-up:** Refusal → deny. Mismatch → direct follow-up; if concerns not addressed, report.
- **Auditable:** Y

---

## 15 — soc-self-declaration

- **Practice:** For each order, ask customer if their order contains a SOC. If yes, ask for intended use.
- **Screening process:** Verify customer declaration aligns with output of sequence screening.
- **Purpose:** Verify customer legitimacy
- **Applies to:** All orders
- **Flag triggers:**
  - Customer declares SOC; screening finds none → honest naive actor
  - Customer does not declare SOC; screening finds SOC → honest naive actor / insider threat / fabricated legitimacy
- **Threats mitigated:** (see flag triggers)
- **Follow-up:** First case: human review; process order unless other flags. Second case: conduct follow-up as normal when SOC is identified, with the failure-to-declare as a piece of information to inform decision-making.
- **Auditable:** (blank)

---

## 16 — mfa-stepup

- **Practice:** Enable multi-factor authentication (when customer portals are used)
- **Screening process:** When sequence screening identifies a SOC, confirm that MFA has been turned on for that account (step-up authentication).
- **Purpose:** Customer authentication
- **Applies to:** SOC orders
- **Flag triggers:** MFA is not enabled; repeated MFA failures
- **Threats mitigated:** Credential theft
- **Follow-up:** Direct customer outreach: "Your order cannot be processed until MFA is enabled for your account."
- **Auditable:** Y

---

## 17 — pre-approval-list

- **Practice:** For each SOC order, document evidence of legitimacy.
- **Screening process:** Screen customer against any existing pre-authorized / pre-approved lists or designations, and/or against previous company records for past SOC orders and outcomes.
- **Purpose:** Customer legitimacy
- **Applies to:** SOC orders
- **Flag triggers:** A lack of pre-approval does not raise a "flag," but indicates the provider must verify legitimacy by an alternative mechanism.
- **Threats mitigated:** Pre-approval facilitates access for good actors. The process of screening for pre-approval does not stop specific bad actors.
- **Follow-up:** Attempt to verify customer's legitimacy through institution- or individual-based mechanisms (see measures 18, 19; may or may not require direct follow-up).
- **Auditable:** (blank)

---

## 18 — institution-legitimacy-soc

- **Practice:** For each SOC order, document evidence of legitimacy.
- **Screening process:** Institution-based legitimacy.
  - Confirm that customer is affiliated with institution (verify institutional email domain; check organization webpage or directory; search publications).
  - Confirm institution is legitimate (e.g., legally registered, government approvals, clear life sciences connection).
- **Purpose:** Customer legitimacy
- **Applies to:** SOC orders
- **Flag triggers:** Cannot confirm affiliation and/or institutional legitimacy
- **Threats mitigated:** Fabricated legitimacy (e.g., claim false affiliation with real institution or claim affiliation with fake institution)
- **Follow-up:** Attempt to verify customer's legitimacy through individual- or voucher-based mechanisms (measures 19, 20).
- **Auditable:** Y

---

## 19 — individual-legitimacy-soc

- **Practice:** For each SOC order, document evidence of legitimacy.
- **Screening process:** Individual-based legitimacy.
  - Confirm individual is legitimate user of SOC (e.g., relevant grants awarded to customer, publication history, previous affiliations, biosafety committee approval).
  - Confirm that the customer is affiliated with an institution with a life sciences mission.
- **Purpose:** Customer legitimacy
- **Applies to:** SOC orders
- **Flag triggers:** Cannot confirm individual's legitimacy for SOC, and/or cannot confirm customer affiliation with some life-sciences-related institution
- **Threats mitigated:** Fabricated legitimacy; honest naive actor (illegitimate user of SOC); insider threat (e.g., affiliation is real but role is irrelevant)
- **Follow-up:** Attempt to verify legitimacy through institution- or voucher-based mechanisms (measures 18, 20).
- **Auditable:** Y

---

## 20 — voucher-legitimacy-soc

- **Practice:** For each SOC order, document evidence of legitimacy.
- **Screening process:** Voucher-based legitimacy. Provider sends a standardized voucher to the referent which includes:
  - i) the referent's relationship to customer; referent may not be junior to customer.
  - ii) years working together; relationship length must be ≥ 1 year (12 months).
  - iii) SOC the customer is ordering or is anticipated to order; referent can indicate whether their voucher is for a single SOC, a taxa, or broader. The provider can use this as evidence of legitimacy for subsequent SOC orders.
  - iv) assessment of whether the SOC request is necessary for research; can be short, even one or two sentences.
  - v) "vouch."
  Confirm the institution-based legitimacy of the referent. Confirm the identity of the voucher with STRONG evidence.
- **Purpose:** Customer legitimacy
- **Applies to:** SOC orders
- **Flag triggers:** Voucher does not demonstrate legitimacy because:
  - i) customer is senior to referent
  - ii) relationship < 1 year
  - iii) SOC listed by referent is not aligned with customer order
  - iv) no — or insufficient — assessment of need for SOC
  - v) level of trust is below 6
- **Threats mitigated:** Fabricated legitimacy; fabricated identity; honest naive actor; honest bad actor
- **Follow-up:** Direct customer follow-up and/or deny order
- **Auditable:** (blank)

---

## Notes

- **Excluded row:** "Removed: Payment method — Check that billing name is consistent with stated identity and/or affiliation." Marked as removed in the source table.
- **Identity-evidence detail (measure 14):** the source document's "Resources: Verify Identity" tab gives the NIST 800-63 IAL1/IAL2 and GPG45 score-1/score-2 definitions that constrain what counts as FAIR / STRONG / SUPERIOR evidence. Stage 4 research for any idea under measure 14 should consult those definitions.
- **Legitimacy resources (measures 18, 19, 20):** the source document's "Resources: Verify Legitimacy" tab lists starting points: GLEIF, Ringgold, ROR, Companies House (UK), Charity Commission (UK), InCommon / eduroam, GA4GH passports, UK Office for Digital Identities and Attributes voucher guidance. Stage 1 ideation for these measures should treat that list as a starting point but not a ceiling.
- **Measure groupings for stage 0 (≤4 per agent):** suggested batching:
  - Batch A: 01, 02, 07, 08 (name + email + low-scrutiny affiliation + denied parties)
  - Batch B: 03, 04, 05, 06 (shipping address checks)
  - Batch C: 09, 10, 11, 12 (institution legitimacy + payment)
  - Batch D: 13, 14, 15 (phone + identity evidence + SOC declaration)
  - Batch E: 16, 17 (MFA + pre-approval)
  - Batch F: 18, 19, 20 (the three legitimacy mechanisms — closely related, group together)
