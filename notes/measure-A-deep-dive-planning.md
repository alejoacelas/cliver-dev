# Measure A Deep Dive — Planning Conversation

Date: 2026-04-08 to 2026-04-10

## Goal

Deep dive on KYC Measure A: **linking address to institutions** (CSSWG Measures 05 + 12). Produce auditable flag specs, case stories, cost estimates, and global coverage analysis.

## Starting point (Slack message)

Investigating off-the-shelf tools for the KYC measures we think are most valuable. Then report on:
1. Tightly defined situations where we could raise a flag
2. The false positive rate of those flag candidates, and how it varies across the world
3. Global coverage of those tools

Prioritized measures:
- a. Linking address to institutions
- b. Linking payment to institution/individual
- c. Linking email to affiliation
- d. Residential address identification

Decision: start with (a).

## Repo structure (from exploration)

- **Broader vendor lists:** `pipeline/outputs/01-ideation-measure-05-v1.md` (18 vendors), `pipeline/outputs/01-ideation-measure-12-v1.md` (16 vendors)
- **Shortlisted vendors:** `pipeline/outputs/09-measure-05-synthesis.md`, `pipeline/outputs/09-measure-12-synthesis.md`
- **Product decisions:** `pipeline/outputs/08-product-measure-05.md`, `pipeline/outputs/08-product-measure-12.md`

## Shortlisted vendors

### Measure 05 — Shipping Address ↔ Institution

1. **ROR (Research Organization Registry)** — Free public API. ~110K orgs. Returns lat/lon + addresses. Falls back to city-level matching. Misses small labs and startups.
2. **GLEIF (Legal Entity Identifiers)** — Free public API. Verified registered and HQ addresses. No LEI = soft signal; presence = strong.
3. **Companies House** — Free UK API. SIC codes verify life-sciences relevance. Returns registered office addresses.
4. **OpenStreetMap (Nominatim/Overpass)** — Free. Campus polygon containment. Uneven non-US coverage.
5. **Two-Contact SOP** — Manual verification. Reviewer confirms via institution's public directory (phone + email). ~$30–60 per case. Strongest signal for shells.

### Measure 12 — Billing Address ↔ Institution

1. **PSP AVS (Stripe/Adyen/Braintree)** — $0 incremental. AVS response codes from card issuer. Returns zip/street match codes.
2. **Smarty (address classification)** — $0.003–$0.009/lookup. US address validation + classification. Returns RDI, CMRA flag, standardized address.
3. **Fintech Denylist (Mercury/Brex/Relay BINs)** — Free lookup + ~$500–2K/yr maintenance. Flags neobank-issued cards.

### Geographic coverage

- **Strong:** US, Western Europe, Japan, Korea, Singapore, Australia
- **Medium:** China, South America, Eastern Europe, Middle East
- **Weak:** Africa, Central Asia, Southeast Asia
- ROR is the bottleneck (~10–20% of entities not in any registry)

## Cost framing

### Order economics
- Oligos: $20–200 typical
- Gene fragments / clonal genes: $200–2,000+
- Working range: ~$200–1,500 per order
- KYC budget ceiling: <10% of order → ~$20–150 per order

### Reviewer cost band
- Low: $0.50/min (~$60k loaded, lower-cost region)
- High: $2.00/min (~$240k loaded, US/EU senior)

### Implication
- 10-min desk-check flag: $5–20
- 30–45 min two-contact SOP: $15–90 (at edge of budget for small orders)
- **Two-tier architecture:** tier-1 desk-check flags fire freely; tier-2 SOP flags only when tier-1 inconclusive + independent risk markers

## Planned approach (revised)

### 1. Vendor + field map
Read the synthesis files, produce normalized schema for what each vendor returns, exclusion notes.

### 2. Flag spec drafting (~6–10 specs)
Each flag spec contains:
- Trigger condition (pseudocode over normalized fields)
- Threat model (what it catches)
- Required vendor inputs (list)
- Tier (1=desk-check / 2=SOP)
- Resolution procedure (numbered steps)
- Expected resolution time range (minutes, low–high)

### 3. Case story authoring (~30 stories)
Structure per story:
- Narrative (≤200 words)
- Customer profile fields (institution claim, shipping addr, billing addr, payment instrument, order size $)
- Threat archetype tag
- Buriedness rating or signal-chain-length count
- Ground-truth label (legitimate / negligent / adversarial)
- Expected-fire flag list + expected-not-fire flag list
- Frequency-weight guess (rough %)

Coverage targets:
- ~8–12 legitimate (spanning R1 university, small biotech, hospital, CRO, foreign academic, varied regions)
- ~6–8 negligent/sloppy-but-real (PI ordering to home, personal card, typos, multi-campus)
- ~10–15 adversarial at varying buriedness (shell at CMRA, wrong building, hijacked PI, straw buyer, foreign front)

Adversarial polish: writer agent ↔ adversary agent, ≤3 rounds per buried case.

Real-example sourcing is a **follow-on stage**, delegated per story later. Sources:
- PubMed/bioRxiv corresponding authors (legitimate baseline)
- Biotech startup registries (small-company gap)
- Hand-built adversarial cases from threat models

### 4. Dry-run flags vs stories (on paper)
Per cell (flag × story): did_fire (bool), resolution_steps_taken, time_estimate_minutes (low–high), cost_estimate_$, outcome (TP/FP/TN/FN vs ground truth).

### 5. Cost rollup
Per-story time × reviewer rate band → per-story $ → weighted average → compare to $20–150 budget.

### 6. Per-country usability
Qualitative for now: which flags degrade where, based on vendor coverage gaps.

### 7. Synthesis doc
Recommended flag set, cost estimate band, resolution playbook, blind spots, list of stories needing real-example sourcing.

## Open questions for /research-pipeline spec

These were asked but not yet answered:

1. **Decomposition:** grid = flag specs × case stories, or independent tracks merging at cost-rollup?
2. **Case story parallelism:** single authoring loop vs per-archetype parallel sub-agents?
3. **Adversarial polish:** automated (writer ↔ adversary agents) or human-in-the-loop?
4. **Buriedness field:** subjective 1–5 rating or structural "count of independent signals to chain"?
5. **Dry-run batching:** by story (30 agents) or by flag (8 agents)? Leaning flag-batched for consistency.
6. **Fact-checking:** wire into vendor-map stage? Needs OpenRouter key.
7. **Audience:** internal team, DNA providers, external publication?
8. **Final format:** single doc or directory with per-flag files + synthesis?
