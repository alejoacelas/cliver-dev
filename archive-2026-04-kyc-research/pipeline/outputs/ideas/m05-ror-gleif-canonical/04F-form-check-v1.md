# 04F Form check — m05-ror-gleif-canonical v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS — three named APIs with URLs and free/auth status |
| endpoint_details | PASS — concrete URLs, rate limits where known, schema changes (ROR v2 city-level) explicitly noted as a structural limitation; two `[unknown]` markers with 2-query borderline lists each |
| fields_returned | PASS — full field lists for all three APIs from documented schemas |
| marginal_cost_per_check | PASS — $0 API + ~$0.01 geocoding |
| manual_review_handoff | PASS — tiered tolerance + escalation playbooks |
| flags_thrown | PASS — 4 flags |
| failure_modes_requiring_review | PASS — explicitly notes ROR city-level + GLEIF coverage gap + UK-only |
| false_positive_qualitative | PASS — 6 distinct classes |
| record_left | PASS |
| attacker_stories_addressed | PASS — strong per-attacker analysis with structural-insight note |

## For 4C to verify
- "ROR v2 dropped street addresses, location is city-level via geonames" — verify on ROR blog
- "GLEIF API free, no registration" — verify
- "Companies House 600 requests / 5 minutes" — verify
- "GLEIF up to 200 records per request" — verify

**Verdict:** PASS (strong v1; the structural-gap note about "real entity at non-research address" is the most important finding)
