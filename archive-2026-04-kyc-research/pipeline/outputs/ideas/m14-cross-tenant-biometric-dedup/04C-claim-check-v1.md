# m14-cross-tenant-biometric-dedup — Claim check v1

**Document under review:** `04-implementation-v1.md`

## Verified claims

### Jumio biometric deduplication / Face Lookup
- **Claim:** Jumio offers "Face Lookup" and biometric deduplication across all prior transactions within a customer's tenant, launched in partnership with AAMVA.
- **Cited:** [BiometricUpdate.com, June 2020](https://www.biometricupdate.com/202006/jumio-launches-biometric-deduplication-service-with-u-s-dmv-group-as-part-of-fraud-prevention-suite)
- **Verified:** The article confirms Jumio launched a biometric deduplication service that includes "Face Lookup" to flag when the same face appears in multiple verification attempts with different identifying information. AAMVA partnership confirmed. **PASS.**

### Jumio "200+ countries" and "billions of data points"
- **Claim:** Jumio processes transactions across 200+ countries with "billions of data points" in the Identity Graph.
- **Cited:** [jumio.com/technology/](https://www.jumio.com/technology/)
- **Verified:** Jumio's marketing materials on their technology page describe global coverage and large-scale data. These are marketing claims, not independently verifiable statistics.
- **Flag:** **OVERSTATED.** The "billions of data points" claim is Jumio's own marketing language, not an independently verified figure. The document should note this is vendor-reported.
- **Suggested fix:** Add "[vendor-reported]" qualifier.

### MetaMap Duplicate Detection
- **Claim:** MetaMap offers "Duplicate Detection via Facematch" that detects if a user has already been seen in the same account.
- **Cited:** [docs.metamap.com/docs/biometrics](https://docs.metamap.com/docs/biometrics)
- **Verified:** MetaMap documentation confirms this feature. **PASS.**

### Didit Face Search 1:N free tier
- **Claim:** Didit offers free 1:N face search and duplicate/blocklist detection in workflows.
- **Cited:** [didit.me/products/face-search-1ton/](https://didit.me/products/face-search-1ton/)
- **Verified:** Didit's product page confirms free duplicate and blocklist detection as part of their identity verification workflows. **PASS.**

### Regula Face SDK 1:N
- **Claim:** On-premise or cloud 1:N facial identification with customizable similarity threshold.
- **Cited:** [regulaforensics.com/products/face-recognition-sdk/](https://regulaforensics.com/products/face-recognition-sdk/)
- **Verified:** Regula's product page confirms 1:N facial identification capability. **PASS.**

### Jumio pricing
- **Claim:** "[vendor-gated — ... industry estimates for IDV transactions range from $1–$5 per verification]" and cites HyperVerge analysis.
- **Cited:** [hyperverge.co/blog/jumio-pricing/](https://hyperverge.co/blog/jumio-pricing/)
- **Verified:** The HyperVerge competitive analysis confirms Jumio pricing is "customized based on each business's unique and specific needs" and is not publicly listed. The $1–$5 range is the document's own industry estimate, correctly marked as `[vendor-gated]`. **PASS.**

### BIPA written-consent requirement
- **Claim:** "BIPA (Illinois) requires written consent before collecting biometric identifiers."
- **No URL cited.**
- **Status:** This is a well-known legal fact (Illinois Biometric Information Privacy Act, 740 ILCS 14). No citation needed for basic legal framework, but a reference would strengthen it.
- **Flag:** **UPGRADE-SUGGESTED.** Consider adding a citation to the statute or a summary source.

### Cross-vendor dedup gap
- **Claim:** "[searched for: 'cross-tenant biometric deduplication across IDV vendors', 'industry biometric blocklist shared across providers' — no production system found.]"
- **Verified via search:** I searched for these topics and confirmed that no commercial cross-provider biometric deduplication system exists. India's UIDAI/Aadhaar is the only known large-scale cross-organization biometric dedup, and it is government-operated. **PASS** — the `[unknown]` admission is valid and the search list is plausible.

## Uncited claims flagged

### In-house cost estimates
- **Claim:** "[best guess: $100K–$300K for model integration, vector DB setup, bias testing, privacy review...]"
- **Status:** Correctly marked as `[best guess]`. The range is plausible for enterprise ML infrastructure. **PASS.**

### Similarity-score thresholds
- **Claim:** "Similarity > 0.95", "Similarity 0.85–0.95", "Similarity < 0.85" in the manual review playbook.
- **Flag:** **MISSING-CITATION.** These thresholds are presented as part of the review SOP but are not cited or marked as design choices vs. vendor-recommended values.
- **Suggested fix:** Mark as `[design choice — thresholds should be calibrated against the specific embedding model and validated on a test population before deployment]`.

## Summary of flags

| # | Claim | Flag | Severity |
|---|---|---|---|
| 1 | Jumio "200+ countries" / "billions of data points" | OVERSTATED | Low — marketing language, not load-bearing |
| 2 | BIPA consent requirement | UPGRADE-SUGGESTED | Low — common legal knowledge |
| 3 | Similarity-score thresholds | MISSING-CITATION | Low — design choices, not empirical claims |

## Verdict

**PASS.** Three minor flags. No broken URLs, no substantive mis-citations. The core claims about vendor capabilities (Jumio Face Lookup, MetaMap Duplicate Detection, Didit free tier, cross-vendor gap) are all verified. The flags are quality improvements, not factual errors.
