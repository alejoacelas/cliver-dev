# m16-spycloud-breach

- **measure:** M16
- **name:** SpyCloud / Constella breach-credential check
- **modes:** A
- **summary:** Check the customer's email + password against SpyCloud / Constella breach datasets. Force reset on hit. Combines with HIBP Passwords for k-anonymity password check.
- **attacker_stories_addressed:** credential-stuffing, account-takeover
- **external_dependencies:** SpyCloud API; Constella API; HIBP Passwords.
- **flags_thrown:** breach_credential_hit
- **manual_review_handoff:** Reviewer forces reset.
- **failure_modes_requiring_review:** Privacy implications.
- **record_left:** Breach record.
