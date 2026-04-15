# Measure 07 — Institution Affiliation (Low Scrutiny): Per-measure synthesis

## 1. Side-by-side table of selected ideas

| Field | m07-incommon-edugain | m07-google-site-search | m07-visiting-scholar-sop |
|---|---|---|---|
| **Role in stack** | Tier 1 — fast-pass baseline | Tier 2 — long-tail complement | Tier 3 — last-resort escalation |
| **Mechanism** | O(1) hashmap lookup on pre-built InCommon + eduGAIN scope index | `site:<domain> "<name>"` query via web-search API | 3-step human SOP: web search → sponsor-PI email → visitors-office confirmation |
| **Signal type** | Domain-trust classifier (positive signal only; absence is uninformative) | Negative signal (no hits → manual review) + weak positive (substantive hits) | Corroboration of claimed appointment; at least 1 positive corroborator required |
| **Marginal cost** | ~$0.000 per check | $0.003–$0.045 per customer | $10–$30 per flagged customer + 3–5+ business days |
| **Setup cost** | $5–15K | $1–5K | $10–25K + $5K/yr maintenance |
| **Latency** | Instant | Seconds | 3–5+ business days (up to 2–3 weeks full escalation) |
| **Audit trail** | XML-DSig signed metadata; tamper-evident, re-verifiable years later | Stored JSON response with query, timestamp, full results | Full SOP outcome record, archived emails, analyst sign-off |
| **Primary flags** | `domain_in_incommon`, `domain_in_edugain`, `domain_no_federation` | `no_site_search_hits`, `low_quality_hits_only`, `name_collision` | `new_hire_zero_corroborators`, `sponsor_pi_denies_affiliation`, `research_office_unable_to_confirm` |
| **Coverage (domains)** | ~500 US InCommon + ~6,000 eduGAIN IdPs; excludes ~91% US HE by count, ~42–46% market (commercial), ~85% worldwide HE | Any search-engine-indexed institution; degrades for non-Anglophone, poorly indexed, new-hire lag | US R1 universities with visitors offices; degrades sharply outside this population |
| **Attacker stories caught** | Purpose-built orgs (8 branches): shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, dormant-domain | Negative-signal catches: inbox-compromise (alumni forwarder), dormant-account-takeover (fabricated persona without directory entry) | it-persona-manufacturing sub-path A (IT admin solo), sub-path C (departed member); inbox-compromise variants; dormant-account-takeover bypass C; dormant-domain (no live contacts) |
| **Structural blind spots** | All attackers on genuinely federated domains (9+ stories) | Self-controlled domains (8 branches); genuine insiders (7 branches) | Genuine visiting appointments; genuine insiders (5 branches); account-hijack self-confirmation loophole |
| **Key vendor/legal risk** | Legal basis for out-of-band KYC use of federation metadata unresolved | Google CSE sunsetting Jan 2027; Brave `site:` operator is "experimental" | PI non-response rate ~50–70%; ~40–60% of non-US institutions lack visitors offices |

---

## 2. Coverage gap cross-cut: structural vs. complementary

### Structural gaps (not addressable within M07)

These gaps are inherent to low-scrutiny affiliation checking. No composition of M07 ideas can close them.

| Gap | Nature | Affected stories |
|---|---|---|
| **Genuine insiders pass by definition** | Any person with real institutional employment, enrollment, or appointment has a genuine web presence, federation-domain email, and confirmable appointment. M07 cannot distinguish intent. | lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, unrelated-dept-student, account-hijack, credential-compromise (6 branches) |
| **Genuine visiting appointments** | visiting-researcher attacker obtains a real appointment; all three tiers return positive. | visiting-researcher, it-persona-manufacturing sub-path B (1–2 branches) |
| **Self-controlled domains require M09/M02** | Purpose-built-org attackers control their own domain; site-search confirms what they planted. Only institution-legitimacy checks (M09/M02) can distinguish attacker-owned from third-party domains. | All 8 purpose-built-org branches (addressed by Tier 1 federation lookup, but only because federation membership proxies for institutional legitimacy — the underlying dependency is on M09/M02) |

