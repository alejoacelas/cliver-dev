# Measure 02 — Email & WHOIS provenance: Per-measure synthesis

## 1. Side-by-side comparison table

| Field | m02-ror-domain-match | m02-rdap-age | m02-disposable-blocklist | m02-wayback | m02-mx-tenant | m02-inbox-roundtrip | m02-dangling-dns |
|---|---|---|---|---|---|---|---|
| **Name** | ROR institutional domain match | RDAP/WHOIS domain age + registrant | Disposable / free-mail blocklist | Wayback first-seen + content history | MX/M365/Workspace tenant + SPF/DMARC | Inbox round-trip verification | Dangling-DNS / drop-catch detector |
| **Data source** | ROR v2 API (CC0, free) | RDAP bootstrap (free, public) + WHOIS fallback | GitHub disposable-domain lists (MIT) + Kickbox open API | Internet Archive CDX API (free) + LLM classifier | DNS MX/SPF/DMARC + Microsoft GetUserRealm | Internal mailer (SES/Postmark) + JWT tokens | dnsReaper + crt.sh CT logs + Tranco top-1M |
| **Marginal cost** | $0 | $0 | $0 | ~$0.001 (LLM call) | $0 | <$0.001 | $0 |
| **Manual review burden** | Multi-domain institutions (~10-20% of R1s) and personal-email researchers (~5-15%) generate FPs | New biotech startups with <12mo domains (~5-10% of commercial customers); GDPR-redacted registrant is ~89% uninformative | Free-mail soft flags on independent/developing-country researchers (10-20% of customer base) | Legitimate rebrands (~2-5%/year) trigger high-priority content-pivot flag; robots.txt-excluded sites (~5-10%) generate false no-history | ~50% of .edu domains at DMARC p=none; self-hosted academic mail (15-25% non-US) generates FPs | Corporate URL scanners (40-60% of institutional customers) auto-click verification links, triggering false bot alerts | University DNS hygiene empirically poor; major R1s routinely have exploitable dangling DNS creating high FP base rate |
| **Attacker stories addressed** | 2 CAUGHT (lookalike-domain, shell-nonprofit domain mismatch); 11 MISSED (genuine institutional email) | 6-7 CAUGHT temporarily (fresh-domain variants); 11 MISSED (genuine institutional email) | 0 of 19 (targets sub-modeled threat tier) | 3-5 CAUGHT (dormant-domain variants, typosquat, shell-nonprofit); 11 MISSED (genuine email) | 2-3 CAUGHT (lookalike-domain, dormant-domain self-hosted); 11 MISSED (genuine email) | 0 of 19 (all attackers control inbox by construction) | 2 CAUGHT (dormant-domain Bypasses A+B); 11+ MISSED |
| **Headline coverage gap** | ~46% commercial segment not in ROR; `domains[]` field 98% empty; ~40-50% of plausible buyers not covered | Patient attackers who age domains >12mo; GDPR redaction renders registrant dimension dead | Custom domains ($10/year) bypass entirely; targets threat tier below modeled corpus | Patient pre-staging (12mo consistent content) defeats check; SPAs (~20-30%) degrade classifier | Self-owned Workspace/M365 on fresh domain indistinguishable from legitimate small biotech (~30-50% commercial) | Structural: confirms inbox control, which every modeled attacker has | Small institutions outside Tranco top-1M (~30-50%); new-domain attackers produce no signal |
| **Headline uncovered bypass** | Genuine institutional email (11 stories); purpose-built orgs with `ror_no_record` suppressed (6 stories) | Aged-domain purchase; organic aging >12mo; all genuine-institutional-email (11 stories) | All 19 stories (structural; not designed for this tier) | Content-congruent aged-domain; gradual-legitimacy-accumulation; all genuine email (11 stories) | All self-owned commercial domain + Workspace/M365 (10 stories); all genuine email (11 stories) | All 19 stories (structural limitation of inbox-control verification) | Typosquats; all new-domain attacks; all genuine email (11 stories) |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Three customer/attacker categories appear in every M02 idea's coverage-gap list:

1. **Genuine-institutional-email attackers (11 stories).** Inbox-compromise, credential-compromise, account-hijack, dormant-account-takeover, foreign-institution, it-persona-manufacturing, visiting-researcher, unrelated-dept-student, insider-recruitment, lab-manager-voucher, and bulk-order-noise-cover all operate from real institutional domains with real inbox control. No M02 idea can detect these because the email signal is authentically correct — the attacker *is* affiliated with the domain (either legitimately or via compromise that is invisible at the DNS/WHOIS/ROR layer). This is a structural limitation of the entire measure: **email provenance verification cannot distinguish authorized from unauthorized users of an institutional mailbox.**

