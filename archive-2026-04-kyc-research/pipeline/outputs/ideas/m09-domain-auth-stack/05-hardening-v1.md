# m09-domain-auth-stack — bypass-aware hardening v1

- **measure:** M09 — institution-real-life-sciences
- **name:** MX/SPF/DMARC + RDAP/WHOIS-history domain liveness signal
- **idea file:** `04-implementation-v1.md`

---

## Attacker story walk-through

### 1. shell-company

**Summary:** Purpose-built Delaware LLC with professional website, custom email domain, preprints, order history.

**Bypass methods relevant to this measure:**

- **Build entity signals from scratch (Bypass 1):** The attacker registers a domain, sets up Google Workspace or equivalent (MX, SPF, DKIM, DMARC all configured), and runs it for 6–12 months. "Aged domain $100–$2,000 if the attacker wants to compress the domain-age waiting period."
  - `domain_recent` flag: **CAUGHT** if the attacker uses a newly registered domain and orders within 90 days. **MISSED** if the attacker waits >90 days (the flag threshold) or buys an aged domain ($100–$2,000).
  - `domain_no_mail_auth` flag: **MISSED.** Google Workspace automatically configures MX, SPF, DKIM, and DMARC. Setup takes <1 hour. The attacker will have complete mail authentication.
  - `domain_reanimated` flag: **MISSED** for fresh registrations (no gap to detect). **AMBIGUOUS** for aged-domain purchases — depends on whether DomainTools enrichment is used (which the implementation prices at $15.75/query and reserves for "high-suspicion follow-ups").

- **Acquire an existing company (Bypass 2):** Inherits the company's aged domain with full history.
  - **Classification: MISSED.** Aged domain, stable WHOIS history, established MX. All signals pass.

**Net assessment:** The `domain_recent` flag provides friction only for the first 90 days on a fresh domain. Aged-domain purchase ($100–$2,000) completely bypasses the check. Mail-auth signals are trivially satisfied by Google Workspace. Moderate friction for impatient attackers; near-zero for patient ones.

---

### 2. shell-nonprofit

**Summary:** Research nonprofit with name near-collision, thin website, and pre-aged domain.

**Bypass methods relevant to this measure:**

- **Thin-but-checkable website:** "Pre-ages the domain via Wayback Machine snapshots and organic crawl indexing... 2–6 months pre-aging before it looks non-fresh."
  - `domain_recent`: **CAUGHT** if the attacker uses the domain before 90 days. **MISSED** after pre-aging (2–6 months exceeds the 90-day threshold).
  - `domain_no_mail_auth`: **MISSED.** Same as shell-company — Workspace/Zoho setup is trivial.

- **Real-entity registration with virtual-office shipping:** Domain + Workspace $100–$250.
  - **Classification: MISSED** after pre-aging.

**Net assessment:** The 90-day `domain_recent` window is explicitly shorter than the attacker's planned 2–6 month pre-aging period. Near-zero friction.

---

### 3. cro-framing

**Summary:** Real LLC presented as a CRO with custom domain and email.

**Bypass methods relevant to this measure:**

- **CRO services-page cover story:** "Cost ~$16–$30/month for a Squarespace-style template + <$20 domain." The domain is new at setup.
  - `domain_recent`: **CAUGHT** if the CRO orders within 90 days of domain registration. The CRO setup lead time is "4–8 hours of writing" but the overall entity setup is 2–6 weeks — the attacker may order within the 90-day window.
  - `domain_no_mail_auth`: **MISSED.** MX/SPF/DMARC setup is standard.

- **Aged-domain purchase:** "$50–$5,000 depending on age/traffic."
  - `domain_recent`: **MISSED.** Aged domain bypasses the date check.
  - `domain_reanimated`: **AMBIGUOUS.** Only detected if DomainTools enrichment is used ($15.75/query escalation path).

