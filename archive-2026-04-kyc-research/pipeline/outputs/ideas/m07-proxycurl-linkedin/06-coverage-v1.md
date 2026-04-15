# Coverage research: Proxycurl LinkedIn person-lookup

## Coverage gaps

### Gap 1: Researchers in countries where LinkedIn is blocked or negligibly used
- **Category:** Researchers at institutions in China (LinkedIn fully exited in 2023), Russia (blocked since 2016), Iran, North Korea, and other countries with government-level LinkedIn blocks.
- **Estimated size:** China has ~1.8 million researchers (UNESCO 2021); Russia has ~350,000+ researchers. Combined, these represent a significant fraction of global life-sciences researchers. LinkedIn is inaccessible without VPN in both countries. ([source](https://www.linkedin.com/help/linkedin/answer/a1339324/prohibited-countries-policy), [source](https://www.scmp.com/tech/big-tech/article/3219889/linkedin-shuts-down-last-china-app-amid-global-job-cuts-ending-platform-trailed-far-behind-domestic)) [best guess: ~15-20% of global life-sciences researchers are in countries where LinkedIn is blocked or negligibly adopted, based on UNESCO researcher counts for China + Russia + Iran.]
- **Behavior of the check on this category:** no-signal (Proxycurl returns 404 / no profile)
- **Reasoning:** If the customer has no LinkedIn profile because the platform is inaccessible in their country, the check fires `linkedin_no_profile` and routes to manual review. This is a systematic false negative for a large researcher population.

### Gap 2: Academic researchers who do not maintain LinkedIn profiles
- **Category:** Faculty, postdocs, and lab technicians at OECD-country institutions who do not use LinkedIn — common in wet-lab biology, where ResearchGate / Google Scholar / ORCID are preferred over LinkedIn.
- **Estimated size:** ~54% of US adults with a bachelor's or advanced degree use LinkedIn ([source](https://www.statista.com/statistics/246180/share-of-us-internet-users-who-use-linkedin-by-education-level/)). Among academic life-sciences researchers specifically, adoption is likely lower than the general graduate-degree population because LinkedIn's value proposition skews toward industry/business networking. [best guess: ~30-50% of life-sciences academic researchers in OECD countries have a substantive LinkedIn profile; the remainder either have no profile or a skeletal one. A UK study found LinkedIn was popular among academics but engagement was inconsistent ([source](https://www.researchgate.net/publication/370905728_LinkedIn_use_by_academics_an_indicator_for_science_policy_and_research)).]
- **Behavior of the check on this category:** no-signal or weak-signal (`linkedin_no_profile` or `linkedin_thin_profile`)
- **Reasoning:** A biology postdoc at MIT who has never created a LinkedIn profile is a perfectly legitimate synthesis customer. The check penalizes a large segment of the academic market.

### Gap 3: Researchers with common names or non-Western names
- **Category:** Customers whose name returns multiple LinkedIn profiles (common-name collision) or whose name romanization does not match their LinkedIn profile name.
- **Estimated size:** [best guess: ~10-20% of lookups for customers with East Asian, South Asian, or Middle Eastern names may face disambiguation issues. Common Anglo names (e.g., "John Smith") also collide. Proxycurl's Person Lookup uses `company_domain` as a disambiguator, which helps, but does not eliminate the problem for very common names.]
- **Behavior of the check on this category:** weak-signal (wrong profile returned → `linkedin_employer_mismatch` or no match found)
- **Reasoning:** Proxycurl's Person Lookup matches on first_name + last_name + company_domain. If the customer's name has multiple matches at the same institution (large university departments), or if the customer's romanized name differs from their LinkedIn name, the lookup may return the wrong profile or no profile.

### Gap 4: New hires and recently transitioned researchers
- **Category:** Researchers who recently changed institutions (postdoc moves, new faculty hires, industry-to-academia transitions) whose LinkedIn profile still shows their previous employer.
- **Estimated size:** [best guess: ~5-10% of synthesis customers at any given time may have recently moved institutions. Academic job transitions have a median LinkedIn update lag of weeks to months. Among postdocs specifically, turnover is high (typical appointment is 2-4 years).]
- **Behavior of the check on this category:** false-positive (`linkedin_employer_mismatch` fires because current employer ≠ claimed institution)
- **Reasoning:** This is a genuine false positive — the check wrongly flags a legitimate customer. The manual review SOP mitigates this but adds cost and delay.

### Gap 5: Non-institutional customers (commercial biotech, independent researchers)
- **Category:** Researchers at small biotech companies, CROs, or independent consultants who may have LinkedIn profiles but whose "employer" field is a startup or self-employment rather than a recognized institution.
- **Estimated size:** ~42-46% of DNA synthesis market revenue is from commercial customers ([source](https://www.grandviewresearch.com/industry-analysis/dna-synthesis-market-report)). Many small-biotech employees have LinkedIn profiles, but the check's heuristic of "does employer match claimed institution" assumes institutional affiliation — which is less meaningful for commercial customers ordering under a company name.
- **Behavior of the check on this category:** weak-signal (employer name should match if the check is configured for company-name matching, but "thin profile" and "profile age" heuristics are less discriminating for commercial vs. shell-company customers)
- **Reasoning:** The check was designed for institutional-affiliation verification (M07). For commercial customers, LinkedIn presence is less diagnostic because shell companies can also create LinkedIn profiles.

### Gap 6: Privacy-conscious researchers who restrict LinkedIn profile visibility
- **Category:** Researchers who set their LinkedIn profile to private / "connections only" or who have opted out of public-profile indexing.
- **Estimated size:** [unknown — searched for: "LinkedIn private profile percentage users", "LinkedIn profiles not publicly visible rate" — no published figure for the percentage of profiles that are fully private.] [best guess: ~5-15% of profiles may have restricted visibility settings that prevent Proxycurl from accessing them, since Proxycurl scrapes public profiles.]
- **Behavior of the check on this category:** no-signal (Proxycurl returns 404 or partial data)
- **Reasoning:** Proxycurl relies on scraping public LinkedIn profiles. Users who restrict visibility produce no usable data.

## Refined false-positive qualitative

True false positives (legitimate customers flagged as suspicious):
1. **Recently transitioned researchers** — fires `linkedin_employer_mismatch` (Gap 4, ~5-10% of customers)
2. **Common-name collisions** — fires `linkedin_employer_mismatch` due to wrong profile match (Gap 3)

False negatives (legitimate customers with no signal):
1. **Researchers in LinkedIn-blocked countries** — ~15-20% of global researcher pool (Gap 1)
2. **Academic researchers without LinkedIn** — ~30-50% of OECD life-sciences academics (Gap 2)
3. **Privacy-restricted profiles** — ~5-15% (Gap 6)

Weak-signal cases:
1. **Commercial customers** — employer match works but other heuristics (profile age, thin profile) are less discriminating (Gap 5)

## Notes for stage 7 synthesis

- This check has **high false-negative rates** across multiple dimensions: ~30-50% of OECD academics lack usable LinkedIn profiles, and entire country populations (China, Russia) are structurally excluded.
- The check is most useful for **industry/commercial customers in OECD countries** where LinkedIn adoption is high — ironically the population where institutional-affiliation verification (M07's purpose) matters least.
- **Legal risk** from LinkedIn ToS / Proxycurl's scraping model is a pre-deployment blocker flagged in stage 4 and remains unresolved.
- Pairing with m07-incommon-edugain (federation check for academics) and m07-google-site-search (web footprint for all) provides complementary coverage.
