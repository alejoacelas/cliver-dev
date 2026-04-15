# m02-ror-domain-match — implementation v1

- **measure:** M02
- **name:** ROR institutional domain match
- **modes:** D, A
- **summary:** Look up the customer's claimed institution name against the Research Organization Registry (ROR) v2 API; from the matching record extract `links[type=website]` and the `domains[]` array (when populated). Strict match the customer's email apex domain against either. A match is a strong positive signal that the email domain belongs to the claimed institution.

## external_dependencies

- **ROR v2 API** — public, free ([ROR REST API](https://ror.readme.io/docs/rest-api); [ROR v2 changelog](https://ror.readme.io/changelog/2024-04-11-schema-api-v2)).
- Optional: ROR full data dump on Zenodo (monthly), for offline matching.

## endpoint_details

- **Base URL:** `https://api.ror.org/v2/organizations`
- **Query by name:** `GET https://api.ror.org/v2/organizations?query=<name>` ([ROR API query](https://ror.readme.io/docs/api-query)).
- **Affiliation matcher:** `GET https://api.ror.org/v2/organizations?affiliation=<freetext>` returns ranked match candidates with confidence scores ([ROR matching](https://ror.readme.io/docs/matching)).
- **Single record:** `GET https://api.ror.org/v2/organizations/<ror_id>`.
- **Auth:** none.
- **Rate limit:** Documented as 2,000 requests / 5 minutes per IP ([ROR REST API](https://ror.readme.io/docs/rest-api)) — well above any KYC need.
- **ToS:** CC0 public-domain data. No commercial-use restriction.
- **Pricing:** $0.

## fields_returned

ROR v2 record (relevant fields, [ROR schema v2](https://ror.readme.io/docs/schema-v2)):
- `id` — ROR identifier (e.g., `https://ror.org/03vek6s52`)
- `names[]` — `{value, types[], lang}` where types ∈ {`ror_display`, `label`, `alias`, `acronym`}
- `links[]` — `{type, value}` where type ∈ {`website`, `wikipedia`}
- `domains[]` — array of bare domain strings (e.g., `["harvard.edu"]`). **As of v2 launch (Apr 2024) this field is populated for some records but the curation is incomplete; many records still return `[]`** ([ROR v2 announcement](https://ror.org/blog/2024-04-15-announcing-ror-v2/)).
- `established` — year of founding
- `locations[]` — country, region, city
- `types[]` — e.g., `education`, `nonprofit`, `government`, `company`
- `status` — `active` / `inactive` / `withdrawn`
- `relationships[]` — parent / child / related ROR IDs

Affiliation matcher additionally returns per candidate: `score` (0–1), `chosen` (bool), `matching_type`.

## marginal_cost_per_check

- **Per check:** $0. One affiliation query + one detail fetch per customer = ~50 ms over the public API.
- **Setup cost:** ~1 day to integrate; ongoing cost ~$0 if querying live, or 1 cron job to pull the monthly Zenodo dump for offline match.

## manual_review_handoff

1. Run `affiliation=<institution_name_from_form>` to get top candidate. If `chosen=true` and `score > 0.9`, take it; otherwise present top 3 candidates to reviewer.
2. Extract `links.website` apex domain and any `domains[]` entries.
3. Compare to email apex (handle subdomains: `physics.harvard.edu` → `harvard.edu`).
4. If apex matches any → `ror_domain_match`. Pass.
5. If apex does not match → `ror_domain_mismatch`. Reviewer manually checks: (a) does the institution have multiple legitimate domains (medical school, alumni system) not yet in ROR? (b) is the email a free-mail or unrelated commercial domain?
6. If `affiliation` returns no match with `score > 0.5` → institution not in ROR; degrade gracefully (do not auto-flag, since ROR coverage is uneven).

## flags_thrown

| Flag | Trigger | Action |
|---|---|---|
| `ror_domain_match` | Email apex == ROR website apex OR appears in `domains[]` | Positive — pass |
| `ror_domain_mismatch` | ROR record found but email apex doesn't match | Reviewer adjudicates |
| `ror_no_record` | No `affiliation` candidate `score > 0.5` | Degrade — do not flag, but record |
| `ror_inactive` | Matched record `status != active` | Elevate |

## failure_modes_requiring_review

- ROR coverage uneven outside US/EU: many South American, African, and small Asian institutions absent ([ROR FAQs](https://ror.org/about/faqs/)).
- Institutions with multiple legitimate domains (e.g., `harvard.edu`, `hms.harvard.edu`, `harvard-affiliated-hospital.org`) — `domains[]` may not enumerate them all.
- Hospitals and government labs sometimes appear under their parent ministry name in ROR.
- API outage → fall back to cached Zenodo dump.

## false_positive_qualitative

- A real researcher at a small foreign institution not in ROR will be flagged `ror_no_record`. The SOP must NOT auto-deny on this — only contribute to a manual queue.
- Researchers at ROR-listed institutions who legitimately use a personal Gmail or a centre-specific subdomain not listed in `domains[]` will trip `ror_domain_mismatch`.
- **Structural gap from `shell-nonprofit` attacker story:** ROR has a self-curation submission path. The attacker file explicitly notes: "ROR inclusion requires acknowledgment by multiple people in research-output affiliations; single-person organizations are explicitly out of scope." → ROR is robust against the lone-shell attack but **NOT robust against a multi-author preprint coordination effort** sustained over several months.

## record_left

- ROR ID matched, score, chosen flag
- The matching `links[]` and `domains[]` arrays
- Email apex compared
- Final flag

## attacker_stories_addressed

- `free-mail-affiliation` — caught (email apex = `gmail.com` will not appear in any ROR record).
- `lookalike-domain` — caught (`harvad.edu` is not in `harvard.edu`'s ROR record).
- `dormant-domain` — caught only if the original institution's ROR record never listed the dormant domain; defeated where the attacker reanimates a domain that *is* in ROR.
- NOT caught: `shell-company`, `cro-framing`, `inbox-compromise` (each provides a domain genuinely associated with a real-but-unrelated entity, not a fake collision).
