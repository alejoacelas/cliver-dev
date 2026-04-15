# 04F Form check — m20-live-video-attestation v2

| Field | Verdict |
|---|---|
| name / measure / summary | PASS — updated to reflect per-order content attestation, challenge questions, and accountability framing |
| external_dependencies | PASS — adds digital attestation platform and rubber-stamping detection logic |
| endpoint_details | PASS — Mode B form described as internal component with auth and fields specified |
| fields_returned | PASS — detailed per-order attestation records for both Mode A and Mode B |
| marginal_cost_per_check | PASS — Mode A ($25-30) + Mode B ($2-5 per order) broken down; annual cost example provided |
| manual_review_handoff | PASS — comprehensive updated SOP for Mode A (7-step) and Mode B (4-step) |
| flags_thrown | PASS — 11 flags total (6 from v1 + 5 new) |
| failure_modes_requiring_review | PASS — 3 new failure modes with mitigations specified |
| false_positive_qualitative | PASS — v1 classes + 3 new classes with mitigations |
| record_left | PASS — per-order linkage, timing data, accountability-statement records |

## Observations

- The Mode A / Mode B split is well-designed: full video at onboarding and annually, lightweight digital sign-off per-order. This balances friction with scalability.
- The rubber-stamping detection (30s threshold, 3-consecutive-order trigger) is a clever behavioral signal. Threshold calibration acknowledged as `[best guess]`.
- The accountability statement with explicit recording/liability framing is a strong deterrent design — it converts the call from a formality to an on-record event.
- Self-vouching deconfliction (M1 from v1) is addressed with a simple government-ID-name comparison rule.
- The >10-SOC-order accommodation (3 representative SOCs + project-level rationale) is a reasonable mitigation for large-order false positives.
- Challenge questions for Mode B are well-specified with randomization and auto-escalation on low-quality responses.

**Verdict:** PASS
