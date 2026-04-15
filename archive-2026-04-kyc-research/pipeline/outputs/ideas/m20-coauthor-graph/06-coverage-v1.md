# Coverage research: OpenAlex coauthor + NIH/NSF shared-grant independence graph

## Coverage gaps

### Gap 1: Industry vouchers with no publication record
- **Category:** Vouchers who work in pharmaceutical, biotech, or agricultural companies and have never published in indexed journals, or whose publications are under corporate authorship that OpenAlex cannot disambiguate to an individual author ID.
- **Estimated size:** Industry (pharma + biotech) represents ~50% of DNA synthesis revenue. [source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report) The publication requirement is weaker in industry than in academia; publishing may be delayed or suppressed for IP reasons. [source](https://www.linkedin.com/pulse/scientists-pharmaceutical-industry-do-publish-should-we-derek-o-hagan-wd8ne) [best guess: perhaps 30-50% of industry R&D scientists involved in ordering synthetic DNA have zero or very few indexed publications under their individual name, making them invisible to the OpenAlex coauthorship graph. This means the independence check produces no signal for a large fraction of potential vouchers.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** If the voucher cannot be resolved to an OpenAlex Author ID, the entire coauthorship check is vacuous — it returns "no edges found" which is indistinguishable from genuine independence. The check silently passes.

### Gap 2: Non-US-funded researchers (grants invisible to NIH RePORTER / NSF)
- **Category:** Vouchers and customers funded by non-US agencies: Wellcome Trust (UK), ERC (EU), JSPS (Japan), NSFC (China), DFG (Germany), BMBF (Germany), CIHR (Canada), NHMRC (Australia), and others. Their shared-grant relationships are invisible to the NIH RePORTER and NSF Awards APIs.
- **Estimated size:** [best guess: non-US researchers represent ~30-40% of global synthesis customers (see m19 Gap 2). Among these, a substantial fraction are funded by national agencies not covered by RePORTER/NSF. The grant-overlap sub-check is structurally US-only. OpenAlex coauthorship partially compensates, but only for collaborations that produced a publication.]
- **Behavior of the check on this category:** weak-signal (coauthorship-only; no grant signal)
- **Reasoning:** The independence graph has two legs: coauthorship and shared grants. For non-US-funded pairs, the grant leg is entirely absent. Two researchers sharing an ERC grant and no joint publications would pass the independence check.

### Gap 3: Collaborators who have not yet published together
- **Category:** A voucher and customer who are actively collaborating (same project, same lab meetings, shared data) but have not yet co-published a paper or received a joint grant listing. This includes new collaborations (<1-2 years old) and collaborations where the publication pipeline is slow (e.g., clinical trials with multi-year timelines).
- **Estimated size:** [unknown — searched for: "average time from collaboration start to first joint publication biology", "lag between research collaboration and coauthorship"; no direct data found. [best guess: in fast-moving experimental biology, the lag from collaboration start to first joint paper is 1-3 years; in clinical research, 3-5+ years. New collaborations within this window are invisible.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The check uses published papers and funded grants as proxies for collaboration. Any collaboration not yet reflected in these public records is invisible.

### Gap 4: Researchers in small subfields where everyone is a coauthor
- **Category:** Vouchers and customers in small, specialized subfields (e.g., a rare-disease research community of 50-100 active researchers) where virtually everyone has coauthored with everyone else. Finding a voucher who is NOT a recent coauthor of the customer may be impossible.
- **Estimated size:** [best guess: subfields with <200 active researchers and high collaboration density. The number of such subfields is hard to estimate, but they exist across rare-disease biology, specific toxinology niches, and some dual-use-relevant areas like select-agent research. Customers in these fields may be structurally unable to find an independent voucher who passes the check.]
- **Behavior of the check on this category:** false-positive (all available vouchers fail)
- **Reasoning:** The check rejects any voucher with a coauthored paper in the last 3 years. In a small field, this may reject every qualified voucher, forcing the customer into the alternate-evidence path or a different measure entirely.

### Gap 5: Author disambiguation failures (common names)
- **Category:** Vouchers or customers with common names (e.g., "Wei Zhang," "John Smith," "Maria Garcia") where OpenAlex cannot reliably resolve the individual to a single Author ID. OpenAlex has 114 million author records. [source](https://openalex.org/stats) Disambiguation errors create both false positives (merging two different people's records) and false negatives (splitting one person's record across multiple IDs).
- **Estimated size:** [best guess: OpenAlex's author disambiguation has improved significantly with machine learning but remains imperfect for common names, especially in Chinese, Korean, and other naming conventions where given-name / family-name patterns differ from Western norms. [unknown — searched for: "OpenAlex author disambiguation error rate common names", "OpenAlex author clustering accuracy"; no published error rate found for the current algorithm]
- **Behavior of the check on this category:** weak-signal (both false-positive and false-negative directions)
- **Reasoning:** A disambiguation collision (merging two "Wei Zhang" records) could falsely flag a voucher as a coauthor. A disambiguation split could miss a real collaboration. The stage-4 implementation acknowledges this and routes to reviewer adjudication, but the frequency of the problem is unquantified.

## Refined false-positive qualitative

Cross-referencing the gaps above with the stage-4 false-positive list:

1. **Small-field pairs sharing a third-party coauthor** (stage 4) — confirmed; Gap 4 generalizes this to subfields where all vouchers fail.
2. **Senior figures who have coauthored with everyone** (stage 4) — confirmed; subsumed under Gap 4.
3. **Same-institution but no coauthorship** (stage 4) — confirmed; this is a true negative (passes the check), not a false positive. Correctly noted in stage 4.
4. **New addition: disambiguation collisions** — Gap 5. Not in stage-4 false-positive list. A voucher falsely flagged as a coauthor due to name collision would be a false positive requiring reviewer adjudication.
5. **New addition: industry vouchers who legitimately have no publication record** — Gap 1. These are not false positives (the check passes them) but they are a dangerous category: the check provides no evidence of independence because neither person has a publication footprint.

## Notes for stage 7 synthesis

- The check is strongest for US-academic voucher-customer pairs where both have active publication records and US federal funding. This is a meaningful but not majority slice of the customer base.
- The grant-overlap leg (NIH/NSF) is US-only. Extending to non-US funders would require additional APIs (e.g., Europe PMC for Wellcome/ERC, KAKEN for JSPS) — a feasible but non-trivial expansion.
- The check produces asymmetric errors: false negatives (missing a real collaboration) are more dangerous than false positives (flagging a non-collaboration), and false negatives dominate for industry and international populations.
- The value of this check is primarily for the academic-voucher scenario in M20; for industry vouchers, the coauthor graph provides little signal.
