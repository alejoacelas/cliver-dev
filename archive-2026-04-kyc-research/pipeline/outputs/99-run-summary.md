# Run summary

Pipeline executed 2026-04-06. All 10 stages completed for 20 measures producing 103 implementation ideas, of which 67 were selected for the final bundle.

---

## 1. Ideation iterations per measure

| Measure | Iterations | Stop reason |
|---|---|---|
| 01 — sanctions-name-screen | 1 | All ideas PASS on v1 |
| 02 — email-affiliation-whois | 2 | REVISE verdicts in v1; all PASS on v2 |
| 03 — shipping-po-box | 1 | All ideas PASS on v1 |
| 04 — shipping-residential | 2 | REVISE verdicts in v1; all PASS on v2 |
| 05 — shipping-institution-association | 2 | REVISE verdicts in v1; all PASS on v2 |
| 06 — shipping-export-country | 1 | All ideas PASS on v1 |
| 07 — institution-affiliation-low-scrutiny | 2 | REVISE verdicts in v1; all PASS on v2 |
| 08 — institution-denied-parties | 1 | All ideas PASS on v1 |
| 09 — institution-real-life-sciences | 1 | All ideas PASS on v1 |
| 10 — payment-bin-giftcard | 2 | REVISE verdicts in v1; all PASS on v2 (zero attacker stories — relevance gate vacuously satisfied) |
| 11 — payment-no-crypto | 1 | All ideas PASS on v1 |
| 12 — billing-institution-association | 2 | REVISE verdicts in v1; all PASS on v2 |
| 13 — phone-voip-check | 2 | 4 REVISE in v1 (merges, repositioning); all PASS on v2 |
| 14 — identity-evidence-match | 1 | All ideas PASS on v1 |
| 15 — soc-self-declaration | 1 | All ideas PASS on v1 |
| 16 — mfa-stepup | 1 | All ideas PASS on v1 |
| 17 — pre-approval-list | 2 | REVISE/DROP in v1; new ideas added, all PASS on v2 |
| 18 — institution-legitimacy-soc | 2 | 1 REVISE + 2 new ideas in v2; all PASS on v2 |
| 19 — individual-legitimacy-soc | 1 | All ideas PASS on v1 |
| 20 — voucher-legitimacy-soc | 1 | All ideas PASS on v1 |

10 measures converged in 1 iteration; 10 required 2. None reached the 3-iteration cap.

---

## 2. Ideas surviving stage 3, per measure

| Measure | Surviving ideas |
|---|---|
| m01 — Sanctions name screen | 4 |
| m02 — Email & WHOIS provenance | 7 |
| m03 — PO box detection | 3 |
| m04 — Residential vs business | 4 |
| m05 — Institutional address verification | 4 |
| m06 — Export country eligibility | 5 |
| m07 — Low-scrutiny affiliation | 5 |
| m08 — Institution denied parties | 3 |
| m09 — Institution real life-sciences | 6 |
| m10 — BIN gift card detection | 3 |
| m11 — No crypto funding | 3 |
| m12 — Billing-institution match | 5 |
| m13 — VoIP / disposable phone | 4 |
| m14 — Identity evidence IAL2 | 8 |
| m15 — SOC self-declaration | 5 |
| m16 — Account MFA + step-up | 6 |
| m17 — Pre-approval list curation | 5 |
| m18 — Institution legitimacy | 8 |
| m19 — Individual researcher legitimacy | 7 |
| m20 — Voucher legitimacy | 8 |
| **Total** | **103** |

---

## 3. Form / claim check pass rates

### Stage 4F + 4C (implementation research)

- **103 ideas** received form check (4F) and claim check (4C)
- **99 of 103** passed both on first iteration (96%)
- **4 ideas** required a second iteration after Critical stage-5 hardening findings triggered re-research:
  - m05-ror-gleif-canonical
  - m14-stripe-identity
  - m17-positive-verification-sop
  - m20-live-video-attestation
- All 4 passed 4F + 4C on v2

### Stage 6F (coverage form check)

- **103 ideas** received 6F form check
- All passed (no 6C claim checks were needed — coverage BOTECs used publicly verifiable proxy data)

