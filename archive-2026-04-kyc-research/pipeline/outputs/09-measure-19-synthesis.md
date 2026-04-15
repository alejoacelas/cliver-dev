# Measure 19 — Individual Legitimacy (SOC): Per-measure Synthesis

## 1. Side-by-side table of selected ideas

| Field | m19-openalex-author | m19-orcid-employments | m19-nih-nsf-pi | m19-faculty-page | m19-role-vs-scope |
|---|---|---|---|---|---|
| **Layer** | L1 — Broad bibliometric | L2 — Identity anchor | L3 — High-trust positive | L4 — Independent web presence | L5 — Human synthesis |
| **Signal type** | Publication metrics + affiliation history | Employment records (institution-verified vs self-asserted) | PI/co-PI grant records across 5 funders | Faculty/lab page on institutional website + Wayback freshness | Human reviewer judgment on role-scope plausibility |
| **Positive-signal strength** | Strong (when match exists with topic + affiliation alignment) | Near-conclusive (institution-verified, ~2% of records) / Weak (self-asserted, ~98%) | Near-conclusive (PI record = hardest credential to fabricate) | Moderate (independent evidence channel from bibliometric DBs) | Strong (PI contact via independently sourced info provides real friction) |
| **Negative-signal strength** | Weak (absence is non-denial; 15-25% non-publishing staff are invisible) | Weak (no ORCID = 20-40% of population; privacy-restricted indistinguishable from empty) | Weak by default; Strong when customer claims PI status and contradicts all 5 DBs | Weak (many institutions don't publish faculty pages; entire industry segment invisible) | Strong on flagged orders only (~5%); zero signal on unflagged orders (~95%) |
| **Population coverage** | ~40-60% of academic customers produce a usable match | ~60-80% have ORCID; ~2% have institution-verified affiliation | ~25-40% of senior researchers; ~0% of non-PI roles | ~50-70% of academic customers at web-publishing institutions | ~5% of orders (sequence-screening-flagged only) |
| **Key flags** | `openalex_affiliation_mismatch`, `openalex_topic_mismatch`, `openalex_no_author_found` | `orcid_institution_verified`, `orcid_self_asserted_only`, `orcid_recent` | `pi_record_present`, `no_pi_record` + claimed-PI contradiction, `pi_at_different_institution` | `faculty_page_present`, `faculty_page_recent_only`, `faculty_page_directory_mismatch` | `role_scope_implausible_high`, `role_scope_pi_unverifiable` |
| **Marginal cost/check** | ~$0 (free tier sufficient) | $0 (free public API) | $0 (all 5 sources free) | ~$0.01-$0.015 (PSE queries) | $50-$300 per flagged order; ~$0.50-$15 amortized |
| **Setup cost** | 2-4 engineer-weeks | ~1 engineer-day ($2k-$5k) | 1-2 engineer-days | ~1 engineer-day + migration before Jan 2027 | $5k-$15k (playbook + training) |
| **Hard dependencies** | OpenAlex API (freemium, CC0) | ORCID Public API v3.0 (free, OAuth) | NIH RePORTER, NSF, Wellcome, CORDIS, UKRI GtR-2 (all free) | Google PSE (**sunset Jan 2027**); Wayback Machine | Sequence screening output; PhD-trained reviewer staff |

## 2. Coverage gap cross-cut

### Structural gaps (shared by all or most ideas in the stack)

These gaps cannot be closed by adding more M19 ideas. They represent populations or attack surfaces that individual-legitimacy checks are structurally unable to address.

| Gap | Affected ideas | Size estimate | Why structural |
|---|---|---|---|
| **Role-authentic insiders** (lab managers, recruited insiders, bulk-order-noise-cover) | All 5 | Unknown but includes all insider-threat scenarios | Individual legitimacy is real; M19 verifies identity/role, not intent. Requires behavioral analytics (outside M19). |
| **Authentication-layer attacks** (account hijack, dormant-account takeover) | All 5 | Unknown | M19 validates the registered identity, not the current operator. These are M16 (authentication/access-control) concerns. |
| **Industry researchers without academic footprint** | OpenAlex, ORCID, PI lookup, Faculty page, Role-vs-scope | ~30-55% of customers by revenue | No publication record, no faculty page, non-academic titles. Requires institutional-level verification (M18/M20). |
| **Non-publishing academic staff** (technicians, core-facility staff) | OpenAlex, PI lookup, Faculty page | ~15-25% of academic order-placers | Absence in all databases is population-normal for these roles; no automated check can distinguish them from thin-footprint attackers. |
| **Early-career researchers** (0-3 publications, no grants) | OpenAlex, ORCID, PI lookup | ~10-20% of academic customers | Thin footprint is population-normal; thresholds that exclude attackers also exclude legitimate early-career researchers. |
| **Unflagged orders** (no sequence-screening trigger) | Role-vs-scope SOP | ~90-95% of orders | SOP triggers only on SOC-flagged orders. Fragment-assembly or sub-threshold orders are invisible to Layer 5. |

### Complementary gaps (addressable by composition across the stack)

| Gap | Which idea has it | Which idea covers it | Residual risk |
|---|---|---|---|
| **OpenAlex disambiguation (common names)** | OpenAlex | ORCID (ORCID iD resolves ambiguity) | Only ~8M of 114M OpenAlex authors have ORCID links; common names without ORCID remain ambiguous (5-15% of lookups). |
| **ORCID self-asserted-only weakness (~98%)** | ORCID | OpenAlex (provides independent corroboration); Faculty page (different evidence channel) | If attacker has seeded a preprint and has a self-asserted ORCID, corroboration from OpenAlex is fabricated. |
| **PI lookup null for non-PIs (~60-75%)** | PI lookup | OpenAlex + ORCID (cover broader population); Faculty page | Null PI result is expected; other layers provide signal for non-PI researchers. |
| **Faculty page null for weak-web-presence institutions** | Faculty page | OpenAlex + ORCID + PI lookup (bibliometric channels independent of web presence) | ~10-20% of academic customers at institutions without web pages; bibliometric checks compensate. |
| **IT-persona-manufacturing: directory entry but no lab page** | OpenAlex (no pubs), ORCID (recent flag) | Faculty page (`faculty_page_directory_mismatch` flag) | Attacker who also creates a lab page defeats this; Wayback freshness check provides a secondary barrier. |
| **Dormant-domain: stale web/publication artifacts** | Faculty page (Wayback pre-aging bypass) | OpenAlex (check recent institutional works); PI lookup (no real grants) | Cross-referencing Wayback timestamps with WHOIS data (m18) partially mitigates; a patient attacker who also seeds publications remains uncovered. |
| **Foreign-institution coverage asymmetry** | All automated checks (lower coverage for non-OECD) | Role-vs-scope SOP (human judgment can adapt) | SOP triggers only on flagged orders; unflagged foreign orders remain weakly covered. |
| **Claimed-PI contradiction** | Role-vs-scope SOP (needs structured signal) | PI lookup (`no_pi_record` + claimed-PI = strongest negative signal in the stack) | Name-collision false positive possible; ORCID disambiguator should be required. |

## 3. Bypass methods uncovered: attacker stories surviving the entire stack

For each attacker story in the measure-19 mapping, I assess whether the full five-idea stack catches, partially catches, or fails to catch the attack.

### Stories that fully survive the stack

| Attacker story | Why the entire stack fails | Structural or fixable? |
|---|---|---|
| **lab-manager-voucher** | Individual legitimacy is authentic. Real name, real HR record, real directory listing, non-publishing role is population-normal. All five checks pass on the merits. | **Structural.** M19 cannot bind intent to identity. Requires behavioral analytics or order-pattern monitoring (outside M19). |
| **insider-recruitment** | Recruited insider is a real, willing individual with genuine credentials. All checks validate the person, not their motive. | **Structural.** Same as lab-manager-voucher. |
| **bulk-order-noise-cover** | Established individual with real standing. SOC orders hidden within legitimate high-volume ordering. All checks validate the person; order-pattern analysis needed to detect anomaly. | **Structural.** Requires order-level behavioral analytics. |
| **account-hijack** | Hijacker inherits the legitimate PI's full credential set. M19 validates the registered identity. The hijack is invisible at the legitimacy-review layer. | **Structural for M19.** This is an M16 (authentication) concern. |

### Stories that partially survive the stack

| Attacker story | What the stack catches | What survives | Residual risk level |
|---|---|---|---|
| **visiting-researcher** | `orcid_self_asserted_only` fires; `openalex_no_author_found` or thin record noted; Role-vs-scope SOP can probe supervisory relationship. | If appointment is real (courtesy/visiting-scholar), all checks pass on the merits. Institution-piggyback + single preprint ($0-$240) + self-asserted ORCID clears all automated checks. SOP catches only if order is sequence-flagged AND reviewer contacts PI who denies. | **Moderate.** Stack provides friction but does not block a patient attacker with a real appointment. |
| **unrelated-dept-student** | `openalex_topic_mismatch` may fire if student publishes in unrelated field; Role-vs-scope SOP can catch visible department mismatch; Faculty page may show non-life-sciences department. | Grad-student footprint floor (0-3 pubs population-normal) means thin record is not actionable. Citing a rotation host PI provides plausible cover. Reflected institutional legitimacy carries the attacker. | **Moderate-high.** The stack's strongest tool (topic mismatch) depends on the student having published; most early-career students have not. |
| **it-persona-manufacturing** | `openalex_no_author_found` flags no publications; `orcid_recent` catches impatient variant; `faculty_page_directory_mismatch` catches IT-directory-only persona; PI lookup returns null. | Patient attacker who creates ORCID >60 days before, seeds one preprint, and has IT admin push institution-verified ORCID + create both directory entry and lab page defeats all automated checks. SOP catches only if sequence-flagged. | **Moderate.** Stack creates meaningful friction but a well-resourced institutional IT insider can defeat all layers. |
| **dormant-domain** | `faculty_page_recent_only` flags fresh pages; `no_pi_record` across all funders; `openalex_no_author_found` (if attacker has no real publications). | Pre-aged lab page via Wayback "Save Page Now" defeats freshness check. Attacker who seeds a preprint under the dormant institution creates an OpenAlex record. Name collision with former PI at defunct institution can produce false PI validation. | **Moderate.** Stack has multiple signals but each has a known bypass. Cross-referencing Wayback timestamps with WHOIS (m18) is the best available mitigation. |
| **dormant-account-takeover** | `pi_inactive_5yr` provides weak staleness signal; `openalex_affiliation_mismatch` if account holder has moved. | All checks validate the original account holder's identity, which is legitimate. The takeover is at the authentication layer. Not persistent supply chain. | **Moderate.** Weak signals exist but no definitive catch within M19. This is primarily an M16 concern. |
| **foreign-institution** | Role-vs-scope SOP can apply human judgment; PI lookup covers ERC/UKRI/Wellcome for some non-US researchers. | All automated checks have lowest coverage for non-OECD institutions: OpenAlex ~55-64% for non-English venues, ORCID adoption lowest in non-OECD, PI lookup covers only 5 Western funders, faculty-page search fails on non-English/non-indexed sites. | **High.** The stack is systematically weakest where this attack operates. Geographic coverage extension (more funders, better non-English search) would help but is incremental. |

### Stories where the stack provides strong (but not complete) defense

| Attacker story | Stack coverage | Residual gap |
|---|---|---|
| **it-persona-manufacturing (impatient variant)** | `orcid_recent` + `openalex_no_author_found` + `faculty_page_directory_mismatch` + null PI record = strong multi-layer signal. SOP escalation if sequence-flagged. | Only the patient, well-resourced variant with IT admin access survives. |

## 4. Structural gaps flagged as open issues

### Issue 1: Role-authentic insider blindness (structural, M19-irreducible)

All five checks verify that a person *is who they claim to be* and *could plausibly order* the material. None can detect that a legitimate person is ordering with malicious intent. This affects lab-manager-voucher, insider-recruitment, and bulk-order-noise-cover. No additional M19 idea can close this gap. Mitigation requires behavioral analytics, order-pattern anomaly detection, or end-use monitoring, all of which fall outside M19 scope.

**Recommendation:** Accept as a documented M19 boundary. Ensure the measure map explicitly assigns insider-intent detection to a different measure or flags it as an inter-measure gap.

### Issue 2: Authentication-layer attacks invisible (structural, M16 concern)

Account-hijack and dormant-account-takeover succeed because M19 validates the registered identity, not the current session operator. The stack provides only weak staleness signals (`pi_inactive_5yr`, stale affiliation).

**Recommendation:** Confirm M16 covers session integrity, re-authentication on sensitive orders, and dormant-account lockout. Flag as a cross-measure dependency.

### Issue 3: Early-career / non-publishing population indistinguishability (~15-30% of legitimate customers)

Thin footprints are population-normal for early-career researchers, technicians, lab managers, and industry scientists. Every automated check in the stack produces null or weak signal for this population, and that null signal is identical to the signal produced by several attacker stories (visiting-researcher, unrelated-dept-student, it-persona-manufacturing without preprint). The stack correctly treats absence as non-denial, but this means the automated layers provide zero discriminating power for roughly 15-30% of legitimate customers and the attacker stories that mimic them.

**Recommendation:** For this population, individual-legitimacy burden must shift to institutional-level verification (M18 institution-legitimacy, M20 institutional email/DKIM verification). Ensure the decision logic explicitly documents that when all M19 automated checks return null/weak, M18 and M20 signals are required for clearance.

### Issue 4: Foreign-institution coverage asymmetry (partially structural)

The stack is systematically weakest for non-OECD institutions: OpenAlex coverage drops to 55-64% for non-English venues, ORCID adoption is lowest outside OECD, PI lookup covers only five Western funders, and faculty-page search degrades on non-English and poorly indexed sites. The foreign-institution attacker story exploits exactly this asymmetry.

**Recommendation:** Extend PI lookup to include CIHR (Canada), ARC (Australia), DFG (Germany), and NSFC (China) as a medium-term roadmap item. For near-term, ensure the role-vs-scope SOP has explicit guidance for foreign-institution orders and that sequence-screening flagging does not under-trigger on foreign orders.

### Issue 5: ORCID disambiguator must be required, not optional

The m19-nih-nsf-pi synthesis notes that the ORCID-based disambiguator is described as "optional" but is the primary defense against the dormant-domain name-collision attack (where an attacker's name matches a former PI at a defunct institution). Without ORCID disambiguation, a false PI validation can occur.

**Recommendation:** Elevate the ORCID disambiguator from optional to required for PI lookup. When no ORCID is available and a PI record is found at an institution with suspicious signals (e.g., `ror_inactive`), flag as `pi_record_unverified`.

### Issue 6: Google PSE sunset (Jan 1, 2027) — hard dependency

The m19-faculty-page check depends on Google PSE, which is closed to new customers and will sunset for existing customers by January 2027. Without migration, Layer 4 becomes inoperable.

**Recommendation:** Begin migration planning to Bing Web Search API or a self-hosted search alternative immediately. This is not a bypass issue but an operational continuity requirement.

### Issue 7: Role-vs-scope SOP PI-contact method underspecified

The SOP's load-bearing mechanism — contacting the claimed PI via independently verified contact information — does not specify the verification method. If the reviewer uses customer-provided contact information, the check collapses against fabricated supervisory claims.

**Recommendation:** Specify in the SOP: (a) look up PI on institutional faculty directory or m19-faculty-page results; (b) use only directory-listed email or phone; (c) consider cross-linking to DKIM-verified institutional email from M20. Never use customer-provided PI contact information.

### Issue 8: Preprint-seeding bypass ($0-$240) defeats bibliometric layer

A single bioRxiv preprint creates a valid OpenAlex record with institutional affiliation, fully defeating the OpenAlex check. Combined with a self-asserted ORCID, this creates cross-source agreement between Layers 1 and 2 from fabricated evidence.

**Recommendation:** Implement a minimum-footprint threshold (e.g., `works_count >= 3` with at least one cited work) before treating an OpenAlex match as positive signal. Calibrate against false-positive rates on legitimate early-career researchers. Accept that this creates tension with Issue 3 (early-career indistinguishability) — the threshold is a policy design decision trading false negatives against bypass resistance.
