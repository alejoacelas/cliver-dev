# 04C Claim check — m04-google-places-business v1

- **ToS clause "decisions, scoring, or assessments... housing, employment, credit, or insurance"** — sourced from [Maps Platform service-specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms). Search snippet directly quotes this text in the context of the Places Aggregate API, NOT necessarily the standard Places API. **OVERSTATED**: the document conflates "Places Aggregate API" (an aggregate stats API) with the standard Places API. Suggested fix: weaken claim to "Places Aggregate API ToS prohibits these uses; standard Places API ToS should be reviewed independently."
- **Pricing tiers $32/$35/$40 CPM** — sourced from third-party article. PASS as reasonable but note: Google's own pricing page is the authoritative source. Suggested fix: link [Google's Maps platform pricing list](https://developers.google.com/maps/billing-and-pricing/pricing) as primary.
- **"104 new types in Places New"** — confirmed by search snippet from [Places API release notes](https://developers.google.com/maps/documentation/places/web-service/release-notes). PASS.
- **Caching: only place_id exempt** — confirmed by [Places policies page](https://developers.google.com/maps/documentation/places/web-service/policies) snippet. PASS.

**Verdict:** REVISE (one OVERSTATED on ToS — needs disambiguation between Places Aggregate API and standard Places API; the structural risk warning may be weaker than written)
