# m13-twilio-lookup

- **measure:** M13
- **name:** Twilio Lookup line-type intelligence
- **modes:** D
- **summary:** Twilio Lookup v2 returns line type (`mobile`, `landline`, `voip`, `tollFree`, `nonFixedVoip`), carrier, and country. `voip` and `nonFixedVoip` on a claimed institutional contact = soft flag.
- **attacker_stories_addressed:** voip-disposable-phone, burner-phone
- **external_dependencies:** Twilio Lookup v2 API.
- **flags_thrown:** phone_voip; phone_nonfixed_voip
- **manual_review_handoff:** Reviewer adjudicates with secondary contact.
- **failure_modes_requiring_review:** Some legitimate institutions use VoIP PBX.
- **record_left:** Lookup response.
