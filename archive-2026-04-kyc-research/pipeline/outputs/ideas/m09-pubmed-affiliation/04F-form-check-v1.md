# 04F form check — m09-pubmed-affiliation v1

| Field | Verdict | Notes |
|---|---|---|
| name, measure, summary | PASS | |
| external_dependencies | PASS | NCBI E-utilities + bioRxiv with citations |
| endpoint_details | PASS | URLs, rate limits (3/sec → 10/sec with key), affiliation field tag `[ad]`, ToS. bioRxiv rate limit `[unknown]` with 2-query search list. |
| fields_returned | PASS | PubMed esearch/efetch and bioRxiv detail fields enumerated |
| marginal_cost_per_check | PASS | $0 + setup days |
| manual_review_handoff | PASS | four-case playbook |
| flags_thrown | PASS | three flags |
| failure_modes_requiring_review | PASS | covers name normalization, author homonyms, coverage gaps |
| false_positive_qualitative | PASS | six categories including the "biotech CRO doesn't publish" pattern |
| record_left | PASS | |

## For 4C to verify

- NCBI E-utilities 3/sec → 10/sec with API key — confirm against NCBI Insights blog.
- PubMed `[ad]` affiliation field tag — confirm against PubMed help.
- bioRxiv API only exposes corresponding-author affiliation — confirm.
- bioRxiv 100 articles per call — confirm.

**Verdict:** PASS.
