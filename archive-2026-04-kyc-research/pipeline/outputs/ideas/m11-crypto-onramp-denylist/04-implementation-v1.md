# m11-crypto-onramp-denylist — implementation v1

- **measure:** M11 (payment-no-crypto)
- **name:** Crypto-debit BIN + on-ramp referrer denylist
- **modes:** A
- **summary:** Maintain a denylist of BIN ranges issued by known crypto-debit-card programs (Coinbase Card / Pathward; Crypto.com Visa; BlockFi; Wirex; Binance Card) and a list of HTTP `Referer` / `Origin` domains belonging to fiat-to-crypto on-ramps (MoonPay, Ramp Network, Transak, Onramper, Wyre-successors). Hard-block at the PSP layer on a BIN match; block at the web-app edge (or flag for review) on a referrer match.
- **attacker_stories_addressed:** crypto-funding, crypto-debit-card. Note: per the measure-11 attacker-story mapping, no in-corpus branch routes crypto to the synthesis provider; this is a forward-looking defense-in-depth check.

## external_dependencies

- **Internal BIN denylist** of crypto-debit programs, curated quarterly. No third-party API at runtime if loaded into a PSP rule.
- **Web-app edge layer** (CDN / WAF / reverse proxy) capable of inspecting `Referer` and `Origin` request headers — Cloudflare WAF rules, AWS WAF, or in-application middleware.
- **PSP enforcement** (Stripe Radar custom rule on `card.bin`, Adyen Risk equivalent) for the BIN-list leg.
- **Curation labor** to refresh both lists; crypto card programs and on-ramp brands churn fast.

## endpoint_details

**BIN denylist leg:**

