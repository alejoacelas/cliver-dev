# m17-igsc-shared-list

- **measure:** M17
- **name:** IGSC shared customer list + member CRM rollup
- **modes:** A
- **summary:** International Gene Synthesis Consortium shared customer list — flag customers known to other IGSC members. Combine with internal CRM rollup of approval history.
- **attacker_stories_addressed:** industry-known-bad, cross-vendor-shopping
- **external_dependencies:** IGSC shared list; internal CRM.
- **flags_thrown:** igsc_flagged
- **manual_review_handoff:** Reviewer reviews flagged customers.
- **failure_modes_requiring_review:** List freshness.
- **record_left:** IGSC record ID.
