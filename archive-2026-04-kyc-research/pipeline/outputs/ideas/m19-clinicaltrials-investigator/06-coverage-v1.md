# Coverage research: ClinicalTrials.gov + FDA BIMO investigator

## Coverage gaps

### Gap 1: Basic-science researchers (non-clinical)
- **Category:** Molecular biologists, microbiologists, biochemists, structural biologists, and other bench scientists whose work never enters FDA-regulated clinical trials. This is the majority of life-sciences researchers who order synthetic DNA.
- **Estimated size:** The FDA BMIS database lists ~172,000 unique investigators who submitted Form 1572 between 1999–2015 ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC6536616/)). The US life-sciences researcher workforce grew 87% between 2002–2022 ([source](https://www.cbre.com/insights/books/us-life-sciences-research-talent-2023/us-life-sciences-research-talent-trends)), and the US alone produces ~40,000+ biological/biomedical PhDs per year ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4503365/)). The cumulative life-sciences PhD workforce in the US is well over 500,000. Clinical investigators are a small subset. [best guess: 70–85% of legitimate synthesis-ordering researchers are basic scientists who will never appear in ClinicalTrials.gov or BMIS]
- **Behavior of the check on this category:** no-signal (both `no_ctgov_record` and `no_fda_bimo_record` fire)
- **Reasoning:** This check is positive-evidence-shaped. It confirms a clinical-trial role for the minority who have one; it is structurally silent on the majority who do basic research. A molecular biologist ordering cloned gene fragments will always fail this check regardless of legitimacy.

### Gap 2: Non-US researchers without US trial sites
- **Category:** Researchers outside the US who conduct clinical work regulated by non-FDA agencies (EMA, PMDA, TGA, ANVISA, etc.) and whose trials are not registered on ClinicalTrials.gov.
- **Estimated size:** ClinicalTrials.gov has >500,000 registered studies ([source](https://nlmdirector.nlm.nih.gov/2025/04/02/clinicaltrials-gov-a-25-year-journey-to-a-half-million-registered-studies/)), and international registration has grown, but many non-US trials are registered only on regional registries (EU CTR, ANZCTR, CTRI India, ChiCTR, etc.). [best guess: 30–50% of clinical researchers outside the US/Canada are not findable on ClinicalTrials.gov, particularly those in Asia, Africa, and Latin America whose trials have no US IND]
- **Behavior of the check on this category:** no-signal (no_ctgov_record fires; BMIS is US-only by definition)
- **Reasoning:** BMIS covers only FDA-regulated trials. ClinicalTrials.gov has grown international registration since the ICMJE mandate, but coverage of non-US-funded, non-multinational trials remains incomplete.

### Gap 3: Early-career researchers and trainees
- **Category:** PhD students, postdocs, research associates, and other trainees who are too junior to be listed as PI, study director, or site investigator on any trial.
- **Estimated size:** There is approximately 1 tenure-track position for every ~6.3 PhD graduates in the US life sciences ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4503365/)). A substantial fraction of synthesis orders come from trainees operating under a PI's lab. [best guess: 30–50% of individual researchers who physically place synthesis orders are trainees with no ClinicalTrials.gov or BMIS presence]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** Trainees are legitimate order-placers but invisible to investigator databases. The check is null for them by design.

### Gap 4: Industry scientists in pharma/biotech
- **Category:** R&D scientists at pharmaceutical and biotech companies who contribute to drug development but are not listed as investigators on Form FDA 1572 (which names the principal investigator at each clinical site, not the bench scientists at the sponsor company).
- **Estimated size:** The US biopharma industry employs hundreds of thousands of R&D workers. BMIS lists investigators at clinical *sites*, not sponsor-company employees. [best guess: the vast majority (>90%) of pharma/biotech R&D staff who order synthesis reagents are not in BMIS or ClinicalTrials.gov as named investigators]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** An R&D scientist at Moderna ordering gene fragments for vaccine development will not appear in BMIS unless they personally serve as a site PI on an IND trial. The check misses the entire sponsor-side workforce.

### Gap 5: Veterinary, agricultural, and environmental researchers
- **Category:** Researchers in veterinary medicine, agriculture, food science, and environmental biology who order synthetic DNA but do not conduct human clinical trials.
- **Estimated size:** [best guess: 5–10% of synthesis customers work in non-human-health fields. None will appear in ClinicalTrials.gov (human trials) or BMIS (FDA human drug/biologic/device investigations)]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** ClinicalTrials.gov and BMIS are scoped to human subjects research. The entire non-human biology customer segment is invisible.

### Gap 6: Researchers active before 2008 who have not run recent trials
- **Category:** Senior or retired researchers whose FDA-regulated trial activity predates the BMIS data window (Form 1572s received since October 1, 2008).
- **Estimated size:** [best guess: a small but non-zero population — established PIs who ran trials in the 1990s–2000s but transitioned to basic research or administration. Perhaps 2–5% of senior researchers who order synthesis reagents]
- **Behavior of the check on this category:** no-signal (no_fda_bimo_record fires even though they have real regulatory history)
- **Reasoning:** BMIS has a hard cutoff at Oct 2008. ClinicalTrials.gov goes back further but is less complete for older studies. A legitimate senior investigator whose last IND trial was in 2005 will show no BMIS record.

## Refined false-positive qualitative

This check is overwhelmingly positive-evidence-shaped. The dominant error mode is **false negatives** (legitimate customers producing no signal), not false positives (illegitimate customers passing). Updated list:

1. **Basic researchers** (Gap 1) — the largest miss population, ~70–85% of synthesis customers. Null result is expected and not informative.
2. **Non-US clinical researchers** (Gap 2) — ~30–50% of international clinical researchers invisible.
3. **Trainees** (Gap 3) — ~30–50% of individual order-placers.
4. **Industry scientists** (Gap 4) — >90% of pharma R&D staff invisible.
5. **Non-human-health researchers** (Gap 5) — 100% miss rate for vet/ag/environmental.
6. **Pre-2008 investigators** (Gap 6) — small tail of senior researchers.

The only true false-positive risk is **common-name collision** (matching the wrong "John Smith" to a clinical investigator record), which is an accuracy issue rather than a coverage gap.

## Notes for stage 7 synthesis

- This check is useful *only* as a positive-signal booster: a match confirms the customer has a real clinical-trial role and is strong evidence. But absence is structurally uninformative for the majority of legitimate customers.
- Should never be used as a standalone denial gate. Must be combined with other M19 checks (OpenAlex, ORCID, PubMed, faculty page) in a signal-fusion model.
- The check's value is highest for customers who *claim* clinical or translational research roles — a claim + null result is substantive; a null result without a clinical claim is expected.
- International coverage could be improved by adding WHO ICTRP search or regional trial registries (EU CTR, CTRI), but those lack the investigator-level granularity of ClinicalTrials.gov.
