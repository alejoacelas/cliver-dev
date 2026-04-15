# m16-order-time-stepup

- **measure:** M16
- **name:** Order-time max_age=0 step-up
- **modes:** D, A
- **summary:** At order submission, require a fresh authentication (`max_age=0`) — re-prompt for MFA. SOP that ties order to a fresh auth event.
- **attacker_stories_addressed:** session-hijack, account-takeover
- **external_dependencies:** OIDC max_age parameter.
- **flags_thrown:** stepup_failed
- **manual_review_handoff:** Reviewer adjudicates failed step-ups.
- **failure_modes_requiring_review:** Friction at order time.
- **record_left:** Auth event timestamp.
