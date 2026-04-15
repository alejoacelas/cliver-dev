# m19-pubmed-scopus

- **measure:** M19
- **name:** PubMed / Scopus author lookup
- **modes:** A
- **summary:** Cross-source author verification via PubMed (NCBI E-utilities) and Scopus Author API. Used as a second source for OpenAlex.
- **attacker_stories_addressed:** ghost-author, it-persona-manufacturing
- **external_dependencies:** NCBI E-utilities; Scopus API.
- **flags_thrown:** no_pubmed_author; no_scopus_author
- **manual_review_handoff:** Reviewer disambiguates.
- **failure_modes_requiring_review:** Scopus subscription required.
- **record_left:** Author IDs.
