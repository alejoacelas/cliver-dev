# m07-google-site-search

- **measure:** M07
- **name:** site:domain name search
- **modes:** A
- **summary:** Query Google CSE / Bing for `site:<institution-domain> "<customer name>"`. Hits on faculty pages, lab pages, publications, news constitute corroboration.
- **attacker_stories_addressed:** it-persona-manufacturing, visiting-researcher
- **external_dependencies:** Google CSE; Bing Web Search API.
- **flags_thrown:** no_site_search_hits
- **manual_review_handoff:** Reviewer evaluates hit quality.
- **failure_modes_requiring_review:** False negatives for new researchers.
- **record_left:** Search query + result URLs.
