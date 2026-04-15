# 04F Form check — m05-google-places-campus v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS — Places, Overpass, Nominatim, PIP library named |
| endpoint_details | PASS — concrete URLs, auth, hard Nominatim 1 rps limit cited, self-hosted requirement noted; one borderline THIN-SEARCH on Nominatim hardware reqs (2 queries) |
| fields_returned | PASS — concrete fields for all three APIs |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — two playbook branches |
| flags_thrown | PASS — 4 flags |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS — 5 distinct classes |
| record_left | PASS |
| attacker_stories_addressed | PASS — explicit per-story PASS/FAIL analysis |

## For 4C to verify
- Nominatim 1 rps absolute limit — verify
- Overpass timeout 180s / 100MB limit — verify
- Places ToS housing/employment claim (same as m04 — already flagged there)
- "OSM US R1 polygon coverage ~80%" — pure best-guess, no source

**Verdict:** PASS (well-formed; the per-attacker-story analysis is unusually thorough)
