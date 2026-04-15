# m04-google-places-business — Implementation v1

- **measure:** M04 — shipping-residential
- **name:** Google Places business presence
- **summary:** Query Google Places API (New) Nearby Search at the shipping address coordinates. Inspect business types, photos, and reviews of any place matched. No business present (or only residential-adjacent categories like "lodging") at an institutional address is a soft flag.

## external_dependencies

- **Google Places API (New)** — Nearby Search and Place Details endpoints. [source](https://developers.google.com/maps/documentation/places/web-service/overview)
- **ToS constraint:** Places API terms restrict using output for "decisions, scoring, or assessments... regarding an individual that relates to housing, employment, credit, or insurance." [source](https://cloud.google.com/maps-platform/terms/maps-service-terms). Customer-screening for B2B legitimacy is not literally any of these four categories, but a conservative legal read should be obtained before deployment. Flag this as a **structural ToS risk**.

## endpoint_details

- **Endpoint:** `https://places.googleapis.com/v1/places:searchNearby` (Nearby Search New). Auth: API key in `X-Goog-Api-Key` header. [source](https://developers.google.com/maps/documentation/places/web-service/overview)
- **Pricing (Places API New, 2026):** Nearby Search SKUs tiered by FieldMask: **Basic $32/1000**, **Advanced $35/1000**, **Preferred $40/1000**. [source](https://nicolalazzari.ai/articles/understanding-google-maps-apis-a-comprehensive-guide-to-uses-and-costs)
- **Free credit:** $200/month free tier ended February 2025; current model is pay-as-you-go SKU billing. [source](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- **Rate limits:** Default 600 QPM per project, raisable on request [unknown — searched for: "Google Places API New rate limit QPM 2026", "places api nearby search quota"].
- **Caching constraint:** Most response fields cannot be cached >30 days; only `place_id` is exempt. [source](https://developers.google.com/maps/documentation/places/web-service/policies)

## fields_returned

From `places:searchNearby` for each place: `id`, `name` (display), `formattedAddress`, `location` (lat/lng), `types[]` (104 supported types in New API including `university`, `research_institute_not_specifically_named`, `medical_lab`, `hospital`, `school`, `lodging`, `apartment_building`, `private_residence`-equivalent), `businessStatus`, `primaryType`, `primaryTypeDisplayName`, `userRatingCount`, `rating`, `photos[]`, `googleMapsUri`. [source](https://developers.google.com/maps/documentation/places/web-service/release-notes)

## marginal_cost_per_check

- One Nearby Search at Basic SKU = **$0.032/check**. With Advanced fields (types + business status + rating) = **$0.035/check**. [source](https://nicolalazzari.ai/articles/understanding-google-maps-apis-a-comprehensive-guide-to-uses-and-costs)
- **setup_cost:** API key provisioning + integration ~1 day. Legal review of ToS for screening use is the gating cost (could be days to weeks).

## manual_review_handoff

When `no_places_business_at_address` or `places_category_mismatch` fires:
1. Reviewer opens the order in the screening console; system auto-fetches the Places query response.
2. Reviewer eyeballs the matched place's category, photos, and reviews against customer's claimed lab/institution name.
3. Reviewer cross-references claim against Google Maps street view (manual) for visible signage.
4. If category is `lodging`/`apartment_building`/`private_residence`, reviewer treats as residential-equivalent and routes through residential carve-out playbook.
5. If category is `university`/`hospital`/`medical_lab`, reviewer marks as soft-positive and clears unless other flags fire.
6. Reviewer logs Place ID and decision rationale.

## flags_thrown

- `no_places_business_at_address` — zero results within 30m radius. Action: human review.
- `places_category_mismatch` — matched place has type incompatible with claimed institution (e.g., customer claims "BioLabs SD" but matched place is "Starbucks"). Action: human review.
- `places_category_residential` — matched place type is `lodging`/`apartment_building`. Action: route to residential review.
- `places_business_status_closed` — `businessStatus = CLOSED_PERMANENTLY`. Action: human review.

## failure_modes_requiring_review

- New labs not yet on Places (Places typically lags by 3–12 months for new businesses) [best guess: from general user-content moderation lag in Google Maps].
- Multi-tenant buildings where the Places result is the property manager / coffee shop, not the lab.
- Geocoding ambiguity at large addresses (e.g., a university campus has many nearby Places).
- Quota exhausted / API error → check unavailable, route to RDI fallback.
- Place categories ambiguous (`establishment` only, no specific type).

## false_positive_qualitative

- New / stealth-mode startups not yet listed.
- Labs that intentionally do not have a public Maps presence (security-conscious orgs).
- Labs in shared incubator buildings where Places returns the incubator brand, not the tenant — needs cross-check with m05-incubator-tenant.
- International addresses where Places coverage is uneven (especially rural, non-OECD).

## record_left

- JSON response from `places:searchNearby`, the chosen `place_id`, the matched `types[]`, and the reviewer's adjudication. Stored in order's compliance log.

## attacker_stories_addressed

- `community-bio-lab-network` (catches absence of any business at residential address)
- `dormant-domain` (residential-colocation: catches; biotech-coworking variant: probably passes)
- `foreign-institution` (uneven Places coverage internationally — weak signal)
- `cro-framing` virtual office method: would PASS (Places lists Regus etc. as commercial)

## ToS structural risk

The Places API terms prohibit using API output for decisions about individuals re: housing/employment/credit/insurance [source](https://cloud.google.com/maps-platform/terms/maps-service-terms). DNA synthesis customer screening is not one of those four enumerated categories, but the spirit of the clause is anti-profiling, and Google has historically been aggressive about enforcement. This idea should not ship without a legal opinion.

Sources:
- [Places API overview](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Places API release notes (104 types)](https://developers.google.com/maps/documentation/places/web-service/release-notes)
- [Places API usage & billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Maps platform pricing list](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Maps platform service-specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
- [Places policies (caching)](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Pricing breakdown article](https://nicolalazzari.ai/articles/understanding-google-maps-apis-a-comprehensive-guide-to-uses-and-costs)
