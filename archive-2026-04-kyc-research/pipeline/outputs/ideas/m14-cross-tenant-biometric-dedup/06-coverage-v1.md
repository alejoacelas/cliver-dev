# Coverage research: Cross-tenant biometric dedup

## Coverage gaps

### Gap 1: Cross-provider identity rotation (different IDV vendors)
- **Category:** Attackers (and by symmetry, legitimate customers) who interact with multiple synthesis providers that use different IDV vendors. The 1:N dedup only searches within a single provider's tenant. A person enrolled at Provider A (using Jumio) will not collide with their enrollment at Provider B (using MetaMap).
- **Estimated size:** There is no cross-vendor biometric sharing system in commercial IDV today. [searched for: "cross-tenant biometric deduplication across IDV vendors", "industry biometric blocklist shared across providers" — no production system found, per the implementation.] The cro-identity-rotation attacker story explicitly exploits this gap. For legitimate customers who order from multiple providers (common — researchers may use IDT, Twist, GenScript interchangeably based on price/speed), each provider sees them independently. [best guess: 30–50% of active synthesis customers may order from 2+ providers over a multi-year period, based on the competitive landscape with 5+ major synthesis providers]
- **Behavior of the check on this category:** no-signal (the check cannot see enrollments at other providers)
- **Reasoning:** The implementation states: "Cross-tenant (cross-provider) dedup is not available from any vendor today." This is the most fundamental structural limitation of the idea. It means the check can only catch identity rotation within a single provider, not across the industry.

