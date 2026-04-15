# Per-idea synthesis: m13-telesign-phoneid

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Telesign PhoneID + Score (line type, carrier, risk, recent SIM swap) |
| **measure** | M13 — phone-voip-check |
| **attacker_stories_addressed** | inbox-compromise VoIP on profile (CAUGHT — NON-FIXED VOIP flagged), inbox-compromise VoIP on supporting docs only (MISSED — not scoped to documents), inbox-compromise real PI mobile on profile (MISSED — MOBILE, low risk), account-hijack SIM-swap (CAUGHT — sim_swap risk_indicator >= 3), account-hijack non-SIM-swap (MISSED), credential-compromise SIM swap (CAUGHT), credential-compromise VoIP enrollment (CAUGHT — NON-FIXED VOIP flagged), credential-compromise own real mobile (MISSED), shell-nonprofit burner SIM (MISSED — MOBILE, below risk threshold) |
| **summary** | Call Telesign PhoneID on the customer-supplied phone number at onboarding. PhoneID returns line type (mobile/landline/fixed VoIP/non-fixed VoIP/etc.), carrier, country, and identity-attribute add-ons including SIM-swap risk indicator and porting status. The Score/Intelligence Cloud product layers a 0–1000 risk score with a recommendation field. PhoneID is the natural second source alongside m13-twilio-lookup; discrepancy between the two providers is itself a useful signal. |
| **external_dependencies** | Telesign PhoneID API; Telesign Intelligence Cloud / Score API; PhoneID add-ons (Porting Status, SIM Swap — full-service tier required for SIM swap). Telesign customer account with sales-led contracting. |
| **endpoint_details** | **PhoneID:** `GET https://rest-api.telesign.com/v1/phoneid/{phone_number}`. **Score:** `GET https://rest-api.telesign.com/v1/score/{phone_number}`. Auth: Telesign Customer ID + API key, HTTP Basic or HMAC. Rate limits: [unknown — searched for Telesign rate limits]. Pricing: PhoneID ~$0.005–$0.011/request [best guess from third-party blog]; Score API ~$0.02–$0.05 [best guess]; SIM-swap add-on ~$0.10/query [best guess from third-party blog]. Score and SIM-swap are full-service-only, quoted by Telesign sales. [vendor-gated — public pricing page covers SMS/Voice only]. Also available via RapidAPI marketplace. ToS: explicitly marketed for fraud, KYC, account-takeover use cases. |
| **fields_returned** | **PhoneID:** phone_type (MOBILE/LANDLINE/FIXED VOIP/NON-FIXED VOIP/TOLL-FREE/PAGER/PAYPHONE/INVALID), carrier.name, location (city/state/country/zip/time_zone), numbering block. Add-ons: porting_status, sim_swap.risk_indicator (1–4), subscriber_status. **Score/Intelligence Cloud:** risk.score (0–1000), risk.level (low/medium/high), risk.recommendation (allow/flag/block). |
| **marginal_cost_per_check** | PhoneID: ~$0.005–$0.011/call. Score: ~$0.02–$0.05/call [best guess]. SIM-swap add-on: ~$0.10/query [best guess]. Per customer at signup: ~$0.01–$0.05 for PhoneID + Score. **Setup cost:** Telesign account opening (sales-led, 1–4 weeks), engineering integration ~1 week. |
| **manual_review_handoff** | (1) PhoneID on every new customer; Score on SOC orders or high-value customers. (2) MOBILE/LANDLINE + risk < 400 → no action. (3) FIXED VOIP → likely institutional PBX; soft flag only if combined with other signals. (4) NON-FIXED VOIP → flag telesign_nonfixed_voip; route to callback SOP. (5) risk_score >= 700 or recommendation = block → hold; senior compliance. (6) PhoneID vs Twilio Lookup disagree on line type → flag phone_provider_disagreement; callback SOP. (7) sim_swap risk_indicator >= 3 → freeze account; trigger rebind-cadence remediation. |
| **flags_thrown** | `telesign_nonfixed_voip`, `telesign_high_risk_score`, `telesign_recent_sim_swap`, `telesign_porting_recent`, `telesign_block_recommended`, `phone_provider_disagreement` (PhoneID vs Twilio). |
| **failure_modes_requiring_review** | Score model opacity — reviewers cannot determine why a number scored high. Small MVNOs/international carriers returning incomplete data (phone_type OTHER/UNKNOWN). Recently-ported numbers producing intermittent misclassification. Telesign API outage (degrade gracefully to Twilio Lookup fallback). Rate-limit hits during order bursts. |
| **false_positive_qualitative** | (1) Legitimate researchers using Google Voice/non-fixed VoIP as stable forwarding number — fires telesign_nonfixed_voip on every check; estimated 5–15% of US academics. (2) Institutional cloud PBX (RingCentral, Zoom Phone) misclassified as NON-FIXED VOIP — estimated 5–10% of institutional numbers. (3) International numbers with incomplete carrier data — 15–30% unknown rate in less-covered markets. (4) Risk-score false positives from neighborhood/ZIP signal — estimated 1–3% of all numbers at the 700 threshold. |
| **coverage_gaps** | **Gap 1 — Non-fixed VoIP users (Google Voice):** ~5–15% of US academics; false-positive. **Gap 2 — Institutional PBX misclassification:** ~5–10% of institutional numbers; false-positive. **Gap 3 — International carrier data gaps:** 15–30% unknown rate outside OECD; weak signal. **Gap 4 — Risk score false positives:** ~1–3% at 700 threshold; false-positive with opacity problem. **Gap 5 — Score model opacity:** Structural — cannot decompose score for adjudication, affecting all flagged customers. **Gap 6 — Recently ported numbers:** ~1–3% at any time; stale classification, intermittent false-positive. |
| **record_left** | `{customer_id, phone_number, phone_type, carrier, country, risk_score, risk_level, risk_recommendation, sim_swap_risk_indicator, porting_status, queried_at, source: "telesign-phoneid"}`. Auditable. |
| **bypass_methods_known** | inbox-compromise VoIP on profile — CAUGHT. account-hijack SIM-swap — CAUGHT. credential-compromise SIM swap — CAUGHT. credential-compromise VoIP enrollment — CAUGHT. |
| **bypass_methods_uncovered** | (1) VoIP numbers on supporting documents only (not submitted to PhoneID). (2) Attacker's own real mobile on profile (structurally invisible — returns MOBILE, low risk). (3) Non-SIM-swap account takeover (no phone-layer signal). (4) Fresh prepaid burner SIMs (MOBILE, below risk threshold). |

