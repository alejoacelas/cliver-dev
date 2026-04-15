# m03-smarty-melissa

- **measure:** M03
- **name:** Smarty / Melissa address verification
- **modes:** D
- **summary:** Use Smarty (formerly SmartyStreets) or Melissa Global Address Verification for international PO box, packaging-store, and CMRA detection where USPS is unavailable. Returns DPV match, CMRA, and address-type code.
- **attacker_stories_addressed:** po-box-shipping, cmra-shipping, foreign-buyer-shell
- **external_dependencies:** Smarty US+International API; Melissa Global Address API.
- **flags_thrown:** smarty_cmra; smarty_po_box; melissa_cmra
- **manual_review_handoff:** Reviewer adjudicates ambiguous DPV codes.
- **failure_modes_requiring_review:** Vendor coverage gaps in some countries.
- **record_left:** Vendor response JSON.
