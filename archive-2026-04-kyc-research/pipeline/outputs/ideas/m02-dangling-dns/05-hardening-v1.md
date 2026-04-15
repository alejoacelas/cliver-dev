# m02-dangling-dns — bypass-aware hardening v1

## Attacker stories walked

### 1. dormant-domain

**Summary:** Patient lone operator acquires a lapsed canonical domain of a defunct research entity and presents as a successor researcher.

**Bypass A — Acquire the lapsed canonical domain:**
- **CAUGHT.** This is the primary target of this idea. dnsReaper scans for dangling CNAME/A/NS records pointing to deprovisioned cloud resources. The CT-log first-seen check via crt.sh would detect a gap in certificate issuance (old certs expired years ago, new cert issued recently). The Tranco rank delta would show the domain disappeared from rankings then reappeared. The `drop_catch_recent` and `ct_first_seen_recent` flags would fire. The manual reviewer would then pull WHOIS history and archive.org snapshots, confirming the registrant change and content discontinuity.
- **Caveat (AMBIGUOUS):** If the attacker buys the domain *before* it fully lapses (via backorder/auction at expiry) and the domain never fully drops from DNS, the CT gap may be narrow and Tranco rank may not show a disappearance. The implementation does not specify how small a CT gap triggers the flag.

**Bypass B — Dangling-DNS subdomain takeover on live parent institution:**
- **CAUGHT.** This is exactly what dnsReaper is designed to detect. The scanner checks for CNAME records pointing to unclaimed S3 buckets, Azure endpoints, Heroku apps, etc. The `dangling_dns_target` flag fires. The implementation explicitly names this scenario and routes it to manual review with WHOIS correlation.
- **Caveat (AMBIGUOUS):** dnsReaper relies on signature-based detection. If the attacker claims a cloud resource type not yet in dnsReaper's signature set, the dangling record would not be flagged. The implementation acknowledges "dnsReaper signature lag" as a failure mode but does not specify a fallback scanner.

