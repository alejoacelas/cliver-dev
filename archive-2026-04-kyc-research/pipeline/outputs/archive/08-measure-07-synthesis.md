# Measure 07 — Institution-Affiliation-Low-Scrutiny: Per-Measure Synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (count / which) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| **m07-incommon-edugain** | InCommon + eduGAIN SAML federation metadata (free, anonymous XML) | ~$0/check (hashmap lookup) | `domain_no_federation`: reviewer cross-refs ROR, Hipolabs; routes to other M07 checks. Fires for ~42-46% of market (commercial) + ~91% of US HE by count. | 10 CAUGHT (shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, dormant-domain, inbox-compromise at non-federated, foreign-institution at non-eduGAIN) | Commercial biotech/pharma (~42-46% of market) structurally excluded; ~91% of US HE institutions not in InCommon; ~85% of worldwide institutions not in eduGAIN | Any attacker on a genuinely federated domain (9+ stories): manufactured personas, visiting researchers, students, insiders, compromised accounts |
| **m07-directory-scrape** | Per-institution HTML scrape of public directories (~200-400 adapters) | ~$0.001/check (adapter) or $15-$30/check (manual fallback) | No-match: reviewer checks lab pages, archive.org (10-20 min). Role-mismatch: highest-information escalation. | 2 high-value (inbox-compromise departed, dormant-account-takeover departed). 15+ confirmatory only (no discrimination). | Adapters feasible for ~200-400 institutions; ~25,000+ worldwide require manual fallback. Industry/hospital SSO-gated. EU GDPR suppression. | All genuine insiders confirmed by real entries; all purpose-built-org attackers control the directory; IT-persona-manufacturing creates the entry the scrape reads |
| **m07-proxycurl-linkedin** | Proxycurl API (LinkedIn profile scraping, ~$0.01-$0.02/lookup) | ~$0.01-$0.04/check | No-profile: manual LinkedIn/Google/ORCID search. Employer-mismatch: check recent transition. ~30-50% of OECD academics lack LinkedIn = high flag volume. | 0 with real resistance. Stage 5 found zero resistance against any story when attacker pre-creates LinkedIn profile ($0, minutes). | ~30-50% of OECD life-sciences academics lack LinkedIn; ~15-20% of global researchers in LinkedIn-blocked countries (China, Russia); LinkedIn is self-asserted | All purpose-built-org attackers pre-create LinkedIn profiles in their standard playbook; all genuine insiders have real profiles; legal risk from LinkedIn ToS |
| **m07-google-site-search** | Web-search API with `site:` operator (Brave, SerpAPI) | $0.003-$0.045/check | No-hits: 6-step SOP (manual browser search, Scholar, ORCID, LinkedIn, institutional email). $15-$30/case. | 2 high-value (inbox-compromise alumni, dormant-account-takeover fabricated persona). 15+ confirmatory only. | Poorly indexed non-Anglophone institutions; Google CSE sunsetting Jan 2027, Bing retired Aug 2025; Brave `site:` operator "experimental" | Self-controlled domains (8 branches): attacker controls search results; genuine insiders (7 branches): real web presence confirms |
| **m07-visiting-scholar-sop** | Institutional contacts (phone switchboard, email departmental admin, research-visitors office) | $10-$30/case + 1-10 days wall-clock latency | This IS the manual review: 5-step corroboration process. ~5-20 cases/analyst-day. ~50-70% PI non-response rate. | 5 CAUGHT (it-persona-manufacturing sub-A/C, inbox-compromise adjunct/alumni/self-issued, dormant-account-takeover fabricated, dormant-domain). Escalates purpose-built-org to M19/M20. | ~50-70% PI non-response; ~40-60% non-US institutions lack visitors office; ~10-20% US institutions refuse verification; 3-5+ business day latency | Genuine visiting-scholar appointments (PI confirms, visitors office confirms); all genuine insiders; account-hijack self-confirmation loophole |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Two coverage gaps appear in EVERY idea's gap list, revealing fundamental limitations of M07 as a low-scrutiny measure:

1. **Genuine insiders and real appointees pass all checks.** Across all five ideas, attackers with genuine institutional affiliations (visiting-researcher, unrelated-dept-student, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise) produce clean positive signals. They have real federated domains (incommon-edugain passes), real directory entries (directory-scrape confirms), real LinkedIn profiles (proxycurl confirms), real web presence (google-site-search confirms), and real appointments (visiting-scholar-sop confirms). M07 verifies affiliation existence, not affiliation legitimacy or intent. This is the defining structural ceiling of "low-scrutiny" as a measure scope. Policymakers should understand that M07 is a fabrication filter, not an insider-threat detector.

