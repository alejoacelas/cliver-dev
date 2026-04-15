# Stage 1 Ideation — Measure 02 — v2

v2 applies the v1 feasibility verdicts. Ideas 1–9, 12–15, 17–24 are PASS and copied forward unchanged (see v1 for full text; only deltas reproduced here). Ideas 10, 11, 16 are revised. One new idea (25) added to address the dormant-account-takeover institutional-side gap surfaced by feasibility v1.

## Carried forward unchanged (PASS in v1)

1. ROR domain cross-reference
2. WHOIS / RDAP domain-age + recent-registrant-change
3. WHOIS-history via DomainTools Iris / SecurityTrails
4. Free-mail / disposable-mail blocklist
5. Wayback Machine prior-content
6. MX-record / mail-stack institutionalness
7. EDUCAUSE .edu WHOIS
8. eduGAIN / InCommon federated login
9. Inbox-verification round trip
12. Have I Been Pwned breach check
13. Dangling-DNS / subdomain takeover scanner
14. Mail-server IP origin vs institutional ASN
15. M365 tenant discovery + tenant-age
17. ORCID + OpenAlex publication-vs-affiliation
18. Alumni-forwarder domain blocklist
19. Sift / Sardine / Arkose at order time
20. eduPersonAffiliation gating
21. Per-customer institution allowlist registry
22. Drop-catch / aftermarket auction history
23. Crossref / NIH RePORTER defunct-entity
24. Federated step-up at SOC order time

(Full text per v1; not duplicated here.)

## Revised

### 10. Tranco / Majestic Million domain popularity — composite-only role
- **summary:** Use Tranco (`tranco-list.eu`) and Majestic Million (`majestic.com/reports/majestic-million`) **strictly as a multiplier on other flags, never standalone**. Specifically: when ideas 2 (RDAP age <24mo) OR 6 (Workspace MX on .com) already fired, AND the domain is absent from Tranco top-1M, escalate the composite from soft to firm. Rank ≤ 100k → null the composite (real institution). Rank > 1M or absent → keep flag firm. Single-flag-only rank lookups are not used.
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, community-bio-lab-network (composite role only)
- **external_dependencies:** Tranco CSV; Majestic Million CSV (free).
- **manual_review_handoff:** None standalone — only inputs to the reviewer's view of an already-flagged composite.
- **flags_thrown:** Used as a multiplier inside other ideas' playbooks; not a standalone trigger.
- **failure_modes_requiring_review:** Stale lists; rank instability for sub-100k domains.
- **record_left:** Rank lookup snapshot attached to the composite-flag record.

### 11. GLEIF LEI ↔ domain consistency — restricted to non-US-LLC commercial customers
- **summary:** Restrict GLEIF (`api.gleif.org/api/v1/lei-records`) cross-check to commercial customers in jurisdictions with high LEI coverage: EU/EEA entities (where LEIs are required for many regulated activities under MiFID II), UK, Singapore, Switzerland. For these customers, an absent or website-mismatched LEI is a meaningful signal. US small-LLC customers (where LEI coverage is low) skip this check, falling back to ideas 1, 6, 21. This makes the idea relevant to the **foreign-institution** branch's commercial variant and to any cro-* attacker who registers their entity in an EU jurisdiction for legitimacy theatre — without burning false positives on US Delaware LLCs.
- **attacker_stories_addressed:** foreign-institution (commercial variant), cro-identity-rotation (if EU-jurisdiction variant), shell-company (if EU-jurisdiction variant)
- **external_dependencies:** GLEIF API (free).
- **manual_review_handoff:** EU-claimed entity, no LEI / mismatched website on LEI → reviewer requests LEI registration evidence or denies.
- **flags_thrown:** EU-jurisdiction commercial customer + no LEI → review; LEI website ≠ email domain → review.
- **failure_modes_requiring_review:** Genuine micro-EU-entities still skip LEI registration; jurisdiction misclassification.
- **record_left:** GLEIF query result + jurisdiction classification.

### 16. Google Workspace MX + verification-TXT fingerprint — concrete artifacts
- **summary:** Replace the v1 best-guess "customer-ID discovery" with a concrete fingerprint pattern: (a) MX records ending in `.aspmx.l.google.com` / `.googlemail.com`; (b) presence of a `google-site-verification=...` TXT record on the apex (left when the Workspace tenant was provisioned); (c) DKIM `google._domainkey.<domain>` selector; (d) optional SPF `include:_spf.google.com`. Together these confirm Google Workspace tenancy. Then look up the apex domain's earliest Wayback snapshot (idea 5) to estimate Workspace tenancy age (the verification-TXT record cannot be older than the domain's first Workspace setup). [best guess: there is no public per-tenant ID lookup analogous to Microsoft's `getuserrealm.srf` for Google Workspace; this fingerprint pattern is the public-side substitute.]
- **attacker_stories_addressed:** cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation
- **external_dependencies:** DoH resolver.
- **manual_review_handoff:** Workspace fingerprint on a domain age <24 months → composite flag, route to reviewer.
- **flags_thrown:** Workspace + young domain → composite (with idea 6); Workspace + Tranco-absent (idea 10) + age <24mo → firm flag.
- **failure_modes_requiring_review:** Many legitimate small biotechs use Workspace; signal must always be combined.
- **record_left:** TXT/MX/DKIM record values.

## New idea (gap from v1 feasibility)

### 25. Institutional-side DNS / DKIM / mail-flow change detection
- **summary:** For returning customers using a previously-verified institutional address, monitor that institution's domain over time via SecurityTrails DNS-history API (`/v1/history/<domain>/dns/{a,mx,txt}`) and DNSDB (Farsight / DomainTools). If, between order N-1 and order N, there is a new MX record, a new DKIM selector, or a new mail-flow-related TXT change on the institutional domain that the legitimate IT department has not announced — escalate the order. Targets `dormant-account-takeover` Bypasses A (silent forwarding rule), B (account reactivation), and especially C (new mailbox under a real .edu subdomain — would surface as new MX or CNAME on a previously-quiet subdomain). Also detects subtle dangling-DNS reclaim events between orders.
- **attacker_stories_addressed:** dormant-account-takeover (Bypass A, B, C), dormant-domain (Bypass B), it-persona-manufacturing (HR-injection variant — would not detect the directory entry but would detect any new mail provisioning if the persona's mailbox is on a fresh subdomain)
- **external_dependencies:** SecurityTrails DNS history API (paid); Farsight DNSDB / DomainTools Iris (paid). Optionally, the provider can self-host passive-DNS via subscribing to DNSDB Scout.
- **manual_review_handoff:** New-MX or new-DKIM-selector event between order N-1 and N → reviewer asks the institutional IT contact (out-of-band, via a previously-verified channel) whether the change is legitimate.
- **flags_thrown:** New MX on subdomain → review; new DKIM selector with no announced rotation → review; new TXT mail-flow rule → review.
- **failure_modes_requiring_review:** Legitimate institutional IT changes (DKIM rotation, M365→Google migration); cost of out-of-band IT contact; latency of passive-DNS observation.
- **record_left:** Diff of DNS history snapshots; out-of-band IT response.

## Coverage update

| Branch | Caught by v2 ideas |
|---|---|
| dormant-account-takeover | 7, 14, 19, 24, **25** |
| it-persona-manufacturing | 14, 17, 20, **25 (partial)** |
| (others unchanged from v1 table) | |

## Dropped

(none — no DROP verdicts in v1)
