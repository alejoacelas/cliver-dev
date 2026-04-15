# m17-predecessor-reidv

- **measure:** M17
- **name:** Predecessor pre-approval re-IAL2 + re-bind
- **modes:** A
- **summary:** When an order arrives from a pre-approved entity, the submitting individual must complete re-IAL2 (m14) re-binding to the order. Closes inheritance of approval to new individuals.
- **attacker_stories_addressed:** predecessor-inheritance, dormant-account-takeover
- **external_dependencies:** m14 IDV vendor.
- **flags_thrown:** predecessor_rebind_failed
- **manual_review_handoff:** Reviewer adjudicates legit handoffs.
- **failure_modes_requiring_review:** Friction.
- **record_left:** Re-bind record.
