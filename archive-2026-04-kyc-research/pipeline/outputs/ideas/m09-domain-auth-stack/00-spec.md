# m09-domain-auth-stack

- **measure:** M09
- **name:** MX/SPF/DMARC + WHOIS-history life-sciences signal
- **modes:** A
- **summary:** For the institution's claimed primary domain, inspect MX/SPF/DMARC alignment and WHOIS history (registration date, transfer events). Used as a corroborating signal alongside the registry stack.
- **attacker_stories_addressed:** shell-company, dormant-domain
- **external_dependencies:** DNS; RDAP; DomainTools history (optional).
- **flags_thrown:** domain_recent; domain_no_mail_auth
- **manual_review_handoff:** Reviewer correlates with registry record.
- **failure_modes_requiring_review:** False positives on small legitimate orgs.
- **record_left:** DNS/RDAP snapshot.
