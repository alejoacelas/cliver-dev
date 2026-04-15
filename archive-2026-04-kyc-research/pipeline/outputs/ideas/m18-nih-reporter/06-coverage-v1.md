# Coverage research: NIH RePORTER funded-institution signal

## Coverage gaps

### Gap 1: Foreign institutions (non-US) — vast majority have no NIH grants
- **Category:** Research institutions outside the United States. NIH primarily funds US-based institutions; foreign institutions receive a small fraction of NIH funding, mainly through collaborative awards (D43, U01, R01 with foreign components).
- **Estimated size:** NIH funds more than 2,500 institutions ([source](https://www.nih.gov/about-nih/what-we-do/budget)). Of these, the vast majority are US-based. [best guess: fewer than 500 foreign institutions appear as prime recipients in RePORTER over any 5-year window. With ~30,000+ research universities worldwide and many more research institutes, this means >95% of foreign research institutions have no NIH record.] The gene synthesis market is increasingly international, with Asia-Pacific at ~38% market share ([source](https://www.imarcgroup.com/gene-synthesis-market)).
- **Behavior of the check on this category:** no-signal (`no_nih_funding_5yr` fires but is expected and uninformative for foreign institutions)
- **Reasoning:** The implementation correctly identifies this gap and routes to "negative result expected — not an NIH-eligible category." But this means the check provides no value for ~50%+ of synthesis customers who are at non-US institutions.

### Gap 2: US non-biomedical institutions (engineering, physical sciences, agriculture)
- **Category:** US research institutions whose primary focus is not biomedical — engineering schools, physics/chemistry-only departments, agricultural research stations, environmental science institutes. These may legitimately order DNA synthesis (e.g., for plant biology, environmental monitoring, materials science with biological components) but have no NIH funding.
- **Estimated size:** NIH funds ~2,500 organizations. There are 187 R1 institutions in the US ([source](https://carnegieclassifications.acenet.edu/)), plus ~130 R2 institutions, plus hundreds of other research-active institutions. Most R1/R2 institutions have NIH funding in at least one department. However, institutions that are primarily engineering or physical-sciences focused (e.g., some polytechnics, national labs focused on energy/defense) may not. [best guess: 5–10% of US-based synthesis customers are at institutions with no NIH funding because their research domain is outside NIH's scope.]
- **Behavior of the check on this category:** weak-signal (`no_nih_funding_5yr` fires; the manual review playbook correctly categorizes them as "not an NIH-eligible category," but the flag still adds noise)
- **Reasoning:** The implementation handles this via reviewer judgment, but the flag fires for a category that is clearly legitimate.

### Gap 3: Industrial and for-profit entities (without SBIR/STTR history)
- **Category:** Commercial biotech companies, pharmaceutical companies, CROs, and agricultural biotech firms that do not participate in NIH's SBIR/STTR programs. Large pharma companies fund their own R&D; many biotechs rely on VC funding rather than NIH grants.
- **Estimated size:** The gene synthesis market is ~46% commercial/industry ([source](https://www.novaoneadvisor.com/report/us-gene-synthesis-market) — inverse of 54% academic+government). Of commercial entities, [best guess: perhaps 10–20% have SBIR/STTR history with NIH; the remaining 80–90% of commercial synthesis customers have no NIH record.]
- **Behavior of the check on this category:** no-signal (`no_nih_funding_5yr` fires but is expected and uninformative)
- **Reasoning:** Commercial entities are outside NIH's primary funding model. The check provides zero discriminating signal for the entire commercial segment.

### Gap 4: Brand-new US biomedical institutions (<5 years old)
- **Category:** Recently founded US biomedical research institutions, new university departments, or startups that have not yet received an NIH award. The 5-year lookback window means any institution founded within the past 5 years with pending applications but no awards is invisible.
- **Estimated size:** [best guess: dozens of new biomedical research entities are founded annually in the US. NIH R01 success rates are ~20% ([source](https://report.nih.gov/funding/nih-budget-and-spending-data-past-fiscal-years/success-rates)), and the time from application to award can be 1–2 years. A new institution might take 3–5 years to accumulate its first NIH award. At any given time, perhaps 100–300 new US biomedical institutions are in this gap.]
- **Behavior of the check on this category:** false-positive (`no_nih_funding_5yr` fires for a legitimate new biomedical institution that *should* be NIH-eligible but hasn't received funding yet)
- **Reasoning:** The implementation notes "brand-new legitimate biomedical labs (founded <5y ago) with applications pending but no awards yet." This is a true false positive for the subset that is in the biomedical space.

### Gap 5: Privately funded US biomedical research
- **Category:** US-based biomedical research institutions funded primarily by private philanthropy (HHMI, Gates Foundation, Wellcome Trust, philanthropy-backed institutes) or endowments rather than NIH grants.
- **Estimated size:** HHMI alone supports ~300 investigators at various institutions ([source](https://www.hhmi.org/programs/biomedical-research)). The Allen Institute, Broad Institute (partially), Janelia Research Campus, and other philanthropy-heavy institutes may have mixed NIH funding. [best guess: most HHMI investigators are at institutions that *also* have NIH funding, so the institution would still appear in RePORTER. But a small number of privately funded institutes (perhaps 20–50) rely primarily on non-NIH sources and may have minimal or no RePORTER presence.]
- **Behavior of the check on this category:** weak-signal (some privately funded institutes still appear in RePORTER through their investigators' NIH grants; others do not)
- **Reasoning:** This is a small gap in absolute numbers but includes some high-profile institutions.

### Gap 6: Name normalization failures
- **Category:** Institutions that exist in RePORTER under a different name string than what the customer provides. Hospital systems, departmental subdivisions, and multi-campus universities are particularly vulnerable.
- **Estimated size:** [best guess: 5–15% of lookups for institutions that *are* in RePORTER may fail name matching on the first attempt. The implementation's alias table and fuzzy matching reduce but do not eliminate this. Research hospitals are the worst case — "Johns Hopkins Hospital" vs "Johns Hopkins University" vs "Johns Hopkins School of Medicine" vs "Johns Hopkins Bloomberg School of Public Health" may be different org_name strings in RePORTER.]
- **Behavior of the check on this category:** false-negative (institution is in RePORTER but the lookup returns zero results due to name mismatch)
- **Reasoning:** The implementation addresses this with an alias table and fuzzy fallback. The residual gap is for institutions with many subdivisions that RePORTER lists under different org_names.

## Refined false-positive qualitative

1. **Foreign institutions** (Gap 1) — `no_nih_funding_5yr` fires for essentially all non-US institutions. Not a false positive per se (the flag is soft), but it means the flag is uninformative for the majority of non-US customers.
2. **Commercial entities** (Gap 3) — same: `no_nih_funding_5yr` fires for most commercial customers. Expected and handled by the reviewer playbook.
3. **New US biomedical institutions** (Gap 4) — true false positive. The institution is in the right category but too new for funding.
4. **Privately funded US institutes** (Gap 5) — weak signal; most still have some NIH footprint.
5. **Name normalization misses** (Gap 6) — false negative, not false positive. The institution has NIH funding but the lookup misses it.

## Notes for stage 7 synthesis

- NIH RePORTER is a **positive-evidence** check: it can strongly confirm institutional legitimacy (NIH-funded institutions are real) but cannot strongly deny it (most non-NIH institutions are also real). The asymmetry means this check is most useful in combination with other signals.
- The check covers ~2,500 institutions out of the tens of thousands that buy gene synthesis. Its strength is in the *quality* of the positive signal, not in coverage breadth.
- The foreign-institution gap (Gap 1) is the largest by population. The m18-nsf-awards idea (NSF + UKRI + CORDIS) partially closes this by adding European and broader US funder coverage.
- Name normalization (Gap 6) is a universal problem across all registry-based checks. A shared name-normalization service (seeded from ROR aliases) would benefit all m18 ideas.
