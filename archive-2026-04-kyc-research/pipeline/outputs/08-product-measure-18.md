# M18 (institution-legitimacy-soc) — Product prioritization

## Selected stack

### Tier 1: Core (implement first)

#### 1. ROR Research Organization Registry (`m18-ror`)

ROR is the foundational identity primitive for the entire M18 stack. At $0 marginal cost, sub-second latency, and half an engineer-day of setup, it provides the canonical institution-identity resolution that every other check references. Its red-flag feature extraction (record age, relationship count, cross-ID count, self-listing indicators) catches shell-nonprofit and shell-company stories at the cheapest possible cost. The coverage gap for commercial entities (~30-50% miss rate) and under-represented regions is real but expected — ROR is not meant to be a standalone gate, it is the anchor point that other checks extend. Every downstream idea (NIH, NSF, accreditation, cross-shell graph) benefits from ROR's alias table and canonical IDs. This is the first thing to build.

#### 2. UK CH + Charity Commission + US SOS + IRS TEOS (`m18-companies-house-charity`)

Legal-existence verification is the necessary complement to ROR's research-institution focus. This check covers the commercial and nonprofit entities that ROR misses. Its strongest signal is detecting dissolved/struck-off entities — the primary defense against the dormant-domain attacker story, which is otherwise the hardest to catch. The `registry_dissolved` flag, `teos_revoked` flag, and `registry_recently_incorporated` flag together form the legal-status layer. The US/UK geographic limitation (50-65% of institutions outside coverage) is mitigated by OpenCorporates' 140-jurisdiction reach, which is a configuration extension, not a new integration. At $0.05-$1.00 per check and $20K-$60K setup, the cost is moderate but the signal is essential — no other check in the stack confirms or denies that the legal entity behind the customer's claim actually exists and is currently active.

#### 3. NIH RePORTER funded-institution signal (`m18-nih-reporter`)

NIH funding is the hardest-to-forge institutional legitimacy signal in the stack. An attacker cannot game this check without literally obtaining a federal research grant. At $0 marginal cost and half an engineer-day of setup, it delivers the highest signal-to-cost ratio of any idea. The coverage is narrow (~2,500 institutions) but for those institutions, the positive signal is definitive. The soft-flag design is correct: `no_nih_funding_5yr` is informational for non-biomedical/non-US entities, but a US biomedical academic with zero NIH funding in five years is a substantive escalation trigger. The dormant-domain inheritance bypass (defunct institution's grants persist) is addressable with a `project_end_date` cross-check.

#### 4. NSF + UKRI + CORDIS funded-institution signal (`m18-nsf-awards`)

This is the geographic extension of NIH RePORTER and should be evaluated as a unit with it. At $0 marginal cost and ~1 engineer-day of setup, it extends the unfakeable funded-institution signal to UK (UKRI, ~10,920 organisations) and EU (CORDIS, ~4,641 organisations across 162 countries). The four-funder disjunction (NIH + NSF + UKRI + CORDIS) covering ~15,000-18,000 distinct institutions gives the reviewer a powerful composite: a claimed research institution with zero public funding across all four major Western funders is a substantive negative. The incremental engineering cost over NIH alone is trivial, and the shared name-normalization layer (seeded from ROR aliases) benefits all four sources. The `funder_jurisdiction_mismatch` flag adds a cross-checking dimension unavailable from any single funder.

### Tier 2: High-value additions (implement after core)

#### 5. Lookalike / homoglyph institutional-domain detector (`m18-lookalike-domain`)

The narrowest check in the stack but with an exceptional signal-to-noise ratio when it fires. A fresh domain that closely resembles a known institution is almost certainly malicious. At ~1 engineer-day of setup and $0 marginal cost, it is the cheapest defense against the typosquat/impersonation branch of the dormant-domain and inbox-compromise stories. It pairs naturally with ROR (uses the ROR domain corpus as its reference set) and with m02 domain-age checks. The structural limitation — zero signal against original domains — is expected; this check defends a specific, high-confidence attack surface rather than providing broad coverage. Include it because it is cheap, composable, and catches an attack class that no other M18 check addresses.

#### 6. Cross-shell rotation graph (`m18-cross-shell-graph`)

The only check in the stack that detects cross-entity patterns — the linkage between serial shells that no single-entity verification can see. It is the primary defense against the CRO identity rotation story and adds signal to shell-nonprofit and shell-company serial operators. The cold-start problem (1-2 years of screening history needed) and the high setup cost ($80K-$300K) make it a Tier 2 investment. However, the graph's value compounds over time: every screened customer enriches the graph, and the strongest fingerprints (shared CT cert, shared officer with DoB, shared GLEIF parent) are genuinely hard for attackers to avoid reusing. Recommend building the graph schema and ingestion pipeline in parallel with Tier 1, but treating it as operationally effective only after sufficient data accumulates. The mass-formation-agent discount list and cloud-hosting noise filter require ongoing maintenance that should be budgeted.

## Dropped ideas

- **m18-gleif (GLEIF LEI lookup):** Structural mismatch — fewer than 5% of universities and 90-95% of small biotechs have LEIs, rendering the `no_lei` flag non-discriminatory for the vast majority of synthesis customers; the Level-2 parent-chain signal is valuable but fires too rarely to justify the $10K-$20K integration cost as a standalone check; the ownership-chain analysis it provides is better consumed as a fingerprint dimension within the cross-shell graph (which already ingests GLEIF parent edges) rather than as an independent check.

- **m18-accreditation-stack (Accreditation registry stack):** The dominant attacker strategy is to simply not claim any accreditation, fully bypassing the check; 9 of 18 assessed bypass methods are entirely missed; setup cost ($30K-$100K) is high for a claim-verification tool that fires only on affirmative claims; the GLP registry (weakest link) has no consolidated public list; and the BSL-3 flag fires on 96% of legitimate BSL-3 labs, creating reviewer desensitization risk.

## Composition note

The selected stack forms three complementary layers. **Layer 1 (identity resolution):** ROR resolves the institution to a canonical ID and surfaces structural red flags (recency, self-listing, inactivity). **Layer 2 (legal and funding verification):** Companies House/SOS/TEOS confirms the entity exists as a legal entity with active status, while NIH/NSF/UKRI/CORDIS provides unfakeable positive evidence of research legitimacy. **Layer 3 (pattern and impersonation detection):** The lookalike detector catches domain-level impersonation of known institutions, while the cross-shell graph catches serial operators reusing infrastructure across rotating shells.

The reviewer workflow proceeds as: ROR resolution first (establishes whether the institution is known); then legal-existence and funding checks in parallel (confirms active legal status and public funding history); then lookalike and cross-shell checks (catches impersonation and rotation patterns). A customer who passes all layers has a documented, canonical institution ID, confirmed legal existence, and no cross-entity linkage to prior denied entities. A customer who fails multiple layers — no ROR match, no legal registration, no public funding, and shared fingerprints with a prior denial — presents a compounding negative signal that the reviewer can act on with confidence.

The GLEIF parent-chain data is not lost by dropping the standalone GLEIF idea: the cross-shell graph already ingests GLEIF Level-2 parent/ultimate-parent edges as a fingerprint dimension, preserving the ownership-transparency signal for the ~5% of entities that have LEIs without the cost of a separate integration and reviewer workflow. Similarly, accreditation verification can be added later as a policy-gated extension if the screening workflow evolves to require accreditation claims for certain order types (e.g., select-agent-relevant sequences), but it should not be in the initial build given its structural bypass vulnerability.
