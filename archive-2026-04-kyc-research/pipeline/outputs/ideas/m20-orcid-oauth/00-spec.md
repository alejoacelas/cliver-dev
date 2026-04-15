# m20-orcid-oauth

- **measure:** M20
- **name:** ORCID OAuth proof-of-control
- **modes:** D
- **summary:** Voucher proves control of an ORCID ID via OAuth. Eliminates self-asserted ORCID claims.
- **attacker_stories_addressed:** fake-voucher, orcid-impersonation
- **external_dependencies:** ORCID OAuth.
- **flags_thrown:** orcid_oauth_failed
- **manual_review_handoff:** Reviewer adjudicates ORCID-less voucher.
- **failure_modes_requiring_review:** Some legitimate vouchers lack ORCID.
- **record_left:** OAuth token.
