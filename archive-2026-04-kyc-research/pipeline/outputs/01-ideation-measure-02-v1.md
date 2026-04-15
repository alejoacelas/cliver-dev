# Stage 1 Ideation — Measure 02 (email-affiliation-whois) — v1

Measure: check email matches institutional affiliation; WHOIS lookup of domain; domain matches known institutional domains; address is institutional. Flag triggers: non-institutional domain (gmail), or domain not matching claimed institution.

## Direct mode

### 1. ROR domain cross-reference
- **summary:** Query the Research Organization Registry (ROR) public API (`api.ror.org/organizations?query=<institution>`) for the customer's claimed institution. ROR records include `links` (institutional websites) from which canonical domains can be derived. Compare the registration email's domain (and its registrable parent) against the ROR record's domain. Mismatch → flag.
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation
- **external_dependencies:** ROR public API (free, no auth)
- **manual_review_handoff:** If no ROR hit for claimed institution OR ROR hit exists but domain mismatch, route to a reviewer with the ROR record + customer's email/domain. Reviewer decides: accept (with documented justification), request additional evidence (e.g., institutional letter), or deny.
- **flags_thrown:** (a) claimed institution absent from ROR → review; (b) email domain not contained in ROR `links` → review; (c) free-mail provider domain (gmail, outlook, yahoo, qq, 163, protonmail) → review.
- **failure_modes_requiring_review:** API 5xx/timeout; ambiguous ROR matches (multiple orgs share name); ROR record lacks `links`; institution legitimately uses a domain alias not listed in ROR.
- **record_left:** ROR record JSON snapshot, query string, timestamp, decision.
- (other fields: # stage 4 / # stage 6)

### 2. WHOIS domain-age + recent-registrant-change check (RDAP)
- **summary:** Resolve the email's domain via RDAP (`rdap.org/domain/<domain>` or registrar RDAP) to get `events.registration` (creation date) and `events.last changed` (most recent ownership/transfer event). Flag domains created < 12 months ago, or where the registrant changed within 12 months on an otherwise-old domain (signal of drop-catch acquisition). RDAP is the IANA-mandated successor to port-43 WHOIS.
- **attacker_stories_addressed:** dormant-domain, cro-identity-rotation, cro-framing, shell-nonprofit, shell-company, biotech-incubator-tenant, community-bio-lab-network
- **external_dependencies:** IANA RDAP bootstrap registry; per-TLD RDAP servers (Verisign for .com/.net, PIR for .org, EDUCAUSE for .edu, etc.). Free.
- **manual_review_handoff:** Domain < 12 months old OR registrant change within last 12 months → reviewer asked to verify institutional bona fides through alternate channel (publication record, ORCID, web presence).
- **flags_thrown:** age < 365d → review; age 365–1095d → soft flag (combine with other signals); recent transfer → review; RDAP returns redacted registrant on a domain that ought to be a public institution → soft flag.
- **failure_modes_requiring_review:** RDAP server down; ccTLDs without RDAP (fall back to whois.iana.org); GDPR redaction limiting registrant fields.
- **record_left:** Raw RDAP response JSON, parsed creation/last-changed dates.

### 3. WHOIS-history check via DomainTools Iris / SecurityTrails
- **summary:** Query DomainTools Iris Investigate or SecurityTrails (`/v1/history/<domain>/whois`) for historical WHOIS records. Flag if the current registrant is different from the registrant 12+ months ago (drop-catch / aftermarket purchase). Catches the dormant-domain Bypass A (defunct lab domain reanimated).
- **attacker_stories_addressed:** dormant-domain, cro-identity-rotation, gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** DomainTools Iris API (paid; per-query pricing) [best guess]; SecurityTrails API (paid). Vendor account.
- **manual_review_handoff:** Registrant change in last 24 months on a domain >5 years old → reviewer reads the prior registrant + the customer's claimed institution. Decision: deny if prior use is incongruent with the claimed continuity, request additional evidence otherwise.
- **flags_thrown:** Registrant changed within N months on aged domain → review; Wayback Machine prior content shows incongruent prior purpose → review (see idea 5).
- **failure_modes_requiring_review:** Vendor API downtime; vendor history coverage gap on obscure ccTLDs; privacy-proxy obscuring continuity.
- **record_left:** Vendor query ID, returned history records.

### 4. Free-mail / disposable-mail blocklist check
- **summary:** Compare the email's domain against the public `disposable-email-domains` list (github.com/disposable-email-domains/disposable-email-domains, ~60k entries) plus a curated free-mail list (gmail.com, outlook.com, hotmail.com, yahoo.com, protonmail.com, icloud.com, qq.com, 163.com, mail.ru, yandex.com, gmx.de, web.de, aol.com). Hit → flag as non-institutional.
- **attacker_stories_addressed:** Generic baseline; complements all branches; explicit measure trigger ("non-institutional domain (e.g., gmail)").
- **external_dependencies:** Public GitHub-hosted blocklists (free).
- **manual_review_handoff:** Free-mail or disposable hit → reviewer requests an institutional email or alternative legitimacy evidence; if customer is legitimately unaffiliated (independent researcher), route to measure-19 individual-legitimacy path.
- **flags_thrown:** disposable hit → reject email; free-mail hit → request institutional email or escalate.
- **failure_modes_requiring_review:** False positive on a small institution that uses Google Workspace under its own domain (this is OK — domain is institutional, not gmail.com).
- **record_left:** Matched list, list version/commit hash.

### 5. Wayback Machine / archive.org prior-content check
- **summary:** Query the Internet Archive Wayback CDX API (`web.archive.org/cdx/search/cdx?url=<domain>&output=json`) for snapshots older than 12 months. If snapshots exist whose content category is incongruent with the claimed life-sciences use (parked, SEO spam, unrelated business, defunct lab), flag for review. Catches dormant-domain reanimation and aged-domain laundering.
- **attacker_stories_addressed:** dormant-domain, cro-identity-rotation, gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** Internet Archive Wayback CDX API (free, public). Optional: an LLM classifier on snapshot text.
- **manual_review_handoff:** Reviewer sees prior snapshot summaries + current site; decides whether prior content is consistent with continuity claim.
- **flags_thrown:** Prior snapshots show parked/for-sale/unrelated content → review; no snapshots at all on a "claimed-old" institution → soft flag.
- **failure_modes_requiring_review:** Wayback gaps; robots.txt exclusion; small legit labs with no historical web presence.
- **record_left:** CDX query, list of snapshot timestamps reviewed, classification output.

### 6. MX-record / mail-stack institutionalness check
- **summary:** DNS lookup of the email domain's MX records. Classify mail provider: institutional self-hosted, Microsoft 365 (`*.mail.protection.outlook.com`), Google Workspace (`*.google.com`, `aspmx.l.google.com`), Proofpoint, Mimecast, etc. A small `.com` newly pointed at Google Workspace MX is consistent with the cro-framing and shell-nonprofit pattern (one-employee LLC with Workspace). Combine with domain age for a composite signal. Also check SPF/DKIM/DMARC record presence and age.
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, biotech-incubator-tenant, community-bio-lab-network
- **external_dependencies:** Any DNS resolver (Google Public DNS-over-HTTPS at `dns.google/resolve`, Cloudflare 1.1.1.1 DoH).
- **manual_review_handoff:** Google-Workspace-on-fresh-com signal alone is not a denial; it raises the priority for institutional cross-checks (ROR, eduGAIN, publication evidence).
- **flags_thrown:** Workspace/M365 MX + domain age < 24 months → soft flag composite; no MX record → reject (undeliverable); recently added MX on aged-but-quiet domain → soft flag (consistent with mail-warming).
- **failure_modes_requiring_review:** Many legitimate small biotechs use Google Workspace; signal must be combined.
- **record_left:** MX/SPF/DKIM/DMARC records, mail-provider classification.

### 7. EDUCAUSE .edu WHOIS / eligibility check
- **summary:** `.edu` domains are administered by EDUCAUSE under contract with NTIA; they are restricted to US postsecondary institutions accredited by a USDE-recognized accrediting agency. Query EDUCAUSE WHOIS (`whois.educause.edu`) for the `.edu` parent domain to retrieve the registered institution name and admin contact. Compare to the customer's claimed institution. Mismatch on subdomain claims (`successor@labname.university.edu`) is harder to catch directly, but the parent's institution-of-record is verifiable.
- **attacker_stories_addressed:** dormant-account-takeover (Bypass C — new mailbox under a real .edu subdomain), it-persona-manufacturing, inbox-compromise, foreign-institution (limited; .edu only)
- **external_dependencies:** EDUCAUSE WHOIS service (free, public).
- **manual_review_handoff:** If the .edu parent's registered name doesn't match the customer's claimed institution → review.
- **flags_thrown:** Mismatch parent → review; subdomain (`@labname.parent.edu`) on a real parent → soft note (catches subdomain takeover indirectly only via signal correlation with other measures).
- **failure_modes_requiring_review:** Cannot directly attest to subdomain holder identity; .edu rate limits.
- **record_left:** WHOIS response.

### 8. eduGAIN / InCommon federated-login challenge
- **summary:** Offer (and for SOC orders, require) federated SSO via eduGAIN / InCommon. The federation lookup `metadata.eduGAIN.org` or `mdq.incommon.org/entities/<entityID>` enumerates the IdPs of accredited institutions. A successful SAML assertion from the customer's institution's IdP provides a real-time, IT-attested assertion of affiliation (and optional eduPersonAffiliation = `member@inst`, `faculty@inst`). Replaces or supplements the WHOIS-allowlist leg of M02.
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation, dormant-domain (cannot federate a .com), foreign-institution (partial — non-Anglophone institutions in eduGAIN)
- **external_dependencies:** InCommon Federation Manager + metadata; eduGAIN interfederation metadata; provider implements SP (e.g., Shibboleth or Auth0/Okta with SAML).
- **manual_review_handoff:** Customer claims institution but institution has no IdP in eduGAIN/InCommon → manual fallback path (publication evidence, voucher).
- **flags_thrown:** No successful federated assertion for SOC order → escalate; eduPersonAffiliation = `affiliate` (not `member`/`faculty`/`staff`) → soft flag (visiting-researcher branch).
- **failure_modes_requiring_review:** Many small/non-US institutions and all commercial entities have no IdP; not a universal solution.
- **record_left:** SAML assertion + IdP entityID + eduPersonPrincipalName.

### 9. Inbox-verification round trip (link-click + DMARC alignment check)
- **summary:** Send a one-time email-verification link to the registered address; require click-through from the same browser session, and verify the verification reply (or DMARC report) shows DKIM + SPF aligned with the claimed sending domain. Confirms the user controls the inbox at the time of registration. Catches typo / fabricated addresses but not compromised-inbox attackers.
- **attacker_stories_addressed:** Baseline; weak against inbox-compromise, credential-compromise, account-hijack (those control real inbox by design); does catch fabricated addresses on real domains.
- **external_dependencies:** SendGrid/Postmark/SES for transactional sending; DMARC aggregate report parser.
- **manual_review_handoff:** Verification fails (link unclicked after N days, bounces, hard SPF/DKIM fail) → reject email; ask customer to re-enroll.
- **flags_thrown:** Bounce → reject; SPF/DKIM fail on inbound reply → review.
- **failure_modes_requiring_review:** Greylisting; legitimate misconfigured small-institution mail.
- **record_left:** Send/click logs, headers of any reply, DMARC alignment record.

### 10. Tranco / Majestic Million domain-popularity / link-graph check
- **summary:** Look up the email domain in the Tranco list (`tranco-list.eu`, free CSV) and Majestic Million (`majestic.com/reports/majestic-million`, free CSV). Real institution domains rank well; freshly registered LLC `.com`s do not. Combine with age. (Imperfect: small genuine biotechs also rank low.)
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, community-bio-lab-network
- **external_dependencies:** Tranco / Majestic Million CSV downloads (free).
- **manual_review_handoff:** Soft signal only; combine with others. No standalone playbook.
- **flags_thrown:** Domain absent from Tranco top-1M → soft flag.
- **failure_modes_requiring_review:** Many legitimate small entities are sub-1M.
- **record_left:** Rank lookup record.

### 11. GLEIF LEI ↔ domain consistency check
- **summary:** For commercial-claimed customers, look up the customer's claimed entity in GLEIF (`api.gleif.org/api/v1/lei-records?filter[entity.legalName]=...`) for an LEI. GLEIF records sometimes include a website / contact field. Cross-check against the customer's email domain. An LLC genuinely operating will often have a registered LEI for any banking, but small US LLCs typically do not — so absence is weak signal; presence is corroborative.
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, biotech-incubator-tenant
- **external_dependencies:** GLEIF public API (free).
- **manual_review_handoff:** No LEI for a commercial customer → not denial; use other signals. LEI present but website mismatch → review.
- **flags_thrown:** Website-domain mismatch on LEI record → review.
- **failure_modes_requiring_review:** US small-LLC LEI coverage is low.
- **record_left:** LEI record JSON.

### 12. Have I Been Pwned / breach-data inbox-compromise check
- **summary:** For institutional addresses (especially `.edu`), query Have I Been Pwned (`api.pwnedpasswords.com`/`api.haveibeenpwned.com/api/v3/breachedaccount/<email>`) to see whether the customer's address appears in known breach corpora. A heavily-breached `.edu` mailbox associated with no recent legitimate publication trail is a soft signal of an inbox-compromise attacker. Not by itself a denial.
- **attacker_stories_addressed:** inbox-compromise, credential-compromise, account-hijack
- **external_dependencies:** HIBP API (paid; ~$3.50/mo per key for v3).
- **manual_review_handoff:** Breached-mailbox + first-time customer + SOC order → step-up auth (out-of-band) and reviewer outreach.
- **flags_thrown:** Account in N+ breaches → step-up.
- **failure_modes_requiring_review:** HIBP cannot tell whether credentials are still valid; high false-positive rate among long-tenured academics.
- **record_left:** HIBP query result.

## Attacker-driven mode

### 13. Dangling-DNS / subdomain takeover scanner (per-order)
- **summary:** For institutional-subdomain emails (`@labname.parent.edu`), resolve the subdomain's CNAME chain and DNS records. If the subdomain CNAMEs to a deprovisioned cloud resource (S3 bucket NXDOMAIN, Azure unclaimed `*.azurewebsites.net`, Heroku `*.herokuapp.com` not registered, GitHub Pages NXDOMAIN, Fastly unattached) or its A-record points to an IP outside the parent institution's announced ASN ranges (lookup via Team Cymru `whois -h whois.cymru.com` or RIPEstat), flag. Tooling pattern from `can-i-take-over-xyz` and Squarcina et al. (2021).
- **attacker_stories_addressed:** dormant-domain (Bypass B — dangling-DNS subdomain takeover)
- **external_dependencies:** DNS resolver (DoH); Team Cymru IP-to-ASN; RIPEstat data API; `can-i-take-over-xyz` fingerprint list.
- **manual_review_handoff:** Subdomain CNAMEs to a fingerprinted takeover-vulnerable service → block; subdomain mail server outside parent ASN → review.
- **flags_thrown:** Fingerprint match → block; ASN mismatch → review.
- **failure_modes_requiring_review:** Legitimate cloud-hosted institutional subdomains exist; Team Cymru lag.
- **record_left:** DNS chain, CNAME target, ASN.

### 14. Mail-server IP origin vs institutional ASN check
- **summary:** During inbox-verification round trip (idea 9), capture the `Received:` chain and confirm the originating mail server IP belongs to the institution's announced ASN (Team Cymru / RIPEstat) or to a known mail provider tied to the institution (eg Microsoft 365 tenant matching the institution's tenantID via Azure tenant discovery `login.microsoftonline.com/<domain>/.well-known/openid-configuration`). Catches dormant-account-takeover Bypass D (institutional VPN egress) only weakly, but catches dormant-domain Bypass A (mail server on commodity VPS).
- **attacker_stories_addressed:** dormant-domain, cro-framing (when claiming an institutional domain), it-persona-manufacturing (weak)
- **external_dependencies:** Team Cymru IP-to-ASN; Microsoft tenant discovery endpoint.
- **manual_review_handoff:** Mail origin from commodity VPS ASN (DigitalOcean, OVH, Hetzner, Linode, Vultr) on a domain claiming to be an institution → review.
- **flags_thrown:** Commodity VPS ASN → review; ASN mismatch with institution's known ASN → review.
- **failure_modes_requiring_review:** Many real institutions use Google Workspace / M365 (mail originates from Google/Microsoft ASNs).
- **record_left:** Received chain, IP, ASN.

