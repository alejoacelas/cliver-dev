# Stage 2 Feasibility — Measure 02 — v1

Reviewing `01-ideation-measure-02-v1.md`. Two gates: concreteness, relevance.

## Verdicts

### 1. ROR domain cross-reference — PASS
Concrete (ROR public API, named endpoint). Addresses the seven custom-domain attacker branches directly: a freshly-registered LLC `.com` will not appear in ROR. Real signal.

### 2. WHOIS / RDAP domain-age + recent-registrant-change — PASS
Concrete (RDAP, IANA bootstrap, named TLD servers). Directly addresses dormant-domain Bypass A's "recent registrant change" caveat that the branch itself flags as the marginal flag for that branch. Also catches young custom-domain LLC branches.

### 3. WHOIS-history via DomainTools Iris / SecurityTrails — PASS
Concrete (named vendors). Distinct from idea 2 because RDAP only returns current state (or single last-changed event), while DomainTools/SecurityTrails carry full historical registrant timeline. Branch story dormant-domain explicitly cites DomainTools/SecurityTrails as the public archives an attacker assumes will be checked. Keep both 2 and 3 — they are not duplicates (free-RDAP vs paid-history).

### 4. Free-mail / disposable-mail blocklist — PASS
Concrete (named GitHub list). Operationalizes the explicit measure flag trigger ("non-institutional domain (e.g., gmail)"). Even if no listed attacker uses gmail, this is the measure's stated baseline.

### 5. Wayback Machine / archive.org prior-content — PASS
Concrete (Wayback CDX API). Branch cro-identity-rotation explicitly names "Wayback Machine prior content" as the betrayer of clean-content aged-domain purchases. Direct hit.

### 6. MX-record / mail-stack institutionalness check — PASS
Concrete (DoH endpoints). Multiple branches (cro-framing, cro-identity-rotation, shell-nonprofit, shell-company, biotech-incubator-tenant) explicitly use "Google Workspace + custom domain" as the affiliation construct. Detecting Workspace MX on a fresh `.com` is exactly the composite signal those branches expose.

### 7. EDUCAUSE .edu WHOIS — PASS
Concrete (named WHOIS service). Catches the dormant-account-takeover Bypass C scenario weakly (subdomain still resolves to a real parent .edu) and is foundational for any allowlist of US accredited institutions. Slightly weaker than idea 1 for the high-value attacker branches; keep because it's the only direct check on the .edu eligibility regime.

### 8. eduGAIN / InCommon federated login — PASS
Concrete (named federations + metadata endpoints). Attacker branches shell-nonprofit, cro-identity-rotation, cro-framing, dormant-account-takeover all explicitly cite federated authentication as the gate they cannot satisfy. This is the highest-value M02 deepening flagged across multiple stories.

### 9. Inbox-verification round trip — PASS
Concrete (named transactional senders, DMARC). Baseline anti-typo check; weaker against compromise branches (which the idea acknowledges) but still required and concrete.

### 10. Tranco / Majestic Million popularity — REVISE
Concrete (named lists). Relevance is thin: the idea itself admits "many legitimate small entities are sub-1M" and offers only a soft signal. But it does add an independent dimension to the cro-framing / shell-company composite. **Revision needed:** define a precise composite-only role (e.g., only used to weight other flags, never standalone) or drop. Borderline; keep with revision rather than drop.

### 11. GLEIF LEI ↔ domain consistency — REVISE
Concrete (GLEIF API). Relevance is weak: the idea itself admits US small-LLC LEI coverage is low — and *all* US-LLC attacker branches (cro-framing, shell-company, biotech-incubator-tenant) are exactly that population. Revise to state where it would actually fire (e.g., EU CRO branches, foreign-institution variant), or drop.

### 12. Have I Been Pwned breach check — PASS
Concrete (HIBP API). Inbox-compromise branch explicitly names "DeHashed" / breach-dump credential reuse; HIBP is the public-facing analog. Soft signal but directly motivated.

### 13. Dangling-DNS / subdomain takeover scanner — PASS
Concrete (Team Cymru, RIPEstat, can-i-take-over-xyz fingerprint list, named services). Targets dormant-domain Bypass B (Squarcina et al. 2021 subdomain takeover) explicitly. Highest-precision check for that specific bypass.

### 14. Mail-server IP origin vs institutional ASN — PASS
Concrete (Team Cymru, RIPEstat, Microsoft tenant discovery). Catches dormant-domain Bypass A (mail server on commodity VPS) as called out in that branch. Independent enough from idea 6 (MX classification) — that idea looks at MX records, this one looks at actual Received-chain origin IPs, which can diverge.

