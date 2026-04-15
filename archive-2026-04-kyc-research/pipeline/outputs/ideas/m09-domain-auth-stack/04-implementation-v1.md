# m09-domain-auth-stack — implementation v1

- **measure:** M09 — institution-real-life-sciences
- **name:** MX/SPF/DMARC + RDAP/WHOIS-history domain liveness signal
- **modes:** A
- **summary:** For the institution's claimed primary domain, perform live DNS lookups (MX, SPF TXT, DMARC TXT, A/AAAA), inspect mail-auth alignment, and query RDAP for registration date and registrar. Optionally enrich with DomainTools history for transfer/ownership-change events. Used as a corroborating signal alongside the corp-registry stack: a real life-sciences org typically has an aged domain, working mail authentication, and stable WHOIS history.

## external_dependencies

- Public DNS resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1, or recursive local) for MX/TXT/A records.
- RDAP — official IANA-maintained replacement for WHOIS, returns structured JSON, queryable directly at `https://rdap.org/domain/{domain}` or via per-TLD RDAP servers ([source](https://en.wikipedia.org/wiki/Registration_Data_Access_Protocol)).
- (Optional) DomainTools Iris Investigate API for WHOIS history records ([source](https://learn.microsoft.com/en-us/connectors/domaintoolsirisinves/)).
- (Optional) MxToolbox API as a managed alternative to building DNS lookups in-house ([source](https://mxtoolbox.com/dmarc.aspx)).

## endpoint_details

- **DNS:** standard system resolver or any DNS-over-HTTPS endpoint (Cloudflare DoH at `https://cloudflare-dns.com/dns-query`, Google at `https://dns.google/resolve`). Free, no auth, effectively unlimited for screening volumes [best guess: ~10k checks/day is well below any public DoH provider's fair-use threshold].
- **RDAP (free):** `https://rdap.org/domain/{domain}` — JSON, no auth, no documented rate limit, federates to the authoritative TLD RDAP server. ICANN sunset the gTLD WHOIS requirement on 28 Jan 2025; RDAP is now the canonical lookup ([source](https://en.wikipedia.org/wiki/Registration_Data_Access_Protocol)). Free fallbacks with rate limits include WhoisJSON (1,000 free requests/month/account) ([source](https://whoisjson.com/)) and WhoisFreaks (500 free credits on signup) ([source](https://whoisfreaks.com/products/whois-api)).
- **DomainTools Iris (paid):** REST + JSON. **Tier 0 Starter $15,750/month** for 250 queries/month + 1,000 WHOIS history records/month; Tier 1 $52,500/month for 1,000 queries/month ([source](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/708941/255941323840717-pricing-document-2024-04-17-1304.pdf)). API key auth. WHOIS History API endpoint returns up to 100 historical records per domain.
- **MxToolbox API:** REST. Pricing not publicly listed in marketing pages [unknown — searched for: "MxToolbox API pricing per lookup", "MxToolbox API monthly subscription cost"]. Free web tools at https://mxtoolbox.com/dmarc.aspx and https://mxtoolbox.com/spf.aspx ([source](https://mxtoolbox.com/dmarc.aspx)).
- **ToS:** RDAP and DNS are public-protocol queries with no commercial restriction. DomainTools commercial use is standard contractual.

## fields_returned

- **DNS lookups:** MX records (priority + exchange host), SPF TXT record (string), DMARC TXT record (`p=none/quarantine/reject` policy + `rua=` reporting address), DKIM selector existence (must guess selector), A/AAAA records.
- **RDAP response (gTLD example):** `handle` (registry domain ID), `ldhName`, `events` (registration, last-changed, expiration with `eventDate` ISO timestamp), `entities` (registrar with name, IANA ID, abuse contact), `nameservers`, `status` (e.g., `client transfer prohibited`), `secureDNS` (DNSSEC delegation) ([source](https://en.wikipedia.org/wiki/Registration_Data_Access_Protocol)).
- **DomainTools WHOIS History API:** up to 100 historical WHOIS records per domain, each with timestamp, registrant fields (where not redacted), nameservers, registrar, plus screenshots and ownership-change events on Iris Investigate ([source](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/708941/255941323840717-pricing-document-2024-04-17-1304.pdf)).

## marginal_cost_per_check

- **DNS + RDAP only:** $0 marginal cost.
- **WhoisJSON / WhoisFreaks free tier:** $0 below quota; ~$0.005–$0.02/lookup on cheap paid tiers [best guess: typical pricing for commodity WHOIS APIs at small volume].
- **DomainTools enrichment:** ~$15.75/query at Tier 0 ($15,750 / 1,000 effective queries including history pulls) — only used for high-suspicion follow-ups, not every customer.
- **Combined per check:** ~$0 baseline + $15 occasional escalation. **Setup cost:** ~2 engineering days for the DNS-parsing and RDAP-normalization layer.

## manual_review_handoff

- Reviewer receives: domain, full DNS lookup output, RDAP record, computed signals (domain age in days, has-MX, SPF policy, DMARC policy, DNSSEC).
- Playbook:
  1. **Domain age > 2 years, MX present, DMARC policy `quarantine` or `reject`, no recent registrar transfer:** strong positive signal, pass.
  2. **Domain age < 90 days:** flag `domain_recent`. Cross-check against registry incorporation date — a real new biotech may have a fresh domain coincident with incorporation. Combine with other M09 signals.
  3. **No MX or only catch-all MX, no SPF, no DMARC:** flag `domain_no_mail_auth`. Real life-sciences orgs almost always run real mail. Common pattern for shell setups using only a parking page.
  4. **Recent ownership transfer or reregistration after a gap (visible in DomainTools history):** flag `domain_reanimated`. The "dormant-domain" attacker pattern.
  5. **WHOIS contact privacy-protected and registrar is a high-volume privacy/proxy host:** weak signal; common for legitimate small orgs too.

## flags_thrown

- `domain_recent` — registration date < 90 days before order.
- `domain_no_mail_auth` — no MX, or no SPF, or no DMARC. (Three sub-flags possible; combine.)
- `domain_reanimated` — RDAP/DomainTools history shows recent transfer or post-gap re-registration.
- `dns_unresolvable` — domain has no A record / fails to resolve.

## failure_modes_requiring_review

- DNS resolver caching / propagation lag for very recently configured domains.
- RDAP entity privacy redaction (post-GDPR many registrars redact registrant; only registration date and registrar stay visible). The check still works for date-based signals but contact-based signals are reduced.
- Bootstrap registry returning a `not found` for a country-code TLD whose RDAP server doesn't federate cleanly via rdap.org.
- DomainTools cost — only affordable for escalation, not bulk.
- ICANN's January 2025 WHOIS sunset means legacy WHOIS scripts need to be replaced with RDAP ([source](https://en.wikipedia.org/wiki/Registration_Data_Access_Protocol)); old infra may be stale.

## false_positive_qualitative

- Brand-new biotechs (legitimately recent domain registration during company formation).
- Small academic labs that use a parent-university domain instead of a vanity domain — the vanity domain (if any) may have no MX because mail is routed via the university.
- Foreign institutions on country-code TLDs whose RDAP server is poorly maintained.
- Privacy-by-default registrars (Cloudflare Registrar, Hover with WHOIS privacy) make legit small orgs look like privacy-screened shells.
- Subdomain-only operations (lab.university.edu) — the check should fall back to the parent domain in this case.

## record_left

- JSON snapshot of: DNS lookup output, RDAP response, computed signals (age, mail-auth status, transfer events), query timestamp. Stored in customer file.

## bypass_methods_known

[deferred to stage 5]

## bypass_methods_uncovered

[deferred to stage 5]

---

**Sources cited:**
- RDAP overview (Wikipedia, summarizing IANA / ICANN sunset dates): https://en.wikipedia.org/wiki/Registration_Data_Access_Protocol
- DomainTools Iris pricing (UK G-Cloud public PDF): https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/708941/255941323840717-pricing-document-2024-04-17-1304.pdf
- DomainTools Iris Investigate connector docs: https://learn.microsoft.com/en-us/connectors/domaintoolsirisinves/
- MxToolbox DMARC tool: https://mxtoolbox.com/dmarc.aspx
- MxToolbox SPF tool: https://mxtoolbox.com/spf.aspx
- WhoisJSON: https://whoisjson.com/
- WhoisFreaks: https://whoisfreaks.com/products/whois-api