### 15. M365 tenant discovery + tenant-age cross-check
- **summary:** Hit `https://login.microsoftonline.com/<domain>/.well-known/openid-configuration` and `https://login.microsoftonline.com/getuserrealm.srf?login=user@<domain>` to discover whether the domain has an Azure AD/Entra tenant, the tenant ID, and the tenant's federation status. Cross-check tenant ID against the institution's known tenant (compiled list via prior orders). New tenant ≠ institution → flag. Particularly useful when the customer claims to be at a university with a known stable tenant.
- **attacker_stories_addressed:** dormant-domain, cro-framing, cro-identity-rotation, shell-nonprofit, shell-company
- **external_dependencies:** Microsoft public OIDC/getuserrealm endpoints (free, unauthenticated).
- **manual_review_handoff:** New/unknown tenant on a high-risk-flagged domain → review with the tenant ID.
- **flags_thrown:** Unknown tenant on claimed institution → review.
- **failure_modes_requiring_review:** Domains may legitimately migrate tenants.
- **record_left:** Tenant ID, federation flag, response JSON.

### 16. Google Workspace customer-ID discovery
- **summary:** For domains using Google Workspace MX, attempt the customer-ID discovery via `accounts.google.com/.well-known/openid-configuration` plus `HEAD` to `mail.google.com` for the domain. Combined with MX classification (idea 6), this corroborates that a small `.com` is a new Workspace tenant. [best guess on the exact discovery surface — Google publishes less than Microsoft]
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-company
- **external_dependencies:** Google public endpoints [best guess].
- (rest similar to idea 15)

