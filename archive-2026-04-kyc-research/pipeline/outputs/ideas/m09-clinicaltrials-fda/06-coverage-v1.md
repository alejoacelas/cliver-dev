# Coverage research: ClinicalTrials.gov + FDA establishment registration cross-check

## Coverage gaps

### Gap 1: Basic-research academic labs that do not run clinical trials or hold FDA registrations
- **Category:** University single-PI labs, molecular biology / structural biology / computational biology / ecology / evolutionary biology departments, and other academic research groups that are real life-sciences institutions but do not sponsor clinical trials, manufacture drugs or devices, or hold any FDA establishment registration. This is the largest false-negative population.
- **Estimated size:** ClinicalTrials.gov has ~500,000+ registered studies with an estimated ~12,000-15,000 unique sponsors over its history ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4757412/) — 12,823 unique drug-trial sponsors over 2005-2014; the total is larger now but concentrated among the same institutional base). There are ~5,800+ US degree-granting institutions (NCES), and many thousands of university departments that do life-sciences research without any clinical trial involvement. Additionally, there are 644 biological research centers in the US ([source](https://www.causeiq.com/directory/biological-research-centers-list/)), many of which are basic-research-only. [best guess: perhaps 60-80% of university-based life-sciences researchers work in labs that have never sponsored a clinical trial and are not FDA-registered establishments. The check would fire `no_ctgov_no_fda_registration` for the majority of academic synthesis customers.]
- **Behavior of the check on this category:** false-negative (fires `no_ctgov_no_fda_registration`; non-blocking per the SOP)
- **Reasoning:** The check's underlying data sources (clinical trials registry, FDA establishment registry) are designed for translational medicine and regulated manufacturing, not basic research. A molecular biology lab ordering synthetic DNA for cloning is a core synthesis customer but invisible to both databases.

### Gap 2: Small biotech companies and CROs not running registered trials
- **Category:** Early-stage biotech startups (pre-IND), contract research organizations that perform assay development / preclinical work but do not sponsor their own clinical trials, and agricultural biotech companies whose products are not FDA-regulated.
- **Estimated size:** There are ~2,800+ biotech companies in the US ([source](https://www.statista.com/statistics/197930/number-of-united-states-biotech-companies-by-type/)), but ClinicalTrials.gov lists only ~12,000-15,000 unique sponsors total (including pharma, academic, and government). [best guess: the majority of small biotech companies (<50 employees, pre-revenue, pre-IND) have never registered a clinical trial and are not FDA-registered establishments. Perhaps ~70-85% of biotech companies would produce no signal from this check.]
- **Behavior of the check on this category:** false-negative
- **Reasoning:** The check is useful for established pharma/device/biologic companies but misses the long tail of early-stage and preclinical companies that are active synthesis customers.

### Gap 3: Foreign institutions not registered in US systems
- **Category:** Academic and commercial life-sciences institutions outside the US whose clinical trials are registered only with non-US registries (EU Clinical Trials Register, ISRCTN, ChiCTR, CTRI, ANZCTR) and whose establishments are not FDA-registered (because they do not export to the US market).
- **Estimated size:** ClinicalTrials.gov includes international trials registered by US-affiliated sponsors, but non-US institutions that sponsor trials only domestically may not appear. [best guess: ~40-60% of non-US institutional synthesis customers would produce no ClinicalTrials.gov hit. FDA establishment registration is US-centric by design, though foreign exporters to the US do register — but foreign basic-research institutions do not.]
- **Behavior of the check on this category:** false-negative
- **Reasoning:** Both data sources are US-centric. International coverage is incidental (US sponsors registering international sites, foreign manufacturers exporting to the US) rather than comprehensive.

### Gap 4: DIY biology labs and community research organizations
- **Category:** Community bio labs (Genspace, BioCurious, Open Bioeconomy Lab), citizen-science organizations, and makerspaces with biosafety-level-1 capabilities that order synthetic DNA for educational or citizen-science projects.
- **Estimated size:** [best guess: ~50-100 community bio labs worldwide; a small fraction of synthesis orders. None of these would appear in ClinicalTrials.gov or FDA establishment databases.]
- **Behavior of the check on this category:** false-negative
- **Reasoning:** These are legitimate-but-non-traditional customers entirely outside the regulated/translational medicine ecosystem.

### Gap 5: Name-normalization ambiguity causing false matches or missed matches
- **Category:** Institutions whose legal name differs from their ClinicalTrials.gov sponsor name or FDA registration name (e.g., "The Board of Trustees of the Leland Stanford Junior University" vs. "Stanford University" vs. "Stanford Health Care" in different databases).
- **Estimated size:** [best guess: ~15-25% of institutional name queries may face normalization challenges. ClinicalTrials.gov sponsor names are self-reported and not standardized; the same institution may appear under multiple name variants. FDA establishment names follow registration conventions that may not match customer-provided names.]
- **Behavior of the check on this category:** weak-signal (may miss a valid match due to name mismatch, or may match the wrong entity)
- **Reasoning:** Name normalization is a known challenge flagged in the implementation's failure_modes_requiring_review. The check's reliability depends heavily on the quality of the normalization layer.

## Refined false-positive qualitative

This check is designed as **positive corroboration** — a hit is good news. The failure mode is overwhelmingly **false negatives** (legitimate institutions with no hit):

1. **Basic-research academic labs** — the dominant gap; perhaps 60-80% of university-based synthesis customers (Gap 1)
2. **Small/early-stage biotech** — perhaps 70-85% of biotech companies (Gap 2)
3. **Foreign institutions** not in US registries — perhaps 40-60% of non-US customers (Gap 3)
4. **DIY / community labs** — small but structurally invisible (Gap 4)

True false positives (wrong institution matched) are rare but possible through name collisions (Gap 5).

The implementation correctly notes that the check is "most useful as positive corroboration when it fires, and weakly useful as a flag when it doesn't." This coverage analysis confirms that assessment: the check fires for a **minority** of legitimate synthesis customers.

## Notes for stage 7 synthesis

- This check's coverage is **narrow by design** — it validates a specific subset of customers (those in the clinical/translational/regulated pipeline) and is uninformative for the majority (basic research, preclinical, foreign, small biotech).
- The false-negative rate is so high (~60-80% of academic customers, ~70-85% of small biotech) that the `no_ctgov_no_fda_registration` flag should be treated as **non-diagnostic** — it should not contribute meaningfully to a risk score.
- The check's real value is as a **low-cost, high-confidence positive signal**: when it fires, it provides strong evidence of a real, regulated life-sciences entity at $0 marginal cost. This makes it worth including despite the narrow coverage.
- It should always be paired with broader M09 checks (pubmed-affiliation for academic coverage, corp-registry-stack for legal existence, irs-990 for nonprofits).
