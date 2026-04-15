# m13-telesign-phoneid

- **measure:** M13
- **name:** Telesign PhoneID + risk score
- **modes:** D, A
- **summary:** Telesign PhoneID returns line type, carrier, risk score, and recent SIM-swap activity. Used as a second source.
- **attacker_stories_addressed:** voip-disposable-phone, sim-swap, burner-phone
- **external_dependencies:** Telesign PhoneID API.
- **flags_thrown:** telesign_high_risk; telesign_recent_sim_swap
- **manual_review_handoff:** Reviewer adjudicates risk score.
- **failure_modes_requiring_review:** Score opacity.
- **record_left:** Telesign response.
