# 04F form check v1 — m18-ror

| Field | Verdict | Note |
|---|---|---|
| external_dependencies | PASS | API + dump + reviewer. |
| endpoint_details | PASS | Concrete URL, three match modes, exact rate-limit numbers w/ Q3-2026 transition, license, ToS. |
| fields_returned | PASS | Full v2 schema field list cited to ROR docs. |
| marginal_cost_per_check | PASS | $0 + setup. |
| manual_review_handoff | PASS | Three labelled playbooks linked to specific flags + audit logging. |
| flags_thrown | PASS | Six flags w/ actions and threshold guess. |
| failure_modes_requiring_review | PASS | API, parser, normalization, coverage, hierarchy. |
| false_positive_qualitative | PASS | Cleanly separates positive- and negative-sense errors. |
| record_left | PASS | Full record, includes schema version. |

## For 4C to verify

- Rate limit "2000 req/5min currently, dropping to 50 req/5min after Q3 2026 unless client ID present."
- ROR curation ≈ 4–6 weeks per the 2025 ROR blog post.
- Match endpoint paths `?affiliation=` and `?query=`.
- v2 schema fields including `admin.created.date` and `relationships`.

## Verdict

PASS.
