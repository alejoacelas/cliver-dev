# m03-usps-rdi-cmra — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | USPS RDI + CMRA flag |
| **measure** | M03 — shipping-po-box |
| **attacker_stories_addressed** | `inbox-compromise` PO Box variant (CAUGHT: DPV footnotes H0/H1). `inbox-compromise` CMRA variant (CAUGHT: cmra == Y or DPV footnote R7). International addresses (MISSED: out of scope, routed to m03-smarty-melissa). Newly registered PO Box/CMRA within DPV lag (AMBIGUOUS). Broader deterrent: forces attackers away from PO Boxes and CMRAs toward more expensive, traceable alternatives. |
| **summary** | Submit each US shipping address to the USPS Address validation v3 REST API (or the forthcoming Enhanced Address API) and capture the Residential Delivery Indicator (RDI) and CMRA flag. CMRA is treated as a PO-box-equivalent for KYC purposes. In practice, most providers access RDI/CMRA through a licensed CASS reseller (Smarty, Melissa) rather than querying USPS directly. The check is US-only by design; international addresses route to m03-smarty-melissa. |
| **external_dependencies** | USPS v3 REST APIs (OAuth 2.0, developers.usps.com). USPS Enhanced Address API (planned, not yet GA as of April 2026). Licensed CASS reseller (Smarty, Melissa) as fallback/primary. Requires USPS account with CRID/MID for direct access (US business presence required). |
| **endpoint_details** | **Base URL:** `https://api.usps.com/`. **Auth:** OAuth 2.0 client credentials grant, tokens valid 8 hours. **Pricing:** $0 for USPS permit-holders. **Legacy:** Web Tools v1/v2 retired 25 January 2026; Label API retired 14 July 2024. **Rate limits:** [unknown — searched for: "USPS v3 API rate limit", "developers.usps.com throttle", "USPS REST API quota"] — v3 docs reference per-app quotas behind login. **ToS:** [unknown — searched for: "USPS API terms of service KYC", "USPS Web Tools acceptable use customer screening"] — KYC use not explicitly enumerated; most providers use CASS resellers to avoid policy ambiguity. |
| **fields_returned** | v3 Address API + Enhanced Address API (planned): `delivery_address` (normalized), `dpv_confirmation` (Y/N/S/D), `business` (bool), `central_delivery_point`, `cmra` (Y/N — Enhanced API; legacy used footnote R7), `vacant`, `rdi` (Residential/Commercial — Enhanced API), `pbsa` (PO Box Street Address service), `seasonal_delivery`, `dpv_footnotes` (diagnostic codes including PO box H0/H1 and CMRA R7). |
| **marginal_cost_per_check** | $0 via USPS directly (free for permit-holders). ~$0.001-$0.005 via CASS reseller (see m03-smarty-melissa). Setup: USPS API enrollment + OAuth provisioning ~1-2 engineer-days; CRID/MID acquisition ~1-2 weeks calendar time [best guess]. |
| **manual_review_handoff** | SOP: (1) `cmra == Y` or DPV footnote R7 → flag CMRA, reviewer asks for institutional context; deny if none provided. (2) PO Box footnotes H0/H1 → deny, request street address. (3) `dpv_confirmation != Y` → ambiguous, manual research or corroborate with Smarty second opinion. (4) International addresses → out of scope, route to m03-smarty-melissa. |
| **flags_thrown** | `address_is_cmra` (USPS CMRA Y or DPV R7 — reviewer follow-up, deny without explanation); `address_is_po_box` (DPV footnotes H0/H1 — deny); `dpv_unmatched` (DPV != Y — manual research); `address_seasonal` (seasonal_delivery == Y — soft note). |
| **failure_modes_requiring_review** | USPS API outage (fall back to Smarty/Melissa). Address too new for current DPV cycle (re-check after next monthly update). Recently converted CMRA not yet flagged in DPV. International addresses unsupported. Enhanced Address API not yet GA — CMRA flag availability via legacy path uncertain. |
| **false_positive_qualitative** | (1) Legitimate small biotechs and solo researchers using CMRA as business address: [best guess: 2-5% of commercial synthesis customers]; flagged by design, SOP handles via review. (2) Institutions sharing building with CMRA: extremely rare, CMRA flagged per suite not per building. (3) DPV-unmatched new-construction addresses: <0.5% of orders. |
| **coverage_gaps** | (1) International addresses: completely out of scope; [best guess: 30-50% of multinational provider orders]; pair with m03-smarty-melissa. (2) Non-US synthesis providers who cannot obtain USPS API access (no US business presence): [best guess: 30-40% of providers by count]; must use CASS reseller. (3) Enhanced Address API not yet GA: during transition, CMRA detection via v3 direct may be degraded; affects 100% of US addresses for direct-API users. (4) Legitimate CMRA users: ~15,000 CMRAs in US, ~1.6M registered customers (USPS OIG); [best guess: 2-5% of commercial synthesis customers]; false-positive by design. (5) Newly registered CMRAs not yet in DPV: [best guess: <100 at any time]; negligible timing gap. |
| **record_left** | USPS API JSON response (or legacy XML). DPV/CMRA/RDI flags surfaced. USPS DPV cycle date for replay. |
| **bypass_methods_known** | inbox-compromise US PO Box (CAUGHT via DPV H0/H1). inbox-compromise CMRA / packaging store (CAUGHT via cmra Y / R7). |
| **bypass_methods_uncovered** | International addresses (out of scope by design). Newly registered PO Boxes/CMRAs within ~30-day DPV update window. |

---

## Section 2: Narrative

### What this check is and how it works

