# Coverage research: OpenAlex author + affiliation history lookup

## Coverage gaps

### Gap 1: Non-publishing researchers (lab managers, technicians, BSOs, core facility staff)
- **Category:** Research support staff who place synthesis orders but do not author publications. They have no OpenAlex Author record because they have never appeared on an indexed work.
- **Estimated size:** OpenAlex contains ~114 million author records ([source](https://openalex.org/stats)). But this includes all disciplines globally. The population of non-publishing research staff is invisible by definition. [best guess: 15–25% of individuals who place synthesis orders in academic settings are non-publishing staff (lab managers, technicians, purchasing coordinators). In industry, this fraction is higher.]
- **Behavior of the check on this category:** no-signal (openalex_no_author_found fires)
- **Reasoning:** OpenAlex indexes authors of scholarly works. Staff who facilitate research but don't author papers are structurally absent.

### Gap 2: Industry / commercial R&D scientists
- **Category:** Scientists at biotech, pharma, and other commercial entities who publish infrequently or not at all due to corporate IP restrictions.
- **Estimated size:** ~50% of DNA synthesis market is commercial ([source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report)). Many industry scientists have thin or zero publication records. [best guess: 40–60% of industry R&D staff who order synthesis reagents have no retrievable OpenAlex author record, or a stale one from their prior academic career]
- **Behavior of the check on this category:** no-signal or weak-signal (openalex_affiliation_mismatch — last known institution is the prior academic employer, not the current commercial one)
- **Reasoning:** Corporate employers rarely appear as affiliations on indexed works. OpenAlex may show the researcher's last academic affiliation, creating a mismatch with the commercial entity they now work for.

### Gap 3: Early-career researchers with thin publication records
- **Category:** PhD students in their first years, postdocs who have not yet published first-author papers, and researchers in fields with long publication cycles.
- **Estimated size:** [best guess: 10–20% of academic synthesis customers are early-career researchers with 0–3 publications, making OpenAlex matching unreliable. The 04-implementation cites "Estimated 15–30% of legitimate customers have individual footprints thin enough to flag on strict review."]
- **Behavior of the check on this category:** weak-signal (openalex_no_author_found or openalex_ambiguous_match due to few disambiguating works)
- **Reasoning:** With few publications, the disambiguation algorithm has little signal to work with. Common names with 1–2 papers are particularly vulnerable to wrong-author matches or no-match outcomes.

### Gap 4: Researchers publishing in under-indexed venues (non-English, Global South)
- **Category:** Researchers who publish primarily in non-English journals, regional journals from low-income countries, or venues without Crossref DOIs.
- **Estimated size:** OpenAlex claims broader coverage than Scopus/WoS, but non-English monolingual journals have only ~64% coverage, and non-English multilingual journals only ~55% ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC11996208/)). Africa is proportionally as under-represented in OpenAlex as in Scopus ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC11996208/)). Resource-limited journals from low-income countries (47% of OJS journals) remain underrepresented ([source](https://direct.mit.edu/qss/article/doi/10.1162/QSS.a.17/132192/On-the-open-road-to-universal-indexing-OpenAlex)). [best guess: 15–30% of researchers in non-OECD countries have incomplete or missing OpenAlex profiles due to venue indexing gaps]
- **Behavior of the check on this category:** no-signal or weak-signal
- **Reasoning:** A researcher who publishes exclusively in a Francophone West African journal without a Crossref DOI may have no OpenAlex record. Their work is real but invisible to the index.

### Gap 5: Researchers who recently changed institutions (affiliation lag)
- **Category:** Researchers who moved to a new institution but whose most recent indexed publication still lists the prior institution. OpenAlex `last_known_institutions` and `affiliations[]` lag by 6–18 months.
- **Estimated size:** [best guess: at any given time, 5–10% of researchers are within 18 months of an institutional move. For these, the affiliation check (openalex_affiliation_mismatch) will fire despite the move being legitimate. The 04-implementation estimates 6–18 months lag based on Crossref/PubMed indexing pipeline.]
- **Behavior of the check on this category:** false-positive (openalex_affiliation_mismatch fires for a legitimate job change)
- **Reasoning:** Affiliation data in OpenAlex is derived from publication metadata, which is backward-looking. A researcher who just moved will show the old employer until they publish from the new one.

### Gap 6: Author disambiguation errors (common names, profile splitting/merging)
- **Category:** Researchers with very common names (especially East Asian names with common romanizations) where OpenAlex's disambiguation algorithm assigns works to the wrong author or splits a single researcher across multiple Author IDs.
- **Estimated size:** OpenAlex switched to a new disambiguation model in July 2023 ([source](https://docs.openalex.org/api-entities/authors/author-disambiguation)). Accuracy has improved but remains imperfect at the scale of ~114M authors. [best guess: 5–15% of name lookups for common names will return an incorrect or ambiguous candidate. The error rate is highest for names like "Wei Zhang" or "Maria Garcia" without an ORCID tiebreaker.]
- **Behavior of the check on this category:** false-positive (wrong author matched, flagging legitimate customer as mismatched) or weak-signal (ambiguous match)
- **Reasoning:** Disambiguation is a known hard problem. Without ORCID linkage, common-name searches are unreliable.

## Refined false-positive qualitative

1. **Non-publishing staff** (Gap 1) — ~15–25% of academic order-placers. 100% miss rate.
2. **Industry researchers** (Gap 2) — ~40–60% of industry staff invisible or stale. Largest gap by customer volume.
3. **Under-indexed-venue researchers** (Gap 4) — ~15–30% of non-OECD researchers. Geographic bias.
4. **Early-career researchers** (Gap 3) — ~10–20% of academic customers. Thin records.
5. **Recently moved researchers** (Gap 5) — ~5–10% transient. Triggers affiliation mismatch.
6. **Common-name disambiguation failures** (Gap 6) — ~5–15% of common-name lookups. Accuracy issue.

The check is strongest for established mid-career and senior academic researchers at OECD institutions who publish regularly in English-language journals with Crossref DOIs and have ORCID-linked OpenAlex profiles.

## Notes for stage 7 synthesis

- OpenAlex is the broadest open bibliometric source available (114M authors, CC0), making it the best single check for publication-based individual verification.
- But it shares the fundamental limitation of all publication-based checks: it is blind to non-publishing populations, which are a large fraction of synthesis customers.
- The 04-implementation correctly notes this is best as a positive signal (presence confirms a real publication footprint) rather than a negative signal (absence proves nothing).
- Geographic and linguistic biases mean the check works better for English-language, OECD-country researchers. Non-OECD researchers face both venue-indexing gaps and name-disambiguation challenges.
- ORCID linkage (8M of 114M authors) dramatically improves disambiguation. Requiring ORCID at order time would mitigate Gaps 5 and 6 but introduces its own coverage issues (see m19-orcid-employments).
- Pair with m19-pubmed-scopus as a cross-source corroboration, and m19-orcid-employments for employment verification independent of publication records.
