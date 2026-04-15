# 04F form check — m19-pubmed-scopus v1

| Field | Verdict |
|---|---|
| name, measure, summary | PASS |
| external_dependencies | PASS — both vendors named, Scopus commercial-license issue surfaced |
| endpoint_details | PASS — PubMed concrete; Scopus marked `[vendor-gated]` with valid `[unknown — searched for: ...]` for the rate-limit specifics. The search list has only one query — borderline THIN-SEARCH but defensible because Elsevier rate-limit specifics are well-known to be behind dev-portal login; flagging as PASS with note. |
| fields_returned | PASS |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS |
| flags_thrown | PASS |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |
| attacker_stories_addressed | PASS |

## For 4C to verify

- NCBI E-utilities rate limits (3 RPS anonymous, 10 RPS with API key).
- Scopus academic-only / non-commercial-use restriction on the free dev tier.

**Verdict:** PASS
