# m03-smarty-melissa — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Smarty / Melissa address verification |
| **measure** | M03 — shipping-po-box |
| **attacker_stories_addressed** | `inbox-compromise` PO Box variant (CAUGHT: DPV identifies PO Boxes). `inbox-compromise` CMRA variant (CAUGHT: `dpv_cmra == Y`). International PO Box in OECD countries (CAUGHT likely). International PO Box in non-OECD countries (AMBIGUOUS: shallow coverage). Deterrent effect forces attackers toward more traceable alternatives. |
| **summary** | Submit each shipping address to Smarty (formerly SmartyStreets) US Street Address API and/or Melissa Global Address Verification. Both return DPV match status and a CMRA flag for US addresses; Melissa covers 240+ countries internationally. The primary value is high-confidence US CMRA and PO Box detection. International coverage is nominally broad but practically shallow outside OECD countries (~30-40 countries with full street-level + address-type classification). |
| **external_dependencies** | Smarty US Street Address API + International API. Melissa Global Address Verification API. Both rely on USPS DPV/CMRA datasets domestically and country-specific postal data internationally. |
| **endpoint_details** | **Smarty US:** `GET https://us-street.api.smarty.com/street-address`. **Smarty International:** `GET https://international-street.api.smarty.com/verify`. Auth: Auth ID + Auth Token (query string). Pricing: ~$0.0006-$0.005/US lookup [best guess from G2/vendor]; international more expensive (~$0.01-$0.05) [best guess]. Rate limit: 100k req/day default [unknown — searched for specific throttle details]. ToS: [unknown — searched for: "smarty terms of service KYC", "smartystreets commercial use customer screening"]. **Melissa:** `GET https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress`. Auth: License key (query string). Pricing: ~$0.003/record at Tier 1 [from G2 user-reported tiers: $30/10k, $84/30k, $285/100k, $1,395/500k]. Rate limit: [unknown — searched for: "Melissa Global Address Verification rate limit"]. ToS: [vendor-gated — specific KYC use clauses require sales contact]. |
| **fields_returned** | **Smarty US:** `delivery_line_1`, `last_line`, `metadata.rdi` (Residential/Commercial), `analysis.dpv_match_code` (Y/N/S/D), `analysis.dpv_cmra` (Y/N), `analysis.dpv_vacant` (Y/N), `analysis.active`, `analysis.dpv_footnotes`. **Melissa Global:** `FormattedAddress`, `AddressType` (includes PO box code), `AddressKey`, `CountryName`, `Results` (comma-separated codes including AV25=CMRA, AS01=verified). Melissa CMRA indicator: [vendor-described, not technically documented in public Python SDK docs]. |
| **marginal_cost_per_check** | US (Smarty): ~$0.0006-$0.005/lookup [best guess]. International (Melissa): ~$0.003/record [from G2 tiers]. Setup: vendor contract + API key provisioning, ~1 engineer-day each. |
| **manual_review_handoff** | SOP: (1) `dpv_cmra == Y` → flag CMRA, ask customer for institutional context. (2) Melissa CMRA on intl address → same. (3) `dpv_match_code != Y` → ambiguous, manual address research. (4) `metadata.rdi == Residential` → cross-reference to M04 residential check. (5) Vendors disagree → log, prefer more cautious flag. |
| **flags_thrown** | `smarty_cmra` (dpv_cmra == Y — reviewer follow-up, deny if no institutional explanation); `smarty_po_box` (DPV footnotes include PO box codes — deny); `melissa_cmra` (Melissa CMRA indicator Y — same as Smarty); `melissa_po_box` (AddressType = PO box — deny); `dpv_unmatched` (DPV != Y — manual research). |
| **failure_modes_requiring_review** | Vendor coverage gaps in non-OECD countries (city-level only). API timeout/5xx (retry, then queue). Brand-new addresses within ~6-week USPS DPV update cycle. Cross-border forwarding hubs where registered and physical countries differ. |
| **false_positive_qualitative** | (1) Legitimate small biotechs using CMRA as business address: [best guess: 2-5% of commercial synthesis customers]; flagged by design — measure treats CMRAs as suspicious; SOP handles via manual review but creates friction. (2) New-construction addresses not yet in DPV: <0.5% of orders; `dpv_unmatched` causes delay. (3) International customers in shallow-coverage countries: no FP per se, but absence of flag is misleadingly clean (address merely unverifiable, not verified). |
| **coverage_gaps** | (1) International addresses in countries with shallow postal data: [best guess: full street-level + PO box/CMRA detection for ~30-40 countries (OECD + major Asian economies); remaining ~200 countries/territories have city-level or weaker]; [unknown — searched for per-country verification depth matrices]. (2) Legitimate CMRA users: ~15,000 CMRAs in US with ~1.6M registered customers (USPS OIG); [best guess: 2-5% of commercial synthesis customers use CMRA]. (3) Recently built US addresses within ~6-week DPV cycle: <0.5%. (4) Cross-border forwarding hubs / freight forwarders: [best guess: 1-5% of international orders]; pass cleanly as real commercial addresses; [unknown — searched for synthesis-specific freight forwarding data]. |
| **record_left** | Full Smarty / Melissa JSON response cached. Specific CMRA / DPV flags surfaced. Vendor + dataset version (USPS DPV cycle date) for replay. |
| **bypass_methods_known** | inbox-compromise US PO Box (CAUGHT via DPV). inbox-compromise CMRA / packaging store (CAUGHT via dpv_cmra). International PO Box in OECD (CAUGHT likely). |
| **bypass_methods_uncovered** | International PO Box equivalents in countries with sparse Melissa coverage. Brand-new PO Boxes / CMRAs within 6-week USPS DPV update lag. Cross-border freight forwarders (real commercial addresses, not flagged as CMRA). |

