# M18 (institution-legitimacy-soc) — Per-measure synthesis

## Side-by-side comparison of selected ideas

| Field | m18-ror | m18-companies-house-charity | m18-nih-reporter | m18-nsf-awards | m18-lookalike-domain | m18-cross-shell-graph |
|---|---|---|---|---|---|---|
| **Tier** | 1 (Core) | 1 (Core) | 1 (Core) | 1 (Core) | 2 (High-value) | 2 (High-value) |
| **What it does** | Resolves institution to canonical ROR ID; surfaces structural red flags (recency, self-listing, inactivity) | Confirms legal existence via UK CH, Charity Commission, US SOS (OpenCorporates), IRS TEOS; detects dissolved/struck-off entities | Queries NIH RePORTER for funded-institution signal; unfakeable positive evidence of research legitimacy | Extends funded-institution signal to NSF, UKRI, CORDIS; geographic complement to NIH | Detects domain homoglyphs/typosquats against ROR domain corpus; high-signal impersonation catch | Internal graph of fingerprints across all screened entities; detects serial shell operators reusing infrastructure |
| **Marginal cost** | $0 | $0.05–$1.00 [best guess] | $0 | $0 | $0 | $0.10–$1.00 [best guess] |
| **Setup cost** | 0.5 engineer-day | $20K–$60K [best guess] | 0.5 engineer-day | ~1 engineer-day | ~1 engineer-day | $80K–$300K [best guess] |
| **Ongoing cost** | Negligible | OpenCorporates/KYB subscription | Negligible | Negligible | Negligible | $30K–$100K/year [best guess] |
| **Latency** | <1s | 1–3s | 1–2s | 3–5s (sequential) | ~3s | Depends on graph size |
| **Key flags** | `ror_no_match`, `ror_recent`, `ror_self_listed`, `ror_inactive` | `registry_dissolved`, `teos_revoked`, `registry_recently_incorporated`, `registry_no_record` | `no_nih_funding_5yr`, `nih_funding_active`, `nih_pi_count_anomaly` | `no_funder_record_5yr`, `funder_jurisdiction_mismatch`, `funder_pi_mismatch` | `domain_homoglyph_match`, `domain_levenshtein_le_2`, `domain_recently_issued_cert` | `cross_shell_shared_officer`, `cross_shell_shared_cert`, `cross_shell_shared_gleif_parent` |
| **Coverage scope** | ~120K research orgs; ~30–50% miss rate for commercial entities | US + UK legal entities; 50–65% of global institutions outside coverage [best guess] | ~2,500 NIH-funded institutions; >95% of foreign entities have no record | ~15,000–18,000 institutions across NIH+NSF+UKRI+CORDIS (with dedup overlap) | ~84,000 ROR records with domain fields | All previously screened entities (grows over time) |
| **Strongest signal** | Canonical identity resolution + structural red flags | `registry_dissolved` — detects defunct entities | Positive evidence of NIH funding (unfakeable) | Four-funder null = substantive negative for claimed research institution | Fresh domain resembling known institution = near-certain impersonation | Two+ independent fingerprint matches with prior denied entity |
| **Primary weakness** | No coverage for commercial/industrial entities; validates institution not individual | Confirms legal existence, which the attacker has deliberately constructed | Narrow coverage (~2,500 institutions); soft-flag design limits negative signal | Non-US/UK/EU gap (~30–40% of research institutions); dormant-domain inheritance | Zero signal against original domains; narrow scope by design | Cold-start (1–2 years to effectiveness); well-funded attacker can isolate per-shell |

## Coverage gap cross-cut

### Structural gaps (inherent to the stack's design)

These gaps cannot be closed by tuning parameters or adding data sources within the current stack.

1. **Institution-not-individual validation.** Every check in the stack validates the institution, not the individual. All three identity-layer attacker branches (inbox-compromise, credential-compromise, it-persona-manufacturing) pass all checks because the institution is genuinely legitimate. This is M19 territory by design, but it means M18 alone cannot catch an attacker operating inside a real institution.

2. **Non-US/UK/EU geographic coverage.** ROR has global reach but with significant gaps in under-represented regions. Legal-existence checks cover US/UK only (extensible to 140 jurisdictions via OpenCorporates). Funder checks cover US/UK/EU only. Asia-Pacific (~38% of the gene synthesis market), Latin America, Africa, and most of Asia have no funder coverage and limited legal-registry coverage. An estimated 30–40% of synthesis-buying research institutions and 50–65% of all institutions are outside the stack's strongest coverage zones.

