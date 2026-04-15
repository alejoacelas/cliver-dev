# m03-pobox-regex-sop — 04F form check v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS — none, by design |
| endpoint_details | PASS — N/A is the substantive answer for an in-process regex |
| fields_returned | PASS — internal struct + concrete regex patterns |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — 3 steps |
| flags_thrown | PASS — 3 flags |
| failure_modes_requiring_review | PASS — explicit obfuscation discussion |
| false_positive_qualitative | PASS |
| record_left | PASS |

## For 4C to verify

- Whether `Postfach`, `Casilla`, `Apartado`, `BP`, `Postbus` are in fact the canonical PO-box equivalents in DE/ES/PT/FR/NL.
- APO/FPO/DPO region codes are AE/AP/AA.

**Verdict: PASS**
