# m12-psp-avs

- **measure:** M12
- **name:** PSP AVS + Plaid Identity
- **modes:** D
- **summary:** Use PSP AVS (Stripe / Adyen / Braintree) to confirm billing address matches issuer record. Plaid Identity adds bank-account name verification.
- **attacker_stories_addressed:** billing-shipping-mismatch, stolen-card, third-party-billing
- **external_dependencies:** Stripe / Adyen / Braintree AVS; Plaid Identity API.
- **flags_thrown:** avs_no_match; plaid_name_mismatch
- **manual_review_handoff:** Reviewer reviews AVS partial matches.
- **failure_modes_requiring_review:** International AVS coverage uneven.
- **record_left:** AVS code + Plaid response.
