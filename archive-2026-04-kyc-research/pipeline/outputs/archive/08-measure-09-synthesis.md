# Measure 09 — institution-real-life-sciences: Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| **m09-corp-registry-stack** | Companies House, SEC EDGAR, OpenCorporates | $0.25–$1.50/check | ~5 min for SIC adjudication; ~10 min for no-match manual portal search | 11 (all 9 mapped + shell-company, dissolved-company) | Government/academic institutions absent from corporate registries (~39% academic, ~30–50% of govt) | Acquired dormant/going-concern entity inherits aged registration; time-aged entity waits out 12-month window |
| **m09-pubmed-affiliation** | NCBI E-utilities (PubMed), bioRxiv API | $0 | ~5 min for affiliation disambiguation on collision-risk cases | 9 (all mapped stories) | Industry CROs/for-profit biotech (30–50% of commercial customers never publish) | Pay-to-publish in PubMed-indexed journal ($1.5–3K) creates indistinguishable real record; dormant-domain historical trail |
| **m09-clinicaltrials-fda** | ClinicalTrials.gov v2, openFDA device registration | $0 | Near-zero (auto-pass on positive match; fall-through on absence) | 2 (shell-nonprofit, dormant-domain — positive corroboration only; 0 purpose-built-org stories caught) | ~60–80% of academic labs, ~70–85% of small biotech, 100% of DIY labs absent from both databases | All 6 purpose-built-org stories structurally absent; non-clinical entities invisible |
| **m09-registered-agent-denylist** | Internal denylist, Smarty CMRA, OpenCorporates | $0.05–$0.50/check | ~3 min for CMRA+agent combo; near-zero for agent-only (non-blocking) | 9 (all mapped; dormant-domain and foreign-institution limited) | Biotech incubator/co-working addresses not CMRA, not virtual office; non-US customers (~30–50%) entirely uncovered | Incubator bench space bypasses all flags; acquired entity with clean non-virtual address |
| **m09-irs-990** | IRS S3 990 data, ProPublica, optional Candid | $0 (baseline); $5–50/check (Candid) | ~5 min for NTEE/program review | 3 (shell-nonprofit, dormant-domain 501(c)(3) variant, community-bio 501(c)(3)) | Structurally N/A for ~80% of customers (for-profit, non-US, non-nonprofit) | Attacker self-selects life-sciences NTEE code at filing; 990-N filers (<$50K) have no program data |
| **m09-domain-auth-stack** | Public DNS, RDAP, optional DomainTools | $0 (baseline); ~$15.75/query (DomainTools escalation) | ~5 min for reanimated-domain investigation; near-zero for pass | 9 (all mapped stories) | Academic labs on parent-university subdomains (~39% of market) get trivial pass with no discriminating signal; ~80% of small domains lack DMARC | Aged-domain purchase ($50–$5K) defeats all time-based signals; Google Workspace makes mail-auth trivial in <1 hour |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Three customer categories appear in every idea's coverage-gap list or produce no-signal results across the board:

1. **Non-Anglophone/non-OECD institutions.** Corp-registry-stack has sparse OpenCorporates coverage for 40–60 jurisdictions. PubMed is 86.5% English. ClinicalTrials.gov/FDA are US-centric. The registered-agent denylist is US-only. IRS 990 is US-only. RDAP/WHOIS has ccTLD federation gaps in 30–50% of ccTLDs. No idea in the M09 suite provides reliable signal for a mid-tier Brazilian, Japanese, or Indian institution. This is a structural limitation of the measure itself, not fixable by implementation choice.

2. **Newly formed legitimate entities (<12 months).** Corp-registry-stack fires `registry_recent_incorp`. PubMed has no 5-year publication record. ClinicalTrials.gov/FDA are absent. The registered-agent denylist may fire on the formation service. IRS 990 has a 12–24 month filing lag. Domain-auth-stack fires `domain_recent`. Every idea flags these entities, but the flags are indistinguishable from those on shell companies — the measure cannot differentiate a real new biotech from a purpose-built shell during its first year.

3. **Community bio-labs / DIY / sole-PI consulting LLCs.** PubMed: no publications. ClinicalTrials.gov/FDA: 100% absent. Corp-registry: present but indistinguishable from shells. IRS 990: if 501(c)(3), revenue <$50K triggers `990_revenue_implausible`. Registered-agent denylist: may fire. Domain-auth: may pass (aged maker-space domain) or fire. The measure structurally cannot verify this customer class without accepting false-positive rates that would exclude them entirely.

### Complementary gaps

| Gap | Ideas where it is a gap | Ideas that close it |
|---|---|---|
| Government/academic institutions not in corporate registries | corp-registry-stack (39% academic, 30–50% govt) | pubmed-affiliation (strong positive for publishing institutions), clinicaltrials-fda (positive for clinical/regulatory institutions) |
| Industry CROs that never publish | pubmed-affiliation (30–50% of commercial) | corp-registry-stack (verifies legal existence + SIC), registered-agent-denylist (flags virtual-office CROs) |
| For-profit entities outside 990 scope | irs-990 (structurally N/A for 80%) | corp-registry-stack, pubmed-affiliation, domain-auth-stack all cover for-profits |
| Academic labs on parent subdomains | domain-auth-stack (trivial pass, no signal for 39%) | pubmed-affiliation (institution-level publications), corp-registry-stack (N/A for most academics but not harmful) |

### Net coverage estimate

If a provider implemented all six ideas, the customer categories still falling in a gap would be: (a) non-Anglophone/non-OECD institutions with sparse registry, publication, and regulatory data; (b) brand-new legitimate entities in their first year; (c) community bio-labs and sole-PI operations. Rough qualitative band: **some** (perhaps 15–25% of all customers) would still produce weak or no-signal results across the full suite. The academic and large-institution segments are well-covered by the PubMed + corp-registry combination. The commercial biotech segment is partially covered by corp-registry + domain-auth. The structural gap is concentrated in the non-Western and very-small-entity tails.

