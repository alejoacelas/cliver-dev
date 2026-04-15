# Run summary

Pipeline executed 2026-04-06. All 8 stages completed for 20 measures producing 103 implementation ideas (target ≤100).

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

Cross-measure deduplication consolidated shared data sources (ROR, GLEIF, OFAC SDN, NIH RePORTER, OpenAlex, ORCID, address validators, IDV vendors) to single owners with cross-references from dependent measures.

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

### Re-research triggered (Critical → resolved)

4 ideas received Critical findings that triggered one re-research loop (stage 4 v2 → 4F/4C v2 → stage 5 v2). All Critical findings were downgraded after re-research:

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

These are findings for policymakers: they represent limits of the measure itself, not deficiencies in any particular implementation.

---

## 5. Per-measure synthesis highlights

### Sanctions & identity screening (m01, m08, m14)

- **m01:** OFAC SDN + OpenSanctions union + daily delta re-screening recommended as core bundle. Commercial watchlists (World-Check/Dow Jones) add value only for non-SDN politically exposed persons. All 4 ideas share the structural gap: adversaries whose true identity is not on any list (the wg attacker set models this by construction).
- **m08:** BIS Consolidated Screening List is mandatory for US-jurisdiction providers. Adding OpenSanctions and World-Check extends non-US coverage. Zero attacker stories mapped (same structural gap as m01).
- **m14:** One vendor-IDV (Jumio or Onfido) + NFC ePassport + FIDO2 step-up recommended. Cross-tenant biometric dedup has a STRUCTURAL limitation (can't catch first-time fraud). 8 ideas provide the most implementation options of any measure.

### Email & domain provenance (m02)

- Core bundle: RDAP domain age + Wayback content history + ROR domain match + inbox roundtrip. Disposable-blocklist and MX-tenant fingerprinting add marginal signal. Free-mail users (academics between appointments, independent researchers) are a shared structural gap across all 7 ideas.

### Shipping & address (m03, m04, m05, m06)

- **m03:** Smarty/Melissa geocoding + PO box regex SOP covers the simple case. CMRA detection adds value for virtual mailbox services.
- **m04:** USPS RDI + Google Places business lookup. Shared gap: home-based legitimate researchers.
- **m05:** ROR/GLEIF canonical address + Google Places campus polygon + two-contact SOP. Community bio-labs and co-working spaces are structural gaps.
- **m06:** ISO country normalization + BIS country groups + HS/ECCN classification. Strongest deny-gate in the pipeline (hard block, no follow-up). Transit/transshipment via intermediary countries is the main bypass.

### Institution & affiliation (m07, m09, m12)

- **m07:** InCommon/eduGAIN federated login + Google site: search + visiting scholar SOP. Four of five ideas carry STRUCTURAL findings — this measure is fundamentally limited when the attacker has real institutional access (insider recruitment, visiting researcher, IT persona manufacturing).
- **m09:** Corporate registry stack + PubMed affiliation search + domain authentication. Shell companies with real legal registration are the shared gap.
- **m12:** PSP AVS + billing-shipping consistency + fintech denylist. Split-funding attacks (legitimate billing, separate shipping) are the main bypass.

### Payment (m10, m11)

- **m10:** Stripe BIN/funding-source lookup is sufficient as a single implementation. Gift card detection is well-solved technically; the zero-attacker-story mapping reflects that the wg adversaries don't use this vector.
- **m11:** PSP configuration audit (disable crypto rails) is a one-time setup, not a per-order check. Same zero-attacker-story pattern.

### Phone (m13)

- Twilio Lookup + Telesign PhoneID + callback SOP + periodic rebind cadence. VoIP detection is well-commoditized but easily bypassed by prepaid SIMs.

### SOC-specific (m15, m16, m17)

- **m15:** Structured declaration form + screening reconciliation + LLM extraction as automated stack. IBC attestation for SOC orders. Drift detector carries a STRUCTURAL finding (honest initial baseline assumption).
- **m16:** Auth0/Okta hosted IdP + WebAuthn hardware tokens + no-SMS-no-email-reset SOP + order-time step-up + dormancy re-IDV. Most comprehensive bundle in the pipeline (6 ideas).
- **m17:** Positive-verification SOP + event-driven reeval + predecessor re-IDV. IGSC shared list is structurally limited by voluntary participation. Event monitoring depends on public data availability.

### Legitimacy mechanisms (m18, m19, m20)

- **m18:** ROR + Companies House/Charity Commission + NIH RePORTER as foundational tier. NSF Awards, OpenCorporates, and domain authentication as supplementary. 8 ideas — most diverse data source pool. Shared gap: newly registered entities with minimal public footprint.
- **m19:** ORCID employments + OpenAlex author + faculty page scraping + role-vs-scope SOP. Strong for mid-career academics; weak for early-career researchers, industry scientists, and anyone outside the anglophone publication ecosystem.
- **m20:** Voucher IDV + ORCID OAuth + DKIM institutional email as identity layer (required). Voucher trust score + live video attestation as assessment layer. 3 of 8 ideas carry STRUCTURAL findings — voucher-based legitimacy is inherently limited by the honesty and competence of the voucher.

---

## 6. Pipeline statistics

| Metric | Value |
|---|---|
| Measures | 20 |
| Attacker stories mapped | 19 branches |
| Zero-coverage measures (no attacker stories) | 4 (m01, m08, m10, m11) |
| Ideation iterations total | 30 (20 measures × 1–2 iterations) |
| Candidates entering stage 3 | ~360 |
| Ideas surviving consolidation | 103 |
| Stage 4 implementations researched | 103 |
| Stage 4 re-researched (Critical hardening) | 4 |
| Stage 4F/4C first-pass rate | 96% (99/103) |
| Stage 5 STRUCTURAL findings | 11 ideas |
| Stage 6 coverage BOTECs | 103 |
| Stage 7 per-idea syntheses | 103 |
| Stage 8 per-measure syntheses | 20 |
