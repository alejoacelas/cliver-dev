# Measure 01 — Sanctions Name Screen: Per-measure Synthesis

## 1. Side-by-side comparison of selected ideas

| Field | OFAC SDN + Consolidated (`m01-ofac-sdn`) | UN/EU/UK/CA/AU sanctions union (`m01-global-sanctions-union`) | Daily delta re-screening (`m01-delta-rescreen`) |
|---|---|---|---|
| **Marginal cost** | $0 (self-hosted SLS) or EUR 0.10/call (OpenSanctions) | EUR 0.10/call (OpenSanctions, same call as OFAC) or $0 (self-hosted, 5 parsers) | $0 (free delta files); trivial compute | 
| **Setup cost** | 1-3 engineer-weeks | 2-4 engineer-weeks (if self-hosted); 0 incremental (if via OpenSanctions, bundled with OFAC) | 1-2 engineer-weeks |
| **Attacker stories addressed** | Zero (all 19 wg branches trivially clear) | Zero (all 19 wg branches trivially clear) | Zero (all 19 wg branches trivially clear) |
| **Coverage gaps** | (1) Non-US persons not on OFAC lists — no signal. (2) Common-name false positives concentrated on Chinese/Iranian/Russian customers. (3) Missing secondary identifiers block disambiguation. (4) No non-US jurisdictional coverage. | (1) Customers in countries with no sanctions program presence (~20-30% of global customers) — no signal. (2) Transliteration/script-variant misses. (3) Actors on lists outside the 5-list union (Japan, Korea, India, Israel). (4) Generic entity-name collisions. | (1) Customers never designated — zero signal. (2) Identifier drift since onboarding — weak signal. (3) Non-aggregated or slow-feed lists — delayed detection. (4) Surge-day operational degradation. |
| **False positives** | Common-name collisions (dominant); weak-alias matches; transliteration borderlines; missing-identifier ambiguity. Concentrated on Chinese, Iranian, Russian researchers. | All of OFAC's plus: larger alias surface from 5-list union; multi-list pileup creating false high-confidence; country-of-origin bias amplified. | Same as onboarding but bursty; identifier-drift spurious matches; FtM entity-ID instability; surge-day overload (5-20 false positives per bulk-designation day at ~1,000 customers). |
| **Bypass methods known** | None | None | None |
| **Bypass methods uncovered** | None — no attacker stories engage this measure | None — no attacker stories engage this measure | None — no attacker stories engage this measure |
| **Flags thrown** | `ofac_sdn_hit`, `ofac_consolidated_hit`, `ofac_weak_alias_hit` | `un_hit`, `eu_fsf_hit`, `uk_ofsi_hit`, `ca_sema_hit`, `au_dfat_hit`, `multi_jurisdiction_hit` | `delta_new_hit`, `delta_addr_change_hit`, `delta_dataset_added` |

## 2. Coverage gap cross-cut

### Structural gaps shared across ALL three ideas

These gaps are inherent to list-based sanctions screening and cannot be closed by combining ideas within this measure:

1. **Zero signal on unlisted actors.** All three checks share the fundamental limitation that absence from a sanctions list provides no information about biosecurity intent. Every modeled attacker trivially clears all three checks. This is structural to list-based screening and can only be addressed by measures outside M01.

2. **Transliteration and script-variant fragility.** All three checks use fuzzy name matching against Latin-script databases. Non-Latin names (Chinese, Arabic, Cyrillic) produce both false negatives (true positives missed due to romanization mismatch) and false positives (wrong people flagged). The union of more lists (m01-global-sanctions-union) increases alias surface but does not solve the underlying transliteration problem.

3. **Dependence on secondary identifiers for disambiguation.** All three checks require DOB, nationality, and address to resolve fuzzy matches. If the customer record lacks these fields, every check degrades to an unresolvable ambiguity. This is a shared upstream data-quality dependency.

