# Stage 9 — Measure 02 (Email-Affiliation-WHOIS): Per-measure synthesis

## 1. Side-by-side table of selected ideas

| Field | m02-disposable-blocklist | m02-ror-domain-match | m02-rdap-age | m02-mx-tenant |
|---|---|---|---|---|
| **Primary signal** | Domain on disposable/free-mail list | Email domain vs. ROR institution record | Domain registration date, transfer recency | MX/SPF/DMARC + M365/Workspace tenant |
| **Customer segment** | All (outer gate) | Academic (~54%) | All | All (strongest on commercial) |
| **Automation level** | Fully automated (disposable = hard reject; free-mail = soft flag) | Automated pass on match; reviewer on mismatch | Automated flag on thresholds; reviewer adjudicates | Automated classification; reviewer on flag combos |
| **Marginal cost** | $0 | $0 | $0 | $0 |
| **Setup cost** | ~1 engineer-day | ~1 engineer-day | ~1 engineer-day | ~1-2 engineer-days |
| **External deps** | Static GitHub lists (MIT, community) | ROR v2 API (CC0, public) | RDAP bootstrap (public, free) | DNS + MS GetUserRealm (free, unauthenticated) |
| **Key flags** | `disposable_domain`, `free_mail_with_institution_claim` | `ror_domain_match` (pass), `ror_domain_mismatch`, `ror_inactive` | `domain_age_lt_12mo`, `domain_age_lt_3mo` (hold), `domain_recent_transfer` | `mx_generic_provider`, `dmarc_missing`, `m365_tenant_brand_mismatch` |
| **Attacker stories CAUGHT** | None in wg corpus (targets sub-modeled tier) | Typosquat, shell-nonprofit (domain mismatch) | Typosquat, dormant-domain drop-catch, fresh-domain purpose-built-orgs (temporarily) | Typosquat, dormant-domain self-hosted variant |
| **Attacker stories MISSED** | All 19 wg branches | 11 genuine-institutional-email; 6 purpose-built-org (`ror_no_record` suppressed) | 11 genuine-institutional-email; patient aged-domain purchasers | 11 genuine-institutional-email; 10 purpose-built-org with clean Workspace/M365 |
| **Primary FP sources** | Independent/developing-country researchers on free email (5-15%) | Multi-domain institutions (~10-20% of R1s); personal-email academics (5-15%) | Legitimate new startups <12mo (~5-10% of commercial) | .edu domains at `dmarc_p=none` (~50%); self-hosted non-US academics (15-25%) |
| **Open [unknown]s** | Developing-country free-email prevalence | ROR stale-URL prevalence; `domains[]` 98% empty | RDAP per-registry rate limits; ccTLD coverage (30-40% gaps) | GetUserRealm rate limits and ToS |

## 2. Coverage gap cross-cut

### Structural gaps (not addressable by any M02 idea)

| Gap | Nature | Affected stories | Resolution layer |
|---|---|---|---|
| **Genuine institutional email** | Attacker holds a real `.edu`/`.ac.*` mailbox — every M02 signal confirms them | 11 stories: inbox-compromise, credential-compromise, account-hijack, dormant-account-takeover, foreign-institution, it-persona-manufacturing, visiting-researcher, unrelated-dept-student, insider-recruitment, lab-manager-voucher, bulk-order-noise-cover | Measures 14 (identity proofing), 16 (account security), 19 (research-credential verification) |
| **Self-owned commercial domain with professional mail** | Attacker's LLC + custom domain + Workspace/M365 is indistinguishable from a legitimate small biotech | 6 stories: cro-identity-rotation, cro-framing, shell-company, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network | Measures 4/5 (address verification), 18 (org registry), 19 (research credentials) |

### Complementary gaps (addressable by combining selected ideas)

