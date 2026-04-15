# 06F form check v1 — m19-orcid-employments

| Field | Verdict | Note |
|---|---|---|
| Gap identification | PASS | Six gaps, all specific to ORCID's data model and adoption patterns. |
| Category precision | PASS | Each gap precisely scoped (e.g., "researchers whose employment is set to trusted-parties-only visibility"). |
| Estimated size — citations | PASS | Gap 1 cites ORCID's own 2% institution-verified stat and 10.5M active users. Gap 2 cites adoption rates by field (80–93% in US life sciences) and by country (Portugal 67%, US/China/Japan <40%). Gap 4 cites market share. |
| Estimated size — [unknown] admissions | PASS | Gap 3 properly marked [unknown] with search queries. Others are [best guess] with reasoning. |
| Behavior classification | PASS | Mix of weak-signal, no-signal, and false-positive with clear rationale. |
| False-positive qualitative | PASS | Six items cross-referenced to gaps; correctly highlights the 2% threshold as the key limitation. |
| Notes for stage 7 | PASS | ORCID-at-order-time trade-off noted; pairing guidance clear. |

## For 6C to verify

- Claim: "only ~2% of ORCID records have an affiliation added by an organization (Aug 2023)" — cited to ORCID blog post (also cited in 04-implementation).
- Claim: "ORCID has 10.5 million active users" — cited to ORCID 2025 year-in-review.
- Claim: "US life-sciences faculty ORCID adoption ~80–93%" — cited to Scientometrics 2025 paper.
- Claim: "Portugal ~67% adoption, US/China/Japan below 40%" — cited to PMC8996239.
- Claim: "DNA synthesis market ~50% commercial" — cited to Grand View Research.

## Verdict

PASS — the analysis correctly identifies the 2% institution-verified rate as the central coverage limitation. All sections complete with adequate sourcing.
