# 06F form check v1 — m19-openalex-author

| Field | Verdict | Note |
|---|---|---|
| Gap identification | PASS | Six gaps, all specific to OpenAlex's data characteristics. |
| Category precision | PASS | Each gap precisely describes the affected population. |
| Estimated size — citations | PASS | Gap 1 cites OpenAlex stats (114M authors). Gap 4 cites two peer-reviewed coverage studies with specific percentages (55–64% non-English coverage). Gap 6 cites disambiguation model update. |
| Estimated size — [unknown] admissions | PASS | All uncited estimates marked [best guess] with reasoning. |
| Behavior classification | PASS | Mix of no-signal, weak-signal, and false-positive with clear distinctions. |
| False-positive qualitative | PASS | Six-item list cross-referenced to gaps; notes the strongest-coverage population. |
| Notes for stage 7 | PASS | ORCID-linkage observation is actionable; cross-source pairing guidance clear. |

## For 6C to verify

- Claim: "OpenAlex contains ~114 million authors, 8M with ORCIDs" — cited to openalex.org/stats.
- Claim: "non-English monolingual journals ~64% coverage, multilingual ~55%" — cited to PMC11996208.
- Claim: "Africa proportionally as under-represented in OpenAlex as in Scopus" — cited to same PMC article.
- Claim: "resource-limited journals from low-income countries (47% of OJS journals) remain underrepresented" — cited to MIT Press QSS article.
- Claim: "OpenAlex switched to new disambiguation model July 2023" — cited to OpenAlex docs.
- Claim: "DNA synthesis market ~50% commercial" — cited to Grand View Research.

## Verdict

PASS — strong coverage analysis with well-cited geographic and linguistic bias data. All estimates sourced or marked.
