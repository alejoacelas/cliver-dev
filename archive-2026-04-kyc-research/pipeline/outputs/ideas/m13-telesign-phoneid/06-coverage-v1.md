# Coverage research: Telesign PhoneID + Score (line type, carrier, risk, SIM swap)

## Coverage gaps

### Gap 1: Legitimate researchers using non-fixed VoIP as their primary contact (Google Voice, Skype-In, TextNow)
- **Category:** Researchers who use Google Voice or similar non-fixed VoIP services as their stable forwarding number — common among academics who move between institutions, visiting scholars, and privacy-conscious individuals.
- **Estimated size:** [unknown — searched for: "Google Voice usage percentage United States researchers academics VoIP number"] No public data on Google Voice adoption among academics specifically. [best guess: 5–15% of US-based academic researchers may use a Google Voice or similar non-fixed VoIP number as their primary contact, based on anecdotal reports of Google Voice popularity in academia for cross-institution portability. Among international researchers in the US, the rate may be higher.]
- **Behavior of the check on this category:** false-positive (`telesign_nonfixed_voip` flag fires; routed to callback SOP)
- **Reasoning:** The implementation identifies this: "Researchers using Google Voice as a stable forwarding number for their real cell — NON-FIXED VOIP will fire even though the user is real."

### Gap 2: Institutional VoIP PBX numbers misclassified as non-fixed VoIP
- **Category:** Researchers at institutions whose VoIP phone system (RingCentral, Zoom Phone, 8x8, Vonage Business, Microsoft Teams Phone) is classified by Telesign as `NON-FIXED VOIP` rather than `FIXED VOIP`, despite being a real institutional PBX.
- **Estimated size:** 61% of organizations are planning full migration from on-premise PBX to cloud-based voice systems by mid-decade. [source](https://www.nextiva.com/blog/voip-stats.html) Cloud PBX providers (RingCentral, Zoom Phone) may be classified inconsistently by carrier databases. [best guess: 5–10% of institutional phone numbers may be misclassified as NON-FIXED VOIP when they are actually institutional PBX extensions, depending on how the carrier registered the number block with the LERG/numbering databases]
- **Behavior of the check on this category:** false-positive (`telesign_nonfixed_voip` fires for a real institutional number)
- **Reasoning:** The implementation notes: "A legitimate institutional VoIP PBX uses a carrier Twilio classifies as nonFixedVoip rather than fixedVoip." The same issue applies to Telesign.

### Gap 3: International phone numbers with incomplete carrier data
- **Category:** Customers with phone numbers on carriers (especially in Asia, Africa, Latin America) where Telesign's carrier database has incomplete or no data — returning `phone_type = OTHER` or `UNKNOWN`.
- **Estimated size:** Telesign PhoneID covers numbers globally but carrier-database completeness varies by country. [unknown — searched for: "Telesign PhoneID line type classification accuracy MVNO unknown carrier percentage"] No public accuracy metrics found. [best guess: for numbers in well-covered markets (US, UK, CA, major EU), the unknown rate is likely <5%. For numbers in less-covered markets (sub-Saharan Africa, Southeast Asia, parts of Latin America), the unknown rate could be 15–30%, based on the general pattern that carrier databases are thinner outside OECD countries.]
- **Behavior of the check on this category:** weak-signal (returns `UNKNOWN` or `OTHER`; routed to callback SOP as inconclusive)
- **Reasoning:** The implementation notes: "Some carriers (especially small MVNOs and international carriers) return incomplete data — phone_type may be OTHER or UNKNOWN."

### Gap 4: Risk score false positives (neighborhood/ZIP-code signal)
- **Category:** Legitimate customers whose phone numbers are registered in high-fraud-rate geographic areas, or on carriers with poor reputations, pushing their Telesign risk score above the review threshold even though they are not fraudulent.
- **Estimated size:** [unknown — searched for: "Telesign Score API false positive rate", "phone risk score false positive percentage"] Telesign does not publish false-positive rates for its Score API. [best guess: at a threshold of risk_score ≥ 700, false positives may be 1–3% of all numbers checked, based on typical fraud-scoring distributions where ~5% of the population scores in the top decile and most of those are legitimate]
- **Behavior of the check on this category:** false-positive (`telesign_high_risk_score` fires)
- **Reasoning:** The implementation notes: "Risk-score false positives at the score-tail: customers in high-fraud-rate ZIP codes or using carriers with bad reputations get pushed up by neighborhood signal even though they are legitimate."

### Gap 5: Score model opacity — inability to explain or appeal
- **Category:** Not a customer category but a structural coverage gap: the Telesign Score/Intelligence Cloud model is opaque. When a legitimate customer is flagged, the reviewer cannot determine *why* the score is high, making it difficult to adjudicate or for the customer to appeal.
- **Estimated size:** Applies to every flagged customer (those scoring ≥ 700). [best guess: if 2–5% of customers are flagged by the risk score, all of those cases have the opacity problem]
- **Behavior of the check on this category:** weak-signal (the signal exists but cannot be decomposed for adjudication)
- **Reasoning:** The implementation notes: "Score recommendation field is opaque — Telesign does not publish the model. Reviewers cannot tell why a number scored high."

### Gap 6: Recently ported numbers producing intermittent misclassification
- **Category:** Customers who recently ported their number between carriers. During the porting transition (hours to days), the carrier database may reflect the old carrier's classification rather than the new one.
- **Estimated size:** US telecom churn is 15–25% annually [source](https://customergauge.com/blog/average-churn-rate-by-industry), implying ~1–2% of numbers are in a porting transition state at any given time. [best guess: for synthesis providers checking numbers at onboarding, perhaps 1–3% of lookups hit a recently-ported number with stale classification]
- **Behavior of the check on this category:** false-positive or weak-signal (line type or carrier name is stale; may produce a false `telesign_nonfixed_voip` if the old carrier was VoIP)
- **Reasoning:** The implementation notes: "Recently-ported numbers from a real mobile to a VoIP carrier (or vice-versa) can produce intermittent classification."

## Refined false-positive qualitative

The primary false-positive-generating categories are:
1. **Gap 1 (Google Voice / non-fixed VoIP users):** The most operationally significant — fires on every check for this population, not intermittently. Absorbed by the callback SOP, but the callback adds friction and cost.
2. **Gap 2 (institutional PBX misclassification):** Potentially systematic for all researchers at institutions using a cloud PBX provider whose number block is misclassified. An internal allowlist of known institutional carriers mitigates this.
3. **Gap 4 (risk score):** Lower volume but harder to adjudicate due to the opacity problem (Gap 5).

## Notes for stage 7 synthesis

- Telesign PhoneID is designed as a second source alongside m13-twilio-lookup. The two providers' coverage gaps largely overlap (both depend on the same underlying carrier databases for line-type classification), so disagreement between them is a useful signal but does not close each other's gaps.
- The non-fixed VoIP false-positive problem (Gap 1) is the dominant coverage issue. Google Voice is popular in academia precisely because it provides number portability across institutions — the exact property that makes it look suspicious to line-type classifiers.
- The Score API adds risk intelligence that line-type alone lacks, but its opacity (Gap 5) limits its value for adjudication. It is best used as a triage signal, not a decision signal.
- International coverage is better than SIM-swap coverage (PhoneID works on any number, not just MNOs in 16 countries) but the quality of carrier data degrades substantially outside OECD markets.
