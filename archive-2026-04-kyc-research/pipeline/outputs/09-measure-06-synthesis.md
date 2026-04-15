# Stage 9 — Per-measure synthesis: M06 (shipping-export-country)

## Measure summary

**Practice:** Shipping address
**Process:** Screen shipping address for countries subject to broad export restrictions.
**Flag triggers:** Shipping address in country subject to comprehensive sanctions or export restrictions.
**Follow-up:** Deny.

---

## 1. Side-by-side table of selected ideas

| Field | m06-iso-country-normalize | m06-bis-country-groups | m06-bis-entity-list | m06-hs-eccn-classification |
|---|---|---|---|---|
| **Name** | ISO 3166 normalization + sanctioned-territory geofence | BIS Country Group D/E + EAR licensing matrix | BIS Entity List + DPL + UVL + MEU consignee screen | HS code / ECCN classification SOP |
| **Type** | Automated local lookup | Automated local lookup | Automated API query | Human SOP |
| **Attacker stories** | foreign-institution (CIS variant) | foreign-institution (re-export step) | foreign-institution (re-export consignee); any known restricted party | foreign-institution (re-export of controlled items) |
| **Marginal cost** | $0 (open data); $0.005-$0.015/addr (vendor) | $0 (local table) | $0 (federal API) | ~$0 (EAR99 path); $15-$45/case (1C353 path) |
| **Setup cost** | $5K-$15K | $5K-$15K + ~$2K/yr refresh | $3K-$10K | $10K-$30K |
| **Auto-deny triggers** | Sanctioned sub-region geofence hit | Country Group E destination | Entity List or DPL match | None (feeds into country-groups) |
| **Escalation triggers** | Country-code mismatch; unrecognized token; sanctioned-locality keyword | Group D + license required | UVL hit; MEU hit; fuzzy match in review band | 1C353 classification; ambiguous hazard analysis |
| **Key dependencies** | None (foundation layer) | m06-iso-country-normalize + m06-hs-eccn-classification | None (runs independently) | Upstream sequence-screening pipeline |
| **FP character** | Near-zero (sanctioned-territory orders are extremely rare) | Moderate for 1C353 orders to Group D (~25-35% of intl orders); near-zero for EAR99 | 90-95% FP rate on hits (common-name collisions); low absolute volume | ~5% SOC screening triggers; most resolve to EAR99 |
| **Record retention** | 5 yr (BIS + OFAC) | 5 yr (BIS) | 5 yr (BIS) | 5 yr (BIS) |

---

## 2. Coverage gap cross-cut

### Structural gaps (inherent to M06 as an address-based measure)

These gaps cannot be closed by any idea within M06. They are architectural limits of screening against the declared first-hop shipping address.

| # | Gap | Affected ideas | Why structural |
|---|---|---|---|
| S1 | **Re-export/transshipment invisibility** | All four | All checks operate on the declared destination. An attacker shipping to a non-embargoed intermediary (Brazil, Japan, India) and re-exporting is invisible. This is the dominant coverage ceiling for M06. |
| S2 | **EAR99 items to Group D destinations** | bis-country-groups, hs-eccn-classification | The EAR does not control EAR99 items. ~95% of orders are EAR99 and pass the Country Chart with no flag for any non-embargoed destination. |
| S3 | **Denylist-only coverage** | bis-entity-list | >99% of customers are unlisted. The check produces zero signal for unlisted parties, including novel shell companies and accomplices at legitimate institutions. |
| S4 | **Novel/chimeric sequences not on SOC list** | hs-eccn-classification | The SOC list is backward-looking. Engineered sequences not matching known agents default to EAR99 without triggering any classification review. |
| S5 | **Non-US-jurisdiction providers** | hs-eccn-classification | The ECCN framework is US-specific. Non-US providers (45-60% of global market) operate under different export-control regimes. Not addressable within M06. |

### Complementary gaps (addressable by specification refinement or cross-measure pairing)

