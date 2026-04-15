# m11-psp-config-audit

- **measure:** M11
- **name:** PSP config audit (no crypto methods)
- **modes:** D
- **summary:** Periodic audit that the live Stripe/Adyen/Braintree configuration does not have any crypto-related payment methods enabled (Coinbase, Bitpay, etc.). Code-as-config check in CI.
- **attacker_stories_addressed:** crypto-funding
- **external_dependencies:** PSP admin APIs.
- **flags_thrown:** crypto_method_enabled
- **manual_review_handoff:** Reviewer reverts config drift.
- **failure_modes_requiring_review:** New PSP methods can appear without notice.
- **record_left:** Config snapshot.
