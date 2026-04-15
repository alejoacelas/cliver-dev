# Stage 1 Ideation — Measure 03 (shipping-po-box) — v1

Measure: Screen shipping address for P.O. Box. Flag triggers: address is a P.O. Box. The mapping file lists exactly one relevant attacker story: `inbox-compromise`, which explicitly nominates "USPS PO Box / hold-for-pickup" as a delivery destination.

Modes used per idea: D = Direct, A = Attacker-driven.

---

## 1. USPS Address Information API — ZIP+4 / address standardization (PO Box detection)

- **Modes:** D, A (inbox-compromise)
- **Summary:** Submit the shipping address to the USPS Web Tools / USPS APIs (Address Validation / ZIP+4 Lookup). The standardized response normalizes "PO BOX 123" / "P.O. Box 123" / "Post Office Box" / "Caller Service" / "Firm Caller" / "PSC" forms into a canonical `PO BOX <n>` secondary unit. The check parses the standardized `Address1`/`Address2` for `PO BOX`, `BOX`, `POB`, `CALLER`, `PSC`, `UNIT` patterns matching USPS PO Box conventions, plus delivery point ZIP codes that USPS publishes as PO-Box-only ZIPs.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** USPS Web Tools API (registered USPS Web Tools userid). [best guess] endpoint family: `secure.shippingapis.com/ShippingAPI.dll?API=Verify` and the newer USPS APIs (`apis.usps.com`).
- **manual_review_handoff:** When match found, ticket goes to KYC reviewer with playbook: contact customer per measure 03 follow-up wording ("Do you have an institutional affiliation? Where are you working with the sequences?"); require an alternate non-PO-Box street address tied to the institution before release.
- **flags_thrown:** `shipping_address_is_po_box` → review. `address_unverifiable_by_usps` → review (could be foreign or malformed). `psc_or_caller_service_box` → review (military/firm boxes).
- **failure_modes_requiring_review:** USPS API timeout/5xx; address not found; address standardized but secondary unit ambiguous; non-US address (USPS only validates US).
- **record_left:** Stored USPS API request/response JSON with timestamp, standardized address, and PO-Box flag, retained per audit policy.
- Other fields: # stage 4

---

## 2. Smarty (formerly SmartyStreets) US Street Address API — `dpv_match_code` + `record_type` = `P` (PO Box)

- **Modes:** D, A (inbox-compromise)
- **Summary:** Smarty's US Street Address API returns a `record_type` field with values including `S` (street), `H` (highrise), `P` (PO Box), `R` (rural route), `F` (firm), `G` (general delivery). Flagging `record_type = P` (and optionally `G`) catches PO boxes regardless of how the customer formatted the address. Smarty also returns CMRA flags (see separate idea) and DPV (Delivery Point Validation) match codes from USPS data.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** Smarty US Street API (account + auth-id/auth-token). [best guess] endpoint: `us-street.api.smarty.com/street-address`.
- **manual_review_handoff:** Same playbook as idea 1 (require institutional street address).
- **flags_thrown:** `record_type=P` → block-pending-review. `record_type=G` (general delivery) → review. `record_type=R` (rural route) → soft flag, often legitimate.
- **failure_modes_requiring_review:** API down; address unparseable; international address (Smarty US endpoint only — would need their International Street API).
- **record_left:** Stored API response including record_type, dpv_match_code, footnotes.

---

## 3. Lob US Verifications API — `deliverability` + `components.address_type` = `po_box`

- **Modes:** D, A (inbox-compromise)
- **Summary:** Lob's US address verification returns parsed components including an `address_type`/`record_type` field whose values include `po_box`, `street`, `highrise`, `firm`, `general_delivery`, `rural_route`. Provider rejects/flags `po_box` and `general_delivery`. Lob also exposes a CMRA indicator.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** Lob US Verifications API (live API key). [best guess] endpoint: `api.lob.com/v1/us_verifications`.
- **manual_review_handoff:** Same as idea 1.
- **flags_thrown:** `address_type=po_box` → review; `deliverability=undeliverable` → review.
- **failure_modes_requiring_review:** API errors; `deliverability_analysis` ambiguous; non-US.
- **record_left:** Lob verification ID + JSON payload retained.

