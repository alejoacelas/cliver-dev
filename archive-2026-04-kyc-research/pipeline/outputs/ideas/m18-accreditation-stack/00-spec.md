# m18-accreditation-stack

- **measure:** M18
- **name:** Accreditation registry stack (CAP/CLIA/AAALAC/OLAW/ISO 17025/GLP/Global BioLabs)
- **modes:** D, A
- **summary:** Cross-reference institution against domain-appropriate accreditation registries: CAP, CLIA/CMS QCOR, AAALAC, NIH OLAW, ISO 17025 (A2LA, ANAB, UKAS, DAkkS), GLP (OECD/FDA BIMO/MHRA), Global BioLabs map for high-containment.
- **attacker_stories_addressed:** fake-accreditation, paper-shell-research-org, fake-bsl
- **external_dependencies:** CAP, CLIA, AAALAC, OLAW, A2LA/ANAB/UKAS, OECD GLP, Global BioLabs.
- **flags_thrown:** claimed_accreditation_not_in_registry
- **manual_review_handoff:** Reviewer compares claim to registries.
- **failure_modes_requiring_review:** Some registries gated; classified labs absent.
- **record_left:** Registry snapshot.
