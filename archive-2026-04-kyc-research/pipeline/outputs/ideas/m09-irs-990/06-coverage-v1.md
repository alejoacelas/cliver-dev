# Coverage research: IRS Form 990 / Candid / ProPublica Nonprofit Explorer cross-check

## Coverage gaps

### Gap 1: For-profit biotech and pharmaceutical companies (the majority of commercial synthesis customers)

- **Category:** For-profit corporations (C-corps, LLCs, S-corps) that are not 501(c)(3) organizations and therefore do not file Form 990.
- **Estimated size:** Biotech and pharmaceutical companies dominate the synthesis market with ~47% market share ([source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)). These are overwhelmingly for-profit entities. The check is structurally N/A for this entire segment — `no_990` fires but is uninformative since the customer never claimed nonprofit status. [best guess: >95% of the commercial/biopharma segment are for-profits].
- **Behavior of the check on this category:** no-signal (`no_990` flag, but expected and uninformative)
- **Reasoning:** Form 990 is a nonprofit reporting instrument. For the largest customer segment by revenue, this check produces no usable signal. It is only applicable to the subset of customers claiming 501(c)(3) status.

### Gap 2: Foreign nonprofit and academic institutions (non-US)

- **Category:** Non-US universities, research charities, international NGOs, and foreign government-funded research institutes that do not file with the IRS.
- **Estimated size:** The US has ~1.8 million registered nonprofits ([source](https://learning.candid.org/number-of-nonprofits-in-us/272665)). International research institutions — European universities, UK charities, Indian and Chinese government institutes, etc. — do not file US Form 990. Academic institutions represent ~39% of the synthesis market ([source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)), and a significant fraction of those are non-US. [best guess: ~40–60% of academic synthesis customers are at non-US institutions, meaning this check is N/A for ~15–25% of total synthesis market by revenue].
- **Behavior of the check on this category:** no-signal (`no_990`, expected)
- **Reasoning:** IRS data is US-only. No foreign equivalent is integrated in this implementation. For non-US nonprofit customers, this check adds nothing. The reviewer falls back to corp-registry-stack, which faces its own gaps for these entities.

### Gap 3: Small US nonprofits filing only Form 990-N (e-Postcard)

- **Category:** US 501(c)(3) organizations with gross receipts < $50,000 that file the 990-N e-Postcard, which contains only EIN, name, address, and confirmation of small size — no financial, program, or officer data.
- **Estimated size:** Approximately 65% of IRS-registered nonprofits file 990-N postcards or are otherwise exempt from full financial reporting ([source](https://urbaninstitute.github.io/nccs-legacy/briefs/sector-brief-2019)). The original mandate in 2006 covered >714,000 organizations ([source](https://www.urban.org/research/publication/small-nonprofit-organizations-profile-form-990-n-filers)). In the life-sciences subset, this captures community biolabs, small research nonprofits, newly formed 501(c)(3) biotech incubators, and fiscally-young organizations. [best guess: among the ~few hundred US nonprofit life-sciences organizations that might order synthesis, 20–40% are small enough to file only 990-N].
- **Behavior of the check on this category:** weak-signal (`990_revenue_implausible` flag fires, but the low revenue is genuine, not suspicious)
- **Reasoning:** The check flags organizations with only 990-N postcards as `990_revenue_implausible`. But for community biolabs (GenSpace, BioCurious, Open Bio Labs) and small research nonprofits, this is their true financial profile. The flag is a structural false positive for this legitimate population.

### Gap 4: Newly formed US 501(c)(3)s (< 1 filing year)

- **Category:** Recently IRS-recognized 501(c)(3) organizations that have not yet filed their first Form 990 (which is not due until 5 months after the first fiscal year end, with possible extensions).
- **Estimated size:** [best guess: The IRS grants ~80,000–100,000 new 501(c)(3) determinations per year ([source](https://www.irs.gov/statistics/soi-tax-stats-charities-and-other-tax-exempt-organizations-statistics)). A new organization may not have a 990 on file for 12–24 months after determination. In the life-sciences subset, this is a small but non-trivial population — new research nonprofits, university spinout foundations, and disease-focused charities].
- **Behavior of the check on this category:** no-signal (`no_990` flag)
- **Reasoning:** Filing lag is inherent to the 990 system. The implementation's monthly S3 refresh adds further delay. A new 501(c)(3) that's been operating for 6 months with real research activity will show no 990 record.

### Gap 5: Fiscally sponsored projects

- **Category:** Research projects that operate under a fiscal sponsor's EIN rather than having their own 501(c)(3) status — common for early-stage academic initiatives, community science projects, and nascent research collaborations.
- **Estimated size:** [unknown — searched for: "number of fiscally sponsored projects US", "fiscal sponsorship prevalence nonprofit research", "percentage of nonprofit projects under fiscal sponsor"]. Fiscal sponsorship is a well-known structure in the US nonprofit sector. [best guess: 5–10% of small nonprofit research entities operate under fiscal sponsorship, based on the prevalence of fiscal sponsors like the New Venture Fund, Tides Foundation, and community foundation models in research funding].
- **Behavior of the check on this category:** no-signal (the project name will not match the fiscal sponsor's 990; the fiscal sponsor's 990 may or may not mention the project in its program descriptions)
- **Reasoning:** The customer places an order under the project name, not the fiscal sponsor's name. EIN lookup fails because the project has no EIN. Even if the reviewer knows the fiscal sponsor, the 990 aggregates all sponsored projects and individual project details are buried.

## Refined false-positive qualitative

1. **For-profit companies** (Gap 1) — `no_990` fires on ~47% of the market. Not a false positive in the strict sense (the flag correctly indicates no record) but uninformative. The check must be scoped to customers claiming nonprofit status only.
2. **Small community biolabs** (Gap 3) — `990_revenue_implausible` fires on legitimate small nonprofits. These are exactly the kind of entities that might be confused with shells: low revenue, small operations, sometimes using shared lab space. But they are real.
3. **New 501(c)(3)s** (Gap 4) — `no_990` fires during the 12–24 month gap between IRS determination and first 990 filing. Indistinguishable from a fake nonprofit at this layer.
4. **Fiscally sponsored projects** (Gap 5) — `no_990` fires because the project has no EIN.

## Notes for stage 7 synthesis

- This check is **applicable only to a narrow slice of the customer base**: US 501(c)(3) organizations that have been operating long enough to have filed a 990 (not 990-N). That slice is perhaps 10–20% of all synthesis customers at best.
- Within its applicable slice, the check provides strong positive signal: revenue, program description, and NTEE code directly address life-sciences alignment. The `990_program_not_life_sciences` flag is one of the more informative flags in the M09 suite.
- The check should be explicitly marked as "conditional on customer type" in the screening workflow — it should only be triggered when the customer claims 501(c)(3) status or is identified as a US nonprofit via other signals.
- For the ~80% of customers where this check is N/A (for-profits + non-US + too-new + too-small), the M09 suite relies entirely on corp-registry-stack, domain-auth-stack, PubMed affiliation, and registered-agent-denylist.
