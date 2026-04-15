# Coverage research: ROR Research Organization Registry

## Coverage gaps

### Gap 1: Commercial / industrial R&D entities not in ROR
- **Category:** Biotech startups, pharmaceutical companies, CROs, and industrial R&D groups that purchase synthetic DNA but are not registered in ROR (which focuses on research organizations, not commercial entities generally).
- **Estimated size:** ROR contains ~120k organizations ([source](https://ror.org/)), including `Company`-typed records, but its core mission is scholarly research organizations. The DNA synthesis market is ~50% biopharmaceutical/commercial by revenue ([source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report)). There are thousands of biotech startups and pharma companies worldwide; only a fraction carry ROR IDs. ROR's `Company` type exists but is not comprehensively populated for small/mid-cap biotech. [best guess: 30–50% of commercial DNA synthesis customers are at organizations without a ROR record, based on the ~50% commercial market share and the registry's academic-centric curation]
- **Behavior of the check on this category:** no-signal (ror_no_match)
- **Reasoning:** ROR's curation pipeline is community-driven and weighted toward organizations that produce scholarly outputs. A biotech startup that buys gene fragments but doesn't publish papers is unlikely to be in ROR unless it self-requests curation. These are legitimate high-volume customers.

### Gap 2: Research institutions in under-represented regions (Africa, MENA, Central Asia, parts of Latin America)
- **Category:** Academic researchers at institutions in countries where ROR coverage is sparse — particularly sub-Saharan Africa, the Middle East/North Africa, Central Asia, and most of Latin America outside Brazil.
- **Estimated size:** ROR covers organizations in 220 countries, but 20 countries account for >80% of all ROR IDs, with the US alone at ~30% ([source](https://hub.researchgraph.org/ror-mapping-research-organisation-ids/)). Africa, Latin America (except Brazil), and parts of Asia have low ROR ID creation rates ([source](https://hub.researchgraph.org/ror-mapping-research-organisation-ids/)). Of the world's ~50,000 higher-education institutions ([source](https://en.uhomes.com/blog/how-many-universities-are-there-worldwide)), ROR covers ~120k organizations (including non-university types), but the tail of small institutions in low-income countries is thin. [best guess: 10–25% of legitimate synthesis-customer institutions in non-OECD countries outside China/India/Brazil lack a ROR record]
- **Behavior of the check on this category:** no-signal (ror_no_match)
- **Reasoning:** A researcher at, say, a Kenyan or Uzbek university whose institution is not in ROR will trip `ror_no_match`. This is not evidence of illegitimacy — it's evidence of registry incompleteness.

### Gap 3: Community biology labs, makerspaces, and independent researchers
- **Category:** DIY biology labs (e.g., Genspace, BioCurious, Counter Culture Labs), independent researchers, and citizen scientists who order synthesis reagents outside any institutional framework.
- **Estimated size:** DIYbio.org lists ~100+ community bio labs worldwide ([source](https://diybio.org/local/)). The broader community includes an estimated 30,000 enthusiasts in the US alone ([source](https://www.brookings.edu/articles/do-it-yourself-biology-shows-safety-risks-of-an-open-innovation-movement/)). Very few of these labs have ROR IDs — they are informal organizations, not scholarly research entities. [best guess: <5 community bio labs have ROR records; essentially 0% coverage for this population]
- **Behavior of the check on this category:** no-signal (ror_no_match)
- **Reasoning:** Community labs are a small but non-trivial customer segment for synthesis providers. They are legitimate but structurally invisible to ROR. An independent researcher ordering under a personal name with no institutional affiliation will always fail this check.

### Gap 4: Government agencies and military labs with classified or restricted metadata
- **Category:** Government research labs (e.g., national defense labs, public health agencies) that may have ROR records but whose internal organizational structure is opaque — a customer from a sub-unit or classified program may not map cleanly to the parent ROR record.
- **Estimated size:** [best guess: a small fraction of overall customers (<5%), but these are high-sensitivity orders where false flags are costly. Major government labs (NIH, CDC, DTRA, Porton Down) have ROR records; sub-units and contractors often do not]
- **Behavior of the check on this category:** weak-signal (match to parent but not the operational unit)
- **Reasoning:** The customer says "USAMRIID, Diagnostic Systems Division" but ROR only has the parent "USAMRIID" record. The affiliation-match score may be high, but the check cannot verify the sub-unit or the customer's role within it.

### Gap 5: Very new legitimate institutions (startups, new research institutes, recently reorganized entities)
- **Category:** Institutions founded or reorganized within the past 6–12 months that have not yet been curated into ROR, or whose ROR record was just created and trips `ror_recent`.
- **Estimated size:** ROR's curation pipeline takes 4–6 weeks per request ([source](https://ror.org/blog/2025-10-08-journey-of-a-curation-request/)). [best guess: at any given time, 50–200 legitimate new research organizations worldwide are in the curation queue or have not yet submitted. Among DNA synthesis customers, this is a low single-digit percentage but overlaps heavily with biotech startups — see Gap 1]
- **Behavior of the check on this category:** false-positive (trips ror_recent or ror_no_match)
- **Reasoning:** A legitimate new biotech or a newly established university research center will either have no record (ror_no_match) or a very new record (ror_recent). Both flags are designed to catch shell organizations, but they also catch legitimate new entities.

### Gap 6: Industrial R&D groups embedded in non-research parent companies
- **Category:** R&D divisions of large non-research corporations (e.g., agricultural companies, food manufacturers, cosmetics firms) that order synthesis reagents. The parent company may have a ROR record typed as `Company`, but the match is uninformative — "Unilever" having a ROR ID does not confirm that a specific R&D chemist at Unilever is a legitimate synthesis customer.
- **Estimated size:** [best guess: 5–15% of commercial synthesis customers are at large corporations whose ROR record exists but whose type (`Company`) and sparse metadata provide no meaningful signal about the individual or their research role]
- **Behavior of the check on this category:** weak-signal (match exists but is uninformative)
- **Reasoning:** ROR confirms the parent organization exists. It does not confirm that the customer works in the R&D division, that the R&D division does biology, or that the order is consistent with the company's research. The check produces a match but no useful screening signal.

## Refined false-positive qualitative

Updated list incorporating the gaps above:

1. **Legitimate new institutions** (Gap 5) → trip `ror_recent` or `ror_no_match`. False-positive rate: low absolute numbers but high per-capita rate for this category.
2. **Commercial / biotech customers** (Gap 1) → trip `ror_no_match`. This is the largest false-positive population by volume (~30–50% of commercial customers).
3. **Under-represented-region researchers** (Gap 2) → trip `ror_no_match`. Disproportionately affects researchers from lower-income countries.
4. **Community bio labs / independents** (Gap 3) → trip `ror_no_match`. Small population but 100% miss rate.
5. **Large-company R&D staff** (Gap 6) → do not trip a flag but get weak signal. Not a false positive per se, but the check's positive match is misleading.
6. **Government sub-units** (Gap 4) → partial match to parent. May trip `ror_match_low_confidence` if the sub-unit name dominates the affiliation string.

## Notes for stage 7 synthesis

- The ROR check is strongest for established academic institutions in OECD countries. For that population, coverage is very high (likely >95% of R1-equivalent institutions have ROR records).
- The check is structurally blind to ~30–50% of the commercial customer base and nearly 100% of independent/community-lab customers.
- The geographic bias (US 30%, top-20 countries >80%) means that `ror_no_match` for a non-OECD institution is not meaningful negative evidence. Manual review playbooks must account for this.
- ROR is best used as a positive-signal primitive: a high-confidence match to an established institution is strong evidence; absence of a match is weak evidence that requires corroboration from other checks.
- Pair with m18-gleif or m09-corp-registry-stack for commercial entities, and m19-* checks for individual-level verification of researchers at institutions with weak ROR signal.
