# m02-inbox-roundtrip

- **measure:** M02
- **name:** Inbox round-trip verification
- **modes:** D
- **summary:** Send a signed token to the email address; require the user to click through within a short window. Confirms control of the inbox and creates a record of the verification.
- **attacker_stories_addressed:** lookalike-domain, dormant-domain, free-mail-affiliation
- **external_dependencies:** Internal mailer; signed-token library.
- **flags_thrown:** roundtrip_failed; roundtrip_expired
- **manual_review_handoff:** Reviewer reissues if expired.
- **failure_modes_requiring_review:** Inbox forwarding hides true recipient.
- **record_left:** Token issuance + click timestamps.
