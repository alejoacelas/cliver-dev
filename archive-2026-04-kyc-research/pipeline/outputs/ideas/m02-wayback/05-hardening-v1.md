# m02-wayback — bypass-aware hardening v1

- **measure:** M02 — email-affiliation-whois
- **idea:** Wayback first-seen + content history
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker-story walk

### dormant-domain

**Summary:** Patient operator acquires lapsed canonical domain of a defunct research entity.

**Bypass A — Acquire the lapsed canonical domain:**
- **CAUGHT.** This is the implementation's primary designed-for scenario. The domain will show a long Wayback history, then a `gap_max_days > 365` dormancy period, then recent captures with new content. The `dormancy_gap` flag fires. Additionally, if the attacker's "we're back" website has different content from the last pre-lapse snapshot, `recent_content_pivot` fires. The attacker story explicitly notes: "A WHOIS-history check flagging recent registrant changes on old domains would surface this bypass" — this check provides the complementary content-level signal.

**Bypass B — Dangling-DNS subdomain takeover:**
- **AMBIGUOUS.** The Wayback CDX query is against the email domain. If the email is `attacker@sub.harvard.edu`, the query is for `sub.harvard.edu`. Large university subdomains may have Wayback history from before the takeover. If the subdomain previously had content (e.g., a lab page) that went offline and the attacker now serves new content, `recent_content_pivot` could fire. But if the subdomain was a cloud service endpoint with no prior Wayback capture, `no_wayback_history` returns — which is treated as a soft signal combined with RDAP, not auto-flagged. Classification: **AMBIGUOUS** — depends on whether the subdomain had prior Wayback captures.

**Bypass C — Typosquat / lookalike:**
- **CAUGHT.** A freshly registered lookalike domain has `no_wayback_history`. Combined with RDAP age from m02-rdap-age, this is a clear signal.

**Net assessment:** Strong value against the primary dormant-domain scenario. Ambiguous on subdomain takeovers. Catches typosquats in combination with RDAP.

---

### cro-identity-rotation

**Summary:** 2–4 small CRO LLCs with custom domains.

**Fresh domain + Workspace:**
- **CAUGHT** (partially). A same-day-registered domain has `no_wayback_history`. However, this is not auto-flagged per SOP — it's combined with RDAP age. For a fresh domain, this combination works.

**Aged-domain purchase:**
- **AMBIGUOUS.** An aged domain purchased at auction may have extensive Wayback history from its prior use. The attacker story notes that "Wayback Machine prior content can betray a domain whose previous purpose was incongruent with a CRO." If the prior content was unrelated (e.g., a pet shop), `recent_content_pivot` fires when the attacker stands up a CRO website. If the prior content was already biotech-adjacent, the check misses it.

**Net assessment:** Meaningful value against fresh domains (in combination with RDAP). Partial value against aged-domain purchases depending on prior content congruence.

---

### cro-framing

**Summary:** Single LLC framed as CRO, self-owned domain.

**Self-owned domain workspace:**
- **CAUGHT** (partially). `no_wayback_history` on a same-day domain. Soft signal, combined with RDAP.

**Net assessment:** Same as cro-identity-rotation fresh variant.

---

### shell-nonprofit

**Summary:** Shell nonprofit with real domain, 4–12 week pre-aging.

**Stand up the shell's own domain and mailbox:**
- **CAUGHT.** After 4–12 weeks, the domain may have minimal or no Wayback captures (IA crawls are not instantaneous — it can take weeks to months for a new site to get its first capture). `no_wayback_history` or very sparse history combined with the claim of being an established nonprofit is suspicious.

**Net assessment:** Catches the shell's documented timeline. The attacker would need to submit the domain to IA manually and build months of consistent content to defeat this check.

---

### biotech-incubator-tenant

**Summary:** LLC at incubator with biotech-themed domain.

**Self-controlled domain + Workspace:**
- **CAUGHT** (partially). `no_wayback_history` on fresh domain. Soft signal.

