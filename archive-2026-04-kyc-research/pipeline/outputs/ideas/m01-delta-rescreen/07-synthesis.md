# m01-delta-rescreen — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Daily delta re-screening |
| **measure** | M01 — Sanctions name screen |
| **attacker_stories_addressed** | post-onboarding-sanction, gradual-legitimacy-accumulation (from spec); however, stage 5 found zero attacker stories in the by-measure mapping engage this measure — all 19 wg branches model attackers whose names trivially clear sanctions screening by construction. Delta re-screening addresses the post-onboarding designation scenario, which no current branch models. |
| **summary** | Re-screen every prior customer against newly added sanctions list entries each day (or each delta cycle); alert when an existing customer becomes a hit. Uses OpenSanctions delta files (FollowTheMoney format) or OFAC SLS XML diffs as free data sources. Closes the gap when a customer is sanctioned after onboarding. |
| **external_dependencies** | OpenSanctions delta files (FtM format, incremental adds/modifies/deletes per dataset version); OR Treasury OFAC SLS file diffs (SDN.xml daily snapshots); internal customer DB indexed by name + identifiers; reviewer queue + account-freeze tooling. |
| **endpoint_details** | **OpenSanctions delta:** dataset metadata index exposes `delta_url` pointing to index of last 100 versions, each with a delta data file URL. FtM entity format only. No auth for non-commercial bulk download; commercial use requires data license [vendor-gated]. Update cadence: aggregated collections ~every 6 hours; individual sanctions lists every 4-12 hours; recommended polling ~30 minutes. **OFAC SLS diff (free fallback):** pull SDN.xml + cons.xml on schedule; compute set-difference of UIDs since last snapshot; no rate limit; no auth. |
| **fields_returned** | Per delta entity (FtM format): entity ID, schema (Person/Organization), properties (name, alias, birthDate, nationality, address, idNumber, etc.), datasets, first_seen, last_seen, change op (added / modified / deleted). |
| **marginal_cost_per_check** | Free if using OpenSanctions non-commercial license or OFAC SLS files directly. Commercial OpenSanctions bulk license [vendor-gated]. Compute cost: O(N customers * M new entries) but M per delta is typically <100 entries; trivially cheap. **setup_cost:** build diff/match cron + reviewer surfacing UI [best guess: 1-2 engineer-weeks]. |
| **manual_review_handoff** | Cron job pulls latest delta, compares each new/modified entry against indexed customer DB using same fuzzy matcher as onboarding screen. Hits enter "delta-rescreen" reviewer queue with: customer record, matched delta entry, score, what changed. Reviewer freezes account immediately on plausible match (per OFAC blocking obligation, 31 CFR 501) pending disposition. Reviewer disambiguates with secondary identifiers. Confirmed hit: file blocked-property report, cancel open orders, preserve account history. False positive: release freeze, log rationale, mark customer as "delta-cleared at version X". |
| **flags_thrown** | `delta_new_hit` (customer now matches newly added/modified list entry); `delta_addr_change_hit` (listed entity's address/alias changed and now matches known customer); `delta_dataset_added` (customer matches entity now appearing in a new dataset). |
| **failure_modes_requiring_review** | Identifier drift across re-screens (customer data changed since onboarding); delta feed missed (cron failure/vendor outage — track last successful version cursor); list entry deletion handling; FtM entity ID changes between dataset versions causing spurious added/deleted pairs; high-volume action days generating large queues requiring surge handling. |
| **false_positive_qualitative** | (1) Common-name collisions on delta entries — same as onboarding but bursty rather than steady-state. (2) Identifier drift producing spurious new matches — customer data drifted, now coincidentally matches new entry. (3) Surge-day false positives — bulk designation days (e.g., 500+ entries) create reviewer overload, potentially freezing legitimate accounts for days. (4) FtM entity ID instability creating phantom alerts. Overall burden moderate on normal days but spiky on bulk-designation days. |
| **coverage_gaps** | (1) Customers never on any sanctions list who become threats without being designated — zero signal (fundamental limitation). (2) Customers whose identifying information has drifted since onboarding — weak signal (historical fingerprinting mitigates but does not eliminate). (3) Entities on non-aggregated lists or lists with slow feed integration — weak signal (delayed detection). (4) False-positive surges on high-volume designation days — operational degradation risk. |
| **record_left** | Per delta cycle: dataset version cursor, count of new/modified/deleted entries processed. Per hit: delta diff, customer ID, matched entity, score, reviewer disposition, freeze/unfreeze timestamps. Audit trail of which version of which list each customer was last cleared against. |
| **bypass_methods_known** | None — no attacker stories in the by-measure mapping engage this measure. |
| **bypass_methods_uncovered** | None — no attacker stories engage this measure (all 19 wg branches model attackers whose names trivially clear sanctions screening by construction). |

## Section 2: Narrative

### What this check is and how it works

Daily delta re-screening monitors sanctions list updates and compares each newly added or modified entry against the provider's existing customer database. It uses either OpenSanctions delta files (published in FollowTheMoney entity format, refreshed roughly every 6 hours for aggregated collections) or direct diffs of OFAC's SDN.xml files. A cron job pulls the latest delta, runs fuzzy name matching against the indexed customer database, and routes any hits to a reviewer queue. This is a complement to onboarding screening — it catches the scenario where a customer was clean at signup but is later designated on a sanctions list.

### What it catches

The check addresses the "designated after onboarding" scenario: a customer who was not on any list when they first ordered synthesis but has since been sanctioned. This is operationally important for OFAC compliance (the blocking obligation under 31 CFR 501 applies regardless of when the customer relationship began). However, as with the other M01 checks, stage 5 found that none of the 19 modeled attacker stories engage sanctions screening — every modeled attacker trivially clears name-based checks. The check's value is regulatory compliance and catching the rare case where a known customer is later designated, not adversarial detection.

### What it misses

The check shares the fundamental limitation of all list-based approaches: zero signal on unknown threats. A customer who decides to pursue malicious synthesis but is never designated by any government will never trigger a delta re-screen. Coverage also degrades with identifier drift — customers who change names, addresses, or affiliations after onboarding may not match against new list entries unless the provider maintains historical fingerprints. OpenSanctions aggregates 328 sources, which is broad but not exhaustive; some national police watchlists and non-US/EU export-control denial lists may lag by days to weeks.

### What it costs

Marginal cost is near-zero: the data is free (OpenSanctions non-commercial license or OFAC SLS files), and compute cost is trivial (matching N customers against typically <100 new entries per delta cycle). Setup requires an estimated 1-2 engineer-weeks to build the diff/match cron and reviewer surfacing UI. The real cost is reviewer time during surge events: in 2024, there were 8 separate bulk designations of 100+ SDN additions each, with 1,706 Russia-related designations alone. Each bulk day could generate 5-20 false-positive alerts requiring triage for a provider with ~1,000 active customers. A commercial OpenSanctions license is required for commercial use and is vendor-gated.

### Operational realism

The reviewer workflow mirrors onboarding screening but with higher urgency: upon a plausible match, the reviewer freezes the account immediately pending disposition (per OFAC blocking obligations). The reviewer disambiguates using secondary identifiers, then either files a blocked-property report and cancels open orders (confirmed hit) or releases the freeze with a logged rationale (false positive). The key operational challenge is surge handling — bulk designation days create acute workload spikes. If the reviewer queue is understaffed, legitimate customers may have orders frozen for days. The audit trail records dataset version cursors, match details, and freeze/unfreeze timestamps per customer, providing strong traceability.

### Open questions

The primary open question is whether self-built delta re-screening is preferable to vendor-provided continuous monitoring (e.g., World-Check One's ongoing monitoring feature under m01-commercial-watchlist). A provider should choose one approach, not both, to avoid redundancy. The commercial OpenSanctions license cost is vendor-gated and needed for any commercial deployment.

## Section 3: Open issues for human review

- **Zero attacker-story engagement:** Stage 5 found no modeled attacker stories engage this measure. The check's value is regulatory compliance (OFAC blocking obligations) rather than adversarial biosecurity detection. Whether to include it in a biosecurity screening regime is a policy decision.
- **[vendor-gated] commercial OpenSanctions license pricing:** Required for any commercial deployment; pricing requires sales contact.
- **Redundancy with commercial watchlist ongoing monitoring:** If a provider already uses World-Check One or Dow Jones with continuous monitoring, self-built delta re-screening may be redundant. Requires policy decision on preferred approach.
- **Surge-day staffing:** Bulk designation days (100+ entries) create acute reviewer workload spikes. Staffing model for surge handling needs operational planning.
- **Identifier drift mitigation:** The implementation recommends historical fingerprinting, but whether providers have the data-quality discipline to maintain historical identifiers across customer lifecycle is an operational question.
