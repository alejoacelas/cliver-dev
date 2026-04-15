# m18-gleif

- **measure:** M18
- **name:** GLEIF LEI lookup + Level-2 relationships
- **modes:** D, A
- **summary:** Resolve the institution to a Legal Entity Identifier via GLEIF. Capture Level-2 parent/ultimate-parent relationships to detect shell parents and beneficial-owner laundering.
- **attacker_stories_addressed:** shell-company, beneficial-owner-laundering
- **external_dependencies:** GLEIF API.
- **flags_thrown:** no_lei; lei_lapsed; lei_parent_in_concern_jurisdiction
- **manual_review_handoff:** Reviewer reviews parent chains.
- **failure_modes_requiring_review:** LEI coverage skews to financial entities.
- **record_left:** LEI record + parent graph.
