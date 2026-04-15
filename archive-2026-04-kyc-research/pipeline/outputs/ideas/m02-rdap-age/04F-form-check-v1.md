# m02-rdap-age — 04F form check v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS |
| endpoint_details | PASS — URL, auth, format, rate-limit and ToS each addressed (rate limit explicit `[unknown]`) |
| fields_returned | PASS — RFC 9083 fields enumerated |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — 4-step SOP |
| flags_thrown | PASS — 5 flags, with actions |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS — explicitly addresses GDPR redaction baseline |
| record_left | PASS |

## For 4C to verify

- ICANN sunsetted WHOIS obligation on 28 Jan 2025 (cited to Wikipedia — claim check should find ICANN's own announcement).
- RFC 9083 / 7483 RDAP JSON schema fields (events, entities, status).
- GDPR registrant redaction is now the default for most gTLDs since 2018.

**Verdict: PASS**