4. **Discriminatory false-positive burden.** All three checks disproportionately flag customers from Iran, Russia, China, and DPRK due to name-space overlap with sanctioned individuals from those countries. This is structural to the lists themselves.

### Complementary pairings that close gaps

| Gap | Closed by pairing | Mechanism |
|---|---|---|
| OFAC-only screening has no non-US jurisdictional coverage | OFAC + Global Union | Global Union adds UN/EU/UK/CA/AU lists, closing the ~63% non-US market jurisdictional gap. Via OpenSanctions, this is the same API call. |
| Onboarding-time screening misses post-designation events | Onboarding (OFAC + Global Union) + Delta Re-screen | Delta re-screen catches customers designated after onboarding, closing the temporal gap. |
| Single-list hits lack confidence | Global Union alone | The `multi_jurisdiction_hit` flag (match on 2+ independent lists) provides a high-confidence signal that single-list screening cannot. |

## 3. Bypass methods uncovered cross-cut

**No bypass methods were identified for any selected idea.**

This is not because the stack is robust against adversaries — it is because no modeled attacker stories engage sanctions name screening at all. All 19 wg attacker branches model actors whose names trivially clear sanctions lists by construction. The attacker mapping file explicitly states:

> "A measure-01 bypass would require the attacker (or impersonated identity) to actually be on a designated-persons list and engineer their way past the screen. None of the wg branches model that adversary."

The entire selected stack is therefore untested against adversarial scenarios. The absence of bypass methods is an artifact of the attacker model, not evidence of stack strength.

## 4. Structural gaps that no selected idea addresses

These are open issues that the full M01 selected stack (all three ideas combined) does not resolve:

### 4.1 No adversarial detection capability

**Severity: fundamental.** The entire M01 measure provides zero signal against the modeled threat population. Every attacker in the wg model uses a real, non-sanctioned identity. M01 is a legal compliance layer, not a biosecurity detection tool. Any biosecurity detection value must come from other measures (M02+).

### 4.2 Lists outside the 5+OFAC union

**Severity: moderate.** Japan, South Korea, India, and Israel maintain independent sanctions/denial lists not included in the 5-list union. Actors designated only on these lists would pass. OpenSanctions aggregation partially mitigates this (328 sources), but coverage completeness for these specific lists is not confirmed.

### 4.3 Entity screening vs. person screening

**Severity: moderate.** The selected stack focuses on customer name screening. None of the three ideas explicitly screen the ordering entity (university department, company, lab) against sanctions lists as a separate entity-level check. OFAC and international lists include designated entities (companies, organizations, vessels), but the screening pipeline as described treats the customer name as the primary input. An attacker ordering through a non-sanctioned shell entity with a non-sanctioned individual contact would pass all three checks even if the shell entity's beneficial owner is sanctioned.

### 4.4 No coverage for sanctioned-jurisdiction routing

**Severity: moderate.** The attacker mapping notes that some branches discuss sanctioned-jurisdiction routing (shipments routed through third countries to reach sanctioned destinations), but none of the three selected ideas screen shipment destinations or end-use locations against sanctions. Name screening catches the person, not the destination. Destination screening is a separate measure concern.

### 4.5 Commercial OpenSanctions license cost unknown

**Severity: operational.** All three ideas depend on OpenSanctions for the recommended implementation path. The commercial license cost is vendor-gated and required for any commercial deployment. This is a shared blocking dependency.

### 4.6 Secondary-identifier collection policy undefined

**Severity: operational.** The effectiveness of all three checks depends on collecting DOB, nationality, and address at customer signup. Whether synthesis providers currently collect this data, whether customers will tolerate providing it, and what the fallback policy is for incomplete records are unresolved operational questions that affect the entire M01 stack.

### 4.7 Surge-day staffing model undefined

**Severity: operational.** Delta re-screening creates acute reviewer workload spikes on bulk-designation days (8 events of 100+ entries in 2024). The staffing model for handling these surges — including the acceptable duration of account freezes for legitimate customers — requires operational planning.
