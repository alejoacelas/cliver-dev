# m10-stripe-funding

- **measure:** M10
- **name:** Stripe / Adyen funding-source
- **modes:** D
- **summary:** Use Stripe `payment_method.card.funding` (or Adyen equivalent) to obtain the issuer-reported funding type (`credit`, `debit`, `prepaid`, `unknown`). Authoritative because the PSP queries the network directly.
- **attacker_stories_addressed:** prepaid-gift-card, anonymous-funding
- **external_dependencies:** Stripe API; Adyen API.
- **flags_thrown:** psp_funding_prepaid; psp_funding_unknown
- **manual_review_handoff:** Reviewer escalates `unknown`.
- **failure_modes_requiring_review:** Issuers occasionally misreport.
- **record_left:** PSP funding string.
