# m12-pcard-bin

- **measure:** M12
- **name:** P-Card / institutional BIN allowlist
- **modes:** D
- **summary:** Recognize institutional purchasing-card BIN ranges from major issuers (US Bank PaymentNet, JPM, Citi). P-Card on a claimed institutional order is positive corroboration.
- **attacker_stories_addressed:** personal-card-on-institutional-order
- **external_dependencies:** Issuer BIN documentation.
- **flags_thrown:** p_card_bin_match
- **manual_review_handoff:** Reviewer treats as positive signal.
- **failure_modes_requiring_review:** Some P-Cards are unbranded.
- **record_left:** BIN + issuer.
