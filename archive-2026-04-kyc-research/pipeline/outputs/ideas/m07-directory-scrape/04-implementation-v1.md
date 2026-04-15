# m07-directory-scrape — implementation research v1

- **measure:** M07 — institution-affiliation-low-scrutiny
- **name:** Institutional directory people-search scrape
- **modes:** A (per-institution scrape with cached HTML; partial automation, manual fallback)
- **summary:** For the customer's claimed institution, query (or scrape) the institution's public people-search / faculty / staff directory. Verify name match, email match (against the customer-provided email), department, and listed role. Multiple per-institution adapters: HTML scrape with CSS-selector parser; LDAP-over-public-portal where available; eduPerson attribute lookups via federated SAML for InCommon members (a separate idea, m07-incommon-edugain, covers the federated leg). This idea is the bottom-of-funnel HTML scrape used when no federated route exists.

- **attacker_stories_addressed:** unrelated-dept-student, lab-manager-voucher, visiting-researcher (Option 1 / partial), insider-recruitment, account-hijack — all of which expose attackers who *are* legitimately listed; the directory scrape serves to confirm presence rather than to discriminate intent. Negative-signal value against: dormant-account-takeover Bypass C, dormant-domain (when the directory is third-party rather than self-controlled).

## external_dependencies

- **Per-institution public directory pages.** No standardization. Each major US university hosts a "people search" or "directory" page; thousands of variants.
- **EDUCAUSE / Internet2 [eduPerson schema](https://wiki.refeds.org/display/STAN/eduPerson)** — defines `eduPersonAffiliation`, `eduPersonScopedAffiliation`, `eduPersonEntitlement` etc. that institutional directories *can* expose, but the public web directory rarely emits these as structured data.
- **InCommon Federation** — for federated members, attribute release is the more reliable path; out of scope for this idea (see m07-incommon-edugain).
- **Web-scrape tooling** — Playwright / Puppeteer / Scrapy for the HTML path; rotating user-agent and respectful crawl delay.
- **GDPR / FERPA constraints.** EU institutions under GDPR commonly suppress individual directory entries by default (legitimate-interest balancing). US universities under FERPA may suppress student records but typically expose faculty/staff. The scrape must respect both.
- Robots.txt (legally non-binding in the US per most circuit decisions, but operationally important — see [Brown et al. 2025 web-scraping ethics paper](https://journals.sagepub.com/doi/10.1177/20539517251381686) for the current legal-and-ethical landscape).

## endpoint_details

- **No single endpoint.** Implementation pattern:
  1. Maintain a registry of per-institution scrape adapters (`{ institution_id, base_url, search_url_template, css_selectors_for_name/email/dept/title, robots_compliant_delay }`).
  2. For each new customer claim, look up the adapter; if absent, fall back to a generic "search Google for `<name> site:<institution-domain>`" approach (covered in sister idea m07-google-site-search).
  3. Issue search request, parse, return structured record.
  4. Cache HTML response for the audit trail.
- **Auth:** None for public directories. Some institutions gate the directory behind SSO — those are unscrapable by design and the scrape returns "directory_gated" → manual fallback.
- **Rate limits:** Self-imposed crawl delay (~5–30 seconds between requests at the same institution) per common scraping etiquette. No published rate limits because there's no API.
- **Pricing:** $0 raw data; engineering cost (per-institution adapter writing) is the dominant cost.
- **ToS:** Most US university websites have ToS that nominally restrict automated access. Enforcement is weak; the [Brown et al. 2025 paper](https://journals.sagepub.com/doi/10.1177/20539517251381686) and the [California Law Review "Great Scrape"](https://www.californialawreview.org/print/great-scrape) survey establish that ToS-based prohibitions on scraping are not automatically legally enforceable absent a click-through agreement and demonstrated harm. EU/UK GDPR is the harder constraint — scraping personal data of EU data subjects requires a lawful basis, and "compliance with US export controls" is a defensible legitimate-interest argument but not bulletproof.

## fields_returned

For a successful directory hit:

- `match_status` (exact | fuzzy | none | gated | error)
- `matched_name` (as listed)
- `matched_email` (if exposed)
- `matched_department`
- `matched_title` (assistant professor / lab manager / staff scientist / visiting / etc.)
- `matched_affiliation_type` (faculty | staff | student | visiting | emeritus | unknown)
- `matched_url` (the directory page where the record was found)
- `cached_html_blob_id`
- `scrape_timestamp`
- `name_similarity_score` (when fuzzy)

[best guess: this is the standard normalization a screening team would apply across heterogeneous adapters.]

## marginal_cost_per_check

- **Adapter exists for the institution:** ~$0.001 per check (compute + cache I/O).
- **No adapter; manual reviewer fallback:** ~$15–$30 per check (10–20 minutes of reviewer time at fully-loaded ~$60/hr).
- **setup_cost:** Per-adapter ~2–8 hours of engineering = ~$200–$800/adapter `[best guess: standard scraper development with selector tuning and one round of failure debugging]`. Maintaining ~200 top US R1 + R2 adapters: ~$40K–$160K one-time, plus ongoing maintenance (institutional sites get redesigned ~1–3 times/year on average).
- **Vendor alternatives:**
  - [Proxycurl LinkedIn API](https://nubela.co/proxycurl/) — gives a different signal (LinkedIn-asserted affiliation). Sister idea m07-proxycurl-linkedin handles this. Pricing ~$0.01–$0.10 per profile lookup at low volumes.
  - Generic web-scraping platforms (Bright Data, Apify) — pay-per-call.

## manual_review_handoff

- **Exact match (name + email + institution):** clear.
- **Name match but no email exposed:** soft pass; reviewer notes the lack of email confirmation.
- **No match in directory but adapter ran successfully:** flag — escalate. Reviewer manually checks lab pages, department pages, archive.org snapshots.
- **Directory gated behind SSO:** flag (`directory_gated`) — reviewer falls back to other M07 paths (LinkedIn / publication / web search).
- **Adapter failed (HTTP error, parse error):** flag (`scrape_error`) — reviewer manually visits the directory.
- **Match found but role mismatch** (customer claims PI; directory lists "Graduate Student"): escalate; this is the highest-information signal of the idea.
- **Recently-listed entries** (especially visiting / temporary roles): note the listing date if exposed; new entries < 30 days are weaker evidence.

## flags_thrown

- `directory_no_match` — adapter ran, no record found
- `directory_role_mismatch` — record found but role contradicts claim
- `directory_email_mismatch` — record found but email differs from customer-provided
- `directory_gated` — directory requires authentication
- `scrape_error` — adapter failure
- `directory_recent_entry` — record exists but appears to be < 30 days old (when the directory exposes a date)
- `directory_visiting_only` — record exists but the listed affiliation is "visiting" / "courtesy" / "adjunct" — informational, not a block

## failure_modes_requiring_review

- Institution doesn't have a public directory.
- Directory uses heavy JavaScript (SPA) that the adapter doesn't render.
- Directory rate-limits or blocks the scrape.
- Institution's site goes down at scrape time.
- Customer's name has accents / non-Latin characters that the directory transliterates differently.
- Customer's name is extremely common at large institutions → many records, none clearly the right person.
- Institution privacy-suppresses individual entries (common in EU under GDPR).
- Adapter is stale due to a site redesign — scrapes "succeed" but miss the record.

## false_positive_qualitative

- **Common-name customers** at large institutions → many directory records, none clearly the customer.
- **Visiting researchers in their first month** before the directory updates.
- **Postdocs** at institutions where postdocs are not listed in the central directory (only on the host lab's web page, which the scrape doesn't reach).
- **Industry / hospital lab employees** at institutions whose corporate directory is gated behind SSO.
- **Customers using preferred names** that differ from the legal name on the order.
- **EU institutions under GDPR opt-out** where individual entries are suppressed.
- **Small colleges** with no separate people-search interface.
- **Core facility / role-mailbox customers** where the listed entity is a role, not a person.
- The false-positive load on this check is structurally high; m07's intent (from `measures.md`) is "low-scrutiny" so the SOP should treat directory misses as a soft signal, not a block.

## record_left

- Cached HTML blob (timestamped) for the directory page hit
- Adapter version + run timestamp
- Parsed structured record
- Disposition + reviewer signoff if escalated
- Retention: 5 years to align with export-control recordkeeping `[best guess: not regulatorily mandated for this measure specifically, but aligning with the rest of the screening pipeline keeps records consistent]`

The cached HTML is the audit-grade artifact: it demonstrates what the institution publicly said about the customer at the moment of screening.

## bypass_methods_known

(Stage 5 fills.)

## bypass_methods_uncovered

(Stage 5 fills.)
