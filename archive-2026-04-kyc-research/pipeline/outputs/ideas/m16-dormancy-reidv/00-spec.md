# m16-dormancy-reidv

- **measure:** M16
- **name:** Dormancy re-IDV trigger
- **modes:** A
- **summary:** If an account is dormant > 6 months, force re-IAL2 (m14) and re-bind on next login. Closes dormant-account-takeover.
- **attacker_stories_addressed:** dormant-account-takeover
- **external_dependencies:** Internal dormancy timer; m14 vendor.
- **flags_thrown:** dormancy_reidv_required
- **manual_review_handoff:** Reviewer adjudicates legitimate returns.
- **failure_modes_requiring_review:** User friction.
- **record_left:** Dormancy log.
