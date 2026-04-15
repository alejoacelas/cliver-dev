# m02-rdap-age — bypass-aware hardening v1

- **measure:** M02 — email-affiliation-whois
- **idea:** RDAP/WHOIS domain age + registrant
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker-story walk

### dormant-domain

**Summary:** Patient operator acquires lapsed canonical domain of a defunct research entity.

**Bypass A — Acquire the lapsed canonical domain:**
- **CAUGHT.** `domain_recent_transfer` fires: the domain is old (>2y) but the RDAP `transfer` event is recent. The implementation's SOP explicitly flags this as a "drop-catch / dormant-domain reanimation" pattern and calls for Wayback + PubMed cross-check. This is the implementation's primary designed-for scenario.

**Bypass B — Dangling-DNS subdomain takeover on live parent institution:**
- **MISSED.** RDAP operates at the registered domain level (e.g., `harvard.edu`), not at the subdomain level. A subdomain takeover on `lab.harvard.edu` does not change the RDAP registration, transfer, or registrant for `harvard.edu`. No signal.

**Bypass C — Typosquat / lookalike domain:**
- **CAUGHT.** `domain_age_lt_12mo` or `domain_age_lt_3mo` fires. Freshly registered lookalike domain is flagged immediately.

**Net assessment:** Strong value against the primary scenario (lapsed-domain drop-catch) and typosquats. No leverage on subdomain takeovers.

---

### cro-identity-rotation

**Summary:** 2–4 small CRO LLCs with fresh custom-domain Google Workspace email.

**Fresh domain + DNS/mail-stack maturity signaling:**
- **CAUGHT** (temporarily). `domain_age_lt_12mo` fires on same-day registration. The attacker's explicit counterstrategy is to wait 6–12 months or buy an aged domain.

**Aged-domain purchase:**
- **MISSED.** The implementation flags `domain_recent_transfer` only on domains >2y old with a transfer in the last 365 days. An aged domain purchased at auction would show a recent transfer — but the attacker story notes that "WHOIS history is publicly archived; transfer creates a dated change record." The `domain_recent_transfer` flag **does fire** here if the domain is >2y old and the transfer is <365d. **CAUGHT** for recently-transferred aged domains. However, the attacker can buy a domain and wait >365d before using it, at which point the transfer event falls outside the window. Classification: **AMBIGUOUS** — depends on attacker patience vs. the 365d window.

**Net assessment:** Meaningful value in the first year. Attacker can defeat by pre-aging (organic registration >12mo before use, or buying aged domain and waiting >365d). The check imposes a real time cost on the attacker: at minimum 12 months of lead time.

---

### cro-framing

**Summary:** Individual registers LLC as small CRO with self-owned domain.

**Self-owned domain workspace:**
- **CAUGHT** (temporarily). `domain_age_lt_12mo` fires if the domain is fresh. The attacker story notes ~1–2 hours for setup, implying same-day domain.
- **MISSED** after 12 months of aging. The attacker can register the domain well in advance of placing orders.

**Net assessment:** Imposes a 12-month lead-time cost. Defeated by patience.

---

### shell-nonprofit

**Summary:** Shell nonprofit with real domain, 4–12 week pre-aging.

**Stand up the shell's own domain and mailbox:**
- **CAUGHT.** The 4–12 week pre-aging explicitly falls within the `domain_age_lt_12mo` window. The implementation would flag this domain.

**Net assessment:** Directly catches this attacker's documented timeline. The attacker would need to extend pre-aging to >12 months to defeat the check.

---

### biotech-incubator-tenant

**Summary:** LLC leases incubator bench space, registers biotech-themed domain.

**Self-controlled domain + Workspace:**
- **CAUGHT** (temporarily). `domain_age_lt_12mo` fires on fresh registration.

**Domain age padding (6–12 months pre-registration or aged auction purchase):**
- **AMBIGUOUS.** 6-month pre-registration is caught (still <12mo). 12-month pre-registration defeats the check. Aged auction purchase: `domain_recent_transfer` may fire if domain is >2y and transfer is <365d. Same ambiguity as cro-identity-rotation.