---

## 4. Stage 5 hardening outcomes

### Re-research triggered (Critical -> resolved)

4 ideas received Critical findings that triggered one re-research loop (stage 4 v2 -> 4F/4C v2 -> stage 5 v2). All Critical findings were downgraded after re-research:

| Idea | Critical finding | Resolution |
|---|---|---|
| m05-ror-gleif-canonical | ROR alone misses shell entities with real legal registration | v2 added Companies House/SOS cross-check; downgraded to Moderate |
| m14-stripe-identity | Stripe Identity lacked liveness detection for credential-compromise branch | v2 confirmed Stripe's ML-based liveness; downgraded |
| m17-positive-verification-sop | Annual SOP missed mid-cycle account hijack | v2 added event-driven re-evaluation trigger; downgraded |
| m20-live-video-attestation | Video attestation defeatable by deepfake without additional binding | v2 added FIDO2 hardware token binding; downgraded |

### STRUCTURAL findings (routed to human review)

11 ideas carry STRUCTURAL hardening findings — bypass patterns inherent to the measure design that no implementation can fully address:

| Idea | STRUCTURAL finding |
|---|---|
| m07-google-site-search | Web scraping cannot detect if a listed person's credentials have been compromised |
| m07-incommon-edugain | Federated identity trusts the IdP — insider recruitment at the IdP defeats the check |
| m07-proxycurl-linkedin | LinkedIn profiles can be fabricated; IT-persona-manufacturing bypasses |
| m07-visiting-scholar-sop | Visiting scholar status is legitimate cover for foreign-institution branch |
| m14-cross-tenant-biometric-dedup | Biometric dedup cannot catch first-time fraudulent identities (no prior enrollment) |
| m15-drift-detector | Declaration drift depends on honest initial baseline; coordinated insider defeats it |
| m17-event-driven-reeval | Event monitoring depends on public data; covert acquisition goes undetected |
| m17-igsc-shared-list | Shared industry lists depend on voluntary participation; non-member providers create gaps |
| m20-orcid-oauth | ORCID OAuth proves account ownership, not that the researcher is who they claim offline |
| m20-voucher-idv | IDV confirms the voucher is a real person, not that their vouching is honest |
| m20-voucher-trust-score | Trust scoring cannot detect a voucher who is genuinely deceived by the applicant |

---

## 5. Stage 8 — Product prioritization: selection stats

