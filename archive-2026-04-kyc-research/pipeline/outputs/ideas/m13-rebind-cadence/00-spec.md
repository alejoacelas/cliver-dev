# m13-rebind-cadence

- **measure:** M13
- **name:** Phone re-verification cadence + SIM-swap
- **modes:** D
- **summary:** Re-verify the customer's phone every N months and on every high-risk event; couple with SIM-swap lookup (Telesign / Prove) to detect account takeover via phone.
- **attacker_stories_addressed:** sim-swap, account-takeover
- **external_dependencies:** Telesign; Prove.
- **flags_thrown:** rebind_failed; sim_swap_recent
- **manual_review_handoff:** Reviewer freezes account on swap.
- **failure_modes_requiring_review:** Cadence tuning.
- **record_left:** Re-verification log.
