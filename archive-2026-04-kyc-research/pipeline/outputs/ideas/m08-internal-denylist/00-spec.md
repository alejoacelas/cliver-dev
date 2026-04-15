# m08-internal-denylist

- **measure:** M08
- **name:** Internal institution denylist
- **modes:** D, A
- **summary:** Maintain an internal denylist of previously declined or sanctioned-after-onboarding institutions. Hard block on match.
- **attacker_stories_addressed:** previously-declined, beneficial-owner-laundering, cro-identity-rotation
- **external_dependencies:** Internal database.
- **flags_thrown:** internal_denylist_hit
- **manual_review_handoff:** Reviewer adjudicates name collisions.
- **failure_modes_requiring_review:** Identifier drift.
- **record_left:** Internal record ID.
