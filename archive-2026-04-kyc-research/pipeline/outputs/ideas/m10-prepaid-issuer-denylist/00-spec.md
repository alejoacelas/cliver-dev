# m10-prepaid-issuer-denylist

- **measure:** M10
- **name:** Prepaid issuer / virtual single-use BIN denylist
- **modes:** A
- **summary:** Maintain a denylist of prepaid-card issuers (Netspend, Green Dot, Bancorp, Sutton) and virtual single-use BIN providers (Privacy.com, Revolut Disposable). Hard block.
- **attacker_stories_addressed:** prepaid-gift-card, virtual-single-use-bin
- **external_dependencies:** Internal denylist; PSP hard-block rules.
- **flags_thrown:** prepaid_issuer_denylist_hit; virtual_bin_provider_hit
- **manual_review_handoff:** Reviewer adjudicates legitimate corporate prepaid.
- **failure_modes_requiring_review:** List curation lag.
- **record_left:** Issuer name + BIN.
