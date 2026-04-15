# m14-onfido

- **measure:** M14
- **name:** Onfido document + biometric
- **modes:** D
- **summary:** Onfido Studio workflow: document classification, authenticity, face match, liveness. Alternative IAL2 vendor with stronger UK/EU coverage.
- **attacker_stories_addressed:** synthetic-identity, document-fraud, deepfake-selfie
- **external_dependencies:** Onfido API.
- **flags_thrown:** onfido_doc_failed; onfido_face_no_match
- **manual_review_handoff:** Reviewer reviews failed cases.
- **failure_modes_requiring_review:** Vendor lock-in.
- **record_left:** Onfido reference.