| Gap | Idea with gap | Complementing idea | Combined signal |
|---|---|---|---|
| Fresh domain not caught by ROR (no record, suppressed) | ror-domain-match | rdap-age | `ror_no_record` + `domain_age_lt_12mo` = elevated risk |
| Dormant-domain reanimation via drop-catch | ror-domain-match (may have stale record) | rdap-age | `domain_recent_transfer` on old domain = high-confidence dormant-domain flag |
| Self-hosted mail on reanimated domain | rdap-age (catches transfer but not mail infra) | mx-tenant | `domain_recent_transfer` + `mx_self_hosted_unverified` = strong combined signal |
| Shell-nonprofit with Workspace but young domain | mx-tenant (clean Workspace passes) | rdap-age | `domain_age_lt_12mo` + clean tenant = review |
| Free-mail on institutional claim | disposable-blocklist (flags it) | ror-domain-match | `free_mail_with_institution_claim` routes to ROR verification |
| DMARC p=none on .edu (noisy alone) | mx-tenant (~50% FP rate) | rdap-age or ror-domain-match | Fire `dmarc_p_none` only when paired with another risk signal |

## 3. Bypass methods uncovered: attacker stories surviving the entire selected stack

The following attacker stories pass **all four** selected M02 checks without triggering any actionable flag.

### Tier 1 — Structural pass (genuine institutional email; 11 stories)

These attackers hold real institutional mailboxes on real institutional domains. Every M02 check confirms their affiliation. No M02 improvement can address these.

| Story | How it survives the stack |
|---|---|
| **inbox-compromise** | Real `.edu` domain; passes ROR match, RDAP (old domain), MX (real institutional infra), not on blocklist |
| **credential-compromise** | Identical mechanism — compromised real PI email |
| **account-hijack** | Inherited fully-verified `.edu` mailbox from victim PI |
| **dormant-account-takeover** | IT admin controls real institutional mail channel; all 5 bypass sub-paths produce clean M02 signals |
| **foreign-institution** | Real `.ac.jp`/`.edu.br` mailbox; all 6 methods yield genuine institutional email |
| **it-persona-manufacturing** | IT admin creates fully-resolving institutional mailbox + directory entry on real `.edu` |
| **visiting-researcher** | Real R1 `.edu` mailbox issued by central IT after institution's own vetting |
| **unrelated-dept-student** | Real `.edu` email from enrollment; canonical institutional domain |
| **insider-recruitment** | Insider's own genuine `.edu` mailbox; handler invisible |
| **lab-manager-voucher** | Real institutional email + HR record; shared-account variant defeats per-individual tracking |
| **bulk-order-noise-cover** | Real R1 institutional mailbox or shared role-mailbox |

### Tier 2 — Patient purpose-built-org pass (6 stories)

These attackers register a custom domain with professional mail infrastructure. The stack catches them **only if** the domain is young (<12 months). Patient attackers who age their domain or purchase an aged domain at auction survive the entire stack.

| Story | Survival condition | Time/cost to survive |
|---|---|---|
| **gradual-legitimacy-accumulation** | Organic aging >12 months defeats RDAP threshold by design | 12+ months, ~$100/yr |
| **cro-identity-rotation** | Aged-domain purchase or 12+ months of patience | $100-$2,000 for aged domain, or 12+ months |
| **cro-framing** | Domain age >12 months (standard LLC setup timeline may naturally exceed this) | 12+ months, ~$100/yr |
| **shell-company** | Aged-domain purchase or organic aging | $100-$2,000 for aged domain |
| **biotech-incubator-tenant** | Domain registered 6-12 months before applying; or aged-domain purchase | 6-12 months + auction cost |
| **community-bio-lab-network** | Domain registered >12 months before signup | 12+ months, ~$100/yr |

**Note:** `shell-nonprofit` is partially caught by the stack. ROR domain-mismatch fires when the shell's domain differs from the name-collision institution's ROR-listed domain. However, if the attacker successfully games ROR self-curation (coordinated preprint submissions), this catch degrades.

### Tier 3 — Specific bypass variants

