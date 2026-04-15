# Per-idea synthesis: m07-proxycurl-linkedin

## Section 1: Filled-in schema

**name**

Proxycurl LinkedIn person-lookup

**measure**

M07 — institution-affiliation-low-scrutiny

**attacker_stories_addressed**

gradual-legitimacy-accumulation, shell-company, it-persona-manufacturing (originally listed); stage 5 found zero resistance against purpose-built-organization stories when the attacker pre-creates LinkedIn profiles, and zero resistance against genuine-insider stories. The check's value is limited to catching naive attackers who neglect to create a LinkedIn profile.

**summary**

Use Proxycurl's Person Lookup Endpoint to retrieve a structured LinkedIn profile for the customer (by name + company/institution domain). Compare current employer, employment tenure, and profile age against the customer's claimed institution to corroborate (or contradict) the affiliation. LinkedIn is a self-asserted platform with no employment verification, so a match is a weak positive signal while absence/mismatch is a moderately informative negative signal.

**external_dependencies**

Proxycurl (Nubela) API — third-party LinkedIn data enrichment via scraped/cached public LinkedIn profiles; name-disambiguation module for common-name handling; human reviewer for edge cases.

**endpoint_details**

**Person Lookup:** `GET https://nubela.co/proxycurl/api/v2/linkedin` — accepts `first_name`, `last_name`, `company_domain`, `location`. **Auth:** Bearer API key in `Authorization` header. **Pricing:** credit-based; 1 credit per successful Person Profile lookup; ~$0.01-$0.02/credit at typical volume. [vendor-gated — exact tier breaks on `nubela.co/proxycurl/pricing` not retrieved verbatim.] **Rate limits:** [unknown — searched for: "proxycurl rate limit person lookup", "proxycurl 429 burst limit" — typical default ~300 req/min on production keys, but exact cap not confirmed.] **ToS constraints:** Proxycurl collects data via web scraping of public LinkedIn profiles. Use for KYC/screening neither explicitly prohibited nor authorized. LinkedIn's own ToS prohibits automated scraping; legal status litigated in *hiQ Labs v. LinkedIn* (still contested). **Material legal risk:** legal review required before production use.

**fields_returned**

`public_identifier`, `profile_pic_url`; `first_name`, `last_name`, `full_name`, `headline`, `summary`; `country`, `city`, `state`; `experiences[]` (each with `starts_at`, `ends_at`, `company`, `company_linkedin_profile_url`, `title`, `description`, `location`); `education[]` (degree, field_of_study, school, dates); `accomplishment_*[]`, `volunteer_work[]`, `certifications[]`; `connections` (count bucket), `follower_count`; `personal_emails[]`, `personal_numbers[]` (premium, extra credits); `inferred_salary` (premium). Note: profile creation date is NOT returned; profile age must be approximated from earliest `experiences[].starts_at` or `education[].starts_at`.

**marginal_cost_per_check**

~$0.01-$0.02 per customer (1 credit per lookup). High-confidence flow may need 2 lookups: ~$0.02-$0.04. **Setup cost:** ~$5-10k engineering (API client + scoring heuristics; est. 1 engineer-week).

**manual_review_handoff**

`linkedin_no_profile`: reviewer manually searches LinkedIn web + Google + ORCID; if found, mark Proxycurl false negative; if not found, escalate to "fake-affiliation candidate." `linkedin_employer_mismatch`: reviewer reads `experiences[]`; if recent transition (within 6 months), accept with note; if fundamentally different employer, escalate. `linkedin_profile_lt_12mo`: reviewer checks education history; real new graduates have established education records; manufactured profiles have sparse/fabricated education. All cases: send templated "please confirm institutional role" email requiring same-domain reply.

**flags_thrown**


- `linkedin_no_profile` — no results from Person Lookup; human triage.

- `linkedin_employer_mismatch` — current employer does not match claimed institution (after fuzzy normalization); human triage.

- `linkedin_profile_lt_12mo` — earliest professional experience < 12 months ago; soft signal.

- `linkedin_thin_profile` — <5 connections OR no photo OR no education entries; soft signal.

**failure_modes_requiring_review**

