# Coverage research: PubMed (NCBI E-utilities) + bioRxiv affiliation history

## Coverage gaps

### Gap 1: Industry CROs and for-profit biotech companies with no publication track record

- **Category:** Contract research organizations (CROs), small biotech startups in stealth mode, and commercial companies whose work is proprietary and never published. These entities may be legitimate synthesis customers with zero PubMed footprint.
- **Estimated size:** Biopharmaceutical companies hold ~47% of the synthesis market ([source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)). The global CRO market is ~$82 billion (2024) ([source](https://en.wikipedia.org/wiki/Contract_research_organization)). [best guess: 30–50% of commercial synthesis customers are companies that either never publish (CROs doing contract work under NDA, stealth-mode startups) or publish under a client's name rather than their own. This means the PubMed check yields `no_pubmed_affiliation_5yr` for a substantial fraction of the largest customer segment].
- **Behavior of the check on this category:** no-signal (`no_pubmed_affiliation_5yr` flag)
- **Reasoning:** PubMed indexes published research. Companies that conduct proprietary R&D, outsourced clinical work, or pre-publication discovery have no PubMed footprint by design. The flag is correct but uninformative for this population.

### Gap 2: Non-Anglophone research institutions in regional journals not indexed by PubMed

- **Category:** Life-sciences researchers at institutions in China, Japan, Latin America, Russia, and other non-Anglophone regions whose work is published primarily in non-English-language journals outside PubMed's index.
- **Estimated size:** PubMed's content is 86.5% English as of December 2023, with the proportion of English articles rising from 67% in the 1970s to nearly 90% now ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC11092906/)). Chinese-language articles constitute ~1.5% of PubMed despite China's large research output. Only 33% of Chinese journals are published in English ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC9079353/)). [best guess: Institutions in China, Japan, and Latin America whose researchers publish primarily in local-language journals may have 50–80% of their output invisible to a PubMed affiliation search. Given China's growing share of global biotech activity, this affects a significant and growing customer segment].
- **Behavior of the check on this category:** weak-signal (under-count of publications gives a false appearance of low activity)
- **Reasoning:** A Chinese biotech institute with 100+ publications in Chinese journals would show few or no hits in a PubMed `[ad]` field search. The institution appears to have low research activity when it actually has substantial output, just in venues PubMed doesn't fully index.

### Gap 3: Brand-new institutions and recently formed research entities (< 5 years)

- **Category:** Newly established research institutions, university spinouts, new biotech companies, and newly independent labs that have not yet accumulated a 5-year publication record.
- **Estimated size:** [best guess: same population as corp-registry-stack Gap 3 — ~1,000–1,500 new US biotechs/year, plus new research institutes globally. A newly formed institution has zero publications by definition in its first 1–2 years. Even by year 3–5, output may be thin. ~10–20% of first-time synthesis customers may be at institutions < 5 years old].
- **Behavior of the check on this category:** no-signal (`no_pubmed_affiliation_5yr` flag)
- **Reasoning:** The 5-year lookback window is reasonable for established institutions but structurally excludes new ones. A real new biotech spinout from a major university will have zero PubMed papers under its own name even though its founders have extensive records under their prior affiliations.

### Gap 4: Pure bioinformatics, computational biology, and engineering labs

- **Category:** Research labs focused on computational biology, bioinformatics, synthetic biology engineering, or agricultural biotech that publish primarily in CS/engineering venues (NeurIPS, IEEE, ACM conferences and journals, bioinformatics-specific journals) that may not be indexed in PubMed.
- **Estimated size:** [unknown — searched for: "percentage of bioinformatics publications not in PubMed", "computational biology publications PubMed vs IEEE ACM coverage"]. PubMed does index Bioinformatics (Oxford), BMC Bioinformatics, and PLOS Computational Biology, but many CS-oriented computational biology papers appear only in IEEE/ACM proceedings. [best guess: 10–20% of institutions whose primary research output is computational may have PubMed counts significantly lower than their true publication output].
- **Behavior of the check on this category:** weak-signal (under-count)
- **Reasoning:** A bioinformatics company ordering synthetic DNA for experimental validation may have most of its publications in ACM or IEEE venues. The PubMed count would not reflect its actual research activity.

### Gap 5: Institutions with common-word names (name-collision problem)

- **Category:** Institutions whose names are common phrases or overlap with other institutions, leading to inflated PubMed counts that include false matches from unrelated institutions.
- **Estimated size:** [best guess: 5–10% of institutions have names ambiguous enough to cause collision in PubMed's `[ad]` field search — e.g., "Genomic Research Institute", "National Center for Biotechnology", "Institute of Biology"]. The implementation's `affiliation_collision_risk` flag addresses this, but the problem is bidirectional: both false inflation (over-count from name collisions) and false depression (under-count if the name variant used in publications differs from the customer's stated name).
- **Behavior of the check on this category:** false-positive / weak-signal (noisy counts that require manual disambiguation)
- **Reasoning:** PubMed affiliation strings are unstructured free text. Name normalization is imperfect. Two-thirds of PubMed author names are vulnerable to homonym/synonym ambiguity, and East Asian names are the most problematic (noted in the implementation).

### Gap 6: Government laboratories and defense-affiliated research institutions

- **Category:** Government laboratories (e.g., US national labs like LANL, Sandia; defense research agencies like DTRA, DSTL) whose life-sciences work may be classified or restricted and does not appear in PubMed.
- **Estimated size:** [best guess: There are ~40 US national laboratories and federally funded research and development centers (FFRDCs), plus comparable entities in other countries. Many conduct life-sciences work but a fraction of their output is published in open literature. For defense-adjacent synthesis customers, the PubMed check may significantly under-count their actual research activity].
- **Behavior of the check on this category:** weak-signal (under-count)
- **Reasoning:** Classified or restricted research does not appear in PubMed. A DTRA-funded lab ordering synthesis for biodefense work may have a thin PubMed footprint relative to its actual research scope.

## Refined false-positive qualitative

1. **Industry/CRO customers** (Gap 1) — `no_pubmed_affiliation_5yr` fires on up to 30–50% of the commercial customer base. This is the highest-volume no-signal case. The flag is uninformative for companies that don't publish by design.
2. **Non-Anglophone institutions** (Gap 2) — The check systematically under-represents Chinese, Japanese, and Latin American institutions. These are real customers with real research; the check gives a false impression of low activity.
3. **New institutions** (Gap 3) — `no_pubmed_affiliation_5yr` fires on all newly formed entities. Same structural limitation as corp-registry-stack's `registry_recent_incorp`.
4. **Name-collision noise** (Gap 5) — Ambiguous institution names make the count unreliable in both directions. The `affiliation_collision_risk` flag catches some cases but the reviewer workload for disambiguation is high.

## Notes for stage 7 synthesis

- This check provides **strong positive signal** for established, Anglophone, academically active institutions (major universities, large research nonprofits, established biotech companies with publication records). For this population, it is one of the most informative signals in the M09 suite.
- It provides **weak or no signal** for the majority of non-academic commercial customers (the largest market segment), new institutions, non-Anglophone institutions, and proprietary/defense research entities.
- The check should be treated as a **positive-evidence signal** (presence of publications is reassuring) rather than a **negative-evidence signal** (absence of publications is not diagnostic). The `no_pubmed_affiliation_5yr` flag should have very low weight unless corroborated by other M09 shell-pattern signals.
- bioRxiv's limitation to corresponding-author affiliations only (noted in the implementation) further reduces coverage for collaborative institutions where the customer is typically a non-corresponding author.
