# m01-ofac-sdn

- **measure:** M01
- **name:** OFAC SDN + Consolidated screen
- **modes:** D
- **summary:** Screen the customer's legal name, DOB, and address against OFAC's Specially Designated Nationals list and the US Consolidated Sanctions list (which unions SDN with FSE, NS-PLC, SSI, etc.). Use the Treasury OFAC search API or a vendor wrapper. Fuzzy-match on name with score threshold; require human disposition on hits.
- **attacker_stories_addressed:** denied-individual, sanctioned-jurisdiction-routing
- **external_dependencies:** OFAC sanctions list API; OpenSanctions; Treasury Consolidated Sanctions XML feed.
- **flags_thrown:** ofac_sdn_hit; ofac_consolidated_hit
- **manual_review_handoff:** Reviewer adjudicates fuzzy hits with secondary identifiers.
- **failure_modes_requiring_review:** Common name false positives.
- **record_left:** Match score + list snapshot date.
