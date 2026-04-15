# Coverage research: USPS RDI residential indicator

## Coverage gaps

### Gap 1: International customers (US-only product)
- **Category:** Any customer shipping to an address outside the United States. USPS RDI is derived from the USPS Address Management System and covers only US deliverable addresses.
- **Estimated size:** ~45–61% of gene synthesis market revenue originates outside North America [source](https://www.precedenceresearch.com/gene-synthesis-market). By order count, [best guess: 40–55% of synthesis orders ship to non-US addresses — same derivation as m04-county-assessor Gap 1].
- **Behavior of the check on this category:** no-signal
- **Reasoning:** RDI is a USPS product with zero coverage outside the US. The check simply does not fire for international addresses. This is the single largest coverage gap and is structural.

### Gap 2: Legitimate DIY-bio / community-bio operators at residential addresses
- **Category:** Same population as m04-county-assessor Gap 2: individuals operating legitimate biology work from residential addresses, including ~15 community lab groups in North America and individual home practitioners.
- **Estimated size:** ~500–3,000 individuals in the US, of whom a small fraction order gene synthesis (<1% of US orders) [best guess: same derivation as m04-county-assessor Gap 2, citing PMC article on community labs].
- **Behavior of the check on this category:** false-positive
- **Reasoning:** RDI correctly classifies these addresses as `Residential`. The flag fires. RDI is a binary signal with no nuance — it cannot distinguish a home lab from a drop address. The implementation's manual review carve-out helps but does not eliminate the flag.

### Gap 3: Sole-proprietor / home-office biotech founders
- **Category:** Same population as m04-county-assessor Gap 3: small biotech founders and independent consultants shipping to home addresses.
- **Estimated size:** ~40% of US sole proprietorships operate from home [source](https://www.irs.gov/pub/irs-soi/soi-a-insp-id2301.pdf). Biotech-specific fraction [best guess: a few hundred to low thousands of US entities — same derivation as m04-county-assessor Gap 3].
- **Behavior of the check on this category:** false-positive
- **Reasoning:** Identical to Gap 2. Binary RDI flag fires on any residential address.

### Gap 4: Mixed-use buildings with unreliable unit-level RDI
- **Category:** Customers in buildings with both residential and commercial units (mixed-use towers, converted lofts, live-work spaces) where the building-level RDI may not reflect the specific unit's use.
- **Estimated size:** ~43,000 live-work-play apartments in the US [source](https://www.coworkingcafe.com/blog/live-work-play-developments-growth-in-the-us/). USPS assigns RDI at the delivery point level (individual mailbox/unit), but in mixed-use buildings, unit-level classification can be inconsistent. [unknown — searched for: "USPS RDI mixed use building unit level accuracy", "RDI residential commercial accuracy rate mixed use"]. [best guess: RDI accuracy for single-use buildings is very high (>99%); for mixed-use buildings it may drop to 85–95% accuracy at the unit level.]
- **Behavior of the check on this category:** weak-signal (may return `Residential` for a commercially-used unit or vice versa)
- **Reasoning:** The implementation acknowledges this. In dense biotech metros where labs occupy converted residential space, a `Residential` RDI value may be a false positive.

### Gap 5: New construction with delayed RDI assignment
- **Category:** Customers at addresses in recently constructed buildings (last ~6 months) where USPS has not yet assigned an RDI value.
- **Estimated size:** [unknown — searched for: "USPS new construction address RDI assignment delay months", "USPS AMS new address lag time"]. USPS AMS refreshes monthly, but new-build classification can lag by 3–6 months [best guess from implementation's own estimate]. [best guess: affects a few thousand addresses per year nationally — the intersection with synthesis customers is very small.]
- **Behavior of the check on this category:** no-signal (returns `rdi_unknown`)
- **Reasoning:** Smarty returns no RDI value for unrecognized addresses, triggering the `rdi_unknown` flag for human review. Small population but unavoidable.

## Refined false-positive qualitative

Updated from stage 4:

1. **Garage labs / community bio** (Gap 2): <1% of US orders. Structurally identical to m04-county-assessor's false-positive population — these two checks produce redundant flags on the same addresses.
2. **Sole-proprietor / home-office founders** (Gap 3): overlaps entirely with county-assessor Gap 3. Pairing RDI + county assessor does not reduce false positives for this population — it doubles the review burden.
3. **Live-work units** (Gap 4): concentrated in Cambridge, SF, Brooklyn. Binary RDI is less informative than county assessor's land-use codes for this category.
4. **Apartments converted to lab space** (Gap 4 variant): RDI reflects the postal classification, not the physical use. No automated mitigation.

Key insight: RDI's false-positive population is a **strict subset** of county assessor's false-positive population (both flag residential addresses). RDI adds no new false-positive categories beyond what county assessor already flags.

## Notes for stage 7 synthesis

- RDI is the cheapest and simplest M04 check ($0.001–$0.005/call, reuses m03 CMRA call). Its coverage gaps are the same as county assessor's but with strictly less information (binary vs. land-use code).
- The **complementary value** of RDI is that it serves as a fast, cheap first-pass filter, with county assessor providing richer context on flagged addresses. The two checks are redundant on the same addresses by design.
- The international gap (Gap 1) is structural and shared with all US-only M04 checks. For a provider with a significant international customer base, M04 as a measure is effectively US-only.
- RDI accuracy for single-use addresses is very high; the check is reliable within its coverage boundary. The problem is the boundary, not the signal quality.
