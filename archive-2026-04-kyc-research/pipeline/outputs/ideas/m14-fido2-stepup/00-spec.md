# m14-fido2-stepup

- **measure:** M14
- **name:** FIDO2 / WebAuthn order-time step-up + device binding
- **modes:** D, A
- **summary:** At order time, require a FIDO2/WebAuthn assertion bound to a device registered during onboarding. Re-binds the human to the order. Combines with `max_age=0` SOP from m16.
- **attacker_stories_addressed:** account-takeover, session-hijack, dormant-account
- **external_dependencies:** WebAuthn library; FIDO2 hardware tokens.
- **flags_thrown:** webauthn_failed; device_unbound
- **manual_review_handoff:** Reviewer re-enrolls device on legitimate failures.
- **failure_modes_requiring_review:** Token loss.
- **record_left:** Assertion record.
