# Stage 1 Ideation — Measure 12: billing-institution-association (v1)

Goal: confirm the payer's billing instrument (cardholder name, billing address, account-holder name) is associated with the institution claimed on the customer record. Flag when payer != institution.

---

## 1. Stripe Radar AVS + cardholder-name capture

- **summary:** At checkout, run Stripe Payment Intents with `payment_method.billing_details` (name + address). Stripe returns AVS result codes (`address_line1_check`, `address_postal_code_check`) from the issuing bank. Compare returned billing zip + street to the institution's registered address (from ROR / Companies House / SAM.gov record on file). Compare cardholder name token-overlap to institution legal name. Flag mismatch.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** dormant-account-takeover (Bypass D), dormant-domain (Bypass A), inbox-compromise (#1), credential-compromise (cloned-card sub-path)
- **external_dependencies:** Stripe API (Payment Intents, Radar), institutional address-of-record from stage-3 institution registry idea
- **manual_review_handoff:** AVS partial-match (zip ok, street fail) or name-mismatch >40% token distance → review queue. Reviewer checks whether the customer is a known sub-unit, lab P-card under PI's personal name, or genuine personal-card-on-institutional-account. Playbook: if cardholder is listed on institution's ROR/affiliation roster, allow; else require PO or wire from institutional account.
- **flags_thrown:** AVS Z (zip only) → soft flag; AVS N (no match) → hard flag, hold order; cardholder family-name not on institution roster → soft flag.
- **failure_modes_requiring_review:** non-US issuers don't support AVS (most EU banks return `unavailable`); virtual cards from Privacy.com / Capital One Eno return tokenized billing addresses.
- **record_left:** Stripe charge ID + AVS result codes + name-match score archived per order.

## 2. Adyen AVS + Issuer Name response

- **summary:** Same pattern as #1 but via Adyen `/payments` endpoint. Adyen returns `avsResult` plus `issuerCountry`. For non-US cards, falls back to `issuerCountry` consistency vs institution country.
- **modes:** Direct
- **attacker_stories_addressed:** dormant-domain, inbox-compromise, credential-compromise
- **external_dependencies:** Adyen merchant account
- Other fields: see #1.

## 3. Braintree AVS + Account Updater

- **summary:** Use Braintree `Transaction.sale` with `options.creditCard.accountType=business`. Braintree returns `avsStreetAddressResponseCode` and `avsPostalCodeResponseCode`. Cross-check vs institutional address. Use Braintree Account Updater to detect cards reissued to a different name (signal of takeover).
- **modes:** Direct
- **attacker_stories_addressed:** account-hijack, dormant-account-takeover
- Other fields: see #1.

## 4. ROR registered-address cross-check

- **summary:** Look up the customer's claimed institution in the Research Organization Registry (ROR) public API (`https://api.ror.org/organizations`). ROR returns `addresses[]` with city, geonames_id, country. Compare AVS-returned billing zip/city/country against ROR address. Distance-of-match score: same city PASS, same country WARN, different country FAIL.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** dormant-domain (LLC bypass — LLC won't have ROR record), inbox-compromise (driving-distance trick — institution city must match billing city, not just country), shell-company, shell-nonprofit, LLC-cluster
- **external_dependencies:** ROR public API (free, no auth)
- **manual_review_handoff:** "institution not in ROR" → escalate to institution-legitimacy reviewer. "institution in ROR but billing city ≠ ROR city" → escalate to address reviewer with both addresses displayed.
- **flags_thrown:** No ROR record → hard flag (covers all LLC-cluster, shell-nonprofit). City mismatch → soft flag.
- **failure_modes_requiring_review:** ROR address is the HQ; legitimate satellite campuses or remote PIs trip the city check.
- **record_left:** ROR ID + ROR address + billing address + match decision per order.

## 5. GLEIF LEI registered-address lookup

- **summary:** If customer claims a corporate/research entity, look up its Legal Entity Identifier in the GLEIF public API (`https://api.gleif.org/api/v1/lei-records`). Returns `entity.legalAddress` and `entity.headquartersAddress`. Compare to billing address.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** shell-company, shell-nonprofit, LLC-cluster, dormant-domain
- **external_dependencies:** GLEIF public API (free, no auth)
- **manual_review_handoff:** No LEI → flag for non-academic customers; LEI with address mismatch → reviewer compares both.
- **flags_thrown:** LEI exists but billing address country differs → hard flag. No LEI for self-described "research institute" → soft flag (most LLCs lack LEIs unless they trade securities).
- **record_left:** LEI + GLEIF address snapshot.

## 6. Companies House registered-office check (UK entities)

