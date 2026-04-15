# Coverage research: County assessor parcel use-code (US)

## Coverage gaps

### Gap 1: International customers (all non-US addresses)
- **Category:** Any customer shipping to an address outside the United States. This includes academic researchers at non-US institutions, international biotech companies, international CROs, and foreign government labs.
- **Estimated size:** North America holds ~39–55% of the gene synthesis market by revenue; the remainder (~45–61%) is international. [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799) [source](https://www.precedenceresearch.com/gene-synthesis-market). Asia-Pacific accounts for ~17% and Europe ~22% of global gene synthesis revenue in 2025 [source](https://www.precedenceresearch.com/gene-synthesis-market). By order count (not revenue), the international fraction could be larger since academic orders tend to be smaller. [best guess: 40–55% of synthesis orders by count originate outside the US, based on the revenue split and the fact that academic institutions — which are a larger share of non-US customers — place smaller average orders.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** County assessor / parcel data is a US-only product. Regrid, ATTOM, and ReportAll cover only US parcels. International addresses produce zero data — the check simply does not fire.

### Gap 2: Legitimate DIY-bio / community-bio operators at residential addresses
- **Category:** Individuals or small groups operating legitimate biology work (education, citizen science, art-bio) from residential addresses, including members of ~15 known DIYbio community labs in North America and an unknown number of home-based individual practitioners.
- **Estimated size:** DIYbio.org lists ~15 community lab groups in North America [source](https://pmc.ncbi.nlm.nih.gov/articles/PMC6549016/). Individual home-lab practitioners are uncounted but estimated at low hundreds in the US [best guess: extrapolating from community lab membership of ~50–200 per lab across ~15 labs, plus individual operators; total population likely 500–3,000 individuals, of whom a small fraction order gene synthesis]. As a share of synthesis customers, this is likely <1% of total US orders [best guess].
- **Behavior of the check on this category:** false-positive
- **Reasoning:** These customers ship to genuinely residential addresses. The parcel use-code will correctly identify the address as residential, triggering a flag. The check cannot distinguish a legitimate home-lab operator from a malicious actor using a residential drop. The implementation's manual review carve-out for community-bio partially mitigates this, but the initial flag still fires.

### Gap 3: Sole-proprietor consultants and pre-incubator biotech founders working from home
- **Category:** Small biotech founders, independent consultants, and sole proprietors who operate from a home address while their company is in formation or pre-revenue. Includes LLCs registered to residential addresses.
- **Estimated size:** ~40% of US sole proprietorships claim a home office deduction [source](https://www.irs.gov/pub/irs-soi/soi-a-insp-id2301.pdf). The biotech-specific fraction is unknown. [best guess: among early-stage biotech companies (pre-Series A), perhaps 10–20% initially use a founder's home address for administrative purposes, though lab work typically happens elsewhere. This population overlaps with incubator waitlists and virtual-office users. Likely a few hundred to low thousands of US-based entities at any given time.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** Same mechanism as Gap 2 — the parcel is residential, the flag fires. The customer is legitimate but has no institutional address yet.

### Gap 4: Live-work and recently-converted mixed-use buildings
- **Category:** Customers at addresses in buildings that are physically used as labs or offices but are parcel-coded as residential (or vice versa) due to zoning lag, mixed-use designation, or recent conversion. Concentrated in dense biotech metros (Cambridge/Kendall, SF SoMa/Mission, Brooklyn).
- **Estimated size:** ~43,000 live-work-play apartments exist in the US, quadrupling in the past decade [source](https://www.coworkingcafe.com/blog/live-work-play-developments-growth-in-the-us/). The fraction housing actual lab space is tiny. Stale use-code mismatches (commercial-to-residential conversions or vice versa) affect [unknown — searched for: "county assessor use code lag conversion stale data percentage", "parcel reclassification delay residential commercial"]. [best guess: a few thousand parcels nationally have a stale use-code that would misclassify them, but only a small fraction of those are relevant to synthesis customers.]
- **Behavior of the check on this category:** false-positive (if coded residential but actually commercial) or weak-signal (if coded mixed-use, which triggers a lower-priority flag)
- **Reasoning:** County assessor records update asynchronously. Regrid refreshes monthly for paid tiers, but the underlying county data may lag by 6–24 months for use-code changes. A lab in a recently converted warehouse could still show a residential use code.

### Gap 5: Addresses at the edge of or outside aggregator coverage
- **Category:** Customers at addresses in US counties or territories where Regrid/ATTOM data is present but the use-code field is missing or unstandardized. Regrid claims 100% county coverage but attribute completeness varies by county.
- **Estimated size:** Regrid covers 158M+ parcels across all 3,200+ US counties [source](https://regrid.com/100), but targets updating ~92% of counties at least annually [source](https://support.regrid.com/parcel-data/data-updates). Attribute completeness (specifically the use-code field) varies per county — Regrid publishes per-county attribute completeness reports but aggregate figures are not public [unknown — searched for: "Regrid attribute completeness use code national percentage", "Regrid lbcs_function field coverage rate"]. [best guess: use-code is populated for 85–95% of parcels nationally, with the remaining 5–15% concentrated in small rural counties.]
- **Behavior of the check on this category:** no-signal (falls through to RDI fallback)
- **Reasoning:** When the use-code field is missing, the check cannot classify the address and must degrade to the USPS RDI fallback, which provides a binary residential/commercial signal but without the richer land-use context.

## Refined false-positive qualitative

The original `false_positive_qualitative` from stage 4 identified four categories. Coverage research refines and quantifies:

1. **Garage labs / community bio** (Gap 2): small population (<1% of US orders), but structurally indistinguishable from malicious residential drops. The manual carve-out helps but cannot eliminate the flag.
2. **Sole-proprietor / home-office founders** (Gap 3): small but growing population in the early-stage biotech ecosystem. False-positive rate depends on the prevalence of home-address shipping among pre-incubator startups.
3. **Live-work loft buildings** (Gap 4): concentrated in 3–5 biotech metros; small absolute count but potentially high-profile customers (Cambridge, SF startups).
4. **Stale county records** (Gap 4): unpredictable; depends on county refresh cadence.

Cross-reference: Gaps 2 and 3 also affect m04-usps-rdi (same residential population). Gap 1 (international) affects all M04 ideas equally.

## Notes for stage 7 synthesis

- The dominant coverage gap is **international customers** (Gap 1), which is structural and shared across all M04 ideas that rely on US-only data sources (RDI, county assessor). This is not unique to this idea but defines a hard boundary for M04 as a measure.
- The false-positive gaps (2, 3, 4) are small in absolute terms but high in per-case friction — each requires human review. The manual review playbook in the implementation partially addresses this, but the cost per false-positive case is significant ($8–17 in reviewer time per the SOP estimates in m04-str-coloc-sop).
- Attribute completeness (Gap 5) is the operational risk: the check's value degrades to RDI-equivalent when use-code is missing, and the fraction of parcels with missing use-codes is not publicly quantified by Regrid.
