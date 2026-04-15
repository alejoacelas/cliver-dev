# m09-registered-agent-denylist

- **measure:** M09
- **name:** Mass-registered-agent / virtual-office denylist
- **modes:** A
- **summary:** Maintain a denylist of mass-formation registered agents (Northwest, Incfile, ZenBusiness) and virtual-office providers (Regus, Davinci, Alliance) at the institution's registered address. Combined with other shell signals.
- **attacker_stories_addressed:** shell-company, virtual-office-fronting
- **external_dependencies:** Internal denylist; OpenCorporates agent counts.
- **flags_thrown:** registered_agent_mass_formation; address_virtual_office
- **manual_review_handoff:** Reviewer combines with other signals.
- **failure_modes_requiring_review:** Mass agents legitimately serve thousands.
- **record_left:** Agent name + count.
