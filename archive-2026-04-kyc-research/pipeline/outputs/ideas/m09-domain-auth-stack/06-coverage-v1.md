# Coverage research: MX/SPF/DMARC + RDAP/WHOIS-history domain liveness signal

## Coverage gaps

### Gap 1: Legitimate organizations without DMARC/SPF (small biotechs, non-OECD institutions)

- **Category:** Small biotech companies, small nonprofits, and research institutions (particularly in non-OECD countries) that have a real domain but have not configured DMARC or SPF records.
- **Estimated size:** Only 18.2% of the top 10 million domains have valid DMARC records, and 39% of the top 1 million domains lack even an SPF record ([source](https://dmarcchecker.app/articles/spf-dkim-dmarc-adoption-2024)). Among SMEs specifically, adoption has been growing (300% YoY growth) but from a very low base ([source](https://emailsecurity.fortra.com/blog/dmarc-adoption-trends-q2-2025)). [best guess: 50–70% of small biotech companies (< 50 employees) and 70–85% of non-OECD research institutions lack a valid DMARC record, based on the overall ~82% non-adoption rate and the known correlation between org size and DMARC deployment].
- **Behavior of the check on this category:** false-positive (`domain_no_mail_auth` flag fires on legitimate orgs)
- **Reasoning:** DMARC/SPF adoption is still low across the internet. The check assumes that real life-sciences orgs "almost always run real mail," but this is true mainly of large institutions. Many small biotechs, community labs, and non-OECD research institutions use generic email (Gmail, Outlook) or have a domain without mail authentication configured. The flag would fire on a large fraction of legitimate small customers.

### Gap 2: Academic labs using parent-university subdomains

- **Category:** Academic research labs whose "domain" is a subdomain of a parent university (e.g., `lab.bio.university.edu`), with no independent DNS, MX, or WHOIS record.
- **Estimated size:** [best guess: The vast majority (~90%+) of academic research labs operate under a parent university domain. Universities typically enforce subdomain policies requiring labs to use institutional subdomains rather than vanity domains ([source](https://umdearborn.edu/policies-and-procedures/information-technology-policies-procedures-and-standards/subdomain-policy)). Academic customers represent ~39% of the synthesis market ([source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799))].
- **Behavior of the check on this category:** weak-signal (the check must fall back to the parent domain, whose age and mail-auth reflect the university, not the lab)
- **Reasoning:** The implementation notes this case and says "the check should fall back to the parent domain." But the parent-domain signals (domain age, DMARC policy) tell you about the university, not about the specific lab placing the order. The check passes trivially on the domain layer — but provides no discriminating signal about the lab itself.

### Gap 3: Country-code TLDs with no or broken RDAP federation

- **Category:** Institutions and companies registered under ccTLDs (e.g., `.cn`, `.in`, `.br`, `.ru`, `.ir`) where the RDAP server does not federate properly via rdap.org or returns incomplete data.
- **Estimated size:** The RDAP Deployment Dashboard ([source](https://deployment.rdap.org/)) tracks ccTLD RDAP support. [unknown — searched for: "percentage of ccTLDs with RDAP support", "ccTLD RDAP deployment statistics 2025", "number of ccTLDs without RDAP server"]. The implementation document itself notes this failure mode. There are ~316 ccTLDs listed in the IANA root zone database ([source](https://www.iana.org/domains/root/db)). [best guess: 30–50% of ccTLDs do not have a functioning RDAP server federated through rdap.org, affecting domains in countries that collectively host a significant fraction of non-US/EU research institutions].
- **Behavior of the check on this category:** no-signal (RDAP returns not-found or error; no domain-age signal available)
- **Reasoning:** Without RDAP, the check loses its domain-age signal entirely for these TLDs. DNS lookups (MX/SPF/DMARC) still work, but the implementation weights domain age as its strongest positive signal. ccTLD coverage gaps correlate with non-OECD countries where legitimate institutions are already harder to verify.

### Gap 4: Newly registered domains for legitimate new companies

- **Category:** Biotech startups and new research entities that legitimately registered their domain within the last 90 days, coincident with company formation.
- **Estimated size:** [best guess: same population as corp-registry-stack Gap 3 — ~1,000–1,500 new US biotechs/year, plus international formations. If average time from incorporation to first synthesis order is 3–12 months, and domain registration coincides with incorporation, perhaps 10–15% of first-time commercial customers have domains < 90 days old at order time].
- **Behavior of the check on this category:** false-positive (`domain_recent` flag)
- **Reasoning:** The `domain_recent` threshold of 90 days is aggressive. A real NewCo biotech will register its domain during company formation and may place a synthesis order within weeks. The flag fires correctly but is uninformative — it cannot distinguish a real new biotech from a shell's freshly registered domain.

### Gap 5: Privacy-protected WHOIS/RDAP registrant data (post-GDPR)

- **Category:** Legitimate organizations whose WHOIS/RDAP registrant information is redacted due to GDPR privacy protections or registrar-default privacy (Cloudflare Registrar, Hover, Namecheap).
- **Estimated size:** Since GDPR (May 2018), registrars redact personal data for EU-based natural persons, and many registrars apply privacy by default globally ([source](https://blog.dnsimple.com/2019/04/gdpr-and-whois-privacy/)). Cloudflare Registrar redacts WHOIS for all registrants by default ([source](https://developers.cloudflare.com/registrar/account-options/whois-redaction/)). [best guess: 60–80% of gTLD domain registrations now have registrant-contact redaction, based on the widespread post-GDPR default-privacy policies]. The check still works for date-based signals (registration date is not redacted), but contact-based signals and DomainTools history signals are reduced.
- **Behavior of the check on this category:** weak-signal (domain age still available; registrant identity lost)
- **Reasoning:** The implementation correctly notes this but it limits the DomainTools enrichment value. The "ownership transfer" detection in DomainTools relies on registrant-name changes; if both the old and new registrant are redacted, the transfer is invisible.

## Refined false-positive qualitative

1. **Small orgs without mail auth** (Gap 1) — `domain_no_mail_auth` is the highest-volume false positive. Given that ~80% of domains globally lack DMARC, this flag fires on a large majority of small legitimate customers. It is useful only as a corroborating signal, never standalone.
2. **New company domains** (Gap 4) — `domain_recent` fires on all legitimate new formations. Same corroboration requirement as corp-registry-stack's `registry_recent_incorp`.
3. **Privacy-protected registrants** (Gap 5) — Not a false positive per se, but degrades the check's enrichment value for the majority of gTLD domains.
4. **Academic subdomain fallback** (Gap 2) — The check passes trivially on university parent domains but provides no discriminating signal about the specific lab. Not a false positive, but a structural no-value case for ~39% of the market.

## Notes for stage 7 synthesis

- This check is structurally a **corroborating signal**, not a standalone screen. The highest-confidence signal (domain age > 2 years + DMARC `quarantine`/`reject`) is available only for the minority of domains that are both old and well-configured.
- The `domain_no_mail_auth` flag has an extremely high base rate (~80% of small domains) and should be down-weighted relative to its prominence in the implementation's playbook.
- Post-GDPR WHOIS redaction significantly limits the DomainTools enrichment path, which costs $15+/query. The cost-benefit of DomainTools escalation is weak unless the provider already has a DomainTools subscription for other purposes.
- For academic customers, this check adds near-zero marginal signal because the parent-university domain trivially passes all checks.
