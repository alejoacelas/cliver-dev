# 04F form check v1 — m19-faculty-page

| Field | Verdict | Note |
|---|---|---|
| external_dependencies | PASS | PSE + fetcher + sibling idea + Wayback + reviewer. |
| endpoint_details | PASS | URL, auth, quota, hard ToS deadline (Jan 2027) called out. Two `[unknown]` admissions w/ search lists. |
| fields_returned | PASS | PSE response fields + page-fetch derived fields + Wayback fields. |
| marginal_cost_per_check | PASS | $0.005–$0.015 + setup + migration cost flagged. |
| manual_review_handoff | PASS | Two playbooks for the two main flag types. |
| flags_thrown | PASS | Five flags w/ actions; includes Wayback-based recency flag. |
| failure_modes_requiring_review | PASS | Six failure modes incl. JS-SPA + subdomain + robots.txt + lab-domain mismatch. |
| false_positive_qualitative | PASS | Six FN populations + two FP classes. |
| record_left | PASS | Concrete record incl. snapshot. |

## For 4C to verify

- Google Custom Search JSON API closure to new customers and Jan 1, 2027 sunset for existing customers.
- $5/1000 paid pricing.
- 100 free queries/day.
- Wayback availability endpoint URL.
- PSE response includes `pagemap` with structured metadata.

## Verdict

PASS.
