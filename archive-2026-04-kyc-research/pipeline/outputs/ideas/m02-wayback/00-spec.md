# m02-wayback

- **measure:** M02
- **name:** Wayback first-seen + content history
- **modes:** A
- **summary:** Query the Internet Archive Wayback CDX API for the customer's email domain. Capture first-seen snapshot date and most-recent snapshot's content. Flag domains with no Wayback history, or whose Wayback history shows a content category change (parking page → research lab) within the past 12 months.
- **attacker_stories_addressed:** dormant-domain, drop-catch, lookalike-domain
- **external_dependencies:** Wayback CDX API.
- **flags_thrown:** no_wayback_history; recent_content_pivot
- **manual_review_handoff:** Reviewer compares snapshots.
- **failure_modes_requiring_review:** Small legitimate sites lack history.
- **record_left:** First-seen date + sampled snapshot URLs.
