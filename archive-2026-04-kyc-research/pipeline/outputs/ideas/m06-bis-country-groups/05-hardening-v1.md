# m06-bis-country-groups — bypass-aware hardening v1

**Idea under review:** `outputs/ideas/m06-bis-country-groups/04-implementation-v1.md`
**Measure:** M06 — shipping-export-country (Screen shipping address for countries subject to broad export restrictions)

---

## Attacker story walk

### foreign-institution

**Summary:** Attacker claims affiliation with a foreign academic institution (Brazil, Japan, India, Indonesia, Vietnam, CIS) and ships synthesis to that foreign country, then re-exports or self-collects.

**Bypass methods relevant to M06:**

1. **In-country freight forwarder + fabricated "satellite office" framing (Method 1).**
   - **MISSED.** The attacker ships to Brazil, Japan, India, Indonesia, or Vietnam — none of which are in Country Group E:1/E:2 (embargoed) or even D:1 for most ECCNs. The Country Group check returns no flag for these destinations. The freight forwarder then re-exports to the actual intended destination, which could be in Group E — but the re-export step is invisible to the provider's shipping screen because the provider's order shows the forwarder's address in a non-restricted country. The check only sees the first-hop destination.
   - **Which field fails:** `country_groups` returns benign groups for Brazil (A:1), Japan (A:1), India (D:2, D:4 — flagged only for NS2, MT2, NP2 reasons, which are unlikely to apply to EAR99 synthesis), Vietnam (D:3, D:4). The check does not see the re-export destination unless the customer discloses it.
   - **Partial mitigation:** The implementation includes a `reexport_disclosed_to_e` flag — but this depends entirely on the customer's voluntary disclosure. An attacker will not disclose the re-export destination.

2. **In-country customs broker (Method 6).**
   - **MISSED.** Same analysis — the customs broker consolidates re-export into one step, but the provider's order still shows a non-restricted destination country.

**Net assessment:** The Country Group check does NOT catch the foreign-institution branch's primary strategy, which is specifically designed around shipping to "broadly legitimate" foreign academic destinations that are not comprehensively sanctioned, with re-export as a separate step. The attacker deliberately avoids Group E destinations as the first hop. The check's value is limited to catching naive attackers who ship directly to embargoed countries — but the foreign-institution branch is explicitly not naive about this.

---

## Findings

### Critical

None. The mapping file's own notes acknowledge that "only foreign-institution ships to a foreign country as the primary path" and that "the foreign-institution branch deliberately picks 'broadly legitimate' foreign academic destinations precisely to avoid the export-country flag." The implementation's inability to see re-export is a known structural limitation of any shipping-address-based check, not a gap in this specific implementation. The check is designed to catch direct shipments to Group E/D countries, which it does correctly.

### Moderate

1. **Re-export to embargoed destinations is invisible unless customer discloses (foreign-institution Methods 1 and 6).**
   - Why missed: The check operates at the first-hop shipping address. Re-export through a non-restricted intermediary country is invisible. The `reexport_disclosed_to_e` flag depends on voluntary disclosure — an adversary will not disclose.
   - Suggestion: This is structural for any address-based check. Mitigation would require: (a) end-use/end-user certificates for international shipments, (b) freight-forwarder screening (handled by m06-freight-forwarder-denylist), or (c) post-shipment monitoring. The m06-bis-country-groups implementation should cross-reference with m06-freight-forwarder-denylist when the destination is international, to add a layer. Stage 4 could note this cross-reference dependency explicitly.

2. **India and Vietnam produce D-group flags that are noisy for legitimate customers but easy for attackers to navigate.**
   - India is in D:2, D:4; Vietnam is in D:3, D:4. For EAR99 items (the vast majority of synthesis orders), these D-group memberships do not trigger a license requirement — the Country Chart only fires for controlled ECCNs. An attacker shipping EAR99 items to India or Vietnam produces no flag at all. The D-group flags fire only for 1C353 items, which the attacker can avoid by ordering non-SOC sequences.
   - Suggestion: Not a gap in the implementation — the EAR licensing matrix is working as designed. But it means the check has zero leverage against the foreign-institution branch when the ordered item is EAR99.

### Minor

3. **Country name normalization dependency on m06-iso-country-normalize is correctly identified but creates a single-point-of-failure risk.**
   - If normalization fails (e.g., "Korea" without "North" or "South" qualifier), the check either blocks Korea, South (false positive) or passes Korea, North (catastrophic miss). The implementation correctly flags `country_group_unmapped` for this case, but the failure mode is severe.
   - Suggestion: Stage 4 could add a "default-deny on ambiguous Korea" rule: if the token "Korea" appears without a clear North/South disambiguator, treat as Group E until resolved.

4. **Sub-region sanctions (Crimea, DPR, LPR) depend on m06-iso-country-normalize rather than this check.**
   - The implementation correctly delegates sub-region handling, but the Country Group check alone would pass "Ukraine" or "Russia" without flagging occupied territories.
   - Suggestion: Already handled by design (dependency on m06-iso-country-normalize). No change needed.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| foreign-institution Method 1 (freight forwarder to non-restricted country, then re-export) | MISSED |
| foreign-institution Method 6 (customs broker, same re-export pattern) | MISSED |
| foreign-institution Methods 2, 4, 5 (ship to non-restricted country directly) | MISSED (destination not in E/D for relevant ECCNs) |

## bypass_methods_uncovered

- foreign-institution Method 1: freight forwarder re-export through non-restricted intermediary — structural, invisible to first-hop address check
- foreign-institution Method 6: customs broker re-export — structural, same
- foreign-institution Methods 2/4/5: ship to non-restricted country (Brazil, Japan, India, Indonesia, Vietnam) — structural, these countries are not embargoed

---

**Verdict: PASS**

No Critical findings. The foreign-institution branch's bypass strategy is explicitly designed to avoid the export-country flag by shipping to non-embargoed intermediary countries. This is a known structural limitation of address-based export screening, acknowledged in the mapping file's own notes. The implementation correctly handles its designed scope (direct shipments to Group E/D countries) and correctly delegates re-export risk to other measures (freight-forwarder denylist, end-use monitoring). The Moderate findings are structural or already addressed by cross-measure dependencies.
