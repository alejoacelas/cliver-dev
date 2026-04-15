# 04F Form check — m04-google-places-business v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS — names Google Places API New + flags ToS dependency |
| endpoint_details | PASS — endpoint URL, auth model, SKU pricing, rate-limit `[unknown]` admission with 2 plausible queries (borderline THIN-SEARCH but acceptable), caching policy noted |
| fields_returned | PASS — concrete field list from documented Places New API |
| marginal_cost_per_check | PASS |
| manual_review_handoff | PASS — 6-step playbook |
| flags_thrown | PASS — 4 named flags |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |

**Notable:** ToS structural risk explicitly called out — good practice; the document is honest about a fundamental blocker. 4C should sanity-check the ToS quote.

## For 4C to verify
- Places API ToS clause about housing/employment/credit/insurance — verify exact wording
- Pricing tier numbers ($32/$35/$40 CPM) — third-party article source, verify against Google's own pricing page
- 104 new types in Places New — verify

**Verdict:** PASS (well-formed; minor verification items for 4C)
