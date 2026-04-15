# m07-incommon-edugain

- **measure:** M07
- **name:** InCommon + eduGAIN federation IdP enumeration
- **modes:** D, A
- **summary:** Verify the customer's email domain corresponds to a federation-registered IdP in InCommon (US) or eduGAIN (international). IdP membership is strong evidence of an academic-grade affiliation.
- **attacker_stories_addressed:** free-mail-affiliation, shell-company, lookalike-domain
- **external_dependencies:** InCommon metadata; eduGAIN federation metadata.
- **flags_thrown:** domain_in_incommon; domain_in_edugain; domain_no_federation
- **manual_review_handoff:** Reviewer adjudicates non-federation institutions.
- **failure_modes_requiring_review:** Many small / corporate research orgs not in federations.
- **record_left:** Federation entry.