---

## Section 2: Narrative

### What this check is and how it works

This check submits the customer's shipping address to one or both of two commercial address-verification vendors: Smarty (formerly SmartyStreets) and Melissa Data. For US addresses, both vendors query the USPS Delivery Point Validation (DPV) database and return a CMRA flag indicating whether the address is a Commercial Mail Receiving Agency (UPS Store, Mail Boxes Etc., or similar private-mailbox service) and DPV footnote codes that identify PO Boxes. For international addresses, Melissa's Global Address Verification covers 240+ countries, returning address-type classification and verification status. When a CMRA or PO Box is detected, the address is flagged: PO Boxes are denied outright with a request for a street address, and CMRAs trigger reviewer follow-up asking for institutional context. The check runs as a synchronous API call at order-submission time.

### What it catches

The check catches both primary mailbox-type bypass methods for the one explicitly mapped attacker story (inbox-compromise). A US PO Box is identified via DPV and denied. A CMRA (packaging store, virtual mailbox) is identified via the `dpv_cmra` flag and escalated to review. This covers the two cheapest and most accessible delivery-destination options available to an attacker who has compromised an institutional email but does not have physical access to a campus or laboratory. For OECD-country international addresses, Melissa provides comparable PO Box and address-type detection. The check also exerts a deterrent effect: attackers who know about CMRA detection are forced toward more expensive and traceable alternatives — virtual offices requiring lease agreements, incubator bench space, or residential addresses that trigger separate M04 flags.

### What it misses

The check's primary gap is international coverage depth. While Melissa claims to cover 240+ countries, full street-level verification with PO Box and CMRA classification is available for only an estimated 30-40 countries (primarily OECD plus major Asian economies). In the remaining ~200 countries and territories, verification returns city-level matches at best, and the address-type fields that distinguish PO Boxes from street addresses are absent or always negative. A customer using a PO Box in a non-OECD country would pass uncaught. The check also misses cross-border freight forwarding hubs (estimated 1-5% of international orders), which are real commercial addresses that pass DPV cleanly but obscure the actual end recipient. Brand-new US addresses within the ~6-week USPS DPV update cycle may return `dpv_unmatched` rather than a specific address-type flag.

