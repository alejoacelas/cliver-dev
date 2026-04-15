# m09-pubmed-affiliation

- **measure:** M09
- **name:** PubMed + bioRxiv affiliation history
- **modes:** A
- **summary:** Search PubMed and bioRxiv for publications affiliated with the institution name in the past 5 years. Counts as positive evidence of real life-sciences activity.
- **attacker_stories_addressed:** shell-nonprofit, paper-shell-research-org
- **external_dependencies:** NCBI E-utilities; bioRxiv API.
- **flags_thrown:** no_pubmed_affiliation_5yr
- **manual_review_handoff:** Reviewer adjudicates name variants.
- **failure_modes_requiring_review:** Brand-new institutions lack history.
- **record_left:** Publication count + sample DOIs.
