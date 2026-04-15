# m01-delta-rescreen — implementation v1

- **measure:** M01
- **name:** Daily delta re-screening
- **modes:** D
- **summary:** Re-screen every prior customer against newly added sanctions list entries each day (or each delta cycle); alert when an existing customer becomes a hit. Closes the gap when a customer is sanctioned after onboarding.

- **external_dependencies:**
  - OpenSanctions delta files (FollowTheMoney format) — incremental adds/modifies/deletes per dataset version [source](https://www.opensanctions.org/docs/bulk/delta/).
  - OR Treasury OFAC SLS file diffs (manual diff between today's and yesterday's SDN.xml) [source](https://ofac.treasury.gov/sanctions-list-service).
  - Internal customer DB (indexed by name + identifiers).
  - Reviewer queue + account-freeze tooling.

- **endpoint_details:**
  - **OpenSanctions delta:** Each dataset metadata index exposes a `delta_url` pointing to an index of the last 100 versions, each version having a delta data file URL. Delta updates are in FollowTheMoney entity format only [source](https://www.opensanctions.org/docs/bulk/delta/). No auth for bulk download under non-commercial terms; commercial use requires data license [source](https://www.opensanctions.org/licensing/).
  - Update cadence: aggregated collections refresh roughly every 6 hours; individual sanctions lists every 4–12 hours; recommended polling interval ~30 minutes [source](https://www.opensanctions.org/faq/4/update-frequency/).
  - Pricing: free for non-commercial; commercial bulk-data license [vendor-gated — pricing requires sales contact].
  - **OFAC SLS diff (free fallback):** Pull SDN.xml + cons.xml on a schedule; compute set-difference of UIDs since last snapshot; no rate limit; no auth.

- **fields_returned:** Per delta entity (FtM format): entity ID, schema (Person/Organization), properties (name, alias, birthDate, nationality, address, idNumber, etc.), datasets, first_seen, last_seen, change op (added / modified / deleted) [source](https://www.opensanctions.org/docs/bulk/delta/).

- **marginal_cost_per_check:**
  - Free if using OpenSanctions non-commercial license or OFAC SLS files directly. Commercial OpenSanctions bulk license [vendor-gated].
  - Compute cost: re-matching N customers against M new entries is O(N * M) but M per delta is typically <100 entries [best guess: based on OFAC update bulletins listing 5–50 changes per action day]; trivially cheap.
  - setup_cost: build the diff/match cron + reviewer surfacing UI [best guess: 1–2 engineer-weeks].

- **manual_review_handoff:**
  1. Cron job pulls latest delta, compares each new/modified entry against indexed customer DB using same fuzzy matcher as onboarding screen.
  2. Hits enter "delta-rescreen" reviewer queue with: customer record, matched delta entry, score, what changed since last check.
  3. Reviewer freezes account immediately on plausible match (per OFAC blocking obligation, 31 CFR 501) pending disposition.
  4. Reviewer disambiguates with secondary identifiers exactly as in onboarding screen.
  5. If confirmed hit: file blocked-property report; cancel any open orders; preserve account history.
  6. If false positive: release freeze, log rationale, mark customer as "delta-cleared at version X".

- **flags_thrown:**
  - `delta_new_hit` — a customer who previously cleared screening now matches a newly added or modified list entry.
  - `delta_addr_change_hit` — listed entity's address/alias changed and now matches a known customer.
  - `delta_dataset_added` — customer matches an entity now appearing in a dataset they didn't appear in before (e.g., promoted from regional list to OFAC SDN).

- **failure_modes_requiring_review:**
  - Identifier drift across re-screens: customer record changed (married name, new address) so previously-matched-row no longer matches → keep historical fingerprints to detect.
  - Delta feed missed (cron failure, vendor outage) → track last successful version cursor and re-run from gap.
  - List entry deletion: handled separately (does not generate hit; logged for audit).
  - FtM entity ID changes between dataset versions can cause spurious "added" then "deleted" pairs.
  - High-volume action days (e.g., new EO published) generate large queues; need surge handling.

- **false_positive_qualitative:**
  - Same as onboarding screen (common-name collisions on Han Chinese, Arabic, Hispanic surnames).
  - Plus customers whose own data has drifted in ways that produce spurious new matches.
  - Customers added to a regional sanctions list for unrelated reasons (e.g., a name that collides with a sanctioned individual added in a new EO).

- **record_left:**
  - Per delta cycle: dataset version cursor, count of new/modified/deleted entries processed.
  - Per hit: delta diff, customer ID, matched entity, score, reviewer disposition, freeze/unfreeze timestamps.
  - Audit trail of which version of which list each customer was last cleared against.

## For 4C to verify
- OpenSanctions delta_url + FtM-only format claim.
- Update cadence numbers (every 6 hours aggregated; sanctions every 4–12 hours; 30-min polling recommendation).
