# m18-lookalike-domain

- **measure:** M18
- **name:** Lookalike / homoglyph institutional-domain detector
- **modes:** A
- **summary:** Detect homoglyph and typosquat variations of legitimate institutional domains via Punycode/UTS-39 confusables, Levenshtein ≤2 against ROR domains, dnstwist permutations, and CT first-seen age.
- **attacker_stories_addressed:** lookalike-domain, inbox-compromise, it-persona-manufacturing
- **external_dependencies:** UTS #39; dnstwist; ROR domain corpus; crt.sh.
- **flags_thrown:** domain_homoglyph_match; domain_levenshtein_le_2; domain_dnstwist_match
- **manual_review_handoff:** Reviewer contacts real institution.
- **failure_modes_requiring_review:** Legitimate spinout domains adjacent to parent.
- **record_left:** Permutation report.
