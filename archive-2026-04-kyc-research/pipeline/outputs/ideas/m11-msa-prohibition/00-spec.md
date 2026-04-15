# m11-msa-prohibition

- **measure:** M11
- **name:** MSA prohibition + order-text scan
- **modes:** A
- **summary:** Master Services Agreement explicitly prohibits crypto funding; periodic scan of order-text fields for crypto wallet addresses or coin tickers.
- **attacker_stories_addressed:** crypto-funding
- **external_dependencies:** Internal regex over order metadata.
- **flags_thrown:** order_text_crypto_reference
- **manual_review_handoff:** Reviewer reviews textual hits.
- **failure_modes_requiring_review:** Legitimate research mentions of crypto.
- **record_left:** Matched text.
