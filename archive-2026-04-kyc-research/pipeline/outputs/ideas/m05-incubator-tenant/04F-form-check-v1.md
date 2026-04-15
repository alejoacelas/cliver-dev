# 04F Form check — m05-incubator-tenant v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS — names 5+ specific incubators with URLs; one borderline THIN-SEARCH (`[unknown — searched for: "QB3 startup directory", "Pagliuca Harvard"]`, 2 queries) |
| endpoint_details | PASS — explicit "no APIs" + scrape pipeline + denylist size best-guess; ToS marker has 2-query borderline. |
| fields_returned | PASS — per-incubator field shapes given, JLABS gap explicitly noted |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — 5-step playbook with explicit decision rule and email contact escalation |
| flags_thrown | PASS — 3 flags |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |
| attacker_stories_addressed | PASS — explicit MISSES note on the load-bearing attacker case |

## For 4C to verify
- "IndieBio renamed SOSV SF / SOSV NY in 2026" — verify
- "LabCentral has 200,000 sqft, 6 locations" — verify
- "JLABS San Diego ~40 residents, 140 alumni" — verify
- "IndieBio 310 graduates / $3.6B raised" — verify

**Verdict:** PASS (well-formed; the structural gap on JLABS and on attackers who become real tenants is honestly documented)