### 17. ORCID + OpenAlex publication-vs-affiliation cross-check
- **summary:** Query OpenAlex (`api.openalex.org/authors?search=<name>&filter=last_known_institution.id:<ROR-ID>`) and ORCID (`pub.orcid.org/v3.0/search?q=<email>` or `q=<name>+affiliation:<inst>`) for publications by the customer with affiliation matching the claimed institution. A "researcher" claiming affiliation with no co-affiliated publications is a flag — particularly potent against the dormant-domain "successor researcher" claim (the persona has no real publications under the revived entity).
- **attacker_stories_addressed:** dormant-domain, cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, foreign-institution, visiting-researcher
- **external_dependencies:** OpenAlex API (free); ORCID public API (free).
- **manual_review_handoff:** No publication record under the claimed institution → not blocking but routes to measure-19 individual-legitimacy review.
- **flags_thrown:** Zero publications under affiliation → soft flag; publications under different affiliation → review.
- **failure_modes_requiring_review:** Early-career researchers, technicians, lab managers legitimately have no first-author publications.
- **record_left:** OpenAlex/ORCID query results.

### 18. Alumni-forwarder domain blocklist
- **summary:** Maintain a curated list of known alumni-for-life forwarder domains (`alumni.<u>.edu`, `alum.mit.edu`, `stanfordalumni.org`, `post.harvard.edu`, etc.) and treat them as non-institutional for SOC purposes. Catches the inbox-compromise Method 5 ("alumni-for-life forwarder").
- **attacker_stories_addressed:** inbox-compromise (Method 5)
- **external_dependencies:** Curated list (start from EDUCAUSE community + manual seed).
- **manual_review_handoff:** Alumni domain → require non-alumni institutional address or escalate to legitimacy review.
- **flags_thrown:** Alumni domain hit → soft block.
- **failure_modes_requiring_review:** Legitimate retired faculty may use alumni mail.
- **record_left:** Match record.

