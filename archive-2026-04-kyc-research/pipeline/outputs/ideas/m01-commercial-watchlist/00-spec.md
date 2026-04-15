# m01-commercial-watchlist

- **measure:** M01
- **name:** Commercial watchlist (World-Check / Dow Jones / Bridger)
- **modes:** D
- **summary:** Use a commercial PEP+sanctions+adverse-media aggregator (Refinitiv World-Check, Dow Jones Risk & Compliance, or LexisNexis Bridger) to catch entries before they appear on government lists and to surface adverse media.
- **attacker_stories_addressed:** denied-individual, gradual-legitimacy-accumulation
- **external_dependencies:** World-Check API; Dow Jones Risk Center; Bridger Insight XG.
- **flags_thrown:** watchlist_hit; pep_hit; adverse_media_hit
- **manual_review_handoff:** Reviewer reviews adverse-media articles.
- **failure_modes_requiring_review:** License cost; false positives on PEP class.
- **record_left:** Vendor case ID + match record.
