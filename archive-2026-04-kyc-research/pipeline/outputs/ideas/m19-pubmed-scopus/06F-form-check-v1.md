# 06F form check v1 — m19-pubmed-scopus

| Field | Verdict | Note |
|---|---|---|
| Gap identification | PASS | Seven gaps including a structural license dependency (Scopus). Case-specific to PubMed and Scopus data sources. |
| Category precision | PASS | Each gap precisely scoped with clear reasoning about why the data source misses the population. |
| Estimated size — citations | PASS | Gap 1 cites PubMed 40M+ citations and coverage variation study. Gap 3 cites Elsevier API ToS. Gap 2 cites market share. |
| Estimated size — [unknown] admissions | PASS | All uncited estimates marked [best guess]. No bare numbers. |
| Behavior classification | PASS | Mix of no-signal and weak-signal; structural gap (Gap 3) properly flagged. |
| False-positive qualitative | PASS | Seven items; correctly positions PubMed as narrower than OpenAlex. |
| Notes for stage 7 | PASS | Clear cost-benefit framing for Scopus licensing; PubMed-as-corroboration positioning. |

## For 6C to verify

- Claim: "PubMed has >40 million citations primarily in biomedicine" — cited to pubmed.ncbi.nlm.nih.gov/about.
- Claim: "PubMed coverage is ~70.9% of all publications" — cited to ScienceDirect Cochrane review study.
- Claim: "Scopus free tier is explicitly non-commercial use only" — cited to dev.elsevier.com.
- Claim: "DNA synthesis market ~50% commercial" — cited to Grand View Research.
- Claim: "PubMed affiliation only consistently attached post-2014" — from 04-implementation; 6C should verify.

## Verdict

PASS — thorough analysis. Correctly identifies PubMed as a corroboration source rather than standalone check. Scopus structural gap well-documented.
