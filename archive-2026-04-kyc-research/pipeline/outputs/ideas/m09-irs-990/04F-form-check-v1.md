# 04F form check — m09-irs-990 v1

| Field | Verdict | Notes |
|---|---|---|
| name, measure, summary | PASS | |
| external_dependencies | PASS | three sources, all cited |
| endpoint_details | PASS | URLs, auth, ToS for all three; `[unknown]` on ProPublica rate limit has 3-query search list (passes); Candid is `[vendor-gated]` with what's visible. |
| fields_returned | PASS | concrete IRS XML and ProPublica field lists; Candid marked vendor-gated |
| marginal_cost_per_check | PASS | $0 baseline; Candid is `[best guess]` from vendor-comparable extrapolation |
| manual_review_handoff | PASS | five-case playbook with named NTEE letters |
| flags_thrown | PASS | three flags |
| failure_modes_requiring_review | PASS | covers 990-N, filing lag, fiscal-sponsor case |
| false_positive_qualitative | PASS | five categories |
| record_left | PASS | |

## For 4C to verify

- ProPublica API "free, no auth required" claim — verify against the projects.propublica.org/nonprofits/api page.
- 990-N filing threshold "< $50k gross receipts" — verify against IRS page.
- IRS S3 bucket monthly refresh claim — verify against AWS registry page.
- NTEE codes H/B/U/V/F mapped to life-sciences — verify against NTEE classification scheme.

**Verdict:** PASS. Document is substantively complete and well-sourced.
