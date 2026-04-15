# m04-county-assessor — Implementation v1

- **measure:** M04 — shipping-residential
- **name:** County assessor parcel use-code (US)
- **summary:** For a US shipping address, geocode to a parcel and read the county assessor's land-use / use-code field. Residential use codes are a hard signal that the address is a home, not a lab; mixed-use or commercial codes pass. National coverage is achieved through aggregators (Regrid, ATTOM, ReportAll) rather than direct county queries.

## external_dependencies

- **Regrid** — nationwide standardized parcel + land-use dataset (LBCS-coded). [source](https://regrid.com/land-use-codes)
- **ATTOM Data** — assessor data for 158M+ US properties across 3,000+ counties. [source](https://www.attomdata.com/data/property-data/assessor-data/)
- **ReportAll USA** — 160.6M parcels covering ~99% of US. [source](https://reportallusa.com/products/api)
- **County open-data portals** — direct, where available; coverage extremely uneven [best guess: most large counties have an ArcGIS REST endpoint, most small/rural counties do not].

## endpoint_details

- **Regrid Parcel API:** REST, API-key auth. Lookup by lat/lng, address, or parcel ID. [source](https://regrid.com/parcel-api)
  - Pricing: nationwide bulk data starts at **$80K/year**; Typeahead API at $0.001/request. Per-parcel API call pricing is [vendor-gated — public pages quote bulk + typeahead only; per-call REST pricing requires sales contact]. [source](https://regrid.com/pricing)
  - ToS: commercial KYC-style use is permitted under standard license [unknown — searched for: "Regrid terms of service KYC screening", "Regrid acceptable use parcel API"].
- **ATTOM Property API:** REST, API-key. Starts at **$95/month** entry plan, enterprise pricing custom. [source](https://datarade.ai/data-providers/attom/profile)
  - Endpoint base: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/` [source](https://api.developer.attomdata.com/docs)
- **ReportAll USA Parcel API:** REST, key-based, ArcGIS-compatible dictionary. [source](https://reportallusa.com/products/api). Pricing [vendor-gated — listed on request].
- **County direct (e.g., LA County, King County WA):** ArcGIS REST FeatureServer, no auth, free, but per-county schema. Building a national check on direct county feeds is impractical [best guess: would require ~3,000 schema integrations].
- **Rate limits:** Regrid documents standard REST quotas [unknown — searched for: "Regrid API rate limit", "Regrid parcel API quota per minute"]; ATTOM rate limits are per-plan [vendor-gated — visible only in account console].

## fields_returned

From Regrid (LBCS schema): `lbcs_function` (economic function), `lbcs_structure` (building type), `lbcs_site` (physical), `lbcs_ownership`. Plus `usecode` (raw county code), `usedesc` (county description), `parcelnumb`, `owner`, `address`, geometry. [source](https://support.regrid.com/parcel-data/schema)

From ATTOM Assessor: `PropertyUseGroup`, `PropertyUseStandardized`, `PropertyUseMunicipality`, `LotSize`, `YearBuilt`, owner, assessed value [vendor-described, partly documented in API guides]. [source](https://api.developer.attomdata.com/docs)

## marginal_cost_per_check

- **Regrid via bulk license:** ~$0.0005/check amortized [best guess: $80K/yr ÷ ~150M annual lookups for a high-volume buyer, but synthesis providers run far fewer checks; for a small provider doing 50K orders/yr, amortized cost is ~$1.60/check].
- **ATTOM entry plan:** $95/mo with metered call quotas [vendor-gated — quota size requires sales contact]. Per-call cost in the $0.05–$0.20 range [best guess: typical real-estate API tier].
- **ReportAll:** [vendor-gated].
- **setup_cost:** Integration: ~1 engineer-week per vendor. Bulk Regrid license requires annual commitment ≥$80K.

## manual_review_handoff

When `parcel_use_residential` fires:
1. Reviewer pulls the parcel record (use code, owner name, year built, lot size).
2. Reviewer cross-checks customer's claimed institution against the parcel owner. If owner is the customer or a named individual (not the institution), strong residential confirmation.
3. Reviewer checks for "garage lab / community bio" exception per a written carve-out policy: if customer has a credible community-bio framing (LLC + community-bio LLC name), reviewer escalates to a senior reviewer rather than auto-deny — explicitly to handle the `community-bio-lab-network` attacker class without auto-rejecting legitimate DIY-bio customers.
4. Reviewer documents decision in the order's compliance file, including parcel ID and use code.

## flags_thrown

- `parcel_use_residential` — LBCS function code in 1100–1900 range, or county use code in residential families. Action: hold for human review.
- `parcel_use_mixed` — LBCS function indicates mixed-use or live-work. Action: human review, lower priority.
- `parcel_use_unknown_county` — county not covered by aggregator. Action: degrade to USPS RDI fallback (m04-usps-rdi).

## failure_modes_requiring_review

- Aggregator coverage gap (county missing or stale). Estimated stale-data window: Regrid refreshes monthly for paid tiers [source](https://regrid.com/api); some counties refresh annually only [best guess].
- Geocoding ambiguity (apartment within commercial building, or multi-parcel campus).
- Parcel owner name does not match customer (could be landlord — not necessarily a flag).
- Use code reflects historical use (e.g., converted warehouse loft now residential, still coded commercial).

## false_positive_qualitative

- **Garage labs / community bio** (legitimate DIYbio members): residential parcel is genuine, work is real. Direct match to the `community-bio-lab-network` attacker model, which means this check cannot reliably distinguish them.
- **Sole-proprietor consultants / small biotech founders** working from a home office while incorporating an LLC.
- **Live-work loft buildings** in dense urban biotech metros (mission, SoMa, Cambridge) where the parcel may be coded mixed or residential despite hosting actual labs.
- **Recently converted commercial-to-residential or vice-versa** parcels with stale county records.

## record_left

- Parcel ID (`parcelnumb`), county FIPS, use code (raw + standardized), aggregator name + query timestamp, JSON response stored as artifact in the order's compliance log.

## attacker_stories_addressed

- `community-bio-lab-network` (catches the residential framing, but cannot distinguish legitimate community bio without policy carve-out)
- `dormant-domain` (residential-colocation sub-config)
- `foreign-institution` Method 4 (US-only — does not address foreign residential)
- `cro-framing`, `gradual-legitimacy-accumulation` (FNR depends on residential population)

Sources:
- [Regrid Parcel API](https://regrid.com/parcel-api)
- [Regrid pricing](https://regrid.com/pricing)
- [Regrid land use codes](https://regrid.com/land-use-codes)
- [Regrid schema](https://support.regrid.com/parcel-data/schema)
- [ATTOM Assessor Data](https://www.attomdata.com/data/property-data/assessor-data/)
- [ATTOM API docs](https://api.developer.attomdata.com/docs)
- [ATTOM Datarade profile (pricing)](https://datarade.ai/data-providers/attom/profile)
- [ReportAll API](https://reportallusa.com/products/api)
