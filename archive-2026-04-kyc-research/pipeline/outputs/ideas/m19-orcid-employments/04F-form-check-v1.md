# 04F form check — m19-orcid-employments v1

| Field | Verdict |
|---|---|
| name, measure, summary | PASS |
| external_dependencies | PASS |
| endpoint_details | PASS — URL, auth, rate limits all addressed; rate-limit specifics correctly marked `[vendor-gated]` |
| fields_returned | PASS — concrete field list with affiliation source-client-id distinction |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — five-step playbook with strong/weak/recent distinctions |
| flags_thrown | PASS — four named flags |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS — anchored on the 2% statistic with cited source |
| record_left | PASS |
| attacker_stories_addressed | PASS — refined per story |

## For 4C to verify

- The "~2% institution-verified affiliations as of August 2023" claim, cited to info.orcid.org/a-closer-look post.
- ORCID public API base URL `https://pub.orcid.org/v3.0/`.

**Verdict:** PASS
