# m20-coauthor-graph

- **measure:** M20
- **name:** OpenAlex coauthor / shared-grant independence graph
- **modes:** A
- **summary:** Build a coauthor + shared-grant graph from OpenAlex + NIH/NSF; verify voucher and customer are genuinely independent (not coauthors, no shared grants in past 3 years). Detects collusive vouching.
- **attacker_stories_addressed:** collusive-vouching, ring-vouching
- **external_dependencies:** OpenAlex; NIH RePORTER; NSF.
- **flags_thrown:** voucher_customer_coauthors; voucher_customer_shared_grant
- **manual_review_handoff:** Reviewer reviews edge cases.
- **failure_modes_requiring_review:** Legitimate collaborators.
- **record_left:** Graph distance.
