# Measure 13 — Phone VoIP check: Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| m13-twilio-lookup | Twilio Lookup v2 API (line type, carrier) | ~$0.005-$0.015/req | Minimal for passing; nonFixedVoip flags route to callback SOP (~5-15% of US academics) | 2 (inbox-compromise VoIP, credential-compromise VoIP enrollment) | Google Voice academics: 5-15% of US researchers flagged as false positive | SIM swaps invisible; real mobile on profile invisible; supporting-doc VoIP numbers out of scope |
| m13-telesign-phoneid | Telesign PhoneID + Score + SIM-swap add-on | ~$0.01-$0.05 (PhoneID+Score); ~$0.10 SIM-swap add-on | Same nonFixedVoip FP as Twilio; score opacity makes flagged-case adjudication difficult | 4 (inbox-compromise VoIP, account-hijack SIM-swap, credential-compromise SIM-swap, credential-compromise VoIP enrollment) | Score model opacity: reviewers cannot explain why a number was flagged | Real mobile on profile invisible; supporting-doc VoIP out of scope; non-SIM-swap ATO produces no signal |
| m13-callback-sop | Independent switchboard lookup + outbound call to institution | $2.50-$15/case (analyst time) | High: 5-15 min per escalated case; throughput limited to 5-20 escalations/day/analyst | 6 (inbox-compromise x3 scenarios, account-hijack, credential-compromise SIM-swap, it-persona-manufacturing) | No-switchboard customers: 15-25% of customers at orgs too small for switchboard | Purpose-built entities controlling their own switchboard are structurally invisible |
| m13-rebind-cadence | Telesign SIM-swap attribute + SMS OTP on 6-12 month cycle and high-risk events | ~$0.12/cycle ($0.24/yr) | Moderate: 10-15% of customers per cadence cycle trigger legitimate SIM-change freeze | 3 (account-hijack SIM-swap, credential-compromise SIM-swap, credential-compromise VoIP enrollment) | MVNO/prepaid carriers without SIM-swap data: 10-20% of US wireless subscribers | Non-SIM-swap ATO (session theft); fresh prepaid burner SIMs invisible; supporting-doc VoIP out of scope |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

These gaps appear in EVERY idea's coverage-gap list and represent limitations of M13 as currently conceived:

1. **Attacker's own real mobile number on profile.** All four ideas classify a genuine mobile number as "mobile" with no distinguishing signal. An attacker who commits their own phone (or a prepaid burner SIM) is structurally invisible to any phone-classification or SIM-swap check. This is not a data-source gap -- it is a fundamental limitation of M13's approach.

2. **VoIP numbers on supporting documents (not on profile).** All four ideas are scoped to the customer-profile phone field. When an inbox-compromise attacker places a VoIP callback number on a fabricated IBC letter while registering the real PI's mobile on the profile, no M13 check sees the VoIP number. This is an addressable scope limitation (extend checks to document-extracted callback numbers) but is currently universal.

3. **Fresh prepaid burner SIMs.** All four ideas miss these: Twilio and Telesign classify them as "mobile," the SIM-swap add-on shows no swap history, and the callback SOP reaches the attacker if they control the switchboard. Carrier-name flagging for prepaid providers (TracFone, Mint Mobile) is a potential soft signal but is not in any current SOP.

### Complementary gaps

| Gap | Ideas where it appears | Idea(s) that close it |
|---|---|---|
| SIM-swap detection | Twilio Lookup (no SIM-swap capability) | Telesign PhoneID (SIM-swap add-on), rebind-cadence (SIM-swap monitoring) |
| No-switchboard customers (small biotechs, solo consultants) | Callback SOP (15-25% exclusion) | Twilio + Telesign (automated, no switchboard needed) |
| Score model opacity | Telesign (opaque adjudication) | Twilio (simpler line-type classification, transparent); callback SOP (human judgment) |
| International unknown-type rates (10-25% in non-OECD) | Twilio, Telesign (both depend on same carrier databases) | Callback SOP (human OOB verification, language-dependent) |
| Cold-start / time-decay of one-time checks | Twilio, Telesign (point-in-time only) | Rebind-cadence (periodic re-verification) |

### Net coverage estimate