**Bypass C — Typosquat / lookalike fallback:**
- **MISSED.** The implementation detects dangling DNS and drop-caught domains, but a freshly registered typosquat domain (`lab-genomics.org` vs `labgenomics.org`) would not trigger any of the three signals: no dangling records (it's a new clean domain), no CT gap (first cert is the only cert), and no Tranco rank delta (never ranked before). The `ct_first_seen_recent` flag *might* fire (first cert <90 days old), but the implementation calls this a "soft flag" and the domain is not claiming long history — it's simply a new domain. The typosquat detection requires string-similarity comparison against a known-institution domain list, which this idea does not implement.

**Net assessment:** This check is highly effective against Bypasses A and B, which are the primary and most sophisticated methods. Bypass C (typosquat) slips through but is described as a novice fallback costing $10-$50/year and is likely caught by other M02 ideas that check domain-vs-institution matching.

---

### 2. cro-identity-rotation

**Summary:** Individual files 2-4 small CRO LLCs with custom email domains and rotates across providers.

**Fresh domain + DNS/mail-stack maturity signaling:**
- **MISSED.** A freshly registered `.com` matching an LLC name, with Google Workspace configured, would not trigger dangling-DNS detection (no dangling records on a new domain). Tranco rank would show no history (unranked), which the implementation notes produces "no signal either way." CT first-seen would be recent, but the `ct_first_seen_recent` flag is a soft flag. The domain is not claiming to be an established institution — it's a new small CRO — so the flag provides weak signal.

**Aged-domain purchase:**
- **AMBIGUOUS.** An aged domain purchased from aftermarket would show historical CT certs and possibly Tranco history, so the CT-gap signal depends on whether the domain's certificates lapsed during the parking period. If the domain was continuously parked with auto-renewed certs, no CT gap exists. If certs lapsed, `ct_first_seen_recent` might fire. The implementation does not specify how to handle aged domains with certificate continuity but content discontinuity — archive.org comparison is in the manual review playbook but only triggered if another flag fires first.

**Federated login claim avoidance:**
- Not relevant to this idea (M02 domain check, not federated auth).

**Net assessment:** Weak. The check's signals (dangling DNS, drop-catch, CT gaps) are orthogonal to the CRO-identity-rotation attack, which uses legitimately registered new or aged domains with no dangling records.

---

### 3. cro-framing

**Summary:** Individual registers a real US LLC framed as a small CRO, using a self-owned domain with Google Workspace.

**Self-owned domain workspace:**
- **MISSED.** Same analysis as cro-identity-rotation fresh domain. No dangling DNS records, no drop-catch signal, domain is genuinely new and makes no claim of age. `ct_first_seen_recent` is a soft flag only. This idea has no leverage on a freshly registered legitimate domain.

**Net assessment:** No leverage. The check is designed for domain takeover and repurposing, not for newly-registered self-owned domains.

---

### 4. shell-nonprofit

**Summary:** Shell research nonprofit with real domain, deliberately pre-aged 4-12 weeks.

**Stand up the shell's own domain and mailbox:**
- **MISSED.** New domain registered by the attacker. No dangling DNS. No drop-catch. CT first-seen is recent (4-12 weeks), which might trigger `ct_first_seen_recent` (<90 days). However, this is a soft flag and many legitimate small organizations would also trigger it.

**ROR self-listing:**
- Not relevant to this idea.

**Net assessment:** Marginal. The `ct_first_seen_recent` soft flag might fire, but the shell is designed to be 4-12 weeks old — right at the boundary of the <90-day threshold. Weak signal.

---

### 5. biotech-incubator-tenant

**Summary:** LLC with bench space at a biotech incubator, self-controlled domain.

**2a — Self-controlled domain + Google Workspace:**
- **MISSED.** New legitimate domain, no dangling DNS, no drop-catch signal. Same analysis as cro-framing.

**2b — Domain age padding:**
- **AMBIGUOUS.** Same analysis as cro-identity-rotation aged-domain purchase. Depends on whether the aged domain had a certificate gap during parking.

**Net assessment:** No meaningful leverage.

---

### 6. gradual-legitimacy-accumulation

**Summary:** Patient individual spends 6-12 months operating a real-but-hollow small biotech before ordering.

**Self-owned domain (baseline):**
- **MISSED.** Domain registered at month 0 is 6-12 months old by the time of order. CT first-seen is well beyond 90 days. No dangling DNS. No drop-catch. All signals clean.

**Time-aged domain and clean order history:**
- **MISSED.** By design the domain is aged 12+ months. No signal fires.

**Aged domain auction purchase (compression):**
- **AMBIGUOUS.** Same as other aged-domain scenarios. Depends on certificate gap during parking.

**Net assessment:** No leverage. The whole branch is designed to defeat time-based signals, and 6-12 months of organic aging cleanly passes all thresholds in this implementation.

---

### 7. community-bio-lab-network

**Summary:** Registers 2-3 community biology lab LLCs with `.org` domains.

**Self-owned community lab domain:**
- **MISSED.** Freshly registered `.org` domain. No dangling DNS. No drop-catch. `ct_first_seen_recent` might fire as a soft flag, but a new community lab is plausibly new.

**Net assessment:** No leverage.

---

### 8. inbox-compromise

**Summary:** Attacker compromises a dormant email account at a small US college.

**Methods 1-6 (breach-dump, phishing, password-reset, helpdesk SE, alumni forwarder, visiting/affiliate account):**
- **MISSED (all 6 methods).** The attacker uses a genuine institutional mailbox on a real `.edu` domain. The institution's domain has no dangling DNS (it's a live university), no drop-catch (continuously owned), and long CT/Tranco history. This idea checks the *domain*, not who controls the inbox. All signals return clean.

**Net assessment:** Zero leverage. The domain is a real, live university domain. This idea cannot detect inbox compromise.

---

### 9. credential-compromise

**Summary:** Attacker compromises a real PI's `.edu` email via infostealer/breach/AitM.

**Compromised `.edu` email:**
- **MISSED.** Same as inbox-compromise. The domain is a genuine university domain. All DNS/CT/Tranco signals are clean.

**Net assessment:** Zero leverage.

---

### 10. account-hijack

**Summary:** Attacker compromises a PI's email and takes over their existing provider account.

**Inherited `.edu` email:**
- **MISSED.** Domain is genuine. No signal fires.

**Net assessment:** Zero leverage.

---

### 11. dormant-account-takeover

**Summary:** IT admin takes over a departed researcher's dormant provider account.

**Bypasses A-E (mailbox redirect, reactivate account, new mailbox, VPN routing, IdP impersonation):**
- **MISSED (all 5 methods).** All bypasses operate on a genuine institutional domain. The attacker controls the institution's mail infrastructure directly. No DNS anomaly, no drop-catch, no CT gap. Bypass C (new mailbox under `labname.university.edu`) might theoretically trigger a CT check if a new subdomain cert is issued, but the implementation only checks the primary affiliation domain, not arbitrary subdomains — and subdomain enumeration is acknowledged as incomplete.

