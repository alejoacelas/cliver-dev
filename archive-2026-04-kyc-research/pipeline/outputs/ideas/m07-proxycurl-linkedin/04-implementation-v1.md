# m07-proxycurl-linkedin — Implementation v1

- **measure:** M07 — institution-affiliation-low-scrutiny
- **name:** Proxycurl LinkedIn person-lookup
- **modes:** A
- **summary:** Use Proxycurl's Person Lookup Endpoint to retrieve a structured profile for the customer (by name + company / institution domain). Compare current employer, employment tenure, and profile age against the customer's claimed institution to corroborate (or contradict) the affiliation.

## external_dependencies

- **Proxycurl (Nubela)** — third-party LinkedIn data enrichment API operating off scraped + cached LinkedIn profile data. ([source](https://nubela.co/proxycurl/docs))
- A name-disambiguation module for common-name handling.
- Human reviewer for edge cases.

## endpoint_details

- **Person Lookup Endpoint:** `GET https://nubela.co/proxycurl/api/v2/linkedin` (Person Profile Endpoint when you already have a LinkedIn URL); Person Lookup variant accepts `first_name`, `last_name`, `company_domain`, `location`. ([source](https://nubela.co/proxycurl/docs), [source](https://dev.to/veektor_v/lookup-anybody-on-linkedin-using-proxycurls-people-api-2d0o))
- **Auth model:** Bearer API key in `Authorization` header. ([source](https://nubela.co/proxycurl/docs))
- **Pricing model:** credit-based; **1 credit per successful Person Profile lookup**. ([source](https://medium.com/@proxycurl/the-linkedin-api-pricing-guide-you-need-and-how-to-get-access-d2bf20242944)) Credits are bought in packs; pay-as-you-go pricing on the Proxycurl pricing page is on the order of **$0.01–$0.02 per credit** at typical volume. [best guess: based on Proxycurl's widely-cited entry-tier pricing of ~$10 per 1,000 credits at low volume; the exact tier table is on `nubela.co/proxycurl/pricing` and was not retrieved verbatim in this iteration.] [vendor-gated — exact tier breaks behind a pricing page that v2 should fetch.]
- **Rate limits:** Proxycurl publishes rate limits in their docs; typical default is on the order of 300 requests per minute on production keys. [unknown — searched for: "proxycurl rate limit person lookup", "proxycurl 429 burst limit" — exact published cap not surfaced; v2 should fetch the docs page.]
- **ToS constraints:** Proxycurl's positioning is that they collect data "legally" via web scraping of public LinkedIn profiles and serve it via API. Use for KYC/screening is not explicitly prohibited but is also not explicitly authorized; LinkedIn's own ToS prohibits automated scraping of LinkedIn by third parties, and the legal status was litigated in *hiQ Labs v. LinkedIn* (still contested). ([source](https://nubela.co/blog/does-proxycurls-linkedin-api-pull-contact-information-from-linkedin-profiles/)) **Material legal risk:** synthesis providers using Proxycurl for KYC may face downstream legal exposure if LinkedIn's ToS is enforced or if scraped data is deemed not lawfully obtained under GDPR/CCPA. [best guess: legal review required before production use.]

## fields_returned

Per Proxycurl Person Profile schema (advertised >50 attributes; subset relevant to KYC):

- `public_identifier`, `profile_pic_url`, `background_cover_image_url`
- `first_name`, `last_name`, `full_name`, `headline`, `summary`
- `country`, `country_full_name`, `city`, `state`
- `experiences[]` — each with `starts_at`, `ends_at`, `company`, `company_linkedin_profile_url`, `title`, `description`, `location`
- `education[]` — degree, field of study, school, dates
- `accomplishment_*[]`, `volunteer_work[]`, `certifications[]`
- `connections` (count bucket), `follower_count`
- `personal_emails[]`, `personal_numbers[]` (premium parameter, extra credits)
- `inferred_salary` (premium)

[vendor-described, not technically documented as a freshness guarantee: profile age (`profile_creation_date`) is not directly returned; "profile age" must be approximated from the earliest `experiences[].starts_at` or `education[].starts_at`.] [unknown — searched for: "proxycurl profile creation date field", "proxycurl profile age attribute" — Proxycurl does not appear to expose a creation timestamp.] ([source](https://nubela.co/proxycurl/docs))

## marginal_cost_per_check

- 1 lookup = 1 credit. At ~$0.01–$0.02/credit, **~$0.01–$0.02 per customer**. [best guess: Proxycurl entry-tier $10/1k credits.]
- High-confidence flow may need 2 lookups (one Person Lookup by name, one Person Profile by URL): ~$0.02–$0.04. 
- **setup_cost:** ~$5–10k engineering for the API client + scoring heuristics. [best guess: 1 engineer-week.]

## manual_review_handoff

When the check fires:

1. **`linkedin_no_profile`** — reviewer manually searches LinkedIn (free web), Google for `"<name>" linkedin <institution>`, and ORCID. If found via manual search → mark as Proxycurl false negative; clear flag. If not found → escalate to "fake-affiliation candidate."
2. **`linkedin_employer_mismatch`** — reviewer reads the `experiences[]` array; if the customer recently transitioned employers (within 6 months) and LinkedIn lags, accept with note. If employer is fundamentally different (different city, different sector), escalate.
3. **`linkedin_profile_lt_12mo`** — reviewer checks education history. A real new graduate or new postdoc will have an established education record even if their professional history is short; a manufactured profile typically has both a short professional history *and* a sparse / fabricated education record. Make holistic call.
4. All cases: send a templated "please confirm your institutional role; we'll be in touch with your PI/department admin" email and require a same-domain reply.

## flags_thrown

- `linkedin_no_profile` — Person Lookup returned no results. **Action:** human triage.
- `linkedin_employer_mismatch` — current employer in `experiences[0].company` does not match the claimed institution name (after fuzzy normalization). **Action:** human triage.
- `linkedin_profile_lt_12mo` — earliest professional `experiences[].starts_at` is < 12 months ago. **Action:** soft signal; combine with other flags.
- `linkedin_thin_profile` — fewer than 5 connections-bucket OR no profile photo OR no education entries. **Action:** soft signal.

## failure_modes_requiring_review

- 404 from Proxycurl (profile not in their cache).
- Rate-limit 429.
- Common-name collision returning multiple candidates.
- Customer uses a non-Western name and Proxycurl's LinkedIn coverage is sparse for the region.
- Customer is in a country where LinkedIn usage is rare (Russia, China — LinkedIn left China in 2021).
- LinkedIn ToS / legal challenge interrupts Proxycurl's data freshness or service availability.

## false_positive_qualitative

- Researchers who don't use LinkedIn (common among academic faculty in many countries; common among lab technicians and clinical researchers).
- Researchers in China, Russia, parts of the Middle East where LinkedIn is blocked or unused.
- New hires whose LinkedIn lags their actual employment by weeks–months.
- Researchers who use a different name on LinkedIn (married name, romanized name, nickname).
- Postdocs at institutions where LinkedIn culture is weak (most life-sciences wet labs).

## record_left

- Full Proxycurl JSON response (or hash + key fields if storage cost matters).
- Original lookup parameters.
- Timestamp + Proxycurl request ID.
- Reviewer notes if triaged.

## Open issues for v2

- Proxycurl exact pricing tiers from `nubela.co/proxycurl/pricing` (currently `[best guess]` / `[vendor-gated]`).
- Published rate-limit numbers (currently `[unknown]`).
- Legal posture re LinkedIn ToS for KYC use — potentially blocking; legal review required.
- Coverage gaps for non-LinkedIn-using researcher populations (deferred to stage 6).
