# 04F Form check — m17-positive-verification-sop v2

| Field | Verdict |
|---|---|
| name / measure / summary | PASS — updated to reflect independent-contact mandate and DMARC verification |
| external_dependencies | PASS — adds faculty directories, switchboard, Companies House officers, DMARC validation |
| endpoint_details | PASS — Companies House officers endpoint documented; DMARC validation described as infrastructure-level |
| fields_returned | PASS — adds independent-contact-lookup fields and DMARC validation fields |
| marginal_cost_per_check | PASS — updated to $75-$150/entity/year with reasoning; setup cost revised |
| manual_review_handoff | PASS — comprehensive 7-step SOP with independent-contact-first workflow |
| flags_thrown | PASS — 9 flags total (5 from v1 + 4 new) |
| failure_modes_requiring_review | PASS — 4 new failure modes specific to independent-contact and DMARC challenges |
| false_positive_qualitative | PASS — v1 classes retained + 3 new classes |
| record_left | PASS — adds contact-source documentation, DMARC result, independence flag |

## Observations

- The independent-contact mandate is the core fix and is well-specified with a priority-ordered source list (IBC-RMS > switchboard > faculty directory > corporate registry).
- The explicit prohibition on using customer-provided contact info is clearly stated.
- The structural limitation for purpose-built organizations (where all "independent" channels lead back to the attacker) is honestly documented rather than hand-waved.
- The two-contact requirement for non-established entities is a reasonable escalation with a specified fallback for small legitimate entities.
- DMARC enforcement rate ("70% of US R1 universities") is marked `[best guess]` — acceptable.
- The switchboard callback logistics (timezone, language) are acknowledged as friction sources.

**Verdict:** PASS
