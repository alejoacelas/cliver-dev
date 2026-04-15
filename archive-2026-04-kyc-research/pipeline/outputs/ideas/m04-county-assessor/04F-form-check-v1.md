# 04F Form check — m04-county-assessor v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | Names Regrid, ATTOM, ReportAll, county portals |
| endpoint_details | REVISE | Regrid per-call REST pricing marked vendor-gated; ATTOM rate limits vendor-gated. ToS marker is thin (`[unknown — searched for: ...]` has only 2 queries — borderline THIN-SEARCH). Acceptable but flag. |
| fields_returned | PASS | Concrete LBCS fields named for Regrid; ATTOM fields named with caveat |
| marginal_cost_per_check | PASS | Best-guess derivation shown; setup cost noted |
| manual_review_handoff | PASS | Concrete 4-step playbook with parcel ID + community-bio carve-out |
| flags_thrown | PASS | Three named flags with actions |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | Four classes named including the community-bio collision |
| record_left | PASS | |
| attacker_stories_addressed | PASS | |

## For 4C to verify

- Regrid pricing claim: "$80K/year" nationwide — verify against pricing page
- ATTOM "starts at $95/month" — verify
- ReportAll "160.6M parcels covering ~99% of US" — verify
- ATTOM coverage "158M properties / 3,000+ counties" — verify

**Verdict:** REVISE (minor — vendor-gated and one borderline thin-search marker; document is salvageable as-is for v1, would benefit from v2 expanding ToS searches)
