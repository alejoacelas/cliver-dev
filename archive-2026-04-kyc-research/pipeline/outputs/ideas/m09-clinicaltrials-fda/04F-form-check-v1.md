# 04F form check — m09-clinicaltrials-fda v1

Reviewing `04-implementation-v1.md` against the idea schema.

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | three sources named with citations |
| endpoint_details | REVISE | CT.gov rate limit has a valid `[unknown — searched for: ...]` admission with 2 plausible queries — borderline thin but acceptable. openFDA quotas marked `[best guess]` with reasonable derivation. ToS marked `[best guess]` — could be upgraded by checking openFDA terms page directly. |
| fields_returned | PASS | concrete field lists from both endpoints |
| marginal_cost_per_check | PASS | |
| manual_review_handoff | PASS | concrete 3-step playbook |
| flags_thrown | PASS | three named flags with actions |
| failure_modes_requiring_review | PASS | |
| false_positive_qualitative | PASS | clear discussion of the check's asymmetric error profile (false negatives, not false positives) |
| record_left | PASS | |
| bypass_methods_known/uncovered | PASS | correctly deferred to stage 5 |

## For 4C to verify

- Claim that openFDA gives 240 req/min unauthenticated — `[best guess]` should ideally point to the openFDA terms-of-service page if accessible.
- Claim that openFDA device registration is "updated weekly" — sourced to fda.gov page; verify the page actually says weekly.
- CT.gov sponsor field path `protocolSection.sponsorCollaboratorsModule.leadSponsor.name` — verify against the v2 schema.

**Verdict:** REVISE (one borderline `[unknown]`, two `[best guess]` markers that could become real citations). The document is substantively complete and usable; the issues are sourcing-quality, not field-completeness. A v2 is optional.
