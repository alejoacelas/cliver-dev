# m01-global-sanctions-union

- **measure:** M01
- **name:** UN/EU/UK/CA/AU sanctions union
- **modes:** D
- **summary:** Union of UN Security Council Consolidated List, EU Financial Sanctions File (FSF), UK OFSI Consolidated List, Canada SEMA, Australia DFAT — sourced via OpenSanctions or direct feeds. Single screening pipeline mirroring the OFAC pipeline. Required for non-US shipments.
- **attacker_stories_addressed:** denied-individual, sanctioned-jurisdiction-routing, foreign-buyer-shell
- **external_dependencies:** OpenSanctions API; UN, EU, OFSI, DFAT, SEMA primary feeds.
- **flags_thrown:** un_hit; eu_fsf_hit; uk_ofsi_hit; ca_sema_hit; au_dfat_hit
- **manual_review_handoff:** Reviewer disposition on every hit.
- **failure_modes_requiring_review:** List freshness lag; transliteration variants.
- **record_left:** Match record + list snapshot.
