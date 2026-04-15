# m05-google-places-campus

- **measure:** M05
- **name:** Google Places + OSM campus polygon
- **modes:** D
- **summary:** Resolve the institution's name to a Google Places entry and OSM relation; verify the customer address falls within the campus polygon (or known affiliate building). Strong positive signal.
- **attacker_stories_addressed:** ghost-office, address-spoofing
- **external_dependencies:** Google Places API; OpenStreetMap Nominatim + Overpass.
- **flags_thrown:** address_inside_campus_polygon; address_outside_campus_polygon
- **manual_review_handoff:** Reviewer adjudicates affiliate buildings.
- **failure_modes_requiring_review:** Polygons missing for many institutions.
- **record_left:** Polygon ID + containment result.
