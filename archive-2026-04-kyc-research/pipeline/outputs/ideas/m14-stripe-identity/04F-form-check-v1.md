# 4F form check — m14-stripe-identity v1

| Field | Verdict | Notes |
|---|---|---|
| external_dependencies | PASS | Vendor named, API and webhook handler called out. |
| endpoint_details | PASS | URL, auth, session types, pricing all cited. Rate-limit specifics flagged as unknown with two-query search list (acceptable). |
| fields_returned | PASS | Concrete field list cited to API reference. |
| marginal_cost_per_check | PASS | $1.50 cited; setup_cost flagged as best-guess. |
| manual_review_handoff | PASS | Five-step playbook, references account-holder match. |
| flags_thrown | PASS | Four flags + standard action. |
| failure_modes_requiring_review | PASS | API errors, ambiguous, country gaps, legal-person edge case. |
| false_positive_qualitative | PASS | Concrete population categories. |
| record_left | PASS | Session ID, JSON report, image file IDs, reviewer log. Retention period flagged as unknown — search list is two queries, borderline thin. |

## VAGUE / borderline

- `record_left` retention period: search list could plausibly include "Stripe Identity privacy notice retention" — borderline THIN-SEARCH but not blocking.

## For 4C to verify

- Pricing claim: "$1.50 per verification" — verify against Stripe support page.
- Verified-output field list — verify against Stripe API reference object.
- Stripe ToS restriction on third-party screening use — flagged as best-guess, no citation; 4C should look for the actual MSA section or weaken the claim.
- iBeta PAD certification — flagged unknown; 4C may find it.

## Verdict

`REVISE` — minor: tighten the ToS claim and broaden the retention search list. Otherwise substantively complete.
