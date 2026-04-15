# Measure 01 — Sanctions name screen: Per-measure synthesis

## 1. Side-by-side comparison table

| Field | m01-ofac-sdn | m01-global-sanctions-union | m01-commercial-watchlist | m01-delta-rescreen |
|---|---|---|---|---|
| **Name** | OFAC SDN + Consolidated screen | UN/EU/UK/CA/AU sanctions union | World-Check / Dow Jones / Bridger | Daily delta re-screening |
| **Data source** | US Treasury SLS (free) or OpenSanctions / ofac-api.com | OpenSanctions aggregation or 5 direct government feeds | LSEG World-Check One, Dow Jones R&C, LexisNexis Bridger | OpenSanctions delta files or OFAC SLS XML diffs |
| **Marginal cost** | $0 self-hosted; ~$0.11 via OpenSanctions | $0 self-hosted; ~$0.11 via OpenSanctions (same call covers OFAC) | [vendor-gated] est. $0.50–$5/check + annual license (low-to-mid 5 figures) | $0 (free delta feeds); compute trivial |
| **Manual review burden** | Common-name false positives, disproportionately Chinese/Iranian/Russian names; ~5–10x elevated FP rate for those groups | Same as OFAC plus wider alias surface from 5-list union; transliteration variants compound | ~90% industry-wide alert FP rate; SOE flags on state-owned university researchers; PEP flags with near-zero biosecurity relevance | Low steady-state; bursty on bulk-designation days (5–20 FPs per surge day for ~1K customer base) |
| **Attacker stories addressed** | 0 of 19 | 0 of 19 | 0 of 19 | 0 of 19 |
| **Headline coverage gap** | No signal for non-OFAC-listed persons; US-jurisdictional only (~63% of market is non-US) | No signal for persons not on any of the 5 lists; ~20–30% of customers in countries with minimal listing activity | Zero predictive power for unknown actors; ~70% of commercial customers return no signal | Zero signal on actors never designated; identifier drift degrades matching over time |
| **Headline uncovered bypass** | None modeled — all 19 attacker stories trivially clear name-based sanctions screening | None modeled — same structural non-engagement | None modeled — same structural non-engagement | None modeled — same structural non-engagement |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Every idea under Measure 01 shares the same fundamental limitation: **sanctions screening is a negative-list approach with zero predictive power for unknown threats.** The following gaps appear in every idea's coverage-gap list:

1. **Novel threat actors.** Customers who are not on any government sanctions or watchlist generate no signal from any M01 idea. This is the dominant gap — the entire threat model posits actors who are, by construction, not designated.
2. **Common-name false positives concentrated on specific nationalities.** Chinese, Iranian, Russian, and Arabic-name customers face structurally elevated false-positive rates across all four ideas. This is a property of the measure, not of any specific implementation.
3. **Missing secondary identifiers.** When customers provide only a name without DOB, nationality, or address, no M01 idea can reliably disambiguate a fuzzy match.

### Complementary gaps

| Gap | Ideas that leave it open | Ideas that close it |
|---|---|---|
| Non-US sanctions jurisdictions (EU, UK, CA, AU) | m01-ofac-sdn (US-only) | m01-global-sanctions-union, m01-commercial-watchlist |
| Post-onboarding designation | m01-ofac-sdn, m01-global-sanctions-union, m01-commercial-watchlist (all onboarding-time only) | m01-delta-rescreen |
| PEP/adverse-media signal | m01-ofac-sdn, m01-global-sanctions-union, m01-delta-rescreen (government lists only) | m01-commercial-watchlist |
| Lists beyond the 5-feed union (Japan, Korea, India, Israel) | m01-ofac-sdn, m01-global-sanctions-union (if direct feeds) | m01-commercial-watchlist (aggregates 300+ sources), m01-global-sanctions-union (if via OpenSanctions) |

### Net coverage estimate

If a provider implemented every M01 idea, **most** legitimate customers would still fall outside any coverage gap — they would simply pass all checks without generating any signal (which is the expected outcome). The coverage gaps are not about missing legitimate customers; they are about the check generating zero discriminatory signal for the vast majority of both legitimate and malicious customers. The measure's coverage of the *threat model* is **none** — zero of 19 modeled attacker stories are addressed, and the structural gap (novel actors not on lists) is unfixable within the measure's design.

## 3. Bypass cross-cut

### Universally uncovered bypasses

**No attacker stories engage this measure at all.** All 19 working-group attacker branches model actors whose names trivially clear sanctions screening by construction. The measure's attacker-by-measure mapping file states: "A measure-01 bypass would require the attacker (or impersonated identity) to actually be on a designated-persons list and engineer their way past the screen. None of the wg branches model that adversary."

This is the strongest possible finding: the measure is structurally orthogonal to the modeled threat set.

### Bypass methods caught by at least one idea

Not applicable — no bypass methods are modeled because no attacker stories engage the measure.

### Attacker stories where every idea fails

All 19 branches pass through every M01 idea without engaging:

- Every branch uses a real legal name and government-issued ID that is not on any sanctions list.
- Entity-creation branches (shell-company, shell-nonprofit, CRO-framing, biotech-incubator-tenant, etc.) use attacker-chosen entity names that do not collide with sanctioned names.
- Account-compromise branches inherit a legitimate researcher's already-cleared identity.
- The foreign-institution branch explicitly excludes sanctioned-jurisdiction operators.

## 4. Bundling recommendations

### Recommended bundle: m01-ofac-sdn + m01-global-sanctions-union + m01-delta-rescreen

This is the **compliance-minimum bundle** for any provider with international shipments:

- **m01-ofac-sdn + m01-global-sanctions-union** can be implemented as a single OpenSanctions API call (EUR 0.10), covering OFAC and all major non-US lists in one check. There is no technical reason to treat these as separate implementations — OpenSanctions bundles them by default.
- **m01-delta-rescreen** closes the post-onboarding gap. Since it uses the same OpenSanctions delta feeds, it shares infrastructure with the onboarding screen. Setup cost is incremental (1–2 engineer-weeks on top of the onboarding pipeline).

This bundle leaves uncovered: PEP/adverse-media signal (low biosecurity relevance) and the fundamental inability to detect novel threat actors.

### m01-commercial-watchlist: conditional add

Adding a commercial watchlist (World-Check, Dow Jones, or Bridger) provides marginal value through PEP screening and adverse-media coverage, but:

- **Cost is disproportionate to biosecurity value.** Annual license fees in the low-to-mid five figures, plus $0.50–$5/check, for a check that addresses zero modeled attacker stories.
- **False-positive burden roughly 10x higher** than government-list-only screening (~90% industry-wide FP rate), predominantly affecting international researchers.
- **PEP status has near-zero correlation with bioweapons intent.** SOE flags on state-owned university researchers are high-volume noise.

A commercial watchlist is justifiable if the provider has regulatory obligations beyond sanctions (e.g., financial-services-adjacent compliance requirements) or if adverse-media screening is valued for reputational risk. It is not justifiable on biosecurity grounds alone.

### What no bundle can fix

No combination of M01 ideas addresses the core structural limitation: **the measure screens against lists of known bad actors, and the biosecurity threat model consists of actors not on those lists.** M01 is table-stakes legal compliance infrastructure. Its biosecurity detection value is approximately zero against the modeled threat set. This is a finding about the measure itself, not about implementation quality — policymakers should treat M01 as a compliance floor, not a security signal.