| # | Gap | Affected ideas | Recommended mitigation |
|---|---|---|---|
| C1 | **Russian-administered postal codes for occupied territories** | iso-country-normalize | Add postal-code-to-region mapping (Pochta Rossii 29xxxx for Crimea, new ranges for DPR/LPR/Kherson/Zaporizhzhia). Specification update, not architectural change. |
| C2 | **Non-Latin script geofence keywords** | iso-country-normalize | Expand geofence keyword table to include Cyrillic, Ukrainian, and Russian-language variants. Specification update. |
| C3 | **Non-Latin script transliteration for CSL queries** | bis-entity-list | Prescribe a transliteration step (dual-query: original script + transliterated) before CSL lookup. Specification update. |
| C4 | **Intermediary name parsing from address fields** | bis-entity-list | Specify whether "c/o", "ship to", and forwarder names are separately screened against CSL. Implementation specification gap. |
| C5 | **Upstream screening pipeline sensitivity** | hs-eccn-classification | Periodic calibration of screening pipeline against 1C351/1C354 agent list. Cross-measure dependency. |
| C6 | **Address masking (VPN, re-mailing, virtual offices)** | iso-country-normalize | Not addressable within M06. Requires complementary checks from M03 (PO box regex, USPS RDI/CMRA) and IP geolocation. |
| C7 | **Partial-oblast sanctions boundary** | iso-country-normalize | Distinguishing occupied vs. unoccupied Donetsk/Luhansk/Kherson/Zaporizhzhia has no clean off-the-shelf solution. Over-blocks government-controlled areas. Requires ongoing front-line monitoring and OFAC guidance. |
| C8 | **50% Affiliates Rule CSL API coverage** | bis-entity-list | Unknown whether the ITA API enumerates affiliates post-September 2025 rule. If not, compliance burden falls on exporter due diligence. |

---

## 3. Bypass methods surviving the entire selected stack

The attacker mapping identifies one engaging branch: **foreign-institution** (fake-affiliation profile). Below, each bypass method from that branch is evaluated against the full four-idea stack.

| Bypass method | iso-country-normalize | bis-country-groups | bis-entity-list | hs-eccn-classification | Survives stack? |
|---|---|---|---|---|---|
| **Method 1:** In-country freight forwarder + fabricated satellite office (ship to forwarder in non-sanctioned country, re-export) | MISSED — no geofence signal | MISSED — first-hop is non-embargoed | AMBIGUOUS — depends on whether forwarder is listed and whether forwarder name is parsed from address | CAUGHT only if 1C353 + non-AG destination; MISSED for EAR99 | **YES** — survives for EAR99 orders and for orders where forwarder is unlisted |
| **Method 2:** Accomplice at real non-sanctioned institution | MISSED — legitimate country | MISSED — non-embargoed destination | MISSED — consignee is a legitimate university | CAUGHT only if 1C353 + non-AG destination | **YES** — survives for EAR99 orders |
| **Method 4/5:** Residential or virtual office address in non-sanctioned country | MISSED — legitimate country | MISSED — non-embargoed destination | MISSED — unlisted attacker name | CAUGHT only if 1C353 + non-AG destination | **YES** — survives for EAR99 orders |
| **Method 6:** In-country customs broker (consolidates re-export) | MISSED — legitimate country | MISSED — non-embargoed destination | AMBIGUOUS — depends on whether broker is listed | CAUGHT only if 1C353 + non-AG destination | **YES** — survives for EAR99 orders |
| **CIS variant:** Ship to sanctioned territory (Crimea, DPR, LPR) | **CAUGHT** — geofence hit (if keyword present); MISSED if postal-code only or Cyrillic-only | CAUGHT — Group E or sanctioned sub-region | CAUGHT if consignee is listed | CAUGHT if 1C353 | **NO** — caught by geofence (with caveats on postal-code-only and Cyrillic-only addresses) |

### Summary

All non-CIS foreign-institution bypass methods survive the full M06 stack when the ordered sequences are EAR99 (estimated ~95% of orders). The stack catches these methods only when:
- The ordered item is classified as 1C353, AND
- The destination is a non-AG-member country (India, Brazil, Indonesia, Vietnam — but NOT Japan, which is AG-exempt post-December 2023).

The CIS variant (shipping to occupied Ukrainian territories) is the only scenario where the stack has strong, multi-layered coverage — and even there, two specification gaps (postal-code-only addresses and Cyrillic-only territory names) could allow bypass.

