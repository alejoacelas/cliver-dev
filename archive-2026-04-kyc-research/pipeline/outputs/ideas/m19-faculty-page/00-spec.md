# m19-faculty-page

- **measure:** M19
- **name:** Faculty / lab page + institutional directory
- **modes:** A
- **summary:** Fetch the researcher's faculty or lab page from the institution's website. Cross-check with the institutional directory (m07-directory-scrape).
- **attacker_stories_addressed:** it-persona-manufacturing, ghost-author
- **external_dependencies:** Manual scrape; m07 directory.
- **flags_thrown:** no_faculty_page; faculty_page_role_mismatch
- **manual_review_handoff:** Reviewer reviews edge cases.
- **failure_modes_requiring_review:** Some institutions don't publish lab pages.
- **record_left:** Page snapshot.
