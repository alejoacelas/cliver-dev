# 4F Form check — m16-order-time-stepup v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / modes / summary | PASS | concrete OIDC mechanism named |
| attacker_stories_addressed | PASS | maps to specific account-hijack methods 2, 3, 9 |
| external_dependencies | PASS | OIDC IdPs named; cross-refs to sibling ideas explicit |
| endpoint_details | PASS | `max_age=0`, `acr_values`, OIDC Core spec all cited; vendor docs cited; rate limits explicit unknown |
| fields_returned | PASS | ID-token claim list with `auth_time` flagged as load-bearing |
| marginal_cost_per_check | PASS | $0 per call + setup-cost best guess |
| manual_review_handoff | PASS | 6-step SOP |
| flags_thrown | PASS | 4 distinct flags w/ actions |
| failure_modes_requiring_review | PASS | 5 modes incl. cited Keycloak/Hydra quirks |
| false_positive_qualitative | PASS | 3 categories |
| record_left | PASS | per-order auth-time binding cited as load-bearing |

## For 4C to verify

- Auth0 docs say `max_age=0` "ignores existing session and reauthenticates" — verify [auth0.com/docs/authenticate/login/max-age-reauthentication](https://auth0.com/docs/authenticate/login/max-age-reauthentication).
- Okta supports ACR values for step-up — verify [developer.okta.com/docs/guides/step-up-authentication/main/](https://developer.okta.com/docs/guides/step-up-authentication/main/).
- Keycloak / Hydra `max_age=0` quirks — verify [Keycloak issue 33641](https://github.com/keycloak/keycloak/issues/33641) and [Hydra issue 3034](https://github.com/ory/hydra/issues/3034) describe the bugs cited.
- OIDC Core spec on `auth_time` claim semantics — verify [openid.net/specs/openid-connect-core-1_0.html](https://openid.net/specs/openid-connect-core-1_0.html).

## Verdict

**PASS**