**Net assessment:** Catches the impatient variant. Imposes 12+ month lead-time cost on the patient variant.

---

### gradual-legitimacy-accumulation

**Summary:** 6–12 months of operating a real-but-hollow biotech before SOC orders.

**Time-aged domain and clean order history (12 months):**
- **MISSED.** By month 12, the domain age exceeds 365 days and `domain_age_lt_12mo` no longer fires. The branch's entire strategy is designed to outlast this check.

**Aged domain auction purchase:**
- **AMBIGUOUS.** If the purchased domain is >2y old, `domain_recent_transfer` fires within the first 365d. But the branch explicitly compresses 12 months of order history anyway, so the transfer flag window may have passed by the time SOC orders are placed.

**Net assessment:** Limited value. The branch's designed-in patience (12 months) exactly matches and defeats the 12-month threshold. The check imposes the minimum lead time the attacker already planned for.

---

### community-bio-lab-network

**Summary:** Community bio labs with `.org` domains.

**Self-owned community lab domain:**
- **CAUGHT** (temporarily). `domain_age_lt_12mo` fires on fresh `.org` registration. Lead-up is "hours to a day" per the attacker story.

**Net assessment:** Catches the initial registration. Defeated after 12 months.

---

### inbox-compromise

**Summary:** Compromises dormant institutional `.edu` inbox.

**All 6 methods:**
- **MISSED.** The attacker uses a real institutional domain whose registration date is decades old. No RDAP signal. Domain age, transfer, and registrant are all the real institution's.

**Net assessment:** No value. Structural — the attacker does not register or transfer any domain.

---

### credential-compromise

**Summary:** Compromises real PI's institutional email.

**Compromised `.edu` email:**
- **MISSED.** Same as inbox-compromise. Real institutional domain, no RDAP signal.

**Net assessment:** No value.

---

### account-hijack

**Summary:** Takes over PI's pre-existing provider account via compromised email.

**Inherited `.edu` mailbox:**
- **MISSED.** No domain-level change.

**Net assessment:** No value.

---

### dormant-account-takeover

**Summary:** IT admin takes over dormant synthesis-provider account.

**All bypasses (A–E):**
- **MISSED.** All operate within genuine institutional infrastructure. No domain registration or transfer.

**Net assessment:** No value.

---

### foreign-institution

**Summary:** Exploits verification gaps at non-Anglophone institutions.

**All 6 methods:**
- **MISSED.** Attacker obtains email on a real institutional domain. RDAP shows the institution's longstanding registration.

**Net assessment:** No value. Additionally, many non-Anglophone ccTLDs may not have RDAP (`rdap_unavailable` fallback to WHOIS, which may also be sparse).

---

### it-persona-manufacturing

**Summary:** IT admin manufactures persona on real institutional domain.

**All sub-paths (A–D):**
- **MISSED.** Real institutional domain, no registration or transfer event.

**Net assessment:** No value.

---

### visiting-researcher

**Summary:** Obtains real visiting-scholar appointment with genuine `.edu` credentials.

**No bypass needed:**
- **MISSED.** Real institutional domain.

**Net assessment:** No value.

---

### shell-company

**Summary:** Delaware LLC with real domain.

**Self-owned domain:**
- **CAUGHT** (temporarily). `domain_age_lt_12mo` on fresh registration.

**Aged domain ($100–$2,000):**
- **AMBIGUOUS.** `domain_recent_transfer` may fire on a >2y domain with recent transfer. Defeated if the attacker waits >365d after purchase. The attacker story explicitly names this compression tactic.

**Net assessment:** Imposes lead-time cost. Catches impatient variants.

---

### unrelated-dept-student

**Summary:** Enrolled student with real `.edu` email.

**All bypasses:**
- **MISSED.** Real institutional domain.

**Net assessment:** No value.

---

### insider-recruitment

**Summary:** Legitimate insider paid to place orders.

**No bypass needed:**
- **MISSED.** Real institutional domain.

**Net assessment:** No value.

---

### lab-manager-voucher

**Summary:** Insider with legitimate ordering role.

**No bypass needed:**
- **MISSED.** Real institutional domain.

**Net assessment:** No value.

