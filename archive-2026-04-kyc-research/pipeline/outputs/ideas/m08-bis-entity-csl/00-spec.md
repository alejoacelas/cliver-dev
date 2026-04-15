# m08-bis-entity-csl

- **measure:** M08
- **name:** BIS Entity List + Consolidated Screening List
- **modes:** D
- **summary:** Screen the customer's institution against the US Consolidated Screening List (BIS Entity, DPL, UVL, MEU; State DDTC; Treasury OFAC). Hard block on hits.
- **attacker_stories_addressed:** sanctioned-institution, denied-end-user
- **external_dependencies:** Trade.gov CSL API.
- **flags_thrown:** csl_entity_hit
- **manual_review_handoff:** Reviewer disposition.
- **failure_modes_requiring_review:** Name fuzzing.
- **record_left:** Match record.
