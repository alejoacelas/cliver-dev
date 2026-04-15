# Coverage research: PubMed (NCBI E-utilities) + Scopus Author API

## Coverage gaps

### Gap 1: Researchers outside biomedicine (chemistry, engineering, plant biology, environmental science)
- **Category:** Researchers who order synthetic DNA for non-biomedical applications — synthetic chemistry, bioengineering, agricultural biology, environmental microbiology, materials science — and publish primarily in journals not indexed by PubMed.
- **Estimated size:** PubMed contains >40 million citations primarily in biomedicine and life sciences ([source](https://pubmed.ncbi.nlm.nih.gov/about/)). PubMed coverage is ~70.9% of all publications but varies hugely across specialties ([source](https://www.sciencedirect.com/science/article/abs/pii/S0895435619300836)). Fields like chemistry, engineering, and plant biology are underrepresented. [best guess: 10–20% of synthesis customers work in fields where PubMed indexing is sparse. These researchers publish in ACS, RSC, Wiley chemistry journals, IEEE, or agricultural journals that are outside PubMed's MEDLINE scope.]
- **Behavior of the check on this category:** no-signal (no_pubmed_author fires despite the researcher having a robust publication record in non-PubMed-indexed venues)
- **Reasoning:** PubMed's scope is biomedical. A synthetic chemist with 50 publications in the Journal of the American Chemical Society may have zero PubMed-indexed papers.

### Gap 2: Industry / commercial scientists
- **Category:** R&D scientists at pharma, biotech, and other commercial entities who publish infrequently or not at all due to corporate IP restrictions.
- **Estimated size:** ~50% of DNA synthesis market is commercial ([source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report)). [best guess: 40–60% of industry R&D staff who order synthesis reagents have no or very few PubMed-indexed publications under their current corporate affiliation]
- **Behavior of the check on this category:** no-signal (no_pubmed_author fires)
- **Reasoning:** Corporate scientists often cannot publish due to IP/trade-secret restrictions. When they do publish, the affiliation is corporate, which may not match query expectations.

### Gap 3: Scopus commercial license requirement (structural gap)
- **Category:** All customers, if the synthesis provider (a commercial entity) cannot obtain a Scopus commercial API license. The Scopus free tier is explicitly non-commercial use only ([source](https://dev.elsevier.com/sc_apis.html)). A DNA synthesis provider using Scopus for KYC would require a paid commercial agreement.
- **Estimated size:** This affects the entire Scopus signal path. Without a commercial license, the implementation degrades to PubMed-only, losing the Scopus author disambiguation, h-index, and affiliation-history features. [vendor-gated — Elsevier pricing is custom-quoted; likely low-to-mid five figures USD/year for a commercial API agreement ([best guess: by analogy to other Elsevier commercial products])]
- **Behavior of the check on this category:** no-signal (entire Scopus path inoperable without license)
- **Reasoning:** This is not a population gap but a structural dependency. The 04-implementation acknowledges it: "Commercial DNA-synthesis provider lacking Scopus license: the Scopus signal is structurally unavailable."

### Gap 4: Early-career researchers with no or few publications
- **Category:** PhD students, new postdocs, and other early-career researchers who have not yet published enough to be reliably findable in PubMed or Scopus.
- **Estimated size:** [best guess: 10–20% of academic synthesis customers are early-career with 0–3 publications. PubMed author search with affiliation filter will return nothing or unreliable results for these researchers.]
- **Behavior of the check on this category:** no-signal or weak-signal
- **Reasoning:** PubMed has no native author ID system. Searching by name + affiliation for someone with 1 paper is unreliable and prone to both false matches and false misses.

### Gap 5: Non-publishing research staff (technicians, lab managers, purchasing coordinators)
- **Category:** Research support staff who place synthesis orders but do not author publications.
- **Estimated size:** [best guess: 15–25% of individuals who place synthesis orders in academic settings are non-publishing staff]
- **Behavior of the check on this category:** no-signal (no_pubmed_author and no_scopus_author both fire)
- **Reasoning:** Same as OpenAlex: publication-based checks are blind to non-publishing populations.

### Gap 6: PubMed affiliation field limitations (pre-2014 records)
- **Category:** Researchers whose publications predate PubMed's consistent affiliation indexing. Before ~2014, PubMed only attached affiliation information to the first author of most papers. Searching by `Author[Author] AND Institution[Affiliation]` has low recall for researchers whose publications are older.
- **Estimated size:** [best guess: affects 5–10% of mid-career and senior researchers who published heavily before 2014 but less frequently since. Their older papers lack the affiliation metadata needed for the affiliation-filtered query.]
- **Behavior of the check on this category:** weak-signal (name search returns results but affiliation filter misses them)
- **Reasoning:** This is a technical limitation of PubMed's metadata. The 04-implementation notes it: "Affiliation[Affiliation] is free-text and only attached to recent (post-2014ish) records consistently."

### Gap 7: Name disambiguation challenges (no native author ID in PubMed)
- **Category:** Researchers with common names where PubMed returns too many results to disambiguate, or too few due to inconsistent name formatting.
- **Estimated size:** PubMed has no native author identification system (unlike Scopus, which has Author IDs). [best guess: 10–15% of PubMed name queries for common names will be ambiguous or return the wrong author. Middle initials and affiliations help but are not definitive.]
- **Behavior of the check on this category:** weak-signal (ambiguous results, potential wrong-person match)
- **Reasoning:** Without author IDs, PubMed name search is fundamentally a string-matching exercise. This is the weakest disambiguation of any of the M19 bibliometric checks.

## Refined false-positive qualitative

1. **Non-biomedical researchers** (Gap 1) — ~10–20% of synthesis customers. PubMed scope limitation.
2. **Industry researchers** (Gap 2) — ~40–60% of industry staff. No or stale publications.
3. **Scopus license unavailability** (Gap 3) — structural: entire Scopus path may be inoperable.
4. **Non-publishing staff** (Gap 5) — ~15–25% of academic order-placers.
5. **Early-career researchers** (Gap 4) — ~10–20%. Thin records.
6. **Pre-2014 affiliation gap** (Gap 6) — ~5–10% of senior researchers.
7. **Name disambiguation** (Gap 7) — ~10–15% of common-name queries.

PubMed is narrower in scope than OpenAlex (biomedical only vs. all scholarly fields) and weaker in disambiguation (no author IDs vs. OpenAlex's algorithmic disambiguation). Scopus would partially compensate but requires a commercial license that may not be obtainable.

## Notes for stage 7 synthesis

- PubMed-only (without Scopus) is a strictly weaker version of the OpenAlex check for individual verification: narrower venue coverage, no author IDs, and no affiliation history.
- The main added value of PubMed is as a **cross-source corroboration** for OpenAlex: if both OpenAlex and PubMed independently confirm the same author-at-institution, the combined signal is stronger than either alone.
- Scopus adds value through its author disambiguation and h-index, but the commercial license requirement is a hard barrier for many synthesis providers. The cost-benefit of Scopus licensing vs. just using OpenAlex + PubMed should be evaluated.
- PubMed is free and has no commercial-use restrictions, making it the most accessible bibliometric check.
- The PubMed affiliation field limitation (pre-2014) means the check is most reliable for active, recently-publishing researchers — exactly the population already well-served by OpenAlex.
- Pair with m19-openalex-author as the primary bibliometric check; PubMed serves as a second-source confirmation, not a standalone signal.
