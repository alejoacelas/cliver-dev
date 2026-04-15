# Coverage research: RDAP/WHOIS domain age + registrant

## Coverage gaps

### Gap 1: Legitimate new biotech startups with domains <12 months old
- **Category:** Seed-to-Series-A biotech and synthetic biology companies that registered their domain in the past year. These are legitimate synthesis customers whose domain age is indistinguishable from an attacker's freshly registered shell domain.
- **Estimated size:** There were ~3,740 biotech businesses in the US as of 2023, growing at ~8.9% annually ([Specter Insights: 500+ startups in biotechnology](https://insights.tryspecter.com/500-startups-in-biotechnology-2025/)). That implies ~330 new US biotech firms/year. Not all order synthesis, but DNA synthesis customers are ~46% commercial ([Fortune Business Insights: DNA Synthesis Market](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)). [best guess: at any point in time, ~5-10% of active commercial synthesis customers have a domain <12 months old, based on ~330 new firms/year against an active population of ~3,000-4,000 synthesis-buying commercial entities.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** `domain_age_lt_12mo` fires on every one of these. The 04-implementation explicitly notes this: "not safe to use as a single auto-deny gate." But even as a review-queue contributor, this creates a persistent FP stream from the fastest-growing customer segment.

### Gap 2: Domains with GDPR/privacy-redacted registrant data (~90% of gTLDs)
- **Category:** Any customer whose domain is registered through a gTLD registrar that applies GDPR-compliant redaction or proxy/privacy services. This is now the overwhelming default.
- **Estimated size:** As of January 2024, ~89% of gTLD domain records do not have identifying registrant contact information — 58.2% behind proxy/privacy services, 31.0% with redacted contact data. Only 10.8% of gTLD records identify the actual registrant ([Interisle Consulting / DNIB.com: domain name contact data availability](https://www.dnib.com/articles/interisle-report-examines-domain-name-contact-data-availability)).
- **Behavior of the check on this category:** no-signal (for the registrant dimension)
- **Reasoning:** The `registrant_redacted` flag fires on ~89% of all gTLD domains, including virtually all legitimate `.com` and `.org` customers. The 04-implementation already downgrades this to a "soft flag — most modern gTLDs redact by default." In practice the registrant dimension of RDAP is nearly useless as a discriminator — it provides information only for the ~11% of domains that opted out of privacy, which skews toward older registrations and certain registrars.

### Gap 3: ccTLD domains without RDAP support
- **Category:** Customers whose email domain uses a country-code TLD (e.g., `.cn`, `.br`, `.in`, `.jp`, `.kr`) where the ccTLD registry has not deployed RDAP, requiring WHOIS fallback with inconsistent field formats.
- **Estimated size:** ICANN mandated RDAP for all gTLDs by 2025, but ccTLDs are not under ICANN's contractual authority. The RDAP.org deployment dashboard tracks per-TLD status ([RDAP.org Deployment Dashboard](https://deployment.rdap.org/)). [best guess: ~30-40% of ccTLDs still lack RDAP as of 2025, based on the 04-implementation's own estimate of ~30% and slow adoption outside OECD.] ccTLD domains are used by many non-US academic institutions (`.ac.uk`, `.edu.au`, `.ac.jp`, etc.) — some of these DO have RDAP (UK, AU), but many (`.cn`, `.in`, `.br`) have inconsistent support.
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** WHOIS fallback is possible but returns unstructured text that varies by registrar. Parsing domain age is usually feasible; parsing registrant is unreliable. The check degrades to "domain age only" for these TLDs.

### Gap 4: Aged-domain or drop-catch attackers who pre-age or purchase at auction
- **Category:** Attacker stories `shell-company` and `cro-framing` explicitly describe purchasing aged domains at auction or pre-aging domains 6-12 months before use. These have `domain_age_days > 365` and pass the age check cleanly.
- **Estimated size:** [best guess: the attacker population is small in absolute terms, but this is the check's primary target and it is structurally defeated]. The aged-domain market is liquid — GoDaddy Auctions, Afternic, and Sedo list hundreds of thousands of domains. [unknown — searched for: "number of aged domains sold per year domain auction volume", "expired domain auction market size"]
- **Behavior of the check on this category:** no-signal (attacker passes)
- **Reasoning:** This is a structural limitation, not a coverage gap in the traditional sense. The 04-implementation acknowledges: "defeated by the explicit 'domain age padding' tactics." Domain age is a one-time gate that sophisticated attackers can circumvent with trivial cost (~$10-50 for an aged domain at auction).

## Refined false-positive qualitative

1. **New legitimate startups (Gap 1):** The `domain_age_lt_12mo` flag will fire on ~5-10% of commercial customers at any time. This is the check's primary FP source and it hits the most desirable customer segment (fast-growing biotechs). Must be combined with other signals, never used as a sole gate.
2. **GDPR-redacted registrant (Gap 2):** The `registrant_redacted` flag fires on ~89% of gTLD domains. It is essentially uninformative. The 04-implementation correctly downgrades it to a soft flag, but including it at all risks creating review noise.
3. **WHOIS parsing failures on ccTLDs (Gap 3):** `rdap_unavailable` fires for 30-40% of ccTLDs. The fallback to `python-whois` introduces parsing errors and incomplete data. International academic customers on ccTLDs disproportionately hit this path.

## Notes for stage 7 synthesis

- The check's value concentrates narrowly on catching freshly registered lookalike/shell domains and detecting recent transfers (dormant-domain reanimation). Outside those two patterns, it provides little discriminatory power.
- The registrant dimension is essentially dead for gTLDs due to GDPR redaction (~89%). Consider dropping `registrant_redacted` as a flag entirely and focusing the check on domain age + transfer recency only.
- Pair with m02-wayback for dormant-domain detection (RDAP transfer date + Wayback content pivot is a strong combined signal). Pair with m02-mx-tenant for the "freshly registered shell" detection (young domain + no M365 tenant = high confidence).
