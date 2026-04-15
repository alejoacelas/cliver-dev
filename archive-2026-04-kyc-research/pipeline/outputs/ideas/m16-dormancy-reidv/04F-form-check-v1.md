# 4F Form check — m16-dormancy-reidv v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| modes | PASS | |
| summary | PASS | concrete trigger + concrete action |
| attacker_stories_addressed | PASS | dormant-account-takeover central, account-hijack/credential-compromise partial |
| external_dependencies | PASS | Okta Workflows / Auth0 Action / Persona named with cites |
| endpoint_details | PASS-with-caveats | Persona inquiry endpoint named; pricing and rate limits explicitly vendor-gated/unknown with searches listed |
| fields_returned | PASS | dormancy fields + Persona inquiry fields concretely listed |
| marginal_cost_per_check | PASS | best-guess range with reasoning + setup cost |
| manual_review_handoff | PASS | 6-step SOP, concrete enough for written use |
| flags_thrown | PASS | 5 distinct flags with actions |
| failure_modes_requiring_review | PASS | 5 modes incl. selfie aging, name change, vendor outage |
| false_positive_qualitative | PASS | 4 categories named |
| record_left | PASS | log row + Persona record + selfie comparison artifact |

## For 4C to verify

- Persona "Perpetual KYC" claim that a returning user can re-verify simply by re-taking a selfie matched against the stored selfie — verify [withpersona.com Perpetual KYC blog post](https://withpersona.com/blog/perpetual-kyc-ongoing-customer-due-diligence) actually says this.
- NIST 800-63B reauthentication thresholds (12h overall, 30 min inactivity at AAL2) — verify [pages.nist.gov/800-63-4/sp800-63b.html](https://pages.nist.gov/800-63-4/sp800-63b.html) is the right URL.
- Okta Workflows "Suspend Inactive Users" template existence — verify the [okta.com webinar page](https://www.okta.com/resources/webinar-okta-workflows-template-suspend-inactive-users/) exists.

## Verdict

**PASS** — every required field is substantively populated or has an explicit `[unknown — searched for: ...]` / `[vendor-gated — ...]` admission. Recommend proceeding to claim check.
