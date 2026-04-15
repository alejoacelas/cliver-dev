# m20-voucher-trust-score

- **measure:** M20
- **name:** Composite voucher trust score + institutional gate
- **modes:** D, A
- **summary:** Composite score combining m20-voucher-idv, m20-orcid-oauth, m20-dkim-institutional-email, m19 seniority signals, and m18 institutional legitimacy. Hard gate at threshold.
- **attacker_stories_addressed:** fake-voucher, low-quality-voucher
- **external_dependencies:** Internal scoring.
- **flags_thrown:** voucher_trust_below_threshold
- **manual_review_handoff:** Reviewer adjudicates borderline.
- **failure_modes_requiring_review:** Score opacity.
- **record_left:** Composite score.
