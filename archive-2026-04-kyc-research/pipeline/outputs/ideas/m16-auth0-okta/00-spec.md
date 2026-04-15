# m16-auth0-okta

- **measure:** M16
- **name:** Auth0 / Okta / Cognito hosted MFA
- **modes:** D
- **summary:** Use a hosted IdP (Auth0, Okta, AWS Cognito) for MFA enrollment, enforcement, and adaptive risk. Centralizes MFA policy.
- **attacker_stories_addressed:** account-takeover, credential-stuffing
- **external_dependencies:** Auth0 / Okta / Cognito.
- **flags_thrown:** mfa_not_enrolled; mfa_failed
- **manual_review_handoff:** Reviewer adjudicates lockouts.
- **failure_modes_requiring_review:** Vendor lock-in.
- **record_left:** IdP audit log.
