# Adversarial review: email-domain (FINAL)

**Iterations:** 1 (thorough initial testing -- no high-severity untested gaps requiring re-run)

## Resolved findings

- **Disposable email services pass DNS checks.** Guerrillamail (DMARC p=reject, SPF -all) and Mailinator (DMARC p=reject, SPF -all) have stronger email authentication than IIT Kanpur, Seoul National University, and China Agricultural University. DNS-based trust scoring (MX/SPF/DMARC) actively inverts the risk ordering. The disposable-email blocklist is the primary and often only detection layer. Tested 3 disposable services + comparison against 15+ institutional domains.
- **.com impersonation of .edu institutions is live and active.** mit-edu.com (July 2025, self-hosted MX), stanford-edu.com (August 2025, Zoho MX), harvard-edu.com (2019, PrivateEmail) all have functioning email infrastructure. Meanwhile, .edu typosquats are all unregistered because Educause restricts .edu registration. The real threat vector is cross-TLD impersonation (.com of .edu), not within-TLD typosquats. 5 .com impersonation domains and 3 .edu typosquats tested.
- **RDAP/WHOIS coverage gaps align with the hardest KYC countries.** No RDAP for .edu, .cn, .ir, .ru, .ac (Korea). India (.ac.in) is the only non-.com TLD where RDAP returns domain registration dates. Domain age signal is unavailable for US academic (.edu), China (.edu.cn), Iran (.ac.ir), UK (.ac.uk), Australia (.edu.au), and Russia (.ru). 12 TLDs tested across 8 countries.
- **Sanctioned institutions have zero email infrastructure.** Baqiyatallah (IRGC-affiliated) has no MX, no SPF, no DMARC. Researchers must use free email, making step (c) completely blind. Malek Ashtar has MX but no SPF/DMARC (trivially spoofable). This forces the system to rely on entity-level screening (step b) for sanctioned institution detection.
- **eduGAIN coverage drops sharply outside US/China/India.** InCommon 587 IdPs (US), CARSI 573 (China), INFED 317 (India). Iran has 2, Russia has 0. Sharif University (Iran) has a .edu domain but is NOT in InCommon -- .edu TLD does not guarantee InCommon membership.
- **DMARC policy is not a trust discriminator.** Two disposable services have p=reject while Gmail, Outlook, and several major universities have p=none or missing DMARC. Using DMARC as a positive trust signal would rank guerrillamail above MIT.
- **Free email blocklist covers major global providers.** Tested gmail.com, outlook.com, yahoo.com, 163.com, 126.com, qq.com, mail.ru, yandex.ru, naver.com, hanmail.net, protonmail.com, tutanota.com. Correct policy: hard block disposable, soft flag free, no flag for institutional.

## Unresolved findings (forwarded to final synthesis)

- **Cross-TLD homoglyph detection is architecturally defined but not system-tested.** The finding that .com impersonation is the primary threat (not .edu typosquats) is established. But no homoglyph detection system was run as an endpoint -- the finding is based on manual RDAP lookups of known impersonation domains. The final synthesis should note that a homoglyph detector must cover {institution}-edu.com and {institution}research.com patterns, not just within-TLD typosquats.
- **RDAP fallback chain for blind-spot TLDs not tested.** The recommendation (RDAP -> country WHOIS -> DNS creation heuristics like SOA serial) is architectural. No DNS creation heuristic was validated. .ir and .ru will remain blind spots regardless.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: InCommon MDQ search quality is poor.** Returns all 14K+ entities for any query. Substring matching produces false positives (iiitkottayam matched when searching for iitk). Needs exact-domain matching implementation, not substring. Operational concern, not a coverage gap.
- **MEDIUM: Free-email-to-institution bridge not tested as a system.** When a customer uses free email + claims an institution, verification must come from a separate path (ORCID, publication search, institutional website). This crosses into the individual-affiliation group's territory.
- **LOW: Regional free email providers may be incomplete.** The tested list covers the major providers by volume, but there may be country-specific free email services (e.g., Rambler.ru, daum.net) not on the blocklist. The blocklist must be maintained and expanded over time.
- **LOW: .edu WHOIS (Educause) returns registrant only, no dates.** Domain age is unavailable for .edu. This is a permanent limitation of the Educause WHOIS system, not something additional testing can address.
