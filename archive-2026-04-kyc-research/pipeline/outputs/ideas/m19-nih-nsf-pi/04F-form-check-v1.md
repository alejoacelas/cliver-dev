# 04F form check v1 — m19-nih-nsf-pi

| Field | Verdict | Note |
|---|---|---|
| external_dependencies | PASS | Five funders + World RePORT fallback + name normalization + reviewer. |
| endpoint_details | PASS | Per-funder URL, auth, rate limit, license. One `[best guess]` on Wellcome update cadence. |
| fields_returned | PASS | Per-funder field schemas (NIH PI sub-object, NSF, 360Giving, CORDIS PI table, GtR person). |
| marginal_cost_per_check | PASS | $0 + setup. |
| manual_review_handoff | PASS | Two playbooks (null-result, institution-mismatch) with the critical "claim vs reality" framing. |
| flags_thrown | PASS | Five flags w/ actions including a name-collision flag. |
| failure_modes_requiring_review | PASS | Six failure modes incl. romanization. |
| false_positive_qualitative | PASS | Five FN populations + one FP class with mitigation. |
| record_left | PASS | Concrete record incl. version timestamps. |

## For 4C to verify

- NIH `pi_names` parameter structure (first_name / last_name / any_name).
- NSF `pdPIName` field name in v1 awards API.
- Wellcome 360Giving CSV format and CC BY 4.0 license.
- CORDIS ERC PI sub-dataset existence.
- UKRI persons endpoint at `gtr.ukri.org/api/persons`.

## Verdict

PASS.
