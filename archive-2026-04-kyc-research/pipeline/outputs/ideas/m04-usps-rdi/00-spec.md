# m04-usps-rdi

- **measure:** M04
- **name:** USPS RDI residential indicator
- **modes:** D
- **summary:** USPS Residential Delivery Indicator distinguishes residential vs business addresses with high US accuracy. Reuses the m03 USPS call.
- **attacker_stories_addressed:** residential-shipping, home-receiver-fronting
- **external_dependencies:** USPS Web Tools.
- **flags_thrown:** address_is_residential
- **manual_review_handoff:** Reviewer adjudicates residential addresses for institutional orders.
- **failure_modes_requiring_review:** US-only.
- **record_left:** RDI flag.
