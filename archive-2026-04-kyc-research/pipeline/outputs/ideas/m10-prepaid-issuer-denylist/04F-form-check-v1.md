# 04F form check — m10-prepaid-issuer-denylist v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| attacker_stories_addressed | PASS | Refined to in-corpus method numbers |
| summary | PASS | Concrete: BIN-prefix match against curated list |
| external_dependencies | PASS | Names BinDB/Neutrino/IINAPI/Handy + PSP rule layer + curation labor |
| endpoint_details | PASS | Two-layer structure documented; BinDB/Neutrino/binlist/Handy/IINAPI all have URLs and auth model; pricing flagged vendor-gated |
| fields_returned | PASS | Concrete field list per BIN; Privacy.com issuer flagged `[unknown — searched for: ...]` with 4 plausible queries |
| marginal_cost_per_check | PASS | $0 runtime + best-guess setup band, with reasoning. Vendor-gated marker on BinDB pricing |
| manual_review_handoff | PASS | 5-step SOP with time target |
| flags_thrown | PASS | Two distinct flags with actions |
| failure_modes_requiring_review | PASS | 5 modes covered: curation lag, sponsor-bank ambiguity, both directions of PSP-funding mismatch, vendor data error |
| false_positive_qualitative | PASS | 4 categories named with mechanism |
| record_left | PASS | Concrete artifact list |

## For 4C to verify

- "Netspend is associated with Bancorp Bank and Pathward National Association" — sourced to a third-party blog, not Netspend directly. Pathward link is best-guess.
- "Privacy.com historically tied to Patriot Bank and Sutton Bank" — claim is hedged with `[unknown]` but worth a sanity check.
- "binlist.net throttled to 5 req/hour" — verify against current binlist documentation.
- "BinDB advertises identification of over 12,000 different Prepaid, Virtual and Gift cards" — verify on the cited page.
- "Sutton Bank is also the BIN sponsor for Cash App debit" — verify (load-bearing for sponsor-bank-ambiguity failure mode).

## Verdict

PASS
