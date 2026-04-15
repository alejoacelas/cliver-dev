# m06-hs-eccn-classification — bypass-aware hardening v1

**Idea under review:** `outputs/ideas/m06-hs-eccn-classification/04-implementation-v1.md`
**Measure:** M06 — shipping-export-country

---

## Attacker story walk

### foreign-institution

**Summary:** Attacker claims affiliation with a foreign academic institution, ships synthesis internationally. The ECCN classification determines whether a license is required for the destination country.

**Bypass methods relevant to M06 (ECCN classification leg):**

1. **Order non-SOC sequences (dominant bypass).**
   - **MISSED.** The ECCN classification SOP's decision tree starts with: "Did the sequence-screening pipeline flag the order as containing a sequence 'specific to' a 1C351 or 1C354 listed agent?" If the answer is No, the SOP terminates immediately with EAR99 — no license required to any destination except comprehensively embargoed countries (Group E). The foreign-institution branch targets non-embargoed countries (Brazil, Japan, India, Indonesia, Vietnam). An attacker ordering non-SOC sequences gets EAR99 classification, which requires no license to these destinations. The ECCN classification SOP has zero leverage on non-SOC orders.
   - **Why this matters:** The foreign-institution branch can order non-SOC sequences that are still useful for malicious purposes (e.g., cloning vectors, expression constructs for non-listed agents, or enabling components). The SOP only controls 1C353 items; everything else is EAR99.
   - **Structural:** This is by design of the EAR. EAR99 items are not controlled. The SOP correctly implements the regulation.

2. **Order SOC sequences and ship to an Australia Group member (partial bypass).**
   - **CAUGHT (post-Dec 2023 amendment).** If the attacker orders 1C353 items and ships to an AG member (Japan is AG; India, Brazil, Indonesia, Vietnam are not), the December 2023 amendment exempts the license requirement. The SOP correctly documents this pathway: `december_2023_exemption_applies = true`. The attacker gets the 1C353 item without a license to Japan.
   - **CAUGHT (for non-AG members).** For India, Brazil, Indonesia, or Vietnam, 1C353 items trigger a license requirement (CB Column 1 + AT Column 1). The SOP would fire `eccn_1c353_required` and escalate to export compliance. The attacker would need a BIS license — a high bar.

3. **Chimera / fragment ordering to avoid SOC hit.**
   - **AMBIGUOUS.** The SOP's decision tree handles this at step 2 (protein-coding hazard analysis) and in the failure modes ("Item is a chimera with both controlled and uncontrolled segments"). Whether a fragmented or chimeric order triggers the SOC screening pipeline depends on the pipeline's sensitivity, not the ECCN SOP itself. If the sequence-screening pipeline does not flag the order, the ECCN SOP sees no SOC hit and defaults to EAR99.
   - **Detail not pinned down:** The ECCN SOP depends entirely on the sequence-screening pipeline's output. If the screening pipeline misses a clever sequence design (fragmented, codon-shuffled, chimeric), the ECCN SOP cannot independently identify the controlled item. The SOP's accuracy is bounded by the upstream screening.

**Net assessment:** The ECCN classification SOP correctly implements BIS regulations. Its leverage against the foreign-institution branch is limited by three structural factors: (a) most synthesis orders are EAR99 and require no license, (b) the December 2023 AG-member exemption removes the license requirement for 1C353 items shipped to Japan, and (c) the SOP depends on upstream sequence screening to identify controlled items. The SOP is a necessary compliance step but not a strong adversarial gate for this branch.

---

## Findings

### Critical

None.

### Moderate

1. **EAR99 default means the SOP has zero leverage on non-SOC orders (foreign-institution, all methods).**
   - Why: The vast majority of synthesis orders classify as EAR99. The foreign-institution branch can order non-SOC sequences that are still useful (cloning vectors, expression constructs) and avoid the ECCN classification gate entirely. The SOP fires only for 1C353 items.
   - Suggestion: Structural — the EAR does not control EAR99 items. Not addressable by this SOP. The gap is mitigated by sequence screening (which catches SOC) and by other M06 ideas (country groups, entity list) that operate independently of item classification.

2. **Upstream sequence-screening dependency is a single point of failure for the ECCN SOP (foreign-institution Method 3 variant: chimera/fragment).**
   - Why: The SOP's entire decision tree starts with the screening pipeline's output. If the screening pipeline has a false negative (fails to flag a controlled sequence), the ECCN SOP defaults to EAR99 and the item ships without export controls. The ECCN SOP has no independent sequence-analysis capability.
   - Suggestion: Stage 4 should note that the ECCN SOP's reliability is bounded by the sequence-screening pipeline's sensitivity, and that periodic calibration of the screening pipeline against the 1C351/1C354 agent list is a prerequisite for the SOP's effectiveness. This is a cross-idea dependency, not an internal gap.

### Minor

3. **December 2023 AG-member exemption is correctly documented but creates a legal surface area.**
   - The exemption removes the license requirement for 1C353 items to AG members. This is correct law, but it means Japan (the only AG member in the foreign-institution branch's target set) is a license-free destination even for controlled items. The SOP correctly handles this; no change needed.

4. **CCATS (BIS commodity classification ruling) process for ambiguous items is months-long.**
   - Documented as a failure mode. For time-sensitive attacker scenarios, the delay is a mitigation (the order is held pending classification). But for legitimate customers, it's a significant false-positive-like delay.
   - Suggestion: No change needed; this is inherent to the regulatory process.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| foreign-institution (order non-SOC sequences, EAR99 default) | MISSED (structural — EAR99 not controlled) |
| foreign-institution (order 1C353 to AG member, e.g., Japan) | CAUGHT (exemption correctly applied; no license required by law) |
| foreign-institution (order 1C353 to non-AG member, e.g., India) | CAUGHT (license required; escalated to export compliance) |
| foreign-institution (chimera/fragment to evade screening) | AMBIGUOUS (depends on upstream screening pipeline) |

## bypass_methods_uncovered

- Non-SOC sequences classify as EAR99 and require no license — structural limitation of the EAR, not the SOP
- Chimera/fragment ordering that evades upstream sequence screening — SOP has no independent sequence analysis
- December 2023 AG-member exemption removes license requirement for Japan — legal, not a gap

---

**Verdict: PASS**

No Critical findings. The ECCN classification SOP correctly implements BIS regulatory requirements. Its limited leverage against the foreign-institution branch is structural (most items are EAR99; the AG-member exemption removes controls for Japan) rather than an implementation gap. The Moderate findings identify cross-idea dependencies (upstream sequence screening) and regulatory structural limitations, neither of which requires re-research of this idea.
