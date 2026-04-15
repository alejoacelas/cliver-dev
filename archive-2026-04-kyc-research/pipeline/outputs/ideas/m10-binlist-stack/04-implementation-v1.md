# m10-binlist-stack — implementation v1

- **measure:** M10 — payment-bin-giftcard
- **name:** BIN classification stack (binlist.net + BinDB + NeutrinoAPI)
- **modes:** D
- **summary:** Classify the BIN (first 6–8 digits) of the customer's purchasing card via three independent BIN-data sources to identify card brand, issuer, country, and crucially the `prepaid` and `gift` flags. Used at payment intake for SOC orders. Multiple sources are stacked because BIN tables vary in coverage and freshness, and the gift-card detection question is binary (any one source flagging the card is sufficient).

## external_dependencies

- binlist.net free API (legacy / transitional) ([source](https://binlist.net/))
- BinDB Payment Card Identification REST service or PCI Data File license ([source](https://www.bindb.com/))
- NeutrinoAPI BIN Lookup ([source](https://www.neutrinoapi.com/api/bin-lookup/))
- Payment processor's own BIN metadata (Stripe Radar, Adyen RevenueProtect) — implicit fallback if direct integration is the customer relationship.

## endpoint_details

- **binlist.net:** `https://lookup.binlist.net/{bin}` — REST + JSON, no auth, free. **Rate limit: 5 requests/hour with burst of 5 per the official docs; some sources report 10 requests/minute as updated** ([source](https://binlist.net/)). 429 status when exceeded. **Important:** binlist.net "ceased updates and users must transition to the paid IIN List service by August 15, 2023" per a service transition notice — meaning binlist.net data is stale relative to BIN issuances after mid-2023 ([source](https://www.scribd.com/document/825296718/Free-BINIIN-Lookup-Web-Service-binlist-net)). Use only as a tertiary cross-check, not the primary signal.
- **BinDB:** REST web service or PCI Data File license. Pricing: not publicly listed per call; vendor sells annual/monthly licenses [vendor-gated — public pricing page exists at https://www.bindb.com/pricing but per-tier numbers require sales contact]. BinDB advertises identification of "over 12,000 different prepaid, virtual and gift cards" with reloadable / non-reloadable distinction ([source](https://www.bindb.com/identify-prepaid-cards)). Monthly data updates ([source](https://www.bindb.com/bin-database)).
- **NeutrinoAPI BIN Lookup:** `https://neutrinoapi.net/bin-lookup` — REST + JSON, API key auth. The response includes a boolean `is-prepaid` field plus card-brand, card-type, country, issuer, validity ([source](https://www.neutrinoapi.com/api/bin-lookup/)). Pricing per the on-demand pricing page: starts at $0.0008–$0.005 per call depending on plan tier [unknown — searched for: "neutrinoapi bin lookup price per call", "neutrinoapi pricing tiers monthly"]. Free trial tier available.
- **ToS:** all three vendors permit production use including KYC / fraud screening under their commercial terms.

## fields_returned

- **binlist.net:** number (length, luhn), scheme (visa/mastercard/amex/etc.), type (debit/credit/charge), brand (Visa Classic, Mastercard World, etc.), prepaid (boolean), country (numeric, alpha2, name, emoji, currency, latitude/longitude), bank (name, url, phone, city) ([source](https://binlist.net/)).
- **BinDB:** issuer name + country, scheme, card type (credit / debit / charge / prepaid), prepaid flag, gift flag, virtual-card flag, reloadable flag, card brand sub-product. Per vendor: "12,000+ prepaid/virtual/gift card" identifications ([source](https://www.bindb.com/identify-prepaid-cards)).
- **NeutrinoAPI:** card-brand, card-type, country (name + ISO codes), issuer, issuer-website, issuer-phone, ip-blocklists, ip-country, valid (boolean), is-commercial (boolean), **is-prepaid** (boolean) ([source](https://www.neutrinoapi.com/api/bin-lookup/)).

**Note:** binlist.net's `prepaid` field is a single boolean — it does not separately indicate gift vs reloadable. NeutrinoAPI similarly returns only `is-prepaid`. **Only BinDB advertises a separate "gift card" classification distinct from "prepaid"** ([source](https://www.bindb.com/identify-prepaid-cards)). For measure 10's specific gift-card-detection requirement, BinDB is the load-bearing source.

## marginal_cost_per_check

- **binlist.net:** $0 (free) but quota-limited and stale post-2023.
- **NeutrinoAPI:** ~$0.001–$0.005 per BIN lookup [best guess from on-demand pricing page reference; specific numbers vendor-gated].
- **BinDB:** annual license $X,000 amortized; per-call effective cost depends on volume [vendor-gated].
- **Combined per check:** ~$0.005–$0.05 [best guess: dominated by BinDB amortized cost].
- **Setup cost:** ~2 engineering days for the three-API wiring + stacking logic.

## manual_review_handoff

- Reviewer receives: BIN (first 8 digits — never the full PAN), card brand, issuer, country, prepaid/gift flags from each of the three sources, and the consensus.
- Playbook (SOC orders only per measure 10 scope):
  1. **Any source flags `gift` = true:** flag `bin_gift`. Action: deny payment, request alternative payment method (institutional PO, business card, wire). Do not prompt the customer with the reason in the first message; ask them to provide a different payment method.
  2. **Any source flags `prepaid` = true but no `gift`:** flag `bin_prepaid`. Reviewer follow-up: many legitimate corporate-card programs (T&E reloadable cards, virtual single-use cards from Brex/Ramp/Airbase) flag prepaid. Reviewer asks the customer if the card is a corporate single-use virtual card; if yes and the customer's identity/affiliation is otherwise solid, allow with note.
  3. **All sources return unknown / no record for the BIN:** flag `bin_unknown`. Manual reviewer escalates: lookup the BIN on the issuer's own page or via the payment processor.
  4. **All sources return non-prepaid, non-gift, valid issuer:** pass on this idea.

## flags_thrown

- `bin_gift` — at least one source identifies the BIN as a gift card. Auto-deny payment for SOC orders per measure 10.
- `bin_prepaid` — prepaid but not gift. Reviewer adjudication.
- `bin_unknown` — no source has the BIN. Reviewer escalates.

## failure_modes_requiring_review

- **BIN-table lag** — the universe of issued BINs changes constantly, especially for fintech-issued virtual cards and corporate-card programs. binlist.net is acknowledged stale post-2023 ([source](https://www.scribd.com/document/825296718/Free-BINIIN-Lookup-Web-Service-binlist-net)). BinDB advertises monthly updates; NeutrinoAPI does not publish a refresh cadence [unknown — searched for: "neutrinoapi bin database update frequency"].
- **6-digit vs 8-digit BIN granularity** — Visa and Mastercard moved to 8-digit BINs in 2022; legacy 6-digit lookups may misclassify within an issuer's product mix ([best guess: derived from Visa/Mastercard public industry guidance on the BIN expansion]).
- **API rate limits / 429** on binlist.net's free tier; need backoff.
- **Conflicting sources** — what to do when one source says prepaid and another says credit. The stacking convention here is "any flag wins for gift, majority wins for prepaid" but is a policy choice.
- **Disagreement on gift vs prepaid** — only BinDB cleanly separates the two. Without BinDB, the screen collapses to "prepaid" only and the measure (which targets gift cards specifically) is over-broad.

## false_positive_qualitative

- **Corporate card programs** — Brex, Ramp, Mercury, Airbase, Stripe Issuing all issue card products that BIN tables sometimes classify as prepaid because they're funded from a balance, not a revolving credit line. The legit-customer FP rate here is non-trivial as these are common in real biotech startups.
- **Virtual single-use cards** — security-conscious customers (especially academic procurement systems and large corporate T&E systems) issue single-use virtual cards for online purchases; these are flagged as prepaid by some sources.
- **Foreign-issued debit cards** — sometimes mis-flagged due to thin issuer data on non-US BINs.
- **Non-US BIN coverage** is generally sparser than US, raising `bin_unknown` rates for legitimate international customers.

(Note: per the measure-10 attacker mapping file, no attacker story in the corpus actually uses a gift card BIN against the synthesis provider; the closest are prepaid-virtual-card sub-options in two branches. So this measure's false-positive vs true-positive picture is dominated by the FP side.)

## record_left

- BIN (first 8 digits only — never store the full PAN), responses from each of the three sources, the consensus classification, and the action taken. Stored in the customer / order file with timestamp.

## bypass_methods_known

[deferred to stage 5]

## bypass_methods_uncovered

[deferred to stage 5]

---

**Sources cited:**
- binlist.net: https://binlist.net/
- binlist.net service transition notice: https://www.scribd.com/document/825296718/Free-BINIIN-Lookup-Web-Service-binlist-net
- BinDB main: https://www.bindb.com/
- BinDB BIN database product: https://www.bindb.com/bin-database
- BinDB prepaid / gift identification: https://www.bindb.com/identify-prepaid-cards
- NeutrinoAPI BIN Lookup: https://www.neutrinoapi.com/api/bin-lookup/
- NeutrinoAPI plans: https://www.neutrinoapi.com/plans/
