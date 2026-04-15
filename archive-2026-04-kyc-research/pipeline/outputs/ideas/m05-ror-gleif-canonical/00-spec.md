# m05-ror-gleif-canonical

- **measure:** M05
- **name:** ROR/GLEIF/Companies House canonical address cross-ref
- **modes:** D, A
- **summary:** For a claimed institution, fetch its canonical address(es) from ROR, GLEIF (LEI record), and Companies House. Compare to the customer-provided shipping/billing address with normalized geocoding. Mismatch beyond a tolerance is a flag.
- **attacker_stories_addressed:** ghost-office, address-spoofing, shell-company
- **external_dependencies:** ROR API; GLEIF API; Companies House API.
- **flags_thrown:** canonical_address_mismatch; institution_no_canonical_record
- **manual_review_handoff:** Reviewer evaluates legitimate satellite sites.
- **failure_modes_requiring_review:** Multi-campus institutions; ROR doesn't capture every site.
- **record_left:** Canonical address + match score.
