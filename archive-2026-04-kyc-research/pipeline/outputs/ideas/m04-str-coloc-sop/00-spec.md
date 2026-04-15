# m04-str-coloc-sop

- **measure:** M04
- **name:** STR / Wayback co-location SOP
- **modes:** A
- **summary:** Reviewer SOP: when an address is flagged residential or ambiguous, search Airbnb / VRBO listings and Wayback for the address. STR co-location = hard flag (short-term-rental drop).
- **attacker_stories_addressed:** short-term-rental-drop, ghost-office
- **external_dependencies:** Manual; Airbnb search; Wayback.
- **flags_thrown:** address_is_str; address_wayback_str_history
- **manual_review_handoff:** Reviewer documents co-location finding.
- **failure_modes_requiring_review:** Manual; not bulk.
- **record_left:** Search results.
