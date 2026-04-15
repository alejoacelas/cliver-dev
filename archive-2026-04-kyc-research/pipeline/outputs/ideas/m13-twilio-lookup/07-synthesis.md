# Per-idea synthesis: m13-twilio-lookup

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Twilio Lookup v2 — Line Type Intelligence |
| **measure** | M13 — phone-voip-check |
| **attacker_stories_addressed** | inbox-compromise VoIP on profile (CAUGHT — nonFixedVoip flagged), credential-compromise VoIP enrollment (CAUGHT — nonFixedVoip flagged). All SIM-swap scenarios MISSED (Twilio does not detect SIM swaps). All real-mobile-on-profile scenarios MISSED. Supporting-document VoIP numbers MISSED (not scoped). Shell-nonprofit burner SIM MISSED (classified as mobile). |
| **summary** | Twilio Lookup v2 Line Type Intelligence returns the line type (one of 12 values including mobile, landline, fixedVoip, nonFixedVoip, unknown), carrier name, and country for any phone number worldwide. For DNA synthesis customer onboarding, nonFixedVoip (Google Voice, Skype, TextNow class) is a soft flag routed to the callback SOP; fixedVoip (corporate PBX) is not flagged; mobile and landline are positive. Twilio Lookup is the cheapest, simplest, fastest M13 implementation; pair with Telesign PhoneID for disagreement-resolution and SIM-swap detection. |
| **external_dependencies** | Twilio Lookup v2 API with Line Type Intelligence data package. Twilio platform account (most providers already have one for transactional SMS). |
| **endpoint_details** | URL: `GET https://lookups.twilio.com/v2/PhoneNumbers/{PhoneNumber}?Fields=line_type_intelligence`. Auth: Twilio Account SID + Auth Token (HTTP Basic) or API Key/Secret. Coverage: worldwide. Rate limits: [unknown — searched for Twilio Lookup v2 rate limits; best guess ~100+ rps, raise via support]. Pricing: ~$0.005–$0.015 per Line Type Intelligence request [best guess from long-standing pricing tiers; verify on live pricing page]. ToS: Acceptable Use Policy permits fraud, KYC, compliance use cases. |
| **fields_returned** | Top-level: calling_country_code, country_code, phone_number (E.164), national_format, valid, validation_errors. line_type_intelligence block: carrier_name, mobile_country_code, mobile_network_code, type (mobile/landline/fixedVoip/nonFixedVoip/tollFree/personal/premium/sharedCost/uan/voicemail/pager/unknown), error_code. Carrier data not available for types: personal, tollFree, premium, sharedCost, uan, voicemail, pager, unknown. |
| **marginal_cost_per_check** | ~$0.005–$0.015 per request [best guess]. One call per customer at signup; rerun on rebind cadence (6–12 months). **Setup cost:** Negligible — most providers already have Twilio accounts; adding Lookup is a few hours of engineering plus billing approval. |
| **manual_review_handoff** | 8-branch SOP: (1) Call Lookup on signup and rebind cadence. (2) mobile/landline → no action. (3) fixedVoip → soft positive (institutional PBX); no flag unless other checks fire. (4) nonFixedVoip → flag phone_nonfixed_voip; route to callback SOP; do not block alone (many legitimate Google Voice users). (5) tollFree → flag; request direct contact number. (6) voicemail/pager/personal/premium/sharedCost/uan → flag phone_implausible_for_individual; require different number. (7) unknown or API error → fall to Telesign; if both unknown, callback SOP. (8) valid=false → block; require valid phone. |
| **flags_thrown** | `phone_nonfixed_voip`, `phone_tollfree`, `phone_implausible_for_individual`, `phone_invalid`, `phone_lookup_error`. |
| **failure_modes_requiring_review** | Twilio vs Telesign classification disagreement (treat as soft flag, prefer conservative). Recently ported numbers with stale classification. Twilio API outage (degrade to Telesign-only). Institutional VoIP PBX misclassified as nonFixedVoip (maintain internal allowlist). BYOC numbers appearing non-fixed. |
| **false_positive_qualitative** | (1) Researchers using Google Voice as stable forwarding number — nonFixedVoip fires on every check; estimated 5–15% of US academics. (2) Institutional cloud PBX (RingCentral, Zoom Phone) misclassified as nonFixedVoip — estimated 5–10% of institutional numbers; Twilio offers Overrides API to correct per-provider. (3) International carriers mapping to unknown. (4) Recently ported numbers (1–3% at any time). (5) BYOC numbers (<2%). |
| **coverage_gaps** | **Gap 1 — Non-fixed VoIP users (Google Voice):** ~5–15% of US academics; false-positive. **Gap 2 — Institutional PBX misclassification:** ~5–10% of institutional numbers; false-positive (correctable via Overrides API). **Gap 3 — International unknown type:** <3% for US/UK/CA; 10–25% for less-covered markets; no signal. **Gap 4 — Recently ported numbers:** ~1–3% at any time; stale classification. **Gap 5 — BYOC numbers:** <2%; false-positive. |
| **record_left** | `{customer_id, phone_number_e164, line_type, carrier_name, mobile_country_code, mobile_network_code, valid, queried_at, source: "twilio-lookup-v2"}`. Auditable. |
| **bypass_methods_known** | inbox-compromise VoIP on profile — CAUGHT (nonFixedVoip). credential-compromise VoIP enrollment — CAUGHT (nonFixedVoip). |
| **bypass_methods_uncovered** | (1) SIM swaps — Twilio Lookup does not detect SIM swaps; requires Telesign or CAMARA. (2) VoIP numbers on supporting documents — not submitted to Lookup. (3) Attacker's own real mobile on profile — classified as mobile, no signal. (4) Fresh prepaid burner SIMs — classified as mobile; no carrier-name flagging for prepaid providers in the SOP. |

