# m01-delta-rescreen

- **measure:** M01
- **name:** Daily delta re-screening
- **modes:** D
- **summary:** Re-screen every prior customer against newly added sanctions list entries each day; alert when an existing customer becomes a hit. Closes the gap when a customer is sanctioned after onboarding.
- **attacker_stories_addressed:** post-onboarding-sanction, gradual-legitimacy-accumulation
- **external_dependencies:** OpenSanctions delta feed; internal customer DB.
- **flags_thrown:** delta_new_hit
- **manual_review_handoff:** Reviewer freezes account pending disposition.
- **failure_modes_requiring_review:** Identifier drift across re-screens.
- **record_left:** Delta diff + customer ID.
