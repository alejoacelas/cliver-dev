# 4F form check — m20-orcid-oauth v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | Names ORCID Public vs Member API distinction with citation. |
| endpoint_details | PASS | Authorization, token, and record-read URLs all concrete. Pricing has clean public/member split with US-tier marked vendor-gated. Rate-limit has [unknown] admission with two queries — borderline but acceptable. |
| fields_returned | PASS | Concrete JSON example for token + structured record schema. |
| marginal_cost_per_check | PASS | Public-API path is genuinely $0; setup cost noted. |
| manual_review_handoff | PASS | Six-step SOP, cleanly hands off to m20-ror-disjointness for the institution check. |
| flags_thrown | PASS | Seven flags, distinct triggers. |
| failure_modes_requiring_review | PASS | Five concrete failure modes. |
| false_positive_qualitative | PASS | Five categories with two cited proxies. |
| record_left | PASS | Token + JSON snapshot + tamper hash. |

## For 4C to verify

- The Toulouse 41.8% adoption stat (is the doc citing it correctly).
- The token JSON example shape (does it match current ORCID docs).
- ORCID Public API rate limit figures cited as 24/sec and 60-burst (the doc admits these as [unknown]; 4C may be able to find a source).
- Member API pricing band ($1,250–$5,500/year direct US).

**Verdict:** PASS
