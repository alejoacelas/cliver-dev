# Measure 18 — Institution legitimacy (SOC): Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (of 12) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| m18-ror | ROR REST API v2 (~120K orgs, CC0) | $0 | Reviewer handles no-match, recent-record, and self-listed flags; commercial/international customers dominate queue | 9 (shell-nonprofit, shell-co, incubator, CRO, CRO-rotation, community-bio, gradual-legit, dormant-domain, foreign-inst) | Commercial/industrial R&D entities (~30–50%); under-represented regions (10–25%); community bio labs (~0%) | Long-term legitimacy accumulation (>2yr clears red flags); real-institution attacks (inbox/credential/IT-persona) |
| m18-gleif | GLEIF API (~2.8M LEIs, free, anonymous) | $0 | Light — most customers fire `no_lei` (informational); rare flags from lapsed/parent-chain/exception | 13 listed, but effective signal for <5% of academic + <10% of small commercial customers | <5% of universities have LEIs; 90–95% of small biotechs lack LEIs; `no_lei` is non-discriminatory | All purpose-built-org stories where entity lacks LEI; NON_CONSOLIDATING exception hides parent chain |
| m18-companies-house-charity | UK CH, Charity Commission, US SOS via OpenCorporates, IRS TEOS | $0.05–1/check | Reviewer handles name mismatches, foreign entities, determination-pending nonprofits, officer pattern analysis | 12 (all stories at legal-existence layer) | Entities outside US/UK (~50–65% globally); DE/WY/NM opacity; Scottish/NI charities | Gradual-legit (aged entity past recency threshold); foreign institutions outside US/UK; clean acquisition with no visible officer change |
| m18-nih-reporter | NIH RePORTER API v2 (free, no auth) | $0 | Reviewer categorizes by NIH eligibility; US biomedical with no funding is substantive; others are expected negative | 8 (shells, CROs, community labs — CAUGHT as unfunded; gradual-legit CAUGHT during buildup) | Foreign institutions (>95% no NIH record); commercial entities (80–90%); non-biomedical US institutions | Dormant-domain inherits defunct institution's NIH history; name-collision fuzzy-match bleed |
| m18-nsf-awards | NSF + UKRI + CORDIS (all free) | $0 | Same playbook as NIH but with jurisdiction-fit step; CORDIS substring matching needs care | 8 (same pattern as NIH; extends to UK/EU institutions) | Non-US/UK/EU institutions (~30–40%); commercial entities (~70–80%); teaching-only institutions | Dormant-domain inherits funding history; non-US/UK/EU coverage gap |
| m18-accreditation-stack | 9 public registries (CAP/CLIA/AAALAC/OLAW/ISO 17025/GLP/Global BioLabs) | $0.05–0.20/customer (analyst time) | Reviewer follows 7-step escalation; most flags are name-normalization misses or foreign FPs | 12 listed, but signal only when entity explicitly claims accreditation | 40–60% of customers hold no accreditation (check not triggered); foreign registries not covered; GLP has no consolidated list | Attacker simply avoids claiming accreditation — dominant low-cost strategy |
| m18-cross-shell-graph | Internal graph DB + CH/OpenCorporates/GLEIF/Censys/crt.sh/RDAP/NIH | $0.10–1/customer | Reviewer evaluates linked-entity panel with per-fingerprint signal weighting | 12 listed, but effective only against serial operators reusing infrastructure | Cold-start (zero signal for first-time operators); WHOIS registrant ~89% redacted; 80–90% of small commercial customers have sparse fingerprint sets | First-time operators; per-shell infrastructure isolation by well-funded attacker; single-entity patience strategies |
| m18-lookalike-domain | dnstwist + ROR domain corpus + crt.sh (all free/self-hosted) | $0 | Reviewer handles 3-case triage (impersonation/spinout/defunct); infrequent | 4 (shell-nonprofit partial, dormant-domain typosquat, inbox-compromise lookalike, foreign-inst partial) | ROR records without domains (~30%); commercial entities outside ROR (~40–60%); pre-aged domains defeat 90-day cert threshold | Exact domain acquisition; original domains not resembling any known institution; entity-name collision with non-similar domain |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

- **Real-institution identity-layer attacks (inbox-compromise, credential-compromise, it-persona-manufacturing):** Every idea in M18 validates the institution, not the individual. These three attacker stories pass all eight M18 checks because the institution is genuinely legitimate. This is a structural boundary of measure 18 as conceived — these threats belong to M19 (individual legitimacy) and M14/M16 (identity/authentication).

- **Long-term gradual-legitimacy-accumulation (>2 years):** ROR red flags clear as the entity accumulates cross-references. Registry checks show an aged, active entity. Funding checks show the entity as unfunded (expected for the cover type). The accreditation stack is not triggered if no accreditation is claimed. The cross-shell graph sees only one entity. The only persistent signal is the funding-check soft negative — which reviewers are trained to dismiss for startups, CROs, and small biotechs.

- **Foreign institutions outside US/UK/EU:** ROR has coverage gaps in under-represented regions (10–25%). GLEIF has near-zero coverage. Companies House / SOS registries do not cover them. NIH/NSF/UKRI/CORDIS have no signal. Accreditation registries are US/UK-centric. The cross-shell graph has sparse fingerprints. The lookalike detector has limited ROR domain coverage. An estimated 30–50% of synthesis-buying institutions fall in this combined blind spot.

### Complementary gaps