### Gap 2: Privacy/consent constraints blocking biometric collection
- **Category:** Customers in jurisdictions where biometric data collection requires explicit informed consent (BIPA in Illinois, GDPR in the EU, CCPA/CPRA in California) who decline consent, or where the provider's legal counsel determines that cross-customer biometric comparison cannot be performed under existing consent frameworks.
- **Estimated size:** BIPA (Illinois) requires written consent before collecting biometric identifiers. [source](https://en.wikipedia.org/wiki/Biometric_Information_Privacy_Act) GDPR requires a lawful basis (likely explicit consent) for biometric processing. [best guess: if the provider serves customers in IL, CA, and the EU, 20–40% of customers may be in jurisdictions with biometric consent requirements. The opt-in rate for biometric comparison (as opposed to basic IDV) is unknown but likely lower than for IDV alone, since cross-customer comparison feels more invasive.] [unknown — searched for: "BIPA biometric consent opt-out rate percentage companies unable collect biometrics"] No data on opt-out rates found.
- **Behavior of the check on this category:** no-signal (if consent is not obtained, the check cannot run)
- **Reasoning:** The implementation notes: "If the provider cannot obtain consent from all customers for cross-customer biometric comparison, the check cannot run. This is a structural constraint, not a technical one."

### Gap 3: Cold-start problem (new or small providers)
- **Category:** Providers who are newly deploying biometric dedup, or small providers with few total customers. The 1:N search is only valuable when the database has enough templates to make collisions detectable.
- **Estimated size:** The implementation estimates ~1,000+ templates needed before collision probability becomes meaningful. [best guess from implementation] A small provider processing 500 IDV sessions/year would take 2+ years to build a database large enough for the check to provide value. [best guess: among the 10+ gene synthesis providers in the market, perhaps 3–5 are large enough to accumulate 1,000+ IDV templates within the first year of deployment]
- **Behavior of the check on this category:** no-signal (database too small for meaningful dedup)
- **Reasoning:** The implementation notes: "The dedup database starts empty."

### Gap 4: Deepfake / injection attacks that produce novel synthetic faces
- **Category:** Attackers who use deepfake technology to inject a synthetic face into the IDV session. If the synthetic face is not the attacker's real face and not any prior enrollee's face, it will not collide with any template in the database.
- **Estimated size:** Deepfakes now account for 6.5% of all fraud attempts, up from <1% in 2021. [source](https://kyc-chain.com/ai-identity-fraud-2025/) However, leading IDV vendors' injection detection rates are >99% for known deepfake engines. [source](https://www.miteksystems.com/solutions/deepfake-attack-detection) [best guess: the fraction of deepfake attempts that successfully bypass liveness detection is <1% against top-tier IDV vendors, but the rate is higher against lower-tier or older liveness implementations]
- **Behavior of the check on this category:** no-signal (the template enrolled is a synthetic face that has no collision history) or weak-signal (if the attacker reuses the same synthetic face across multiple enrollments, the check catches it — but a sophisticated attacker generates a unique face per enrollment)
- **Reasoning:** The implementation notes: "If the deepfake injection produces a face template that collides with the real PI's prior enrollment, the check catches it. If the deepfake is of a novel synthetic face, no collision occurs."

### Gap 5: Identical twins and high-similarity false matches
- **Category:** Identical twins at different institutions who legitimately have distinct identities but biologically identical (or near-identical) face templates. Also, demographic groups with lower inter-person facial distinctiveness in the embedding model.
- **Estimated size:** Identical twins occur in ~3.5 per 1,000 births (0.35%). [source](https://www3.nd.edu/~kwb/Phillips_EtAl_FG_2011.pdf) In a database of 10,000 customers, ~35 may have an identical twin, but the probability both twins are synthesis customers at the same provider is very low. [best guess: <0.1% of dedup checks would encounter a true identical-twin collision] However, face recognition algorithms give high false match rates on identical twins — one study found FAR of 17–29% on identical-twin pairs. [source](https://www3.nd.edu/~kwb/Phillips_EtAl_FG_2011.pdf)
- **Behavior of the check on this category:** false-positive (`biometric_template_collision` fires for two legitimately different people)
- **Reasoning:** The implementation notes: "Identical twins at different institutions — biologically identical face templates, legitimately different identities."

### Gap 6: Researchers changing institutions (same person, new affiliation)
- **Category:** Legitimate researchers who change institutions and re-enroll with the same provider under a new affiliation. Their face template collides with their prior enrollment, triggering `biometric_template_collision`.
- **Estimated size:** [best guess: academic job turnover is significant — postdocs change institutions every 2–3 years, and even tenured faculty move. Perhaps 5–10% of returning customers per year may re-enroll with a changed institution, generating a true collision that is a false alarm for the "synthetic identity" use case but a legitimate system event]
- **Behavior of the check on this category:** false-positive (`biometric_template_collision` fires, but this is a same-person institution change, not identity rotation)
- **Reasoning:** The implementation notes: "Researchers who change institutions — same person, same face, different affiliation. The enrollment at the new institution will collide with the old one."

### Gap 7: Demographic bias in face recognition
- **Category:** Customers from demographic groups where the face recognition model has higher false-positive rates — per NIST FRVT, "within-group false positive rates vary by up to a factor of 7203." [source](https://pages.nist.gov/frvt/html/frvt_demographics.html) Higher false-positive rates for African American females than for any other group. [source](https://pages.nist.gov/frvt/html/frvt_demographics.html)
- **Estimated size:** The magnitude of demographic disparity depends on the specific embedding model and threshold chosen. [best guess: at a fixed threshold chosen to give FMR of 0.00003 overall, some demographic groups may experience false-positive rates 10x–100x higher than others, per NIST's finding of up to 7203x within-group variation across algorithms]
- **Behavior of the check on this category:** false-positive (disproportionate `biometric_template_collision` rates for affected demographic groups)
- **Reasoning:** The implementation notes: "Face recognition systems have documented accuracy disparities across demographic groups."

## Refined false-positive qualitative

The primary false-positive-generating categories are:
1. **Gap 6 (institution change):** The most operationally common false positive. Every researcher who moves and re-enrolls will trigger a collision. This is technically a "true" biometric match but a false alarm for the intended use case (detecting identity rotation).
2. **Gap 7 (demographic bias):** The most ethically and legally concerning. Disproportionate flagging of certain demographic groups is both unfair and, in regulated environments, potentially unlawful.
3. **Gap 5 (identical twins):** Very rare but produces high-confidence false matches that are difficult to adjudicate.

The no-signal categories (Gaps 1, 2, 3, 4) represent large structural holes in the check's coverage. Gap 1 (cross-provider) is the most fundamental — it means the check cannot achieve its stated goal of detecting identity rotation across the synthesis industry, only within a single provider.

## Notes for stage 7 synthesis

- This is the most expensive and privacy-invasive idea in the pipeline ($2–$8 per check via vendor, or $100K–$300K setup for in-house). Its marginal value over simpler checks is limited to the specific scenario of same-person multi-identity enrollment at a single provider.
- The cross-provider gap (Gap 1) is structural and has no near-term fix. No commercial cross-vendor biometric sharing system exists. Government systems (India's Aadhaar) achieve this but through a centralized national authority — not applicable to the private-sector DNA synthesis market.
- The privacy/consent constraint (Gap 2) may be a blocker in BIPA/GDPR jurisdictions. The legal cost and risk of biometric comparison may exceed its security benefit for a typical synthesis provider.
- The institution-change false positive (Gap 6) will generate the highest volume of manual review cases, since academic researchers frequently change institutions. The review workflow must distinguish "same person, new affiliation" from "same person, multiple fake identities."
- Demographic bias (Gap 7) creates both operational and reputational risk. A bias audit ($10K–$30K per the implementation) is essential before deployment.
