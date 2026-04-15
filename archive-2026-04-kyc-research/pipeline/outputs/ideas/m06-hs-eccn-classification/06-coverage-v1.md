# Coverage research: HS code / ECCN classification SOP

## Coverage gaps

### Gap 1: Legitimate researchers ordering fragments of controlled pathogens (diagnostic primers, vaccine antigens, antibody fragments)
- **Category:** Customers ordering short DNA fragments that trigger sequence-of-concern (SOC) screening hits because they are homologous to 1C351/1C354 listed agents, but whose products are not themselves "genetic elements" capable of encoding a significant hazard. This includes diagnostic primer manufacturers, vaccine developers (BARDA/CEPI/NIAID portfolio), public health surveillance labs, and academic teaching-kit producers.
- **Estimated size:** An estimated 5% of DNA synthesis orders are flagged for review by sequence screening [source](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319849/). Of flagged orders, non-regulated sequences of concern represent 7–9% of sequences [source](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319849/). Most flagged orders resolve to EAR99 after review. The fraction that actually classifies as 1C353 is [unknown — searched for: "1C353 ECCN classification DNA synthesis how many orders classified controlled vs EAR99", "percentage DNA synthesis orders controlled ECCN" — no public data on the 1C353 classification rate]. Best guess: <1% of total orders ultimately classify as 1C353 [best guess: the 5% screening hit rate is a sensitivity filter; the vast majority of hits resolve as non-hazardous after protein-coding analysis].
- **Behavior of the check on this category:** false-positive (the SOC screening hit triggers the classification SOP, and the reviewer must spend 15–45 minutes per case on the protein-coding hazard analysis even when the result is EAR99)
- **Reasoning:** This is the dominant false-positive burden of the SOP. The classification itself is correct (it produces an EAR99 result), but the review process imposes delay on legitimate customers. The December 2023 EAR amendment reducing license requirements for 1C353 items shipped to Australia Group members helps for Western collaborators but doesn't reduce the classification workload.

### Gap 2: Novel or chimeric sequences not on the SOC list
- **Category:** Orders containing sequences that are not on the current SOC list but may encode proteins functionally similar to controlled agents — synthetic variants, codon-optimized versions, chimeric constructs combining controlled and uncontrolled segments.
- **Estimated size:** [unknown — searched for: "synthetic variant pathogen sequences not on SOC list", "codon optimized controlled pathogen percentage synthesis orders" — no data]. The SOC list is updated periodically but is inherently backward-looking. Synthetic biology advances continuously create novel sequences outside the list's scope.
- **Behavior of the check on this category:** no-signal (if the sequence screening pipeline does not flag the order, the SOP defaults to EAR99 without review)
- **Reasoning:** This is a fundamental limitation of any list-based screening approach. The SOP relies on the upstream sequence screening output as its trigger. If the screening misses a novel variant, the ECCN classification defaults to EAR99 even if the sequence is functionally controlled. This gap is addressed by the screening pipeline itself, not by this SOP — but it propagates to the SOP's coverage.

### Gap 3: Delivery vectors (plasmids, AAV, lentiviral vectors) carrying controlled genes
- **Category:** Orders for delivery vectors (cloning plasmids, adeno-associated virus packaging plasmids, lentiviral transfer vectors) that contain controlled genetic elements. The ECCN 1C353 explicitly includes vectors, but the classification requires the reviewer to assess whether the vector's payload is a controlled element — a non-trivial determination.
- **Estimated size:** [unknown — searched for: "plasmid synthesis orders percentage of gene synthesis market", "AAV vector synthesis screening" — no quantitative data on the fraction of synthesis orders that are vectors vs. linear DNA]. Plasmid and vector synthesis is a growing segment of the market (GenScript, Twist Bioscience, and others offer cloning and vector services), but the fraction that carries controlled payloads is small.
- **Behavior of the check on this category:** weak-signal (the SOP covers this case in its decision tree, but the reviewer must evaluate both the vector and its payload; ambiguous cases are common)
- **Reasoning:** The complexity of vector classification increases the time per review and the likelihood of classification error. The SOP handles this through escalation to senior compliance, but the delay is substantial (possible CCATS request to BIS, which takes months).

