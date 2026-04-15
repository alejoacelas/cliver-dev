# 4F form check — m15-structured-form v1

| Field | Verdict | Notes |
|---|---|---|
| external_dependencies | PASS | Internal portal, NCBI Taxonomy, BMBL reference, reviewer queue. |
| endpoint_details | PASS | Internal form + NCBI E-utilities; rate limits and ToS noted. |
| fields_returned | PASS | Concrete enum values + structured fields + free-text fallback. |
| marginal_cost_per_check | PASS | $0 marginal, setup_cost as best-guess. |
| manual_review_handoff | PASS | Four-step playbook with validator. |
| flags_thrown | PASS | Six concrete flags including the `excessive_other` structural-risk trigger. |
| failure_modes_requiring_review | PASS | Other-escape-hatch, novel organisms, multi-category, codon ambiguity, vocab drift. |
| false_positive_qualitative | PASS | Four legitimate populations including non-US oversight regimes. |
| record_left | PASS | Form JSON, NCBI snapshot, validator output, reviewer notes. |

## For 4C to verify

- NCBI E-utilities rate limits.
- IGSC Harmonized Screening Protocol v3 PDF link.
- Stanford EHS BSL classification reference.

## Verdict

`PASS` — substantively complete; honest about the `other` escape hatch as the central limitation.
