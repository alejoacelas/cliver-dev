# m06-bis-entity-list

- **measure:** M06
- **name:** BIS Entity List + DPL consignee screen
- **modes:** D
- **summary:** Screen the consignee org and end-user against the BIS Entity List, Denied Persons List, Unverified List, and Military End-User list. Hard block on Entity / DPL hits.
- **attacker_stories_addressed:** denied-end-user, transshipment
- **external_dependencies:** BIS Consolidated Screening List API.
- **flags_thrown:** bis_entity_list_hit; dpl_hit; mil_end_user_hit
- **manual_review_handoff:** Reviewer disposition on hits.
- **failure_modes_requiring_review:** Name fuzzing.
- **record_left:** Match record.
