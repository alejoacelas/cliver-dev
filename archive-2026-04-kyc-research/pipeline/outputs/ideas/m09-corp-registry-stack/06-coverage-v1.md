# Coverage research: Companies House / SEC EDGAR / OpenCorporates / foreign registry stack

## Coverage gaps

### Gap 1: Government and state-owned research institutes (Asia, CIS, Middle East)

- **Category:** Government-funded research institutes and state-owned laboratories (e.g., CSIR institutes in India, Chinese Academy of Sciences institutes, DPRK/CIS regional academies) that are statutory bodies or government departments, not incorporated entities in a corporate registry.
- **Estimated size:** India alone has >1,000 government research institutes ([source](https://www.sciastra.com/blogs/top-government-and-private-research-labs-in-india)); China has 3,000–6,000 government/public research institutes including ~500 State Key Laboratories ([source](https://www.quora.com/How-many-research-institutes-are-there-in-China-What-is-the-purpose-of-these-institutes)). Globally, the SCImago Government sector rankings list ~4,200 government research institutions ([source](https://www.scimagoir.com/rankings.php?sector=Government&ranking=Research)). Many of these are statutory bodies created by government decree, not registered in a corporate registry. [best guess: 30–50% of these ~4,200 government institutions would not appear in OpenCorporates or a national corporate registry because they are government agencies or statutory bodies rather than incorporated entities].
- **Behavior of the check on this category:** no-signal (`registry_no_record` flag)
- **Reasoning:** Corporate registries track incorporated entities (Ltd, LLC, GmbH, SA, etc.). Government research institutes in most non-OECD countries are created by statute, executive order, or ministry decree and do not register as companies. OpenCorporates does not cover government entities. The check would return `registry_no_record`, which is uninformative for this population.

### Gap 2: Academic institutions (universities, public research universities)

- **Category:** Universities and public higher-education institutions that are not incorporated as companies — particularly state universities in the US, European public universities, and universities in Asia/Africa/Latin America.
- **Estimated size:** There are roughly 26,000 universities worldwide ([best guess: derived from UNESCO / WHED estimates]). Most public universities are chartered or legislatively created entities, not companies. In the US, state universities are arms of the state government. Only private universities (Harvard Corp, Stanford as a 501(c)(3)) appear in corporate registries or nonprofit filings. [best guess: ~60–70% of world universities are public institutions that would not appear in a corporate registry, i.e. ~15,000–18,000 institutions].
- **Behavior of the check on this category:** no-signal (`registry_no_record`)
- **Reasoning:** The corp-registry stack targets corporate entities. For academic customers, this check produces no signal for the majority of the world's universities. Academic customers represent ~39% of DNA synthesis market revenue ([source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)).

### Gap 3: Newly incorporated biotech startups (< 12 months old)

- **Category:** Legitimate biotech startups incorporated within the last 12 months that trip the `registry_recent_incorp` flag.
- **Estimated size:** [best guess: In 2021, an estimated 3,000+ biotech companies were formed in the US alone during the formation boom; in a normal year, ~1,000–1,500 new biotechs are incorporated annually in the US ([source](https://www.fiercebiotech.com/biotech/too-many-biotechs-musical-chairs-startup-funding-venture-capital)). If average company lifespan before first order is ~6–18 months, a non-trivial fraction of first-time synthesis customers are in their first year]. At any given time, [best guess: 10–20% of biotech companies that might place a synthesis order are < 12 months old, based on the high formation rate relative to the ~6,000–8,000 active US biotech companies].
- **Behavior of the check on this category:** weak-signal / false-positive (`registry_recent_incorp` flag triggers review even though the company is legitimate)
- **Reasoning:** The implementation flags all companies < 12 months old. This is the exact population of legitimate new biotechs, university spinouts, and NewCo formations that are real but indistinguishable from the shell-company pattern at this layer alone.

### Gap 4: Non-OECD jurisdictions with sparse OpenCorporates coverage

- **Category:** Companies incorporated in jurisdictions where OpenCorporates has thin or stale data — particularly Sub-Saharan Africa, Central Asia, Southeast Asia (outside Singapore), and parts of Latin America.
- **Estimated size:** OpenCorporates covers 140+ jurisdictions but with "varying completeness" ([source](https://blog.opencorporates.com/2025/03/05/how-to-check-data-coverage-in-opencorporates/)). OpenCorporates itself acknowledged data gaps significant enough to launch the "plei" (proto legal entity identifier) initiative to fill them ([source](https://treasurytoday.com/press-releases/press-release-opencorporates-to-launch-the-plea-an-open-id-to-close-the-global-legal-entity-data-gap/)). [best guess: 40–60 of the 140+ jurisdictions have incomplete coverage, affecting companies in countries that collectively represent ~15–25% of global biotech activity outside the US/EU/UK].
- **Behavior of the check on this category:** no-signal or weak-signal (`registry_no_record` even though the company exists in a local registry not indexed by OpenCorporates)
- **Reasoning:** The fallback chain (CH → EDGAR → OpenCorporates → manual) works well for UK, US, EU. For a Brazilian LTDA, a Nigerian Ltd, or a Vietnamese company, OpenCorporates may have stale or no data. The reviewer would need to manually check local registry portals, which is labor-intensive.

### Gap 5: SIC/NAICS misclassification of small biotechs

- **Category:** Legitimate small biotechs and life-sciences companies that filed under generic SIC codes (e.g., "management consultancy" 70229, "other professional/scientific activities" 74909) rather than life-sciences-specific codes.
- **Estimated size:** [best guess: 20–40% of small biotechs (< 50 employees) are filed under generic SIC codes, based on the implementation document's own observation that "many small biotechs use generic SIC codes" and the known tendency of formation agents to pick the simplest applicable code]. The US alone has ~6,000–8,000 active biotech companies; if 30% are small and 30% of those are under generic SIC, that's ~500–700 US companies.
- **Behavior of the check on this category:** false-positive (`sic_not_life_sciences` flag triggers review for companies that are genuine biotechs)
- **Reasoning:** SIC/NAICS classification at incorporation time is self-reported and often minimally supervised. Small biotechs formed via mass-formation agents (which overlap with the registered-agent-denylist idea) frequently receive default or generic codes.

### Gap 6: Sole proprietorships and unincorporated entities

- **Category:** Individual researchers, independent consultants, or sole proprietors operating life-sciences businesses without a formal incorporation (e.g., an independent biosafety consultant ordering reference sequences, a freelance bioinformatician).
- **Estimated size:** [unknown — searched for: "sole proprietor biotech synthesis customer", "unincorporated researcher DNA synthesis order"]. The DNA synthesis market is dominated by institutional customers, so this is likely a small tail. [best guess: < 5% of synthesis orders, but non-zero].
- **Behavior of the check on this category:** no-signal (`registry_no_record`)
- **Reasoning:** Sole proprietors and unincorporated entities do not appear in corporate registries. The check is structurally blind to this category.

## Refined false-positive qualitative

1. **Newly incorporated biotechs** (Gap 3) — `registry_recent_incorp` fires on every legitimate new biotech. This is the highest-volume false positive for this check among commercial customers (~47% of synthesis market).
2. **Generic-SIC biotechs** (Gap 5) — `sic_not_life_sciences` fires on real biotechs with bad SIC codes. Reviewer must read the company name and web presence to adjudicate; not auto-deny but adds friction.
3. **Government/academic institutions** (Gaps 1–2) — `registry_no_record` fires on the ~39% academic segment and government labs. This is not a false positive in the traditional sense (the flag is correct — no record exists), but it is uninformative for the largest customer segments. These require fallback to other M09 ideas (PubMed, ROR, domain-auth).
4. **Pass-through state LLCs** (noted in 04-implementation) — DE/WY/NM LLCs with registered-agent addresses are indistinguishable from shells at this layer.

## Notes for stage 7 synthesis

- This check is load-bearing for **commercial for-profit customers** (47% of synthesis market) and weak/blind for **academic** (~39%) and **government** customers. It must be combined with academic-facing checks (PubMed affiliation, ROR, accreditation stack) to avoid a structural blind spot covering nearly half the market.
- The OpenCorporates coverage gap in non-OECD jurisdictions means the check degrades precisely where shell-company risk may be highest (jurisdictions with weaker corporate governance).
- The `registry_recent_incorp` flag has the highest false-positive rate among all flags; it should be treated as a soft signal requiring corroboration, not a standalone indicator.
