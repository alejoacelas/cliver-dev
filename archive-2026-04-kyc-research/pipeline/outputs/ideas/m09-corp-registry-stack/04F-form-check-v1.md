# 04F form check — m09-corp-registry-stack v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | three primary sources cited |
| endpoint_details | PASS | URLs, auth, rate limits, pricing for all three; ToS noted |
| fields_returned | PASS | concrete field lists per registry |
| marginal_cost_per_check | PASS | cost broken down per registry, with `[best guess]` on combined |
| manual_review_handoff | PASS | five-case playbook with named SIC/NAICS ranges |
| flags_thrown | PASS | four flags with actions |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | four classes of legit-customer false positives |
| record_left | PASS | |

## For 4C to verify

- Specific UK SIC codes claimed for life-sciences (72110, 72190, 21100, 21200, 86900) — verify against UK SIC 2007 list.
- NAICS codes (5417, 3254, 6215, 6113) — verify against NAICS for "scientific R&D / pharma manufacturing / medical labs / colleges".
- Companies House 600 requests / 5 min figure — confirm against the cited rate-limiting page.
- OpenCorporates 2026 pricing — the cited zephira.ai page is a third-party analysis, not OpenCorporates' own pricing page; cross-check against opencorporates.com/pricing if accessible.
- SEC EDGAR 10 req/sec — confirm against sec.gov developer page.

**Verdict:** PASS. All required fields are populated substantively with citations. The third-party pricing source for OpenCorporates is the only soft spot.