- **summary:** For UK-claimed institutions, query Companies House public API (`https://api.company-information.service.gov.uk/company/{number}`). Returns `registered_office_address`. Compare against billing address. Also returns `company_status` (active/dissolved) and `sic_codes` — flag if SIC is not 72 (R&D) / 86 (health) / similar life-sciences code.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** dormant-domain (UK variants), shell-company (UK), LLC-cluster (if UK Ltd)
- **external_dependencies:** Companies House Free API (key required, free)
- **flags_thrown:** Dissolved company → hard. Address mismatch → hard. Non-life-sciences SIC → soft.
- **record_left:** Companies House number + filing snapshot.

## 7. SAM.gov entity registration cross-check

- **summary:** For US entities (especially CROs, nonprofits, federal grantees), query SAM.gov Entity Management API (`https://api.sam.gov/entity-information/v3/entities`). Returns `physicalAddress` and `mailingAddress` plus `entityRegistration.registrationStatus`, CAGE code, NAICS. Compare physical address to billing address; require active registration for institutions claiming federal grant funding.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** shell-nonprofit, LLC-cluster (CRO-framing), dormant-domain (if claiming federal-grant lineage)
- **external_dependencies:** SAM.gov API (free, key required)
- **flags_thrown:** No SAM registration when customer claims federal grant → hard flag. Address mismatch → soft.
- **record_left:** UEI + SAM record snapshot.

## 8. Google Places address-to-institution geocoding

