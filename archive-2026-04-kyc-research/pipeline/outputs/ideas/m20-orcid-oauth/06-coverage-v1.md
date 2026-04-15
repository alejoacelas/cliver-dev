# Coverage research: ORCID OAuth proof-of-control

## Coverage gaps

### Gap 1: Vouchers without an ORCID iD (industry, clinical, non-publishing)
- **Category:** Legitimate vouchers who have never registered for an ORCID iD. This includes industry R&D scientists (lower publication pressure), clinicians and clinical investigators, senior researchers from the pre-ORCID era (launched 2012), and researchers in disciplines with low ORCID adoption.
- **Estimated size:** ORCID has ~15-19 million registered iDs (14.7M as of August 2022 [source](https://en.wikipedia.org/wiki/ORCID), growing ~2-3M/year). There are roughly 9-12 million FTE researchers worldwide. [source](https://sciencebusiness.net/news/number-scientists-worldwide-reaches-88m-global-research-spending-grows-faster-economy) However, many ORCID registrants are students, retired, or inactive. A U.S. survey found 72% ORCID adoption among academic researchers, but biological/biomedical sciences reached 93%. [source](https://link.springer.com/article/10.1007/s11192-025-05300-7) Industry adoption is much lower: the Toulouse study found 41.8% overall with strong discipline disparities. [source](https://onlinelibrary.wiley.com/doi/full/10.1002/leap.1451) [best guess: among potential vouchers for DNA synthesis orders (mostly life-sciences academics and industry scientists), ~70-85% of academic vouchers have ORCID, but only ~30-45% of industry vouchers do. The overall gap is ~20-40% of vouchers lacking ORCID, concentrated in industry.]
- **Behavior of the check on this category:** no-signal (routes to alternate-evidence path)
- **Reasoning:** The implementation routes ORCID-less vouchers to a manual alternate-evidence pathway (institutional email DKIM, faculty page lookup, peer-vouched second voucher). This is workable but adds friction and reviewer time. The check's value is zero for this population.

### Gap 2: Vouchers with empty or private ORCID profiles
- **Category:** Vouchers who have an ORCID iD but whose profile is either empty ("ghost profiles" created to satisfy a publisher/funder requirement) or set to fully private visibility. The OAuth `/authenticate` scope succeeds (proving iD control) but the downstream `/record` read returns no usable employment or works data.
- **Estimated size:** A study of Spanish researchers found 73% of ORCID profiles had employment metadata populated, meaning ~27% lacked employment records. [source](https://www.researchgate.net/figure/Completeness-comparison-of-ORCID-profiles-between-2019-and-2022-Data-from-Bergmans-et_fig1_372572648) Many profiles are "ghost profiles" created only to get an identifier. [best guess: ~20-30% of ORCID holders who would be vouchers have empty or near-empty profiles, making the downstream legitimacy checks (employment verification, works evidence, ROR bridge) fail even though OAuth itself succeeded.]
- **Behavior of the check on this category:** weak-signal (OAuth proves iD control but no downstream data)
- **Reasoning:** The stage-4 implementation triggers `orcid_record_empty_employments` and `orcid_record_no_works` flags for this population. These are informational, not auto-fail, but they substantially weaken the check's value because the ORCID record provides no bridge to institutional identity.

### Gap 3: Vouchers in regions with low ORCID adoption
- **Category:** Vouchers at institutions in regions where ORCID adoption is low: parts of Latin America, Sub-Saharan Africa, several Asian countries. These regions have fewer institutional ORCID mandates and lower integration with publisher/funder workflows.
- **Estimated size:** ORCID adoption is concentrated in Europe, North America, and parts of East Asia. A Frontiers study found significant variation in institutional ORCID practice across countries. [source](https://www.frontiersin.org/journals/research-metrics-and-analytics/articles/10.3389/frma.2022.1010504/full) [best guess: ORCID adoption at institutions in non-OECD countries outside China and India may be 20-40%, compared to 70-90% at US/UK/EU institutions. Vouchers from these regions are disproportionately routed to the alternate-evidence path.]
- **Behavior of the check on this category:** no-signal (same alternate-evidence path as Gap 1)
- **Reasoning:** The coverage gap is compounded by the fact that these same institutions may also have weak DKIM (affecting the m20-dkim alternate-evidence path) and may not be in ROR (affecting the m20-ror-disjointness check). Multiple checks fail simultaneously for this population.

### Gap 4: Stale ORCID employment records
- **Category:** Vouchers who have changed institutions but not updated their ORCID employment record. The ORCID employment record is user-maintained, not authoritative; there is no automatic synchronization with institutional HR systems.
- **Estimated size:** [unknown — searched for: "ORCID employment record staleness update frequency", "how often researchers update ORCID profile"; no direct data on the fraction of ORCID profiles with stale employment. [best guess: given that employment records are user-maintained and many researchers change institutions every 3-5 years, perhaps 15-25% of active ORCID profiles have an outdated primary employment at any given time.]
- **Behavior of the check on this category:** weak-signal / false-positive
- **Reasoning:** The implementation uses `employments[0].organization.disambiguated-organization-identifier` to bridge to the ROR disjointness check. A stale employment record points to the wrong institution, causing either a false-positive (voucher appears to be at the same institution as the customer when they are not) or a false-negative (voucher appears to be at a different institution when they are actually at the same one).

### Gap 5: Attackers with legitimate but fabricated ORCID profiles
- **Category:** An attacker who creates a new ORCID iD, populates it with fabricated employment and works data (ORCID does not verify user-asserted claims), and completes the OAuth flow. The check passes because ORCID proves identity control, not identity truth.
- **Estimated size:** [unknown — searched for: "ORCID fake profile detection fabricated researcher identity", "ORCID self-asserted data verification"; ORCID does not systematically verify user-asserted employment or works data. [best guess: creating a convincing ORCID profile takes minutes and costs nothing. The barrier is that the fabricated profile must survive downstream checks (e.g., the employment ROR must match a real institution, the listed works must have real DOIs). But a careful attacker can list real papers by other authors and claim a real institution.]
- **Behavior of the check on this category:** no-signal (passes)
- **Reasoning:** ORCID OAuth proves control of the iD, not the legitimacy of the claims on the profile. This is a fundamental limitation: the check binds the voucher to an ORCID iD, but the ORCID iD is self-asserted. The downstream employment and works checks add some resistance, but only if they are independently verified (e.g., cross-checked against the institution's ORCID member API integration, which pushes verified employment data).

## Refined false-positive qualitative

Cross-referencing the gaps above with the stage-4 false-positive list:

1. **Industry researchers** (stage 4) — quantified as Gap 1; ~55-70% of industry vouchers may lack ORCID.
2. **Clinicians and clinical investigators** (stage 4) — subsumed under Gap 1.
3. **Senior PIs from pre-ORCID era** (stage 4) — subsumed under Gap 1; diminishing category as ORCID adoption grows.
4. **Researchers in low-adoption regions** (stage 4) — quantified as Gap 3; ~60-80% of non-OECD vouchers may lack ORCID.
5. **Vouchers with private profiles** (stage 4) — quantified as Gap 2; ~20-30% of ORCID holders.
6. **Recently-moved researchers with stale employment** (stage 4) — quantified as Gap 4; ~15-25%.
7. **Cumulative false-positive / no-signal estimate:** [best guess: for US/EU academic vouchers in life sciences, the check works well (~85-90% have ORCID with populated profiles). For industry vouchers, ~50-70% will be routed to alternate-evidence paths. For non-OECD academic vouchers, ~40-60% may lack ORCID entirely.]

## Notes for stage 7 synthesis

- ORCID OAuth is a strong proof-of-control mechanism for researchers who have an ORCID iD with a populated profile. For this population, it is the single best binding check between a claimed identity and a verifiable digital footprint.
- The check's primary weakness is that the population it works best for (US/EU academic life-science researchers with rich ORCID profiles) is also the population least likely to be malicious. The populations it works poorly for (industry, non-OECD, clinical) are where attacker risk may be higher or where legitimate access matters most.
- The Member API (`/read-limited` scope) would partially address Gap 2 by accessing data the user marked "trusted parties only," but requires paid ORCID membership ($1,250-$5,500/year).
- The fabricated-profile vulnerability (Gap 5) is a fundamental limitation of any self-asserted identity system. Mitigation requires cross-checking ORCID claims against independent sources (OpenAlex works, institutional ORCID integrations).
