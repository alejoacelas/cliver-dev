# m02-mx-tenant

- **measure:** M02
- **name:** MX / M365 / Workspace tenant + SPF/DMARC
- **modes:** D, A
- **summary:** Resolve MX records for the email domain; identify hosting (Google Workspace, M365, self-hosted, generic provider). Fetch SPF and DMARC records. Flag self-hosted or generic providers on claimed institutional domains; flag missing DMARC.
- **attacker_stories_addressed:** lookalike-domain, inbox-compromise, shell-company
- **external_dependencies:** DNS resolver; M365 tenant lookup endpoint; Workspace MX patterns.
- **flags_thrown:** mx_generic_provider; spf_missing; dmarc_missing; tenant_mismatch
- **manual_review_handoff:** Reviewer correlates with claim.
- **failure_modes_requiring_review:** Some legitimate institutions self-host.
- **record_left:** MX/SPF/DMARC records.