**Net assessment:** `domain_recent` provides friction if the attacker doesn't buy an aged domain. The aged-domain purchase ($50–$5,000) is explicitly listed as a bypass method and completely defeats the time-based signal. Moderate friction without aged domain; zero with it.

---

### 4. cro-identity-rotation

**Summary:** 2–4 CRO LLCs, each with its own domain.

**Bypass methods relevant to this measure:**

- **Per-entity domain setup:** Each LLC gets its own domain. Same analysis as cro-framing per entity.
  - **Classification: Same as cro-framing.** `domain_recent` catches fresh domains; aged-domain purchase defeats it.

- **Synthetic web/persona depth:** One-page services website with MX configured.
  - `domain_no_mail_auth`: **MISSED.** Standard setup.

**Net assessment:** Per-entity, same as cro-framing. The rotation does not change the domain-level analysis.

---

### 5. biotech-incubator-tenant

**Summary:** LLC leases bench space at incubator, sets up custom domain.

**Bypass methods relevant to this measure:**

- **Reflected legitimacy from incubator tenancy:** Domain setup is part of the standard entity-creation process.
  - `domain_recent`: **CAUGHT** for fresh domains in the first 90 days. Real early-stage incubator tenants also have fresh domains, so this is noisy.
  - `domain_no_mail_auth`: **MISSED.** Standard Workspace setup.

- **Buy an aged dormant biotech LLC:** Inherits aged domain.
  - **Classification: MISSED.** All domain signals pass.

**Net assessment:** Same pattern: `domain_recent` provides friction for 90 days, bypassed by aged-domain purchase or patience.

---

### 6. gradual-legitimacy-accumulation

**Summary:** Explicitly designed to wait out time-based gates.

**Bypass methods relevant to this measure:**

- **Time-aged domain and clean order history (Method 1):** "Register the domain at month 0... By month 12 the provider's risk system shows a year of customer tenure."
  - `domain_recent`: **MISSED.** The domain is registered at month 0; by the time of SOC order at month 6–12, it is well past 90 days.
  - `domain_no_mail_auth`: **MISSED.** MX/SPF/DMARC configured from the start.

- **Aged domain auction purchase (Method 2, compression variant):** "$50–$5,000."
  - `domain_recent`: **MISSED.** Pre-aged.
  - `domain_reanimated`: **AMBIGUOUS.** A recently transferred domain would show a registrar-change event in RDAP. But the implementation's `domain_reanimated` flag requires either DomainTools enrichment ($15.75/query) or the RDAP `events` field showing a recent `last-changed` date. RDAP `last-changed` may or may not reflect a domain transfer vs. a WHOIS record update.

**Net assessment:** Zero friction. The branch is explicitly designed to defeat time-based signals by starting the clock early.

---

### 7. community-bio-lab-network

**Summary:** Community-bio labs with maker-space addresses.

**Bypass methods relevant to this measure:**

- **Minimal community-bio web presence + DIYbio.org listing:** Domain registration + one-page website. "Allow the domain at least 30 days to age... or buy an aged domain for ~$50–$300."
  - `domain_recent`: **CAUGHT** if the attacker uses the domain before 90 days but after 30 days. **MISSED** if the attacker waits 90+ days or buys aged domain.
  - `domain_no_mail_auth`: **AMBIGUOUS.** Community-bio labs may or may not set up full mail auth. Real community labs often have minimal email infrastructure (free-tier mail, no DMARC). If the attacker skips DMARC, this flag fires — but it also fires on legitimate community labs, making it a noisy signal for this customer class.

**Net assessment:** Weak friction. The `domain_recent` window may catch impatient attackers, but the aged-domain purchase ($50–$300) defeats it cheaply. The `domain_no_mail_auth` signal is structurally noisy for this customer class.

---

### 8. dormant-domain

**Summary:** Acquires lapsed canonical domain of a defunct research entity.

**Bypass methods relevant to this measure:**

