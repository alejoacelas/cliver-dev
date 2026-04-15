# Measure 08 — Institution-Denied-Parties: Per-Measure Synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (count / which) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| **m08-bis-entity-csl** | ITA Consolidated Screening List API (13 US restricted-party lists, free federal API) | $0/check | High-confidence (score >= 0.9 + address match): auto-deny. Low-confidence: reviewer reads Federal Register notice. UVL: enhanced due diligence. | 0 wg stories (regulatory compliance value only) | Non-US sanctions lists absent (~10-20% of globally sanctioned entities); unlisted subsidiaries (OFAC 50% rule not automated); transliteration mismatches (~5-10% of non-Latin names) | None modeled — no wg attacker story operates from a denied-parties-listed institution |
| **m08-commercial-pep-watchlist** | Commercial AML vendor (World-Check, Dow Jones, ComplyAdvantage, Sayari, Bridger) | ~$0.10-$2.00/check [vendor-gated] | Sanction hit: auto-deny. PEP hit: enhanced due diligence. Adverse-media hit: read underlying journalism. ~30-60% of alerts likely false positives. | 0 wg stories (regulatory robustness + pre-listing intelligence) | PEP gaps in ~40-60 low-disclosure countries; non-English adverse media (~30-50% of risk-relevant media in China/Middle East/Africa); cost barrier ($5K-$300K+/yr) for 50-70% of providers | None modeled — same structural reason as CSL |
| **m08-internal-denylist** | Provider's own historical denial records + optional cross-provider federation | $0/check (index lookup) | High-confidence (3+ identifiers): auto-deny. Medium: request additional documentation. Appeals: route to compliance lead. | 0 wg stories (deterrence + repeat-offender catching) | Cold-start problem (30-40 of 65+ providers have <5 denial events); first-time offenders invisible; cross-provider sharing legally blocked (DOJ 2023 safe-harbor withdrawal); identifier drift/reconstitution | None modeled — no wg story models a previously-denied customer re-entering |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

The by-measure attacker mapping file states clearly: **no wg attacker story engages measure 08.** All 19 branches model attackers at clean US/European R&E institutions or constructing fresh US entities. None operate from denied-parties-listed institutions. This produces a unique situation for the coverage gap analysis:

1. **Zero adversarial test surface.** Every M08 idea's bypass_methods_known and bypass_methods_uncovered fields read "None -- no wg attacker stories engage this measure." The coverage gap cross-cut cannot identify which gaps matter adversarially because the threat model contains no adversary who would be caught. This is not a deficiency of the ideas -- it reflects the threat model's scope. The wg branches model attackers who specifically select clean institutions to avoid triggering denied-parties screens.

2. **Regulatory compliance is the binding value.** All three ideas are justified by legal obligation (EAR, OFAC, potentially EU/UK sanctions) and audit-readiness, not by resistance against the modeled adversarial threat set. Providers who export controlled materials are likely already legally required to screen institutions against sanctions lists.

### Complementary gaps (within the regulatory-compliance frame)

| Gap | Present in | Closed by | Notes |
|---|---|---|---|
| Non-US sanctions (EU, UK, UN without US parallel) | bis-entity-csl (US-only) | commercial-pep-watchlist (multi-jurisdiction) | Estimated ~10-20% of globally relevant sanctioned entities covered only by non-US lists |
| Unlisted subsidiaries (OFAC 50% rule) | bis-entity-csl (flat list, no ownership graph) | commercial-pep-watchlist (Sayari/Bridger have beneficial-ownership graphs) | Partial closure: vendor BO graphs may lag weeks-to-months |
| Repeat offenders at same provider | bis-entity-csl, commercial-pep-watchlist (look at external lists only) | internal-denylist | Only catches entities previously denied by the same provider |
| Beneficial-owner reconstitution (new LLC, same principal) | bis-entity-csl, commercial-pep-watchlist (name-based matching) | internal-denylist (BO matching field) | Requires separate BO data collection, which is a prerequisite |
| Pre-listing intelligence / adverse media | bis-entity-csl (government lists only) | commercial-pep-watchlist (adverse-media component) | Catches entities of concern before formal government designation |
| Cost barrier for small providers | commercial-pep-watchlist ($5K-$300K+/yr) | bis-entity-csl ($0, free federal API) | CSL is the minimum viable screen; commercial layer is incremental |
| Cold-start / empty denylist | internal-denylist | Not closable internally; requires cross-provider sharing | DOJ 2023 safe-harbor withdrawal blocks the natural solution |

### Net coverage estimate