This check submits the customer's US shipping address to the USPS Address validation system, either directly via the USPS v3 REST API or through a licensed CASS reseller (Smarty, Melissa). The USPS system returns a Delivery Point Validation (DPV) confirmation code indicating whether the address exists, a CMRA flag indicating whether the address is a Commercial Mail Receiving Agency (UPS Store, Mail Boxes Etc., private mailbox service), and a Residential Delivery Indicator (RDI) distinguishing residential from commercial addresses. PO Boxes are identified via DPV footnote codes (H0, H1). The CMRA flag is the check's primary contribution — it treats CMRAs as PO-box-equivalents for KYC purposes, since they allow an attacker to receive packages at an anonymous address without physical presence at an institution or laboratory. The check is US-only by design; international addresses are routed to m03-smarty-melissa.

### What it catches

The check catches both PO Boxes and CMRAs for US addresses with high confidence, using USPS's authoritative DPV dataset — the ground-truth source for US address classification. This covers the two primary mailbox-type delivery destinations available to an attacker in the `inbox-compromise` story (the only attacker story explicitly mapped to M03). Beyond direct detection, the check's existence serves as a deterrent: the broader attacker population avoids PO Boxes and CMRAs because they know these are trivially flagged, forcing them toward more expensive and traceable alternatives like virtual office leases, incubator bench space, or residential addresses that trigger separate measure flags.

### What it misses

The check has zero coverage for international addresses — this is a scope limitation, not a flaw. It also has a brief timing gap: USPS DPV data updates monthly, so a PO Box or CMRA registered within the last ~30 days may not yet be flagged. The implementation mitigates this by recommending re-checks after the next DPV update and by pairing with m03-pobox-regex-sop (which catches "PO Box" in the address string regardless of DPV status). A transitional concern is that the USPS Enhanced Address API, which bundles the CMRA flag explicitly, is not yet generally available as of April 2026 — providers querying USPS v3 directly during this gap may need to infer CMRA from legacy DPV footnote codes or rely entirely on resellers.

### What it costs

The check is free when querying USPS directly ($0 for permit-holders). When accessed via a CASS reseller (Smarty, Melissa), the marginal cost is approximately $0.001-$0.005 per lookup. Setup cost for USPS direct access is 1-2 engineer-days plus 1-2 weeks calendar time for USPS account enrollment and CRID/MID acquisition. The practical cost distinction is minor — most providers already use a reseller for address validation in their shipping workflow, making the CMRA flag an incremental addition to existing infrastructure rather than a new integration.

### Operational realism

When `address_is_cmra` fires, the reviewer asks the customer for institutional context; when `address_is_po_box` fires, the address is denied outright with a request for a street address. The SOP is identical to m03-smarty-melissa because both ideas use the same underlying USPS DPV data. The main operational note is that this idea is functionally a subset of m03-smarty-melissa for most practical purposes — any provider already using Smarty or Melissa gets CMRA and RDI included. The USPS direct path adds value only for providers who want to avoid vendor dependency or save the ~$0.001-0.005/check reseller fee. The audit trail consists of the USPS API JSON response, specific DPV/CMRA/RDI flags, and the DPV cycle date for reproducibility.

### Open questions

The USPS Enhanced Address API's general availability date is unknown — it is listed as "planned for a future release" with no announced timeline. Until it ships, the explicit `cmra` field is not available via the v3 direct path; providers must infer CMRA from DPV footnote codes or use a reseller. The USPS v3 API rate limits are behind-login documentation not publicly visible. The USPS ToS does not explicitly enumerate customer-screening / KYC as an approved use case, creating a policy ambiguity that most providers resolve by using a licensed CASS reseller instead. Non-US synthesis providers without a US business presence cannot obtain USPS API access directly and must rely on resellers.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 returned PASS with three Minor findings.
- **Stage 5 Minor finding m1:** Enhanced Address API not yet GA — CMRA flag availability depends on endpoint version. Providers querying USPS v3 directly may have degraded CMRA detection during the transition. Recommendation: use CASS reseller (Smarty/Melissa) as primary path.
- **Stage 5 Minor finding m2:** USPS API ToS ambiguity for KYC/customer-screening use. [unknown — searched for: "USPS API terms of service KYC", "USPS Web Tools acceptable use customer screening"]. Most providers avoid this via CASS resellers.
- **Stage 5 Minor finding m3:** DPV update lag (~monthly cycle) creates a brief window for newly registered PO Boxes/CMRAs. Mitigated by m03-pobox-regex-sop defense-in-depth.
- **[unknown — searched for: "USPS v3 API rate limit", "developers.usps.com throttle", "USPS REST API quota"]:** Rate limits documented behind login, not publicly visible.
- **[unknown — searched for: "DNA synthesis gene synthesis shipping international orders percentage non-US customers"]:** International order fraction unsupported by industry data; 30-50% is [best guess].
- **Functional overlap with m03-smarty-melissa:** This idea uses the same underlying USPS DPV data as Smarty and Melissa. The 06-coverage analysis notes that gaps 4 and 5 are near-duplicates. For most providers, m03-smarty-melissa is the practical implementation path, making this idea relevant primarily as the "what if we query USPS directly" alternative.
- **USPS Enhanced Address API:** No announced GA date. Monitor [USPS Web Tools Tech Docs](https://www.usps.com/business/web-tools-apis/documentation-updates.htm) for release announcements.
- **Non-US provider barrier:** USPS API access requires CRID/MID (US business presence). [best guess: 30-40% of providers by count lack US subsidiaries]. These providers must use resellers.
- **Policy trade-off:** Same as m03-smarty-melissa — CMRA flagging by design creates friction for ~2-5% of legitimate commercial customers using CMRA addresses.