The attacker mapping notes that the foreign-institution branch deliberately picks "broadly legitimate" foreign academic destinations to avoid the export-country flag. This is the branch's core design, and M06 is structurally unable to counter it for uncontrolled items. The attacker mapping itself acknowledges that foreign-institution is only "weakly engaging" for M06.

---

## 4. Structural gaps flagged as open issues

### Issue 1: Re-export invisibility is the dominant coverage ceiling

All four selected ideas screen against the declared first-hop shipping address. The foreign-institution branch's core strategy — ship to a non-embargoed intermediary, then re-export — is invisible to the entire M06 stack. This is not a design failure but a structural limit of address-based screening. Mitigation lives in other measures: end-use verification, institutional due diligence (M07), and post-shipment monitoring. The dropped freight-forwarder denylist (m06-freight-forwarder-denylist) would have provided marginal, reactive coverage of this gap but was correctly deprioritized given its high curation cost and narrow reach.

### Issue 2: EAR99 default removes leverage on ~95% of orders

The EAR framework does not control EAR99-classified items. Since an estimated ~95% of synthesis orders are EAR99, the Country Chart lookup (m06-bis-country-groups) and the ECCN classification SOP (m06-hs-eccn-classification) produce no signal for the vast majority of orders to non-embargoed Group D destinations. The stack's export-control leverage is concentrated on the ~5% of orders that trigger SOC screening and the subset of those that classify as 1C353 — likely <1% of total volume.

### Issue 3: Denylist asymmetry

The Entity List screen (m06-bis-entity-list) produces zero signal for >99% of customers. Its value is real but narrow: it catches the specific case where a known restricted party orders directly or is named as consignee. Against the foreign-institution branch — which uses legitimate, non-listed institutions — the check has near-zero leverage. This is structural to any denylist approach. Positive-verification checks in M07 (institutional due diligence) are the appropriate complement.

### Issue 4: Partial-oblast sanctions boundary has no clean solution

Distinguishing occupied from unoccupied portions of Donetsk, Luhansk, Kherson, and Zaporizhzhia oblasts is an unsolved compliance problem industry-wide. Postal-code-based approaches either over-block (including government-controlled areas) or under-block (missing Russian-reassigned codes). Additionally, Kherson and Zaporizhzhia are NOT in OFAC's comprehensively-sanctioned territory set as of late 2025/early 2026 — the SOP must distinguish comprehensive from sectoral sanctions scope. This distinction could change without legislative action under EO 14065.

### Issue 5: Cross-idea dependency chain creates single points of failure

The stack has a critical dependency chain: m06-iso-country-normalize feeds normalized country codes to m06-bis-country-groups, which also requires ECCN output from m06-hs-eccn-classification. A normalization failure (e.g., "Korea" without North/South qualifier) propagates as a catastrophic mismapping to the Country Chart. An ECCN classification gap (screening pipeline false negative) causes the Country Chart to see EAR99 when the item is actually 1C353. Both dependencies must be operational for the license-required escalation path to function. Only m06-bis-entity-list runs independently.

### Issue 6: Non-Latin script handling is under-specified across the stack

Three ideas face non-Latin script challenges: iso-country-normalize (Cyrillic geofence keywords), bis-entity-list (transliteration before CSL query), and hs-eccn-classification (sequence annotations in non-English). None of the current specifications prescribe a concrete transliteration or multi-script matching approach. Given that APAC customers represent ~23% of the synthesis market and CIS-variant addresses use Cyrillic, this is a cross-cutting specification gap that should be resolved before deployment.

---

## Data-flow summary

```
Order submitted
    |
    v
[m06-iso-country-normalize]         [m06-bis-entity-list]
  - Normalize country to ISO 3166      - Query CSL API (independent)
  - Geofence check                     - Entity List / DPL = auto-block
  - Auto-block on sanctioned sub-region - UVL = soft-block
  |                                     - MEU = escalate
  v
[m06-hs-eccn-classification]
  - SOC hit? No = EAR99, stop
  - Yes = hazard analysis
  - 1C353 = license-required path
  |
  v
[m06-bis-country-groups]
  - Map destination to BIS Country Groups
  - Group E = auto-deny
  - Group D + 1C353 = license required
  - EAR99 to non-E = pass (no signal)
```