2. **Self-controlled "institutions" defeat all automated checks.** Purpose-built-organization attackers (shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, dormant-domain, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network) control the domain, the directory, the website, and the LinkedIn profiles that the automated checks read. directory-scrape scrapes the attacker's own directory; google-site-search searches the attacker's own domain; proxycurl reads the attacker's self-created LinkedIn profile. Only incommon-edugain and visiting-scholar-sop provide resistance: federation membership requires genuine R&E status, and the SOP escalates to M19/M20 when no institutional infrastructure exists.

### Complementary gaps

| Gap | Present in | Closed by | Notes |
|---|---|---|---|
| Commercial biotech/pharma (~42-46% of market) | incommon-edugain (R&E only) | proxycurl-linkedin (employer match works for industry), directory-scrape (if adapter exists for company), google-site-search (web mentions) | Signal quality is lower: LinkedIn is self-asserted; corporate directories SSO-gated |
| Non-OECD/non-Anglophone institutions | directory-scrape (no adapters), google-site-search (poorly indexed), proxycurl (low LinkedIn penetration) | incommon-edugain (if institution is in eduGAIN), visiting-scholar-sop (language-permitting) | eduGAIN covers ~80 federations but is thin in sub-Saharan Africa, Central Asia |
| Departed/alumni identity theft | directory-scrape (only catches if entry removed), google-site-search (stale pages may persist) | incommon-edugain (alumni domains should NOT roll up per Stage 5), visiting-scholar-sop (visitors office finds no current appointment) | Key design decision: alumni-forwarder rollup policy |
| IT-manufactured personas (directory injection) | incommon-edugain (passes — federated domain), google-site-search (passes — finds manufactured entry), proxycurl (passes if LinkedIn created), directory-scrape (passes — finds manufactured entry) | visiting-scholar-sop (PI may deny knowledge for sub-path A) | Only partial: sub-path B with real PI sponsorship defeats SOP too |
| LinkedIn-blocked countries (~15-20% of researchers) | proxycurl-linkedin | All other ideas (not dependent on LinkedIn) | proxycurl should be skipped for these regions |
| Vendor API continuity (Google CSE sunsetting) | google-site-search | directory-scrape (independent data path), incommon-edugain (independent data path) | google-site-search must migrate to Brave/SerpAPI before Jan 2027 |

### Net coverage estimate

If a provider deployed all five ideas, the combined coverage for detecting fabricated affiliations would reach **many** customers (est. 55-70% of orders receive at least one meaningful signal). The federation check (incommon-edugain) provides a strong fast-pass for ~500 US R1/R2 institutions and ~6,000 eduGAIN IdPs. The directory-scrape and google-site-search provide negative-signal value for the ~200-400 institutions with adapters or well-indexed sites. The visiting-scholar-sop provides a manual escalation path for borderline cases.

However, **most** legitimate customers who are genuine insiders would still fall through M07 positively even if they were malicious. The fraction of the customer base where M07 adds adversarial value (as opposed to merely confirming legitimate affiliation) is concentrated on the fabricated-affiliation and purpose-built-organization stories -- estimated at **some** to **few** of actual attack scenarios.

## 3. Bypass cross-cut

### Universally uncovered bypasses

These bypass methods slip through EVERY M07 idea:

1. **Genuine institutional employment at a real institution with malicious intent.** Lab-manager-voucher, bulk-order-noise-cover, insider-recruitment: the attacker's institutional email, directory entry, LinkedIn profile, web presence, and appointment are all genuine. Every M07 check returns a clean affirmative. Branch slugs: `lab-manager-voucher`, `bulk-order-noise-cover`, `insider-recruitment`.

2. **Account hijack / credential compromise of a real PI.** The compromised PI has a real faculty page, real directory entry, real LinkedIn, real federation membership. All checks confirm the PI's identity, not the attacker's control. Branch slugs: `account-hijack`, `credential-compromise`.

3. **Enrolled student in unrelated department.** Real `.edu` email, real directory entry, real federation login. M07 does not check department relevance. Branch slug: `unrelated-dept-student`.

### Bypass methods caught by at least one idea

