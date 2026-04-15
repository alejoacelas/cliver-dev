# m03-smarty-melissa — implementation v1

- **measure:** M03
- **name:** Smarty / Melissa address verification
- **modes:** D
- **summary:** Submit each shipping address to Smarty (formerly SmartyStreets) US Street Address API and/or Melissa Global Address Verification. Both vendors return DPV match status and a CMRA flag for US addresses; Melissa Global covers international. Use these as the primary CMRA / packaging-store / international-PO-box detector where USPS Web Tools is unavailable or insufficient.

## external_dependencies

- **Smarty US Street Address API** + Smarty International ([Smarty US Street API docs](https://www.smarty.com/docs/cloud/us-street-api); [Smarty pricing](https://www.smarty.com/pricing)).
- **Melissa Global Address Verification** ([Melissa GAV pricing on G2](https://www.g2.com/products/melissa-global-address-verification/pricing); [GitHub: MelissaData/GlobalAddressVerification-Python3](https://github.com/MelissaData/GlobalAddressVerification-Python3)).

Both rely on the USPS DPV/CMRA datasets domestically and on country-specific postal data internationally.

## endpoint_details

### Smarty
- **URL:** `https://us-street.api.smarty.com/street-address` (US); `https://international-street.api.smarty.com/verify` (intl).
- **Auth:** Auth ID + Auth Token query string, or embedded key for client-side. Server-side recommended for KYC.
- **Pricing:** US verification advertised as low as ~$0.60 per 1,000 lookups at low volumes; volume tiers from free trial up to enterprise infinite plans ([Smarty pricing](https://www.smarty.com/pricing)). International is more expensive (per-country rates). `[best guess based on G2 review summaries: ~$0.0006–$0.005 per US lookup, ~$0.01–$0.05 per international lookup at small KYC volumes.]`
- **Rate limit:** Documented as 100k req/day default; higher available. `[unknown — searched for: "Smarty US street address API rate limit", "smartystreets requests per second", "smarty rate limit cloud"]`.
- **ToS:** Smarty's ToS permits use for customer-onboarding KYC. ([www.smarty.com/legal/terms-of-service] — `[unknown — searched for: "smarty terms of service KYC", "smartystreets commercial use customer screening"]`).

### Melissa
- **URL:** `https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress` ([Melissa Python SDK](https://github.com/MelissaData/GlobalAddressVerification-Python3)).
- **Auth:** License key in query string.
- **Pricing:** Tiered. `[Melissa GAV credit pricing per G2: Tier 1 $30 / 10k credits ($0.003/record); Tier 2 $84 / 30k ($0.0028); Tier 3 $285 / 100k ($0.00285); Tier 4 $1,395 / 500k ($0.00279)](https://www.g2.com/products/melissa-global-address-verification/pricing)` — note these are G2 user-supplied numbers, treat as best-guess order-of-magnitude.
- **Rate limit:** [unknown — searched for: "Melissa Global Address Verification rate limit", "melissa cloud API throttle"].
- **ToS:** [vendor-gated — Melissa publishes general terms but specific KYC use clauses require sales contact].

## fields_returned

### Smarty US response (relevant):
- `delivery_line_1`, `last_line` — normalized
- `metadata.rdi` — `Residential` | `Commercial`
- `analysis.dpv_match_code` — `Y`/`N`/`S`/`D`
- `analysis.dpv_cmra` — `Y`/`N` (CMRA flag)
- `analysis.dpv_vacant` — `Y`/`N`
- `analysis.active` — currently receiving mail
- `analysis.dpv_footnotes` — diagnostic codes

(Field list per [Smarty US Street API docs](https://www.smarty.com/docs/cloud/us-street-api).)

### Melissa Global response (relevant):
- `FormattedAddress`
- `AddressType` — code including PO box
- `AddressKey`
- `CountryName`
- `MelissaAddressKey`
- `Results` — comma-separated codes including `AV25` (CMRA), `AS01` (verified), `AC01..` (corrections). The CMRA Y/N is published as a single-character indicator in the verification result. `[vendor-described, not technically documented in the public docs link found]`

## marginal_cost_per_check

- **Per check (US, Smarty):** ~$0.0006–$0.005 `[best guess from G2 / vendor pricing]`.
- **Per check (intl, Melissa):** ~$0.003 `[from G2 user-reported tier pricing]`.
- **Setup cost:** Vendor contract + API key provisioning, ~1 engineer-day each.

## manual_review_handoff

1. If Smarty `dpv_cmra == Y` → flag CMRA. Reviewer asks customer: "Is this a packaging store / private mailbox? We require shipping to a verified institutional or residential address."
2. If Melissa returns CMRA equivalent on intl address → same.
3. If `dpv_match_code != Y` → ambiguous; reviewer manually researches the address.
4. If `metadata.rdi == Residential` → cross to m04 (residential check); not in scope here.
5. If both vendors disagree → log and prefer the more cautious flag.

## flags_thrown

| Flag | Trigger | Action |
|---|---|---|
| `smarty_cmra` | `analysis.dpv_cmra == Y` | Reviewer follow-up; deny if no institutional explanation |
| `smarty_po_box` | DPV footnotes include PO box codes | Deny |
| `melissa_cmra` | Melissa CMRA indicator Y | Same as Smarty |
| `melissa_po_box` | Melissa AddressType = PO box | Deny |
| `dpv_unmatched` | DPV != Y | Manual research |

## failure_modes_requiring_review

- Vendor coverage gaps in some countries — Melissa GAV covers 240+ countries but data depth varies; some African and Central Asian countries return only city-level matches.
- API timeout or 5xx → retry once; otherwise queue for manual.
- Brand-new addresses (within ~6 weeks of USPS DPV update cycle) may not yet be in DPV.
- Cross-border addresses (forwarder hubs) where the registered country and physical country differ.

## false_positive_qualitative

- Legitimate solo researchers and home labs that use a UPS Store or Mail Boxes Etc. mailbox for business correspondence (this is precisely the population the measure intends to flag, but some legitimate small biotechs do use CMRAs).
- International researchers in countries with partial DPV coverage will see `dpv_unmatched` more often than US researchers — must not auto-deny.

## record_left

- Full Smarty / Melissa JSON response cached
- Specific CMRA / DPV flags surfaced
- Vendor + dataset version (USPS DPV cycle date) so the result can be replayed

## attacker_stories_addressed

- `po-box-shipping` and `cmra-shipping` (M03 attacker stories): caught when the attacker uses a US CMRA (UPS Store etc.) — Smarty/Melissa flag the dpv_cmra.
- `foreign-buyer-shell`: Melissa's international coverage catches some intl PO-box equivalents but is patchy outside OECD countries.
