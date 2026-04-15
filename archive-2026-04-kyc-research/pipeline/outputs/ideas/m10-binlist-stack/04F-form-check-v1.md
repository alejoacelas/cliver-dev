# 04F form check — m10-binlist-stack v1

| Field | Verdict | Notes |
|---|---|---|
| name, measure, summary | PASS | |
| external_dependencies | PASS | three named vendors with citations |
| endpoint_details | REVISE | binlist.net rate limit has two conflicting numbers in the document — flagged honestly. NeutrinoAPI per-call price `[unknown]` with 2-query search list. BinDB pricing `[vendor-gated]` correctly. |
| fields_returned | PASS | concrete field lists; explicit note that only BinDB separates gift from prepaid |
| marginal_cost_per_check | PASS | tiered with `[best guess]` markers |
| manual_review_handoff | PASS | four-case playbook |
| flags_thrown | PASS | three flags |
| failure_modes_requiring_review | PASS | covers staleness, BIN expansion, source disagreement |
| false_positive_qualitative | PASS | four categories, plus the structural note that no corpus attacker actually uses gift cards |
| record_left | PASS | with PCI-aware "first 8 digits only" qualifier |

## For 4C to verify

- binlist.net "ceased updates by Aug 15 2023" — verify scribd source authenticity (it's a third-party hosted notice).
- BinDB "12,000+ prepaid/virtual/gift cards identified" — verify vendor page.
- NeutrinoAPI `is-prepaid` field (boolean) — verify API docs.
- 8-digit BIN expansion claim (Visa/Mastercard 2022) — verify against industry guidance.

**Verdict:** PASS / minor REVISE. The conflicting binlist.net rate-limit numbers are reported honestly in-document.
