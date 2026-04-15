# m14-jumio

- **measure:** M14
- **name:** Jumio document + selfie liveness
- **modes:** D
- **summary:** Jumio Identity Verification: ID document capture (3000+ documents, 200+ countries), NFC where supported, active+passive liveness, biometric match. Returns IAL2-equivalent assurance.
- **attacker_stories_addressed:** synthetic-identity, document-fraud, deepfake-selfie
- **external_dependencies:** Jumio API.
- **flags_thrown:** jumio_doc_failed; jumio_liveness_failed; jumio_face_no_match
- **manual_review_handoff:** Reviewer reviews failed cases.
- **failure_modes_requiring_review:** Document coverage gaps.
- **record_left:** Jumio reference + decision.
