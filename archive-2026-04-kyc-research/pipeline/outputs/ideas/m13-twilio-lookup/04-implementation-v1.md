# m13-twilio-lookup — Implementation v1

- **measure:** M13 — phone-voip-check
- **name:** Twilio Lookup v2 — Line Type Intelligence
- **modes:** D
- **summary:** Twilio Lookup v2 exposes a `line_type_intelligence` data package that returns the phone number's carrier and one of 12 line-type values (`mobile`, `landline`, `fixedVoip`, `nonFixedVoip`, `tollFree`, `personal`, `premium`, `sharedCost`, `uan`, `voicemail`, `pager`, `unknown`). For DNA-synthesis customer onboarding, classifying the customer-supplied phone as `nonFixedVoip` (Google Voice, Skype, TextNow class numbers) is a soft flag; `fixedVoip` is generally not (corporate PBX is normal at universities); `mobile` and `landline` are positive. Twilio is the cheapest, simplest, fastest M13 implementation; pair with a second source (m13-telesign-phoneid) for disagreement-resolution and with the callback SOP for escalation.
- **attacker_stories_addressed:** inbox-compromise (attacker-controlled VoIP on supporting documents), the burner-phone references in shell-nonprofit and inbox-compromise. Pre-empted by SIM-swap branches that keep a real mobile on file.

## external_dependencies

- **Twilio Lookup v2 API** — Twilio platform account. [source](https://www.twilio.com/docs/lookup/v2-api)
- **Line Type Intelligence data package**. [source](https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence)

## endpoint_details

- URL: `GET https://lookups.twilio.com/v2/PhoneNumbers/{PhoneNumber}?Fields=line_type_intelligence` [source](https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence)
- Auth: Twilio Account SID + Auth Token (HTTP Basic), or API Key/Secret.
- Coverage: line type intelligence is available for phone numbers worldwide. [source](https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence)
- Rate limits: standard Twilio REST API limits — Lookup v2 documented as supporting high throughput; Twilio scales horizontally per account. `[best guess: 100+ rps soft cap; raise via Twilio support]`. `[unknown — searched for: "Twilio Lookup v2 rate limit", "Twilio Lookup throughput per second", "Twilio Lookup API quota"]`
- Pricing: paid per request; Twilio publishes Lookup pricing on the dedicated page. [source](https://www.twilio.com/en-us/user-authentication-identity/pricing/lookup) `[best guess: ~$0.005–$0.015 per Line Type Intelligence call in early 2026, based on long-standing Twilio Lookup pricing tiers and carrier-data fee passthrough; verify on the live pricing page]`
- ToS: Twilio's Acceptable Use Policy permits Lookup for fraud, KYC, and compliance use cases.

## fields_returned

Per Twilio Lookup v2 with `line_type_intelligence`:

- Top-level: `calling_country_code`, `country_code`, `phone_number` (E.164), `national_format`, `valid`, `validation_errors`, `caller_name` (if requested), `line_type_intelligence`, etc.
- `line_type_intelligence` block:
  - `carrier_name`
  - `mobile_country_code`
  - `mobile_network_code`
  - `type` — one of `mobile`, `landline`, `fixedVoip`, `nonFixedVoip`, `tollFree`, `personal`, `premium`, `sharedCost`, `uan`, `voicemail`, `pager`, `unknown`. [source](https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence)
  - `error_code` (if any)
- Carrier data is **not** available for the line types `personal`, `tollFree`, `premium`, `sharedCost`, `uan`, `voicemail`, `pager`, `unknown`. [source](https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence)

## marginal_cost_per_check

- ~$0.005–$0.015 per Line Type Intelligence request `[best guess based on long-standing Twilio Lookup pricing tiers]`. [source](https://www.twilio.com/en-us/user-authentication-identity/pricing/lookup)
- One call per customer at signup; rerun on the same cadence as m13-rebind-cadence (every 6–12 months).
- **setup_cost:** Negligible. Twilio account already exists at most providers (most use Twilio for transactional SMS); adding Lookup is a few hours of engineering plus billing approval.

## manual_review_handoff

1. On new customer signup (and on rebind cadence), call Lookup with `Fields=line_type_intelligence`.
2. **`type` = `mobile` or `landline`** → no action; record on file.
3. **`type` = `fixedVoip`** → soft positive (corporate PBX, common at universities and large institutions). No flag unless other M-checks fire.
4. **`type` = `nonFixedVoip`** → flag `phone_nonfixed_voip`; route to m13-callback-sop. Do not block on this alone — many legitimate users have Google Voice as primary contact.
5. **`type` = `tollFree`** → flag `phone_tollfree`; ask the customer for a direct contact number; toll-free as the *only* customer contact is unusual for an individual researcher.
6. **`type` = `voicemail` / `pager` / `personal` / `premium` / `sharedCost` / `uan`** → flag `phone_implausible_for_individual`; require a different contact number.
7. **`type` = `unknown` or API error** → fall back to second source (m13-telesign-phoneid); if also unknown, route to callback SOP.
8. **`valid = false`** → block; require a valid phone.

## flags_thrown

- `phone_nonfixed_voip` — soft, escalate.
- `phone_tollfree` — request alternative.
- `phone_implausible_for_individual` — request alternative.
- `phone_invalid` — block.
- `phone_lookup_error` — fall through.

## failure_modes_requiring_review

- Twilio classification disagrees with Telesign (or carrier metadata is stale). Mitigation: log both, treat disagreement as a soft flag, prefer the more conservative classification.
- A line is recently ported from a real mobile to nonFixedVoip (or vice versa) — Lookup may show pre-port classification briefly.
- API outage — Twilio status page tracks; degrade to Telesign-only.
- A legitimate institutional VoIP PBX uses a carrier Twilio classifies as `nonFixedVoip` rather than `fixedVoip`. Mitigation: maintain an internal allowlist of known institutional carriers/numbers.
- BYOC numbers (Bring Your Own Carrier) where the underlying line is a fixed PBX but the porting status looks non-fixed.

## false_positive_qualitative

- Researchers using Google Voice as their stable forwarding number — `nonFixedVoip` will fire even though the customer is real and reachable. Anecdotally common in academia for cross-institution and visiting-scholar arrangements.
- International researchers whose home carrier maps to `unknown` in Twilio's database.
- Customers with Skype-In numbers, TextNow, or similar privacy-preserving second-line apps used for non-fraud reasons (privacy / dual-SIM management).
- Recently-ported numbers (mobile → BYOC or PBX) flagged briefly until carrier registry catches up.

## record_left

`{customer_id, phone_number_e164, line_type, carrier_name, mobile_country_code, mobile_network_code, valid, queried_at, source: "twilio-lookup-v2"}`. Auditable.

## sources

- [Twilio Lookup v2 API](https://www.twilio.com/docs/lookup/v2-api)
- [Twilio Lookup v2 Line Type Intelligence](https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence)
- [Twilio Lookup quickstart](https://www.twilio.com/docs/lookup/quickstart)
- [Twilio Lookup pricing](https://www.twilio.com/en-us/user-authentication-identity/pricing/lookup)
- [Twilio blog — Line Type Intelligence GA announcement](https://www.twilio.com/en-us/blog/products/launches/generally-available-lookup-line-type-intelligence)
- [Twilio Lookup Line Type Override](https://www.twilio.com/docs/lookup/v2-api/line-type-override)
