# Coverage research: Onfido (Entrust Identity Verification) Studio workflow

## Coverage gaps

### Gap 1: Researchers from countries with unsupported or thin document coverage
- **Category:** Legitimate researchers whose primary government-issued ID is not among Onfido/Entrust's supported document types. Entrust claims coverage across 195 countries with 2,500+ document types [source](https://www.entrust.com/products/identity-verification/document-verification/supported-documents), but coverage depth varies by country — some countries have only passport support, not national IDs or driver's licenses.
- **Estimated size:** Similar to Jumio: the DNA synthesis market is ~80%+ OECD-concentrated [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799). Entrust's 195-country / 2,500-document coverage is narrower in document subtypes than Jumio's 5,000+, which may mean more frequent `unidentified` results for sub-national documents. [best guess: 3–7% of synthesis customers hold a primary ID that Onfido either does not support or handles with degraded accuracy — slightly higher than Jumio due to fewer supported subtypes.]
- **Behavior of the check on this category:** no-signal (`result = unidentified`) or weak-signal (OCR extraction without template matching)
- **Reasoning:** Fallback to passport resolves most cases. Hard exclusion only for customers with no supported document at all.

### Gap 2: Non-Latin-script name mismatches between document and account record
- **Category:** Researchers whose legal name on the government ID is in a non-Latin script (Arabic, Chinese, Japanese, Korean, Cyrillic, Devanagari, etc.) and whose synthesis-provider account record uses a romanized form. Onfido's `data_comparison` check flags the mismatch.
- **Estimated size:** [best guess: 8–15% of global synthesis customers would face this issue — same estimate as Jumio, since the underlying population and data-comparison logic are structurally identical.]
- **Behavior of the check on this category:** false-positive (`data_comparison` flag or `consider` result)
- **Reasoning:** Requires transliteration-aware name matching at the synthesis-provider level. Without it, chronic false positives for East Asian, Middle Eastern, and South Asian researchers.

### Gap 3: Facial similarity bias — age gap, head coverings, skin tone
- **Category:** (a) Customers with ID photos >5 years old. (b) Customers wearing head coverings for religious/medical reasons. (c) Customers with darker skin tones where face-match algorithms show differential error rates.
- **Estimated size:** Same structural profile as Jumio Gap 3. NIST FRVT 2024 shows top algorithms at >99.5% accuracy across demographics with narrowing gaps [source](https://pages.nist.gov/frvt/html/frvt_demographics.html). [best guess: age-gap is the largest driver, affecting 20–40% of passport holders with >5-year-old photos; head coverings affect 3–8%; skin-tone incremental bias <0.5% for top-tier algorithms.]
- **Behavior of the check on this category:** false-positive (face comparison `consider` or `no_match`)
- **Reasoning:** Onfido's Motion capture provides multiple frames which may slightly improve face-match robustness for head-covering cases compared to single-selfie vendors, but the age-gap issue remains structural.

### Gap 4: Injection attack surface when Motion is not enabled
- **Category:** Synthesis providers who integrate Onfido with Facial Similarity Standard rather than Motion. Standard liveness is a single selfie with passive checks; Motion requires a video with head movements + injection detection. If the provider uses Standard only, camera emulators and network-injected deepfakes can pass.
- **Estimated size:** This is a configuration gap, not a population gap. Entrust reports deepfake attacks occur "every five minutes" [source](https://www.biometricupdate.com/202411/deepfake-attacks-now-occur-every-five-minutes-entrust-report-warns). If Motion is not enabled, the check gives a false-pass (not a false-positive) to injection-attack fraudsters. [best guess: all SOC-order IDV integrations should mandate Motion; Standard is inadequate for the threat model.]
- **Behavior of the check on this category:** false-negative (fraudsters pass as legitimate)
- **Reasoning:** Not a coverage gap in the population sense but a critical configuration requirement. Including here because it affects the check's reliability for the entire customer base.

### Gap 5: Low-bandwidth / low-end device capture failures
- **Category:** Researchers in low-bandwidth environments or using older devices that cannot complete the Motion video capture (requires sustained video stream + head movements).
- **Estimated size:** [best guess: 5–10% of synthesis customers experience capture-quality issues with Motion. Reasoning: Motion's video requirement is more demanding than a single selfie; low-end devices may struggle with frame rate or video upload. Persona reports first-attempt failure rates of ~10–15% for video-based checks [source](https://withpersona.com/blog/identity-verification-pass-rate-metrics).]
- **Behavior of the check on this category:** false-positive (Motion failure due to device/network limitations, not fraud)
- **Reasoning:** Retriable, but persistent failures in low-infrastructure contexts create friction. The provider may need to offer a Standard-liveness fallback for these users, accepting the lower assurance.

### Gap 6: Recent name changes and expired documents
- **Category:** Researchers with name changes (marriage, divorce, gender marker update) where the ID and account record disagree, or whose ID has recently expired.
- **Estimated size:** [best guess: 1–3% of active customers per year — same as Jumio.]
- **Behavior of the check on this category:** false-positive (name mismatch or expired-document flag)
- **Reasoning:** Resolvable with account update or re-issue, but creates interim friction.

## Refined false-positive qualitative

Updated from 04-implementation-v1:

1. **Non-Latin-script name mismatch** (Gap 2) — ~8–15% of global customers without transliteration layer. Highest-impact operational FP.
2. **Age-gap face mismatch** (Gap 3a) — ~20–40% of passport holders with old photos; most resolved by re-capture.
3. **Motion capture failures on low-end devices** (Gap 5) — ~5–10%; retriable but friction-generating.
4. **Unsupported document types** (Gap 1) — ~3–7%; fallback to passport.
5. **Head coverings / skin-tone bias** (Gap 3b, 3c) — small incremental effect with modern algorithms.
6. **Name changes** (Gap 6) — ~1–3%/year.

## Notes for stage 7 synthesis

- Onfido/Entrust's coverage profile is structurally identical to Jumio's with two differences: (a) slightly fewer supported document subtypes (2,500 vs 5,000), potentially creating a marginally higher unsupported-document rate; (b) Motion liveness provides stronger injection-attack defense than Jumio Liveness Standard, but requires explicit enablement and has higher device requirements.
- The transliteration/fuzzy-name-matching requirement is the same as for Jumio — the synthesis provider must implement this layer regardless of vendor choice.
- The configuration gap (Gap 4) is critical: SOC-order IDV must mandate Motion, not Standard. This should be a hard requirement in the integration spec.
- Onfido's `compromised_document` check (matching against a known-fraud DB) is a differentiator that Jumio and Persona may not offer at the same depth.
