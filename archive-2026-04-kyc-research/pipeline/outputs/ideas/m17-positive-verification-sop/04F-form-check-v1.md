# 04F form check — m17-positive-verification-sop v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / summary | PASS | |
| external_dependencies | PASS | Names IBC-RMS, sanctions stack, ticketing, SOP. |
| endpoint_details | PASS | Concrete on IBC-RMS public roster (June 2025) with citation; explicit `[unknown]` for IBC-RMS API with 3 plausible queries. |
| fields_returned | PASS | Concrete artifact list per cycle. |
| marginal_cost_per_check | PASS | Best-guess with reasoning + financial-KYC benchmark; setup cost given. |
| manual_review_handoff | PASS | Five-step workflow with auto-suspend. |
| flags_thrown | PASS | Five distinct flags. |
| failure_modes_requiring_review | PASS | Six concrete modes. |
| false_positive_qualitative | PASS | |
| record_left | PASS | |

## Borderline

- The IBC-RMS API `[unknown]` could be tightened — IBC-RMS may have a documented data export. Acceptable for v1 since the public-roster transparency rule is recent.
- Foreign-institution coverage is acknowledged as a structural gap; correctly flagged in failure_modes.

## For 4C to verify

- Claim: "Effective June 1, 2025, NIH OSP publicly posts active IBC rosters via IBC-RMS" — verify against the cited NIH OSP and CITI sources.
- Claim: financial-KYC refresh cost £10–£100 per check — verify against Plaid summary.
- Claim: each NIH-funded institution must file an annual report including IBC roster — verify against NIH OSP FAQs.

**Verdict:** PASS
