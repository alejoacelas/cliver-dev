# 04F form check v1 — m18-nih-reporter

| Field | Verdict | Note |
|---|---|---|
| external_dependencies | PASS | API + bulk fallback + name-normalization table + reviewer. |
| endpoint_details | PASS | URL, auth, rate limits, ToS all present (ToS specifics declared `[unknown]` with plausible search list). |
| fields_returned | PASS | Concrete field list cited to v2 Data Elements PDF. |
| marginal_cost_per_check | PASS | Cost + setup cost separated. |
| manual_review_handoff | PASS | Four-step playbook with eligibility-category logic. |
| flags_thrown | PASS | Four named flags w/ actions. |
| failure_modes_requiring_review | PASS | API errors, name-norm, sub-org, subgrants. |
| false_positive_qualitative | PASS | Reframed correctly as false-negative-dominant; six categories. |
| record_left | PASS | Concrete persisted JSON. |

## For 4C to verify

- 1 req/s rate limit and weekend/9PM-5AM EST guidance — quoted from api.reporter.nih.gov.
- v2 endpoint URL `POST /v2/projects/search`.
- The data elements PDF includes `principal_investigators` array with the listed sub-fields.
- "No registration required" claim.

## Verdict

PASS.
