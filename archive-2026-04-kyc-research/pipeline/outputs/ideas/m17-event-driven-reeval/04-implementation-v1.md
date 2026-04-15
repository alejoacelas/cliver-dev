# m17-event-driven-reeval — Implementation v1

- **measure:** M17 (pre-approval-list)
- **name:** Event-driven re-evaluation of pre-approved entities
- **modes:** A
- **summary:** A pre-approved entity does not stay pre-approved unconditionally. The provider subscribes to a small set of event feeds — corporate-ownership change events from OpenCorporates, daily delta from the OFAC SDN list, breach-credential hits from m16-spycloud-breach, and an internal dormancy timer — and any event tied to a pre-approved entity demotes it back to "needs-review" before the next SOC order ships. Closes the post-approval drift that drives gradual-legitimacy-accumulation, shell-company (M&A laundering variant), and the persistent variants of dormant-account-takeover and bulk-order-noise-cover.

## external_dependencies

- **OpenCorporates API** for ownership / officer / status changes ([api.opencorporates.com](https://api.opencorporates.com/), [OpenCorporates getting-started blog](https://blog.opencorporates.com/2025/02/13/getting-started-with-the-opencorporates-api/), [API Reference 0.4.8](https://api.opencorporates.com/documentation/API-Reference)). Specific endpoints: `/companies/search`, `/companies/{jurisdiction}/{company_number}`, `/companies/{jurisdiction}/{company_number}/events` (events endpoint for changes), and `/companies/{jurisdiction}/{company_number}/filings`.
- **OFAC Sanctions List Service (SLS)** delta files ([ofac.treasury.gov/sanctions-list-service](https://ofac.treasury.gov/sanctions-list-service), [List file formats FAQ](https://ofac.treasury.gov/faqs/topic/1641)). Cross-references the m01 (sanctions) idea family.
- **SpyCloud / Constella** breach feeds (cross-references m16-spycloud-breach).
- **Internal dormancy timer** (cross-references m16-dormancy-reidv).
- **Internal review queue + reviewer SOP.**
- **Standards anchor:** FinCEN's 2018 Customer Due Diligence rule and the broader FATF / AMLA perpetual-KYC framing — re-eval on trigger events is the standard pKYC pattern ([sanctions.io — Perpetual KYC](https://www.sanctions.io/blog/perpetual-kyc-customer-due-diligence), [Trulioo — Embracing perpetual KYC with ongoing CDD](https://medium.com/the-regtech-hub/embracing-perpetual-kyc-with-ongoing-customer-due-diligence-37d01d44cade), [ComplyAdvantage — What is perpetual KYC](https://complyadvantage.com/insights/perpetual-kyc/)).

## endpoint_details

### OpenCorporates
- **Base URL:** `https://api.opencorporates.com/v0.4/`
- **Auth:** API token; commercial license required for non-trivial volumes (free tier exists for individual journalist / academic use, capped at 500 calls per month — [unknown — searched for: "OpenCorporates free tier limit 2026", "OpenCorporates API plans pricing"]).
- **Pricing:** Commercial pricing is bespoke; OpenCorporates' commercial team negotiates per-use-case [vendor-gated — public free tier visible; commercial pricing requires sales contact].
- **Rate limits:** Free tier 500/month (historical figure, may be lower); commercial tiers higher [vendor-gated].
- **ToS:** Permits compliance / risk monitoring per their commercial terms.
- **Events endpoint:** documented in the API Reference; emits structured records when company status, registered address, officers, or filings change.

### OFAC SLS
- **Base URL:** `https://sanctionslistservice.ofac.treas.gov/` (SLS) and the legacy https://www.treasury.gov/ofac/downloads/ static files.
- **Auth:** None — public download.
- **Pricing:** **$0**.
- **Rate limits:** None published; reasonable polling expected.
- **Delta file:** OFAC publishes a delta file as part of SLS containing only the changes since the previous publication ([List File Formats FAQ](https://ofac.treasury.gov/faqs/topic/1641)). Daily polling is sufficient.
- **Format:** XML (Advanced Sanctions List Standard) and CSV; UID-keyed entries.

### SpyCloud / Constella
- See m16-spycloud-breach for endpoint details.

### Internal dormancy timer
- IdP-based, see m16-dormancy-reidv.

## fields_returned

### Per OpenCorporates event
- `event_type` (e.g., `change_of_address`, `change_of_officer`, `dissolution`, `merger`)
- `company_number`, `jurisdiction_code`, `name`
- `previous_data`, `new_data`
- `event_date`, `published_at`

### Per OFAC delta entry
- `uid`, `action_type` (`add` / `update` / `remove`)
- `name`, `aliases`
- `programs` (list of sanctions programs)
- `addresses`, `dates_of_birth`, `nationalities`
- `published_date`

### Per re-evaluation event (internal)
- `entity_id`, `triggering_event_type`, `triggering_event_id`, `previous_status`, `new_status`, `decided_at`, `reviewer_id`

## marginal_cost_per_check

- **OpenCorporates:** [vendor-gated; best guess: commercial KYC integration tiers run in the low five-figure annual range for ~100k entity records under ongoing monitoring. Per-entity per-year amortized: ~$0.10–$1.00. Searched for: "OpenCorporates commercial pricing KYC", "OpenCorporates API monitoring price tier".]
- **OFAC SLS:** **$0**.
- **SpyCloud / Constella:** see m16-spycloud-breach.
- **Internal:** Engineering for the event-router (subscribe → match → demote → queue): [best guess: 4–8 engineer-weeks initial + ongoing reviewer time].
- **Per-customer-per-year incremental:** dominated by OpenCorporates and reviewer time on triggered cases. [best guess: $1–$5 per pre-approved customer per year.]

## manual_review_handoff

SOP per triggered event:

1. **Event ingest.** A scheduled job pulls the OpenCorporates events endpoint for every monitored company once per day; pulls the OFAC delta once per day; subscribes to SpyCloud / Constella webhooks where supported.
2. **Match.** Each event is keyed against the entity record store. A match demotes the entity from `pre_approved` to `needs_review` and freezes new SOC orders.
3. **Auto-categorize the trigger:**
   - **OpenCorporates `change_of_officer`** → likely M&A or executive turnover. Reviewer requests updated beneficial-ownership documentation.
   - **OpenCorporates `dissolution`** → entity gone. Auto-suspend account.
   - **OpenCorporates `change_of_address`** → reviewer verifies the new address against the registered shipping address.
   - **OFAC delta add matching the entity name or any officer name** → immediate hold; legal review.
   - **SpyCloud breach hit on the institutional account** → see m16-spycloud-breach SOP.
   - **Dormancy threshold crossed** → see m16-dormancy-reidv SOP.
4. **Reviewer decision matrix:** approve (re-promote to pre_approved), conditionally approve (require fresh m18-institution-legitimacy-soc check before next order), or reject (revoke pre-approval, notify customer, retain audit trail).
5. **Customer communication:** "We received an update about your organization's records. Your account is paused for SOC orders pending a brief re-verification. Most reviews complete in 2 business days."
6. **Audit log entry** for every demotion / re-promotion, including reviewer name and the source event ID.

## flags_thrown

- `event_triggered_reeval` — generic; routed to the categorizer.
- `ownership_change_detected` — OpenCorporates officer change. **Action:** demote, request beneficial ownership refresh.
- `entity_dissolved` — OpenCorporates dissolution. **Action:** suspend account permanently.
- `sanctions_delta_hit` — OFAC delta touched the entity or an officer. **Action:** immediate hold, legal/compliance escalation.
- `breach_event_on_account` — see m16-spycloud-breach.
- `dormancy_event` — see m16-dormancy-reidv.

## failure_modes_requiring_review

- **OpenCorporates lag** — corporate filings vary in publication latency by jurisdiction, from days (UK Companies House) to months (some US states) [unknown — searched for: "OpenCorporates jurisdiction data freshness latency", "OpenCorporates US state filings update frequency"].
- **OpenCorporates coverage gaps** — non-Western jurisdictions and certain US states have thinner data; the absence of an event does not mean an event did not happen. Coverage gap, not a failure per se.
- **False matches on common officer names** — entity matched on a name collision, demoted incorrectly. Reviewer overrides.
- **OFAC partial-name fuzzy matches** — same problem; standard sanctions screening fuzzy-match noise. Reviewer adjudicates.
- **Vendor outage** — OpenCorporates or SLS unreachable. Fall back to weekly snapshot diff.
- **Event-feed gap** — event happened but the API didn't surface it (silent edge cases). Periodic full reconciliation against entity records (monthly) catches drift.

## false_positive_qualitative

- **Routine officer turnover** at large institutions — every CFO change demotes the institution, generating reviewer load. Mitigate by exempting officer-change events for entities with > N officers / above a size threshold.
- **Address corrections** — typo fixes vs real moves are indistinguishable from the API.
- **Sanctions name collisions** — common names cause false hits; common in Russian / Arabic / Chinese transliterations.

## record_left

- **Event ingest log** with raw payload from OpenCorporates / OFAC.
- **Demotion / promotion event** in the entity-record audit log with reviewer name, source event ID, decision rationale.
- **Cross-link** to any orders that were held because of the demotion.
- **Periodic reconciliation report** (monthly) so an auditor can confirm the event router is not dropping events silently.

## attacker stories addressed (cross-ref)

- **gradual-legitimacy-accumulation:** weakly addressed — the branch's whole point is *not* to trigger an event; the entity is real, the filings are clean. The check helps only if the attacker is sloppy (changes officers, dissolves and re-incorporates).
- **shell-company (acquisition variant, "going-concern with live provider accounts"):** **directly addressed** — the acquisition is a corporate filing, OpenCorporates surfaces it as an officer / control change, the pre-approval is demoted exactly when the new owner shows up.
- **biotech-incubator-tenant (4f — buy an aged dormant biotech LLC):** addressed — same mechanism. Buying the LLC creates an officer change.
- **dormant-account-takeover (persistence):** addressed via the dormancy event branch.
- **credential-compromise / account-hijack (post-approval drift):** addressed via the breach-event branch.
- **bulk-order-noise-cover:** NOT addressed — the institution is real and unchanged; no event fires.
