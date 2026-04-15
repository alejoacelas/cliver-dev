# Measure 07 — institution-affiliation-low-scrutiny — Ideation v1

Measure: low-scrutiny check that the customer is genuinely affiliated with their listed institution. Two legs: (a) email-domain ↔ institution match; (b) customer "shown on the institution's website" (directory/personnel page).

## 1. ROR domain lookup (direct)

- **name:** ROR institution-domain match
- **summary:** Resolve the customer's listed institution name via the Research Organization Registry (ROR) public API; pull the `links` and known domains for that org; assert that the customer's email domain (or a known alias of it) is one of them. ROR is the canonical open registry of research orgs and includes website URLs from which a domain can be derived.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** dormant-domain, shell-nonprofit, shell-company, cro-framing, cro-identity-rotation, community-bio-lab-network, gradual-legitimacy-accumulation (negative signal: ROR has no record), foreign-institution (positive signal for real orgs)
- **external_dependencies:** ROR API (https://api.ror.org/organizations), ROR data dump
- **manual_review_handoff:** Reviewer sees ROR record (or absence), customer-claimed institution, customer email domain. Playbook: if no ROR hit → ask customer for institutional URL + a colleague reference; if hit but domain mismatch → ask customer to send mail from canonical institutional address.
- **flags_thrown:** (a) institution name has no ROR hit → review; (b) ROR hit but customer email domain not among ROR-listed domain or any common subdomain → review; (c) ROR record marks org as `inactive`/`withdrawn` → review.
- **failure_modes_requiring_review:** ROR fuzzy match ambiguity (multiple candidates), API outage, organizations legitimately absent from ROR (small companies, very new institutions), ROR-listed website domain differs from email domain (common when SSO/email is outsourced).
- **record_left:** ROR org ID, queried name, matched domain set, customer email domain, timestamp.
- Other fields: # stage 4

## 2. InCommon federation metadata check (direct + attacker-driven)

- **name:** InCommon metadata IdP enumeration
- **summary:** Pull the InCommon Federation metadata aggregate (US R&E SAML federation, ~1000+ IdPs); extract each IdP's `scope` elements (which list the email domains the IdP authoritatively asserts). Check whether the customer's email domain is in the scope of any registered InCommon IdP, and whether the IdP's affiliated organization name matches the customer's listed institution.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** dormant-domain (defunct entities not in InCommon), shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, community-bio-lab-network (no R&E federation membership), inbox-compromise (alumni-forwarder domains may show as separate scope)
- **external_dependencies:** InCommon metadata aggregate (Internet2), Shibboleth metadata parser
- **manual_review_handoff:** Reviewer sees: InCommon IdP entityID + organization, scope domain list. Playbook: if customer's institution is a US R&E org but absent from InCommon → minor flag; if domain not in any scope → ask for SSO login or institutional letter.
- **flags_thrown:** (a) domain matches no InCommon scope and customer claims a US R1 → escalate; (b) domain matches but org name mismatch → escalate.
- **failure_modes_requiring_review:** Many legit institutions are not InCommon members (industry, small colleges, foreign); subdomains may not appear in scope; org-name fuzzy matching.
- **record_left:** InCommon entityID, scope match set, snapshot date.

## 3. eduGAIN inter-federation lookup (direct)

- **name:** eduGAIN federation metadata
- **summary:** Same approach as InCommon but using the global eduGAIN aggregate (interconnects ~70 national R&E federations). Catches non-US institutions: DFN-AAI (DE), UK Access Federation, SURFconext (NL), GakuNin (JP), CAFe (BR), etc. Look up the customer's claimed institution's IdP and confirm the email domain falls under its scope.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** foreign-institution (Brazilian federal universities, Japanese prefectural labs are commonly in eduGAIN), visiting-researcher, unrelated-dept-student
- **external_dependencies:** eduGAIN MDS (metadata service)
- **manual_review_handoff:** As above, with reviewer aware that absence in eduGAIN is informative for foreign R1s but neutral for industry.
- **flags_thrown:** Domain not in any eduGAIN-member federation scope and institution claims to be a national university → review.
- **failure_modes_requiring_review:** National federations vary in coverage; some institutions delegate email to commercial providers (e.g., outlook.com tenants) breaking scope match.
- **record_left:** Federation name, entityID, scope.

## 4. Institutional directory scraping / "shown on the institution website" check (direct + attacker-driven)

- **name:** Institutional directory people-search scrape
- **summary:** From the institution's canonical web domain (resolved via ROR or supplied), attempt the standard directory paths (`/directory`, `/people`, `/faculty`, `/staff`, `/search?q=<name>`) and fetch the public people-search results. Confirm that the customer's full name appears on a page hosted under the institution's canonical domain. This is the "shown on institution website" leg of the measure.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** it-persona-manufacturing (sub-path A direct injection — passes if directory was actually written; flags if not), dormant-account-takeover (Bypass C — fabricated persona NOT in directory), inbox-compromise (variant 5 alumni forwarder — name absent), shell-company / shell-nonprofit / cro-framing (only the attacker's own page returns the name — see idea 9 for distinguishing self-controlled domains)
- **external_dependencies:** Per-institution scraper SOP, headless browser, common directory templates (Cascade CMS, Drupal, T4, Plone, custom). Optional vendor: Bright Data / Apify scraping.
- **manual_review_handoff:** Reviewer sees: scraped page URL, the matched name string in context, screenshot. Playbook: if no hit → ask customer to provide a permalink to themselves on the institution website.
- **flags_thrown:** (a) zero hits for the customer's name on the canonical domain → review; (b) hit only on a self-asserted profile page (e.g., a wiki or sandbox area) → review; (c) hit on a "departed" / "former members" page → review.
- **failure_modes_requiring_review:** Directories that gate behind login (FERPA/GDPR-driven non-listing); name collisions; non-Latin-script names; transliteration; directories that don't include grad students or visiting scholars.
- **record_left:** URL of the directory page, hash, name match span, timestamp.

