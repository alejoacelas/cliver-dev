# m06-bis-country-groups

- **measure:** M06
- **name:** BIS Country Group D/E + EAR licensing matrix
- **modes:** D
- **summary:** Map the destination country to BIS Country Groups (A:5/A:6 allies, D:1/D:5 concerns, E:1/E:2 embargoed). Apply EAR licensing requirements per ECCN; block Group E without exception, escalate Group D for license review.
- **attacker_stories_addressed:** sanctioned-jurisdiction-routing, transshipment, foreign-buyer-shell
- **external_dependencies:** BIS EAR Country Chart; internal ECCN matrix.
- **flags_thrown:** country_group_e; country_group_d_license_required
- **manual_review_handoff:** Reviewer applies licensing decision.
- **failure_modes_requiring_review:** License determinations are item-specific.
- **record_left:** Country group + ECCN.
