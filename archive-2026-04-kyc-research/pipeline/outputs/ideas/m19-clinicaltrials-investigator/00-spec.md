# m19-clinicaltrials-investigator

- **measure:** M19
- **name:** ClinicalTrials.gov + FDA BIMO investigator
- **modes:** A
- **summary:** Cross-check the researcher against ClinicalTrials.gov investigators and FDA BIMO clinical investigator inspections.
- **attacker_stories_addressed:** ghost-investigator
- **external_dependencies:** ClinicalTrials.gov API; FDA BIMO database.
- **flags_thrown:** no_ctgov_record; no_fda_bimo_record
- **manual_review_handoff:** Reviewer reviews adjacent records.
- **failure_modes_requiring_review:** Many basic researchers absent.
- **record_left:** Investigator records.
