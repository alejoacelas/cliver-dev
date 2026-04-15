# m20-anti-rubber-stamp

- **measure:** M20
- **name:** Anti-rubber-stamp SOP
- **modes:** A
- **summary:** Rate-limit the number of vouches a single voucher can issue per quarter; require diversity of customers; audit vouchers exceeding thresholds.
- **attacker_stories_addressed:** rubber-stamp-voucher, ring-vouching
- **external_dependencies:** Internal limits.
- **flags_thrown:** voucher_rate_exceeded; voucher_diversity_low
- **manual_review_handoff:** Reviewer audits high-volume vouchers.
- **failure_modes_requiring_review:** Legitimate frequent vouchers (PIs).
- **record_left:** Voucher activity log.
