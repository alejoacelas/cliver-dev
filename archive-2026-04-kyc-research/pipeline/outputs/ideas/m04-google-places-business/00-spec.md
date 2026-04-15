# m04-google-places-business

- **measure:** M04
- **name:** Google Places business presence
- **modes:** D, A
- **summary:** Query Google Places API at the address coordinates for a registered business. Inspect business category, photos, and reviews. Lack of any Places business at the lat/lng on a claimed institutional address is a soft flag.
- **attacker_stories_addressed:** residential-shipping, address-spoofing, ghost-office
- **external_dependencies:** Google Places API.
- **flags_thrown:** no_places_business_at_address; places_category_mismatch
- **manual_review_handoff:** Reviewer reviews mismatched categories.
- **failure_modes_requiring_review:** New labs may not be on Places.
- **record_left:** Places query response.
