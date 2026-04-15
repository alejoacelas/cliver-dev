# m15-screening-reconciliation

- **measure:** M15
- **name:** Screening reconciliation (Aclid/Battelle/SecureDNA)
- **modes:** D, A
- **summary:** Daily reconciliation of SOC declarations against sequence-screening results from Aclid, Battelle UltraScreen, and SecureDNA. Disagreement (e.g., declared `vaccine adjuvant`, screened as `select agent`) triggers escalation.
- **attacker_stories_addressed:** soc-misdeclaration, sequence-of-concern
- **external_dependencies:** Aclid; Battelle UltraScreen; SecureDNA.
- **flags_thrown:** soc_screening_disagreement
- **manual_review_handoff:** Reviewer escalates to scientific review.
- **failure_modes_requiring_review:** Vendor coverage differs.
- **record_left:** Reconciliation diff.
