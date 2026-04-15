# Measure 09 — Institution Real Life Sciences: Per-Measure Synthesis

## 1. Side-by-side table of selected ideas

| Field | Corp-registry stack | PubMed affiliation search | Domain-auth stack |
|---|---|---|---|
| **Slug** | m09-corp-registry-stack | m09-pubmed-affiliation | m09-domain-auth-stack |
| **Primary question answered** | Does the institution legally exist? | Is the institution active in life sciences? | Is the domain established and authentic? |
| **Data sources** | Companies House (UK), SEC EDGAR (US public), OpenCorporates (all other) | NCBI E-utilities (PubMed), bioRxiv API | Public DNS, RDAP, DomainTools (escalation) |
| **Flags** | `registry_no_record`, `registry_dissolved`, `sic_not_life_sciences`, `registry_recent_incorp` | `no_pubmed_affiliation_5yr`, `affiliation_collision_risk`, `pubmed_thin_biorxiv_present` | `domain_recent`, `domain_no_mail_auth`, `domain_reanimated`, `dns_unresolvable` |
| **Auto-block flags** | `registry_dissolved` | None | None |
| **Marginal cost** | $0.25–$1.50 (OpenCorporates dominated) | $0 | $0 baseline; $15.75/query DomainTools escalation |
| **Setup cost** | 3–5 eng days | 3–5 eng days | ~2 eng days |
| **Total setup** | — | — | **8–12 eng days combined** |
| **Strongest customer segment** | Commercial entities (for-profit, CROs) | Established academic/research institutions | Universal time-dimension signal; strongest on commercial domains |
| **Weakest customer segment** | Academic/government (~39% of market produce no signal) | Industry/CROs (30–50% never publish), non-Anglophone institutions | Academic labs on parent-university subdomains (~39% trivial pass, zero discrimination) |
| **Attacker stories addressed** | 9 of 9 (all relevant stories) | 9 of 9 | 9 of 9 |

## 2. Coverage gap cross-cut

### Structural gaps (no signal produced for a customer segment)

These gaps represent populations where the check architecturally cannot produce a meaningful signal, regardless of tuning.

| Gap | Affected check(s) | Affected population | Compensated by? |
|---|---|---|---|
| Government/state-owned research institutes not in corporate registries | Corp-registry | ~30–50% of ~4,200 globally | PubMed (if publishing); domain-auth (weak — .gov domains trivially pass) |
| Academic institutions not in corporate registries | Corp-registry | ~60–70% of ~26,000 universities worldwide (~39% of synthesis market) | PubMed (strong for Anglophone); domain-auth (near-zero signal on parent-university domain) |
| Industry/CROs that never publish | PubMed | 30–50% of commercial customers | Corp-registry (strong — active LLC with life-sciences SIC) |
| Non-Anglophone institutions with output invisible to PubMed | PubMed | 50–80% of output for China/Japan/Latin America institutions | Corp-registry (if in OpenCorporates jurisdiction); domain-auth (weak) |
| Academic labs on parent-university subdomains | Domain-auth | ~90%+ of academic labs; ~39% of market | Corp-registry (no signal — university not in corp registry); PubMed (strong for Anglophone) |
| ccTLD RDAP gaps (no domain-age signal) | Domain-auth | Best guess 30–50% of ~316 ccTLDs | Corp-registry (if in OpenCorporates jurisdiction) |

**Residual structural gap:** Government labs that are (a) not in corporate registries, (b) not publishing in PubMed, and (c) using .gov domains that trivially pass domain-auth. This population receives near-zero meaningful signal from the entire M09 stack. Estimated size: unknown but likely small (most government labs publish). Flagged as open issue below.

### Complementary gaps (signal produced but noisy/uninformative)

| Gap | Affected check(s) | Nature of noise | Mitigation |
|---|---|---|---|
| Newly incorporated biotechs (<12 months) | Corp-registry | `registry_recent_incorp` fires on all new companies | Corroborate with PubMed + domain-auth; treat as soft signal |
| SIC/NAICS misclassification | Corp-registry | 20–40% of small biotechs filed under generic codes | `sic_not_life_sciences` is reviewer-adjudicated, not auto-deny; treat asymmetrically (non-LS code adds suspicion, LS code is not positive evidence) |
| Small domains without DMARC | Domain-auth | ~80% base rate globally; `domain_no_mail_auth` fires on most small legitimate customers | Down-weight heavily; use only in combination with other flags |
| New legitimate domains (<90 days) | Domain-auth | `domain_recent` fires on all new formations | Corroborate with `registry_recent_incorp` — cluster is more informative than either alone |
| GDPR privacy redaction | Domain-auth | 60–80% of gTLD registrations have registrant redacted; DomainTools ownership-transfer detection degraded | Accept as structural limitation of DomainTools escalation path |

