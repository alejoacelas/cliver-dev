# Coverage research: Voucher ↔ customer ROR disjointness rule

## Coverage gaps

### Gap 1: Voucher or customer institution not in ROR
- **Category:** Institutions that are not in the ROR registry — small biotech startups, newly-formed organizations, community biology labs, some international institutions (especially in under-represented countries). ROR's inclusion criteria require the organization to appear as a creator's affiliation or funder in published research. [source](https://ror.org/about/faqs/)
- **Estimated size:** ROR contains ~110,000-120,000 organizations globally, with 4,098 new records added in 2024 alone. [source](https://ror.org/blog/2024-12-17-year-in-review/) The top 20 countries hold ~80.9% of ROR IDs. [source](https://arxiv.org/pdf/2209.10821) [best guess: there are roughly 40,000-50,000+ biotech companies worldwide that might order synthetic DNA (including small startups), plus thousands of government labs and clinical facilities. Many small companies incorporated in the last 1-3 years will not be in ROR. Perhaps 15-25% of synthesis-customer institutions are not in ROR, with the gap concentrated in small companies and non-OECD institutions.]
- **Behavior of the check on this category:** no-signal (triggers `voucher_ror_unresolved`)
- **Reasoning:** If either the voucher's or the customer's institution cannot be resolved to a ROR ID, the disjointness check cannot run. The implementation routes this to an alternate-evidence path, but the check provides zero coverage for these cases.

### Gap 2: Complex institutional hierarchies (university systems, hospital networks)
- **Category:** University systems (e.g., University of California system), medical school / teaching hospital pairs, and national laboratory / university joint appointments where the ROR parent/child relationships create legitimate but flagged connections.
- **Estimated size:** [best guess: in the US alone, there are ~20 major university systems with 5-20+ campuses each, ~130 academic medical centers, and ~17 DOE national labs with university joint appointments. The ROR `relationships[]` field captures Parent/Child/Related links, but the granularity is uneven. Voucher-customer pairs within these structures will routinely trip the `voucher_customer_related_ror` flag, requiring reviewer adjudication.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** A voucher at UC Berkeley attesting for a customer at UCSF would be flagged because both are children of the UC system. But they are at genuinely different institutions with independent research programs. The reviewer must adjudicate every such case, creating recurring false-positive volume.

### Gap 3: Single-institution research environments
- **Category:** Small colleges, specialized research institutes, and single-campus institutions where all legitimate vouchers share the same ROR as the customer. There is no "different institution" available for vouching.
- **Estimated size:** [best guess: in the US, there are ~2,000+ four-year colleges and universities, but only ~150 are R1 research universities. At smaller institutions, the entire science faculty shares one ROR. A customer at a small college in a rural area may have no access to a qualified voucher at a different institution within reasonable professional distance.]
- **Behavior of the check on this category:** false-positive (all available vouchers fail)
- **Reasoning:** The disjointness rule structurally excludes same-institution vouching. The cross-department exception path exists but requires extra documentation. For small institutions where the entire science department is 5-10 faculty, the cross-department distinction is meaningless.

### Gap 4: Shell organizations that obtain a ROR ID
- **Category:** A shell nonprofit or company that publishes enough to appear in research databases and gets added to ROR. Once in ROR, the shell has a distinct ROR ID from the customer's institution, and the disjointness check passes.
- **Estimated size:** [unknown — searched for: "shell organization research organization registry fake institution", "predatory institution ROR registration"; no data on how many shell or predatory organizations are in ROR. ROR's curation process involves community review, but it relies on the organization appearing in published research — and predatory publishers can generate such appearances. [best guess: the attack surface is small but nonzero; a well-resourced attacker could establish a shell that eventually enters ROR.]
- **Behavior of the check on this category:** no-signal (passes)
- **Reasoning:** The disjointness check verifies that two ROR IDs are different, not that both institutions are legitimate. A shell with its own ROR ID trivially passes the disjointness rule.

### Gap 5: Countries with sparse ROR coverage
- **Category:** Vouchers and customers in countries where ROR coverage is thin. The top 20 countries hold 80.9% of ROR IDs. [source](https://arxiv.org/pdf/2209.10821) Countries in Sub-Saharan Africa, Central Asia, and parts of Latin America have fewer institutions in ROR, meaning the affiliation matcher returns low-confidence or no results.
- **Estimated size:** [best guess: ~20% of the world's research institutions are in countries outside the top 20 ROR-represented countries. For DNA synthesis customers in these countries, the ROR resolution step will frequently fail, routing to the alternate-evidence path. The size of this gap overlaps with m20-orcid-oauth Gap 3 and m20-dkim Gap 2 — the same institutions that lack ORCID integration and DKIM also lack ROR coverage.]
- **Behavior of the check on this category:** no-signal (same as Gap 1)
- **Reasoning:** Compounding coverage gap: institutions in these countries simultaneously fail ROR resolution, ORCID lookup, and DKIM verification, leaving no automated check pathway.

## Refined false-positive qualitative

Cross-referencing the gaps above with the stage-4 false-positive list:

1. **Single-institution research environments** (stage 4) — quantified as Gap 3; ~2,000+ small colleges affected.
2. **University systems** (stage 4) — quantified as Gap 2; ~20 major systems in the US.
3. **Foreign institutions with weak ROR coverage** (stage 4) — quantified as Gap 5 and Gap 1.
4. **National-lab + university joint appointments** (stage 4) — subsumed under Gap 2.
5. **Recent mergers / institutional renames** (stage 4) — confirmed; timing lag between institutional change and ROR update creates false positives. [best guess: ROR is curated with community input; major mergers are typically updated within 6-12 months, but smaller renames may lag longer.]
6. **Hospital systems / medical centers** (stage 4) — subsumed under Gap 2; hospital-university parent/child trees are particularly complex.
7. **Cumulative false-positive estimate:** [best guess: for US R1 university voucher-customer pairs at different institutions, the false-positive rate is low (<5%). For pairs involving university systems, hospital networks, or small institutions, the rate rises to 15-30%. For international pairs in low-ROR-coverage countries, the check frequently produces no signal at all.]

## Notes for stage 7 synthesis

- The ROR disjointness check is conceptually clean (different institution = independent) but the real-world institutional landscape is messier than the rule assumes.
- The largest coverage gap by volume is Gap 1 (institutions not in ROR), which affects primarily small companies and non-OECD institutions.
- The most operationally costly gap is Gap 2 (complex hierarchies), which generates recurring false positives for large university systems and hospital networks.
- Gap 4 (shell organizations in ROR) is the most concerning attacker-relevant gap: a sophisticated attacker can establish a shell that passes the disjointness check.
- The check's value is highest when combined with m20-coauthor-graph (which checks relationship, not just institutional identity) — the two are complementary.
