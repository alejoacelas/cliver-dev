# m11-crypto-onramp-denylist

- **measure:** M11
- **name:** Crypto-debit BIN + on-ramp referrer denylist
- **modes:** A
- **summary:** Block payment cards issued by known crypto-debit programs (Coinbase Card, Crypto.com Visa, BlockFi, Wirex) via BIN denylist. Block HTTP referrers from known on-ramps.
- **attacker_stories_addressed:** crypto-funding, crypto-debit-card
- **external_dependencies:** Internal BIN denylist; HTTP referrer rules.
- **flags_thrown:** crypto_debit_bin_hit; crypto_onramp_referrer
- **manual_review_handoff:** Reviewer adjudicates marginal cases.
- **failure_modes_requiring_review:** List lag.
- **record_left:** BIN + referrer.