404 from Proxycurl (profile not cached); rate-limit 429; common-name collision (multiple candidates); non-Western name with sparse LinkedIn coverage; customer in country where LinkedIn is blocked/unused (China, Russia); LinkedIn ToS/legal challenge interrupts data freshness or service availability; role-mailbox accounts (no person name to look up).

**false_positive_qualitative**


- **True false positives (flagged wrongly):** recently transitioned researchers (~5-10% of customers) fire `linkedin_employer_mismatch`; common-name collisions return wrong profile.

- **False negatives (no signal):** researchers in LinkedIn-blocked countries (~15-20% of global researcher pool — China, Russia, Iran); academic researchers without LinkedIn (~30-50% of OECD life-sciences academics); privacy-restricted profiles (~5-15%).

- **Weak-signal cases:** commercial customers where employer match works but thin-profile/age heuristics are less discriminating vs. shell companies.

**coverage_gaps**


- **Gap 1 — LinkedIn-blocked countries:** China (~1.8M researchers), Russia (~350K+), Iran — ~15-20% of global life-sciences researchers; no signal.

- **Gap 2 — Academics without LinkedIn:** ~30-50% of OECD life-sciences researchers lack substantive profiles; no/weak signal.

- **Gap 3 — Common/non-Western names:** ~10-20% of lookups may face disambiguation issues.

- **Gap 4 — Recently transitioned researchers:** ~5-10% of customers; false positive.

- **Gap 5 — Commercial customers:** ~42-46% of synthesis market; employer match works but other heuristics are less discriminating.

- **Gap 6 — Privacy-restricted profiles:** ~5-15% invisible to Proxycurl; no signal.

**record_left**

Full Proxycurl JSON response (or hash + key fields); original lookup parameters; timestamp + Proxycurl request ID; reviewer notes if triaged.

**bypass_methods_known**

**CAUGHT (naive attackers only):** it-persona-manufacturing sub-paths A/D when no LinkedIn profile created; inbox-compromise alumni variant (no current employer on LinkedIn); inbox-compromise self-issued visiting account (no LinkedIn); dormant-account-takeover fabricated persona (no LinkedIn); dormant-domain when no LinkedIn created.

**bypass_methods_uncovered**

**Structural — LinkedIn is self-asserted:** all purpose-built-organization stories (shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, dormant-domain) can pre-create matching LinkedIn profiles at $0 cost in minutes. Multiple attacker stories explicitly include LinkedIn profile creation in their playbook. **Structural — genuine insiders:** visiting-researcher, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise all have genuine LinkedIn profiles. **Implementation-specific:** non-Western LinkedIn coverage (foreign-institution); role-mailbox accounts (no person to look up).


## Section 2: Narrative


### What this check is and how it works

This check uses Proxycurl, a third-party API that scrapes and caches public LinkedIn profiles, to look up a customer by name and company domain. It retrieves structured data including current employer, employment history, education, profile age proxies (earliest experience date), and engagement metrics (connection count, profile photo presence). The check compares the customer's claimed institutional affiliation against their LinkedIn employment record and flags mismatches, absent profiles, and thin/new profiles. A match is treated as a soft positive signal; absence or mismatch triggers manual review. The check costs ~$0.01-$0.02 per lookup and requires only a Proxycurl API key (no LinkedIn partnership or membership).


### What it catches

The check catches only naive attackers who neglect to create a LinkedIn profile. Specifically, it detects manufactured personas (it-persona-manufacturing sub-paths A/D) and fabricated personas (dormant-account-takeover bypass C) when the attacker does not anticipate a LinkedIn check. It also catches the inbox-compromise alumni variant because the alumni's LinkedIn shows no current employer at the institution. Against these narrow cases, the `linkedin_no_profile` or `linkedin_employer_mismatch` flags provide useful negative signal. The check is most informative when it fires negatively — absence of a LinkedIn presence is weakly informative, while presence of a matching profile is not independently informative because LinkedIn is unverified.


### What it misses

The check misses all attackers who pre-create LinkedIn profiles, which is trivial ($0, minutes, self-asserted, no verification). Multiple attacker stories — shell-company, gradual-legitimacy-accumulation, biotech-incubator-tenant, cro-framing — explicitly include LinkedIn profile creation in their standard playbook. The check also provides zero resistance against genuine insiders (visiting-researcher, lab-manager-voucher, insider-recruitment, account-hijack, credential-compromise) who have real LinkedIn profiles showing real institutional employment. Stage 5 found two Critical structural findings: (1) LinkedIn's self-asserted nature makes it trivially gameable by purpose-built-organization attackers, and (2) genuine insiders pass cleanly. Coverage gaps compound the problem: ~30-50% of OECD life-sciences academics lack LinkedIn profiles, ~15-20% of global researchers are in countries where LinkedIn is blocked (China, Russia), and ~5-15% have privacy-restricted profiles.


