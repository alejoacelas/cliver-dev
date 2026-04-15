# Coverage research: Wayback first-seen + content history

## Coverage gaps

### Gap 1: New legitimate websites with no Wayback history
- **Category:** Legitimate biotech startups, newly established research centres, and recently launched institutional websites that have no captures in the Wayback Machine because they are too new or too small to have been crawled.
- **Estimated size:** The Wayback Machine has indexed homepages from ~350 million sites ([Wikipedia: Wayback Machine](https://en.wikipedia.org/wiki/Wayback_Machine)) out of ~368 million registered domains as of Q1 2025 ([Openprovider: domain statistics 2025](https://www.openprovider.com/blog/how-many-domains-are-there)). However, many of those 350M sites were crawled only once or long ago. [best guess: for domains <12 months old, ~30-50% have zero Wayback captures, because IA's crawler discovers new sites primarily through external links, and a brand-new startup may not yet have inbound links from crawled pages.] This population overlaps heavily with Gap 1 of m02-rdap-age (new biotech startups).
- **Behavior of the check on this category:** no-signal (`no_wayback_history`)
- **Reasoning:** The check produces `no_wayback_history`, which the SOP correctly treats as a soft signal combined with RDAP age. But the absence of Wayback data is uninformative — it doesn't distinguish a legitimate new startup from a newly created shell domain. The check's value comes from the other flags (dormancy gap, content pivot), not from the "no history" case.

### Gap 2: Sites excluded by robots.txt or owner request
- **Category:** Legitimate institutions that block the Internet Archive crawler via `robots.txt` or have requested exclusion. Some organizations (particularly in finance, defense-adjacent biotech, and some government labs) restrict crawling as a policy.
- **Estimated size:** [unknown — searched for: "percentage of websites blocked by robots.txt from Internet Archive", "Internet Archive robots.txt exclusion rate", "Wayback Machine coverage percentage"]. No published figure exists. IA announced in 2017 that it would stop honoring robots.txt for US government sites ([Internet Archive blog: robots.txt](https://blog.archive.org/2017/04/17/robots-txt-meant-for-search-engines-dont-work-well-for-web-archives/)), suggesting the problem was significant for that category. [best guess: 5-10% of institutional/corporate domains that a synthesis provider would encounter have robots.txt exclusions affecting IA.]
- **Behavior of the check on this category:** false-positive (indirectly)
- **Reasoning:** Returns `no_wayback_history` even for a well-established institution. Combined with a young RDAP transfer date, this could create a false `dormancy_gap` pattern. The SOP must cross-reference with other signals.

### Gap 3: Single-page apps and JS-rendered sites
- **Category:** Modern websites built with React, Next.js, Vue, or similar frameworks where the initial HTML contains only a JavaScript loader. Wayback captures the loader, not the rendered content.
- **Estimated size:** [best guess: 20-30% of biotech startup websites use SPA frameworks. Among established universities, the fraction is lower (~5-10%) as institutional sites tend to use traditional CMS (WordPress, Drupal).] [unknown — searched for: "percentage of biotech company websites using React SPA JavaScript rendered"]
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** The content-pivot classifier receives near-empty text (just a JS loader) for both "before" and "after" snapshots, producing no useful classification. The check degrades to CDX metadata only (timestamps, capture count), losing its most distinctive capability (content-category change detection).

### Gap 4: Gradual-legitimacy-accumulation attacker pattern
- **Category:** Attacker stories describe building a legitimate-looking website 6-12 months before placing a synthesis order, specifically to defeat history-based checks.
- **Estimated size:** This is an attacker bypass, not a legitimate-customer gap. Included here because it bounds the check's effectiveness ceiling. [best guess: any moderately resourced attacker (state-level or well-funded non-state) can execute this at trivial cost.]
- **Behavior of the check on this category:** no-signal (attacker passes)
- **Reasoning:** The check is structurally defeated by pre-staging. A site that has been consistently "research lab"-themed for 12 months will show no content pivot and adequate history depth. The 04-implementation acknowledges this.

## Refined false-positive qualitative

1. **New legitimate websites (Gap 1):** `no_wayback_history` fires. The SOP correctly treats this as soft/combinable, but the population is large (~30-50% of domains <12 months old). Must not weight this flag heavily in isolation.
2. **Legitimate rebrands triggering `recent_content_pivot` (from 04-implementation):** Department name changes, university spinoffs, and corporate rebrands (biotech acquired and renamed) produce genuine content category changes. [best guess: ~2-5% of active domains undergo a rebrand in any 12-month window, based on general corporate turnover rates.] This is the check's most problematic FP because the `recent_content_pivot` flag is designed to be high-priority.
3. **robots.txt-excluded institutional sites (Gap 2):** Generate false `no_wayback_history` on established organizations. Cross-referencing with RDAP domain age eliminates most false positives, but the check alone would misclassify.

## Notes for stage 7 synthesis

- Wayback's unique value is detecting the **dormant-domain reanimation** pattern (gap in captures + content pivot). This is a niche signal that no other M02 idea provides. But it works only when: (a) the domain was crawled before going dormant, (b) the domain is not robots.txt-excluded, and (c) the site is not SPA-rendered.
- For the majority of customers (new startups, commercial entities, SPA sites), the check produces no actionable signal. Its effective coverage is probably ~30-40% of all synthesis customers (established academic institutions with traditional websites and Wayback history).
- The LLM/classifier component introduces a cost (~$0.001/check) and a latent FP source (rebrand misclassification). Consider whether the dormant-domain detection is worth the complexity, or whether RDAP transfer-date alone is sufficient.
