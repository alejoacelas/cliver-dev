# m20-ror-disjointness — implementation v1

- **measure:** M20 (voucher-legitimacy-soc)
- **name:** Voucher ↔ customer ROR disjointness rule
- **modes:** A (rule-based with manual adjudication branch)
- **summary:** Resolve both the customer's institution and the voucher's institution to canonical ROR IDs (using whichever upstream resolver is in place — m18-ror, ORCID employments, DKIM domain mapping). Apply a rule: the two ROR IDs must NOT be the same, AND must NOT be in a parent/child or sibling-via-common-parent relationship in the ROR registry, unless a documented cross-department exception applies. The check explicitly defends against same-shell vouching, internal vouching, and self-vouching from a re-skinned shell entity.

## external_dependencies

- **ROR REST API** (free, public, ~120k organizations). [source: [ROR FAQs](https://ror.org/about/faqs/), [About the ROR REST API](https://ror.readme.io/docs/rest-api)]
- An upstream resolver that produces a ROR ID for both customer and voucher. Candidates: m18-ror (registered shipping/billing institution name → ROR), ORCID `employments[0].disambiguated-organization-identifier` (often a ROR), DKIM-domain-to-ROR mapping table.
- Reviewer headcount for the legitimate same-institution exception path (cross-department vouching).

## endpoint_details

- **Base URL:** `https://api.ror.org/v2/organizations` (v2 schema is current; v1 still supported). [source: [ROR v2 announcement](https://ror.org/blog/2024-04-15-announcing-ror-v2/)]
- **Common queries used by this check:**
  - `GET /v2/organizations/{ror_id}` — fetch full record with `relationships`, `names`, `locations`, `status`.
  - `GET /v2/organizations?affiliation=<string>` — affiliation matcher; returns ranked candidates with `chosen:true` on the best match. [source: [ROR API affiliation parameter](https://ror.readme.io/docs/api-affiliation)]
- **Auth:** None currently required. **Important:** beginning Q3 2026 ROR will require a free client_id; without it, requests are throttled to 50/5min instead of the 2000/5min current ceiling. [source: [About the ROR REST API](https://ror.readme.io/docs/rest-api)]
- **Rate limits:** 2000 requests / 5 minutes per IP currently; 50/5min for unidentified requests after Q3 2026; 2000/5min remains the identified-client ceiling. [source: [About the ROR REST API](https://ror.readme.io/docs/rest-api)]
- **Pricing:** **$0**. ROR is a non-profit, openly licensed (CC0) registry. [source: [ROR FAQs](https://ror.org/about/faqs/)]
- **Bulk download:** Full ROR data dump available via Zenodo on a regular cadence (CC0). For an order-screening pipeline that runs many checks, the bulk dump avoids API throttling entirely.
- **ToS:** CC0; no usage restriction beyond attribution courtesy.

## fields_returned

ROR v2 record (relevant subset for this check):

- `id` — `https://ror.org/0...` canonical URL.
- `status` — `active` / `inactive` / `withdrawn`.
- `names[]` — `{value, types[ror_display, label, alias, acronym], lang}`.
- `locations[]` — `{geonames_id, geonames_details.country_code, country_name, lat, lng}`.
- `types[]` — e.g. `["education"]`, `["company"]`, `["nonprofit"]`, `["government"]`.
- `established` — year.
- `relationships[]` — `{id, label, type}` where type ∈ `Parent | Child | Related | Successor | Predecessor`. [source: [ROR relationships docs](https://ror.readme.io/docs/relationships)]
- `external_ids` — GRID, ISNI, FundRef, Wikidata mappings.
- `admin` — `{created.date, last_modified.date}`.

For the affiliation matcher endpoint, the response includes `chosen:true` on the top candidate plus a confidence score on each result. [source: [ROR matching docs](https://ror.readme.io/docs/matching)]

## marginal_cost_per_check

- **API calls:** 1–4 per check (resolve customer ROR, resolve voucher ROR, optionally fetch full records to compare relationships). At ~2000/5min limit and 4 calls/check, single-IP throughput ≈ 500 checks/5min ≈ 6000/hour. Easily handles realistic SOC volume.
- **Marginal cost:** **$0** (ROR is free).
- **Compute:** negligible (<$0.0001/check).
- **Setup cost:** Engineering to integrate the API, build the relationship-walker, and define the cross-department exception SOP. ~3–5 engineering days. [best guess: small REST integration + a graph traversal of `relationships[]` is straightforward]
- **Bulk-dump option:** ~50–200 MB Zenodo dump refreshed monthly; ETL to local Postgres ~1 day setup. [best guess: based on typical ROR dump sizes]

## manual_review_handoff

Standard SOP:

1. Resolve `customer_ror` and `voucher_ror` via upstream resolvers. If either is missing, route to alternate-evidence path (do not silently pass).
2. **Same-ID check:** if `customer_ror == voucher_ror`, FLAG `voucher_customer_same_ror`.
3. **Hierarchy check:** fetch both records. Walk `relationships[]` once on each side. If voucher_ror has a Parent/Child relationship to customer_ror (directly or via a single shared ancestor), FLAG `voucher_customer_related_ror`.
4. **Status check:** if either ROR has `status != active`, FLAG `voucher_inactive_ror`.
5. **Locale alignment check (soft):** if both RORs are in the same `geonames_id` AND the institution `types` contains `company` (not `education`/`nonprofit`/`government`), elevate to `voucher_customer_colocated_company`.
6. On any flag, route to reviewer with both ROR JSON snapshots side-by-side. Reviewer decides:
   - Allow if voucher provides a written explanation of cross-department independence (e.g. central biosafety officer attesting to a different lab); document in record.
   - Allow if voucher_ror is a parent organization (e.g. university system) and customer_ror is a constituent institute, AND voucher demonstrates cross-cutting authority (e.g. system-wide IBC chair).
   - Otherwise hard-decline the voucher and require a fresh independent voucher.

## flags_thrown

- `voucher_customer_same_ror` — exact match.
- `voucher_customer_related_ror` — parent/child or sibling-via-common-parent.
- `voucher_inactive_ror` — voucher institution flagged inactive/withdrawn in ROR.
- `voucher_customer_colocated_company` — both for-profit, same city.
- `voucher_ror_unresolved` — ROR resolver returned no chosen match for the voucher's institution string.
- `voucher_customer_disjoint` — pass case, recorded as positive evidence.

## failure_modes_requiring_review

- ROR affiliation matcher returns multiple low-confidence candidates → reviewer picks correct match or routes to upstream m18-ror for stronger evidence.
- ROR API throttling (after Q3 2026 unidentified-clients limit) → use bulk-dump fallback.
- Voucher's institution is genuinely not in ROR (small lab, brand-new spinoff, foreign institution under-represented). [source: [ROR coverage skewed to top 20 countries — STI 2022 paper](https://arxiv.org/pdf/2209.10821)]
- Hospital systems and university medical centers have complicated parent/child trees that can falsely trip the disjointness rule (legitimate cross-affiliation between med school and teaching hospital).
- Two RORs that are "same shell" but ROR has not yet recorded the relationship (e.g. very recent merger).

## false_positive_qualitative

- **Single-institution research environments:** small colleges where the entire science faculty is one department; legitimate vouchers will all share the customer's ROR.
- **University systems:** UC Berkeley vs. UC system-wide ROR; medical school vs. teaching hospital ROR. Legitimate vouching across these structures will be caught by the parent/child check.
- **Foreign institutions** with weak ROR coverage. [source: [STI 2022 — top 20 countries hold 80.9% of ROR IDs](https://arxiv.org/pdf/2209.10821)]
- **National-lab + university joint appointments** (LBNL + UC Berkeley), legitimate but the two RORs are formally Related.
- **Recent mergers / institutional renames** where ROR has not yet caught up.
- **Industry-academia consortia** where customer is at company and voucher is the academic PI of the same consortium — legitimate, but disjoint check passes (so this is a true negative not a false positive; mentioned for completeness).

## record_left

- Both ROR JSON records (customer + voucher) at time of check, with `admin.last_modified.date` so future audits can detect post-hoc record changes.
- The relationship walk result (path of edges traversed, or "no path found").
- The reviewer's adjudication note when an exception was granted, with the named cross-department independence justification.
- A SHA-256 hash of the snapshot for tamper evidence.

## Sources

- [ROR FAQs](https://ror.org/about/faqs/)
- [About the ROR REST API](https://ror.readme.io/docs/rest-api)
- [ROR API affiliation parameter](https://ror.readme.io/docs/api-affiliation)
- [ROR matching docs](https://ror.readme.io/docs/matching)
- [ROR relationships and hierarchies](https://ror.readme.io/docs/relationships)
- [ROR v2 announcement](https://ror.org/blog/2024-04-15-announcing-ror-v2/)
- [STI 2022 paper on ROR distribution by country](https://arxiv.org/pdf/2209.10821)