3. **Commercial/industrial entity coverage.** ROR misses 30–50% of commercial customers. NIH/NSF/UKRI/CORDIS miss 70–90% of commercial customers. Legal-existence checks find these entities but confirm only that they exist — which is the easiest signal for an attacker to construct. The stack is structurally optimized for research institutions, not commercial entities.

4. **Cold-start for cross-shell graph.** The graph provides zero signal for first-time operators and needs 1–2 years of screening history to become effective. A new provider or one with thin history gets no cross-entity detection during the highest-risk period.

5. **Patient attacker degradation.** A gradual-legitimacy-accumulation attacker who invests 2+ years clears ROR red flags, builds aged legal entities, and (in theory) could even obtain small grants. The stack's time-based signals all decay as the attacker invests more lead time.

### Complementary gaps (addressed by combining ideas within the stack)

These gaps exist in individual ideas but are closed or narrowed by other ideas in the stack.

1. **ROR coverage gaps for commercial entities** → partially closed by Companies House/SOS/TEOS (confirms legal existence even when ROR has no record).

2. **Legal-existence check provides weak signal for well-constructed shells** → strengthened by funder checks (NIH/NSF/UKRI/CORDIS null across all four = substantive negative) and ROR red-flag features.

3. **NIH-only coverage for funded-institution signal** → extended by NSF + UKRI + CORDIS to UK and EU institutions.

4. **No single-entity check detects cross-entity patterns** → addressed by cross-shell graph (detects serial operators reusing infrastructure).

5. **Domain-level impersonation invisible to entity-level checks** → addressed by lookalike domain detector.

6. **ROR status lag for defunct institutions** → partially closed by `registry_dissolved` flag from Companies House/SOS/TEOS.

7. **Funder data inheritance for defunct institutions** → partially addressable by cross-referencing `project_end_date` and `registry_dissolved` across checks.

8. **Name normalization across funder sources** → shared normalization layer seeded from ROR aliases benefits all four funder sources.

## Bypass methods uncovered cross-cut

Which attacker stories survive the entire selected stack?

### Fully surviving bypass methods

| Attacker story | Bypass method | Why it survives the full stack |
|---|---|---|
| inbox-compromise | Real institutional domain/credentials | Institution is genuine; all M18 checks validate the institution, not the individual. Requires M19/M20 to catch. |
| credential-compromise | Real institutional credentials | Same as above — institution passes all checks natively. |
| it-persona-manufacturing | Fabricated persona at real institution | Same — institution is real; IT system has issued real credentials. |
| gradual-legitimacy-accumulation | Patient buildup (2+ years) | ROR red flags clear over time. Legal entity is aged and current. Funder nulls are soft flags. Cross-shell graph has no second entity to link. Only defense is composite soft-negative accumulation, which reviewers may discount. |
| shell-company | Clean acquisition (no dissolution, no officer change visible) | Acquired company has active legal status, potentially historical funding, and no fingerprint overlap if officers are replaced cleanly. No check in the stack detects a clean change of beneficial ownership. |
| dormant-domain | Exact lapsed domain acquisition (primary strategy) | ROR may not reflect closure (status lag). Defunct institution's NIH/NSF/UKRI/CORDIS grants persist. Lookalike detector sees an exact match, not a near-match. Legal-existence check catches dissolved entities (strongest defense) but only if entity was incorporated in US/UK. Cross-shell graph has no second entity. |
| cro-identity-rotation | Per-shell infrastructure isolation | Well-funded attacker uses different agents, officers, hosting, domains for each shell. Cross-shell graph finds no shared fingerprints. Each individual shell passes single-entity checks if well-constructed. |
| foreign-institution | Fabricated or misrepresented institution outside US/UK/EU | No funder coverage. No legal-registry coverage. ROR coverage is weakest in under-represented regions. Cross-shell graph has no data. |
| shell-nonprofit | Entity-name collision with non-similar domain | Name chosen to collide with real institution; domain is original (not a lookalike). ROR fuzzy match may bleed real institution's record. Legal-existence check finds the shell's own registration. Lookalike detector sees no domain similarity. |

### Partially surviving bypass methods

| Attacker story | Bypass method | Stack coverage | Residual gap |
|---|---|---|---|
| dormant-domain | Typosquat/lookalike fallback | Lookalike detector CATCHES this variant | Only if domain resembles a ROR-listed institution with a populated domain field |
| shell-company | Build entity signals from scratch | ROR flags as no-match or recent; legal-existence shows recent incorporation; funder null across all four | Composite soft negatives may not trigger hard rejection for entity types (CRO, startup) that reviewers expect to lack funding |
| shell-nonprofit | ROR self-listing | `ror_recent` and `ror_self_listed` flags fire; funder null fires | After 6+ months and with accumulated cross-references, red flags decay |
| cro-identity-rotation | Infrastructure reuse across shells | Cross-shell graph CATCHES this if fingerprints overlap | Only effective after cold-start period; defeated by per-shell isolation |
| dormant-domain | Defunct institution's grant inheritance | `registry_dissolved` catches if legal entity is in US/UK; `project_end_date` cross-check addressable | If entity was never incorporated or is outside US/UK, no check catches |

