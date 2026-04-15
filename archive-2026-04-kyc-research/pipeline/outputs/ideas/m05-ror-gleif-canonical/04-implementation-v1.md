# m05-ror-gleif-canonical — Implementation v1

- **measure:** M05 — shipping-institution-association
- **name:** ROR / GLEIF / Companies House canonical address cross-reference
- **summary:** For a claimed institution, fetch its canonical address(es) from ROR (research organizations), GLEIF (Legal Entity Identifier records), and Companies House (UK only). Geocode both canonical and customer-provided shipping/billing addresses; compute distance. Mismatch beyond a tolerance (e.g., 5 km within country, 50 km for multi-campus institutions) raises a flag. Absence of any canonical record at all is also a flag (`institution_no_canonical_record`).

## external_dependencies

- **ROR API v2** — `https://api.ror.org/v2/organizations` — free, no auth, no rate limit advertised. [source](https://ror.readme.io/docs/basics)
- **GLEIF LEI Look-up API** — free, no auth, no registration required, supports fuzzy matching on names and addresses. [source](https://www.gleif.org/en/lei-data/gleif-api)
- **UK Companies House Public Data API** — free, requires API key registration, **600 requests / 5 minutes** rate limit. [source](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting)
- **Geocoder** for distance comparison (Nominatim self-hosted or Google Geocoding API).
- **Address normalizer** (libpostal or Smarty's parse output).

## endpoint_details

- **ROR v2:**
  - Endpoint: `https://api.ror.org/v2/organizations?query={institution_name}` (search) or `https://api.ror.org/v2/organizations/{ror_id}` (lookup).
  - Auth: none.
  - Rate limit: none documented; ROR asks heavy users to contact them. [unknown — searched for: "ROR API rate limit per second", "ROR API throttle policy"]
  - Free.
  - **v2 schema change (Apr 2024):** the legacy `addresses` field is gone. Location info is now in `locations[]` with `geonames_id` and `geonames_details` (city, country, lat/lng, etc.). **There is no street-level address in v2.** [source](https://ror.org/blog/2024-04-15-announcing-ror-v2/)
  - **Critical structural limitation:** ROR's "address" is city-level only. Comparing customer's street address to ROR yields a city/distance match at best, not a street match.

- **GLEIF LEI Look-up:**
  - Endpoint base: `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]={name}` (REST/JSON:API style).
  - Auth: none.
  - Up to 200 records per request. [source](https://www.gleif.org/en/lei-data/gleif-api)
  - Free.
  - Rate limits: not publicly documented; described as "easily integrate into internal systems." [unknown — searched for: "GLEIF API rate limit", "GLEIF lookup API throttle"]
  - **Critical caveat:** LEI registration is required for entities trading in regulated financial markets. Most academic / research / small biotech entities **do not have an LEI**. GLEIF coverage of life-sciences customers is therefore weak; expect high `institution_no_canonical_record` rate.

- **UK Companies House Public Data API:**
  - Endpoint: `https://api.company-information.service.gov.uk/company/{company_number}` for full profile, `/search/companies?q={name}` for name search.
  - Auth: HTTP Basic with API key as username.
  - Rate limit: **600 req / 5 min** = 2 req/sec sustained. Higher limits on request. [source](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting)
  - Free.
  - Returns: `company_name`, `company_number`, `company_status`, `registered_office_address` (street-level), `sic_codes`, `date_of_creation`, etc. [source](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/registered-office-address)
  - **UK-only.** Useful for the subset of customers claiming UK affiliations.

- **ToS:** ROR, GLEIF, and Companies House all explicitly permit programmatic use for compliance/screening purposes [unknown — searched for: "ROR API terms of use commercial", "GLEIF data licensing screening", "Companies House developer guidelines screening"]. ROR data is CC0 [source](https://ror.org/).

## fields_returned

**ROR v2 organization record:**
- `id` (ROR identifier URL), `names[]` (with `lang`, `types[]` like `ror_display`, `alias`, `acronym`), `types[]` (e.g., `education`, `healthcare`, `nonprofit`, `company`), `status`, `established`, `links[]` (`type=website`, `type=wikipedia`), `locations[]` (with `geonames_id`, `geonames_details.name`, `country_name`, `country_code`, `lat`, `lng`), `relationships[]` (parent/child/related orgs), `external_ids[]` (Wikidata, ISNI, GRID, etc.). [source](https://ror.readme.io/docs/ror-data-structure)

**GLEIF LEI record:**
- `lei`, `entity.legalName.name`, `entity.legalAddress` (street, city, region, country, postalCode), `entity.headquartersAddress` (street, city, region, country, postalCode), `entity.legalForm.id`, `entity.status`, `entity.entityCategory`, `registration.initialRegistrationDate`, `registration.lastUpdateDate`, `registration.status`, `registration.managingLou`. [source](https://www.gleif.org/en/lei-data/gleif-api)

**Companies House profile:**
- `company_name`, `company_number`, `company_status`, `type`, `date_of_creation`, `date_of_cessation`, `jurisdiction`, `registered_office_address.{premises,address_line_1,address_line_2,locality,region,postal_code,country}`, `sic_codes[]`, `accounts.*`. [source](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/registered-office-address)

## marginal_cost_per_check

- All three APIs are **free**. Marginal cost per check ≈ $0 in API fees.
- Geocoding cost: ~$0.005 (Google) or $0 (self-hosted Nominatim).
- Total marginal: **<$0.01/check**.
- **setup_cost:** Self-hosted geocoder + ~1 engineer-week for the matcher logic + ROR/GLEIF/Companies House clients + caching layer + the address-similarity scoring function.

## manual_review_handoff

When `canonical_address_mismatch` fires:
1. Reviewer pulls all canonical addresses found across the three sources, plus the customer's claimed address.
2. Reviewer geocodes both, computes distance, and reads the source-specific notes (ROR is city-level only; GLEIF includes both legal and HQ; Companies House is street-level UK only).
3. Reviewer applies a tiered tolerance:
   - **Same building / <50m:** strong positive.
   - **Same campus / <500m:** positive.
   - **Same city, <5km:** likely satellite or affiliate. Soft pass + log.
   - **Same country, >5km:** flag — could be remote campus or could be a problem. Cross-check m05-google-places-campus polygons.
   - **Different country:** hard flag.
4. Reviewer cross-checks the institution's website "Locations" page or Wikipedia for known satellite sites.
5. Decision logged with all canonical addresses and the matching tolerance applied.

When `institution_no_canonical_record` fires:
1. Reviewer escalates to other M05 / M09 institution-legitimacy checks.
2. Tries name variants, acronyms, and Wikidata lookups.
3. If still no record, escalates to senior reviewer; the institution may be too small / too new / non-Western and need direct verification.

## flags_thrown

- `canonical_address_mismatch` — distance > tolerance for the institution class. Action: human review per playbook.
- `institution_no_canonical_record` — no ROR / GLEIF / Companies House hit. Action: human review, fallback to other M09/M18 checks.
- `multiple_canonical_records_conflict` — ROR says X, GLEIF says Y, distance >5km. Action: human review.
- `institution_status_inactive` — Companies House `company_status=dissolved` or GLEIF `registration.status=LAPSED`. Action: hard flag.

## failure_modes_requiring_review

- **ROR is city-level only in v2.** Cannot do street-level matching. The check effectively becomes a city/region match against ROR.
- **GLEIF coverage gap:** small academic labs, US universities, and most non-financial entities have no LEI.
- **Companies House is UK-only.** Different national registries (corp registries in DE, FR, JP, etc.) require separate integrations [partly addressed by m09-corp-registry-stack as a separate idea].
- **Multi-campus institutions** (Harvard has Cambridge + Longwood + Allston; UC system has 10 campuses) — ROR may list one canonical city, customer ships to another.
- **Recently moved organizations** with stale registry data.
- **Name disambiguation failures:** "Stanford Research Institute" vs "Stanford University" — fuzzy matching can mis-link.
- **API outages:** ROR / Companies House / GLEIF downtime → check unavailable.

## false_positive_qualitative

- **Multi-campus universities and hospital systems** routinely ship to addresses far from the canonical "main" address.
- **Distributed research institutes** (e.g., Max Planck Institutes have ~85 sites in Germany).
- **Industry-academic joint ventures** at addresses not in either institution's registry record.
- **Recently relocated labs.**
- **Small / non-Western institutions** with no canonical record.
- **Contractors and CROs** legitimately shipping to a client's site rather than their own.

## record_left

- All canonical addresses pulled (ROR, GLEIF, Companies House), the customer-claimed address, the geocoded distances, the chosen tolerance band, the matched ROR/LEI/CH IDs, and the boolean match result. Stored in compliance log.

## attacker_stories_addressed

- `biotech-incubator-tenant` — attacker's LLC won't be in ROR (not a research org); will not be in GLEIF (no LEI); may be in Companies House if UK or in equivalent corp registries elsewhere → **partial catch** depending on whether the LLC matches some registry record at the incubator address.
- `shell-nonprofit` / `cro-framing` — the LLC will be in Companies House (or DE state registry), and its registered address WILL match the virtual office address. **The check passes the attacker.** Structural gap: the check verifies registry-claimed address matches shipping address; it doesn't verify the address is real lab space.
- `community-bio-lab-network` — same gap; the LLC's registered address matches the maker space.
- `dormant-domain` — if the revived lab's name matches an old ROR record AND the address has changed, the check CATCHES via mismatch.
- `it-persona-manufacturing` (sub-path C, sibling org at same institution) — the host institution IS in ROR; the address IS at the institution; check PASSES the attacker. Does not catch.
- `account-hijack` Method 2 (satellite facility address) — the satellite address won't match the institution's ROR record → CATCHES (in the city-level sense).

**Structural insight:** the canonical-address check is strong against "wrong institution claimed" but weak against "real institution but real shell entity at a real but non-research address."

Sources:
- [ROR home](https://ror.org/)
- [ROR v2 announcement](https://ror.org/blog/2024-04-15-announcing-ror-v2/)
- [ROR docs basics](https://ror.readme.io/docs/basics)
- [ROR data structure](https://ror.readme.io/docs/ror-data-structure)
- [GLEIF API](https://www.gleif.org/en/lei-data/gleif-api)
- [Companies House API overview](https://developer.company-information.service.gov.uk/overview)
- [Companies House rate limiting](https://developer-specs.company-information.service.gov.uk/guides/rateLimiting)
- [Companies House registered office address](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/registered-office-address)
