# m14-persona

- **measure:** M14
- **name:** Persona inquiry workflow
- **modes:** D
- **summary:** Persona configurable inquiry: document, selfie, database, government ID checks. Strong workflow customization for tiered IAL2/IAL3.
- **attacker_stories_addressed:** synthetic-identity, document-fraud
- **external_dependencies:** Persona API.
- **flags_thrown:** persona_inquiry_failed
- **manual_review_handoff:** Reviewer reviews flagged inquiries.
- **failure_modes_requiring_review:** Configuration drift.
- **record_left:** Persona inquiry ID.