2. **Patient purpose-built organizations (gradual-legitimacy-accumulation).** This branch explicitly constructs 12 months of consistent domain history, proper DNS/mail infrastructure, and organic web presence to defeat every time-based and history-based M02 check. No single M02 idea catches it after the aging period; only cross-measure signals (m09 corporate registry, m14 IDV, m18/m19 legitimacy) can address it.

3. **Free-mail / personal-email customers.** An estimated 5-15% of academic customers and a larger share in developing countries use personal email professionally. Every M02 idea either produces no signal (RDAP, Wayback, dangling-DNS, MX-tenant — inapplicable to gmail.com) or produces a false positive (ROR domain mismatch, disposable blocklist free-mail flag). This is a coverage gap for legitimate customers, not an attacker bypass, but it creates systematic friction for an economically meaningful segment.

### Complementary gaps

| Gap | Ideas that leave it open | Ideas that close it |
|---|---|---|
| Typosquat / lookalike domains | m02-disposable-blocklist, m02-inbox-roundtrip, m02-dangling-dns (does not detect) | m02-ror-domain-match, m02-rdap-age (<12mo flag), m02-wayback (no history), m02-mx-tenant (brand mismatch) |
| Dormant-domain drop-catch (Bypass A) | m02-ror-domain-match (stale record risk), m02-disposable-blocklist, m02-inbox-roundtrip | m02-rdap-age (recent transfer), m02-wayback (dormancy gap + content pivot), m02-dangling-dns (CT gap + Tranco delta) |
| Dangling-DNS subdomain takeover (Bypass B) | m02-ror-domain-match (apex matches), m02-rdap-age (apex-level only), m02-wayback (depends on prior captures), m02-disposable-blocklist, m02-inbox-roundtrip, m02-mx-tenant | m02-dangling-dns (dnsReaper signature match) |
| Fresh-domain purpose-built orgs (<12mo) | m02-ror-domain-match (`ror_no_record` suppressed), m02-disposable-blocklist, m02-inbox-roundtrip | m02-rdap-age (domain_age_lt_12mo), m02-wayback (no/sparse history), m02-mx-tenant (weak — passes Workspace setups) |
| Commercial customers not in ROR (~46%) | m02-ror-domain-match (no signal by design) | m02-mx-tenant (MX classification), m02-rdap-age (domain age), m02-wayback (content history) |
| Non-US academic institutions with poor ROR coverage | m02-ror-domain-match (thin coverage in Africa, SE Asia, Latin America) | m02-mx-tenant, m02-rdap-age, m02-wayback (domain-agnostic checks) |

### Net coverage estimate

If a provider implemented all seven M02 ideas:

- **Most** legitimate customers (academic at ROR-listed institutions with established domains) would pass quickly via ROR domain match + inbox round-trip, with RDAP/Wayback/MX providing corroborating positive signal.
- **Some** legitimate customers (new startups, developing-country researchers, multi-domain institutions) would be flagged and require manual resolution — estimated 15-25% of all orders would trigger at least one M02 flag requiring review.
- Against the modeled threat set: the seven ideas collectively address **the domain-infrastructure-based attack stories** (dormant-domain all bypasses, lookalike-domain, and impose 12-month lead-time costs on all fresh-domain purpose-built orgs). They have **zero collective leverage** on the 11 genuine-institutional-email stories, which constitute the majority of modeled threats.

## 3. Bypass cross-cut

### Universally uncovered bypasses

The following bypass patterns slip through **every** M02 idea:

1. **Genuine institutional email from compromised accounts** (inbox-compromise Methods 1-6, credential-compromise, account-hijack, dormant-account-takeover Bypasses A-E). The attacker controls a real institutional inbox; every M02 check returns a clean result because the email infrastructure is authentic.

2. **Genuine institutional email from legitimate-but-misaligned affiliates** (visiting-researcher, unrelated-dept-student, insider-recruitment, lab-manager-voucher, bulk-order-noise-cover, it-persona-manufacturing, foreign-institution Methods 2-6). The attacker holds a real institutional email issued through the institution's own processes. M02 has no leverage because the affiliation is real; only scope/role verification (m19) or IDV (m14) can address intent.

3. **Patient domain aging beyond 12 months with consistent content** (gradual-legitimacy-accumulation Method 1). After 12 months of organic aging, clean orders, and consistent website content, every time-based and history-based M02 signal is defeated.

### Bypass methods caught by at least one idea

