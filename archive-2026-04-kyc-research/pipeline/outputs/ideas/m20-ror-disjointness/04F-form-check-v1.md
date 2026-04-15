# 4F form check — m20-ror-disjointness v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | Cleanly states the rule and what attacker stories it engages. |
| external_dependencies | PASS | Names ROR + lists three plausible upstream resolvers. |
| endpoint_details | PASS | Concrete v2 URLs, current and post-Q3-2026 rate limits, free pricing, bulk-dump fallback. |
| fields_returned | PASS | Concrete v2 schema subset including `relationships[]` enum. |
| marginal_cost_per_check | PASS | $0 marginal, with throughput calculation showing the rate limit is non-binding. |
| manual_review_handoff | PASS | Six-step SOP with specific reviewer decision criteria. |
| flags_thrown | PASS | Six flags including a positive pass case. |
| failure_modes_requiring_review | PASS | Five concrete modes including the post-Q3-2026 throttling case. |
| false_positive_qualitative | PASS | Six categories with one cited proxy. |
| record_left | PASS | JSON snapshots + relationship walk + reviewer note + tamper hash. |

## For 4C to verify

- ROR rate limit numbers (2000/5min current, 50/5min unidentified after Q3 2026).
- ROR v2 relationship type enum (Parent / Child / Related / Successor / Predecessor).
- ROR coverage skew claim (top 20 countries = 80.9% of records, US = 30%).
- ROR registry size of ~120k organizations.

**Verdict:** PASS
