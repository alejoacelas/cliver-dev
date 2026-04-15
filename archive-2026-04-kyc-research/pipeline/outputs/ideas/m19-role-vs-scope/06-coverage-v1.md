# Coverage research: Role-vs-scope / seniority alignment SOP

## Coverage gaps

### Gap 1: Industry customers with non-academic role taxonomies
- **Category:** R&D staff at pharmaceutical, biotech, and agricultural companies whose job titles (e.g., "Scientist II," "Senior Research Associate," "Principal Engineer") do not map onto the academic seniority bands (junior / mid / senior) that the SOP is built around.
- **Estimated size:** Biopharmaceutical and diagnostics companies captured ~50% of U.S. DNA synthesis revenue in 2024; pharmaceutical and biotechnology companies are the largest end-user segment globally. [source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report) [best guess: if revenue share roughly tracks order share, ~40-55% of synthesis customers are industry rather than academic, though many industry orders go through CROs rather than directly]
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** The SOP's load-bearing heuristic is "is the stated role one that can legitimately use this SOC." Industry titles have no standardized seniority ladder visible to an outside reviewer. A "Scientist I" at one company may have full independent ordering authority; at another, they may not. The reviewer has no reference frame comparable to "grad student vs. PI" in academia. The SOP would either systematically over-flag industry customers (treating unfamiliar titles as suspicious) or under-flag them (defaulting to PROCEED because the title is uninterpretable).

### Gap 2: International customers with different institutional norms
- **Category:** Researchers at non-US institutions where role titles, seniority conventions, and ordering authority differ from the US academic model. Includes: assistant professors with full lab autonomy in some European systems, researchers in Chinese / Indian / Japanese institutions where "associate professor" carries different ordering authority, and government-lab researchers in non-OECD countries.
- **Estimated size:** [best guess: non-US customers represent ~30-40% of global gene synthesis orders, based on the US market being the largest single market but not the majority of global revenue. The global market was $3.52B in 2024 with the US as the leading but not dominant share. [source](https://www.grandviewresearch.com/industry-analysis/dna-synthesis-market-report)]
- **Behavior of the check on this category:** weak-signal / false-positive
- **Reasoning:** The SOP's role-seniority mapping is implicitly US-centric. A "Lecturer" in the UK system is a tenured faculty member with full lab authority; in the US system, the same title connotes a teaching-only position without independent research. A reviewer without deep cross-cultural knowledge would either false-positive on these customers or require extensive follow-up, adding cost and friction.

### Gap 3: Independent researchers and community-bio-lab members
- **Category:** Individuals who order DNA synthesis outside any institutional affiliation: independent researchers, DIY biology practitioners, community-lab members, citizen scientists.
- **Estimated size:** ~35 community biology labs in the US and Canada as of 2019-2020; the movement's peak was around 2016-2017 and some labs have since closed. [source](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0330307) [best guess: total individuals actively ordering synthetic DNA through community labs is very small, likely <500 people/year in the US, but the category is policy-relevant because it represents a population with no institutional context for the SOP to evaluate]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The SOP requires a role, an institution, and ideally a verifiable PI. Independent researchers have none of these. The SOP either auto-denies them (false positive if legitimate) or requires an entirely separate adjudication pathway that the current SOP does not define. The SOP's `pi_supervisor_name` field is structurally inapplicable.

### Gap 4: Core-facility and shared-service staff
- **Category:** Institutional employees whose job is to place orders on behalf of many labs: core-facility managers, shared-instrument technicians, centralized purchasing staff. Their role is legitimate but their orders span many SOC categories and many PIs.
- **Estimated size:** [best guess: most R1 universities (146 in the US as of the Carnegie 2021 classification) have at least 1-3 genomics/synthesis core facilities; perhaps 300-500 core-facility staff in the US who routinely order synthetic DNA. Their order volume per person is high, so they represent a disproportionate share of flagged orders]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** A core-facility manager placing a Tier-1 select-agent order "for Dr. X's lab" has a role (facility manager) that looks misaligned with the SOC to a reviewer unfamiliar with the ordering structure. The SOP must either carve out core-facility staff (weakening the check) or flag every one of their orders (high false-positive volume).

### Gap 5: Orders where sequence screening does not flag SOC content
- **Category:** All customers whose orders are not flagged by sequence screening. The SOP is only triggered on flagged orders.
- **Estimated size:** ~90-95% of orders are not flagged by sequence screening. [source](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/) [best guess: ~5% flag rate based on the "approximately 5% of synthetic DNA orders are flagged" estimate; the "7-9% sequences of concern" figure from the EBRC study is consistent]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** By design, the SOP only applies to the ~5% of orders that trigger sequence screening. An attacker ordering non-flagged sequences (e.g., assembling a dangerous construct from individually benign fragments) is invisible to this SOP entirely. This is a structural coverage gap: the SOP's trigger mechanism, not its logic, is the bottleneck.

## Refined false-positive qualitative

Cross-referencing the gaps above with the stage-4 false-positive list:

1. **Legitimately precocious junior researchers** (stage 4) — confirmed; moderate volume. Mitigated by the "verified PI on file" carve-out but adds reviewer time.
2. **Cross-departmental collaborations** (stage 4) — confirmed; overlaps with Gap 2 (international norms) where department names carry different meanings.
3. **Industry researchers** (stage 4) — now quantified as Gap 1; this is the largest false-positive category by volume (~40-55% of customers).
4. **Small biotech founders** (stage 4) — subsumed under Gap 1. Founders ordering for their own work look like "junior + no PI" to the SOP.
5. **Core-facility staff** (stage 4) — now quantified as Gap 4; high per-person flag rate.
6. **International title mismatches** — new; Gap 2. Not in original stage-4 list. Could be a significant source of false positives for providers with international customer bases.

## Notes for stage 7 synthesis

- The SOP is inherently calibrated for a US-academic-PI-lab ordering model. Its value degrades sharply outside that context.
- The largest coverage gap by customer volume is Gap 1 (industry), not Gap 3 (community bio). Policy discussions that focus on community bio miss the larger blind spot.
- Gap 5 (non-flagged orders) is structural and cannot be fixed by improving the SOP itself; it depends on the quality of sequence screening.
- The SOP's value is as a backstop for data-source checks, not as a standalone. Without upstream signals (OpenAlex, ORCID, PubMed), the reviewer has very little to work with for industry and international customers.
