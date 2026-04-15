# m12-billing-shipping-consistency

- **measure:** M12
- **name:** Billing↔shipping↔institution consistency
- **modes:** D
- **summary:** Deterministic rule: billing address, shipping address, and institutional canonical address (m05) must form a consistent set within a tolerance, OR the customer must explain divergence.
- **attacker_stories_addressed:** billing-shipping-mismatch, third-party-billing
- **external_dependencies:** Internal rules engine.
- **flags_thrown:** billing_shipping_inconsistent
- **manual_review_handoff:** Reviewer reviews divergences.
- **failure_modes_requiring_review:** Distributed institutions; legitimate forwarders.
- **record_left:** Triple comparison record.
