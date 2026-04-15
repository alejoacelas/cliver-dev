# m04-usps-rdi — Implementation v1

- **measure:** M04 — shipping-residential
- **name:** USPS RDI residential indicator (via Smarty / Melissa, not direct)
- **summary:** USPS Residential Delivery Indicator (RDI) is a binary residential/business flag derived from USPS's Address Management System. Direct access requires CASS-certified software and hash-table integration; in practice, providers consume RDI through CASS-certified vendors (Smarty, Melissa, Loqate, AccuZIP). Reuses the same vendor call as m03 USPS-RDI-CMRA.

## external_dependencies

- **USPS Address Information System (AIS) — RDI product** — the underlying data, distributed as hash tables, requires CASS certification to integrate directly. [source](https://postalpro.usps.com/address-quality-solutions/residential-delivery-indicator-rdi)
- **Smarty (formerly SmartyStreets)** — CASS-certified vendor, returns `rdi` field on every US address lookup. [source](https://www.smarty.com/articles/what-is-rdi)
- **Melissa, Loqate, AccuZIP, CDYNE** — alternative CASS-certified vendors offering the same RDI signal.
- **USPS Web Tools (legacy):** **RETIRED January 25, 2026.** Migration to USPS APIs v3 (OAuth2). [source](https://developers.usps.com/industry-alert-api-retirement) — note that USPS-direct API does NOT expose RDI directly; AIS products remain a separate licensing channel.

## endpoint_details

- **Smarty US Street API:** `https://us-street.api.smarty.com/street-address` — REST, auth-id + auth-token in query string. [source](https://www.smarty.com/docs/cloud/us-street-api)
- **Smarty pricing tiers:** free up to ~250 lookups/month; paid plans from 50K/year (~$50/mo entry tier) up to enterprise; on-premise options available [vendor-described — exact dollar tiers behind the pricing page calculator]. [source](https://www.smarty.com/pricing)
- **Smarty per-call cost:** ~$0.001–$0.005/lookup at mid-tier volumes [best guess: based on G2 reviews and historical SmartyStreets public pricing of ~$0.003/call at 100K/mo].
- **Auth model:** Smarty uses simple HTTP auth-id/auth-token pair generated in the dashboard. No OAuth.
- **Rate limits:** Smarty advertises no hard rate cap on paid tiers; bursts of 100+ rps documented [unknown — searched for: "Smarty US Street API rate limit per second", "smarty rate limit burst"].
- **ToS:** Smarty's terms permit using RDI for fraud prevention and customer screening [unknown — searched for: "Smarty terms of service screening", "smarty acceptable use policy"]. No known restriction on B2B KYC use.
- **USPS direct path (alternative):** RDI hash tables licensed annually from USPS AIS via PostalPro; provider must build or buy CASS-certified ZIP+4 matching software. Cost is in the thousands annually plus engineering. Not practical for most providers. [source](https://postalpro.usps.com/address-quality-solutions/residential-delivery-indicator-rdi)

## fields_returned

From Smarty US Street API per address: `delivery_line_1`, `last_line`, `delivery_point_barcode`, `components.*` (parsed parts), `metadata.rdi` (`Residential` | `Commercial`), `metadata.dpv_match_code`, `metadata.dpv_footnotes`, `metadata.county_fips`, `metadata.latitude`, `metadata.longitude`, `metadata.record_type`, `metadata.zip_type`, `metadata.cmra`, `metadata.vacant`, `metadata.active`, plus ~55 total metadata points. [source](https://www.smarty.com/docs/cloud/us-street-api)

The single decisive field for this check is **`metadata.rdi`** ∈ {`Residential`, `Commercial`}.

## marginal_cost_per_check

- **Smarty:** $0.001–$0.005 per lookup [best guess]; effectively $0 marginal if reusing the same call as m03's CMRA check (the same Smarty response carries both `rdi` and `cmra`).
- **setup_cost:** ~1 day integration; Smarty account setup is self-service.

## manual_review_handoff

When `address_is_residential` (`metadata.rdi == "Residential"`) fires for an order claimed against an institutional affiliation:
1. Reviewer pulls the customer's claimed institution and the parsed address.
2. Reviewer applies institution-class policy:
   - Major university / hospital / corporate biotech → residential is a hard flag, request institutional address.
   - Small startup / sole-proprietor LLC / community-bio LLC → residential triggers carve-out review (not auto-deny), reviewer asks for evidence the work happens at the residential address (lab photos, BSL designation, local biosafety committee letter, fume hood permits).
3. Reviewer cross-checks RDI against parcel use code (m04-county-assessor) where available.
4. Reviewer documents decision rationale + the binary RDI value in compliance log.
5. If borderline, escalate to senior reviewer.

## flags_thrown

- `address_is_residential` — `metadata.rdi == "Residential"`. Action: institution-class-aware human review.
- `rdi_unknown` — Smarty returned no RDI value (rare, on undeliverable or new addresses). Action: human review.
- `rdi_data_stale` — DPV match was approximate, Smarty flagged with footnote. Action: re-validate.

## failure_modes_requiring_review

- **US-only:** RDI is a USPS product. International addresses get no signal — coverage drops to zero outside US.
- **New construction:** addresses added in last ~6 months may not yet have an RDI assignment [best guess: USPS AMS refresh is monthly but new-build commercial vs residential classification can lag].
- **Mixed-use buildings:** a building with apartments above a lab gets a single building-level RDI; unit-level RDI is less reliable.
- **DPV partial matches:** when DPV doesn't fully validate, RDI is unreliable.
- **CMRA flag separately needed** — RDI alone does not detect virtual mailbox / mail forwarding addresses; m03-usps-rdi-cmra adds the `cmra` field to cover that.

## false_positive_qualitative

- **Garage labs / community bio** at residential addresses — same population as m04-county-assessor's FPs; RDI cannot distinguish them.
- **Sole proprietor / home-office consultants** legitimately operating from home.
- **Small biotech founders** in pre-incubator phase working from home.
- **Live-work units** in dense urban areas (Cambridge, SF, Brooklyn) where the building is residentially zoned but used commercially.
- **Apartments converted to lab space** without USPS reclassification.

## record_left

- The Smarty API JSON response (or just `metadata.rdi`, `metadata.cmra`, `dpv_match_code`), the addressed query, and the timestamp. Stored in order's compliance log.

## attacker_stories_addressed

- `community-bio-lab-network` (catches the residential framing — but cannot distinguish legitimate community bio)
- `dormant-domain` residential-colocation sub-config (catches)
- `foreign-institution` Method 4 — **NOT addressed** (US-only)
- `cro-framing`, `gradual-legitimacy-accumulation` (FNR depends on residential bucket)

Sources:
- [USPS PostalPro — RDI](https://postalpro.usps.com/address-quality-solutions/residential-delivery-indicator-rdi)
- [USPS API retirement notice](https://developers.usps.com/industry-alert-api-retirement)
- [USPS Web Tools landing](https://www.usps.com/business/web-tools-apis/)
- [Smarty — what is RDI](https://www.smarty.com/articles/what-is-rdi)
- [Smarty US Street API docs](https://www.smarty.com/docs/cloud/us-street-api)
- [Smarty pricing](https://www.smarty.com/pricing)
- [CDYNE RDI lookup](https://cdyne.com/postal-address-verification/residential-delivery-indicator)
