# m18-nih-reporter

- **measure:** M18
- **name:** NIH RePORTER funded-institution signal
- **modes:** A
- **summary:** Query NIH RePORTER for grants awarded to the institution in the past 5 years. Funded-institution status is strong positive evidence.
- **attacker_stories_addressed:** shell-nonprofit, paper-shell-research-org
- **external_dependencies:** NIH RePORTER API.
- **flags_thrown:** no_nih_funding_5yr
- **manual_review_handoff:** Reviewer combines with other signals.
- **failure_modes_requiring_review:** Many legitimate non-NIH-funded labs.
- **record_left:** Grant count + sample IDs.
