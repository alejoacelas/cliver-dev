# Measure 13 — Phone VoIP Check: Per-measure synthesis

## 1. Side-by-side comparison of selected ideas

| Field | m13-twilio-lookup | m13-telesign-phoneid | m13-callback-sop | m13-rebind-cadence |
|---|---|---|---|---|
| **Role in stack** | First-line automated screen | Second-line automated screen | Escalation-tier human verification | Temporal-coverage layer |
| **What it does** | Line-type classification (12-value enum) via Twilio Lookup v2 | Line-type + carrier + risk score + SIM-swap indicator via Telesign PhoneID/Score | Independent-switchboard outbound callback to confirm identity of named individual | Re-verify phone binding on cadence (6-12 mo) and high-risk events; SIM-swap monitoring |
| **Attacker stories caught** | VoIP on profile (inbox-compromise, credential-compromise VoIP enrollment) | VoIP on profile, SIM-swap (account-hijack, credential-compromise), risk-score anomalies | Fabricated callback numbers, helpdesk SE, real PI mobile on profile, no-such-person fabricated identities | SIM-swap (account-hijack, credential-compromise), VoIP enrollment via phone-change event |
| **Attacker stories missed** | SIM-swap, supporting-doc VoIP, real mobile on profile, burner SIMs | Supporting-doc VoIP, real mobile on profile, non-SIM-swap ATO, burner SIMs | PBX-to-SIM-swap forwarding, purpose-built entities controlling own switchboard | Supporting-doc VoIP, non-SIM-swap ATO (if outside cadence window), burner SIMs, attacker's own real mobile |
| **Per-check cost** | ~$0.005-$0.015 | ~$0.01-$0.05 (PhoneID+Score); +$0.10 for SIM-swap addon | $2.50-$15 (analyst time) + $0.05-$0.20 (telephony) | ~$0.12/cycle (~$0.24/customer/year) |
| **Setup cost** | Negligible (hours) | 1-4 weeks (sales-led) + 1 week eng | ~1 person-week | ~2-4 person-weeks |
| **Automation level** | Fully automated | Fully automated | Manual (5-15 min/case) | Automated with manual escalation |
| **Throughput** | Unlimited (API) | Unlimited (API) | 5-20 cases/day/analyst | Unlimited (batch jobs) |
| **Key flags** | phone_nonfixed_voip, phone_tollfree, phone_implausible_for_individual, phone_invalid, phone_lookup_error | telesign_nonfixed_voip, telesign_high_risk_score, telesign_recent_sim_swap, telesign_porting_recent, telesign_block_recommended, phone_provider_disagreement | callback_confirmed, callback_denied, callback_no_such_person, callback_voicemail_only, callback_transfer_failed | rebind_overdue, rebind_failed, sim_swap_recent, sim_swap_with_high_risk_event |
| **Dominant false-positive source** | Google Voice academics (5-15%), institutional PBX misclassification (5-10%) | Google Voice academics (5-15%), score opacity, international unknowns (15-30%) | Not-in-directory researchers (5-15%), unreachable researchers (10-20%) | Legitimate SIM changes (10-15% per cycle), eSIM provisioning |
| **Record left** | Structured lookup result | Structured PhoneID + score record | Structured call log + audio recording | Structured re-verify + swap result |

## 2. Coverage gap cross-cut

### Structural gaps (no idea in the stack addresses these)

| Gap | Why structural | Affected attacker stories |
|---|---|---|
| **Supporting-document VoIP numbers** | All four ideas are scoped to the customer-profile phone field. VoIP numbers placed on fabricated IBC letters, sponsor letters, or other supporting documents are never submitted to any API or checked by any SOP step. The callback SOP bypasses the document number by independently looking up the switchboard, but does not detect or flag the VoIP number itself. | inbox-compromise (fabricated letter callback numbers) |
| **Attacker's own real mobile on profile** | When an attacker registers with their own legitimate mobile number, all automated checks return MOBILE with low risk. The callback SOP catches this only if the attacker is impersonating someone at an institution where they are unknown. Purpose-built entities (shell companies, CROs, community bio-labs) that control their own switchboard defeat the callback too. | 15 of 19 attacker branches that pre-empt M13 by never using VoIP |
| **Fresh prepaid burner SIMs** | Classified as MOBILE by both Twilio and Telesign, below risk-score thresholds, no SIM-swap history. Carrier-name enrichment (flagging prepaid providers like TracFone, Mint Mobile) was raised but not implemented. | shell-nonprofit burner SIM, any branch using burner as profile phone |
| **Non-SIM-swap account takeover (session theft, AitM)** | No phone-layer signal exists for session theft or token replay. The rebind cadence catches these only if they coincide with a cadence check or trigger a high-risk event. Gap partially closeable by adding "new order from new device/IP" as a rebind trigger, but this requires auth-system integration. | account-hijack non-SIM-swap variants |
| **Score model opacity** | Telesign risk scores cannot be decomposed. Reviewers cannot explain to customers why they were flagged. Potential regulatory risk if geographic/demographic signals correlate with protected classes. | All cases routed via telesign_high_risk_score |

