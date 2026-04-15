# Coverage research: Voucher IAL2 IDV (re-use of m14 vendor stack)

## Coverage gaps

### Gap 1: Voucher abandonment due to friction
- **Category:** Legitimate vouchers who refuse to complete or abandon the IDV flow because they find it intrusive, confusing, or beneath their professional standing. This includes senior PIs with high h-indices who object to consumer-grade selfie verification, and any voucher who is unfamiliar with IDV flows.
- **Estimated size:** General IDV abandonment rates range from 40-68% of users who encounter friction. [source](https://www.jumio.com/how-to-reduce-customer-abandonment/) [source](https://www.entrust.com/blog/2024/05/friction-versus-fraud) 1 in 5 users abandon account creation due to UX friction, rising to 1 in 3 for younger users. [best guess: for the specific population of senior academic vouchers — who are not accustomed to consumer IDV flows and may view the requirement as insulting — the abandonment/refusal rate could be 20-40%. These are disproportionately the most legitimate and highest-value vouchers.]
- **Behavior of the check on this category:** false-positive (legitimate voucher refuses, customer cannot use them)
- **Reasoning:** The IDV check creates a selection bias: it is most onerous for the most legitimate vouchers (senior academics who have never needed IDV) and least onerous for younger, tech-comfortable users. The check may systematically exclude the highest-credibility voucher population.

### Gap 2: Vouchers from countries with unsupported or poorly-supported document types
- **Category:** Vouchers whose government-issued ID is from a country whose document template is not well-supported by the IDV vendor's ML models. Jumio supports >5,000 ID types across 200 countries [source](https://www.jumio.com/global-coverage/), but coverage depth varies: common passports and driver's licenses are well-supported; national IDs from smaller countries may have higher false-reject rates.
- **Estimated size:** [best guess: Jumio and Onfido claim coverage of 200+ countries, but "coverage" means the document is in the training set — not that the false-reject rate is equally low across all documents. Vouchers from non-OECD countries with less-common national IDs or older passport formats likely experience 2-5x higher false-reject rates than vouchers with US/EU passports. If ~30-40% of synthesis customers are non-US, perhaps 10-20% of non-US vouchers experience document-related IDV failures.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** The IDV vendor returns a rejection or REFER for a legitimate document. The voucher must retry (adding friction) or the reviewer must override (adding cost). The systematic effect is that non-OECD vouchers face higher barriers.

### Gap 3: Demographic facial-recognition bias
- **Category:** Vouchers whose demographic characteristics (race, age, sex) cause systematically higher false-positive or false-match-failure rates in the vendor's facial recognition model. NIST FRVT studies document false-positive differentials of 10x-100x for Asian and African American faces relative to Caucasian faces for some algorithms. [source](https://pages.nist.gov/frvt/html/frvt_demographics.html) [source](https://nvlpubs.nist.gov/nistpubs/ir/2019/NIST.IR.8280.pdf)
- **Estimated size:** [best guess: the NIST FRVT data shows that false-positive rates vary by a factor of 720 within demographic groups for some algorithms, while false-negative rates vary by a factor of ~3. Vendor performance varies; top-performing algorithms show smaller differentials. For the voucher-IDV use case (1:1 face-to-document match), the relevant metric is false-reject rate, which has a 3x differential across demographics in the NIST data. This means ~3-10% of legitimate vouchers from certain demographics may fail the liveness/face-match step on first attempt.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** Demographic bias creates a systematically unequal barrier. The reviewer-override path exists but (a) requires explicit policy acknowledgment of the bias and (b) adds friction and delay for affected vouchers.

### Gap 4: Privacy-strict jurisdictions
- **Category:** Vouchers in jurisdictions with strict biometric data regulations who refuse selfie capture on principle or whose institution prohibits participation in biometric verification. Relevant regulations: Germany's BDSG, Quebec's Law 25, EU GDPR (Article 9 — biometric data as special-category data).
- **Estimated size:** [unknown — searched for: "IDV biometric refusal rate GDPR university researcher", "biometric verification opt-out rate Europe academic"; no direct data. [best guess: a small but vocal fraction of European and Canadian vouchers (perhaps 5-10%) may refuse on privacy grounds. Institutional policies at some European universities may prohibit or discourage participation in commercial biometric verification.]
- **Behavior of the check on this category:** no-signal (voucher refuses; must find alternate voucher)
- **Reasoning:** Unlike other checks where the voucher fails involuntarily, here the voucher actively declines. The customer must find a different voucher who is willing to complete IDV, which may be difficult in small fields or regions where privacy norms are strong.

### Gap 5: Attackers with genuine government IDs
- **Category:** Attackers who complete the IDV flow with their real, legitimate government-issued ID. The IDV check verifies that the voucher is a real person with a valid document — it does not verify that the person is a legitimate researcher or has any connection to biosafety.
- **Estimated size:** [unknown — searched for: "identity verification bypass real ID fraudulent intent rate"; no data. The IDV check's threat model is identity fabrication (fake documents, synthetic identities), not identity misuse (real person, malicious intent).]
- **Behavior of the check on this category:** no-signal (passes)
- **Reasoning:** IAL2 IDV binds the voucher to a real person. It does not assess whether that person is qualified to vouch. An attacker with a genuine passport and a willingness to be photographed passes the check trivially. The check is complementary to other M20 checks (ORCID, coauthor graph, ROR disjointness) that assess the voucher's qualifications, not just their identity.

## Refined false-positive qualitative

Cross-referencing the gaps above with the stage-4 false-positive list:

1. **Vouchers from under-represented document countries** (stage 4) — quantified as Gap 2; ~10-20% of non-US vouchers.
2. **Legitimate name mismatches** (stage 4) — confirmed; transliteration, married names, hyphenation create reviewer referrals. [best guess: 5-10% of cross-cultural voucher-IDV sessions require name-mismatch adjudication]
3. **Old/damaged passports** (stage 4) — subsumed under Gap 2 (document quality issues).
4. **Privacy-strict vouchers** (stage 4) — quantified as Gap 4; 5-10% of European vouchers.
5. **Senior PIs insulted by IDV** (stage 4) — quantified as Gap 1; 20-40% abandonment/refusal among senior academics.
6. **Demographic facial-recognition bias** (stage 4) — quantified as Gap 3; 3-10% first-attempt failure for affected demographics.
7. **Cumulative friction estimate:** [best guess: for US/EU vouchers with common passports, the IDV pass rate on first attempt is ~85-90%. For non-OECD vouchers or those with less-common documents, the first-attempt pass rate may be 70-80%. The larger barrier is willingness, not technical capability — the 20-40% refusal rate among senior academics is the dominant friction source.]

## Notes for stage 7 synthesis

- IDV is the strongest available check for binding a voucher to a real person. No other M20 check achieves this level of identity assurance.
- The check's primary weakness is that it verifies identity, not qualification. A real person with malicious intent passes trivially.
- The friction/abandonment problem (Gap 1) is the most operationally significant gap. Senior PIs — the highest-credibility vouchers — are the most likely to refuse. This is a design tension: the check is most valuable for vouchers whose identity is uncertain, but most burdensome for vouchers whose identity is least in doubt.
- Demographic bias (Gap 3) is a regulatory and equity concern that requires explicit vendor selection criteria (prefer vendors with smaller FRVT demographic differentials) and a documented reviewer-override policy.
- The check is best understood as a complement to ORCID OAuth and DKIM: IDV proves the voucher is a real person; ORCID proves they control a researcher identity; DKIM proves they control an institutional email. Together they cover identity, qualification, and institutional binding.
