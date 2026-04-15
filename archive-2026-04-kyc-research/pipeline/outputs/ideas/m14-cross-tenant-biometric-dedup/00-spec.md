# m14-cross-tenant-biometric-dedup

- **measure:** M14
- **name:** Cross-tenant biometric dedup
- **modes:** A
- **summary:** In-house + vendor face-template dedup across all customers; flag when one biometric template is bound to multiple distinct identities (synthetic-identity factory) or when one identity has multiple templates.
- **attacker_stories_addressed:** synthetic-identity, identity-rotation
- **external_dependencies:** In-house face embeddings; vendor cross-tenant dedup.
- **flags_thrown:** biometric_template_collision
- **manual_review_handoff:** Reviewer investigates collisions.
- **failure_modes_requiring_review:** Privacy / consent constraints.
- **record_left:** Template ID + collision count.
