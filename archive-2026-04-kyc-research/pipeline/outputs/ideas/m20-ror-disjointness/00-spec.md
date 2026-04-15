# m20-ror-disjointness

- **measure:** M20
- **name:** Voucher ↔ customer ROR disjointness
- **modes:** A
- **summary:** Rule: voucher's ROR institution must be disjoint from the customer's ROR institution (or have a documented affiliation). Stops same-shell vouching.
- **attacker_stories_addressed:** shell-vouching, internal-vouching
- **external_dependencies:** ROR; m18-ror.
- **flags_thrown:** voucher_customer_same_ror
- **manual_review_handoff:** Reviewer adjudicates legitimate same-institution cross-department vouching.
- **failure_modes_requiring_review:** Same-institution legitimate cases.
- **record_left:** ROR comparison.
