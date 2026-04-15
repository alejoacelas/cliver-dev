# m20-live-video-attestation

- **measure:** M20
- **name:** Live video attestation
- **modes:** A
- **summary:** Voucher attests on a live video call holding their government ID. Hard for synthetic-identity factories to fake at scale.
- **attacker_stories_addressed:** fake-voucher, deepfake-voucher
- **external_dependencies:** Manual scheduled call; recording.
- **flags_thrown:** video_attestation_failed
- **manual_review_handoff:** Reviewer conducts call.
- **failure_modes_requiring_review:** Time-intensive.
- **record_left:** Recording hash.
