# m13-telesign-phoneid — Implementation v1

- **measure:** M13 — phone-voip-check
- **name:** Telesign PhoneID + Score (line type, carrier, risk, recent SIM swap)
- **modes:** D, A (defensive line-type detection + asymmetric risk-score signal)
- **summary:** Call Telesign PhoneID on the customer-supplied phone number. PhoneID returns the line type (mobile / landline / VoIP / fixed VoIP / non-fixed VoIP / payphone), carrier, country, and identity-attribute add-ons including SIM-swap, porting status, subscriber status. The Telesign Score / Intelligence Cloud product layers a 0–1000 risk score on top of the same number, with a recommendation field. PhoneID is the natural second source on top of m13-twilio-lookup; the two providers occasionally disagree on edge cases (resold MVNO numbers, ported numbers, fixed-line VoIP) and discrepancy itself is a useful signal.
- **attacker_stories_addressed:** inbox-compromise (attacker-controlled VoIP on supporting documents — PhoneID line type catches it), credential-compromise (SIM-swap variant — sim_swap add-on catches it), account-hijack (sim-swap variant), the broader "burner-phone" usage cited across the inbox-compromise / shell-nonprofit corpus.

## external_dependencies

- **Telesign PhoneID API** — primary. [source](https://www.telesign.com/products/phone-id) [source](https://developer.telesign.com/enterprise/docs/phone-id-get-started)
- **Telesign Intelligence Cloud / Score API** — overlay risk-score product. [source](https://developer.telesign.com/enterprise/docs/score-api-get-started)
- **PhoneID add-ons:** Porting Status [source](https://developer.telesign.com/enterprise/docs/phoneid-api-add-ons-porting-status), SIM Swap [source](https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap).
- Telesign customer account; full-service tier needed for some add-ons (SIM swap explicitly).

## endpoint_details

- **PhoneID:** `GET https://rest-api.telesign.com/v1/phoneid/{phone_number}` (per Telesign developer docs). [source](https://developer.telesign.com/enterprise/docs/phone-id-get-started)
- **Score API:** `GET https://rest-api.telesign.com/v1/score/{phone_number}` (per Intelligence Cloud docs). [source](https://developer.telesign.com/enterprise/docs/score-api-get-started)
- **Auth:** Telesign Customer ID + API key, HTTP Basic auth (or HMAC for higher-security setups).
- **Rate limits:** standard enterprise tier; concrete numbers `[unknown — searched for: "Telesign PhoneID rate limit", "Telesign API throughput per second"]`. Also accessible via RapidAPI marketplace which has its own throttles. [source](https://rapidapi.com/telesign/api/telesign-phoneid/pricing)
- **Pricing:** PhoneID $0.005–$0.011 per request per third-party summaries. [source](https://www.dropcowboy.com/blog/how-much-does-telesign-cost/) `[best guess: $0.005 standard/$0.011 with add-ons; verify with Telesign sales quote]`. Score API and SIM-swap add-on are full-service-only and quoted separately by Telesign sales. [vendor-gated — public pricing pages cover SMS/Voice; PhoneID and Score require sales contact](https://www.telesign.com/pricing)
- **ToS:** Telesign explicitly markets PhoneID for fraud, KYC, and account-takeover use cases.

## fields_returned

Per Telesign PhoneID documentation:

- `phone_number` (original and cleansed)
- `phone_type` — `{code, description}` where description includes `MOBILE`, `LANDLINE`, `FIXED VOIP`, `NON-FIXED VOIP`, `TOLL-FREE`, `PAGER`, `PAYPHONE`, `INVALID`. [source](https://developer.telesign.com/enterprise/docs/phone-id-get-started)
- `carrier.name` — telecom carrier
- `location.{city, state, country, zip, time_zone, coordinates}`
- `numbering` block (cleansed/canonical)
- Add-ons (when subscribed):
  - `porting_status` — has the number been ported recently
  - `sim_swap.risk_indicator` — 1–4 (see m13-rebind-cadence)
  - `subscriber_status` (when available)

Per Score / Intelligence Cloud:

- `risk.score` — integer 0–1000, higher = riskier. [source](https://developer.telesign.com/enterprise/docs/score-api-get-started)
- `risk.level` — categorical (e.g., low / medium / high)
- `risk.recommendation` — one of `allow` / `flag` / `block`

## marginal_cost_per_check

- PhoneID alone: ~$0.005–$0.011 per call.
- Score API: `[best guess: ~$0.02–$0.05 per call based on positioning as a higher-value KYC product]`
- SIM-swap add-on: ~$0.10/query [source](https://www.dropcowboy.com/blog/understanding-telesign-pricing-for-businesses/) `[treat as best-guess from third-party blog]`
- Per customer at signup: ~$0.01–$0.05 for PhoneID + Score, plus periodic SIM-swap on cadence (see m13-rebind-cadence).
- **setup_cost:** Telesign account opening, sales-led contracting (1–4 weeks), engineering integration ~1 week.

## manual_review_handoff

1. PhoneID called on every new customer; Score called for SOC orders or high-value customers.
2. **`phone_type` = MOBILE or LANDLINE, risk.score < 400** → no action; record on file.
3. **`phone_type` = FIXED VOIP** (e.g., RingCentral, Vonage business, Cisco PBX) → likely a real institutional VoIP PBX; not a flag by itself, but combined with M12 mismatches or SOC content escalates.
4. **`phone_type` = NON-FIXED VOIP** (Google Voice, Skype, TextNow, Bandwidth.com retail BYOC) → flag `phone_nonfixed_voip`; route to m13-callback-sop for out-of-band confirmation.
5. **`risk.score ≥ 700` or `risk.recommendation = block`** → hold; senior compliance review; ask the customer to provide an alternate institutional contact.
6. **PhoneID and Twilio Lookup disagree on line type** → flag `phone_provider_disagreement`; treat as soft-flag and route to callback SOP.
7. **`sim_swap.risk_indicator ≥ 3`** → freeze the customer's account; trigger m13-rebind-cadence remediation.

## flags_thrown

- `telesign_nonfixed_voip`
- `telesign_high_risk_score`
- `telesign_recent_sim_swap`
- `telesign_porting_recent`
- `telesign_block_recommended`
- `phone_provider_disagreement` (PhoneID vs Twilio)

## failure_modes_requiring_review

- Score recommendation field is opaque — Telesign does not publish the model. Reviewers cannot tell **why** a number scored high. Mitigation: capture the response in the case file, document the rule that fired, and never auto-deny purely on score.
- Some carriers (especially small MVNOs and international carriers) return incomplete data — `phone_type` may be `OTHER` or `UNKNOWN`. Treat as inconclusive, route to callback.
- Recently-ported numbers from a real mobile to a VoIP carrier (or vice-versa) can produce intermittent classification.
- API outage: Telesign has 99.9%+ SLA but is not infinitely reliable. Have a degrade-gracefully fallback to Twilio Lookup.
- Rate-limit hit during a burst of new orders.

## false_positive_qualitative

- Legitimate institutions running corporate VoIP (RingCentral, Cisco WebEx Calling, Zoom Phone, 8x8) — `FIXED VOIP`. Should not flag.
- Researchers using Google Voice as a stable forwarding number for their real cell — `NON-FIXED VOIP` will fire even though the user is real.
- International researchers whose number is on a carrier Telesign classifies as low-confidence.
- Risk-score false positives at the score-tail: customers in high-fraud-rate ZIP codes or using carriers with bad reputations get pushed up by neighborhood signal even though they are legitimate.

## record_left

`{customer_id, phone_number, phone_type, carrier, country, risk_score, risk_level, risk_recommendation, sim_swap_risk_indicator, porting_status, queried_at, source: "telesign-phoneid"}`. Auditable.

## sources

- [Telesign PhoneID product](https://www.telesign.com/products/phone-id)
- [Telesign PhoneID — Get started](https://developer.telesign.com/enterprise/docs/phone-id-get-started)
- [Telesign PhoneID overview](https://developer.telesign.com/enterprise/docs/phone-id-overview)
- [Telesign Intelligence / Score API — Get started](https://developer.telesign.com/enterprise/docs/score-api-get-started)
- [Telesign Phone ID — Porting Status add-on](https://developer.telesign.com/enterprise/docs/phoneid-api-add-ons-porting-status)
- [Telesign Phone ID — SIM Swap add-on](https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap)
- [Telesign pricing landing](https://www.telesign.com/pricing)
- [Telesign on RapidAPI (third-party tier listing)](https://rapidapi.com/telesign/api/telesign-phoneid/pricing)
- [Drop Cowboy — How much does Telesign cost (third-party summary)](https://www.dropcowboy.com/blog/how-much-does-telesign-cost/)
