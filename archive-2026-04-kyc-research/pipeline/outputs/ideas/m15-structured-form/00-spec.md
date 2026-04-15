# m15-structured-form

- **measure:** M15
- **name:** Structured SOC declaration form
- **modes:** D
- **summary:** Replace free-text SOC fields with a structured form (intended use category, host organism, target gene, BSL level, IBC approval status). Each field has a controlled vocabulary.
- **attacker_stories_addressed:** soc-misdeclaration, soc-omission
- **external_dependencies:** Internal form.
- **flags_thrown:** field_missing; field_unsupported_value
- **manual_review_handoff:** Reviewer reviews submissions.
- **failure_modes_requiring_review:** Vocabulary completeness.
- **record_left:** Form submission record.
