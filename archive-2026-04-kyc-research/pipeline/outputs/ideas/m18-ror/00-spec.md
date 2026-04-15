# m18-ror

- **measure:** M18
- **name:** ROR Research Organization Registry
- **modes:** D, A
- **summary:** Resolve the customer's claimed institution to a ROR ID. Check self-listing red flags (one-person-org-asserted-ROR, recent ROR creation, suspicious metadata). Foundational institution-identity signal used by many other ideas.
- **attacker_stories_addressed:** shell-nonprofit, foreign-institution, institution-impersonation
- **external_dependencies:** ROR API.
- **flags_thrown:** ror_no_match; ror_recent; ror_self_listed
- **manual_review_handoff:** Reviewer adjudicates ambiguous matches.
- **failure_modes_requiring_review:** ROR coverage uneven outside US/EU.
- **record_left:** ROR ID + metadata.