---

### bulk-order-noise-cover

**Summary:** Core facility technician using institutional infrastructure.

**No bypass needed:**
- **MISSED.** Real institutional domain.

**Net assessment:** No value.

---

## Findings

### Moderate

**M1. 12-month threshold is exactly defeatable by patient attacker stories (3 stories).**
- Stories: gradual-legitimacy-accumulation (explicitly designs 12-month lead time), cro-identity-rotation (aged-domain purchase + patience), biotech-incubator-tenant (domain age padding).
- Why missed: The `domain_age_lt_12mo` threshold matches the patience these branches are designed to exercise. The check imposes a real cost (12+ months of lead time) but does not prevent the bypass.
- Suggestion: Consider a longer threshold (e.g., 24 months) at the cost of more false positives on legitimate startups. Alternatively, accept that the check's value is time-cost imposition rather than outright prevention, and document that explicitly.

**M2. Genuine-institutional-email branches are structurally invisible (11 stories).**
- Stories: inbox-compromise, credential-compromise, account-hijack, dormant-account-takeover, foreign-institution, it-persona-manufacturing, visiting-researcher, unrelated-dept-student, insider-recruitment, lab-manager-voucher, bulk-order-noise-cover.
- Why missed: Structural. RDAP operates on domain registration metadata. These attackers operate within existing institutional domains. Not addressable by any domain-age check.
- Suggestion: Not addressable by this idea. Appropriate for measures 14, 16, 19.

### Minor

**m1. Dangling-DNS subdomain takeover not detected (1 story).**
- Story: dormant-domain Bypass B.
- Why missed: RDAP operates at the registered domain level, not subdomain level.
- Suggestion: Addressed by m02-dangling-dns.

**m2. ccTLD RDAP coverage gaps (1 story).**
- Story: foreign-institution.
- Why missed: Many non-Anglophone ccTLDs lack RDAP. WHOIS fallback may return sparse or non-machine-parseable data.
- Suggestion: The implementation already notes the `rdap_unavailable` fallback. Could add a flag when fallback also fails: `domain_registration_unverifiable`.

**m3. `registrant_redacted` is nearly universal and barely informative.**
- All stories with self-owned domains.
- Why: Post-GDPR, nearly all gTLD registrant fields are redacted. The implementation acknowledges this ("barely informative on its own"). Not a bypass per se but a structural weakness.
- Suggestion: The implementation already treats this as a soft flag. No change needed.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| dormant-domain Bypass A (lapsed domain drop-catch) | CAUGHT |
| dormant-domain Bypass C (typosquat) | CAUGHT |
| shell-nonprofit: 4–12 week pre-aged domain | CAUGHT |
| cro-identity-rotation: fresh domain | CAUGHT (temporarily) |
| cro-framing: fresh domain | CAUGHT (temporarily) |
| biotech-incubator-tenant: fresh domain | CAUGHT (temporarily) |
| community-bio-lab-network: fresh domain | CAUGHT (temporarily) |
| shell-company: fresh domain | CAUGHT (temporarily) |
| dormant-domain Bypass B (dangling-DNS subdomain) | MISSED |
| cro-identity-rotation: aged-domain purchase + patience | AMBIGUOUS |
| gradual-legitimacy-accumulation: 12-month organic aging | MISSED |
| gradual-legitimacy-accumulation: aged domain auction | AMBIGUOUS |
| biotech-incubator-tenant: domain age padding >12mo | MISSED |
| shell-company: aged domain + patience >365d | AMBIGUOUS |
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

- Aged-domain purchase with >365d patience (multiple stories)
- Organic domain aging >12 months (gradual-legitimacy-accumulation)
- All genuine-institutional-email variants (11 stories)
- Dangling-DNS subdomain takeover
- ccTLD RDAP coverage gaps

---

## Verdict: **PASS**

No Critical findings. The check delivers its designed-for value: catching drop-catch reanimation and fresh domains, imposing a 12-month lead-time cost on purpose-built-organization branches. The Moderate findings are either structural (genuine-institutional-email branches) or accepted trade-offs (patient attackers outlasting the threshold). Pipeline continues to stage 6.
