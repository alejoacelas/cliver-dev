# m06-iso-country-normalize

- **measure:** M06
- **name:** ISO 3166 normalization + sanctioned-territory geofence
- **modes:** D
- **summary:** Normalize country names / ISO codes (handle Crimea, Donetsk, Luhansk, North Korea variants). Geofence sanctioned sub-regions inside otherwise allowed countries.
- **attacker_stories_addressed:** sanctioned-jurisdiction-routing, transshipment
- **external_dependencies:** ISO 3166-2; OFAC sectoral sanctions territory list.
- **flags_thrown:** sanctioned_subregion
- **manual_review_handoff:** Reviewer reviews subregion hits.
- **failure_modes_requiring_review:** Region naming variants.
- **record_left:** Normalized country/region.
