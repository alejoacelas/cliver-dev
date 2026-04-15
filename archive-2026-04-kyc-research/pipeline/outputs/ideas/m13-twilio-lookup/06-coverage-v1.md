# Coverage research: Twilio Lookup v2 — Line Type Intelligence

## Coverage gaps

### Gap 1: Legitimate researchers using non-fixed VoIP (Google Voice, Skype-In, TextNow)
- **Category:** Researchers who use Google Voice or similar non-fixed VoIP services as their primary or stable contact number. Common among academics moving between institutions, visiting scholars, and dual-SIM/privacy-conscious users.
- **Estimated size:** [unknown — searched for: "percentage US phone numbers classified nonFixedVoip VoIP Google Voice TextNow market share"] No public data on what fraction of US phone numbers are non-fixed VoIP, or what fraction of academic researchers use such numbers. VoIP business lines in the US grew from 6.2M to 40M+ between 2010–2018. [source](https://electroiq.com/stats/voip-statistics/) [best guess: 5–15% of academic researchers in the US may use a non-fixed VoIP number as their primary contact, with the rate higher among international scholars and early-career researchers]
- **Behavior of the check on this category:** false-positive (`phone_nonfixed_voip` flag fires; routed to callback SOP)
- **Reasoning:** The implementation identifies this: "Researchers using Google Voice as their stable forwarding number — nonFixedVoip will fire even though the customer is real and reachable."

### Gap 2: Institutional VoIP PBX misclassified as nonFixedVoip
- **Category:** Researchers at institutions whose cloud PBX (RingCentral, Zoom Phone, 8x8, Microsoft Teams Phone) has number blocks that Twilio's carrier database classifies as `nonFixedVoip` rather than `fixedVoip`.
- **Estimated size:** Twilio provides an Overrides API to correct misclassifications, suggesting the problem is common enough to warrant a product feature. [source](https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence) [best guess: 5–10% of institutional phone numbers on cloud PBX platforms may be misclassified, depending on how the carrier registered the number blocks in the LERG database]
- **Behavior of the check on this category:** false-positive (`phone_nonfixed_voip` fires for a real institutional number)
- **Reasoning:** The implementation notes: "A legitimate institutional VoIP PBX uses a carrier Twilio classifies as nonFixedVoip rather than fixedVoip. Mitigation: maintain an internal allowlist of known institutional carriers/numbers."

### Gap 3: International phone numbers returning `unknown` type
- **Category:** Customers with phone numbers on international carriers where Twilio's carrier database has no classification data — returning `type = unknown`.
- **Estimated size:** Twilio states Line Type Intelligence is "available for phone numbers worldwide" but carrier data "isn't available" for several line types including `unknown`. [source](https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence) [unknown — searched for: "Twilio Lookup line type intelligence international coverage accuracy rate unknown type percentage"] No public metrics on the `unknown` rate by country. [best guess: for US/UK/CA numbers, the `unknown` rate is likely <3%. For numbers in less-covered markets (parts of Africa, Southeast Asia, Latin America), the `unknown` rate may be 10–25%.]
- **Behavior of the check on this category:** no-signal (returns `unknown`; falls through to Telesign; if both unknown, falls to callback SOP)
- **Reasoning:** The implementation routes `unknown` to the second source (Telesign). If both are unknown, the callback SOP handles it. But the double-unknown case has no automated signal at all.

### Gap 4: Recently ported numbers with stale classification
- **Category:** Customers who recently ported their number between carriers. The carrier database may reflect the pre-port classification for hours to days.
- **Estimated size:** US telecom churn is 15–25% annually. [source](https://customergauge.com/blog/average-churn-rate-by-industry) [best guess: at any given time, 1–3% of number lookups may hit a recently-ported number with stale data]
- **Behavior of the check on this category:** false-positive or weak-signal (line type may be stale — e.g., a mobile number ported to a VoIP provider shows `mobile` briefly, or vice versa)
- **Reasoning:** The implementation notes: "A line is recently ported from a real mobile to nonFixedVoip (or vice versa) — Lookup may show pre-port classification briefly."

### Gap 5: BYOC (Bring Your Own Carrier) numbers
- **Category:** Customers or institutions using BYOC arrangements where the underlying line is a fixed PBX but the number's porting history makes it look non-fixed in carrier databases.
- **Estimated size:** [unknown — searched for: "BYOC bring your own carrier VoIP classification percentage"] [best guess: a small fraction, likely <2% of numbers checked, but concentrated among tech-savvy institutions and cloud-native startups]
- **Behavior of the check on this category:** false-positive (`phone_nonfixed_voip` fires despite the number being a real institutional PBX)
- **Reasoning:** The implementation notes: "BYOC numbers (Bring Your Own Carrier) where the underlying line is a fixed PBX but the porting status looks non-fixed."

## Refined false-positive qualitative

The primary false-positive-generating categories are:
1. **Gap 1 (Google Voice / non-fixed VoIP users):** The largest and most persistent source. Every check on this population fires `phone_nonfixed_voip`. This is the same gap as m13-telesign-phoneid Gap 1 — the two providers share this structural limitation because it is inherent to line-type classification, not to a specific carrier database.
2. **Gap 2 (PBX misclassification):** Systematic for all researchers at affected institutions. The Overrides API provides a per-provider fix but requires manual maintenance of the allowlist.
3. **Gap 4 and Gap 5 (porting/BYOC):** Transient or niche; lower volume.

## Notes for stage 7 synthesis

- Twilio Lookup is the cheapest and simplest M13 check (~$0.005–$0.015 per call, already integrated at most providers). It should be the first-line screening tool.
- Its coverage gaps are almost identical to m13-telesign-phoneid's gaps — both rely on the same underlying carrier number-plan databases (LERG, ITU). Running both providers adds disagreement-detection but does not close the fundamental gaps.
- The non-fixed VoIP false-positive (Gap 1) is the core tension: the signal that detects disposable/burner phones also flags legitimate researchers using Google Voice for portability. The callback SOP (m13-callback-sop) is the absorber for this gap, but it adds cost and friction.
- International `unknown` rates (Gap 3) are the main no-signal gap. For a provider with a global customer base, some fraction of lookups will return no useful line-type data.
