# 4F Form check — m17-event-driven-reeval v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / modes / summary | PASS | concrete event sources, concrete demotion mechanism |
| attacker_stories_addressed | PASS | maps to gradual-legitimacy, shell-company, biotech-incubator, dormant-account-takeover, with explicit non-coverage of bulk-order-noise-cover |
| external_dependencies | PASS | OpenCorporates, OFAC SLS, SpyCloud/Constella, internal timer, FinCEN/FATF anchor — all cited |
| endpoint_details | PASS | OpenCorporates base URL + endpoints; OFAC SLS URL + delta; pricing vendor-gated; rate limits unknown with searches |
| fields_returned | PASS | OpenCorporates event fields, OFAC delta fields, internal re-eval fields |
| marginal_cost_per_check | PASS | $0 OFAC, OpenCorporates best-guess with reasoning, total per-customer-per-year |
| manual_review_handoff | PASS | 6-step SOP w/ trigger categorizer matrix |
| flags_thrown | PASS | 6 distinct flags |
| failure_modes_requiring_review | PASS | 6 modes incl. data freshness explicitly unknown |
| false_positive_qualitative | PASS | 3 categories |
| record_left | PASS | reconciliation report flagged |

## For 4C to verify

- OpenCorporates events endpoint exists — verify [API Reference](https://api.opencorporates.com/documentation/API-Reference).
- OFAC delta files availability — verify [OFAC List file formats FAQ](https://ofac.treasury.gov/faqs/topic/1641).
- OFAC SLS landing page — verify [ofac.treasury.gov/sanctions-list-service](https://ofac.treasury.gov/sanctions-list-service).
- FinCEN 2018 CDD rule — perpetual KYC framing — verify [sanctions.io perpetual KYC blog](https://www.sanctions.io/blog/perpetual-kyc-customer-due-diligence).

## Verdict

**PASS**
