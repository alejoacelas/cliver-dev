# 4F form check — m16-auth0-okta v1

| Field | Verdict | Notes |
|---|---|---|
| external_dependencies | PASS | Three IdP options + portal + order-pipeline hook + reviewer queue. |
| endpoint_details | PASS | All three vendors have URL/auth/step-up/pricing notes. Auth0 rate-limit and FIDO2-tier are flagged best-guess / vendor-gated appropriately. |
| fields_returned | PASS | Concrete OIDC claim list with explicit `auth_time` / `amr` semantics. |
| marginal_cost_per_check | PASS | ~$0 with passkey, SMS-add-on cost noted, MAU dependence noted. |
| manual_review_handoff | PASS | Seven-step playbook including the recovery-via-IDV linkage to m14. |
| flags_thrown | PASS | Five flags including `mfa_recent_enroll` for the social-engineering case. |
| failure_modes_requiring_review | PASS | IdP outage, passkey loss, federated downgrade, TOTP sync errors. |
| false_positive_qualitative | PASS | Five categories. |
| record_left | PASS | IdP audit log + provider log + recovery linkage. |

## VAGUE / borderline

- 48h cooling period in `mfa_recent_enroll` is best-guess; acceptable for stage 4.
- Auth0 production rate limit "50 req/sec" is best-guess; reviewer should verify against current Auth0 rate-limit policy page.

## For 4C to verify

- Auth0 Adaptive MFA docs URL.
- Cognito passkey support (Nov 2024) — verify against AWS announcement.
- Okta CIC = formerly Auth0.
- Auth0 B2C / B2B pricing tiers.

## Verdict

`PASS` — substantively complete; honest about which methods the idea catches vs misses and that leverage depends on policy choices.
