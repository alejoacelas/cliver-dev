# Coverage research: Dangling-DNS / drop-catch detector

## Coverage gaps

### Gap 1: Small or niche institutions with domains outside Tranco top 1M
- **Category:** Legitimate researchers affiliated with small colleges, independent research institutes, specialized biotech startups, or non-US academic institutions whose domains are not ranked in Tranco's top 1M list. For these domains, the Tranco rank-delta signal (a key indicator of drop-catch behavior) produces no data — there is no historical rank to compare against.
- **Estimated size:** Tranco ranks 1M domains out of hundreds of millions of registered domains. There are only ~7,300 .edu domains total [source](https://www.hostingadvice.com/how-to/how-many-edu-websites-are-there/), and most major US universities would be in the top 1M, but many international academic domains (e.g., small European universities, African institutions, research NGOs) likely fall outside. [best guess: 30-50% of legitimate gene synthesis customers may use institutional domains not in Tranco's top 1M, particularly non-US academic institutions and small biotech companies. For these, the drop-catch detection signal is unavailable].
- **Behavior of the check on this category:** weak-signal (only dnsReaper and CT-log signals remain; Tranco component is blind)
- **Reasoning:** The Tranco-based detection works well for established, high-traffic domains. It provides no signal for the long tail of smaller institutional domains, which is precisely where a drop-catch attack would be easiest to execute (less-monitored domains).

### Gap 2: Customers using personal or commercial email domains (Gmail, Outlook, etc.)
- **Category:** Legitimate customers — independent researchers, consultants, small biotech founders — who order synthesis using a personal email domain (gmail.com, outlook.com, protonmail.com) or a generic commercial domain rather than an institutional domain. The dangling-DNS check is designed to verify institutional affiliation domains; it has no meaningful signal for major email providers.
- **Estimated size:** [best guess: a significant minority of synthesis customers, perhaps 15-25%, may use non-institutional email for orders. This includes independent researchers, consultants, and small companies without custom domains. For these customers, the entire dangling-DNS check is inapplicable — it cannot distinguish a legitimate independent researcher from an attacker using a generic email].
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The check is fundamentally domain-reputation-based. Customers without a meaningful affiliation domain bypass the check entirely. This is acknowledged in the implementation (the check addresses specific attacker branches around dormant/dangling domains) but is a real coverage gap for the broader customer population.

### Gap 3: Institutions mid-cloud-migration with transient dangling records
- **Category:** Legitimate universities or research institutions in the process of migrating web infrastructure to new cloud providers, which creates temporary dangling CNAME records pointing to deprovisioned resources. This is a normal operational state during migrations.
- **Estimated size:** Researchers found over 1,000 organizations with vulnerable subdomains at risk of hijacking, and SentinelOne identified over 1,250 instances of subdomain takeover risks due to deprovisioned cloud resources in the past year [source](https://www.securityweek.com/dangling-dns-used-to-hijack-subdomains-of-major-organizations/). Major US universities (UCLA, Stanford, UPenn) were specifically demonstrated to have exploitable dangling DNS records [source](https://www.hornetsecurity.com/en/blog/subdomains-universities-threat-vector/). [best guess: at any given time, 5-10% of large universities may have at least one dangling DNS record due to routine cloud operations, not because they have been compromised].
- **Behavior of the check on this category:** false-positive
- **Reasoning:** The dnsReaper scanner cannot distinguish "legitimate institution mid-migration" from "abandoned domain an attacker could claim." Both produce the same signature. This creates a steady-state false-positive rate that scales with the number of cloud-using institutions in the customer base.

### Gap 4: Wildcard DNS configurations at large institutions
- **Category:** Large universities and research institutions that use wildcard DNS records (e.g., *.uni.edu pointing to a load balancer) as standard infrastructure. Wildcard configurations can generate many dnsReaper findings because any non-existent subdomain resolves and may appear to point to a claimable resource.
- **Estimated size:** [best guess: many large universities use wildcard DNS for at least some zones. The implementation acknowledges this failure mode. The false-positive volume could be high for institutions with complex DNS setups — potentially dozens of findings per domain scan, each requiring triage].
- **Behavior of the check on this category:** false-positive
- **Reasoning:** Wildcard DNS is a legitimate infrastructure pattern that generates noise in subdomain takeover scanning. The reviewer must distinguish wildcard-caused findings from genuine dangling records, adding to the manual review burden.

### Gap 5: Sophisticated attackers who register new domains rather than drop-catching
- **Category:** Attackers who create a fresh domain (e.g., registering "harvard-bioresearch.org") rather than drop-catching an expired legitimate domain. The dangling-DNS check is specifically designed to detect domain reuse, not domain creation. A newly registered domain with clean DNS, fresh CT certificates, and no Tranco history would not trigger any of this check's signals.
- **Estimated size:** This is a structural bypass, not a customer-population gap. Any attacker aware of drop-catch detection can trivially switch to new-domain registration. The check addresses only one branch of the domain-impersonation attack tree.
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The check detects a specific attack pattern (domain reuse/takeover) but not the broader threat (domain-based identity fabrication). Complementary checks (m02-rdap-age for domain age, m02-inbox-roundtrip for email deliverability) are needed to cover adjacent branches.

## Refined false-positive qualitative

1. **Cloud-migration dangling records** (Gap 3): The most operationally significant false-positive source. Major universities were empirically shown to have exploitable dangling DNS, meaning legitimate institutions routinely look like compromised ones to this scanner.
2. **Wildcard DNS noise** (Gap 4): High-volume false positives for institutions with wildcard configurations.
3. **Recent CT certificates on legitimate domain changes** (from implementation doc): Institutions migrating DNS providers get new certificates that look "fresh" to the CT-log check.
4. **Small legitimate institutions with no Tranco history** (Gap 1): Their domains look like "new" or "unranked" in the same way a drop-caught domain would.
5. **Personal/hobby domains** (from implementation doc): Customers using recent `.io`, `.dev`, or `.science` domains for legitimate personal projects.

The false-positive profile is dominated by the gap between "looks suspicious to an automated DNS scanner" and "is actually compromised." University DNS hygiene is empirically poor, meaning the base rate of "looks dangling" among legitimate institutions is high.

## Notes for stage 7 synthesis

- This check is narrowly targeted: it detects domain takeover via dangling DNS and drop-catching, not general domain impersonation. Its value is high for that specific attack vector but near-zero for others.
- The false-positive rate against real university domains is likely significant given empirical evidence of widespread dangling DNS at major institutions. Tuning the reviewer SOP to distinguish "sloppy DNS hygiene" from "active takeover" is critical.
- The check is useless for customers without institutional domains (Gap 2). It must be paired with other M02 checks for comprehensive email/affiliation verification.
- The Tranco rank-delta signal is the most distinctive component (hard for an attacker to fake) but covers only high-traffic domains. The long tail of smaller domains relies on dnsReaper + CT-log alone, which have higher false-positive rates.
- Cost is near-zero, making this a good "cheap additional signal" even with its limited coverage.
