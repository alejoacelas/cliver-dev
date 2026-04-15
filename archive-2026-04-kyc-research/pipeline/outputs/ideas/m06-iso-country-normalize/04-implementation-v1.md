# m06-iso-country-normalize — implementation research v1

- **measure:** M06 — shipping-export-country
- **name:** ISO 3166 normalization + sanctioned-territory geofence
- **modes:** D (deterministic table + geofence)
- **summary:** Normalize the destination country (and any sub-region or oblast text) to canonical ISO 3166-1 alpha-2 / alpha-3 codes; cross-reference any free-text city/region against a curated geofence list of OFAC- and EU-sanctioned sub-national territories (Crimea, Donetsk People's Republic, Luhansk People's Republic, Kherson and Zaporizhzhia oblasts under varying scope, North Korea variants). Hard-block addresses inside the geofence even when the country code resolves to an otherwise-allowed country (Ukraine, Russia).

- **attacker_stories_addressed:** foreign-institution; supports m06-bis-country-groups by providing the country/sub-region key

## external_dependencies

- **ISO 3166-1 country list.** Public ISO standard. The canonical machine-readable copy is gated behind ISO purchase, but the de facto open mirrors are:
  - [Debian iso-codes package](https://salsa.debian.org/iso-codes-team/iso-codes) (open source, frequently updated, used by most Linux distros)
  - [Unicode CLDR territory data](https://github.com/unicode-org/cldr) (locale-aware names in multiple languages)
  - [pycountry](https://github.com/pycountry/pycountry) (Python wrapper around iso-codes)
- **ISO 3166-2 subdivision codes.** Same Debian/CLDR sources. Important caveat: [ISO 3166-2:RU on Wikipedia](https://en.wikipedia.org/wiki/ISO_3166-2:RU) explicitly notes that ISO 3166-2 contains NO codes for the Russian-administered Crimea, Donetsk, Kherson, Luhansk, Sevastopol, and Zaporizhzhia, because these are internationally recognized as Ukraine. Geofence list must NOT rely on the standard alone.
- **OFAC sanctioned territories:**
  - [OFAC Ukraine-/Russia-related Sanctions program page](https://ofac.treasury.gov/sanctions-programs-and-country-information/ukraine-russia-related-sanctions)
  - [OFAC FAQ 1009](https://ofac.treasury.gov/faqs/1009) on Crimea region scope
  - [Executive Order 13660](https://ofac.treasury.gov/sanctions-programs-and-country-information/ukraine-russia-related-sanctions) (March 2014) and [Executive Order 14065](https://ofac.treasury.gov/sanctions-programs-and-country-information/ukraine-russia-related-sanctions) (February 2022) — the legal hooks for the Crimea + DPR/LPR comprehensive sanctions.
  - [31 CFR Part 589](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-589) — codified Ukraine-/Russia-related sanctions regulations.
- **EU sectoral sanctions** (Council Regulation (EU) 2022/263 and successors) — covers DPR/LPR/Kherson/Zaporizhzhia for EU-domiciled providers.
- **North Korea name variants:** "DPRK," "Korea, Democratic People's Republic of," "조선," "Choson," "Chosun," "North Korea." Required for OFAC SDN matching.

## endpoint_details

- **No vendor API needed.** Pattern: ingest the open ISO 3166-1/-2 dataset once, store as a local lookup; build a small geofence table from OFAC EOs and FAQ pages; refresh on EO change.
- **Optional vendor APIs** (for address-grade resolution rather than country normalization alone):
  - [Smarty (formerly SmartyStreets) International API](https://www.smarty.com/products/international-address-verification): canonicalizes addresses to ISO + sub-region codes. Pricing tiered, [public price page](https://www.smarty.com/pricing) starting at ~$0.005–$0.015/lookup at low volumes; volume contracts at lower per-call price `[best guess: at 100K orders/yr ~$1K–$5K total]`.
  - [Loqate](https://www.loqate.com/) — Experian-owned address verification with international coverage.
  - [Google Maps Geocoding API](https://developers.google.com/maps/documentation/geocoding) — pricing $5 per 1000 calls at standard tier as of 2024; ToS restricts certain compliance use cases.
- **Auth:** API key for any vendor; none for the open ISO datasets.
- **Rate limits:** Vendor-dependent. ISO ingest is N/A.
- **ToS:** Smarty and Loqate permit compliance use; Google Maps ToS restricts use cases that don't display the map and is generally a weak fit for backend compliance pipelines.

## fields_returned

For each address normalization:

- `country_iso2` (e.g., "UA")
- `country_iso3` (e.g., "UKR")
- `country_name_canonical`
- `subdivision_iso` (ISO 3166-2 if available, e.g., "UA-43" for Crimea — note: ISO 3166-2:UA does code Crimea, but ISO 3166-2:RU does not)
- `subdivision_name_canonical`
- `geofence_match` (Crimea | DPR | LPR | Kherson_occupied | Zaporizhzhia_occupied | DPRK | none)
- `ofac_program` (UKRAINE-EO13685 | UKRAINE-EO14065 | DPRK | etc.)
- `confidence` (only meaningful when a vendor address-verification API is used)
- `original_text` (raw address as submitted)

## marginal_cost_per_check

- **Open ingest path:** $0.00 per check; lookup is local.
- **Vendor address-verification path:** ~$0.005–$0.015 per address with Smarty `[best guess: low-volume tier]`; lower at scale.
- **setup_cost:** ~$5K–$15K to ingest, build the geofence table, and write the OFAC EO refresh procedure `[best guess]`.

## manual_review_handoff

- **Geofence hit:** auto-block. Reviewer documents the address text, the matched geofence region, the EO authority, and reports per OFAC requirements. No reviewer override.
- **Country-code ambiguity:** if the address text mentions Crimea but the country field says "Russia" (the attacker's framing) or "Ukraine" (the victim country's framing) → reviewer disambiguates and treats as geofence hit regardless of country code.
- **Free-text city/region matches a sanctioned territory but the address as a whole is in an allowed country:** escalate (this is the sub-region geofence's whole purpose). E.g., a US-domiciled address that says "shipping coordinator: Donetsk office" — reviewer escalates as a possible re-export disclosure.
- **Vendor API confidence below threshold:** reviewer manually verifies.

## flags_thrown

- `sanctioned_subregion` — geofence hit on Crimea / DPR / LPR / Kherson / Zaporizhzhia / DPRK variants → auto-block
- `country_code_mismatch` — text-extracted region disagrees with declared country code → escalate
- `unrecognized_country_token` — free text doesn't normalize → escalate
- `address_resolution_low_confidence` — vendor API returned low confidence → escalate
- `address_text_contains_sanctioned_locality_keyword` — free-text mention of a sanctioned locality even in an unrelated address line → escalate

## failure_modes_requiring_review

- Address text in non-Latin script (Cyrillic, Korean, Arabic) — must be transliterated.
- Sanctioned region in a language variant the geofence table doesn't include (e.g., "Крим" vs "Crimea" vs "Krym").
- Address that's technically in an allowed country but uses a Russian-administered postal code for an occupied territory.
- Recently-sanctioned territory not yet in the table (Kherson and Zaporizhzhia scope is "as determined by the Secretary of the Treasury" under EO 14065 — scope can change without legislative action).
- Address normalization vendor returns a "near-match" that drops the sub-national qualifier.
- Disputed status: Kherson and Zaporizhzhia are NOT in OFAC's comprehensively-sanctioned territory set as of late 2025/early 2026 (per [OFAC FAQ guidance summarized in Cleary Gottlieb / Winston & Strawn alerts](https://www.clearygottlieb.com/news-and-insights/publication-listing/sanctions-developments-resulting-from-the-geopolitical-conflict-in-ukraine---united-states)) — the SOP must distinguish "comprehensively sanctioned" from "subject to material support / 14024 risk."

## false_positive_qualitative

- **Legitimate Ukrainian customers** in Kyiv, Lviv, Odesa whose address text mentions "Donetsk" or "Luhansk" because of organizational or historical context (a displaced university registered in Donetsk that now operates from Vinnytsia).
- **North Korean transliteration collisions** with South Korean cities or surnames.
- **Russia-domiciled customers in non-occupied regions** misclassified due to vendor address resolution rounding to a sanctioned label.
- **Crimea-displaced institutions** legally re-registered in mainland Ukraine but whose name still includes "Crimea."
- **Diaspora addresses** in third countries that contain a sanctioned-locality keyword in the company name or department.

## record_left

- The original address text as submitted
- The normalized address (country, subdivision, geofence match)
- The data source version (ISO 3166 dataset commit hash; OFAC EO/regulation date)
- Disposition + reviewer signoff if escalated

Retention: 5 years per [15 CFR § 762.6](https://www.bis.gov/regulations/ear/part-762-recordkeeping). For OFAC purposes, retention is also 5 years per [31 CFR § 501.601](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-501/subpart-F/section-501.601).

## bypass_methods_known

(Stage 5 fills.)

## bypass_methods_uncovered

(Stage 5 fills.)