### Gap 4: Products with modified bases or non-standard chemistry
- **Category:** Synthesis orders using modified nucleotides (locked nucleic acids, morpholinos, peptide nucleic acids, 2'-O-methyl-RNA, phosphorothioate backbones) or non-standard product formats (lyophilized, conjugated, encapsulated). The HS classification may shift from 2934.99 to another heading, and the ECCN analysis may be complicated by the modification's impact on biological activity.
- **Estimated size:** Modified-base synthesis is a growing market segment. [unknown — searched for: "modified nucleotide synthesis market share percentage", "LNA PNA synthesis orders" — no systematic data]. Major providers (IDT, Eurofins, Qiagen) offer extensive modified-base portfolios; the fraction of total orders is provider-specific.
- **Behavior of the check on this category:** weak-signal (the SOP's HS classification step handles this via the `hs_classification_unusual` flag, but the ECCN analysis may not be straightforward for heavily modified sequences)
- **Reasoning:** Modified bases can alter the biological activity of a sequence (e.g., a phosphorothioate antisense oligonucleotide targeting a controlled toxin mRNA is functionally different from the natural sequence). The SOP's protein-coding hazard analysis may not account for these modifications.

### Gap 5: Non-US providers and non-US regulatory frameworks
- **Category:** DNA synthesis providers based outside the US (EU, UK, China, Japan, Korea) who may operate under different export-control regimes (EU Dual-Use Regulation, UK Export Control Order, Wassenaar Arrangement implementations) with different ECCN equivalents or no ECCN system at all.
- **Estimated size:** North America accounts for ~40–55% of the global DNA synthesis market [source](https://www.cognitivemarketresearch.com/dna-synthesis-market-report) [source](https://www.businessresearchinsights.com/market-reports/dna-synthesis-market-110778). The remaining 45–60% is served by non-US providers who would not use the EAR/ECCN framework directly. The SOP as written is US-specific.
- **Behavior of the check on this category:** no-signal (the SOP does not apply to non-US providers)
- **Reasoning:** This is a scope limitation, not a gap in the SOP's design. For a policy audience, it is worth noting that the SOP's coverage extends only to US-jurisdiction shipments (or re-exports subject to EAR). EU providers use different classification systems (ML or equivalent control-list entries under the EU Dual-Use Regulation).

## Refined false-positive qualitative

Cross-referenced with gaps above:

1. **Diagnostic and vaccine researchers** (Gap 1): The largest false-positive population. An estimated 5% of orders trigger SOC screening flags [source](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319849/); most resolve to EAR99 after review. These customers experience delays of hours to days while the hazard analysis completes. The post-December 2023 AG-member exemption reduces the licensing burden for Western collaborators but not the classification review itself.

2. **Public health labs** (Gap 1 subset): Surveillance assays for controlled pathogens trigger SOC hits by design. These orders are routinely EAR99 but require the full classification review.

3. **Therapeutic developers working on dual-use pathogens** (Gap 1 subset): The entire BARDA/CEPI/NIAID vaccine and therapeutic portfolio involves controlled-pathogen sequences. These customers are high-value and high-volume; classification delays are a recurring friction point.

4. **Academic teaching kits** (Gap 1 subset): Harmless fragments of named pathogens for educational use. Low volume but high visibility when delayed.

## Notes for stage 7 synthesis

- This SOP is the gatekeeper for m06-bis-country-groups. Its coverage gaps propagate: if the SOP misclassifies an order (Gap 2: novel sequences not on the SOC list), the Country Chart lookup receives incorrect input and may permit a shipment that should have been controlled.
- The dominant operational burden is Gap 1 (false positives on legitimate researchers). The 5% screening hit rate is the best available proxy for the SOP's review workload, but the fraction that reaches the 1C353 classification (and thus triggers licensing requirements) is much smaller — likely <1% of total orders.
- Gap 5 (non-US providers) is important for the policymaker audience: the ECCN framework covers only US-jurisdiction exports. A global DNA synthesis screening regime would need to harmonize classification across Wassenaar-member implementations.
