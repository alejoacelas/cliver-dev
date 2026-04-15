# 4F form check — m15-screening-reconciliation v1

| Field | Verdict | Notes |
|---|---|---|
| external_dependencies | PASS | Three vendors named with URLs. |
| endpoint_details | PASS | Aclid + Battelle vendor-gated with explicit gating language; SecureDNA endpoint URL flagged unknown with 2-query search list (borderline thin). |
| fields_returned | PASS | Concrete normalized schema + reconciler outputs. |
| marginal_cost_per_check | PASS | SecureDNA $0; commercial vendors marked vendor-gated with order-of-magnitude best guess. |
| manual_review_handoff | PASS | Five-case decision matrix + escalation path. |
| flags_thrown | PASS | Four flags. |
| failure_modes_requiring_review | PASS | API down, novel SOCs, codon optimization, short reads — substantive structural gaps acknowledged. |
| false_positive_qualitative | PASS | Four populations including vaccine devs, diagnostics, plasmid backbones. |
| record_left | PASS | Per-vendor JSON, diff, reviewer notes, audit trail. |

## VAGUE / borderline

- SecureDNA endpoint URL search list is thin (2 queries). 4C may find it via the GitHub repo.
- "FBI WMD Coordinator" reporting flow is best-guess; should be verified or weakened.

## For 4C to verify

- SecureDNA API description (FASTA in, JSON out, free).
- Aclid 100k bp / 2.49 second performance claim.
- Battelle sensitivity study 7–9% non-regulated SOC stat.

## Verdict

`REVISE-minor` — broaden SecureDNA search list, soften the FBI reporting claim. Otherwise complete.
