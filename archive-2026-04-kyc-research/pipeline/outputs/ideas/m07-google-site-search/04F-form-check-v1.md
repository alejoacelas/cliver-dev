# 04F Form check — m07-google-site-search v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | Names Google CSE legacy + Bing (retired) + 3+ replacements; correctly flags closure status. |
| endpoint_details | REVISE-VAGUE | Brave/SerpAPI rate limits, auth model, ToS not sourced — only [best guess]. Acceptable for v1, but pricing-page citations belong here. |
| fields_returned | PASS | |
| marginal_cost_per_check | PASS | |
| manual_review_handoff | PASS | Concrete 6-step SOP. |
| flags_thrown | PASS | |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | |
| record_left | PASS | |

## For 4C to verify

- Claim: Google CSE JSON API "closed to new customers; sunset Jan 1 2027." (cited to developers.google.com overview)
- Claim: Bing Web Search API retired Aug 11 2025 (cited to MS Lifecycle).
- Claim: Site Restricted JSON API ceased Jan 8 2025.
- Claim: Google CSE pricing $5/1k queries above 100/day free tier.

## Verdict

**REVISE** — only the endpoint_details field for the *replacement* vendors (Brave, SerpAPI) is thin. Core (Google/Bing) is well sourced. Acceptable to ship v1 and revisit if stage 5/6 demands.
