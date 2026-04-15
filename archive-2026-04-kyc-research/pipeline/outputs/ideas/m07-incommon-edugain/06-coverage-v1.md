# Coverage research: InCommon + eduGAIN federation IdP enumeration

## Coverage gaps

### Gap 1: US higher-education institutions not in InCommon
- **Category:** Degree-granting US colleges and universities (especially community colleges, small liberal-arts colleges, and vocational institutions) that have not joined InCommon and therefore have no IdP scope in the federation metadata.
- **Estimated size:** InCommon has ~1,000+ members total, of which ~500+ are higher-education institutions ([source](https://incommon.org/federation/why-incommon-federation/)). NCES reports ~5,819 Title IV degree-granting institutions in the US as of 2023-24 ([source](https://nces.ed.gov/whatsnew/press_releases/8_21_2024.asp)). That means roughly **~5,300 US higher-ed institutions (~91%) are NOT InCommon members**. Most of these are community colleges, small private colleges, and vocational schools. [best guess: the majority of R1/R2 research universities are InCommon members; the gap is concentrated in the ~4,000+ community colleges and ~1,000 small 4-year institutions that do not run R&E federation IdPs.]
- **Behavior of the check on this category:** no-signal (fires `domain_no_federation`; triggers manual review)
- **Reasoning:** InCommon membership is concentrated among research universities, large state systems, and federal-grant-eligible institutions. Community colleges and small private colleges rarely join because the primary value prop is federated access to research resources (e.g., NSF, NIH portals) that these institutions rarely use. A synthesis customer at a US community college with a legitimate teaching-lab order would trip the "no federation" flag.

### Gap 2: Non-OECD academic institutions outside eduGAIN coverage
- **Category:** Researchers at universities in countries whose national R&E federation has not joined eduGAIN, or where no national federation exists. Concentrated in sub-Saharan Africa (pre-2025: ~9 of 54 countries had eduGAIN members), Central Asia, parts of the Middle East, and several Latin American countries.
- **Estimated size:** eduGAIN covers ~80 federations with ~6,000+ IdPs ([source](https://edugain.org/)). UNESCO estimates ~40,000+ higher-education institutions worldwide. [best guess: eduGAIN's 6,000 IdPs cover perhaps 5,000-6,000 distinct institutions (some institutions run multiple IdPs); that leaves ~34,000 institutions worldwide (~85%) outside eduGAIN. However, many of these are not DNA synthesis customers. Among non-OECD synthesis-relevant institutions, the gap is most acute in Africa and Central Asia.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** eduGAIN's coverage is strong in Europe, North America, Australia, and parts of East Asia, but sparse in Africa and Central Asia. A researcher at the University of Lagos or Makerere University (Uganda) whose national federation has not joined eduGAIN would get no signal. Recent GEANT announcements note 5 new African federations joining in 2025 ([source](https://connect.geant.org/2025/04/15/five-new-african-members-join-edugain)), but coverage remains thin.

### Gap 3: Commercial biotech and pharmaceutical companies
- **Category:** Researchers at for-profit life-sciences companies (small biotech startups, mid-size pharma, CROs, agricultural biotech) that by design are not R&E federation members.
- **Estimated size:** Commercial customers represent ~42-46% of DNA synthesis market revenue ([source](https://www.grandviewresearch.com/industry-analysis/dna-synthesis-market-report)). There are thousands of biotech companies in the US alone (~2,800+ as of recent estimates; [source](https://www.statista.com/statistics/197930/number-of-united-states-biotech-companies-by-type/)). None of these are InCommon/eduGAIN IdP operators by design.
- **Behavior of the check on this category:** no-signal (systematic false negative)
- **Reasoning:** R&E federations serve education and research — not commercial entities. A researcher at Genentech, Moderna, or a 10-person biotech startup will never have a federated IdP scope. This is the largest structural gap: the check is architecturally blind to ~42-46% of the synthesis market.

### Gap 4: Government and military research labs
- **Category:** Researchers at government labs (NIH intramural, CDC, USAMRIID, DOE national labs, DSTL (UK), CSIRO (Australia)) that may or may not participate in R&E federations.
- **Estimated size:** [best guess: US DOE national labs (17) and NIH intramural (~25 institutes) are mostly InCommon members or accessible via Login.gov/MAX.gov federation; the gap is smaller here. Non-US government labs are less likely to be in eduGAIN. Perhaps ~2-5% of synthesis customers are government researchers, and ~30-50% of those are outside federation coverage.]
- **Behavior of the check on this category:** weak-signal (some government labs are federated; many are not)
- **Reasoning:** US national labs are often InCommon members, but state-level public health labs, foreign government labs, and military-adjacent research facilities typically are not.

### Gap 5: Institutions using Microsoft Entra / Google Workspace instead of SAML R&E federation
- **Category:** Small colleges and corporate labs that use cloud-identity SSO (Microsoft Entra ID, Google Workspace) but have not joined InCommon or any R&E SAML federation.
- **Estimated size:** [unknown — searched for: "higher education institutions using Microsoft Entra not InCommon", "colleges using Google Workspace identity not federated" — no published census of this population exists.] [best guess: this overlaps heavily with Gap 1; many of the ~5,300 non-InCommon US colleges use Entra/Google rather than Shibboleth.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The implementation only parses SAML federation metadata. Institutions that authenticate via Entra or Google Workspace without publishing a SAML IdP into InCommon/eduGAIN are invisible.

### Gap 6: Independent / DIY biology labs and individual researchers
- **Category:** Non-institutional researchers: community bio labs (Genspace, BioCurious), independent consultants, retired scientists ordering for personal projects, citizen-science participants.
- **Estimated size:** [best guess: <1% of synthesis orders by volume, but growing. There are ~50-100 community bio labs worldwide as of 2025 estimates.] 
- **Behavior of the check on this category:** no-signal
- **Reasoning:** These customers have no institutional email domain at all, let alone a federated one.

## Refined false-positive qualitative

The check does not generate classical false positives (it does not wrongly accuse legitimate customers of being malicious). Instead, it generates **false negatives** — legitimate customers who fire `domain_no_federation` and require manual review:

1. **~42-46% of the market** (commercial biotech/pharma) — systematic no-signal (Gap 3)
2. **~91% of US higher-ed institutions** by count, though these are mostly small institutions with low synthesis demand (Gap 1)
3. **~85% of worldwide institutions** by count, though demand-weighted the fraction is lower because OECD academic institutions are disproportionate synthesis buyers (Gap 2)
4. Government labs with partial coverage (Gap 4)
5. Institutions on cloud-identity platforms without SAML federation (Gap 5)
6. Non-institutional researchers (Gap 6)

**Net assessment:** This check provides strong positive signal when it fires (`domain_in_incommon` / `domain_in_edugain` is high-confidence), but it fires for a **minority** of legitimate customers — primarily researchers at R1/R2 universities in OECD countries. It must be paired with complementary checks (ROR, Google site-search, publication lookup) to cover the majority of the market.

## Notes for stage 7 synthesis

- The check's value is as a **high-confidence positive signal**, not as a screen. A federation match is near-certain evidence of real institutional affiliation; absence of a match is uninformative.
- The ~42-46% commercial gap is structural and cannot be closed by expanding federation membership — commercial entities are excluded by design.
- Coverage improves over time as eduGAIN grows (5 new African federations in 2025 alone), but the improvement is marginal relative to the structural commercial gap.
- Pairing with m07-proxycurl-linkedin or m07-google-site-search is essential for the no-signal cases.