| Measure | Ideas in | Selected | Dropped | Common drop reasons |
|---|---|---|---|---|
| m01 | 4 | 3 | 1 | Commercial watchlist: 5-50x cost, ~90% FP rate, near-zero biosecurity relevance |
| m02 | 7 | 4 | 3 | Inbox roundtrip (table-stakes, not signal); Wayback (redundant with RDAP); dangling-DNS (too narrow) |
| m03 | 3 | 2 | 1 | USPS RDI-CMRA: functionally subset of Smarty/Melissa |
| m04 | 4 | 2 | 2 | County assessor (same signal, higher cost); STR SOP (narrow, expensive) |
| m05 | 4 | 2 | 2 | Google Places campus (duplicates OSM polygon); incubator tenant (<1% firing surface) |
| m06 | 5 | 4 | 1 | Freight forwarder denylist (high curation cost, marginal incremental coverage) |
| m07 | 5 | 3 | 2 | Directory scrape (high maintenance); Proxycurl LinkedIn (ToS risk, self-asserted) |
| m08 | 3 | 2 | 1 | Commercial PEP/watchlist (disproportionate cost/FP for zero attacker-story engagement) |
| m09 | 6 | 3 | 3 | ClinicalTrials (too narrow); registered-agent denylist (high FP); IRS 990 (US nonprofits only) |
| m10 | 3 | 1 | 2 | Binlist stack (limited incremental); prepaid issuer denylist (severe FP from sponsor-bank ambiguity) |
| m11 | 3 | 2 | 1 | Crypto-debit BIN (overlaps m10, near-zero adversarial value) |
| m12 | 5 | 3 | 2 | P-Card BIN (false corroboration for LLC attackers); procurement network (too narrow, no APIs) |
| m13 | 4 | 4 | 0 | None — each occupies a distinct niche |
| m14 | 8 | 3 | 5 | Vendor redundancy (Onfido, Persona, Stripe Identity); federated IAL2 (40-60% exclusion); cross-tenant dedup (narrowest value, heaviest burden) |
| m15 | 5 | 4 | 1 | IBC attestation (30-60% FP on III-F exempt constructs, narrow international coverage) |
| m16 | 6 | 4 | 2 | WebAuthn-only mandate (prohibitive deployment); SpyCloud breach (low value when passkey-only) |
| m17 | 5 | 4 | 1 | IGSC shared list (all 7 stories missed, channel rarely used) |
| m18 | 8 | 6 | 2 | GLEIF (<5% LEI coverage); accreditation stack (dominant bypass: don't claim accreditation) |
| m19 | 7 | 5 | 2 | PubMed/Scopus (strictly weaker than OpenAlex); ClinicalTrials/FDA BIMO (too narrow) |
| m20 | 8 | 6 | 2 | Voucher IAL2 IDV (redundant with video attestation); composite trust score (no independent signal) |
| **Total** | **103** | **67** | **36** | |

**Selection rate:** 65% (67/103). The most common drop reason was functional redundancy with a cheaper or broader selected idea (16 of 36 drops). The second most common was narrowness — ideas addressing <15% of the customer population or <2 attacker stories (11 of 36 drops).

---

## 6. Per-measure synthesis highlights (Stage 9)

### Structural gaps by theme (consolidated from 20 measure syntheses)

1. **Genuine-insider intent detection** (m07, m14, m15, m17, m19, m20): The entire bundle verifies identity and affiliation but cannot detect malicious intent from genuinely credentialed individuals. This is the dominant structural limitation.

2. **Cross-provider information sharing** (m08, m17, m18, m20): An entity denied by one provider can order from 60+ others. No shared denylist exists. The single most impactful operational gap.

3. **Non-OECD / non-Anglophone coverage asymmetry** (m02, m04, m07, m09, m13, m18, m19, m20): Multiple checks systematically degrade for ~23-38% of the market. Creates equity concerns and disproportionate false-positive burden.

4. **Post-shipment redirect / re-export** (m03, m04, m05, m06): All address and export checks screen the declared first hop. Carrier redirect and transshipment are invisible.

5. **Purpose-built entities indistinguishable from legitimate customers** (m09, m18): Small CROs, community bio labs, and incubator tenants present profiles identical to their legitimate counterparts.

6. **Zero attacker-story engagement** (m01, m08, m10, m11): Four measures are not stressed by any modeled attacker story. Their value is regulatory compliance and defense-in-depth, not adversarial detection.

### Per-measure bypass survival

| Measure | Attacker stories surviving the full selected stack |
|---|---|
| m01 | 19/19 (all — no stories engage this measure) |
| m02 | 11/19 (genuine-institutional-email attackers pass cleanly) |
| m03 | 3 bypass methods survive (international PO boxes, CJK equivalents, hold-for-pickup) |
| m04 | 10 bypass methods survive (all commercial-address bypasses pass by design) |
| m05 | 5 bypass categories survive (carrier redirect, genuine affiliation, physical interception, accomplice, nominee) |
| m06 | All non-CIS foreign-institution methods survive for EAR99 orders |
| m07 | 6 stories pass all tiers (genuine insider/real appointee) |
| m08 | 19/19 (all — no stories engage this measure) |
| m09 | 8 bypass strategies survive (entity acquisition, time-aging, aged-domain, foreign-institution, CRO mimicry, etc.) |
| m10 | 19/19 (all — no stories engage this measure) |
| m11 | 0 (no stories route crypto to providers; stack unstressed) |
| m12 | 4 bypass patterns fully survive (inherited institutional billing, invoice/PO, driving-distance, account-hijack shipping) |
| m13 | 3+ categories survive (real mobile, burner SIMs, non-SIM-swap ATO) |
| m14 | 5 structural + 3 operational bypasses survive (fronted-accomplice, real-ID-throughout, multi-persona, etc.) |
| m15 | 7/14 stories fully survive (all alignment-by-construction patterns) |
| m16 | 2 bypass paths survive (cloud passkey injection, social-engineer support) |
| m17 | 3 high-residual methods survive (patient entity construction, rogue insider, own-identity attacker) |
| m18 | 9 fully surviving bypass methods (identity-layer attacks, patient buildup, acquisition, foreign institution, etc.) |
| m19 | 4 fully + 6 partially surviving stories (lab-manager, insider-recruitment, bulk-order-noise, account-hijack, etc.) |
| m20 | 12 persistent-supply-chain stories with surviving paths; 5 stories substantially blocked |

---

## 7. Stage 10 — Bundle spec summary

### Total checks in the bundle

| Integration point | Automated checks | Human escalation SOPs |
|---|---|---|
| Account creation (onboarding) | 22 | 2 |
| Order submission | 17 | 3 |
| Periodic / maintenance | 9 | — |
| SOC-specific | 17 | — |
| **Total distinct checks** | **65** | **5** |

### Shared infrastructure (consolidated integrations)

10 shared integrations serve multiple measures: OpenSanctions, ROR, Smarty/Melissa, CSL, Hosted IdP (Auth0/Okta), Jumio IDV, Twilio+Telesign, PSP, sequence screening, bibliometric stack (OpenAlex/ORCID/funders).

### Estimated per-order cost

| Component | Low | High |
|---|---|---|
| Automated all-orders checks | $0.24 | $20.19 |
| Amortized onboarding | $0.01 | $0.04 |
| SOC-specific (blended at 5%) | $1.25 | $5.18 |
| Periodic/maintenance | $0.03 | $0.14 |
| **Total blended per-order** | **~$1.53** | **~$25.55** |

Typical mid-market provider (~5% SOC rate, 3-5 lines/order): **$2-$8 per order**.

Dominant cost drivers: sequence screening ($0.20-$2/line) and SOC-specific human review (role-vs-scope SOP, video attestation). Automated KYC checks are <$0.25/order.

### Setup cost

- Full deployment: $380K-$1.1M, ~80-170 engineer-weeks
- Phased MVP (compliance-mandatory + high-signal automated): ~$150K-$300K, ~30-60 engineer-weeks

### Structural gaps (no check addresses)

12 consolidated gaps documented in `10-bundle-spec.md`:
1. Genuine-insider intent detection
2. Post-shipment carrier redirect / physical interception
3. Re-export / transshipment invisibility
4. EAR99 items to Group D destinations
5. Cross-provider information sharing (most impactful)
6. Non-OECD / non-Anglophone coverage asymmetry
7. Invoice / PO / wire orders invisible to payment controls
8. Knowing-complicit voucher (M20 irreducible)
9. Cloud account compromise enabling synced passkey injection
10. Purpose-built entities structurally identical to legitimate customers
11. Novel / engineered sequences not in screening databases
12. Programmatic / API ordering bypasses browser-based controls

---

## 8. Pipeline statistics

| Metric | Value |
|---|---|
| Measures | 20 |
| Attacker stories mapped | 19 branches |
| Zero-coverage measures (no attacker stories) | 4 (m01, m08, m10, m11) |
| Ideation iterations total | 30 (20 measures x 1-2 iterations) |
| Candidates entering stage 3 | ~360 |
| Ideas surviving consolidation (stage 3) | 103 |
| Stage 4 implementations researched | 103 |
| Stage 4 re-researched (Critical hardening) | 4 |
| Stage 4F/4C first-pass rate | 96% (99/103) |
| Stage 5 STRUCTURAL findings | 11 ideas |
| Stage 6 coverage BOTECs | 103 |
| Stage 7 per-idea syntheses | 103 |
| Stage 8 ideas selected | 67 (65% selection rate) |
| Stage 8 ideas dropped | 36 |
| Stage 9 per-measure syntheses | 20 |
| Stage 10 bundle checks | 65 automated + 5 human SOPs |
| Stage 10 shared integrations | 10 |
| Stage 10 structural gaps | 12 |
| Estimated per-order cost (typical) | $2-$8 |
| Estimated full setup cost | $380K-$1.1M |
