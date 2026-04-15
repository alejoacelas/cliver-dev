# m12-fintech-denylist

- **measure:** M12
- **name:** Mercury / Brex / Wise consumer-fintech denylist
- **modes:** A
- **summary:** When the billing instrument is from a consumer-fintech / neobank (Mercury, Brex, Wise, Revolut Business) on a claimed institutional order, soft flag — neobanks are common shell-company funding rails.
- **attacker_stories_addressed:** shell-company, third-party-billing
- **external_dependencies:** Internal BIN/IBAN denylist.
- **flags_thrown:** fintech_neobank_billing
- **manual_review_handoff:** Reviewer requests procurement-office confirmation.
- **failure_modes_requiring_review:** Some legitimate small institutions use Brex.
- **record_left:** Issuer + BIN.
