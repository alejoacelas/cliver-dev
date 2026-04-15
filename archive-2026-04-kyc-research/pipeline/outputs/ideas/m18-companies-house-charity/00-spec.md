# m18-companies-house-charity

- **measure:** M18
- **name:** UK CH + Charity Commission + US SOS + IRS TEOS
- **modes:** D, A
- **summary:** National corporate / charity / nonprofit registries: UK Companies House + Charity Commission, US state SOS + IRS Tax Exempt Organization Search. Verify legal existence and status.
- **attacker_stories_addressed:** shell-company, dissolved-company, fake-nonprofit
- **external_dependencies:** Companies House API; Charity Commission API; state SOS portals; IRS TEOS.
- **flags_thrown:** registry_no_record; registry_dissolved
- **manual_review_handoff:** Reviewer reviews edge cases.
- **failure_modes_requiring_review:** State SOS coverage uneven.
- **record_left:** Registry snapshot.
