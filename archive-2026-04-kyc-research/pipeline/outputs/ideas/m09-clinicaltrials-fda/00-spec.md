# m09-clinicaltrials-fda

- **measure:** M09
- **name:** ClinicalTrials.gov + FDA establishment registration
- **modes:** A
- **summary:** Cross-check the institution against ClinicalTrials.gov sponsors/sites and the FDA establishment registration database (drug, device, blood, tissue). Either presence is positive evidence.
- **attacker_stories_addressed:** shell-nonprofit, paper-shell-research-org
- **external_dependencies:** ClinicalTrials.gov API; FDA Establishment Registration DB.
- **flags_thrown:** no_ctgov_no_fda_registration
- **manual_review_handoff:** Reviewer adjudicates non-clinical labs.
- **failure_modes_requiring_review:** Many legitimate basic-research labs are absent.
- **record_left:** ID match.
