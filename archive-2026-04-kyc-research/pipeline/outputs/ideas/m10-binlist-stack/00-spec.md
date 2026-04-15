# m10-binlist-stack

- **measure:** M10
- **name:** BIN classification stack (binlist + BinDB + Neutrino)
- **modes:** D
- **summary:** Classify the BIN of the customer's payment card via binlist.net, BinDB, and NeutrinoAPI. Identify card brand, issuer, country, and `prepaid` / `gift` flag.
- **attacker_stories_addressed:** prepaid-gift-card, anonymous-funding
- **external_dependencies:** binlist.net; BinDB; NeutrinoAPI BIN Lookup.
- **flags_thrown:** bin_prepaid; bin_gift; bin_unknown
- **manual_review_handoff:** Reviewer adjudicates unknown BINs.
- **failure_modes_requiring_review:** BIN tables lag new issuances.
- **record_left:** BIN lookup record.