- Stripe Radar custom rule: `Block if :card_bin: in (<list>)` — Radar rule reference [source](https://docs.stripe.com/radar/rules/reference). Or use `:card_funding: = 'prepaid'` as a coarse co-trigger (most crypto-debit cards report as `prepaid` to the network because they are loaded from a custodial balance, not a deposit account).
- BIN sourcing: BinDB or Neutrino API can identify issuer + program; for crypto-specific programs the synthesis provider needs to manually curate which BINs from those issuers are crypto-program BINs (BinDB does flag "co-branded" cards; the cards are typically marketed under the crypto brand, not the issuing bank, so a BIN-database alone needs human filtering) [source](https://www.bindb.com/identify-prepaid-cards).
- Auth: PSP API key. Rate limits: PSP rate limits only.

**Referrer-denylist leg:**

- Inspect HTTP `Referer` and (where present) `Origin` headers on inbound checkout-page requests. Block or flag if the host matches a denylisted on-ramp domain (`moonpay.com`, `ramp.network`, `transak.com`, `onramper.com`, `mercuryo.io`, `simplex.com`, etc.).
- Implementation venue: Cloudflare WAF custom rule, AWS WAF, or application middleware. No external API.
- Auth: WAF/edge configuration access. Rate limits: none.
- Limitations: `Referer` is sent on cross-site navigations but is suppressed by `Referrer-Policy: no-referrer` (most modern privacy-focused setups), is stripped by some browsers on HTTPS→HTTP transitions, and is trivially spoofable from a non-browser client. So this leg catches naive flows but has near-zero adversarial value [best guess: based on standard browser referrer behavior; the W3C Referrer Policy spec and most modern browsers default to `strict-origin-when-cross-origin` which still leaks the origin, but not the path — search did not find a quantitative study of `Referer` presence rates on modern web traffic].

## fields_returned

**From the BIN/PSP leg** (per blocked transaction):

- `card.bin` (6-digit prefix)
- `card.funding` (`prepaid` for most crypto cards)
- `card.brand` (`visa` / `mastercard`)
- `card.issuer` (where Stripe populates it — e.g., "Pathward, N.A." for Coinbase Card)
- `card.country`
- The denylist entry that matched (program name)

**From the referrer leg** (per blocked request):

- `Referer` header value
- `Origin` header value (if present)
- Source IP, user-agent, timestamp
- The matched denylist entry

## marginal_cost_per_check

- **Per-check runtime cost:** ~$0 incremental beyond the PSP/WAF the provider already pays for. Stripe Radar rule evaluation is bundled; Cloudflare WAF custom rules are bundled in the WAF subscription.
- **Setup cost:** ~4–8 hours engineering to assemble the initial BIN list (manual curation against BinDB/Neutrino output, cross-referenced to crypto-card press releases) and the referrer list, plus deploy the rules. [best guess]
- **Refresh cost:** ~2 hours/quarter; crypto card programs churn (BlockFi shut down its card program in 2023; Wirex restructured its US operations) so the list ages.
- **Optional vendor data:** if the provider already subscribes to BinDB or similar for the m10 idea, no additional spend.

## manual_review_handoff

When `crypto_debit_bin_hit` fires:

1. PSP blocks the auth. Order enters "blocked — crypto card" queue.
2. Reviewer pulls the matched program name and the customer record.
3. Default: deny order, send templated message: "We do not accept crypto-funded debit cards. Please pay using a credit/debit card from a primary bank, an institutional purchase order, or ACH."
4. Exception path is essentially empty: there is no recognized institutional use of a crypto-debit card for synthesis purchasing.

When `crypto_onramp_referrer` fires:

1. WAF either blocks the request (default) or routes to a "review-on-arrival" queue (softer setting).
2. Reviewer is unlikely to encounter this in practice — a referrer hit means a customer arrived at the synthesis-provider checkout via an on-ramp domain, which is a coordination signal not a payment flow per se. Most likely scenario: a curiosity-driven user-agent path; lowest-likelihood scenario: an attacker who actually intended to fund through an on-ramp.
3. If a hit does land, reviewer asks the customer for the payment method they intend to use; if the answer is "I'll send crypto," deny.

SOP target: ≤5 minutes per BIN-hit case; the referrer cases will be near-zero volume.

## flags_thrown

- `crypto_debit_bin_hit` — PAN BIN matches a denylisted crypto-debit program. Hard block; minimal exception path.
- `crypto_onramp_referrer` — inbound `Referer`/`Origin` matches a denylisted on-ramp host. Soft flag; may auto-block if the WAF rule is set to deny.

## failure_modes_requiring_review

- **List staleness.** Crypto-card programs launch and shut down regularly. New programs (e.g., a successor to BlockFi Card) launch with BIN ranges not on the list. Mitigation: pair with the m10-stripe-funding idea, which catches `prepaid` regardless of curation freshness.
- **Crypto card not reported as `prepaid`.** Some crypto-debit cards are technically debit cards drawn from a custodial USD balance and may be reported as `debit`, not `prepaid`. The funding-type fallback then doesn't catch them and only the BIN list does.
- **`Referer` suppression.** Modern browsers' Referrer-Policy frequently strips or downgrades the referer; the referrer leg catches near-zero traffic.
- **Sponsor-bank ambiguity.** Pathward, N.A. issues both Coinbase Card BINs and many non-crypto programs; the denylist must be at the BIN-range level, not the bank level.
- **Tokenized wallets.** If a customer adds a Coinbase Card to Apple Pay and pays via Apple Pay token, the underlying funding type still flows through to Stripe — but this needs verification per integration.

## false_positive_qualitative

- **None significant on the BIN leg.** Crypto-debit cards have essentially no legitimate institutional-research use case; the false-positive surface is limited to a researcher who personally happens to use a Coinbase Card for everyday spending and tries to pay with it. Plausibly tens of customers per year on a synthesis provider.
- **Referrer leg false positives** are nearly zero in practice (referrer-driven traffic from on-ramp domains is unusual), but a researcher who lands on the synthesis page from a tab opened next to an on-ramp page would *not* trigger the rule (referer is per-request, not per-tab). The plausible false-positive surface is content scrapers and link aggregators.

## record_left

For each blocked attempt:

- BIN (or `Referer`) string + matched denylist entry
- PSP transaction ID (BIN leg) or WAF log entry (referrer leg)
- Reviewer decision and rationale
- Customer-facing message

The BIN-leg record is the more important audit artifact: a denied `crypto_debit_bin_hit` is concrete evidence the synthesis provider rejected an obscured-funding payment instrument and is responsive to subpoena.

## Sources

- [Coinbase Card — issuer Pathward N.A. (cardholder agreement)](https://assets.ctfassets.net/q5ulk4bp65r7/4oaoTYWDbeZIUyRDO6z5zu/976419bed2dae30a5cffd8cab522bcf4/Coinbase_Card_Terms.pdf)
- [Coinbase Card — MetaBank cardholder agreement (legacy)](https://assets.ctfassets.net/q5ulk4bp65r7/54ITts0fkO2LgB2eR3wpMJ/d6e69a0f058abe262a494db3837862fc/MetaBank_Cardholder_Agreement.pdf)
- [Coinbase Card overview](https://www.coinbase.com/card)
- [Bitget — Crypto Cards by country (Crypto.com, Coinbase, etc. listing)](https://www.bitget.site/academy/crypto-cards-visa)
- [Stripe Radar — rules reference](https://docs.stripe.com/radar/rules/reference)
- [BinDB — prepaid/virtual/gift card identification](https://www.bindb.com/identify-prepaid-cards)
- [MoonPay Ramps — fiat-to-crypto on-ramp product page](https://www.moonpay.com/business/ramps)