---

## 4. Melissa Global Address Verification — Address Type = "P" / `AddressTypeCode`

- **Modes:** D, A (inbox-compromise)
- **Summary:** Melissa's Global Address (and US-specific Personator) returns `AddressTypeCode` ("S","H","P","R","F","G") plus result codes like `AS09` (PO Box), `AS10` (Highrise), `AS11` (Rural Route), `AS12` (General Delivery). Provider keys off `P`/`AS09` (and optionally `G`/`AS12`) to flag.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** Melissa Personator / Global Address Verification API (license key). [best guess] endpoint: `personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify`.
- **manual_review_handoff:** Same as idea 1.
- **flags_thrown:** `AS09` (PO Box) → review; `AS12` (General Delivery) → review.
- **failure_modes_requiring_review:** Result code unknown; license throttled.
- **record_left:** Melissa transaction ID + result codes stored.

---

## 5. Google Maps Address Validation API — `addressComponents.componentType = "post_box"` / `usps_data.dpvCmra`

- **Modes:** D
- **Summary:** Google's Address Validation API (GA 2023) returns USPS-derived data for US addresses including `usps_data.standardizedAddress`, `dpvFootnotes`, and a `dpvCmra` flag, plus a structured `addressComponents` list whose `componentType` includes `post_box` for PO Box addresses. Use `post_box` and USPS DPV footnotes (e.g., `H0` highrise vacant, `PB` PO Box) to flag.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** Google Cloud project, Address Validation API enabled. [best guess] endpoint: `addressvalidation.googleapis.com/v1:validateAddress`.
- **manual_review_handoff:** Same as idea 1.
- **flags_thrown:** `post_box` component present → review.
- **failure_modes_requiring_review:** Quota exhaustion; non-US (validation works internationally but USPS-derived flags only US).
- **record_left:** Validation response with verdict + USPS data block.

---

## 6. Regex / SOP pre-filter against the order form's `address1`/`address2` strings

- **Modes:** D
- **Summary:** Cheap front-line SOP run before paid API: case-insensitive regex on the customer-supplied address strings for `\bP[\.\s]?O[\.\s]?\s*BOX\b`, `\bPOST(\s|AL)?\s*OFFICE\s*BOX\b`, `\bP\.?O\.?B\b`, `\bBOX\s+\d+\b` (when no street number), `\bCALLER\s+SERVICE\b`, `\bFIRM\s+CALLER\b`, `\bPSC\s+\d+`, `\bUNIT\s+\d+\s+BOX\s+\d+` (APO/FPO/DPO military), `\bGENERAL\s+DELIVERY\b`, plus non-English equivalents (`Apartado Postal`, `Boîte Postale`, `Postfach`, `Casella Postale`, `Caixa Postal`). Forwards remaining ambiguous strings to a paid validator. Catches obvious PO boxes even when validators are down or address is foreign.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** None (in-house regex library; SOP doc).
- **manual_review_handoff:** Hit → reviewer asks for street address per measure 03 follow-up wording.
- **flags_thrown:** `regex_po_box_hit` → review.
- **failure_modes_requiring_review:** False positives like "BOX HILL" street name; non-Latin scripts.
- **record_left:** Regex match log entry (matched substring + rule id) per order.

---

## 7. USPS PO-Box-only ZIP code list cross-check

- **Modes:** D
- **Summary:** USPS publishes/reflects in its data files a set of ZIPs whose delivery type is exclusively PO Box (so-called "PO Box-only ZIPs"). Provider maintains a list (refreshed from USPS data or a vendor like Smarty/Melissa who already exposes the indicator) and flags any address whose ZIP is in the list, regardless of street-line content. Catches the case where the attacker writes a fake street line but uses the PO-Box-only ZIP.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** USPS City State Product / Smarty `zipcodes` endpoint. [best guess] data source: USPS "City State Product" data file (subscription) or Smarty's ZIP API.
- **manual_review_handoff:** Hit → reviewer requests street address with non-PO-Box ZIP.
- **flags_thrown:** `zip_is_po_box_only` → review.
- **failure_modes_requiring_review:** Some PO-Box-only ZIPs serve legitimate small towns; reviewer must confirm.
- **record_left:** ZIP + lookup-table version stored.

