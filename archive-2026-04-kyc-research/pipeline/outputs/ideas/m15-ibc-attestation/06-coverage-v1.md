# Coverage research: IBC / sponsor-PI attestation upload

## Coverage gaps

### Gap 1: Foreign academic customers (non-US institutions)
- **Category:** Academic researchers at institutions outside the United States, where no NIH IBC-RMS equivalent registry exists. The NIH IBC-RMS roster only covers US-registered IBCs operating under the NIH Guidelines.
- **Estimated size:** Non-North-America regions account for ~45% of the gene synthesis market by revenue (Europe ~22%, Asia-Pacific ~17%, rest of world ~6%) ([GM Insights gene synthesis market 2025](https://www.gminsights.com/industry-analysis/gene-synthesis-market)). Not all revenue maps to orders requiring IBC documentation, but as a first-order proxy, roughly 40-50% of a global provider's customer base would have no IBC-RMS entry to verify against. [best guess: revenue share as proxy for order share; academic share of non-US orders may differ from US academic share.]
- **Behavior of the check on this category:** no-signal (no registry to cross-check; the check degrades to document-only review with no independent verification of the named officer).
- **Reasoning:** The IBC-RMS is a US-only registry. Foreign institutions may have biosafety committees (e.g., UK GMSC, Australia IBC equivalents), but there is no unified international registry to query. The check can still require document upload from foreign customers, but the cross-check against a roster is impossible.

### Gap 2: Private-sector / commercial customers not receiving NIH funding
- **Category:** Small biotech companies, CROs, and startups that do not receive NIH funding and are not required to register an IBC with NIH. They may use externally-administered IBCs (WCG, Advarra) or have no IBC at all.
- **Estimated size:** Biopharmaceutical and diagnostics companies hold ~42% of the DNA synthesis market ([Fortune Business Insights](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)). Of those, a significant fraction are small/mid-size biotechs. The IBC-for-hire industry has grown to ~1,000+ externally-administered IBCs across just three providers ([Undark, 2022](https://undark.org/2022/03/16/the-worrying-murkiness-of-institutional-biosafety-committees/)), suggesting many commercial entities use external IBCs whose chair/BSO names will not match a direct institution-name lookup in the IBC-RMS. [best guess: 15-25% of total synthesis customers are commercial entities whose IBC, if any, is externally administered and will not cleanly match IBC-RMS by institution name.]
- **Behavior of the check on this category:** false-positive (the institution name on the document maps to a third-party IBC administrator like WCG/Advarra, not to the customer's company name in the roster) or no-signal (company has no IBC at all if non-NIH-funded and local ordinance doesn't require one).
- **Reasoning:** NIH OSP FAQs explicitly discuss externally-administered IBCs ([NIH OSP FAQ on external IBCs](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-externally-administered-ibcs/)). The name-matching logic in the implementation breaks down when the IBC belongs to WCG rather than to the customer institution.

### Gap 3: Researchers conducting exempt work under NIH Guidelines Section III-F
- **Category:** Researchers at NIH-funded institutions whose specific experiments are exempt from IBC review under Section III-F of the NIH Guidelines (e.g., synthetic nucleic acids that cannot replicate, do not integrate, and do not produce lethal toxins).
- **Estimated size:** [unknown -- searched for: "proportion of recombinant DNA experiments exempt Section III-F", "NIH IBC exempt experiments percentage", "Section III-F exempt fraction of synthesis orders"]. Section III-F exemptions cover a broad class of routine molecular biology (most standard cloning into non-pathogenic hosts). [best guess: a substantial fraction -- possibly 30-60% -- of gene synthesis orders involve constructs that would be III-F exempt, based on the observation that the majority of commercial synthesis is for protein expression in E. coli or mammalian cell lines with no select-agent involvement.]
- **Behavior of the check on this category:** false-positive (the customer has no IBC document to upload because their work is exempt; the `ibc_doc_missing` flag fires and blocks the order).
- **Reasoning:** The implementation blocks orders with no upload. Exempt researchers have no document to provide. An escape hatch (`ibc_approval_status = exempt-section-III-F` from the m15-structured-form) could mitigate, but the current implementation does not describe one.

### Gap 4: Customers at institutions with recently changed IBC leadership
- **Category:** Researchers at US institutions where the IBC chair or BSO has recently rotated but the IBC-RMS public roster has not yet been updated.
- **Estimated size:** [best guess: ~5-10% of institutions at any given time, based on typical academic committee turnover cycles of 2-3 years for chairs, combined with the fact that the IBC-RMS roster refresh cadence is unknown. Searched for: "IBC chair turnover rate", "IBC-RMS roster update frequency" -- no public data found.]
- **Behavior of the check on this category:** false-positive (`ibc_doc_unverified` fires because the document names a new chair not yet reflected in the roster).
- **Reasoning:** The implementation explicitly acknowledges this gap in the false_positive_qualitative section. The size depends on the IBC-RMS refresh cadence, which is not publicly documented.

### Gap 5: Non-academic independent researchers and DIY biology community
- **Category:** Independent researchers, community biolabs, and DIY biology practitioners who have no institutional affiliation and no IBC.
- **Estimated size:** [best guess: <2% of synthesis orders. The DIY biology community is small relative to the institutional market. Searched for: "DIY biology community size synthesis orders", "community biolab number US" -- no quantitative data on order volume found. There are ~30-50 community biolabs in the US per directories like DIYbio.org, but their synthesis order volume is minimal compared to institutional customers.]
- **Behavior of the check on this category:** no-signal (no IBC, no institution, nothing to verify). The order would be blocked by `ibc_doc_missing`.
- **Reasoning:** This is a small but real category. These customers cannot produce an IBC document. They are legitimate in many cases (e.g., ordering non-regulated constructs for personal projects). The check structurally excludes them.

## Refined false-positive qualitative

1. **Externally-administered IBC users** (Gap 2): chair/BSO names won't match the customer's institution name in IBC-RMS. This is the highest-volume false-positive source among US commercial customers.
2. **Section III-F exempt researchers** (Gap 3): no document to upload; order blocked. Potentially the largest single false-positive category by order volume.
3. **Recently-rotated IBC chairs** (Gap 4): document names don't match roster. Lower volume but unpredictable timing.
4. **Foreign academic customers** (Gap 1): no registry to check; if the provider requires upload anyway, the document cannot be cross-verified. Not a false-positive per se (no flag fires) but degrades to security theater.
5. **Independent researchers** (Gap 5): blocked outright. Small volume.

## Notes for stage 7 synthesis

- The dominant coverage limitation is geographic: the IBC-RMS is US-only, and ~45% of the market is non-US. For non-US customers, this check provides document-on-file only, with no independent verification.
- The second largest gap is structural: Section III-F exempt work has no IBC document to upload. A mitigation would be to accept a signed PI attestation of exemption (already mentioned in the idea name but not fully operationalized in the implementation).
- The externally-administered IBC problem is solvable: the reconciliation logic could maintain a mapping of known external IBC administrators (WCG, Advarra) and allow name matches against both the customer's institution and the IBC administrator's name. This requires curation but is tractable.
- The ~1,200 IBCs registered with NIH as of ~2020 ([PMC survey](https://pmc.ncbi.nlm.nih.gov/articles/PMC9134475/)) likely cover the majority of US academic institutions that order synthesis. But "majority" is not "all" -- newer institutions, community colleges with biology programs, and non-NIH-funded entities are missing.
