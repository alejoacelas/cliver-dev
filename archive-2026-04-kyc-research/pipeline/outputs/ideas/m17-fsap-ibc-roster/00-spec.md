# m17-fsap-ibc-roster

- **measure:** M17
- **name:** FSAP + NIH OSP IBC roster ingestion
- **modes:** D
- **summary:** Ingest the CDC/APHIS Federal Select Agent Program registered-entities list and the NIH OSP IBC registration roster. Pre-approve only entities present in these authoritative rosters for SOC orders.
- **attacker_stories_addressed:** no-ibc-approval, unauthorized-select-agent
- **external_dependencies:** FSAP list; NIH OSP IBC list.
- **flags_thrown:** fsap_not_listed; ibc_not_listed
- **manual_review_handoff:** Reviewer reviews exceptions.
- **failure_modes_requiring_review:** Lists lag new registrations.
- **record_left:** Roster snapshot.
