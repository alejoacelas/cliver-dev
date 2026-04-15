# 04F form check v1 — m18-nsf-awards

| Field | Verdict | Note |
|---|---|---|
| external_dependencies | PASS | Three funders + alias table + reviewer. |
| endpoint_details | PASS | Per-funder URL, auth, rate limit, license. Two `[unknown]` admissions on rate limits with plausible search lists. |
| fields_returned | PASS | Per-funder field lists with citations. |
| marginal_cost_per_check | PASS | $0 + setup. |
| manual_review_handoff | PASS | Four-step playbook with jurisdiction-fit logic. |
| flags_thrown | PASS | Four flags w/ actions, including a cross-PI flag that links to m19. |
| failure_modes_requiring_review | PASS | Six failure modes, including the CORDIS substring trap. |
| false_positive_qualitative | PASS | Reframed as false-negative-dominant; six categories + the substring false-positive. |
| record_left | PASS | Concrete record. |

## For 4C to verify

- NSF API base URL `api.nsf.gov/services/v1/awards.json`.
- NSF "first 3000 results" pagination quirk.
- UKRI organisation endpoint at `gtr.ukri.org/api/organisations`.
- CORDIS dataset on `data.europa.eu` and CC BY 4.0 license.

## Verdict

PASS.