**Net assessment:** Zero leverage.

---

### 12. foreign-institution

**Summary:** Attacker exploits verification gaps at non-Anglophone institutions.

**Methods 1-6 (stale subdomain compromise, visiting-researcher account, alumni residue, AitM phishing, co-opt collaboration, short visiting appointment):**
- **Method 1 (stale subdomain inbox compromise): AMBIGUOUS.** If the stale subdomain has a dangling CNAME (e.g., old cloud resource), dnsReaper *could* detect it. But the attacker's goal is inbox compromise via breached credentials, not subdomain takeover — the subdomain's DNS likely still points to the institution's mail server, not a deprovisioned cloud resource. So dnsReaper would not flag it in the typical case.
- **Methods 2-6: MISSED.** All use genuine institutional domains with clean DNS.

**Net assessment:** Negligible leverage. Method 1 might theoretically intersect if the stale subdomain also happens to have a dangling DNS record, but this is not the typical attack path.

---

### 13. it-persona-manufacturing

**Summary:** IT admin manufactures a persona on a real institutional domain.

**Sub-paths A-D:**
- **MISSED (all 4).** The attacker creates mailboxes and directory entries on a genuine institutional domain using legitimate admin tools. Domain DNS is clean. No signal fires.

**Net assessment:** Zero leverage.

---

### 14. visiting-researcher

**Summary:** Attacker obtains a real visiting-scholar appointment and genuine `.edu` email.

**No bypass needed:**
- **MISSED.** The attacker holds a genuine `.edu` email on a real university domain. All domain-level signals are clean.

**Net assessment:** Zero leverage.

---

### 15. shell-company

**Summary:** Shell company registered in Delaware with self-owned domain email.

**Self-owned domain (by construction):**
- **MISSED.** New or aged domain purchased by the attacker. No dangling DNS. No drop-catch unless the domain was previously owned and lapsed.

**Aged domain ($100-$2,000):**
- **AMBIGUOUS.** Same as other aged-domain scenarios.

**Net assessment:** Minimal leverage. Only the aged-domain variant might produce a weak signal.

---

### 16. unrelated-dept-student

**Summary:** Enrolled student uses their genuine `.edu` email.

**Bypasses A-D (canonical email, lab alias, federated login, transliteration collision):**
- **MISSED (all 4).** Genuine institutional domain. All signals clean.

**Net assessment:** Zero leverage.

---

### 17. insider-recruitment

**Summary:** Legitimate insider places orders on handler's behalf using own real `.edu` email.

**No bypass needed:**
- **MISSED.** Genuine institutional email on a real domain. All signals clean.

**Net assessment:** Zero leverage.

---

### 18. lab-manager-voucher

**Summary:** Insider with legitimate ordering role uses real institutional email.

**No bypass needed:**
- **MISSED.** Genuine institutional domain. All signals clean.

**Net assessment:** Zero leverage.

---

### 19. bulk-order-noise-cover

**Summary:** Core facility technician exploits institutional ordering infrastructure.

**No bypass needed:**
- **MISSED.** Genuine institutional domain. All signals clean.

**Net assessment:** Zero leverage.

---

## Findings

### Critical

None. This idea is designed to catch domain-takeover and drop-catch attacks (dormant-domain Bypasses A and B), and it does so effectively. It is *not* designed to catch attackers who use self-owned new domains or compromise real institutional inboxes — those are addressed by other M02 ideas (RDAP age check, allowlist/institution cross-check, etc.).

### Moderate

**M1. Typosquat domains slip through (dormant-domain Bypass C).**
- The implementation detects dangling DNS and drop-catch but not typosquat/lookalike domains. A `lab-genomics.org` vs `labgenomics.org` typosquat would produce no dangling-DNS finding, no CT gap, and no Tranco delta.
- Suggestion: Add a string-similarity check (Levenshtein, homoglyph detection) against a known-institution domain list. However, this may be better placed in a separate M02 idea focused on domain-vs-institution matching rather than added to this DNS-focused check.

**M2. Aged-domain purchases with certificate continuity are invisible (cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, shell-company).**
- If an attacker buys an aged domain that maintained certificate renewals during parking, no CT gap exists and the drop-catch heuristic does not fire. The archive.org content-comparison step only happens if another flag fires first.
- Suggestion: Consider adding a WHOIS registrant-change signal (not just registration age) as a primary trigger, independent of CT/Tranco signals. This may overlap with m02-rdap-age; stage 8 synthesis should assess whether the two ideas are complementary on this dimension.

