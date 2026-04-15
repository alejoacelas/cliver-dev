# m02-dangling-dns

- **measure:** M02
- **name:** Dangling-DNS / drop-catch detector
- **modes:** A
- **summary:** Detect domains whose DNS points to abandoned cloud resources (S3, Heroku) or that were recently drop-caught. Cross-reference Tranco rank delta and CT first-seen to spot domains repurposed from prior owners.
- **attacker_stories_addressed:** drop-catch, dormant-domain, dangling-dns
- **external_dependencies:** Tranco list; crt.sh; cloud-takeover oss tooling.
- **flags_thrown:** dangling_dns_target; drop_catch_recent
- **manual_review_handoff:** Reviewer correlates with WHOIS history.
- **failure_modes_requiring_review:** False positives on legitimate cloud migrations.
- **record_left:** DNS + CT snapshots.
