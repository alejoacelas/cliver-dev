# m04-county-assessor

- **measure:** M04
- **name:** County assessor parcel use-code (US)
- **modes:** D
- **summary:** Look up the parcel at the address against the county assessor's open data (or via Regrid / ATTOM aggregator). Use code (residential / commercial / institutional / mixed-use) is authoritative ground truth.
- **attacker_stories_addressed:** residential-shipping, ghost-office
- **external_dependencies:** Regrid; ATTOM Data; county open-data portals.
- **flags_thrown:** parcel_use_residential; parcel_use_mixed
- **manual_review_handoff:** Reviewer correlates with claim.
- **failure_modes_requiring_review:** Coverage uneven across counties.
- **record_left:** Parcel record.
