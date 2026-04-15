# m07-directory-scrape

- **measure:** M07
- **name:** Institutional directory people-search scrape
- **modes:** A
- **summary:** Scrape (or query) the institution's people-search directory for the customer's name. Verify name, email, role, department.
- **attacker_stories_addressed:** it-persona-manufacturing, visiting-researcher, gradual-legitimacy-accumulation
- **external_dependencies:** Institution-specific scrape; cached HTML.
- **flags_thrown:** directory_no_match; directory_role_mismatch
- **manual_review_handoff:** Reviewer manually verifies near-misses.
- **failure_modes_requiring_review:** Directory privacy filters; lag for new hires.
- **record_left:** Directory snippet.
