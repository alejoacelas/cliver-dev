# Measure 08 — Institution Denied Parties: Per-Measure Synthesis

## Selected stack

| Field | m08-bis-entity-csl | m08-internal-denylist |
|---|---|---|
| **Name** | BIS Entity List + Consolidated Screening List | Internal institution denylist |
| **Summary** | Screen institution name against the US CSL (13 US restricted-party lists) via free ITA API; high-confidence hit = hard block, low-confidence = manual review | Per-provider internal DB of previously-declined institutions + identifiers; multi-identifier fuzzy match on every order; high-confidence hit = hard block |
| **Attacker stories addressed** | None — no wg branches operate from denied-parties-listed institutions | None — denylist patterns (repeat offenders, BO laundering) are real but not modeled in wg branches |
| **External dependencies** | ITA Consolidated Screening List API (free); optional OpenSanctions overlay | Internal database (Postgres/DynamoDB); identity normalization library; optional IGSC federation (legally blocked) |
| **Marginal cost per check** | $0 (API is free) | $0 (index lookup) |
| **Setup cost** | ~$5-10k (1 engineer-week) | ~$25-75k (4-8 engineer-weeks + legal review); +$25-50k if pursuing cross-provider sharing |
| **Key flags** | `csl_entity_hit_high_confidence`, `csl_entity_hit_low_confidence`, `csl_alt_name_hit`, `csl_uvl_hit` | `internal_denylist_hit_high_confidence`, `internal_denylist_hit_medium_confidence`, `internal_denylist_name_only_collision`, `internal_denylist_beneficial_owner_match` |
| **Manual review trigger** | Score 0.6-0.9, or score >= 0.9 with address mismatch, or UVL hit | 1-2 identifier matches (medium confidence) or BO match on different institution |
| **False-positive profile** | Common-name collisions esp. Chinese/Russian institutions (~5-15% of queries); industry-wide sanctions FP rate up to 95% for common names | Name collisions with unaffiliated legitimate institutions; successor orgs incorrectly blocked; payment-instrument hash collisions |
| **Primary value** | Regulatory compliance + audit-readiness; legally required for US-jurisdiction providers | Deterrence + repeat-offender blocking + cross-measure memory layer; compounds in value over time |

## Coverage gap cross-cut

### Structural gaps (inherent to the data sources, not fixable by tuning)

| Gap | CSL | Denylist | Status |
|---|---|---|---|
| Non-US sanctions (EU, UK, UN designations without US parallel) | **Gap 1** — ~10-20% of globally sanctioned entities invisible | Not applicable (captures only provider-specific denials) | **Open.** Mitigable via OpenSanctions supplement or commercial vendor; neither selected idea closes it |
| Unlisted subsidiaries / ownership graphs | **Gap 2** — CSL is flat; OFAC 50% rule unenforceable via API | Partially addressed if BO matching is populated | **Open.** Requires external ownership data (Sayari, OpenCorporates) |
| First-time bad actors | Not applicable (list-based) | **Gap 2** — purely retrospective, zero predictive power | **Open.** Structural limitation of any retrospective list |
| Cross-provider sharing blocked | Not applicable | **Gap 3** — DOJ withdrew safe harbor Feb 2023; entity denied by one provider has 60+ alternatives | **Open.** Legally blocked; single most impactful improvement if unlocked |
| Cold-start problem | Not applicable | **Gap 1** — ~30-40 of 65+ providers have <5 denial events | **Open.** Unavoidable for new/small providers; compounds over time |

### Complementary gaps (addressable through stack composition or tuning)

| Gap | Source | How the other idea helps |
|---|---|---|
| Transliteration misses (~5-10% of non-Latin names) | CSL Gap 3 | Denylist can store canonical + variant transliterations from prior encounters, improving future matching |
| Identifier drift / reconstitution | Denylist Gap 4 | CSL catches the entity if it is eventually sanctioned; BO matching in denylist is the primary defense |
| 24h lag window on new designations | CSL Gap 4 | Denylist is independent of external update cadence; irrelevant to this gap but does not worsen it |
| Undocumented aliases | CSL Gap 5 | Denylist accumulates aliases from prior screening encounters |
| False positives from common names | CSL Gap 6 | Denylist's multi-identifier matching (3+ identifiers for auto-deny) provides higher-specificity signal that can disambiguate CSL near-matches |

## Bypass methods uncovered

**No wg attacker stories engage measure 08.** All 19 wg branches model attackers whose host institutions trivially clear denied-parties screening by construction:

- Branches at real institutions (`visiting-researcher`, `unrelated-dept-student`, `insider-recruitment`, `lab-manager-voucher`, `bulk-order-noise-cover`, `inbox-compromise`, `credential-compromise`, `account-hijack`, `dormant-account-takeover`, `it-persona-manufacturing`) target clean US/European R1 universities, colleges, hospitals, or core facilities.
- The `foreign-institution` branch operates at legitimate mid-tier non-Anglophone universities (Brazil, Japan, India, Indonesia, Vietnam, CIS) — none on denied-parties lists.
- Purpose-built-organization branches (`shell-company`, `shell-nonprofit`, `cro-framing`, `cro-identity-rotation`, `biotech-incubator-tenant`, `gradual-legitimacy-accumulation`, `community-bio-lab-network`, `dormant-domain`) construct fresh, clean US entities that are by construction absent from any denied-parties list.

**Zero attacker stories survive because zero attacker stories engage the measure.** This is not a finding of robustness — it is a finding that the modeled adversaries do not attack through this surface. A future wg branch covering attackers at sanctioned institutes (e.g., Iranian IRGC-affiliated universities, DPRK research institutes) would change this assessment.

## Structural gaps flagged as open issues

1. **Non-US sanctions coverage (CSL Gap 1).** The selected stack screens only US-origin lists. Entities sanctioned by EU, UK, or UN but not designated by the US (~10-20% of globally relevant sanctioned entities) pass undetected. Mitigation: add OpenSanctions as a third parallel screen (open-source, CC-BY-SA, multi-jurisdiction) at minimal cost; accept lower data quality and update cadence vs. commercial vendors.

2. **Subsidiary/ownership-graph blindness (CSL Gap 2).** The CSL is a flat name list. OFAC's 50% rule requires independent ownership research the API does not support. The denylist's BO matching partially addresses this but only for previously-encountered entities. Closing the gap structurally requires an external ownership-graph data source.

3. **Cross-provider denylist sharing legally blocked (Denylist Gap 3).** DOJ withdrew the information-sharing safe harbor in February 2023. IGSC does not publicly document a shared customer denylist. An entity denied by one provider can order from 60+ others. This is the single most impactful coverage improvement for M08 but requires antitrust counsel to confirm defensibility (~$25-50k initial engagement).

4. **No wg attacker branch models a denied-parties adversary.** The entire M08 stack is untested against adversarial scenarios. If the threat model expands to include attackers operating from sanctioned institutions, both the CSL screen and the denylist need re-evaluation for bypass resistance.

5. **GDPR right-to-erasure vs. denylist retention (Denylist Gap 6).** EU-based customers can request erasure of denylist records. Whether Article 17(3)(e) exemption (data needed for defense of legal claims) applies to biosecurity denylists is untested. Requires legal opinion.

6. **CSL API rate limit unpublished.** Exact per-minute/per-day quota not documented by ITA. Providers with high screening volume should confirm capacity or fall back to the bulk-download option.

7. **EAR section 762 retention period (best guess).** The 5-year record retention requirement cited in CSL synthesis has not been directly verified against the regulation text. Must be confirmed before operationalizing.
