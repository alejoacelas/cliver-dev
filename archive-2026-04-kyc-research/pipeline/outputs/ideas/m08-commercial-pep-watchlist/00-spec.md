# m08-commercial-pep-watchlist

- **measure:** M08
- **name:** Commercial PEP/entity watchlist
- **modes:** A
- **summary:** Use World-Check / Dow Jones / Sayari / Bridger entity screening to catch entities flagged for adverse media or PEP exposure before government listing.
- **attacker_stories_addressed:** sanctioned-institution, beneficial-owner-laundering
- **external_dependencies:** World-Check; Dow Jones RC; Sayari Graph; Bridger XG.
- **flags_thrown:** commercial_entity_hit
- **manual_review_handoff:** Reviewer reviews adverse-media articles.
- **failure_modes_requiring_review:** License cost.
- **record_left:** Vendor case ID.
