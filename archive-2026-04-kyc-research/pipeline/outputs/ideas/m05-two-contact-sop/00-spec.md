# m05-two-contact-sop

- **measure:** M05
- **name:** Two-contact directory verification SOP
- **modes:** A
- **summary:** Reviewer SOP: contact the institution via two channels (main switchboard + departmental email from the public directory) to confirm the customer's affiliation and shipping authorization. Used for borderline cases.
- **attacker_stories_addressed:** shell-company, cro-framing, ghost-office
- **external_dependencies:** Manual.
- **flags_thrown:** two_contact_unconfirmed
- **manual_review_handoff:** Reviewer logs both contacts and outcomes.
- **failure_modes_requiring_review:** Time-intensive; not scalable.
- **record_left:** Call/email log.