- **Commercial entities without ROR records:** ROR misses ~30–50% of commercial customers. But **companies-house-charity** (via OpenCorporates) and **gleif** (for the small fraction with LEIs) provide alternative legal-existence verification. The combination closes the gap for US/UK commercial entities, though DE/WY/NM opacity limits the signal.

- **Shell-entity detection beyond single-entity checks:** Individual registry checks (ROR, Companies House, accreditation) evaluate entities one at a time. The **cross-shell-graph** provides the unique capability of detecting cross-entity linkage (shared officers, hosting, certificates) that no single-entity check can see. However, it requires 1–2 years of screening history to become useful.

- **Dormant-domain attacks:** ROR status may not reflect closure. NIH/NSF/UKRI/CORDIS grants persist for defunct institutions. But **companies-house-charity** catches dissolved entities (strongest use case), and **lookalike-domain** catches typosquat variants. The combination partially covers the dormant-domain story, though exact-domain acquisition still evades the lookalike detector.

### Net coverage estimate

If a provider implemented all eight ideas: **some** legitimate customers would still fall in coverage gaps — concentrated in foreign institutions outside US/UK/EU, small commercial entities without ROR or LEI, community bio labs, and independent researchers. The combined stack effectively verifies institutional legitimacy for US/UK academic institutions (strong), US/UK commercial entities (moderate), EU academic institutions (moderate via CORDIS/UKRI), and large international entities with ROR records (moderate). It provides weak-to-no signal for non-OECD institutions (~30–50% of customers), community labs (~0% coverage), and the ~40–60% of customers who hold no queryable accreditation.

## 3. Bypass cross-cut

### Universally uncovered bypasses

- **Inbox-compromise, credential-compromise, it-persona-manufacturing:** All eight ideas pass because the institution is genuine. These are M19/M14/M16 problems.

- **Gradual-legitimacy-accumulation (>2 years, fully patient):** After sufficient time, all ROR red flags clear, registry checks show an established entity, funding checks produce expected negatives for the cover type, and the cross-shell graph sees a single, stable entity.

### Bypass methods caught by at least one idea

| Bypass | Catching idea(s) |
|---|---|
| Shell-nonprofit ROR self-listing | ror (ror_recent + ror_self_listed flags) |
| Shell-company build-from-scratch (<2yr) | ror (no-match or recent), companies-house-charity (recently-incorporated), nih-reporter + nsf-awards (unfunded) |
| Shell-company acquisition | companies-house-charity (officer patterns), gleif (lapsed LEI / parent chain), cross-shell-graph (shared officers) |
| CRO facade | ror (no-match), companies-house-charity (recency), accreditation-stack (overclaiming) |
| CRO identity rotation | cross-shell-graph (infrastructure reuse across shells — primary design target) |
| Dormant-domain (dissolved entity) | companies-house-charity (registry_dissolved — strongest signal), gleif (lei_lapsed), ror (ror_inactive if updated) |
| Dormant-domain (typosquat) | lookalike-domain (string similarity + cert age) |
| Foreign institution (fabricated) | ror (no-match), nih-reporter + nsf-awards (no funding) |
| Name-collision reflected legitimacy | ror (partial — ambiguous match), lookalike-domain (if domain similar) |

### Attacker stories where every idea fails

- **inbox-compromise** (real institutional email compromised)
- **credential-compromise** (real institutional credentials stolen)
- **it-persona-manufacturing** (IT admin creates real credentials at real institution)

These three are structural M19/M14/M16 responsibilities.

## 4. Bundling recommendations

**Tier 1 (foundational, all providers): ror + companies-house-charity + nih-reporter.** ROR is the institution-identity primitive ($0, sub-second). Companies House/SOS provides legal-existence verification and the strongest dormant-domain signal. NIH RePORTER provides the hardest-to-forge positive signal for US biomedical institutions. Total setup: ~$20K–$60K; per-check cost: ~$0.05–$1.

**Tier 2 (geographic extension): + nsf-awards.** Adds UK (UKRI) and EU (CORDIS) coverage for ~$0 additional per-check and ~1 engineer-day setup. Should be deployed alongside NIH RePORTER as a single multi-funder module sharing a name-normalization layer.

**Tier 3 (defense-in-depth): + cross-shell-graph + lookalike-domain.** The cross-shell graph is the only idea that detects CRO-identity-rotation and serial shell operators — a threat no single-entity check addresses. The lookalike detector is cheap ($0, ~1 engineer-day) and catches a narrow but high-signal impersonation class. Combined setup: $80K–$300K for the graph, ~1 day for the detector. The graph requires 1–2 years of screening history before becoming effective.

**Conditional additions:** GLEIF is worth including at near-zero cost ($0 API, ~$10K setup) for the niche where it provides unique signal (ownership-chain analysis for entities in the financial system), but it should never be framed as a primary check — `no_lei` fires for >95% of academic customers. The accreditation stack adds value only if the provider's screening workflow requires accreditation claims for certain order types; without this policy gate, attackers simply avoid claiming accreditation.

**Residual uncovered threats:** The identity-layer attacks (inbox/credential/IT-persona) require M19 individual-legitimacy checks. The long-term gradual-legitimacy-accumulation threat is only partially mitigable — defense-in-depth (ROR red-flag degradation over time + funding-check persistent negatives + cross-shell graph for rotation) slows but does not prevent a sufficiently patient attacker. The foreign-institution coverage gap is the largest by customer volume and has no clean implementation fix — it requires either adding non-Western registries (each a separate integration) or accepting differential verification standards by geography.
