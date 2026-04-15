# 04F form check — m20-anti-rubber-stamp v1

| Field | Verdict |
|---|---|
| name, measure, summary | PASS |
| external_dependencies | PASS — internal SOP, with valid `[unknown — searched for: ...]` for cross-provider sharing (3 queries listed) |
| endpoint_details | PASS — internal logic and threshold rationale concrete |
| fields_returned | PASS |
| marginal_cost_per_check | PASS — best guesses with reasoning |
| manual_review_handoff | PASS — five-step playbook |
| flags_thrown | PASS — four named flags including the more discriminating "fast turnaround" trigger |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |
| attacker_stories_addressed | PASS — granular per-substory honesty about which the SOP catches |

## For 4C to verify

- IGSC v3.0 protocol does not stipulate specific anti-rubber-stamp limits.
- Voucherify "5–10 referrals per hour" referral fraud heuristic.
- Minnesota 8-voter vouching cap reference.

**Verdict:** PASS