- **summary:** Geocode the billing address via Google Places API (`/place/findplacefromtext`) with the institution name as the text query. If the top result's `place_id` for the institution name has coordinates within ~2 km of the billing-address geocode, accept; else flag. Catches "drove to a coffee shop in driving distance of the university" pattern.
- **modes:** Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (#1 — driving-distance trick), account-hijack (Method 2 address change), dormant-account-takeover
- **external_dependencies:** Google Places API ($17/1k requests Find Place tier — stage 4 to confirm)
- **flags_thrown:** distance > 5 km between billing geocode and institution-name geocode → soft; > 25 km → hard.
- **failure_modes_requiring_review:** branch campuses, remote-work PIs, international institutions with US billing.
- **record_left:** Both place_ids, distance, decision.

## 9. University procurement-system originator check (PaymentWorks / Jaggaer / Coupa)

- **summary:** When the order is paid via institutional invoice/PO, the PO originates from the institution's procurement system. PaymentWorks, Jaggaer, and Coupa send supplier-onboarding messages from verifiable domains (`*.paymentworks.com`, `*.sciquest.com`, `*.coupahost.com`) and include the institution's verified vendor record. Validate that incoming PO emails come from one of these domains AND the embedded institution-id matches the customer's claimed affiliation.
- **modes:** Attacker-driven
- **attacker_stories_addressed:** dormant-account-takeover (Bypasses A, B, C — inherited PO/invoice), credential-compromise (invoiced order dominant path), account-hijack
- **external_dependencies:** parsing PO emails / EDI; whitelist of procurement-platform sender domains
- **manual_review_handoff:** PO arrives from unrecognized email path → human verifies via callback to AP department phone number listed on institution's public website (NOT phone in email).
- **flags_thrown:** PO email not from known procurement-platform domain → hard. PO budget code changed mid-cycle vs prior orders → soft (catches dormant-takeover Bypass C).
- **record_left:** PO PDF + sender path + procurement-platform validation result.

## 10. ACH originator name match (NACHA company-name field)

- **summary:** For ACH/wire payments, the NACHA file's "Company Name" field (Field 4 of the Company/Batch Header) carries the originator's name as registered with their bank. Pull this field from the payment processor (Stripe ACH, Plaid, Modern Treasury all expose it) and require it to fuzzy-match the claimed institution legal name. Catches the shell-nonprofit "fintech BIN sponsor name appears instead of entity name" friction.
- **modes:** Attacker-driven
- **attacker_stories_addressed:** shell-nonprofit (explicit), LLC-cluster (Mercury/Relay/Brex BIN sponsor name leak), dormant-domain (Mercury LLC bypass)
- **external_dependencies:** ACH processor (Stripe / Modern Treasury / Plaid Transfer)
- **flags_thrown:** Originator name = "Choice Financial Group" / "Evolve Bank & Trust" / "Column NA" (known fintech BIN sponsors) → hard flag, since this leaks Mercury/Brex/Relay sponsorship rather than the customer entity.
- **manual_review_handoff:** Reviewer requests a bank letter on bank letterhead naming the entity as account holder.
- **record_left:** ACH trace + originator name field + decision.

## 11. Purchasing-card (P-Card) BIN range check

- **summary:** Card BIN ranges identify P-card programs (Visa Commercial / Mastercard Corporate). Major institutional P-card issuers (JPMorgan PaymentNet, US Bank Access Online, Bank of America Works, PNC ActivePay) issue cards in known commercial BIN ranges. Use a BIN database (e.g., Bindb.com, binlist.net) to confirm the card is a corporate/purchasing card, then cross-check the issuer-supplied "company name" (passed via Visa Level II/III data fields `purchase_card_company_name`) against institution name.
- **modes:** Attacker-driven
- **attacker_stories_addressed:** dormant-account-takeover (Bypass A — inherited P-card), inbox-compromise (#3 — small-LLC business card detection), credential-compromise
- **external_dependencies:** binlist.net free API or commercial BIN DB; processor that surfaces Level II/III data (Stripe enterprise, Adyen, Worldpay)
- **flags_thrown:** Personal-card BIN on a customer claiming institutional affiliation → soft (legitimate for many small labs but a signal). Commercial BIN with company-name mismatch → hard.
- **record_left:** BIN classification + Level II company-name field.

## 12. Issuer-billing-address cross-check via Plaid Identity

- **summary:** If customer links a bank account via Plaid Auth/Identity for ACH, Plaid Identity returns `owner.names[]` and `owner.addresses[]` from the bank's records. Compare to claimed institution legal name and address. More authoritative than AVS because it's drawn from CIP records, not card-network address tables.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** shell-nonprofit, LLC-cluster, dormant-domain (LLC bypass)
- **external_dependencies:** Plaid Identity product
- **flags_thrown:** Plaid owner name = individual when customer claims institution → hard. Owner address ≠ institution address → soft.
- **record_left:** Plaid Identity payload snapshot.

## 13. Cardholder-name vs institutional roster (PI affiliation cross-check)

- **summary:** Take the cardholder name returned by Stripe/Adyen and check it against the institution's publicly-listed faculty/staff directory or against ORCID's institutional affiliation field for that institution. Catches dormant-account-takeover Bypass D (substituted personal card by a successor whose name isn't on the institution's roster) and account-hijack (PI's roster name != cardholder name on a newly-added card).
- **modes:** Attacker-driven
- **attacker_stories_addressed:** dormant-account-takeover (D), account-hijack, credential-compromise
- **external_dependencies:** ORCID public API (`/v3.0/search?q=affiliation-org-name`), or institutional directory scrape
- **manual_review_handoff:** Cardholder not in roster → email to institution AP at a callback-verified address asking whether this person is authorized.
- **flags_thrown:** Card name not in roster → soft. Card name in roster but department doesn't match prior order history → soft.
- **record_left:** Roster query + match score.

## 14. Billing-vs-shipping address consistency rule

- **summary:** Existing payment-processor field comparison: if billing address country/state ≠ shipping address country/state AND shipping address is a residential address (verified via Smarty / Melissa Data residential-vs-commercial classifier), flag. Catches account-hijack Method 2 (drop ship to attacker apartment).
- **modes:** Attacker-driven
- **attacker_stories_addressed:** account-hijack (explicit — branch source cites "billing/shipping address mismatch alert" as the constraint)
- **external_dependencies:** USPS RDI / Smarty / Melissa Data residential classifier
- **flags_thrown:** Billing institution + shipping residential → hard. Same state, different city → soft.
- **record_left:** Both addresses + RDI classification.

## 15. Mercury / Brex / Relay sponsor-bank denylist for ACH originator

- **summary:** Specific subset of #10. Maintain a denylist of fintech sponsor banks (Choice Financial, Evolve, Column, Lead Bank, Piermont) and their routing numbers. If incoming ACH origin routing number matches the denylist AND the customer claims to be a university/established research institute (not an LLC/startup), flag — universities don't bank at Mercury.
- **modes:** Attacker-driven
- **attacker_stories_addressed:** shell-nonprofit (explicit), LLC-cluster
- **external_dependencies:** Federal Reserve E-Payments Routing Directory (free)
- **flags_thrown:** Sponsor-bank routing + university claim → hard. Sponsor-bank routing + LLC claim → log only.
- **record_left:** Routing number + bank name + customer-type cross-check.

## 16. SOP: name-match consistency tier (the design-intent block)

- **summary:** Codify the "name-match consistency check" the dormant-account-takeover source explicitly names. Tiered playbook: (a) extract cardholder/account-holder legal name from processor; (b) compute Jaro-Winkler similarity to account-holder name on the customer record; (c) if < 0.85 AND no shared family name, hold order and require either a fresh institutional PO or a documented authorization-to-charge from the original account holder. This is the SOP version of the gate Bypass D is designed to trip.
- **modes:** Attacker-driven
- **attacker_stories_addressed:** dormant-account-takeover (D, explicit), account-hijack
- **external_dependencies:** processor name field; in-house name-similarity routine
- **manual_review_handoff:** holds → AP queue; reviewer calls institution AP via callback-verified number.
- **flags_thrown:** similarity < 0.85 → hold.
- **record_left:** similarity score + decision + reviewer notes.

---

## Dropped
(none, iteration 1)