### Complementary gaps (addressed by composition of ideas)

| Gap in one idea | Covered by | Mechanism |
|---|---|---|
| Twilio: no SIM-swap detection | Telesign PhoneID sim_swap + rebind cadence | sim_swap risk_indicator >= 3 triggers freeze |
| Twilio/Telesign: cannot verify identity of person | Callback SOP | Independent switchboard call confirms named individual |
| Twilio/Telesign: point-in-time only | Rebind cadence | Re-runs checks on 6-12 month schedule and high-risk events |
| Twilio vs Telesign classification disagreement | phone_provider_disagreement flag | Disagreement itself is a routing signal to callback SOP |
| Callback SOP: not scalable for mass screening | Twilio + Telesign automated layer | Automated layer screens 100% of customers; callback only on escalation |
| Rebind cadence: SIM-swap false positives from legitimate changes | Callback SOP | Legitimate SIM-change freezes resolved via callback |

## 3. Bypass methods uncovered: attacker stories surviving the entire stack

The attacker mapping identified 4 branches that meaningfully engage M13. Cross-referencing against the full selected stack:

### 3.1 Fully caught

| Attacker story | How caught |
|---|---|
| **inbox-compromise VoIP on profile** | Twilio + Telesign both flag nonFixedVoip; routes to callback SOP which independently verifies via switchboard |
| **credential-compromise VoIP enrollment** | Twilio + Telesign flag nonFixedVoip; rebind cadence triggers re-verify on phone change event |
| **account-hijack SIM-swap** | Telesign sim_swap risk_indicator >= 3; rebind cadence catches post-onboarding swaps; callback SOP confirms with institution |
| **credential-compromise SIM swap** | Same as above |

### 3.2 Partially caught / ambiguous

| Attacker story | Residual bypass | Why partial |
|---|---|---|
| **inbox-compromise — fabricated letter with VoIP callback** | The attacker places a VoIP callback number on the fabricated letter but registers the real PI's mobile on the customer profile. | The automated layer sees MOBILE (clean). The callback SOP catches this by calling the institution independently (ignoring the letter's callback number). However, the VoIP number on the document is never flagged or logged. Detection depends entirely on the order being escalated to callback for other reasons. |
| **account-hijack — PBX forwards to SIM-swapped mobile** | The attacker SIM-swaps the PI's mobile. The institution's PBX is configured to forward calls to faculty mobiles. The callback SOP's independent switchboard call routes through the PBX and reaches the attacker. | The Telesign sim_swap flag catches this before the callback is needed. But if the SIM-swap window is outside Telesign's detection window, the callback SOP's forwarding vulnerability is exposed. |

### 3.3 Surviving the entire stack (M13 has no purchase)

| Attacker story | Why it survives | Mitigation domain |
|---|---|---|
| **Any branch using attacker's own real mobile** | Returns MOBILE, low risk, no swap history, passes callback if attacker controls the entity. | M9 (supporting documents), M18 (entity legitimacy), M12 (billing) — not M13 |
| **shell-nonprofit burner SIM** | Physical prepaid SIM classified as MOBILE, no swap signal. Attacker controls the shell org's switchboard. | M18 (entity legitimacy), M9 (supporting docs) |
| **Non-SIM-swap account takeover** | Session theft or AitM token replay produces zero phone-layer signal unless it coincides with a rebind trigger. | M8 (authentication hardening), device/IP-based detection |
| **15 other attacker branches** | These branches pre-empt M13 entirely by never using VoIP, never touching the phone field, or using real mobile throughout. M13 was never designed to catch them. | Other measures in the screening stack |