### Complementary gaps (closed by stack composition)

| Gap in one idea | Closed by | How |
|---|---|---|
| Federation lookup misses ~91% of US HE and ~42–46% commercial market | Site-search (Tier 2) | Covers any institution with indexed web presence; no per-institution adapter needed |
| Site-search misses new hires with zero web footprint (~20–40% in first 1–3 months) | Visiting-scholar SOP (Tier 3) | PI or visitors-office confirmation does not depend on web indexing |
| Site-search self-controlled-domain vulnerability | Federation lookup (Tier 1) | Purpose-built orgs cannot join R&E federations; federation match is a strong positive that bypasses site-search entirely |
| Federation lookup has no negative signal (absence is uninformative) | Site-search negative signal (`no_site_search_hits`) | Zero results on a verified third-party domain is actionable |
| Site-search zero-result flag overwhelms reviewers for poorly indexed institutions | Visiting-scholar SOP (Tier 3) applied selectively | SOP invoked only for SOC-eligible or first-ever orders, not routine |
| Visiting-scholar SOP is too slow/expensive for routine use | Federation lookup + site-search (Tiers 1–2) | Automated tiers resolve the vast majority of customers; SOP handles only the residual |

### Residual complementary gaps (not closed by any idea in the stack)

| Gap | Affected population | Severity |
|---|---|---|
| Non-Anglophone institutions with sparse index and no visitors office | ~23% of DNA synthesis market (APAC); ~2,585 Chinese, ~800 Japanese, ~400 Korean universities | High — all three tiers degrade simultaneously |
| Alumni-forwarder domain rollup policy undefined | inbox-compromise alumni variant | Medium — design decision needed |
| Role-mailbox handling | Core facilities using shared email (e.g., `genomics-core@university.edu`) | Medium — site-search cannot correlate individual to role address |

---

## 3. Bypass methods uncovered cross-cut

The following attacker stories survive the entire selected three-tier stack.

### Stories that pass all three tiers with zero resistance

| Attacker story | Profile | Why it survives | Persistent? |
|---|---|---|---|
| **lab-manager-voucher** | exploit-affiliation | Genuine employee with real email, directory listing, HR record. All tiers return clean affirmative. | Y |
| **bulk-order-noise-cover** | exploit-affiliation | Real core-facility staff at real institution. Role-mailbox variant adds attribution gap. | Y |
| **insider-recruitment** | impersonate-employee | Real insider uses own identity; handler invisible by construction. | Y |
| **unrelated-dept-student** | exploit-affiliation | Real enrolled student with real `.edu`, real directory entry, real federation credentials. | Y |
| **visiting-researcher** | fake-affiliation | Once real appointment issues, all corroborators (federation, web presence, PI, visitors office) return positive. | N (6–12 mo) |
| **it-persona-manufacturing sub-path B** | exploit-affiliation | Real visiting-scholar appointment with PI sponsor; manufactured persona has HR-matched record. | Y |

### Stories that pass Tiers 1–2 and are only partially caught by Tier 3

| Attacker story | Profile | Tier 3 outcome | Gap |
|---|---|---|---|
| **account-hijack** | exploit-affiliation | Self-confirmation loophole: attacker controls PI mailbox and can respond to step-2 email. Faculty-directory verification confirms PI is real, not that respondent is PI. | Requires M16 (MFA step-up) to close |
| **credential-compromise** | fake-affiliation | Same self-confirmation loophole as account-hijack. | Requires M16 |
| **it-persona-manufacturing sub-path D** | exploit-affiliation | HR-system injection produces full HR-matched identity; visitors office confirms. | Requires expert-level attacker; low probability but high impact |
| **foreign-institution** | hybrid | Non-Anglophone institution cooperation gap; visitors office may not exist; site-search degrades on non-Latin-script pages. | Residual gap; no M07 mitigation available |

### Stories caught by the stack (but dependent on M09/M02)

