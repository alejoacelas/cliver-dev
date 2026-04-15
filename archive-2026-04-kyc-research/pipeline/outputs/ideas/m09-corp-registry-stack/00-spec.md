# m09-corp-registry-stack

- **measure:** M09
- **name:** Companies House / EDGAR / OpenCorporates / foreign registry
- **modes:** D, A
- **summary:** Verify the institution's legal existence and life-sciences scope of activity via the appropriate national corporate registry. Capture incorporation date, status (active/dissolved), registered office, officers, SIC/NAICS code.
- **attacker_stories_addressed:** shell-company, dissolved-company, beneficial-owner-laundering
- **external_dependencies:** Companies House API; SEC EDGAR; OpenCorporates; foreign registries.
- **flags_thrown:** registry_no_record; registry_dissolved; sic_not_life_sciences; registry_recent_incorp
- **manual_review_handoff:** Reviewer reviews mismatched SIC.
- **failure_modes_requiring_review:** Registry coverage gaps; SIC misclassification.
- **record_left:** Registry record snapshot.
