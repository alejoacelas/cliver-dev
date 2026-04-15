# Coverage research: Commercial PEP / entity watchlist

## Coverage gaps

### Gap 1: PEP coverage gaps in jurisdictions with weak disclosure regimes
- **Category:** Institutions whose officers, beneficial owners, or governing-board members are politically exposed persons in countries where PEP registries are incomplete or nonexistent (much of sub-Saharan Africa, Central Asia, parts of Southeast Asia, Pacific Islands). The commercial vendor's PEP database relies on publicly available information, and jurisdictions that do not publish government official registers produce structural blind spots.
- **Estimated size:** There is no single global PEP register; poor data coverage means screening software may only include PEP information from well-documented jurisdictions, missing crucial ones ([source](https://complyadvantage.com/fincrime-risk-intelligence/politically-exposed-persons-screening/)). [best guess: World-Check claims 3M+ profiles globally ([source](https://en.wikipedia.org/wiki/World-Check)), but coverage in low-disclosure jurisdictions (perhaps 40-60 countries) is materially thinner. For DNA synthesis customers at institutions in these jurisdictions, PEP-related risk intelligence would be sparse.]
- **Behavior of the check on this category:** weak-signal (vendor returns no PEP hits, but absence may reflect data gaps rather than absence of risk)
- **Reasoning:** The vendor's PEP coverage is only as good as the underlying source data. In jurisdictions without public disclosure of government officials, the vendor cannot build profiles.

### Gap 2: Adverse-media coverage gaps for non-English-language sources
- **Category:** Institutions whose risk-relevant media coverage exists only in local-language publications not indexed by the commercial vendor. Adverse-media screening is highly English-centric; coverage of Chinese, Arabic, Russian, Farsi, and African-language media is materially weaker.
- **Estimated size:** [best guess: ComplyAdvantage and World-Check ingest multi-language media, but the breadth and depth of non-English coverage varies. For institutions in China, the Middle East, and Africa, perhaps ~30-50% of risk-relevant adverse media may be in publications not covered by the vendor.] Tools need to support diverse languages and regional content, not just English-language headlines ([source](https://seon.io/resources/adverse-media-screening/)).
- **Behavior of the check on this category:** weak-signal (vendor's adverse-media module returns no hits, but relevant journalism exists in untapped sources)
- **Reasoning:** A Chinese institution with extensive adverse coverage in Chinese-language state media or WeChat public accounts would not necessarily surface in a Western vendor's adverse-media feed.

### Gap 3: False-positive burden from common institutional names
- **Category:** Legitimate institutions whose names trigger hits against unrelated entries in the vendor's database — especially institutions in China and Russia where institutional naming conventions produce many near-collisions with sanctioned or PEP-associated entities.
- **Estimated size:** AML screening false-positive rates are typically 85-95% of all alerts ([source](https://www.facctum.com/blog/aml-false-positive-report), citing PwC). For a DNA synthesis provider screening ~1,000 institutional customers, this could mean hundreds of false-positive alerts requiring human disposition. [best guess: the effective false-positive rate for institutional-name screening against a commercial watchlist is lower than the bank-grade 90-95% figure because DNA synthesis customers are mostly universities and biotech companies, not individuals — but still likely ~30-60% of alerts are false positives.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** Commercial vendors optimize for financial-institution compliance where the cost of a miss is regulatory penalty; their tuning favors recall over precision. For DNA synthesis providers, the volume of false-positive alerts from a commercial vendor is a significant operational cost.

### Gap 4: Vendor-gated pricing creating adoption barriers for small providers
- **Category:** Small and mid-size DNA synthesis providers who cannot afford the $5k-$300k+ annual subscription for a commercial AML vendor and therefore do not implement this check at all.
- **Estimated size:** The DNA synthesis market includes ~20-30 providers globally, ranging from large (Twist, IDT, GenScript) to small (academic core facilities, regional providers). [best guess: the largest 5-10 providers can afford enterprise AML subscriptions; the remaining 10-20 smaller providers may find the cost prohibitive relative to their order volume. This means ~50-70% of providers by count (though a smaller fraction by order volume) may not adopt this check.]
- **Behavior of the check on this category:** not a coverage gap per se, but a structural adoption barrier that reduces the check's population-level effectiveness
- **Reasoning:** The commercial vendor layer is most valuable as an overlay on the free CSL, but its cost may prevent adoption by smaller providers.

### Gap 5: Beneficial-ownership graph staleness
- **Category:** Institutions whose beneficial-ownership structure has recently changed (new parent company, restructuring, divestiture) but the vendor's corporate-graph data has not yet been updated. Vendor databases refresh corporate registries on different cadences.
- **Estimated size:** [unknown — searched for: "commercial AML vendor corporate registry refresh cadence", "World-Check beneficial ownership data freshness" — refresh cadence is vendor-gated and not publicly documented.] [best guess: corporate-registry data may lag by weeks to months depending on jurisdiction; for rapidly restructuring entities this creates a window of vulnerability.]
- **Behavior of the check on this category:** weak-signal (stale ownership data may miss a newly acquired sanctioned parent)
- **Reasoning:** Beneficial-ownership graphs are only as current as the underlying registry data, which varies by jurisdiction.

### Gap 6: Institutions in jurisdictions not covered by any sanctioning authority
- **Category:** Institutions in countries that are not subject to US, EU, UK, or UN sanctions programs and where the vendor has minimal PEP/adverse-media coverage. These institutions would pass the commercial screen by default even if they pose biosecurity risks.
- **Estimated size:** [best guess: this is a small gap for the M08 use case — most biosecurity-relevant jurisdictions (China, Iran, Russia, DPRK, Syria) are extensively covered by at least one sanctions program. The gap is relevant mainly for institutions in "gray zone" countries (e.g., UAE free zones, certain Southeast Asian jurisdictions) where sanctions coverage is partial.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The commercial vendor adds adverse-media and PEP layers beyond sanctions, which partially fills this gap.

## Refined false-positive qualitative

**True false positives (legitimate customers flagged):**
1. Common-name institutional collisions generating sanctions/PEP/adverse-media alerts (Gap 3, ~30-60% of alerts)
2. Adverse-media hits from unrelated incidents (e.g., a financial-fraud case at a hospital system's finance division flagging the research wing)
3. PEP hits on institutional officers who are politically exposed but whose institution's research operations are unrelated

**False negatives (risky entities that pass):**
1. PEP gaps in low-disclosure jurisdictions (Gap 1)
2. Non-English adverse media not indexed (Gap 2)
3. Recently changed ownership not reflected in vendor data (Gap 5)

## Notes for stage 7 synthesis

- The commercial vendor layer's primary value over the free CSL is **adverse media** and **PEP exposure** — catching entities before they reach formal government designation. But this value is concentrated in well-covered jurisdictions.
- The **cost barrier** (Gap 4) is the most significant practical limitation: it prevents adoption by smaller providers who would benefit most from augmented screening.
- The **false-positive burden** (85-95% industry average, likely 30-60% for institutional screening) should be prominently disclosed in the synthesis — it represents a significant ongoing operational cost.
- Pairing with the free CSL (m08-bis-entity-csl) is essential; the commercial layer is complementary, not a replacement.
