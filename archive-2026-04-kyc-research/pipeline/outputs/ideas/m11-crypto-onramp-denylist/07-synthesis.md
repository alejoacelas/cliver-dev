# m11-crypto-onramp-denylist — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Crypto-debit BIN + on-ramp referrer denylist |
| **measure** | M11 (payment-no-crypto) |
| **attacker_stories_addressed** | crypto-funding, crypto-debit-card. No in-corpus branch routes cryptocurrency to the synthesis provider as a payment method; this is a forward-looking defense-in-depth check. Crypto appears only as an attacker-internal instrument (buying infostealer logs, stolen credentials, lookalike domains) on third-party criminal marketplaces — entirely outside the synthesis provider's payment surface. |
| **summary** | Maintain a denylist of BIN ranges issued by known crypto-debit-card programs (Coinbase Card/Pathward, Crypto.com Visa, BlockFi, Wirex, Binance Card) and a list of HTTP Referer/Origin domains belonging to fiat-to-crypto on-ramps (MoonPay, Ramp Network, Transak, Onramper, etc.). Hard-block at the PSP layer on a BIN match; block or flag at the web-app edge on a referrer match. |
| **external_dependencies** | Internal BIN denylist of crypto-debit programs, curated quarterly. Web-app edge layer (Cloudflare WAF, AWS WAF, or application middleware) for referrer inspection. PSP enforcement via Stripe Radar custom rule on `card.bin` (or Adyen Risk equivalent). Curation labor to refresh both lists. Optional: BinDB or Neutrino API for BIN identification during curation. |
| **endpoint_details** | **BIN denylist leg:** Stripe Radar custom rule `Block if :card_bin: in (<list>)`. BIN sourcing via BinDB or Neutrino API with manual filtering to identify crypto-program-specific BIN ranges (sponsor banks like Pathward issue both crypto and non-crypto BINs). Standard PSP API key auth; PSP rate limits. **Referrer-denylist leg:** HTTP Referer/Origin header inspection at CDN/WAF/reverse-proxy layer. No external API. Limitations: Referer is suppressed by `Referrer-Policy: no-referrer`, stripped in some browser transitions, and trivially spoofable — near-zero adversarial value [best guess]. |
| **fields_returned** | **BIN/PSP leg:** `card.bin`, `card.funding`, `card.brand`, `card.issuer`, `card.country`, matched denylist entry. **Referrer leg:** Referer header, Origin header, source IP, user-agent, timestamp, matched denylist entry. |
| **marginal_cost_per_check** | ~$0 incremental runtime cost (PSP rule evaluation and WAF rules are bundled). Setup: ~4-8 hours engineering [best guess] for initial BIN list curation (via BinDB/Neutrino cross-referenced to crypto-card press releases) and referrer list assembly plus rule deployment. Refresh: ~2 hours/quarter to update both lists as programs launch, shut down, or rebrand. |
| **manual_review_handoff** | **`crypto_debit_bin_hit`:** PSP blocks auth; order enters "blocked — crypto card" queue. Reviewer checks program name and customer record. Default: deny with templated message requesting non-crypto payment. Exception path is essentially empty — no recognized institutional use of crypto-debit cards for synthesis purchasing. **`crypto_onramp_referrer`:** WAF blocks or flags. Near-zero volume expected. If triggered, reviewer asks customer about intended payment method; deny if crypto. SOP target: <=5 min/case for BIN hits; referrer cases near-zero. |
| **flags_thrown** | `crypto_debit_bin_hit` — PAN BIN matches denylisted crypto-debit program; hard block with minimal exception path. `crypto_onramp_referrer` — inbound Referer/Origin matches denylisted on-ramp host; soft flag or auto-block. |
| **failure_modes_requiring_review** | (1) List staleness — new crypto-card programs launch with unlisted BIN ranges. (2) Crypto cards reported as `debit` rather than `prepaid` — evade both BIN list (if unlisted) and funding-type fallback. (3) Referrer suppression — Referrer-Policy: no-referrer from privacy-focused on-ramps renders the referrer leg near-useless. (4) Sponsor-bank ambiguity — Pathward issues both crypto and non-crypto BINs; denylist must be at BIN-range level, not bank level. (5) Tokenized wallets — crypto card added to Apple Pay; underlying funding type flows through to Stripe but needs per-integration verification. |
| **false_positive_qualitative** | (1) Researcher who personally uses a Coinbase Card for everyday spending — BIN denylist hard-blocks; plausibly tens of customers per year; no institutional exception path. (2) Referrer false positives — near-zero; content scrapers or link aggregators with denylisted referrer origin could trigger WAF rule but would not affect real checkout flows. |
| **coverage_gaps** | (1) New or unlisted crypto-debit card programs — [best guess: 15-30% of crypto-card BIN ranges uncovered at any given time between quarterly refreshes]; no-signal on unlisted BINs. (2) Crypto-debit cards reported as `debit` not `prepaid` — [best guess: 2-4 of ~10 major programs]; evade both BIN list and funding-type fallback if unlisted. (3) Referrer-header suppression — [best guess: <5% of on-ramp traffic caught]; architecturally weak. (4) Non-card crypto funding paths (stablecoins, direct wallet transfer, bank-wire from on-ramp) — out of scope by design; covered by sibling ideas m11-psp-config-audit and m11-msa-prohibition. |
| **record_left** | BIN or Referer string plus matched denylist entry, PSP transaction ID (BIN leg) or WAF log entry (referrer leg), reviewer decision and rationale, customer-facing message sent. BIN-leg record is the primary audit artifact — denied crypto_debit_bin_hit is concrete evidence of rejected obscured-funding instrument, responsive to subpoena. |
| **bypass_methods_known** | None. No in-corpus attacker stories stress this check. |
| **bypass_methods_uncovered** | None. No in-corpus attacker stories stress this check. |

