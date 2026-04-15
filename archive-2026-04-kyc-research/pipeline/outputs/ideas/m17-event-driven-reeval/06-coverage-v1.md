# Coverage research: Event-driven re-evaluation of pre-approved entities

## Coverage gaps

### Gap 1: Entities not in OpenCorporates (unincorporated, sole proprietors, foreign entities in uncovered jurisdictions)
- **Category:** Pre-approved customers that are sole proprietorships, unincorporated academic labs, government agencies, or entities in jurisdictions not covered by OpenCorporates. These entities have no corporate filing to monitor, so the ownership-change trigger never fires.
- **Estimated size:** OpenCorporates covers 235+ million companies in 140+ jurisdictions ([OpenCorporates](https://opencorporates.com/); [OpenCorporates blog — coverage](https://blog.opencorporates.com/2025/03/05/how-to-check-data-coverage-in-opencorporates/)). There are ~195 UN member states, so ~55 jurisdictions have no coverage. The biopharmaceutical segment (42% of DNA synthesis market, per [Credence Research, 2024](https://www.credenceresearch.com/report/dna-synthesis-market)) is mostly incorporated, but academic institutions and government labs — a large share of synthesis customers — are typically not "companies" in corporate registries. [best guess: 30–50% of pre-approved synthesis customer entities are academic institutions, government labs, or other non-corporate entities for which OpenCorporates provides no event signal. For the remaining corporate entities, ~5–10% are in jurisdictions with thin or no OpenCorporates coverage, based on the ~55 uncovered jurisdictions being mostly small/developing countries.]
- **Behavior of the check on this category:** no-signal — no corporate events are generated for entities outside OpenCorporates.
- **Reasoning:** The implementation's event-router relies on OpenCorporates for ownership/officer/status changes. Academic and government entities — a core synthesis customer segment — are structurally invisible to this feed.

### Gap 2: OpenCorporates jurisdiction data-freshness lag
- **Category:** Pre-approved corporate entities in jurisdictions where OpenCorporates data is stale (long lag between actual corporate filing and OpenCorporates ingestion). The entity changes ownership, but the event does not surface for weeks or months.
- **Estimated size:** OpenCorporates acknowledges variable freshness by jurisdiction ([OpenCorporates blog — coverage freshness](https://blog.opencorporates.com/2025/03/05/how-to-check-data-coverage-in-opencorporates/); coverage heatmap at [knowledge.opencorporates.com](https://knowledge.opencorporates.com/knowledge-base/coverage-heatmap/)). UK Companies House filings are typically reflected within days; some US states file annual reports only, with no event-level feed ([OpenCorporates blog — US data difficulty](https://blog.opencorporates.com/2025/05/28/why-is-it-so-hard-to-find-us-company-data/)). Many US states require only annual reports ([MyCorporation](https://www.mycorporation.com/learningcenter/annual-report-due-dates.jsp)), meaning an officer change mid-year may not appear until the next annual filing. [best guess: for US entities (~55% of synthesis customers), lag is 1–12 months depending on state; for UK/EU entities, lag is days to weeks; for other jurisdictions, lag is unknown and potentially months.]
- **Behavior of the check on this category:** weak-signal — the event fires eventually, but during the lag window the pre-approval remains active despite the ownership change having already occurred.
- **Reasoning:** The implementation notes this as a failure mode. For the "acquire a going concern" attacker story, the acquisition could be exploited during the lag window before the OpenCorporates event surfaces.

### Gap 3: Entities that change control without a filing event (informal control changes, management buyouts with no officer change)
- **Category:** Pre-approved entities where effective control changes but no corporate filing triggers an OpenCorporates event. Examples: management buyouts where the same officers remain but ownership transfers; informal control shifts in private companies; changes of beneficial ownership that are not reported in the jurisdiction's registry.
- **Estimated size:** [unknown — searched for: "beneficial ownership change no corporate filing frequency", "management buyout no officer change corporate registry"]. [best guess: this is the core of the "gradual-legitimacy-accumulation" attacker story — the entity looks clean in filings. Probably affects a small fraction of legitimate entities (most real ownership changes do produce filings) but is the exact scenario an attacker would engineer. Size as a fraction of customer base: <5% of ownership changes go un-filed, but 100% of attacker-engineered control shifts would attempt this.]
- **Behavior of the check on this category:** no-signal — no event fires because no filing occurs.
- **Reasoning:** The implementation acknowledges that the gradual-legitimacy-accumulation branch is "weakly addressed" precisely because the attacker's strategy is to avoid triggering events.

### Gap 4: OFAC delta name-collision noise (common names generating false demotions)
- **Category:** Pre-approved entities whose entity name or officer names collide with newly-added OFAC SDN entries. Common transliterated names (Russian, Arabic, Chinese) generate frequent false matches, demoting legitimate entities unnecessarily.
- **Estimated size:** OFAC's SDN list contains ~12,000+ entries. Standard fuzzy-matching in sanctions screening generates false-positive rates of 2–10% depending on the matching algorithm and the name population ([ComplyAdvantage — Sanctions Screening](https://complyadvantage.com/insights/sanctions-screening/); industry rule of thumb). For a pre-approval roster of 500 entities, [best guess: 10–50 false OFAC-delta demotions per year, generating reviewer workload but no security benefit.]
- **Behavior of the check on this category:** false-positive — legitimate entities are demoted and their SOC orders are frozen until a reviewer clears the match.
- **Reasoning:** The implementation acknowledges "OFAC partial-name fuzzy matches" as a failure mode. The volume depends on the customer roster's name distribution — providers with many international customers will see more noise.

### Gap 5: Routine officer turnover at large institutions generating noise
- **Category:** Large academic or corporate entities where officer/director changes are frequent and benign (CFO retirement, new board member) but each triggers a demotion event.
- **Estimated size:** [best guess: large universities and pharma companies may have dozens of officer changes per year. A pre-approval roster heavily weighted toward R1 universities (~130 US R1 institutions, many with frequent administrative changes) could generate hundreds of benign demotions per year. The implementation proposes mitigating by exempting entities above a size threshold, but this mitigation is not yet defined.]
- **Behavior of the check on this category:** false-positive — legitimate entities are repeatedly demoted and must be re-promoted by a reviewer each time.
- **Reasoning:** The implementation flags this explicitly and proposes a size-threshold exemption. Without the exemption, the reviewer load may be unsustainable.

### Gap 6: Entities with no digital footprint in any event feed (new startups, newly incorporated)
- **Category:** Newly incorporated entities that have minimal filing history. The event-driven model fires on *changes*; a new entity has no baseline to change from. If pre-approved based on initial screening (m18/m19), the event-driven check provides no incremental signal until the entity files something.
- **Estimated size:** [best guess: new biotech startups are a meaningful fraction of synthesis customers. US business formation rates are ~5 million new businesses per year ([Census Bureau](https://www.census.gov/econ/overview/mu0600.html)); the fraction that are biotech-relevant and ordering SOC sequences is tiny, but within the provider's roster, new entities might represent 5–15% of pre-approved customers in any given year.]
- **Behavior of the check on this category:** no-signal — no baseline means no events to detect.
- **Reasoning:** The implementation assumes a pre-existing entity with filings. New entities get pre-approved and then sit in a monitoring blind spot until their first corporate event occurs.

## Refined false-positive qualitative

1. **Routine officer turnover** (stage 4 + Gap 5) — remains, upgraded. High-frequency noise for large institutions.
2. **Address corrections** (stage 4) — remains. Typo fixes vs. real moves are indistinguishable.
3. **Sanctions name collisions** (stage 4 + Gap 4) — remains, upgraded. Common in international customer rosters.
4. **Benign mergers / reorganizations** — new. Large pharma regularly reorganizes subsidiaries; each reorganization triggers events that are operationally meaningless for biosecurity.

## Notes for stage 7 synthesis

- Gap 1 (non-corporate entities) is the most significant: academic institutions and government labs — a core customer segment — are structurally invisible to OpenCorporates monitoring. The implementation must define alternative trigger sources for these entities (e.g., ROR institutional status changes, FSAP re-registration, periodic manual re-verification).
- Gap 2 (data-freshness lag) creates an exploitation window that is exactly what the "acquire a going concern" attacker story targets. The monthly reconciliation proposed in the implementation partially mitigates but does not close the window.
- Gaps 4 and 5 (false-positive noise) are operationally significant and will determine whether the system is sustainable. The proposed size-threshold exemption for Gap 5 needs concrete definition.
- The check is most effective for small-to-medium incorporated entities in high-coverage jurisdictions (US, UK, EU) where corporate events are timely and meaningful. This is a narrower population than the full pre-approval roster.
