# Coverage research: LLM extraction + deterministic cross-reference

## Coverage gaps

### Gap 1: Non-English-language customer submissions
- **Category:** Customers who submit free-text project descriptions, end-use notes, or biosafety summaries in languages other than English. Particularly customers writing in low-resource languages (e.g., Thai, Vietnamese, Farsi) where LLM biomedical extraction quality degrades significantly.
- **Estimated size:** Non-North-America regions account for ~45% of gene synthesis market revenue ([GM Insights](https://www.gminsights.com/industry-analysis/gene-synthesis-market)). Not all non-US customers write in non-English, but a substantial fraction do. Asia-Pacific alone is ~17% of the market. [best guess: 10-20% of orders globally may include non-English free text, based on the assumption that many non-US customers at major international providers submit in English, but a meaningful minority -- especially in China, Japan, Korea, and parts of Europe -- submit in their native language.]
- **Behavior of the check on this category:** weak-signal (LLM extraction runs but with degraded accuracy). A multilingual NER study found strong performance in well-resourced European languages (F1 ~0.98) but significantly lower performance for low-resource languages ([medrxiv 2026](https://www.medrxiv.org/content/10.64898/2026.01.22.26344605v1.full.pdf)). Dutch biomedical NER was "consistently low across all models" in one evaluation ([ACL BioNLP 2023](https://aclanthology.org/2023.bionlp-1.15.pdf)).
- **Reasoning:** The implementation notes "English performance is best, other major languages are usable, low-resource languages should fall back to manual." The coverage gap is that "fall back to manual" means the LLM cross-check provides no automated signal for these orders -- they bypass the check entirely and rely on human review only.

### Gap 2: Extremely terse or formulaic submissions
- **Category:** Customers who provide minimal free text -- e.g., "protein expression" or "research use only" -- where there is insufficient content for the LLM to extract meaningful structured fields.
- **Estimated size:** [best guess: 15-30% of orders. Many institutional customers use boilerplate text in the free-text field, especially repeat customers ordering routine constructs. No published data on the distribution of free-text length in synthesis orders. Searched for: "DNA synthesis order free text field length distribution", "gene synthesis intended use field typical content" -- no results.]
- **Behavior of the check on this category:** weak-signal / no-signal (the LLM returns `llm_low_confidence` and the order routes to manual review, meaning the automated cross-check provides no leverage).
- **Reasoning:** The implementation correctly flags this via `llm_low_confidence`. But if a large fraction of orders are terse, the check degrades to a manual review funnel rather than an automated cross-reference. The value proposition of the idea -- automated disagreement detection -- is lost for these orders.

### Gap 3: Customers whose work genuinely spans multiple use categories
- **Category:** Researchers working on projects that legitimately span multiple categories (e.g., a vaccine development project that also involves diagnostic assay development and basic research). The single-category extraction by the LLM triggers false disagreements with the structured form.
- **Estimated size:** [best guess: 10-20% of orders from academic and biopharma R&D customers, which are inherently multi-faceted. No published data. Searched for: "gene synthesis order intended use multiple categories frequency" -- no results.]
- **Behavior of the check on this category:** false-positive (`llm_form_mismatch` fires because the LLM picks one category while the customer picked a different one on the form, and both are correct).
- **Reasoning:** The implementation acknowledges this in false_positive_qualitative. The gap is structural: single-select extraction vs. multi-faceted reality.

### Gap 4: Customers using informal or non-standard organism nomenclature
- **Category:** Researchers using lab shorthand, strain nicknames, or non-standard gene names (e.g., "DH5alpha" instead of *E. coli* K-12 DH5-alpha, or "spike" without specifying SARS-CoV-2) in free text that the LLM normalizes incorrectly.
- **Estimated size:** [best guess: 5-10% of orders. Common in academic settings where informal names are standard in intra-lab communication. The NCBI Taxonomy contains ~460,000 formal species names ([NCBI Taxonomy database 2020](https://academic.oup.com/database/article/doi/10.1093/database/baaa062/5881509)), but lab shorthand frequently diverges from formal nomenclature.]
- **Behavior of the check on this category:** false-positive (the LLM normalizes "DH5alpha" to a different taxon than the form's NCBI Taxonomy ID, triggering `llm_extraction_disagreement`).
- **Reasoning:** This is a normalization problem. The LLM's organism-name mapping may not match the controlled vocabulary used by m15-structured-form. Mitigation requires a synonym table or fuzzy matching -- not part of the current implementation.

### Gap 5: Orders where the free text is copy-pasted from a grant abstract or publication
- **Category:** Customers who paste dense academic prose with hedging, conditionals, and multiple organisms/genes mentioned -- the LLM extracts a specific claim where the text was deliberately noncommittal.
- **Estimated size:** [best guess: 5-15% of academic orders. Researchers commonly reuse grant language for compliance forms. No published data.]
- **Behavior of the check on this category:** false-positive (the LLM over-extracts, picking up mentioned-but-not-ordered organisms or select agents that appear in the scientific context but not in the actual order).
- **Reasoning:** The implementation acknowledges "dense academic prose with hedging." The `extracted_quotes` field helps reviewers identify hallucination vs. over-extraction, but the flag still fires, adding to the review queue.

## Refined false-positive qualitative

1. **Multi-category projects** (Gap 3): highest-volume false-positive source among academic customers. The LLM picks one category; the form picks another; both are correct.
2. **Non-standard nomenclature** (Gap 4): organism-name normalization mismatches between LLM extraction and NCBI Taxonomy-based form fields.
3. **Grant-abstract prose** (Gap 5): LLM over-extracts from hedged scientific text, flagging mentioned-but-not-ordered organisms.
4. **Non-English submissions** (Gap 1): degraded extraction generates unreliable cross-references. Not a false-positive per se (falls back to manual) but reduces check coverage.
5. **Terse submissions** (Gap 2): no meaningful extraction possible; check provides no leverage.

## Notes for stage 7 synthesis

- This check's value is proportional to the quality and length of customer-provided free text. If the provider's customer base predominantly uses terse boilerplate (Gap 2), the check's automated coverage is low.
- The non-English gap (Gap 1) is partially mitigable by requiring English-language submissions for SOC orders, but this adds customer friction and may not be feasible for providers with large non-English-speaking customer bases.
- The multi-category false-positive problem (Gap 3) could be mitigated by allowing multi-label extraction (return a ranked list of categories rather than a single one) and adjusting the comparator to flag only when the form's category is not in the LLM's top-N.
- This idea is explicitly designed as a cross-reference, not a standalone check. Its coverage gaps are therefore less critical when paired with m15-screening-reconciliation (which has an independent signal from sequence content).