### Minor

**m1. dnsReaper signature coverage gap (dormant-domain Bypass B).**
- New cloud services not yet in dnsReaper's signature set would be missed. The implementation acknowledges this but does not name a fallback. Running multiple scanners (subjack, Nuclei templates) in parallel would reduce the gap.

**m2. Subdomain enumeration incompleteness.**
- The implementation acknowledges reliance on CT logs for subdomain discovery, which misses subdomains that never had certificates issued. Internal DNS zone data (if obtainable) would improve coverage but is not available to an external screener.

**m3. Tranco ranking threshold for small institutions.**
- Small institutional domains are typically outside the top 1M and thus unranked. The implementation correctly notes this produces "no signal either way," but it means the Tranco-delta signal is structurally absent for exactly the institutions that dormant-domain and community-bio-lab branches target.

## bypass_methods_known

| Story | Bypass | Classification |
|---|---|---|
| dormant-domain | Bypass A — acquire lapsed canonical domain | CAUGHT |
| dormant-domain | Bypass B — dangling-DNS subdomain takeover | CAUGHT |
| dormant-domain | Bypass C — typosquat/lookalike | MISSED |
| cro-identity-rotation | Fresh domain + DNS/mail-stack maturity | MISSED |
| cro-identity-rotation | Aged-domain purchase | AMBIGUOUS |
| cro-framing | Self-owned domain workspace | MISSED |
| shell-nonprofit | Stand up shell's own domain and mailbox | MISSED |
| biotech-incubator-tenant | Self-controlled domain + Google Workspace | MISSED |
| biotech-incubator-tenant | Domain age padding | AMBIGUOUS |
| gradual-legitimacy-accumulation | Self-owned domain (baseline) | MISSED |
| gradual-legitimacy-accumulation | Time-aged domain | MISSED |
| gradual-legitimacy-accumulation | Aged domain auction purchase | AMBIGUOUS |
| community-bio-lab-network | Self-owned community lab domain | MISSED |
| inbox-compromise | Methods 1-6 (credential reuse, phishing, etc.) | MISSED |
| credential-compromise | Compromised `.edu` email | MISSED |
| account-hijack | Inherited `.edu` email | MISSED |
| dormant-account-takeover | Bypasses A-E | MISSED |
| foreign-institution | Method 1 (stale subdomain) | AMBIGUOUS |
| foreign-institution | Methods 2-6 | MISSED |
| it-persona-manufacturing | Sub-paths A-D | MISSED |
| visiting-researcher | No bypass needed | MISSED |
| shell-company | Self-owned domain | MISSED |
| shell-company | Aged domain | AMBIGUOUS |
| unrelated-dept-student | Bypasses A-D | MISSED |
| insider-recruitment | No bypass needed | MISSED |
| lab-manager-voucher | No bypass needed | MISSED |
| bulk-order-noise-cover | No bypass needed | MISSED |

## bypass_methods_uncovered

- dormant-domain Bypass C (typosquat/lookalike)
- cro-identity-rotation: fresh domain + DNS/mail-stack maturity
- cro-framing: self-owned domain workspace
- shell-nonprofit: stand up shell's own domain and mailbox
- biotech-incubator-tenant: self-controlled domain + Google Workspace
- gradual-legitimacy-accumulation: self-owned domain (baseline + time-aged)
- community-bio-lab-network: self-owned community lab domain
- inbox-compromise: all 6 methods
- credential-compromise: compromised `.edu` email
- account-hijack: inherited `.edu` email
- dormant-account-takeover: all 5 bypasses
- foreign-institution: methods 2-6
- it-persona-manufacturing: all 4 sub-paths
- visiting-researcher: no bypass needed (structurally passes)
- shell-company: self-owned domain
- unrelated-dept-student: all 4 bypasses
- insider-recruitment: no bypass needed (structurally passes)
- lab-manager-voucher: no bypass needed (structurally passes)
- bulk-order-noise-cover: no bypass needed (structurally passes)

## Verdict

**PASS** — No Critical findings. The idea is narrowly scoped to detect domain-takeover and drop-catch scenarios, and it is effective at its designed target (dormant-domain Bypasses A and B). The large number of MISSED bypasses reflects scope, not failure: self-owned domains and institutional-inbox compromises are addressed by other M02 ideas. The two Moderate findings are refinements, not structural gaps. Pipeline continues to stage 6.
