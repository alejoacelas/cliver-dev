# Coverage research: Predecessor pre-approval re-IAL2 + re-bind

## Coverage gaps

### Gap 1: High abandonment rate due to IDV friction at order time
- **Category:** Legitimate customers who begin the re-IAL2 flow at order time but abandon it due to friction — the document-capture, selfie, and liveness steps are unexpected and time-consuming in an ordering context.
- **Estimated size:** Industry data on IDV onboarding abandonment ranges widely: 38% abandon because the process is "too long or complex" ([Bynn — Reducing Drop-off Rate](https://www.bynn.com/resources/onboard-customers-smoothly-reducing-users-drop-off-rate-in-identity-verification)); 68% of consumers abandon digital onboarding due to friction ([Jumio — Reduce Abandonment](https://www.jumio.com/how-to-reduce-customer-abandonment/)); and strict KYC/AML flows see abandonment rates "as high as 70–80%" ([Veratad — Improve IDV Success](https://veratad.com/blog/how-to-improve-idv-success-rates-and-reduce-onboarding-drop-offs)). [best guess: the synthesis-customer context is different from retail banking (scientists are more motivated, orders are high-value), but a re-IAL2 step inserted at order time — not at initial onboarding — will surprise users. Drop rate for the re-verification step: perhaps 10–25% on first encounter, declining as customers learn to expect it.]
- **Behavior of the check on this category:** false-positive — legitimate customers are blocked because they abandon the verification flow, not because they are illegitimate.
- **Reasoning:** The implementation flags friction as "the dominant cost" and estimates 5–20% drop rate. The range from banking-industry data is higher. The key difference is context: re-IAL2 at order time (not onboarding) is more jarring.

### Gap 2: Foreign researchers with non-OECD national IDs in the long tail of vendor document support
- **Category:** Researchers at institutions in countries where the primary government-issued ID is not well-supported by IDV vendors (e.g., national IDs from Sub-Saharan Africa, Central Asia, Pacific Islands, some Caribbean nations). These documents may fail OCR extraction or liveness-comparison steps.
- **Estimated size:** Major IDV vendors (Veriff, Persona, Onfido) support documents from 195–230+ countries ([Veriff](https://www.veriff.com/product/identity-verification); [Didit](https://didit.me/blog/global-idv-coverage/)). However, "supported" means the country's passport is recognized; less common document types (national IDs, driver's licenses from smaller countries) may have lower extraction accuracy. The international gene synthesis market is ~45% of global revenue. [best guess: 5–10% of international customers may hold primary IDs that are poorly supported by the vendor's document-extraction model, leading to higher decline rates. Passports are universally supported, but not all researchers have current passports.]
- **Behavior of the check on this category:** weak-signal to false-positive — the verification may decline a valid document, or extract data with errors that cause a name mismatch.
- **Reasoning:** The implementation flags "documents the vendor doesn't support (rare passports, expired-but-valid academic IDs, foreign national IDs in the long tail)" as a failure mode.

### Gap 3: Legitimate handoffs (PI retirement, postdoc → faculty, lab manager change) generating high false-positive volume
- **Category:** Researchers whose re-IAL2 verification succeeds but whose verified name does not match the predecessor account holder, triggering a `predecessor_rebind_name_mismatch` flag that requires manual review. This is the expected behavior for legitimate personnel transitions — but in academia, personnel transitions are frequent.
- **Estimated size:** In US academic labs, postdoc positions typically last 2–4 years; only ~3% of postdocs obtain tenure-track positions ([PNAS 2024](https://www.pnas.org/doi/10.1073/pnas.2402053122)), meaning the vast majority move on. Lab manager and staff scientist turnover is also significant. [best guess: in a pre-approved customer roster weighted toward academic institutions, 10–20% of accounts may experience a personnel change in any given year. Each change triggers a name-mismatch flag requiring reviewer adjudication, institutional confirmation letter, and potentially a full re-screening through m18/m19/m20.]
- **Behavior of the check on this category:** false-positive — the check correctly detects a name mismatch, but the underlying cause is a legitimate handoff, not an attack. The reviewer workload is the cost.
- **Reasoning:** The implementation identifies "legitimate handoffs (PI retirement, lab manager change, postdoc graduation to faculty role)" as a primary false-positive source. Academic turnover rates suggest this will be a high-volume event.

### Gap 4: Shared core-facility accounts with multiple legitimate operators
- **Category:** Synthesis ordering accounts at academic core facilities where multiple staff members (technicians, facility managers) share a single account. Re-IAL2 verifies the individual who happens to be logged in, but the account is used by several people.
- **Estimated size:** [best guess: same as m16-order-time-stepup Gap 3: ~5–15% of customer accounts are shared/core-facility accounts. Each shares the same structural mismatch — the re-IAL2 model assumes one-person-per-account.]
- **Behavior of the check on this category:** weak-signal — the verified individual is legitimate, but they may not match the account holder's name, triggering a false flag. Alternatively, if the original account holder always does the re-IAL2, the check provides no signal about who actually placed the order.
- **Reasoning:** The implementation flags shared core-facility accounts as a "structural mismatch." Re-IAL2 surfaces the underlying account-sharing problem but does not solve it.

### Gap 5: Sophisticated attackers who possess the predecessor's documents
- **Category:** Attackers who have access to the predecessor account holder's identity documents (scanned copies from HR records, stolen physical documents) and can complete the re-IAL2 flow by presenting those documents with a deepfake or high-quality photo for the selfie/liveness step.
- **Estimated size:** [unknown — searched for: "deepfake identity verification bypass rate 2024", "liveness detection bypass synthetic media"]. [best guess: the implementation notes that "NIST IAL2's biometric requirement defeats this only if liveness is enforced strictly." Current IDV vendors invest heavily in liveness detection, but injection attacks (synthetic media) and presentation attacks (printed photos, 3D masks) are an active arms race. The fraction of dormant-account-takeover attackers who could defeat a major vendor's liveness check is [unknown] but non-zero and growing.]
- **Behavior of the check on this category:** weak-signal — the attacker completes the flow using the predecessor's documents, and the check returns "verified" for the wrong person (or the right person, if it's the predecessor's documents with the predecessor's name).
- **Reasoning:** The implementation flags "rebind by a sophisticated attacker who actually controls the predecessor's documents" and notes that strict liveness enforcement is the mitigation. This is an inherent limitation of document-based IDV.

### Gap 6: Privacy / biometric law constraints limiting deployment
- **Category:** Customers in jurisdictions with biometric privacy laws (Illinois BIPA, Texas CUBI, Washington state, EU GDPR Article 9) where collecting and processing biometric data (selfie, liveness scan) for identity verification requires explicit consent and creates legal compliance obligations.
- **Estimated size:** Illinois alone has ~12.5 million residents; EU has ~450 million. [best guess: 30–50% of synthesis customers may be in jurisdictions with biometric privacy laws. This does not block the check outright (consent mechanisms exist) but adds legal friction, consent-management requirements, and potential liability. Some customers or institutions may refuse to consent, creating a gap.]
- **Behavior of the check on this category:** false-positive / no-signal (depending on implementation) — if the provider requires consent and the customer refuses, the order is blocked. If the provider exempts certain jurisdictions, those customers bypass the check.
- **Reasoning:** The implementation flags BIPA and GDPR as constraints. The legal friction may lead some providers to exempt certain customer populations from re-IAL2, creating intentional coverage gaps.

## Refined false-positive qualitative

1. **Legitimate handoffs** (stage 4 + Gap 3) — upgraded. Academic turnover makes this a high-frequency event, not an edge case.
2. **Name mismatches** (stage 4) — remains. Married names, romanization variants, name changes.
3. **Foreign researchers with long-tail documents** (stage 4 + Gap 2) — remains. Technical failure, not identity fraud.
4. **Users on slow/unstable connections failing liveness** (stage 4) — remains. Technical false positive.
5. **Shared core-facility accounts** (stage 4 + Gap 4) — upgraded. Structural mismatch with the one-person-per-account model.
6. **Biometric-consent refusals** (Gap 6) — new. Customers or institutions that decline biometric processing on legal/ethical grounds.

## Notes for stage 7 synthesis

- Gap 1 (friction/abandonment) and Gap 3 (legitimate handoffs) are the operationally dominant gaps. Together they imply that the re-IAL2 step will generate significant customer-service volume and order delays in an academic customer base with high personnel turnover.
- Gap 5 (document-forgery/deepfake) is the security-significant gap: it defines the ceiling of what this check can catch. As deepfake quality improves, the check's effectiveness degrades unless IDV vendors keep pace.
- The check is most effective when (a) the customer population has low turnover (stable industrial accounts), (b) the IDV vendor supports the customer's documents well, and (c) the legal environment permits biometric processing. Academic customers fail on (a); international customers may fail on (b) and (c).
- The per-order binding (not per-account) is the key innovation. Even with the gaps above, binding a verification artifact to a specific order creates an audit trail that is much stronger than per-account IAL2 at onboarding.
