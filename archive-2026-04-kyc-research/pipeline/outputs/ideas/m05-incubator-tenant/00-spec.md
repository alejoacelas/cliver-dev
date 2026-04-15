# m05-incubator-tenant

- **measure:** M05
- **name:** Incubator / coworking tenant directory
- **modes:** A
- **summary:** If the address resolves to a known biotech incubator (LabCentral, JLABS, BioLabs, IndieBio, etc.), require that the customer's organization appear in the incubator's public tenant directory.
- **attacker_stories_addressed:** incubator-fronting, ghost-office
- **external_dependencies:** Incubator tenant pages (LabCentral, JLABS, etc.).
- **flags_thrown:** incubator_address_no_tenant_listing
- **manual_review_handoff:** Reviewer contacts incubator manager.
- **failure_modes_requiring_review:** Tenant lists lag move-ins.
- **record_left:** Tenant page snapshot.
