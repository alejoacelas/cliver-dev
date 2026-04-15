# m19-nih-nsf-pi

- **measure:** M19
- **name:** NIH / NSF / Wellcome / ERC PI lookup
- **modes:** A
- **summary:** Search NIH RePORTER, NSF Award Search, Wellcome Open Funder, ERC, and UKRI for grants where the customer is listed as PI or co-PI. PI status is strong positive evidence.
- **attacker_stories_addressed:** ghost-pi, it-persona-manufacturing
- **external_dependencies:** NIH RePORTER; NSF; Wellcome; ERC; UKRI.
- **flags_thrown:** no_pi_record; pi_at_different_institution
- **manual_review_handoff:** Reviewer adjudicates name match.
- **failure_modes_requiring_review:** Most researchers are not PI.
- **record_left:** Grant records.
