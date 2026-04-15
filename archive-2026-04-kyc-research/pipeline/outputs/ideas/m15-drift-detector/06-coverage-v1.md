# Coverage research: Cross-order SOC drift detector

## Coverage gaps

### Gap 1: Cold-start — customers with fewer than ~10 orders
- **Category:** New customers or infrequent customers who have placed too few orders to establish a baseline for change-point detection. ADWIN and Page-Hinkley require a meaningful window of observations before they can detect a statistically significant shift.
- **Estimated size:** [best guess: 30–50% of active synthesis customer accounts have fewer than 10 orders at any given time. Reasoning: the synthesis market includes many one-time or low-frequency customers — academic labs that order occasionally for specific experiments, students, pilot projects. A typical academic lab may order 5–20 times per year for gene fragments [source](https://academic.oup.com/synbio/article/5/1/ysaa011/5892266), but many customers are in their first year or order less frequently. The long tail of infrequent customers is large.]
- **Behavior of the check on this category:** no-signal — the detector cannot fire without a baseline
- **Reasoning:** This is the most significant coverage gap. A malicious actor who places a small number of carefully chosen orders (staying below the detection threshold) would never trigger the detector. The attacker stories that involve "gradual legitimacy accumulation" are specifically designed to build history slowly, and the cold-start gap means the detector misses the critical early orders entirely.

### Gap 2: Sparse / infrequent customers
- **Category:** Established customers who order very infrequently (e.g., 1–2 orders per year). Even if they have >10 lifetime orders, the temporal spacing between orders means the ADWIN window is noisy — signal-to-noise ratio is too low for reliable change-point detection.
- **Estimated size:** [best guess: 10–20% of customer accounts with >10 lifetime orders are sparse (fewer than 4 orders/year). Reasoning: many academic labs go through burst-and-dormancy cycles aligned with grant funding and publication timelines.]
- **Behavior of the check on this category:** weak-signal — detector may fire spuriously on normal inter-order variance, or miss genuine drift that happens between widely-spaced orders
- **Reasoning:** The detector's temporal resolution is limited by order frequency. A customer who orders once per quarter gives ADWIN only 4 data points per year, which is marginal for reliable change-point detection.

### Gap 3: Core-facility / shared accounts with inherently variable order mix
- **Category:** Institutional core facilities, shared equipment centers, and departmental ordering accounts where multiple PIs and projects funnel through a single account. The order mix is inherently diverse and shifts as the facility's client base changes — drift is the steady state, not a signal.
- **Estimated size:** Research cores are common in academic institutions [source](https://sr.ithaka.org/publications/what-is-a-research-core/). Academic institutions represent ~54% of the gene synthesis market [source](https://www.imarcgroup.com/gene-synthesis-market). [best guess: 5–15% of active customer accounts are shared/core-facility accounts with inherently variable order mix. Reasoning: not all academic orders go through cores, but a meaningful fraction of high-volume academic accounts do.]
- **Behavior of the check on this category:** false-positive — the detector fires constantly on benign variation, generating so many alerts that reviewers learn to ignore them (alert fatigue)
- **Reasoning:** The detector must either exclude core-facility accounts or model them differently (e.g., detect drift against the facility's own distribution of project types, not against a single-PI baseline). Without this, false positives on core accounts will dominate the reviewer queue.

### Gap 4: CRO accounts with diverse client portfolios
- **Category:** Contract research organizations that order synthesis on behalf of multiple pharma/biotech clients. Their order mix shifts as client engagements start and end — functionally identical to core facilities in terms of variability.
- **Estimated size:** CROs represent a meaningful fraction of commercial synthesis customers. Biopharmaceutical companies hold ~42% of the synthesis market [source](https://www.prophecymarketinsights.com/market_insight/dna-synthesis-market-5727), and CROs handle an increasing share of outsourced R&D. [best guess: 5–10% of commercial customer accounts are CROs with client-driven order variability.]
- **Behavior of the check on this category:** false-positive — same as core facilities
- **Reasoning:** Must be handled with a CRO-specific account model or excluded from drift detection.

### Gap 5: Legitimate research pivots (new grants, new collaborations, career transitions)
- **Category:** Individual researchers who genuinely change research direction — a PI starts a new grant in a different area, a postdoc joins a new lab, a researcher responds to a serendipitous discovery or new funding opportunity. Research direction changes are common and systemic: a 2025 Nature paper documents a pervasive "pivot penalty" showing that pivots are frequent across science [source](https://www.nature.com/articles/s41586-025-09048-1). A 2025 Science Policy paper confirms shifts during projects are "common, systemic, and vary by disease" [source](https://academic.oup.com/spp/advance-article/doi/10.1093/scipol/scaf063/8315950).
- **Estimated size:** [best guess: 10–20% of active PI-level customer accounts show a meaningful research-direction shift in any given 2-year window. Reasoning: the Nature paper shows pivots are frequent; grant cycles (3–5 years) naturally produce topic shifts; faculty hiring and postdoc turnover drive lab-level pivots.]
- **Behavior of the check on this category:** false-positive — the detector correctly identifies drift, but the drift is benign
- **Reasoning:** This is the fundamental false-positive problem for any drift detector in a research context. The triage step (manual review asking "is this a legitimate pivot?") is essential and will consume the majority of reviewer time. The 04-implementation correctly identifies this and proposes a reviewer workflow, but the base rate of benign pivots is high enough that the false-positive rate will dominate.

### Gap 6: Customers using free-text fields extensively
- **Category:** Customers who frequently use the SOC self-declaration form's "other / free text" fields rather than controlled vocabulary. The drift detector's feature vector relies on structured fields (controlled vocab, organism taxonomy, BSL level); free text requires embedding, and embedding-based drift detection is noisy.
- **Estimated size:** [unknown — searched for: "DNA synthesis screening form free text usage rate", "SOC declaration structured vs free text percentage", "customer screening form completion quality gene synthesis"]. [best guess: 10–25% of SOC declarations use free text for at least one key field. Reasoning: forms with "other" options typically see 10–30% usage of the escape hatch, especially for non-standard use cases.]
- **Behavior of the check on this category:** weak-signal — drift detection on embedded free text is noisier than on structured fields; false positives and false negatives both increase
- **Reasoning:** The detector should primarily operate on structured fields and treat free-text-heavy customers as lower-confidence.

### Gap 7: Attacker who maintains consistent declarations throughout
- **Category:** A sophisticated attacker who establishes a consistent, benign-looking order pattern from the start and never deviates — placing orders for SOC-adjacent sequences under a stable, plausible cover story. The drift detector cannot catch an attacker who does not drift.
- **Estimated size:** This is a structural blind spot, not a population gap. The 04-implementation-v1.md acknowledges this: "the attacker who maintains a long, consistent fake history is not caught."
- **Behavior of the check on this category:** no-signal — no drift means no detection
- **Reasoning:** This is the fundamental limitation of any change-point detection approach. It catches escalators but not persistent liars. Must be complemented by other M15 checks (structured-form review, IBC attestation) that evaluate the declarations themselves, not their trajectory.

## Refined false-positive qualitative

Updated from 04-implementation-v1:

1. **Legitimate research pivots** (Gap 5) — 10–20% of PI accounts per 2-year window. Dominant false-positive source. Requires human triage for every alert.
2. **Core-facility accounts** (Gap 3) — 5–15% of accounts; inherently noisy. Must be excluded or modeled separately.
3. **CRO accounts** (Gap 4) — 5–10% of commercial accounts; same issue.
4. **Free-text-heavy declarations** (Gap 6) — 10–25% of declarations; noisy embedding drift.
5. **Postdocs / new PIs starting new directions** — subset of Gap 5; high frequency among early-career researchers.
6. **Educational accounts** (course material changes semester to semester) — small subset; produces seasonal drift.

## Notes for stage 7 synthesis

- The drift detector's coverage is fundamentally limited by order frequency (Gaps 1–2) and by the high base rate of legitimate drift in research (Gap 5). The check is useful as a supplementary signal but cannot be a primary detection mechanism.
- The false-positive rate is likely to be very high without substantial tuning: core facilities, CROs, and legitimate pivots will dominate the alert queue. The reviewer workflow must be designed to handle a low signal-to-noise ratio.
- The structural blind spot (Gap 7 — consistent attacker) means the detector catches only one attacker archetype (the escalator) and misses others (the persistent liar, the one-shot actor). Complementary M15 checks are essential.
- The cold-start gap (Gap 1) means the detector provides zero value for the most important risk window: the first few orders from a new customer. This is precisely when screening matters most.
- Consider requiring minimum order history (e.g., 10 orders) before the drift detector contributes to the risk score, and using other signals (structured-form quality, IBC attestation, voucher trust) for the cold-start window.