### What it costs

Marginal cost per US check is approximately $0.0006-$0.005 via Smarty (from vendor pricing page), or approximately $0.003 via Melissa (from G2-reported tier pricing). International lookups are more expensive ($0.01-$0.05 per lookup via Smarty International). All pricing figures are best-guess estimates from publicly visible sources; actual contracted rates may differ. Setup cost is one vendor contract and API key provisioning per vendor, approximately one engineer-day each. The cost per check is negligible relative to synthesis order value (typically $100-$10,000+ per order).

### Operational realism

When `smarty_cmra` or `melissa_cmra` fires, the reviewer asks the customer whether the address is a packaging store and requests an institutional explanation. Denial is appropriate only when no context is provided — some legitimate small biotechs use CMRAs. When `dpv_unmatched` fires, the reviewer manually researches the address, which adds processing time. The main operational tension is that the CMRA flag is by-design a false-positive generator for legitimate early-stage companies: an estimated 2-5% of commercial synthesis customers use CMRA addresses because they lack dedicated office space. This is a policy trade-off, not a technical flaw — the measure intentionally treats CMRAs as suspicious. The audit trail consists of full vendor JSON responses, specific flags surfaced, and the USPS DPV cycle date for reproducibility.

### Open questions

Neither Smarty nor Melissa publishes a per-country matrix of verification depth (which countries have full street-level + address-type classification vs. city-level only). The "30-40 countries" estimate for full coverage is reasonable but unconfirmed. Melissa's CMRA field for international addresses is described in vendor materials but not technically documented in the public Python SDK — confirming its exact behavior requires a vendor conversation. Smarty's rate limits and ToS for KYC use are [unknown] — the implementation searched for these without finding definitive answers. Melissa's specific KYC use terms are [vendor-gated] and require sales contact.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 returned PASS with three Minor findings.
- **Stage 5 Minor finding m1:** International PO Box detection is unreliable outside OECD. Pair with m03-pobox-regex-sop (locale-specific regex catches what vendor misses in underserved locales).
- **Stage 5 Minor finding m2:** Brand-new addresses within ~6-week USPS DPV update cycle may not be classified. Pair with m03-pobox-regex-sop for string-level detection.
- **[unknown — searched for: "Smarty US street address API rate limit", "smartystreets requests per second", "smarty rate limit cloud"]:** Smarty rate limits undocumented.
- **[unknown — searched for: "smarty terms of service KYC", "smartystreets commercial use customer screening"]:** Smarty ToS for KYC use not confirmed.
- **[unknown — searched for: "Melissa Global Address Verification rate limit", "melissa cloud API throttle"]:** Melissa rate limits undocumented.
- **[vendor-gated — Melissa ToS:]** Specific KYC use clauses require sales contact.
- **[vendor-gated — Melissa CMRA field:]** Exact international CMRA field behavior described but not technically documented in public SDK; requires vendor confirmation.
- **[unknown — searched for: "Smarty international address verification countries with full DPV", "Melissa GAV street level verification country list"]:** Per-country verification depth matrices not publicly available. The "30-40 countries with full coverage" estimate is [best guess].
- **[unknown — searched for: "freight forwarder address percentage of ecommerce orders", "DNA synthesis shipping to freight forwarder"]:** Freight-forwarder prevalence among synthesis customers is unsupported.
- **Pricing caveat:** All pricing figures are [best guess] from vendor pages and G2 user reports. Smarty pricing noted as `STALE` risk by 04C claim check. Actual contracted rates may differ.
- **Policy trade-off:** CMRA flagging by design creates friction for ~2-5% of legitimate commercial customers (early-stage biotechs). This is an inherent tension between the measure's intent and customer experience, not a technical flaw.
