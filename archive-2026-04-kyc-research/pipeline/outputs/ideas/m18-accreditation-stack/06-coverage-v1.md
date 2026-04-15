# Coverage research: Accreditation registry stack

## Coverage gaps

### Gap 1: Foreign institutions outside the US/UK accreditation ecosystem
- **Category:** Research institutions in non-OECD countries (and many OECD countries outside the US/UK) whose national accreditations are administered by bodies not in the stack (e.g., NABL in India, CNAS in China, KOLAS in South Korea, DAkkS in Germany for ISO 17025). The stack covers A2LA, ANAB, and UKAS for ISO 17025 but not the dozens of other ILAC signatories.
- **Estimated size:** The stack covers US (A2LA, ANAB) and UK (UKAS) ISO 17025 accreditors. There are 100+ national accreditation bodies in the ILAC mutual recognition arrangement ([source](https://ilac.org/about-ilac/facts-and-figures/)). DNA synthesis customers are ~46% industry/commercial globally ([source](https://www.novaoneadvisor.com/report/us-gene-synthesis-market) — inverse of the 54% academic+government share in the US market). Non-US/UK customers ordering sequences of concern would have accreditations from bodies not in this stack. [best guess: 30–50% of all synthesis-buying institutions worldwide hold accreditations only from national bodies outside the US/UK, making them invisible to this stack.]
- **Behavior of the check on this category:** no-signal (the relevant registry is not queried)
- **Reasoning:** The implementation explicitly lists CMS/QCOR, CAP, AAALAC, OLAW, A2LA, ANAB, UKAS, FDA BIMO, and Global BioLabs. A legitimate German calibration lab accredited by DAkkS, or a legitimate Indian clinical lab accredited by NABL, would not appear in any of these.

### Gap 2: Institutions that legitimately do not hold any accreditation
- **Category:** Legitimate life-sciences research institutions that do not perform clinical testing (no CLIA need), do not use animals (no AAALAC/OLAW need), do not operate calibration labs (no ISO 17025 need), do not do GLP tox studies, and do not operate BSL-3+/4 facilities. This includes many computational biology labs, bioinformatics centers, plant biology labs, ecology departments, and small biotechs doing molecular biology without animal work.
- **Estimated size:** [best guess: A substantial fraction — possibly 40–60% — of legitimate gene synthesis customers fall into categories where none of the accreditations in the stack apply to their work. The stack is triggered only when a customer *claims* an accreditation, but many legitimate customers have no accreditation to claim. The implementation's design (verify *claimed* accreditations, not require them) means these customers simply bypass the check entirely.]
- **Behavior of the check on this category:** no-signal (check is not triggered because no accreditation is claimed)
- **Reasoning:** The implementation fires flags only when a claimed accreditation is not found. An attacker who simply does not claim any accreditation never triggers the check.

### Gap 3: BSL-3 labs not in the Global BioLabs map
- **Category:** BSL-3 (not BSL-3+ or BSL-4) laboratories worldwide. The Global BioLabs project tracks only BSL-4 and BSL-3+ facilities.
- **Estimated size:** A 2025 mapping study identified 3,515 BSL-3 labs worldwide ([source](https://link.springer.com/article/10.1007/s10389-025-02492-3)), while the Global BioLabs Report 2023 tracks only 69 BSL-4 + 57 BSL-3+ = ~126 facilities ([source](https://www.kcl.ac.uk/warstudies/assets/global-biolabs-report-2023.pdf)). That means ~3,389 BSL-3 labs (96%) are outside the Global BioLabs registry.
- **Behavior of the check on this category:** false-positive (a legitimate BSL-3 lab claiming high-containment capability would not appear in the Global BioLabs map, potentially triggering `bsl_claim_not_in_global_biolabs_map`)
- **Reasoning:** The implementation flags institutions claiming BSL-3+/BSL-4 work that are not in the Global BioLabs registry. But the registry covers only the highest-tier facilities; standard BSL-3 labs are absent by design.

### Gap 4: OLAW-assured but not AAALAC-accredited institutions (and vice versa)
- **Category:** US institutions with OLAW Animal Welfare Assurance that are not AAALAC-accredited (AAALAC is voluntary), and institutions that are AAALAC-accredited but not OLAW-assured (institutions not receiving PHS funds).
- **Estimated size:** AAALAC accredits ~1,140+ orgs across 52 countries ([source](https://www.aaalac.org/accreditation-program/directory/directory-of-accredited-organizations/)). OLAW lists ~1,100 assured institutions in the US. The overlap is substantial but not complete — the implementation acknowledges this but treats each registry independently. [best guess: ~200–400 US institutions hold OLAW assurance without AAALAC accreditation, and a comparable number of non-US institutions hold AAALAC without OLAW.]
- **Behavior of the check on this category:** weak-signal (the check may query the wrong registry for the claimed accreditation scope, or accept one when the other would be more informative)
- **Reasoning:** The implementation notes AAALAC is voluntary and OLAW applies only to PHS-funded institutions. A customer claiming "animal care accreditation" could be in one but not the other; the manual review must handle the cross-walk.

### Gap 5: GLP registry — weakest link, no consolidated public list
- **Category:** Institutions claiming GLP compliance whose GLP status cannot be verified programmatically because no consolidated GLP facility list exists.
- **Estimated size:** The implementation estimates 300–500 FDA-inspected GLP labs in the US, and notes 480+ national GLP monitoring programs globally under the OECD MAD. [best guess: total GLP-compliant facilities worldwide may be 2,000–5,000, but the publicly queryable subset is near zero — FDA BIMO results are not a clean feed, and OECD member countries do not publish consolidated lists.]
- **Behavior of the check on this category:** no-signal (cannot verify the claim programmatically) / weak-signal (requires manual FOIA or direct contact)
- **Reasoning:** The implementation itself marks the GLP registry as "the weakest of the stack." A GLP claim essentially falls through to manual review with no automated verification.

### Gap 6: Classified or restricted-access laboratories
- **Category:** DoD, IC, and defense-contractor labs operating under classified programs whose accreditation status is not reflected in public registries.
- **Estimated size:** [unknown — searched for: "number of classified DoD biosafety labs", "defense biological research facilities total US"]. The number of classified BSL facilities in the US is itself not public. [best guess: dozens to low hundreds of facilities.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The implementation's failure_modes section notes classified DoD/IC labs are absent from all registries. These are legitimate customers whose accreditation claims cannot be verified.

## Refined false-positive qualitative

The original false_positive_qualitative list is accurate. Refined with cross-references to coverage gaps:

1. **Small new labs without accreditation** (Gap 2) — these never trigger the check; not a false positive but a coverage hole.
2. **Foreign institutions with national-equivalent accreditations** (Gap 1) — if they claim an accreditation, `claimed_accreditation_not_in_registry` fires incorrectly. True false positive.
3. **Independent / citizen-science labs** (Gap 2) — no accreditation to claim; coverage hole.
4. **Government / national labs in restricted registries** (Gap 6) — `claimed_accreditation_not_in_registry` fires incorrectly. True false positive.
5. **Recently renamed / merged institutions** (Gap 4, name normalization) — registry record mismatch. True false positive.
6. **BSL-3 labs not in Global BioLabs** (Gap 3) — `bsl_claim_not_in_global_biolabs_map` fires incorrectly. True false positive.
7. **GLP-claiming institutions with no verifiable registry** (Gap 5) — effectively unverifiable; manual escalation required.

## Notes for stage 7 synthesis

- The stack is structurally *claim-verification* shaped: it only fires when a customer makes an affirmative accreditation claim. An attacker who avoids claiming any accreditation entirely bypasses this check. This is by design (the check verifies claims, not requires them), but it means the check's coverage is gated by whether the screening workflow *requires* accreditation claims for certain order types.
- The largest quantifiable gap is BSL-3 vs Global BioLabs: 96% of BSL-3 labs worldwide are outside the registry. This makes the `bsl_claim_not_in_global_biolabs_map` flag very noisy.
- The foreign-accreditation gap (Gap 1) is structurally large but can be partially closed by adding national accreditation bodies from ILAC signatory lists. The implementation should note which additional bodies would have the highest marginal coverage (DAkkS, NABL, CNAS are likely top candidates).
- GLP is the weakest registry in the stack for automated verification.