## Section 2: Narrative

### What this check is and how it works

This check has two legs. The primary leg maintains a curated denylist of 6-digit BIN (Bank Identification Number) ranges belonging to known crypto-debit-card programs — Coinbase Card (issued by Pathward, N.A.), Crypto.com Visa, Wirex, Binance Card, and similar products. When a customer's card BIN matches an entry on this list, the PSP (Stripe or Adyen) hard-blocks the authorization via a custom Radar rule. The secondary leg inspects HTTP Referer and Origin headers on inbound requests to the checkout page, blocking or flagging traffic arriving from known fiat-to-crypto on-ramp domains (MoonPay, Ramp Network, Transak, Onramper, etc.) via a WAF or edge-layer rule. Both legs require no external API calls at runtime — the BIN list is loaded into the PSP rule and the referrer list into the WAF configuration.

### What it catches

The check addresses the crypto-funding and crypto-debit-card attacker stories, though no in-corpus branch actually routes cryptocurrency to a synthesis provider as a payment method. This is a forward-looking defense-in-depth control. The BIN denylist catches any crypto-debit card whose BIN range has been identified and curated. Most crypto-debit cards also report as `prepaid` to the card network, so this check is complementary to m10-stripe-funding (which blocks on `prepaid` funding type regardless of BIN). Together, the two checks form a layered defense: the BIN list catches crypto cards by identity, while the funding-type check catches them by characteristic.

### What it misses

The primary detection gap is the combination of list staleness and funding-type mis-classification. At any given time between quarterly list refreshes, an estimated 15-30% of active crypto-card BIN ranges may not be on the denylist (new programs, regional cards, rebranded sponsors). If one of those unlisted programs also reports to the card network as `debit` rather than `prepaid` — which some crypto-debit products backed by custodial fiat balances do — the card evades both the BIN denylist and the m10-stripe-funding fallback. The referrer leg is architecturally weak: modern browser referrer policies, privacy-focused on-ramp configurations, and the rarity of direct on-ramp-to-synthesis navigation mean it catches less than 5% of on-ramp-originated traffic. Non-card crypto funding paths (stablecoins, direct wallet transfers, bank wires from on-ramps) are out of scope and addressed by sibling ideas m11-psp-config-audit and m11-msa-prohibition.

### What it costs

Runtime cost is effectively zero — PSP rule evaluation and WAF custom rules are bundled into existing subscriptions. Setup requires approximately 4-8 hours of engineering time to assemble the initial BIN list (manual curation against BinDB or Neutrino output, cross-referenced to crypto-card press releases and program announcements) and deploy both the PSP and WAF rules. Ongoing maintenance is approximately 2 hours per quarter to refresh the lists as crypto-card programs launch, shut down, or change BIN sponsors. If the provider already subscribes to BinDB for the m10 idea, no additional data cost is needed.

### Operational realism

When the BIN denylist fires, the PSP rejects the authorization and the order enters a "blocked — crypto card" queue. The reviewer pulls the matched program name and customer record, and in virtually all cases denies with a templated message requesting a non-crypto payment method. The exception path is empty — there is no recognized institutional use case for crypto-debit cards in synthesis purchasing. Referrer-leg hits are expected to be near-zero volume; if one does fire, the reviewer asks the customer about their intended payment method. The audit trail for BIN hits includes the BIN, matched denylist entry, PSP transaction ID, and reviewer decision — concrete evidence of rejected obscured-funding instruments, retained in PSP records for 7+ years and responsive to subpoena.

### Open questions

Two minor missing citations were flagged by the claim check: the BlockFi card-program shutdown (2023) and the claim that Marqeta powers Coinbase Card. Both facts are correct but lack sourced URLs. The Stripe `:card_bin:` Radar attribute was cross-verified via the m10-stripe-funding research but should be confirmed directly on Stripe's supported-attributes page. The referrer leg's near-zero adversarial value is acknowledged in the implementation itself and is not contested, but no quantitative study of Referer presence rates on modern web traffic was found to support the estimate.

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 found no findings of any severity — no in-corpus attacker stories stress this check.
- **[unknown -- searched for] fields affecting policy implications:**
  - Number of active crypto-debit card BIN ranges (drives the list-coverage estimate for Gap 1; searched without result)
  - Which specific crypto-debit programs report as `debit` vs `prepaid` to card networks (drives Gap 2 severity; searched without result)
- **No [vendor-gated] fields.**
- **Minor missing citations flagged by claim check (04C):**
  - BlockFi card-program shutdown in 2023 — no URL cited (correct fact, needs source)
  - Marqeta as Coinbase Card processor — no URL cited (background claim, needs source)
- **Wide estimate range (06F):** Gap 1 evasion estimate (15-30% of crypto-card BIN ranges uncovered) is a [best guess] without strong backing; the reasoning is sound but the range is wide.
- **Architectural weakness of referrer leg:** The implementation itself acknowledges the referrer-denylist leg has "near-zero adversarial value." This is not a finding but should be clearly communicated to policymakers so the referrer leg is not counted as meaningful coverage in policy calculations.