The coverage question for M08 is best framed as regulatory completeness rather than adversarial resistance:
- **bis-entity-csl alone** provides the US-jurisdiction legal minimum. Estimated to cover ~80-90% of US-relevant sanctioned entities.
- **bis-entity-csl + commercial-pep-watchlist** provides multi-jurisdiction coverage plus adverse-media intelligence. Covers an estimated ~90-95% of globally relevant sanctioned entities, plus pre-listing signals.
- **All three ideas** add repeat-offender catching and BO cross-referencing from the internal denylist.

Against the modeled threat set: **none** of the attacker stories would be caught regardless of which M08 ideas are deployed. The net adversarial coverage is zero -- by design of the threat model, not by deficiency of the ideas.

## 3. Bypass cross-cut

### Universally uncovered bypasses

Because no wg attacker story engages M08, the "bypass" analysis takes a different form. The structural reason all stories evade M08 is uniform:

1. **Attacker institution selection rule: choose clean institutions.** Every wg branch selects its host institution specifically for clean sanctions/denied-parties status. Exploit-affiliation branches target US R1 universities, community colleges, hospital systems. Purpose-built-organization branches construct fresh US LLCs and nonprofits that are by construction not on any denied-parties list. The foreign-institution branch targets "legitimate mid-tier R1 equivalents" in countries with clean export-control posture. The attacker's institution-selection strategy renders M08 structurally irrelevant to the modeled threat set.

### Bypass methods caught by at least one idea

None within the wg threat model. In a hypothetical extension where an attacker operates from a denied-parties-listed institution:
- **bis-entity-csl** would catch direct name matches on US lists.
- **commercial-pep-watchlist** would catch multi-jurisdiction matches and adverse-media signals.
- **internal-denylist** would catch repeat offenders.

### Attacker stories where every idea fails

All 19 wg attacker branches pass all three M08 ideas by construction. The branches were designed to evade institution-level denied-parties screening. If a future wg branch models attackers at sanctioned institutes (e.g., Iranian or DPRK research facilities), this analysis should be revisited.

## 4. Bundling recommendations

**Recommended minimum: bis-entity-csl (mandatory for US-jurisdiction providers).**

The free CSL API is the minimum viable denied-parties screen. At $0/check and ~$5-10K setup, it provides:
- Coverage of 13 US restricted-party lists with daily refresh
- Fuzzy-name matching to catch alias variants
- Auditable record satisfying EAR section 762 retention requirements
- Compliance with the legal obligation that is likely already binding on any provider exporting controlled materials

This should be deployed by every provider regardless of whether the modeled threat set engages M08.

**Recommended tier 2: bis-entity-csl + commercial-pep-watchlist (for providers with global customer bases or regulatory ambition).**

Adding a commercial vendor provides:
- Multi-jurisdiction sanctions (EU, UK, UN, regional) closing the ~10-20% non-US gap
- Adverse-media intelligence providing pre-listing warning signals
- Beneficial-ownership graphs partially closing the subsidiary gap
- PEP screening for institutional officers

The decision hinges on cost-benefit: $5K-$300K+/yr is significant, and an estimated 50-70% of providers by count may find it prohibitive. For providers with heavily US-academic customer bases and low international exposure, the incremental coverage over the free CSL may not justify the cost. For providers with globally diverse customer bases or those seeking to demonstrate best-in-class compliance, the commercial layer is warranted.

**Recommended tier 3: all three ideas (for established high-volume providers).**

Adding the internal denylist provides:
- Repeat-offender catching (compounding value over time)
- Beneficial-owner cross-referencing (catches reconstituted entities)
- Deterrence signal (customers know permanent bans apply)
- Foundation for future cross-provider sharing if legal barriers are resolved

The setup cost (~$25-75K engineering + $25-50K legal for cross-provider scoping) is justified only for providers with sufficient denial history to populate the list and compliance teams to maintain it. The cold-start problem means small/new providers derive minimal value.

**Cross-provider sharing: the highest-impact improvement, currently blocked.**

The single most impactful enhancement to M08 would be cross-provider denylist sharing through IGSC or IBBIS as an independent administrator. Without sharing, an entity denied by one provider has 60+ alternatives. With sharing, the effective denylist grows by orders of magnitude. The DOJ's February 2023 withdrawal of the information-sharing safe harbor creates legal uncertainty. Antitrust counsel should evaluate whether a narrowly scoped biosecurity denylist, administered by an independent third party with procompetitive justification, is defensible under the rule of reason. This is a policy recommendation, not an implementation recommendation.

**What M08 cannot address within the current threat model:** All 19 wg branches deliberately select clean institutions. M08's value is insurance against the threat model's blind spot -- adversaries who do not bother to select clean institutions, or who are associated with institutions that become sanctioned after the initial relationship. The measure's regulatory-compliance value is independent of the threat model and remains high.
