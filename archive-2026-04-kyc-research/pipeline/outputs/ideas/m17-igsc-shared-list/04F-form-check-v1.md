# 04F form check — m17-igsc-shared-list v1

| Field | Verdict | Notes |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | Names IGSC protocol + sharing channel + internal CRM. |
| endpoint_details | PASS | Has explicit `[unknown ...]` admission with plausible search list (4 queries) plus `[best guess]` reasoning re: ad-hoc human channel; antitrust/GDPR ToS constraints flagged. |
| fields_returned | PASS | `[unknown]` admission for IGSC channel with 3 plausible queries + `[best guess]` payload; CRM side concretely listed. |
| marginal_cost_per_check | PASS | Best-guess with explicit reasoning + setup cost flagged unknown. |
| manual_review_handoff | PASS | 6-step concrete SOP. |
| flags_thrown | PASS | Four distinct flags with actions. |
| failure_modes_requiring_review | PASS | Five failure modes, with citations on the "rarely used" point. |
| false_positive_qualitative | PASS | |
| record_left | PASS | Concrete artifact list. |

## Borderline / flexibility flags

- **Channel under-utilization is structural, not implementation.** The "rarely used" finding is repeated three times across the document. This is the load-bearing weakness of the idea — flag for stage 5 to consider whether the idea collapses to "internal CRM rollup only" in practice.
- The IGSC membership-cost `[unknown]` has only 2 queries; borderline THIN-SEARCH but plausible enough.

## For 4C to verify

- Claim: "IGSC has grown to over 40 members" — verify against IGSC site or recent secondary source.
- Claim: "An estimated 5% of orders are flagged for review" — attributed to Council on Strategic Risks; verify the page says this.
- Claim: "the IGSC has an information-sharing mechanism intended to assist providers in recognizing suspicious customers, but it has rarely been used" — verify which source actually contains this language (cited as RAND and PMC).
- Claim: PO boxes prohibited under harmonized protocol — verify against the protocol PDF if cited.

**Verdict:** PASS