- **Acquire the lapsed canonical domain (Bypass A):** The attacker buys a domain that was previously registered to a real research institution. The domain may have years of WHOIS history, Wayback Machine snapshots, and prior DNS configuration.
  - `domain_recent`: **MISSED.** The domain is old (5+ years typically).
  - `domain_no_mail_auth`: **CAUGHT** initially — the attacker needs "4–6 weeks of domain warming" to configure SPF/DKIM/DMARC. During this window, mail auth may be incomplete. After warming, **MISSED.**
  - `domain_reanimated`: **CAUGHT** — this is the exact scenario the flag is designed for. The RDAP record should show a gap (expiration then re-registration) or a recent registrar transfer. The implementation specifically calls out "dormant-domain attacker pattern."
  - **However:** The `domain_reanimated` flag depends on DomainTools history enrichment, which costs $15.75/query and is described as used only for "high-suspicion follow-ups." At the baseline (RDAP-only), the implementation can detect recent `last-changed` events but may not see the registration gap if the domain was caught at drop and re-registered without a visible gap in the RDAP record.

  - **Classification: CAUGHT if DomainTools is used. AMBIGUOUS at baseline RDAP-only level.**

**Net assessment:** This is the strongest story for this check. The `domain_reanimated` flag is designed exactly for this scenario. But the catch depends on DomainTools enrichment being triggered. If the attacker's domain passes other signals (no `domain_recent`, no `domain_no_mail_auth` after warming), there may be no trigger to escalate to DomainTools.

---

### 9. foreign-institution

**Summary:** Exploits verification gaps at non-Anglophone institutions.

**Bypass methods relevant to this measure:**

