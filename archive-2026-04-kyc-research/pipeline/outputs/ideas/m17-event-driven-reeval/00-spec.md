# m17-event-driven-reeval

- **measure:** M17
- **name:** Event-driven re-eval (M&A, OFAC, breach, dormancy)
- **modes:** A
- **summary:** Trigger re-evaluation of pre-approved entities on events: ownership change (OpenCorporates), OFAC delta (m01-delta), breach datasets (m16), prolonged dormancy.
- **attacker_stories_addressed:** post-approval-drift, m-and-a-laundering
- **external_dependencies:** OpenCorporates events; m01 delta; SpyCloud; internal timers.
- **flags_thrown:** event_triggered_reeval
- **manual_review_handoff:** Reviewer adjudicates trigger.
- **failure_modes_requiring_review:** Event noise.
- **record_left:** Trigger record.
