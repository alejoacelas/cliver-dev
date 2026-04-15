# m20-voucher-idv

- **measure:** M20
- **name:** Voucher IAL2 IDV
- **modes:** D
- **summary:** Voucher must complete IAL2 IDV via m14 vendor (Jumio / Onfido / Persona). Voucher identity is bound to a verified document and biometric.
- **attacker_stories_addressed:** fake-voucher, synthetic-voucher
- **external_dependencies:** m14 IDV stack.
- **flags_thrown:** voucher_idv_failed
- **manual_review_handoff:** Reviewer adjudicates failures.
- **failure_modes_requiring_review:** Voucher friction.
- **record_left:** IDV record.
