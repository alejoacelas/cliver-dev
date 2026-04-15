# M05 — Shipping-Institution-Association: Per-Measure Synthesis

## 1. Side-by-side comparison of selected ideas

| Field | m05-ror-gleif-canonical | m05-two-contact-sop |
|---|---|---|
| **Type** | Automated API check | Manual reviewer SOP |
| **Summary** | Cross-reference shipping address against canonical addresses from ROR, GLEIF, Companies House, augmented by OSM campus polygons and GeoNames coordinates. Resolution cascade from street-level down to city-level fallback. | Reviewer independently locates two contacts from the institution's public directory (phone + email) and confirms customer affiliation and shipping-address authorization. |
| **External deps** | ROR API v2, GLEIF API, UK Companies House API, OSM Overpass API, GeoNames, geocoder, point-in-polygon library | Public institutional directories, reviewer time, telephony, email |
| **Marginal cost** | <$0.02/check | $30–$60/case (30–60 min reviewer time) |
| **Setup cost** | 2–3 engineer-weeks | $5K–$20K (SOP writing, training, templates) |
| **Throughput** | Unlimited (API-based) | ~6–10 cases/day/FTE |
| **Key flags** | `canonical_address_mismatch` (with resolution level), `institution_no_canonical_record`, `institution_status_inactive` | `two_contact_independence_failure`, `two_contact_denied`, `two_contact_unconfirmed`, `two_contact_partial` |
| **Strongest signal** | Street-level mismatch (GLEIF/Companies House) | `two_contact_independence_failure` (no public directory exists — strongest negative signal in M05) |
| **Dominant FP source** | Multi-campus shipping to satellite sites | Industry customers (switchboard won't confirm), GDPR-suppressed EU institutions, single-PI labs |
| **Coverage estimate** | ~80–90% of entities hit at least one registry; ~60–80% of OECD institutions have OSM polygons | ~40–60% of academic customers reliably verifiable; near-zero for industry customers |
| **Audit trail** | Structured log: all canonical addresses, polygon geometry, geocoded coordinates, resolution level, match result, matched IDs | Strongest in pipeline: human-to-human attestation, domain-verified email replies, phone logs, timestamped directory screenshots |

## 2. Coverage gap cross-cut

### Structural gaps (inherent to both ideas combined — cannot be closed within M05)

| Gap | Affected attacker stories | Why structural |
|---|---|---|
| **Post-shipment carrier redirect** (UPS My Choice, FedEx Delivery Manager, USPS COA) | credential-compromise, it-persona-manufacturing, account-hijack | Occurs after provider releases shipment. No pre-shipment address check can detect it. Requires carrier-level controls (M18/M19). |
| **Inside-institution attackers** (genuine affiliation, real campus address) | biotech-incubator-tenant (real bench), visiting-researcher (real appointment), gradual-legitimacy-accumulation (12+ months real presence), it-persona-manufacturing (Sub-paths A/C with directory injection) | Attacker's address IS on campus; both automated polygon check and manual SOP confirm the affiliation. Requires legitimacy checks (M18/M19/M20). |
| **Accomplice at real institutional address** | foreign-institution Method 2 | Institution confirms affiliation; package goes to the institution's own address; accomplice receives and forwards. Post-delivery handoff invisible to M05. |
| **Shell entity whose registered address = shipping address** | shell-nonprofit (if attacker co-locates), cro-framing (executive-suite/coworking paths) | Automated check passes by construction (registered address matches). SOP catches virtual-office paths but executive-suite/coworking paths are AMBIGUOUS — thin institutional presence may or may not fire `two_contact_independence_failure`. |

### Complementary gaps (addressable by tuning, additional data sources, or other measures)

| Gap | Which idea exposes it | Mitigation path |
|---|---|---|
| **Entities not in any registry** (~10–20% of customers) | m05-ror-gleif-canonical (`institution_no_canonical_record`) | Escalate to two-contact SOP (already in composition). For industry entities, consider m09-corp-registry-stack to add non-UK company registries. |
| **Non-OECD institutions with poor OSM coverage** (~15–25% of academic customers) | m05-ror-gleif-canonical (falls back to city-level) | Two-contact SOP catches some; Google Places could supplement OSM (dropped but revisitable). Empirical measurement against actual customer base needed. |
| **Multi-campus false positives** (~15–30% of orders at large universities) | m05-ror-gleif-canonical | Campus-polygon cache with manual satellite-campus additions; multi-polygon OSM relations partially address this. |
| **Industry customers** (~30–45% of orders) | m05-two-contact-sop (switchboard won't confirm) | Corporate procurement verification via different channels (purchasing-department contact, PO verification). Not defined in current SOP. |
| **GDPR-suppressed EU institutions** (~10–20% of academic orders) | m05-two-contact-sop (cannot find contacts) | Alternative verification: institutional registrar confirmation via formal channel; GDPR-compliant verification request template. |
| **Single-PI labs** (~10–20% of academic labs) | m05-two-contact-sop (independence requirement fails) | Relax independence requirement for single-PI labs with compensating controls (e.g., require department-head confirmation instead of two independent contacts). |
| **SOP trigger on address changes: unspecified** | m05-two-contact-sop | Must explicitly require re-triggering on any in-system shipping-address change. Affects inbox-compromise, account-hijack, dormant-account-takeover stories. |
| **Residential addresses within campus polygon** | m05-ror-gleif-canonical (structural FN) | Layer m04-usps-rdi (USPS Residential Delivery Indicator) to distinguish residential from institutional addresses within the polygon. |

## 3. Bypass methods uncovered: attacker stories surviving the full selected stack

For each attacker story in the measure-05 attacker mapping, the following assessment identifies which bypass methods survive both m05-ror-gleif-canonical AND m05-two-contact-sop operating together.

| Attacker story | Bypass method that survives | Why it survives | Required control layer |
|---|---|---|---|
| **credential-compromise** | Carrier account redirect (UPS My Choice / FedEx Delivery Manager) | Post-shipment. $0, ~30 min. Dominant cheapest path. | Carrier-level redirect blocking or shipment-hold controls (M18/M19). |
| **credential-compromise** | USPS change of address | Post-shipment. | Same as above. |
| **account-hijack** | Physical interception at PI's institutional address | Attacker/confederate picks up at university mailroom. Pre-shipment checks pass because address is institutional. | Institutional mailroom controls (named-recipient pickup with ID). Outside provider's control surface. |
| **account-hijack** | Social-engineered address change | AMBIGUOUS — depends on whether SOP re-fires on address changes. If re-trigger is implemented, SOP catches this. | Implement SOP re-trigger on address changes (open issue). |
| **it-persona-manufacturing** | Sub-path A (add to existing org record) + carrier reroute | Manufactured persona added by rubber-stamping PI; carrier reroute post-shipment. | M18/M19 legitimacy checks + carrier controls. |
| **it-persona-manufacturing** | Sub-path C (sibling org record) + ship to host lab | If persona is injected into institutional directory, SOP may confirm affiliation. | SOP should target research compliance / biosafety rather than department front desk (open issue). |
| **biotech-incubator-tenant** | Real bench lease at recognized incubator | Both checks confirm genuine tenancy. Attacker passes by construction. | M18/M19/M20 order-content legitimacy screening. |
| **visiting-researcher** | Ship to host lab's institutional address | Real appointment, real address. Both checks confirm. | M18/M19/M20 order-content legitimacy screening. |
| **gradual-legitimacy-accumulation** | 12+ months of real presence at incubator/coworking | Automated check passes (real address in registry); SOP confirms (real institutional presence). | M18/M19/M20 order-content legitimacy screening. |
| **gradual-legitimacy-accumulation** | Nominee manager hiding attacker identity | SOP does not check LLC manager identity against customer identity. | Cross-reference LLC principal with customer identity (m09-corp-registry-stack or equivalent). |
| **foreign-institution** | Accomplice at real institutional address (Method 2) | Institution confirms affiliation; address is the institution's own; accomplice receives and forwards. | Post-delivery controls; end-use monitoring. Outside M05 scope. |
| **dormant-account-takeover** | Ship to alternate registered address (Bypass B) | Already-approved alternate address on dormant account. Automated check passes (address was previously verified). | Re-verification of dormant accounts upon reactivation (operational control). |
| **dormant-account-takeover** | Address change (Bypass D) | AMBIGUOUS — same as account-hijack address change. | Implement SOP re-trigger on address changes. |
| **cro-framing** | Executive-suite or coworking paths | AMBIGUOUS — thin institutional presence may have enough directory presence to pass SOP. Automated check passes if registered address matches. | Tighter SOP criteria for what constitutes a "public directory" for non-traditional entities (open issue). |

### Summary: 5 bypass categories that cleanly survive the full stack

1. **Post-shipment carrier redirect** — affects credential-compromise, it-persona-manufacturing. Structural; requires carrier-level controls.
2. **Genuine-affiliation attackers** — affects biotech-incubator-tenant, visiting-researcher, gradual-legitimacy-accumulation. Structural; requires order-content legitimacy screening (M18/M19/M20).
3. **Physical interception at institutional address** — affects account-hijack, it-persona-manufacturing. Structural; requires institutional mailroom controls outside provider scope.
4. **Accomplice at real institutional address** — affects foreign-institution. Structural; requires post-delivery/end-use controls.
5. **Nominee manager / hidden principal** — affects gradual-legitimacy-accumulation. Addressable by cross-referencing LLC principal identity with customer identity.

## 4. Structural gaps flagged as open issues

### Must-resolve before production

1. **SOP re-trigger on address changes.** The two-contact SOP does not specify whether it re-fires when a customer's shipping address is changed in-system. Without this, the entire composition has a gap: automated check runs at order time, attacker changes address post-approval, no re-verification occurs. This affects inbox-compromise, account-hijack, and dormant-account-takeover stories. **Action: add explicit re-trigger rule to SOP and to the automated check's event-hook specification.**

2. **Maker space / coworking / executive suite classification.** The SOP does not define minimum criteria for what constitutes a "public directory" for non-traditional institutions. CRO-framing executive-suite and coworking paths exploit this ambiguity. **Action: define a bright-line rule (e.g., minimum N employees listed on public website, or institutional switchboard with named personnel).**

### Should-resolve for calibration

3. **Industry customer verification path.** The two-contact SOP structurally fails for ~30–45% of orders (industry customers). No alternative verification path is defined. **Action: design a corporate-procurement verification variant or exempt industry customers with compensating controls from other measures.**

4. **Non-OECD OSM polygon coverage.** The automated check falls back to city-level matching for ~15–25% of academic customers, retaining same-city bypass vulnerability. **Action: empirically measure actual OSM coverage against customer base; evaluate Google Places as a supplementary polygon source for low-coverage regions.**

5. **Multi-campus false-positive burden.** Unquantified reviewer workload from satellite-campus mismatches. **Action: build campus-polygon cache with curated satellite-campus entries for top-N institutions by order volume.**

### Accept-and-document

6. **Post-shipment carrier redirect.** Structural gap. No pre-shipment M05 control can address this. Document as requiring M18/M19 carrier-level controls.

7. **Genuine-affiliation attackers.** Structural gap. M05 confirms rather than catches these. Document as requiring M18/M19/M20 order-content legitimacy screening.

8. **Accomplice at real institutional address.** Structural gap. Document as requiring post-delivery/end-use monitoring outside M05 scope.
