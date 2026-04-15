# m15-drift-detector

- **measure:** M15
- **name:** Cross-order SOC drift detector
- **modes:** A
- **summary:** Detect when a customer's SOC declarations change pattern across orders (escalating concern, switching organisms, narrowing toward a known threat). Statistical drift detector.
- **attacker_stories_addressed:** soc-drift, gradual-escalation
- **external_dependencies:** Internal time-series.
- **flags_thrown:** soc_drift_detected
- **manual_review_handoff:** Reviewer reviews drift episodes.
- **failure_modes_requiring_review:** Legitimate research pivots.
- **record_left:** Drift timeline.
