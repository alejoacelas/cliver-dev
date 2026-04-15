# 4F form check — m15-ibc-attestation v1

| Field | Verdict | Notes |
|---|---|---|
| external_dependencies | PASS | Upload UI, IBC-RMS, hash store, OCR, reviewer queue. |
| endpoint_details | PASS | IBC-RMS URL, no-API admission with 3-query search list. |
| fields_returned | PASS | Concrete extracted fields + roster comparison fields. |
| marginal_cost_per_check | PASS | Software near-zero + human-review time + setup. |
| manual_review_handoff | PASS | Six-step playbook including direct chair contact via roster (not document) — addresses forgery risk. |
| flags_thrown | PASS | Six concrete flags. |
| failure_modes_requiring_review | PASS | Forgery, externally-administered IBCs, foreign, OCR, scope-fuzzy. |
| false_positive_qualitative | PASS | Four legitimate cases including exemption holders. |
| record_left | PASS | PDF, hash, roster snapshot, reviewer notes, chair-contact records. |

## For 4C to verify

- IBC-RMS public roster effective June 2025 — verify NOT-OD-25-082 and NIH OSP announcement.
- ibc-rms.od.nih.gov URL resolves.
- Externally-administered IBCs FAQ URL.

## Verdict

`PASS` — substantively complete; honest about structural gaps and forgery limits.
