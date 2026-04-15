# m14-login-gov-id-me

- **measure:** M14
- **name:** Login.gov / ID.me / GOV.UK One Login federated IAL2
- **modes:** D
- **summary:** Federated IAL2 via Login.gov, ID.me, or GOV.UK One Login. Government-operated IDV; eliminates vendor risk for US-government-credentialed users.
- **attacker_stories_addressed:** synthetic-identity
- **external_dependencies:** Login.gov OIDC; ID.me OIDC; GOV.UK One Login OIDC.
- **flags_thrown:** login_gov_failed; id_me_failed
- **manual_review_handoff:** Reviewer adjudicates failed federated logins.
- **failure_modes_requiring_review:** Limited to enrolled users.
- **record_left:** Federation assertion.
