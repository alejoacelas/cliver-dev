# m03-usps-rdi-cmra

- **measure:** M03
- **name:** USPS RDI + CMRA flag
- **modes:** D
- **summary:** Submit shipping address to USPS Address Information API (or licensed reseller) and capture the Residential Delivery Indicator (RDI) and CMRA (Commercial Mail Receiving Agent) flag. CMRA = PO-box-equivalent for KYC purposes.
- **attacker_stories_addressed:** po-box-shipping, cmra-shipping
- **external_dependencies:** USPS Web Tools / licensed CASS reseller.
- **flags_thrown:** address_is_cmra; address_is_po_box
- **manual_review_handoff:** Reviewer escalates CMRA.
- **failure_modes_requiring_review:** International addresses unsupported.
- **record_left:** USPS DPV + CMRA flags.