## 3. Bypass methods uncovered cross-cut

The following bypass methods survive the entire selected M09 stack (all three checks). These are the attacker strategies that none of the selected ideas catch.

### 3A. Entity acquisition (dormant/going-concern purchase)

- **Attacker stories:** shell-company (bypass method 2), biotech-incubator-tenant (4f), gradual-legitimacy-accumulation (compression variant)
- **What the attacker does:** Buys an existing biotech/CRO entity from a business brokerage. Inherits aged incorporation, active corporate status, life-sciences SIC, aged domain, and possibly a historical PubMed trail.
- **Why it survives:**
  - Corp-registry: aged registration, active status, correct SIC — clean pass on all four flags.
  - PubMed: inherited publication history (if entity had one) provides genuine positive signal.
  - Domain-auth: inherited aged domain with established DNS — clean pass. DomainTools may show a transfer event, but post-GDPR redaction obscures registrant change in 60–80% of cases.
- **Partial mitigation not implemented:** Officer-change detection via Companies House `/company/{number}/officers` (appointed_on/resigned_on) could flag wholesale officer turnover on aged entities. Data not available for US LLCs.
- **Cost to attacker:** $50K–$300K+ depending on entity quality.

### 3B. Time-aging beyond detection windows

- **Attacker stories:** gradual-legitimacy-accumulation (primary branch), shell-company (bypass method 1 after 12 months), cro-framing, cro-identity-rotation
- **What the attacker does:** Operates a real-but-hollow entity for 12+ months, placing benign orders and accumulating domain age, before attempting controlled-sequence orders.
- **Why it survives:**
  - Corp-registry: `registry_recent_incorp` expires after 12 months.
  - Domain-auth: `domain_recent` expires after 90 days.
  - PubMed: attacker can optionally seed genuine PubMed records via pay-to-publish ($1,500–$3,000 APC) or paper-mill authorship ($200–$5,000).
- **Partial mitigation not implemented:** Graduated scoring windows (0–6, 6–18, 18–36 months) for corp-registry; graduated domain-age tiers (90/180/365 days) for domain-auth. Both extend friction but increase false positives.
- **Cost to attacker:** $10K–$70K + 6–12 months lead time.

### 3C. Aged-domain purchase (time compression)

- **Attacker stories:** shell-company, shell-nonprofit, cro-framing, gradual-legitimacy-accumulation (method 2), dormant-domain
- **What the attacker does:** Buys a 5+ year expired domain at auction ($50–$5,000) to bypass all domain-age signals instantly.
- **Why it survives:**
  - Domain-auth: purchased domain has clean age history. Unless DomainTools detects the auction transfer (and registrant is not redacted), no flag fires.
  - Corp-registry and PubMed: unaffected (domain purchase is orthogonal to these checks).
- **Cost to attacker:** $50–$5,000.

### 3D. Attacker-selected SIC/NAICS code

- **Attacker stories:** shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network
- **What the attacker does:** Self-selects "Scientific Research and Development" (NAICS 5417) or equivalent life-sciences SIC code when filing the LLC. No verification at the registry.
- **Why it survives:**
  - Corp-registry: `sic_not_life_sciences` never fires because the attacker controls the input. Life-sciences SIC should not be treated as positive evidence (asymmetric treatment recommended but not implemented).
- **Cost to attacker:** $0.

### 3E. Pay-to-publish / paper-mill authorship

- **Attacker stories:** gradual-legitimacy-accumulation (methods 3–4), shell-company, shell-nonprofit
- **What the attacker does:** Publishes in a PubMed-indexed open-access journal ($1,500–$3,000 APC at PLOS ONE/Frontiers) or purchases paper-mill authorship ($200–$5,000). Creates genuine PubMed records indistinguishable from earned publications.
- **Why it survives:**
  - PubMed: real indexed records. No mechanism to detect bought vs. earned authorship.
- **Partial mitigation not implemented:** `pubmed_single_paper_only` flag for exactly 1 hit; defeated by attacker willing to spend $3K–$15K on multiple papers.
- **Cost to attacker:** $200–$15,000.

### 3F. Real foreign institution exploitation

