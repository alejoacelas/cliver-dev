# m14-stripe-identity

- **measure:** M14
- **name:** Stripe Identity (low-friction)
- **modes:** D
- **summary:** Stripe Identity for lower-risk tiers; integrated with PSP, lower friction but lower assurance than Jumio/Onfido.
- **attacker_stories_addressed:** document-fraud
- **external_dependencies:** Stripe Identity API.
- **flags_thrown:** stripe_identity_failed
- **manual_review_handoff:** Reviewer escalates failures to Jumio.
- **failure_modes_requiring_review:** Lower assurance.
- **record_left:** Stripe verification ID.
