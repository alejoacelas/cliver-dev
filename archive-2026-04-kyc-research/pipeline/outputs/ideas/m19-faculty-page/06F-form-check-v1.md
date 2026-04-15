# 06F form check v1 — m19-faculty-page

| Field | Verdict | Note |
|---|---|---|
| Gap identification | PASS | Seven gaps including a structural dependency risk (PSE deprecation). All case-specific. |
| Category precision | PASS | Each gap names a precise population (e.g., "non-faculty research staff who place orders"). |
| Estimated size — citations | BORDERLINE | Gap 1 cites PhD-outside-academia stat (80%) and market share. Gap 6 cites Google deprecation timeline. Others are [best guess] or [unknown] with search terms documented. |
| Estimated size — [unknown] admissions | PASS | Gap 2 properly marked [unknown] with search queries. Others are [best guess] with reasoning. |
| Behavior classification | PASS | Mix of no-signal, false-positive, and weak-signal with clear reasoning. |
| False-positive qualitative | PASS | Eight items, cross-referenced to gaps, includes accuracy-vs-coverage distinction. |
| Notes for stage 7 | PASS | PSE migration risk flagged; multi-source recommendation clear. |

## For 6C to verify

- Claim: "~80% of biomedical PhDs work outside academia" — cited to academiainsider.com.
- Claim: "Only ~20% of life-sciences PhDs become faculty members" — cited to same source.
- Claim: "Custom Search JSON API closed to new customers; existing must transition by Jan 2027" — cited to Google developers page.
- Claim: "Vertex AI Search suggested successor for up to 50 domains" — cited to Google developers page.
- Claim: "DNA synthesis market ~50% commercial" — cited to Grand View Research.

## Verdict

PASS — thorough coverage analysis. Gap 2 size estimate is [unknown] which is honest. Structural deprecation risk (Gap 6) appropriately flagged.