**Net assessment:** M13's selected stack fully covers the VoIP-on-profile and SIM-swap attack vectors. The residual bypasses are (a) supporting-document phone numbers that never enter the M13 pipeline, (b) real-mobile attackers who are structurally invisible to phone-type classification, and (c) purpose-built entities that control their own switchboard. These are correctly delegated to M9, M18, and M12 respectively. M13 addresses a narrow but real slice of the attacker corpus.

## 4. Structural gaps flagged as open issues

### Issue 1: Supporting-document phone numbers are out of scope

**Gap:** VoIP numbers on fabricated IBC letters, sponsor letters, and other supporting documents are never submitted to Twilio Lookup or Telesign PhoneID. The callback SOP bypasses these numbers but does not detect or flag them.

**Implication:** An inbox-compromise attacker who fabricates a letter with a VoIP callback number is caught only if the order is escalated for other reasons. If the automated layer passes the customer-profile phone (real PI mobile), the fabricated callback number is never inspected.

**Possible resolution:** Extract phone numbers from uploaded supporting documents and run them through the same Twilio/Telesign pipeline. This is a cross-measure integration (M9 document extraction feeding M13 phone checks) that would require document-parsing infrastructure.

### Issue 2: No carrier-name enrichment for prepaid/burner SIMs

**Gap:** Both Twilio and Telesign return carrier name, but neither SOP uses carrier name as a signal. Prepaid carriers (TracFone, Mint Mobile, Cricket) are classified as MOBILE and pass all checks.

**Implication:** Fresh prepaid burner SIMs — used by shell nonprofits and potentially other purpose-built entity branches — are structurally invisible to the entire M13 stack.

**Possible resolution:** Add a soft flag for known prepaid carrier names on SOC orders. Requires maintaining a carrier-name list and accepting increased false positives from legitimate prepaid users. Stage 5 raised this as a minor enhancement.

### Issue 3: Telesign score opacity creates adjudication and regulatory risk

**Gap:** The Telesign Score API returns a 0-1000 score with a recommendation but does not expose the underlying model features. Reviewers cannot explain to customers why they were flagged.

**Implication:** If phone-number geography or carrier signals correlate with protected classes (income, race, national origin), score-based flags could create disparate-impact risk. The SOP mitigates by never auto-denying on score alone, but the opacity remains.

**Possible resolution:** Use the Score API only as a routing signal to the callback SOP, never as an independent blocking criterion. Document this policy explicitly. Request feature-attribution data from Telesign if available.

### Issue 4: Rebind cadence false-positive burden is unquantified

**Gap:** Legitimate SIM changes (device upgrades, carrier switches, eSIM provisioning) produce sim_swap_recent flags at an estimated 10-15% rate per 6-month cadence cycle. Each triggers account freeze and callback SOP resolution.

**Implication:** For a provider with 10,000 active customers, a 6-month cadence could generate 1,000-1,500 false freezes per year, each requiring $2.50-$15 of analyst time to resolve via callback. Annual false-positive cost: $2,500-$22,500.

**Possible resolution:** Calibrate the cadence interval (6 vs 12 months) based on production data. Implement a "soft SIM-change" tier (risk_indicator = 3 routes to SMS re-verify rather than immediate freeze; risk_indicator = 4 freezes immediately). This requires empirical calibration that cannot be resolved without production data.

### Issue 5: Callback SOP directory-lag produces aggressive false blocks

**Gap:** The callback_no_such_person outcome routes to "block + senior compliance," but 5-15% of researchers at large universities may not appear in the online directory (new hires, visiting scholars, postdocs, adjuncts).

**Implication:** Legitimate customers receive the most aggressive negative outcome due to directory lag, not actual fraud.

**Possible resolution:** Add an intermediate outcome state ("directory-not-found but institution confirmed") that pauses the order for additional verification rather than blocking immediately. Stage 6 recommended this.

### Issue 6: Multiple pricing and rate-limit unknowns across vendors

**Gap:** Per-request pricing for Twilio Lookup (~$0.005-$0.015), Telesign PhoneID (~$0.005-$0.011), Telesign Score (~$0.02-$0.05), and Telesign SIM-swap (~$0.10) are all best guesses from third-party sources or long-standing pricing tiers. Rate limits for both APIs are unknown.

**Implication:** Cost modeling for the full stack is approximate. At scale, vendor pricing negotiations will determine actual blended cost.

**Possible resolution:** Obtain quotes from Twilio and Telesign sales before production deployment.