| Bypass | Surviving story | Why it survives |
|---|---|---|
| **Dangling-DNS subdomain takeover** | dormant-domain Bypass B | Apex domain belongs to real institution; RDAP, ROR, and MX all see the legitimate parent domain. Only the subdomain is compromised, invisible to all four checks. |
| **Aged-domain auction purchase** | dormant-domain Bypass A (variant) | If purchased >365 days ago and no transfer event in RDAP window, `domain_recent_transfer` does not fire. Domain age is old. |
| **ROR self-curation gaming** | shell-nonprofit (persistence variant) | Coordinated multi-author preprints create false affiliation history; if ROR approves, `ror_domain_match` gives a clean pass. |
| **M365 brand customization** | Any purpose-built-org with M365 | Attacker sets FederationBrandName to match claimed institution; `m365_tenant_brand_mismatch` does not fire. |

## 4. Structural gaps flagged as open issues

### Issue 1: The genuine-institutional-email wall
**Severity: Structural / measure-level**

Eleven attacker stories survive the entire M02 stack because they operate from within real institutional email infrastructure. This is not a gap in the selected ideas — it is a fundamental limitation of email-domain-based screening. The M02 measure can verify that an email domain belongs to a real institution; it cannot verify that the person using the email is who they claim to be, is authorized to order, or is acting in good faith. Resolution requires identity proofing (M14), account-security controls (M16), and research-credential verification (M19).

### Issue 2: The patient-domain-aging bypass
**Severity: Moderate / policy decision required**

Six purpose-built-organisation stories survive RDAP's 12-month threshold by either aging their domain organically or purchasing an aged domain at auction. Raising the threshold to 24 months would catch more patient attackers but would also flag ~10-15% of legitimate commercial customers (new biotech startups). This is a policy tradeoff that cannot be resolved technically within M02 — it requires a decision about acceptable false-positive burden on the commercial customer segment. The `domain_recent_transfer` flag partially mitigates the aged-domain-purchase variant but only catches transfers within the last 365 days.

### Issue 3: GetUserRealm endpoint legal and operational status
**Severity: Moderate / requires legal review**

The Microsoft GetUserRealm endpoint used by m02-mx-tenant has no published rate limits, no public terms of service, and no formal statement from Microsoft about permissible use for KYC/screening purposes. The endpoint is widely used by security tools and appears stable, but production reliance on an undocumented endpoint creates operational risk. A legal review of permissible use and a fallback strategy (e.g., OpenID configuration endpoint only) should be completed before deployment.

### Issue 4: ROR data sparsity
**Severity: Minor / design accommodation**

The ROR `domains[]` field is populated for only ~2.1% of records. The check effectively relies on website-apex comparison for ~98% of lookups, which fails for multi-domain institutions (~10-20% of R1 universities). This is not fixable by the provider — it is a property of the ROR dataset. The implementation should treat `domains[]` as bonus data and always fall back to website-apex comparison, with explicit handling for known multi-domain institutions (e.g., a supplementary internal mapping table).

### Issue 5: Non-Anglophone and developing-country coverage
**Severity: Minor / equity concern**

Three of the four selected checks produce elevated false-positive rates for non-US/non-Anglophone customers: ROR coverage is thinner outside the US/EU, RDAP falls back to unreliable WHOIS parsing for ~30-40% of ccTLDs, and MX-tenant flags self-hosted academic institutions (15-25% of non-US R1-equivalents). The disposable-blocklist free-mail flag disproportionately affects researchers in countries with weak institutional email infrastructure. A clear, low-friction alternative verification path must be defined for these populations to avoid systematic exclusion.

### Issue 6: Registrant-redaction noise
**Severity: Minor / implementation hygiene**

RDAP's `registrant_redacted` flag fires on ~89% of gTLD domains due to GDPR privacy proxies and redaction. It is essentially uninformative as a discriminator. The flag should be dropped from the production flag set or retained only as cosmetic metadata. Keeping it as an active flag will generate noise in reviewer queues and dilute attention from meaningful signals.