---

## Section 2: Narrative

### What this check is and how it works

Telesign PhoneID is a phone-number intelligence API that classifies the line type (mobile, landline, fixed VoIP, non-fixed VoIP, etc.), identifies the carrier, and returns geographic metadata for any phone number worldwide. The Score/Intelligence Cloud product adds a 0–1000 risk score with a categorical recommendation (allow/flag/block). Optional add-ons provide SIM-swap detection (risk indicator 1–4) and porting-status data. The synthesis provider calls PhoneID on every new customer's profile phone at onboarding, and calls the Score API for SOC orders or high-value customers. Non-fixed VoIP numbers (Google Voice, Skype, TextNow class) are flagged and routed to the callback SOP. High risk scores trigger senior compliance review. SIM-swap indicators trigger account freeze. PhoneID is positioned as a second source alongside m13-twilio-lookup; when the two providers disagree on line type, the disagreement itself is flagged.

### What it catches

PhoneID catches two distinct attack patterns. First, VoIP line-type detection: when an inbox-compromise attacker registers a non-fixed VoIP number (Google Voice, TextNow) on the customer profile, PhoneID classifies it as NON-FIXED VOIP and the SOP routes to callback. Second, SIM-swap detection: when an account-hijack or credential-compromise attacker SIM-swaps the target's mobile number, the sim_swap add-on returns a risk indicator of 3 or 4, triggering account freeze. These cover the two main phone-layer attack vectors: disposable VoIP for fabricated identities and SIM-swap for account takeover.