### What it costs

Marginal cost is ~$0.01-$0.02 per customer (1 credit per lookup), with a possible second lookup at ~$0.02-$0.04 for high-confidence flows. Setup cost is ~$5-10k (1 engineer-week) for the API client and scoring heuristics. The manual review burden is substantial given the high false-negative rate: ~30-50% of legitimate academic customers in OECD countries will fire `linkedin_no_profile`, overwhelming reviewers with legitimate cases.


### Operational realism

The manual review handoff is costly relative to the signal quality. When `linkedin_no_profile` fires, the reviewer must manually search LinkedIn's web interface, Google, and ORCID to determine if the customer genuinely lacks a LinkedIn presence or if Proxycurl's cache missed them. Given that a large minority of legitimate academic researchers do not use LinkedIn, reviewers will spend most of their time clearing false negatives rather than catching actual threats. The `linkedin_employer_mismatch` flag is more actionable but is also triggered by legitimate job transitions (~5-10% of customers). The audit trail consists of the full Proxycurl JSON response, lookup parameters, and timestamp, which provides a defensible record but depends on Proxycurl's continued operation.


### Open questions

The most significant open question is legal viability. Proxycurl operates by scraping public LinkedIn profiles, which LinkedIn's Terms of Service prohibit. The *hiQ Labs v. LinkedIn* litigation remains contested, and a synthesis provider using Proxycurl for KYC could face downstream legal exposure. Legal counsel must clear this before deployment. Beyond legal risk, the check's value proposition is fundamentally limited by LinkedIn's self-asserted nature: the strongest attacker stories explicitly include creating LinkedIn profiles as a standard (free, minutes) setup step. The check should be understood as providing weak negative signal (absence is informative) rather than positive corroboration (presence is not independently informative). The exact Proxycurl pricing tier table and rate limits remain vendor-gated/unknown.

## Section 3: Open issues for human review


- **Surviving Critical finding (Finding 1 from Stage 5):** LinkedIn profiles are self-asserted and unverified. Purpose-built-organization attackers (shell-company, cro-framing, gradual-legitimacy-accumulation, etc.) explicitly include LinkedIn profile creation in their standard playbook. A matching LinkedIn employer does not constitute independent corroboration. The check's signal should be downgraded from "corroboration" to "soft positive, not sufficient alone."


- **Surviving Critical finding (Finding 2 from Stage 5):** Genuine insiders and real credential holders at real institutions pass with zero resistance. This is structural to M07's low-scrutiny scope.


- **Potentially blocking legal risk:** LinkedIn ToS prohibits automated scraping; Proxycurl's legality under *hiQ Labs v. LinkedIn* is unresolved. Use for KYC may create downstream legal exposure under GDPR/CCPA. Legal review required before production deployment. If legal counsel advises against use, this idea is effectively dead.


- **[vendor-gated]:** Proxycurl exact pricing tiers (entry-tier ~$0.01-$0.02/credit is a best guess; exact tier table on `nubela.co/proxycurl/pricing` not retrieved).


- **[unknown — searched for: "proxycurl rate limit person lookup", "proxycurl 429 burst limit"]:** Exact published rate-limit cap not confirmed; typical default estimated at ~300 req/min.


- **[unknown — searched for: "LinkedIn private profile percentage users", "LinkedIn profiles not publicly visible rate"]:** Percentage of profiles invisible to Proxycurl due to privacy settings is uncertain (estimated 5-15%).


- **Role-mailbox handling unspecified:** Proxycurl Person Lookup requires person names; role accounts (e.g., `genomics-core@university.edu`) have no person to look up. Fallback workflow undefined.


- **Regional fallback undefined:** For institutions in countries with low LinkedIn penetration (China, Russia, Central/Southeast Asia), the check should be skipped rather than generating uninformative `linkedin_no_profile` flags. No regional bypass logic is defined.
