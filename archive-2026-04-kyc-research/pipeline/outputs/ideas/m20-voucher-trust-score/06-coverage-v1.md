# Coverage research: Composite voucher trust score with hard institutional gate

## Coverage gaps

### Gap 1: Industry biotech vouchers without ORCID or institutional (.edu/.ac.uk) email

- **Category:** Legitimate vouchers employed at commercial biotech or pharma companies who do not hold an ORCID iD and whose corporate email domain is not a recognized institutional domain (i.e., no DKIM-institutional-email signal). These vouchers max out at 65/100 even with perfect IDV + seniority + institution scores, because orcid_oauth (weight 0.20) and dkim_institutional_email (weight 0.15) contribute zero.
- **Estimated size:** Industry/pharma customers represent roughly 50–52% of the DNA synthesis market by revenue. [source: [Grand View Research — DNA Synthesis Market](https://www.grandviewresearch.com/industry-analysis/dna-synthesis-market-report), [Fortune Business Insights — Synthetic Biology Market](https://www.fortunebusinessinsights.com/synthetic-biology-market-107168)] Not all industry scientists act as vouchers, but among those who do, ORCID adoption in industry is substantially lower than in academia. Academic ORCID adoption in biology is ~93% at research universities [source: [Springer Scientometrics 2025 — ORCID adoption](https://link.springer.com/article/10.1007/s11192-025-05300-7)], but industry researchers are not mandated by funders (NIH, ERC) and have no publishing incentive to register. [best guess: industry-researcher ORCID adoption is 20–40%, based on absence of funder mandates and lower publication rates; no direct survey found — searched for "ORCID adoption industry researchers percentage"]. Combined with the lack of .edu email, a plausible **15–25% of all vouchers** would structurally land in or below the review band purely due to missing digital-identity signals. [best guess: derived from ~50% industry share × ~60–80% of industry vouchers lacking ORCID]
- **Behavior of the check on this category:** false-positive (score depressed below true risk level; legitimate vouchers pushed into REVIEW or FAIL band)
- **Reasoning:** Two of the five signals (combined weight 0.35) are architecturally absent for this population, not because of risk but because of employment sector. The 04 spec already flags this under false_positive_qualitative; this gap quantifies the fraction.

### Gap 2: Vouchers at institutions not in ROR (non-OECD, private-sector labs, government labs)

- **Category:** Legitimate vouchers whose employing organization does not have a ROR ID, causing the m18 institutional-legitimacy signal (weight 0.20) to return no data. This population includes: (a) researchers at non-OECD institutions in countries with low registry coverage, (b) government defense/security labs that are deliberately unlisted, (c) newly established private labs or CROs.
- **Estimated size:** ROR contains ~110,000 organizations globally. [source: [ROR registry](https://ror.org/registry/)] The total number of organizations worldwide that employ scientists who might order synthesized DNA is unknown but plausibly 200,000–400,000 including small CROs, government labs, and non-OECD universities. [best guess: derived from UNESCO estimate of ~9 million researchers globally across >190 countries; if average institution size is 30–50 researchers, that gives ~180k–300k institutions]. Coverage gap is therefore roughly 45–70% of all research-employing organizations worldwide, though these organizations are disproportionately small and account for a smaller share of synthesis orders. As a fraction of synthesis vouchers, [best guess: 10–20% of vouchers come from institutions outside ROR, based on the assumption that OECD-based, large institutions place the majority of orders — searched for "ROR coverage non-OECD institutions", "fraction research institutions with ROR ID"].
- **Behavior of the check on this category:** weak-signal (m18 returns nothing; score loses 20 potential points)
- **Reasoning:** The institutional gate is a hard requirement — if m18 fails entirely, the voucher is hard-declined regardless of total score. This is the most severe gap: a legitimate voucher at an unregistered institution cannot pass at all, even with perfect scores on all other signals.

### Gap 3: Early-career researchers vouching (low m19 seniority signal)

- **Category:** Postdocs, junior faculty, or newly independent PIs who have few publications, a low h-index proxy, and <5 years since PhD. These vouchers get a low m19_seniority raw score (the 04 spec example shows raw=0.6 for this signal), losing up to 8–12 of 20 possible points.
- **Estimated size:** In the US, roughly 60,000–80,000 postdocs are active at any time [source: [NSF Survey of Graduate Students and Postdoctorates in S&E](https://ncses.nsf.gov/surveys/graduate-students-postdoctorates-in-science-and-engineering/)]. Many PIs who vouch are mid-career+, but in fast-growing fields like synthetic biology, early-career PIs are common vouchers. [best guess: 15–25% of vouchers are early-career with <5 years post-PhD, based on the age distribution of NIH R01 first-time awardees (median age ~42) and the fact that synthetic biology skews younger — searched for "age distribution PI DNA synthesis orders"].
- **Behavior of the check on this category:** weak-signal (score depressed by 8–12 points; pushes borderline cases from PASS into REVIEW)
- **Reasoning:** Seniority is a proxy for legitimacy, but it systematically disadvantages younger researchers. This gap alone rarely causes a FAIL (max loss is 12 points), but it compounds with Gap 1 or Gap 2.

### Gap 4: Vouchers at non-Anglophone institutions without .edu-equivalent domains

- **Category:** Legitimate academic vouchers at universities in countries where institutional email domains do not follow recognizable patterns (no .edu, .ac.uk, .edu.au analog) and where the domain is not in the DKIM-institutional-email check's allowlist. Examples: researchers at Chinese (.cn), Japanese (.ac.jp is recognized, but many use .co.jp), Middle Eastern, or African universities using generic domains.
- **Estimated size:** ORCID's own data shows adoption varies dramatically by country, with some non-Anglophone countries having low engagement. [source: [ResearchGate — ORCID adoption by country](https://www.researchgate.net/figure/Estimated-ORCID-adoption-and-engagement-by-country-Active-researchers-in-the-analysis_fig2_359586814)] China alone has ~1.8 million researchers [source: UNESCO Science Report estimates], many at institutions whose domains would not be recognized by a DKIM institutional-email check designed for Western TLDs. [best guess: 5–15% of vouchers come from institutions whose domains are not in the DKIM allowlist, depending on how comprehensive the allowlist is — searched for "institutional email domain coverage non-English universities"].
- **Behavior of the check on this category:** false-positive (DKIM check returns negative or no-signal; 15 points lost)
- **Reasoning:** The dkim_institutional_email signal implicitly assumes that "institutional" means a curated set of domain patterns. Institutions outside this set lose the signal even though they are legitimate.

### Gap 5: Privacy-strict vouchers who refuse digital identity verification

- **Category:** Legitimate senior researchers who refuse to complete IDV (passport/driver's license scan) or ORCID OAuth on privacy grounds. These vouchers lose voucher_idv (weight 0.25) and orcid_oauth (weight 0.20), capping their max at 55/100 — firmly in the REVIEW band or below.
- **Estimated size:** [unknown — searched for "percentage researchers refuse identity verification privacy", "KYC refusal rate academic"]. In financial KYC, refusal/abandonment rates of 10–20% are commonly cited for friction-heavy flows [best guess: based on general KYC abandonment data from Jumio and Signicat reports]. For academic vouchers, the rate is likely lower (they have institutional backing) but nonzero. [best guess: 2–5% of vouchers refuse or abandon the IDV + ORCID steps].
- **Behavior of the check on this category:** false-positive (score mechanically capped at 55; auto-decline or review)
- **Reasoning:** The 04 spec already notes this. The concern is that the composite amplifies the friction: refusing one step (IDV) makes it nearly impossible to reach the PASS threshold even with all other signals maxed.

### Gap 6: Intersectional maximum-friction case

- **Category:** An industry voucher at a non-OECD institution without ROR coverage, no ORCID, no recognized institutional email domain, and <5 years in role. This is the intersection of Gaps 1, 2, 3, and 4.
- **Estimated size:** [best guess: <2% of vouchers, as the intersection of all four conditions is small, but these are exactly the legitimate customers most likely to be lost to competitor providers who don't screen].
- **Behavior of the check on this category:** false-positive (hard-decline via institutional gate if no ROR; otherwise score near 25–35, auto-decline)
- **Reasoning:** The composite score's failure modes are not independent — they stack. A voucher hitting three or more gaps simultaneously has essentially zero chance of auto-passing and a low chance of surviving manual review (the reviewer also sees weak signals everywhere).

## Refined false-positive qualitative

The original 04 spec's false_positive_qualitative list is accurate but under-quantified. Refined with cross-references:

1. **Industry vouchers** (Gap 1): ~15–25% of vouchers; lose 35% of possible score weight structurally. Most land in the REVIEW band (40–65 typical score), creating chronic reviewer workload.
2. **Non-ROR institutions** (Gap 2): ~10–20% of vouchers; hard-declined by the institutional gate regardless of score. This is the highest-severity false-positive pathway because there is no override short of the institution registering in ROR.
3. **Early-career researchers** (Gap 3): ~15–25% of vouchers; typically lose 8–12 points. Pushes borderline cases into REVIEW but rarely causes standalone FAIL.
4. **Non-Anglophone institutional domains** (Gap 4): ~5–15% of vouchers; lose 15 points. Partially overlaps with Gap 2.
5. **Privacy-strict refusers** (Gap 5): ~2–5% of vouchers; capped at 55, always in REVIEW or below.
6. **Intersectional cases** (Gap 6): <2% but near-certain false-decline.

The false-positive rate is NOT simply the sum of these (populations overlap). A rough union estimate: **25–40% of legitimate vouchers** will not auto-pass (score <80) due to structural signal gaps rather than actual risk. [best guess: computed as the approximate union of Gaps 1–5 with overlaps discounted; production calibration needed].

## Notes for stage 7 synthesis

- The institutional gate (Gap 2) is the most consequential coverage gap. It converts a missing m18 signal into a hard-decline with no appeal path. Stage 7 should flag this as a design decision that trades coverage for security.
- The 25–40% structural-REVIEW estimate means the reviewer cost estimate in 04 (25% review rate at $2.50/voucher) may be optimistic. If structural false-positives dominate the review queue, the true review rate could be 30–40%, raising per-voucher cost to ~$3–4.
- Industry vouchers are the single largest underserved category. A sector-specific weighting scheme (mentioned in 04's false_positive_qualitative) would be the most impactful mitigation — but it introduces model complexity and governance overhead.
- The composite amplifies bias from upstream signals (FRVT bias in IDV, ORCID adoption skew, ROR coverage skew). Drift monitoring catches sudden shifts but not slow, structural bias. Stage 7 should note this as an open governance question.
