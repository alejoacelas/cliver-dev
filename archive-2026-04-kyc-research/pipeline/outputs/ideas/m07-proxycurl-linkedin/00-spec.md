# m07-proxycurl-linkedin

- **measure:** M07
- **name:** Proxycurl LinkedIn person-lookup
- **modes:** A
- **summary:** Use Proxycurl Person Lookup to fetch the customer's LinkedIn profile by name + company domain. Compare current employer, employment tenure, profile age.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, it-persona-manufacturing
- **external_dependencies:** Proxycurl API.
- **flags_thrown:** linkedin_no_profile; linkedin_employer_mismatch; linkedin_profile_lt_12mo
- **manual_review_handoff:** Reviewer adjudicates near-matches.
- **failure_modes_requiring_review:** LinkedIn ToS uncertainty; common names.
- **record_left:** Proxycurl JSON.