## 3. Bypass cross-cut

### Universally uncovered bypasses

Two bypass methods slip through every idea's check:

1. **Acquired dormant/going-concern entity** ($50K–$300K). Corp-registry: aged registration passes. PubMed: historical publications pass. ClinicalTrials.gov: historical trials pass. Registered-agent denylist: inherited clean address passes. IRS 990: inherited filing history passes. Domain-auth: inherited aged domain passes. No idea in the suite detects the ownership transfer — officer-change detection (suggested but not implemented in corp-registry-stack) is the nearest mitigation.

2. **Real foreign institution affiliation exploit.** All six ideas validate the institution, not the individual's affiliation with it. An attacker claiming to work at a real mid-tier foreign university passes every check because the institution is genuinely real and life-sciences-active. The measure as currently conceived does not address individual-affiliation verification (that is M07's domain).

### Bypass methods caught by at least one idea

| Bypass | Caught by | Not caught by |
|---|---|---|
| Fresh domain (<90 days) | domain-auth-stack | All others (they check institution, not domain) |
| Virtual office / CMRA address | registered-agent-denylist | All others |
| Dissolved/struck-off entity | corp-registry-stack (`registry_dissolved`) | All others (no equivalent liveness check) |
| bioRxiv-only preprints (no PubMed) | pubmed-affiliation (`pubmed_thin_biorxiv_present`) | All others |
| Dormant-domain reanimation | domain-auth-stack (`domain_reanimated` via DomainTools) | All others (PubMed/CT.gov may provide false positive evidence from historical records) |
| Name-collision reflected legitimacy | pubmed-affiliation (`affiliation_collision_risk`), corp-registry-stack (reviewer disambiguation) | clinicaltrials-fda (name-collision may produce false positive match) |
| Mass-formation registered agent | registered-agent-denylist | All others |

### Attacker stories where every idea fails

- **gradual-legitimacy-accumulation**: The branch is explicitly designed to wait out every time-based gate. After 12+ months, corp-registry passes, domain-auth passes, and the attacker can invest $1.5–5K in real PubMed publications. No idea in the suite reliably catches a patient, well-funded attacker who invests $30–70K and 9–12 months.
- **cro-framing** (after aging): The CRO cover story neutralizes PubMed absence ("CROs don't publish"), corp-registry passes (real LLC, real SIC code), registered-agent denylist may or may not fire depending on address choice, and domain-auth passes after 90 days. The branch's whole design exploits the fact that real small CROs and fake ones have identical M09 signatures.
- **foreign-institution**: Every idea validates the real foreign institution's existence; the attacker exploits the gap between institutional verification and individual-affiliation verification.

## 4. Bundling recommendations

### Recommended core bundle: corp-registry-stack + pubmed-affiliation + domain-auth-stack

These three ideas are complementary across their strongest coverage zones:
- **Corp-registry-stack** covers the legal-existence dimension for all incorporated entities, catches dissolved entities, and provides the SIC/NAICS signal.
- **Pubmed-affiliation** covers the life-sciences-activity dimension for academic and research institutions — the strongest positive signal in the suite for established entities.
- **Domain-auth-stack** covers the temporal dimension (domain age, registration gaps) and provides the only signal against dormant-domain reanimation (via DomainTools).

Together, they close each other's primary gaps: corp-registry misses academics (PubMed covers them); PubMed misses industry CROs (corp-registry covers them); domain-auth catches fresh/reanimated domains (neither of the other two checks this).

**Cost:** ~$0.25–$1.50/check (dominated by OpenCorporates) + $0 (PubMed) + $0 baseline / $15.75 escalation (DomainTools). Total: $0.25–$1.50/check routine, $15–$17 escalation.

### Recommended add-on: registered-agent-denylist

Worth including despite its high false-positive rate because it is the only idea that catches virtual-office and CMRA addresses — the cheapest shell-formation path. However, it should be treated as a composite signal contributing to a shell-pattern score (recent-incorp + virtual-office + no-PubMed + fresh-domain), never as a standalone flag. Its value is entirely conditional on the core bundle being present.

### Conditional add-on: irs-990

Include only for US nonprofit-claiming customers. Free baseline cost (IRS S3 + ProPublica) justifies inclusion despite the narrow scope (~10–20% of customers). The `990_program_not_life_sciences` flag provides a signal dimension (program description, NTEE code) that no other idea covers.

### Not recommended for the core bundle: clinicaltrials-fda

Zero cost and zero friction, but its coverage is too narrow to justify pipeline complexity. It fires as positive corroboration for ~20–30% of clinical/translational institutions but provides no signal for the ~70–85% of customers outside the clinical/regulatory pipeline. Its role is better served by the PubMed check, which covers a broader life-sciences footprint. If included, it should be weighted as a very minor positive-corroboration signal.

### Residual uncovered risk

Even the full bundle of all six ideas leaves three high-priority bypass patterns uncovered:
1. **Entity acquisition** ($50K–$300K) — no idea detects ownership transfer. Officer-change monitoring (Companies House only) is a partial mitigation.
2. **Patient gradual-legitimacy-accumulation** ($30–70K, 9–12 months) — the branch's whole design is to look indistinguishable from a real thin-signal small biotech after aging. The measure cannot solve this without rejecting all new small biotechs.
3. **CRO cover story** — identical M09 signature to real CROs. Requires M07/M18/M19 individual-legitimacy and accreditation checks to differentiate.

These residual risks are findings for policymakers about the measure's structural limits, not implementation gaps closeable by better tooling.