**Domain age padding (6–12 months):**
- **AMBIGUOUS.** If the attacker registers the domain 6–12 months early and puts up a website, IA may crawl it, giving the domain some Wayback history. If the content is consistently biotech-themed, no pivot is detected. The check's value depends on whether IA crawled the pre-aged domain.

**Net assessment:** Partial value against fresh registrations. Limited against pre-aged domains with consistent content.

---

### gradual-legitimacy-accumulation

**Summary:** 6–12 months operating a real-but-hollow biotech.

**Time-aged domain and clean order history:**
- **MISSED.** The attacker operates the domain for 12 months with consistent biotech content. Wayback captures will show a consistent biotech website from month 0 through month 12. No `dormancy_gap`, no `recent_content_pivot`. The implementation explicitly acknowledges this: "NOT caught: `gradual-legitimacy-accumulation` (the latter explicitly bakes in 6–12 months of clean activity precisely to defeat this check)."

**Aged domain auction purchase:**
- **AMBIGUOUS.** If the prior domain content was biotech-adjacent, no pivot detected. If it was unrelated, `recent_content_pivot` may fire — but this branch compresses the waiting period, so the pivot would be >12 months ago by the time SOC orders are placed.

**Net assessment:** No value. The branch is explicitly designed to defeat this check through patience and content consistency.

---

### community-bio-lab-network

**Summary:** Community bio labs with `.org` domains.

**Self-owned `.org` domain:**
- **CAUGHT** (partially). `no_wayback_history` on a fresh `.org`. Soft signal combined with RDAP.

**Net assessment:** Partial value on initial registration. Defeated after the domain accumulates legitimate-looking Wayback history.

---

### inbox-compromise

**Summary:** Compromises dormant institutional `.edu` inbox.

**All 6 methods:**
- **MISSED.** The institutional domain has extensive, consistent Wayback history. The attacker does not modify the domain's website. No signal.

**Net assessment:** No value. Structural — the check examines domain web content, not mailbox access.

---

### credential-compromise

**Compromised `.edu` email:**
- **MISSED.** Real institutional domain with real Wayback history. No signal.

**Net assessment:** No value.

---

### account-hijack

**Inherited `.edu` mailbox:**
- **MISSED.** No signal.

**Net assessment:** No value.

---

### dormant-account-takeover

**All bypasses (A–E):**
- **MISSED.** Real institutional domain. No change to web content.

**Net assessment:** No value.

---

### foreign-institution

**All 6 methods:**
- **MISSED.** Real institutional domain with (likely) existing Wayback history.

**Net assessment:** No value.

---

### it-persona-manufacturing

**All sub-paths (A–D):**
- **MISSED.** Real institutional domain.

**Net assessment:** No value.

---

### visiting-researcher

**No bypass needed:**
- **MISSED.** Real institutional domain.

**Net assessment:** No value.

---

### shell-company

**Self-owned `@shellco.com` Workspace:**
- **CAUGHT** (partially). `no_wayback_history` on fresh domain.

**Aged domain:**
- **AMBIGUOUS.** Depends on prior content congruence.

**Net assessment:** Partial value on fresh registration. Same ambiguity as cro-identity-rotation on aged purchases.

---

### unrelated-dept-student

**All bypasses:**
- **MISSED.** Real institutional domain.

**Net assessment:** No value.

---

### insider-recruitment, lab-manager-voucher, bulk-order-noise-cover

**No bypass needed (all three):**
- **MISSED.** Real institutional domains.

**Net assessment:** No value for any.

---

## Findings

### Moderate

