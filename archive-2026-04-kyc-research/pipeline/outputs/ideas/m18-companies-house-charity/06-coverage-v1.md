# Coverage research: UK CH + Charity Commission + US SOS + IRS TEOS

## Coverage gaps

### Gap 1: Entities outside the US and UK
- **Category:** Any institution incorporated or registered outside the United States and the United Kingdom. This includes all of continental Europe, Asia-Pacific, Latin America, the Middle East, and Africa. The stack has no registry for these jurisdictions.
- **Estimated size:** The Asia-Pacific region alone holds ~38% of the global gene synthesis market ([source](https://www.imarcgroup.com/gene-synthesis-market)). North America holds ~35–40% and Europe ~20%. The stack covers the US and UK only. [best guess: 50–65% of global synthesis-buying institutions are incorporated outside the US/UK and have no registry in this stack. Even within Europe, only UK entities are covered.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The implementation explicitly covers Companies House (UK), Charity Commission (England & Wales), US state SOS via OpenCorporates, and IRS TEOS (US nonprofits). A legitimate German GmbH, Japanese KK, or Indian Pvt Ltd simply has no registry to query. OpenCorporates covers 140 jurisdictions ([source](https://opencorporates.com/)), but the implementation scopes the check to US SOS data via OpenCorporates — extending to non-US jurisdictions would require explicit design changes.

### Gap 2: Scottish and Northern Irish charities
- **Category:** Charities registered in Scotland (regulated by OSCR) or Northern Ireland (regulated by CCNI) that are not also registered with the Charity Commission for England and Wales.
- **Estimated size:** OSCR lists ~25,000 charities in Scotland ([source](https://www.oscr.org.uk/)). CCNI lists ~6,000 charities in Northern Ireland. [best guess: of these, perhaps 1,000–3,000 are in life-sciences-adjacent sectors; a small fraction would be synthesis customers, but they are a complete blind spot for the UK charity check.]
- **Behavior of the check on this category:** false-positive (`registry_no_record` fires for a legitimate UK charity)
- **Reasoning:** The implementation acknowledges "England and Wales only" for the Charity Commission API. Scottish/NI charities queried against the CC API return no record.

### Gap 3: Sole proprietorships, unincorporated entities, and partnerships
- **Category:** Legitimate research entities that exist but have no corporate registry entry: sole proprietors, general partnerships (in many US states these need not register), unincorporated associations, and individual researchers operating without a legal entity.
- **Estimated size:** [best guess: independent / freelance researchers and citizen-science labs are a small but non-zero fraction of synthesis customers — perhaps 2–5% of orders. Community bio labs (e.g., Genspace, BioCurious) may operate as unincorporated projects within a fiscal sponsor rather than as separately incorporated entities.]
- **Behavior of the check on this category:** no-signal (no entity to look up) or false-positive (`registry_no_record` fires)
- **Reasoning:** Corporate registries by definition do not contain unincorporated entities.

### Gap 4: OpenCorporates data staleness for recently incorporated or recently dissolved US entities
- **Category:** US entities whose state SOS filing is too recent for OpenCorporates to have ingested, or entities whose dissolution has not yet propagated. Particularly affects states that publish data infrequently.
- **Estimated size:** OpenCorporates states that for "most states" new incorporations appear within a week ([source](https://blog.opencorporates.com/2025/03/05/how-to-check-data-coverage-in-opencorporates/)). However, some states provide only monthly full dumps with no delta files. [best guess: at any given time, ~1–3% of very-recently-incorporated US entities may not yet appear in OpenCorporates, and a similar fraction of recently dissolved entities may still show as active.]
- **Behavior of the check on this category:** false-positive (legitimate new entity gets `registry_no_record`) or false-negative (dissolved entity still shows active)
- **Reasoning:** The implementation flags `registry_stale_data_warning` for this case but relies on OpenCorporates' upstream refresh.

### Gap 5: US nonprofits in determination-pending status
- **Category:** Organizations that have applied for 501(c)(3) tax-exempt status with the IRS but have not yet received a determination letter. During this period they do not appear in the EO BMF / TEOS.
- **Estimated size:** The IRS lists ~1.54 million 501(c)(3) organizations ([source](https://www.statista.com/statistics/1373603/number-nonprofit-organizations-irs-subsection-us/)). [best guess: at any time, several thousand organizations are in determination-pending status. The IRS processing backlog has historically ranged from 3 to 12+ months. A small number of these would be life-sciences nonprofits, but they are legitimate and invisible to TEOS.]
- **Behavior of the check on this category:** false-positive (`teos_no_record` fires)
- **Reasoning:** The implementation acknowledges this in false_positive_qualitative.

### Gap 6: Opaque US state registries (Delaware, Wyoming, New Mexico)
- **Category:** Entities incorporated in states that do not require public disclosure of officers, directors, or beneficial owners. Delaware LLCs, Wyoming LLCs, and New Mexico LLCs can be formed with minimal public information.
- **Estimated size:** Delaware alone hosts ~1.9 million legal entities ([source](https://corp.delaware.gov/)). Wyoming and New Mexico are popular for anonymous LLCs. [best guess: a shell-company attacker would preferentially use these jurisdictions. The registry confirms the entity *exists* but reveals almost nothing about who controls it, making the `registry_no_record` check pass while providing no legitimacy signal.]
- **Behavior of the check on this category:** weak-signal (entity is found but the record contains insufficient information to assess legitimacy)
- **Reasoning:** The implementation notes "some states (Wyoming, New Mexico, Delaware) are particularly opaque — anonymous LLCs, no officer disclosure." This means the check confirms existence without confirming legitimacy — the attacker's shell company passes.

## Refined false-positive qualitative

1. **New legitimate startups not yet in OpenCorporates** (Gap 4) — `registry_no_record` fires incorrectly. True false positive.
2. **Foreign institutions outside US/UK** (Gap 1) — no registry to query; if the workflow routes them to this check anyway, `registry_no_record` fires for a legitimate entity. True false positive or no-signal depending on workflow design.
3. **US 501(c)(3)s in determination-pending status** (Gap 5) — `teos_no_record` fires incorrectly. True false positive.
4. **Recently dissolved entities in legitimate wind-down** — `registry_dissolved` fires; may be legitimate (merger, reorganization). The implementation routes this to manual review, which is correct.
5. **Sole proprietorships / unincorporated entities** (Gap 3) — `registry_no_record` fires for an entity that has no registry entry by design.
6. **Scottish / NI charities** (Gap 2) — `registry_no_record` fires incorrectly for UK charities outside England & Wales.

## Notes for stage 7 synthesis

- The dominant structural gap is geographic: this check covers only US and UK entities. Given that Asia-Pacific is the largest regional gene synthesis market (~38% share), and Europe ex-UK is also large, the majority of global synthesis customers are outside coverage. The check is strong for US/UK entities but provides zero signal for most of the world.
- The Delaware/Wyoming opacity gap (Gap 6) is qualitatively different: the check *passes* the shell company rather than missing it. This is a weak-signal problem, not a no-signal problem. The cross-shell-graph idea (m18-cross-shell-graph) is the designed complement.
- OpenCorporates' staleness is a known issue but affects a small fraction of entities at any given time. The `registry_stale_data_warning` flag is a reasonable mitigation.
- Extending to non-US/UK jurisdictions is straightforward via OpenCorporates' 140-jurisdiction coverage but would require implementation work to normalize non-US/UK registry fields.
