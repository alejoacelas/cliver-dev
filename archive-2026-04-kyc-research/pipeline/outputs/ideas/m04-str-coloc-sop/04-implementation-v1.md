# m04-str-coloc-sop — Implementation v1

- **measure:** M04 — shipping-residential
- **name:** STR / Wayback co-location SOP
- **summary:** Manual reviewer SOP triggered when an upstream check (RDI, parcel, Places) flags an address as residential or ambiguous. Reviewer searches Airbnb / VRBO and the Wayback Machine for the address. STR co-location (a current or historical short-term-rental listing at the address) is a hard flag indicating a probable drop address rather than a real lab.

## external_dependencies

- **Airbnb public site search** (manual: search box at airbnb.com — no public API). [source](https://airbtics.com/airbnb-api-scraping/)
- **VRBO public site search** (manual).
- **Inside Airbnb** open data — quarterly snapshots of public listings for ~100 cities globally; address is not exact (Airbnb obfuscates to ~150m), but lat/lng + room type is. [source](https://insideairbnb.com/)
- **AirDNA** — commercial paid analytics over ~10M Airbnb/Vrbo listings; offers API. [source](https://www.airdna.co/airbnb-api)
- **Wayback Machine CDX Server API** — free, no auth, query by URL. [source](https://archive.org/help/wayback_api.php)
- **Reviewer time** — human SOP, ~10–20 minutes per flagged address.

## endpoint_details

- **Airbnb search:** `https://www.airbnb.com/s/{location-string}/homes` — manual web UI, no API. ToS prohibits automated scraping. [source](https://airbtics.com/airbnb-api-scraping/)
- **Inside Airbnb:** quarterly CSV downloads at [insideairbnb.com/get-the-data](https://insideairbnb.com/get-the-data); free for non-commercial use; commercial use unclear [unknown — searched for: "Inside Airbnb commercial use license", "Inside Airbnb data terms"].
- **AirDNA Market Minder API:** REST, API key, address-level lookup. Pricing [vendor-gated — public site says "contact sales"; market-level subscriptions documented at $19–$200+/mo, address-API pricing not public]. [source](https://apidocs.airdna.co/)
- **Wayback CDX:** `http://web.archive.org/cdx/search/cdx?url={url}` — GET, no auth, free, returns urlkey/timestamp/original/mimetype/status/digest/length. [source](https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md)
- **Wayback rate limits:** soft, ~15 req/min before throttling [unknown — searched for: "wayback CDX rate limit", "internet archive CDX throttle"].
- **Wayback URL search by address (not URL):** Wayback indexes by URL, not by physical address — to search by address, the SOP would query for known property listing URL patterns (`airbnb.com/rooms/*` mentioning the city) or use Google with `site:web.archive.org`. This is not a clean lookup.

## fields_returned

- **Airbnb manual search:** listing thumbnails, titles, approximate location pin, room type, host name, review count, price/night.
- **Inside Airbnb CSV:** `id`, `listing_url`, `name`, `host_id`, `host_name`, `neighbourhood`, `latitude`, `longitude` (obfuscated ~150m), `room_type`, `price`, `minimum_nights`, `availability_365`, `last_scraped`. [source](https://insideairbnb.com/get-the-data) [vendor-described, schema visible in CSV downloads]
- **AirDNA:** address-level historical occupancy, ADR, listing IDs, host IDs [vendor-described, partly documented in API docs].
- **Wayback CDX:** `urlkey`, `timestamp`, `original`, `mimetype`, `statuscode`, `digest`, `length`. [source](https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md)

## marginal_cost_per_check

- **Reviewer time:** 10–20 min @ $50/hr loaded = **$8–17/check**.
- **Inside Airbnb:** $0 (CSV download).
- **AirDNA address lookup:** [vendor-gated — likely $0.10–$1/lookup based on comparable real-estate APIs, best guess].
- **Wayback CDX:** $0.
- **setup_cost:** ~1 day to write the SOP document and reviewer training.

## manual_review_handoff

When upstream M04 check fires `address_residential` or `address_ambiguous`:
1. Reviewer copies the customer's full address into airbnb.com search; visually scans the map for listings within ~100m of the address pin.
2. Reviewer cross-checks Inside Airbnb CSV for the city if available (free, more rigorous).
3. Reviewer copies the address into vrbo.com search; repeats.
4. Reviewer queries Wayback CDX for the customer's claimed institution domain to check if domain history is consistent with claim age (cross-supports m02 checks).
5. Reviewer queries Google for `"<address>" airbnb` and `"<address>" vrbo` (Google's index often surfaces listings the on-site search misses).
6. **Decision rule:**
   - Listing currently active at the address → `address_is_str`, hard flag, escalate to deny unless customer provides exceptional documentation (e.g., a lease showing they rented the unit long-term).
   - Listing historically active but currently inactive → `address_wayback_str_history`, soft flag, ask customer to clarify lease status.
   - No STR found → clear this dimension; other M04 checks govern.
7. Reviewer saves screenshots of search results to the order compliance log.

## flags_thrown

- `address_is_str` — current STR listing at address. Action: hard hold, request lease.
- `address_wayback_str_history` — historical STR listing. Action: soft hold, customer Q&A.
- `str_review_inconclusive` — manual search returned ambiguous results. Action: senior reviewer.

## failure_modes_requiring_review

- Inside Airbnb's lat/lng obfuscation (~150m) means many addresses can't be matched precisely.
- Airbnb hosts can de-list quickly; an active drop site may have been delisted between the booking and the screening.
- VRBO / Booking.com / direct-rental sites are not in Inside Airbnb.
- Apartment buildings with unit-level addresses: a unit-2B STR doesn't surface when only the building address is searched.
- Wayback for STR listing URLs requires knowing the listing ID — circular.
- Manual SOP doesn't scale to bulk screening; only triggered by upstream flags.

## false_positive_qualitative

- **Long-term Airbnb tenants:** some legitimate researchers stay in Airbnb-owned long-term apartments for relocation; the unit was an STR but they have a multi-month lease. Catches them on `address_wayback_str_history`.
- **Multi-unit buildings** where an unrelated neighbor is the host but the customer's specific unit is a real residence/lab.
- **Co-living spaces** that overlap STR and long-term rental categories.

## record_left

- Screenshots of Airbnb / VRBO / Google search results, Wayback CDX query output, reviewer notes with the decision rule applied. Stored in order compliance log.

## attacker_stories_addressed

- `dormant-domain` (residential-colocation sub-config — catches if attacker uses an Airbnb)
- `community-bio-lab-network` (catches the rare attacker who uses an STR rather than their own home)
- `foreign-institution` Method 4 ("residential address" via short-term rental) — directly targets this; the attacker explicitly enumerates the $500–$2,000/mo STR option

Sources:
- [Airbnb scraping legality](https://airbtics.com/airbnb-api-scraping/)
- [Inside Airbnb home](https://insideairbnb.com/)
- [Inside Airbnb data downloads](https://insideairbnb.com/get-the-data)
- [AirDNA](https://www.airdna.co/)
- [AirDNA API docs](https://apidocs.airdna.co/)
- [Wayback APIs](https://archive.org/help/wayback_api.php)
- [Wayback CDX server](https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md)
