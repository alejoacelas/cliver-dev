# 06F Form check: m09-pubmed-affiliation — coverage v1

## Field-by-field verdicts

### coverage_gaps
**PASS** — Six gaps identified with precise categories. The key finding that 30–50% of commercial customers and most non-Anglophone institutions are in the no-signal zone is well-supported. Citations for PubMed's English-language dominance (86.5%) and Chinese journal English-publication rates (33%) are specific and sourced.

### false_positive_qualitative (refined)
**PASS** — Correctly reframes the check as a positive-evidence signal rather than a negative-evidence signal. Cross-references the gaps.

### Notes for stage 7 synthesis
**PASS** — The recommendation to down-weight `no_pubmed_affiliation_5yr` in the absence of other shell signals is the critical operational takeaway.

## Flags

### VAGUE: Gap 4 bioinformatics coverage
The claim that "10–20% of institutions whose primary research output is computational may have PubMed counts significantly lower" is a best guess with an `[unknown]` search admission, but the search terms listed are reasonable. The gap itself is real but the size estimate is poorly grounded.

### CITATION-MISSING: Gap 6 government lab count
The claim "~40 US national laboratories and FFRDCs" lacks a citation. This number is approximately correct (DOE has 17 national labs; there are ~40 FFRDCs total) but should be cited.

## For 4C to verify

1. The PubMed English-language dominance figure (86.5% as of December 2023) from PMC article — verify the article is a peer-reviewed publication and the figure is accurately reported.
2. The Chinese journal English-publication rate (33%) from the Lancet/PMC source — verify this figure and its recency.
3. The CRO market size (~$82B in 2024) from Wikipedia — verify against a primary source.

## Verdict: PASS

One VAGUE flag (bioinformatics gap sizing) and one CITATION-MISSING flag (government lab count). Both are minor. The coverage analysis is substantive and the core insight (positive-evidence signal only, not negative-evidence) is well-supported. No revision needed.
