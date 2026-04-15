# m19-orcid-employments

- **measure:** M19
- **name:** ORCID employment + education record
- **modes:** D, A
- **summary:** Resolve the researcher to an ORCID ID; fetch employments and educations. Verify current employer matches claimed institution. Strong positive signal where ORCID is populated.
- **attacker_stories_addressed:** it-persona-manufacturing, gradual-legitimacy-accumulation, ghost-author
- **external_dependencies:** ORCID public API.
- **flags_thrown:** orcid_no_record; orcid_employer_mismatch; orcid_recent
- **manual_review_handoff:** Reviewer adjudicates near-misses.
- **failure_modes_requiring_review:** ORCID self-asserted; coverage uneven.
- **record_left:** ORCID record.
