# Measure 01 — Sanctions Name Screen: Product Prioritization

## Selected stack

### 1. OFAC SDN + Consolidated screen (`m01-ofac-sdn`)

Selected as the baseline. OFAC screening is a non-negotiable legal requirement for any US-nexus provider and the cheapest check in the set: $0 marginal cost on the free Treasury SLS feed, or EUR 0.10 via OpenSanctions. The input/output contract is clean (name + optional DOB/address in, match score + entry metadata out), and it plugs into any onboarding flow as a single API call or local lookup. While zero modeled attacker stories engage this measure, OFAC screening is table-stakes compliance infrastructure that every other M01 idea builds on top of. Selecting it first establishes the fuzzy-matching pipeline, reviewer queue, and audit-trail schema that the other checks reuse.

### 2. UN/EU/UK/CA/AU sanctions union (`m01-global-sanctions-union`)

Selected for coverage breadth. Roughly 63% of the gene synthesis market is outside the US, and non-US shipments require screening against the binding jurisdictional list (OFSI for UK, FSF for EU, etc.). When implemented via OpenSanctions, this check shares the exact same API call as OFAC screening — the `sanctions` collection includes OFAC plus all five international lists for the same EUR 0.10/call, meaning the marginal cost of adding international coverage is literally zero. The `multi_jurisdiction_hit` flag (match across two or more lists) provides a high-confidence signal that single-list screening cannot. Dropping this idea would leave providers legally exposed on every non-US order.

### 3. Daily delta re-screening (`m01-delta-rescreen`)

Selected for temporal coverage. Onboarding-time screening catches customers who are already designated, but delta re-screening closes the gap when a customer is sanctioned after onboarding — an obligation under OFAC's blocking rules (31 CFR 501). The marginal cost is near-zero (free data, trivial compute for matching N customers against typically <100 new entries per delta), and setup is light (1-2 engineer-weeks). It composes cleanly with the onboarding checks: it reuses the same fuzzy matcher and reviewer queue, just inverted — instead of screening one customer against the full list, it screens new list entries against all customers. Without this, a provider could unknowingly ship to a customer who was designated yesterday.

## Dropped ideas

- **Commercial watchlist (World-Check / Dow Jones / LexisNexis Bridger):** Marginal value over free sanctions screening is low for biosecurity purposes. PEP coverage has near-zero correlation with bioweapons intent. Adverse-media coverage in biosecurity-relevant languages (Chinese, Arabic, Farsi) is unknown. Cost is 5-50x higher ($0.50-$5/check plus five-figure annual license) for a ~90% false-positive rate, and setup is 4-8 engineer-weeks. The incremental signal (PEP, adverse media, SOE flags) is designed for financial-crime compliance, not biosecurity screening, and generates high-volume false positives on exactly the populations (international academic researchers) that are the core customer base.

## Composition note

The three selected ideas share a single data backend and compose into a unified screening pipeline:

- **Shared input:** Customer legal name, plus DOB/nationality/address when available. All three checks consume the same customer record.
- **Shared backend:** OpenSanctions API (or self-hosted OpenSanctions bulk data) serves both OFAC and international lists in a single call. The delta re-screen uses the same dataset's delta files. There is no need for separate integrations.
- **Execution model:** At onboarding, one API call to OpenSanctions `/match/sanctions` covers both OFAC and international lists simultaneously. In parallel, a daily cron job pulls delta files and matches new entries against the indexed customer database using the same fuzzy matcher.
- **Combined output:** A single measure-level result aggregates flags from all three checks. Any flag (`ofac_sdn_hit`, `un_hit`, `eu_fsf_hit`, `uk_ofsi_hit`, `ca_sema_hit`, `au_dfat_hit`, `delta_new_hit`) routes to the same reviewer queue. The reviewer sees the customer record, all matched entries across lists, scores, and source citations. Disposition is per-customer, not per-list — one review resolves the measure.
- **Audit trail:** List version snapshot, matched entities, scores, and reviewer disposition are recorded per check event, with dataset version cursors tracked for delta re-screening reproducibility.
