# 04F form check — m19-openalex-author v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | Concrete: names data source and verification logic |
| external_dependencies | PASS | OpenAlex (OurResearch) named, ROR mentioned as embedded |
| endpoint_details | PASS | URL, auth model, rate limits, ToS all populated with citations; pricing has valid `[vendor-gated]` for Premium |
| fields_returned | PASS | Concrete field list cited to author-object docs |
| marginal_cost_per_check | PASS | Free at API level, with `[best guess]` reasoning for amortized cost and setup cost |
| manual_review_handoff | PASS | Concrete five-step playbook |
| flags_thrown | PASS | Four named flags with triggers |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | Six categories enumerated; tied to attacker-map figure |
| record_left | PASS | |
| attacker_stories_addressed | PASS | Refined per-story with partial-coverage notes |

## For 4C to verify

- Claim that OpenAlex API has 100k/day, 10/sec rate limit on the standard tier — verify against current docs.
- Claim that OpenAlex announced API key model replacing the polite pool — verify the Google Group post is real and the change is in effect.
- Claim that OpenAlex data is CC0.

**Verdict:** PASS