---

## Section 2: Narrative

### What this check is and how it works

Twilio Lookup v2 is a phone-number classification API that returns the line type, carrier name, and country for any phone number worldwide. The synthesis provider calls it on the customer's profile phone at onboarding (and on the rebind cadence). The key signal is the line type: nonFixedVoip (Google Voice, Skype, TextNow class) triggers a soft flag and routes to the callback SOP for out-of-band verification. fixedVoip (institutional PBX systems like RingCentral, Cisco, Zoom Phone) is treated as a soft positive — normal for university researchers. Mobile and landline are positive signals. The implementation uses an 8-branch decision tree covering all 12 line types Twilio can return.

### What it catches

Twilio Lookup catches the specific case where an attacker registers a non-fixed VoIP number (Google Voice, TextNow, Skype-In) as their customer-profile phone. This is relevant to the inbox-compromise scenario where the attacker creates a new identity with a disposable VoIP number, and to the credential-compromise scenario where the attacker enrolls a VoIP number for convenience after gaining access. The nonFixedVoip classification is a reliable signal for these number types — the underlying carrier databases correctly classify Google Voice and similar services. The check also validates phone number format and flags invalid numbers.

### What it misses

Twilio Lookup has three structural blind spots. First, it does not detect SIM swaps — the line type remains "mobile" after a SIM swap, so account-hijack and credential-compromise attackers who SIM-swap the target's number are invisible. SIM-swap detection requires Telesign PhoneID (m13-telesign-phoneid) or CAMARA. Second, the check is scoped to the customer-profile phone — VoIP numbers placed on supporting documents (fabricated letters with attacker callback numbers) are never submitted to Lookup. Third, any attacker using a real mobile number (their own or a prepaid burner) returns "mobile" with no distinguishing signal. Stage 5 noted that carrier-name flagging for prepaid providers (TracFone, Mint Mobile) could add a soft signal but is not in the current SOP.

### What it costs

Twilio Lookup is the cheapest M13 check: approximately $0.005–$0.015 per request with negligible setup cost (most providers already have Twilio accounts). The check runs once at signup and on the rebind cadence. Total per-customer annual cost at a 6-month cadence is roughly $0.01–$0.03. Engineering setup is minimal — a few hours to add the Lookup call and decision-tree logic. This makes it the natural first-line screening tool in the M13 stack.

### Operational realism

Twilio Lookup runs automatically with no human intervention for passing results (mobile, landline, fixedVoip). The manual-review burden comes from nonFixedVoip flags routed to the callback SOP. The Google Voice false-positive problem is the dominant operational concern: an estimated 5–15% of US-based academic researchers may use Google Voice as their primary number. Each of these fires the nonFixedVoip flag on every check, creating persistent friction. The Twilio Overrides API provides a mechanism to correct known institutional PBX misclassifications, but requires ongoing maintenance of an allowlist. International coverage is good (worldwide) but the "unknown" rate increases substantially outside OECD markets (estimated 10–25%), producing no-signal results that fall through to Telesign and ultimately to the callback SOP.

### Open questions

Per-request pricing is a best guess ($0.005–$0.015) that should be verified against the live Twilio pricing page. Rate limits are unknown. Stage 5 suggested adding carrier-name-based soft flagging for prepaid providers on SOC orders, which would partially address the burner-SIM gap but at the cost of false positives on legitimate prepaid users. The coverage gaps of Twilio Lookup and Telesign PhoneID overlap substantially — both depend on the same underlying carrier number-plan databases (LERG, ITU) — so running both adds disagreement-detection value but does not close the fundamental line-type classification gaps.

---

## Section 3: Open issues for human review

- **No surviving Critical findings.** Moderate-1 (no SIM-swap detection) is delegated to Telesign/rebind-cadence. Moderate-2 (profile-phone scope) is delegated to callback SOP.
- **[unknown] Twilio Lookup v2 rate limits:** Not published. Relevant for high-volume providers.
- **[best guess] Per-request pricing:** ~$0.005–$0.015 from long-standing pricing tiers. Should be verified on the live Twilio pricing page.
- **[unknown] Google Voice academic adoption rate:** Estimated 5–15% but unsourced. Drives the largest false-positive volume.
- **[unknown] International unknown-type rates:** Estimated <3% for US/UK/CA, 10–25% for less-covered markets. No Twilio-published accuracy metrics.
- **Carrier-name flagging for prepaid providers:** Stage 5 Minor-1 suggested this as an enhancement. Would partially address burner-SIM gap but needs a maintained carrier-name list and would increase false positives. Not implemented in the current SOP.
- **Twilio Overrides API for PBX misclassification:** Exists as a product feature, suggesting misclassification is common. Requires proactive maintenance of an institutional number allowlist.
- **attacker_stories_addressed accuracy:** Stage 5 noted the spec's attacker_stories_addressed field should clarify that Twilio Lookup catches VoIP enrollment, not SIM-swap, for credential-compromise.
