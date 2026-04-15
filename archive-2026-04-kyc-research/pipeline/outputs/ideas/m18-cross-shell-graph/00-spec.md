# m18-cross-shell-graph

- **measure:** M18
- **name:** Cross-shell rotation graph
- **modes:** A
- **summary:** Maintain a graph of every prior screened institution's registered agent, officer/director, WHOIS registrant, CT cert issuer/serial, NIH PI, and hosting fingerprint. Flag new customers sharing ≥2 fingerprints with prior entities.
- **attacker_stories_addressed:** cro-identity-rotation, shell-company, cro-framing
- **external_dependencies:** Internal Neo4j/Postgres graph; Companies House officers; GLEIF L2; Censys/Shodan; crt.sh.
- **flags_thrown:** cross_shell_shared_agent; cross_shell_shared_officer; cross_shell_shared_hosting; cross_shell_shared_pi
- **manual_review_handoff:** Reviewer reviews linked-entity panel.
- **failure_modes_requiring_review:** Mass-formation agents; shared-PI false positives.
- **record_left:** Graph query result.