- **Attacker stories:** foreign-institution (all methods)
- **What the attacker does:** Claims affiliation with a real mid-tier non-Anglophone research institution. The institution genuinely exists, publishes, and has a real domain.
- **Why it survives:**
  - Corp-registry: validates institution existence — clean pass.
  - PubMed: validates institution's publication record — clean pass (or weak signal due to non-Anglophone coverage gap).
  - Domain-auth: validates institution's domain — clean pass.
  - The exploit is at the individual-affiliation layer (does this person work there?), which is outside M09's scope entirely. This is a measure-level architectural limitation, not a check-level gap.
- **Cost to attacker:** $0–$500.

### 3G. CRO cover story with thin-but-legitimate profile

- **Attacker stories:** cro-framing (primary), cro-identity-rotation
- **What the attacker does:** Presents as a small CRO with no publications, no grants, no IBC — all of which are normal for legitimate small CROs. Real LLC, real domain, services website.
- **Why it survives:**
  - Corp-registry: active LLC, possibly correct SIC — clean pass after 12 months.
  - PubMed: `no_pubmed_affiliation_5yr` fires, but this is structurally noisy (30–50% of legitimate commercial customers also have no publications).
  - Domain-auth: aged domain with mail auth — clean pass.
  - The attacker is indistinguishable from a legitimate thin-signal CRO. This is a structural limitation: the measure cannot reject a customer class (small CROs) without also rejecting the legitimate population.
- **Cost to attacker:** $300–$1,700/year ongoing.

### 3H. Community-bio lab mimicry

- **Attacker stories:** community-bio-lab-network
- **What the attacker does:** Registers LLC, joins DIYbio.org directory, rents maker-space address, builds minimal web presence.
- **Why it survives:**
  - All three checks: the attacker's profile is indistinguishable from a legitimate community bio lab. Same structural limitation as 3G — the measure cannot reject this customer class without rejecting the legitimate population.
- **Cost to attacker:** $50–$100 setup + $720–$1,800/year.

## 4. Structural gaps flagged as open issues

1. **Government-lab blind spot.** Government research institutes that are not in corporate registries, do not publish in PubMed, and use .gov domains receive near-zero signal from the entire M09 stack. Requires a separate verification pathway (e.g., cross-reference against a government-lab directory or ROR registry). Estimated affected population: small but unquantified.

2. **Individual-affiliation gap (foreign-institution story).** M09 validates that an institution is real and active in life sciences, but does not validate that the ordering individual is affiliated with that institution. The foreign-institution story (and several other stories outside M09's scope) exploits this architectural boundary. This is properly a measure-19/20 concern (individual verification / voucher), not fixable within M09.

3. **Indistinguishable-from-legitimate customer classes.** CRO-framing and community-bio-lab-network attacks produce entity profiles that are structurally identical to legitimate thin-signal customers. No amount of tuning within M09 can separate these populations without unacceptable false-positive rates. Detection requires either (a) cross-measure signals (order patterns, individual identity, voucher checks) or (b) accepting residual risk for these customer classes.

4. **Entity-acquisition bypass.** The strongest and most expensive bypass ($50K–$300K) produces a fully clean pass across all three M09 checks. The only partial mitigation within M09 is officer-change detection (Companies House only, not available for US LLCs). Cross-measure detection (e.g., sudden change in order patterns on a previously dormant account, M17 re-evaluation triggers) is the more promising defense.

5. **Time-aging convergence.** All time-based signals in the M09 stack have finite windows (12 months for corp-registry, 90 days for domain-auth). Any attacker willing to invest 12+ months of lead time ages out of all time-based detection. Graduated scoring windows would extend friction but not eliminate the bypass. The fundamental limitation is that time-based signals are depreciating assets against patient attackers.

6. **SIC/NAICS asymmetry not implemented.** The corp-registry stack treats life-sciences SIC codes as partial positive evidence, but these codes are self-reported at filing with no verification. The hardening recommendation to treat SIC asymmetrically (non-LS code adds suspicion; LS code is not positive evidence) has not been implemented.

7. **PubMed recency-trend analysis not implemented.** The dormant-domain attacker benefits from a defunct entity's historical PubMed trail. A `pubmed_publication_trend_declining` flag (publications clustered 3–5 years ago, nothing in last 2 years) would partially address this. Not implemented.

8. **DomainTools cost-benefit uncertain.** The `domain_reanimated` flag — the domain-auth stack's strongest contribution — depends on DomainTools enrichment ($15.75/query) for reliable detection. Post-GDPR registrant redaction (60–80% of gTLD registrations) degrades DomainTools' value for ownership-transfer detection. Whether DomainTools should be default for new customers or escalation-only is unresolved.
