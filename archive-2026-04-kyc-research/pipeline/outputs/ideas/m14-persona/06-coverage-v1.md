# Coverage research: Persona Inquiry workflow (Government ID + Selfie + Database)

## Coverage gaps

### Gap 1: Researchers from countries with unsupported or thin document coverage
- **Category:** Legitimate researchers whose primary government-issued ID is not among Persona's supported types. Persona covers 200+ countries/territories [source](https://withpersona.com/product/verifications/government-id), comparable to Jumio and Onfido/Entrust. However, exact document subtype count is behind a dashboard login (coverage map requires a Persona plan) — the public-facing claim does not specify the number of document subtypes.
- **Estimated size:** [best guess: 2–5% of synthesis customers hold a primary ID that Persona does not support or handles with degraded accuracy. Reasoning: same OECD-concentration logic as Jumio/Onfido; Persona's 200+ country claim is comparable; the exact subtype depth is `[unknown — searched for: "Persona government ID number of document types supported", "Persona coverage map document subtypes total"]`.]
- **Behavior of the check on this category:** no-signal (`id_unknown_country` or `id_no_data_extracted`) or weak-signal
- **Reasoning:** Same as Jumio/Onfido — passport fallback resolves most cases.

### Gap 2: Non-Latin-script name mismatches
- **Category:** Researchers whose legal name is in a non-Latin script and whose synthesis-provider account uses a romanized form. Persona's `entity_confidence_score` and `entity_confidence_reasons` flag the mismatch.
- **Estimated size:** [best guess: 8–15% of global synthesis customers — structurally identical to Jumio/Onfido.]
- **Behavior of the check on this category:** false-positive (low `entity_confidence_score`, `entity_confidence_reasons` list name discrepancy)
- **Reasoning:** Persona does surface the confidence reasons, which may help the reviewer disambiguate. But the underlying problem — romanization mismatch — is the same as all document-IDV vendors.

### Gap 3: Database verification thin coverage outside OECD
- **Category:** Researchers in countries where Persona's database sub-providers have little or no coverage. Persona claims database verification in 40+ countries [source](https://withpersona.com/blog/bring-your-identity-verification-global), but the majority of the world (~150+ countries) has no database path. For those countries, the Database verification returns `fields_missing` or null.
- **Estimated size:** The synthesis market is OECD-heavy, but non-OECD customers are a meaningful minority. [best guess: 15–30% of international synthesis customers are in countries without Persona database coverage. Reasoning: 40 countries covers most OECD + large emerging markets (India, Brazil, Mexico, etc.) but excludes much of Sub-Saharan Africa, Central Asia, and smaller states.]
- **Behavior of the check on this category:** no-signal for the database layer (Government ID + Selfie still function, but the database cross-reference — a key IAL2 evidence element — is missing)
- **Reasoning:** This means the IAL2 evidence standard is harder to meet for non-database-covered countries. The provider may need to accept Government ID + Selfie alone as sufficient evidence for these countries, which is a lower bar.

### Gap 4: Facial similarity — age gap, head coverings, skin tone
- **Category:** Same structural profile as Jumio/Onfido: (a) aged photos, (b) head coverings, (c) skin-tone differential error rates.
- **Estimated size:** Same as Jumio/Onfido analysis. NIST FRVT 2024 data applies across vendors using top-tier algorithms [source](https://pages.nist.gov/frvt/html/frvt_demographics.html). [best guess: age-gap affects 20–40% of passport holders; head coverings 3–8%; skin-tone bias <0.5% incremental.]
- **Behavior of the check on this category:** false-positive (`id_face_match` failure or `selfie_liveness` failure)
- **Reasoning:** Persona's selfie check captures multiple poses (center, left, right), which may improve robustness for some edge cases vs. single-selfie vendors.

### Gap 5: `selfie_unique` cross-tenant collisions for legitimate multi-account users
- **Category:** Legitimate researchers who have multiple accounts at different institutions (e.g., a PI with positions at two universities, each with its own synthesis-provider account) and whose selfies trigger Persona's `selfie_unique` check — designed to detect multi-persona attacks but which can flag legitimate multi-affiliation users.
- **Estimated size:** [best guess: 1–3% of synthesis customers have legitimate multi-institutional accounts. Reasoning: dual appointments, visiting scholar positions, and consulting arrangements are common in academia; but most researchers order through a single primary account.]
- **Behavior of the check on this category:** false-positive (`selfie_unique` flag)
- **Reasoning:** This is a Persona-specific gap that Jumio/Onfido may not surface (they don't expose cross-tenant biometric matching by default). The synthesis provider must whitelist known multi-account users or disable the `selfie_unique` check for returning customers.

### Gap 6: `behaviors` signals — false triggers from privacy-conscious users
- **Category:** Researchers who use browser developer tools (for work reasons), VPNs, privacy extensions, or non-standard browser configurations that trigger Persona's `devtools_open`, `user_agent_suspicious`, or `request_spoof_attempts` behavioral signals — despite being legitimate users.
- **Estimated size:** [best guess: 5–10% of synthesis customers are technically sophisticated enough to trigger at least one behavioral signal. Reasoning: computational biologists, bioinformaticians, and CS-adjacent researchers frequently use dev tools and privacy-focused browser configurations.]
- **Behavior of the check on this category:** false-positive (behavioral flags that correlate with bot/automation detection but are triggered by legitimate power users)
- **Reasoning:** These signals should NOT be used as standalone denial reasons; they should only contribute to a composite risk score. The SOP must explicitly state this to prevent over-reliance on behavioral signals.

### Gap 7: No Kantara-listed IAL2 certification
- **Category:** All customers — this is a structural gap. Persona does NOT publicly claim Kantara-listed IAL2 certification (unlike Jumio and Entrust/Onfido). Persona references NIST 800-63 IAL definitions in its glossary but describes itself as configurable to *meet* IAL2, not certified to it [source](https://withpersona.com/identity-glossary/identity-assurance-levels-ial).
- **Estimated size:** Affects the regulatory posture for 100% of customers. Does not affect whether individual customers can complete the check.
- **Behavior of the check on this category:** no direct coverage impact on individual customers, but a compliance risk if the synthesis provider's M14 SOP requires a Kantara-certified trust framework provider
- **Reasoning:** If M14 mandates IAL2 certification (not just IAL2-equivalent configuration), Persona would not qualify without explicit regulatory guidance. This is a policy gap, not a technical gap.

## Refined false-positive qualitative

Updated from 04-implementation-v1:

1. **Non-Latin-script name mismatch** (Gap 2) — ~8–15% of global customers. Highest-impact operational FP.
2. **Database thin coverage** (Gap 3) — ~15–30% of international customers lack database cross-reference. Not a false positive per se but degrades evidence quality.
3. **Age-gap face mismatch** (Gap 4) — ~20–40% of passport holders with old photos.
4. **Behavioral signal false triggers** (Gap 6) — ~5–10% of technically sophisticated customers.
5. **Unsupported document types** (Gap 1) — ~2–5%.
6. **`selfie_unique` multi-account collisions** (Gap 5) — ~1–3%.
7. **Name changes** — ~1–3%/year (same as Jumio/Onfido).

## Notes for stage 7 synthesis

- Persona's coverage profile is broadly comparable to Jumio and Onfido for document + selfie checks. The key differentiators are: (a) database verification in 40+ countries (useful for OECD customers, absent for most non-OECD); (b) `selfie_unique` cross-tenant dedup (unique capability but produces FPs for multi-account users); (c) `behaviors` bot-detection signals (useful but noisy for power users).
- The lack of Kantara IAL2 certification is a significant regulatory gap if M14 mandates certification. The synthesis provider would need to self-attest that the Persona configuration meets IAL2 evidence requirements.
- The 40-country database coverage gap (Gap 3) is the most differentiated coverage issue — it means Persona's three-factor evidence model (document + selfie + database) degrades to two-factor for most non-OECD customers.
- Persona's Startup Program ($0 for 500 checks/month for one year) is the most accessible entry point for small synthesis providers, but the 2x pricing increase noted by Vendr in 2024 means the cost advantage may not persist.
