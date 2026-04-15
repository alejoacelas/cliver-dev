# m15-ibc-attestation

- **measure:** M15
- **name:** IBC / sponsor PI attestation
- **modes:** D, A
- **summary:** Require an Institutional Biosafety Committee (IBC) approval document or sponsor-PI attestation upload for SOC orders. Verify against m17 IBC roster.
- **attacker_stories_addressed:** soc-misdeclaration, no-ibc-approval
- **external_dependencies:** Manual upload; m17 roster cross-check.
- **flags_thrown:** ibc_doc_missing; ibc_doc_unverified
- **manual_review_handoff:** Reviewer verifies signatures.
- **failure_modes_requiring_review:** Forged docs.
- **record_left:** Document hash.