- **All methods (name ambiguity, coverage gaps, fabricated ORCID, ride institution's footprint):** The attacker claims affiliation with a real foreign institution that has its own established domain (e.g., `.edu.br`, `.ac.jp`, `.ac.in`).
  - `domain_recent`: **MISSED.** The institution's domain is old and established.
  - `domain_no_mail_auth`: **MISSED** for major institutions. **AMBIGUOUS** for smaller institutions — the implementation notes "foreign institutions on country-code TLDs whose RDAP server is poorly maintained" as a failure mode.
  - `domain_reanimated`: **MISSED.** No transfer/gap.

- **The attacker may use the institution's domain OR a personal domain.** If using the institution's domain (claiming institutional email), all domain signals pass because the domain is the real institution's.
  - **Classification: MISSED.** The check validates the real institution's domain, not the individual's affiliation.

**Net assessment:** Zero friction. The domain belongs to the real institution and passes all checks. The attacker's exploit is at the individual-affiliation layer.

---

## Findings

### Finding 1 — Moderate: `domain_recent` threshold (90 days) is shorter than most attacker lead-up times

- **Source:** shell-company (6–12 months), shell-nonprofit (2–6 months pre-aging), cro-framing (2–6 weeks entity + variable domain), gradual-legitimacy-accumulation (6–12 months), community-bio-lab-network (30+ days + aged domain option)
- **Why missed:** The implementation sets `domain_recent` at < 90 days. Most attacker branches plan lead-up times of 2–12 months, meaning the domain is aged past the threshold before the SOC order. The only attacker caught by the 90-day window is one who rushes (cro-framing with fresh domain, impatient biotech-incubator-tenant).
- **Suggestion:** Lengthening the threshold (e.g., 180 or 365 days) would catch more branches but substantially increase false positives on real new biotechs. A graduated approach (90/180/365 day tiers with decreasing suspicion) is more practical but still non-blocking.

### Finding 2 — Moderate: Aged-domain purchase is cheap and defeats all time-based signals

- **Source:** shell-company ($100–$2,000), cro-framing ($50–$5,000), gradual-legitimacy-accumulation ($50–$5,000), community-bio-lab-network ($50–$300)
- **Why missed:** Multiple attacker branches explicitly price aged-domain purchase as a routine bypass ($50–$5,000). The implementation's `domain_reanimated` flag could catch recently transferred domains, but only with DomainTools enrichment at $15.75/query. At baseline (RDAP-only), recent transfers may not be detectable as reanimation events.
- **Suggestion:** Consider making DomainTools (or a cheaper WHOIS-history service) the default rather than the escalation path, at least for new customers. Alternatively, flag any domain whose RDAP `last-changed` event is within 6 months, regardless of registration date, as a cheaper proxy for ownership transfer.

### Finding 3 — Minor: Mail-auth signals (MX/SPF/DMARC) are trivially satisfied

- **Source:** All purpose-built-organization branches
- **Why missed:** Google Workspace, Zoho, or any modern mail provider automatically configures MX, SPF, DKIM, and DMARC. Setup takes < 1 hour. The `domain_no_mail_auth` flag is useful only as a hygiene check (catching parking-page domains) and provides no friction against even minimally prepared attackers.
- **Suggestion:** This is acknowledged implicitly in the implementation. The mail-auth signal is correctly positioned as a floor-quality indicator, not a security gate. No change needed.

### Finding 4 — Minor: `domain_reanimated` catch for dormant-domain depends on optional enrichment

- **Source:** dormant-domain
- **Why missed:** The `domain_reanimated` flag is the check's strongest contribution, designed for the exact dormant-domain scenario. But its effectiveness depends on DomainTools enrichment ($15.75/query), which the implementation describes as used only for "high-suspicion follow-ups." If other signals are clean (aged domain, mail auth configured, MX present), there may be no trigger to escalate.
- **Suggestion:** Stage 4 could specify that DomainTools enrichment is triggered for any customer whose domain's RDAP `last-changed` date is within 12 months, regardless of registration age. This would catch recently transferred old domains without requiring a separate suspicion trigger.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Fresh domain, orders within 90 days | shell-company, cro-framing | CAUGHT (`domain_recent`) |
| Aged-domain purchase ($50–$5,000) | shell-company, cro-framing, gradual-legitimacy-accumulation, community-bio-lab-network | MISSED |
| Google Workspace mail-auth setup | all purpose-built-org stories | MISSED (trivially satisfies `domain_no_mail_auth`) |
| Pre-aging domain 2–6 months | shell-nonprofit | MISSED (exceeds 90-day threshold) |
| Domain registered at month 0, SOC order at month 6–12 | gradual-legitimacy-accumulation | MISSED |
| Acquired company's aged domain | shell-company (Bypass 2), biotech-incubator-tenant (aged LLC variant) | MISSED |
| Lapsed canonical domain of defunct entity | dormant-domain | CAUGHT (`domain_reanimated`) if DomainTools used; AMBIGUOUS at RDAP-only |
| Real foreign institution domain | foreign-institution | MISSED (validates real institution) |

## bypass_methods_uncovered

| Bypass | Story | Why uncovered |
|---|---|---|
| Aged-domain purchase | shell-company, cro-framing, gradual-legitimacy-accumulation, community-bio-lab-network | Cheap ($50–$5,000) and completely defeats time-based signals |
| Pre-aging beyond 90 days | shell-nonprofit, gradual-legitimacy-accumulation | 90-day threshold is too short for most attack lead-ups |
| Trivial mail-auth configuration | all purpose-built-org stories | Google Workspace makes MX/SPF/DMARC automatic |
| Acquired company's domain | shell-company (Bypass 2) | Inherited domain has clean history |
| Real foreign institution domain | foreign-institution | Check scope is entity-level, not individual-affiliation |

---

## Verdict: **PASS**

No Critical findings. The check provides genuine value for the dormant-domain scenario (its designed target) and modest time-based friction for the freshest shell entities. The moderate findings — aged-domain purchase as a cheap bypass and the 90-day threshold being shorter than attacker lead-ups — are real but do not constitute Critical gaps because (a) the check is positioned as a corroborating signal, not a standalone gate, and (b) the most important catch (dormant-domain reanimation) works as designed when enrichment is triggered. Pipeline continues to stage 6.
