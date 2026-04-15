# m06-freight-forwarder-denylist

- **measure:** M06
- **name:** Freight forwarder / customs broker denylist
- **modes:** A
- **summary:** Maintain an internal denylist of freight forwarders and customs brokers known for transshipment to embargoed destinations. Cross-reference the shipping address and end-recipient.
- **attacker_stories_addressed:** transshipment, freight-forwarder-laundering
- **external_dependencies:** Industry advisories; OFAC enforcement actions; internal history.
- **flags_thrown:** freight_forwarder_denylist_hit
- **manual_review_handoff:** Reviewer escalates to export compliance.
- **failure_modes_requiring_review:** List curation lag.
- **record_left:** Denylist version + match.