| Bypass method | Caught by | Missed by |
|---|---|---|
| Shell company/nonprofit/CRO with self-owned domain | incommon-edugain (domain not in federation) | directory-scrape, google-site-search, proxycurl (all read attacker-controlled data) |
| Dormant/lapsed domain revival | incommon-edugain (domain not federated) | directory-scrape, google-site-search (attacker controls website) |
| Community-bio LLC with DIYbio.org listing | incommon-edugain (not federated) | proxycurl (self-created LinkedIn), google-site-search (attacker domain) |
| IT-manufactured persona without PI complicity (sub-path A) | visiting-scholar-sop (PI denies knowledge) | All automated checks (pass because directory entry exists) |
| Inbox-compromise of departed adjunct | directory-scrape (entry removed), visiting-scholar-sop (no current appointment) | incommon-edugain (may still have federated domain), google-site-search (stale pages) |
| Fabricated persona at dormant account (no directory entry) | directory-scrape (no match), google-site-search (no hits), visiting-scholar-sop (no appointment) | incommon-edugain (domain is federated — passes), proxycurl (no LinkedIn — catches) |

### Attacker stories where every idea fails

- **lab-manager-voucher** — genuine insider, all signals authentic
- **bulk-order-noise-cover** — genuine insider with role-mailbox sub-variant
- **insider-recruitment** — genuine insider, handler invisible
- **account-hijack** — inherited verified status
- **credential-compromise** — inherited verified status
- **unrelated-dept-student** — real enrollment, real credentials
- **visiting-researcher** with genuine appointment — real appointment, all corroborators confirm

## 4. Bundling recommendations

**Recommended core bundle: incommon-edugain + google-site-search + visiting-scholar-sop.**

This three-idea bundle provides the strongest combined coverage at reasonable cost:
- **incommon-edugain** (~$0/check, $5-15K setup) is the highest-value M07 idea. It is the only check that provides real resistance against purpose-built-organization attackers: shell companies, CROs, dormant-domain revivals, and community-bio labs cannot join R&E federations. It serves as a fast-pass for federated domains and a trust-tier classifier for non-federated ones.
- **google-site-search** (~$0.003-$0.045/check, $1K-$5K setup) provides the long-tail complement for institutions not covered by federation metadata. Its negative-signal value (no web presence at claimed institution) catches departed-member impersonation and fabricated personas. It requires no per-institution engineering.
- **visiting-scholar-sop** ($10-$30/case, $10-25K setup) provides the manual escalation path for sparse-footprint cases. It is the only M07 idea that can catch IT-manufactured personas (sub-path A, where PI denies knowledge) and is the appropriate last resort before denying borderline orders.

Together, these three ideas filter fabricated affiliations across three channels: federation trust (incommon-edugain), web-presence corroboration (google-site-search), and human-to-human verification (visiting-scholar-sop). The bundle still leaves all genuine-insider and credential-compromise stories uncovered -- these require M15/M18/M19/M20.

**Optional additions:**
- **directory-scrape** ($40K-$160K setup for ~200 adapters + maintenance). Adds structured role-mismatch detection (customer claims PI but directory says grad student) for high-priority institutions. The role-mismatch flag is the unique signal no other M07 idea provides. Include if the provider's customer base is concentrated at US R1/R2 universities where adapters are feasible; skip if the customer base is globally distributed or industry-heavy.
- **proxycurl-linkedin** (~$0.01-$0.04/check). The weakest M07 idea: LinkedIn is self-asserted and trivially gameable. Stage 5 found zero resistance against any attacker who pre-creates a LinkedIn profile, and multiple attacker stories explicitly include this step. Additionally, legal risk from LinkedIn ToS is unresolved. Include only as a soft negative signal (absence informative, presence not independently corroborative) and only after legal counsel clears the Proxycurl dependency. Consider dropping entirely if legal risk is unacceptable.

**Operational cost of the core bundle:** One XML metadata refresh (hourly cron), one web-search API subscription (~$0.003-$0.045/check, requires vendor migration before Google CSE sunset Jan 2027), and one manual review queue (visiting-scholar-sop at $10-$30/case, ~5-20 cases/analyst-day). A mid-size provider with 50K orders/year would need the SOP for perhaps 2-5% of orders (SOC-eligible, sparse-footprint cases), requiring roughly 0.5 FTE.

**What the bundle cannot close:** M07 is structurally a fabrication filter, not an intent detector. The seven attacker stories where every idea fails (lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise, unrelated-dept-student, visiting-researcher with genuine appointment) all involve attackers with genuine institutional affiliations. Closing these requires higher-scrutiny measures: M15 (SOC declaration validation), M18 (institution legitimacy), M19 (individual researcher legitimacy), and M20 (voucher legitimacy). M07's value is in filtering out fabricated affiliations cheaply so that higher-scrutiny measures can focus their expensive review budget on the genuinely affiliated population.
