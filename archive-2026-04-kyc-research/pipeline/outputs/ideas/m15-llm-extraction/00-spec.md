# m15-llm-extraction

- **measure:** M15
- **name:** LLM extraction + deterministic cross-ref
- **modes:** D, A
- **summary:** Use an LLM to extract structured SOC fields from any free-text the customer provides; deterministically cross-reference against the structured form (m15-structured-form) and the order's sequence content.
- **attacker_stories_addressed:** soc-misdeclaration, soc-omission
- **external_dependencies:** Anthropic Claude / OpenAI; deterministic comparator.
- **flags_thrown:** llm_extraction_disagreement; llm_form_mismatch
- **manual_review_handoff:** Reviewer adjudicates disagreements.
- **failure_modes_requiring_review:** LLM hallucination on edge cases.
- **record_left:** LLM output + diff.
