# Coverage research: Structured SOC declaration form

## Coverage gaps

### Gap 1: Customers who use the "other/unknown" escape hatch extensively
- **Category:** Customers whose work does not fit the controlled vocabulary -- either because the vocabulary is incomplete or because the customer is unwilling to commit to a specific category. Includes researchers doing genuinely novel work, interdisciplinary projects, and customers who view the form as friction rather than a signal.
- **Estimated size:** [best guess: 10-25% of submissions will have at least one "other/unknown" field. This is based on the common pattern in structured data collection where ~10-20% of respondents use free-text fallbacks. Searched for: "structured form other option usage rate scientific surveys", "controlled vocabulary escape hatch usage frequency" -- no synthesis-specific data found. The implementation's `excessive_other` flag (3+ fields as "other/unknown") would likely fire on 3-8% of orders.]
- **Behavior of the check on this category:** weak-signal (the form captures data, but the structured fields are empty or generic; the check degrades to a free-text-only signal, which is what the form was designed to replace).
- **Reasoning:** This is the structural risk the implementation explicitly identifies: "Customer uses the `other / unknown` escape hatch for everything -- form has no information advantage over free text." The m15-llm-extraction idea exists specifically to mitigate this gap.

### Gap 2: Novel organisms not yet in NCBI Taxonomy
- **Category:** Customers working with newly discovered, engineered, or uncharacterized organisms that do not have an NCBI Taxonomy ID. Includes synthetic biology projects creating chimeric or artificial organisms.
- **Estimated size:** NCBI Taxonomy contains ~460,000 formal species names, covering ~25% of all described species ([NCBI Taxonomy 2020](https://academic.oup.com/database/article/doi/10.1093/database/baaa062/5881509)). However, the 75% gap is mostly in invertebrates and fungi, which are rarely relevant to synthesis orders. For bacteria, coverage approaches completeness. [best guess: <2% of synthesis orders involve organisms with no NCBI Taxonomy entry, since the vast majority of synthesis involves well-characterized model organisms and pathogens. Synthetic/chimeric organisms are the main exception.]
- **Behavior of the check on this category:** false-positive (`taxid_invalid` fires; the customer cannot complete the form without manual override).
- **Reasoning:** The implementation routes `taxid_invalid` to review. For the small fraction of customers working with novel organisms, the form requires a reviewer workaround.

### Gap 3: Orders spanning multiple use categories (single-select constraint)
- **Category:** Researchers whose project legitimately spans multiple intended-use categories (e.g., a project that involves both protein expression and gene editing, or both vaccine development and diagnostic assay development). The single-select enum forces a coarse choice.
- **Estimated size:** [best guess: 10-20% of academic/biopharma orders involve multi-faceted projects. No published data. Searched for: "research project multiple categories frequency", "gene synthesis order intended use category distribution" -- no data found.]
- **Behavior of the check on this category:** false-positive / weak-signal (customer picks one category; the form misrepresents the project; downstream cross-checks against the LLM extraction (m15-llm-extraction) trigger false disagreements).
- **Reasoning:** The implementation acknowledges this: "Order spans multiple use categories -- single-select form forces a coarse choice." The form's value for downstream cross-checks is reduced when the single-select doesn't capture the full picture.

### Gap 4: Researchers in non-US biosafety regulatory frameworks
- **Category:** International customers whose biosafety oversight is structured differently from the NIH Guidelines. The `ibc_approval_status` enum uses NIH Section III-F vocabulary (`approved`, `pending`, `exempt-section-III-F`, `not-applicable`), which doesn't map to UK Biological Agents Order, EU Directive 2009/41/EC, or other national frameworks.
- **Estimated size:** Non-North-America gene synthesis market is ~45% by revenue ([GM Insights](https://www.gminsights.com/industry-analysis/gene-synthesis-market)). Of those, customers in the EU, UK, Australia, and other OECD countries with formal biosafety frameworks represent the highest volume. [best guess: 20-30% of a global provider's customers would have biosafety oversight that doesn't map to the NIH IBC vocabulary.]
- **Behavior of the check on this category:** false-positive (customer's biosafety status doesn't fit the enum; they select `unknown` or `not-applicable`, triggering `excessive_other` or `bsl_inconsistent` if their framework uses different containment-level terminology).
- **Reasoning:** The implementation notes this in false_positive_qualitative: "Researchers in jurisdictions where IBC review is structured differently."

### Gap 5: Source-organism ambiguity for synthetic/codon-optimized sequences
- **Category:** Customers ordering codon-optimized sequences where the "source organism" is ambiguous -- the gene is derived from Organism A but optimized for expression in Organism B, and may share homology with Organism C.
- **Estimated size:** [best guess: 15-25% of gene synthesis orders involve codon optimization. Codon optimization is a standard service offered by all major providers (Twist, IDT, GenScript). Searched for: "codon optimization prevalence gene synthesis orders percentage" -- no public data found, but provider marketing materials universally feature it as a core service.]
- **Behavior of the check on this category:** weak-signal (the `source_organism_taxid` field captures one source, but the actual sequence has multi-organism provenance; `bsl_inconsistent` may fire if the source organism is a pathogen but the optimized sequence is being expressed in a BSL-1 host).
- **Reasoning:** The implementation identifies this: "Source-organism inference for synthetic sequences (e.g., codon-optimized constructs) is ambiguous."

## Refined false-positive qualitative

1. **"Other/unknown" heavy users** (Gap 1): the form provides no information advantage; the customer might as well have typed free text. Downstream checks (m15-llm-extraction) cannot cross-reference because the structured fields are empty.
2. **Non-US biosafety frameworks** (Gap 4): IBC vocabulary doesn't map to international frameworks. ~20-30% of global customers affected.
3. **Multi-category projects** (Gap 3): single-select forces a lossy representation. Triggers downstream LLM extraction disagreements.
4. **Codon-optimized sequences** (Gap 5): source-organism ambiguity triggers `bsl_inconsistent` for legitimate orders.
5. **Novel organisms** (Gap 2): `taxid_invalid` fires. Small volume.

## Notes for stage 7 synthesis

- The form is a precondition for the higher-leverage M15 checks (m15-llm-extraction, m15-screening-reconciliation, m15-drift-detector). Its coverage gaps primarily matter insofar as they degrade those downstream checks.
- The "other/unknown" escape-hatch problem (Gap 1) is the single most important coverage gap. If a provider's customer base widely uses the escape hatch, the form's value collapses. Mitigation: progressive disclosure (show the free-text field only after the customer has attempted the structured fields) and field-level "why" tooltips.
- The international biosafety framework problem (Gap 4) is solvable by extending the `ibc_approval_status` enum to include equivalents (e.g., `approved-uk-gmsc`, `approved-eu-directive`, `other-national-framework` with a free-text field for the framework name).
- The single-select constraint (Gap 3) is solvable by allowing multi-select on `intended_use_category`. This requires adjusting downstream comparators but is straightforward.
