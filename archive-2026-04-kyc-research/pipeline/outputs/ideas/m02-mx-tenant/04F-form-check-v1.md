# m02-mx-tenant — 04F form check v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | DNS, GetUserRealm, openid-config, checkdmarc all named with citations |
| endpoint_details | PASS | URLs, auth, rate-limit and ToS gaps explicitly admitted as `[unknown — searched for ...]` |
| fields_returned | PASS | Concrete field list both from DNS and from GetUserRealm |
| marginal_cost_per_check | PASS | $0 with best-guess setup cost |
| manual_review_handoff | PASS | 4-step SOP |
| flags_thrown | PASS | Table with 7 flags + actions |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | Calls out the structural shell-company gap explicitly |
| record_left | PASS | |

## For 4C to verify

- That `ASPMX.L.GOOGLE.COM` is in fact the canonical Google Workspace MX (cited to Truly Inbox, an unofficial source — claim check should confirm against Google's own docs).
- That GetUserRealm `NameSpaceType` actually returns `Managed`/`Federated`/`Unknown` (claim is sourced to a Medium article).
- That checkdmarc parses SPF and DMARC.

**Verdict: PASS**
