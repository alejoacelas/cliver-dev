# m19-openalex-author

- **measure:** M19
- **name:** OpenAlex author + affiliation history
- **modes:** A
- **summary:** Resolve the researcher to an OpenAlex author ID; fetch affiliation history, h-index, publication count, last_known_institution. Verify against claim.
- **attacker_stories_addressed:** ghost-author, it-persona-manufacturing, paper-shell-research-org
- **external_dependencies:** OpenAlex API.
- **flags_thrown:** openalex_no_author; openalex_affiliation_mismatch
- **manual_review_handoff:** Reviewer adjudicates name disambiguation.
- **failure_modes_requiring_review:** Common-name disambiguation; OpenAlex authorship merging.
- **record_left:** Author record.
