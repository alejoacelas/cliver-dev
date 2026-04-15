# m09-irs-990

- **measure:** M09
- **name:** IRS Form 990 + Candid nonprofit financials
- **modes:** A
- **summary:** For US 501(c)(3) institutions, fetch the most recent Form 990 from IRS or Candid (formerly GuideStar). Inspect revenue, program expenses, board, and program description for life-sciences alignment.
- **attacker_stories_addressed:** shell-nonprofit
- **external_dependencies:** IRS 990 dataset; Candid API; ProPublica Nonprofit Explorer.
- **flags_thrown:** no_990; 990_revenue_implausible; 990_program_not_life_sciences
- **manual_review_handoff:** Reviewer reads program description.
- **failure_modes_requiring_review:** Smallest nonprofits file 990-N postcards.
- **record_left:** 990 record.