## 5. ORCID affiliation history (direct + attacker-driven)

- **name:** ORCID employments + education affiliation lookup
- **summary:** Use the ORCID public API to fetch the customer's ORCID record (if they provide one or if name+institution disambiguates a single iD). Examine `employments` and `educations` `affiliation` blocks; check that the listed institution is among them and that the ORG identifier (Ringgold/GRID/ROR) matches.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** visiting-researcher (a fresh courtesy appointment is unlikely to have been added to ORCID yet), shell-company / shell-nonprofit / cro-framing (unlikely to have ORCID affiliation entries with a real org-id), dormant-domain (no ORCID record), it-persona-manufacturing (a manufactured persona has no ORCID history)
- **external_dependencies:** ORCID public API (https://pub.orcid.org/v3.0)
- **manual_review_handoff:** Reviewer sees ORCID record, list of affiliations, list of works. Playbook: ask customer for ORCID iD if not provided; if iD has zero affiliations or affiliations don't include the claimed org → flag.
- **flags_thrown:** (a) no ORCID record found and customer claims a research role → soft flag; (b) ORCID iD provided but the listed org is not in employments/educations → review.
- **failure_modes_requiring_review:** Many legit researchers don't maintain ORCID; new affiliations lag; privacy settings hide records.
- **record_left:** ORCID iD queried, affiliation list snapshot.

## 6. OpenAlex author institution check (direct + attacker-driven)

- **name:** OpenAlex author-institution affiliation history
- **summary:** Query the OpenAlex Authors index (https://api.openalex.org/authors) by the customer's name; for each candidate author, examine `last_known_institution` and `affiliations` (which OpenAlex tags with ROR IDs). Confirm one disambiguated author has the claimed institution as a recent affiliation.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** unrelated-dept-student (the listed dept is non-wet-lab — visible here), visiting-researcher (no publications under that affiliation yet), shell-company / cro-framing / dormant-domain (no OpenAlex authorship under the entity), gradual-legitimacy-accumulation (only bioRxiv preprints — surfaces in OpenAlex but with low work-count, single-affiliation footprint), credential-compromise / account-hijack (returns the *real* PI's authorship — passes; this idea cannot detect identity takeover)
- **external_dependencies:** OpenAlex API (free)
- **manual_review_handoff:** Reviewer sees author work-count, affiliation history, ROR IDs. Playbook: if zero works under any plausible disambiguation → soft flag; if works exist but never under the claimed institution → review.
- **flags_thrown:** (a) name resolves to no OpenAlex author with ≥1 work; (b) author has works but none with the claimed institution.
- **failure_modes_requiring_review:** New researchers, non-publishing roles (lab managers, core staff), name collisions.
- **record_left:** OpenAlex author IDs queried, affiliation history snapshot.

## 7. LinkedIn employment check (direct + attacker-driven)

- **name:** LinkedIn current-employer match
- **summary:** Search LinkedIn (Sales Navigator API or RapidAPI/Proxycurl resolver, or manual reviewer search) for the customer's name; assert that a profile exists whose current employer/affiliation string matches the claimed institution. LinkedIn employment is self-asserted but is an additional independent third-party hosted artifact with the customer's name.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** shell-company, cro-framing, gradual-legitimacy-accumulation (LinkedIn footprint deliberately seeded — returns positive but the profile is thin), inbox-compromise (no LinkedIn presence under the dormant identity), dormant-domain (none), it-persona-manufacturing (manufactured persona unlikely to have LinkedIn history)
- **external_dependencies:** Proxycurl `linkedin/profile` endpoint [best guess]; LinkedIn ToS constraints — vendor likely needed.
- **manual_review_handoff:** Reviewer sees profile snippet (current employer, tenure, prior employers, connection count, account age). Playbook: thin profile (<5 connections, <1 year, no prior history) → flag.
- **flags_thrown:** (a) no profile under any name+institution combination; (b) profile exists but employer is different from the claimed one; (c) profile is freshly minted with no history.
- **failure_modes_requiring_review:** Legit privacy-conscious researchers don't use LinkedIn; common names; LinkedIn search rate limits; ToS / scraping legality.
- **record_left:** Profile URL, captured snippet, scrape timestamp.

## 8. Faculty-page fuzzy name match via Google site: operator (direct + attacker-driven)

- **name:** `site:<institution-domain>` Google name search
- **summary:** Issue a search-engine query of the form `site:<institution-canonical-domain> "<First Last>"` (Google CSE / Bing Web Search API). Confirm at least one indexed page on the institution's canonical domain mentions the customer's name. This is a low-cost, surface-area-wide alternative to bespoke directory scraping (idea 4) and works against arbitrary institutional CMS layouts.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** it-persona-manufacturing (sub-path A — directory entry indexed by Google), dormant-account-takeover (Bypass C — fabricated persona not yet indexed), inbox-compromise method 6 (real name on directory — would be indexed), unrelated-dept-student (real student listed by department), bulk-order-noise-cover (core-facility staff page), foreign-institution (works regardless of language; matches Latin-script names on JP/BR/IN sites)
- **external_dependencies:** Google Programmable Search Engine API or Bing Web Search API; SerpAPI as a turnkey alternative.
- **manual_review_handoff:** Reviewer sees the top-N indexed result snippets and URLs. Playbook: zero hits → ask customer for permalink; hits only on PDFs / dataset metadata / cached pages → soft flag; hits only under an "alumni" / "former" page → soft flag.
- **flags_thrown:** Zero hits for `site:<domain> "<name>"`; hits only in archived/cached/former contexts.
- **failure_modes_requiring_review:** Very common names; institutions with weak Google indexing (login-walled directories); freshly added persons (Google index lag).
- **record_left:** Query string, top-10 result URLs and snippets, timestamp.

## 9. Self-controlled-domain detection (direct, attacker-driven)

- **name:** WHOIS + DNS provenance check on institutional domain
- **summary:** For the customer-claimed institution domain, run WHOIS (registrar, registrant org/name, creation date), DNS history (Farsight DNSDB / SecurityTrails passive DNS), MX/SPF/DKIM analysis, and certificate-transparency lookup. Score: domains <12 months old, single-mailbox MX, registrant name overlapping the customer's name, or hosted on a personal-tier provider strongly suggest a self-controlled "institution." Distinguishes a real third-party institutional website from one the customer themselves owns.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** dormant-domain (recently re-registered after long lapse), shell-company, shell-nonprofit, cro-framing, cro-identity-rotation (each LLC's domain is freshly registered to the attacker), community-bio-lab-network (one-page sites on template builders), gradual-legitimacy-accumulation (older domain, but registrant still attacker)
- **external_dependencies:** WHOIS (RDAP), SecurityTrails / Farsight DNSDB [best guess], crt.sh, MXToolbox.
- **manual_review_handoff:** Reviewer sees domain age, registrant, hosting provider, MX, prior DNS history. Playbook: if domain <12 months OR registrant matches customer's surname → flag for SOC review.
- **flags_thrown:** (a) institution domain age <12 months; (b) registrant name overlap with customer; (c) MX points at consumer Workspace tenant; (d) DNSDB shows domain dormant for years then reactivated.
- **failure_modes_requiring_review:** Legit small institutions also use Google Workspace and are recently founded; WHOIS privacy.
- **record_left:** WHOIS record, MX list, DNSDB snapshot, registration date.

## 10. Ringgold institution identifier resolution (direct)

- **name:** Ringgold institutional identifier lookup
- **summary:** Resolve the customer's claimed institution against the Ringgold Identify Database (the registry used by publishers and CrossRef-affiliation tagging). Confirm the institution has a Ringgold ID and that the ID has a primary domain matching the customer's email. Ringgold has tighter coverage of "real" research/health/education organizations than ad-hoc lists and is harder to self-list on than ROR.
- **modes:** direct
- **attacker_stories_addressed:** shell-company, shell-nonprofit (single-person orgs cannot self-list in Ringgold), cro-framing, cro-identity-rotation, dormant-domain
- **external_dependencies:** Ringgold Identify Database (paid; subscription via Ringgold Ltd) [best guess: API exists].
- **manual_review_handoff:** Reviewer sees Ringgold ID + canonical domain, alongside customer email. Playbook: no Ringgold record → soft flag; record exists but domain mismatch → review.
- **flags_thrown:** No Ringgold record; record exists but `parent_org` is non-research; domain mismatch.
- **failure_modes_requiring_review:** Vendor licensing cost; coverage gaps for industry; lag for newly founded orgs.
- **record_left:** Ringgold ID, name, parent, primary domain.

## 11. GRID / ISNI cross-reference (direct)

- **name:** GRID & ISNI institution cross-reference
- **summary:** Cross-check the institution against GRID (frozen 2021 snapshot — historical fallback for legacy IDs) and ISNI (ISO 27729 international name authority). ISNI assigns identifiers to organizations and persons; the customer can be looked up directly by name to find an organization affiliation. Useful complement when ROR misses a body that ISNI catalogs (museums, foundations, ministries).
- **modes:** direct
- **attacker_stories_addressed:** foreign-institution, shell-nonprofit
- **external_dependencies:** GRID dump; ISNI public search (https://isni.org).
- **manual_review_handoff:** Reviewer sees both records side-by-side with ROR.
- **flags_thrown:** Institution absent from all three of {ROR, GRID, ISNI} despite claiming research-org status.
- **failure_modes_requiring_review:** GRID is frozen; ISNI coverage uneven.
- **record_left:** GRID/ISNI IDs.

## 12. NIH RePORTER / NSF Awards grant-affiliation check (direct + attacker-driven)

- **name:** NIH RePORTER + NSF Awards PI affiliation lookup
- **summary:** Search NIH RePORTER (api.reporter.nih.gov) and NSF Award Search for the customer's name as PI/co-PI; assert that at least one award lists the customer's claimed institution as the awardee org within the last 5 years. Establishes funded-research footprint linking person↔institution that is hard to fabricate.
- **modes:** attacker-driven
- **attacker_stories_addressed:** dormant-domain (the defunct entity may still appear in old RePORTER awards — useful lookup for whether the *current* customer is also there), shell-company / shell-nonprofit (no federal awards), gradual-legitimacy-accumulation (no awards), visiting-researcher (no awards under host institution), it-persona-manufacturing
- **external_dependencies:** NIH RePORTER API, NSF Award API.
- **manual_review_handoff:** Reviewer sees award list, PI institution, dates.
- **flags_thrown:** Zero awards under any institution; award history exists but never under the claimed institution.
- **failure_modes_requiring_review:** Many legit roles never hold awards (lab managers, core staff, students); industry researchers; foreign institutions.
- **record_left:** Award IDs queried.

## 13. SAML/OIDC federated login challenge (attacker-driven)

- **name:** Step-up SSO via institutional IdP
- **summary:** During onboarding, require the customer to complete a SAML/OIDC login through their institution's IdP (resolved via InCommon/eduGAIN metadata). The successful assertion must include `eduPersonScopedAffiliation` (e.g., `faculty@university.edu`) and the scope must match the institution. Strong proof of current institutional standing because it requires a live credential at the IdP.
- **modes:** direct
- **attacker_stories_addressed:** dormant-domain, shell-company, shell-nonprofit, cro-framing, community-bio-lab-network (no R&E IdP); does NOT catch credential-compromise, account-hijack, inbox-compromise (3) where the attacker controls the credentials
- **external_dependencies:** SAML SP (e.g., Shibboleth, SimpleSAMLphp) or OIDC client integrated with InCommon/eduGAIN.
- **manual_review_handoff:** Reviewer sees the assertion attributes and IdP. Playbook: refuse to advance without an `eduPersonAffiliation` containing `faculty|staff|member|employee`.
- **flags_thrown:** (a) refusal/incapacity to complete SSO; (b) assertion lacks `eduPersonScopedAffiliation`; (c) affiliation = `alum` only.
- **failure_modes_requiring_review:** Industry / non-R&E customers; IdPs that don't release attributes; eduPersonAffiliation only `member`.
- **record_left:** SAML assertion (sanitized), entityID, attribute set.

## 14. Email-domain MX/SPF authoritative-host check (direct, attacker-driven)

- **name:** Email-domain MX/SPF authoritative-source check
- **summary:** Distinct from idea 9: focus on whether the email domain's MX records point at the institution's own infrastructure (or the institution's known O365/Google tenant) vs at a freshly registered consumer Workspace. Cross-reference O365 tenant ID via `https://login.microsoftonline.com/<domain>/.well-known/openid-configuration` to learn the tenant's registered display name and compare to the institution.
- **modes:** direct
- **attacker_stories_addressed:** dormant-domain, shell-company, cro-framing, community-bio-lab-network, gradual-legitimacy-accumulation
- **external_dependencies:** DNS, Microsoft Graph / openid-configuration endpoint.
- **manual_review_handoff:** Reviewer sees MX list and tenant display name vs claimed institution.
- **flags_thrown:** O365 tenant display name does not contain claimed institution name; MX points at a generic relay; SPF includes a single low-trust sender.
- **failure_modes_requiring_review:** Many institutions outsource mail to managed providers under generic display names.
- **record_left:** MX, SPF, tenant ID/display.

## 15. Institutional press release / news mention search (attacker-driven)

- **name:** Institutional news search for new-hire mentions
- **summary:** For visiting-scholar / postdoc / new-hire claims, query the institution's news/press subdomain (e.g., `news.university.edu`, `<dept>.university.edu/news`) and Google News for the customer's name. Real new appointments often produce a press item; their absence is weak evidence, but presence is strong corroboration.
- **modes:** attacker-driven
- **attacker_stories_addressed:** visiting-researcher, it-persona-manufacturing
- **external_dependencies:** Bing News Search API, Google CSE.
- **manual_review_handoff:** Reviewer sees any matched news items.
- **flags_thrown:** Combined with idea 4 — informational, used as positive corroborator only.
- **failure_modes_requiring_review:** Most affiliations never produce press; absence is non-informative.
- **record_left:** Search queries + result URLs.

## 16. Wayback Machine longevity check (attacker-driven)

- **name:** Wayback Machine snapshot timeline
- **summary:** Query the Internet Archive Wayback Machine CDX API for snapshots of the customer's profile URL on the institutional domain. A real faculty/staff page typically has a snapshot history >12 months; a freshly fabricated entry will not.
- **modes:** attacker-driven
- **attacker_stories_addressed:** it-persona-manufacturing (sub-paths A, C, D), dormant-account-takeover (Bypass C), dormant-domain
- **external_dependencies:** Wayback CDX API.
- **manual_review_handoff:** Reviewer sees snapshot count and earliest snapshot date.
- **flags_thrown:** Profile URL with zero Wayback snapshots or first snapshot <30 days old.
- **failure_modes_requiring_review:** Many real new hires also have no Wayback history; Wayback's index is incomplete.
- **record_left:** CDX result list.

## 17. DIYbio / DIYbiosphere directory denylist (attacker-driven)

- **name:** Community-bio directory recognition
- **summary:** Maintain an internal list of community-bio directories (DIYbio.org, DIYbiosphere) that allow self-listing without vetting. If the institution-affiliation evidence the customer points to is *only* one of these self-list directories, treat the affiliation as unverified for SOC purposes.
- **modes:** attacker-driven
- **attacker_stories_addressed:** community-bio-lab-network
- **external_dependencies:** Internal SOP list of self-list directories.
- **manual_review_handoff:** Reviewer sees the source directory and the freshness of the listing. Playbook: route to SOC review.
- **flags_thrown:** Affiliation evidence is exclusively a self-list community directory.
- **failure_modes_requiring_review:** Some legit community labs only list there.
- **record_left:** Directory name + listing URL.

## 18. Crunchbase / AngelList / Pitchbook self-asserted listing detection (attacker-driven)

- **name:** Self-asserted-startup listing flag
- **summary:** Where the customer's claimed institution is a small company, query Crunchbase / AngelList / Pitchbook. Note that these are self-serve. Treat a profile that has *only* self-asserted fields (no funding rounds, no employee counts confirmed by LinkedIn signals, no third-party news) as a self-asserted listing — neutral, not a positive verification.
- **modes:** attacker-driven
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, cro-framing
- **external_dependencies:** Crunchbase API, AngelList scrape, Pitchbook (paid).
- **manual_review_handoff:** Reviewer sees profile completeness signals.
- **flags_thrown:** Profile exists but completeness < threshold (no funding, no news, no third-party validation).
- **failure_modes_requiring_review:** Bootstrapped legit startups look identical.
- **record_left:** Profile URL + scraped facts.

## 19. Incubator tenant directory cross-check (attacker-driven)

- **name:** Biotech incubator tenant directory check
- **summary:** Maintain a list of recognized biotech incubators (BioLabs, LabCentral, JLABS, Cambridge Innovation Center, Genspace, IndieBio) and scrape their public tenant directories. Customers that claim an incubator address should appear in the corresponding tenant directory under their LLC name. Strong third-party confirmation when present.
- **modes:** attacker-driven
- **attacker_stories_addressed:** biotech-incubator-tenant (positive — would pass; flag is whether the tenancy + the claimed work scope are consistent), cro-framing (often virtual office, NOT real incubator → fails), shell-company
- **external_dependencies:** Per-incubator scraper SOPs.
- **manual_review_handoff:** Reviewer confirms tenant entry exists; checks tenant tier (full lease vs hot desk).
- **flags_thrown:** Customer claims incubator address but is not in the public tenant directory; tenant directory shows hot-desk-only tier.
- **failure_modes_requiring_review:** Brand-new tenants not yet listed; some incubators don't publish a tenant directory.
- **record_left:** Tenant page URL.

## 20. Alumni-domain denylist (attacker-driven)

- **name:** Alumni-/forwarder-domain denylist
- **summary:** Maintain an explicit denylist of `alumni.<u>.edu`, `alum.<u>.edu`, `*.alumni.<u>.edu`, and known lifetime-forwarder TLDs. Match the customer's email domain against this list; if hit, the customer is not currently affiliated even if email looks `.edu`.
- **modes:** attacker-driven
- **attacker_stories_addressed:** inbox-compromise (variant 5 alumni-for-life forwarder)
- **external_dependencies:** Internal denylist + public lists where they exist.
- **manual_review_handoff:** Reviewer sees match. Playbook: ask for current institutional address.
- **flags_thrown:** Email domain matches alumni denylist.
- **failure_modes_requiring_review:** Some institutions use `alumni.` style for current students inappropriately.
- **record_left:** Denylist entry hit.

## 21. HR-system vouch (out-of-scope but tracked)

- **name:** Institutional HR system role validation [best guess — may not be feasible at low scrutiny]
- **summary:** Query the institution's HR system (Workday, Banner, PeopleSoft) via an inter-institutional API to confirm the customer holds an active appointment with a research-relevant title. There is no public API for this; would have to be done via a per-institution agreement (e.g., research-office API). Marked here for completeness; almost certainly not feasible at "low scrutiny".
- **modes:** attacker-driven
- **attacker_stories_addressed:** it-persona-manufacturing (sub-path D defeats this too — HR-system injection); lab-manager-voucher; bulk-order-noise-cover; insider-recruitment
- **external_dependencies:** Per-institution research-office MoU; no standardized API.
- **manual_review_handoff:** N/A — gating signal.
- **flags_thrown:** No active HR record; title not research-relevant.
- **failure_modes_requiring_review:** No standardized API; cost prohibitive at low scrutiny.
- **record_left:** HR record snapshot.

---

## Coverage notes (per attacker story)

- **it-persona-manufacturing:** caught (partially) by 4, 5, 6, 8, 12, 16. Sub-path D (HR injection) defeats all of these except 16 (Wayback timing).
- **visiting-researcher:** caught by none on the merits — the affiliation is genuine. Only 5/6/12/15 produce a soft "thin footprint" signal.
- **unrelated-dept-student:** caught by 6 (department visible) at most; the affiliation itself is real.
- **lab-manager-voucher / bulk-order-noise-cover / insider-recruitment / account-hijack / credential-compromise:** affiliation is genuine; M07 cannot catch on the merits (only 21 could, but it's infeasible at low scrutiny). Listed in coverage gaps.
- **inbox-compromise:** caught by 4, 8 (no individual directory listing for role-mailbox / dormant adjunct), 20 (alumni domain).
- **dormant-account-takeover:** Bypass C caught by 4, 8, 16 (no directory listing yet); Bypass A passes everything.
- **foreign-institution:** caught by 3 (eduGAIN), 1 (ROR), partly 8 if the institution indexes Latin-script names.
- **dormant-domain:** caught by 9 (WHOIS/DNS provenance), 14 (MX/tenant), 1 (no current ROR), 16 (no Wayback).
- **shell-company / shell-nonprofit / cro-framing / cro-identity-rotation:** caught by 9, 14, 1, 10, 12.
- **biotech-incubator-tenant:** ambiguous — passes 19 by design; defended by 9 (LLC website still self-controlled) and 12 (no awards).
- **gradual-legitimacy-accumulation:** caught by 9 (still self-controlled domain), 12 (no awards), 14 (consumer tenant), 18 (self-asserted profiles only).
- **community-bio-lab-network:** caught by 17 (self-list directory recognition), 9, 12.

## Dropped

(None yet — first iteration.)