### 15. M365 tenant discovery + tenant-age — PASS
Concrete (`login.microsoftonline.com/<domain>/.well-known/openid-configuration` and `getuserrealm.srf` are real, public, undocumented-but-known). Independent signal from MX records.

### 16. Google Workspace customer-ID discovery — REVISE
Marked `[best guess]` and the best guess is thin — Google does not publish a tenant-discovery endpoint analogous to Microsoft's. Revision needed: name a real artifact (e.g., `MX = aspmx.l.google.com` + DKIM `_domainkey` selector pattern + the `google-site-verification` TXT record naming pattern) or drop. Functionally redundant with idea 6 if no distinct endpoint exists.

### 17. ORCID + OpenAlex publication-vs-affiliation — PASS
Concrete (named APIs). Directly catches dormant-domain "successor researcher" claim and the cro-* branches' lack of publication trail. High-value cross-check that the branch threats explicitly assume providers do not run.

### 18. Alumni-forwarder domain blocklist — PASS
Concrete (curated list, EDUCAUSE seed). Targets inbox-compromise Method 5 ("alumni-for-life forwarder") which the branch explicitly flags as a load-bearing question.

### 19. Sift / Sardine / Arkose at order time — PASS
Concrete (named vendors). Catches credential-compromise / account-hijack / inbox-compromise patterns by detecting IP/device anomalies. dormant-account-takeover Bypass D explicitly names Sift/Sardine/Arkose as the tools the attacker is routing around — confirming relevance.

### 20. eduPersonAffiliation gating — PASS
Concrete (SAML attribute, named federations). Targets visiting-researcher (which is binding on real .edu mailbox issued via affiliate program) and it-persona-manufacturing Sub-path B. Distinct from idea 8 in policy (gating on attribute value, not just successful SSO).

### 21. Per-customer institution allowlist registry — PASS
Concrete (ROR dump, EDUCAUSE list, NIH RePORTER API). Operationally distinct from idea 1 (cached pre-built registry vs. per-order ROR query) and addresses bulk-order use. Some duplication with idea 1 but the cached/curated layer adds the EDUCAUSE/NIH RePORTER seeds that ROR alone misses.

### 22. Drop-catch / aftermarket auction history — PASS
Concrete (NameBio, DomainTools, named auction houses). Branch biotech-incubator-tenant 2b and dormant-domain Bypass A explicitly name aftermarket auctions; this is the targeted check.

### 23. Crossref / NIH RePORTER defunct-entity flag — PASS
Concrete (named APIs). Direct hit on dormant-domain "successor researcher" framing — the only idea that explicitly probes the defunct-entity dimension that the branch is built on.

### 24. Federated step-up at SOC order time — PASS
Concrete (eduGAIN/InCommon). Catches account-hijack and credential-compromise specifically at the highest-risk moment. Distinct enough from idea 8 (one-time at signup vs. per-SOC-order) to keep separately.

## Gaps

- **Attacker classes with no current idea:**
  - **unrelated-dept-student** — fully native pass, M02 has no leverage. Only partial coverage from idea 20 (department attribute via federation), and only if institutions release department-level eduPersonOrgUnit. Acknowledged as out-of-scope for M02, no new idea required.
  - **insider-recruitment, lab-manager-voucher, bulk-order-noise-cover** — by-design out of scope (real .edu mailbox holder is the on-record customer). No M02 deepening can address these; route to other measures.
  - **dormant-account-takeover Bypass A/B/C (mailbox redirect / account reactivation / new mailbox under real subdomain)** — partial coverage from ideas 7 and 14 only. **Possible new idea:** institutional-side change-detection (DKIM-key change, MX-record change, new mail-flow rule) probed at SOC-order time via DNS history (e.g., SecurityTrails DNS history). Worth surfacing in v2 if the loop continues.
  - **foreign-institution non-Anglophone coverage** — ideas 8, 17, 20, 21 cover it indirectly but ROR/eduGAIN coverage of non-Anglophone institutions is uneven. Not a missing idea per se, but a coverage caveat for stage 6.

- **Duplicates / overlaps to flag:**
  - Ideas 1 vs 21: kept both because per-order vs cached-allowlist serve different operational roles.
  - Ideas 2 vs 3: kept both because RDAP-current vs paid-historical are distinct sources.
  - Ideas 6 vs 15 vs 16: idea 16 is the weakest of the trio and may fold into 6 if it cannot be made distinct.

## Stop signal

Three ideas (10, 11, 16) returned REVISE; uncovered attacker subclass (dormant-account-takeover institutional-side change detection) noted as a possible v2 addition.

STOP: no
