# m02-ror-domain-match

- **measure:** M02
- **name:** ROR institutional domain match
- **modes:** D, A
- **summary:** Resolve the customer's email domain against the ROR registry's `links` field for the claimed institution. Strict match on the apex domain (or a documented subdomain). Fast positive signal for legitimate academic affiliation.
- **attacker_stories_addressed:** free-mail-affiliation, lookalike-domain, dormant-domain
- **external_dependencies:** ROR API.
- **flags_thrown:** ror_domain_match; ror_domain_mismatch
- **manual_review_handoff:** Reviewer adjudicates mismatches against directory.
- **failure_modes_requiring_review:** ROR coverage uneven outside US/EU; some institutions use multiple domains.
- **record_left:** ROR ID + matched domain.
