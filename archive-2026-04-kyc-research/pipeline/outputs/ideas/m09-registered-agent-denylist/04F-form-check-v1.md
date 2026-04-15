# 04F form check — m09-registered-agent-denylist v1

| Field | Verdict | Notes |
|---|---|---|
| name, measure, summary | PASS | |
| external_dependencies | PASS | denylist seeds named with citations; USPS CRD accessibility caveat noted |
| endpoint_details | PASS | Smarty CMRA endpoint URL, auth, ToS; pricing has `[unknown]` with 3-query search list. |
| fields_returned | PASS | concrete fields per source |
| marginal_cost_per_check | PASS | combined estimate with `[best guess]` markers |
| manual_review_handoff | PASS | four-case playbook |
| flags_thrown | PASS | three flags |
| failure_modes_requiring_review | PASS | covers staleness, USPS access, biotech-incubator gap |
| false_positive_qualitative | PASS | five legit-customer categories |
| record_left | PASS | |

## For 4C to verify

- USPS CRD is non-publicly-downloadable — verify against the cited postal bulletin.
- Smarty exposes CMRA flag — verify against smarty.com/docs/cmra.
- Northwest's "21+ states" claim — verify against northwestregisteredagent.com.
- Bizee's "150,000+ businesses" — verify.

**Verdict:** PASS.
