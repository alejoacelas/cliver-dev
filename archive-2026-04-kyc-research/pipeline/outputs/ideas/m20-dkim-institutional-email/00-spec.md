# m20-dkim-institutional-email

- **measure:** M20
- **name:** DKIM-verified institutional email from voucher
- **modes:** D, A
- **summary:** Voucher must send their attestation from an institutional email; verify DKIM signature aligns with the institution's domain. Stops free-mail vouching.
- **attacker_stories_addressed:** fake-voucher, free-mail-voucher, lookalike-voucher-domain
- **external_dependencies:** DKIM verifier; m02 ROR domain match.
- **flags_thrown:** dkim_invalid; voucher_domain_not_institutional
- **manual_review_handoff:** Reviewer adjudicates non-DKIM mail systems.
- **failure_modes_requiring_review:** Some institutions misconfigure DKIM.
- **record_left:** DKIM record.
