# 04F form check — m09-domain-auth-stack v1

| Field | Verdict | Notes |
|---|---|---|
| name, measure, summary | PASS | |
| external_dependencies | PASS | DNS, RDAP, DomainTools, MxToolbox all named with citations |
| endpoint_details | REVISE | MxToolbox API pricing has an `[unknown — searched for: ...]` admission with 2 plausible queries, borderline acceptable. DNS unlimited fair-use is `[best guess]` — fine. |
| fields_returned | PASS | Concrete RDAP and DomainTools field lists |
| marginal_cost_per_check | PASS | tiered cost model |
| manual_review_handoff | PASS | five-case playbook |
| flags_thrown | PASS | four named flags |
| failure_modes_requiring_review | PASS | covers GDPR redaction, ccTLD federation, sunset of WHOIS |
| false_positive_qualitative | PASS | five categories |
| record_left | PASS | |

## For 4C to verify

- DomainTools Iris Tier 0 pricing $15,750/month for 250 queries — verify the cited G-Cloud PDF has these exact numbers.
- ICANN WHOIS sunset date "28 January 2025" — verify against ICANN's own announcement, not Wikipedia.
- Claim that DomainTools WHOIS History API returns "up to 100 historical records per domain."

**Verdict:** PASS-with-minor-issues. The MxToolbox `[unknown]` admission could be slightly fuller; everything else is substantively complete.