---

## 8. CMRA flag via USPS Form 1583 list / vendor `cmra` indicator (adjacent to PO box, included for completeness)

- **Modes:** D, A (inbox-compromise — note: the bypass excerpt mentions "PO Box / hold-for-pickup," and hold-for-pickup at a CMRA functions identically)
- **Summary:** Smarty, Lob, Melissa, and Google all expose a CMRA (Commercial Mail Receiving Agency, USPS Form 1583) flag derived from USPS data. While CMRAs are not PO boxes per se, they serve the same identity-concealment function the measure cares about, and the inbox-compromise bypass note specifically pairs PO Box with hold-for-pickup. Provider flags CMRA-positive addresses under the same SOP as PO boxes.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** USPS CMRA list (consumed via Smarty `cmra=Y`, Lob `record_type=...` + cmra flag, Google `dpvCmra`).
- **manual_review_handoff:** Same playbook.
- **flags_thrown:** `cmra=true` → review.
- **failure_modes_requiring_review:** CMRA list is opt-in / lagging; some legitimate small businesses use CMRAs.
- **record_left:** Vendor response with CMRA bit retained.

---

## 9. APO/FPO/DPO military mail detection (PSC / Unit / Box patterns)

- **Modes:** D
- **Summary:** Military mail addresses use `PSC <n> Box <n>` or `Unit <n> Box <n>` with state codes `AA`/`AE`/`AP` and ZIPs in the 09xxx / 962xx-966xx ranges. Functionally equivalent to PO Boxes for the identity-verification purpose; should be flagged for the institutional-affiliation follow-up (DoD lab affiliation, etc.). USPS APIs return these as deliverable but distinguishable.
- **attacker_stories_addressed:** [none — gap-filler; not directly tied to inbox-compromise]
- **external_dependencies:** USPS Web Tools (state code + ZIP range list).
- **manual_review_handoff:** Hit → reviewer confirms DoD/military lab affiliation.
- **flags_thrown:** `state in {AA,AE,AP}` or `zip in military_ranges` → review.
- **failure_modes_requiring_review:** Legitimate military researchers; reviewer needs domain context.
- **record_left:** Flag + ZIP/state stored.

---

## 10. International poste restante / general delivery / Postfach detection

- **Modes:** D
- **Summary:** For non-US shipping addresses, the USPS-based vendors give no `record_type`. Use a pre-filter dictionary of equivalent terms — German `Postfach`, French `Boîte postale` / `BP`, Spanish `Apartado de Correos` / `Apdo.`, Italian `Casella postale`, Portuguese `Caixa postal`, Dutch `Postbus`, Japanese `郵便私書箱` / `private box`, "Poste Restante" / "General Delivery" — and flag matches before handoff to an international validator (e.g., Loqate, Smarty International, Melissa Global Address) which may also expose a `box`-type indicator.
- **attacker_stories_addressed:** inbox-compromise (the small-college-inbox attacker is plausibly outside the US)
- **external_dependencies:** Internal dictionary; optionally Loqate / Smarty International / Melissa Global Address.
- **manual_review_handoff:** Hit → reviewer requests street address.
- **flags_thrown:** `intl_box_term_hit` → review.
- **failure_modes_requiring_review:** Legitimate street names containing these substrings; transliteration.
- **record_left:** Match log entry per order.

---

## Coverage notes

- The mapping file has only one attacker story (`inbox-compromise`), and the bypass it names ("USPS PO Box / hold-for-pickup, $5–$25/mo") is straightforwardly addressed by ideas 1–8. Hold-for-pickup at a CMRA (idea 8) is the natural extension. Ideas 9 and 10 exist to close obvious sibling gaps (military mail, foreign equivalents) that the mapping file does not enumerate but that the measure plainly intends to cover.