### What it misses

PhoneID is scoped to the customer-profile phone. When an inbox-compromise attacker places a VoIP number only on supporting documents (fabricated IBC letters, sponsor letters) while registering the real PI's mobile on the profile, PhoneID never sees the VoIP number. Stage 5 classified this as Moderate and suggested extending PhoneID to callback numbers extracted from documents, or delegating to the callback SOP. More broadly, any attacker using their own real mobile number is structurally invisible — PhoneID returns MOBILE with low risk. Fresh prepaid burner SIMs (used by shell nonprofits) also appear as legitimate mobile numbers, typically scoring below the 700 risk threshold. Non-SIM-swap account takeover (session theft, AitM) produces no phone-layer signal.

### What it costs

PhoneID is among the cheapest M13 checks: approximately $0.005–$0.011 per call for the base product, plus $0.02–$0.05 for the Score API and $0.10 for the SIM-swap add-on. All pricing is vendor-gated (not on Telesign's public pricing page; requires sales contact). At signup, the cost is roughly $0.01–$0.05 per customer for PhoneID + Score. Setup involves sales-led Telesign account opening (1–4 weeks) and approximately one week of engineering integration. The SIM-swap add-on requires full-service tier access.

### Operational realism

PhoneID runs automatically at onboarding with no manual intervention for passing results. The manual-review burden comes from non-fixed VoIP flags and high risk scores. The non-fixed VoIP false-positive problem is the dominant operational concern: an estimated 5–15% of US academics use Google Voice as their primary number for cross-institution portability. Each of these fires the telesign_nonfixed_voip flag and routes to the callback SOP, adding friction and cost. Institutional cloud PBX numbers (RingCentral, Zoom Phone) may also be misclassified as non-fixed VoIP. The Score API's opacity compounds the problem — when a number scores high, the reviewer cannot determine why, making adjudication difficult. The implementation recommends internal allowlists of known institutional carriers and never auto-denying on score alone.

### Open questions

Both pricing claims (PhoneID per-call and SIM-swap add-on) are sourced from a third-party blog (dropcowboy.com), not from Telesign directly. The claim check recommended reframing as vendor-gated. Telesign API rate limits are unknown. The risk-score threshold (700) was chosen without calibration data — stage 5 suggested lowering to 500 for SOC orders to catch more prepaid burner SIMs, at the cost of higher false-positive volume. The fraction of academics using Google Voice is unknown and has direct false-positive implications.

---

## Section 3: Open issues for human review

- **No surviving Critical findings.** Moderate-1 (supporting-document VoIP scoped out) is addressed by the callback SOP. Moderate-2 (score opacity) has a concrete threshold-tuning suggestion.
- **[vendor-gated] Telesign PhoneID and Score pricing:** All per-call costs are from third-party sources, not Telesign directly. Sales contact required.
- **[vendor-gated] SIM-swap add-on availability:** Requires full-service tier. Access and pricing require Telesign sales engagement.
- **[unknown] Telesign API rate limits:** Not published.
- **[unknown] Google Voice academic adoption rate:** Estimated 5–15% but unsourced. This drives the largest false-positive volume.
- **[unknown] Institutional PBX misclassification rate:** Estimated 5–10% based on cloud PBX migration trends. Depends on how carriers register number blocks in LERG/numbering databases.
- **[unknown] Telesign Score API false-positive rate:** Not published. The 1–3% estimate at the 700 threshold is a rough guess.
- **Risk-score threshold tuning:** The 700 threshold is arbitrary. Stage 5 suggested lowering to 500 for SOC orders. The trade-off between false-negative rate (missing prepaid burner SIMs) and false-positive rate (flagging legitimate high-zip customers) requires empirical calibration with production data.
- **Score opacity for adjudication:** Telesign does not publish model features. Reviewers working flagged cases cannot explain to the customer why they were flagged. This creates customer-experience and potential regulatory risk (if phone-number geography correlates with protected classes).
