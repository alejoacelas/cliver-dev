# 4F form check — m15-drift-detector v1

| Field | Verdict | Notes |
|---|---|---|
| external_dependencies | PASS | River library named, internal DB, reviewer queue. |
| endpoint_details | PASS | Architecture, auth, throughput, cost, ToS — all populated. Order-volume number flagged unknown with plausible search list. |
| fields_returned | PASS | Concrete event schema. |
| marginal_cost_per_check | PASS | ~$0; setup_cost as best-guess. |
| manual_review_handoff | PASS | Five-step playbook including triage and benign-pivot exclusion. |
| flags_thrown | PASS | Four distinct flags + actions. |
| failure_modes_requiring_review | PASS | Cold-start, sparse, vocab-rev, benign pivots. |
| false_positive_qualitative | PASS | Five concrete categories. |
| record_left | PASS | Event log + reviewer disposition + history. |

## VAGUE / borderline

- "Concerning trajectories" curation is described but not specified — that's appropriate for stage 4 (operational detail).

## For 4C to verify

- River ADWIN / Page-Hinkley docs URLs.
- Identity Management Institute behavioral drift link substantively backs the gradual-vs-abrupt framing.
- biosecurityhandbook.com claim about cross-order pattern detection as a known gap.

## Verdict

`PASS` — substantively complete, internal-tooling idea so vendor-gating doesn't apply.
