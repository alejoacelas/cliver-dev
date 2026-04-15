# m13-callback-sop

- **measure:** M13
- **name:** Callback to institutional switchboard SOP
- **modes:** A
- **summary:** Reviewer SOP: for escalated cases, place an outbound call to the institution's main switchboard (looked up independently from the customer-supplied number) and ask to be transferred to the customer.
- **attacker_stories_addressed:** voip-disposable-phone, it-persona-manufacturing
- **external_dependencies:** Manual.
- **flags_thrown:** callback_failed
- **manual_review_handoff:** Reviewer documents call.
- **failure_modes_requiring_review:** Time-intensive.
- **record_left:** Call log.