The following purpose-built-org stories are caught by Tier 1 (federation lookup rejects non-federated domains) **only if** M09/M02 has already established that the domain belongs to a genuine third-party institution. Without M09/M02, Tier 2 (site-search) confirms what the attacker planted.

- shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, dormant-domain (8 branches, all persistent supply chains)

---

## 4. Structural gaps flagged as open issues

### Issue 1: M07 is structurally unable to catch genuine insiders or real appointees

**Status:** Structural; not addressable within M07.

Six exploit-affiliation branches and one fake-affiliation branch (visiting-researcher) pass all three tiers with zero resistance because the attackers have genuine institutional affiliation. The entire M07 measure is a domain/institution-level check, not a person-intent check. Catching these stories requires higher-scrutiny measures: M15 (end-use verification), M18 (publication-record review), M19 (PI-level due diligence), M20 (order-pattern analysis).

### Issue 2: Cross-measure dependency on M09/M02 for purpose-built organizations

**Status:** Architectural; requires pipeline-level coordination.

The stack's ability to catch 8 purpose-built-org branches depends entirely on M09/M02 having already verified that the customer's domain belongs to a genuine third-party institution. Federation lookup (Tier 1) provides this implicitly (federation membership is a proxy for institutional legitimacy), but site-search (Tier 2) does not — it searches whatever domain the customer claims, including attacker-controlled domains. If M09/M02 has not run or has not flagged the domain, site-search will confirm fabricated affiliations.

**Design implication:** M07 Tier 2 must not execute until M09/M02 institution-legitimacy disposition is available. The pipeline must enforce this ordering constraint.

### Issue 3: Account-hijack self-confirmation loophole

**Status:** Implementation gap; partially addressable.

An attacker who controls a PI's mailbox can respond to the Tier 3 step-2 confirmation email, producing a false-positive corroboration. The SOP's faculty-directory verification confirms the PI is a real person but cannot confirm that the person responding is the PI. Closing this requires out-of-band verification (e.g., phone call to a directory-listed number) or M16 (MFA step-up authentication).

### Issue 4: Non-Anglophone institution coverage collapse

**Status:** Structural; all three tiers degrade simultaneously.

For non-OECD, non-Anglophone institutions (~23% of DNA synthesis market by revenue): Tier 1 has thin eduGAIN coverage; Tier 2 returns sparse or non-Latin-script results; Tier 3 cannot reach a visitors office (~40–60% of non-US institutions lack one). No M07 mitigation exists for this population. Possible mitigations live outside M07: accept federation-verified email from a known national R&E federation as a standalone signal; accept a signed letter on institutional letterhead; or route directly to M19/M20 escalation.

### Issue 5: Legal basis for federation metadata use in KYC

**Status:** Unknown; requires legal review.

The eduGAIN Constitution and metadata aggregation practice statement govern use by participating federations. Using the metadata out-of-band for KYC enrichment is neither explicitly authorized nor prohibited. This affects the deployment viability of Tier 1. No blocking finding has surfaced, but no affirmative authorization exists either.

### Issue 6: Vendor continuity for Tier 2

**Status:** Time-sensitive operational risk.

Google CSE sunsets January 1, 2027. Bing Web Search API retired August 2025. Brave Search API supports `site:` but labels it "experimental." SerpAPI is a Google SERP scraper with unclear long-term viability. The provider must integrate a replacement API and accept that `site:` operator behavior may differ across vendors. This is the most time-sensitive operational issue in the M07 stack.

### Issue 7: Visiting-scholar SOP false-denial rate

**Status:** Operational; limits SOP applicability.

The SOP's dependence on institutional cooperation produces high false-denial rates for legitimate customers: ~50–70% PI non-response, ~40–60% of non-US institutions lacking visitors offices, ~10–20% of US institutions refusing to confirm. This is acceptable only because the SOP is designed as a last-resort escalation for a small fraction of orders. If the SOP is applied more broadly (e.g., to all non-federated, non-site-searchable customers), the false-denial rate becomes a significant customer-experience and business risk.
