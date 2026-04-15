# 04F form-check v1 — m14-login-gov-id-me

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | |
| summary | PASS | |
| external_dependencies | PASS | |
| endpoint_details | PASS | OIDC endpoints concrete for both IDPs; Login.gov pricing `[unknown ...]` with 3-query plausible list AND `[vendor-gated]` private-sector availability hedge; ID.me commercial pricing `[unknown ...]` + `[best guess]`. |
| fields_returned | PASS | Concrete claim list for both IDPs. |
| marginal_cost_per_check | PASS | Login.gov `[vendor-gated]`; ID.me `[best guess]` with reasoning. |
| manual_review_handoff | PASS | 5-step playbook acknowledges the structural black-box limitation. |
| flags_thrown | PASS | |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | Calls out the severe coverage gap for non-US-federal-service researchers. |
| record_left | PASS | |
| bypass_methods | DEFERRED | Stage 5. |

## For 4C to verify

- Login.gov OIDC ACR values `urn:acr.login.gov:verified-facial-match-required` and `…preferred` — verify against developers.login.gov/oidc/authorization/.
- Login.gov auth method `private_key_jwt` only (no client_secret_basic) — verify.
- Login.gov private-sector availability — verify the v1 hedge that GSA restricts to government use cases.
- GSA July 2024 pricing change "up to 70% reduction in IDV cost" — verify FedScoop article.
- ID.me Identity Gateway IAL2/AAL2 + LOA3 certification — verify developers.id.me page.
- ID.me OAuth2 PKCE required + 5-minute access token expiry — verify docs.id.me overview page.
- FTC consent action against ID.me (2024) over face-match-optional claims — verify (v1 mentions but doesn't directly cite an FTC document).

## Verdict

PASS.
