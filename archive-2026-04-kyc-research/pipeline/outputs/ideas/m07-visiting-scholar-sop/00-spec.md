# m07-visiting-scholar-sop

- **measure:** M07
- **name:** Visiting-scholar new-hire corroboration SOP
- **modes:** A
- **summary:** When the customer claims visiting-scholar / postdoc / new-hire status, require at least one positive corroborator from institution news, dept events, or sponsoring-PI confirmation email.
- **attacker_stories_addressed:** visiting-researcher, it-persona-manufacturing
- **external_dependencies:** Bing News API; manual sponsor email.
- **flags_thrown:** new_hire_zero_corroborators
- **manual_review_handoff:** Reviewer requests sponsoring PI confirmation.
- **failure_modes_requiring_review:** Most legit new-hires get no press.
- **record_left:** Corroborator URLs / email log.