| Bypass | Catching idea(s) | Missing idea(s) |
|---|---|---|
| Drop-catch domain reanimation (dormant-domain Bypass A) | m02-rdap-age (recent transfer), m02-wayback (dormancy gap + content pivot), m02-dangling-dns (CT gap + Tranco delta) | m02-ror-domain-match (stale record), m02-disposable-blocklist, m02-inbox-roundtrip, m02-mx-tenant (ambiguous) |
| Dangling-DNS subdomain takeover (dormant-domain Bypass B) | m02-dangling-dns (dnsReaper signature match) | All other 6 ideas |
| Typosquat/lookalike domain (dormant-domain Bypass C) | m02-ror-domain-match (domain mismatch), m02-rdap-age (<12mo), m02-wayback (no history), m02-mx-tenant (brand mismatch) | m02-dangling-dns, m02-disposable-blocklist, m02-inbox-roundtrip |
| Fresh self-owned domain on purpose-built orgs | m02-rdap-age (domain_age_lt_12mo), m02-wayback (sparse/no history) | m02-ror-domain-match (suppressed), m02-mx-tenant (passes Workspace), m02-disposable-blocklist, m02-inbox-roundtrip, m02-dangling-dns |
| Shell-nonprofit name-collision domain | m02-ror-domain-match (domain mismatch vs. real institution) | Most other ideas (domain is technically clean) |
| Aged-domain purchase with incongruent prior content | m02-wayback (content pivot detection) | m02-rdap-age (passes if >365d since transfer), others |

### Attacker stories where every idea fails

All 11 genuine-institutional-email stories:
- `inbox-compromise`, `credential-compromise`, `account-hijack`, `dormant-account-takeover`, `foreign-institution`, `it-persona-manufacturing`, `visiting-researcher`, `unrelated-dept-student`, `insider-recruitment`, `lab-manager-voucher`, `bulk-order-noise-cover`

Plus after patience window:
- `gradual-legitimacy-accumulation` (after 12+ months of domain aging with consistent content)

**Total: 12 of 19 stories defeat all M02 ideas.** This is structural: email provenance cannot verify intent, only infrastructure.

## 4. Bundling recommendations

### Recommended core bundle: m02-rdap-age + m02-wayback + m02-ror-domain-match + m02-inbox-roundtrip

This four-idea bundle provides the strongest combined coverage at near-zero cost:

- **m02-rdap-age + m02-wayback** are the strongest pairing in the measure. RDAP transfer date plus Wayback dormancy gap and content pivot creates a high-confidence dormant-domain detection signal that neither provides alone. RDAP catches fresh domains and recent transfers; Wayback catches content discontinuity on aged domains. Together they address dormant-domain Bypasses A and C, impose 12-month lead-time costs on all fresh-domain purpose-built orgs, and catch incongruent aged-domain purchases.

- **m02-ror-domain-match** adds the academic fast-pass: ~30-40% of academic customers get instant positive confirmation, reducing manual review volume. It also catches typosquats and shell-nonprofit domain mismatches against known institutions.

- **m02-inbox-roundtrip** is a necessary baseline (confirms inbox control, creates audit artifact) even though it catches zero modeled attackers. Every other M02 check assumes the email is deliverable; round-trip verification confirms this and produces a timestamp for the audit trail.

**Combined cost:** $0 marginal (plus ~$0.001 for Wayback LLM classifier). **Setup:** ~4-5 engineer-days total.

### Recommended add-ons

- **m02-dangling-dns** should be added if the provider has material exposure to the subdomain-takeover attack vector. It is the only idea that catches dormant-domain Bypass B (dangling-DNS subdomain takeover), which no other M02 idea addresses. However, the high false-positive rate from poor university DNS hygiene means the reviewer queue will require calibration. **Cost: 1-2 engineer-weeks setup.**

- **m02-mx-tenant** provides corroborating signal (catches self-hosted dormant-domain variants, helps identify MX provider category) but has significant false-positive issues (50% of .edu at DMARC p=none, 15-25% non-US self-hosted academic mail). Best used as a contributing factor in a multi-signal score rather than an independent flag. **Cost: 1-2 engineer-days setup.**

- **m02-disposable-blocklist** is a zero-cost, zero-effort first-line filter for the lowest-effort signups. While it addresses no modeled attacker stories, it blocks a threat tier below the modeled corpus at effectively zero operational cost for the disposable hard-reject path. The free-mail soft flag requires careful policy design to avoid disadvantaging developing-country researchers. **Cost: ~1 engineer-day setup.**

### What no bundle can fix

No combination of M02 ideas addresses the 11 genuine-institutional-email attacker stories or the patient gradual-legitimacy-accumulation story after its 12-month aging window. **12 of 19 modeled stories defeat every M02 idea.** This is not an implementation gap — it is a structural limitation of email provenance as a verification signal. Detecting these stories requires:
- **m14** (identity evidence / IDV) to verify the person behind the inbox
- **m16** (MFA / step-up) to prevent credential-based account takeover
- **m19** (individual researcher legitimacy) to verify role/scope alignment
- **m09** (institution real life-sciences operator) to detect purpose-built shell organizations after the aging period

M02's role in a layered system is to eliminate the easy domain-infrastructure attacks cheaply, create positive signals that accelerate processing for straightforward cases, and generate audit artifacts — not to catch sophisticated adversaries operating from real institutional email.