**M1. Content-pivot detection is defeatable by content-congruent aged-domain purchases (3 stories).**
- Stories: cro-identity-rotation (aged-domain variant), gradual-legitimacy-accumulation, biotech-incubator-tenant (domain age padding).
- Why missed: The `recent_content_pivot` classifier only fires when content category changes. An attacker who buys an aged domain whose prior content was already biotech-adjacent, or who builds consistent content from day one, produces no pivot signal.
- Suggestion: Cross-reference Wayback content with the entity's actual founding date (from corp registry or RDAP registration). A domain with 5 years of biotech content but an LLC filed 3 months ago is suspicious. This requires combining with m09-corp-registry-stack or similar.

**M2. Genuine-institutional-email branches are structurally invisible (11 stories).**
- Stories: inbox-compromise, credential-compromise, account-hijack, dormant-account-takeover, foreign-institution, it-persona-manufacturing, visiting-researcher, unrelated-dept-student, insider-recruitment, lab-manager-voucher, bulk-order-noise-cover.
- Why missed: Structural. These attackers do not register, transfer, or modify any domain's web content. Wayback has nothing to detect.
- Suggestion: Not addressable by this idea.

### Minor

**m1. `robots.txt` exclusion creates false `no_wayback_history` (all stories with custom domains).**
- Why: Some domains block IA's crawler, producing zero captures despite being live for years. The implementation acknowledges this.
- Suggestion: Already noted in `failure_modes_requiring_review`. Could add a secondary check: if RDAP says domain is >2y old but Wayback has 0 captures, flag as `robots_exclusion_possible` rather than `no_wayback_history`.

**m2. LLM classifier reliability for content-pivot detection is unspecified.**
- Why: The implementation notes "~$0.001 per call" but does not specify the classifier's precision/recall. A false-positive-prone classifier could flood the review queue.
- Suggestion: Stage 6 or stage 4 re-research should specify the classifier's expected performance or benchmark it.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| dormant-domain Bypass A (lapsed domain reanimation) | CAUGHT |
| dormant-domain Bypass C (typosquat) | CAUGHT |
| shell-nonprofit: 4–12 week pre-aged domain | CAUGHT |
| cro-identity-rotation: fresh domain | CAUGHT (partially, soft signal) |
| cro-framing: fresh domain | CAUGHT (partially, soft signal) |
| biotech-incubator-tenant: fresh domain | CAUGHT (partially, soft signal) |
| community-bio-lab-network: fresh .org | CAUGHT (partially, soft signal) |
| shell-company: fresh domain | CAUGHT (partially, soft signal) |
| dormant-domain Bypass B (dangling-DNS subdomain) | AMBIGUOUS |
| cro-identity-rotation: aged-domain purchase (congruent content) | MISSED |
| cro-identity-rotation: aged-domain purchase (incongruent content) | CAUGHT |
| gradual-legitimacy-accumulation: 12-month organic aging | MISSED |
| biotech-incubator-tenant: domain age padding >12mo | AMBIGUOUS |
| inbox-compromise: all 6 methods | MISSED |
| credential-compromise: compromised .edu | MISSED |
| account-hijack: inherited .edu | MISSED |
| dormant-account-takeover: Bypasses A–E | MISSED |
| foreign-institution: all 6 methods | MISSED |
| it-persona-manufacturing: Sub-paths A–D | MISSED |
| visiting-researcher: no bypass needed | MISSED |
| unrelated-dept-student: Bypasses A–D | MISSED |
| insider-recruitment: no bypass needed | MISSED |
| lab-manager-voucher: no bypass needed | MISSED |
| bulk-order-noise-cover: no bypass needed | MISSED |

## bypass_methods_uncovered

- Content-congruent aged-domain purchases
- Organic domain aging with consistent content (gradual-legitimacy-accumulation)
- All genuine-institutional-email variants (11 stories)
- Dangling-DNS subdomain takeovers (depends on prior Wayback captures)

---

## Verdict: **PASS**

No Critical findings. The check delivers strong value against its primary target (dormant-domain reanimation) and provides a useful soft signal for fresh domains. The patient-attacker and genuine-institutional-email gaps are structural and shared across all M02 ideas. Pipeline continues to stage 6.