If a provider implemented all four ideas: **most** legitimate customers would be covered without friction (mobile/landline pass silently). However, an estimated **some** (15-25%) would experience at least one false-positive flag across the stack -- primarily Google Voice users (5-15%), institutional PBX misclassifications (5-10%), and legitimate SIM changes (10-15% per cadence cycle). The structural gap of "real mobile on profile" means no M13 idea provides signal on the majority of attacker branches, which pre-empt the measure entirely by using real phones.

## 3. Bypass cross-cut

### Universally uncovered bypasses

These attacker methods slip through EVERY idea's check:

1. **Attacker's own real mobile on profile.** 15 of 19 branches pre-empt M13 by committing a real personal or LLC-controlled mobile number. No M13 implementation can distinguish this from a legitimate customer's phone.

2. **Non-SIM-swap account takeover (session theft, AitM).** No phone-layer signal exists for attacks that bypass the phone entirely.

3. **Purpose-built entities controlling their own phone infrastructure.** Shell companies, CROs, community bio-labs, and incubator tenants control their own switchboard and phone lines. Even the callback SOP reaches the attacker.

### Bypass methods caught by at least one idea

| Bypass method | Caught by | Not caught by |
|---|---|---|
| VoIP number on customer profile | Twilio, Telesign, callback SOP | Rebind-cadence (indirect -- triggers re-verify on old number if phone changed) |
| SIM-swap of target's mobile | Telesign (SIM-swap add-on), rebind-cadence | Twilio (no SIM-swap detection), callback SOP (PBX may forward to swapped SIM) |
| Fabricated letter with VoIP callback | Callback SOP (independent switchboard lookup ignores attacker's number) | Twilio, Telesign, rebind-cadence (all scoped to profile phone only) |
| Helpdesk social engineering with burner | Callback SOP | Twilio, Telesign, rebind-cadence |
| Fabricated persona with no real person at institution | Callback SOP ("no-such-person" result) | Twilio, Telesign, rebind-cadence |

### Attacker stories where every idea fails

The by-measure file identifies that **15 of 19 branches** have no relevant engagement with M13, pre-empting it by using real mobile numbers. The four engaged branches are inbox-compromise, account-hijack, credential-compromise, and shell-nonprofit. Of these, **shell-nonprofit** defeats all four ideas (burner SIM classified as mobile; attacker controls switchboard).

## 4. Bundling recommendations

**Recommended bundle: Twilio Lookup + Telesign PhoneID + callback SOP + rebind-cadence (all four).**

The four ideas form a complementary stack rather than competing alternatives:

- **Twilio + Telesign** together provide dual-source line-type classification plus SIM-swap detection (Telesign's unique contribution). The provider-disagreement signal between the two is itself valuable. Cost: ~$0.02-$0.06 per customer at signup, plus ~$0.10 SIM-swap add-on. Negligible in the context of a synthesis order.

- **Callback SOP** is the only idea that catches fabricated identities (no-such-person at institution) and is immune to profile-phone manipulation. It must be positioned as an escalation tool (5-15 min/case), triggered by flags from Twilio/Telesign or by other M-series flags (M12 billing mismatch, suspicious supporting docs).

- **Rebind-cadence** addresses the time-decay problem that one-time checks cannot: a phone verified at signup may be swapped months later. The 6-month cadence + event-driven triggers (MFA change, first SOC order) provide ongoing monitoring.

**What the full bundle still leaves uncovered:** The structural limitation of M13 itself -- 15 of 19 attacker branches pre-empt the measure by using real phones. M13 is a weak-signal contributor in a multi-measure stack, not a primary defense. It catches a narrow band of convenience-driven VoIP usage and opportunistic SIM-swaps. The by-measure assessment is direct: "M13 as scoped (customer profile phone) addresses a tiny fraction of corpus tradecraft."

**Operational cost note:** Running all four ideas does not create multiple vendor contracts beyond the two phone-intelligence APIs (Twilio and Telesign, both sales-led but standard). The callback SOP is internal. The rebind-cadence shares the Telesign SIM-swap integration. The main operational cost is the false-positive volume from Google Voice academics (~5-15%) and legitimate SIM changes (~10-15% per cadence cycle), both of which route to the callback SOP's analyst queue.