## Structural gaps flagged as open issues

### 1. Identity-layer blind spot (structural, by design)
All M18 checks validate institutions, not individuals. The three identity-layer attacker branches (inbox-compromise, credential-compromise, it-persona-manufacturing) are entirely outside M18's scope. **Resolution:** M19 (individual legitimacy) and M20 (institutional endorsement) must cover this. Not an M18 deficiency — it is a design boundary.

### 2. Non-US/UK/EU funder and registry coverage
The four-funder stack (NIH + NSF + UKRI + CORDIS) covers ~15,000–18,000 institutions concentrated in the US, UK, and EU. Asia-Pacific (~38% of market), Latin America, Africa, and most of Asia have zero funder coverage. Legal-existence checks are US/UK only (extensible via OpenCorporates to 140 jurisdictions, but this is configuration work, not yet implemented). **Resolution:** Extending OpenCorporates to non-US/UK jurisdictions is the lowest-cost near-term fix. Adding JSPS, NSFC, NRF, CNPq would require new integrations with potentially non-English, non-standardized APIs — a longer-term investment.

### 3. Dormant-domain primary strategy (exact domain acquisition)
This is the hardest-to-catch bypass in the stack. The attacker acquires the exact lapsed domain of a defunct institution — not a lookalike — and inherits ROR match, historical funder records, and residual web presence. The `registry_dissolved` flag is the strongest defense but only fires for US/UK incorporated entities. **Resolution:** Three mitigations should be prioritized: (a) cross-reference `project_end_date` on most recent grants to detect all-expired funding, (b) add `ror_stale_record` flag based on `admin.last_modified.date` staleness, (c) WHOIS registrant-change detection (new idea, not in current stack).

### 4. Patient attacker degradation (gradual-legitimacy-accumulation)
The stack's time-based signals (ROR recency, incorporation recency, funder null) all decay as the attacker invests more lead time. After 2+ years of preprint seeding, entity aging, and cross-reference accumulation, the shell can clear every automated flag. **Resolution:** No single check solves this. Defense-in-depth across ROR + funder + cross-shell is the recommended posture. The cross-shell graph is the last line of defense — but only if the attacker has prior entities in the database. A reviewer SOP for composite soft-negative escalation (no ROR, no funding, no legal issues, but also no positive evidence) is a policy-level mitigation.

### 5. Cross-shell graph cold-start
The graph provides zero detection for 1–2 years after deployment. **Resolution:** Historical backfill of all prior screening records partially mitigates. IGSC-level graph sharing across providers would dramatically reduce cold-start but raises governance, antitrust, and GDPR concerns that are outside engineering scope.

### 6. Delaware/Wyoming/New Mexico opacity
These states are the most popular US shell-company formation jurisdictions. Entities pass legal-existence checks but registry records reveal nothing about controllers (no officer names, no beneficial ownership). **Resolution:** Escalate DE/WY/NM entities to a secondary KYB service (Middesk, Cobalt) for direct SOS pulls. Require customer-provided officer names as a policy step.

### 7. Clean acquisition bypass
An attacker who acquires a going-concern company without visible officer changes or dissolution gaps passes every check in the stack. The entity has active legal status, potentially historical funding, and no cross-shell fingerprint overlap. **Resolution:** No check in the current stack catches this. Intra-entity fingerprint-change tracking (officer turnover, registrant change, hosting change within a single entity's history) is an implementable extension to the cross-shell graph.

### 8. Name-collision fuzzy-match bleed
Across both ROR and funder searches, loose fuzzy matching can validate a shell by bleeding a real institution's records into the search results. **Resolution:** Tighten fuzzy fallback to exact + alias-table matches for automated decisions; use fuzzy path only to suggest alternatives for human review.

### 9. Undefined operational thresholds
- `registry_recently_incorporated` recency window is not defined (6 months? 12? 24?).
- ROR affiliation-match score threshold (0.8) is a best guess, not empirically calibrated.
- Cert-age threshold for lookalike detector (90 days) may be too short given attacker pre-aging guidance of 2–6 months.

**Resolution:** All three require empirical calibration against historical screening data before operationalization.