### 19. Sign-in-time IP / device fingerprint anomaly (Sift / Sardine / Arkose)
- **summary:** Integrate a fraud-scoring vendor (Sift, Sardine, Arkose) to score the IP, device fingerprint, and behavioral signals at order time vs. account creation time. Catches credential-compromise / account-hijack patterns where a real `.edu` mailbox is being driven from an anomalous IP/device. Weak against the dormant-account-takeover Bypass D (institutional VPN egress) by design.
- **attacker_stories_addressed:** credential-compromise, account-hijack, inbox-compromise, dormant-account-takeover (partial)
- **external_dependencies:** Sift, Sardine, or Arkose vendor account.
- **manual_review_handoff:** High fraud score → step-up MFA + reviewer.
- **flags_thrown:** Score above threshold → step-up.
- **failure_modes_requiring_review:** New legitimate device; travel; VPN.
- **record_left:** Vendor session ID, score.

### 20. Visiting-scholar / affiliate eduPersonAffiliation gating
- **summary:** When using federated SSO (idea 8), require the eduPersonAffiliation attribute and treat values `affiliate` and `member` as soft flags (route to measure-19 individual-legitimacy review). Only `faculty`, `staff`, `employee` pass without escalation. Catches visiting-researcher branch and partially catches it-persona-manufacturing Sub-path B.
- **attacker_stories_addressed:** visiting-researcher, it-persona-manufacturing (Sub-path B), foreign-institution
- **external_dependencies:** SAML SP that reads eduPersonAffiliation.
- **manual_review_handoff:** Affiliate → measure-19 review.
- **flags_thrown:** affiliate / member-only → review.
- **failure_modes_requiring_review:** Many institutions don't release this attribute.
- **record_left:** SAML attribute set.

