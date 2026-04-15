# m03-usps-rdi-cmra — implementation v1

- **measure:** M03
- **name:** USPS RDI + CMRA flag
- **modes:** D
- **summary:** Submit each US shipping address to USPS Address validation (legacy Web Tools v1/v2 retired in Jan 2026; the v3 REST APIs and forthcoming Enhanced Address API are the supported path), and capture Residential Delivery Indicator (RDI) and CMRA (Commercial Mail Receiving Agent) flags. CMRA = treated as PO-box-equivalent for KYC. In practice today most providers will get RDI/CMRA either via the new USPS Enhanced Address API or via a licensed CASS reseller (Smarty, Melissa, Loqate) that bundles DPV+CMRA into a single call.

## external_dependencies

- **USPS APIs (v3 REST)** ([USPS developer portal](https://developers.usps.com/apis); [Web Tools APIs landing](https://www.usps.com/business/web-tools-apis/); [Web Tools shutdown analysis](https://revaddress.com/blog/usps-web-tools-shutdown-2026/)).
- **USPS Enhanced Address API** — planned future release that explicitly bundles CMRA, PBSA, RDI, drop, seasonal, occupancy, and educational indicators ([USPS Web Tools Tech Docs](https://www.usps.com/business/web-tools-apis/documentation-updates.htm)). Not yet GA.
- **Licensed CASS reseller** — fallback if Enhanced Address API not available. Smarty and Melissa are the canonical resellers (covered by m03-smarty-melissa).

## endpoint_details

- **USPS v3 base:** `https://api.usps.com/` (OAuth 2.0 client credentials). Apps register at `developers.usps.com`. ([USPS developer portal](https://developers.usps.com/apis)).
- **Auth:** OAuth 2.0 client credentials grant. Tokens valid 8 hours.
- **Pricing:** USPS APIs are **free** to permit-holders, but require a USPS account and (for some endpoints) a CRID/MID. ([Industry Alert: API retirement](https://developers.usps.com/industry-alert-api-retirement)).
- **Web Tools v1/v2 retirement:** legacy XML APIs went dark on **25 January 2026**; the Label API retired earlier on 14 July 2024 ([RevAddress: Web Tools Shutdown 2026](https://revaddress.com/blog/usps-web-tools-shutdown-2026/)).
- **Rate limits:** [unknown — searched for: "USPS v3 API rate limit", "developers.usps.com throttle", "USPS REST API quota"]. v3 docs reference per-app quotas behind login.
- **ToS:** USPS APIs are restricted to USPS-approved customer use cases. Customer-screening / KYC use is not explicitly enumerated; most providers use a licensed CASS reseller to avoid the policy ambiguity. `[unknown — searched for: "USPS API terms of service KYC", "USPS Web Tools acceptable use customer screening"]`.

## fields_returned

From the v3 Address API + Enhanced Address API (planned):
- `delivery_address` — normalized
- `dpv_confirmation` — Y/N/S/D
- `business` — bool
- `central_delivery_point`
- `cmra` — Y/N (Enhanced Address API; legacy WT exposed `Footnote` codes including R7 = CMRA)
- `vacant`
- `rdi` — Residential / Commercial (Enhanced Address API)
- `pbsa` — PO Box Street Address service
- `seasonal_delivery`
- `dpv_footnotes` — diagnostic codes including PO box / CMRA reasons

(Field list per [USPS Web Tools Tech Docs / Enhanced Address API](https://www.usps.com/business/web-tools-apis/documentation-updates.htm).)

## marginal_cost_per_check

- **Per check:** $0 if querying USPS directly. ~$0.001–$0.005 via a CASS reseller (see m03-smarty-melissa).
- **Setup cost:** USPS API enrollment + OAuth client provisioning, ~1–2 engineer-days. CRID/MID acquisition for DPV-licensed use is a separate USPS process. `[best guess: 1–2 weeks calendar time for the USPS account setup.]`

## manual_review_handoff

1. If `cmra == Y` → flag CMRA. Reviewer SOP: confirm with customer if this is a packaging store; deny if no institutional context.
2. If `dpv_footnotes` includes R7 (CMRA, legacy) or H0/H1 PO-box codes → same handling as `cmra == Y`.
3. If `dpv_confirmation != Y` → ambiguous. Manual research / corroborate with Smarty as a second opinion.
4. International addresses → not in scope; route to m03-smarty-melissa (Melissa Global).

## flags_thrown

| Flag | Trigger | Action |
|---|---|---|
| `address_is_cmra` | USPS CMRA Y or DPV footnote R7 | Reviewer follow-up; deny without explanation |
| `address_is_po_box` | USPS PO box footnotes (H0/H1) | Deny |
| `dpv_unmatched` | DPV != Y | Manual research |
| `address_seasonal` | seasonal_delivery == Y | Soft note |

## failure_modes_requiring_review

- USPS API outage / 503 → fall back to Smarty/Melissa.
- Address is too new for current DPV cycle → re-check after next monthly USPS DPV update.
- Recently converted CMRA (newly registered with USPS) → CMRA flag may lag.
- International addresses are not handled by USPS at all.

## false_positive_qualitative

- Legitimate small biotechs and individual researchers who use a UPS Store as their official address (genuinely intended-to-flag population, but some legitimately have no other option).
- Edge case: institutions that share a building with a CMRA — extremely rare, handle by exception.
- The check is US-only; reliance on this alone leaves international shipping completely unscreened.

## record_left

- USPS API JSON response (or legacy XML, until shutdown)
- DPV / CMRA / RDI flags surfaced
- USPS DPV cycle date for replay

## attacker_stories_addressed

- `inbox-compromise` (the only m03 attacker story explicitly nominating a USPS PO Box) — caught.
- More broadly, captures the `cmra-shipping` pattern (UPS Store / PMB) that overlaps strongly with virtual-office-shell attacker behaviour mapped to other measures.

## Open structural concerns

- USPS API enrollment requires a US business account (CRID/MID). Foreign synthesis providers cannot use this directly and must rely on resellers (m03-smarty-melissa).
- The Enhanced Address API that bundles CMRA explicitly is not yet GA as of April 2026 ([USPS Web Tools Tech Docs](https://www.usps.com/business/web-tools-apis/documentation-updates.htm)). Until release, providers querying USPS directly may need to chain DPV + a separate CMRA lookup, or rely entirely on resellers.
