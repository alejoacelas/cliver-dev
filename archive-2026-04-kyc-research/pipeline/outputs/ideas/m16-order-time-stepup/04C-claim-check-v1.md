# 4C Claim check — m16-order-time-stepup v1

| Claim | URL | Verdict | Notes |
|---|---|---|---|
| Auth0 docs say max_age=0 forces reauthentication | https://auth0.com/docs/authenticate/login/max-age-reauthentication | PASS | Auth0's "Force Reauthentication in OIDC" doc explicitly describes this. |
| Josh Cain blog explains max_age=0 vs prompt=login | https://joshcain.dev/posts/2019-05-15-max_age/ | PASS | Real blog post; widely cited explainer; matches the doc's claim that max_age=0 is impervious to client tampering. |
| Okta supports ACR-based step-up | https://developer.okta.com/docs/guides/step-up-authentication/main/ | PASS | Okta developer guide on step-up via ACR values is real and matches the description. |
| Okta blog Step-Up Authentication Examples | https://developer.okta.com/blog/2023/10/24/stepup-okta | PASS | Real blog. |
| Auth0 step-up via event.transaction.acr_values | https://auth0.com/docs/secure/multi-factor-authentication/step-up-authentication/configure-step-up-authentication-for-web-apps | PASS | Auth0 step-up doc exists. |
| Keycloak max_age handling bug | https://github.com/keycloak/keycloak/issues/33641 | PASS | Real GitHub issue describing the bug. |
| Ory Hydra max_age=0 sets skip incorrectly | https://github.com/ory/hydra/issues/3034 | PASS | Real GitHub issue. |
| OIDC Core spec auth_time claim | https://openid.net/specs/openid-connect-core-1_0.html | PASS | Canonical OIDC Core spec. |
| Setup cost 1–2 engineer-weeks | (best guess) | PASS-as-best-guess | Reasonable order of magnitude. |
| IdP rate limits | (unknown) | PASS-as-unknown | Search list reasonable. |

No `BROKEN-URL`, `MIS-CITED`, or `OVERSTATED` flags.

## Verdict

**PASS**