### 21. Per-customer institution allowlist / known-domain registry
- **summary:** Maintain a curated provider-side registry of known-good institutional domains (seeded from ROR `links`, EDUCAUSE .edu list, Carnegie Classification list, NIH-funded institution list from NIH RePORTER `api.reporter.nih.gov`, ERC-funded list, plus known accreditor lists like USDE-recognized accrediting bodies). New customer's domain not in registry → escalate. Combine with ROR (idea 1) — this is the cached-allowlist version.
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation
- **external_dependencies:** ROR data dump; EDUCAUSE .edu list (best guess on availability); NIH RePORTER API (free).
- **manual_review_handoff:** Off-allowlist domain → review with the domain + best ROR guess.
- **flags_thrown:** Off-allowlist → review.
- **failure_modes_requiring_review:** International / non-academic / industry blind spots.
- **record_left:** Allowlist version + lookup result.

### 22. Drop-catch / aftermarket auction history check
- **summary:** Query DropCatch / NameJet / GoDaddy Auctions / SnapNames historical sale databases (or DomainTools' "Domain Drop List") to detect that the email's domain was acquired through aftermarket auction. Catches dormant-domain Bypass A and biotech-incubator-tenant 2b explicitly.
- **attacker_stories_addressed:** dormant-domain, cro-identity-rotation, gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** DomainTools auction-history dataset [best guess]; NameBio aftermarket sales DB (`namebio.com`).
- **manual_review_handoff:** Aftermarket sale within 24 months → review.
- **flags_thrown:** Auction sale within 24 months → review.
- **failure_modes_requiring_review:** Vendor coverage gaps for non-headline auctions.
- **record_left:** Sale record.

### 23. Crossref / NIH RePORTER / PubMed defunct-entity flag
- **summary:** When a customer claims affiliation with an institution that has appeared in PubMed/Crossref/NIH RePORTER but whose last grant or last publication is more than N years ago, treat the entity as "defunct" and require the customer to demonstrate continuity (publications in last 24 months, current grant, current registration). Targets the dormant-domain "successor researcher" claim directly.
- **attacker_stories_addressed:** dormant-domain
- **external_dependencies:** NIH RePORTER API (free), Crossref API (free), Europe PMC (free).
- **manual_review_handoff:** Last activity > 5 years → review with continuity request.
- **flags_thrown:** Defunct → review.
- **failure_modes_requiring_review:** Small labs go quiet legitimately.
- **record_left:** Most-recent-publication date, most-recent-grant date.

### 24. Federated authentication step-up at SOC order time
- **summary:** Even for accounts created without federation, when a SOC order is placed, prompt for an eduGAIN/InCommon SAML re-authentication. Catches account-hijack and credential-compromise where the attacker holds a password but cannot satisfy a fresh institution-attested SSO challenge. Also catches gradual-legitimacy-accumulation if the LLC has no IdP.
- **attacker_stories_addressed:** account-hijack, credential-compromise, gradual-legitimacy-accumulation, cro-framing, shell-company
- **external_dependencies:** Same as idea 8.
- **manual_review_handoff:** Step-up failure → block order, contact customer.
- **flags_thrown:** No IdP / step-up failure → block.
- **failure_modes_requiring_review:** Commercial customers have no IdP — measure 14/19 fallback path.
- **record_left:** Fresh SAML assertion.

## Coverage notes vs attacker stories

| Branch | Caught by ideas |
|---|---|
| dormant-domain | 2, 3, 5, 13, 14, 17, 22, 23 |
| cro-identity-rotation | 1, 2, 3, 5, 6, 8, 15, 17, 21, 22, 24 |
| cro-framing | 1, 2, 6, 8, 11, 15, 17, 21, 24 |
| shell-nonprofit | 1, 2, 6, 8, 17, 21 |
| biotech-incubator-tenant | 1, 2, 3, 5, 6, 8, 17, 21, 22 |
| gradual-legitimacy-accumulation | 3, 5, 6, 8, 17, 22, 24 |
| community-bio-lab-network | 1, 2, 6, 8, 21 |
| inbox-compromise | 12, 14, 18, 19 |
| credential-compromise | 12, 19, 24 |
| account-hijack | 12, 19, 24 |
| dormant-account-takeover | 14, 19, 24 (partial); 7 (partial) |
| foreign-institution | 8, 17, 20, 21 |
| it-persona-manufacturing | 14 (weak), 17, 20 |
| visiting-researcher | 17, 20 |
| shell-company | 1, 2, 3, 5, 6, 8, 11, 17, 21, 22, 24 |
| unrelated-dept-student | (no leverage; M02 cannot constrain — only department-attribute federation idea 20 partial) |
| insider-recruitment | (no leverage by design) |
| lab-manager-voucher | (no leverage by design) |
| bulk-order-noise-cover | (no leverage by design) |

The four "no leverage" branches are intrinsic to M02's scope and are intentionally out of reach.
