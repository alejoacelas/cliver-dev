# m05-incubator-tenant — Implementation v1

- **measure:** M05 — shipping-institution-association
- **name:** Incubator / coworking tenant directory
- **summary:** Maintain a curated denylist of biotech-incubator addresses (LabCentral, JLABS, BioLabs, IndieBio/SOSV, etc.). When a customer's shipping address resolves to a known incubator building, require their organization to appear in that incubator's public tenant/resident directory. Absence is a soft flag; the manual review escalation involves contacting the incubator manager.

## external_dependencies

- **LabCentral resident network page** — [labcentral.org/about/our-resident-network](https://www.labcentral.org/about/our-resident-network) — public web page listing resident companies. No API. [source](https://www.labcentral.org/about/our-resident-network)
- **JLABS** — [jnjinnovation.com/jlabs](https://jnjinnovation.com/jlabs) — public location list, but full tenant directory **does NOT appear to be publicly published**. JLABS is invitation-only (~40 residents per location) and individual residents are listed selectively in news/press [source](https://jnjinnovation.com/jlabs).
- **BioLabs network** — [biolabs.io/locations](https://www.biolabs.io/locations) — multiple sites; BioLabs@NYU has a public "new companies" feed at [members.biolabsnyu.com/new-companies](https://members.biolabsnyu.com/new-companies). [source](https://www.biolabs.io/locations)
- **IndieBio (now SOSV SF / SOSV NY as of 2026)** — [indiebio.co/companies](https://indiebio.co/companies/) — public companies archive. [source](https://indiebio.co/companies/)
- **Bakery Square / QB3 / Mission Bio Capital / Pagliuca Harvard Life Lab** — additional incubators with varying directory transparency [unknown — searched for: "QB3 startup directory public list", "Pagliuca Harvard Life Lab residents"].
- **Manual scraping pipeline** — required since no incubator publishes a structured API. Cron job + HTML parser per incubator.

## endpoint_details

- **No APIs.** All incubators must be scraped from their public web pages. Scrape cadence: weekly is sufficient given tenant turnover [best guess: typical incubator residency runs 6–24 months, weekly refresh catches all transitions].
- **Address denylist construction:** ~30–50 known biotech-incubator buildings in the US covering the major tier-1 hubs (Boston/Cambridge, SF Bay, San Diego, NYC, Seattle, Research Triangle, Houston) [best guess based on industry coverage of named programs].
- **Geocoding:** match customer address to denylist via fuzzy address matching (Smarty `delivery_line_1` + ZIP, plus a 50m geo-tolerance for buildings on long blocks).
- **Auth:** none (public web pages).
- **ToS:** scraping public incubator web pages is generally permissible but each incubator's ToS should be reviewed. LabCentral, BioLabs, IndieBio do not appear to publish anti-scraping clauses [unknown — searched for: "LabCentral terms of service scraping", "biolabs.io terms of service"].
- **Manual contact path:** for hard cases, the SOP includes contacting the incubator's main email or operations manager directly.

## fields_returned

- **Per scraped incubator entry:** `incubator_name`, `incubator_address`, `tenant_name`, `tenant_url` (where listed), `tenant_description`, `last_seen_date`, `tenant_status` (current / alumni / unknown).
- **For LabCentral:** name, brief description, occasionally logo and external website link [vendor-described from public resident network page].
- **For IndieBio:** name, batch year, focus area, brief description [vendor-described from companies archive].
- **For BioLabs@NYU:** name, joined-date [vendor-described].
- **JLABS: minimal — only press-release mentions; no comprehensive directory.** This is a critical gap.

## marginal_cost_per_check

- **Scraping infra:** ~$5–20/month for a small scraper VM running weekly cron.
- **Per-check cost:** $0 (lookups are against an in-memory index).
- **setup_cost:** ~1 engineer-week to build scrapers for ~10 incubators; ~30 min/incubator/month maintenance as HTML changes. Maintenance cost grows linearly with number of incubators tracked.
- **Manual review cost (when triggered):** ~10–30 min reviewer time per case to email the incubator manager and wait for confirmation. Loaded cost: $8–25/case.

## manual_review_handoff

When `incubator_address_no_tenant_listing` fires:
1. Reviewer pulls the customer's claimed organization name and the matched incubator.
2. Reviewer manually checks the incubator's website (in case the scraper is stale) and any LinkedIn / press search.
3. If still no match, reviewer emails the incubator's general inquiries / operations manager email asking for confirmation that {customer_org} is a current resident at {address}. Standard email template included in SOP.
4. **Decision rule:**
   - Incubator confirms tenancy → clear.
   - Incubator denies tenancy → hard hold, deny order.
   - Incubator does not respond within 5 business days → soft hold, treat as `tenancy_unverified` and require alternative legitimacy evidence (m05-ror-gleif, m18-* institution checks).
5. Reviewer logs incubator response, including the email thread, in compliance log.

## flags_thrown

- `incubator_address_no_tenant_listing` — known incubator address but customer org not in scraped tenant list. Action: human review per playbook.
- `incubator_tenant_status_alumni` — listed as alumni, not current. Action: clarify with customer + incubator.
- `incubator_address_known_low_directory_quality` — address resolves to JLABS or other incubator with poor directory transparency. Action: defaults to manual contact.

## failure_modes_requiring_review

- **Tenant lists lag move-ins.** New residents may take 4–12 weeks to appear in public-facing directory; some never appear.
- **JLABS-style invitation-only programs** with no comprehensive public directory mean the check is structurally weak for those addresses.
- **Stealth-mode startups** at LabCentral/BioLabs sometimes do not list publicly until they fundraise.
- **Multi-tenant address aliasing**: 700 Main St Cambridge contains LabCentral *and* other tenants — being at the address doesn't mean being at LabCentral.
- **Incubator non-response** to email contact.
- **Incubator name changes** (IndieBio → SOSV SF/NY in 2026): the denylist needs maintenance.

## false_positive_qualitative

- **Brand-new tenants** legitimately at the incubator but not yet listed (the directory lag problem above).
- **Stealth-mode startups** intentionally not listed.
- **Incubator visitors / collaborators** who use the address temporarily.
- **JLABS residents** (entire population) — directory is not comprehensive enough to clear them positively.
- **Sub-tenants and fellowships** within an incubator's network (e.g., academic labs spending time at LabCentral as part of a translation program).

## record_left

- The matched incubator name, the scrape timestamp of the directory checked, the customer org claim, the binary match result, and (when manual review fired) the incubator manager's email response. Stored in compliance log.

## attacker_stories_addressed

- `biotech-incubator-tenant` — **directly targeted.** Catches if attacker uses the incubator address but the LLC is not a tenant. **MISSES** if attacker actually leases bench space at the incubator (which the attacker model explicitly does for $1,500–5,000/mo). Once the attacker is a real tenant, this check passes them positively. Structural limitation.
- `community-bio-lab-network` maker-space variant — maker spaces (Clear Creek Makerspace, etc.) are NOT in the biotech-incubator denylist; this check does not fire on them.
- `cro-framing` virtual office — the address is a Regus, not an incubator; this check does not fire.

Sources:
- [LabCentral resident network](https://www.labcentral.org/about/our-resident-network)
- [LabCentral about](https://www.labcentral.org/)
- [JLABS](https://jnjinnovation.com/jlabs)
- [BioLabs locations](https://www.biolabs.io/locations)
- [BioLabs@NYU resident portal new companies](https://members.biolabsnyu.com/new-companies)
- [IndieBio companies](https://indiebio.co/companies/)
- [IndieBio home](https://indiebio.co/)
