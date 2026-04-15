# m02-rdap-age

- **measure:** M02
- **name:** RDAP/WHOIS domain age + registrant
- **modes:** D, A
- **summary:** Query RDAP for the customer's email domain to obtain registration date, registrant org, and last update. Flag domains <12 months old, recently transferred, or with privacy-redacted registrant on a claimed institutional domain.
- **attacker_stories_addressed:** dormant-domain, lookalike-domain, shell-company
- **external_dependencies:** RDAP (free); fallback WHOIS.
- **flags_thrown:** domain_age_lt_12mo; domain_recent_transfer; registrant_redacted
- **manual_review_handoff:** Reviewer evaluates against claim.
- **failure_modes_requiring_review:** Privacy services hide registrant on legitimate small orgs.
- **record_left:** RDAP JSON snapshot.
